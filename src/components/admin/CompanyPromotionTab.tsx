import { useState, useEffect } from 'react';
import {
  getPendingPromotions,
  approvePromotion,
  rejectPromotion,
  INDUSTRY_OPTIONS,
} from '@jobsimplify/shared';
import type { CompanyPromotionRequest } from '@jobsimplify/shared';

export default function CompanyPromotionTab() {
  const [requests, setRequests] = useState<CompanyPromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPendingPromotions()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleApproved = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRejected = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
        <p className="text-sm">読み込み中...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
        <p className="text-sm">昇格待ちの企業はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{requests.length}件の昇格待ち</p>
      {requests.map((req) => (
        <PromotionCard
          key={req.id}
          request={req}
          onApproved={() => handleApproved(req.id)}
          onRejected={() => handleRejected(req.id)}
        />
      ))}
    </div>
  );
}

function PromotionCard({
  request,
  onApproved,
  onRejected,
}: {
  request: CompanyPromotionRequest;
  onApproved: () => void;
  onRejected: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [industry, setIndustry] = useState(request.industry ?? '');
  const [recruitUrl, setRecruitUrl] = useState(request.recruitUrl ?? '');
  const [websiteDomain, setWebsiteDomain] = useState(request.websiteDomain ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(request.websiteUrl ?? '');

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await approvePromotion(request.id, {
        industry: industry || undefined,
        websiteUrl: websiteUrl || undefined,
        websiteDomain: websiteDomain || undefined,
        recruitUrl: recruitUrl || undefined,
      });
      onApproved();
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await rejectPromotion(request.id);
      onRejected();
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        {/* Building icon */}
        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{request.name}</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              {request.requestCount}人が追加
            </span>
          </div>

          {/* Details */}
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-gray-500 font-mono">法人番号: {request.corporateNumber}</p>
            {request.address && (
              <p className="text-xs text-gray-500">{request.address}</p>
            )}
            {request.nameKana && (
              <p className="text-xs text-gray-400">{request.nameKana}</p>
            )}
          </div>

          {/* Approve form */}
          {editing && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">業界</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="select-field text-sm"
                >
                  <option value="">選択してください</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">採用ページURL</label>
                <input
                  type="url"
                  value={recruitUrl}
                  onChange={(e) => setRecruitUrl(e.target.value)}
                  className="input-field text-sm"
                  placeholder="https://recruit.example.com"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ドメイン</label>
                <input
                  type="text"
                  value={websiteDomain}
                  onChange={(e) => setWebsiteDomain(e.target.value)}
                  className="input-field text-sm"
                  placeholder="example.com"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">企業サイトURL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="input-field text-sm"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="btn-primary text-sm px-3 py-1"
                >
                  {submitting ? '処理中...' : '承認（マスター昇格）'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* Reject confirm */}
          {rejecting && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">この企業の昇格リクエストを却下しますか？</p>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="text-sm px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {submitting ? '処理中...' : '却下'}
                </button>
                <button
                  onClick={() => setRejecting(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!editing && !rejecting && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="btn-primary text-sm px-3 py-1.5"
            >
              承認
            </button>
            <button
              onClick={() => setRejecting(true)}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              却下
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
