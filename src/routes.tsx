import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';

const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DeadlinePresetsPage = lazy(() => import('./pages/DeadlinePresetsPage'));
const JobSitesPage = lazy(() => import('./pages/JobSitesPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

export const routes: RouteObject[] = [
  {
    element: <DashboardLayout />,
    children: [
      { index: true, element: <TrackerPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'deadlines', element: <DeadlinePresetsPage /> },
      { path: 'sites', element: <JobSitesPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
