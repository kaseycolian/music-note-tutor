import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {

  /**
   * Save data to localStorage with error handling
   */
  save<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to save data to localStorage for key: ${key}`, error);
    }
  }

  /**
   * Load data from localStorage with type safety
   */
  load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to load data from localStorage for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  clear(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear data from localStorage for key: ${key}`, error);
    }
  }

  /**
   * Check if a key exists in localStorage
   */
  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys from localStorage with a specific prefix
   */
  getKeysWithPrefix(prefix: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Clear all data from localStorage
   */
  clearAll(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear all localStorage data', error);
    }
  }

  /**
   * Get the size of localStorage in bytes (approximate)
   */
  getStorageSize(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }
}
