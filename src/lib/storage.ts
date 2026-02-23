/**
 * LocalStorage abstraction layer with error handling
 * Provides safe storage operations for GitHub Pages deployment
 */

export const STORAGE_KEYS = {
  INTAKE_HISTORY: 'pehriod_intake_history',
  PAIN_LEVEL: 'pehriod_current_pain',
  LANGUAGE: 'pehriod_language',
  ONBOARDING_COMPLETE: 'pehriod_onboarded',
} as const;

/**
 * Safely get an item from localStorage
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return defaultValue;
    }
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safely set an item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

/**
 * Remove an item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
}

/**
 * Clear all pehriod data from localStorage
 */
export function clearAllStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Check if localStorage is available and working
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}
