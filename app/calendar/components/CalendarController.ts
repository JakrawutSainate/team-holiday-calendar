import {
  CalendarEvent,
  CapacitySetting,
  getTeamMembers,
  getCalendarEvents,
  getAllCapacitySettings,
  resolveCapacity,
  claimShiftMutation,
  requestLeaveMutation,
  updateMaxOffAllowedMutation,
  TeamMember
} from '@/src/libs/calendarData';
import { CalendarGridCell } from '../types';

export class CalendarController {
  private events: CalendarEvent[] = [];
  private members: TeamMember[] = [];
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
  public getCapacities(): Record<string, CapacitySetting> { return this.capacities; }
  public getGridCells(): CalendarGridCell[] { return this.gridCells; }
  public getTokens(): number { return Math.floor(this.tokens); }
  public getCapacityLimit(): number { return this.capacityLimit; }
  public isLoading(): boolean { return this.loading; }

  private buildGridCells(): CalendarGridCell[] {
    const cells: CalendarGridCell[] = [];
    const firstDayOffset = new Date(this.year, this.month - 1, 1).getDay();
    const prevMonthDays = new Date(this.year, this.month - 1, 0).getDate();
    const currentMonthDays = new Date(this.year, this.month, 0).getDate();

    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const pm = this.month === 1 ? 12 : this.month - 1;
      const py = this.month === 1 ? this.year - 1 : this.year;
      cells.push({ day, isMuted: true, dateString: `${py}-${pm.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` });
    }

    for (let day = 1; day <= currentMonthDays; day++) {
      cells.push({ day, isMuted: false, dateString: `${this.year}-${this.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` });
    }

    const totalCells = Math.ceil((currentMonthDays + firstDayOffset) / 7) * 7;
    const remaining = totalCells - (currentMonthDays + firstDayOffset);
    for (let day = 1; day <= remaining; day++) {
      const nm = this.month === 12 ? 1 : this.month + 1;
      const ny = this.month === 12 ? this.year + 1 : this.year;
      cells.push({ day, isMuted: true, dateString: `${ny}-${nm.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` });
    }

    return cells;
  }

  public async loadState(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.gridCells = [];
    this.loading = true;
    this.updateCallback();

    try {
      const [members, events, allSettings] = await Promise.all([
        getTeamMembers(),
        getCalendarEvents(this.year, this.month),
        getAllCapacitySettings(),
      ]);

      // Build grid cells after data loads so calendar + events appear together
      this.gridCells = this.buildGridCells();

      const currentUser = members.find(m => m.id === this.userId);
      this.tokens = currentUser?.tokensBalance ?? 0;
      this.events = events;
      this.members = members;

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

  public async requestLeave(dateString: string): Promise<void> {
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
      details: 'Leave request (pending)',
    }];
    this.tokens = Math.max(0, this.tokens - 1);
    this.updateCallback();

    try {
      await requestLeaveMutation(dateString);
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
