import type { Metadata } from 'next';
import { getSectorDetail, getAllSectorDetails } from '@/lib/data';
import SectorPageClient from './SectorPageClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return getAllSectorDetails().map(s => ({ sector: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ sector: string }> }): Promise<Metadata> {
  const { sector } = await params;
  const detail = getSectorDetail(sector);
  return {
    title: detail ? `${detail.name} 예산 상세` : '예산 상세',
    description: detail?.description,
  };
}

export default async function SectorPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  const detail = getSectorDetail(sector);
  if (!detail) notFound();
  return <SectorPageClient sector={detail} />;
}
