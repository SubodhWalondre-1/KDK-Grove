from fastapi import Request
from fastapi.responses import JSONResponse


class MedioraException(Exception):

    def __init__(self, detail: str = "An unexpected error occurred"):
        self.detail = detail
        super().__init__(self.detail)


# --- Authentication ---

class AuthenticationError(MedioraException):

    def __init__(self, detail: str = "Authentication required"):
        super().__init__(detail)


class InvalidCredentialsError(MedioraException):

    def __init__(self, detail: str = "Invalid email or password"):
        super().__init__(detail)


# --- Resource not found ---

class ProfileNotFoundError(MedioraException):

    def __init__(self, detail: str = "Profile not found"):
        super().__init__(detail)


class ReportNotFoundError(MedioraException):

    def __init__(self, detail: str = "Report not found"):
        super().__init__(detail)


class ShareLinkNotFoundError(MedioraException):

    def __init__(self, detail: str = "Share link not found"):
        super().__init__(detail)


# --- Share link invalid (410 Gone) ---

class ShareLinkInvalidError(MedioraException):

    def __init__(self, reason: str, detail: str = "Share link is no longer valid"):
        self.reason = reason
        super().__init__(detail)


# --- Client input errors ---

class InvalidFileTypeError(MedioraException):

    def __init__(self, detail: str = "Unsupported file type"):
        super().__init__(detail)


class FileTooLargeError(MedioraException):

    def __init__(self, detail: str = "File exceeds maximum allowed size"):
        super().__init__(detail)


class ProtectedReportError(MedioraException):

    def __init__(self, detail: str = "Unable to generate protected report"):
        super().__init__(detail)


# --- Upstream / processing failures ---

class OCRProcessingError(MedioraException):

    def __init__(self, detail: str = "OCR processing failed"):
        super().__init__(detail)


class LLMExtractionError(MedioraException):

    def __init__(self, detail: str = "LLM extraction failed"):
        super().__init__(detail)


class TranslationServiceError(MedioraException):

    def __init__(self, detail: str = "Translation service failed"):
        super().__init__(detail)


# --- FastAPI exception handlers (register via register_exception_handlers in main.py) ---

_NOT_FOUND_EXCEPTIONS = (ProfileNotFoundError, ReportNotFoundError, ShareLinkNotFoundError)
_BAD_REQUEST_EXCEPTIONS = (InvalidFileTypeError, FileTooLargeError, ProtectedReportError)
_UNAUTHORIZED_EXCEPTIONS = (AuthenticationError, InvalidCredentialsError)
_UPSTREAM_EXCEPTIONS = (OCRProcessingError, LLMExtractionError, TranslationServiceError)


def _build_error_response(status_code: int, detail: str, extra: dict | None = None) -> JSONResponse:
    content = {"detail": detail}
    if extra:
        content.update(extra)
    return JSONResponse(status_code=status_code, content=content)


def register_exception_handlers(app):
    """Attach Mediora exception handlers to a FastAPI app instance."""

    for exc_class in _NOT_FOUND_EXCEPTIONS:
        app.add_exception_handler(
            exc_class,
            lambda req, exc: _build_error_response(404, exc.detail),
        )

    for exc_class in _BAD_REQUEST_EXCEPTIONS:
        app.add_exception_handler(
            exc_class,
            lambda req, exc: _build_error_response(400, exc.detail),
        )

    for exc_class in _UNAUTHORIZED_EXCEPTIONS:
        app.add_exception_handler(
            exc_class,
            lambda req, exc: _build_error_response(401, exc.detail),
        )

    for exc_class in _UPSTREAM_EXCEPTIONS:
        app.add_exception_handler(
            exc_class,
            lambda req, exc: _build_error_response(502, exc.detail),
        )

    app.add_exception_handler(
        ShareLinkInvalidError,
        lambda req, exc: _build_error_response(410, exc.detail, {"reason": exc.reason}),
    )
