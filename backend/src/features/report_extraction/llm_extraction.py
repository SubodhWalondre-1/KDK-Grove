import logging

from src.config import get_settings
from src.core.exceptions import LLMExtractionError
from src.features.species_support.service import build_extraction_prompt
from src.services.openrouter_client import call_llm
from src.utils.llm_json_parsing import extract_json_from_llm_response

logger = logging.getLogger(__name__)

BASE_EXTRACTION_PROMPT = (
    "You are a medical lab report data extractor. Given raw text from a lab report, "
    "extract every test parameter into a JSON object with a 'tests' key mapping to an array. "
    "Each element in the array must be an object with:\n"
    '  {"test_name": string, "value": number or null, "unit": string or null, '
    '"ref_low": number or null, "ref_high": number or null}\n\n'
    "Rules:\n"
    "- test_name is required and must be the standard clinical name as printed.\n"
    "- value should be a number. If unreadable, set value to null.\n"
    "- unit, ref_low, ref_high may be null if not printed on the report.\n"
    '- Output ONLY valid JSON in the format {"tests": [...]}.\n'
)

EXTRACTION_TEMPERATURE = 0.1


async def extract_structured_data(ocr_raw_text: str, species_category: str = "human") -> list[dict]:
    """Send OCR text to Qwen and return a validated list of test-value dicts."""
    settings = get_settings()

    species_context = build_extraction_prompt(species_category)
    system_prompt = (
        f"{BASE_EXTRACTION_PROMPT}\n{species_context}"
        if species_context
        else BASE_EXTRACTION_PROMPT
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": ocr_raw_text},
    ]

    raw_response = await call_llm(
        messages=messages,
        model_slug=settings.qwen_model_slug,
        json_mode=True,
    )

    parsed = _parse_json_response(raw_response)
    validated = _validate_test_values(parsed)
    return validated


def _parse_json_response(raw: str) -> list[dict]:
    try:
        data = extract_json_from_llm_response(raw)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            if "tests" in data and isinstance(data["tests"], list):
                return data["tests"]
            if "results" in data and isinstance(data["results"], list):
                return data["results"]
            if "test_name" in data:
                return [data]
            for v in data.values():
                if isinstance(v, list) and v and isinstance(v[0], dict):
                    return v
                if isinstance(v, dict) and "test_name" in v:
                    return [v]
    except ValueError as err:
        raise LLMExtractionError(
            detail="LLM response could not be parsed as a JSON array of test values"
        ) from err

    raise LLMExtractionError(
        detail="LLM response could not be parsed as a JSON array of test values"
    )


def _validate_test_values(items: list[dict]) -> list[dict]:
    validated = []
    for item in items:
        test_name = item.get("test_name")
        if not test_name:
            logger.warning("Skipping extracted item with missing test_name: %s", item)
            continue

        ref_low = _to_float(item.get("ref_low"))
        ref_high = _to_float(item.get("ref_high"))
        if ref_low is not None and ref_high is not None and ref_low == ref_high:
            ref_low = None

        validated.append({
            "test_name": str(test_name).strip(),
            "value": _to_float(item.get("value")),
            "unit": item.get("unit"),
            "ref_low": ref_low,
            "ref_high": ref_high,
        })

    if not validated:
        raise LLMExtractionError(
            detail="LLM returned no valid test values with a test_name field"
        )

    return validated


def _to_float(val) -> float | None:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def extract_with_heuristics(text: str) -> list[dict]:
    """Fallback extraction using pattern matching when LLM is unavailable or uncredited."""
    import re

    results = []
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    skip_prefixes = (
        "page", "date", "ref", "sample", "age", "dr", "regd", "rep",
        "complete", "red cell", "total count", "haematology", "customer",
        "sid", "collected", "reported", "apl code", "test description",
        "method:", "processed at", "dr.", "this is an", "note :",
        "biological", "result", "units", "range", "electronic", "signature"
    )

    val_range_pattern = re.compile(
        r"^([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z%\/]+(?:\s*[A-Za-z%\/]+)?)?(?:\s+([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|—|to)\s*([0-9]+(?:\.[0-9]+)?))?"
    )

    i = 0
    while i < len(lines):
        line = lines[i]
        lower = line.lower()
        if any(lower.startswith(p) for p in skip_prefixes):
            i += 1
            continue

        # Case 1: Line has test name and numeric value on same line
        tokens = line.split()
        num_idx = -1
        for idx, t in enumerate(tokens):
            try:
                float(t)
                num_idx = idx
                break
            except ValueError:
                continue

        if num_idx > 0:
            test_name = " ".join(tokens[:num_idx]).rstrip(": ")
            rest = " ".join(tokens[num_idx:])
            vm = val_range_pattern.match(rest)
            if vm and not test_name.startswith("(") and len(re.findall(r"[A-Za-z]", test_name)) >= 2:
                val = float(vm.group(1))
                unit = vm.group(2)
                ref_l = float(vm.group(3)) if vm.group(3) else None
                ref_h = float(vm.group(4)) if vm.group(4) else None
                results.append({
                    "test_name": test_name,
                    "value": val,
                    "unit": unit,
                    "ref_low": ref_l,
                    "ref_high": ref_h,
                })
                i += 1
                continue

        # Case 2: Multi-line where line i is test name and next line is value
        if i + 1 < len(lines):
            next_idx = i + 1
            if lines[next_idx].startswith("(") and next_idx + 1 < len(lines):
                next_idx += 1
            vm = val_range_pattern.match(lines[next_idx])
            if vm and not line.startswith("(") and len(re.findall(r"[A-Za-z]", line)) >= 2:
                val = float(vm.group(1))
                unit = vm.group(2)
                ref_l = float(vm.group(3)) if vm.group(3) else None
                ref_h = float(vm.group(4)) if vm.group(4) else None
                results.append({
                    "test_name": line.rstrip(": "),
                    "value": val,
                    "unit": unit,
                    "ref_low": ref_l,
                    "ref_high": ref_h,
                })
                i = next_idx + 1
                continue
        i += 1

    return results

