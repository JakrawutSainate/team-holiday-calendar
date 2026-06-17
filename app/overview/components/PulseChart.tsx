'use client';

import { useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { CalendarEvent } from '@/src/libs/calendarData';

interface PulseChartProps {
  burnoutRisk: number[];
  events: CalendarEvent[];
}

export default function PulseChart({ burnoutRisk, events = [] }: PulseChartProps) {
  const { t, language } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get start of week (Monday) and end of week (Sunday) based on current date
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Format dates depending on language
  const isThai = language === 'th';
  const monthNamesTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const shortMonthNamesTh = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const shortMonthNamesEn = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentMonthName = isThai ? monthNamesTh[now.getMonth()] : monthNamesEn[now.getMonth()];
  const startDay = monday.getDate();
  const startMonth = isThai ? shortMonthNamesTh[monday.getMonth()] : shortMonthNamesEn[monday.getMonth()];
  const endDay = sunday.getDate();
  const endMonth = isThai ? shortMonthNamesTh[sunday.getMonth()] : shortMonthNamesEn[sunday.getMonth()];
  const currentYear = isThai ? now.getFullYear() + 543 : now.getFullYear();

  const monthText = isThai ? `${currentMonthName} ${currentYear}` : `${currentMonthName} ${currentYear}`;

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const dateStr = new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
    return {
      dayNum: d.getDate(),
      dateStr
    };
  });

  const getLeavesForDate = (dateStr: string) => {
    return events.filter(
      (e) => e.date === dateStr && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL')
    );
  };

  const formatFullDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    if (language === 'th') {
      const dayNamesTh = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
      return `วัน${dayNamesTh[d.getDay()]}ที่ ${d.getDate()} ${monthNamesTh[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
    }
    return d.toLocaleDateString('en-US', options);
  };

  const activeModalLeaves = selectedDate ? getLeavesForDate(selectedDate) : [];

  return (
    <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-lg text-zinc-900">{t('teamPulse')}</h4>
          <p className="text-sm text-zinc-500 mt-1">{t('burnoutRiskIndex')}</p>
        </div>
        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-sm font-semibold">
          <span className="material-symbols-outlined text-sm">trending_down</span>
          <span>4%</span>
        </div>
      </div>

      {/* Minimal Chart */}
      <div className="h-32 flex items-end justify-between gap-3 px-2">
        {burnoutRisk.map((val, i) => {
          const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
          const dateInfo = weekDays[i];
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(dateInfo.dateStr)}
              className="flex-1 flex flex-col justify-end items-center h-full group relative cursor-pointer border-none bg-transparent p-0 outline-none"
            >
              {/* Percentage label always visible if workload > 0 */}
              {val > 0 ? (
                <span className="text-[10px] font-bold text-zinc-800 mb-1.5 transition-all">
                  {val}%
                </span>
              ) : (
                <span className="text-[10px] text-transparent select-none mb-1.5">-</span>
              )}
              <div
                className={`w-full rounded-t-md transition-all duration-300 ${
                  isToday ? 'bg-zinc-900' : 'bg-zinc-100 group-hover:bg-zinc-900'
                }`}
                style={{ height: val > 0 ? `${val}%` : '0%' }}
              ></div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between px-2 text-sm text-zinc-500">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => {
            const isToday = idx === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
            const dateInfo = weekDays[idx];
            return (
              <button
                key={dayName}
                onClick={() => setSelectedDate(dateInfo.dateStr)}
                className="flex flex-col items-center cursor-pointer border-none bg-transparent p-0 hover:text-zinc-900 transition-colors"
              >
                <span className={`${isToday ? 'text-zinc-950 font-bold' : 'text-zinc-400'} text-xs`}>{dayName}</span>
                <span className={`${isToday ? 'font-bold text-zinc-950' : 'font-semibold text-zinc-700'} mt-0.5`}>
                  {dateInfo.dayNum}
                </span>
              </button>
            );
          })}
        </div>
        <div className="text-xs text-zinc-400 text-center font-semibold uppercase tracking-wider">
          {monthText}
        </div>
      </div>

      <div className="p-5 bg-zinc-50/50 border border-zinc-100 rounded-xl space-y-2">
        <p className="text-base font-semibold text-zinc-900">{t('optimalStatus')}</p>
        <p className="text-sm text-zinc-600 leading-relaxed">{t('workloadStable')}</p>
      </div>

      {/* Modern Modal Overlay */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all border border-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-zinc-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  {t('workloadModalTitle')}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {formatFullDate(selectedDate)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors rounded-lg p-1.5 hover:bg-zinc-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[350px] overflow-y-auto space-y-4">
              {activeModalLeaves.length > 0 ? (
                activeModalLeaves.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50/50">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-700">
                      {event.userName ? event.userName.charAt(0) : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-zinc-900 truncate">{event.userName}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {event.status === 'NORMAL' 
                          ? t('workloadModalSpentToken') 
                          : t('workloadModalCompensatory')}
                      </p>
                    </div>
                    <div className="text-zinc-400">
                      <span className="material-symbols-outlined text-lg">
                        {event.status === 'NORMAL' ? 'token' : 'calendar_today'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-zinc-300">event_busy</span>
                  <p className="text-sm font-medium">{t('workloadModalNoLeaves')}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors shadow-sm"
              >
                {t('closeButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
