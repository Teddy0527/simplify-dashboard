import { SelectionStatus, SelectionStage, CompanyDeadline, STATUS_LABELS } from '@entrify/shared';

// ── Shell → Tab data contract ──
export type DraftCompany = {
  name: string;
  status: SelectionStatus;
  industry: string;
  memo: string;
  loginUrl: string;
  myPageId: string;
  loginPassword: string;
  stages: SelectionStage[];
  deadlines: CompanyDeadline[];
};

export type OnFieldChange = <K extends keyof DraftCompany>(key: K, value: DraftCompany[K]) => void;

// ── Timeline normalization ──
export type TimelineEntryState = 'passed' | 'current' | 'pending' | 'failed' | 'future';

export type TimelineEntry = {
  type: SelectionStatus;
  label: string;
  date?: string;
  time?: string;
  result?: 'pending' | 'passed' | 'failed';
  state: TimelineEntryState;
  stageIndex?: number;
};

/**
 * Build display-ready TimelineEntry[] directly from company stages[].
 *
 * The timeline now reflects the stages array order as-is (enterprise-specific flow),
 * rather than a fixed STATUS_ORDER. Each stage entry maps 1:1 to a TimelineEntry.
 *
 * - rejected/declined are NOT shown in the flow (terminal status set via dropdown only)
 * - The last 'passed' stage before the first 'pending' is shown as 'current'
 */
export function buildTimeline(
  currentStatus: SelectionStatus,
  stages: SelectionStage[],
  _showAll: boolean,
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // Find the index of the first pending stage to determine 'current'
  const firstPendingIdx = stages.findIndex(s => s.result === 'pending');

  stages.forEach((stage, i) => {
    // Skip rejected/declined from the timeline flow
    if (stage.type === 'rejected' || stage.type === 'declined') return;

    let state: TimelineEntryState;
    if (stage.result === 'failed') {
      state = 'failed';
    } else if (stage.result === 'passed') {
      // If this is the last passed stage before the first pending, mark as current
      if (firstPendingIdx === -1 && i === stages.length - 1) {
        state = 'current';
      } else if (firstPendingIdx !== -1 && i === firstPendingIdx - 1) {
        state = 'current';
      } else {
        state = 'passed';
      }
    } else if (stage.result === 'pending') {
      if (firstPendingIdx === i) {
        // First pending is "next up" — show as pending
        state = 'pending';
      } else {
        state = 'future';
      }
    } else {
      state = 'future';
    }

    entries.push({
      type: stage.type,
      label: stage.customLabel || (STATUS_LABELS[stage.type] ?? stage.type),
      date: stage.date,
      time: stage.time,
      result: stage.result,
      state,
      stageIndex: i,
    });
  });

  // If no stages exist, show the current status as a single entry
  if (entries.length === 0 && currentStatus !== 'rejected' && currentStatus !== 'declined') {
    entries.push({
      type: currentStatus,
      label: STATUS_LABELS[currentStatus],
      state: 'current',
    });
  }

  // Append rejected/declined as terminal entry when currentStatus matches
  if (currentStatus === 'rejected') {
    entries.push({
      type: 'rejected',
      label: STATUS_LABELS['rejected'],
      state: 'failed',
    });
  } else if (currentStatus === 'declined') {
    entries.push({
      type: 'declined',
      label: STATUS_LABELS['declined'],
      state: 'passed',
    });
  }

  return entries;
}

export type DrawerTab = 'overview' | 'documents';
