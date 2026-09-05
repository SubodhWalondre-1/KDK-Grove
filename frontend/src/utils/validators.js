/**
 * Validation utilities for form inputs.
 */

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function isValidPassword(password, minLength = 6) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= minLength;
}

export function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

export function isValidAge(age) {
  const num = Number(age);
  return !isNaN(num) && num > 0 && num < 150;
}
