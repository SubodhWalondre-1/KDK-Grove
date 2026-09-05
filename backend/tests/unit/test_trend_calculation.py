from collections import namedtuple
import pytest

from src.core.constants import (
    TREND_DIRECTION_DECREASING,
    TREND_DIRECTION_INCREASING,
    TREND_DIRECTION_INSUFFICIENT_DATA,
    TREND_DIRECTION_REFERENCE_UNAVAILABLE,
    TREND_DIRECTION_STABLE,
)
from src.features.trend_tracking.service import (
    calculate_health_score_trend,
    calculate_trend,
)

Point = namedtuple("Point", ["value", "ref_low", "ref_high"])


def test_insufficient_data_below_minimum():
    pts = [Point(10.0, 5.0, 15.0)]
    res = calculate_trend(pts)
    assert res["direction"] == TREND_DIRECTION_INSUFFICIENT_DATA
    assert res["slope"] is None
    assert res["normalized_slope"] is None


def test_stable_trend():
    # Value changes slightly (10.0 -> 10.1) across wide ref range (0 to 100, span 100)
    # raw slope = 0.1, normalized slope = 0.1 / 100 = 0.001 < 0.05 (TREND_STABLE_THRESHOLD)
    pts = [Point(10.0, 0.0, 100.0), Point(10.1, 0.0, 100.0)]
    res = calculate_trend(pts)
    assert res["direction"] == TREND_DIRECTION_STABLE
    assert res["normalized_slope"] is not None


def test_increasing_trend_normalized_by_ref_width():
    """Identical raw slope (+2.0 per step) produces DIFFERENT direction when ref_width differs."""
    # Scenario A: Wide ref range (10 to 110, span 100).
    # Raw slope = +2.0, normalized = 2.0 / 100 = 0.02 < 0.05 -> STABLE
    pts_wide = [Point(10.0, 10.0, 110.0), Point(12.0, 10.0, 110.0)]
    res_wide = calculate_trend(pts_wide)
    assert res_wide["direction"] == TREND_DIRECTION_STABLE

    # Scenario B: Narrow ref range (10 to 20, span 10).
    # Raw slope = +2.0, normalized = 2.0 / 10 = 0.20 >= 0.05 -> INCREASING
    pts_narrow = [Point(10.0, 10.0, 20.0), Point(12.0, 10.0, 20.0)]
    res_narrow = calculate_trend(pts_narrow)
    assert res_narrow["direction"] == TREND_DIRECTION_INCREASING


def test_decreasing_trend():
    # Value decreases (20.0 -> 10.0) across span 10.
    # Raw slope = -10.0, normalized = -10.0 / 10 = -1.0 < -0.05 -> DECREASING
    pts = [Point(20.0, 10.0, 20.0), Point(10.0, 10.0, 20.0)]
    res = calculate_trend(pts)
    assert res["direction"] == TREND_DIRECTION_DECREASING
    assert res["normalized_slope"] < 0


def test_missing_reference_on_latest_point_returns_reference_unavailable():
    pts = [Point(10.0, 5.0, 15.0), Point(12.0, None, None)]
    res = calculate_trend(pts)
    assert res["direction"] == TREND_DIRECTION_REFERENCE_UNAVAILABLE
    assert res["slope"] is not None
    assert res["normalized_slope"] is None


def test_zero_width_reference_returns_reference_unavailable():
    pts = [Point(10.0, 5.0, 15.0), Point(12.0, 10.0, 10.0)]
    res = calculate_trend(pts)
    assert res["direction"] == TREND_DIRECTION_REFERENCE_UNAVAILABLE
    assert res["slope"] is not None
    assert res["normalized_slope"] is None


def test_health_score_trend_stable():
    # Small fluctuation (80.0 -> 80.5) < 1.0 threshold -> STABLE
    scores = [80.0, 80.5]
    res = calculate_health_score_trend(scores)
    assert res["direction"] == TREND_DIRECTION_STABLE


def test_health_score_trend_filters_none_scores():
    # None scores should be filtered out before regression
    scores = [70.0, None, 90.0]
    res = calculate_health_score_trend(scores)
    assert res["direction"] == TREND_DIRECTION_INCREASING
    assert res["slope"] == pytest.approx(20.0)


def test_health_score_trend_insufficient_after_filtering():
    # Only 1 valid score remains after filtering -> INSUFFICIENT_DATA
    scores = [None, 85.0, None]
    res = calculate_health_score_trend(scores)
    assert res["direction"] == TREND_DIRECTION_INSUFFICIENT_DATA
    assert res["slope"] is None
