import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock server actions before importing calendarData ────────────────────────
vi.mock('@/src/actions/auth', () => ({
  runGraphQLAction: vi.fn(),
}));

vi.mock('@/src/actions/events', () => ({
  broadcastCalendarUpdate: vi.fn().mockResolvedValue(undefined),
}));

// ─── Re-import after mocks are in place ──────────────────────────────────────
import { runGraphQLAction } from '@/src/actions/auth';
import {
  resolveCapacity,
  calendarDataService,
  type CapacitySetting,
} from '../calendarData';

const mockRun = runGraphQLAction as ReturnType<typeof vi.fn>;

// Reset singleton cache between tests so they don't bleed state
beforeEach(() => {
  calendarDataService.invalidateAll();
  mockRun.mockReset();
});

// ─── resolveCapacity (pure function) ─────────────────────────────────────────

describe('resolveCapacity', () => {
  const settings: CapacitySetting[] = [
    { id: 'date-override', date: '2026-06-25', maxOffAllowed: 3 },
    { id: 'dow-override', dayOfWeek: 1, maxOffAllowed: 1 }, // Monday
    { id: 'global-default', maxOffAllowed: 2 },
  ];

  it('returns 0 for a public holiday', () => {
    const result = resolveCapacity('2026-01-01', settings);
    expect(result.maxOffAllowed).toBe(0);
  });

  it('prefers date override over day-of-week override', () => {
    // 2026-06-25 is a Thursday, but has a date-specific override
    const result = resolveCapacity('2026-06-25', settings);
    expect(result.maxOffAllowed).toBe(3);
  });

  it('falls back to day-of-week override (Monday)', () => {
    // 2026-06-22 is a Monday — no date override
    const result = resolveCapacity('2026-06-22', settings);
    expect(result.maxOffAllowed).toBe(1);
  });

  it('falls back to global default for a weekday with no overrides', () => {
    const result = resolveCapacity('2026-06-23', settings); // Tuesday
    expect(result.maxOffAllowed).toBe(2);
  });
});

// ─── CalendarDataService — TTL cache ─────────────────────────────────────────

describe('CalendarDataService — TTL cache', () => {
  it('returns cached members on second call without hitting the network', async () => {
    mockRun.mockResolvedValueOnce({
      data: { getTeamMembers: [{ id: 'u1', name: 'Alice', tokensBalance: 5 }] },
    });

    const first = await calendarDataService.getTeamMembers();
    const second = await calendarDataService.getTeamMembers();

    expect(first).toEqual(second);
    expect(mockRun).toHaveBeenCalledTimes(1); // only one network call
  });

  it('fetches fresh members after invalidateAll()', async () => {
    mockRun
      .mockResolvedValueOnce({ data: { getTeamMembers: [{ id: 'u1', name: 'Alice', tokensBalance: 5 }] } })
      .mockResolvedValueOnce({ data: { getTeamMembers: [{ id: 'u1', name: 'Alice', tokensBalance: 6 }] } });

    await calendarDataService.getTeamMembers();
    calendarDataService.invalidateAll();
    const fresh = await calendarDataService.getTeamMembers();

    expect(fresh[0].tokensBalance).toBe(6);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });
});

// ─── CalendarDataService — inflight deduplication ────────────────────────────

describe('CalendarDataService — inflight deduplication', () => {
  it('concurrent getTeamMembers calls share one in-flight Promise', async () => {
    mockRun.mockResolvedValue({
      data: { getTeamMembers: [{ id: 'u1', name: 'Alice', tokensBalance: 5 }] },
    });

    // Fire two calls simultaneously (cache is empty)
    const [a, b] = await Promise.all([
      calendarDataService.getTeamMembers(),
      calendarDataService.getTeamMembers(),
    ]);

    expect(a).toEqual(b);
    expect(mockRun).toHaveBeenCalledTimes(1); // deduplicated to one request
  });

  it('concurrent getCalendarEvents for the same month share one raw-events fetch', async () => {
    mockRun.mockImplementation(async (query: string) => {
      if (query.includes('getHolidays')) return { data: { getHolidays: [] } };
      return {
        data: {
          getEvents: [
            { id: 'e1', userId: 'u1', userName: 'Alice', date: '2026-06-10', status: 'NORMAL', details: null },
          ],
        },
      };
    });

    const [june, juneAgain] = await Promise.all([
      calendarDataService.getCalendarEvents(2026, 6),
      calendarDataService.getCalendarEvents(2026, 6),
    ]);

    expect(june).toEqual(juneAgain);
    expect(mockRun).toHaveBeenCalledTimes(2); // 1 getEvents + 1 getHolidays
  });

  it('getCalendarEvents for two different months share one raw-events fetch', async () => {
    mockRun.mockImplementation(async (query: string) => {
      if (query.includes('getHolidays')) return { data: { getHolidays: [] } };
      return {
        data: {
          getEvents: [
            { id: 'e1', userId: 'u1', userName: 'Alice', date: '2026-05-20', status: 'NORMAL', details: null },
            { id: 'e2', userId: 'u1', userName: 'Alice', date: '2026-06-10', status: 'NORMAL', details: null },
          ],
        },
      };
    });

    const [may, june] = await Promise.all([
      calendarDataService.getCalendarEvents(2026, 5),
      calendarDataService.getCalendarEvents(2026, 6),
    ]);

    expect(may.some(e => e.date.startsWith('2026-05'))).toBe(true);
    expect(june.some(e => e.date.startsWith('2026-06'))).toBe(true);
    expect(mockRun).toHaveBeenCalledTimes(2); // 1 getEvents + 1 getHolidays
  });
});

// ─── CalendarDataService — mutations bust cache ───────────────────────────────

describe('CalendarDataService — cache bust on mutation', () => {
  it('claimShift invalidates members + events cache', async () => {
    // Prime the cache
    mockRun.mockResolvedValueOnce({ data: { getTeamMembers: [{ id: 'u1', tokensBalance: 3 }] } });
    await calendarDataService.getTeamMembers();

    // Mutation
    mockRun.mockResolvedValueOnce({ data: { claimShift: { id: 'ev1' } } });
    await calendarDataService.claimShift('2026-06-14', 'WEEKEND_WORK', 'Claimed weekend shift');

    // Next read should fetch fresh data
    mockRun.mockResolvedValueOnce({ data: { getTeamMembers: [{ id: 'u1', tokensBalance: 4 }] } });
    const members = await calendarDataService.getTeamMembers();

    expect(members[0].tokensBalance).toBe(4);
  });
});
