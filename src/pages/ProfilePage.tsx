import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Profile, DEFAULT_PROFILE, Qualification } from '../shared/types';
import { getProfile, saveProfile } from '../shared/repositories/profileRepository';
import { hiraganaToKatakana } from '../shared/utils/formatters';

/**
 * Extract hiragana characters from a string
 */
function extractHiragana(str: string): string {
  return str.replace(/[^\u3041-\u3096]/g, '');
}

/**
 * Custom hook for capturing furigana from IME composition events
 */
function useIMEFurigana(
  setProfile: React.Dispatch<React.SetStateAction<Profile>>,
  hiraganaField: 'lastNameHiragana' | 'firstNameHiragana'
) {
  const readingRef = useRef<string>('');
  const isComposingRef = useRef<boolean>(false);

  const onCompositionStart = useCallback(() => {
    isComposingRef.current = true;
    readingRef.current = '';
  }, []);

  const onCompositionUpdate = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    if (e.data) {
      readingRef.current = e.data;
    }
  }, []);

  const onCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const converted = e.data || '';
    const reading = readingRef.current;

    if (converted && reading && converted !== reading) {
      const hiragana = extractHiragana(reading);
      if (hiragana) {
        setProfile(prev => ({
          ...prev,
          [hiraganaField]: hiragana
        }));
      }
    }
    readingRef.current = '';
  }, [setProfile, hiraganaField]);

  return { onCompositionStart, onCompositionUpdate, onCompositionEnd };
}

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [savedRecently, setSavedRecently] = useState(false);
  const [postalLoading, setPostalLoading] = useState(false);

  const lastNameIME = useIMEFurigana(setProfile, 'lastNameHiragana');
  const firstNameIME = useIMEFurigana(setProfile, 'firstNameHiragana');

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile.postalCode?.length !== 7) return;
    let cancelled = false;
    setPostalLoading(true);
    fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${profile.postalCode}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled || !data.results?.[0]) return;
        const r = data.results[0];
        setProfile(prev => ({
          ...prev,
          prefecture: r.address1 || prev.prefecture,
          city: r.address2 || prev.city,
          address1: r.address3 || prev.address1,
        }));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPostalLoading(false); });
    return () => { cancelled = true; };
  }, [profile.postalCode]);

  async function loadProfile() {
    const savedProfile = await getProfile();
    setProfile(savedProfile);
    setQualifications(savedProfile.qualifications || []);
  }

  function handleChange(field: keyof Profile, value: string | number) {
    setProfile((prev) => ({ ...prev, [field]: value }));

    if (field === 'lastNameHiragana') {
      setProfile((prev) => ({ ...prev, lastNameKana: hiraganaToKatakana(value as string) }));
    }
    if (field === 'firstNameHiragana') {
      setProfile((prev) => ({ ...prev, firstNameKana: hiraganaToKatakana(value as string) }));
    }
  }

  function addQualification() {
    setQualifications([...qualifications, { name: '', date: '' }]);
  }

  function updateQualification(index: number, field: keyof Qualification, value: string) {
    const updated = [...qualifications];
    updated[index] = { ...updated[index], [field]: value };
    setQualifications(updated);
  }

  function removeQualification(index: number) {
    setQualifications(qualifications.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const startTime = Date.now();

    try {
      await saveProfile({ ...profile, qualifications });

      const elapsed = Date.now() - startTime;
      if (elapsed < 300) {
        await new Promise(resolve => setTimeout(resolve, 300 - elapsed));
      }

      setMessage({ type: 'success', text: '保存しました' });
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
    <div className="max-w-3xl mx-auto py-8 px-6">
      {/* Page header */}
      <div className="mb-8 animate-in">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-gray-900)' }}>
          プロフィール
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-gray-500)' }}>
          自動入力に使用される基本情報を管理します
        </p>
      </div>

      {/* Toast notification */}
      {message && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slideIn shadow-lg">
          <div className={`toast ${message.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
              {message.text}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <section className="paper-card p-6 animate-in">
          <h3 className="section-heading">基本情報</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="input-label">姓</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                onCompositionStart={lastNameIME.onCompositionStart}
                onCompositionUpdate={lastNameIME.onCompositionUpdate}
                onCompositionEnd={lastNameIME.onCompositionEnd}
                className="input-field"
                placeholder="山田"
              />
            </div>
            <div>
              <label className="input-label">名</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                onCompositionStart={firstNameIME.onCompositionStart}
                onCompositionUpdate={firstNameIME.onCompositionUpdate}
                onCompositionEnd={firstNameIME.onCompositionEnd}
                className="input-field"
                placeholder="太郎"
              />
            </div>
            <div>
              <label className="input-label">せい（ひらがな）</label>
              <input
                type="text"
                value={profile.lastNameHiragana}
                onChange={(e) => handleChange('lastNameHiragana', e.target.value)}
                className="input-field"
                placeholder="やまだ"
              />
            </div>
            <div>
              <label className="input-label">めい（ひらがな）</label>
              <input
                type="text"
                value={profile.firstNameHiragana}
                onChange={(e) => handleChange('firstNameHiragana', e.target.value)}
                className="input-field"
                placeholder="たろう"
              />
            </div>
            <div>
              <label className="input-label">セイ（カタカナ）</label>
              <input
                type="text"
                value={profile.lastNameKana}
                onChange={(e) => handleChange('lastNameKana', e.target.value)}
                className="input-field bg-gray-100"
                placeholder="ヤマダ"
                readOnly
              />
            </div>
            <div>
              <label className="input-label">メイ（カタカナ）</label>
              <input
                type="text"
                value={profile.firstNameKana}
                onChange={(e) => handleChange('firstNameKana', e.target.value)}
                className="input-field bg-gray-100"
                placeholder="タロウ"
                readOnly
              />
            </div>
            <div>
              <label className="input-label">生年月日</label>
              <input
                type="date"
                value={profile.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">性別</label>
              <select
                value={profile.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="select-field"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 連絡先 */}
        <section className="paper-card p-6 animate-in" style={{ animationDelay: '0.05s' }}>
          <h3 className="section-heading">連絡先</h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="input-label">メールアドレス</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="input-field"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="input-label">携帯電話番号</label>
              <input
                type="tel"
                value={profile.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
                className="input-field"
                placeholder="09012345678"
              />
            </div>
            <div>
              <label className="input-label">自宅電話番号（任意）</label>
              <input
                type="tel"
                value={profile.homePhoneNumber || ''}
                onChange={(e) => handleChange('homePhoneNumber', e.target.value.replace(/\D/g, ''))}
                className="input-field"
                placeholder="0312345678"
              />
            </div>
          </div>
        </section>

        {/* 住所 */}
        <section className="paper-card p-6 animate-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="section-heading">住所</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="input-label">郵便番号</label>
              <div className="relative">
                <input
                  type="text"
                  value={profile.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value.replace(/\D/g, ''))}
                  maxLength={7}
                  className="input-field"
                  placeholder="1234567"
                />
                {postalLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="input-label">都道府県</label>
              <input
                type="text"
                list="prefecture-list"
                value={profile.prefecture}
                onChange={(e) => handleChange('prefecture', e.target.value)}
                className="input-field"
                placeholder="東京都"
                autoComplete="address-level1"
              />
              <datalist id="prefecture-list">
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref} />
                ))}
              </datalist>
            </div>
            <div className="col-span-2">
              <label className="input-label">市区町村</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="input-field"
                placeholder="渋谷区"
              />
            </div>
            <div className="col-span-2">
              <label className="input-label">町名・番地</label>
              <input
                type="text"
                value={profile.address1}
                onChange={(e) => handleChange('address1', e.target.value)}
                className="input-field"
                placeholder="道玄坂1-2-3"
              />
            </div>
            <div className="col-span-2">
              <label className="input-label">建物名・部屋番号（任意）</label>
              <input
                type="text"
                value={profile.address2 || ''}
                onChange={(e) => handleChange('address2', e.target.value)}
                className="input-field"
                placeholder="○○マンション101号室"
              />
            </div>
          </div>
        </section>

        {/* 学歴 */}
        <section className="paper-card p-6 animate-in" style={{ animationDelay: '0.15s' }}>
          <h3 className="section-heading">学歴</h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="input-label">大学名</label>
              <input
                type="text"
                value={profile.university}
                onChange={(e) => handleChange('university', e.target.value)}
                className="input-field"
                placeholder="○○大学"
              />
            </div>
            <div>
              <label className="input-label">学部</label>
              <input
                type="text"
                value={profile.faculty}
                onChange={(e) => handleChange('faculty', e.target.value)}
                className="input-field"
                placeholder="経済学部"
              />
            </div>
            <div>
              <label className="input-label">学科</label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="input-field"
                placeholder="経済学科"
              />
            </div>
            <div>
              <label className="input-label">卒業予定年</label>
              <input
                type="number"
                value={profile.graduationYear}
                onChange={(e) => handleChange('graduationYear', parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="2026"
              />
            </div>
            <div>
              <label className="input-label">卒業予定月</label>
              <select
                value={profile.graduationMonth}
                onChange={(e) => handleChange('graduationMonth', parseInt(e.target.value))}
                className="select-field"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}月
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="input-label">出身高校（任意）</label>
              <input
                type="text"
                value={profile.highSchool || ''}
                onChange={(e) => handleChange('highSchool', e.target.value)}
                className="input-field"
                placeholder="○○高等学校"
              />
            </div>
            <div>
              <label className="input-label">ゼミ・研究室（任意）</label>
              <input
                type="text"
                value={profile.seminarLab || ''}
                onChange={(e) => handleChange('seminarLab', e.target.value)}
                className="input-field"
                placeholder="○○ゼミ"
              />
            </div>
            <div>
              <label className="input-label">研究テーマ（任意）</label>
              <input
                type="text"
                value={profile.researchTheme || ''}
                onChange={(e) => handleChange('researchTheme', e.target.value)}
                className="input-field"
                placeholder="○○に関する研究"
              />
            </div>
          </div>
        </section>

        {/* 資格・スキル */}
        <section className="paper-card p-6 animate-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="section-heading">資格・スキル</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="input-label">TOEICスコア（任意）</label>
              <input
                type="number"
                value={profile.toeicScore || ''}
                onChange={(e) => handleChange('toeicScore', parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="800"
                min={0}
                max={990}
              />
            </div>
            <div>
              <label className="input-label">TOEIC受験日（任意）</label>
              <input
                type="month"
                value={profile.toeicDate || ''}
                onChange={(e) => handleChange('toeicDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="col-span-2">
              <label className="input-label">運転免許（任意）</label>
              <input
                type="text"
                value={profile.driverLicense || ''}
                onChange={(e) => handleChange('driverLicense', e.target.value)}
                className="input-field"
                placeholder="普通自動車第一種運転免許"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="input-label mb-0">その他の資格</label>
              <button
                type="button"
                onClick={addQualification}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: 'var(--color-primary-600)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                追加
              </button>
            </div>
            {qualifications.map((qual, index) => (
              <div key={index} className="flex gap-3 mb-3 animate-in">
                <input
                  type="text"
                  value={qual.name}
                  onChange={(e) => updateQualification(index, 'name', e.target.value)}
                  className="input-field flex-1"
                  placeholder="資格名"
                />
                <input
                  type="month"
                  value={qual.date}
                  onChange={(e) => updateQualification(index, 'date', e.target.value)}
                  className="input-field w-40"
                />
                <button
                  type="button"
                  onClick={() => removeQualification(index)}
                  className="px-3 py-2 rounded-lg transition-colors"
                  style={{ color: 'var(--color-error-600)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* その他 */}
        <section className="paper-card p-6 animate-in" style={{ animationDelay: '0.25s' }}>
          <h3 className="section-heading">その他</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="input-label">趣味（任意）</label>
              <input
                type="text"
                value={profile.hobby || ''}
                onChange={(e) => handleChange('hobby', e.target.value)}
                className="input-field"
                placeholder="読書、旅行"
              />
            </div>
            <div>
              <label className="input-label">部活・サークル（任意）</label>
              <input
                type="text"
                value={profile.club || ''}
                onChange={(e) => handleChange('club', e.target.value)}
                className="input-field"
                placeholder="○○サークル"
              />
            </div>
          </div>
        </section>

        {/* 保存ボタン */}
        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={saving}
            className={`btn-primary px-8 ${savedRecently ? 'btn-success' : ''}`}
          >
            <span className="flex items-center gap-2">
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  保存中...
                </>
              ) : savedRecently ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  保存完了
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  保存する
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}
