'use client';

import { CalendarEvent, CapacitySetting } from '@/src/libs/calendarData';

interface DateCellProps {
  day: number;
  isMuted: boolean;
  dateString: string;
  events: CalendarEvent[];
  capacity: CapacitySetting;
}

export default function DateCell({ day, isMuted, dateString, events, capacity }: DateCellProps) {
  const approvedLeavesCount = events.filter(e => e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL').length;
  const maxAllowed = capacity.maxOffAllowed;
  const isFull = maxAllowed > 0 && approvedLeavesCount >= maxAllowed;

  // Capacity label (e.g., "2/2 Locked" or "0/2" or "1/2")
  let capacityLabel = '';
  if (maxAllowed > 0) {
    capacityLabel = isFull ? `${approvedLeavesCount}/${maxAllowed} Locked` : `${approvedLeavesCount}/${maxAllowed}`;
  } else if (maxAllowed === 0 && !isMuted) {
    capacityLabel = 'Locked';
  }

  const cellClass = `
    relative min-h-[140px] p-3 border-r border-b border-outline-variant dark:border-[#2d2f39] transition-all flex flex-col justify-between
    ${isMuted ? 'bg-surface-container-low dark:bg-[#1c1d24]/50 opacity-40' : 'bg-white dark:bg-[#16171d]'}
    ${isFull || (maxAllowed === 0 && !isMuted) ? 'cell-locked-pattern cursor-not-allowed' : 'hover:bg-surface-container-lowest dark:hover:bg-[#1c1d24] cursor-pointer'}
  `;

  const dayNumberClass = isMuted ? 'text-outline dark:text-outline/40' : 'text-on-surface dark:text-white font-semibold';
  const capacityClass = isFull || (maxAllowed === 0 && !isMuted) ? 'text-error dark:text-red-400 font-bold' : 'text-on-surface-variant dark:text-outline';

  return (
    <div className={cellClass}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-base ${dayNumberClass}`}>{day}</span>
        {capacityLabel && (
          <div className={`flex items-center gap-1 font-label-caps text-[10px] ${capacityClass}`}>
            <span>👥 {capacityLabel}</span>
            {(isFull || maxAllowed === 0) && !isMuted && (
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {events.map((e) => {
          const isOff = e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL';
          const theme = isOff ? 'amber' : 'green';
          return (
            <div
              key={e.id}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 shadow-sm border ${
                theme === 'amber'
                  ? 'bg-[#fffbeb] text-[#92400e] border-[#fde68a] dark:bg-[#92400e]/20 dark:text-[#fde68a] dark:border-[#92400e]/40'
                  : 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0] dark:bg-[#166534]/20 dark:text-[#bbf7d0] dark:border-[#166534]/40'
              }`}
            >
              {e.userName.split(' ')[0]}{' '}
              <span className="opacity-70 text-[8px]">
                {isOff ? 'OFF' : '+1 🚗'}
              </span>
            </div>
          );
        })}
      </div>

      {isFull && !isMuted && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-white/60 dark:bg-black/60 backdrop-blur-[1px]">
          <span className="bg-inverse-surface dark:bg-white text-inverse-on-surface dark:text-black px-3 py-1 rounded-full text-xs font-medium">
            Capacity Reached
          </span>
        </div>
      )}
    </div>
  );
}
