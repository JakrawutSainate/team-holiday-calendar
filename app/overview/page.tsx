import OverviewClient from './components/OverviewClient';

// Static placeholders for initial render; hoisted to module scope to avoid re-allocation on every request
const INITIAL_ACTIVITIES: any[] = [];
const INITIAL_STATS = { presentCount: 0, availabilityPercent: 100 };
const INITIAL_BURNOUT_RISK = [0, 0, 0, 0, 0, 0, 0];
const INITIAL_TOKENS = 0;

export default async function OverviewPage() {
  return (
    <OverviewClient
      initialActivities={INITIAL_ACTIVITIES}
      initialStats={INITIAL_STATS}
      initialBurnoutRisk={INITIAL_BURNOUT_RISK}
      initialTokens={INITIAL_TOKENS}
    />
  );
}
