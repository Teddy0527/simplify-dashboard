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
export { getCurrentRecruitmentYear } from './utils/recruitmentYear';
export { normalizeLabelKey } from './utils/labelNormalizer';
export { getSessionId, isNewSession, getLastActivityTs } from './utils/sessionManager';
export { trackMilestoneOnce, isMilestoneAchieved } from './utils/milestoneTracker';
export { trackEventDebounced } from './utils/trackEventDebounced';

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
  getPresetsByMasterId,
  searchDeadlinePresets,
} from './repositories/deadlinePresetRepository';
export {
  contributeDeadlineSignal,
  getMyContributions,
} from './repositories/deadlineContributionRepository';
export {
  checkIsAdmin,
  getPendingContributionsSummary,
  verifyContribution,
  rejectContributions,
  recalculateContributorCounts,
} from './repositories/adminRepository';
export {
  trackEvent,
  trackEventAsync,
} from './repositories/eventRepository';
export {
  submitFeedback,
  getAllFeedback,
} from './repositories/feedbackRepository';
export type { FeedbackRow } from './repositories/feedbackRepository';
export {
  getUserAnalyticsSummary,
  getUserEventBreakdown,
  getAggregateTrends,
  getEngagementMetrics,
  getRetentionCohorts,
  getActivationFunnel,
  getFeatureAdoption,
  getFeaturePopularity,
  getAARRRMetrics,
  getGA4Metrics,
  getRetentionTrend,
  getUserActivitySummary,
  getExtensionDailyMetrics,
  getUserLoginHistory,
  getUserCompanies,
} from './repositories/analyticsRepository';

export {
  submitCompanyPromotion,
  getPendingPromotions,
  approvePromotion,
  rejectPromotion,
} from './repositories/companyPromotionRepository';

export {
  getAliasesForCompany,
  addAlias,
  deleteAlias,
} from './repositories/companyNameAliasRepository';

// Services
export { migrateLocalToCloud } from './services/dataMigration';
