import asyncio
import logging

import httpx

from src.config import get_settings
from src.core.constants import MAX_LLM_RETRY_ATTEMPTS
from src.core.exceptions import LLMExtractionError

logger = logging.getLogger(__name__)

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
INITIAL_BACKOFF_SECONDS = 1.0
BACKOFF_MULTIPLIER = 2.0
REQUEST_TIMEOUT_SECONDS = 60.0


async def call_llm(
    messages: list[dict],
    model_slug: str,
    json_mode: bool = False,
    temperature: float | None = None,
    max_retries: int = MAX_LLM_RETRY_ATTEMPTS,
) -> str:
    """Send a chat completion request to OpenRouter and return the assistant's content string."""
    settings = get_settings()

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }

    body: dict = {
        "model": model_slug,
        "messages": messages,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    if temperature is not None:
        body["temperature"] = temperature

    last_exception: Exception | None = None
    backoff = INITIAL_BACKOFF_SECONDS

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
        for attempt in range(1, max_retries + 1):
            try:
                response = await client.post(
                    settings.openrouter_base_url,
                    headers=headers,
                    json=body,
                )

                if response.status_code in RETRYABLE_STATUS_CODES:
                    logger.warning(
                        "LLM request attempt %d/%d returned %d, retrying in %.1fs",
                        attempt, max_retries, response.status_code, backoff,
                    )
                    last_exception = httpx.HTTPStatusError(
                        message=f"HTTP {response.status_code}",
                        request=response.request,
                        response=response,
                    )
                    await asyncio.sleep(backoff)
                    backoff *= BACKOFF_MULTIPLIER
                    continue

                response.raise_for_status()

                data = response.json()
                return data["choices"][0]["message"]["content"]

            except httpx.HTTPStatusError as exc:
                if exc.response.status_code not in RETRYABLE_STATUS_CODES:
                    raise LLMExtractionError(
                        detail=f"LLM returned non-retryable HTTP {exc.response.status_code}"
                    ) from exc
                last_exception = exc
                logger.warning(
                    "LLM request attempt %d/%d failed with HTTP %d, retrying in %.1fs",
                    attempt, max_retries, exc.response.status_code, backoff,
                )
                await asyncio.sleep(backoff)
                backoff *= BACKOFF_MULTIPLIER

            except (httpx.RequestError, KeyError) as exc:
                last_exception = exc
                logger.warning(
                    "LLM request attempt %d/%d failed: %s, retrying in %.1fs",
                    attempt, max_retries, exc, backoff,
                )
                await asyncio.sleep(backoff)
                backoff *= BACKOFF_MULTIPLIER

    raise LLMExtractionError(
        detail=f"LLM request failed after {max_retries} attempts"
    ) from last_exception
