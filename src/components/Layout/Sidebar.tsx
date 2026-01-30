import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

export default function Sidebar() {
  return (
    <nav className="w-48 bg-white border-r border-gray-200 hidden md:flex flex-col py-4 flex-shrink-0">
      <div className="flex-1">
        {NAV_ITEMS.map((item) => (
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
    </nav>
  );
}
