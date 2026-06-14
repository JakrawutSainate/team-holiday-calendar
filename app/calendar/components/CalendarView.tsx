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

export default function CalendarView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { role } = useRole();

  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : 2026;
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : 6;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [capacities, setCapacities] = useState<Record<string, CapacitySetting>>({});
  const [gridCells, setGridCells] = useState<CalendarGridCell[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal claim state
  const [claimTargetDate, setClaimTargetDate] = useState<string | null>(null);

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
    const dateObj = new Date(dateString);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = events.some(e => e.date === dateString && e.status === 'PUBLIC_HOLIDAY');

    if ((isWeekend || isHoliday) && role === 'USER') {
      // Check if already claimed
      const isClaimed = events.some(e => e.date === dateString && (e.status === 'WEEKEND_WORK' || e.status === 'HOLIDAY_WORK'));
      if (!isClaimed) {
        setClaimTargetDate(dateString);
      }
    }
  };

  const confirmClaimShift = () => {
    if (!claimTargetDate) return;

    const isHoliday = events.some(e => e.date === claimTargetDate && e.status === 'PUBLIC_HOLIDAY');
    const status = isHoliday ? 'HOLIDAY_WORK' : 'WEEKEND_WORK';
    const shiftLabel = isHoliday ? 'Holiday Shift' : 'Weekend Shift';

    // Create new weekend or holiday work event
    const newEvent: CalendarEvent = {
      id: `${isHoliday ? 'holiday' : 'weekend'}-work-${claimTargetDate}-${Date.now()}`,
      userId: 'user-takahashi',
      userName: 'Takahashi S.',
      date: claimTargetDate,
      status: status,
      details: `Claimed ${shiftLabel.toLowerCase()}`
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);

    // Save in localStorage
    const savedLocalEvents = localStorage.getItem('holidayhq_events');
    let allEvents: CalendarEvent[] = [];
    if (savedLocalEvents) {
      allEvents = JSON.parse(savedLocalEvents);
    }
    allEvents.push(newEvent);
    localStorage.setItem('holidayhq_events', JSON.stringify(allEvents));

    // Increase tokens count in localStorage
    const currentTokensStr = localStorage.getItem('holidayhq_tokens') || '3';
    const currentTokens = parseFloat(currentTokensStr);
    const multiplier = parseFloat(localStorage.getItem('holidayhq_earn_rate') || '1.5');
    const newTokens = currentTokens + multiplier;
    localStorage.setItem('holidayhq_tokens', newTokens.toString());

    // Add transaction
    const savedLocalTx = localStorage.getItem('holidayhq_transactions');
    let allTx = [];
    if (savedLocalTx) {
      allTx = JSON.parse(savedLocalTx);
    } else {
      // Fallback defaults
      allTx = [
        { date: 'Oct 24, 2026', type: 'EARN', description: 'Weekend Coverage (Sat-Sun)', status: 'Approved', amount: '+1' },
        { date: 'Oct 12, 2026', type: 'SPEND', description: 'Friday Long Weekend Request', status: 'Approved', amount: '-3' }
      ];
    }
    
    // Format date string for display (e.g., "Jun 14, 2026")
    const d = new Date(claimTargetDate);
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    
    allTx.unshift({
      date: formattedDate,
      type: 'EARN',
      description: `${shiftLabel} Claimed (${d.toLocaleDateString('en-US', { weekday: 'short' })})`,
      status: 'Approved',
      amount: `+${multiplier}`
    });
    localStorage.setItem('holidayhq_transactions', JSON.stringify(allTx));

    alert(`${shiftLabel} registered for ${claimTargetDate}! Added +${multiplier} tokens to balance.`);
    setClaimTargetDate(null);
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-[#fcfcfc]">
      <TopNavBar placeholder={t('searchTeamOrDates')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="mb-6 flex justify-between items-center">
          <CalendarHeader year={year} month={month} />
          <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl px-4 py-2 text-sm text-zinc-600 font-semibold shadow-xs">
            Role: <span className="text-zinc-900 font-bold">{role}</span>
          </div>
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

      {/* Claim Weekend Work confirmation modal */}
      {claimTargetDate && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-100 rounded-2xl p-8 max-w-md w-full shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Claim Weekend Shift Token</h3>
              <p className="text-sm text-zinc-500 mt-2">
                Did you work on <strong>{claimTargetDate}</strong>? Claiming this shift will award you overtime tokens based on your workspace settings.
              </p>
            </div>
            <div className="bg-zinc-50 p-4 rounded-xl text-sm text-zinc-600 border border-zinc-100 flex justify-between items-center">
              <span>Earn Multiplier:</span>
              <span className="font-bold text-zinc-900">{localStorage.getItem('holidayhq_earn_rate') || '1.5'}x Tokens</span>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setClaimTargetDate(null)}
                className="px-5 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmClaimShift}
                className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 cursor-pointer"
              >
                Confirm Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
