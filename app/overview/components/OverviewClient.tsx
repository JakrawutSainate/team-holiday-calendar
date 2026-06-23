'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useAuth } from '@/src/components/AuthContext';
import TopNavBar from '@/src/components/TopNavBar';
import { Activity } from '@/src/libs/calendarData';
import { OverviewController } from './OverviewController';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import OverviewSkeleton from '@/src/components/skeletons/OverviewSkeleton';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

// Components
import OverviewHeader from './OverviewHeader';
import UpcomingHolidaysCard from './UpcomingHolidaysCard';
import YourTokenBalanceCard from './YourTokenBalanceCard';
import RecentActivityCard from './RecentActivityCard';
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
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [, setTick] = useState(0);

  const [controller] = useState<OverviewController>(() => new OverviewController(
    initialActivities,
    initialStats,
    initialBurnoutRisk,
    initialTokens,
    () => setTick((tick) => tick + 1),
    user?.id || '',
    user?.name || ''
  ));

  useEffect(() => {
    controller.loadState(user?.id || '');
  }, [controller, user?.id]);

  useRealtimeSync(() => controller.loadState(user?.id || ''));

  if (controller.isLoading() && controller.getActivities().length === 0) {
    return <OverviewSkeleton />;
  }

  return (
    <ErrorBoundary>
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={t('searchTeamOrDates')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto space-y-8">
          {/* Header */}
          <OverviewHeader />

          {/* Cards Grid */}
          <div className={user ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6"}>
            <UpcomingHolidaysCard items={controller.getUpcomingHolidaysAndShifts(language)} />

            {user && (
              <YourTokenBalanceCard
                tokens={Math.floor(user.tokensBalance)}
              />
            )}
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <RecentActivityCard activities={controller.getActivities()} />

            <div className="lg:col-span-4 space-y-6">
              <PulseChart
                burnoutRisk={controller.getBurnoutRisk()}
                events={controller.getEvents()}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}
