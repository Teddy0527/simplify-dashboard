import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import OnboardingStepProfile from '../components/onboarding/OnboardingStepProfile';
import OnboardingStepCompanies from '../components/onboarding/OnboardingStepCompanies';
import OnboardingStepReferral from '../components/onboarding/OnboardingStepReferral';
import {
  getSupabase,
  createCompany,
  mapMasterIndustry,
  addCompany as addCompanyRepo,
  saveProfile,
  getProfile,
  trackEventAsync,
} from '@jobsimplify/shared';
import type { CompanySearchResult } from '@jobsimplify/shared';
import { normalizeWebsiteDomain } from '../utils/url';

export default function OnboardingWizardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { signIn } = useAuth();

  // Redirect completed/skipped users away
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // 未ログイン → ログイン画面を表示（allowed=false のまま）
      return;
    }
    (async () => {
      const { data: profile } = await getSupabase()
        .from('profiles')
        .select('onboarding_status')
        .eq('id', user.id)
        .single();
      const status = profile?.onboarding_status;
      if (status === 'completed' || status === 'skipped') {
        navigate('/', { replace: true });
      } else {
        setAllowed(true);
      }
    })();
  }, [user, authLoading, navigate]);

  // Step state
  const [step, setStep] = useState(0);

  // Step 1 data
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [grade, setGrade] = useState('');

  // Step 2 data
  const [selectedCompanies, setSelectedCompanies] = useState<CompanySearchResult[]>([]);

  // Step 3 data
  const [referralSource, setReferralSource] = useState('');
  const [referralSourceDetail, setReferralSourceDetail] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const handleAddCompany = useCallback((company: CompanySearchResult) => {
    setSelectedCompanies((prev) => {
      if (prev.some((c) => c.id === company.id)) return prev;
      return [...prev, company];
    });
  }, []);

  const handleRemoveCompany = useCallback((id: string) => {
    setSelectedCompanies((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const canProceedStep1 = lastName.trim() !== '' && firstName.trim() !== '' && graduationYear !== null && university.trim() !== '' && faculty.trim() !== '' && grade !== '';
  const canProceedStep2 = selectedCompanies.length >= 1;
  const canFinish = referralSource !== '';

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => s - 1);

  const handleComplete = async () => {
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      // 1. Update profiles table
      await getSupabase()
        .from('profiles')
        .update({
          last_name: lastName.trim(),
          first_name: firstName.trim(),
          full_name: `${lastName.trim()} ${firstName.trim()}`,
          graduation_year: graduationYear,
          university: university.trim(),
          faculty: faculty.trim(),
          grade,
          referral_source: referralSource || null,
          referral_source_detail: referralSourceDetail.trim() || null,
          onboarding_status: 'started',
          onboarding_version: 2,
          onboarding_variant: 'onboarding_v1',
        })
        .eq('id', user.id);

      // 2. Mirror to user_profiles.profile_data
      try {
        const existing = await getProfile();
        await saveProfile({
          ...existing,
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          university: university.trim(),
          faculty: faculty.trim(),
          graduationYear: graduationYear!,
          grade,
        });
      } catch {
        // Non-critical — profile_data mirror can fail silently
      }

      // 3. Add selected companies to kanban
      for (const sc of selectedCompanies) {
        const base = createCompany(sc.name);
        const industry = sc.industry ? mapMasterIndustry(sc.industry) : undefined;
        const websiteDomain = normalizeWebsiteDomain(sc.websiteDomain || sc.websiteUrl);

        await addCompanyRepo({
          ...base,
          industry: industry || undefined,
          status: 'interested',
          websiteDomain: websiteDomain || undefined,
          recruitUrl: sc.recruitUrl || undefined,
          companyMasterId: sc.source === 'master' ? sc.id : undefined,
          corporateNumber: sc.source === 'nta' ? sc.corporateNumber : undefined,
        });
      }

      // 4. Pre-complete checklist "add_company" (already done in wizard)
      const STORAGE_KEY = 'onboarding_checklist_v3';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['add_company']));

      // 5. Track event
      trackEventAsync('onboarding_wizard.completed', {
        has_name: true,
        graduation_year: graduationYear,
        university: university.trim(),
        faculty: faculty.trim(),
        grade,
        referral_source: referralSource || null,
        companies_count: selectedCompanies.length,
        company_ids: selectedCompanies.map((c) => c.id),
      });

      // 6. Navigate to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[OnboardingWizard] Failed to complete:', err);
      setSubmitting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  // 未ログイン → ログイン画面
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary-700">JobSimplify</h1>
            <p className="text-sm text-gray-500 mt-1">就活をもっとシンプルに</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-10 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">はじめましょう</h2>
            <p className="text-sm text-gray-500 mb-8">
              Googleアカウントでログインして、就活管理を始めましょう。
            </p>
            <button
              type="button"
              onClick={signIn}
              className="btn-primary w-full inline-flex items-center justify-center gap-3 py-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでログイン
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ログイン済みだがプロフィール確認中
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
      <div className="w-full max-w-xl">
        {/* Logo / branding */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-700">JobSimplify</h1>
          <p className="text-sm text-gray-500 mt-1">就活をもっとシンプルに</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-6 pb-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-primary-600' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          {step === 0 && (
            <div className="px-6 py-6">
              <OnboardingStepProfile
                lastName={lastName}
                firstName={firstName}
                graduationYear={graduationYear}
                university={university}
                faculty={faculty}
                grade={grade}
                onLastNameChange={setLastName}
                onFirstNameChange={setFirstName}
                onGraduationYearChange={setGraduationYear}
                onUniversityChange={setUniversity}
                onFacultyChange={setFaculty}
                onGradeChange={setGrade}
              />
              <div className="mt-6">
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canProceedStep1}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="px-6 py-6 min-h-[400px]">
              <OnboardingStepCompanies
                selectedCompanies={selectedCompanies}
                onAdd={handleAddCompany}
                onRemove={handleRemoveCompany}
              />
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="btn-secondary"
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canProceedStep2}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="px-6 py-6">
              <OnboardingStepReferral
                referralSource={referralSource}
                referralSourceDetail={referralSourceDetail}
                onReferralSourceChange={setReferralSource}
                onReferralSourceDetailChange={setReferralSourceDetail}
              />
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="btn-secondary"
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={!canFinish || submitting}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      設定中...
                    </span>
                  ) : (
                    'はじめる'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skip link */}
        {step >= 1 && <div className="text-center mt-4">
          <button
            type="button"
            onClick={async () => {
              if (!user) return;
              await getSupabase()
                .from('profiles')
                .update({
                  onboarding_status: 'skipped',
                  onboarding_version: 2,
                  onboarding_skipped_at: new Date().toISOString(),
                })
                .eq('id', user.id);
              trackEventAsync('onboarding.skipped', { onboarding_version: 2 });
              navigate('/', { replace: true });
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            スキップして始める
          </button>
        </div>}
      </div>
    </div>
  );
}
