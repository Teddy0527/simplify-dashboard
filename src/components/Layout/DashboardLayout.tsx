import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ExtensionBanner from '../Common/ExtensionBanner';
import { ToastProvider } from '../../hooks/useToast';

export default function DashboardLayout() {
  return (
    <ToastProvider>
      <div className="h-screen flex flex-col bg-white">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 pb-0">
              <ExtensionBanner />
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
