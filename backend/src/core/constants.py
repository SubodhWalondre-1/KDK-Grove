# --- File upload constraints ---
ALLOWED_UPLOAD_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_UPLOAD_SIZE_MB = 10

# --- LLM retry policy ---
MAX_LLM_RETRY_ATTEMPTS = 3

# --- Report processing statuses ---
REPORT_STATUS_PROCESSING = "processing"
REPORT_STATUS_COMPLETED = "completed"
REPORT_STATUS_FAILED = "failed"

# --- OCR confidence threshold ---
OCR_MIN_CONFIDENCE = 0.6

# --- Species defaults (fallback until F4 lands) ---
DEFAULT_SPECIES_CATEGORY = "human"

# --- F2: Deviation severity thresholds ---
DEVIATION_BORDERLINE_THRESHOLD = 0.15
DEVIATION_MODERATE_THRESHOLD = 0.50

# --- F2: Severity penalty weights ---
SEVERITY_PENALTY_BORDERLINE = 0.3
SEVERITY_PENALTY_MODERATE = 0.6
SEVERITY_PENALTY_SEVERE = 1.0

# --- F2: Health score classification buckets ---
HEALTH_SCORE_EXCELLENT_MIN = 80
HEALTH_SCORE_GOOD_MIN = 60
HEALTH_SCORE_FAIR_MIN = 40

# --- F2: Status color contract (§8 and §17.5) ---
STATUS_GREEN = "green"
STATUS_YELLOW = "yellow"
STATUS_RED = "red"

# --- F2/F6: Featured tests for dashboard trend chart (§3.1) ---
FEATURED_TREND_TESTS = ["Hemoglobin", "Blood Sugar", "Cholesterol"]

# --- F3: Translation constants ---
TRANSLATABLE_SOURCE_TYPES = {
    "test_name",
    "status_label",
    "health_summary",
    "recommendation",
}

SARVAM_TRANSLATE_MODEL = "sarvam-translate:v1"
SARVAM_TRANSLATION_MODE = "formal"
SARVAM_MAX_INPUT_CHARS = 2000
SARVAM_DEFAULT_SOURCE_LANGUAGE = "en-IN"

SARVAM_SUPPORTED_LANGUAGES = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "bn-IN": "Bengali",
    "gu-IN": "Gujarati",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "mr-IN": "Marathi",
    "od-IN": "Odia",
    "pa-IN": "Punjabi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "as-IN": "Assamese",
    "brx-IN": "Bodo",
    "doi-IN": "Dogri",
    "kok-IN": "Konkani",
    "ks-IN": "Kashmiri",
    "mai-IN": "Maithili",
    "mni-IN": "Manipuri",
    "ne-IN": "Nepali",
    "sa-IN": "Sanskrit",
    "sat-IN": "Santali",
    "sd-IN": "Sindhi",
    "ur-IN": "Urdu",
}

SARVAM_REQUEST_TIMEOUT_SECONDS = 30
SARVAM_MAX_RETRIES = 3
SARVAM_RETRY_BACKOFF_SECONDS = 2

TRANSLATION_BATCH_SEPARATOR = "\n<<<TRANSLATION_BREAK>>>\n"
ENABLE_TRANSLATION_CACHE = True
TRANSLATION_CACHE_TTL_SECONDS = 86400
FALLBACK_LANGUAGE = "en-IN"
CHUNK_AT_SENTENCE_BOUNDARY = True

# --- F4: Multi-Species & Profile constants ---
SPECIES_CATEGORIES = ["human", "canine", "feline", "bovine", "avian", "other"]

SPECIES_CATEGORY_DISPLAY_NAMES = {
    "human": "Human",
    "canine": "Dog",
    "feline": "Cat",
    "bovine": "Cow / Cattle",
    "avian": "Bird",
    "other": "Other",
}

SPECIES_TEXT_TO_CATEGORY_MAP = {
    "human": "human",
    "man": "human",
    "woman": "human",
    "person": "human",
    "dog": "canine",
    "puppy": "canine",
    "canine": "canine",
    "cat": "feline",
    "kitten": "feline",
    "feline": "feline",
    "cow": "bovine",
    "cattle": "bovine",
    "buffalo": "bovine",
    "ox": "bovine",
    "bovine": "bovine",
    "bird": "avian",
    "hen": "avian",
    "chicken": "avian",
    "parrot": "avian",
    "avian": "avian",
}

SPECIES_WITH_REFERENCE_DATA = {"human", "dog", "cat"}

# --- F5: AI Recommendations Engine constants ---
SEVERITY_GATE_NORMAL = "normal"
SEVERITY_GATE_MODERATE = "moderate"
SEVERITY_GATE_CRITICAL = "critical"

RECOMMENDATION_CATEGORY_DIET = "diet"
RECOMMENDATION_CATEGORY_FOODS_TO_AVOID = "foods_to_avoid"
RECOMMENDATION_CATEGORY_EXERCISE = "exercise"
RECOMMENDATION_CATEGORY_LIFESTYLE = "lifestyle"
RECOMMENDATION_CATEGORY_URGENT_CARE = "urgent_care"
RECOMMENDATION_CATEGORY_FINDING = "finding"

FINDING_PRIORITY_ATTENTION = "attention"
FINDING_PRIORITY_MONITORING = "monitoring"
FINDING_PRIORITY_NORMAL = "normal"

RECOMMENDATION_LLM_TEMPERATURE = 0.4

URGENT_CARE_MESSAGE = (
    "One or more of your values show a severe deviation from the normal range. "
    "Please consult a doctor or veterinarian as soon as possible. This app does not "
    "replace professional medical advice."
)

# --- F6: Cross-Report Trend Tracking constants ---
TREND_MIN_REPORTS_FOR_TREND = 2
TREND_STABLE_THRESHOLD = 0.05
TREND_SPARKLINE_MAX_POINTS = 6
HEALTH_SCORE_TREND_STABLE_THRESHOLD = 1.0

TREND_DIRECTION_STABLE = "stable"
TREND_DIRECTION_INCREASING = "increasing"
TREND_DIRECTION_DECREASING = "decreasing"
TREND_DIRECTION_INSUFFICIENT_DATA = "insufficient_data"
TREND_DIRECTION_REFERENCE_UNAVAILABLE = "reference_data_unavailable"

# --- F7: Sharing & Audit Log constants ---
SHARE_LINK_TOKEN_BYTES = 32
SHARE_LINK_ALLOWED_EXPIRY_DAYS = {1, 7, 30, 90}
SHARE_LINK_DEFAULT_EXPIRY_DAYS = 7

SHARE_LINK_STATUS_ACTIVE = "active"
SHARE_LINK_STATUS_REVOKED = "revoked"

SHARE_LINK_INVALID_REASON_EXPIRED = "expired"
SHARE_LINK_INVALID_REASON_REVOKED = "revoked"
SHARE_LINK_INVALID_REASON_NOT_FOUND = "not_found"

DEVICE_TYPE_MOBILE = "mobile"
DEVICE_TYPE_TABLET = "tablet"
DEVICE_TYPE_DESKTOP = "desktop"
DEVICE_TYPE_UNKNOWN = "unknown"

NOTIFICATION_RECENT_LOGS_LIMIT = 5

# --- F8: Per-Test Plain-English Explanations constants ---
EXPLANATION_LLM_TEMPERATURE = 0.3
EXPLANATION_MAX_CHAR_LENGTH = 400

EXPLANATION_DIRECTION_HIGH = "high"
EXPLANATION_DIRECTION_LOW = "low"

EXPLANATION_NORMAL_VALUE_MESSAGE = "This value is within the normal range."
EXPLANATION_MISSING_REFERENCE_MESSAGE = (
    "We don't have enough reference data for this value yet to provide an explanation."
)
EXPLANATION_GENERIC_FALLBACK_TEMPLATE = (
    "This value is outside the typical range in the {direction} direction. "
    "Ask your doctor or vet for more detail about what this means for you."
)






