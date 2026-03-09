import type { SelectionStage, SelectionStatus } from '@jobsimplify/shared';
import { STATUS_LABELS } from '@jobsimplify/shared';

const STATUS_COLORS: Record<SelectionStatus, { bg: string; border: string; text: string }> = {
  interested:      { bg: '#f0f4f8', border: '#829ab1', text: '#334e68' },
  info_session:    { bg: '#f0f9ff', border: '#38bdf8', text: '#0284c7' },
  es_submitted:    { bg: '#ecfdf5', border: '#10b981', text: '#059669' },
  webtest:         { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' },
  gd:              { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' },
  interview_1:     { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb' },
  interview_2:     { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb' },
  interview_3:     { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb' },
  interview_final: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
  offer:           { bg: '#d1fae5', border: '#059669', text: '#065f46' },
  other:           { bg: '#f5f3ff', border: '#8b5cf6', text: '#7c3aed' },
  rejected:        { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' },
  declined:        { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
};

export function getStageColor(status: SelectionStatus) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.interested;
}

export function formatStageLabel(stage: SelectionStage): string {
  if (stage.customLabel) return stage.customLabel;
  return STATUS_LABELS[stage.type] ?? stage.type;
}

export function formatTimeJP(time?: string): string {
  if (!time) return '';
  // "14:30" -> "14:30"
  return time.slice(0, 5);
}
