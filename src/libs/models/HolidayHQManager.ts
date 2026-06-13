import {
  TeamMember,
  CalendarEvent,
  CapacitySetting,
  mockTeamMembers,
  mockCalendarEvents,
  mockCapacitySettings,
  botHolidays2026
} from '../calendarData';

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  priority?: string;
  meta?: string;
}

export interface Transaction {
  date: string;
  type: 'EARN' | 'SPEND';
  description: string;
  status: string;
  amount: string;
}

export class HolidayHQManager {
  private members: TeamMember[];
  private events: CalendarEvent[];
  private capacitySettings: CapacitySetting[];

  constructor() {
    this.members = [...mockTeamMembers];
    this.events = [...mockCalendarEvents];
    this.capacitySettings = [...mockCapacitySettings];
  }

  public getTeamMembers(searchTerm?: string): TeamMember[] {
    if (!searchTerm) return this.members;
    const term = searchTerm.toLowerCase();
    return this.members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.title.toLowerCase().includes(term) ||
        m.department.toLowerCase().includes(term)
    );
  }

  public getEventsForMonth(year: number, month: number): CalendarEvent[] {
    const prefix = `${year}-${month.toString().padStart(2, '0')}`;
    const filtered = this.events.filter((e) => e.date.startsWith(prefix));

    // Inject Bank of Thailand holidays
    const monthHolidays = botHolidays2026.filter((h) => h.date.startsWith(prefix));
    const holidayEvents: CalendarEvent[] = monthHolidays.map((h, i) => ({
      id: `holiday-${h.date}-${i}`,
      userId: 'system-holiday',
      userName: 'Holiday',
      date: h.date,
      status: 'PUBLIC_HOLIDAY',
      details: JSON.stringify({ en: h.nameEn, th: h.nameTh })
    }));

    return [...filtered, ...holidayEvents];
  }

  public getDayCapacity(dateString: string): CapacitySetting {
    // 0. Check if it's a Bank of Thailand holiday
    const isHoliday = botHolidays2026.some((h) => h.date === dateString);
    if (isHoliday) {
      return {
        id: `holiday-capacity-${dateString}`,
        date: dateString,
        maxOffAllowed: 0,
        description: 'Bank of Thailand Holiday'
      };
    }

    const dateObj = new Date(dateString);
    const dayOfWeek = dateObj.getDay();

    // 1. Specific Date override
    const dateOverride = this.capacitySettings.find((s) => s.date === dateString);
    if (dateOverride) return dateOverride;

    // 2. Day of Week Pattern override
    const dowOverride = this.capacitySettings.find((s) => s.dayOfWeek === dayOfWeek);
    if (dowOverride) return dowOverride;

    // 3. Global default
    return this.capacitySettings.find((s) => s.id === 'global-default') || {
      id: 'fallback-default',
      maxOffAllowed: 2
    };
  }

  public getAvailabilityStats(): { presentCount: number; availabilityPercent: number } {
    const totalMembers = this.members.length;
    const presentCount = Math.max(totalMembers - 1, 0); // Mock business logic
    const availabilityPercent = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 100;
    return { presentCount, availabilityPercent };
  }

  public getRecentActivities(): Activity[] {
    return [
      {
        id: 'act-1',
        type: 'check_circle',
        title: 'Holiday Approved',
        description: 'Marco Rossi · Christmas Break · Dec 20 - Jan 02',
        time: '2 hours ago',
        meta: 'Manager: Takahashi S.'
      },
      {
        id: 'act-2',
        type: 'add_circle',
        title: 'New Request',
        description: 'Lina Park · Sick Leave · Today',
        time: '5 hours ago',
        priority: 'High'
      },
      {
        id: 'act-3',
        type: 'sync',
        title: 'Token Reset',
        description: 'Team Engineering · Annual rollover adjustment complete',
        time: 'Yesterday',
        meta: 'System'
      }
    ];
  }

  public getBurnoutRiskIndex(): number[] {
    return [40, 55, 35, 65, 25, 30, 20];
  }

  public getTransactions(): Transaction[] {
    return [
      {
        date: 'Oct 24, 2026',
        type: 'EARN',
        description: 'Weekend Coverage (Sat-Sun)',
        status: 'Approved',
        amount: '+1',
      },
      {
        date: 'Oct 12, 2026',
        type: 'SPEND',
        description: 'Friday Long Weekend Request',
        status: 'Approved',
        amount: '-3',
      },
      {
        date: 'Oct 01, 2026',
        type: 'EARN',
        description: 'Weekend Coverage (Sun)',
        status: 'Approved',
        amount: '+1',
      },
      {
        date: 'Sep 28, 2026',
        type: 'EARN',
        description: 'Overtime Bonus',
        status: 'Pending',
        amount: '+1',
      },
    ];
  }
}
