import { getSupabase, isAuthenticated, getCurrentUser } from '../lib/supabase';
import {
  getCompanies as getLocalCompanies,
  saveCompanies as saveLocalCompanies,
} from '../storage/chromeStorage';
import type { Company } from '../types/company';
import { dbToCompany } from '../types/database';
import { contributeDeadlineSignal } from './deadlineContributionRepository';
import { getCurrentRecruitmentYear } from '../utils/recruitmentYear';
import { trackEventAsync } from './eventRepository';

/**
 * Emit deadline signals for a company's non-preset deadlines.
 * Fire-and-forget with structured error logging.
 */
async function emitDeadlineSignals(company: Company): Promise<void> {
  if (!company.companyMasterId || !company.deadlines) return;
  const year = getCurrentRecruitmentYear();

  for (const d of company.deadlines) {
    if (d.isPreset || !d.date) continue;
    try {
      await contributeDeadlineSignal(
        company.companyMasterId, year, d.type, d.label, d.date, d.time
      );
    } catch (err) {
      console.error('[SignalEmission] Failed:', {
        companyMasterId: company.companyMasterId,
        deadlineType: d.type,
        label: d.label,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export async function getCompanies(): Promise<Company[]> {
  if (!(await isAuthenticated())) {
    return getLocalCompanies();
  }

  const user = await getCurrentUser();
  if (!user) return getLocalCompanies();

  const { data: companiesData, error: companiesError } = await getSupabase()
    .from('companies')
    .select('*')
    .eq('user_id', user.id);

  if (companiesError) {
    throw new Error(`Failed to get companies: ${companiesError.message}`);
  }

  const { data: applicationsData, error: applicationsError } = await getSupabase()
    .from('applications')
    .select('*')
    .eq('user_id', user.id);

  if (applicationsError) {
    throw new Error(`Failed to get applications: ${applicationsError.message}`);
  }

  const appMap = new Map(applicationsData?.map((a) => [a.company_id, a]) ?? []);

  return (companiesData ?? [])
    .filter((c) => appMap.has(c.id))
    .map((c) => dbToCompany(c, appMap.get(c.id)!));
}

export async function addCompany(company: Company): Promise<void> {
  if (!(await isAuthenticated())) {
    const companies = await getLocalCompanies();
    companies.push(company);
    return saveLocalCompanies(companies);
  }

  const user = await getCurrentUser();
  if (!user) return;

  const supabase = getSupabase();

  // companiesテーブルに挿入
  const { data: companyRow, error: companyError } = await supabase
    .from('companies')
    .insert({
      id: company.id,
      user_id: user.id,
      name: company.name,
      industry: company.industry ?? null,
      login_url: company.loginUrl ?? null,
      login_password: company.loginPassword ?? null,
      my_page_id: company.myPageId ?? null,
      logo_url: company.logoUrl ?? null,
      website_domain: company.websiteDomain ?? null,
      recruit_url: company.recruitUrl ?? null,
      company_master_id: company.companyMasterId ?? null,
      corporate_number: company.corporateNumber ?? null,
    })
    .select()
    .single();

  if (companyError) {
    throw new Error(`Failed to add company: ${companyError.message}`);
  }

  // applicationsテーブルに挿入
  const { error: appError } = await supabase.from('applications').insert({
    user_id: user.id,
    company_id: companyRow.id,
    status: company.status,
    stages: company.stages as any,
    deadlines: (company.deadlines ?? []) as any,
    memo: company.memo ?? null,
  });

  if (appError) {
    throw new Error(`Failed to add application: ${appError.message}`);
  }

  trackEventAsync('company.create', { companyId: company.id, name: company.name });

  // NTA企業の場合、プロモーション申請を自動送信（fire-and-forget）
  if (company.corporateNumber) {
    import('./companyPromotionRepository')
      .then(({ submitCompanyPromotion }) =>
        submitCompanyPromotion(company.corporateNumber!, company.name)
      )
      .catch(() => {});
  }
}

export async function updateCompany(company: Company): Promise<void> {
  if (!(await isAuthenticated())) {
    const companies = await getLocalCompanies();
    const index = companies.findIndex((c) => c.id === company.id);
    if (index !== -1) {
      companies[index] = { ...company, updatedAt: new Date().toISOString() };
      return saveLocalCompanies(companies);
    }
    return;
  }

  const user = await getCurrentUser();
  if (!user) return;

  const supabase = getSupabase();

  // companiesテーブルを更新
  await supabase
    .from('companies')
    .update({
      name: company.name,
      industry: company.industry ?? null,
      login_url: company.loginUrl ?? null,
      login_password: company.loginPassword ?? null,
      my_page_id: company.myPageId ?? null,
      logo_url: company.logoUrl ?? null,
      website_domain: company.websiteDomain ?? null,
      recruit_url: company.recruitUrl ?? null,
      company_master_id: company.companyMasterId ?? null,
      corporate_number: company.corporateNumber ?? null,
    })
    .eq('id', company.id);

  // applicationsテーブルを更新
  await supabase
    .from('applications')
    .update({
      status: company.status,
      stages: company.stages as any,
      deadlines: (company.deadlines ?? []) as any,
      memo: company.memo ?? null,
    })
    .eq('company_id', company.id)
    .eq('user_id', user.id);

  // Emit deadline signals (fire-and-forget)
  emitDeadlineSignals(company).catch(() => {});

  trackEventAsync('company.update', { companyId: company.id });
}

export async function deleteCompany(id: string): Promise<void> {
  if (!(await isAuthenticated())) {
    const companies = await getLocalCompanies();
    return saveLocalCompanies(companies.filter((c) => c.id !== id));
  }

  // applicationsはON DELETE CASCADEで自動削除
  const { error } = await getSupabase()
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete company: ${error.message}`);
  }

  trackEventAsync('company.delete', { companyId: id });
}
