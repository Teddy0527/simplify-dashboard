import type { CompanyDeadline, SelectionStage, DeadlineType } from '@jobsimplify/shared';
import { STATUS_LABELS, DEADLINE_STAGE_MAP } from '@jobsimplify/shared';

/** DeadlineType別のカラーマップ */
export const DEADLINE_TYPE_COLORS: Record<DeadlineType, string> = {
  es_submission: '#1a73e8',
  document: '#1a73e8',
  interview: '#d50000',
  internship: '#0b8043',
  event: '#039be5',
  webtest: '#f4511e',
  offer_response: '#8e24aa',
  other: '#616161',
};

export function getDeadlineTypeColor(type: DeadlineType): string {
  return DEADLINE_TYPE_COLORS[type] || DEADLINE_TYPE_COLORS.other;
}

/** 未来の締切のうち最も近いものを返す。なければ直近の過去（overdue）を返す */
export function getNearestDeadline(deadlines: CompanyDeadline[]): CompanyDeadline | null {
  if (!deadlines || deadlines.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...deadlines].sort((a, b) => a.date.localeCompare(b.date));

  // 未来の締切のうち最も近いもの
  const future = sorted.find(d => new Date(d.date) >= today);
  if (future) return future;

  // なければ直近の過去
  return sorted[sorted.length - 1];
}

/** 今日からの残日数（負=過去） */
export function daysUntilDeadline(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** overdue: 過去, urgent: 0〜3日, soon: 4〜7日, normal: 8日以上 */
export function getDeadlineUrgency(dateStr: string): 'overdue' | 'urgent' | 'soon' | 'normal' {
  const days = daysUntilDeadline(dateStr);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'normal';
}

/** "期限切れ", "今日", "明日", "あと3日", "1/15" 等 */
export function formatDeadlineShort(dateStr: string): string {
  const days = daysUntilDeadline(dateStr);
  if (days < 0) return '期限切れ';
  if (days === 0) return '今日';
  if (days === 1) return '明日';
  if (days <= 7) return `あと${days}日`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** stages[]から最初のresult='pending'ステップを返す */
export function getNextSelectionStep(stages: SelectionStage[]): { label: string; date?: string; time?: string } | null {
  const pending = stages.find(s => s.result === 'pending');
  if (!pending) return null;
  return {
    label: pending.customLabel || (STATUS_LABELS[pending.type] ?? pending.type),
    date: pending.date,
    time: pending.time,
  };
}

/** "2/17" or "2/17 23:59" */
export function formatAbsoluteDate(dateStr: string, time?: string): string {
  const d = new Date(dateStr);
  const base = `${d.getMonth() + 1}/${d.getDate()}`;
  return time ? `${base} ${time}` : base;
}

export interface UnifiedNextAction {
  label: string;
  relativeDate: string;   // "あと3日", "今日", "期限切れ"
  absoluteDate: string;   // "2/17 23:59"
  urgency: 'overdue' | 'urgent' | 'soon' | 'normal';
}

/** deadline + stage を統合して1つの「次のアクション」を返す */
export function getUnifiedNextAction(
  deadlines: CompanyDeadline[],
  stages: SelectionStage[]
): UnifiedNextAction | null {
  const nearest = getNearestDeadline(deadlines);
  const nextStep = getNextSelectionStep(stages);

  if (nearest) {
    // deadline がある場合は deadline 優先
    // stage と同じラベル/日付なら統合（label は deadline のものを使う）
    const label = nearest.label;
    return {
      label,
      relativeDate: formatDeadlineShort(nearest.date),
      absoluteDate: formatAbsoluteDate(nearest.date, nearest.time),
      urgency: getDeadlineUrgency(nearest.date),
    };
  }

  if (nextStep?.date) {
    // stage のみ（日付あり）
    return {
      label: nextStep.label,
      relativeDate: formatDeadlineShort(nextStep.date),
      absoluteDate: formatAbsoluteDate(nextStep.date, nextStep.time),
      urgency: getDeadlineUrgency(nextStep.date),
    };
  }

  if (nextStep) {
    // stage のみ（日付なし）→ 日付情報なしで表示
    return {
      label: nextStep.label,
      relativeDate: '',
      absoluteDate: '',
      urgency: 'normal',
    };
  }

  return null;
}

/** 24h時刻を日本語表記に変換: "15:00"→"午後3時", "10:15"→"午前10:15" */
export function formatTimeJP(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h < 12 ? '午前' : '午後';
  const h12 = h === 0 ? 0 : h <= 12 ? h : h - 12;
  return m === 0 ? `${period}${h12}時` : `${period}${h12}:${String(m).padStart(2, '0')}`;
}

/** deadlineをstageに紐付ける。matchedはstageIndex→deadlines[]、unmatchedは紐付かなかったもの */
export function bindDeadlinesToStages(
  deadlines: CompanyDeadline[],
  stages: SelectionStage[],
): { matched: Map<number, CompanyDeadline[]>; unmatched: CompanyDeadline[] } {
  const matched = new Map<number, CompanyDeadline[]>();
  const unmatched: CompanyDeadline[] = [];
  const usedStageIndices = new Set<number>();

  // 日付順に処理
  const sorted = [...deadlines].sort((a, b) => a.date.localeCompare(b.date));

  for (const dl of sorted) {
    const candidateTypes = DEADLINE_STAGE_MAP[dl.type];
    if (!candidateTypes || candidateTypes.length === 0) {
      unmatched.push(dl);
      continue;
    }

    // 候補ステージを探す（interview型は未使用+pending優先でgreedy割当）
    let bestIdx = -1;
    for (let i = 0; i < stages.length; i++) {
      if (!candidateTypes.includes(stages[i].type)) continue;
      if (candidateTypes.length === 1) {
        // 一意マッピング（es_submission, webtest, offer_response）
        bestIdx = i;
        break;
      }
      // interview型: 未使用のものを優先、さらにpendingを優先
      if (!usedStageIndices.has(i)) {
        if (bestIdx === -1 || stages[i].result === 'pending') {
          bestIdx = i;
          if (stages[i].result === 'pending') break;
        }
      }
    }

    if (bestIdx === -1) {
      unmatched.push(dl);
    } else {
      usedStageIndices.add(bestIdx);
      const arr = matched.get(bestIdx) || [];
      arr.push(dl);
      matched.set(bestIdx, arr);
    }
  }

  return { matched, unmatched };
}
