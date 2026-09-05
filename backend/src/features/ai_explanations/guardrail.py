"""Guardrail module for validating generated per-test plain-English explanations.

This guardrail runs on fresh LLM-generated explanations only, before writing them to explanation_cache.
Cached entries and static fallback_explanations.json entries bypass request-time guardrail checks
(fallback entries are statically validated via unit test test_guardrail.py).
"""

DISALLOWED_PATTERNS = [
    "you have",
    "diagnosed with",
    "this means you definitely",
    "you are suffering from",
    "this confirms",
    "you likely have",
]


def passes_guardrail(explanation_text: str) -> bool:
    lowered = explanation_text.lower()
    return not any(phrase in lowered for phrase in DISALLOWED_PATTERNS)
