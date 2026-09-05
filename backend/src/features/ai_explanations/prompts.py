import re
from src.core.constants import (
    EXPLANATION_DIRECTION_HIGH,
    EXPLANATION_MAX_CHAR_LENGTH,
)

EXPLANATION_SYSTEM_PROMPT = """
You are a health literacy assistant. You explain lab values in plain, simple
language for a general audience with no medical background.

Rules you must follow:
- Do NOT diagnose any disease or condition.
- Do NOT state a definite cause for the abnormal value.
- Describe only: (1) what this marker generally measures, in one simple sentence,
  and (2) that the value is outside the typical range in the given direction,
  in one neutral sentence.
- Do NOT give medical advice or next steps — that is handled separately by the app.
- Maximum 2 short sentences. No medical jargon.
"""


def build_user_message(canonical_test_name: str, direction: str, species_category: str) -> str:
    direction_desc = "above" if direction == EXPLANATION_DIRECTION_HIGH else "below"
    return (
        f"Explain the lab value '{canonical_test_name}' for a {species_category} patient. "
        f"The value is {direction} ({direction_desc} the typical reference range)."
    )


def normalize_explanation_text(raw_text: str) -> str:
    """Normalize and clean raw LLM output text before guardrail checks and caching."""
    if not raw_text:
        return ""

    # 1. Strip leading/trailing whitespace and quotes
    text = raw_text.strip().strip("\"'")

    # 2. Strip conversational preambles (case-insensitive)
    preambles = ["sure,", "here's", "certainly,", "of course,"]
    for preamble in preambles:
        if text.lower().startswith(preamble):
            text = text[len(preamble):].strip().lstrip(",").strip()
            # Also strip quotes again if they were behind the preamble
            text = text.strip("\"'")
            break

    # 3. Truncate to EXPLANATION_MAX_CHAR_LENGTH on word boundary
    if len(text) > EXPLANATION_MAX_CHAR_LENGTH:
        truncated = text[:EXPLANATION_MAX_CHAR_LENGTH]
        # Cut back to the last whitespace to preserve word boundary
        last_space = truncated.rfind(" ")
        if last_space > 0:
            text = truncated[:last_space].rstrip(".,;:") + "."
        else:
            text = truncated.rstrip(".,;:") + "."

    return text
