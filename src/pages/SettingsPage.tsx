import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { useCalendarTestUser } from '../hooks/useCalendarTestUser';
import { useToast } from '../hooks/useToast';

type IntegrationStatus = 'available' | 'coming_soon' | 'test_recruiting';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  iconSrc: string;
}

const integrations: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: '選考日程や締切をGoogleカレンダーに自動同期',
    status: 'test_recruiting',
    iconSrc: '/icons/google-calendar.svg',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: '企業からのメールを自動で取得・分類',
    status: 'coming_soon',
    iconSrc: '/icons/gmail.svg',
  },
];

function IntegrationCard({ integration, badgeText, badgeClassName }: {
  integration: Integration;
  badgeText?: string | null;
  badgeClassName?: string;
}) {
  const isComingSoon = integration.status === 'coming_soon';
  const isTestRecruiting = integration.status === 'test_recruiting';
  const isGoogleCalendar = integration.id === 'google-calendar';

  return (
    <div
      className={`paper-card p-7 transition-all duration-200 ${
        isComingSoon
          ? 'opacity-60'
          : 'hover:shadow-md hover:border-gray-300 cursor-pointer'
      }`}
      style={{ borderColor: isComingSoon ? undefined : undefined }}
    >
      <img
        src={integration.iconSrc}
        alt={`${integration.name} icon`}
        width={40}
        height={40}
        className="mb-4 rounded-xl w-10 h-10"
      />

      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {integration.name}
        </h3>
        {isComingSoon && (
          <span className="bg-gray-100 text-gray-400 text-xs rounded-full px-2.5 py-0.5">
            準備中
          </span>
        )}
        {badgeText && (
          <span className={badgeClassName ?? 'bg-amber-50 text-amber-600 text-xs rounded-full px-2.5 py-0.5'}>
            {badgeText}
          </span>
        )}
      </div>

      <p className="text-sm mb-5" style={{ color: 'var(--color-gray-500)' }}>
        {integration.description}
      </p>

      {isComingSoon ? (
        <button
          className="btn-primary text-sm"
          disabled
          aria-label={`${integration.name}を連携する（準備中）`}
        >
          連携する
        </button>
      ) : isGoogleCalendar && isTestRecruiting ? (
        <GoogleCalendarTestUserAction />
      ) : isGoogleCalendar ? (
        <GoogleCalendarAction />
      ) : null}
    </div>
  );
}

function GoogleCalendarCard({ integration }: { integration: Integration }) {
  const { isConnected, isTestUserApproved } = useGoogleCalendar();
  const { status: requestStatus } = useCalendarTestUser();

  const isApprovedOrConnected = isTestUserApproved || isConnected || requestStatus === 'approved';

  let badgeText: string | null = null;
  let badgeClassName: string | undefined;

  if (isConnected) {
    badgeText = '連携中';
    badgeClassName = 'bg-green-50 text-green-600 text-xs rounded-full px-2.5 py-0.5';
  } else if (isApprovedOrConnected) {
    badgeText = '連携可能';
    badgeClassName = 'bg-blue-50 text-blue-600 text-xs rounded-full px-2.5 py-0.5';
  } else {
    badgeText = 'テストユーザー募集中';
  }

  return <IntegrationCard integration={integration} badgeText={badgeText} badgeClassName={badgeClassName} />;
}

function GoogleCalendarTestUserAction() {
  const { isConnected, isLoading: isCalLoading, isTestUserApproved } = useGoogleCalendar();
  const { status: requestStatus, isLoading: isReqLoading, apply } = useCalendarTestUser();
  const [applying, setApplying] = useState(false);
  const { showToast } = useToast();

  if (isCalLoading || isReqLoading) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-gray-400)' }}>
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
        </svg>
        読み込み中...
      </div>
    );
  }

  // Approved test user or already connected: show full connect flow
  if (isTestUserApproved || isConnected || requestStatus === 'approved') {
    return <GoogleCalendarAction />;
  }

  // Already submitted request
  if (requestStatus === 'pending') {
    return (
      <div className="space-y-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#d97706' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.75" fill="currentColor" />
          </svg>
          申請済み
        </span>
        <p className="text-xs" style={{ color: 'var(--color-gray-500)' }}>
          承認後、Googleカレンダーを連携できるようになります
        </p>
      </div>
    );
  }

  if (requestStatus === 'rejected') {
    return (
      <div className="space-y-1.5">
        <p className="text-xs" style={{ color: 'var(--color-gray-500)' }}>
          現在テストユーザーの枠が埋まっています。今後の募集をお待ちください。
        </p>
      </div>
    );
  }

  // Not yet applied
  async function handleApply() {
    setApplying(true);
    try {
      await apply();
      showToast('テストユーザーに申請しました', 'success');
    } catch {
      showToast('申請に失敗しました。もう一度お試しください', 'error');
    } finally {
      setApplying(false);
    }
  }

  return (
    <button
      onClick={handleApply}
      disabled={applying}
      className="btn-primary text-sm focus-visible:ring-2 ring-offset-1"
      aria-label="テストユーザーに申請する"
    >
      {applying ? '申請中...' : 'テストユーザーになる'}
    </button>
  );
}

function GoogleCalendarAction() {
  const { isConnected, isLoading, connect, disconnect, googleEmail } = useGoogleCalendar();
  const [changingAccount, setChangingAccount] = useState(false);

  async function handleChangeAccount() {
    setChangingAccount(true);
    try {
      await disconnect();
      connect();
    } finally {
      setChangingAccount(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-gray-400)' }}>
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
        </svg>
        読み込み中...
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#16a34a' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            連携中
          </span>
        </div>
        {googleEmail && (
          <p className="text-xs truncate max-w-[220px]" style={{ color: 'var(--color-gray-500)' }}>
            {googleEmail}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={handleChangeAccount}
            disabled={changingAccount}
            className="text-xs hover:underline focus-visible:ring-2 ring-offset-1"
            style={{ color: 'var(--color-primary-600)' }}
            aria-label="Googleアカウントを変更する"
          >
            {changingAccount ? '変更中...' : 'アカウントを変更'}
          </button>
          <button
            onClick={disconnect}
            className="text-xs hover:underline focus-visible:ring-2 ring-offset-1"
            style={{ color: 'var(--color-gray-400)' }}
            aria-label="Google Calendarの連携を解除する"
          >
            解除する
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="btn-primary text-sm focus-visible:ring-2 ring-offset-1"
      aria-label="Google Calendarを連携する"
    >
      連携する
    </button>
  );
}

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (!connected && !error) return;

    if (connected) {
      if (window.opener) {
        window.opener.postMessage({ type: 'google-calendar-connected' }, window.location.origin);
        window.close();
        return;
      }
      showToast('Google Calendarとの連携が完了しました', 'success');
    }

    if (error) {
      if (window.opener) {
        window.opener.postMessage({ type: 'google-calendar-error', error: '' }, window.location.origin);
        window.close();
        return;
      }
      showToast('Google Calendarとの連携に失敗しました', 'error');
    }

    setSearchParams({}, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="mb-8 animate-in">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-gray-900)' }}>
            設定
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-gray-500)' }}>
            外部サービスとの連携を管理します
          </p>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-gray-900)' }}>
            連携サービス
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in">
          {integrations.map((integration) =>
            integration.id === 'google-calendar' ? (
              <GoogleCalendarCard key={integration.id} integration={integration} />
            ) : (
              <IntegrationCard key={integration.id} integration={integration} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
