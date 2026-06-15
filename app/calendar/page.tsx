import { Suspense } from 'react';
import CalendarClient from './components/CalendarClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const year = resolvedParams.year ? parseInt(resolvedParams.year) : 2026;
  const month = resolvedParams.month ? parseInt(resolvedParams.month) : 6;

  return (
    <Suspense
      fallback={
        <div className="grow flex flex-col min-h-screen ml-64 p-12 justify-center items-center">
          <span className="animate-pulse text-lg font-medium text-secondary">
            Loading Calendar...
          </span>
        </div>
      }
    >
      <CalendarClient year={year} month={month} />
    </Suspense>
  );
}
