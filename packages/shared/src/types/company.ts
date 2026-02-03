export interface Company {
  id: string;
  name: string;
  industry?: string;
  status: SelectionStatus;
  stages: SelectionStage[];
  deadline?: string;
  memo?: string;
  loginUrl?: string;
  loginPassword?: string;
  logoUrl?: string;
  websiteDomain?: string;
  recruitUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type SelectionStatus =
  | 'interested'      // 興味あり
  | 'applied'         // エントリー済
  | 'es_submitted'    // ES提出済
  | 'webtest'         // Webテスト
  | 'gd'              // グループディスカッション
  | 'interview_1'     // 1次面接
  | 'interview_2'     // 2次面接
  | 'interview_3'     // 3次面接
  | 'interview_final' // 最終面接
  | 'offer'           // 内定
  | 'rejected'        // 不合格
  | 'declined';       // 辞退

export interface SelectionStage {
  type: SelectionStatus;
  date?: string;
  result?: 'pending' | 'passed' | 'failed';
  memo?: string;
}

export const STATUS_LABELS: Record<SelectionStatus, string> = {
  interested: '興味あり',
  applied: 'エントリー済',
  es_submitted: 'ES提出済',
  webtest: 'Webテスト',
  gd: 'GD',
  interview_1: '1次面接',
  interview_2: '2次面接',
  interview_3: '3次面接',
  interview_final: '最終面接',
  offer: '内定',
  rejected: '不合格',
  declined: '辞退',
};

export const INDUSTRY_OPTIONS = [
  'IT・通信',
  'メーカー（電機・機械）',
  'メーカー（素材・化学）',
  'メーカー（食品・日用品）',
  '金融（銀行・証券）',
  '金融（保険）',
  'コンサルティング',
  '商社（総合）',
  '商社（専門）',
  '広告・メディア',
  'エンタメ・ゲーム',
  '不動産・建設',
  'インフラ（電力・ガス・鉄道）',
  '物流・運輸',
  '小売・流通',
  '人材・教育',
  '医療・ヘルスケア',
  '官公庁・公社・団体',
  'その他',
] as const;

export function createCompany(name: string): Company {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    status: 'interested',
    stages: [],
    createdAt: now,
    updatedAt: now,
  };
}
