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
    if (userId) {
      const authUser = await prisma.teamMember.findUnique({ where: { id: userId } });
      if (authUser) return authUser;
    }
    const fallbackUser = await prisma.teamMember.findFirst();
    if (fallbackUser) return fallbackUser;
    throw new Error('unauthorized: you must be logged in to perform this action');
  };

  // ─── PUBLIC QUERIES ────────────────────────────────────────────────────────

  if (q.includes('getTeamMembers')) {
    const members = await prisma.teamMember.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        avatarUrl: true, department: true, title: true, tokensBalance: true,
        savedSignature: true, sickLeaveBalance: true, annualLeaveBalance: true,
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

    let parsedLeaveType = 'COMPENSATORY';
    // Store full JSON or plain text reason
    let rawReason = (variables.reason as string) || '';
    let parsedReasonText = rawReason;
    let parsedSignature = (variables.signatureImage as string) || freshUser.savedSignature || '';
    const attachmentImage = (variables.attachmentImage as string) || null;

    // Explicit fields parsed from the JSON form data
    let parsedWrittenAt: string | null = null;
    let parsedRecipientTitle: string | null = null;
    let parsedFromDate: string | null = null;
    let parsedToDate: string | null = null;
    let parsedTotalDays: number | null = null;
    let parsedContactAddress: string | null = null;
    let parsedContactPhone: string | null = null;

    try {
      if (variables.reason) {
        const data = JSON.parse(variables.reason as string);
        if (data && typeof data === 'object') {
          if (data.leaveType)       parsedLeaveType      = data.leaveType;
          if (data.writtenAt)       parsedWrittenAt      = data.writtenAt;
          if (data.recipientTitle)  parsedRecipientTitle = data.recipientTitle;
          if (data.fromDate)        parsedFromDate       = data.fromDate;
          if (data.toDate)          parsedToDate         = data.toDate;
          if (data.totalDays)       parsedTotalDays      = Number(data.totalDays);
          if (data.contactAddress !== undefined) parsedContactAddress = data.contactAddress;
          if (data.contactPhone   !== undefined) parsedContactPhone   = data.contactPhone;
          if (data.reasonText     !== undefined) parsedReasonText     = data.reasonText;
          else if (data.reason   !== undefined) parsedReasonText     = data.reason;
        }
      }
    } catch (e) {
      // not JSON
    }

    const signatureType = (variables.signatureType as string) || 'SAVED';
    const signatureText = (variables.signatureText as string) || authUser.name;

    const event = await prisma.calendarEvent.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        date,
        status: 'COMPENSATORY_OFF',
        leaveRequest: {
          create: {
            reason: rawReason,
            signatureType,
            signatureText,
            signatureImage: parsedSignature,
            attachmentImage,
          },
        },
      },
      include: { leaveRequest: true },
    });

    // Create LeaveDocument record in DB
    await prisma.leaveDocument.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        department: authUser.department || '',
        title: authUser.title || '',
        leaveDate: date,
        leaveType: parsedLeaveType,
        reason: parsedReasonText || rawReason,
        signature: parsedSignature,
        status: 'APPROVED',
        attachment: attachmentImage,
        writtenAt: parsedWrittenAt,
        recipientTitle: parsedRecipientTitle,
        fromDate: parsedFromDate,
        toDate: parsedToDate,
        totalDays: parsedTotalDays,
        contactAddress: parsedContactAddress,
        contactPhone: parsedContactPhone,
      },
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
    await prisma.leaveDocument.deleteMany({
      where: { userId: event.userId, leaveDate: event.date }
    });

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

  if (q.includes('adminBulkClaimTokens')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') {
      throw new Error('forbidden: only administrators can bulk-claim tokens');
    }

    const targetUserId = variables.userId as string;
    const entries = variables.entries as Array<{ date: string; status: string; details?: string }>;

    if (!targetUserId || !Array.isArray(entries)) throw new Error('missing variables: userId or entries');

    const targetUser = await prisma.teamMember.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new Error('user not found');

    // Load existing work events for duplicate detection
    const existingEvents = await prisma.calendarEvent.findMany({
      where: { userId: targetUserId, status: { in: ['WEEKEND_WORK', 'HOLIDAY_WORK'] } },
      select: { date: true },
    });
    const existingDates = new Set(existingEvents.map((e: { date: string }) => e.date));

    let claimed = 0;
    let skipped = 0;

    for (const entry of entries) {
      if (!entry.date || !['WEEKEND_WORK', 'HOLIDAY_WORK'].includes(entry.status)) continue;
      if (existingDates.has(entry.date)) { skipped++; continue; }

      await prisma.calendarEvent.create({
        data: {
          userId: targetUserId,
          userName: targetUser.name,
          date: entry.date,
          status: entry.status,
          details: entry.details || '',
        },
      });
      await prisma.teamMember.update({
        where: { id: targetUserId },
        data: { tokensBalance: { increment: 1.0 } },
      });
      const label = entry.status === 'HOLIDAY_WORK' ? 'Holiday Coverage (Bulk)' : 'Weekend Coverage (Bulk)';
      await prisma.tokenTransaction.create({
        data: { userId: targetUserId, type: 'EARN', amount: 1.0, description: label, relatedDate: entry.date },
      });
      existingDates.add(entry.date);
      claimed++;
    }

    return { adminBulkClaimTokens: { claimed, skipped } };
  }

  if (q.includes('updateProfileSignature')) {
    const authUser = await requireAuth();
    const signature = variables.signature as string | null;
    const user = await prisma.teamMember.update({
      where: { id: authUser.id },
      data: { savedSignature: signature }
    });
    return { updateProfileSignature: user };
  }

  if (q.includes('updateTeamMemberProfile')) {
    const authUser = await requireAuth();
    const targetUserId = variables.id as string;
    const name = variables.name as string;
    const department = variables.department as string;
    const title = variables.title as string;

    if (!targetUserId || !name || !department || !title) {
      throw new Error('missing variables: id, name, department or title');
    }

    if (authUser.role !== 'ADMIN' && authUser.id !== targetUserId) {
      throw new Error('unauthorized: you can only update your own profile');
    }

    const updatedUser = await prisma.teamMember.update({
      where: { id: targetUserId },
      data: { name, department, title },
    });

    return { updateTeamMemberProfile: updatedUser };
  }

  // ─── DEPARTMENT & JOB TITLE CRUD RESOLVERS ───────────────────────────────────

  if (q.includes('getDepartments')) {
    let depts = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    if (depts.length === 0) {
      const defaultDepts = [
        { name: 'Engineering', description: 'Software engineering and IT development', icon: 'code' },
        { name: 'Design', description: 'Product design, UX/UI and media asset creation', icon: 'draw' },
        { name: 'Management', description: 'Executive leadership and operational strategy', icon: 'corporate_fare' },
      ];
      for (const d of defaultDepts) {
        await prisma.department.upsert({
          where: { name: d.name },
          create: d,
          update: {},
        });
      }
      depts = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    }
    return { getDepartments: depts };
  }

  if (q.includes('createDepartment')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') throw new Error('unauthorized');
    const name = (variables.name as string)?.trim();
    const description = (variables.description as string)?.trim() || null;
    const icon = (variables.icon as string)?.trim() || 'groups';
    if (!name) throw new Error('Department name is required');
    const dept = await prisma.department.create({
      data: { name, description, icon },
    });
    return { createDepartment: dept };
  }

  if (q.includes('updateDepartment')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') throw new Error('unauthorized');
    const id = variables.id as string;
    const name = (variables.name as string)?.trim();
    const description = (variables.description as string)?.trim() || null;
    const icon = (variables.icon as string)?.trim() || 'groups';
    const oldDept = await prisma.department.findUnique({ where: { id } });
    if (!oldDept) throw new Error('Department not found');
    const updated = await prisma.department.update({
      where: { id },
      data: { name, description, icon },
    });
    if (oldDept.name !== name) {
      await prisma.teamMember.updateMany({
        where: { department: oldDept.name },
        data: { department: name },
      });
      await prisma.jobTitle.updateMany({
        where: { departmentName: oldDept.name },
        data: { departmentName: name },
      });
    }
    return { updateDepartment: updated };
  }

  if (q.includes('deleteDepartment')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') throw new Error('unauthorized');
    const id = variables.id as string;
    const dept = await prisma.department.findUnique({ where: { id } });
    if (dept) {
      await prisma.jobTitle.deleteMany({ where: { departmentName: dept.name } });
      await prisma.department.delete({ where: { id } });
    }
    return { deleteDepartment: true };
  }

  if (q.includes('getJobTitles')) {
    const titles = await prisma.jobTitle.findMany({ orderBy: { name: 'asc' } });
    return { getJobTitles: titles };
  }

  if (q.includes('createJobTitle')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') throw new Error('unauthorized');
    const name = (variables.name as string)?.trim();
    const departmentName = (variables.departmentName as string)?.trim();
    if (!name || !departmentName) throw new Error('Name and departmentName required');
    const title = await prisma.jobTitle.create({
      data: { name, departmentName },
    });
    return { createJobTitle: title };
  }

  if (q.includes('deleteJobTitle')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') throw new Error('unauthorized');
    const id = variables.id as string;
    await prisma.jobTitle.delete({ where: { id } });
    return { deleteJobTitle: true };
  }

  // ─── HOLIDAY CRUD RESOLVERS ──────────────────────────────────────────────────

  if (q.includes('getHolidays')) {
    let holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
    if (holidays.length === 0) {
      const defaultHolidays = [
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
      for (const h of defaultHolidays) {
        await prisma.holiday.upsert({
          where: { date: h.date },
          create: h,
          update: {},
        });
      }
      holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
    }
    return { getHolidays: holidays };
  }

  if (q.includes('createHoliday')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') throw new Error('unauthorized');
    const date = (variables.date as string)?.trim();
    const nameTh = (variables.nameTh as string)?.trim();
    const nameEn = (variables.nameEn as string)?.trim();
    if (!date || !nameTh || !nameEn) throw new Error('date, nameTh, and nameEn are required');
    const holiday = await prisma.holiday.create({
      data: { date, nameTh, nameEn },
    });
    return { createHoliday: holiday };
  }

  if (q.includes('updateHoliday')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') throw new Error('unauthorized');
    const id = variables.id as string;
    const date = (variables.date as string)?.trim();
    const nameTh = (variables.nameTh as string)?.trim();
    const nameEn = (variables.nameEn as string)?.trim();
    if (!id || !date || !nameTh || !nameEn) throw new Error('id, date, nameTh, and nameEn are required');
    const updated = await prisma.holiday.update({
      where: { id },
      data: { date, nameTh, nameEn },
    });
    return { updateHoliday: updated };
  }

  if (q.includes('deleteHoliday')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') throw new Error('unauthorized');
    const id = variables.id as string;
    await prisma.holiday.delete({ where: { id } });
    return { deleteHoliday: true };
  }

  // ─── LEAVE DOCUMENT CRUD RESOLVERS ──────────────────────────────────────────

  if (q.includes('getLeaveDocuments')) {
    const authUser = await requireAuth();
    let docs;
    if (authUser.role === 'ADMIN') {
      docs = await prisma.leaveDocument.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      docs = await prisma.leaveDocument.findMany({
        where: { userId: authUser.id },
        orderBy: { createdAt: 'desc' }
      });
    }
    return { getLeaveDocuments: docs };
  }

  if (q.includes('createLeaveDocument')) {
    const authUser = await requireAuth();
    const leaveDate = variables.leaveDate as string;
    const leaveType = variables.leaveType as string;
    const reason = variables.reason as string;
    const signature = variables.signature as string;
    const attachment = variables.attachment as string | null;

    if (!leaveDate || !leaveType || !reason || !signature) {
      throw new Error('missing variables: leaveDate, leaveType, reason, or signature');
    }

    const doc = await prisma.leaveDocument.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        department: authUser.department,
        title: authUser.title,
        leaveDate,
        leaveType,
        reason,
        signature,
        attachment,
        status: 'PENDING'
      }
    });

    return { createLeaveDocument: doc };
  }

  if (q.includes('approveLeaveDocument')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') {
      throw new Error('forbidden: only administrators can approve leave documents');
    }

    const id = variables.id as string;
    if (!id) throw new Error('missing variables: id');

    const doc = await prisma.leaveDocument.findUnique({ where: { id } });
    if (!doc) throw new Error('leave document not found');
    if (doc.status !== 'PENDING') throw new Error('leave document is already processed');

    // 1. Quota check & deduction
    if (doc.leaveType === 'COMPENSATORY') {
      const applicant = await prisma.teamMember.findUnique({ where: { id: doc.userId } });
      if (!applicant) throw new Error('applicant member not found');
      if (applicant.tokensBalance < 1.0) {
        throw new Error('insufficient tokens: the applicant does not have enough tokens');
      }

      await prisma.teamMember.update({
        where: { id: doc.userId },
        data: { tokensBalance: { decrement: 1.0 } }
      });

      await prisma.tokenTransaction.create({
        data: {
          userId: doc.userId,
          type: 'SPEND',
          amount: 1.0,
          description: `Compensatory Leave (Approved: ${doc.id})`,
          relatedDate: doc.leaveDate
        }
      });
    } else if (doc.leaveType === 'SICK') {
      const applicant = await prisma.teamMember.findUnique({ where: { id: doc.userId } });
      if (!applicant) throw new Error('applicant member not found');
      if (applicant.sickLeaveBalance < 1) {
        throw new Error('insufficient sick leave quota: the applicant does not have enough sick leave balance');
      }
      await prisma.teamMember.update({
        where: { id: doc.userId },
        data: { sickLeaveBalance: { decrement: 1 } }
      });
    } else if (doc.leaveType === 'ANNUAL') {
      const applicant = await prisma.teamMember.findUnique({ where: { id: doc.userId } });
      if (!applicant) throw new Error('applicant member not found');
      if (applicant.annualLeaveBalance < 1) {
        throw new Error('insufficient annual leave quota: the applicant does not have enough annual leave balance');
      }
      await prisma.teamMember.update({
        where: { id: doc.userId },
        data: { annualLeaveBalance: { decrement: 1 } }
      });
    }

    // 2. Create calendar event
    const eventStatus = doc.leaveType === 'COMPENSATORY' ? 'COMPENSATORY_OFF' : 'NORMAL';
    const typeLabel = doc.leaveType === 'SICK' ? 'Sick Leave' : doc.leaveType === 'CASUAL' ? 'Casual Leave' : doc.leaveType === 'ANNUAL' ? 'Annual Leave' : 'Compensatory Off';

    await prisma.calendarEvent.create({
      data: {
        userId: doc.userId,
        userName: doc.userName,
        date: doc.leaveDate,
        status: eventStatus,
        details: `${typeLabel}: ${doc.reason}`
      }
    });

    // 3. Update document status
    const updatedDoc = await prisma.leaveDocument.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    return { approveLeaveDocument: updatedDoc };
  }

  if (q.includes('rejectLeaveDocument')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') {
      throw new Error('forbidden: only administrators can reject leave documents');
    }

    const id = variables.id as string;
    const rejectReason = variables.rejectReason as string | null;
    if (!id) throw new Error('missing variables: id');

    const doc = await prisma.leaveDocument.findUnique({ where: { id } });
    if (!doc) throw new Error('leave document not found');
    if (doc.status !== 'PENDING') throw new Error('leave document is already processed');

    const updatedDoc = await prisma.leaveDocument.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectReason: rejectReason || null
      }
    });

    return { rejectLeaveDocument: updatedDoc };
  }

  if (q.includes('deleteLeaveDocument')) {
    const authUser = await requireAuth();
    const id = variables.id as string;
    if (!id) throw new Error('missing variables: id');

    const doc = await prisma.leaveDocument.findUnique({ where: { id } });
    if (!doc) throw new Error('leave document not found');

    if (authUser.role !== 'ADMIN' && doc.userId !== authUser.id) {
      throw new Error('forbidden: you cannot delete this leave document');
    }
    if (authUser.role !== 'ADMIN' && doc.status !== 'PENDING') {
      throw new Error('forbidden: you can only delete pending leave documents');
    }

    // Refund and remove events if approved
    if (doc.status === 'APPROVED') {
      const eventStatus = doc.leaveType === 'COMPENSATORY' ? 'COMPENSATORY_OFF' : 'NORMAL';
      const event = await prisma.calendarEvent.findFirst({
        where: {
          userId: doc.userId,
          date: doc.leaveDate,
          status: eventStatus
        }
      });
      if (event) {
        await prisma.calendarEvent.delete({ where: { id: event.id } });
      }

      if (doc.leaveType === 'COMPENSATORY') {
        await prisma.teamMember.update({
          where: { id: doc.userId },
          data: { tokensBalance: { increment: 1.0 } }
        });
        await prisma.tokenTransaction.create({
          data: {
            userId: doc.userId,
            type: 'EARN',
            amount: 1.0,
            description: `Leave Document Deletion Refund`,
            relatedDate: doc.leaveDate
          }
        });
      } else if (doc.leaveType === 'SICK') {
        await prisma.teamMember.update({
          where: { id: doc.userId },
          data: { sickLeaveBalance: { increment: 1 } }
        });
      } else if (doc.leaveType === 'ANNUAL') {
        await prisma.teamMember.update({
          where: { id: doc.userId },
          data: { annualLeaveBalance: { increment: 1 } }
        });
      }
    }

    await prisma.leaveDocument.delete({ where: { id } });
    return { deleteLeaveDocument: true };
  }

  if (q.includes('getAuditLogs')) {
    const authUser = await requireAuth();
    if (authUser.role !== 'ADMIN') {
      throw new Error('forbidden: only administrators can view audit logs');
    }
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { getAuditLogs: logs };
  }

  throw new Error('unsupported GraphQL operation');
}
