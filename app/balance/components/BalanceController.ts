import { Transaction, getTeamMembers } from '@/src/libs/calendarData';

export class BalanceController {
  private tokens: number;
  private transactions: Transaction[];
  private updateCallback: () => void;

  constructor(
    initialTokens: number,
    initialTransactions: Transaction[],
    updateCallback: () => void
  ) {
    this.tokens = initialTokens;
    this.transactions = initialTransactions;
    this.updateCallback = updateCallback;
  }

  public getTokens(): number {
    return Math.floor(this.tokens);
  }

  public getTransactions(): Transaction[] {
    return this.transactions;
  }

  public async loadState(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const members = await getTeamMembers();
      const takahashi = members.find(m => m.id === 'takahashi') || { tokensBalance: 3 };
      this.tokens = takahashi.tokensBalance;
    } catch (e) {
      console.error('Failed to load balance state from database:', e);
    }

    // Keep transactions in local storage or generate them from leaves/claims dynamically
    const savedTx = localStorage.getItem('holidayhq_transactions');
    if (savedTx) {
      this.transactions = JSON.parse(savedTx);
    } else {
      localStorage.setItem('holidayhq_transactions', JSON.stringify(this.transactions));
    }

    this.updateCallback();
  }

  public async redeemTokens(
    amount: number,
    action: (input: { amount: number }) => Promise<{ success: boolean; error?: string }>
  ): Promise<string> {
    if (this.tokens < amount) {
      throw new Error('Insufficient tokens to redeem.');
    }

    const res = await action({ amount });
    if (!res.success) {
      throw new Error(res.error || 'Failed to request token rollover/payout.');
    }

    this.tokens -= amount;
    localStorage.setItem('holidayhq_tokens', this.tokens.toString());

    // Record txn
    const newTx: Transaction = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      type: 'SPEND',
      description: 'Token Rollover/Payout Request',
      status: 'Approved',
      amount: `-${amount}`
    };
    this.transactions.unshift(newTx);
    localStorage.setItem('holidayhq_transactions', JSON.stringify(this.transactions));

    this.updateCallback();
    return `Successfully requested rollover of ${amount} tokens.`;
  }
}
