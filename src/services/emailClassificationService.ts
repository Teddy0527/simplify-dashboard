import type { EmailTier, EmailSubType } from '@jobsimplify/shared';
import { normalizeDomain } from './gmailSyncService';

export const NAV_SITE_DOMAINS = [
  'gaishishukatsu.com',
  'slogan.jp',
  'onecareercloud.jp',
  'mynavi.jp',
  'rikunabi.com',
  'offerbox.jp',
  'openwork.jp',
  'bizreach.jp',
  'type.jp',
  'unistyleinc.com',
  'goodway.co.jp',
  'labbase.jp',
];

export const RECRUITMENT_SYSTEM_DOMAINS = [
  'snar.jp',
  'i-web.jpn.com',
  'mypagemail.jp',
  'mypage-mail.jp',
  'hcs-mailc.jp',
  'r-agent.com',
];

// Keywords for Tier1 sub-type detection
const SELECTION_RESULT_KEYWORDS = ['選考結果', '合否', '通過', 'お祈り', '不合格', '不採用', '合格'];
const SCHEDULING_KEYWORDS = ['面接', '日程', '候補日', '面談', '日時'];
const SUBMISSION_KEYWORDS = ['提出', 'ES', 'エントリーシート', 'Webテスト', 'WEBテスト', 'webテスト', '受験', '適性検査'];
const OFFER_KEYWORDS = ['内定', '承諾', '内々定', 'オファー'];

// Keywords for Tier3 sub-type detection (nav site emails)
const SCOUT_KEYWORDS = ['スカウト', 'オファー', '特別招待', '限定案内'];
const DEADLINE_KEYWORDS = ['締切', '〆切', '期限', 'まもなく終了'];

interface ClassificationInput {
  senderDomain: string;
  subject: string;
}

interface ClassificationContext {
  /** Map of companyId → [companyName, ...aliases] */
  companyNames: Map<string, string[]>;
  /** Set of normalized company domains → companyId */
  companyDomains: Map<string, string>;
}

export interface ClassificationResult {
  tier: EmailTier;
  subType?: EmailSubType;
  matchedCompanyId?: string;
}

function isNavSiteDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  return NAV_SITE_DOMAINS.some((d) => normalizeDomain(d) === normalized);
}

function isRecruitmentSystemDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  return RECRUITMENT_SYSTEM_DOMAINS.some((d) => normalizeDomain(d) === normalized);
}

function matchesCompanyDomain(
  domain: string,
  context: ClassificationContext,
): string | undefined {
  const normalized = normalizeDomain(domain);
  return context.companyDomains.get(normalized);
}

function matchCompanyNameInSubject(
  subject: string,
  context: ClassificationContext,
): string | undefined {
  const normalizedSubject = subject.toLowerCase();
  for (const [companyId, names] of context.companyNames) {
    for (const name of names) {
      // Skip names shorter than 3 characters to avoid false positives
      if (name.length < 3) continue;
      if (normalizedSubject.includes(name.toLowerCase())) {
        return companyId;
      }
    }
  }
  return undefined;
}

function detectTier1SubType(subject: string): EmailSubType | undefined {
  if (SELECTION_RESULT_KEYWORDS.some((kw) => subject.includes(kw))) return 'selection_result';
  if (OFFER_KEYWORDS.some((kw) => subject.includes(kw))) return 'offer';
  if (SCHEDULING_KEYWORDS.some((kw) => subject.includes(kw))) return 'scheduling';
  if (SUBMISSION_KEYWORDS.some((kw) => subject.includes(kw))) return 'submission';
  return undefined;
}

export function classifyEmail(
  input: ClassificationInput,
  context: ClassificationContext,
): ClassificationResult {
  const { senderDomain, subject } = input;

  // Step 1: Check if sender domain matches a registered company
  const domainMatchedCompanyId = matchesCompanyDomain(senderDomain, context);
  if (domainMatchedCompanyId) {
    return classifyCompanyEmail(subject, domainMatchedCompanyId);
  }

  // Step 1b: Check recruitment system domains
  if (isRecruitmentSystemDomain(senderDomain)) {
    const companyId = matchCompanyNameInSubject(subject, context);
    if (companyId) {
      return classifyCompanyEmail(subject, companyId);
    }
    return { tier: 'tier4' };
  }

  // Step 1c: Check nav site domains → Step 2
  if (isNavSiteDomain(senderDomain)) {
    return classifyNavSiteEmail(subject, context);
  }

  // Step 1d: Unknown domain
  return { tier: 'tier4' };
}

/** Step 2: Classify nav site email */
function classifyNavSiteEmail(
  subject: string,
  context: ClassificationContext,
): ClassificationResult {
  // Check if subject contains a registered company name
  const companyId = matchCompanyNameInSubject(subject, context);
  if (companyId) {
    return { tier: 'tier2', matchedCompanyId: companyId };
  }

  // Check for scout/offer keywords
  if (SCOUT_KEYWORDS.some((kw) => subject.includes(kw))) {
    return { tier: 'tier3', subType: 'scout' };
  }

  // Check for deadline keywords
  if (DEADLINE_KEYWORDS.some((kw) => subject.includes(kw))) {
    return { tier: 'tier3', subType: 'deadline_summary' };
  }

  // Everything else from nav sites
  return { tier: 'tier4' };
}

/** Step 3: Classify company-domain or recruitment-system email as Tier1 vs Tier2 */
function classifyCompanyEmail(
  subject: string,
  companyId: string,
): ClassificationResult {
  const subType = detectTier1SubType(subject);
  if (subType) {
    return { tier: 'tier1', subType, matchedCompanyId: companyId };
  }
  return { tier: 'tier2', matchedCompanyId: companyId };
}

/** Build classification context from companies + alias map */
export function buildClassificationContext(
  companies: Array<{ id: string; name: string; websiteDomain?: string; companyMasterId?: string }>,
  aliasMap: Map<string, string[]>,
): ClassificationContext {
  const companyNames = new Map<string, string[]>();
  const companyDomains = new Map<string, string>();

  for (const company of companies) {
    // Build name list: [company.name, ...aliases]
    const names = [company.name];
    if (company.companyMasterId) {
      const aliases = aliasMap.get(company.companyMasterId);
      if (aliases) names.push(...aliases);
    }
    companyNames.set(company.id, names);

    // Build domain → companyId map
    if (company.websiteDomain) {
      companyDomains.set(normalizeDomain(company.websiteDomain), company.id);
    }
  }

  return { companyNames, companyDomains };
}
