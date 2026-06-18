import { CalendarEvent, getCalendarEvents, getTeamMembers, cancelLeaveMutation } from '@/src/libs/calendarData';

export class LeavesController {
  private leaves: CalendarEvent[] = [];
  private tokens: number = 0;
  private updateCallback: () => void;
  private userId: string;

  constructor(updateCallback: () => void, userId = '') {
    this.updateCallback = updateCallback;
    this.userId = userId;
  }

  public getLeaves(): CalendarEvent[] {
    return this.leaves;
  }

  public getTokens(): number {
    return Math.floor(this.tokens);
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public async loadState(userId?: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const effectiveUserId = userId || this.userId;

    try {
      // Fetch current user token balance from backend
      const members = await getTeamMembers();
      const currentUser = members.find(m => m.id === effectiveUserId);
      if (currentUser) {
        this.tokens = currentUser.tokensBalance;
      }

      // Fetch all events from backend and filter for current user
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const allEvents = await getCalendarEvents(year, month);

      // Also fetch last 2 months worth of events to show full history
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonthEvents = await getCalendarEvents(prevYear, prevMonth);

      // Combine and filter to current user's leave/off events only
      const combined = [...allEvents, ...prevMonthEvents];
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
    }

    this.updateCallback();
  }

  public async cancelLeave(leave: CalendarEvent): Promise<void> {
    try {
      await cancelLeaveMutation(leave.id);
    } catch (err) {
      console.error('Failed to cancel leave:', err);
    }

    // Refresh state from backend
    await this.loadState();
  }
}
