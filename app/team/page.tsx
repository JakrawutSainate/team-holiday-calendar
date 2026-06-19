import { Suspense } from 'react';
import TeamClient from './components/TeamClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function TeamPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || '';
  
  // Set initial empty state; instantly loads using async client controller getTeamMembers()
  const initialMembers: any[] = [];

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
      <TeamClient initialMembers={initialMembers} searchTerm={q} />
    </Suspense>
  );
}
