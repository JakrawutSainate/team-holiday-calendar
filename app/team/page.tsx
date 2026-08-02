import { Suspense } from 'react';
import TeamClient from './components/TeamClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

// Static placeholder hoisted to module scope to avoid re-allocation on every request
const INITIAL_MEMBERS: any[] = [];

export default async function TeamPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || '';

  return (
    <Suspense
      fallback={
        <div className="grow flex flex-col min-h-screen ml-64 p-12 justify-center items-center">
          <span className="animate-pulse text-lg font-medium text-secondary">
            Loading Directory...
          </span>
        </div>
      }
    >
      <TeamClient initialMembers={INITIAL_MEMBERS} searchTerm={q} />
    </Suspense>
  );
}
