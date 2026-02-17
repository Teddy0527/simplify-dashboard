export type JobSiteCategory = 'navi' | 'scout' | 'agent' | 'company_hp' | 'career_center' | 'other';
export type JobSitePriority = 'high' | 'medium' | 'low';

export const JOB_SITE_CATEGORY_LABELS: Record<JobSiteCategory, string> = {
  navi: 'ナビサイト',
  scout: 'スカウト',
  agent: 'エージェント',
  company_hp: '企業HP',
  career_center: 'キャリアセンター',
  other: 'その他',
};

export const JOB_SITE_PRIORITY_LABELS: Record<JobSitePriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export interface JobSite {
  id: string;
  name: string;
  url?: string;
  emailDomains: string[];
  memo?: string;
  loginId?: string;
  category: JobSiteCategory;
  priority: JobSitePriority;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function createJobSite(partial: Partial<JobSite> & { name: string }): JobSite {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    emailDomains: [],
    category: 'other',
    priority: 'medium',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export interface JobSitePreset {
  name: string;
  url: string;
  emailDomains: string[];
  category: JobSiteCategory;
}

export const JOB_SITE_PRESETS: readonly JobSitePreset[] = [
  { name: 'マイナビ', url: 'https://job.mynavi.jp', emailDomains: ['@mynavi.jp', '@snar.jp'], category: 'navi' },
  { name: 'リクナビ', url: 'https://job.rikunabi.com', emailDomains: ['@rikunabi.com', '@r-agent.com'], category: 'navi' },
  { name: 'ワンキャリア', url: 'https://www.onecareer.jp', emailDomains: ['@onecareer.jp'], category: 'navi' },
  { name: 'OfferBox', url: 'https://offerbox.jp', emailDomains: ['@offerbox.jp'], category: 'scout' },
  { name: '外資就活', url: 'https://gaishishukatsu.com', emailDomains: ['@gaishishukatsu.com'], category: 'navi' },
  { name: 'Goodfind', url: 'https://www.goodfind.jp', emailDomains: ['@goodfind.jp'], category: 'scout' },
  { name: 'dodaキャンパス', url: 'https://campus.doda.jp', emailDomains: ['@doda-campus.jp'], category: 'scout' },
  { name: 'キャリタス就活', url: 'https://job.career-tasu.jp', emailDomains: ['@career-tasu.jp'], category: 'navi' },
] as const;
