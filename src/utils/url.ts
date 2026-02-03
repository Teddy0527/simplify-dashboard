export function parseUrlSafe(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    if (value.startsWith('//')) {
      try {
        return new URL(`https:${value}`);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function extractHostname(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  const parsed = parseUrlSafe(withScheme);
  return parsed ? parsed.hostname : null;
}

export function normalizeWebsiteDomain(value?: string): string | undefined {
  const hostname = extractHostname(value);
  return hostname ?? undefined;
}
