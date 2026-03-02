import { lazy, Suspense } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';

const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DeadlinePresetsPage = lazy(() => import('./pages/DeadlinePresetsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const OnboardingWizardPage = lazy(() => import('./pages/OnboardingWizardPage'));

export const routes: RouteObject[] = [
  {
    path: 'onboarding',
    element: (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        }
      >
        <OnboardingWizardPage />
      </Suspense>
    ),
  },
  {
    element: <DashboardLayout />,
    children: [
      { index: true, element: <TrackerPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'deadlines', element: <DeadlinePresetsPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
