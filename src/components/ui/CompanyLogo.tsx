import { useState, useMemo, useEffect } from 'react';
import { extractHostname, parseUrlSafe } from '../../utils/url';

interface CompanyLogoProps {
  name: string;
  logoUrl?: string;
  websiteDomain?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-9 h-9',
  lg: 'w-10 h-10',
} as const;

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const;

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function getDuckDuckGoIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

function getClearbitLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${encodeURIComponent(domain)}`;
}

function getDirectFaviconUrl(domain: string): string {
  return `https://${domain}/favicon.ico`;
}

function buildDomainVariants(domain: string): string[] {
  const normalized = domain.toLowerCase();
  const variants = new Set<string>();
  variants.add(normalized);

  if (normalized.startsWith('www.')) {
    variants.add(normalized.slice(4));
  } else {
    variants.add(`www.${normalized}`);
  }

  return Array.from(variants);
}

function buildFaviconSources(domain: string): string[] {
  return [
    getFaviconUrl(domain),
    getDuckDuckGoIconUrl(domain),
    getClearbitLogoUrl(domain),
    getDirectFaviconUrl(domain),
  ];
}

function normalizeLogoUrl(logoUrl?: string): string | null {
  if (!logoUrl) return null;
  const trimmed = logoUrl.trim();
  if (!trimmed) return null;

  const parsed = parseUrlSafe(trimmed);
  if (!parsed) return trimmed;

  const hostname = parsed.hostname.toLowerCase();
  const isGstaticFaviconV2 =
    hostname.endsWith('gstatic.com') && parsed.pathname.includes('faviconV2');

  if (!isGstaticFaviconV2) return trimmed;

  const targetUrl = parsed.searchParams.get('url');
  const targetHost = extractHostname(targetUrl ?? undefined);
  if (!targetHost) return null;

  return getFaviconUrl(targetHost);
}

/**
 * 企業名から背景色を生成（一貫性のあるカラー）
 */
function getInitialColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * 企業ロゴコンポーネント
 *
 * フォールバックチェーン:
 * 1. logoUrl（DB保存済み）
 * 2. Google Favicon API（信頼性重視、sz=128）
 * 3. 首文字カラーバッジ
 */
export function CompanyLogo({
  name,
  logoUrl,
  websiteDomain,
  size = 'md',
  className = '',
}: CompanyLogoProps) {
  const [imageState, setImageState] = useState<'initial' | 'favicon' | 'fallback'>('initial');
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const faviconDomain = useMemo(() => extractHostname(websiteDomain), [websiteDomain]);
  const normalizedLogoUrl = useMemo(() => normalizeLogoUrl(logoUrl), [logoUrl]);

  // ロゴURLの優先順位を計算
  const logoSources = useMemo(() => {
    const sources = new Set<string>();

    // 1. DBに保存されたlogoUrl
    if (normalizedLogoUrl) {
      sources.add(normalizedLogoUrl);
    }

    // 2. Google Favicon API（信頼性重視）
    if (faviconDomain) {
      buildDomainVariants(faviconDomain).forEach((domain) => {
        buildFaviconSources(domain).forEach((url) => sources.add(url));
      });
    }

    return Array.from(sources);
  }, [normalizedLogoUrl, faviconDomain]);

  // logoSourcesが変更されたら初期ソースを設定
  useEffect(() => {
    if (logoSources.length > 0) {
      setCurrentSrc(logoSources[0]);
      setImageState('initial');
    } else {
      setImageState('fallback');
    }
  }, [logoSources]);

  // 画像読み込みエラー時のフォールバック処理
  const handleError = () => {
    const currentIndex = currentSrc ? logoSources.indexOf(currentSrc) : -1;
    const nextIndex = currentIndex + 1;

    if (nextIndex < logoSources.length) {
      setCurrentSrc(logoSources[nextIndex]);
      setImageState('favicon');
    } else {
      setCurrentSrc(null);
      setImageState('fallback');
    }
  };

  // 首文字を取得
  const initial = name.charAt(0).toUpperCase();
  const bgColor = getInitialColor(name);

  // フォールバック表示（首文字バッジ）
  if (imageState === 'fallback' || !currentSrc) {
    return (
      <div
        className={`
          ${sizeClasses[size]}
          ${bgColor}
          rounded-lg
          flex items-center justify-center
          text-white font-semibold
          ${textSizeClasses[size]}
          flex-shrink-0
          ${className}
        `}
        title={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-lg
        overflow-hidden
        bg-gray-100
        flex items-center justify-center
        flex-shrink-0
        ${className}
      `}
      title={name}
    >
      <img
        src={currentSrc}
        alt={`${name} logo`}
        className="w-full h-full object-contain"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}
