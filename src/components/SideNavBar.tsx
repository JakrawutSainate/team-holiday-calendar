'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideNavBar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/overview', icon: 'dashboard' },
    { name: 'Calendar', href: '/calendar', icon: 'calendar_month' },
    { name: 'Balance', href: '/balance', icon: 'account_balance_wallet' },
    { name: 'Team', href: '/team', icon: 'group' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-6 w-64 border-r border-outline-variant bg-surface z-50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tighter text-primary">HolidayHQ</h1>
        <p className="text-sm text-secondary">Team Management</p>
      </div>

      <nav className="flex flex-col gap-2 flex-grow">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-body-sm text-body-sm ${
                isActive
                  ? 'text-primary bg-secondary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-outline-variant flex items-center gap-3">
        <img
          alt="User profile"
          className="w-10 h-10 rounded-full object-cover border border-outline-variant"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO"
        />
        <div>
          <p className="text-sm font-semibold text-on-surface truncate">Takahashi S.</p>
          <p className="text-[10px] uppercase tracking-wider text-secondary">Team Lead</p>
        </div>
      </div>
    </aside>
  );
}
