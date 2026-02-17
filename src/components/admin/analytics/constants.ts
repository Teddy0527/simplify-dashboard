export const FUNNEL_STEP_LABELS: Record<string, string> = {
  signup: 'サインアップ',
  'milestone.first_company': '初回企業追加',
  'milestone.first_status_change': '初回ステータス変更',
  'milestone.first_profile_update': 'プロフィール入力',
  'milestone.third_company': '3社目追加',
  'onboarding.completed': 'オンボーディング完了',
  'onboarding.skipped': 'オンボーディングスキップ',
};

export const FEATURE_LABELS: Record<string, string> = {
  kanban_drag: 'カンバンドラッグ',
  drawer: '企業ドロワー',
  deadlines: '締切DB',
  gcal: 'GCal連携',
  reminder: 'リマインダー',
  template: 'テンプレート',
  profile: 'プロフィール',
};

export const HEALTH_THRESHOLDS = {
  stickiness: { good: 0.20, warn: 0.10 },
  funnelStep3: { good: 0.30, warn: 0.15 },
} as const;

export const AARRR_GOALS = {
  acquisition: 1000,        // 月間LP訪問数
  activationWeekly: 20,     // 週間新規登録数
  retentionD1: 0.50,        // D1リテンション目標 (50%)
  retentionD3: 0.35,        // D3リテンション目標 (35%)
  retentionD7: 0.25,        // D7リテンション目標 (25%)
  cwsSessions: 500,         // Chrome拡張 月間セッション数
  cwsInstalls: 100,         // Chrome拡張 月間インストール数(≒newUsers)
} as const;
