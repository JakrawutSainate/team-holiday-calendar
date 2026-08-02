import BalanceClient from './components/BalanceClient';

// Static placeholders hoisted to module scope to avoid re-allocation on every render
const INITIAL_TRANSACTIONS: any[] = [];
const INITIAL_TOKENS = 0;

export default async function BalancePage() {
  return (
    <BalanceClient
      initialTokens={INITIAL_TOKENS}
      initialTransactions={INITIAL_TRANSACTIONS}
    />
  );
}
