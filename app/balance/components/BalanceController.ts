import { Transaction, TokenTransaction, getTeamMembers, getTokenTransactions } from '@/src/libs/calendarData';

export class BalanceController {
  private tokens: number;
  private transactions: Transaction[];
  private loading: boolean = false;
  private updateCallback: () => void;
  private userId: string;

  constructor(initialTokens: number, initialTransactions: Transaction[], updateCallback: () => void, userId = '') {
    this.tokens = initialTokens;
    this.transactions = initialTransactions;
    this.updateCallback = updateCallback;
    this.userId = userId;
  }

  public getTokens(): number { return Math.floor(this.tokens); }
  public getTransactions(): Transaction[] { return this.transactions; }
  public isLoading(): boolean { return this.loading; }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public async loadState(userId?: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const effectiveUserId = userId || this.userId;
    this.loading = true;
    this.updateCallback();

    try {
      // Fetch token balance and transactions in parallel
      const [members, txns] = await Promise.all([
        getTeamMembers(),
        getTokenTransactions(),
      ]);

      const currentUser = members.find(m => m.id === effectiveUserId);
      if (currentUser) {
        this.tokens = currentUser.tokensBalance;
      }

      // Map real TokenTransaction records to the display Transaction type
      this.transactions = txns.map((t: TokenTransaction): Transaction => {
        let displayDate = '';
        if (t.relatedDate) {
          try {
            const d = new Date(t.relatedDate + 'T00:00:00');
            displayDate = d.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            });
          } catch {
            displayDate = t.relatedDate;
          }
        } else {
          displayDate = new Date(t.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          });
        }

        return {
          date: displayDate,
          type: t.type as 'EARN' | 'SPEND',
          description: t.description,
          status: 'Approved',
          amount: t.type === 'EARN' ? `+${t.amount}` : `-${t.amount}`,
          relatedDate: t.relatedDate ?? undefined,
        };
      });

    } catch (e) {
      console.error('Failed to load balance state from database:', e);
    } finally {
      this.loading = false;
      this.updateCallback();
    }
  }

  public async redeemTokens(
    amount: number,
    action: (input: { tokensToRedeem: number; reason: string }) => Promise<{ success: boolean; error?: string }>
  ): Promise<string> {
    if (this.tokens < amount) {
      throw new Error('Insufficient tokens to redeem.');
    }

    const res = await action({ tokensToRedeem: amount, reason: 'Token Rollover/Payout Request' });
    if (!res.success) {
      throw new Error(res.error || 'Failed to request token rollover/payout.');
    }

    this.tokens -= amount;

    const newTx: Transaction = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      type: 'SPEND',
      description: 'Token Rollover/Payout Request',
      status: 'Approved',
      amount: `-${amount}`,
    };
    this.transactions.unshift(newTx);

    this.updateCallback();
    return `Successfully requested rollover of ${amount} tokens.`;
  }
}
