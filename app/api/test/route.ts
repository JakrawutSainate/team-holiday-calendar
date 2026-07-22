import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlLength: process.env.DATABASE_URL?.length || 0,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) || 'missing',
    internalApiUrl: process.env.INTERNAL_API_URL || 'missing',
    nodeEnv: process.env.NODE_ENV,
  });
}
