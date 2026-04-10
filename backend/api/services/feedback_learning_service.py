import hashlib

from django.db import transaction

from api.models import ClassificationFeedback


def _clean_label(value, *, uppercase=False):
    text = str(value or '').strip()
    return text.upper() if uppercase else text


def _normalize_payload(payload):
    payload = payload or {}
    return {
        'primary_kra': _clean_label(payload.get('primary_kra')),
        'criteria': _clean_label(payload.get('criteria'), uppercase=True),
        'sub_criteria': _clean_label(payload.get('sub_criteria')),
    }


def build_content_hash(text):
    normalized = ' '.join(str(text or '').lower().split())
    if not normalized:
        return None
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


@transaction.atomic
def record_classification_feedback(upload, predicted_payload, corrected_payload, feedback_note=''):
    predicted = _normalize_payload(predicted_payload)
    corrected = _normalize_payload(corrected_payload)

    was_correct = (
        predicted['primary_kra'] == corrected['primary_kra']
        and predicted['criteria'] == corrected['criteria']
        and predicted['sub_criteria'] == corrected['sub_criteria']
    )

    feedback, _ = ClassificationFeedback.objects.update_or_create(
        upload=upload,
        defaults={
            'user': upload.user,
            'content_hash': upload.content_hash,
            'predicted_primary_kra': predicted['primary_kra'],
            'predicted_criteria': predicted['criteria'],
            'predicted_sub_criteria': predicted['sub_criteria'],
            'corrected_primary_kra': corrected['primary_kra'],
            'corrected_criteria': corrected['criteria'],
            'corrected_sub_criteria': corrected['sub_criteria'],
            'was_correct': was_correct,
            'feedback_note': _clean_label(feedback_note),
        },
    )
    return feedback


def apply_learned_feedback(content_hash, classification_result):
    if not content_hash:
        return classification_result, None

    latest_feedback = (
        ClassificationFeedback.objects
        .filter(content_hash=content_hash, was_correct=False)
        .order_by('-created_at')
        .first()
    )

    if not latest_feedback:
        return classification_result, None

    merged = dict(classification_result or {})
    merged['primary_kra'] = latest_feedback.corrected_primary_kra
    merged['criterion'] = latest_feedback.corrected_criteria
    merged['sub_criterion'] = latest_feedback.corrected_sub_criteria
    return merged, latest_feedback
