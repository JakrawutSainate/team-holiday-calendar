'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import { useAuth } from '@/src/components/AuthContext';
import TopNavBar from '@/src/components/TopNavBar';
import { useConfirm } from '@/src/components/ConfirmDialog';
import { LeavesController } from './LeavesController';
import { CalendarEvent } from '@/src/libs/calendarData';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import LeavesSkeleton from '@/src/components/skeletons/LeavesSkeleton';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import dynamic from 'next/dynamic';

const LeaveDetailsDialog = dynamic(() => import('@/src/components/LeaveDetailsDialog').then((mod) => mod.LeaveDetailsDialog), { ssr: false });

function formatEarnedDateWithDay(dateStr: string, lang: string) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    const weekday = dateObj.toLocaleDateString(lang === 'en' ? 'en-US' : 'th-TH', { weekday: 'long' });
    return `${weekday} (${dateStr})`;
  } catch (_) {
    return dateStr;
  }
}

export default function LeavesClient() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { role } = useRole();
  const { user } = useAuth();
  const confirm = useConfirm();
  const [, setTick] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingLeaveEvent, setViewingLeaveEvent] = useState<CalendarEvent | null>(null);
  const pageSize = 5;

  const [controller] = useState<LeavesController>(
    () => new LeavesController(() => setTick((tick) => tick + 1), user?.id || '')
  );

  useEffect(() => {
    if (user?.id) {
      controller.setUserId(user.id);
      controller.loadState(user.id);
    }
  }, [controller, user?.id]);

  useRealtimeSync(() => { if (user?.id) controller.loadState(user.id); });

  const handleCancelLeave = async (leave: CalendarEvent) => {
    const tokensRefunded = 1;
    const tokenInfoStr = leave.usedTokenInfo
      ? `${leave.usedTokenInfo.festivalName} (${leave.usedTokenInfo.earnedDate})`
      : null;
    const ok = await confirm({
      title: language === 'th' ? 'ยกเลิกการลาหยุด?' : 'Cancel Leave?',
      text: language === 'th'
        ? tokenInfoStr
          ? `ยกเลิกการลาวันที่ ${leave.date} และรับคืน Token [${tokenInfoStr}] หรือไม่?`
          : `ยกเลิกการลาวันที่ ${leave.date} และรับคืน ${tokensRefunded} โทเค็นสะสมหรือไม่?`
        : tokenInfoStr
          ? `Cancel your leave on ${leave.date} and refund Token [${tokenInfoStr}]?`
          : `Cancel your leave on ${leave.date} and refund ${tokensRefunded} token?`,
      confirmText: language === 'th' ? 'ยืนยันยกเลิก' : 'Confirm Cancel',
      cancelText: t('cancel'),
      variant: 'danger',
    });
    if (ok) {
      await controller.cancelLeave(leave);
      const totalAfterDelete = controller.getLeaves().length;
      const maxPagesAfterDelete = Math.ceil(totalAfterDelete / pageSize);
      if (currentPage > maxPagesAfterDelete && maxPagesAfterDelete > 0) {
        setCurrentPage(maxPagesAfterDelete);
      }
      toast.success(
        language === 'th' ? 'ยกเลิกสำเร็จ' : 'Leave Cancelled',
        { description: language === 'th'
            ? `คืน ${tokensRefunded} โทเค็นสะสมสำหรับวันที่ ${leave.date} เรียบร้อยแล้ว`
            : `Refunded ${tokensRefunded} token for ${leave.date}!` }
      );
    }
  };

  const [activePopover, setActivePopover] = useState<{
    id: string;
    type: 'token' | 'reason';
    title: string;
    earnedDate?: string;
    description?: string;
  } | null>(null);

  const leaves = controller.getLeaves();
  const totalPages = Math.ceil(leaves.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeaves = leaves.slice(startIndex, startIndex + pageSize);

  if (controller.isLoading() && controller.getLeaves().length === 0) {
    return <LeavesSkeleton />;
  }

  return (
    <ErrorBoundary>
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      {activePopover && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setActivePopover(null)}
        />
      )}
      <TopNavBar placeholder={t('searchPlaceholder')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                {language === 'th' ? 'รายการวันลาของฉัน' : 'My Leave Requests'}
              </h2>
              <p className="text-zinc-500 mt-2 text-base">
                {language === 'th'
                  ? 'ตรวจสอบสิทธิ์ประวัติการลาพักผ่อน และจัดการข้อมูลวันลาของคุณ'
                  : 'Manage and review your booked compensatory leaves and balances.'}
              </p>
            </div>

            {/* Token Card — show from AuthContext user for live balance */}
            <div className="px-6 py-4 bg-zinc-900 text-white rounded-2xl flex items-center gap-4 shadow-md border border-zinc-800">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  {t('availableTokens')}
                </span>
                <span className="text-2xl font-bold leading-none mt-1">
                  {user ? Math.floor(user.tokensBalance) : controller.getTokens()} {t('tokens')}
                </span>
              </div>
              <span className="material-symbols-outlined text-[36px] text-zinc-300">
                confirmation_number
              </span>
            </div>
          </div>

          {role !== 'USER' ? (
            <div className="bg-white border border-zinc-100 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-center items-center text-center">
              <span className="material-symbols-outlined text-5xl text-zinc-400 mb-4">
                account_circle
              </span>
              <h3 className="text-lg font-bold text-zinc-900">
                {language === 'th' ? 'ไม่มีสิทธิ์เข้าถึง' : 'Access Restricted'}
              </h3>
              <p className="text-sm text-zinc-500 mt-2">
                {language === 'th'
                  ? 'กรุณาสลับไปยังโหมดผู้ใช้ (User Mode) เพื่อดูประวัติวันลาหยุดของคุณ'
                  : 'Please toggle to User Mode in the sidebar to manage your requested leaves.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-100/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
              {/* DESKTOP TABLE VIEW (hidden on mobile, visible on md+) */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[820px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="p-4 pl-6 text-sm font-bold text-zinc-500 uppercase tracking-wider min-w-[140px]">
                        {language === 'th' ? 'วันที่ลาหยุด' : 'LEAVE DATE'}
                      </th>
                      <th className="p-4 text-sm font-bold text-zinc-500 uppercase tracking-wider min-w-[130px]">
                        {language === 'th' ? 'ประเภท' : 'TYPE'}
                      </th>
                      <th className="p-4 text-sm font-bold text-zinc-500 uppercase tracking-wider min-w-[220px]">
                        {language === 'th' ? 'โทเค็นที่ใช้' : 'TOKEN USED'}
                      </th>
                      <th className="p-4 text-sm font-bold text-zinc-500 uppercase tracking-wider min-w-[200px]">
                        {language === 'th' ? 'รายละเอียด' : 'DESCRIPTION'}
                      </th>
                      <th className="p-4 text-sm font-bold text-zinc-500 uppercase tracking-wider min-w-[110px]">
                        {language === 'th' ? 'สถานะ' : 'STATUS'}
                      </th>
                      <th className="p-4 pr-6 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right min-w-[240px]">
                        {language === 'th' ? 'การจัดการ' : 'ACTIONS'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-base text-zinc-500">
                          {language === 'th' ? 'ยังไม่มีรายการประวัติการลาพัก' : 'No leaves requested yet.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedLeaves.map((leave: CalendarEvent) => {
                        const d = new Date(leave.date);
                        const displayDate = d.toLocaleDateString(
                          language === 'en' ? 'en-US' : 'th-TH',
                          {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }
                        );

                        let reasonText = leave.details || '';
                        if (leave.leaveRequest?.reason) {
                          const raw = leave.leaveRequest.reason;
                          if (raw.trim().startsWith('{')) {
                            try {
                              const parsed = JSON.parse(raw);
                              if (parsed.reasonText) reasonText = parsed.reasonText;
                              else if (parsed.reason && !parsed.reason.trim().startsWith('{')) reasonText = parsed.reason;
                            } catch {}
                          } else {
                            reasonText = raw;
                          }
                        }
                        const finalReason = reasonText || (language === 'th' ? 'ยื่นขอวันลาหยุดพักผ่อน' : 'Compensatory leave');

                        return (
                          <tr
                            key={leave.id}
                            className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/40 transition-colors"
                          >
                            <td className="p-4 pl-6 text-base font-bold text-zinc-900 whitespace-nowrap min-w-[140px]">
                              {displayDate}
                            </td>
                            <td className="p-4 text-base font-semibold text-zinc-700 whitespace-nowrap min-w-[130px]">
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-xs font-semibold">
                                {leave.status === 'COMPENSATORY_OFF'
                                  ? (language === 'th' ? 'วันหยุดชดเชย' : 'Compensatory Off')
                                  : (language === 'th' ? 'ลาปกติ' : 'Normal Leave')}
                              </span>
                            </td>
                            <td className="p-4 text-base text-zinc-800 min-w-[240px]">
                              {leave.usedTokenInfo ? (
                                <div className="inline-flex flex-col text-left px-3.5 py-2 bg-indigo-50/70 text-indigo-950 border border-indigo-200/80 rounded-xl text-xs font-semibold shadow-2xs max-w-full">
                                  <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs leading-snug">
                                    <span className="material-symbols-outlined text-[16px] text-indigo-600 shrink-0">confirmation_number</span>
                                    <span>{leave.usedTokenInfo.festivalName}</span>
                                  </div>
                                  <div className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px] text-indigo-400 shrink-0">calendar_today</span>
                                    <span>{language === 'th' ? 'เคลมเมื่อ:' : 'Claimed:'} {formatEarnedDateWithDay(leave.usedTokenInfo.earnedDate, language)}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-500 rounded-xl text-xs font-medium border border-zinc-200/60">
                                  <span className="material-symbols-outlined text-[14px]">help_outline</span>
                                  {language === 'th' ? 'โทเค็นสะสม' : 'General Token'}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-base text-zinc-600 font-medium min-w-[200px] max-w-[260px]">
                              <div className="relative">
                                <button
                                  type="button"
                                  title={finalReason}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePopover(
                                      activePopover?.id === `reason-${leave.id}`
                                        ? null
                                        : {
                                            id: `reason-${leave.id}`,
                                            type: 'reason',
                                            title: language === 'th' ? 'เหตุผลการลา' : 'Leave Reason',
                                            description: finalReason,
                                          }
                                    );
                                  }}
                                  className="block w-full text-left truncate hover:text-zinc-900 transition-colors cursor-pointer outline-none focus:outline-none"
                                >
                                  {finalReason}
                                </button>

                                {activePopover?.id === `reason-${leave.id}` && (
                                  <div className="absolute top-full left-0 mt-2 z-50 w-72 p-4 bg-white border border-zinc-200 rounded-2xl shadow-xl animate-fade-in text-xs">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-amber-600 text-[18px]">notes</span>
                                        {language === 'th' ? 'รายละเอียดการลา' : 'Leave Details'}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActivePopover(null);
                                        }}
                                        className="text-zinc-400 hover:text-zinc-600 rounded-lg p-0.5 cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                      </button>
                                    </div>
                                    <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{finalReason}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-base min-w-[110px]">
                              <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-semibold flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-[14px]">
                                  check_circle
                                </span>
                                {language === 'th' ? 'อนุมัติแล้ว' : 'Approved'}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right flex justify-end gap-2 min-w-[240px]">
                              <button
                                onClick={() => router.push(`/calendar/leave-request?date=${leave.date}`)}
                                className="px-3.5 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <span className="material-symbols-outlined text-[15px]">visibility</span>
                                {language === 'th' ? 'ดูใบลา' : 'View Document'}
                              </button>
                              <button
                                onClick={() => handleCancelLeave(leave)}
                                className="px-3.5 py-2 border border-zinc-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer shrink-0"
                              >
                                {language === 'th' ? 'คืนโทเค็นและยกเลิก' : 'Refund & Cancel'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET CARD LIST VIEW (visible on mobile, hidden on md+) */}
              <div className="block md:hidden p-4 space-y-4">
                {paginatedLeaves.length === 0 ? (
                  <div className="p-8 text-center text-base text-zinc-500">
                    {language === 'th' ? 'ยังไม่มีรายการประวัติการลาพัก' : 'No leaves requested yet.'}
                  </div>
                ) : (
                  paginatedLeaves.map((leave: CalendarEvent) => {
                    const d = new Date(leave.date);
                    const displayDate = d.toLocaleDateString(
                      language === 'en' ? 'en-US' : 'th-TH',
                      {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }
                    );

                    let reasonText = leave.details || '';
                    if (leave.leaveRequest?.reason) {
                      const raw = leave.leaveRequest.reason;
                      if (raw.trim().startsWith('{')) {
                        try {
                          const parsed = JSON.parse(raw);
                          if (parsed.reasonText) reasonText = parsed.reasonText;
                          else if (parsed.reason && !parsed.reason.trim().startsWith('{')) reasonText = parsed.reason;
                        } catch {}
                      } else {
                        reasonText = raw;
                      }
                    }
                    const finalReason = reasonText || (language === 'th' ? 'ยื่นขอวันลาหยุดพักผ่อน' : 'Compensatory leave');

                    return (
                      <div
                        key={leave.id}
                        className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs space-y-3"
                      >
                        {/* Card Header: Date & Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                          <div className="font-bold text-zinc-900 text-base">
                            {displayDate}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-xs font-semibold">
                              {leave.status === 'COMPENSATORY_OFF'
                                ? (language === 'th' ? 'วันหยุดชดเชย' : 'Compensatory Off')
                                : (language === 'th' ? 'ลาปกติ' : 'Normal Leave')}
                            </span>
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                check_circle
                              </span>
                              {language === 'th' ? 'อนุมัติแล้ว' : 'Approved'}
                            </span>
                          </div>
                        </div>

                        {/* Card Body: Token Info & Description */}
                        <div className="space-y-2 text-xs text-zinc-600">
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-zinc-800 shrink-0 mt-0.5">
                              {language === 'th' ? 'โทเค็นที่ใช้:' : 'Token Used:'}
                            </span>
                            {leave.usedTokenInfo ? (
                              <div className="inline-flex flex-col text-left px-3 py-1.5 bg-indigo-50/70 text-indigo-950 border border-indigo-200/80 rounded-xl text-xs font-semibold shadow-2xs max-w-full">
                                <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs leading-snug">
                                  <span className="material-symbols-outlined text-[15px] text-indigo-600 shrink-0">confirmation_number</span>
                                  <span>{leave.usedTokenInfo.festivalName}</span>
                                </div>
                                <div className="text-[11px] text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px] text-indigo-400 shrink-0">calendar_today</span>
                                  <span>{language === 'th' ? 'เคลมเมื่อ:' : 'Claimed:'} {formatEarnedDateWithDay(leave.usedTokenInfo.earnedDate, language)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-500 rounded-lg text-xs font-medium border border-zinc-200/60">
                                <span className="material-symbols-outlined text-[14px]">help_outline</span>
                                {language === 'th' ? 'โทเค็นสะสม' : 'General Token'}
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-zinc-800 shrink-0">
                              {language === 'th' ? 'รายละเอียด:' : 'Description:'}
                            </span>
                            <span className="text-zinc-700 leading-normal">{finalReason}</span>
                          </div>
                        </div>

                        {/* Card Footer: Action Buttons */}
                        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => router.push(`/calendar/leave-request?date=${leave.date}`)}
                            className="w-full sm:flex-1 py-2.5 px-4 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            {language === 'th' ? 'ดูใบลา' : 'View Document'}
                          </button>
                          <button
                            onClick={() => handleCancelLeave(leave)}
                            className="w-full sm:flex-1 py-2.5 px-4 border border-zinc-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {language === 'th' ? 'คืนโทเค็นและยกเลิก' : 'Refund & Cancel'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination UI */}
              {leaves.length > pageSize && (
                <div className="flex justify-between items-center p-4 pl-6 pr-6 bg-zinc-50/50 border-t border-zinc-100">
                  <span className="text-sm text-zinc-500">
                    {language === 'th'
                      ? `แสดง ${startIndex + 1}-${Math.min(
                          startIndex + pageSize,
                          leaves.length
                        )} จากทั้งหมด ${leaves.length} รายการ`
                      : `Showing ${startIndex + 1}-${Math.min(
                          startIndex + pageSize,
                          leaves.length
                        )} of ${leaves.length} requests`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {language === 'th' ? 'ก่อนหน้า' : 'Previous'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${
                          currentPage === p
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {language === 'th' ? 'ถัดไป' : 'Next'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <LeaveDetailsDialog
        open={!!viewingLeaveEvent}
        onClose={() => setViewingLeaveEvent(null)}
        leaveDate={viewingLeaveEvent?.date || ''}
        userName={viewingLeaveEvent?.userName || ''}
        leaveRequest={viewingLeaveEvent?.leaveRequest}
      />
    </div>
    </ErrorBoundary>
  );
}
