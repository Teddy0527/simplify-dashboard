export interface CompanyPromotionRequest {
  id: string;
  corporateNumber: string;
  name: string;
  nameKana?: string;
  address?: string;
  prefectureName?: string;
  cityName?: string;
  industry?: string;
  websiteUrl?: string;
  websiteDomain?: string;
  recruitUrl?: string;
  requestCount: number;
  status: 'pending' | 'approved' | 'rejected';
  promotedMasterId?: string;
  createdAt: string;
  updatedAt: string;
}
