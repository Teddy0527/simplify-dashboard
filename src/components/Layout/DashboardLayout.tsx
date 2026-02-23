import { Suspense, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { ToastProvider } from '../../hooks/useToast';
import { usePageTracking } from '../../hooks/usePageTracking';
import { useSessionTracking } from '../../hooks/useSessionTracking';
import { OnboardingProvider } from '../../contexts/OnboardingContext';
import OnboardingChecklist from '../onboarding/OnboardingChecklist';
import WelcomeModal from '../onboarding/WelcomeModal';
import FeedbackModal from '../feedback/FeedbackModal';

function LoadingSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardLayout() {
  usePageTracking();
  useSessionTracking();

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const handleFeedbackClick = useCallback(() => setFeedbackOpen(true), []);
  const handleFeedbackClose = useCallback(() => setFeedbackOpen(false), []);

  return (
    <ToastProvider>
      <OnboardingProvider>
        <div className="h-screen flex flex-col bg-white">
          <Header onFeedbackClick={handleFeedbackClick} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar onFeedbackClick={handleFeedbackClick} />
            <main className="flex-1 overflow-hidden flex flex-col">
              <Suspense fallback={<LoadingSpinner />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
        <OnboardingChecklist />
        <WelcomeModal />
        <FeedbackModal externalOpen={feedbackOpen} onExternalClose={handleFeedbackClose} />
      </OnboardingProvider>
    </ToastProvider>
  );
}
