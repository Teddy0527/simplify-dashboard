import { Profile, Template, Company, Settings, DEFAULT_PROFILE, DEFAULT_SETTINGS } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'profile',
  TEMPLATES: 'templates',
  COMPANIES: 'companies',
  SETTINGS: 'settings',
} as const;

// Profile
export async function getProfile(): Promise<Profile> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PROFILE);
  return result[STORAGE_KEYS.PROFILE] || DEFAULT_PROFILE;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PROFILE]: profile });
}

// Templates
export async function getTemplates(): Promise<Template[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TEMPLATES);
  return result[STORAGE_KEYS.TEMPLATES] || [];
}

export async function saveTemplates(templates: Template[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });
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
  const result = await chrome.storage.local.get(STORAGE_KEYS.COMPANIES);
  return result[STORAGE_KEYS.COMPANIES] || [];
}

export async function saveCompanies(companies: Company[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.COMPANIES]: companies });
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
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
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
