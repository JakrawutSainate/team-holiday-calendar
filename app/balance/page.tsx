import BalanceClient from './components/BalanceClient';

export default async function BalancePage() {
  // Static placeholders; immediately populated with dynamic PostgreSQL values inside BalanceClient controller
  const initialTransactions: any[] = [];
  const initialTokens = 0;

  return (
    <BalanceClient
      initialTokens={initialTokens}
      initialTransactions={initialTransactions}
    />
  );
}
