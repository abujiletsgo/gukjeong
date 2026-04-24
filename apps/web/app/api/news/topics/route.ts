import { NextResponse } from 'next/server';
import { getLocalNewsTopics } from '@/lib/local-data';

export const dynamic = 'force-static';

export async function GET() {
  const data = getLocalNewsTopics();
  return NextResponse.json(data);
}
