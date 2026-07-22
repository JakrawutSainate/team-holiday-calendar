import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/actions/auth', () => ({ runGraphQLAction: vi.fn() }));
vi.mock('@/src/actions/events', () => ({ broadcastCalendarUpdate: vi.fn().mockResolvedValue(undefined) }));

import { calendarDataService } from '@/src/libs/calendarData';
import { CalendarController } from '../CalendarController';

let claimSpy: any;
let leaveSpy: any;
let controller: CalendarController;
let tickCount: number;

beforeEach(() => {
  tickCount = 0;
  controller = new CalendarController(2026, 6, 'u1', () => { tickCount++; }, 'Alice');
  vi.restoreAllMocks();
  vi.spyOn(calendarDataService, 'getTeamMembers').mockResolvedValue([
    { id: 'u1', name: 'Alice', email: 'a@test.com', role: 'MEMBER', department: 'Engineering', title: 'Dev', tokensBalance: 5 },
  ]);
  vi.spyOn(calendarDataService, 'getInitialAppData').mockResolvedValue({
    teamMembers: [{ id: 'u1', name: 'Alice', email: 'a@test.com', role: 'MEMBER', department: 'Engineering', title: 'Dev', tokensBalance: 5 }],
    events: [],
    capacitySettings: [],
  });
  vi.spyOn(calendarDataService, 'getLeaveDocuments').mockResolvedValue([]);
  vi.spyOn(calendarDataService, 'getCalendarEvents').mockResolvedValue([]);
  vi.spyOn(calendarDataService, 'getAllCapacitySettings').mockResolvedValue([]);
  claimSpy = vi.spyOn(calendarDataService, 'claimShift');
  leaveSpy = vi.spyOn(calendarDataService, 'requestLeave');
});

describe('CalendarController — loading state', () => {
  it('sets isLoading=true during loadState and false after', async () => {
    let sawLoading = false;
    controller = new CalendarController(2026, 6, 'u1', () => {
      if (controller.isLoading()) sawLoading = true;
    }, 'Alice');

    await controller.loadState();
    expect(sawLoading).toBe(true);
    expect(controller.isLoading()).toBe(false);
  });
});

describe('CalendarController — optimistic claimShift', () => {
  it('adds optimistic event and increments token before server responds', async () => {
    await controller.loadState(); // seed tokens = 5

    let optimisticSeen = false;
    claimSpy.mockImplementation(async () => {
      // Check UI state while mutation is in-flight
      optimisticSeen =
        controller.getEvents().some(e => e.status === 'WEEKEND_WORK') &&
        controller.getTokens() === 6; // +1 optimistic
      return {};
    });

    await controller.claimShift('2026-06-13', 'WEEKEND_WORK', 'Weekend Shift');
    expect(optimisticSeen).toBe(true);
  });

  it('rolls back optimistic event and token on server error', async () => {
    await controller.loadState();
    claimSpy.mockRejectedValue(new Error('server error'));

    await expect(controller.claimShift('2026-06-13', 'WEEKEND_WORK', 'Weekend Shift')).rejects.toThrow();

    expect(controller.getEvents().some(e => e.status === 'WEEKEND_WORK')).toBe(false);
    expect(controller.getTokens()).toBe(5); // restored
  });
});

describe('CalendarController — optimistic requestLeave', () => {
  it('adds optimistic leave event and decrements token before server responds', async () => {
    await controller.loadState();

    let optimisticSeen = false;
    leaveSpy.mockImplementation(async () => {
      optimisticSeen =
        controller.getEvents().some(e => e.status === 'COMPENSATORY_OFF') &&
        controller.getTokens() === 4; // -1 optimistic
      return {};
    });

    await controller.requestLeave('2026-06-24');
    expect(optimisticSeen).toBe(true);
  });

  it('rolls back on server error', async () => {
    await controller.loadState();
    leaveSpy.mockRejectedValue(new Error('server error'));

    await expect(controller.requestLeave('2026-06-24')).rejects.toThrow();

    expect(controller.getEvents().some(e => e.status === 'COMPENSATORY_OFF')).toBe(false);
    expect(controller.getTokens()).toBe(5); // restored
  });
});
