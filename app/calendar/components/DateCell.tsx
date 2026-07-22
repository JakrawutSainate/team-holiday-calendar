'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarEvent, CapacitySetting } from '@/src/libs/calendarData';
import { useTranslation } from '@/src/components/LanguageContext';
import { useAuth } from '@/src/components/AuthContext';

interface DateCellProps {
  day: number;
  isMuted: boolean;
  dateString: string;
  events: CalendarEvent[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaveDocuments: any[];
  capacity: CapacitySetting;
  onClick?: () => void;
}

export default function DateCell({ day, isMuted, dateString, events, leaveDocuments, capacity, onClick }: DateCellProps) {
  const router = useRouter();
  const { language, t } = useTranslation();
  const { user } = useAuth();
  const [earnRate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('holidayhq_earn_rate') || '1';
    }
    return '1';
  });

  const dateObj = new Date(dateString);
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

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

  // Check if weekend or holiday work is claimed for this date
  const weekendWorkEvent = events.find(e => e.status === 'WEEKEND_WORK');
  const holidayWorkEvent = events.find(e => e.status === 'HOLIDAY_WORK');
  const claimedEvent = weekendWorkEvent || holidayWorkEvent;
  const isUserOff = events.some(e => e.userId === user?.id && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL'));

  // Capacity label
  let capacityLabel = '';
  if (maxAllowed > 0 && !isWeekend) {
    capacityLabel = isFull ? `${approvedLeavesCount}/${maxAllowed} Locked` : `${approvedLeavesCount}/${maxAllowed}`;
  } else if (maxAllowed === 0 && !isMuted && !isWeekend) {
    capacityLabel = 'Locked';
  }

  // A holiday should not be a locked day now, so we can work/claim it!
  const isLockedDay = !isWeekend && !holidayEvent && (isFull || (maxAllowed === 0 && !isMuted));

  const cellClass = `
    group relative min-h-[140px] p-4 border-r border-b border-zinc-100 transition-all flex flex-col justify-between
    ${isMuted ? 'bg-zinc-50/40 opacity-30' : 'bg-white'}
    ${isLockedDay ? 'cell-locked-pattern cursor-not-allowed' : 'hover:bg-zinc-50/50 cursor-pointer'}
    ${isWeekend && !isMuted && !holidayEvent ? 'weekend-pattern' : ''}
    ${holidayEvent && !isMuted ? 'holiday-pattern' : ''}
  `;

  const dayNumberClass = isMuted ? 'text-zinc-300' : (isWeekend || holidayEvent) ? 'text-zinc-900 font-bold' : 'text-zinc-800 font-semibold';
  const capacityClass = isLockedDay ? 'text-red-500 font-bold' : 'text-zinc-500';

  let tooltipText = '';
  if (!isMuted) {
    if (holidayEvent) {
      tooltipText = holidayName ? `${t('publicHoliday')}: ${holidayName}` : t('publicHoliday');
    } else if (isWeekend) {
      tooltipText = t('weekendShift');
    }
  }

  const today = new Date();
  const yearStr = today.getFullYear();
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const dayStr = String(today.getDate()).padStart(2, '0');
  const todayString = `${yearStr}-${monthStr}-${dayStr}`;
  const isToday = !isMuted && dateString === todayString;

  return (
    <div className={cellClass} title={tooltipText}>
      {tooltipText && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 bg-zinc-900 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold z-20 shadow-lg border border-zinc-800 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-indigo-400">info</span>
          <span>{tooltipText}</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-2 animate-fade-in">
        {isToday ? (
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm shadow-md ring-4 ring-indigo-100 -ml-1 -mt-1.5">
            {day}
          </span>
        ) : (
          <span className={`text-base ${dayNumberClass}`}>{day}</span>
        )}
        {holidayEvent ? (
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/50 px-1.5 py-0.5 rounded-md shadow-xs">
            {t('publicHoliday')}
          </span>
        ) : (
          capacityLabel && (
            <div className={`flex items-center gap-1 text-xs ${capacityClass}`}>
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
        <div className="my-1.5 px-2.5 py-1.5 bg-indigo-50/90 text-indigo-700 border border-indigo-100/60 rounded-xl text-xs font-semibold leading-tight shadow-xs">
          🎉 {holidayName}
        </div>
      )}

      {/* Claim Weekend/Holiday Work Button / Badge */}
      {(isWeekend || !!holidayEvent) && !isMuted && user && (
        <div className="my-1">
          {claimedEvent ? (
            <div className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs">
              <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
              <span>{t('claimed')} (+{earnRate}x)</span>
            </div>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClick) onClick();
                }}
                className="w-full text-left px-2.5 py-1.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-zinc-400">add_circle</span>
                <span>{t('claimShift')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Weekday Request Leave Button */}
      {!isWeekend && !holidayEvent && !isMuted && !isUserOff && user && (
        <div className="my-1">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick();
              }}
              className="w-full text-left px-2.5 py-1.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-zinc-400">event_busy</span>
              <span>{t('requestLeave')}</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {events.filter(e => e.status !== 'PUBLIC_HOLIDAY' && e.status !== 'WEEKEND_WORK' && e.status !== 'HOLIDAY_WORK').map((e) => {
          const isOff = e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL';
          const theme = isOff ? 'amber' : 'green';
          
          // Find corresponding leave document for this user on this date (APPROVED status)
          const doc = leaveDocuments?.find(d => d.userId === e.userId && d.status === 'APPROVED');

          return (
            <div
              key={e.id}
              onClick={(evt) => {
                evt.stopPropagation();
                router.push(`/calendar/leave-request?date=${dateString}`);
              }}
              className={`relative group/leave px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1 shadow-xs border cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                theme === 'amber'
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 animate-fade-in'
                  : 'bg-green-50 hover:bg-green-100 text-green-800 border-green-200 animate-fade-in'
              }`}
              title={language === 'th' ? 'กดเพื่อยื่นใบลา/ดูรายละเอียดวันลานี้' : 'Click to request/view leave for this date'}
            >
              {e.userName.split(' ')[0]}{' '}
              <span className="opacity-75 text-[10px] font-semibold">
                {isOff ? (language === 'th' ? 'ลาหยุด' : 'OFF') : '+1 🚗'}
              </span>

              {/* Leave Document Tooltip/Popover */}
              {isOff && doc && (() => {
                let docName = doc.userName;
                let docDept = doc.department;
                let docTitle = doc.title;
                let docReason = doc.reason || '-';
                if (docReason.trim().startsWith('{')) {
                  try {
                    const parsed = JSON.parse(docReason);
                    if (parsed && typeof parsed === 'object') {
                      if (parsed.fullName) docName = parsed.fullName;
                      if (parsed.department) docDept = parsed.department;
                      if (parsed.position) docTitle = parsed.position;
                      if (parsed.reasonText !== undefined) docReason = parsed.reasonText;
                      else if (parsed.reason !== undefined && !parsed.reason.trim().startsWith('{')) docReason = parsed.reason;
                      else docReason = '';
                    }
                  } catch {}
                }
                return (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-zinc-200 rounded-xl p-4 shadow-xl opacity-0 pointer-events-none group-hover/leave:opacity-100 group-hover/leave:pointer-events-auto transition-all duration-250 z-50 text-zinc-800 text-left font-normal space-y-3 cursor-default">
                    <div className="border-b border-zinc-100 pb-2">
                      <h5 className="font-bold text-sm text-zinc-900 leading-tight">{docName}</h5>
                      <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{docDept}{docTitle ? ` • ${docTitle}` : ''}</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">ประเภทการลา / Leave Type</span>
                        <span className="font-bold text-zinc-800 text-xs">
                          {doc.leaveType === 'SICK' && (language === 'th' ? 'ลาป่วย / Sick Leave' : 'Sick Leave')}
                          {doc.leaveType === 'CASUAL' && (language === 'th' ? 'ลากิจ / Casual Leave' : 'Casual Leave')}
                          {doc.leaveType === 'ANNUAL' && (language === 'th' ? 'ลาพักร้อน / Annual Leave' : 'Annual Leave')}
                          {doc.leaveType === 'COMPENSATORY' && (language === 'th' ? 'ลาชดเชย / Compensatory Leave' : 'Compensatory Leave')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">เหตุผลการลา / Reason</span>
                        <p className="text-zinc-600 bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl text-xs leading-relaxed max-h-20 overflow-y-auto custom-scrollbar font-medium">
                          {docReason || '-'}
                        </p>
                      </div>
                    </div>
                    {doc.signature && (
                      <div className="pt-2.5 border-t border-zinc-100 flex flex-col items-center">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1 tracking-wider">ลายมือชื่อ / Signature</span>
                        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-1.5 w-full h-12 flex items-center justify-center">
                          <img src={doc.signature} alt="Signature" className="max-h-full max-w-full object-contain pointer-events-none" />
                        </div>
                      </div>
                    )}
                    {/* Popover Arrow */}
                    <div className="absolute w-2.5 h-2.5 bg-white border-r border-b border-zinc-200 transform rotate-45 left-1/2 -translate-x-1/2 top-full -mt-1.5"></div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {isLockedDay && !isMuted && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-white/65 backdrop-blur-[1px]">
          <span className="bg-zinc-900 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md">
            Capacity Reached
          </span>
        </div>
      )}
    </div>
  );
}

