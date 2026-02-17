import type { JobSite } from '../types/jobSite';

const IMPORTANT_KEYWORDS = [
  '面接', '面談', '日程', '選考のご案内',
  '締切', '期限', '提出', 'エントリーシート',
  '選考結果', '合格', '内定', '合否',
];

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildFromQuery(domains: string[]): string {
  return domains.map((d) => `from:${d}`).join(' OR ');
}

export function generateGmailFilterXml(sites: JobSite[]): string {
  const sitesWithDomains = sites.filter((s) => s.emailDomains.length > 0);
  if (sitesWithDomains.length === 0) return '';

  const entries: string[] = [];

  // Per-site label filters
  for (const site of sitesWithDomains) {
    const fromQuery = buildFromQuery(site.emailDomains);
    entries.push(`    <entry>
      <category term="filter"/>
      <title>Mail Filter</title>
      <apps:property name="from" value="${xmlEscape(fromQuery)}"/>
      <apps:property name="label" value="就活サイト/${xmlEscape(site.name)}"/>
      <apps:property name="shouldNeverSpam" value="true"/>
    </entry>`);
  }

  // Important mail filter (all domains + keywords)
  const allDomains = sitesWithDomains.flatMap((s) => s.emailDomains);
  const fromPart = allDomains.map((d) => `from:${d}`).join(' OR ');
  const keywordPart = IMPORTANT_KEYWORDS.map((k) => `subject:${k}`).join(' OR ');
  const importantQuery = `(${fromPart}) (${keywordPart})`;

  entries.push(`    <entry>
      <category term="filter"/>
      <title>Mail Filter</title>
      <apps:property name="hasTheWord" value="${xmlEscape(importantQuery)}"/>
      <apps:property name="label" value="就活サイト/★重要"/>
      <apps:property name="shouldStar" value="true"/>
      <apps:property name="shouldNeverSpam" value="true"/>
    </entry>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:apps="http://schemas.google.com/apps/2006">
    <title>Mail Filters</title>
${entries.join('\n')}
</feed>`;
}

export function downloadGmailFilterXml(sites: JobSite[]): void {
  const xml = generateGmailFilterXml(sites);
  if (!xml) return;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gmail-filters-shukatsu.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
