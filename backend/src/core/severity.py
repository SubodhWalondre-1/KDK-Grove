"""Shared severity and health-score module (§12.1).

Load-bearing for F2, F5, F6, F8 — all import from here.
Pure functions only, no DB access.
"""

from src.core.constants import (
    DEVIATION_BORDERLINE_THRESHOLD,
    DEVIATION_MODERATE_THRESHOLD,
    HEALTH_SCORE_EXCELLENT_MIN,
    HEALTH_SCORE_FAIR_MIN,
    HEALTH_SCORE_GOOD_MIN,
    SEVERITY_PENALTY_BORDERLINE,
    SEVERITY_PENALTY_MODERATE,
    SEVERITY_PENALTY_SEVERE,
    STATUS_GREEN,
    STATUS_RED,
    STATUS_YELLOW,
)


def _normalize_bounds(
    ref_low: float | None, ref_high: float | None
) -> tuple[float | None, float | None]:
    """Normalize reference bounds if ref_low equals ref_high (indicating an upper bound threshold like < 200)."""
    if ref_low is not None and ref_high is not None and ref_low == ref_high:
        return 0.0, ref_high
    return ref_low, ref_high


def calculate_deviation_severity(
    value: float, ref_low: float | None, ref_high: float | None
) -> float | None:
    """Return a penalty score (0.0–1.0) for how far a value deviates from its reference range.

    Returns None if either ref_low or ref_high is None.
    """
    ref_low, ref_high = _normalize_bounds(ref_low, ref_high)

    if ref_low is None or ref_high is None:
        return None

    if ref_low <= value <= ref_high:
        ref_range = ref_high - ref_low
        if ref_range > 0:
            dist_to_low = (value - ref_low) / ref_range
            dist_to_high = (ref_high - value) / ref_range
            min_margin = min(dist_to_low, dist_to_high)
            if min_margin < 0.05:
                return 0.04
            elif min_margin < 0.10:
                return 0.02
        return 0.0

    ref_range = ref_high - ref_low
    if ref_range <= 0:
        return SEVERITY_PENALTY_SEVERE

    if value < ref_low:
        deviation = (ref_low - value) / ref_range
    else:
        deviation = (value - ref_high) / ref_range

    if deviation <= DEVIATION_BORDERLINE_THRESHOLD:
        return SEVERITY_PENALTY_BORDERLINE
    elif deviation <= DEVIATION_MODERATE_THRESHOLD:
        return SEVERITY_PENALTY_MODERATE
    else:
        return SEVERITY_PENALTY_SEVERE


def calculate_health_score(test_values: list) -> float | None:
    """Compute a 0–100 health score from a list of test-value objects/dicts."""
    penalties = []

    for tv in test_values:
        value = tv.value if hasattr(tv, "value") else tv.get("value")
        ref_low = tv.ref_low if hasattr(tv, "ref_low") else tv.get("ref_low")
        ref_high = tv.ref_high if hasattr(tv, "ref_high") else tv.get("ref_high")
        status = tv.status if hasattr(tv, "status") else tv.get("status")

        if value is None:
            continue

        severity = calculate_deviation_severity(value, ref_low, ref_high)
        if severity is None and status:
            s = str(status).lower()
            if s in ("green", "normal", "optimal"):
                severity = 0.0
            elif s in ("yellow", "borderline", "moderate"):
                severity = SEVERITY_PENALTY_BORDERLINE
            elif s in ("red", "abnormal", "critical", "severe", "high", "low"):
                severity = SEVERITY_PENALTY_SEVERE

        if severity is not None:
            penalties.append(severity)

    if not penalties:
        return None

    max_possible_penalty = len(penalties) * SEVERITY_PENALTY_SEVERE
    total_penalty = sum(penalties)

    score = max(0.0, (1.0 - total_penalty / max_possible_penalty) * 100)
    return round(score, 1)


def get_status_color(
    value: float, ref_low: float | None, ref_high: float | None
) -> str | None:
    """Return green/yellow/red status string, or None if reference data is missing."""
    ref_low, ref_high = _normalize_bounds(ref_low, ref_high)

    if ref_low is None or ref_high is None:
        return None

    if ref_low <= value <= ref_high:
        return STATUS_GREEN

    ref_range = ref_high - ref_low
    if ref_range <= 0:
        return STATUS_RED

    if value < ref_low:
        deviation = (ref_low - value) / ref_range
    else:
        deviation = (value - ref_high) / ref_range

    if deviation <= DEVIATION_BORDERLINE_THRESHOLD:
        return STATUS_YELLOW
    else:
        return STATUS_RED


def get_severity_bucket(
    value: float, ref_low: float | None, ref_high: float | None
) -> str | None:
    """Return a severity bucket string like 'high_mild' or 'low_severe', or None if no ref data."""
    ref_low, ref_high = _normalize_bounds(ref_low, ref_high)

    if ref_low is None or ref_high is None:
        return None

    if ref_low <= value <= ref_high:
        return None

    ref_range = ref_high - ref_low
    if ref_range <= 0:
        direction = "high" if value > ref_high else "low"
        return f"{direction}_severe"

    if value < ref_low:
        direction = "low"
        deviation = (ref_low - value) / ref_range
    else:
        direction = "high"
        deviation = (value - ref_high) / ref_range

    if deviation <= DEVIATION_BORDERLINE_THRESHOLD:
        label = "mild"
    elif deviation <= DEVIATION_MODERATE_THRESHOLD:
        label = "moderate"
    else:
        label = "severe"

    return f"{direction}_{label}"


def get_health_score_label(score: float | None) -> str:
    """Return a human-readable health-score label for the dashboard UI."""
    if score is None:
        return "No Data"
    if score >= HEALTH_SCORE_EXCELLENT_MIN:
        return "Excellent"
    if score >= HEALTH_SCORE_GOOD_MIN:
        return "Good"
    if score >= HEALTH_SCORE_FAIR_MIN:
        return "Fair"
    return "Needs Attention"
