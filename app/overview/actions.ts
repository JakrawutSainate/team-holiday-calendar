'use server';

import { OverviewValidator, CalendarSyncInput } from './schema';
import { sanitize } from '@/src/libs/security';

export async function toggleCalendarSync(input: CalendarSyncInput) {
  const sanitizedInput: CalendarSyncInput = {
    calendarType: sanitize(input.calendarType) as 'google' | 'slack' | 'outlook',
    enabled: !!input.enabled
  };
  const error = OverviewValidator.validateCalendarSync(sanitizedInput);
  if (error) {
    return { success: false, error };
  }
  
  console.log(`Calendar sync for ${sanitizedInput.calendarType} is now ${sanitizedInput.enabled ? 'enabled' : 'disabled'}`);
  return { success: true };
}

export async function submitQuickRequest(details: { leaveDate: string; reason: string }) {
  const sanitizedDate = sanitize(details.leaveDate);
  const sanitizedReason = sanitize(details.reason || '');

  if (!sanitizedDate) {
    return { success: false, error: 'Leave date is required' };
  }
  console.log('Quick leave request submitted for:', sanitizedDate, 'Reason:', sanitizedReason);
  return { success: true };
}
