export type AliasType = 'english' | 'abbreviation' | 'nickname' | 'old_name' | 'other';

export interface CompanyNameAlias {
  id: string;
  companyMasterId: string;
  alias: string;
  aliasType: AliasType;
  createdAt: string;
}
