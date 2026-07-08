import { Suspense } from 'react';
import LeaveDocumentsClient from './components/LeaveDocumentsClient';

export const dynamic = 'force-dynamic';

export default async function LeaveDocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="grow flex flex-col min-h-screen lg:ml-64 p-12 justify-center items-center">
          <span className="animate-pulse text-lg font-medium text-zinc-500">
            กำลังโหลดข้อมูลเอกสารใบลา... / Loading Leave Documents...
          </span>
        </div>
      }
    >
      <LeaveDocumentsClient />
    </Suspense>
  );
}
