// NextAuth API 라우트
// TODO: NextAuth 완전 구현
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: '인증 API 준비 중' });
}

export async function POST() {
  return NextResponse.json({ message: '인증 API 준비 중' });
}
