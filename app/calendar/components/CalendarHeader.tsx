'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslation } from '@/src/components/LanguageContext';
import { useAuth } from '@/src/components/AuthContext';
interface CalendarHeaderProps {
  year: number;
  month: number;
  role: 'ADMIN' | 'USER';
  tokens: number;
  onRequestLeave: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export default function CalendarHeader({
  year,
  month,
  role,
  tokens,
  onRequestLeave,
  onExportExcel,
  onExportPdf
}: CalendarHeaderProps) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Month names in English
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Month names in Thai
  const monthNamesTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const getMonthName = (mIndex: number) => {
    return language === 'en' ? monthNamesEn[mIndex] : monthNamesTh[mIndex];
  };

  const navigateToMonth = (newYear: number, newMonth: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', newYear.toString());
    params.set('month', newMonth.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      navigateToMonth(year - 1, 12);
    } else {
      navigateToMonth(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      navigateToMonth(year + 1, 1);
    } else {
      navigateToMonth(year, month + 1);
    }
  };

  return (
    <section className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8 w-full">
      <div>
        <h2 className="text-4xl font-bold tracking-tight mb-2 text-primary">
          📅 {t('shiftCalendar')}
        </h2>
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="text-xl font-bold text-primary">
            {getMonthName(month - 1)} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {user && role === 'USER' && (
          <button 
            onClick={onRequestLeave} 
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-base font-semibold hover:bg-zinc-800 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined">add_circle</span>
            {language === 'th' ? 'ส่งใบลา' : 'Request Leave'}
          </button>
        )}

        {user && role === 'USER' && (
          <div className="px-5 py-3 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl border border-tertiary-fixed-dim shadow-sm flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">{t('availableTokens')}</span>
              <span className="text-xl font-bold leading-none">{tokens} {t('tokens')}</span>
            </div>
            <span className="material-symbols-outlined text-[32px]">confirmation_number</span>
          </div>
        )}

        {user && (
          <>
            <button onClick={onExportExcel} className="flex items-center gap-2 px-6 py-3 bg-surface-container-low border border-outline-variant text-primary rounded-xl text-base font-semibold hover:bg-surface-container transition-all cursor-pointer">
              <span className="material-symbols-outlined">download</span>
              {language === 'th' ? 'ส่งออก Excel' : 'Export Excel'}
            </button>
            <button onClick={onExportPdf} className="flex items-center gap-2 px-6 py-3 bg-surface-container-low border border-outline-variant text-primary rounded-xl text-base font-semibold hover:bg-surface-container transition-all cursor-pointer">
              <span className="material-symbols-outlined">print</span>
              {language === 'th' ? 'ส่งออก PDF' : 'Export PDF'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
