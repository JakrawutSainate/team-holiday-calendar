'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from './LanguageContext';
import { useRole } from './RoleContext';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { useConfirm } from './ConfirmDialog';
import { useState, useEffect } from 'react';

export default function SideNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language } = useTranslation();
  const { role } = useRole();

  const { user, logout, openLogin } = useAuth();
  const confirm = useConfirm();

  const [isMasterDataExpanded, setIsMasterDataExpanded] = useState(false);

  // Automatically expand Master Data if active route is under /master-data
  useEffect(() => {
    if (pathname.startsWith('/master-data')) {
      setIsMasterDataExpanded(true);
    }
  }, [pathname]);

  const navItems = [
    { name: t('overview'), href: '/overview', icon: 'dashboard' },
    { name: t('calendar'), href: '/calendar', icon: 'calendar_month' },
    { name: t('myLeaves'), href: '/leaves', icon: 'event_busy' },
    { name: language === 'th' ? 'เอกสารใบลางาน' : 'Leave Documents', href: '/leave-documents', icon: 'description' },
    { name: t('balance'), href: '/balance', icon: 'account_balance_wallet' },
    { name: t('team'), href: '/team', icon: 'group' },
    { name: t('masterData'), href: '/master-data', icon: 'storage' },
    { name: t('settings'), href: '/settings', icon: 'settings' },
  ];

  const masterDataSubItems = [
    { name: language === 'th' ? 'คลังลายเซ็น' : 'Signature Library', href: '/master-data/signatures', icon: 'draw' },
    { name: language === 'th' ? 'ข้อมูลผู้ใช้งานและโควตา' : 'User Data & Quotas', href: '/master-data/users', icon: 'badge' },
    { name: language === 'th' ? 'วันหยุดนักขัตฤกษ์' : 'Public Holidays', href: '/master-data/holidays', icon: 'calendar_today' },
    { name: language === 'th' ? 'ขีดจำกัดคนลา' : 'Capacity Settings', href: '/master-data/capacities', icon: 'speed' },
    { name: language === 'th' ? 'แผนกและตำแหน่ง' : 'Departments & Titles', href: '/master-data/departments', icon: 'schema' },
    { name: language === 'th' ? 'ประเภทการลา' : 'Leave Types', href: '/master-data/leave-types', icon: 'format_list_bulleted' },
    ...(role === 'ADMIN' ? [{ name: language === 'th' ? 'ประวัติระบบ' : 'Audit Logs', href: '/master-data/audit-logs', icon: 'history' }] : []),
    ...(role === 'ADMIN' ? [{ name: language === 'th' ? 'เคลม Token วันหยุด' : 'Bulk Token Claim', href: '/master-data/bulk-claim', icon: 'token' }] : []),
  ];

  // Filter items based on login status and role
  const filteredItems = navItems.filter((item) => {
    // If guest (not logged in): only show Calendar and Team
    if (!user) {
      return item.href === '/calendar' || item.href === '/team';
    }
    // If not admin: hide settings page
    if (role !== 'ADMIN' && item.href === '/settings') {
      return false;
    }
    return true;
  });

  // Keep mobile bottom bar to exactly 5 key items to avoid overflow/crowding
  const mobileFilteredItems = filteredItems.filter((item) => {
    if (!user) {
      return item.href === '/calendar' || item.href === '/team';
    }
    return (
      item.href === '/calendar' ||
      item.href === '/leaves' ||
      item.href === '/leave-documents' ||
      item.href === '/balance' ||
      item.href === '/master-data'
    );
  });

  const handleLogout = async () => {
    const ok = await confirm({
      title: t('logoutConfirmTitle'),
      text: t('logoutConfirmText'),
      confirmText: t('logout') || 'Sign Out',
      cancelText: t('cancel') || 'Cancel',
      variant: 'danger',
    });
    if (ok) {
      logout();
      toast.success(t('logoutSuccessTitle'), { description: t('logoutSuccessText') });
      router.push('/calendar');
    }
  };

  const defaultAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO';

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full flex-col p-6 w-64 border-r border-zinc-100 bg-white z-50 overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <Link href="/calendar" className="block">
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-900">HolidayHQ</h1>
            <p className="text-sm text-zinc-500">{t('teamManagement')}</p>
          </Link>
        </div>

        <nav className="flex flex-col gap-1.5 grow">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;

            if (item.href === '/master-data') {
              const isMasterActive = pathname.startsWith('/master-data');
              return (
                <div key={item.href} className="flex flex-col gap-1">
                  <div className={`flex items-center justify-between rounded-lg transition-colors ${
                    isMasterActive ? 'bg-zinc-50 text-zinc-900 font-semibold' : 'text-zinc-500 hover:bg-zinc-50/50'
                  }`}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2.5 grow text-sm"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={isMasterActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMasterDataExpanded(!isMasterDataExpanded);
                      }}
                      className="p-2.5 text-zinc-400 hover:text-zinc-950 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${isMasterDataExpanded ? 'rotate-180' : ''}`}>
                        keyboard_arrow_down
                      </span>
                    </button>
                  </div>
                  {isMasterDataExpanded && (
                    <div className="flex flex-col gap-1 pl-4 ml-6 border-l border-zinc-100 mt-0.5 mb-1.5 animate-slide-down">
                      {masterDataSubItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-xs font-semibold ${
                              isSubActive
                                ? 'text-zinc-900 bg-zinc-100 font-bold'
                                : 'text-zinc-500 hover:bg-zinc-50/50'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">{subItem.icon}</span>
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'text-zinc-900 bg-zinc-100 font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-50/50'
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

        {/* Footer Account Section */}
        <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-3">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  alt={`${user.name} Profile`}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-100 bg-zinc-50"
                  src={user.avatarUrl || defaultAvatar}
                />
                <div className="overflow-hidden w-full flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{user.name}</p>
                  <p className="text-xs text-zinc-500 font-medium truncate">{user.title || user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-zinc-200 hover:border-zinc-300 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                {t('logout') || 'Sign Out'}
              </button>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors text-center cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              {t('login') || 'Sign In'}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100/80 px-4 py-2 flex justify-between items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="flex justify-around items-center flex-1">
          {mobileFilteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
                  isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                }`}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] tracking-tight">{item.name}</span>
              </Link>
            );
          })}
          
          {/* Sign In/Out in Mobile Nav */}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 py-1 px-2 text-zinc-400 cursor-pointer bg-transparent border-0 outline-none"
            >
              <span className="material-symbols-outlined text-2xl">logout</span>
              <span className="text-[10px] tracking-tight">{t('logout') || 'Sign Out'}</span>
            </button>
          ) : (
            <button
              onClick={openLogin}
              className="flex flex-col items-center gap-1 py-1 px-2 text-zinc-400 cursor-pointer bg-transparent border-0 outline-none"
            >
              <span className="material-symbols-outlined text-2xl">login</span>
              <span className="text-[10px] tracking-tight">{t('login') || 'Sign In'}</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
