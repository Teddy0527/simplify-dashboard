import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { ToastProvider } from '../../hooks/useToast';

export default function DashboardLayout() {
  return (
    <ToastProvider>
      <div className="h-screen flex flex-col bg-editorial">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden flex flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
