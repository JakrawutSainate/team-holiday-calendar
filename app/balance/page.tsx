import BalanceClient from './components/BalanceClient';

export default async function BalancePage() {
  // Static placeholders; immediately populated with dynamic PostgreSQL values inside BalanceClient controller
  const initialTransactions = [
    {
      date: 'Oct 24, 2026',
      type: 'EARN' as const,
      description: 'Weekend Coverage (Sat-Sun)',
      status: 'Approved',
      amount: '+1'
    }
  ];
  const initialTokens = 3;

  return (
    <BalanceClient
      initialTokens={initialTokens}
      initialTransactions={initialTransactions}
    />
  );
}
