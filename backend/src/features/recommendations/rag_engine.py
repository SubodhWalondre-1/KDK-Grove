"""RAG engine for clinical knowledge retrieval.

Supports both bulk retrieval (all findings at once) and
per-finding retrieval (targeted chunks per abnormal parameter).
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

DATASET_PATH = Path(__file__).parent / "rag_dataset.json"

_RAG_DATASET_CACHE: List[Dict[str, Any]] = []


def load_rag_dataset() -> List[Dict[str, Any]]:
    """Load and cache the clinical RAG dataset from rag_dataset.json."""
    global _RAG_DATASET_CACHE
    if not _RAG_DATASET_CACHE:
        try:
            if DATASET_PATH.exists():
                with open(DATASET_PATH, "r", encoding="utf-8") as f:
                    _RAG_DATASET_CACHE = json.load(f)
                logger.info("Loaded RAG dataset with %d clinical chunks.", len(_RAG_DATASET_CACHE))
            else:
                logger.warning("RAG dataset file not found at %s", DATASET_PATH)
        except Exception as exc:
            logger.error("Failed to load RAG dataset: %s", exc)
    return _RAG_DATASET_CACHE


# ---------------------------------------------------------------------------
# Keyword mapping: parameter name tokens → searchable keywords + conditions
# ---------------------------------------------------------------------------

_PARAMETER_KEYWORD_MAP = {
    "sugar": (["glucose", "blood_sugar", "diabetes", "gi", "hba1c"], ["diabetes", "hyperglycemia"]),
    "glucose": (["glucose", "blood_sugar", "diabetes", "gi", "hba1c"], ["diabetes", "hyperglycemia"]),
    "hba1c": (["glucose", "blood_sugar", "diabetes", "gi", "hba1c"], ["diabetes"]),
    "creatinine": (["creatinine", "urea", "kidney", "ckd", "gfr", "phosphorus", "potassium"], ["ckd", "high_creatinine"]),
    "urea": (["creatinine", "urea", "kidney", "ckd", "gfr"], ["ckd", "high_creatinine"]),
    "bun": (["creatinine", "urea", "kidney", "ckd", "gfr"], ["ckd"]),
    "gfr": (["creatinine", "urea", "kidney", "ckd", "gfr"], ["ckd"]),
    "uric": (["uric_acid", "purine", "gout"], ["gout", "high_uric_acid"]),
    "wbc": (["wbc", "inflammation", "infection", "leucocyte"], ["inflammation"]),
    "leucocyte": (["wbc", "inflammation", "infection", "leucocyte"], ["inflammation"]),
    "leukocyte": (["wbc", "inflammation", "infection", "leucocyte"], ["inflammation"]),
    "neutrophil": (["wbc", "inflammation", "infection", "leucocyte"], ["inflammation"]),
    "pressure": (["hypertension", "blood_pressure", "sodium", "dash"], ["hypertension"]),
    "bp": (["hypertension", "blood_pressure", "sodium", "dash"], ["hypertension"]),
    "sodium": (["hypertension", "blood_pressure", "sodium", "dash"], ["hypertension"]),
    "cholesterol": (["ldl_cholesterol", "statin", "hypertension", "cardiovascular"], ["high_cholesterol"]),
    "triglyceride": (["ldl_cholesterol", "statin", "cardiovascular"], ["high_cholesterol"]),
    "ldl": (["ldl_cholesterol", "statin", "cardiovascular", "dash"], ["high_cholesterol"]),
    "hdl": (["ldl_cholesterol", "cardiovascular"], []),
    "hemoglobin": (["hemoglobin", "iron", "anemia"], ["anemia"]),
    "iron": (["iron", "anemia", "hemoglobin"], ["anemia"]),
    "ferritin": (["iron", "anemia", "hemoglobin"], ["anemia"]),
    "platelet": (["platelet", "coagulation"], []),
    "thyroid": (["thyroid", "tsh", "t3", "t4"], ["thyroid"]),
    "tsh": (["thyroid", "tsh", "t3", "t4"], ["thyroid"]),
    "liver": (["liver", "ast", "alt", "bilirubin", "albumin"], ["liver_disease"]),
    "alt": (["liver", "ast", "alt", "bilirubin"], ["liver_disease"]),
    "ast": (["liver", "ast", "alt", "bilirubin"], ["liver_disease"]),
    "bilirubin": (["liver", "bilirubin", "albumin"], ["liver_disease"]),
    "albumin": (["liver", "albumin", "protein"], []),
}


def _extract_keywords_for_parameter(param_name: str) -> tuple[set[str], set[str]]:
    """Extract search keywords and condition tags for a parameter name."""
    name_lower = param_name.lower()
    keywords: set[str] = set()
    conditions: set[str] = set()

    for token, (kw_list, cond_list) in _PARAMETER_KEYWORD_MAP.items():
        if token in name_lower:
            keywords.update(kw_list)
            conditions.update(cond_list)

    return keywords, conditions


def _score_chunk(chunk: Dict[str, Any], keywords: set[str], conditions: set[str]) -> int:
    """Score a single RAG chunk against a set of keywords and conditions."""
    score = 0
    chunk_conditions = set(chunk.get("clinical_conditions", []))
    chunk_keywords = set(chunk.get("keywords", []))

    # Condition match weight: +10
    score += len(chunk_conditions.intersection(conditions)) * 10

    # Keyword match weight: +3
    score += len(chunk_keywords.intersection(keywords)) * 3

    # Baseline general chunks get a small boost
    if "general" in chunk_conditions:
        score += 2

    return score


# ---------------------------------------------------------------------------
# Bulk retrieval (all findings combined) — used as before
# ---------------------------------------------------------------------------

def retrieve_rag_context(
    test_values: List[Dict[str, Any]],
    species_category: str,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """Retrieve top-k clinical chunks relevant to ALL test values combined."""
    dataset = load_rag_dataset()
    if not dataset:
        return []

    # Aggregate keywords and conditions across all abnormal values
    all_keywords: set[str] = set()
    all_conditions: set[str] = set()

    for tv in test_values:
        name = str(tv.get("test_name", tv.get("parameter", ""))).lower()
        status = str(tv.get("status", "")).lower()

        kw, cond = _extract_keywords_for_parameter(name)
        all_keywords.update(kw)
        if status in ("yellow", "red", "high", "low"):
            all_conditions.update(cond)

    scored = []
    for chunk in dataset:
        s = _score_chunk(chunk, all_keywords, all_conditions)
        if s > 0:
            scored.append((s, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    selected = [chunk for _, chunk in scored[:top_k]]

    # Pad with baseline chunks if needed
    if len(selected) < top_k:
        for chunk in dataset:
            if chunk not in selected:
                selected.append(chunk)
                if len(selected) >= top_k:
                    break

    return selected


# ---------------------------------------------------------------------------
# Per-finding retrieval — targeted chunks for a single abnormal parameter
# ---------------------------------------------------------------------------

def retrieve_per_finding(
    finding: Dict[str, Any],
    species_category: str,
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """Retrieve targeted clinical knowledge for a specific abnormal finding.

    Returns chunks with their IDs for evidence traceability.
    """
    dataset = load_rag_dataset()
    if not dataset:
        return []

    param_name = str(finding.get("parameter", ""))
    keywords, conditions = _extract_keywords_for_parameter(param_name)

    scored = []
    for chunk in dataset:
        s = _score_chunk(chunk, keywords, conditions)
        if s > 0:
            scored.append((s, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def format_rag_context_for_prompt(retrieved_chunks: List[Dict[str, Any]]) -> str:
    """Format retrieved clinical chunks into a structured string for prompt injection."""
    if not retrieved_chunks:
        return ""

    formatted_lines = [
        "=========================================================",
        "EVIDENCE-BASED CLINICAL REFERENCE KNOWLEDGE (RAG CONTEXT):",
        "=========================================================",
    ]

    for idx, chunk in enumerate(retrieved_chunks, 1):
        chunk_id = chunk.get("id", f"chunk_{idx}")
        formatted_lines.append(f"\n[SOURCE {idx}] ID={chunk_id}: {chunk.get('title', 'Guideline')}")
        formatted_lines.append(f"Category: {chunk.get('category', 'general').upper()}")
        formatted_lines.append(f"Content: {chunk.get('content', '')}")

    formatted_lines.append(
        "\nINSTRUCTIONS: Ground your recommendations in the evidence above. "
        "Reference source IDs in your evidence_sources field."
    )
    formatted_lines.append("=========================================================\n")

    return "\n".join(formatted_lines)


def get_source_metadata(retrieved_chunks: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Extract source metadata from retrieved chunks for the API response."""
    sources = []
    seen_ids = set()
    for chunk in retrieved_chunks:
        chunk_id = chunk.get("id", "")
        if chunk_id and chunk_id not in seen_ids:
            seen_ids.add(chunk_id)
            sources.append({
                "id": chunk_id,
                "title": chunk.get("title", ""),
                "category": chunk.get("category", "general"),
            })
    return sources
