import { useState } from 'react';

/**
 * Custom hook to manage localStorage with an optional Time-To-Live (TTL).
 * @param {string} key - The key to store in localStorage.
 * @param {any} initialValue - The initial value if nothing is stored or if expired.
 * @param {number} ttlMs - (Optional) Time-To-Live in milliseconds. Defaults to 6 hours (21600000ms).
 */
export function useLocalStorageWithTTL(key, initialValue, ttlMs = 21600000) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsedItem = JSON.parse(item);
      const now = new Date().getTime();

      // Check if item has expired
      if (parsedItem.expiry && now > parsedItem.expiry) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      return parsedItem.value;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const now = new Date().getTime();
      const item = {
        value: valueToStore,
        expiry: now + ttlMs,
      };

      window.localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}
