# api/tests/test_analysis_engine.py

from django.test import TestCase
from api.services.analysis_engine import (
    clean_score,
    get_major_rank,
    get_next_major_rank,
    calculate_increments,
    get_promotion_projection,
    analyze_faculty_performance,
    RANK_HIERARCHY,
    NBC_461_WEIGHTS,
)


class CleanScoreTest(TestCase):
    """Tests for the clean_score utility."""

    def test_valid_number(self):
        """Converts string '85.5' to float."""
        self.assertEqual(clean_score('85.5'), 85.5)

    def test_comma_formatted(self):
        """Converts '1,234.5' to 1234.5."""
        self.assertEqual(clean_score('1,234.5'), 1234.5)

    def test_empty_string(self):
        """Empty string returns 0.0."""
        self.assertEqual(clean_score(''), 0.0)

    def test_none_value(self):
        """None returns 0.0."""
        self.assertEqual(clean_score(None), 0.0)

    def test_non_numeric(self):
        """Non-numeric string returns 0.0."""
        self.assertEqual(clean_score('N/A'), 0.0)

    def test_whitespace(self):
        """String with whitespace is trimmed."""
        self.assertEqual(clean_score('  42  '), 42.0)


class GetMajorRankTest(TestCase):
    """Tests for get_major_rank."""

    def test_instructor_i(self):
        """'Instructor I' maps to 'Instructor'."""
        self.assertEqual(get_major_rank('Instructor I'), 'Instructor')

    def test_assistant_professor_iii(self):
        """'Assistant Professor III' maps to 'Assistant Professor'."""
        self.assertEqual(get_major_rank('Assistant Professor III'), 'Assistant Professor')

    def test_professor_vi(self):
        """'Professor VI' maps to 'Professor'."""
        self.assertEqual(get_major_rank('Professor VI'), 'Professor')

    def test_college_university(self):
        """'College/University Professor' maps correctly."""
        self.assertEqual(get_major_rank('College/University Professor'), 'College/University Professor')

    def test_none_defaults_to_instructor(self):
        """None input defaults to 'Instructor'."""
        self.assertEqual(get_major_rank(None), 'Instructor')

    def test_unknown_defaults_to_instructor(self):
        """Unknown rank defaults to 'Instructor'."""
        self.assertEqual(get_major_rank('Unknown Rank'), 'Instructor')


class GetNextMajorRankTest(TestCase):
    """Tests for get_next_major_rank."""

    def test_instructor_to_assistant(self):
        """Next major rank after Instructor is Assistant Professor."""
        self.assertEqual(get_next_major_rank('Instructor'), 'Assistant Professor')

    def test_professor_stays(self):
        """College/University Professor has no next (stays the same)."""
        self.assertEqual(get_next_major_rank('College/University Professor'), 'College/University Professor')


class CalculateIncrementsTest(TestCase):
    """Tests for calculate_increments (Table 3.1 score brackets)."""

    def test_score_below_41(self):
        """Score < 41 → 0 increments."""
        self.assertEqual(calculate_increments(40), 0)

    def test_score_41(self):
        """Score 41 → 1 increment."""
        self.assertEqual(calculate_increments(41), 1)

    def test_score_51(self):
        """Score 51 → 2 increments."""
        self.assertEqual(calculate_increments(51), 2)

    def test_score_61(self):
        """Score 61 → 3 increments."""
        self.assertEqual(calculate_increments(61), 3)

    def test_score_71(self):
        """Score 71 → 4 increments."""
        self.assertEqual(calculate_increments(71), 4)

    def test_score_81(self):
        """Score 81 → 5 increments."""
        self.assertEqual(calculate_increments(81), 5)

    def test_score_91(self):
        """Score 91 → 6 increments."""
        self.assertEqual(calculate_increments(91), 6)

    def test_exact_boundary_50(self):
        """Score exactly 50 → 1 increment (in 41-50 bracket)."""
        self.assertEqual(calculate_increments(50), 1)


class PromotionProjectionTest(TestCase):
    """Tests for get_promotion_projection."""

    def test_no_movement(self):
        """Score < 41 results in 0 increments."""
        result = get_promotion_projection('Instructor I', 30.0, {
            'KRA I': 30, 'KRA II': 5, 'KRA III': 10, 'KRA IV': 5
        })
        self.assertEqual(result['increments'], 0)
        self.assertEqual(result['current_rank'], 'Instructor I')
        self.assertEqual(result['projected_rank'], 'Instructor I')
        self.assertIn('No Movement', result['status_message'])

    def test_normal_increment(self):
        """Score 51 with Instructor I → Instructor III (+2)."""
        result = get_promotion_projection('Instructor I', 51.0, {
            'KRA I': 60, 'KRA II': 20, 'KRA III': 30, 'KRA IV': 20
        })
        self.assertEqual(result['increments'], 2)
        self.assertEqual(result['projected_rank'], 'Instructor III')

    def test_points_to_next_bracket(self):
        """Points to next bracket is computed correctly."""
        result = get_promotion_projection('Instructor I', 45.0, {
            'KRA I': 50, 'KRA II': 10, 'KRA III': 15, 'KRA IV': 10
        })
        self.assertEqual(result['points_to_next_bracket'], 6.0)  # 51 - 45

    def test_invalid_rank_defaults(self):
        """Unknown rank defaults to first in hierarchy."""
        result = get_promotion_projection('Unknown Rank', 50.0, {
            'KRA I': 50, 'KRA II': 10, 'KRA III': 15, 'KRA IV': 10
        })
        self.assertEqual(result['current_rank'], RANK_HIERARCHY[0])


class AnalyzeFacultyPerformanceTest(TestCase):
    """Tests for analyze_faculty_performance input validation."""

    def test_invalid_url(self):
        """Non-Google URL returns error."""
        result = analyze_faculty_performance('https://example.com/sheet', 'Instructor I')
        self.assertEqual(result, {'error': 'Invalid URL'})

    def test_empty_url(self):
        """Empty URL returns error."""
        result = analyze_faculty_performance('', 'Instructor I')
        self.assertEqual(result, {'error': 'Invalid URL'})

    def test_none_url(self):
        """None URL returns error."""
        result = analyze_faculty_performance(None, 'Instructor I')
        self.assertEqual(result, {'error': 'Invalid URL'})

    def test_malformed_url(self):
        """URL without /d/ segment returns parse error."""
        result = analyze_faculty_performance('https://docs.google.com/spreadsheets/noid', 'Instructor I')
        self.assertEqual(result, {'error': 'Could not parse Spreadsheet ID'})


class RankHierarchyTest(TestCase):
    """Tests for the RANK_HIERARCHY data structure."""

    def test_hierarchy_length(self):
        """19 ranks in the hierarchy."""
        self.assertEqual(len(RANK_HIERARCHY), 19)

    def test_hierarchy_starts_with_instructor(self):
        """First rank is 'Instructor I'."""
        self.assertEqual(RANK_HIERARCHY[0], 'Instructor I')

    def test_hierarchy_ends_with_university_professor(self):
        """Last rank is 'College/University Professor'."""
        self.assertEqual(RANK_HIERARCHY[-1], 'College/University Professor')


class NBCWeightsTest(TestCase):
    """Tests for NBC_461_WEIGHTS structure."""

    def test_all_weight_groups_sum_to_one(self):
        """Each rank's KRA weights sum to 1.0."""
        for rank, weights in NBC_461_WEIGHTS.items():
            total = sum(weights.values())
            self.assertAlmostEqual(total, 1.0, places=2, msg=f"{rank} weights sum to {total}")

    def test_five_rank_categories(self):
        """5 major rank categories in weights table."""
        self.assertEqual(len(NBC_461_WEIGHTS), 5)
