import { useState } from 'react';

type Lang = 'ja' | 'en';

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<Lang>('ja');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === 'ja' ? 'プライバシーポリシー' : 'Privacy Policy'}
          </h1>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setLang('ja')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                lang === 'ja' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              日本語
            </button>
            <button
              onClick={() => setLang('en')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                lang === 'en' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          {lang === 'ja' ? <JaContent /> : <EnContent />}
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          {lang === 'ja' ? '最終更新日: 2026年3月9日' : 'Last updated: March 9, 2026'}
        </p>
      </div>
    </div>
  );
}

function JaContent() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">1. はじめに</h2>
        <p>
          Job Simplify（以下「本サービス」）は、ユーザーの就職活動を効率化するダッシュボードアプリケーションです。
          本プライバシーポリシーでは、本サービスがどのようにユーザーのデータを収集・使用・保護するかを説明します。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 収集するデータ</h2>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Googleアカウント情報</h3>
        <p>Google OAuthを通じて、以下の基本情報を取得します:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>メールアドレス</li>
          <li>表示名</li>
          <li>プロフィール画像</li>
        </ul>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Google Calendar データ</h3>
        <p>
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">calendar</code> スコープを使用して、以下の操作を行います:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>カレンダーイベントの読み取り（面接・説明会の表示）</li>
          <li>カレンダーイベントの作成（面接予定の登録）</li>
        </ul>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Gmail データ</h3>
        <p>
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">gmail.metadata</code> スコープを使用して、以下のメタデータのみを取得します:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>送信者のメールアドレスと表示名</li>
          <li>件名</li>
          <li>受信日時</li>
          <li>スニペット（冒頭の短い抜粋）</li>
          <li>既読・未読状態</li>
        </ul>
        <p className="mt-2 text-gray-500">
          ※ メール本文の内容は取得・保存しません。メールの全文を読む場合はGmailアプリで直接ご確認ください。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">3. データの利用目的</h2>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>登録企業からのメールを自動的に識別・整理する</li>
          <li>面接や説明会のスケジュールをカレンダーに表示・登録する</li>
          <li>就職活動の進捗を一元管理する</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">4. データの保存</h2>
        <p>
          ユーザーのデータはSupabase（クラウドデータベース）に安全に保存されます。
          OAuthアクセストークンとリフレッシュトークンは暗号化して保存され、
          Google APIへのアクセスにのみ使用されます。
        </p>
        <p className="mt-2">
          メールのメタデータはキャッシュとして保存され、高速な表示を実現します。
          キャッシュデータはGmail連携を解除した際に自動的に削除されます。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">5. データの共有</h2>
        <p>
          本サービスは、ユーザーのデータを第三者に販売・共有しません。
          データはサービスの機能提供にのみ使用されます。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">6. 連携の解除とデータ削除</h2>
        <p>
          ユーザーはいつでも設定ページからGoogle連携（カレンダー・Gmail）を解除できます。
          連携を解除すると、保存されたトークンとキャッシュデータは即座に削除されます。
        </p>
        <p className="mt-2">
          また、
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
            Googleアカウントの権限管理ページ
          </a>
          からも本サービスへのアクセスを取り消すことができます。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">7. お問い合わせ</h2>
        <p>
          プライバシーに関するご質問やご懸念がございましたら、アプリ内のサポート機能からお問い合わせください。
        </p>
      </section>
    </>
  );
}

function EnContent() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h2>
        <p>
          Job Simplify ("the Service") is a dashboard application designed to streamline your job search.
          This Privacy Policy explains how we collect, use, and protect your data.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Data We Collect</h2>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Google Account Information</h3>
        <p>Through Google OAuth, we access the following basic information:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Email address</li>
          <li>Display name</li>
          <li>Profile picture</li>
        </ul>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Google Calendar Data</h3>
        <p>
          Using the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">calendar</code> scope, we perform the following operations:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Read calendar events (to display interviews and info sessions)</li>
          <li>Create calendar events (to register interview schedules)</li>
        </ul>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Gmail Data</h3>
        <p>
          Using the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">gmail.metadata</code> scope, we access only the following metadata:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Sender email address and display name</li>
          <li>Subject line</li>
          <li>Date received</li>
          <li>Snippet (short excerpt)</li>
          <li>Read/unread status</li>
        </ul>
        <p className="mt-2 text-gray-500">
          We do not access or store the body content of your emails. To read the full content of an email, please use the Gmail app directly.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">3. How We Use Your Data</h2>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Automatically identify and organize emails from companies you are tracking</li>
          <li>Display and register interview and info session schedules on your calendar</li>
          <li>Provide a centralized view of your job search progress</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Storage</h2>
        <p>
          Your data is securely stored in Supabase (cloud database).
          OAuth access tokens and refresh tokens are stored encrypted and used solely for accessing Google APIs.
        </p>
        <p className="mt-2">
          Email metadata is cached for fast display.
          Cached data is automatically deleted when you disconnect your Gmail integration.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Data Sharing</h2>
        <p>
          We do not sell or share your data with third parties.
          Your data is used solely for providing the Service's functionality.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Disconnecting and Data Deletion</h2>
        <p>
          You can disconnect your Google integrations (Calendar and Gmail) at any time from the Settings page.
          Upon disconnection, stored tokens and cached data are immediately deleted.
        </p>
        <p className="mt-2">
          You can also revoke access to the Service from your{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
            Google Account permissions page
          </a>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Contact</h2>
        <p>
          If you have any questions or concerns about privacy, please contact us through the in-app support feature.
        </p>
      </section>
    </>
  );
}
