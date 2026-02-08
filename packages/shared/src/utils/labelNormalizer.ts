/**
 * Normalize a deadline label for aggregation.
 * - Trim and remove whitespace
 * - Full-width alphanumeric → half-width
 * - Katakana → Hiragana
 * - Remove parenthetical notes
 * - Lowercase
 */
export function normalizeLabelKey(label: string): string {
  let key = label.trim().replace(/\s+/g, '');
  // Full-width → half-width alphanumeric
  key = key.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
  // Katakana → Hiragana
  key = key.replace(/[\u30A1-\u30F6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
  // Remove parenthetical notes
  key = key.replace(/[（(].*?[）)]/g, '');
  return key.toLowerCase();
}
