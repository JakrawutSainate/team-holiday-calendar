import { Transaction, CalendarEvent, getTeamMembers, getCalendarEvents } from '@/src/libs/calendarData';

export class BalanceController {
  private tokens: number;
  private transactions: Transaction[];
  private updateCallback: () => void;
  private userId: string;

  constructor(
    initialTokens: number,
    initialTransactions: Transaction[],
    updateCallback: () => void,
    userId = ''
  ) {
    this.tokens = initialTokens;
    this.transactions = initialTransactions;
    this.updateCallback = updateCallback;
    this.userId = userId;
  }

  public getTokens(): number {
    return Math.floor(this.tokens);
  }

  public getTransactions(): Transaction[] {
    return this.transactions;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public async loadState(userId?: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const effectiveUserId = userId || this.userId;

    try {
      // Fetch token balance from live backend for the logged-in user
      const members = await getTeamMembers();
      const currentUser = members.find(m => m.id === effectiveUserId);
      if (currentUser) {
        this.tokens = currentUser.tokensBalance;
      }

      // Build transaction history from real calendar events (WEEKEND_WORK = earn, COMPENSATORY_OFF = spend)
      const now = new Date();
      const promises = [];
      for (let i = 0; i < 3; i++) {
        const m = now.getMonth() + 1 - i;
        const y = m <= 0 ? now.getFullYear() - 1 : now.getFullYear();
        const adjustedMonth = m <= 0 ? m + 12 : m;
        promises.push(getCalendarEvents(y, adjustedMonth));
      }
      const monthsData = await Promise.all(promises);
      const allEvents: CalendarEvent[] = monthsData.flat();

      // Filter to this user's events and build transactions
      const userEvents = allEvents
        .filter(
          (e: CalendarEvent) =>
            e.userId === effectiveUserId &&
            e.status !== 'PUBLIC_HOLIDAY' &&
            (e.status === 'WEEKEND_WORK' || e.status === 'HOLIDAY_WORK' || e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL')
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      this.transactions = userEvents.map(e => {
        const isEarn = e.status === 'WEEKEND_WORK' || e.status === 'HOLIDAY_WORK';
        const formattedDate = new Date(e.date).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        });
        return {
          date: formattedDate,
          type: isEarn ? 'EARN' : 'SPEND',
          description: isEarn
            ? `Weekend/Holiday Coverage`
            : (e.details || 'Compensatory Leave Used'),
          status: 'Approved',
          amount: isEarn ? '+1' : '-1'
        };
      });

    } catch (e) {
      console.error('Failed to load balance state from database:', e);
    }

    this.updateCallback();
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

    // Record txn locally
    const newTx: Transaction = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      type: 'SPEND',
      description: 'Token Rollover/Payout Request',
      status: 'Approved',
      amount: `-${amount}`
    };
    this.transactions.unshift(newTx);

    this.updateCallback();
    return `Successfully requested rollover of ${amount} tokens.`;
  }
}
