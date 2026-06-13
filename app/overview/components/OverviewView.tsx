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
    <div className="grow flex flex-col min-h-screen ml-64">
      <TopNavBar placeholder={t('searchTeamOrDates')} />

      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto space-y-12">
          {/* Header */}
          <section>
            <span className="text-xs text-on-secondary-container font-bold uppercase tracking-wider">Monday, Oct 23</span>
            <h2 className="text-4xl font-bold tracking-tight text-primary mt-1">{t('goodMorning')}</h2>
            <p className="text-lg text-secondary mt-2">{t('operatingCapacity')}</p>
          </section>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">{t('upcomingHolidays')}</h3>
              <div className="space-y-3">
                <p className="text-sm font-bold">Emma Wilson <span className="text-xs font-normal text-secondary">(Tomorrow)</span></p>
                <p className="text-sm font-bold">James Chen <span className="text-xs font-normal text-secondary">(Oct 26)</span></p>
                <p className="text-sm font-bold">Sara Miller <span className="text-xs font-normal text-secondary">(Nov 02)</span></p>
              </div>
            </div>

            <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">{t('teamAvailability')}</h3>
              <AvailabilityChart availabilityPercent={stats.availabilityPercent} presentCount={stats.presentCount} />
            </div>

            <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-2">{t('yourTokenBalance')}</h3>
                <h3 className="text-6xl font-bold text-primary">3</h3>
                <p className="text-xs text-secondary mt-1">{t('personalTokensRemaining')}</p>
              </div>
              <button onClick={handleQuickRequest} className="mt-4 border border-outline-variant bg-surface hover:bg-surface-container px-4 py-2 rounded-lg text-sm font-semibold text-primary cursor-pointer w-full">
                {t('redeemCarryOver')}
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-semibold text-lg text-primary">{t('recentActivity')}</h4>
              <div className="divide-y divide-outline-variant">
                {activities.map((act) => (
                  <div key={act.id} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{act.title}</p>
                      <p className="text-xs text-secondary">{act.description}</p>
                    </div>
                    <span className="text-xs text-secondary">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <PulseChart burnoutRisk={burnoutRisk} />
              <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
                <h5 className="text-base font-bold text-primary">{t('sharedCalendarSync')}</h5>
                <p className="text-sm text-secondary mt-1">{t('syncDesc')}</p>
                <button onClick={handleSync} className="mt-4 w-full py-2 border border-primary text-primary text-xs rounded-lg hover:bg-primary hover:text-on-primary transition-all font-bold cursor-pointer">
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
