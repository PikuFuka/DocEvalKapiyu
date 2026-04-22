# api/tests/test_feedback_learning.py

from django.test import TestCase, override_settings
from api.models import User, DocumentUpload, ClassificationFeedback
from api.services.feedback_learning_service import (
    record_classification_feedback,
    apply_learned_feedback,
    build_content_hash,
    _clean_label,
    _normalize_payload,
)


TEST_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


@override_settings(DATABASES=TEST_DATABASES)
class RecordClassificationFeedbackTest(TestCase):
    """Tests for record_classification_feedback."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='fb@test.edu', email='fb@test.edu', password='pass',
        )
        self.upload = DocumentUpload.objects.create(
            user=self.user,
            google_drive_link='https://drive.google.com/file/d/fb/view',
            content_hash='abc123hash',
        )

    def test_record_feedback_correct(self):
        """was_correct=True when predicted matches corrected."""
        predicted = {'primary_kra': 'KRA I', 'criteria': 'A', 'sub_criteria': 'Teaching'}
        corrected = {'primary_kra': 'KRA I', 'criteria': 'A', 'sub_criteria': 'Teaching'}
        fb = record_classification_feedback(self.upload, predicted, corrected)
        self.assertTrue(fb.was_correct)

    def test_record_feedback_corrected(self):
        """was_correct=False when predicted differs from corrected."""
        predicted = {'primary_kra': 'KRA I', 'criteria': 'A', 'sub_criteria': 'Teaching'}
        corrected = {'primary_kra': 'KRA II', 'criteria': 'B', 'sub_criteria': 'Research'}
        fb = record_classification_feedback(self.upload, predicted, corrected)
        self.assertFalse(fb.was_correct)

    def test_record_feedback_upsert(self):
        """Second call updates existing feedback, does not create a duplicate."""
        predicted = {'primary_kra': 'KRA I', 'criteria': 'A', 'sub_criteria': 'X'}
        corrected1 = {'primary_kra': 'KRA I', 'criteria': 'A', 'sub_criteria': 'Y'}
        corrected2 = {'primary_kra': 'KRA I', 'criteria': 'A', 'sub_criteria': 'Z'}

        record_classification_feedback(self.upload, predicted, corrected1)
        record_classification_feedback(self.upload, predicted, corrected2)

        self.assertEqual(ClassificationFeedback.objects.filter(upload=self.upload).count(), 1)
        fb = ClassificationFeedback.objects.get(upload=self.upload)
        self.assertEqual(fb.corrected_sub_criteria, 'Z')

    def test_feedback_stores_content_hash(self):
        """Feedback inherits upload's content_hash."""
        predicted = {'primary_kra': 'KRA I', 'criteria': 'A', 'sub_criteria': 'T'}
        fb = record_classification_feedback(self.upload, predicted, predicted)
        self.assertEqual(fb.content_hash, 'abc123hash')


class NormalizePayloadTest(TestCase):
    """Tests for _normalize_payload and _clean_label helpers."""

    def test_normalize_criteria_uppercase(self):
        """Criteria value is uppercased."""
        result = _normalize_payload({'primary_kra': 'KRA I', 'criteria': 'a', 'sub_criteria': 'x'})
        self.assertEqual(result['criteria'], 'A')

    def test_normalize_none_payload(self):
        """None payload returns empty strings."""
        result = _normalize_payload(None)
        self.assertEqual(result['primary_kra'], '')
        self.assertEqual(result['criteria'], '')

    def test_clean_label_strips_whitespace(self):
        """_clean_label strips surrounding whitespace."""
        self.assertEqual(_clean_label('  hello  '), 'hello')

    def test_clean_label_none(self):
        """_clean_label handles None gracefully."""
        self.assertEqual(_clean_label(None), '')


class BuildContentHashTest(TestCase):
    """Tests for build_content_hash."""

    def test_consistent_hash(self):
        """Same input produces same hash."""
        h1 = build_content_hash('Hello World')
        h2 = build_content_hash('Hello World')
        self.assertEqual(h1, h2)

    def test_case_insensitive(self):
        """Hash is case-insensitive and normalizes whitespace."""
        h1 = build_content_hash('Hello  World')
        h2 = build_content_hash('hello world')
        self.assertEqual(h1, h2)

    def test_empty_returns_none(self):
        """Empty/None input returns None."""
        self.assertIsNone(build_content_hash(''))
        self.assertIsNone(build_content_hash(None))


@override_settings(DATABASES=TEST_DATABASES)
class ApplyLearnedFeedbackTest(TestCase):
    """Tests for apply_learned_feedback."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='learn@test.edu', email='learn@test.edu', password='pass',
        )
        self.upload = DocumentUpload.objects.create(
            user=self.user,
            google_drive_link='https://drive.google.com/file/d/learn/view',
            content_hash='testhash',
        )

    def test_apply_learned_feedback_found(self):
        """Returns corrected values when a matching feedback exists."""
        ClassificationFeedback.objects.create(
            upload=self.upload,
            user=self.user,
            content_hash='testhash',
            predicted_primary_kra='KRA I',
            predicted_criteria='A',
            predicted_sub_criteria='Teaching',
            corrected_primary_kra='KRA II',
            corrected_criteria='B',
            corrected_sub_criteria='Research',
            was_correct=False,
        )
        original = {'primary_kra': 'KRA I', 'criterion': 'A', 'sub_criterion': 'Teaching'}
        merged, feedback = apply_learned_feedback('testhash', original)
        self.assertEqual(merged['primary_kra'], 'KRA II')
        self.assertEqual(merged['criterion'], 'B')
        self.assertIsNotNone(feedback)

    def test_apply_learned_feedback_not_found(self):
        """Returns original classification when no feedback exists."""
        original = {'primary_kra': 'KRA I', 'criterion': 'A', 'sub_criterion': 'T'}
        merged, feedback = apply_learned_feedback('nohash', original)
        self.assertEqual(merged['primary_kra'], 'KRA I')
        self.assertIsNone(feedback)

    def test_apply_learned_feedback_none_hash(self):
        """None content_hash returns original."""
        original = {'primary_kra': 'X'}
        merged, feedback = apply_learned_feedback(None, original)
        self.assertEqual(merged, original)
        self.assertIsNone(feedback)
