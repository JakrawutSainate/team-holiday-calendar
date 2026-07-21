import { Suspense } from 'react';
import LeaveRequestClient from './components/LeaveRequestClient';

export const dynamic = 'force-dynamic';

export default async function LeaveRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="grow flex flex-col min-h-screen ml-64 p-12 justify-center items-center">
          <span className="animate-pulse text-lg font-medium text-secondary">
            กำลังโหลดแบบฟอร์ม... / Loading Form...
          </span>
        </div>
      }
    >
      <LeaveRequestClient />
    </Suspense>
  );
}
