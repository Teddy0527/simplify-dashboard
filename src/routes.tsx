import { RouteObject, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import TrackerPage from './pages/TrackerPage';
import ProfilePage from './pages/ProfilePage';
import ESPage from './pages/ESPage';
import DeadlinePresetsPage from './pages/DeadlinePresetsPage';
import AdminPage from './pages/AdminPage';

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
