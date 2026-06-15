import { Suspense } from 'react';
import LeavesClient from './components/LeavesClient';

export const dynamic = 'force-dynamic';

export default async function LeavesPage() {
  return (
    <Suspense
      fallback={
        <div className="grow flex flex-col min-h-screen ml-64 p-12 justify-center items-center">
          <span className="animate-pulse text-lg font-medium text-secondary">
            Loading Leaves...
          </span>
        </div>
      }
    >
      <LeavesClient />
    </Suspense>
  );
}
