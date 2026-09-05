from src.core.constants import (
    SEVERITY_GATE_CRITICAL,
    SEVERITY_GATE_MODERATE,
    SEVERITY_GATE_NORMAL,
)
from src.features.recommendations.service import _determine_severity_gate


def test_gate_critical_on_severe_deviation():
    """Deviation ratio > 0.50 -> SEVERITY_GATE_CRITICAL, is_urgent = True."""
    # Ref range 10-20 (span 10). Value 30 -> deviation (30-20)/10 = 1.0 > 0.50 -> SEVERITY_PENALTY_SEVERE (1.0)
    test_values = [
        {"value": 30.0, "ref_low": 10.0, "ref_high": 20.0},
    ]
    gate, is_urgent = _determine_severity_gate(test_values)
    assert gate == SEVERITY_GATE_CRITICAL
    assert is_urgent is True


def test_gate_moderate_on_moderate_deviation():
    """Max deviation 0.15 < ratio <= 0.50 -> SEVERITY_GATE_MODERATE, is_urgent = False."""
    # Ref range 10-20 (span 10). Value 23 -> deviation (23-20)/10 = 0.30 -> SEVERITY_PENALTY_MODERATE (0.6)
    test_values = [
        {"value": 23.0, "ref_low": 10.0, "ref_high": 20.0},
        {"value": 15.0, "ref_low": 10.0, "ref_high": 20.0},
    ]
    gate, is_urgent = _determine_severity_gate(test_values)
    assert gate == SEVERITY_GATE_MODERATE
    assert is_urgent is False


def test_gate_normal_on_borderline_only():
    """Max deviation <= 0.15 -> SEVERITY_GATE_NORMAL, is_urgent = False."""
    # Ref range 10-20 (span 10). Value 21 -> deviation (21-20)/10 = 0.10 <= 0.15 -> SEVERITY_PENALTY_BORDERLINE (0.3)
    test_values = [
        {"value": 21.0, "ref_low": 10.0, "ref_high": 20.0},
    ]
    gate, is_urgent = _determine_severity_gate(test_values)
    assert gate == SEVERITY_GATE_NORMAL
    assert is_urgent is False


def test_gate_normal_on_all_values_in_range():
    """All severities 0.0 -> SEVERITY_GATE_NORMAL, is_urgent = False."""
    test_values = [
        {"value": 15.0, "ref_low": 10.0, "ref_high": 20.0},
        {"value": 85.0, "ref_low": 70.0, "ref_high": 100.0},
    ]
    gate, is_urgent = _determine_severity_gate(test_values)
    assert gate == SEVERITY_GATE_NORMAL
    assert is_urgent is False


def test_gate_normal_when_no_reference_data_at_all():
    """Every value has None severity -> SEVERITY_GATE_NORMAL, is_urgent = False."""
    test_values = [
        {"value": 42.0, "ref_low": None, "ref_high": None},
        {"value": 10.0, "ref_low": None, "ref_high": None},
    ]
    gate, is_urgent = _determine_severity_gate(test_values)
    assert gate == SEVERITY_GATE_NORMAL
    assert is_urgent is False
