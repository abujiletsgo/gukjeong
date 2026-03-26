// OG 이미지 동적 생성
// TODO: @vercel/og 기반 구현
import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: ImageResponse를 사용한 OG 이미지 생성
  return NextResponse.json({ message: 'OG 이미지 생성 준비 중' });
}
