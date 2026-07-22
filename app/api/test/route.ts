import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/libs/db/prisma';

export async function GET() {
  try {
    const prisma = getPrisma();
    const count = await prisma.teamMember.count();
    const leaveCount = await prisma.leaveDocument.count();
    return NextResponse.json({
      ok: true,
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) || 'missing',
      teamMemberCount: count,
      leaveDocumentCount: leaveCount,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      hasDbUrl: !!process.env.DATABASE_URL,
      error: err.message,
    }, { status: 500 });
  }
}
