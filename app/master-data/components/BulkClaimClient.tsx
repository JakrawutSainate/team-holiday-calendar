'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import TopNavBar from '@/src/components/TopNavBar';
import { toast } from 'sonner';
import { useMasterData } from './MasterDataContext';
import { calendarDataService } from '@/src/libs/calendarData';

// ─── Embedded weekend/holiday work data ──────────────────────────────────────
const RAW_ENTRIES: Array<{
  date: string;
  day_of_week: string;
  is_public_holiday: boolean;
  holiday_name: string | null;
  projects: string[];
  summary: string;
}> = (() => {
  const raw = [
    { date: '2025-10-23', day_of_week: 'Thursday', is_public_holiday: true,  holiday_name: 'วันปิยมหาราช (King Chulalongkorn Memorial Day)', project: 'AMC_PC',                   summary: 'edit | feature addjust AboutUS page' },
    { date: '2025-10-25', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'AMC_PC',                   summary: 'Update ApiRoutes.js (Fix) | Update ApiRoute.js' },
    { date: '2025-10-26', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'AMC_PC',                   summary: 'Merge branch main | Update AboutUs.jsx | Refactor deploy workflow | edit Main.jsx' },
    { date: '2025-11-01', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'AMC_PC',                   summary: 'Update AboutUs.jsx | Update connector.js' },
    { date: '2025-12-10', day_of_week: 'Wednesday',is_public_holiday: true,  holiday_name: 'วันรัฐธรรมนูญ (Constitution Day)',       project: 'AMC_PC',                   summary: 'feat: introduce Services page | debug payment' },
    { date: '2026-02-14', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'Update Requirement file for AI' },
    { date: '2026-02-15', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'Update Requirement.md | Add project approval workflow' },
    { date: '2026-02-21', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'Add board approval UI and approval emails' },
    { date: '2026-02-22', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'fix: resolve port conflicts | feat: setup CI/CD pipeline' },
    { date: '2026-02-28', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'feat: Initialize monorepo structure with Turborepo' },
    { date: '2026-03-03', day_of_week: 'Tuesday',  is_public_holiday: true,  holiday_name: 'วันมาฆบูชา (Makha Bucha Day)',            project: 'E-Bidding_Beatrix-BootStrape', summary: 'Introduce SSR session BFF | feat: CI/CD Docker deployment' },
    { date: '2026-03-15', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'AMC_PC',                   summary: 'feat: implement banner controller | feat: Initialize Express server' },
    { date: '2026-03-21', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'update surrogate approve | update feature reject' },
    { date: '2026-03-22', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'fix: supplier reject / revert | update wording' },
    { date: '2026-03-28', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'feat: implement monorepo with NestJS' },
    { date: '2026-03-29', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'feat: CI/CD pipeline for automated deployment' },
    { date: '2026-04-04', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'update Reports | Update InviteSupplier.tsx' },
    { date: '2026-04-05', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'update invite vendor' },
    { date: '2026-04-18', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'refactor routing | feat: year filtering | ปรับแก้หน้าแดชบอด' },
    { date: '2026-04-19', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'update | Merge remote-tracking branch' },
    { date: '2026-05-04', day_of_week: 'Monday',   is_public_holiday: true,  holiday_name: 'วันฉัตรมงคล (Coronation Day)',           project: 'amctrainingcenter',        summary: 'feat: implement frontend pages | feat: initialize Express server' },
    { date: '2026-05-23', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'PEA-Hackathon',             summary: 'update' },
    { date: '2026-05-30', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'PEA-Hackathon',             summary: 'feat: price intelligence dashboard | feat: CI/CD pipeline' },
    { date: '2026-06-01', day_of_week: 'Monday',   is_public_holiday: true,  holiday_name: 'วันหยุดชดเชยวันวิสาขบูชา',             project: 'E-Bidding_Beatrix-BootStrape | PEA-Hackathon', summary: 'feat: user/company profile management | ci: 2-stage verification pipeline' },
    { date: '2026-06-07', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape | PEA-Hackathon', summary: 'fix: approval status handling | feat: procurement service logic' },
    { date: '2026-06-13', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape | PEA-Hackathon', summary: 'Merge PR #31 | feat: update role access | update excel format' },
    { date: '2026-06-14', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape | PEA-Hackathon', summary: 'chore: Docker v0.1.3 | feat: add RFP number | update wording' },
    { date: '2026-06-21', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'chore: Docker v0.1.7 | Refactor code structure' },
    { date: '2026-06-27', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'AMC_PC',                   summary: 'update' },
    { date: '2026-06-28', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'feat: update VendorImportModal step count' },
    { date: '2026-07-04', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'update clear cache | fix: event and vendor data fetching' },
    { date: '2026-07-05', day_of_week: 'Sunday',   is_public_holiday: false, holiday_name: null, project: 'E-Bidding_Beatrix-BootStrape', summary: 'update | Update version 0.2.6 | debug' },
    { date: '2026-07-11', day_of_week: 'Saturday', is_public_holiday: false, holiday_name: null, project: 'amctrainingcenter | E-Bidding_Beatrix-BootStrape', summary: 'feat: GenericSkeleton loader | update version to 1.0.0' },
  ];

  const byDate = new Map<string, typeof raw[0] & { projects: string[] }>();
  for (const r of raw) {
    if (!byDate.has(r.date)) {
      byDate.set(r.date, { ...r, projects: [r.project] });
    } else {
      const existing = byDate.get(r.date)!;
      if (!existing.projects.includes(r.project)) existing.projects.push(r.project);
      existing.summary = existing.summary + ' | ' + r.summary;
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
})();

function toStatus(entry: typeof RAW_ENTRIES[0]): 'WEEKEND_WORK' | 'HOLIDAY_WORK' {
  return entry.is_public_holiday ? 'HOLIDAY_WORK' : 'WEEKEND_WORK';
}

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
  const { t, language } = useTranslation();
  const { role } = useRole();
  const { members, refreshData } = useMasterData();
  const lang = language as 'th' | 'en';

  const [selectedUserId, setSelectedUserId] = useState('');
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
  const [claiming, setClaiming] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'HOLIDAY' | 'WEEKEND'>('ALL');

  const isAdmin = role === 'ADMIN';

  // Unique Month-Year options extracted from RAW_ENTRIES
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    RAW_ENTRIES.forEach((e) => months.add(e.date.slice(0, 7)));
    return Array.from(months).sort();
  }, []);

  // Filtered Entries based on Month and Type
  const filteredEntries = useMemo(() => {
    return RAW_ENTRIES.filter((e) => {
      if (selectedMonth !== 'ALL' && !e.date.startsWith(selectedMonth)) {
        return false;
      }
      if (selectedType === 'HOLIDAY' && !e.is_public_holiday) {
        return false;
      }
      if (selectedType === 'WEEKEND' && e.is_public_holiday) {
        return false;
      }
      return true;
    });
  }, [selectedMonth, selectedType]);

  const selectedUser = useMemo(
    () => members.find((m) => m.id === selectedUserId),
    [members, selectedUserId]
  );

  const entriesToClaim = useMemo(
    () => RAW_ENTRIES.filter((e) => checkedDates.has(e.date)),
    [checkedDates]
  );

  const toggleDate = (date: string) => {
    setCheckedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const toggleExpand = (date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const selectAllVisible = () => {
    setCheckedDates((prev) => {
      const next = new Set(prev);
      filteredEntries.forEach((e) => next.add(e.date));
      return next;
    });
  };

  const clearSelection = () => {
    setCheckedDates(new Set());
  };

  const handleConfirm = async () => {
    if (!selectedUserId || entriesToClaim.length === 0) return;
    setClaiming(true);
    try {
      const payload = entriesToClaim.map((e) => ({
        date: e.date,
        status: toStatus(e),
        details: `[${e.projects.join(', ')}] ${e.summary}`.slice(0, 500),
      }));
      const result = await calendarDataService.adminBulkClaimTokens(
        selectedUserId,
        payload
      );
      if (result) {
        toast.success(
          lang === 'th'
            ? `เคลมสำเร็จ ${result.claimed} วัน (+${result.claimed} tokens) ให้แก่ ${selectedUser?.name}`
            : `Successfully claimed ${result.claimed} day(s) (+${result.claimed} tokens) for ${selectedUser?.name}`
        );
        setCheckedDates(new Set());
        refreshData();
      } else {
        toast.error(
          lang === 'th'
            ? 'เกิดข้อผิดพลาด กรุณาลองใหม่'
            : 'An error occurred. Please try again.'
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setClaiming(false);
    }
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
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background pb-32">
      <TopNavBar
        placeholder={lang === 'th' ? 'เคลม Token กลุ่ม...' : 'Bulk Token Claim...'}
      />

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500 text-3xl font-bold">
                  military_tech
                </span>
                {lang === 'th'
                  ? 'เคลม Token วันทำงานพิเศษ (Bulk Claim)'
                  : 'Bulk Token Claim'}
              </h2>
            </div>
            <p className="text-zinc-500 mt-1 text-sm font-medium">
              {lang === 'th'
                ? 'ระบบแผงควบคุมสำหรับ Admin ในการเคลม Token วันหยุด/เสาร์-อาทิตย์ย้อนหลังให้สมาชิกในทีม'
                : 'Admin control panel for bulk claiming historical weekend and holiday overtime tokens.'}
            </p>
          </div>

          {/* SECTION 1: Select User */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-zinc-400">
                  person_search
                </span>
                {t('selectRecipient')}
              </h3>
              {selectedUser && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    check_circle
                  </span>
                  {selectedUser.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {members.map((m) => {
                const isSelected = selectedUserId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedUserId(m.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                        : 'border-zinc-100 bg-white hover:border-zinc-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-zinc-200/60">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-zinc-600 font-bold text-sm">
                          {m.name?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {m.name}
                      </p>
                      <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                        {m.tokensBalance ?? 0} Tokens
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Work Days List with Filter Bar */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-6">
            {/* Filter Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3 flex-wrap">
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
                    <option value="ALL">{t('allMonths')}</option>
                    {monthOptions.map((ym) => (
                      <option key={ym} value={ym}>
                        {formatMonthLabel(ym, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day Type Filter Pills */}
                <div className="flex items-center bg-zinc-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setSelectedType('ALL')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedType === 'ALL'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {t('allTypes')}
                  </button>
                  <button
                    onClick={() => setSelectedType('HOLIDAY')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedType === 'HOLIDAY'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {t('holidaysOnly')}
                  </button>
                  <button
                    onClick={() => setSelectedType('WEEKEND')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedType === 'WEEKEND'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {t('weekendsOnly')}
                  </button>
                </div>
              </div>

              {/* Quick Select Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllVisible}
                  className="px-3.5 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    select_all
                  </span>
                  {t('selectAllVisible')} ({filteredEntries.length})
                </button>
                {checkedDates.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {t('clearSelection')}
                  </button>
                )}
              </div>
            </div>

            {/* List of Work Day Cards */}
            <div className="space-y-3">
              {filteredEntries.length === 0 ? (
                <div className="py-12 text-center text-zinc-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-zinc-300">
                    find_in_page
                  </span>
                  <p className="text-xs font-semibold">
                    {lang === 'th'
                      ? 'ไม่พบรายการวันทำงานที่ตรงกับเงื่อนไข'
                      : 'No work entries match your filters'}
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const isChecked = checkedDates.has(entry.date);
                  const isExpanded = expandedDates.has(entry.date);
                  const isHol = entry.is_public_holiday;

                  return (
                    <div
                      key={entry.date}
                      onClick={() => toggleDate(entry.date)}
                      className={`border rounded-2xl p-4 transition-all cursor-pointer ${
                        isChecked
                          ? 'border-amber-500 bg-amber-500/[0.02] shadow-xs'
                          : 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Checkbox */}
                          <div
                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                              isChecked
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'border-zinc-300 bg-white'
                            }`}
                          >
                            {isChecked && (
                              <span className="material-symbols-outlined text-sm font-bold">
                                check
                              </span>
                            )}
                          </div>

                          {/* Date and Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-zinc-900">
                                {formatDate(entry.date, lang)}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isHol
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {isHol
                                  ? `🎌 ${entry.holiday_name || (lang === 'th' ? 'วันหยุดราชการ' : 'Public Holiday')}`
                                  : (lang === 'th' ? '📅 วันหยุดสุดสัปดาห์' : '📅 Weekend')}
                              </span>
                            </div>

                            {/* Project Pills */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {entry.projects.map((proj) => (
                                <span
                                  key={proj}
                                  className="px-2 py-0.5 bg-zinc-100 text-zinc-600 border border-zinc-200/60 rounded-md text-[10px] font-bold"
                                >
                                  {proj}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Toggle */}
                        <button
                          onClick={(e) => toggleExpand(entry.date, e)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
                        >
                          <span>
                            {isExpanded ? t('hideWorkDetails') : t('showWorkDetails')}
                          </span>
                          <span className="material-symbols-outlined text-sm">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      </div>

                      {/* Collapsible Details Content */}
                      {isExpanded && (
                        <div
                          className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-600 bg-zinc-50/80 p-3 rounded-xl animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="font-semibold text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
                            {lang === 'th' ? 'รายละเอียดงาน (Git Log):' : 'Task Summary:'}
                          </p>
                          <p className="text-zinc-700 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                            {entry.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 p-4 px-6 z-40 shadow-[0_-4px_25px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Selected Info Summary */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold flex-shrink-0">
              <span className="material-symbols-outlined text-xl">token</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-medium">
                  {lang === 'th' ? 'ผู้รับ Token:' : 'Recipient:'}
                </span>
                <span className="text-xs font-bold text-zinc-900">
                  {selectedUser ? selectedUser.name : (lang === 'th' ? 'ยังไม่ได้เลือกผู้ใช้' : 'No user selected')}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-sm font-extrabold text-amber-600">
                  +{entriesToClaim.length}.0 Tokens ({entriesToClaim.length} {lang === 'th' ? 'วัน' : 'days'})
                </span>
                {selectedUser && (
                  <span className="text-xs text-zinc-500 font-semibold border-l border-zinc-200 pl-3">
                    {t('estNewBalance')}:{' '}
                    <span className="font-bold text-zinc-900">
                      {((selectedUser as any)?.tokensBalance ?? 0) + entriesToClaim.length}.0
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Confirm Action Button */}
          <button
            onClick={handleConfirm}
            disabled={!selectedUserId || entriesToClaim.length === 0 || claiming}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none outline-none"
          >
            {claiming ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">
                  progress_activity
                </span>
                <span>{t('claiming')}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg font-bold">
                  bolt
                </span>
                <span>
                  {t('confirmBulkClaim').replace('{count}', entriesToClaim.length.toString())}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
