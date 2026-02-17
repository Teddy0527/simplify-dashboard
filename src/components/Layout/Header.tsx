import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileNav from './MobileNav';
import { URLS } from '../../constants/urls';
import { useAuth } from '../../shared/hooks/useAuth';

export default function Header() {
  const { user, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || '';
  const email = user?.email || '';

  return (
    <header className="h-14 border-b border-gray-200 bg-white px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <MobileNav />
        <a href={URLS.LP} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
          <img src="/lockup.svg" alt="JobSimplify" className="h-14" />
        </a>
      </div>

      {user && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-colors focus:outline-none"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
                <p className="text-xs text-gray-500 truncate">{email}</p>
              </div>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { setOpen(false); navigate('/profile'); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                プロフィール
              </button>
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      )}

      {!user && (
        <button
          onClick={signIn}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="white" fillOpacity="0.9" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" fillOpacity="0.9" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="white" fillOpacity="0.9" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" fillOpacity="0.9" />
          </svg>
          ログイン
        </button>
      )}
    </header>
  );
}
