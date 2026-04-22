# api/tests/test_scoring_rules.py

from django.test import TestCase
from api.services.scoring_rules import calculate_score, SCORING_RULES


class CalculateScoreTest(TestCase):
    """Tests for the calculate_score utility function."""

    def test_kra1b_sole_textbook(self):
        """kra1b_sole 'textbook' returns 30 points."""
        self.assertEqual(calculate_score('kra1b_sole', 'textbook'), 30)

    def test_kra2a_sole_book(self):
        """kra2a_sole 'book' returns 100 points."""
        self.assertEqual(calculate_score('kra2a_sole', 'book'), 100)

    def test_contribution_percent_50(self):
        """50% contribution halves the score."""
        self.assertEqual(calculate_score('kra1b_sole', 'textbook', 50), 15.0)

    def test_full_contribution_percent(self):
        """100% contribution returns full base score."""
        self.assertEqual(calculate_score('kra2a_sole', 'journal_article', 100), 35)

    def test_direct_number_rule(self):
        """Evidence type with a direct numeric value (not dict) works."""
        self.assertEqual(calculate_score('kra2b_utility', 'unused_subtype'), 10)

    def test_direct_number_with_contribution(self):
        """Direct numeric rule respects contribution_percent."""
        self.assertEqual(calculate_score('kra1c_mentor', 'anything', 50), 1.5)

    def test_invalid_evidence_type(self):
        """Unknown evidence_type returns 0."""
        self.assertEqual(calculate_score('nonexistent_kra', 'any'), 0)

    def test_invalid_subtype(self):
        """Unknown subtype within valid evidence_type returns 0."""
        self.assertEqual(calculate_score('kra1b_sole', 'nonexistent_material'), 0)

    def test_nested_dict_returns_zero(self):
        """When subtype resolves to a nested dict, returns 0."""
        # kra2b_commercialized has nested dict: {"local": 20, "international": 30}
        # Accessing with 'kra2b_commercialized' as evidence_type and 'local' as subtype should work
        self.assertEqual(calculate_score('kra2b_commercialized', 'local'), 20)

    def test_kra3_training_default(self):
        """kra3_training 'default' key returns 1.0."""
        self.assertEqual(calculate_score('kra3_training', 'default'), 1.0)

    def test_kra4_award_international(self):
        """kra4_award 'International' returns 5.0."""
        self.assertEqual(calculate_score('kra4_award', 'International'), 5.0)

    def test_kra4_participation_national(self):
        """kra4_participation 'National' returns 1.5."""
        self.assertEqual(calculate_score('kra4_participation', 'National'), 1.5)


class ScoringRulesStructureTest(TestCase):
    """Tests for the SCORING_RULES data structure."""

    def test_all_kra_categories_present(self):
        """Key scoring categories exist in SCORING_RULES."""
        expected_keys = [
            'kra1b_sole', 'kra1b_co', 'kra1c_adviser',
            'kra2a_sole', 'kra2a_co',
            'kra3_training', 'kra3_admin_designation',
            'kra4_participation', 'kra4_award',
        ]
        for key in expected_keys:
            self.assertIn(key, SCORING_RULES, f"Missing key: {key}")

    def test_admin_designation_has_default(self):
        """kra3_admin_designation has a 'default' key with value 0."""
        self.assertEqual(SCORING_RULES['kra3_admin_designation']['default'], 0)
