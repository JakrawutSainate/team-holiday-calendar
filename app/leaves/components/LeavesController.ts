import { CalendarEvent } from '@/src/libs/calendarData';

export class LeavesController {
  private leaves: CalendarEvent[] = [];
  private tokens: number = 3;
  private updateCallback: () => void;

  constructor(updateCallback: () => void) {
    this.updateCallback = updateCallback;
  }

  public getLeaves(): CalendarEvent[] {
    return this.leaves;
  }

  public getTokens(): number {
    return this.tokens;
  }

  public loadState(): void {
    if (typeof window === 'undefined') return;

    // Load tokens
    const savedTokens = localStorage.getItem('holidayhq_tokens') || '3';
    this.tokens = parseFloat(savedTokens);

    // Load leave events
    const savedEvents = localStorage.getItem('holidayhq_events');
    if (savedEvents) {
      const allEvents = JSON.parse(savedEvents) as CalendarEvent[];
      const userLeaves = allEvents.filter(
        (e: CalendarEvent) => e.userId === 'user-takahashi' && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL')
      );
      userLeaves.sort((a: CalendarEvent, b: CalendarEvent) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this.leaves = userLeaves;
    } else {
      this.leaves = [];
    }

    this.updateCallback();
  }

  public cancelLeave(leave: CalendarEvent): void {
    // Refund 1 token
    const currentTokensStr = localStorage.getItem('holidayhq_tokens') || '3';
    const currentTokens = parseFloat(currentTokensStr);
    const newTokens = currentTokens + 1;
    localStorage.setItem('holidayhq_tokens', newTokens.toString());
    this.tokens = newTokens;

    // Remove leave event from local storage
    const saved = localStorage.getItem('holidayhq_events');
    if (saved) {
      const allEvents = JSON.parse(saved) as CalendarEvent[];
      const updatedEvents = allEvents.filter((e: CalendarEvent) => e.id !== leave.id);
      localStorage.setItem('holidayhq_events', JSON.stringify(updatedEvents));
    }

    // Add a refund transaction
    const savedLocalTx = localStorage.getItem('holidayhq_transactions');
    let allTx = savedLocalTx ? JSON.parse(savedLocalTx) : [];
    const formattedDate = new Date(leave.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    allTx.unshift({
      date: formattedDate,
      type: 'EARN',
      description: `Compensatory Leave refunded (+1 token)`,
      status: 'Approved',
      amount: '+1'
    });
    localStorage.setItem('holidayhq_transactions', JSON.stringify(allTx));

    // Dispatch update event to let other parts know
    window.dispatchEvent(new Event('holidayhq_events_updated'));

    this.loadState();
  }
}
