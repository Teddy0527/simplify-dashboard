import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';

const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ESPage = lazy(() => import('./pages/ESPage'));
const DeadlinePresetsPage = lazy(() => import('./pages/DeadlinePresetsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

export const routes: RouteObject[] = [
  {
    element: <DashboardLayout />,
    children: [
      { index: true, element: <TrackerPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'es', element: <ESPage /> },
      { path: 'deadlines', element: <DeadlinePresetsPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
