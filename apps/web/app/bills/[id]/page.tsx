import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBillById, getBills } from '@/lib/data';
import { getBillByIdFromDB, getBillsFromDB } from '@/lib/db/queries';
import { getBillFromJSON } from '@/lib/bills-json';
import BillDetailClient from './BillDetailClient';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillByIdFromDB(id) ?? getBillById(id) ?? getBillFromJSON(id);
  return {
    title: bill ? bill.title : '법안 상세',
    description: bill?.ai_summary || '법안 상세 정보',
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const { bills: dbBills } = await getBillsFromDB({ pageSize: 200 });
  const bills = dbBills.length > 0 ? dbBills : getBills();
  return bills.slice(0, 200).map(b => ({ id: b.id }));
}

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // DB → 시드 → 원본 JSON 순 폴백: DB가 없거나 실패해도 16,914건 상세가 항상 열린다
  const bill = await getBillByIdFromDB(id) ?? getBillById(id) ?? getBillFromJSON(id);

  if (!bill) {
    return (
      <div className="container-page py-8">
        <Link href="/bills" className="text-accent hover:underline">&larr; 법안 목록</Link>
        <p className="mt-8 text-gray-400">법안을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return <BillDetailClient bill={bill} />;
}
