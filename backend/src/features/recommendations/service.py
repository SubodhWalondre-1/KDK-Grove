"""Finding-driven AI recommendations service.

Pipeline:
  1. Findings Engine — classify all lab parameters by status and priority
  2. RAG Retrieval — retrieve targeted clinical evidence per finding
  3. LLM Synthesis — generate recommendations anchored to specific findings
  4. Safety Validation — verify LLM output integrity
  5. Storage — persist findings + recommendations for future retrieval
"""

import asyncio
import json
import logging
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from src.config import get_settings
from src.core.constants import (
    DEFAULT_SPECIES_CATEGORY,
    FINDING_PRIORITY_ATTENTION,
    FINDING_PRIORITY_MONITORING,
    FINDING_PRIORITY_NORMAL,
    RECOMMENDATION_CATEGORY_FINDING,
    RECOMMENDATION_CATEGORY_URGENT_CARE,
    RECOMMENDATION_LLM_TEMPERATURE,
    SEVERITY_GATE_CRITICAL,
    SEVERITY_GATE_MODERATE,
    SEVERITY_GATE_NORMAL,
    SEVERITY_PENALTY_MODERATE,
    SEVERITY_PENALTY_SEVERE,
    URGENT_CARE_MESSAGE,
)
from src.core.exceptions import LLMExtractionError, ReportNotFoundError
from src.core.severity import calculate_deviation_severity, get_status_color
from src.features.recommendations import prompts, rag_engine
from src.models.recommendation import Recommendation
from src.models.report import Report
from src.schemas.recommendation import (
    FindingRecommendation,
    FindingResponse,
    InsightsResponse,
)
from src.services.openrouter_client import call_llm
from src.utils.llm_json_parsing import extract_json_from_llm_response

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_recommendations(db: Session, report_id: int) -> InsightsResponse:
    """Fetch stored AI insights for a report, returning empty state if not yet generated."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")

    rows = (
        db.query(Recommendation)
        .filter(Recommendation.report_id == report_id)
        .all()
    )

    if not rows:
        return InsightsResponse(
            report_id=report_id,
            has_been_generated=False,
        )

    return _deserialize_insights(rows, report_id)


def generate_recommendations(
    db: Session,
    report_id: int,
    force_regenerate: bool = False,
) -> InsightsResponse:
    """Generate finding-driven AI insights using the full pipeline."""
    report = (
        db.query(Report)
        .options(joinedload(Report.test_values), joinedload(Report.profile))
        .filter(Report.id == report_id)
        .first()
    )
    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")

    # Check for existing recommendations
    existing_rows = (
        db.query(Recommendation)
        .filter(Recommendation.report_id == report_id)
        .all()
    )
    if existing_rows:
        if not force_regenerate:
            return _deserialize_insights(existing_rows, report_id)
        else:
            db.query(Recommendation).filter(Recommendation.report_id == report_id).delete()
            db.commit()

    species_category = (
        report.profile.species_category
        if (report.profile and report.profile.species_category)
        else DEFAULT_SPECIES_CATEGORY
    )

    # Phase 1: Findings Engine
    findings = _build_findings(report.test_values)

    # Phase 2: Severity determination
    severity_gate, is_urgent = _determine_severity_gate(report.test_values)

    # Phase 3: RAG Retrieval (per-finding for abnormals, bulk for context)
    abnormal_findings = [f for f in findings if f["status"] != "normal"]
    all_retrieved_chunks = []
    for finding in abnormal_findings:
        chunks = rag_engine.retrieve_per_finding(finding, species_category, top_k=3)
        all_retrieved_chunks.extend(chunks)

    # Deduplicate chunks by ID
    seen_ids = set()
    unique_chunks = []
    for chunk in all_retrieved_chunks:
        cid = chunk.get("id", id(chunk))
        if cid not in seen_ids:
            seen_ids.add(cid)
            unique_chunks.append(chunk)

    rag_context_str = rag_engine.format_rag_context_for_prompt(unique_chunks)
    sources = rag_engine.get_source_metadata(unique_chunks)

    # Phase 4: LLM Synthesis
    finding_recs = _synthesize_recommendations(
        findings, species_category, rag_context_str
    )

    # Phase 5: Safety Validation
    finding_recs = _validate_recommendations(finding_recs, findings)

    # Phase 6: Build summary
    summary = _build_summary(findings)

    # Phase 7: Persist
    new_rows: List[Recommendation] = []

    if is_urgent:
        new_rows.append(
            Recommendation(
                report_id=report_id,
                category=RECOMMENDATION_CATEGORY_URGENT_CARE,
                content=URGENT_CARE_MESSAGE,
                severity_gate=SEVERITY_GATE_CRITICAL,
            )
        )

    # Store the complete insights payload as a single JSON row
    insights_payload = {
        "summary": summary,
        "findings": findings,
        "recommendations": [r.model_dump() for r in finding_recs],
        "sources": sources,
    }
    new_rows.append(
        Recommendation(
            report_id=report_id,
            category=RECOMMENDATION_CATEGORY_FINDING,
            finding_parameter=None,
            content=json.dumps(insights_payload, default=str),
            severity_gate=severity_gate,
        )
    )

    db.add_all(new_rows)
    db.commit()

    return InsightsResponse(
        report_id=report_id,
        has_been_generated=True,
        is_urgent=is_urgent,
        urgent_care_message=URGENT_CARE_MESSAGE if is_urgent else None,
        summary=summary,
        findings=[FindingResponse(**f) for f in findings],
        recommendations=finding_recs,
        sources=sources,
        severity_gate=severity_gate,
        generated_at=new_rows[-1].generated_at if new_rows else None,
    )


# ---------------------------------------------------------------------------
# Phase 1: Findings Engine
# ---------------------------------------------------------------------------


def _build_findings(test_values: list) -> list[dict]:
    """Classify all lab parameters into structured findings with status and priority."""
    findings = []
    for tv in test_values:
        val = getattr(tv, "value", None) if not isinstance(tv, dict) else tv.get("value")
        ref_low = getattr(tv, "ref_low", None) if not isinstance(tv, dict) else tv.get("ref_low")
        ref_high = getattr(tv, "ref_high", None) if not isinstance(tv, dict) else tv.get("ref_high")
        test_name = getattr(tv, "test_name", None) if not isinstance(tv, dict) else tv.get("test_name", "Unknown")
        unit = getattr(tv, "unit", None) if not isinstance(tv, dict) else tv.get("unit", "")

        # Determine status
        status_color = get_status_color(val, ref_low, ref_high)
        if status_color == "red":
            status = "high" if (isinstance(val, (int, float)) and ref_high is not None and val > ref_high) else "low"
        elif status_color == "yellow":
            status = "high" if (isinstance(val, (int, float)) and ref_high is not None and val > ref_high) else "low"
        else:
            status = "normal"

        # Determine priority based on deviation severity
        dev_severity = calculate_deviation_severity(val, ref_low, ref_high)
        if dev_severity is not None and dev_severity >= SEVERITY_PENALTY_SEVERE:
            priority = FINDING_PRIORITY_ATTENTION
        elif dev_severity is not None and dev_severity >= SEVERITY_PENALTY_MODERATE:
            priority = FINDING_PRIORITY_MONITORING
        elif status != "normal":
            priority = FINDING_PRIORITY_MONITORING
        else:
            priority = FINDING_PRIORITY_NORMAL

        # Normalize equal bounds (e.g. 200.0-200.0 -> <200.0)
        if ref_low is not None and ref_high is not None and ref_low == ref_high:
            ref_low = None

        # Build reference range string
        if ref_low is not None and ref_high is not None:
            ref_range = f"{ref_low}-{ref_high} {unit or ''}".strip()
        elif ref_high is not None:
            ref_range = f"<{ref_high} {unit or ''}".strip()
        elif ref_low is not None:
            ref_range = f">{ref_low} {unit or ''}".strip()
        else:
            ref_range = "N/A"

        findings.append({
            "parameter": test_name,
            "value": val,
            "unit": unit or "",
            "reference_range": ref_range,
            "status": status,
            "priority": priority,
        })

    # Sort: attention first, then monitoring, then normal
    priority_order = {
        FINDING_PRIORITY_ATTENTION: 0,
        FINDING_PRIORITY_MONITORING: 1,
        FINDING_PRIORITY_NORMAL: 2,
    }
    findings.sort(key=lambda f: priority_order.get(f["priority"], 3))

    return findings


def _build_summary(findings: list[dict]) -> dict:
    """Build summary counts for the insights response."""
    attention = sum(1 for f in findings if f["priority"] == FINDING_PRIORITY_ATTENTION)
    monitoring = sum(1 for f in findings if f["priority"] == FINDING_PRIORITY_MONITORING)
    normal = sum(1 for f in findings if f["priority"] == FINDING_PRIORITY_NORMAL)
    return {"attention": attention, "monitoring": monitoring, "normal": normal}


# ---------------------------------------------------------------------------
# Phase 4: LLM Synthesis
# ---------------------------------------------------------------------------


def _synthesize_recommendations(
    findings: list[dict],
    species_category: str,
    rag_context: str,
) -> list[FindingRecommendation]:
    """Send findings + evidence to LLM and parse structured recommendations."""
    abnormal = [f for f in findings if f["status"] != "normal"]
    if not abnormal:
        return []

    settings = get_settings()
    system_prompt = prompts.build_system_prompt(species_category)
    user_prompt = prompts.build_user_message(findings, species_category, rag_context=rag_context)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    parsed_json = None
    last_err: Optional[Exception] = None

    for attempt in range(2):
        try:
            raw_response = asyncio.run(
                call_llm(
                    messages=messages,
                    model_slug=settings.recommendation_model_slug,
                    json_mode=True,
                    temperature=RECOMMENDATION_LLM_TEMPERATURE,
                )
            )
            data = extract_json_from_llm_response(raw_response)
            if not isinstance(data, dict):
                raise ValueError("LLM response is not a JSON object")
            parsed_json = data
            break
        except (ValueError, LLMExtractionError) as exc:
            last_err = exc
            logger.warning("Recommendation synthesis attempt %d failed: %s", attempt + 1, exc)

    if parsed_json is None:
        logger.error("LLM synthesis failed after retries: %s", last_err)
        # Return fallback recommendations for each abnormal finding
        return _build_fallback_recommendations(abnormal)

    # Parse the LLM response into FindingRecommendation objects
    raw_recs = parsed_json.get("recommendations", [])
    result = []
    for raw in raw_recs:
        if not isinstance(raw, dict):
            continue
        try:
            rec = FindingRecommendation(
                finding_parameter=raw.get("finding_parameter", ""),
                why_flagged=raw.get("why_flagged", ""),
                simple_explanation=raw.get("simple_explanation", ""),
                general_support=raw.get("general_support", []),
                discuss_with_clinician=raw.get("discuss_with_clinician", []),
                follow_up=raw.get("follow_up", []),
                evidence_sources=raw.get("evidence_sources", []),
            )
            if rec.finding_parameter:
                result.append(rec)
        except Exception as exc:
            logger.warning("Failed to parse recommendation: %s", exc)

    # Ensure every abnormal finding has a recommendation
    covered_params = {r.finding_parameter.lower() for r in result}
    for finding in abnormal:
        if finding["parameter"].lower() not in covered_params:
            result.append(_build_single_fallback(finding))

    return result


def _build_fallback_recommendations(
    abnormal_findings: list[dict],
) -> list[FindingRecommendation]:
    """Generate fallback recommendations when LLM fails."""
    return [_build_single_fallback(f) for f in abnormal_findings]


def _build_single_fallback(finding: dict) -> FindingRecommendation:
    """Build a single fallback recommendation for a finding."""
    param = finding.get("parameter", "Unknown")
    val = finding.get("value", "N/A")
    unit = finding.get("unit", "")
    ref = finding.get("reference_range", "N/A")
    status = finding.get("status", "abnormal")

    direction = "above" if status == "high" else "below"

    return FindingRecommendation(
        finding_parameter=param,
        why_flagged=(
            f"Your reported value ({val} {unit}) is {direction} the reference range "
            f"({ref}) provided by the laboratory."
        ),
        simple_explanation=(
            f"The {param} result is outside the expected range. "
            f"A healthcare professional can explain what this means for your specific situation."
        ),
        general_support=[
            "Maintain a balanced, nutrient-rich diet appropriate for your condition.",
            "Stay adequately hydrated and follow a regular sleep schedule.",
            "Engage in moderate physical activity as tolerated.",
        ],
        discuss_with_clinician=[
            f"What could be contributing to this {param} result?",
            f"Should this {param} value be monitored or repeated?",
            "Are additional evaluations appropriate?",
        ],
        follow_up=[
            "Follow-up decisions should be made with a qualified healthcare professional "
            "based on the complete clinical context.",
        ],
        evidence_sources=[],
    )


# ---------------------------------------------------------------------------
# Phase 5: Safety Validation
# ---------------------------------------------------------------------------


def _validate_recommendations(
    recs: list[FindingRecommendation],
    findings: list[dict],
) -> list[FindingRecommendation]:
    """Validate LLM output: strip medication prescriptions, verify finding references."""
    medication_keywords = [
        "prescribe", "prescription", "start taking", "stop taking",
        "dosage", "mg per day", "twice daily", "take this medication",
    ]

    valid_params = {f["parameter"].lower() for f in findings}
    validated = []

    for rec in recs:
        # Verify the recommendation references a real finding
        if rec.finding_parameter.lower() not in valid_params:
            logger.warning(
                "Recommendation references unknown parameter: %s — skipping",
                rec.finding_parameter,
            )
            continue

        # Strip medication language from general_support
        clean_support = []
        for item in rec.general_support:
            item_lower = item.lower()
            if not any(kw in item_lower for kw in medication_keywords):
                clean_support.append(item)
        rec.general_support = clean_support if clean_support else [
            "Discuss lifestyle modifications with your healthcare professional."
        ]

        validated.append(rec)

    return validated


# ---------------------------------------------------------------------------
# Severity gate (unchanged from original)
# ---------------------------------------------------------------------------


def _determine_severity_gate(test_values: list) -> tuple[str, bool]:
    """Compute highest deviation penalty and return (severity_gate, is_urgent)."""
    severities = []
    for tv in test_values:
        val = getattr(tv, "value", None) if not isinstance(tv, dict) else tv.get("value")
        ref_low = getattr(tv, "ref_low", None) if not isinstance(tv, dict) else tv.get("ref_low")
        ref_high = getattr(tv, "ref_high", None) if not isinstance(tv, dict) else tv.get("ref_high")
        sev = calculate_deviation_severity(val, ref_low, ref_high)
        if sev is not None:
            severities.append(sev)

    if not severities:
        return SEVERITY_GATE_NORMAL, False

    max_sev = max(severities)
    if max_sev == SEVERITY_PENALTY_SEVERE:
        return SEVERITY_GATE_CRITICAL, True
    if max_sev >= SEVERITY_PENALTY_MODERATE:
        return SEVERITY_GATE_MODERATE, False

    return SEVERITY_GATE_NORMAL, False


# ---------------------------------------------------------------------------
# Deserialization — rebuild InsightsResponse from stored DB rows
# ---------------------------------------------------------------------------


def _deserialize_insights(rows: list, report_id: int) -> InsightsResponse:
    """Reconstruct InsightsResponse from persisted Recommendation rows."""
    is_urgent = False
    urgent_care_message = None
    summary = {}
    findings: list[FindingResponse] = []
    recs: list[FindingRecommendation] = []
    sources: list[dict] = []
    severity_gate = None
    generated_at = None

    for row in rows:
        if row.category == RECOMMENDATION_CATEGORY_URGENT_CARE:
            is_urgent = True
            urgent_care_message = row.content
        elif row.category == RECOMMENDATION_CATEGORY_FINDING:
            try:
                payload = json.loads(row.content)
                summary = payload.get("summary", {})
                findings = [FindingResponse(**f) for f in payload.get("findings", [])]
                recs = [
                    FindingRecommendation(**r) for r in payload.get("recommendations", [])
                ]
                sources = payload.get("sources", [])
            except (json.JSONDecodeError, Exception) as exc:
                logger.error("Failed to deserialize insights payload: %s", exc)

        severity_gate = row.severity_gate
        generated_at = row.generated_at

    return InsightsResponse(
        report_id=report_id,
        has_been_generated=bool(findings or recs),
        is_urgent=is_urgent,
        urgent_care_message=urgent_care_message,
        summary=summary,
        findings=findings,
        recommendations=recs,
        sources=sources,
        severity_gate=severity_gate,
        generated_at=generated_at,
    )
