'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { useMasterData } from './MasterDataContext';
import {
  fetchHolidaysAction,
  createHolidayAction,
  updateHolidayAction,
  deleteHolidayAction,
  HolidayItem,
} from '../actions';
import { SkeletonHeader, SkeletonTable } from './Skeleton';

export default function HolidaysClient() {
  const { language } = useTranslation();
  const { isLoading: isMasterLoading, error: masterError, refreshData } = useMasterData();

  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [nameThInput, setNameThInput] = useState('');
  const [nameEnInput, setNameEnInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingHoliday, setDeletingHoliday] = useState<HolidayItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Holidays from DB
  const loadHolidays = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHolidaysAction();
      setHolidays(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load holidays');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  // Filtered list
  const filteredHolidays = holidays.filter((h) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      h.date.includes(q) ||
      h.nameTh.toLowerCase().includes(q) ||
      h.nameEn.toLowerCase().includes(q)
    );
  });

  // Export CSV
  const handleExport = () => {
    const headers = [
      language === 'th' ? 'วันที่' : 'Date',
      language === 'th' ? 'วันของสัปดาห์' : 'Day of Week',
      language === 'th' ? 'ชื่อวันหยุด (ไทย)' : 'Holiday Name (TH)',
      language === 'th' ? 'ชื่อวันหยุด (อังกฤษ)' : 'Holiday Name (EN)',
    ];

    const getDayName = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', { weekday: 'long' });
    };

    const rows = filteredHolidays.map((h) => [
      h.date,
      getDayName(h.date),
      h.nameTh,
      h.nameEn,
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const localDateStr = new Date().toLocaleDateString('sv-SE');
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `public_holidays_${localDateStr}.csv`);
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
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Modal handlers
  const openAddModal = () => {
    setEditingHoliday(null);
    setDateInput(new Date().toISOString().split('T')[0]);
    setNameThInput('');
    setNameEnInput('');
    setActionError(null);
    setShowModal(true);
  };

  const openEditModal = (holiday: HolidayItem) => {
    setEditingHoliday(holiday);
    setDateInput(holiday.date);
    setNameThInput(holiday.nameTh);
    setNameEnInput(holiday.nameEn);
    setActionError(null);
    setShowModal(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateInput || !nameThInput.trim() || !nameEnInput.trim()) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      if (editingHoliday) {
        const res = await updateHolidayAction(
          editingHoliday.id,
          dateInput,
          nameThInput.trim(),
          nameEnInput.trim()
        );
        if (!res.success) throw new Error(res.error);
        showToast(language === 'th' ? 'อัปเดตวันหยุดเรียบร้อยแล้ว' : 'Holiday updated');
      } else {
        const res = await createHolidayAction(
          dateInput,
          nameThInput.trim(),
          nameEnInput.trim()
        );
        if (!res.success) throw new Error(res.error);
        showToast(language === 'th' ? 'เพิ่มวันหยุดใหม่เรียบร้อยแล้ว' : 'Holiday created');
      }

      setShowModal(false);
      await loadHolidays();
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHoliday = async () => {
    if (!deletingHoliday) return;
    setActionError(null);

    const res = await deleteHolidayAction(deletingHoliday.id);
    if (res.success) {
      showToast(
        language === 'th'
          ? `ลบวันหยุด ${deletingHoliday.nameTh} เรียบร้อยแล้ว`
          : `Deleted ${deletingHoliday.nameEn}`
      );
      setDeletingHoliday(null);
      await loadHolidays();
      await refreshData();
    } else {
      setActionError(res.error || 'Failed to delete holiday');
    }
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-zinc-50/50">
      <TopNavBar placeholder={language === 'th' ? 'ค้นหาวันหยุด...' : 'Search holiday calendar...'} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-slide-up border border-zinc-800">
          <span className="material-symbols-outlined text-green-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-zinc-200/80 p-6 rounded-3xl shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600">
                  <span className="material-symbols-outlined text-2xl">event_busy</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                    {language === 'th' ? 'ตารางวันหยุดนักขัตฤกษ์' : 'Public Holidays'}
                  </h2>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {language === 'th'
                      ? 'จัดการตารางวันหยุดประจำปี เพิ่ม แก้ไข หรือลบวันหยุดนักขัตฤกษ์ในระบบ'
                      : 'Manage annual public holidays directory. Add, edit or remove holiday dates.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  loadHolidays();
                  refreshData();
                }}
                disabled={isLoading || isMasterLoading}
                className="p-2.5 hover:bg-zinc-100 rounded-2xl transition-all border border-zinc-200 outline-none cursor-pointer flex items-center justify-center text-zinc-600 hover:text-zinc-900 active:scale-95 disabled:opacity-50"
                title={language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh Data'}
              >
                <span
                  className={`material-symbols-outlined text-xl ${
                    isLoading || isMasterLoading ? 'animate-spin' : ''
                  }`}
                >
                  refresh
                </span>
              </button>

              {filteredHolidays.length > 0 && (
                <button
                  onClick={handleExport}
                  className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>{language === 'th' ? 'ส่งออก CSV' : 'Export CSV'}</span>
                </button>
              )}

              <button
                onClick={openAddModal}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>{language === 'th' ? 'เพิ่มวันหยุดใหม่' : 'Add Holiday'}</span>
              </button>
            </div>
          </div>

          {(error || masterError || actionError) && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{actionError || error || masterError}</span>
              </div>
              <button
                onClick={() => setActionError(null)}
                className="text-red-400 hover:text-red-700 text-xs font-bold cursor-pointer"
              >
                ปิด
              </button>
            </div>
          )}

          {isLoading || isMasterLoading ? (
            <div className="space-y-8">
              <SkeletonHeader />
              <div className="h-16 bg-white border border-zinc-100 rounded-2xl animate-pulse"></div>
              <SkeletonTable rows={6} cols={3} />
            </div>
          ) : (
            <>
              {/* Search Box */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs">
                <span className="material-symbols-outlined text-zinc-400 text-xl">search</span>
                <input
                  type="text"
                  placeholder={
                    language === 'th'
                      ? 'ค้นหาชื่อวันหยุดหรือวันที่ (เช่น 2026-04, สงกรานต์)...'
                      : 'Search by name or date (e.g. 2026-04, Songkran)...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 placeholder-zinc-400"
                />
              </div>

              {/* Holidays Table */}
              <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/60">
                        <th className="p-4 pl-6 text-xs font-bold text-zinc-400 uppercase tracking-wider w-1/4">
                          {language === 'th' ? 'วันที่' : 'DATE'}
                        </th>
                        <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider w-1/6 text-center">
                          {language === 'th' ? 'วัน' : 'WEEKDAY'}
                        </th>
                        <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider w-1/2">
                          {language === 'th' ? 'ชื่อวันหยุดนักขัตฤกษ์' : 'HOLIDAY NAME'}
                        </th>
                        <th className="p-4 pr-6 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right w-24">
                          {language === 'th' ? 'จัดการ' : 'ACTIONS'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHolidays.map((h) => (
                        <tr
                          key={h.id}
                          className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/50 transition-colors group"
                        >
                          <td className="p-4 pl-6 text-sm font-bold text-zinc-900 whitespace-nowrap">
                            {formatDisplayDate(h.date)}
                            <span className="block text-[10px] text-zinc-400 font-medium font-mono">
                              {h.date}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-semibold text-zinc-700 text-center">
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl text-xs font-bold">
                              {getDayLabel(h.date)}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-zinc-800">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 leading-snug">
                                {language === 'th' ? h.nameTh : h.nameEn}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                                {language === 'th' ? h.nameEn : h.nameTh}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 pr-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(h)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                                title="แก้ไขวันหยุด"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() => setDeletingHoliday(h)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                title="ลบวันหยุด"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredHolidays.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-sm text-zinc-400 font-semibold">
                            {language === 'th'
                              ? 'ไม่พบวันหยุดนักขัตฤกษ์ในระบบ'
                              : 'No public holidays match your query.'}
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

      {/* ─── MODAL: Add / Edit Holiday ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3.5">
              <h3 className="text-lg font-bold text-zinc-900">
                {editingHoliday
                  ? language === 'th'
                    ? 'แก้ไขวันหยุดนักขัตฤกษ์'
                    : 'Edit Holiday'
                  : language === 'th'
                  ? 'เพิ่มวันหยุดนักขัตฤกษ์ใหม่'
                  : 'Add New Holiday'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {language === 'th' ? 'วันที่' : 'Date'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full p-3 border border-zinc-200 rounded-2xl text-xs font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 text-zinc-900 bg-zinc-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {language === 'th' ? 'ชื่อวันหยุด (ภาษาไทย)' : 'Holiday Name (Thai)'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameThInput}
                  onChange={(e) => setNameThInput(e.target.value)}
                  placeholder="เช่น วันสงกรานต์, วันขึ้นปีใหม่"
                  className="w-full p-3 border border-zinc-200 rounded-2xl text-xs font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 text-zinc-900 bg-zinc-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {language === 'th' ? 'ชื่อวันหยุด (ภาษาอังกฤษ)' : 'Holiday Name (English)'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameEnInput}
                  onChange={(e) => setNameEnInput(e.target.value)}
                  placeholder="e.g. Songkran Festival, New Year's Day"
                  className="w-full p-3 border border-zinc-200 rounded-2xl text-xs font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 text-zinc-900 bg-zinc-50/50"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'กำลังบันทึก...'
                    : language === 'th'
                    ? 'บันทึกวันหยุด'
                    : 'Save Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Delete Holiday Confirmation ─── */}
      {deletingHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-slide-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900">
                {language === 'th'
                  ? `ลบวันหยุด ${deletingHoliday.nameTh}?`
                  : `Delete ${deletingHoliday.nameEn}?`}
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                {language === 'th'
                  ? `วันที่ ${deletingHoliday.date} จะไม่ถูกจัดเป็นวันหยุดราชการในปฏิทินอีกต่อไป`
                  : `Date ${deletingHoliday.date} will no longer be set as a public holiday.`}
              </p>
            </div>

            <div className="flex justify-center gap-2.5 pt-2">
              <button
                onClick={() => setDeletingHoliday(null)}
                className="px-4 py-2.5 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteHoliday}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {language === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
