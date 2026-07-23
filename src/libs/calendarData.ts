export type Role = 'ADMIN' | 'MEMBER' | 'LEAD';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  department: 'Engineering' | 'Design' | 'Management';
  title: string;
  tokensBalance: number;
}

export type CalendarEventStatus = 'NORMAL' | 'WEEKEND_WORK' | 'COMPENSATORY_OFF' | 'PUBLIC_HOLIDAY' | 'HOLIDAY_WORK';

export interface LeaveRequest {
  id: string;
  eventId: string;
  reason?: string;
  signatureType: 'DRAW' | 'TEXT';
  signatureText?: string;
  signatureImage?: string; // Base64
  attachmentImage?: string; // Base64
}

export interface UsedTokenInfo {
  id: string;
  earnedDate: string;
  festivalName: string;
  description: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD format
  status: CalendarEventStatus;
  details?: string;
  usedTokenTxId?: string;
  usedTokenInfo?: UsedTokenInfo;
  leaveRequest?: LeaveRequest;
}

export interface CapacitySetting {
  id: string;
  date?: string; // Specific overrides: 'YYYY-MM-DD'
  dayOfWeek?: number; // Day-of-Week Pattern overrides: 0 = Sun, 1 = Mon, ...
  maxOffAllowed: number;
  description?: string;
}

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
  relatedDate?: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: 'EARN' | 'SPEND';
  amount: number;
  description: string;
  relatedDate?: string;
  createdAt: string;
}

export interface BOHoliday {
  date: string;
  nameEn: string;
  nameTh: string;
}

export interface UserTokenQueueItem {
  id: string;
  earnedDate: string;
  description: string;
  festivalName: string;
  queueIndex: number;
  totalAvailable: number;
}

export const botHolidays2026: BOHoliday[] = [
  { date: '2026-01-01', nameEn: "New Year's Day", nameTh: 'วันขึ้นปีใหม่' },
  { date: '2026-01-02', nameEn: 'Additional special holiday', nameTh: 'วันหยุดพิเศษเพิ่มเติม' },
  { date: '2026-03-03', nameEn: 'Makha Bucha Day', nameTh: 'วันมาฆบูชา' },
  { date: '2026-04-06', nameEn: 'Chakri Memorial Day', nameTh: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชและวันที่ระลึกมหาจักรีบรมราชวงศ์' },
  { date: '2026-04-13', nameEn: 'Songkran Festival', nameTh: 'วันสงกรานต์' },
  { date: '2026-04-14', nameEn: 'Songkran Festival', nameTh: 'วันสงกรานต์' },
  { date: '2026-04-15', nameEn: 'Songkran Festival', nameTh: 'วันสงกรานต์' },
  { date: '2026-05-01', nameEn: 'National Labour Day', nameTh: 'วันแรงงานแห่งชาติ' },
  { date: '2026-05-04', nameEn: 'Coronation Day', nameTh: 'วันฉัตรมงคล' },
  { date: '2026-06-01', nameEn: 'Substitution for Visakha Bucha Day', nameTh: 'วันหยุดชดเชยวันวิสาขบูชา' },
  { date: '2026-06-03', nameEn: "H.M. Queen Suthida Bajrasudhabimalalakshana's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี' },
  { date: '2026-07-28', nameEn: "H.M. King Maha Vajiralongkorn's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว' },
  { date: '2026-07-29', nameEn: 'Asarnha Bucha Day', nameTh: 'วันอาสาฬหบูชา' },
  { date: '2026-08-12', nameEn: "H.M. Queen Sirikit The Queen Mother's Birthday / Mother's Day", nameTh: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวงและวันแม่แห่งชาติ' },
  { date: '2026-10-13', nameEn: "H.M. King Bhumibol Adulyadej The Great Memorial Day", nameTh: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร' },
  { date: '2026-10-16', nameEn: 'Additional special holiday (Bangkok only)', nameTh: 'วันหยุดพิเศษเพิ่มเติม (เฉพาะกรุงเทพมหานคร)' },
  { date: '2026-10-23', nameEn: "H.M. King Chulalongkorn the Great Memorial Day", nameTh: 'วันปิยมหาราช' },
  { date: '2026-12-07', nameEn: "Substitution for H.M. King Bhumibol Adulyadej's Birthday, National Day, and Father's Day", nameTh: 'วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร วันชาติ และวันพ่อแห่งชาติ' },
  { date: '2026-12-10', nameEn: 'Constitution Day', nameTh: 'วันรัฐธรรมนูญ' },
  { date: '2026-12-31', nameEn: "New Year's Eve", nameTh: 'วันสิ้นปี' }
];

import { runGraphQLAction } from '@/src/actions/auth';
import { broadcastCalendarUpdate } from '@/src/actions/events';

// Tracks whether we've already dispatched the backend-down event this session
let _backendNotified = false;

async function fetchGraphQL(query: string, variables: Record<string, unknown> = {}) {
  try {
    const json = await runGraphQLAction(query, variables);
    if (json && json.errors && json.errors.length > 0) {
      const msg: string = json.errors[0].message;
      if (msg === 'Failed to communicate with backend services.' && typeof window !== 'undefined' && !_backendNotified) {
        _backendNotified = true;
        window.dispatchEvent(new CustomEvent('backend:unavailable'));
      }
      throw new Error(msg);
    }
    // Backend responded — if we previously notified, dismiss the warning
    if (_backendNotified && typeof window !== 'undefined') {
      _backendNotified = false;
      window.dispatchEvent(new CustomEvent('backend:available'));
    }
    return json?.data;
  } catch (error) {
    console.error('GraphQL Fetch Error:', error);
    return null;
  }
}

// ─── PURE HELPERS ─────────────────────────────────────────────────────────────

/**
 * Resolve the capacity limit for a given date using already-fetched settings.
 * Pass the result of getAllCapacitySettings() to avoid repeated network calls.
 */
export const resolveCapacity = (dateString: string, settings: CapacitySetting[]): CapacitySetting => {
  // BOT holiday → 0 off allowed
  const isHoliday = botHolidays2026.some(h => h.date === dateString);
  if (isHoliday) {
    return { id: `holiday-capacity-${dateString}`, date: dateString, maxOffAllowed: 0, description: 'Bank of Thailand Holiday' };
  }

  const dayOfWeek = new Date(dateString).getDay();

  // Priority 1: specific date override
  const dateOverride = settings.find(s => s.date === dateString);
  if (dateOverride) return dateOverride;

  // Priority 2: day-of-week override
  const dowOverride = settings.find(s => s.dayOfWeek === dayOfWeek);
  if (dowOverride) return dowOverride;

  // Priority 3: global default
  return settings.find(s => s.id === 'global-default') ?? { id: 'global-default', maxOffAllowed: 2 };
};

// ─── DATA SERVICE ─────────────────────────────────────────────────────────────
// Singleton with:
//   • TTL cache  — skips the network if data is fresh (30 s window)
//   • Inflight dedup — concurrent callers share one in-flight Promise
//   • All-events fetch — raw DB events fetched once and sliced per month
//   • Auto cache-bust — every mutation calls invalidate before returning

type CacheEntry<T> = { data: T; expiresAt: number };

class CalendarDataService {
  private static instance: CalendarDataService;
  private readonly TTL = 30_000; // 30 seconds

  // TTL caches
  private membersCache: CacheEntry<TeamMember[]> | null = null;
  private capacityCache: CacheEntry<CapacitySetting[]> | null = null;
  private txnCache: CacheEntry<TokenTransaction[]> | null = null;
  private allEventsCache: CacheEntry<CalendarEvent[]> | null = null;
  private holidaysCache: CacheEntry<Array<{ id: string; date: string; nameTh: string; nameEn: string }>> | null = null;

  // In-flight Promises — prevent duplicate concurrent requests
  private membersFlight: Promise<TeamMember[]> | null = null;
  private capacityFlight: Promise<CapacitySetting[]> | null = null;
  private txnFlight: Promise<TokenTransaction[]> | null = null;
  private allEventsFlight: Promise<CalendarEvent[]> | null = null;
  private holidaysFlight: Promise<Array<{ id: string; date: string; nameTh: string; nameEn: string }>> | null = null;
  private initialFlight: Promise<any> | null = null;

  private constructor() {}

  public static getInstance(): CalendarDataService {
    if (!CalendarDataService.instance) {
      CalendarDataService.instance = new CalendarDataService();
    }
    return CalendarDataService.instance;
  }

  private isFresh<T>(e: CacheEntry<T> | null): e is CacheEntry<T> {
    return e !== null && Date.now() < e.expiresAt;
  }

  // ─── Cache invalidation ───────────────────────────────────────────────────

  /** Full cache bust — must be called after any mutation that affects members or events. */
  public invalidateAll(): void {
    this.membersCache = null;
    this.capacityCache = null;
    this.txnCache = null;
    this.allEventsCache = null;
    this.holidaysCache = null;
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('swr_app_data'); } catch {}
    }
  }

  public async getInitialAppData() {
    if (
      this.isFresh(this.membersCache) &&
      this.isFresh(this.allEventsCache) &&
      this.isFresh(this.capacityCache)
    ) {
      return {
        teamMembers: this.membersCache.data,
        events: this.allEventsCache.data,
        capacitySettings: this.capacityCache.data,
      };
    }

    if (this.initialFlight) return this.initialFlight;

    this.initialFlight = fetchGraphQL(`
      query {
        getInitialAppData {
          teamMembers { id name email role avatarUrl department title tokensBalance }
          events { id userId userName date status details usedTokenTxId usedTokenInfo { id earnedDate festivalName description } leaveRequest { id eventId reason signatureType signatureText signatureImage attachmentImage } }
          capacitySettings { id date dayOfWeek maxOffAllowed description }
          holidays { id date nameTh nameEn }
          departments { id name description icon }
        }
      }
    `).then(data => {
      const init = data?.getInitialAppData ?? {
        teamMembers: [],
        events: [],
        capacitySettings: [],
        holidays: [],
        departments: []
      };

      const now = Date.now();
      this.membersCache = { data: init.teamMembers, expiresAt: now + this.TTL };
      this.allEventsCache = { data: init.events, expiresAt: now + this.TTL };
      this.capacityCache = { data: init.capacitySettings, expiresAt: now + this.TTL };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('swr_app_data', JSON.stringify(init));
        } catch {}
      }

      return init;
    }).finally(() => {
      this.initialFlight = null;
    });

    return this.initialFlight;
  }

  public invalidateCapacities(): void {
    this.capacityCache = null;
  }

  public invalidateTransactions(): void {
    this.txnCache = null;
  }

  // ─── Private raw-events fetch (shared across all month views) ────────────

  private async fetchAllRawEvents(): Promise<CalendarEvent[]> {
    if (this.isFresh(this.allEventsCache)) return this.allEventsCache.data;
    if (this.allEventsFlight) return this.allEventsFlight;

    this.allEventsFlight = fetchGraphQL(`
      query { getEvents { id userId userName date status details usedTokenTxId usedTokenInfo { id earnedDate festivalName description } leaveRequest { id eventId reason signatureType signatureText signatureImage attachmentImage } } }
    `).then(data => {
      const result: CalendarEvent[] = data?.getEvents ?? [];
      this.allEventsCache = { data: result, expiresAt: Date.now() + this.TTL };
      return result;
    }).finally(() => { this.allEventsFlight = null; });

    return this.allEventsFlight;
  }

  public async getAllRawEvents(): Promise<CalendarEvent[]> {
    return this.fetchAllRawEvents();
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  public async getTeamMembers(): Promise<TeamMember[]> {
    if (this.isFresh(this.membersCache)) return this.membersCache.data;
    if (this.membersFlight) return this.membersFlight;

    this.membersFlight = fetchGraphQL(`
      query { getTeamMembers { id name email role avatarUrl department title tokensBalance } }
    `).then(data => {
      const result: TeamMember[] = data?.getTeamMembers ?? [];
      this.membersCache = { data: result, expiresAt: Date.now() + this.TTL };
      return result;
    }).finally(() => { this.membersFlight = null; });

    return this.membersFlight;
  }

  public async getHolidays(): Promise<Array<{ id: string; date: string; nameTh: string; nameEn: string }>> {
    if (this.isFresh(this.holidaysCache)) return this.holidaysCache.data;
    if (this.holidaysFlight) return this.holidaysFlight;

    this.holidaysFlight = fetchGraphQL(`
      query { getHolidays { id date nameTh nameEn } }
    `).then(data => {
      const result = data?.getHolidays ?? [];
      this.holidaysCache = { data: result, expiresAt: Date.now() + this.TTL };
      return result;
    }).finally(() => { this.holidaysFlight = null; });

    return this.holidaysFlight;
  }

  /**
   * Returns events for the given month, synthesising public holidays client-side from Master Data.
   * The raw DB fetch is shared across all concurrent callers and cached for TTL seconds.
   */
  public async getCalendarEvents(year: number, month: number): Promise<CalendarEvent[]> {
    const prefix = `${year}-${month.toString().padStart(2, '0')}`;
    const [allRaw, holidays] = await Promise.all([
      this.fetchAllRawEvents(),
      this.getHolidays(),
    ]);

    const dbEvents = allRaw.filter(e => e.date.startsWith(prefix));
    const holidayEvents: CalendarEvent[] = holidays
      .filter(h => h.date.startsWith(prefix))
      .map((h, i) => ({
        id: `holiday-${h.date}-${i}`,
        userId: 'system-holiday',
        userName: 'Holiday',
        date: h.date,
        status: 'PUBLIC_HOLIDAY' as const,
        details: JSON.stringify({ en: h.nameEn, th: h.nameTh, name: h.nameTh }),
      }));

    return [...dbEvents, ...holidayEvents];
  }

  public async getLeaveDocuments(): Promise<any[]> {
    const result = await fetchGraphQL(`
      query {
        getLeaveDocuments {
          id
          userId
          userName
          department
          title
          leaveDate
          leaveType
          reason
          signature
          status
          writtenAt
          recipientTitle
          fromDate
          toDate
          totalDays
          contactAddress
          contactPhone
          createdAt
        }
      }
    `);
    return result?.getLeaveDocuments ?? [];
  }

  public async getAllCapacitySettings(): Promise<CapacitySetting[]> {
    if (this.isFresh(this.capacityCache)) return this.capacityCache.data;
    if (this.capacityFlight) return this.capacityFlight;

    this.capacityFlight = fetchGraphQL(`
      query { getCapacitySettings { id date dayOfWeek maxOffAllowed description } }
    `).then(data => {
      const result: CapacitySetting[] = data?.getCapacitySettings ?? [];
      this.capacityCache = { data: result, expiresAt: Date.now() + this.TTL };
      return result;
    }).finally(() => { this.capacityFlight = null; });

    return this.capacityFlight;
  }

  public async getTokenTransactions(): Promise<TokenTransaction[]> {
    if (this.isFresh(this.txnCache)) return this.txnCache.data;
    if (this.txnFlight) return this.txnFlight;

    this.txnFlight = fetchGraphQL(`
      query { getTokenTransactions { id userId type amount description relatedDate createdAt } }
    `).then(data => {
      const result: TokenTransaction[] = data?.getTokenTransactions ?? [];
      this.txnCache = { data: result, expiresAt: Date.now() + this.TTL };
      return result;
    }).finally(() => { this.txnFlight = null; });

    return this.txnFlight;
  }

  public async getUserTokenQueue(): Promise<UserTokenQueueItem[]> {
    const data = await fetchGraphQL(`
      query { getUserTokenQueue { id earnedDate description festivalName queueIndex totalAvailable } }
    `);
    return data?.getUserTokenQueue ?? [];
  }

  // ─── Mutations (each busts the relevant cache slices) ─────────────────────

  public async claimShift(date: string, status: string, details: string): Promise<unknown> {
    const result = await fetchGraphQL(`
      mutation claimShift($date: String!, $status: String!, $details: String) {
        claimShift(date: $date, status: $status, details: $details) { id }
      }
    `, { date, status, details });
    this.invalidateAll();
    await broadcastCalendarUpdate();
    return result;
  }

  public async requestLeave(
    date: string,
    reason?: string,
    signatureType?: 'DRAW' | 'TEXT' | 'SAVED',
    signatureText?: string,
    signatureImage?: string,
    attachmentImage?: string
  ): Promise<unknown> {
    const result = await fetchGraphQL(`
      mutation requestLeave(
        $date: String!,
        $reason: String,
        $signatureType: String,
        $signatureText: String,
        $signatureImage: String,
        $attachmentImage: String
      ) {
        requestLeave(
          date: $date,
          reason: $reason,
          signatureType: $signatureType,
          signatureText: $signatureText,
          signatureImage: $signatureImage,
          attachmentImage: $attachmentImage
        ) {
          id
        }
      }
    `, { date, reason, signatureType, signatureText, signatureImage, attachmentImage });
    this.invalidateAll();
    await broadcastCalendarUpdate();
    return result;
  }

  public async cancelLeave(id: string): Promise<unknown> {
    const result = await fetchGraphQL(`
      mutation cancelLeave($id: String!) { cancelLeave(id: $id) }
    `, { id });
    this.invalidateAll();
    await broadcastCalendarUpdate();
    return result;
  }

  public async updateMaxOffAllowed(maxOffAllowed: number): Promise<unknown> {
    const result = await fetchGraphQL(`
      mutation updateMaxOffAllowed($maxOffAllowed: Float!) {
        updateMaxOffAllowed(maxOffAllowed: $maxOffAllowed) { id }
      }
    `, { maxOffAllowed });
    this.invalidateCapacities();
    await broadcastCalendarUpdate();
    return result;
  }

  public async adminAddTokens(userId: string, amount: number, description?: string): Promise<unknown> {
    const result = await fetchGraphQL(`
      mutation adminAddTokens($userId: String!, $amount: Float!, $description: String) {
        adminAddTokens(userId: $userId, amount: $amount, description: $description) { id tokensBalance }
      }
    `, { userId, amount, description });
    this.invalidateAll();
    await broadcastCalendarUpdate();
    return result;
  }

  public async adminBulkClaimTokens(
    userId: string,
    entries: Array<{ date: string; status: string; details?: string }>
  ): Promise<{ claimed: number; skipped: number } | null> {
    const result = await fetchGraphQL(`
      mutation adminBulkClaimTokens($userId: String!, $entries: [BulkClaimEntry!]!) {
        adminBulkClaimTokens(userId: $userId, entries: $entries) { claimed skipped }
      }
    `, { userId, entries });
    this.invalidateAll();
    await broadcastCalendarUpdate();
    return (result as any)?.adminBulkClaimTokens ?? null;
  }
}

// ─── SINGLETON EXPORT ─────────────────────────────────────────────────────────

export const calendarDataService = CalendarDataService.getInstance();

// ─── BACKWARD-COMPATIBLE FUNCTION EXPORTS ────────────────────────────────────
// Existing controllers and pages import these — they now go through the cached
// service automatically with zero change to call sites.

export const getTeamMembers = (): Promise<TeamMember[]> =>
  calendarDataService.getTeamMembers();

export const getCalendarEvents = (year: number, month: number): Promise<CalendarEvent[]> =>
  calendarDataService.getCalendarEvents(year, month);

export const getAllRawEvents = (): Promise<CalendarEvent[]> =>
  calendarDataService.getAllRawEvents();

export const getLeaveDocuments = (): Promise<any[]> =>
  calendarDataService.getLeaveDocuments();

export const getAllCapacitySettings = (): Promise<CapacitySetting[]> =>
  calendarDataService.getAllCapacitySettings();

export const getTokenTransactions = (): Promise<TokenTransaction[]> =>
  calendarDataService.getTokenTransactions();

export const getUserTokenQueue = (): Promise<UserTokenQueueItem[]> =>
  calendarDataService.getUserTokenQueue();

export const getInitialAppData = () =>
  calendarDataService.getInitialAppData();

export const getHolidays = () =>
  calendarDataService.getHolidays();

export function getSWRAppCache() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('swr_app_data');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}



export const getDayCapacitySetting = async (dateString: string): Promise<CapacitySetting> => {
  const settings = await calendarDataService.getAllCapacitySettings();
  return resolveCapacity(dateString, settings);
};

export const claimShiftMutation = (date: string, status: string, details: string): Promise<unknown> =>
  calendarDataService.claimShift(date, status, details);

export const requestLeaveMutation = (
  date: string,
  reason?: string,
  signatureType?: 'DRAW' | 'TEXT' | 'SAVED',
  signatureText?: string,
  signatureImage?: string,
  attachmentImage?: string
): Promise<unknown> =>
  calendarDataService.requestLeave(date, reason, signatureType, signatureText, signatureImage, attachmentImage);

export const cancelLeaveMutation = (id: string): Promise<unknown> =>
  calendarDataService.cancelLeave(id);

export const updateMaxOffAllowedMutation = (maxOffAllowed: number): Promise<unknown> =>
  calendarDataService.updateMaxOffAllowed(maxOffAllowed);

export const adminAddTokensMutation = (userId: string, amount: number, description?: string): Promise<unknown> =>
  calendarDataService.adminAddTokens(userId, amount, description);
