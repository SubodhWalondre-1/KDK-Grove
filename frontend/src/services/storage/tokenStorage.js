/**
 * Storage service for auth tokens, profile IDs, and user session cache.
 */
import { APP_CONFIG } from '../../config/appConfig';

const TOKEN_KEY = APP_CONFIG.storageKeys.token;
const USER_KEY = APP_CONFIG.storageKeys.user;
const ACTIVE_PROFILE_KEY = APP_CONFIG.storageKeys.activeProfileId;

export const tokenStorage = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  },

  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (err) {
      console.error('Error saving token', err);
    }
  },

  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      console.error('Error removing token', err);
    }
  },

  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (err) {
      console.error('Error saving user', err);
    }
  },

  clearAll: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    } catch (err) {
      console.error('Error clearing storage', err);
    }
  },
};

export default tokenStorage;
