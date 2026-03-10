import { useState, useEffect } from 'react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { useCalendarTestUser } from '../hooks/useCalendarTestUser';

const SUPPRESS_KEY = 'calendar_connect_modal_dismissed';

interface CalendarConnectModalProps {
  onClose: () => void;
}

export function useCalendarConnectModalAutoShow() {
  const { isConnected, isLoading } = useGoogleCalendar();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading || isConnected) return;
    const dismissed = localStorage.getItem(SUPPRESS_KEY);
    if (!dismissed) {
      setShow(true);
    }
  }, [isLoading, isConnected]);

  function dismiss() {
    localStorage.setItem(SUPPRESS_KEY, '1');
    setShow(false);
  }

  return { show, dismiss };
}

export default function CalendarConnectModal({ onClose }: CalendarConnectModalProps) {
  const { isTestUserApproved, connect } = useGoogleCalendar();
  const { status: requestStatus, apply } = useCalendarTestUser();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  function handleDismiss() {
    localStorage.setItem(SUPPRESS_KEY, '1');
    onClose();
  }

  // Approved test user: show original connect modal
  if (isTestUserApproved) {
    function handleConnect() {
      localStorage.setItem(SUPPRESS_KEY, '1');
      connect();
      onClose();
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={handleDismiss} />
        <div
          className="relative w-full max-w-md rounded-2xl p-6 shadow-xl animate-in"
          style={{ backgroundColor: '#fff' }}
        >
          <CloseButton onClick={handleDismiss} />
          <CalendarIcon />

          <h2 className="text-lg font-bold" style={{ color: 'var(--color-gray-900)' }}>
            Googleカレンダーと連携しよう
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-gray-500)' }}>
            カレンダー連携で就活スケジュールを一元管理できます。
          </p>

          <ul className="mt-4 space-y-2.5">
            {[
              '締切・選考予定をGoogleカレンダーに自動同期',
              'カレンダーから直接予定を確認・管理',
              '締切前のリマインダー通知',
            ].map((text) => (
              <CheckItem key={text} text={text} />
            ))}
          </ul>

          <div className="mt-6 flex gap-3">
            <button onClick={handleConnect} className="btn-primary flex-1">
              連携する
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: 'var(--color-gray-200)', color: 'var(--color-gray-600)' }}
            >
              後で
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already applied or just applied
  if (requestStatus === 'pending' || applied) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={handleDismiss} />
        <div
          className="relative w-full max-w-md rounded-2xl p-6 shadow-xl animate-in"
          style={{ backgroundColor: '#fff' }}
        >
          <CloseButton onClick={handleDismiss} />
          <CalendarIcon />

          <h2 className="text-lg font-bold" style={{ color: 'var(--color-gray-900)' }}>
            テストユーザー申請済み
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-gray-500)' }}>
            承認後、Googleカレンダー連携をご利用いただけます。しばらくお待ちください。
          </p>

          <div className="mt-6">
            <button
              onClick={handleDismiss}
              className="btn-primary w-full"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not yet applied: show test user recruitment
  async function handleApply() {
    setApplying(true);
    try {
      await apply();
      setApplied(true);
    } catch {
      // Silently handle
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleDismiss} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-xl animate-in"
        style={{ backgroundColor: '#fff' }}
      >
        <CloseButton onClick={handleDismiss} />
        <CalendarIcon />

        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-gray-900)' }}>
            Googleカレンダー連携
          </h2>
          <span className="bg-amber-50 text-amber-600 text-xs rounded-full px-2.5 py-0.5">
            テストユーザー募集中
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-gray-500)' }}>
          現在テストユーザーを募集しています。申し込むと、先行してGoogleカレンダー連携をお試しいただけます。
        </p>

        <ul className="mt-4 space-y-2.5">
          {[
            '締切・選考予定をGoogleカレンダーに自動同期',
            'カレンダーから直接予定を確認・管理',
            '締切前のリマインダー通知',
          ].map((text) => (
            <CheckItem key={text} text={text} />
          ))}
        </ul>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleApply}
            disabled={applying}
            className="btn-primary flex-1"
          >
            {applying ? '申請中...' : 'テストユーザーになる'}
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--color-gray-200)', color: 'var(--color-gray-600)' }}
          >
            後で
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-4 top-4 rounded-lg p-1 transition-colors hover:bg-gray-100"
      style={{ color: 'var(--color-gray-400)' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

function CalendarIcon() {
  return (
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-primary-50)' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-gray-600)' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {text}
    </li>
  );
}
