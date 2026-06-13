import { Suspense } from 'react';
import TeamView from './components/TeamView';

export const dynamic = 'force-dynamic';

export default function TeamPage() {
  return (
    <Suspense fallback={
      <div className="grow flex flex-col min-h-screen ml-64 p-12 justify-center items-center">
        <span className="animate-pulse text-lg font-medium text-secondary">Loading Directory...</span>
      </div>
    }>
      <TeamView />
    </Suspense>
  );
}
