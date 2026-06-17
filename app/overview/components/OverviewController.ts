import { Activity, CalendarEvent, getTeamMembers, getCalendarEvents } from '@/src/libs/calendarData';

export class OverviewController {
  private activities: Activity[];
  private stats: { presentCount: number; availabilityPercent: number };
  private burnoutRisk: number[];
  private tokens: number;
  private events: CalendarEvent[];
  private updateCallback: () => void;

  constructor(
    initialActivities: Activity[],
    initialStats: { presentCount: number; availabilityPercent: number },
    initialBurnoutRisk: number[],
    initialTokens: number,
    updateCallback: () => void
  ) {
    this.activities = initialActivities;
    this.stats = initialStats;
    this.burnoutRisk = initialBurnoutRisk;
    this.tokens = initialTokens;
    this.events = [];
    this.updateCallback = updateCallback;
  }

  public getEvents(): CalendarEvent[] {
    return this.events;
  }

  public getActivities(): Activity[] {
    return this.activities;
  }

  public getStats(): { presentCount: number; availabilityPercent: number } {
    return this.stats;
  }

  public getBurnoutRisk(): number[] {
    return this.burnoutRisk;
  }

  public getTokens(): number {
    return Math.floor(this.tokens);
  }

  public async loadState(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const members = await getTeamMembers();
      const takahashi = members.find(m => m.id === 'takahashi') || { tokensBalance: 3 };
      this.tokens = takahashi.tokensBalance;

      // Get current date details
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const allEvents = await getCalendarEvents(year, month);
      this.events = allEvents;

      const tzOffset = now.getTimezoneOffset() * 60000;
      const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
      const activeLeaves = allEvents.filter(
        (e: CalendarEvent) => e.date === todayStr && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL')
      );
      
      const absentCount = activeLeaves.length;
      const totalMembers = members.length || 8;
      this.stats = {
        presentCount: absentCount,
        availabilityPercent: totalMembers > 0 ? Math.round((absentCount / totalMembers) * 100) : 0
      };

      // Recalculate 7-day workloads from DB events
      const workloads = [0, 0, 0, 0, 0, 0, 0];
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMonday);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const tzOffsetDay = d.getTimezoneOffset() * 60000;
        const dateStr = new Date(d.getTime() - tzOffsetDay).toISOString().split('T')[0];

        const dayLeaves = allEvents.filter(
          (e: CalendarEvent) => e.date === dateStr && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL')
        );
        workloads[i] = totalMembers > 0 ? Math.round((dayLeaves.length / totalMembers) * 100) : 0;
      }
      this.burnoutRisk = workloads;
    } catch (err) {
      console.error('Failed to load DB state for dashboard:', err);
    }

    this.updateCallback();
  }

  public async syncCalendar(
    syncAction: (input: { calendarType: 'google' | 'slack' | 'outlook'; enabled: boolean }) => Promise<{ success: boolean; error?: string }>
  ): Promise<string> {
    const res = await syncAction({ calendarType: 'google', enabled: true });
    if (!res.success) {
      throw new Error(res.error || 'Sync failed');
    }
    return 'Google Calendar Sync Enabled!';
  }

  public async quickRequest(
    requestAction: (input: { leaveDate: string; reason: string }) => Promise<{ success: boolean; error?: string }>
  ): Promise<string> {
    const res = await requestAction({ leaveDate: '2026-10-24', reason: 'Dashboard request' });
    if (!res.success) {
      throw new Error(res.error || 'Quick request failed');
    }
    return 'Quick Request Submitted!';
  }
}
