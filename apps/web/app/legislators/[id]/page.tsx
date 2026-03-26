import type { Metadata } from 'next';
import { getLegislatorById, getLegislators } from '@/lib/data';
import LegislatorDetailClient from './LegislatorDetailClient';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const legislator = getLegislatorById(id);
  return {
    title: legislator ? `${legislator.name} 의원 성적표` : '국회의원 성적표',
    description: legislator ? `${legislator.name} 의원의 활동 점수, 출석률, 말행일치도 분석` : '국회의원 성적표',
  };
}

export default async function LegislatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const legislator = getLegislatorById(id);
  const allLegislators = getLegislators();

  if (!legislator) {
    return (
      <div className="container-page py-8">
        <Link href="/legislators" className="text-accent hover:underline">&larr; 국회의원 목록</Link>
        <p className="mt-8 text-gray-400">의원 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }
  return <LegislatorDetailClient legislator={legislator} allLegislators={allLegislators} />;
}
