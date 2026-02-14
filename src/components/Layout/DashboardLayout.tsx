import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { ToastProvider } from '../../hooks/useToast';
import { usePageTracking } from '../../hooks/usePageTracking';

function LoadingSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardLayout() {
  usePageTracking();

  return (
    <ToastProvider>
        <div className="h-screen flex flex-col bg-white">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-hidden flex flex-col">
              <Suspense fallback={<LoadingSpinner />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
    </ToastProvider>
  );
}
