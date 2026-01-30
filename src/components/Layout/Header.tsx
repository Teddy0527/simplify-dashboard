import { Link } from 'react-router-dom';
import MobileNav from './MobileNav';

export default function Header() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
          <span className="text-white text-base font-semibold">S</span>
        </div>
        <h1 className="text-base font-semibold text-gray-900 tracking-wide">
          Simplify Japan
        </h1>
      </div>
      <Link
        to="/settings"
        className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        設定
      </Link>
    </header>
  );
}
