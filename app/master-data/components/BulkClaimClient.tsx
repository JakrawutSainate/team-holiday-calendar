'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import TopNavBar from '@/src/components/TopNavBar';
import { toast } from 'sonner';
import { useMasterData } from './MasterDataContext';
import { calendarDataService } from '@/src/libs/calendarData';

// ─── Embedded weekend/holiday work data ──────────────────────────────────────
// Sourced from docs/weekend_tasks_db_format.json.
// Deduplicated by date (multiple projects on the same day → 1 entry).
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

  // Deduplicate: collapse same-date entries, merge project names
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
    return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export default function BulkClaimClient() {
  const { language } = useTranslation();
  const { role } = useRole();
  const { members } = useMasterData();
  const lang = language as 'th' | 'en';

  const [selectedUserId, setSelectedUserId] = useState('');
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
  const [claiming, setClaiming] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const isAdmin = role === 'ADMIN';

  const toggleAll = (val: boolean) => {
    if (val) setCheckedDates(new Set(RAW_ENTRIES.map(e => e.date)));
    else setCheckedDates(new Set());
  };

  const toggleDate = (date: string) => {
    setCheckedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const selectedUser = useMemo(() => members.find(m => m.id === selectedUserId), [members, selectedUserId]);

  const entriesToClaim = useMemo(
    () => RAW_ENTRIES.filter(e => checkedDates.has(e.date)),
    [checkedDates]
  );

  const handleConfirm = async () => {
    if (!selectedUserId || entriesToClaim.length === 0) return;
    setClaiming(true);
    try {
      const payload = entriesToClaim.map(e => ({
        date: e.date,
        status: toStatus(e),
        details: `[${e.projects.join(', ')}] ${e.summary}`.slice(0, 500),
      }));
      const result = await calendarDataService.adminBulkClaimTokens(selectedUserId, payload);
      if (result) {
        toast.success(
          lang === 'th'
            ? `เคลมสำเร็จ ${result.claimed} วัน (+${result.claimed} tokens) / ข้ามซ้ำ ${result.skipped} วัน`
            : `Claimed ${result.claimed} day(s) (+${result.claimed} tokens). Skipped ${result.skipped} duplicate(s).`
        );
        setStep(1);
        setSelectedUserId('');
        setCheckedDates(new Set());
      } else {
        toast.error(lang === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'An error occurred. Please try again.');
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
            <span className="material-symbols-outlined text-5xl text-zinc-300">lock</span>
            <p className="text-zinc-500 text-sm font-semibold">
              {lang === 'th' ? 'สงวนสิทธิ์สำหรับ Admin เท่านั้น' : 'Admin access required'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={lang === 'th' ? 'เคลม Token...' : 'Bulk Token Claim...'} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

          {/* Header */}
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                {lang === 'th' ? 'เคลม Token วันทำงานพิเศษ' : 'Bulk Token Claim'}
              </h2>
            </div>
            <p className="text-zinc-500 mt-2 text-base">
              {lang === 'th'
                ? 'Admin เคลม Token ให้ผู้ใช้จากข้อมูลวันทำงานในวันหยุดเสาร์-อาทิตย์และวันหยุดราชการ'
                : 'Admin claims weekend/holiday tokens for users from historical work data.'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs font-bold">
            {([1, 2, 3] as const).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-zinc-900 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-zinc-100 text-zinc-400'
                }`}>
                  {step > s ? <span className="material-symbols-outlined text-sm">check</span> : s}
                </div>
                <span className={step === s ? 'text-zinc-900' : 'text-zinc-400'}>
                  {s === 1 ? (lang === 'th' ? 'เลือก User' : 'Select User') :
                   s === 2 ? (lang === 'th' ? 'เลือกวัน' : 'Choose Days') :
                             (lang === 'th' ? 'ยืนยัน' : 'Confirm')}
                </span>
                {s < 3 && <span className="text-zinc-200 text-lg">›</span>}
              </div>
            ))}
          </div>

          {/* STEP 1: Select user */}
          {step === 1 && (
            <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_1px_6px_rgba(0,0,0,0.04)] space-y-5">
              <h3 className="text-sm font-bold text-zinc-800">
                {lang === 'th' ? 'เลือกผู้ใช้ที่จะเคลม Token ให้' : 'Select the user to claim tokens for'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedUserId(m.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                      selectedUserId === m.id
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-100 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {m.avatarUrl
                        ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                        : <span className="text-zinc-600 font-bold text-base">{m.name?.[0]}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{m.title || m.role}</p>
                      <p className="text-[10px] text-blue-600 font-bold mt-0.5">{m.tokensBalance ?? 0} tokens</p>
                    </div>
                    {selectedUserId === m.id && (
                      <span className="material-symbols-outlined text-zinc-900 text-lg ml-auto">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedUserId}
                  className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none"
                >
                  {lang === 'th' ? 'ถัดไป' : 'Next'}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select days */}
          {step === 2 && (
            <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
              {/* Toolbar */}
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-zinc-800">
                    {lang === 'th' ? `รายการวันทำงาน (${RAW_ENTRIES.length} วัน)` : `Work days (${RAW_ENTRIES.length} entries)`}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {lang === 'th' ? `เลือกแล้ว ${checkedDates.size} วัน` : `${checkedDates.size} selected`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAll(true)}
                    className="px-3 py-1.5 text-xs font-bold border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer outline-none"
                  >
                    {lang === 'th' ? 'เลือกทั้งหมด' : 'Select All'}
                  </button>
                  <button
                    onClick={() => toggleAll(false)}
                    className="px-3 py-1.5 text-xs font-bold border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer outline-none"
                  >
                    {lang === 'th' ? 'ยกเลิกทั้งหมด' : 'Deselect All'}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-4 py-3 text-left font-bold text-zinc-500 w-10"></th>
                      <th className="px-4 py-3 text-left font-bold text-zinc-500">{lang === 'th' ? 'วันที่' : 'Date'}</th>
                      <th className="px-4 py-3 text-left font-bold text-zinc-500">{lang === 'th' ? 'ประเภท' : 'Type'}</th>
                      <th className="px-4 py-3 text-left font-bold text-zinc-500">{lang === 'th' ? 'โปรเจกต์' : 'Project'}</th>
                      <th className="px-4 py-3 text-left font-bold text-zinc-500">{lang === 'th' ? 'งานที่ทำ' : 'Summary'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RAW_ENTRIES.map((entry) => {
                      const checked = checkedDates.has(entry.date);
                      const isHol = entry.is_public_holiday;
                      return (
                        <tr
                          key={entry.date}
                          onClick={() => toggleDate(entry.date)}
                          className={`border-b border-zinc-50 transition-all cursor-pointer ${checked ? 'bg-zinc-900/[0.02]' : 'hover:bg-zinc-50'}`}
                        >
                          <td className="px-4 py-3">
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                              checked ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'
                            }`}>
                              {checked && <span className="material-symbols-outlined text-white" style={{ fontSize: 12 }}>check</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-zinc-800">{formatDate(entry.date, lang)}</p>
                            <p className="text-zinc-400 text-[10px]">{entry.day_of_week}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isHol ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {isHol
                                ? (lang === 'th' ? '🎌 วันหยุดราชการ' : '🎌 Public Holiday')
                                : (lang === 'th' ? '📅 วันหยุดสุดสัปดาห์' : '📅 Weekend')}
                            </span>
                            {isHol && <p className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[120px]">{entry.holiday_name}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-zinc-600 truncate max-w-[150px]" title={entry.projects.join(', ')}>{entry.projects.join(', ')}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-zinc-500 truncate max-w-[220px]" title={entry.summary}>{entry.summary}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-100 flex justify-between items-center">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 transition-colors cursor-pointer outline-none"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  {lang === 'th' ? 'ย้อนกลับ' : 'Back'}
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={checkedDates.size === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none"
                >
                  {lang === 'th' ? `ถัดไป (${checkedDates.size} วัน)` : `Next (${checkedDates.size} days)`}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && (
            <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-[0_1px_6px_rgba(0,0,0,0.04)] space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-white text-3xl">token</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900">
                  {lang === 'th' ? 'ยืนยันการเคลม Token' : 'Confirm Token Claim'}
                </h3>
              </div>

              {/* Summary card */}
              <div className="bg-zinc-50 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">{lang === 'th' ? 'ผู้รับ Token' : 'Recipient'}</span>
                  <span className="font-bold text-zinc-900">{selectedUser?.name ?? selectedUserId}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">{lang === 'th' ? 'จำนวนวัน' : 'Days'}</span>
                  <span className="font-bold text-zinc-900">{entriesToClaim.length} {lang === 'th' ? 'วัน' : 'day(s)'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">{lang === 'th' ? 'Token ที่จะได้รับ' : 'Tokens to earn'}</span>
                  <span className="font-bold text-green-600 text-lg">+{entriesToClaim.length}.0</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">{lang === 'th' ? 'ยอดใหม่ (คาดการณ์)' : 'Est. new balance'}</span>
                  <span className="font-bold text-zinc-900">{((selectedUser as any)?.tokensBalance ?? 0) + entriesToClaim.length}.0</span>
                </div>
              </div>

              {/* Date preview */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-500">{lang === 'th' ? 'วันที่จะเคลม:' : 'Days to claim:'}</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {entriesToClaim.map(e => (
                    <span key={e.date} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      e.is_public_holiday ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {formatDate(e.date, lang)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 transition-colors cursor-pointer outline-none"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  {lang === 'th' ? 'ย้อนกลับ' : 'Back'}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={claiming}
                  className="flex items-center gap-2 px-8 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer border-none outline-none shadow-lg"
                >
                  {claiming
                    ? <span className="material-symbols-outlined text-base animate-spin">sync</span>
                    : <span className="material-symbols-outlined text-base">token</span>
                  }
                  {claiming
                    ? (lang === 'th' ? 'กำลังเคลม...' : 'Claiming...')
                    : (lang === 'th' ? `ยืนยันเคลม ${entriesToClaim.length} Token` : `Confirm Claim ${entriesToClaim.length} Tokens`)}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
