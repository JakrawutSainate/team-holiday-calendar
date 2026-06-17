import OverviewClient from './components/OverviewClient';

export default async function OverviewPage() {
  // Static placeholders for initial render; immediately loaded via async client controller.loadState()
  const initialActivities = [
    {
      id: 'act-1',
      type: 'check_circle',
      title: 'Database Active',
      description: 'System loaded from Postgres database successfully.',
      time: 'Just now',
    }
  ];
  const initialStats = { presentCount: 0, availabilityPercent: 100 };
  const initialBurnoutRisk = [0, 0, 0, 0, 0, 0, 0];
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
