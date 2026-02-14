import { useState, useRef, useEffect, useCallback } from 'react';
import type { DeadlinePresetWithCompany } from '@jobsimplify/shared';
import type { DeadlineReminder } from '../hooks/useDeadlineReminders';
import { useToast } from '../hooks/useToast';
import { GoogleCalendarAuthError } from '../utils/googleCalendarApi';

const REMINDER_OPTIONS = [
  { daysBefore: 1, label: '1日前' },
  { daysBefore: 3, label: '3日前' },
  { daysBefore: 7, label: '7日前' },
] as const;

interface ReminderButtonProps {
  entry: DeadlinePresetWithCompany;
  reminders: DeadlineReminder[];
  onAdd: (entry: DeadlinePresetWithCompany, daysBefore: number) => Promise<void>;
  onCancel: (reminderId: string) => Promise<void>;
  hasCalendarToken: () => boolean;
  onReconnect: () => void;
  size?: 'sm' | 'xs';
  dropUp?: boolean;
}

export function ReminderButton({
  entry,
  reminders,
  onAdd,
  onCancel,
  hasCalendarToken,
  onReconnect,
  size = 'sm',
  dropUp = false,
}: ReminderButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const presetReminders = reminders.filter(
    (r) => r.presetId === entry.id && (r.status === 'pending' || r.status === 'sent'),
  );
  const hasActiveReminder = presetReminders.length > 0;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!open) {
        if (!hasCalendarToken()) {
          onReconnect();
          return;
        }
      }
      setOpen((v) => !v);
    },
    [open, hasCalendarToken, onReconnect],
  );

  const handleOption = useCallback(
    async (daysBefore: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const existing = presetReminders.find((r) => r.daysBefore === daysBefore);

      setLoading(daysBefore);
      try {
        if (existing) {
          await onCancel(existing.id);
          showToast('通知をキャンセルしました', 'success');
        } else {
          // Check if remind_at would be in the past
          const deadline = new Date(entry.deadlineDate + 'T09:00:00+09:00');
          deadline.setDate(deadline.getDate() - daysBefore);
          if (deadline <= new Date()) {
            return; // Past date, do nothing
          }
          await onAdd(entry, daysBefore);
          showToast('カレンダーに通知を設定しました', 'success');
        }
      } catch (err) {
        if (
          err instanceof GoogleCalendarAuthError ||
          (err instanceof Error && err.message === 'No calendar token')
        ) {
          showToast('認証が切れました。再度ベルをクリックして再ログインしてください', 'error');
          setOpen(false);
        } else {
          showToast('リマインダーの設定に失敗しました', 'error');
        }
      } finally {
        setLoading(null);
      }
    },
    [entry, presetReminders, onAdd, onCancel, showToast],
  );

  const iconSize = size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const iconClassName = `${iconSize} ${size === 'sm' ? 'translate-y-[1.5px]' : ''}`;

  return (
    <div ref={ref} className="relative flex-shrink-0 self-center">
      <button
        onClick={handleToggle}
        className={`inline-flex items-center justify-center leading-none transition-colors ${
          hasActiveReminder
            ? 'text-amber-500 hover:text-amber-600'
            : 'text-gray-400 hover:text-amber-500'
        }`}
        title="リマインダー設定"
      >
        <svg
          className={iconClassName}
          viewBox="0 0 24 24"
          fill={hasActiveReminder ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 border-b border-gray-100">
            カレンダー通知
          </div>
          {REMINDER_OPTIONS.map((opt) => {
            const existing = presetReminders.find(
              (r) => r.daysBefore === opt.daysBefore,
            );
            const isLoading = loading === opt.daysBefore;

            // Check if remind_at would be in the past
            const deadline = new Date(entry.deadlineDate + 'T09:00:00+09:00');
            deadline.setDate(deadline.getDate() - opt.daysBefore);
            const isPast = deadline <= new Date();

            return (
              <button
                key={opt.daysBefore}
                onClick={(e) => handleOption(opt.daysBefore, e)}
                disabled={isLoading || (isPast && !existing)}
                className={`w-full px-3 py-1.5 text-sm text-left flex items-center justify-between gap-2 transition-colors ${
                  isPast && !existing
                    ? 'text-gray-300 cursor-not-allowed'
                    : existing
                      ? 'text-amber-600 hover:bg-amber-50'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{opt.label}</span>
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                ) : existing ? (
                  <svg
                    className="w-3.5 h-3.5 text-amber-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
