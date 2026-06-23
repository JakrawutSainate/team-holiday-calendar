'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import { useAuth } from '@/src/components/AuthContext';
import TopNavBar from '@/src/components/TopNavBar';
import CalendarHeader from './CalendarHeader';
import DateCell from './DateCell';
import Swal from 'sweetalert2';
import { CalendarController } from './CalendarController';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import CalendarSkeleton from '@/src/components/skeletons/CalendarSkeleton';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

interface CalendarClientProps {
  year: number;
  month: number;
}

export default function CalendarClient({ year, month }: CalendarClientProps) {
  const { t, language } = useTranslation();
  const { role } = useRole();
  const { user, openLogin } = useAuth();
  const [, setTick] = useState(0);
  const [controller] = useState<CalendarController>(
    () => new CalendarController(year, month, user?.id ?? '', () => setTick((tick) => tick + 1), user?.name ?? '')
  );

  useEffect(() => {
    controller.updateParams(year, month, user?.id ?? '', user?.name ?? '');
    controller.loadState();
  }, [year, month, user?.id, controller]);

  // Re-sync when another client mutates calendar data
  useRealtimeSync(() => controller.loadState());

  const handleCellClick = (dateString: string) => {
    if (!user) {
      Swal.fire({
        title: language === 'th' ? 'กรุณาเข้าสู่ระบบ' : 'Authentication Required',
        text: language === 'th' ? 'กรุณาเข้าสู่ระบบเพื่อดำเนินการยื่นวันลาหรือบันทึกกะทำงาน' : 'Please sign in to request leaves or log shifts.',
        icon: 'warning',
        confirmButtonText: language === 'th' ? 'เข้าสู่ระบบ' : 'Sign In',
        showCancelButton: true,
        cancelButtonText: t('cancel'),
        confirmButtonColor: '#09090b',
        cancelButtonColor: '#d4d4d8'
      }).then((result) => {
        if (result.isConfirmed) {
          openLogin();
        }
      });
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

      Swal.fire({
        title: language === 'th' ? `เคลมทำงาน ${shiftLabel}` : `Claim ${shiftLabel}`,
        text:
          language === 'th'
            ? `คุณต้องการสะสมโทเค็นสำหรับการทำงานในวันที่ ${dateString} หรือไม่? (รับ +1 โทเค็น)`
            : `Do you want to log that you worked on ${dateString} and earn +1 token?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: language === 'th' ? 'ยืนยันเคลม' : 'Confirm Claim',
        cancelButtonText: t('cancel'),
        confirmButtonColor: '#09090b',
        cancelButtonColor: '#d4d4d8'
      }).then((result) => {
        if (result.isConfirmed) {
          const status = isHoliday ? 'HOLIDAY_WORK' : 'WEEKEND_WORK';
          controller.claimShift(dateString, status, shiftLabel);
          Swal.fire({
            title: language === 'th' ? 'ลงทะเบียนสำเร็จ' : 'Claim Confirmed',
            text:
              language === 'th'
                ? `ทำการบันทึกเวรทำงานและเพิ่ม +1 โทเค็นสะสมแล้ว`
                : `Logged shift successfully and added +1 token!`,
            icon: 'success',
            confirmButtonColor: '#09090b'
          });
        }
      });
    } else {
      const isAlreadyOff = controller
        .getEvents()
        .some((e) => e.date === dateString && e.userId === user?.id && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL'));
      if (isAlreadyOff) {
        Swal.fire({
          title: language === 'th' ? 'มีวันหยุดอยู่แล้ว' : 'Leave Already Booked',
          text: language === 'th' ? 'คุณมีกำหนดวันหยุดในวันนี้อยู่แล้ว' : 'You already have a booked leave on this day.',
          icon: 'info',
          confirmButtonColor: '#09090b'
        });
        return;
      }

      const tokensNeeded = 1;

      Swal.fire({
        title: language === 'th' ? 'ส่งใบลาด้วยโทเค็น?' : 'Request Leave?',
        text:
          language === 'th'
            ? `คุณต้องการใช้ ${tokensNeeded} โทเค็นในการลาหยุดสำหรับวันที่ ${dateString} หรือไม่? (โทเค็นของคุณ: ${controller.getTokens()})`
            : `Do you want to spend ${tokensNeeded} tokens to request leave on ${dateString}? (Your balance: ${controller.getTokens()} tokens)`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: language === 'th' ? 'ส่งใบลา' : 'Request Leave',
        cancelButtonText: t('cancel'),
        confirmButtonColor: '#09090b',
        cancelButtonColor: '#d4d4d8'
      }).then((result) => {
        if (result.isConfirmed) {
          if (controller.getTokens() < tokensNeeded) {
            Swal.fire({
              title: language === 'th' ? 'โทเค็นไม่เพียงพอ' : 'Insufficient Tokens',
              text:
                language === 'th'
                  ? `ต้องการ ${tokensNeeded} โทเค็น แต่ตอนนี้คุณมีเพียง ${controller.getTokens()} โทเค็นเท่านั้น`
                  : `You need ${tokensNeeded} tokens to request leave, but you only have ${controller.getTokens()} tokens.`,
              icon: 'error',
              confirmButtonColor: '#09090b'
            });
            return;
          }

          controller.requestLeave(dateString);
          Swal.fire({
            title: language === 'th' ? 'ยื่นใบลาสำเร็จ' : 'Leave Requested',
            text:
              language === 'th'
                ? `หัก ${tokensNeeded} โทเค็นสะสม และลงทะเบียนวันลาให้คุณเรียบร้อยแล้ว`
                : `Deducted ${tokensNeeded} tokens and registered your leave successfully!`,
            icon: 'success',
            confirmButtonColor: '#09090b'
          });
        }
      });
    }
  };

  const handleRequestLeaveForm = () => {
    Swal.fire({
      title: language === 'th' ? 'ส่งใบลาวันหยุด' : 'Request Leave',
      html: `
        <div class="text-left space-y-4 font-sans">
          <p class="text-sm text-zinc-500 mb-4 leading-relaxed">
            ${
              language === 'th'
                ? `ใช้ 1 โทเค็นต่อวันในการหยุดงาน โทเค็นของคุณตอนนี้: <strong>${controller.getTokens()}</strong>`
                : `It costs 1 token per day to request leave. (Your balance: <strong>${controller.getTokens()}</strong> tokens)`
            }
          </p>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-zinc-700">${
              language === 'th' ? 'เลือกวันที่ต้องการลา' : 'Select Leave Date'
            }</label>
            <input type="date" id="leave-date-form" class="swal2-input w-full p-2.5 border border-zinc-200 rounded-lg text-sm bg-white text-zinc-900 focus:outline-none focus:border-zinc-900" style="margin: 0; box-sizing: border-box;">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: language === 'th' ? 'ส่งใบลา' : 'Request Leave',
      cancelButtonText: t('cancel'),
      confirmButtonColor: '#09090b',
      cancelButtonColor: '#d4d4d8',
      preConfirm: () => {
        const dateVal = (document.getElementById('leave-date-form') as HTMLInputElement).value;
        if (!dateVal) {
          Swal.showValidationMessage(language === 'th' ? 'กรุณาเลือกวันที่ต้องการลา' : 'Please select a date');
        }
        return dateVal;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const selectedDate = result.value;
        const dateObj = new Date(selectedDate);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (isWeekend) {
          Swal.fire({
            title: language === 'th' ? 'เลือกวันเสาร์-อาทิตย์' : 'Weekend Selection',
            text: language === 'th' ? 'ไม่สามารถลาหยุดในวันเสาร์-อาทิตย์ได้' : 'Cannot request leave on weekends.',
            icon: 'warning',
            confirmButtonColor: '#09090b'
          });
          return;
        }

        const tokensNeeded = 1;

        if (controller.getTokens() < tokensNeeded) {
          Swal.fire({
            title: language === 'th' ? 'โทเค็นไม่เพียงพอ' : 'Insufficient Tokens',
            text:
              language === 'th'
                ? `ต้องการ ${tokensNeeded} โทเค็น แต่ตอนนี้คุณมีเพียง ${controller.getTokens()} โทเค็นเท่านั้น`
                : `You need ${tokensNeeded} tokens, but you only have ${controller.getTokens()} tokens.`,
            icon: 'error',
            confirmButtonColor: '#09090b'
          });
          return;
        }

        controller.requestLeave(selectedDate);
        Swal.fire({
          title: language === 'th' ? 'ยื่นใบลาสำเร็จ' : 'Leave Requested',
          text:
            language === 'th'
              ? `หัก ${tokensNeeded} โทเค็นสะสม และลงทะเบียนวันลาให้คุณเรียบร้อยแล้ว`
              : `Deducted ${tokensNeeded} tokens and registered your leave successfully!`,
          icon: 'success',
          confirmButtonColor: '#09090b'
        });
      }
    });
  };

  const handleMaxOffChange = (newVal: number) => {
    controller.updateMaxOff(newVal);
    Swal.fire({
      title: language === 'th' ? 'ปรับเปลี่ยนเรียบร้อย' : 'Capacity Updated',
      text:
        language === 'th'
          ? `ปรับขีดจำกัดจำนวนวันหยุดพร้อมกันเป็นสูงสุด ${newVal} คน เรียบร้อยแล้ว`
          : `Daily capacity limit has been updated to max ${newVal} people successfully!`,
      icon: 'success',
      confirmButtonColor: '#09090b',
      timer: 1500,
      showConfirmButton: false
    });
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
            onRequestLeave={handleRequestLeaveForm}
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
                <option value={1}>1 คน (1 person)</option>
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
    </ErrorBoundary>
  );
}
