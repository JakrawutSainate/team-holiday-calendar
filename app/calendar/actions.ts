'use server';

import { CalendarValidator, RequestLeaveInput } from './schema';
import { sanitize } from '@/src/libs/security';

export async function requestLeaveAction(input: RequestLeaveInput) {
  const sanitizedInput: RequestLeaveInput = {
    date: sanitize(input.date),
    userName: sanitize(input.userName),
    type: input.type,
    notes: sanitize(input.notes || '')
  };
  const error = CalendarValidator.validateRequestLeave(sanitizedInput);
  if (error !== '') {
    return { success: false, error };
  }

  console.log('Leave requested on server:', sanitizedInput);
  return { success: true, error: '' };
}

export async function exportCalendarExcel(year: number, month: number) {
  console.log(`Generating Excel export for calendar ${year}-${month}`);
  return { success: true, downloadUrl: `/exports/calendar-${year}-${month}.xlsx`, error: '' };
}
