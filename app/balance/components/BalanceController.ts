import { Transaction } from '@/src/libs/models/HolidayHQManager';

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

  /**
   * Loads the latest state from localStorage if available in browser
   */
  public loadState(): void {
    if (typeof window === 'undefined') return;

    const savedTx = localStorage.getItem('holidayhq_transactions');
    if (savedTx) {
      this.transactions = JSON.parse(savedTx);
    } else {
      localStorage.setItem('holidayhq_transactions', JSON.stringify(this.transactions));
    }

    const savedTokens = localStorage.getItem('holidayhq_tokens');
    if (savedTokens) {
      this.tokens = parseFloat(savedTokens);
    } else {
      localStorage.setItem('holidayhq_tokens', this.tokens.toString());
    }

    this.updateCallback();
  }

  /**
   * Handles token redemption logic
   */
  public async redeem(
    redeemTokensAction: (input: { tokensToRedeem: number; reason: string }) => Promise<{ success: boolean; error?: string }>
  ): Promise<string> {
    if (this.tokens < 1) {
      throw new Error(`Insufficient tokens. You have ${this.tokens} tokens but you need at least 1 token to request leave.`);
    }

    const res = await redeemTokensAction({ tokensToRedeem: 1, reason: 'Redeemed leave' });
    if (!res.success) {
      throw new Error(res.error || 'Server error occurred');
    }

    this.tokens -= 1;
    localStorage.setItem('holidayhq_tokens', this.tokens.toString());

    const newTx: Transaction = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      type: 'SPEND',
      description: 'Redeemed leave (Takahashi S.)',
      status: 'Approved',
      amount: '-1'
    };
    this.transactions = [newTx, ...this.transactions];
    localStorage.setItem('holidayhq_transactions', JSON.stringify(this.transactions));

    this.updateCallback();
    return 'Leave requested successfully via Tokens!';
  }
}
