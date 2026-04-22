import os
import threading
import torch
import torch.nn as nn
import joblib
from transformers import BertTokenizer, BertModel
from django.conf import settings


# Classification uses chunked transformer inference so long documents
# are not reduced to only the first 512 tokens.
MAX_MODEL_TOKENS = 512
DEFAULT_STRIDE = 128
INFERENCE_BATCH_SIZE = 8

class TripleBERTClassifier(nn.Module):
    def __init__(self, kra_classes, crit_classes, sub_classes):
        super(TripleBERTClassifier, self).__init__()
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        self.kra_classifier = nn.Linear(self.bert.config.hidden_size, kra_classes)
        self.crit_classifier = nn.Linear(self.bert.config.hidden_size, crit_classes)
        self.sub_classifier = nn.Linear(self.bert.config.hidden_size, sub_classes)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        if pooled_output is None:
            pooled_output = outputs.last_hidden_state[:, 0]
        kra_logits = self.kra_classifier(pooled_output)
        crit_logits = self.crit_classifier(pooled_output)
        sub_logits = self.sub_classifier(pooled_output)
        return kra_logits, crit_logits, sub_logits


def _normalize_text(text):
    if text is None:
        return ""
    return " ".join(str(text).split())


def _effective_max_length(tokenizer):
    configured = getattr(tokenizer, "model_max_length", MAX_MODEL_TOKENS)
    if configured is None or configured <= 0 or configured > MAX_MODEL_TOKENS:
        return MAX_MODEL_TOKENS
    return int(configured)


def _extract_state_dict(checkpoint):
    if isinstance(checkpoint, dict):
        if "state_dict" in checkpoint and isinstance(checkpoint["state_dict"], dict):
            return checkpoint["state_dict"]
        if "model_state_dict" in checkpoint and isinstance(checkpoint["model_state_dict"], dict):
            return checkpoint["model_state_dict"]
    return checkpoint


def _clean_state_dict_keys(state_dict):
    if not isinstance(state_dict, dict):
        return state_dict
    # Support checkpoints saved with DataParallel.
    return {
        (k[7:] if k.startswith("module.") else k): v
        for k, v in state_dict.items()
    }


def _encode_with_overflow(tokenizer, text, max_length, stride):
    encoded = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=max_length,
        stride=stride,
        return_overflowing_tokens=True,
    )
    input_ids = encoded["input_ids"]
    attention_mask = encoded["attention_mask"]
    # Use effective token count as chunk weight during aggregation.
    weights = attention_mask.sum(dim=1).float().unsqueeze(1)
    return input_ids, attention_mask, weights


def _run_chunked_inference(model, device, input_ids, attention_mask, weights):
    kra_chunks = []
    crit_chunks = []
    sub_chunks = []

    for start in range(0, input_ids.size(0), INFERENCE_BATCH_SIZE):
        end = start + INFERENCE_BATCH_SIZE
        batch_ids = input_ids[start:end].to(device)
        batch_mask = attention_mask[start:end].to(device)
        kra_logits, crit_logits, sub_logits = model(batch_ids, batch_mask)

        kra_chunks.append(kra_logits.detach().cpu())
        crit_chunks.append(crit_logits.detach().cpu())
        sub_chunks.append(sub_logits.detach().cpu())

    kra_all = torch.cat(kra_chunks, dim=0)
    crit_all = torch.cat(crit_chunks, dim=0)
    sub_all = torch.cat(sub_chunks, dim=0)

    safe_weights = weights.clamp(min=1.0)
    normalized = safe_weights / safe_weights.sum()

    kra_logits = (kra_all * normalized).sum(dim=0, keepdim=True)
    crit_logits = (crit_all * normalized).sum(dim=0, keepdim=True)
    sub_logits = (sub_all * normalized).sum(dim=0, keepdim=True)

    return kra_logits, crit_logits, sub_logits


def load_model_and_encoders():
    try:
        model_path = os.path.join(settings.BASE_DIR, 'api', 'ml_models', 'bert_hierarchical_model.pt')
        kra_encoder_path = os.path.join(settings.BASE_DIR, 'api', 'ml_models', 'kra_encoder.pkl')
        crit_encoder_path = os.path.join(settings.BASE_DIR, 'api', 'ml_models', 'crit_encoder.pkl')
        sub_encoder_path = os.path.join(settings.BASE_DIR, 'api', 'ml_models', 'sub_encoder.pkl')
        tokenizer_path = os.path.join(settings.BASE_DIR, 'api', 'ml_models', 'saved_tokenizer')

        if not all(os.path.exists(p) for p in [model_path, kra_encoder_path, crit_encoder_path, sub_encoder_path, tokenizer_path]):
            raise FileNotFoundError("One or more model/encoder/tokenizer files are missing.")

        kra_encoder = joblib.load(kra_encoder_path)
        crit_encoder = joblib.load(crit_encoder_path)
        sub_encoder = joblib.load(sub_encoder_path)
        tokenizer = BertTokenizer.from_pretrained(tokenizer_path)

        kra_classes = len(kra_encoder.classes_)
        crit_classes = len(crit_encoder.classes_)
        sub_classes = len(sub_encoder.classes_)

        model = TripleBERTClassifier(kra_classes, crit_classes, sub_classes)

        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        checkpoint = torch.load(model_path, map_location=device)
        state_dict = _extract_state_dict(checkpoint)
        state_dict = _clean_state_dict_keys(state_dict)
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()

        print("Model, encoders, and tokenizer loaded successfully.")
        return model, tokenizer, kra_encoder, crit_encoder, sub_encoder, device

    except Exception as e:
        print(f"Error loading model/encoders/tokenizer: {e}")
        return None, None, None, None, None, None


MODEL, TOKENIZER, KRA_ENCODER, CRIT_ENCODER, SUB_ENCODER, DEVICE = (None, None, None, None, None, None)
_MODEL_LOCK = threading.Lock()


def _get_model_components():
    global MODEL, TOKENIZER, KRA_ENCODER, CRIT_ENCODER, SUB_ENCODER, DEVICE

    if all([MODEL, TOKENIZER, KRA_ENCODER, CRIT_ENCODER, SUB_ENCODER, DEVICE]):
        return MODEL, TOKENIZER, KRA_ENCODER, CRIT_ENCODER, SUB_ENCODER, DEVICE

    with _MODEL_LOCK:
        if not all([MODEL, TOKENIZER, KRA_ENCODER, CRIT_ENCODER, SUB_ENCODER, DEVICE]):
            MODEL, TOKENIZER, KRA_ENCODER, CRIT_ENCODER, SUB_ENCODER, DEVICE = load_model_and_encoders()

    return MODEL, TOKENIZER, KRA_ENCODER, CRIT_ENCODER, SUB_ENCODER, DEVICE


def warmup_ml_model():
    model, tokenizer, kra_encoder, crit_encoder, sub_encoder, device = _get_model_components()
    return all([model, tokenizer, kra_encoder, crit_encoder, sub_encoder, device])


def classify_document(text):
    model, tokenizer, kra_encoder, crit_encoder, sub_encoder, device = _get_model_components()

    if not model or not tokenizer or not kra_encoder or not crit_encoder or not sub_encoder or not device:
        print("Model components not available.")
        return {"primary_kra": "Unknown", "confidence": 0, "criterion": "N/A", "sub_criterion": "N/A"}

    try:
        normalized_text = _normalize_text(text)
        if not normalized_text:
            return {"primary_kra": "Unknown", "confidence": 0, "criterion": "N/A", "sub_criterion": "N/A"}

        max_length = _effective_max_length(tokenizer)
        stride = min(DEFAULT_STRIDE, max(1, max_length // 2))
        input_ids, attention_mask, weights = _encode_with_overflow(
            tokenizer,
            normalized_text,
            max_length=max_length,
            stride=stride,
        )

        with torch.inference_mode():
            kra_logits, crit_logits, sub_logits = _run_chunked_inference(
                model,
                device,
                input_ids,
                attention_mask,
                weights,
            )

            kra_pred_idx = torch.argmax(kra_logits, dim=1).item()
            crit_pred_idx = torch.argmax(crit_logits, dim=1).item()
            sub_pred_idx = torch.argmax(sub_logits, dim=1).item()

            kra_probs = torch.softmax(kra_logits, dim=1)
            crit_probs = torch.softmax(crit_logits, dim=1)
            sub_probs = torch.softmax(sub_logits, dim=1)

            kra_confidence = float(kra_probs[0][kra_pred_idx].item()) * 100
            # Kept for future observability/debugging if needed.
            _ = float(crit_probs[0][crit_pred_idx].item()) * 100
            _ = float(sub_probs[0][sub_pred_idx].item()) * 100

        kra_label = kra_encoder.inverse_transform([kra_pred_idx])[0]
        crit_label = crit_encoder.inverse_transform([crit_pred_idx])[0]
        sub_label = sub_encoder.inverse_transform([sub_pred_idx])[0]

        return {
            'primary_kra': kra_label,
            'confidence': round(kra_confidence, 1),
            'criterion': crit_label,
            'sub_criterion': sub_label,
            'explanation': f"Document classified as '{kra_label}' with {round(kra_confidence, 1)}% confidence."
        }

    except Exception as e:
        print(f"Error during document classification: {e}")
        return {"primary_kra": "Error", "confidence": 0, "criterion": "N/A", "sub_criterion": "N/A"}