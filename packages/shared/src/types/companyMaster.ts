/**
 * 企業マスターデータの型定義
 */

/**
 * 企業マスターテーブルの型
 */
export interface CompanyMaster {
  id: string;
  corporateNumber?: string;
  name: string;
  nameKana?: string;
  industry?: string;
  employeeCount?: number;
  websiteUrl?: string;
  websiteDomain?: string;
  logoUrl?: string;
  mypageUrl?: string;
  recruitUrl?: string;
  isPopular: boolean;
  popularityRank?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 検索結果の型（RPC関数の戻り値）
 */
export interface CompanySearchResult {
  id: string;
  name: string;
  nameKana?: string;
  industry?: string;
  logoUrl?: string;
  websiteUrl?: string;
  websiteDomain?: string;
  mypageUrl?: string;
  recruitUrl?: string;
  isPopular: boolean;
  similarityScore: number;
}

/**
 * Supabase RPC関数の戻り値（snake_case）
 */
export interface CompanySearchResultRow {
  id: string;
  name: string;
  name_kana: string | null;
  industry: string | null;
  logo_url: string | null;
  website_url: string | null;
  website_domain: string | null;
  mypage_url: string | null;
  recruit_url: string | null;
  is_popular: boolean;
  similarity_score: number;
}

/**
 * snake_case → camelCase 変換
 */
export function toCompanySearchResult(row: CompanySearchResultRow): CompanySearchResult {
  return {
    id: row.id,
    name: row.name,
    nameKana: row.name_kana ?? undefined,
    industry: row.industry ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    websiteDomain: row.website_domain ?? undefined,
    mypageUrl: row.mypage_url ?? undefined,
    recruitUrl: row.recruit_url ?? undefined,
    isPopular: row.is_popular,
    similarityScore: row.similarity_score,
  };
}
