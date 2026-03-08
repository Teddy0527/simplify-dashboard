import { Profile, Template, Company, Settings, DEFAULT_PROFILE, DEFAULT_SETTINGS } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'profile',
  TEMPLATES: 'templates',
  COMPANIES: 'companies',
  SETTINGS: 'settings',
  AUTOFILL_LOGS: 'autofill_logs',
} as const;

const MAX_AUTOFILL_LOGS = 50;

function isChromeStorageAvailable(): boolean {
  try {
    return typeof chrome !== 'undefined' && !!chrome?.storage?.local;
  } catch {
    return false;
  }
}

async function getItem<T>(key: string, fallback: T): Promise<T> {
  if (isChromeStorageAvailable()) {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? fallback;
  }
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

async function setItem(key: string, value: unknown): Promise<void> {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [key]: value });
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// Profile
export async function getProfile(): Promise<Profile> {
  return getItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
}

export async function saveProfile(profile: Profile): Promise<void> {
  await setItem(STORAGE_KEYS.PROFILE, profile);
}

// Templates
export async function getTemplates(): Promise<Template[]> {
  return getItem(STORAGE_KEYS.TEMPLATES, []);
}

export async function saveTemplates(templates: Template[]): Promise<void> {
  await setItem(STORAGE_KEYS.TEMPLATES, templates);
}

export async function addTemplate(template: Template): Promise<void> {
  const templates = await getTemplates();
  templates.push(template);
  await saveTemplates(templates);
}

export async function updateTemplate(template: Template): Promise<void> {
  const templates = await getTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  if (index !== -1) {
    templates[index] = { ...template, updatedAt: new Date().toISOString() };
    await saveTemplates(templates);
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getTemplates();
  await saveTemplates(templates.filter(t => t.id !== id));
}

// Companies
export async function getCompanies(): Promise<Company[]> {
  const companies = await getItem<Company[]>(STORAGE_KEYS.COMPANIES, []);
  return companies.map(c => ({ ...c, deadlines: c.deadlines ?? [] }));
}

export async function saveCompanies(companies: Company[]): Promise<void> {
  await setItem(STORAGE_KEYS.COMPANIES, companies);
}

export async function addCompany(company: Company): Promise<void> {
  const companies = await getCompanies();
  companies.push(company);
  await saveCompanies(companies);
}

export async function updateCompany(company: Company): Promise<void> {
  const companies = await getCompanies();
  const index = companies.findIndex(c => c.id === company.id);
  if (index !== -1) {
    companies[index] = { ...company, updatedAt: new Date().toISOString() };
    await saveCompanies(companies);
  }
}

export async function deleteCompany(id: string): Promise<void> {
  const companies = await getCompanies();
  await saveCompanies(companies.filter(c => c.id !== id));
}

// Settings
export async function getSettings(): Promise<Settings> {
  return getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setItem(STORAGE_KEYS.SETTINGS, settings);
}

// Autofill Logs
export async function getAutofillLogs(): Promise<unknown[]> {
  return getItem(STORAGE_KEYS.AUTOFILL_LOGS, []);
}

export async function saveAutofillLog(log: unknown): Promise<void> {
  const logs = await getAutofillLogs();
  logs.push(log);
  // 古いログを削除して最大件数を維持
  while (logs.length > MAX_AUTOFILL_LOGS) {
    logs.shift();
  }
  await setItem(STORAGE_KEYS.AUTOFILL_LOGS, logs);
}

export async function exportAutofillLogs(): Promise<string> {
  const logs = await getAutofillLogs();
  return JSON.stringify(logs, null, 2);
}

// Export all data (for backup)
export async function exportAllData(): Promise<string> {
  const [profile, templates, companies, settings] = await Promise.all([
    getProfile(),
    getTemplates(),
    getCompanies(),
    getSettings(),
  ]);
  return JSON.stringify({ profile, templates, companies, settings }, null, 2);
}

// Import all data (from backup)
export async function importAllData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  await Promise.all([
    data.profile && saveProfile(data.profile),
    data.templates && saveTemplates(data.templates),
    data.companies && saveCompanies(data.companies),
    data.settings && saveSettings(data.settings),
  ]);
}
