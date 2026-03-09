import { useCompanyEmails } from '../../hooks/useCompanyEmails';
import { useGmail } from '../../hooks/useGmail';
import { getGmailUrl } from '../../services/gmailSyncService';
import type { CachedEmail } from '@jobsimplify/shared';

function formatEmailDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

function EmailItem({ email }: { email: CachedEmail }) {
  return (
    <a
      href={getGmailUrl(email.gmailMessageId)}
      target="_blank"
      rel="noopener noreferrer"
      className="block px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium truncate">{email.subject}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {email.senderName ?? email.senderEmail}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-gray-400">{formatEmailDate(email.receivedAt)}</span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </div>
      </div>
    </a>
  );
}

export default function CompanyEmailSection({ companyId }: { companyId: string }) {
  const { isConnected, isLoading: isGmailLoading } = useGmail();
  const { emails, isLoading } = useCompanyEmails(companyId);

  if (isGmailLoading) return null;

  if (!isConnected) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 tracking-wide">メール</h3>
        <p className="text-xs text-gray-400">
          <a href="/settings" className="text-primary-600 hover:underline">設定ページ</a>
          でGmailを連携すると、この企業からのメールが表示されます。
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 tracking-wide">メール</h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
          </svg>
          読み込み中...
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 tracking-wide">メール</h3>
        <p className="text-xs text-gray-400">この企業からのメールはありません。</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-2 tracking-wide">
        メール
        <span className="text-xs font-normal text-gray-400 ml-1.5">({emails.length})</span>
      </h3>
      <div className="space-y-0.5">
        {emails.map((email) => (
          <EmailItem key={email.id} email={email} />
        ))}
      </div>
    </div>
  );
}
