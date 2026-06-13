import { Suspense } from 'react';
import CalendarView from './components/CalendarView';

export const dynamic = 'force-dynamic';

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex flex-col min-h-screen ml-64 p-12 justify-center items-center">
        <span className="animate-pulse text-lg font-medium text-secondary">Loading Calendar...</span>
      </div>
    }>
      <CalendarView />
    </Suspense>
  );
}
