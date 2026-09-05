/**
 * Environment configuration for Mediora frontend.
 * Safely accesses Vite import.meta.env with fallback defaults.
 */
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || '',
  MODE: import.meta.env.MODE || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};

export default ENV;
