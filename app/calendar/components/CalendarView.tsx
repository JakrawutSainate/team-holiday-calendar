'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
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

  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : 2026;
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : 6;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [capacities, setCapacities] = useState<Record<string, CapacitySetting>>({});
  const [gridCells, setGridCells] = useState<CalendarGridCell[]>([]);
  const [loading, setLoading] = useState(true);

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
    setEvents(manager.getEventsForMonth(year, month));

    const resolvedCapacities: Record<string, CapacitySetting> = {};
    cells.forEach((cell) => {
      resolvedCapacities[cell.dateString] = manager.getDayCapacity(cell.dateString);
    });
    setCapacities(resolvedCapacities);
    setLoading(false);
  }, [year, month]);

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-[#fcfcfc]">
      <TopNavBar placeholder={t('searchTeamOrDates')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <CalendarHeader year={year} month={month} />

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
