from src.core.constants import (
    DEVICE_TYPE_DESKTOP,
    DEVICE_TYPE_MOBILE,
    DEVICE_TYPE_TABLET,
    DEVICE_TYPE_UNKNOWN,
)


def parse_device_type(user_agent: str | None) -> str:
    """Parse a User-Agent header string into desktop, mobile, tablet, or unknown using a lightweight heuristic.

    Avoids external user-agent parsing dependencies for notification badge device tagging.
    Tablet checks precede mobile checks because some Android tablet User-Agents contain 'Android'
    without 'Mobile'.
    """
    if not user_agent or not user_agent.strip():
        return DEVICE_TYPE_UNKNOWN

    ua_lower = user_agent.lower()

    if "ipad" in ua_lower or "tablet" in ua_lower:
        return DEVICE_TYPE_TABLET

    if "mobi" in ua_lower or "android" in ua_lower:
        return DEVICE_TYPE_MOBILE

    return DEVICE_TYPE_DESKTOP
