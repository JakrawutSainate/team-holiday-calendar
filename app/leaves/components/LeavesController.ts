import { CalendarEvent, getCalendarEvents, getAllRawEvents, getTeamMembers, cancelLeaveMutation } from '@/src/libs/calendarData';

export class LeavesController {
  private leaves: CalendarEvent[] = [];
  private tokens: number = 0;
  private loading: boolean = false;
  private updateCallback: () => void;
  private userId: string;

  constructor(updateCallback: () => void, userId = '') {
    this.updateCallback = updateCallback;
    this.userId = userId;
  }

  public getLeaves(): CalendarEvent[] { return this.leaves; }
  public getTokens(): number { return Math.floor(this.tokens); }
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
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const [members, currentEvents, prevEvents, rawEvents] = await Promise.all([
        getTeamMembers(),
        getCalendarEvents(year, month),
        getCalendarEvents(prevYear, prevMonth),
        getAllRawEvents(),
      ]);

      const currentUser = members.find(m => m.id === effectiveUserId);
      if (currentUser) {
        this.tokens = currentUser.tokensBalance;
      }

      // Merge month events and raw events, deduplicating by ID
      const eventMap = new Map<string, CalendarEvent>();
      for (const e of [...(rawEvents || []), ...(currentEvents || []), ...(prevEvents || [])]) {
        if (e && e.id) eventMap.set(e.id, e);
      }

      const combined = Array.from(eventMap.values());
      const userLeaves = combined.filter(
        (e: CalendarEvent) =>
          e.userId === effectiveUserId &&
          (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL')
      );
      userLeaves.sort((a: CalendarEvent, b: CalendarEvent) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.leaves = userLeaves;
    } catch (err) {
      console.error('Failed to load leaves from backend:', err);
      this.leaves = [];
    } finally {
      this.loading = false;
      this.updateCallback();
    }
  }

  public async cancelLeave(leave: CalendarEvent): Promise<void> {
    const prevLeaves = this.leaves;
    const prevTokens = this.tokens;

    // Optimistic: remove from list and refund token immediately
    this.leaves = this.leaves.filter(l => l.id !== leave.id);
    this.tokens += 1;
    this.updateCallback();

    try {
      await cancelLeaveMutation(leave.id);
      await this.loadState();
    } catch (err) {
      // Rollback on error
      this.leaves = prevLeaves;
      this.tokens = prevTokens;
      this.updateCallback();
      console.error('Failed to cancel leave:', err);
      throw err;
    }
  }
}
