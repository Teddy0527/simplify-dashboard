import { memo, useState, useMemo, useEffect } from 'react';
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
  // Googleは高確率で200を返し、レスポンスも軽量
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
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
    // 1. Google Favicon（最も安定、軽量）
    getFaviconUrl(domain),
    // 2. 直接favicon.ico（https）
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
 * 2. Google Favicon（最安定）
 * 3. 直接favicon.ico（https）
 * 4. 首文字カラーバッジ
 */
export const CompanyLogo = memo(function CompanyLogo({
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

  // ロゴURLの候補を計算（ユニーク順序集合）
  const logoSources = useMemo(() => {
    const sources = new Set<string>();

    // 1. DBに保存されたlogoUrl
    if (normalizedLogoUrl) {
      sources.add(normalizedLogoUrl);
    }

    // 2. 各種Favicon API（Google → 直接 https → http）
    if (faviconDomain) {
      buildDomainVariants(faviconDomain).forEach((domain) => {
        buildFaviconSources(domain).forEach((url) => sources.add(url));
      });
    }

    return Array.from(sources);
  }, [normalizedLogoUrl, faviconDomain]);

  // 画像を並列プリフェッチして最初に成功したものを採用
  useEffect(() => {
    if (logoSources.length === 0) {
      setCurrentSrc(null);
      setImageState('fallback');
      return;
    }

    let resolved = false;
    let cancelled = false;
    let remaining = logoSources.length;
    const timers: NodeJS.Timeout[] = [];

    const markFailed = () => {
      remaining -= 1;
      if (!resolved && remaining <= 0 && !cancelled) {
        setCurrentSrc(null);
        setImageState('fallback');
      }
    };

    const loaders = logoSources.map((src) => {
      const img = new Image();
      img.decoding = 'async';

      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        markFailed();
      }, 2000);
      timers.push(timeout);

      img.onload = () => {
        if (cancelled) return;
        if (resolved) {
          clearTimeout(timeout);
          return;
        }

        // 16x16以下は「ほぼデフォルト」判定で次を待つ
        if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
          clearTimeout(timeout);
          markFailed();
          return;
        }

        resolved = true;
        clearTimeout(timeout);
        setCurrentSrc(src);
        setImageState('favicon');
      };

      img.onerror = () => {
        if (cancelled) return;
        clearTimeout(timeout);
        if (!resolved) markFailed();
      };

      img.src = src;
      return img;
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      loaders.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [logoSources]);

  const handleImgError = () => {
    setCurrentSrc(null);
    setImageState('fallback');
  };

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
      handleImgError();
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
        onLoad={handleImgLoad}
        onError={handleImgError}
        loading="lazy"
      />
    </div>
  );
});
