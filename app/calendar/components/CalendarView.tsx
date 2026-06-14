'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import TopNavBar from '@/src/components/TopNavBar';
import CalendarHeader from './CalendarHeader';
import DateCell from './DateCell';
import { CalendarEvent, CapacitySetting } from '@/src/libs/calendarData';
import { HolidayHQManager } from '@/src/libs/models/HolidayHQManager';
import { CalendarGridCell } from '../types';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

export default function CalendarView() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const { role } = useRole();

  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : 2026;
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : 6;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [capacities, setCapacities] = useState<Record<string, CapacitySetting>>({});
  const [gridCells, setGridCells] = useState<CalendarGridCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(3);

  useEffect(() => {
    // Load tokens
    const savedTokens = localStorage.getItem('holidayhq_tokens') || '3';
    setTokens(parseFloat(savedTokens));
  }, []);

  useEffect(() => {
    setLoading(true);
    const manager = new HolidayHQManager();

    const firstDayOffset = new Date(year, month - 1, 1).getDay();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    const currentMonthDays = new Date(year, month, 0).getDate();

    const cells: CalendarGridCell[] = [];

    // Prev Month
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      cells.push({ day, isMuted: true, dateString: `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` });
    }

    // Current Month
    for (let day = 1; day <= currentMonthDays; day++) {
      cells.push({ day, isMuted: false, dateString: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` });
    }

    // Next Month
    const totalCells = Math.ceil((currentMonthDays + firstDayOffset) / 7) * 7;
    const nextMonthRemaining = totalCells - (currentMonthDays + firstDayOffset);
    for (let day = 1; day <= nextMonthRemaining; day++) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      cells.push({ day, isMuted: true, dateString: `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` });
    }

    setGridCells(cells);

    // Load events from localStorage or fallback to manager
    const localEvents = localStorage.getItem('holidayhq_events');
    let parsedEvents: CalendarEvent[] = [];
    if (localEvents) {
      parsedEvents = JSON.parse(localEvents);
    } else {
      parsedEvents = manager.getEventsForMonth(year, month);
      localStorage.setItem('holidayhq_events', JSON.stringify(parsedEvents));
    }
    // Filter to currently viewed month (plus BOT holidays loaded dynamically)
    const activeEvents = parsedEvents.filter(e => e.date.startsWith(`${year}-${month.toString().padStart(2, '0')}`));
    const managerHolidays = manager.getEventsForMonth(year, month).filter(e => e.status === 'PUBLIC_HOLIDAY');
    
    // Merge BOT public holidays
    const finalEvents = [...activeEvents, ...managerHolidays].reduce((acc: CalendarEvent[], curr) => {
      if (!acc.some(e => e.date === curr.date && e.status === curr.status && e.userName === curr.userName)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    setEvents(finalEvents);

    const resolvedCapacities: Record<string, CapacitySetting> = {};
    cells.forEach((cell) => {
      resolvedCapacities[cell.dateString] = manager.getDayCapacity(cell.dateString);
    });
    setCapacities(resolvedCapacities);
    setLoading(false);
  }, [year, month]);

  const handleCellClick = (dateString: string) => {
    if (role !== 'USER') return;

    const dateObj = new Date(dateString);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = events.some(e => e.date === dateString && e.status === 'PUBLIC_HOLIDAY');

    if (isWeekend || isHoliday) {
      // Check if already claimed
      const isClaimed = events.some(e => e.date === dateString && (e.status === 'WEEKEND_WORK' || e.status === 'HOLIDAY_WORK'));
      if (isClaimed) return;

      const shiftLabel = isHoliday ? (language === 'th' ? 'เวรวันหยุดเทศกาล' : 'Holiday Shift') : (language === 'th' ? 'เวรวันหยุดสุดสัปดาห์' : 'Weekend Shift');
      const multiplier = parseFloat(localStorage.getItem('holidayhq_earn_rate') || '1.5');

      Swal.fire({
        title: language === 'th' ? `เคลมทำงาน ${shiftLabel}` : `Claim ${shiftLabel}`,
        text: language === 'th' 
          ? `คุณต้องการสะสมโทเค็นสำหรับการทำงานในวันที่ ${dateString} หรือไม่? (รับ +${multiplier} โทเค็น)`
          : `Do you want to log that you worked on ${dateString} and earn +${multiplier} tokens?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: language === 'th' ? 'ยืนยันเคลม' : 'Confirm Claim',
        cancelButtonText: t('cancel'),
        confirmButtonColor: '#09090b',
        cancelButtonColor: '#d4d4d8',
      }).then((result) => {
        if (result.isConfirmed) {
          const status = isHoliday ? 'HOLIDAY_WORK' : 'WEEKEND_WORK';
          const newEvent: CalendarEvent = {
            id: `${isHoliday ? 'holiday' : 'weekend'}-work-${dateString}-${Date.now()}`,
            userId: 'user-takahashi',
            userName: 'Takahashi S.',
            date: dateString,
            status: status,
            details: `Claimed ${shiftLabel.toLowerCase()}`
          };

          const updated = [...events, newEvent];
          setEvents(updated);

          // Save events to localStorage
          const savedLocalEvents = localStorage.getItem('holidayhq_events');
          let allEvents: CalendarEvent[] = [];
          if (savedLocalEvents) {
            allEvents = JSON.parse(savedLocalEvents);
          }
          allEvents.push(newEvent);
          localStorage.setItem('holidayhq_events', JSON.stringify(allEvents));

          // Increase tokens count
          const currentTokensStr = localStorage.getItem('holidayhq_tokens') || '3';
          const currentTokens = parseFloat(currentTokensStr);
          const newTokens = currentTokens + multiplier;
          setTokens(newTokens);
          localStorage.setItem('holidayhq_tokens', newTokens.toString());

          // Save transaction
          const savedLocalTx = localStorage.getItem('holidayhq_transactions');
          let allTx = [];
          if (savedLocalTx) {
            allTx = JSON.parse(savedLocalTx);
          }
          const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
          allTx.unshift({
            date: formattedDate,
            type: 'EARN',
            description: `${shiftLabel} Claimed (${dateObj.toLocaleDateString('en-US', { weekday: 'short' })})`,
            status: 'Approved',
            amount: `+${multiplier}`
          });
          localStorage.setItem('holidayhq_transactions', JSON.stringify(allTx));

          Swal.fire({
            title: language === 'th' ? 'ลงทะเบียนสำเร็จ' : 'Claim Confirmed',
            text: language === 'th' ? `ทำการบันทึกเวรทำงานและเพิ่ม +${multiplier} โทเค็นสะสมแล้ว` : `Logged shift successfully and added +${multiplier} tokens!`,
            icon: 'success',
            confirmButtonColor: '#09090b'
          });
        }
      });
    } else {
      // Weekday: Request leave using tokens
      const isAlreadyOff = events.some(e => e.date === dateString && e.userId === 'user-takahashi' && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL'));
      if (isAlreadyOff) {
        Swal.fire({
          title: language === 'th' ? 'มีวันหยุดอยู่แล้ว' : 'Leave Already Booked',
          text: language === 'th' ? 'คุณมีกำหนดวันหยุดในวันนี้อยู่แล้ว' : 'You already have a booked leave on this day.',
          icon: 'info',
          confirmButtonColor: '#09090b'
        });
        return;
      }

      const currentTokensStr = localStorage.getItem('holidayhq_tokens') || '3';
      const currentTokens = parseFloat(currentTokensStr);

      Swal.fire({
        title: language === 'th' ? 'ส่งใบลาด้วยโทเค็น?' : 'Request Leave?',
        text: language === 'th'
          ? `คุณต้องการใช้ 3 โทเค็นในการลาหยุดสำหรับวันที่ ${dateString} หรือไม่? (โทเค็นของคุณ: ${currentTokens})`
          : `Do you want to spend 3 tokens to request leave on ${dateString}? (Your balance: ${currentTokens} tokens)`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: language === 'th' ? 'ส่งใบลา' : 'Request Leave',
        cancelButtonText: t('cancel'),
        confirmButtonColor: '#09090b',
        cancelButtonColor: '#d4d4d8',
      }).then((result) => {
        if (result.isConfirmed) {
          if (currentTokens < 3) {
            Swal.fire({
              title: language === 'th' ? 'โทเค็นไม่เพียงพอ' : 'Insufficient Tokens',
              text: language === 'th'
                ? `ต้องการ 3 โทเค็น แต่ตอนนี้คุณมีเพียง ${currentTokens} โทเค็นเท่านั้น`
                : `You need 3 tokens to request leave, but you only have ${currentTokens} tokens.`,
              icon: 'error',
              confirmButtonColor: '#09090b'
            });
            return;
          }

          // Deduct tokens
          const newTokens = currentTokens - 3;
          setTokens(newTokens);
          localStorage.setItem('holidayhq_tokens', newTokens.toString());

          // Create leave event
          const newEvent: CalendarEvent = {
            id: `leave-${dateString}-${Date.now()}`,
            userId: 'user-takahashi',
            userName: 'Takahashi S.',
            date: dateString,
            status: 'COMPENSATORY_OFF',
            details: 'Requested leave via calendar click'
          };

          const updated = [...events, newEvent];
          setEvents(updated);

          // Save in localStorage
          const savedLocalEvents = localStorage.getItem('holidayhq_events');
          let allEvents: CalendarEvent[] = [];
          if (savedLocalEvents) {
            allEvents = JSON.parse(savedLocalEvents);
          }
          allEvents.push(newEvent);
          localStorage.setItem('holidayhq_events', JSON.stringify(allEvents));

          // Save transaction
          const savedLocalTx = localStorage.getItem('holidayhq_transactions');
          let allTx = [];
          if (savedLocalTx) {
            allTx = JSON.parse(savedLocalTx);
          }
          const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
          allTx.unshift({
            date: formattedDate,
            type: 'SPEND',
            description: `Compensatory Leave booked (${dateObj.toLocaleDateString('en-US', { weekday: 'short' })})`,
            status: 'Approved',
            amount: '-3'
          });
          localStorage.setItem('holidayhq_transactions', JSON.stringify(allTx));

          Swal.fire({
            title: language === 'th' ? 'ยื่นใบลาสำเร็จ' : 'Leave Requested',
            text: language === 'th' ? 'หัก 3 โทเค็นสะสม และลงทะเบียนวันลาให้คุณเรียบร้อยแล้ว' : 'Deducted 3 tokens and registered your leave successfully!',
            icon: 'success',
            confirmButtonColor: '#09090b'
          });
        }
      });
    }
  };

  const handleRequestLeaveForm = () => {
    const currentTokensStr = localStorage.getItem('holidayhq_tokens') || '3';
    const currentTokens = parseFloat(currentTokensStr);

    Swal.fire({
      title: language === 'th' ? 'ส่งใบลาวันหยุด' : 'Request Leave',
      html: `
        <div class="text-left space-y-4 font-sans">
          <p class="text-sm text-zinc-500 mb-4 leading-relaxed">
            ${language === 'th' 
              ? `ใช้ 3 โทเค็นต่อวันในการหยุดงาน (โทเค็นของคุณตอนนี้: <strong>${currentTokens}</strong>)` 
              : `It costs 3 tokens per day to request leave. (Your balance: <strong>${currentTokens}</strong> tokens)`}
          </p>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-zinc-700">${language === 'th' ? 'เลือกวันที่ต้องการลา' : 'Select Leave Date'}</label>
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
        if (currentTokens < 3) {
          Swal.fire({
            title: language === 'th' ? 'โทเค็นไม่เพียงพอ' : 'Insufficient Tokens',
            text: language === 'th'
              ? `ต้องการ 3 โทเค็น แต่ตอนนี้คุณมีเพียง ${currentTokens} โทเค็นเท่านั้น`
              : `You need 3 tokens, but you only have ${currentTokens} tokens.`,
            icon: 'error',
            confirmButtonColor: '#09090b'
          });
          return;
        }

        // Check if weekend or holiday
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

        // Deduct tokens
        const newTokens = currentTokens - 3;
        setTokens(newTokens);
        localStorage.setItem('holidayhq_tokens', newTokens.toString());

        // Create leave event
        const newEvent: CalendarEvent = {
          id: `leave-${selectedDate}-${Date.now()}`,
          userId: 'user-takahashi',
          userName: 'Takahashi S.',
          date: selectedDate,
          status: 'COMPENSATORY_OFF',
          details: 'Requested leave via date picker form'
        };

        const updated = [...events, newEvent];
        setEvents(updated);

        // Save in localStorage
        const savedLocalEvents = localStorage.getItem('holidayhq_events');
        let allEvents: CalendarEvent[] = [];
        if (savedLocalEvents) {
          allEvents = JSON.parse(savedLocalEvents);
        }
        allEvents.push(newEvent);
        localStorage.setItem('holidayhq_events', JSON.stringify(allEvents));

        // Save transaction
        const savedLocalTx = localStorage.getItem('holidayhq_transactions');
        let allTx = [];
        if (savedLocalTx) {
          allTx = JSON.parse(savedLocalTx);
        }
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        allTx.unshift({
          date: formattedDate,
          type: 'SPEND',
          description: `Compensatory Leave booked (${dateObj.toLocaleDateString('en-US', { weekday: 'short' })})`,
          status: 'Approved',
          amount: '-3'
        });
        localStorage.setItem('holidayhq_transactions', JSON.stringify(allTx));

        Swal.fire({
          title: language === 'th' ? 'ยื่นใบลาสำเร็จ' : 'Leave Requested',
          text: language === 'th' ? 'หัก 3 โทเค็นสะสม และลงทะเบียนวันลาให้คุณเรียบร้อยแล้ว' : 'Deducted 3 tokens and registered your leave successfully!',
          icon: 'success',
          confirmButtonColor: '#09090b'
        });
      }
    });
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-[#fcfcfc]">
      <TopNavBar placeholder={t('searchTeamOrDates')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar animate-fade-in">
        <div className="mb-6 flex justify-between items-center">
          <CalendarHeader 
            year={year} 
            month={month} 
            role={role} 
            tokens={tokens} 
            onRequestLeave={handleRequestLeaveForm} 
          />
        </div>

        <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-x-auto">
          <div className="min-w-[768px] lg:min-w-0">
            <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                <div key={day} className="p-4 text-center border-r last:border-r-0 border-outline-variant text-base text-secondary font-bold">
                  {day}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <span className="animate-pulse text-lg font-medium text-secondary">Loading...</span>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {gridCells.map((cell, index) => (
                  <DateCell
                    key={index}
                    day={cell.day}
                    isMuted={cell.isMuted}
                    dateString={cell.dateString}
                    events={events.filter((e) => e.date === cell.dateString)}
                    capacity={capacities[cell.dateString] || { id: 'default', maxOffAllowed: 2 }}
                    onClick={() => handleCellClick(cell.dateString)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
