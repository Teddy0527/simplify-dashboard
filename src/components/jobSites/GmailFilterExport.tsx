import { useState } from 'react';
import { JobSite, downloadGmailFilterXml, trackEventAsync } from '@jobsimplify/shared';

interface GmailFilterExportProps {
  sites: JobSite[];
}

export default function GmailFilterExport({ sites }: GmailFilterExportProps) {
  const [showGuide, setShowGuide] = useState(false);
  const sitesWithDomains = sites.filter((s) => s.emailDomains.length > 0);

  if (sitesWithDomains.length === 0) return null;

  function handleDownload() {
    trackEventAsync('job_site.filter_download', { siteCount: sitesWithDomains.length });
    downloadGmailFilterXml(sitesWithDomains);
  }

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <svg className="w-4.5 h-4.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">Gmailフィルタを設定する</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            登録サイトのメールを自動でラベル分類し、重要メール（面接・締切・合否）にスターを付けます。
          </p>

          <div className="flex items-center gap-3 mt-3">
            <button onClick={handleDownload} className="btn-primary text-xs py-1.5 px-4">
              フィルタをダウンロード
            </button>
            <button
              onClick={() => setShowGuide((v) => !v)}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
            >
              {showGuide ? '閉じる' : '設定方法を見る'}
            </button>
          </div>

          {showGuide && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-xs font-medium text-gray-700">設定手順:</p>
              <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
                <li>上のボタンからフィルタファイルをダウンロード</li>
                <li>
                  <a
                    href="https://mail.google.com/mail/u/0/#settings/filters"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800"
                  >
                    Gmail設定 → フィルタとブロック中のアドレス
                  </a>
                  を開く
                </li>
                <li>「フィルタをインポート」→ ダウンロードしたファイルを選択</li>
                <li>「フィルタを作成」で完了</li>
              </ol>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-1">生成されるフィルタ:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {sitesWithDomains.map((s) => (
                    <li key={s.id}>
                      ・{s.name}のメール → 「就活サイト/{s.name}」ラベル
                    </li>
                  ))}
                  <li>・重要メール（面接・締切・合否キーワード） → 「就活サイト/★重要」ラベル + スター</li>
                </ul>
              </div>

              <p className="text-xs text-gray-400 pt-1">
                ※ フィルタは新着メールにのみ適用されます。既存メールには影響しません。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
