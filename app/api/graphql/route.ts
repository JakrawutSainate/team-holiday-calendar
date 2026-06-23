import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/src/libs/session';
import { resolveGraphQL } from '@/src/libs/db/resolvers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    const body = await req.json();
    const data = await resolveGraphQL(body.query, body.variables ?? {}, session.user?.id);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GraphQL Route Error:', error);
    return NextResponse.json(
      { errors: [{ message: error.message || 'Failed to process request.' }] },
      { status: 200 }
    );
  }
}
