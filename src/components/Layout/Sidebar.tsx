import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import { URLS } from '../../constants/urls';
import { checkIsAdmin } from '@jobsimplify/shared';

interface SidebarProps {
  onFeedbackClick?: () => void;
}

export default function Sidebar({ onFeedbackClick }: SidebarProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
  }, []);

  return (
    <nav className="w-48 bg-white border-r border-gray-200 hidden md:flex flex-col py-4 flex-shrink-0">
      <div className="flex-1">
        {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary-800 bg-primary-50 border-r-3 border-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </div>
      <button
        onClick={onFeedbackClick}
        className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-50 w-full text-left"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        フィードバック
      </button>
      <a
        href={URLS.CHROME_STORE}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
        Chrome拡張機能
      </a>
    </nav>
  );
}
