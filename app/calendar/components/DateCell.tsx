'use client';

import { CalendarEvent, CapacitySetting } from '@/src/libs/calendarData';
import { useTranslation } from '@/src/components/LanguageContext';

interface DateCellProps {
  day: number;
  isMuted: boolean;
  dateString: string;
  events: CalendarEvent[];
  capacity: CapacitySetting;
}

export default function DateCell({ day, isMuted, dateString, events, capacity }: DateCellProps) {
  const { language, t } = useTranslation();
  const approvedLeavesCount = events.filter(e => e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL').length;
  const maxAllowed = capacity.maxOffAllowed;
  const isFull = maxAllowed > 0 && approvedLeavesCount >= maxAllowed;

  const holidayEvent = events.find(e => e.status === 'PUBLIC_HOLIDAY');
  let holidayName = '';
  if (holidayEvent && holidayEvent.details) {
    try {
      const names = JSON.parse(holidayEvent.details);
      holidayName = language === 'en' ? names.en : names.th;
    } catch {
      holidayName = holidayEvent.details;
    }
  }

  // Capacity label (e.g., "2/2 Locked" or "0/2" or "1/2")
  let capacityLabel = '';
  if (maxAllowed > 0) {
    capacityLabel = isFull ? `${approvedLeavesCount}/${maxAllowed} Locked` : `${approvedLeavesCount}/${maxAllowed}`;
  } else if (maxAllowed === 0 && !isMuted) {
    capacityLabel = 'Locked';
  }

  const isLockedDay = isFull || (maxAllowed === 0 && !isMuted) || !!holidayEvent;

  const cellClass = `
    relative min-h-[140px] p-3 border-r border-b border-outline-variant transition-all flex flex-col justify-between
    ${isMuted ? 'bg-surface-container-low opacity-40' : 'bg-white'}
    ${isLockedDay ? 'cell-locked-pattern cursor-not-allowed' : 'hover:bg-surface-container-lowest cursor-pointer'}
  `;

  const dayNumberClass = isMuted ? 'text-outline' : 'text-on-surface font-semibold';
  const capacityClass = isLockedDay ? 'text-error font-bold' : 'text-on-surface-variant';

  return (
    <div className={cellClass}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-base ${dayNumberClass}`}>{day}</span>
        {holidayEvent ? (
          <span className="font-label-caps text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md shadow-xs">
            {t('publicHoliday')}
          </span>
        ) : (
          capacityLabel && (
            <div className={`flex items-center gap-1 font-label-caps text-[10px] ${capacityClass}`}>
              <span>👥 {capacityLabel}</span>
              {(isFull || maxAllowed === 0) && !isMuted && (
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock
                </span>
              )}
            </div>
          )
        )}
      </div>

      {holidayName && (
        <div className="my-1.5 px-2.5 py-1.5 bg-indigo-50/90 text-indigo-700 border border-indigo-100/60 rounded-xl text-[10px] font-semibold leading-tight shadow-xs">
          🎉 {holidayName}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {events.filter(e => e.status !== 'PUBLIC_HOLIDAY').map((e) => {
          const isOff = e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL';
          const theme = isOff ? 'amber' : 'green';
          return (
            <div
              key={e.id}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 shadow-sm border ${
                theme === 'amber'
                  ? 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]'
                  : 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]'
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

      {isLockedDay && !isMuted && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-white/65 backdrop-blur-[1px]">
          <span className="bg-inverse-surface text-inverse-on-surface px-3 py-1 rounded-full text-xs font-medium">
            {holidayEvent ? t('publicHoliday') : 'Capacity Reached'}
          </span>
        </div>
      )}
    </div>
  );
}
