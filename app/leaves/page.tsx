import { Suspense } from 'react';
import LeavesView from './components/LeavesView';

export const dynamic = 'force-dynamic';

export default function LeavesPage() {
  return (
    <Suspense fallback={
      <div className="grow flex flex-col min-h-screen ml-64 p-12 justify-center items-center">
        <span className="animate-pulse text-lg font-medium text-secondary">Loading Leaves...</span>
      </div>
    }>
      <LeavesView />
    </Suspense>
  );
}
