import { RouteObject, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import TrackerPage from './pages/TrackerPage';
import ProfilePage from './pages/ProfilePage';

export const routes: RouteObject[] = [
  {
    element: <DashboardLayout />,
    children: [
      { index: true, element: <TrackerPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
