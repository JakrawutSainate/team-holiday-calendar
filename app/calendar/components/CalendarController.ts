import {
  CalendarEvent,
  CapacitySetting,
  getTeamMembers,
  getCalendarEvents,
  getAllCapacitySettings,
  resolveCapacity,
  claimShiftMutation,
  requestLeaveMutation,
  updateMaxOffAllowedMutation
} from '@/src/libs/calendarData';
import { CalendarGridCell } from '../types';

export class CalendarController {
  private events: CalendarEvent[] = [];
  private capacities: Record<string, CapacitySetting> = {};
  private gridCells: CalendarGridCell[] = [];
  private tokens: number = 0;
  private capacityLimit: number = 2;
  private year: number;
  private month: number;
  private userId: string;
  private updateCallback: () => void;

  constructor(year: number, month: number, userId: string, updateCallback: () => void) {
    this.year = year;
    this.month = month;
    this.userId = userId;
    this.updateCallback = updateCallback;
  }

  public updateParams(year: number, month: number, userId: string): void {
    this.year = year;
    this.month = month;
    this.userId = userId;
  }

  // Getters
  public getEvents(): CalendarEvent[] { return this.events; }
  public getCapacities(): Record<string, CapacitySetting> { return this.capacities; }
  public getGridCells(): CalendarGridCell[] { return this.gridCells; }
  public getTokens(): number { return Math.floor(this.tokens); }
  public getCapacityLimit(): number { return this.capacityLimit; }

  /** Build the grid cell array for the current month */
  private buildGridCells(): CalendarGridCell[] {
    const cells: CalendarGridCell[] = [];
    const firstDayOffset = new Date(this.year, this.month - 1, 1).getDay();
    const prevMonthDays = new Date(this.year, this.month - 1, 0).getDate();
    const currentMonthDays = new Date(this.year, this.month, 0).getDate();

    // Previous month trailing days
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const pm = this.month === 1 ? 12 : this.month - 1;
      const py = this.month === 1 ? this.year - 1 : this.year;
      cells.push({ day, isMuted: true, dateString: `${py}-${pm.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` });
    }

    // Current month days
    for (let day = 1; day <= currentMonthDays; day++) {
      cells.push({ day, isMuted: false, dateString: `${this.year}-${this.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` });
    }

    // Next month leading days
    const totalCells = Math.ceil((currentMonthDays + firstDayOffset) / 7) * 7;
    const remaining = totalCells - (currentMonthDays + firstDayOffset);
    for (let day = 1; day <= remaining; day++) {
      const nm = this.month === 12 ? 1 : this.month + 1;
      const ny = this.month === 12 ? this.year + 1 : this.year;
      cells.push({ day, isMuted: true, dateString: `${ny}-${nm.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` });
    }

    return cells;
  }

  /**
   * Load all data in parallel — replaces the old N+1 pattern.
   * Previously: 42+ sequential getDayCapacitySetting calls.
   * Now: 3 parallel requests (members, events, capacities).
   */
  public async loadState(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Build grid cells first (sync, no I/O)
    this.gridCells = this.buildGridCells();

    try {
      // 3 parallel requests instead of 42+ sequential calls
      const [members, events, allSettings] = await Promise.all([
        getTeamMembers(),
        getCalendarEvents(this.year, this.month),
        getAllCapacitySettings(),
      ]);

      // Token balance from AuthContext user
      const currentUser = members.find(m => m.id === this.userId);
      this.tokens = currentUser?.tokensBalance ?? 0;

      this.events = events;

      // Resolve capacity for every cell client-side (no extra I/O)
      const resolved: Record<string, CapacitySetting> = {};
      for (const cell of this.gridCells) {
        resolved[cell.dateString] = resolveCapacity(cell.dateString, allSettings);
      }
      this.capacities = resolved;

      // Global default capacity limit
      const firstCell = this.gridCells.find(c => !c.isMuted);
      this.capacityLimit = firstCell
        ? resolveCapacity(firstCell.dateString, allSettings).maxOffAllowed
        : 2;

    } catch (e) {
      console.error('CalendarController.loadState failed:', e);
    }

    this.updateCallback();
  }

  public async claimShift(dateString: string, status: 'WEEKEND_WORK' | 'HOLIDAY_WORK', shiftLabel: string): Promise<void> {
    try {
      await claimShiftMutation(dateString, status, `Claimed ${shiftLabel.toLowerCase()}`);
      await this.loadState();
    } catch (e) {
      console.error('Failed to claim shift:', e);
      throw e;
    }
  }

  public async requestLeave(dateString: string): Promise<void> {
    try {
      await requestLeaveMutation(dateString);
      await this.loadState();
    } catch (e) {
      console.error('Failed to request leave:', e);
      throw e;
    }
  }

  public async updateMaxOff(newVal: number): Promise<void> {
    try {
      await updateMaxOffAllowedMutation(newVal);
      await this.loadState();
    } catch (e) {
      console.error('Failed to update capacity limit:', e);
      throw e;
    }
  }
}
