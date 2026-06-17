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
  const initialMembers = [
    {
      id: 'takahashi',
      name: 'Takahashi S.',
      email: 'takahashi.s@holidayhq.com',
      role: 'LEAD' as const,
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO',
      department: 'Management' as const,
      title: 'Team Lead',
      tokensBalance: 3
    }
  ];

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
