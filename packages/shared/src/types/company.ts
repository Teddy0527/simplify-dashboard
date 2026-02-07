export type DeadlineType =
  | 'es_submission' | 'internship' | 'webtest' | 'interview'
  | 'offer_response' | 'document' | 'event' | 'other';

export interface CompanyDeadline {
  id: string;
  type: DeadlineType;
  label: string;
  date: string;         // YYYY-MM-DD
  time?: string;        // HH:mm（24h）
  memo?: string;
  createdAt: string;
}

export const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  es_submission: 'ES提出',
  internship: 'インターン',
  webtest: 'Webテスト',
  interview: '面接',
  offer_response: '内定承諾',
  document: '書類提出',
  event: '説明会・イベント',
  other: 'その他',
};

export function createDeadline(type: DeadlineType, label: string, date: string, time?: string, memo?: string): CompanyDeadline {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    date,
    time: time || undefined,
    memo: memo || undefined,
    createdAt: new Date().toISOString(),
  };
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  status: SelectionStatus;
  stages: SelectionStage[];
  deadline?: string;
  deadlines?: CompanyDeadline[];
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

const INDUSTRY_MAPPING: [string[], string][] = [
  [['保険'], '金融（保険）'],
  [['金融'], '金融（銀行・証券）'],
  [['総合商社'], '商社（総合）'],
  [['専門商社'], '商社（専門）'],
  [['コンサル', 'シンクタンク'], 'コンサルティング'],
  [['製薬', '医療', 'ヘルス'], '医療・ヘルスケア'],
  [['食品', '飲料', '消費財', 'たばこ'], 'メーカー（食品・日用品）'],
  [['化学', '素材', '繊維', '製紙', 'ゴム', 'ガラス'], 'メーカー（素材・化学）'],
  [['電機', '機械', '半導体', '電子部品', '精密', '自動車', '重工', '鉄鋼', '非鉄'], 'メーカー（電機・機械）'],
  [['広告', 'メディア', '放送', '出版', '新聞'], '広告・メディア'],
  [['ゲーム', 'エンタメ', 'レジャー'], 'エンタメ・ゲーム'],
  [['不動産', '建設', '住宅'], '不動産・建設'],
  [['鉄道', '電力', 'ガス'], 'インフラ（電力・ガス・鉄道）'],
  [['物流', '海運', '航空', '運輸'], '物流・運輸'],
  [['小売', '流通', '百貨店'], '小売・流通'],
  [['人材', '教育'], '人材・教育'],
  [['官公庁', '公社', '団体'], '官公庁・公社・団体'],
  [['IT', 'SIer', '通信', 'SaaS', 'インターネット', 'ソフトウェア', 'AI', 'EC'], 'IT・通信'],
];

export function mapMasterIndustry(masterIndustry: string): string | undefined {
  for (const [keywords, mapped] of INDUSTRY_MAPPING) {
    if (keywords.some((kw) => masterIndustry.includes(kw))) {
      return mapped;
    }
  }
  return undefined;
}

export function createCompany(name: string): Company {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    status: 'interested',
    stages: [],
    deadlines: [],
    createdAt: now,
    updatedAt: now,
  };
}
