import { getSupabase } from '../lib/supabase';
import type { CompanyPromotionRequest } from '../types/companyPromotion';

function dbToPromotion(row: any): CompanyPromotionRequest {
  return {
    id: row.id,
    corporateNumber: row.corporate_number,
    name: row.name,
    nameKana: row.name_kana ?? undefined,
    address: row.address ?? undefined,
    prefectureName: row.prefecture_name ?? undefined,
    cityName: row.city_name ?? undefined,
    industry: row.industry ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    websiteDomain: row.website_domain ?? undefined,
    recruitUrl: row.recruit_url ?? undefined,
    requestCount: row.request_count,
    status: row.status,
    promotedMasterId: row.promoted_master_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function submitCompanyPromotion(
  corporateNumber: string,
  name: string,
  nameKana?: string,
  address?: string,
  prefectureName?: string,
  cityName?: string
): Promise<void> {
  const { error } = await getSupabase().rpc('submit_company_promotion', {
    p_corporate_number: corporateNumber,
    p_name: name,
    p_name_kana: nameKana ?? null,
    p_address: address ?? null,
    p_prefecture_name: prefectureName ?? null,
    p_city_name: cityName ?? null,
  });
  if (error) throw new Error(`Failed to submit promotion: ${error.message}`);
}

export async function getPendingPromotions(): Promise<CompanyPromotionRequest[]> {
  const { data, error } = await getSupabase().rpc('get_pending_promotions');
  if (error) throw new Error(`Failed to get promotions: ${error.message}`);
  return (data ?? []).map(dbToPromotion);
}

export async function approvePromotion(
  requestId: string,
  details: {
    industry?: string;
    websiteUrl?: string;
    websiteDomain?: string;
    recruitUrl?: string;
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc('approve_company_promotion', {
    p_request_id: requestId,
    p_industry: details.industry ?? null,
    p_website_url: details.websiteUrl ?? null,
    p_website_domain: details.websiteDomain ?? null,
    p_recruit_url: details.recruitUrl ?? null,
  });
  if (error) throw new Error(`Failed to approve promotion: ${error.message}`);
  return data as string;
}

export async function rejectPromotion(requestId: string): Promise<void> {
  const { error } = await getSupabase().rpc('reject_company_promotion', {
    p_request_id: requestId,
  });
  if (error) throw new Error(`Failed to reject promotion: ${error.message}`);
}
