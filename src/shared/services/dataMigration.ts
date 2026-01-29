import {
  getProfile as getLocalProfile,
  getTemplates as getLocalTemplates,
  getCompanies as getLocalCompanies,
} from '../storage/chromeStorage';
import { saveProfile } from '../repositories/profileRepository';
import { addTemplate } from '../repositories/templateRepository';
import { addCompany } from '../repositories/applicationRepository';
import { DEFAULT_PROFILE } from '../types/profile';

const MIGRATION_KEY = 'supabase_migration_done';

export async function migrateLocalToCloud(): Promise<{ migrated: boolean; counts: { profile: boolean; templates: number; companies: number } }> {
  // 移行済みチェック
  const result = await chrome.storage.local.get(MIGRATION_KEY);
  if (result[MIGRATION_KEY]) {
    return { migrated: false, counts: { profile: false, templates: 0, companies: 0 } };
  }

  const counts = { profile: false, templates: 0, companies: 0 };

  // プロフィール移行
  const localProfile = await getLocalProfile();
  if (localProfile && localProfile.lastName !== DEFAULT_PROFILE.lastName) {
    await saveProfile(localProfile);
    counts.profile = true;
  }

  // テンプレート移行
  const localTemplates = await getLocalTemplates();
  for (const template of localTemplates) {
    await addTemplate(template);
    counts.templates++;
  }

  // 企業移行
  const localCompanies = await getLocalCompanies();
  for (const company of localCompanies) {
    await addCompany(company);
    counts.companies++;
  }

  // 移行完了フラグ
  await chrome.storage.local.set({ [MIGRATION_KEY]: true });

  return { migrated: true, counts };
}
