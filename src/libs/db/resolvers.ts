import { createHash } from 'crypto';
import { prisma } from './prisma';

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.teamMember.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || user.passwordHash !== hashPassword(password)) {
    throw new Error('invalid email or password');
  }
  return user;
}

export async function resolveGraphQL(
  query: string,
  variables: Record<string, unknown>,
  userId?: string | null
): Promise<Record<string, unknown>> {
  const q = query.trim();

  const requireAuth = async () => {
    if (!userId) throw new Error('unauthorized: you must be logged in to perform this action');
    const user = await prisma.teamMember.findUnique({ where: { id: userId } });
    if (!user) throw new Error('unauthorized: user not found');
    return user;
  };

  // ─── PUBLIC QUERIES ────────────────────────────────────────────────────────

  if (q.includes('getTeamMembers')) {
    const members = await prisma.teamMember.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        avatarUrl: true, department: true, title: true, tokensBalance: true,
      },
    });
    return { getTeamMembers: members };
  }

  if (q.includes('getEvents')) {
    const events = await prisma.calendarEvent.findMany({
      select: { id: true, userId: true, userName: true, date: true, status: true, details: true },
    });
    return { getEvents: events };
  }

  if (q.includes('getCapacitySettings')) {
    const settings = await prisma.capacitySetting.findMany({
      select: { id: true, date: true, dayOfWeek: true, maxOffAllowed: true, description: true },
    });
    return { getCapacitySettings: settings };
  }

  // ─── AUTHENTICATED QUERIES ─────────────────────────────────────────────────

  if (q.includes('getTokenTransactions')) {
    const authUser = await requireAuth();
    const txns = await prisma.tokenTransaction.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userId: true, type: true, amount: true, description: true, relatedDate: true, createdAt: true },
    });
    return { getTokenTransactions: txns };
  }

  // ─── MUTATIONS ─────────────────────────────────────────────────────────────

  if (q.includes('claimShift')) {
    const authUser = await requireAuth();
    const date = variables.date as string;
    const status = variables.status as string;
    const details = (variables.details as string) ?? '';

    if (!date || !status) throw new Error('missing variables: date or status');
    if (status !== 'WEEKEND_WORK' && status !== 'HOLIDAY_WORK') {
      throw new Error('claimShift only supports WEEKEND_WORK or HOLIDAY_WORK');
    }

    const event = await prisma.calendarEvent.create({
      data: { userId: authUser.id, userName: authUser.name, date, status, details },
    });

    await prisma.teamMember.update({
      where: { id: authUser.id },
      data: { tokensBalance: { increment: 1.0 } },
    });

    const label = status === 'HOLIDAY_WORK' ? 'Holiday Coverage' : 'Weekend Coverage';
    await prisma.tokenTransaction.create({
      data: { userId: authUser.id, type: 'EARN', amount: 1.0, description: label, relatedDate: date },
    });

    return { claimShift: event };
  }

  if (q.includes('requestLeave')) {
    const authUser = await requireAuth();
    const date = variables.date as string;
    if (!date) throw new Error('missing variables: date');

    const freshUser = await prisma.teamMember.findUnique({ where: { id: authUser.id } });
    if (!freshUser) throw new Error('user not found');
    if (freshUser.tokensBalance < 1.0) {
      throw new Error('insufficient tokens: you need at least 1.0 tokens to request leave on this day');
    }

    const event = await prisma.calendarEvent.create({
      data: { userId: authUser.id, userName: authUser.name, date, status: 'COMPENSATORY_OFF' },
    });

    await prisma.teamMember.update({
      where: { id: authUser.id },
      data: { tokensBalance: { decrement: 1.0 } },
    });

    await prisma.tokenTransaction.create({
      data: { userId: authUser.id, type: 'SPEND', amount: 1.0, description: 'Compensatory Leave Request', relatedDate: date },
    });

    return { requestLeave: event };
  }

  if (q.includes('cancelLeave')) {
    const authUser = await requireAuth();
    const id = variables.id as string;
    if (!id) throw new Error('missing variables: id');

    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) throw new Error('event not found');

    if (authUser.role !== 'ADMIN' && event.userId !== authUser.id) {
      throw new Error("forbidden: you cannot cancel another member's leave");
    }

    await prisma.calendarEvent.delete({ where: { id } });

    const isLeave = event.status === 'COMPENSATORY_OFF' || event.status === 'NORMAL';
    if (isLeave) {
      await prisma.teamMember.update({
        where: { id: event.userId },
        data: { tokensBalance: { increment: 1.0 } },
      });
      await prisma.tokenTransaction.create({
        data: {
          userId: event.userId,
          type: 'EARN',
          amount: 1.0,
          description: 'Leave Cancellation Refund',
          relatedDate: event.date,
        },
      });
    }

    return { cancelLeave: true };
  }

  if (q.includes('redeemTokens')) {
    const authUser = await requireAuth();
    const amount = variables.amount as number;
    const description = (variables.description as string) || 'Token Rollover/Payout Request';
    if (amount == null) throw new Error('missing variables: amount');

    const freshUser = await prisma.teamMember.findUnique({ where: { id: authUser.id } });
    if (!freshUser) throw new Error('user not found');
    if (freshUser.tokensBalance < amount) {
      throw new Error(`insufficient tokens: you need at least ${amount.toFixed(1)} tokens to redeem`);
    }

    await prisma.teamMember.update({
      where: { id: authUser.id },
      data: { tokensBalance: { decrement: amount } },
    });

    const txn = await prisma.tokenTransaction.create({
      data: { userId: authUser.id, type: 'SPEND', amount, description },
    });

    return { redeemTokens: txn };
  }

  if (q.includes('updateMaxOffAllowed')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') {
      throw new Error('forbidden: only administrators can modify capacity settings');
    }

    const maxOff = variables.maxOffAllowed as number;
    if (maxOff == null) throw new Error('missing variables: maxOffAllowed');

    const setting = await prisma.capacitySetting.upsert({
      where: { id: 'global-default' },
      update: { maxOffAllowed: Math.round(maxOff) },
      create: { id: 'global-default', maxOffAllowed: Math.round(maxOff), description: 'Global default limit' },
    });

    return { updateMaxOffAllowed: setting };
  }

  if (q.includes('adminAddTokens')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') {
      throw new Error('forbidden: only administrators can add tokens to users');
    }

    const targetUserId = variables.userId as string;
    const amount = variables.amount as number;
    const description = (variables.description as string) || 'Admin manual token credit';

    if (!targetUserId || amount == null) throw new Error('missing variables: userId or amount');

    const targetUser = await prisma.teamMember.update({
      where: { id: targetUserId },
      data: { tokensBalance: { increment: amount } },
    });

    await prisma.tokenTransaction.create({
      data: { userId: targetUserId, type: 'EARN', amount, description },
    });

    return { adminAddTokens: targetUser };
  }

  throw new Error('unsupported GraphQL operation');
}
