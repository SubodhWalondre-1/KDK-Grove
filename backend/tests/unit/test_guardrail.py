import json
from pathlib import Path

import pytest
from src.features.ai_explanations.guardrail import (
    DISALLOWED_PATTERNS,
    passes_guardrail,
)


@pytest.mark.parametrize("phrase", DISALLOWED_PATTERNS)
def test_each_disallowed_phrase_fails_guardrail(phrase):
    text = f"This is a sentence. {phrase} elevated hemoglobin."
    assert passes_guardrail(text) is False


def test_clean_explanation_passes_guardrail():
    text = (
        "Hemoglobin carries oxygen throughout the body. "
        "This value is slightly above the typical reference range."
    )
    assert passes_guardrail(text) is True


def test_guardrail_is_case_insensitive():
    text = "You HAVE elevated cholesterol levels."
    assert passes_guardrail(text) is False


def test_fallback_file_entries_all_pass_guardrail():
    """Static sanity check: ALL fallback_explanations.json entries MUST pass passes_guardrail()."""
    json_path = (
        Path(__file__).parent.parent.parent
        / "src"
        / "features"
        / "ai_explanations"
        / "fallback_explanations.json"
    )

    with open(json_path, "r", encoding="utf-8") as f:
        fallback_data = json.load(f)

    for test_name, directions in fallback_data.items():
        for dir_key, text in directions.items():
            assert passes_guardrail(text) is True, (
                f"Fallback entry for {test_name}.{dir_key} failed guardrail: {text!r}"
            )
