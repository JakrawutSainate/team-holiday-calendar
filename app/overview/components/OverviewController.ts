import { Activity } from '@/src/libs/models/HolidayHQManager';

export class OverviewController {
  private activities: Activity[];
  private stats: { presentCount: number; availabilityPercent: number };
  private burnoutRisk: number[];
  private tokens: number;
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
    this.updateCallback = updateCallback;
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

  public loadState(): void {
    if (typeof window === 'undefined') return;

    const savedTokens = localStorage.getItem('holidayhq_tokens');
    if (savedTokens) {
      this.tokens = parseFloat(savedTokens);
    } else {
      localStorage.setItem('holidayhq_tokens', this.tokens.toString());
    }

    const savedEvents = localStorage.getItem('holidayhq_events');
    if (savedEvents) {
      try {
        const events = JSON.parse(savedEvents);
        const tzOffset = new Date().getTimezoneOffset() * 60000;
        const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
        const activeLeaves = events.filter(
          (e: any) => e.date === todayStr && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL')
        );
        const absentCount = activeLeaves.length;
        const totalMembers = 8;
        this.stats = {
          presentCount: absentCount,
          availabilityPercent: totalMembers > 0 ? Math.round((absentCount / totalMembers) * 100) : 0
        };
      } catch (err) {
        console.error('Failed to parse saved events:', err);
      }
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
