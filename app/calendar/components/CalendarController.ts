import { CalendarEvent, CapacitySetting } from '@/src/libs/calendarData';
import { HolidayHQManager } from '@/src/libs/models/HolidayHQManager';
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
  public loadState(): void {
    if (typeof window === 'undefined') return;

    // Load tokens
    const savedTokens = localStorage.getItem('holidayhq_tokens') || '3';
    this.tokens = parseFloat(savedTokens);

    const maxOff = parseInt(localStorage.getItem('holidayhq_max_off_allowed') || '2');
    this.capacityLimit = maxOff;

    const manager = new HolidayHQManager();

    const firstDayOffset = new Date(this.year, this.month - 1, 1).getDay();
    const prevMonthDays = new Date(this.year, this.month - 1, 0).getDate();
    const currentMonthDays = new Date(this.year, this.month, 0).getDate();

    const cells: CalendarGridCell[] = [];

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

    // Load events
    const localEvents = localStorage.getItem('holidayhq_events');
    let parsedEvents: CalendarEvent[] = [];
    if (localEvents) {
      parsedEvents = JSON.parse(localEvents);
    } else {
      parsedEvents = manager.getEventsForMonth(this.year, this.month);
      localStorage.setItem('holidayhq_events', JSON.stringify(parsedEvents));
    }

    const activeEvents = parsedEvents.filter((e) =>
      e.date.startsWith(`${this.year}-${this.month.toString().padStart(2, '0')}`)
    );
    const managerHolidays = manager
      .getEventsForMonth(this.year, this.month)
      .filter((e) => e.status === 'PUBLIC_HOLIDAY');

    this.events = [...activeEvents, ...managerHolidays].reduce((acc: CalendarEvent[], curr) => {
      if (!acc.some((e) => e.date === curr.date && e.status === curr.status && e.userName === curr.userName)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    const resolvedCapacities: Record<string, CapacitySetting> = {};
    cells.forEach((cell) => {
      const cap = manager.getDayCapacity(cell.dateString);
      if (cap.id === 'fallback-default' || cap.id === 'global-default') {
        cap.maxOffAllowed = maxOff;
      }
      resolvedCapacities[cell.dateString] = cap;
    });
    this.capacities = resolvedCapacities;

    this.updateCallback();
  }

  // Claim shift
  public claimShift(dateString: string, status: 'WEEKEND_WORK' | 'HOLIDAY_WORK', shiftLabel: string, multiplier: number): void {
    const dateObj = new Date(dateString);
    const newEvent: CalendarEvent = {
      id: `${status === 'HOLIDAY_WORK' ? 'holiday' : 'weekend'}-work-${dateString}-${Date.now()}`,
      userId: 'user-takahashi',
      userName: 'Takahashi S.',
      date: dateString,
      status: status,
      details: `Claimed ${shiftLabel.toLowerCase()}`
    };

    this.events = [...this.events, newEvent];

    // Save to localStorage
    const savedLocalEvents = localStorage.getItem('holidayhq_events');
    let allEvents: CalendarEvent[] = savedLocalEvents ? JSON.parse(savedLocalEvents) : [];
    allEvents.push(newEvent);
    localStorage.setItem('holidayhq_events', JSON.stringify(allEvents));

    // Update tokens
    this.tokens += multiplier;
    localStorage.setItem('holidayhq_tokens', this.tokens.toString());

    // Save transaction
    const savedLocalTx = localStorage.getItem('holidayhq_transactions');
    let allTx = savedLocalTx ? JSON.parse(savedLocalTx) : [];
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    allTx.unshift({
      date: formattedDate,
      type: 'EARN',
      description: `${shiftLabel} Claimed (${dateObj.toLocaleDateString('en-US', { weekday: 'short' })})`,
      status: 'Approved',
      amount: `+${multiplier}`
    });
    localStorage.setItem('holidayhq_transactions', JSON.stringify(allTx));

    this.updateCallback();
  }

  // Request Leave
  public requestLeave(dateString: string): void {
    const dateObj = new Date(dateString);
    this.tokens -= 1;
    localStorage.setItem('holidayhq_tokens', this.tokens.toString());

    const newEvent: CalendarEvent = {
      id: `leave-${dateString}-${Date.now()}`,
      userId: 'user-takahashi',
      userName: 'Takahashi S.',
      date: dateString,
      status: 'COMPENSATORY_OFF',
      details: 'Requested leave via calendar click'
    };

    this.events = [...this.events, newEvent];

    // Save events
    const savedLocalEvents = localStorage.getItem('holidayhq_events');
    let allEvents: CalendarEvent[] = savedLocalEvents ? JSON.parse(savedLocalEvents) : [];
    allEvents.push(newEvent);
    localStorage.setItem('holidayhq_events', JSON.stringify(allEvents));

    // Save transaction
    const savedLocalTx = localStorage.getItem('holidayhq_transactions');
    let allTx = savedLocalTx ? JSON.parse(savedLocalTx) : [];
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    allTx.unshift({
      date: formattedDate,
      type: 'SPEND',
      description: `Compensatory Leave booked (${dateObj.toLocaleDateString('en-US', { weekday: 'short' })})`,
      status: 'Approved',
      amount: '-1'
    });
    localStorage.setItem('holidayhq_transactions', JSON.stringify(allTx));

    this.updateCallback();
  }

  // Update capacity limit
  public changeMaxOff(newVal: number): void {
    localStorage.setItem('holidayhq_max_off_allowed', newVal.toString());
    this.capacityLimit = newVal;

    const updatedCapacities = { ...this.capacities };
    Object.keys(updatedCapacities).forEach((dateStr) => {
      const cap = updatedCapacities[dateStr];
      if (cap.id === 'fallback-default' || cap.id === 'global-default') {
        cap.maxOffAllowed = newVal;
      }
    });
    this.capacities = updatedCapacities;
    this.updateCallback();
  }
}
