import { getSupabase } from '../lib/supabase';
import type { CompanyNameAlias, AliasType } from '../types/companyNameAlias';

export async function getAliasesForCompany(companyMasterId: string): Promise<CompanyNameAlias[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('company_name_aliases')
    .select('*')
    .eq('company_master_id', companyMasterId)
    .order('alias_type')
    .order('alias');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    companyMasterId: row.company_master_id,
    alias: row.alias,
    aliasType: row.alias_type as AliasType,
    createdAt: row.created_at,
  }));
}

export async function addAlias(
  companyMasterId: string,
  alias: string,
  aliasType: AliasType
): Promise<CompanyNameAlias> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('company_name_aliases')
    .insert({ company_master_id: companyMasterId, alias, alias_type: aliasType })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    companyMasterId: data.company_master_id,
    alias: data.alias,
    aliasType: data.alias_type as AliasType,
    createdAt: data.created_at,
  };
}

export async function deleteAlias(aliasId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('company_name_aliases')
    .delete()
    .eq('id', aliasId);

  if (error) throw error;
}
