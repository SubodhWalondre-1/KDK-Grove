/**
 * Utility functions for clean text formatting across the Mediora frontend.
 */

export function formatTestDisplayName(name) {
  if (!name) return '';

  let clean = String(name).trim();

  // Replace common concatenated OCR section headers
  clean = clean.replace(/^CHEMICAL_EXAMINATION\s*/i, 'Chemical: ');
  clean = clean.replace(/^MICROSCOPIC_EXAMINATION\s*/i, 'Microscopic: ');
  clean = clean.replace(/^PHYSICAL_EXAMINATION\s*/i, 'Physical: ');
  clean = clean.replace(/^URINALYSIS\s*/i, 'Urinalysis: ');
  clean = clean.replace(/^HEMATOLOGY\s*/i, 'Hematology: ');
  clean = clean.replace(/^BIOCHEMISTRY\s*/i, 'Biochemistry: ');

  // Separate CamelCase words (e.g. LeukocyteEsterase -> Leukocyte Esterase)
  clean = clean
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/_/g, ' ');

  // Clean up repeated spaces
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}
