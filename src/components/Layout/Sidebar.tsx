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
      <div className="px-4 pt-2 border-t border-gray-200">
        <NavLink
          to="/?add=true"
          className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 transition-colors rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          応募を追加
        </NavLink>
      </div>
    </nav>
  );
}
