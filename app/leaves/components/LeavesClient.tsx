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
    const ok = await confirm({
      title: language === 'th' ? 'ยกเลิกการลาหยุด?' : 'Cancel Leave?',
      text: language === 'th'
        ? `ยกเลิกการลาวันที่ ${leave.date} และรับคืน ${tokensRefunded} โทเค็นสะสมหรือไม่?`
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
            ? `คืน ${tokensRefunded} โทเค็นสะสมเรียบร้อยแล้ว`
            : `Refunded ${tokensRefunded} token to your balance!` }
      );
    }
  };

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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="p-4 pl-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                        {language === 'th' ? 'วันที่ลาหยุด' : 'LEAVE DATE'}
                      </th>
                      <th className="p-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                        {language === 'th' ? 'ประเภท' : 'TYPE'}
                      </th>
                      <th className="p-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                        {language === 'th' ? 'รายละเอียด' : 'DESCRIPTION'}
                      </th>
                      <th className="p-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                        {language === 'th' ? 'สถานะ' : 'STATUS'}
                      </th>
                      <th className="p-4 pr-6 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right">
                        {language === 'th' ? 'การจัดการ' : 'ACTIONS'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-base text-zinc-500">
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
                        return (
                          <tr
                            key={leave.id}
                            className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/40 transition-colors"
                          >
                            <td className="p-4 pl-6 text-base font-bold text-zinc-900">
                              {displayDate}
                            </td>
                            <td className="p-4 text-base font-semibold text-zinc-700">
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-xs font-semibold">
                                {leave.status === 'COMPENSATORY_OFF'
                                  ? (language === 'th' ? 'วันหยุดชดเชย' : 'Compensatory Off')
                                  : (language === 'th' ? 'ลาปกติ' : 'Normal Leave')}
                              </span>
                            </td>
                            <td className="p-4 text-base text-zinc-600 font-medium">
                              {(() => {
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
                                return reasonText || (language === 'th' ? 'ยื่นขอวันลาหยุดพักผ่อน' : 'Compensatory leave');
                              })()}
                            </td>
                            <td className="p-4 text-base">
                              <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-semibold flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-[14px]">
                                  check_circle
                                </span>
                                {language === 'th' ? 'อนุมัติแล้ว' : 'Approved'}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right flex justify-end gap-2">
                              <button
                                onClick={() => router.push(`/calendar/leave-request?date=${leave.date}`)}
                                className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                {language === 'th' ? 'ดูใบลา' : 'View Document'}
                              </button>
                              <button
                                onClick={() => handleCancelLeave(leave)}
                                className="px-4 py-2 border border-zinc-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
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
