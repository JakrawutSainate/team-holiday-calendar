import {
  CalendarEvent,
  CapacitySetting,
  getTeamMembers,
  getCalendarEvents,
  getLeaveDocuments,
  getAllCapacitySettings,
  resolveCapacity,
  claimShiftMutation,
  requestLeaveMutation,
  updateMaxOffAllowedMutation,
  getInitialAppData,
  getSWRAppCache,
  TeamMember
} from '@/src/libs/calendarData';
import { CalendarGridCell } from '../types';

export class CalendarController {
  private events: CalendarEvent[] = [];
  private members: TeamMember[] = [];
  private leaveDocuments: any[] = [];
  private capacities: Record<string, CapacitySetting> = {};
  private gridCells: CalendarGridCell[] = [];
  private tokens: number = 0;
  private capacityLimit: number = 2;
  private loading: boolean = false;
  private year: number;
  private month: number;
  private userId: string;
  private userName: string;
  private updateCallback: () => void;

  constructor(year: number, month: number, userId: string, updateCallback: () => void, userName = '') {
    this.year = year;
    this.month = month;
    this.userId = userId;
    this.userName = userName;
    this.updateCallback = updateCallback;
  }

  public updateParams(year: number, month: number, userId: string, userName = ''): void {
    this.year = year;
    this.month = month;
    this.userId = userId;
    this.userName = userName;
  }

  // Getters
  public getEvents(): CalendarEvent[] { return this.events; }
  public getMembers(): TeamMember[] { return this.members; }
  public getLeaveDocuments(): any[] { return this.leaveDocuments; }
  public getCapacities(): Record<string, CapacitySetting> { return this.capacities; }
  public getGridCells(): CalendarGridCell[] { return this.gridCells; }
  public getTokens(): number { return Math.floor(this.tokens); }
  public getCapacityLimit(): number { return this.capacityLimit; }
  public isLoading(): boolean { return this.loading; }


  private buildGridCells(): CalendarGridCell[] {
    const cells: CalendarGridCell[] = [];
    const firstDayOffset = new Date(this.year, this.month - 1, 1).getDay();
    const prevMonthDays = new Date(this.year, this.month - 1, 0).getDate();

    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevM = this.month - 1 === 0 ? 12 : this.month - 1;
      const prevY = this.month - 1 === 0 ? this.year - 1 : this.year;
      const dateString = `${prevY}-${String(prevM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, isMuted: true, dateString });
    }

    const currentMonthDays = new Date(this.year, this.month, 0).getDate();
    for (let day = 1; day <= currentMonthDays; day++) {
      const dateString = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, isMuted: false, dateString });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextM = this.month + 1 === 13 ? 1 : this.month + 1;
      const nextY = this.month + 1 === 13 ? this.year + 1 : this.year;
      const dateString = `${nextY}-${String(nextM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, isMuted: true, dateString });
    }

    return cells;
  }

  public async loadState(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Instant SWR Cache load (0ms)
    const swr = getSWRAppCache();
    if (swr && swr.teamMembers && swr.events && swr.capacitySettings) {
      this.gridCells = this.buildGridCells();
      this.members = swr.teamMembers;
      this.events = swr.events;
      const currentUser = this.members.find((m: TeamMember) => m.id === this.userId);
      if (currentUser) this.tokens = currentUser.tokensBalance;
      const resolved: Record<string, CapacitySetting> = {};
      for (const cell of this.gridCells) {
        resolved[cell.dateString] = resolveCapacity(cell.dateString, swr.capacitySettings);
      }
      this.capacities = resolved;
      this.loading = false;
      this.updateCallback();
    } else {
      this.gridCells = [];
      this.loading = true;
      this.updateCallback();
    }

    try {
      const [initData, leaveDocs] = await Promise.all([
        getInitialAppData(),
        this.userId ? getLeaveDocuments() : Promise.resolve([]),
      ]);

      const members: TeamMember[] = initData.teamMembers || [];
      const events: CalendarEvent[] = initData.events || [];
      const allSettings: CapacitySetting[] = initData.capacitySettings || [];

      // Re-build grid cells after fresh data fetch
      this.gridCells = this.buildGridCells();

      const currentUser = members.find((m: TeamMember) => m.id === this.userId);
      this.tokens = currentUser?.tokensBalance ?? 0;
      this.events = events;
      this.members = members;
      this.leaveDocuments = leaveDocs;

      const resolved: Record<string, CapacitySetting> = {};
      for (const cell of this.gridCells) {
        resolved[cell.dateString] = resolveCapacity(cell.dateString, allSettings);
      }
      this.capacities = resolved;

      const firstCell = this.gridCells.find(c => !c.isMuted);
      this.capacityLimit = firstCell
        ? resolveCapacity(firstCell.dateString, allSettings).maxOffAllowed
        : 2;

    } catch (e) {
      console.error('CalendarController.loadState failed:', e);
    } finally {
      this.loading = false;
      this.updateCallback();
    }
  }

  public async claimShift(dateString: string, status: 'WEEKEND_WORK' | 'HOLIDAY_WORK', shiftLabel: string): Promise<void> {
    const optimisticId = `optimistic-${Date.now()}`;
    const prevEvents = this.events;
    const prevTokens = this.tokens;

    // Optimistic: show the claimed shift and +1 token immediately
    this.events = [...this.events, {
      id: optimisticId,
      userId: this.userId,
      userName: this.userName || 'You',
      date: dateString,
      status,
      details: `Claimed ${shiftLabel.toLowerCase()}`,
    }];
    this.tokens += 1;
    this.updateCallback();

    try {
      await claimShiftMutation(dateString, status, `Claimed ${shiftLabel.toLowerCase()}`);
      await this.loadState();
    } catch (e) {
      // Rollback on error
      this.events = prevEvents;
      this.tokens = prevTokens;
      this.updateCallback();
      console.error('Failed to claim shift:', e);
      throw e;
    }
  }

  public async requestLeave(
    dateString: string,
    reason?: string,
    signatureType?: 'DRAW' | 'TEXT',
    signatureText?: string,
    signatureImage?: string,
    attachmentImage?: string
  ): Promise<void> {
    const optimisticId = `optimistic-${Date.now()}`;
    const prevEvents = this.events;
    const prevTokens = this.tokens;

    // Optimistic: show the leave and deduct 1 token immediately
    this.events = [...this.events, {
      id: optimisticId,
      userId: this.userId,
      userName: this.userName || 'You',
      date: dateString,
      status: 'COMPENSATORY_OFF' as const,
      details: reason || 'Leave request (pending)',
    }];
    this.tokens = Math.max(0, this.tokens - 1);
    this.updateCallback();

    try {
      await requestLeaveMutation(dateString, reason, signatureType, signatureText, signatureImage, attachmentImage);
      await this.loadState();
    } catch (e) {
      // Rollback on error
      this.events = prevEvents;
      this.tokens = prevTokens;
      this.updateCallback();
      console.error('Failed to request leave:', e);
      throw e;
    }
  }

  public async updateMaxOff(newVal: number): Promise<void> {
    const prev = this.capacityLimit;
    this.capacityLimit = newVal;
    this.updateCallback();

    try {
      await updateMaxOffAllowedMutation(newVal);
      await this.loadState();
    } catch (e) {
      this.capacityLimit = prev;
      this.updateCallback();
      console.error('Failed to update capacity limit:', e);
      throw e;
    }
  }
}
