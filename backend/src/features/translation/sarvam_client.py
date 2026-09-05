import logging
import httpx

from src.config import get_settings
from src.core.constants import (
    SARVAM_MAX_INPUT_CHARS,
    SARVAM_REQUEST_TIMEOUT_SECONDS,
    SARVAM_TRANSLATION_MODE,
)
from src.core.exceptions import TranslationServiceError

logger = logging.getLogger(__name__)


async def translate_text(
    text: str,
    target_language_code: str,
    source_language_code: str = "en-IN",
) -> str:
    """Send text to Sarvam AI translation API (sarvam-translate:v1)."""
    if len(text) > SARVAM_MAX_INPUT_CHARS:
        raise ValueError(
            f"Input text length ({len(text)}) exceeds maximum allowed limit of {SARVAM_MAX_INPUT_CHARS} characters"
        )

    settings = get_settings()

    headers = {
        "api-subscription-key": settings.sarvam_api_key,
        "Content-Type": "application/json",
    }

    payload = {
        "input": text,
        "source_language_code": source_language_code,
        "target_language_code": target_language_code,
        "mode": SARVAM_TRANSLATION_MODE,
    }

    try:
        async with httpx.AsyncClient(timeout=SARVAM_REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                settings.sarvam_base_url,
                headers=headers,
                json=payload,
            )

        if response.status_code != 200:
            err_msg = f"Sarvam API HTTP {response.status_code}"
            try:
                err_data = response.json()
                if "error" in err_data:
                    err_detail = err_data["error"]
                    err_msg += f": {err_detail.get('message', err_detail)}"
            except Exception:
                err_msg += f": {response.text}"

            logger.error("Sarvam translation API error: %s", err_msg)
            raise TranslationServiceError(detail=err_msg)

        data = response.json()
        translated = data.get("translated_text")
        if translated is None:
            raise TranslationServiceError(
                detail="Sarvam response missing 'translated_text' field"
            )

        return translated

    except TranslationServiceError:
        raise
    except Exception as exc:
        logger.error("Failed to connect to Sarvam API: %s", exc)
        raise TranslationServiceError(
            detail=f"Sarvam translation API request failed: {exc}"
        ) from exc
