export interface CalendarSyncInput {
  calendarType: 'google' | 'slack' | 'outlook';
  enabled: boolean;
}

export class OverviewValidator {
  public static validateCalendarSync(input: CalendarSyncInput): string | undefined {
    if (!input.calendarType) {
      return 'Calendar type is required';
    }
    return undefined;
  }
}
