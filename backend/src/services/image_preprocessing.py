import cv2
import numpy as np

from src.core.exceptions import OCRProcessingError


def preprocess_image(input_path: str, output_path: str) -> str:
    """Read, deskew, denoise, and CLAHE-enhance an image for OCR. Returns output_path."""
    image = cv2.imread(input_path)
    if image is None:
        raise OCRProcessingError(
            detail=f"Failed to read image at {input_path} — file may be corrupt or unreadable"
        )

    grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    deskewed = _deskew(grayscale)
    denoised = cv2.fastNlMeansDenoising(deskewed, h=10)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    cv2.imwrite(output_path, enhanced)
    return output_path


def _deskew(grayscale_image: np.ndarray) -> np.ndarray:
    _, binary = cv2.threshold(grayscale_image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return grayscale_image

    all_points = np.concatenate(contours)
    rect = cv2.minAreaRect(all_points)
    angle = rect[-1]

    if angle < -45:
        angle = 90 + angle
    elif angle > 45:
        angle = angle - 90

    if abs(angle) < 0.5:
        return grayscale_image

    height, width = grayscale_image.shape
    center = (width // 2, height // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        grayscale_image,
        rotation_matrix,
        (width, height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )
    return rotated
