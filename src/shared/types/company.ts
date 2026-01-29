export interface Company {
  id: string;
  name: string;
  industry?: string;
  status: SelectionStatus;
  stages: SelectionStage[];
  deadline?: string; // YYYY-MM-DD
  memo?: string;
  loginUrl?: string;
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
