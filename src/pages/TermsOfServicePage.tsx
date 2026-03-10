import { useState } from 'react';

type Lang = 'ja' | 'en';

export default function TermsOfServicePage() {
  const [lang, setLang] = useState<Lang>('ja');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === 'ja' ? '利用規約' : 'Terms of Service'}
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
          {lang === 'ja' ? '最終更新日: 2026年3月10日' : 'Last updated: March 10, 2026'}
        </p>
      </div>
    </div>
  );
}

function JaContent() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">1. サービスの概要</h2>
        <p>
          Job Simplify（以下「本サービス」）は、就職活動を効率化するためのダッシュボードアプリケーションです。
          ユーザーは応募企業の管理、スケジュールの確認、メールの整理などを一元的に行うことができます。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 利用条件</h2>
        <p>本サービスを利用するには、以下の条件を満たす必要があります:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Googleアカウントを所有していること</li>
          <li>本利用規約に同意すること</li>
          <li>本サービスを合法的な目的でのみ使用すること</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Google連携サービス</h2>
        <p>本サービスは、Googleの以下のサービスと連携します:</p>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.1 Googleカレンダー</h3>
        <p>
          本サービスは <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">calendar.events</code> スコープを使用して、
          ユーザーのカレンダーイベントの読み取り・作成・編集・削除を行います。
          これは面接や説明会などの就活関連スケジュールを管理するために使用されます。
        </p>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.2 Gmail</h3>
        <p>
          本サービスは <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">gmail.metadata</code> スコープを使用して、
          メールのメタデータ（送信者、件名、日時）のみを取得します。メール本文の読み取りは行いません。
        </p>

        <p className="mt-4">
          各連携はユーザーの明示的な同意のもとで行われ、設定ページからいつでも解除できます。
          連携を解除すると、保存されたトークンおよびキャッシュデータは即座に削除されます。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">4. ユーザーの責任</h2>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>アカウントの認証情報を安全に管理する責任はユーザーにあります</li>
          <li>本サービスを不正な目的で使用してはなりません</li>
          <li>本サービスの正常な運営を妨害する行為を行ってはなりません</li>
          <li>他のユーザーの利用を妨害する行為を行ってはなりません</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">5. 知的財産権</h2>
        <p>
          本サービスのソフトウェア、デザイン、コンテンツに関するすべての知的財産権は、
          本サービスの運営者に帰属します。ユーザーが本サービスに入力したデータの所有権は、
          引き続きユーザーに帰属します。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">6. 免責事項</h2>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>本サービスは「現状のまま」提供されます。明示または黙示を問わず、いかなる保証もいたしません</li>
          <li>本サービスの利用または利用不能により生じた直接的・間接的な損害について、運営者は責任を負いません</li>
          <li>Googleサービスの仕様変更、障害、停止などにより本サービスの機能が制限される場合があります</li>
          <li>本サービスは予告なくメンテナンスや機能変更を行う場合があります</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">7. サービスの変更・終了</h2>
        <p>
          運営者は、事前の通知なく本サービスの内容を変更、または提供を終了することができます。
          サービス終了時には、ユーザーのデータは適切に削除されます。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">8. 利用規約の変更</h2>
        <p>
          運営者は、必要に応じて本利用規約を変更することがあります。
          変更後の利用規約は、本ページに掲載した時点で効力を生じるものとします。
          重要な変更がある場合は、本サービス内で通知いたします。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">9. 準拠法</h2>
        <p>
          本利用規約は、日本法に準拠し、解釈されるものとします。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">10. お問い合わせ</h2>
        <p>
          本利用規約に関するご質問がございましたら、アプリ内のサポート機能からお問い合わせください。
        </p>
      </section>
    </>
  );
}

function EnContent() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Service Overview</h2>
        <p>
          Job Simplify ("the Service") is a dashboard application designed to streamline your job search.
          Users can manage job applications, view schedules, and organize emails all in one place.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Terms of Use</h2>
        <p>To use the Service, you must:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
          <li>Have a Google account</li>
          <li>Agree to these Terms of Service</li>
          <li>Use the Service only for lawful purposes</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Google Integration Services</h2>
        <p>The Service integrates with the following Google services:</p>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.1 Google Calendar</h3>
        <p>
          The Service uses the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">calendar.events</code> scope to
          read, create, edit, and delete calendar events. This is used to manage job-related schedules such as
          interviews and information sessions.
        </p>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.2 Gmail</h3>
        <p>
          The Service uses the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">gmail.metadata</code> scope to
          access only email metadata (sender, subject, date). We do not read the body content of your emails.
        </p>

        <p className="mt-4">
          Each integration requires your explicit consent and can be disconnected at any time from the Settings page.
          Upon disconnection, stored tokens and cached data are immediately deleted.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">4. User Responsibilities</h2>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>You are responsible for keeping your account credentials secure</li>
          <li>You must not use the Service for any unlawful purpose</li>
          <li>You must not interfere with the normal operation of the Service</li>
          <li>You must not interfere with other users' use of the Service</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Intellectual Property</h2>
        <p>
          All intellectual property rights in the Service's software, design, and content belong to the Service operator.
          You retain ownership of all data you input into the Service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Disclaimer</h2>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>The Service is provided "as is" without warranties of any kind, either express or implied</li>
          <li>The operator is not liable for any direct or indirect damages arising from the use or inability to use the Service</li>
          <li>Changes, outages, or discontinuation of Google services may limit the functionality of the Service</li>
          <li>The Service may undergo maintenance or feature changes without prior notice</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Service Changes and Termination</h2>
        <p>
          The operator may change or discontinue the Service at any time without prior notice.
          Upon termination, user data will be appropriately deleted.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Changes to Terms</h2>
        <p>
          The operator may modify these Terms of Service as necessary.
          Updated terms become effective upon posting on this page.
          Users will be notified within the Service of any significant changes.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Governing Law</h2>
        <p>
          These Terms of Service shall be governed by and construed in accordance with the laws of Japan.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact</h2>
        <p>
          If you have any questions about these Terms of Service, please contact us through the in-app support feature.
        </p>
      </section>
    </>
  );
}
