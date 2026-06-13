'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from './LanguageContext';

export default function SideNavBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { name: t('overview'), href: '/overview', icon: 'dashboard' },
    { name: t('calendar'), href: '/calendar', icon: 'calendar_month' },
    { name: t('balance'), href: '/balance', icon: 'account_balance_wallet' },
    { name: t('team'), href: '/team', icon: 'group' },
    { name: t('settings'), href: '/settings', icon: 'settings' },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full flex-col p-6 w-64 border-r border-zinc-100 bg-white z-50">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tighter text-zinc-900">HolidayHQ</h1>
          <p className="text-sm text-zinc-500">{t('teamManagement')}</p>
        </div>

        <nav className="flex flex-col gap-2 grow">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'text-zinc-900 bg-zinc-100 font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-50'
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

        <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center gap-3">
          <img
            alt="Takahashi S. Profile"
            className="w-10 h-10 rounded-full object-cover border border-zinc-100"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-zinc-900 truncate">Takahashi S.</p>
            <p className="text-xs text-zinc-500">{t('teamLead')}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100/80 px-4 py-2 flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
