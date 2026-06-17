'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface PulseChartProps {
  burnoutRisk: number[];
}

export default function PulseChart({ burnoutRisk }: PulseChartProps) {
  const { t, language } = useTranslation();

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

  const weekRangeText = isThai 
    ? `สัปดาห์ล่าสุด: ${startDay} ${startMonth} - ${endDay} ${endMonth} (${currentMonthName} ${currentYear})`
    : `Latest Week: ${startMonth} ${startDay} - ${endMonth} ${endDay} (${currentMonthName} ${currentYear})`;

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });

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
          const isToday = i === 6;
          return (
            <div
              key={i}
              className={`w-full rounded-t-md transition-all duration-300 ${
                isToday ? 'bg-zinc-900' : 'bg-zinc-100 hover:bg-zinc-900'
              }`}
              style={{ height: `${val}%` }}
            ></div>
          );
        })}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between px-2 text-sm text-zinc-500">
          <span className="flex flex-col items-center">
            <span className="text-zinc-400 text-xs">Mon</span>
            <span className="font-semibold text-zinc-700 mt-0.5">{weekDays[0]}</span>
          </span>
          <span className="flex flex-col items-center">
            <span className="text-zinc-400 text-xs">Tue</span>
            <span className="font-semibold text-zinc-700 mt-0.5">{weekDays[1]}</span>
          </span>
          <span className="flex flex-col items-center">
            <span className="text-zinc-400 text-xs">Wed</span>
            <span className="font-semibold text-zinc-700 mt-0.5">{weekDays[2]}</span>
          </span>
          <span className="flex flex-col items-center">
            <span className="text-zinc-400 text-xs">Thu</span>
            <span className="font-semibold text-zinc-700 mt-0.5">{weekDays[3]}</span>
          </span>
          <span className="flex flex-col items-center">
            <span className="text-zinc-400 text-xs">Fri</span>
            <span className="font-semibold text-zinc-700 mt-0.5">{weekDays[4]}</span>
          </span>
          <span className="flex flex-col items-center">
            <span className="text-zinc-400 text-xs">Sat</span>
            <span className="font-semibold text-zinc-700 mt-0.5">{weekDays[5]}</span>
          </span>
          <span className="flex flex-col items-center">
            <span className="text-zinc-950 font-bold text-xs">Sun</span>
            <span className="font-bold text-zinc-950 mt-0.5">{weekDays[6]}</span>
          </span>
        </div>
        <div className="text-xs text-zinc-400 text-center font-medium">
          {weekRangeText}
        </div>
      </div>
      <div className="p-5 bg-zinc-50/50 border border-zinc-100 rounded-xl space-y-2">
        <p className="text-base font-semibold text-zinc-900">{t('optimalStatus')}</p>
        <p className="text-sm text-zinc-600 leading-relaxed">{t('workloadStable')}</p>
      </div>
    </div>
  );
}
