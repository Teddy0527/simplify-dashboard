import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

export default function Sidebar() {
  return (
    <nav className="w-48 bg-white border-r border-[var(--color-navy-100)] hidden md:flex flex-col py-4 flex-shrink-0">
      <div className="flex-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-[var(--color-navy-900)] bg-[var(--color-navy-50)] border-r-3 border-[var(--color-navy-800)]'
                  : 'text-[var(--color-navy-500)] hover:text-[var(--color-navy-700)] hover:bg-[var(--color-navy-50)]'
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
      <div className="px-4 pt-2 border-t border-[var(--color-navy-100)]">
        <NavLink
          to="/?add=true"
          className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium text-[var(--color-navy-600)] hover:text-[var(--color-navy-800)] hover:bg-[var(--color-navy-50)] transition-colors rounded"
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
