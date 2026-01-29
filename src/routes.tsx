import { RouteObject } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import TrackerPage from './pages/TrackerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

export const routes: RouteObject[] = [
  {
    element: <DashboardLayout />,
    children: [
      { index: true, element: <TrackerPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
];
