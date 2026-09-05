/**
 * General helper functions for Mediora.
 */

/**
 * Format date string into human-readable date.
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Capitalize first letter of each word.
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Safe JSON parse with fallback.
 */
export function safeJsonParse(val, fallback = null) {
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

/**
 * Debounce a function call.
 */
export function debounce(fn, delayMs = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Copy text to clipboard safely.
 */
export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * Extract filename from Content-Disposition header with safe fallback.
 */
export function extractFilenameFromDisposition(disposition, fallbackFilename = 'Mediora_Report.pdf') {
  if (!disposition || typeof disposition !== 'string') {
    return fallbackFilename;
  }

  // 1. Check RFC 5987 / RFC 6266 utf-8 format: filename*=UTF-8''encoded_name.pdf
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      const decoded = decodeURIComponent(utf8Match[1].trim());
      if (decoded) return decoded.replace(/[/\\]/g, '');
    } catch {
      return utf8Match[1].trim().replace(/[/\\]/g, '');
    }
  }

  // 2. Standard filename="name.pdf" or filename=name.pdf
  const standardMatch = disposition.match(/filename=["']?([^"';\n]+)["']?/i);
  if (standardMatch && standardMatch[1]) {
    const clean = standardMatch[1].trim().replace(/['"]/g, '').replace(/[/\\]/g, '');
    if (clean) return clean;
  }

  return fallbackFilename;
}

/**
 * Download a binary Blob to the user's browser and revoke the temporary object URL.
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Parse download error response into user-friendly message without exposing stack traces.
 */
export async function getDownloadErrorMessage(error) {
  if (error?.response) {
    const status = error.response.status;

    // When responseType is 'blob', error data is often returned as a Blob
    if (error.response.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const parsed = JSON.parse(text);
        if (parsed?.detail && typeof parsed.detail === 'string') {
          return parsed.detail;
        }
      } catch {
        // Response is not a JSON blob, proceed to status code mapping
      }
    } else if (error.response.data?.detail && typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }

    switch (status) {
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You are not authorized to download this report.';
      case 404:
        return 'Report not found.';
      case 422:
        return 'Unable to generate protected PDF due to missing profile information (name or birth date).';
      case 500:
        return 'Failed to generate secure PDF on the server. Please try again.';
      default:
        return `Failed to download report (HTTP ${status}).`;
    }
  }

  if (error?.request) {
    return 'Network error. Please check your connection and retry.';
  }

  return error?.message || 'An unexpected error occurred while downloading the report.';
}

