import { HolidayHQManager } from '@/src/libs/models/HolidayHQManager';
import BalanceClient from './components/BalanceClient';

// Server-Side Rendered (SSR) page component
export default async function BalancePage() {
  const manager = new HolidayHQManager();
  
  // Load initial fallback data from OOP model on the server
  const initialTransactions = manager.getTransactions();
  const initialTokens = 3;

  return (
    <BalanceClient
      initialTokens={initialTokens}
      initialTransactions={initialTransactions}
    />
  );
}
