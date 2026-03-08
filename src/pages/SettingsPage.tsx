import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

type IntegrationStatus = 'available' | 'coming_soon';

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
    status: 'available',
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

function IntegrationCard({ integration }: { integration: Integration }) {
  const isComingSoon = integration.status === 'coming_soon';
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
      </div>

      <p className="text-sm mb-5" style={{ color: 'var(--color-gray-500)' }}>
        {integration.description}
      </p>

      {isGoogleCalendar ? (
        <GoogleCalendarAction />
      ) : (
        <button
          className="btn-primary text-sm"
          disabled
          aria-label={`${integration.name}を連携する（準備中）`}
        >
          連携する
        </button>
      )}
    </div>
  );
}

function GoogleCalendarAction() {
  const { isConnected, isLoading, connect, disconnect } = useGoogleCalendar();

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
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#16a34a' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          連携中
        </span>
        <button
          onClick={disconnect}
          className="text-xs hover:underline focus-visible:ring-2 ring-offset-1"
          style={{ color: 'var(--color-gray-400)' }}
          aria-label="Google Calendarの連携を解除する"
        >
          解除する
        </button>
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
          {integrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </div>
    </div>
  );
}
