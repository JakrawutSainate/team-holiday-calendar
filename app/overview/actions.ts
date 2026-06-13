'use server';

import { OverviewValidator, CalendarSyncInput } from './schema';

export async function toggleCalendarSync(input: CalendarSyncInput) {
  const error = OverviewValidator.validateCalendarSync(input);
  if (error) {
    return { success: false, error };
  }
  
  console.log(`Calendar sync for ${input.calendarType} is now ${input.enabled ? 'enabled' : 'disabled'}`);
  return { success: true };
}

export async function submitQuickRequest(details: { leaveDate: string; reason: string }) {
  if (!details.leaveDate) {
    return { success: false, error: 'Leave date is required' };
  }
  console.log('Quick leave request submitted for:', details.leaveDate);
  return { success: true };
}
