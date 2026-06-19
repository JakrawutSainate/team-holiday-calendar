import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/src/libs/session';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    const token = session.token;

    const backendUrl = process.env.INTERNAL_API_URL || 'http://localhost:8080/api/v1/graphql';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const body = await req.json();

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('BFF GraphQL Proxy Error:', error);
    return NextResponse.json(
      { errors: [{ message: 'Failed to communicate with the backend services.' }] },
      { status: 500 }
    );
  }
}
