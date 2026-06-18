import {
  CalendarEvent,
  CapacitySetting,
  getTeamMembers,
  getCalendarEvents,
  getDayCapacitySetting,
  claimShiftMutation,
  requestLeaveMutation,
  updateMaxOffAllowedMutation
} from '@/src/libs/calendarData';
import { CalendarGridCell } from '../types';

export class CalendarController {
  private events: CalendarEvent[] = [];
  private capacities: Record<string, CapacitySetting> = {};
  private gridCells: CalendarGridCell[] = [];
  private tokens: number = 3;
  private capacityLimit: number = 2;
  private year: number;
  private month: number;
  private role: string;
  private updateCallback: () => void;

  constructor(
    year: number,
    month: number,
    role: string,
    updateCallback: () => void
  ) {
    this.year = year;
    this.month = month;
    this.role = role;
    this.updateCallback = updateCallback;
  }

  public updateParams(year: number, month: number, role: string): void {
    this.year = year;
    this.month = month;
    this.role = role;
  }

  // Getters
  public getEvents(): CalendarEvent[] {
    return this.events;
  }

  public getCapacities(): Record<string, CapacitySetting> {
    return this.capacities;
  }

  public getGridCells(): CalendarGridCell[] {
    return this.gridCells;
  }

  public getTokens(): number {
    return Math.floor(this.tokens);
  }

  public getCapacityLimit(): number {
    return this.capacityLimit;
  }

  // Load state and build grid
  public async loadState(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Load actual DB values
    try {
      const members = await getTeamMembers();
      const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('holidayhq_user') : null;
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      const activeUserId = savedUser ? savedUser.id : 'takahashi';
      const activeUser = members.find(m => m.id === activeUserId) || { tokensBalance: 0 };
      this.tokens = activeUser.tokensBalance;
    } catch (e) {
      console.error('Failed to load team tokens balance:', e);
    }

    const cells: CalendarGridCell[] = [];
    const firstDayOffset = new Date(this.year, this.month - 1, 1).getDay();
    const prevMonthDays = new Date(this.year, this.month - 1, 0).getDate();
    const currentMonthDays = new Date(this.year, this.month, 0).getDate();

    // Prev Month
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevMonth = this.month === 1 ? 12 : this.month - 1;
      const prevYear = this.month === 1 ? this.year - 1 : this.year;
      cells.push({
        day,
        isMuted: true,
        dateString: `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      });
    }

    // Current Month
    for (let day = 1; day <= currentMonthDays; day++) {
      cells.push({
        day,
        isMuted: false,
        dateString: `${this.year}-${this.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      });
    }

    // Next Month
    const totalCells = Math.ceil((currentMonthDays + firstDayOffset) / 7) * 7;
    const nextMonthRemaining = totalCells - (currentMonthDays + firstDayOffset);
    for (let day = 1; day <= nextMonthRemaining; day++) {
      const nextMonth = this.month === 12 ? 1 : this.month + 1;
      const nextYear = this.month === 12 ? this.year + 1 : this.year;
      cells.push({
        day,
        isMuted: true,
        dateString: `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      });
    }

    this.gridCells = cells;

    // Load actual DB events
    try {
      this.events = await getCalendarEvents(this.year, this.month);
    } catch (e) {
      console.error('Failed to load events:', e);
    }

    // Get capacity settings from DB
    const resolvedCapacities: Record<string, CapacitySetting> = {};
    for (const cell of cells) {
      try {
        resolvedCapacities[cell.dateString] = await getDayCapacitySetting(cell.dateString);
      } catch (e) {
        resolvedCapacities[cell.dateString] = { id: cell.dateString, maxOffAllowed: 2 };
      }
    }
    this.capacities = resolvedCapacities;

    // Resolve default maxOff
    try {
      const dummyDate = `${this.year}-${this.month.toString().padStart(2, '0')}-01`;
      const defaultSetting = await getDayCapacitySetting(dummyDate);
      this.capacityLimit = defaultSetting.maxOffAllowed;
    } catch (e) {
      this.capacityLimit = 2;
    }

    this.updateCallback();
  }

  // Claim shift
  public async claimShift(dateString: string, status: 'WEEKEND_WORK' | 'HOLIDAY_WORK', shiftLabel: string, multiplier: number): Promise<void> {
    try {
      await claimShiftMutation(dateString, status, `Claimed ${shiftLabel.toLowerCase()}`);
      await this.loadState();
    } catch (e) {
      console.error('Failed to claim shift:', e);
    }
  }

  // Request Leave
  public async requestLeave(dateString: string): Promise<void> {
    try {
      await requestLeaveMutation(dateString);
      await this.loadState();
    } catch (e) {
      console.error('Failed to request leave:', e);
    }
  }

  // Update Max Off
  public async updateMaxOff(newVal: number): Promise<void> {
    try {
      await updateMaxOffAllowedMutation(newVal);
      await this.loadState();
    } catch (e) {
      console.error('Failed to update capacity limit:', e);
    }
  }
}
