import { Company } from '../types';

const STORAGE_KEY = 'simplify_companies';

interface StorageAdapter {
  getCompanies(): Promise<Company[]>;
  setCompanies(companies: Company[]): Promise<void>;
}

function isChromeStorageAvailable(): boolean {
  try {
    return typeof chrome !== 'undefined' && !!chrome?.storage?.local;
  } catch {
    return false;
  }
}

const chromeStorageAdapter: StorageAdapter = {
  async getCompanies() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] ?? [];
  },
  async setCompanies(companies) {
    await chrome.storage.local.set({ [STORAGE_KEY]: companies });
  },
};

const localStorageAdapter: StorageAdapter = {
  async getCompanies() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },
  async setCompanies(companies) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  },
};

export function getStorageAdapter(): StorageAdapter {
  return isChromeStorageAvailable() ? chromeStorageAdapter : localStorageAdapter;
}

export type { StorageAdapter };
