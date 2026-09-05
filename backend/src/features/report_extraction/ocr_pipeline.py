import logging

from src.core.exceptions import OCRProcessingError

logger = logging.getLogger(__name__)

# Lazy-loaded — initialized on first call, not at import time.
# This prevents the server from crashing if PaddleOCR dependencies
# aren't fully installed yet (e.g. during early development of other features).
_structure_engine = None
_easyocr_reader = None


def run_ocr(preprocessed_image_path: str) -> str:
    """Run PP-StructureV3 or EasyOCR fallback on a preprocessed image and return the concatenated raw text."""
    global _structure_engine, _easyocr_reader

    # Attempt 1: PaddleOCR PPStructureV3
    try:
        if _structure_engine is None:
            from paddleocr import PPStructureV3
            _structure_engine = PPStructureV3()
        result = _structure_engine.predict(preprocessed_image_path)
        return _flatten_result(result)
    except Exception as paddle_exc:
        logger.info("PPStructureV3 initialization/prediction failed (%s), attempting EasyOCR fallback", paddle_exc)

    # Attempt 2: EasyOCR fallback
    try:
        if _easyocr_reader is None:
            import easyocr
            _easyocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        results = _easyocr_reader.readtext(preprocessed_image_path, detail=0)
        return "\n".join(results)
    except Exception as easy_exc:
        logger.error("EasyOCR fallback also failed: %s", easy_exc)
        raise OCRProcessingError(
            detail=f"OCR processing failed on {preprocessed_image_path}: engine unavailable"
        ) from easy_exc


def _flatten_result(result) -> str:
    lines = []
    for page in result:
        for block in page.get("blocks", []):
            block_type = block.get("type", "")
            if block_type == "table":
                lines.extend(_flatten_table(block))
            else:
                text = block.get("text", "").strip()
                if text:
                    lines.append(text)
    return "\n".join(lines)


def _flatten_table(table_block: dict) -> list[str]:
    rows = []
    html = table_block.get("html", "")
    if html:
        rows.append(html)
        return rows

    cells = table_block.get("cells", [])
    if not cells:
        text = table_block.get("text", "").strip()
        if text:
            rows.append(text)
        return rows

    row_map: dict[int, list[str]] = {}
    for cell in cells:
        row_idx = cell.get("row", 0)
        cell_text = cell.get("text", "").strip()
        row_map.setdefault(row_idx, []).append(cell_text)

    for row_idx in sorted(row_map):
        rows.append(" | ".join(row_map[row_idx]))

    return rows
