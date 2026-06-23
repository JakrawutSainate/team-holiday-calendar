import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/actions/auth', () => ({ runGraphQLAction: vi.fn() }));
vi.mock('@/src/actions/events', () => ({ broadcastCalendarUpdate: vi.fn().mockResolvedValue(undefined) }));

import { calendarDataService } from '@/src/libs/calendarData';
import { LeavesController } from '../LeavesController';
import type { CalendarEvent } from '@/src/libs/calendarData';

const mockMember = {
  id: 'u1', name: 'Alice', email: 'a@test.com',
  role: 'MEMBER' as const, department: 'Engineering' as const,
  title: 'Dev', tokensBalance: 3,
};

const mockLeave: CalendarEvent = {
  id: 'ev1', userId: 'u1', userName: 'Alice',
  date: '2026-06-10', status: 'COMPENSATORY_OFF',
};

let controller: LeavesController;

// Current month = June 2026 (test date), prev = May 2026
// Mock: current month returns real data; prev month returns empty
const mockEventsByMonth = (year: number, month: number): CalendarEvent[] =>
  year === 2026 && month === 6 ? [mockLeave] : [];

beforeEach(() => {
  controller = new LeavesController(() => {}, 'u1');
  vi.clearAllMocks();
  vi.spyOn(calendarDataService, 'getTeamMembers').mockResolvedValue([mockMember]);
  vi.spyOn(calendarDataService, 'getCalendarEvents').mockImplementation(
    (year, month) => Promise.resolve(mockEventsByMonth(year, month))
  );
  vi.spyOn(calendarDataService, 'cancelLeave').mockResolvedValue({});
});

describe('LeavesController — parallel loading', () => {
  it('loadState fires members and two month fetches concurrently', async () => {
    let concurrentCalls = 0;
    let maxConcurrent = 0;

    const trackConcurrency = async <T>(fn: () => Promise<T>): Promise<T> => {
      concurrentCalls++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
      const result = await fn();
      concurrentCalls--;
      return result;
    };

    vi.spyOn(calendarDataService, 'getTeamMembers').mockImplementation(() =>
      trackConcurrency(() => Promise.resolve([mockMember]))
    );
    vi.spyOn(calendarDataService, 'getCalendarEvents').mockImplementation((y, m) =>
      trackConcurrency(() => Promise.resolve(mockEventsByMonth(y, m)))
    );

    await controller.loadState('u1');

    // All 3 calls (members + 2 months) must be in-flight simultaneously
    expect(maxConcurrent).toBe(3);
  });

  it('filters leaves to the current user only', async () => {
    const otherLeave: CalendarEvent = {
      id: 'ev2', userId: 'u2', userName: 'Bob', date: '2026-06-11', status: 'COMPENSATORY_OFF',
    };
    vi.spyOn(calendarDataService, 'getCalendarEvents').mockImplementation((year, month) =>
      Promise.resolve(year === 2026 && month === 6 ? [mockLeave, otherLeave] : [])
    );

    await controller.loadState('u1');

    expect(controller.getLeaves().every(l => l.userId === 'u1')).toBe(true);
    expect(controller.getLeaves()).toHaveLength(1);
  });
});

describe('LeavesController — optimistic cancelLeave', () => {
  it('removes leave from list immediately before server responds', async () => {
    await controller.loadState('u1');
    expect(controller.getLeaves()).toHaveLength(1);

    let optimisticSeen = false;
    vi.spyOn(calendarDataService, 'cancelLeave').mockImplementation(async () => {
      optimisticSeen = controller.getLeaves().length === 0; // removed optimistically
      return {};
    });

    await controller.cancelLeave(mockLeave);
    expect(optimisticSeen).toBe(true);
  });

  it('refunds token optimistically before server responds', async () => {
    await controller.loadState('u1');
    const tokensBefore = controller.getTokens();

    vi.spyOn(calendarDataService, 'cancelLeave').mockImplementation(async () => {
      expect(controller.getTokens()).toBe(tokensBefore + 1);
      return {};
    });

    await controller.cancelLeave(mockLeave);
  });

  it('rolls back list and token on server error', async () => {
    await controller.loadState('u1');
    const tokensBefore = controller.getTokens();

    vi.spyOn(calendarDataService, 'cancelLeave').mockRejectedValue(new Error('server error'));

    await expect(controller.cancelLeave(mockLeave)).rejects.toThrow();

    expect(controller.getLeaves()).toHaveLength(1); // restored
    expect(controller.getTokens()).toBe(tokensBefore); // restored
  });
});

describe('LeavesController — loading state', () => {
  it('isLoading is true during fetch and false after', async () => {
    let sawLoading = false;
    controller = new LeavesController(() => {
      if (controller.isLoading()) sawLoading = true;
    }, 'u1');

    await controller.loadState('u1');
    expect(sawLoading).toBe(true);
    expect(controller.isLoading()).toBe(false);
  });
});
