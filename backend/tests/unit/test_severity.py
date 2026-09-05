"""Unit tests for core/severity.py — pure functions, no DB or FastAPI needed."""

from src.core.constants import (
    SEVERITY_PENALTY_BORDERLINE,
    SEVERITY_PENALTY_MODERATE,
    SEVERITY_PENALTY_SEVERE,
    STATUS_GREEN,
    STATUS_RED,
    STATUS_YELLOW,
)
from src.core.severity import (
    calculate_deviation_severity,
    calculate_health_score,
    get_health_score_label,
    get_severity_bucket,
    get_status_color,
)


# --- calculate_deviation_severity ---

def test_severity_normal_value_returns_zero():
    assert calculate_deviation_severity(15.0, 12.0, 17.5) == 0.0


def test_severity_borderline_high():
    # ref_range = 17.5 - 12.0 = 5.5, value = 18.0, deviation = 0.5/5.5 ≈ 0.09 <= 0.15
    result = calculate_deviation_severity(18.0, 12.0, 17.5)
    assert result == SEVERITY_PENALTY_BORDERLINE


def test_severity_moderate_low():
    # ref_range = 5.5, value = 10.0, deviation = 2.0/5.5 ≈ 0.36, 0.15 < 0.36 <= 0.50
    result = calculate_deviation_severity(10.0, 12.0, 17.5)
    assert result == SEVERITY_PENALTY_MODERATE


def test_severity_severe():
    # ref_range = 5.5, value = 5.0, deviation = 7.0/5.5 ≈ 1.27 > 0.50
    result = calculate_deviation_severity(5.0, 12.0, 17.5)
    assert result == SEVERITY_PENALTY_SEVERE


def test_severity_missing_reference_returns_none():
    assert calculate_deviation_severity(14.5, None, 17.5) is None
    assert calculate_deviation_severity(14.5, 12.0, None) is None
    assert calculate_deviation_severity(14.5, None, None) is None


# --- calculate_health_score ---

def test_health_score_excludes_missing_reference_values():
    test_values = [
        {"value": 14.5, "ref_low": 12.0, "ref_high": 17.5},   # normal → 0.0
        {"value": 95.0, "ref_low": 70.0, "ref_high": 100.0},   # normal → 0.0
        {"value": 5.0, "ref_low": 12.0, "ref_high": 17.5},     # severe → 1.0
        {"value": 50.0, "ref_low": None, "ref_high": None},     # excluded
    ]
    score = calculate_health_score(test_values)
    assert score is not None
    # max_possible = 3 * 1.0, total_penalty = 1.0 → (1 - 1/3) * 100 ≈ 66.7
    assert round(score, 1) == 66.7


def test_health_score_all_normal_is_100():
    test_values = [
        {"value": 14.5, "ref_low": 12.0, "ref_high": 17.5},
        {"value": 85.0, "ref_low": 70.0, "ref_high": 100.0},
    ]
    assert calculate_health_score(test_values) == 100.0


def test_health_score_all_missing_reference_returns_none():
    test_values = [
        {"value": 14.5, "ref_low": None, "ref_high": None},
        {"value": 85.0, "ref_low": None, "ref_high": None},
    ]
    assert calculate_health_score(test_values) is None


# --- get_status_color ---

def test_status_color_mapping():
    # In range → green
    assert get_status_color(14.5, 12.0, 17.5) == STATUS_GREEN
    # Borderline → yellow
    assert get_status_color(18.0, 12.0, 17.5) == STATUS_YELLOW
    # Severe → red
    assert get_status_color(5.0, 12.0, 17.5) == STATUS_RED
    # Missing reference → None
    assert get_status_color(14.5, None, 17.5) is None


# --- get_severity_bucket ---

def test_severity_bucket_format():
    # Borderline high
    bucket = get_severity_bucket(18.0, 12.0, 17.5)
    assert bucket == "high_mild"

    # Moderate low
    bucket = get_severity_bucket(10.0, 12.0, 17.5)
    assert bucket == "low_moderate"

    # Severe high
    bucket = get_severity_bucket(25.0, 12.0, 17.5)
    assert bucket == "high_severe"

    # In range → None
    assert get_severity_bucket(14.5, 12.0, 17.5) is None

    # Missing reference → None
    assert get_severity_bucket(14.5, None, None) is None


# --- get_health_score_label ---

def test_health_score_label_bands():
    assert get_health_score_label(85.0) == "Excellent"
    assert get_health_score_label(65.0) == "Good"
    assert get_health_score_label(45.0) == "Fair"
    assert get_health_score_label(25.0) == "Needs Attention"
    assert get_health_score_label(None) == "No Data"
