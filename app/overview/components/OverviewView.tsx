'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { HolidayHQManager, Activity } from '@/src/libs/models/HolidayHQManager';
import AvailabilityChart from './AvailabilityChart';
import PulseChart from './PulseChart';
import { toggleCalendarSync, submitQuickRequest } from '../actions';

export default function OverviewView() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({ presentCount: 0, availabilityPercent: 100 });
  const [burnoutRisk, setBurnoutRisk] = useState<number[]>([]);

  useEffect(() => {
    const manager = new HolidayHQManager();
    setActivities(manager.getRecentActivities());
    setStats(manager.getAvailabilityStats());
    setBurnoutRisk(manager.getBurnoutRiskIndex());
  }, []);

  const handleSync = async () => {
    const res = await toggleCalendarSync({ calendarType: 'google', enabled: true });
    if (res.success) alert('Google Calendar Sync Enabled!');
  };

  const handleQuickRequest = async () => {
    const res = await submitQuickRequest({ leaveDate: '2026-10-24', reason: 'Dashboard request' });
    if (res.success) alert('Quick Request Submitted!');
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-[#fcfcfc]">
      <TopNavBar placeholder={t('searchTeamOrDates')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto space-y-8">
          {/* Header */}
          <section className="space-y-2">
            <span className="text-base font-medium text-zinc-500">Monday, October 23</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900">{t('goodMorning')}</h2>
            <p className="text-lg text-zinc-600">{t('operatingCapacity')}</p>
          </section>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 mb-6">{t('upcomingHolidays')}</h3>
                <div className="space-y-4">
                  <p className="text-base font-medium text-zinc-800">Emma Wilson <span className="text-sm font-normal text-zinc-500">(Tomorrow)</span></p>
                  <p className="text-base font-medium text-zinc-800">James Chen <span className="text-sm font-normal text-zinc-500">(Oct 26)</span></p>
                  <p className="text-base font-medium text-zinc-800">Sara Miller <span className="text-sm font-normal text-zinc-500">(Nov 02)</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
              <h3 className="text-base font-semibold text-zinc-900 mb-6">{t('teamAvailability')}</h3>
              <AvailabilityChart availabilityPercent={stats.availabilityPercent} presentCount={stats.presentCount} />
            </div>

            <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 mb-4">{t('yourTokenBalance')}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-6xl font-bold text-zinc-900">3</span>
                  <span className="text-sm font-medium text-zinc-500">{t('tokens')}</span>
                </div>
                <p className="text-sm text-zinc-500">{t('personalTokensRemaining')}</p>
              </div>
              <button onClick={handleQuickRequest} className="mt-6 border border-zinc-200 bg-white hover:bg-zinc-50 px-5 py-3 rounded-xl text-base font-medium text-zinc-900 cursor-pointer w-full transition-all">
                {t('redeemCarryOver')}
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
              <h4 className="font-semibold text-lg text-zinc-900">{t('recentActivity')}</h4>
              <div className="divide-y divide-zinc-100">
                {activities.map((act) => (
                  <div key={act.id} className="py-4 flex justify-between items-center text-base">
                    <div>
                      <p className="font-medium text-zinc-800">{act.title}</p>
                      <p className="text-sm text-zinc-500 mt-1">{act.description}</p>
                    </div>
                    <span className="text-sm text-zinc-400">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <PulseChart burnoutRisk={burnoutRisk} />
              <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <h5 className="text-base font-semibold text-zinc-900 mb-2">{t('sharedCalendarSync')}</h5>
                  <p className="text-sm text-zinc-500 leading-relaxed">{t('syncDesc')}</p>
                </div>
                <button onClick={handleSync} className="mt-6 w-full py-3 border border-zinc-900 text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-900 hover:text-white transition-all cursor-pointer">
                  {t('enableSync')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
