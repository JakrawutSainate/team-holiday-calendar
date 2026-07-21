'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import TopNavBar from '@/src/components/TopNavBar';
import { useMasterData } from './MasterDataContext';
import { calendarDataService, CalendarEvent } from '@/src/libs/calendarData';

function formatDate(dateStr: string, lang: 'th' | 'en'): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      weekday: 'short',
    });
  } catch {
    return dateStr;
  }
}

function formatMonthLabel(yearMonth: string, lang: 'th' | 'en'): string {
  try {
    const [y, m] = yearMonth.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return yearMonth;
  }
}

export default function BulkClaimClient() {
  const { language } = useTranslation();
  const { role } = useRole();
  const { members } = useMasterData();
  const lang = language as 'th' | 'en';

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'HOLIDAY' | 'WEEKEND'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      try {
        setLoading(true);
        const data = await calendarDataService.getAllRawEvents();
        if (isMounted) {
          // Filter to only weekend work & holiday work events
          const workEvents = (data || []).filter(
            (e) => e.status === 'WEEKEND_WORK' || e.status === 'HOLIDAY_WORK'
          );
          setEvents(workEvents);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  // Unique Month-Year options
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    events.forEach((e) => {
      if (e.date) months.add(e.date.slice(0, 7));
    });
    return Array.from(months).sort();
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedUserId !== 'ALL' && e.userId !== selectedUserId) {
        return false;
      }
      if (selectedMonth !== 'ALL' && !e.date.startsWith(selectedMonth)) {
        return false;
      }
      if (selectedType === 'HOLIDAY' && e.status !== 'HOLIDAY_WORK') {
        return false;
      }
      if (selectedType === 'WEEKEND' && e.status !== 'WEEKEND_WORK') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = e.userName?.toLowerCase().includes(q);
        const matchDetails = e.details?.toLowerCase().includes(q);
        const matchDate = e.date.includes(q);
        if (!matchName && !matchDetails && !matchDate) return false;
      }
      return true;
    });
  }, [events, selectedUserId, selectedMonth, selectedType, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isAdmin) {
    return (
      <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
        <TopNavBar placeholder="" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-5xl text-zinc-300">
              lock
            </span>
            <p className="text-zinc-500 text-sm font-semibold">
              {lang === 'th'
                ? 'สงวนสิทธิ์สำหรับ Admin เท่านั้น'
                : 'Admin access required'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar
        placeholder={lang === 'th' ? 'ค้นหาประวัติวันทำงาน...' : 'Search work history...'}
      />

      <main className="flex-1 p-6 lg:p-12 pb-24 overflow-y-auto custom-scrollbar animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500 text-3xl font-bold">
                  history_edu
                </span>
                {lang === 'th'
                  ? 'ประวัติวันทำงานพิเศษที่บันทึกแล้ว'
                  : 'Special Workdays History'}
              </h2>
            </div>
            <p className="text-zinc-500 mt-1 text-sm font-medium">
              {lang === 'th'
                ? 'แสดงรายการวันทำงานในวันหยุดเสาร์-อาทิตย์ และวันหยุดราชการทั้งหมดที่บันทึกอยู่ในระบบ'
                : 'View all recorded weekend and public holiday work entries stored in the database.'}
            </p>
          </div>

          {/* User Filter Cards */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-zinc-400">
                  group
                </span>
                {lang === 'th' ? 'กรองตามสมาชิกในทีม' : 'Filter by Team Member'}
              </h3>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setSelectedUserId('ALL')}
                className={`px-4 py-2.5 rounded-2xl border-2 transition-all cursor-pointer font-bold text-xs flex items-center gap-2 flex-shrink-0 ${
                  selectedUserId === 'ALL'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900'
                    : 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">apps</span>
                <span>{lang === 'th' ? 'สมาชิกทั้งหมด' : 'All Members'}</span>
              </button>

              {members.map((m) => {
                const isSelected = selectedUserId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedUserId(m.id)}
                    className={`flex items-center gap-2.5 p-2 px-3.5 rounded-2xl border-2 transition-all cursor-pointer flex-shrink-0 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-zinc-100 bg-white hover:border-zinc-200'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-zinc-600 font-bold text-xs">
                          {m.name?.[0]}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content & Filter Bar */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search Box */}
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-xl">
                  <span className="material-symbols-outlined text-sm text-zinc-400">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'th' ? 'ค้นหางาน หรือชื่อ...' : 'Search task or name...'}
                    className="bg-transparent text-xs font-semibold text-zinc-800 outline-none w-40 sm:w-48 placeholder-zinc-400"
                  />
                </div>

                {/* Month Filter */}
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-xl">
                  <span className="material-symbols-outlined text-sm text-zinc-400">
                    calendar_month
                  </span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-xs font-bold text-zinc-800 outline-none cursor-pointer pr-1"
                  >
                    <option value="ALL">{lang === 'th' ? 'ทุกเดือน' : 'All Months'}</option>
                    {monthOptions.map((ym) => (
                      <option key={ym} value={ym}>
                        {formatMonthLabel(ym, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day Type Filter */}
                <div className="flex items-center bg-zinc-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setSelectedType('ALL')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedType === 'ALL'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {lang === 'th' ? 'ทุกประเภท' : 'All Types'}
                  </button>
                  <button
                    onClick={() => setSelectedType('HOLIDAY')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedType === 'HOLIDAY'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {lang === 'th' ? 'วันหยุดราชการ 🎌' : 'Holidays 🎌'}
                  </button>
                  <button
                    onClick={() => setSelectedType('WEEKEND')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedType === 'WEEKEND'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {lang === 'th' ? 'เสาร์-อาทิตย์ 📅' : 'Weekends 📅'}
                  </button>
                </div>
              </div>

              <div className="text-xs font-bold text-zinc-400">
                {lang === 'th'
                  ? `แสดง ${filteredEvents.length} รายการ`
                  : `Showing ${filteredEvents.length} entries`}
              </div>
            </div>

            {/* List of History Items */}
            {loading ? (
              <div className="py-12 text-center text-zinc-400 flex flex-col items-center">
                <span className="material-symbols-outlined text-3xl animate-spin mb-2">
                  progress_activity
                </span>
                <p className="text-xs font-semibold">
                  {lang === 'th' ? 'กำลังโหลดประวัติ...' : 'Loading history...'}
                </p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-zinc-400">
                <span className="material-symbols-outlined text-4xl mb-2 text-zinc-300">
                  find_in_page
                </span>
                <p className="text-xs font-semibold">
                  {lang === 'th'
                    ? 'ไม่พบประวัติวันทำงานที่ตรงกับเงื่อนไข'
                    : 'No work history entries match your filters'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((e) => {
                  const isExpanded = expandedIds.has(e.id);
                  const isHol = e.status === 'HOLIDAY_WORK';

                  // Parse project tag from details if formatted like [AMC_PC]
                  let projectTag = '';
                  let detailText = e.details || '';
                  if (detailText.startsWith('[')) {
                    const closingIdx = detailText.indexOf(']');
                    if (closingIdx > 0) {
                      projectTag = detailText.slice(1, closingIdx);
                      detailText = detailText.slice(closingIdx + 1).trim();
                    }
                  }

                  return (
                    <div
                      key={e.id}
                      className="border border-zinc-200/80 rounded-2xl p-4 transition-all bg-white hover:border-zinc-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Badge Icon */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isHol
                                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700'
                                : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-700'
                            }`}
                          >
                            {isHol ? '🎌' : '📅'}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-zinc-900">
                                {formatDate(e.date, lang)}
                              </span>
                              <span className="text-xs font-semibold text-zinc-500">
                                ({e.userName})
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isHol
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {isHol
                                  ? (lang === 'th' ? 'วันหยุดราชการ' : 'Public Holiday')
                                  : (lang === 'th' ? 'เวรเสาร์-อาทิตย์' : 'Weekend Shift')}
                              </span>
                            </div>

                            {/* Project Pills */}
                            {projectTag && (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {projectTag.split(',').map((proj) => (
                                  <span
                                    key={proj.trim()}
                                    className="px-2 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200/60 rounded-md text-[10px] font-bold"
                                  >
                                    {proj.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Toggle */}
                        {detailText && (
                          <button
                            onClick={() => toggleExpand(e.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
                          >
                            <span>
                              {isExpanded
                                ? (lang === 'th' ? 'ซ่อนรายละเอียด' : 'Hide details')
                                : (lang === 'th' ? 'ดูรายละเอียดงาน' : 'Show details')}
                            </span>
                            <span className="material-symbols-outlined text-sm">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Collapsible Details */}
                      {isExpanded && detailText && (
                        <div className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-600 bg-zinc-50/80 p-3 rounded-xl animate-fade-in">
                          <p className="font-semibold text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
                            {lang === 'th' ? 'รายละเอียดงาน (Git Log):' : 'Task Summary:'}
                          </p>
                          <p className="text-zinc-700 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                            {detailText}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
