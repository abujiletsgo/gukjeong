import type { Metadata } from 'next';
import { getBillById } from '@/lib/data';
import BillDetailClient from './BillDetailClient';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const bill = getBillById(id);
  return {
    title: bill ? bill.title : '법안 상세',
    description: bill?.ai_summary || '법안 상세 정보',
  };
}

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bill = getBillById(id);

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
