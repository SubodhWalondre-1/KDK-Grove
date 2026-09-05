import json
import re


def extract_json_from_llm_response(raw_text: str) -> dict | list:
    """Extract and parse a JSON object or array from an LLM output string.

    Supports direct JSON strings, markdown fenced JSON (```json ... ```), and raw
    text containing embedded JSON objects or arrays.

    Raises ValueError if all parsing attempts fail.
    """
    if not raw_text:
        raise ValueError("LLM response text is empty")

    cleaned_raw = raw_text.strip()

    # Attempt 1: Direct JSON parsing
    try:
        return json.loads(cleaned_raw)
    except json.JSONDecodeError:
        pass

    # Attempt 2: Strip markdown code fences (```json ... ``` or ``` ... ```)
    unfenced = re.sub(r"```(?:json)?\s*", "", cleaned_raw)
    unfenced = re.sub(r"```\s*$", "", unfenced).strip()
    try:
        return json.loads(unfenced)
    except json.JSONDecodeError:
        pass

    # Attempt 3: Locate outermost JSON brackets ({...} or [...])
    first_obj = unfenced.find("{")
    last_obj = unfenced.rfind("}")

    first_arr = unfenced.find("[")
    last_arr = unfenced.rfind("]")

    candidates = []

    if first_obj != -1 and last_obj != -1 and last_obj > first_obj:
        candidates.append((first_obj, unfenced[first_obj:last_obj + 1]))

    if first_arr != -1 and last_arr != -1 and last_arr > first_arr:
        candidates.append((first_arr, unfenced[first_arr:last_arr + 1]))

    # Try candidates ordered by earliest start index
    candidates.sort(key=lambda x: x[0])
    for _, candidate_str in candidates:
        try:
            return json.loads(candidate_str)
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from LLM response: {raw_text}")
