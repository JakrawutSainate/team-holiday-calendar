import {
  getTeamMembers,
  getAllRawEvents,
  requestLeaveMutation,
  TeamMember,
  CalendarEvent
} from '@/src/libs/calendarData';

export class LeaveRequestController {
  private members: TeamMember[] = [];
  private allEvents: CalendarEvent[] = [];
  private tokens: number = 0;
  private loading: boolean = false;
  private userId: string;
  private updateCallback: () => void;

  constructor(userId: string, updateCallback: () => void) {
    this.userId = userId;
    this.updateCallback = updateCallback;
  }

  public updateParams(userId: string): void {
    this.userId = userId;
  }

  // Getters
  public getTokens(): number {
    return Math.floor(this.tokens);
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public getMembers(): TeamMember[] {
    return this.members;
  }

  public getAllEvents(): CalendarEvent[] {
    return this.allEvents;
  }

  // Load state from DB
  public async loadState(): Promise<void> {
    if (typeof window === 'undefined') return;
    this.loading = true;
    this.updateCallback();

    try {
      const [members, events] = await Promise.all([
        getTeamMembers(),
        getAllRawEvents(),
      ]);

      this.members = members;
      this.allEvents = events;

      const currentUser = members.find(m => m.id === this.userId);
      this.tokens = currentUser?.tokensBalance ?? 0;
    } catch (e) {
      console.error('LeaveRequestController.loadState failed:', e);
    } finally {
      this.loading = false;
      this.updateCallback();
    }
  }

  // Calculate past leave days for the current year
  public calculatePastLeaveDays(currentYear: number): { SICK: number; PERSONAL: number; MATERNITY: number } {
    const stats = {
      SICK: 0,
      PERSONAL: 0,
      MATERNITY: 0
    };

    const userEvents = this.allEvents.filter(
      e => e.userId === this.userId && e.date.startsWith(currentYear.toString())
    );

    const seenEventIds = new Set<string>();

    for (const e of userEvents) {
      if (seenEventIds.has(e.id)) continue;
      seenEventIds.add(e.id);

      if (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL') {
        const reasonStr = e.leaveRequest?.reason;
        if (reasonStr) {
          try {
            const data = JSON.parse(reasonStr);
            if (data && typeof data === 'object' && data.leaveType) {
              const type = data.leaveType as 'SICK' | 'PERSONAL' | 'MATERNITY';
              const days = Number(data.totalDays) || 1;
              if (stats[type] !== undefined) {
                stats[type] += days;
              }
            }
          } catch (err) {
            // Ignore parse errors
          }
        }
      }
    }

    return stats;
  }

  // Submit leave
  public async submitLeave(
    dateString: string,
    reasonJson: string,
    signatureType: 'DRAW' | 'TEXT' | 'SAVED',
    signatureText: string,
    signatureImage: string,
    attachmentImage: string
  ): Promise<void> {
    if (this.tokens < 1) {
      throw new Error('โทเค็นไม่เพียงพอ / Insufficient Tokens');
    }
    await requestLeaveMutation(
      dateString,
      reasonJson,
      signatureType,
      signatureText,
      signatureImage,
      attachmentImage
    );
  }
}
