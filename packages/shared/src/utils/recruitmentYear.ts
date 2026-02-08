/**
 * Get the current recruitment year.
 * Japanese recruitment years run March to February:
 * - Mar 2025 ~ Feb 2026 → 2027卒
 * The year = current calendar year + 2 if month >= 3, else current calendar year + 1
 * Actually for 就活: if you're in March 2025, you're working on 2027卒 (graduating March 2027)
 * Simplified: recruitment_year = current_year + 2 if month >= 3, else current_year + 1
 */
export function getCurrentRecruitmentYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-based
  const year = now.getFullYear();
  return month >= 3 ? year + 2 : year + 1;
}
