import OverviewClient from './components/OverviewClient';

export default async function OverviewPage() {
  // Static placeholders for initial render; immediately loaded via async client controller.loadState()
  const initialActivities: any[] = [];
  const initialStats = { presentCount: 0, availabilityPercent: 100 };
  const initialBurnoutRisk = [0, 0, 0, 0, 0, 0, 0];
  const initialTokens = 0;

  return (
    <OverviewClient
      initialActivities={initialActivities}
      initialStats={initialStats}
      initialBurnoutRisk={initialBurnoutRisk}
      initialTokens={initialTokens}
    />
  );
}
