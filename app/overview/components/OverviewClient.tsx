'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { Activity } from '@/src/libs/models/HolidayHQManager';
import { toggleCalendarSync, submitQuickRequest } from '../actions';
import { OverviewController } from './OverviewController';

// Components
import OverviewHeader from './OverviewHeader';
import UpcomingHolidaysCard from './UpcomingHolidaysCard';
import YourTokenBalanceCard from './YourTokenBalanceCard';
import RecentActivityCard from './RecentActivityCard';
import SyncCalendarCard from './SyncCalendarCard';
import AvailabilityChart from './AvailabilityChart';
import PulseChart from './PulseChart';

interface OverviewClientProps {
  initialActivities: Activity[];
  initialStats: { presentCount: number; availabilityPercent: number };
  initialBurnoutRisk: number[];
  initialTokens: number;
}

export default function OverviewClient({
  initialActivities,
  initialStats,
  initialBurnoutRisk,
  initialTokens
}: OverviewClientProps) {
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  const controllerRef = useRef<OverviewController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new OverviewController(
      initialActivities,
      initialStats,
      initialBurnoutRisk,
      initialTokens,
      () => setTick((tick) => tick + 1)
    );
  }

  const controller = controllerRef.current;

  useEffect(() => {
    controller.loadState();
  }, [controller]);

  const handleSync = async () => {
    try {
      const msg = await controller.syncCalendar(toggleCalendarSync);
      alert(msg);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleQuickRequest = async () => {
    try {
      const msg = await controller.quickRequest(submitQuickRequest);
      alert(msg);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={t('searchTeamOrDates')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto space-y-8">
          {/* Header */}
          <OverviewHeader />

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UpcomingHolidaysCard />

            <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
              <h3 className="text-base font-semibold text-zinc-900 mb-6">{t('teamAvailability')}</h3>
              <AvailabilityChart
                availabilityPercent={controller.getStats().availabilityPercent}
                presentCount={controller.getStats().presentCount}
              />
            </div>

            <YourTokenBalanceCard
              tokens={controller.getTokens()}
              onQuickRequest={handleQuickRequest}
            />
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <RecentActivityCard activities={controller.getActivities()} />

            <div className="lg:col-span-4 space-y-6">
              <PulseChart burnoutRisk={controller.getBurnoutRisk()} />
              <SyncCalendarCard onSync={handleSync} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
