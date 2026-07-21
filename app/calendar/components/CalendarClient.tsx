'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import { useAuth } from '@/src/components/AuthContext';
import TopNavBar from '@/src/components/TopNavBar';
import CalendarHeader from './CalendarHeader';
import DateCell from './DateCell';
import { CalendarController } from './CalendarController';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import CalendarSkeleton from '@/src/components/skeletons/CalendarSkeleton';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { useConfirm } from '@/src/components/ConfirmDialog';
import dynamic from 'next/dynamic';
import { ExcelExporter, PdfExporter } from '../utils/CalendarExporter';

const LeaveDetailsDialog = dynamic(() => import('@/src/components/LeaveDetailsDialog').then((mod) => mod.LeaveDetailsDialog), { ssr: false });
const ExportDialog = dynamic(() => import('@/src/components/ExportDialog').then((mod) => mod.ExportDialog), { ssr: false });

interface CalendarClientProps {
  year: number;
  month: number;
}

export default function CalendarClient({ year, month }: CalendarClientProps) {
  const { t, language } = useTranslation();
  const { role } = useRole();
  const { user, openLogin } = useAuth();
  const confirm = useConfirm();
  const router = useRouter();
  const [, setTick] = useState(0);
  const [viewingLeaveEvent, setViewingLeaveEvent] = useState<any>(null);
  
  const [showExportModal, setShowExportModal] = useState(false);

  const [controller] = useState<CalendarController>(
    () => new CalendarController(year, month, user?.id ?? '', () => setTick((tick) => tick + 1), user?.name ?? '')
  );

  const handleConfirmExport = (format: 'PDF' | 'EXCEL', selectedUserId: string) => {
    if (format === 'EXCEL') {
      const exporter = new ExcelExporter(year, month, controller.getEvents(), controller.getMembers(), language, selectedUserId);
      exporter.export();
    } else {
      const exporter = new PdfExporter(year, month, controller.getEvents(), controller.getMembers(), language, selectedUserId);
      exporter.export();
    }
  };

  useEffect(() => {
    controller.updateParams(year, month, user?.id ?? '', user?.name ?? '');
    controller.loadState();
  }, [year, month, user?.id, controller]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('triggerLogin') === 'true') {
        openLogin();
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]triggerLogin=true/, '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [openLogin]);

  useRealtimeSync(() => controller.loadState());

  const handleCellClick = async (dateString: string) => {
    if (!user) {
      const ok = await confirm({
        title: language === 'th' ? 'กรุณาเข้าสู่ระบบ' : 'Authentication Required',
        text: language === 'th'
          ? 'กรุณาเข้าสู่ระบบเพื่อดำเนินการยื่นวันลาหรือบันทึกกะทำงาน'
          : 'Please sign in to request leaves or log shifts.',
        confirmText: language === 'th' ? 'เข้าสู่ระบบ' : 'Sign In',
        cancelText: t('cancel'),
      });
      if (ok) openLogin();
      return;
    }

    const dateObj = new Date(dateString);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = controller.getEvents().some((e) => e.date === dateString && e.status === 'PUBLIC_HOLIDAY');

    if (isWeekend || isHoliday) {
      const isClaimed = controller.getEvents().some(
        (e) => e.date === dateString && (e.status === 'WEEKEND_WORK' || e.status === 'HOLIDAY_WORK')
      );
      if (isClaimed) return;

      const shiftLabel = isHoliday
        ? language === 'th' ? 'เวรวันหยุดเทศกาล' : 'Holiday Shift'
        : language === 'th' ? 'เวรวันหยุดสุดสัปดาห์' : 'Weekend Shift';

      const ok = await confirm({
        title: language === 'th' ? `เคลมทำงาน ${shiftLabel}` : `Claim ${shiftLabel}`,
        text: language === 'th'
          ? `ต้องการสะสมโทเค็นสำหรับการทำงานวันที่ ${dateString}? (รับ +1 โทเค็น)`
          : `Log that you worked on ${dateString} and earn +1 token?`,
        confirmText: language === 'th' ? 'ยืนยันเคลม' : 'Confirm Claim',
        cancelText: t('cancel'),
      });
      if (ok) {
        const status = isHoliday ? 'HOLIDAY_WORK' : 'WEEKEND_WORK';
        controller.claimShift(dateString, status, shiftLabel);
        toast.success(
          language === 'th' ? 'ลงทะเบียนสำเร็จ' : 'Claim Confirmed',
          { description: language === 'th' ? 'บันทึกเวรทำงานและเพิ่ม +1 โทเค็นสะสมแล้ว' : 'Logged shift and added +1 token!' }
        );
      }
    } else {
      router.push(`/calendar/leave-request?date=${dateString}`);
    }
  };

  // Leave request is now handled on the dedicated page /calendar/leave-request

  const handleMaxOffChange = (newVal: number) => {
    controller.updateMaxOff(newVal);
    toast.success(
      language === 'th' ? 'ปรับเปลี่ยนเรียบร้อย' : 'Capacity Updated',
      { description: language === 'th'
          ? `ปรับขีดจำกัดวันหยุดพร้อมกันเป็นสูงสุด ${newVal} คนแล้ว`
          : `Daily capacity limit updated to max ${newVal} people.` }
    );
  };

  if (controller.isLoading() && controller.getGridCells().length === 0) {
    return <CalendarSkeleton />;
  }

  return (
    <ErrorBoundary>
      <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
        <TopNavBar placeholder={t('searchTeamOrDates')} />

        <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar animate-fade-in">
          <div className="mb-6 flex justify-between items-center">
            <CalendarHeader
              year={year}
              month={month}
              role={role}
              tokens={controller.getTokens()}
              onRequestLeave={() => {
                router.push('/calendar/leave-request');
              }}
              onOpenExport={() => setShowExportModal(true)}
            />
          </div>

          {role === 'ADMIN' && (
            <div className="mb-6 bg-white border border-zinc-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-zinc-900">
                  {language === 'th'
                    ? 'ตั้งค่าขีดจำกัดวันลาพักรายวัน (Edit Calendar)'
                    : 'Manage Daily Leave Limit (Edit Calendar)'}
                </h4>
                <p className="text-sm text-zinc-500">
                  {language === 'th'
                    ? 'ปรับเพิ่มขีดจำกัดจำนวนคนหยุดสูงสุดที่อนุญาตให้ลาหยุดพร้อมกันเป็น 3 หรือมากกว่า'
                    : 'Adjust the maximum number of people allowed to take leave simultaneously.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-600 font-semibold">
                  {language === 'th' ? 'จำนวนสูงสุด:' : 'Max Allowed:'}
                </span>
                <select
                  value={controller.getCapacityLimit()}
                  onChange={(e) => handleMaxOffChange(Number(e.target.value))}
                  className="p-2.5 border border-zinc-200 rounded-xl bg-white text-sm hover:bg-zinc-50 transition-colors cursor-pointer outline-none font-bold text-zinc-900 w-32 shadow-xs"
                >
                  <option value={2}>2 คน (2 people)</option>
                  <option value={3}>3 คน (3 people)</option>
                  <option value={4}>4 คน (4 people)</option>
                  <option value={5}>5 คน (5 people)</option>
                </select>
              </div>
            </div>
          )}

          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-x-auto">
            <div className="min-w-[768px] lg:min-w-0">
              <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                  <div
                    key={day}
                    className="p-4 text-center border-r last:border-r-0 border-outline-variant text-base text-secondary font-bold"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {controller.getGridCells().map((cell, index) => (
                  <DateCell
                    key={index}
                    day={cell.day}
                    isMuted={cell.isMuted}
                    dateString={cell.dateString}
                    events={controller.getEvents().filter((e) => e.date === cell.dateString)}
                    leaveDocuments={controller.getLeaveDocuments().filter((d) => d.leaveDate === cell.dateString)}
                    capacity={
                      controller.getCapacities()[cell.dateString] || { id: 'default', maxOffAllowed: 2 }
                    }
                    onClick={() => handleCellClick(cell.dateString)}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Leave form modal has been replaced by the dedicated page /calendar/leave-request */}

      <LeaveDetailsDialog
        open={!!viewingLeaveEvent}
        onClose={() => setViewingLeaveEvent(null)}
        leaveDate={viewingLeaveEvent?.date || ''}
        userName={viewingLeaveEvent?.userName || ''}
        leaveRequest={viewingLeaveEvent?.leaveRequest}
      />

      <ExportDialog
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        members={controller.getMembers()}
        onConfirmExport={handleConfirmExport}
      />
    </ErrorBoundary>
  );
}
