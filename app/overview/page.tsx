import { HolidayHQManager } from '@/src/libs/models/HolidayHQManager';
import OverviewClient from './components/OverviewClient';

export default async function OverviewPage() {
  const manager = new HolidayHQManager();

  // Fetch initial data on the server for SSR
  const initialActivities = manager.getRecentActivities();
  const initialStats = manager.getAvailabilityStats();
  const initialBurnoutRisk = manager.getBurnoutRiskIndex();
  const initialTokens = 3;

  return (
    <OverviewClient
      initialActivities={initialActivities}
      initialStats={initialStats}
      initialBurnoutRisk={initialBurnoutRisk}
      initialTokens={initialTokens}
    />
  );
}
