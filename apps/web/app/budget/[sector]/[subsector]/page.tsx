import type { Metadata } from 'next';
import { getSectorDetail, getAllSectorDetails } from '@/lib/data';
import SubSectorPageClient from './SubSectorPageClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const params: { sector: string; subsector: string }[] = [];
  for (const s of getAllSectorDetails()) {
    for (const sub of s.sub_items) {
      params.push({ sector: s.id, subsector: sub.id });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ sector: string; subsector: string }> }): Promise<Metadata> {
  const { sector, subsector } = await params;
  const sectorDetail = getSectorDetail(sector);
  if (!sectorDetail) return { title: '예산 상세' };
  const subDetail = sectorDetail.sub_items.find(s => s.id === subsector);
  return {
    title: subDetail ? `${subDetail.name} — ${sectorDetail.name} 예산 상세` : '예산 상세',
    description: subDetail?.description,
  };
}

export default async function SubSectorPage({ params }: { params: Promise<{ sector: string; subsector: string }> }) {
  const { sector, subsector } = await params;
  const sectorDetail = getSectorDetail(sector);
  if (!sectorDetail) notFound();
  const subDetail = sectorDetail.sub_items.find(s => s.id === subsector);
  if (!subDetail) notFound();
  return <SubSectorPageClient sector={sectorDetail} subSector={subDetail} />;
}
