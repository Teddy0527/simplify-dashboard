// Types
export * from './types';

// Lib
export { getSupabase, isAuthenticated, getCurrentUser, getSession } from './lib/supabase';

// Utils
export {
  hiraganaToKatakana,
  katakanaToHiragana,
  formatPhoneNumber,
  formatPostalCode,
  formatDate,
  toJapaneseEra,
  toHalfWidth,
  toFullWidth,
} from './utils/formatters';

// Constants
export { FIELD_MATCHERS, SKIP_PATTERNS, shouldSkipField, findMatchingField } from './constants/fieldMatchers';
export type { FieldMatcher } from './constants/fieldMatchers';

// Storage
export {
  getProfile as getLocalProfile,
  saveProfile as saveLocalProfile,
  getTemplates as getLocalTemplates,
  saveTemplates as saveLocalTemplates,
  addTemplate as addLocalTemplate,
  updateTemplate as updateLocalTemplate,
  deleteTemplate as deleteLocalTemplate,
  getCompanies as getLocalCompanies,
  saveCompanies as saveLocalCompanies,
  addCompany as addLocalCompany,
  updateCompany as updateLocalCompany,
  deleteCompany as deleteLocalCompany,
  getEntrySheets as getLocalEntrySheets,
  saveEntrySheets as saveLocalEntrySheets,
  addEntrySheet as addLocalEntrySheet,
  updateEntrySheet as updateLocalEntrySheet,
  deleteEntrySheet as deleteLocalEntrySheet,
  getSettings,
  saveSettings,
  exportAllData,
  importAllData,
  getAutofillLogs,
  saveAutofillLog,
  exportAutofillLogs,
} from './storage/chromeStorage';
export { getStorageAdapter } from './storage/storageAdapter';
export type { StorageAdapter } from './storage/storageAdapter';

// Repositories
export {
  getProfile,
  saveProfile,
} from './repositories/profileRepository';
export {
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
} from './repositories/templateRepository';
export {
  getCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
} from './repositories/applicationRepository';
export {
  getEntrySheets,
  getEntrySheet,
  addEntrySheet,
  updateEntrySheet,
  deleteEntrySheet,
  addESQuestion,
  updateESQuestion,
  deleteESQuestion,
  reorderESQuestions,
} from './repositories/entrySheetRepository';

// Services
export { migrateLocalToCloud } from './services/dataMigration';
