import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import OnboardingStepProfile from '../components/onboarding/OnboardingStepProfile';
import OnboardingStepCompanies from '../components/onboarding/OnboardingStepCompanies';
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

  // Redirect completed/skipped users away
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/', { replace: true });
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
  const canFinish = selectedCompanies.length >= 1;

  const goNext = () => setStep(1);
  const goBack = () => setStep(0);

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

  // Loading / auth guard
  if (authLoading || !allowed) {
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
            {[0, 1].map((i) => (
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

        {/* Skip link (step 2 only) */}
        {step === 1 && <div className="text-center mt-4">
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
