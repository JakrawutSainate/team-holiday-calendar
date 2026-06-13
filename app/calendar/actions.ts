'use server';

import { CalendarValidator, RequestLeaveInput } from './schema';

export async function requestLeaveAction(input: RequestLeaveInput) {
  const error = CalendarValidator.validateRequestLeave(input);
  if (error) {
    return { success: false, error };
  }

  console.log('Leave requested on server:', input);
  return { success: true };
}

export async function exportCalendarExcel(year: number, month: number) {
  console.log(`Generating Excel export for calendar ${year}-${month}`);
  return { success: true, downloadUrl: `/exports/calendar-${year}-${month}.xlsx` };
}
