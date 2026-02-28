export * from './profile';
export * from './template';
export * from './company';
export * from './companyMaster';
export * from './deadlinePreset';
export * from './deadlineContribution';
export * from './adminTypes';
export * from './userEvent';
export * from './analyticsTypes';
export * from './companyPromotion';
export * from './companyNameAlias';

export interface StorageData {
  profile: import('./profile').Profile;
  templates: import('./template').Template[];
  companies: import('./company').Company[];
  settings: Settings;
}

export interface Settings {
  autoFillEnabled: boolean;
  showFillIndicator: boolean;
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_SETTINGS: Settings = {
  autoFillEnabled: true,
  showFillIndicator: true,
  theme: 'system',
};
