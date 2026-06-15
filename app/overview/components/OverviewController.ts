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
    return this.tokens;
  }

  public loadState(): void {
    if (typeof window === 'undefined') return;

    const savedTokens = localStorage.getItem('holidayhq_tokens');
    if (savedTokens) {
      this.tokens = parseFloat(savedTokens);
      this.updateCallback();
    } else {
      localStorage.setItem('holidayhq_tokens', this.tokens.toString());
    }
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
