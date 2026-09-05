"""Finding-driven recommendation prompts for the AI insights engine.

These prompts instruct the LLM to generate recommendations that are
anchored to specific lab findings and grounded in retrieved clinical evidence.
"""

SYSTEM_PROMPT_TEMPLATE = """You are the recommendation generation component of a medical
laboratory report analysis system for {species_category} patients.

Your task is NOT to diagnose the patient.

You receive:
1. VERIFIED LAB FINDINGS — parameters with observed values, reference ranges, and clinical status
2. REFERENCE RANGES FROM THE REPORT — as provided by the laboratory
3. PATIENT CONTEXT WHEN AVAILABLE — species, age, breed
4. RETRIEVED CLINICAL KNOWLEDGE — evidence-based guidelines from a curated knowledge base

Rules:
- Only generate recommendations related to the supplied findings.
- Do not invent laboratory values.
- Do not invent reference ranges.
- Do not make a definitive diagnosis.
- Do not prescribe, start, stop, or change medication.
- Clearly distinguish report-derived facts from AI-generated guidance.
- Do not provide generic recommendations unrelated to the findings.
- If evidence is insufficient, explicitly say so.
- Encourage discussion with a qualified healthcare professional when appropriate.
- Every recommendation must be traceable to one or more supplied findings.
- When retrieved clinical knowledge is provided, ground your guidance in that evidence.

For each ABNORMAL finding (status = "high" or "low"), return a recommendation object with:
1. finding_parameter — exact parameter name from the findings
2. why_flagged — why this value is flagged (reference the observed value vs reference range)
3. simple_explanation — plain English explanation of what this parameter measures and what the current value may indicate
4. general_support — list of 2-4 evidence-supported lifestyle considerations specifically relevant to this finding
5. discuss_with_clinician — list of 2-3 questions the patient should discuss with their doctor/vet
6. follow_up — list of 1-2 follow-up considerations
7. evidence_sources — list of source IDs from the retrieved clinical knowledge that support your guidance

Return strict JSON in this exact structure:
{{
  "recommendations": [
    {{
      "finding_parameter": "Parameter Name",
      "why_flagged": "Your reported value (X unit) is above/below the reference range (Y-Z unit) provided by the laboratory.",
      "simple_explanation": "Plain English explanation.",
      "general_support": ["Specific actionable guidance 1", "Specific actionable guidance 2"],
      "discuss_with_clinician": ["Question 1?", "Question 2?"],
      "follow_up": ["Follow-up consideration"],
      "evidence_sources": ["source_id_1", "source_id_2"]
    }}
  ]
}}

Do NOT return recommendations for parameters that are within normal range.
Do NOT wrap the JSON in markdown code blocks."""


def build_system_prompt(species_category: str) -> str:
    """Format the system prompt template for the given species category."""
    return SYSTEM_PROMPT_TEMPLATE.format(species_category=species_category)


def build_user_message(
    findings: list[dict],
    species_category: str,
    rag_context: str = "",
) -> str:
    """Build the user prompt with verified findings and retrieved evidence.

    Unlike the old prompt which asked for generic diet/exercise/lifestyle,
    this prompt sends structured findings and asks the LLM to generate
    recommendations specifically anchored to each abnormal finding.
    """
    lines = []

    if rag_context:
        lines.append(rag_context)

    lines.append(f"VERIFIED LAB FINDINGS for this {species_category} patient:")
    lines.append("")

    abnormal_count = 0
    for f in findings:
        param = f.get("parameter", "Unknown")
        value = f.get("value", "N/A")
        unit = f.get("unit", "")
        ref_range = f.get("reference_range", "N/A")
        status = f.get("status", "normal")
        priority = f.get("priority", "normal")

        status_marker = "✓" if status == "normal" else "⚠"
        lines.append(
            f"  {status_marker} {param}: {value} {unit} "
            f"(reference: {ref_range}, status: {status.upper()}, priority: {priority})"
        )
        if status != "normal":
            abnormal_count += 1

    lines.append("")
    lines.append(
        f"Generate AI guidance for the {abnormal_count} abnormal finding(s) above. "
        "Each recommendation MUST reference the specific finding parameter, "
        "the observed value vs reference range, and be grounded in the retrieved "
        "clinical knowledge when available. "
        "Do NOT generate guidance for normal parameters."
    )

    return "\n".join(lines)
