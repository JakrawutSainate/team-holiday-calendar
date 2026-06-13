'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent, CapacitySetting, getCalendarEvents, getDayCapacitySetting } from '@/src/libs/calendarData';
import TopNavBar from '@/src/components/TopNavBar';
import DateCell from './DateCell';

export default function CalendarPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6); // June 2026
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [capacityMap, setCapacityMap] = useState<Record<string, CapacitySetting>>({});
  const [loading, setLoading] = useState(true);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch events and capacity for the active month
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const monthlyEvents = await getCalendarEvents(year, month);
      setEvents(monthlyEvents);

      const capacities: Record<string, CapacitySetting> = {};
      const promises = [];

      const firstDayOffset = new Date(year, month - 1, 1).getDay();
      const prevMonthDays = new Date(year, month - 1, 0).getDate();
      const currentMonthDays = new Date(year, month, 0).getDate();

      // Prev month cells
      for (let i = firstDayOffset - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const dateStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        promises.push(
          getDayCapacitySetting(dateStr).then((cap) => {
            capacities[dateStr] = cap;
          })
        );
      }

      // Current month cells
      for (let d = 1; d <= currentMonthDays; d++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        promises.push(
          getDayCapacitySetting(dateStr).then((cap) => {
            capacities[dateStr] = cap;
          })
        );
      }

      // Next month cells
      const totalCells = Math.ceil((currentMonthDays + firstDayOffset) / 7) * 7;
      const nextMonthRemaining = totalCells - (currentMonthDays + firstDayOffset);
      for (let d = 1; d <= nextMonthRemaining; d++) {
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const dateStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        promises.push(
          getDayCapacitySetting(dateStr).then((cap) => {
            capacities[dateStr] = cap;
          })
        );
      }

      await Promise.all(promises);
      setCapacityMap(capacities);
      setLoading(false);
    }

    loadData();
  }, [year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const firstDayOffset = new Date(year, month - 1, 1).getDay();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const currentMonthDays = new Date(year, month, 0).getDate();

  const gridCells = [];

  // Previous month tail cells
  for (let i = firstDayOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const dateStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    gridCells.push({
      day,
      isMuted: true,
      dateString: dateStr,
    });
  }

  // Current month cells
  for (let day = 1; day <= currentMonthDays; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    gridCells.push({
      day,
      isMuted: false,
      dateString: dateStr,
    });
  }

  // Next month head cells
  const totalCells = Math.ceil((currentMonthDays + firstDayOffset) / 7) * 7;
  const nextMonthRemaining = totalCells - (currentMonthDays + firstDayOffset);
  for (let day = 1; day <= nextMonthRemaining; day++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const dateStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    gridCells.push({
      day,
      isMuted: true,
      dateString: dateStr,
    });
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen ml-64 transition-colors duration-200">
      <TopNavBar placeholder="Search team or dates..." />

      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        {/* Calendar Header */}
        <section className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-2 text-primary dark:text-white">
              📅 Team Shift & Token Calendar
            </h2>
            <div className="flex items-center gap-4 text-on-surface-variant dark:text-outline">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-surface-container dark:hover:bg-[#1c1d24] rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="text-xl font-bold text-primary dark:text-white">
                {monthNames[month - 1]} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-surface-container dark:hover:bg-[#1c1d24] rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="px-5 py-3 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl border border-tertiary-fixed-dim shadow-sm flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Available</span>
                <span className="text-xl font-bold leading-none">3 Tokens</span>
              </div>
              <span className="material-symbols-outlined text-[32px]">confirmation_number</span>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest dark:bg-[#1c1d24] border border-outline-variant dark:border-[#2d2f39] text-primary dark:text-white rounded-xl text-base font-semibold hover:bg-white dark:hover:bg-[#16171d] transition-all cursor-pointer">
              <span className="material-symbols-outlined">download</span>
              Export Excel
            </button>
          </div>
        </section>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl overflow-hidden shadow-sm">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-outline-variant dark:border-[#2d2f39] bg-surface-container-low dark:bg-[#1c1d24]">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <div
                key={day}
                className="p-4 text-center border-r last:border-r-0 border-outline-variant dark:border-[#2d2f39] font-label-caps text-xs text-on-surface-variant dark:text-outline font-semibold tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <span className="animate-pulse text-lg font-medium text-secondary dark:text-outline">Loading Calendar...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {gridCells.map((cell, index) => {
                const cellEvents = events.filter((e) => e.date === cell.dateString);
                const capacity = capacityMap[cell.dateString] || { id: 'default', maxOffAllowed: 2 };
                return (
                  <DateCell
                    key={`${cell.dateString}-${index}`}
                    day={cell.day}
                    isMuted={cell.isMuted}
                    dateString={cell.dateString}
                    events={cellEvents}
                    capacity={capacity}
                  />
                );
              })}
            </div>
          )}
        </div>

        <footer className="mt-16 pb-8 flex items-center justify-between opacity-40 text-sm text-secondary dark:text-outline">
          <p>© 2026 HolidayHQ Team Management System</p>
          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
