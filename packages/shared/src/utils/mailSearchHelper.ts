import type { JobSite } from '../types/jobSite';

export function getMailSearchQuery(site: JobSite): string {
  if (site.emailDomains.length === 0) return '';
  return site.emailDomains.map((d) => `from:${d}`).join(' OR ');
}

export function getGmailSearchUrl(site: JobSite): string {
  const query = getMailSearchQuery(site);
  if (!query) return '';
  return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`;
}

export function getImportantMailSearchQuery(sites: JobSite[]): string {
  const allDomains = sites.flatMap((s) => s.emailDomains);
  if (allDomains.length === 0) return '';

  const keywords = ['面接', '面談', '締切', '期限', '選考結果', '合格', '内定', '合否'];
  const fromPart = allDomains.map((d) => `from:${d}`).join(' OR ');
  const keywordPart = keywords.map((k) => `subject:${k}`).join(' OR ');
  return `(${fromPart}) (${keywordPart})`;
}
