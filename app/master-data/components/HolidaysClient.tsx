'use client';

import { useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { useMasterData } from './MasterDataContext';
import { HolidaysController } from './HolidaysController';
import { SkeletonHeader, SkeletonTable } from './Skeleton';

export default function HolidaysClient() {
  const { language } = useTranslation();
  const { isLoading, error, refreshData } = useMasterData();
  const [searchQuery, setSearchQuery] = useState('');
  const [controller] = useState(() => new HolidaysController());

  const filteredHolidays = controller.getFilteredHolidays(searchQuery);

  const handleExport = () => {
    // Modify to fix Swedish date string format timezone bug
    const headers = [
      language === 'th' ? 'วันที่' : 'Date',
      language === 'th' ? 'วันของสัปดาห์' : 'Day of Week',
      language === 'th' ? 'ชื่อวันหยุด (ไทย)' : 'Holiday Name (TH)',
      language === 'th' ? 'ชื่อวันหยุด (อังกฤษ)' : 'Holiday Name (EN)'
    ];

    const getDayName = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', { weekday: 'long' });
    };

    const rows = filteredHolidays.map((h) => [
      h.date,
      getDayName(h.date),
      h.nameTh,
      h.nameEn
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const localDateStr = new Date().toLocaleDateString('sv-SE');
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `public_holidays_2026_${localDateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', { weekday: 'short' });
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === 'en' ? 'en-US' : 'th-TH',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={language === 'th' ? 'ค้นหาวันหยุด...' : 'Search holiday calendar...'} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {language === 'th' ? 'วันหยุดนักขัตฤกษ์ปี 2026' : 'Public Holidays 2026'}
                </h2>
                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="p-1.5 hover:bg-zinc-100 rounded-xl transition-all border-none outline-none cursor-pointer flex items-center justify-center text-zinc-500 hover:text-zinc-900 active:scale-95 disabled:opacity-50"
                  title={language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh Data'}
                >
                  <span className={`material-symbols-outlined text-xl ${isLoading ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>
              </div>
              <p className="text-zinc-500 mt-2 text-base">
                {language === 'th'
                  ? 'ข้อมูลตารางวันหยุดประจำปีของธนาคารแห่งประเทศไทย ระบบจะปิดการจองวันลาในวันเหล่านี้โดยอัตโนมัติ'
                  : 'Official holiday schedule of the Bank of Thailand. Leave bookings are automatically disabled on these dates.'}
              </p>
            </div>
            {!isLoading && filteredHolidays.length > 0 && (
              <button
                onClick={handleExport}
                className="px-4 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border-none outline-none"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {language === 'th' ? 'ส่งออกวันหยุด CSV' : 'Export Holidays'}
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-8">
              <SkeletonHeader />
              <div className="h-16 bg-white border border-zinc-100 rounded-2xl animate-pulse"></div>
              <SkeletonTable rows={6} cols={3} />
            </div>
          ) : (
            <>
              {/* Search Box */}
              <div className="flex items-center gap-3 px-3 py-2 bg-white border border-zinc-150 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-zinc-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder={language === 'th' ? 'ค้นหาชื่อหรือวันที่ (เช่น 2026-04, สงกรานต์)...' : 'Search by name or date (e.g. 2026-04, Songkran)...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-850 placeholder-zinc-400"
                />
              </div>

              {/* Holidays List / Table */}
              <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/50">
                        <th className="p-4 pl-6 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/4">
                          {language === 'th' ? 'วันที่' : 'DATE'}
                        </th>
                        <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/6 text-center">
                          {language === 'th' ? 'วัน' : 'WEEKDAY'}
                        </th>
                        <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-7/12">
                          {language === 'th' ? 'ชื่อวันหยุดนักขัตฤกษ์' : 'HOLIDAY NAME'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHolidays.map((h, i) => (
                        <tr key={i} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/30 transition-colors">
                          <td className="p-4 pl-6 text-sm font-bold text-zinc-900">
                            {formatDisplayDate(h.date)}
                          </td>
                          <td className="p-4 text-sm font-semibold text-zinc-700 text-center">
                            <span className="px-2.5 py-1 bg-zinc-150 rounded-lg text-xs font-bold">
                              {getDayLabel(h.date)}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-zinc-800">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900">
                                {language === 'th' ? h.nameTh : h.nameEn}
                              </span>
                              <span className="text-[10px] text-zinc-450 font-semibold tracking-wide">
                                {language === 'th' ? h.nameEn : h.nameTh}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredHolidays.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-12 text-center text-sm text-zinc-400 font-semibold">
                            {language === 'th' ? 'ไม่พบวันหยุดราชการตามข้อความที่ค้นหา' : 'No public holidays match your query.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
