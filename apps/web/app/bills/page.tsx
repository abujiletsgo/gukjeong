import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import type { Bill } from '@/lib/types';
import BillsPageClient from './BillsPageClient';

export const revalidate = 21600;

export const metadata: Metadata = {
  title: '법안 추적 | 국정투명',
  description: '22대 국회 발의 법안의 현황, AI 요약, 시민 영향 분석을 확인하세요.',
  openGraph: {
    title: '법안 추적 | 국정투명',
    description: '국회 발의 법안을 AI가 요약하고, 시민에게 미치는 영향을 분석합니다.',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
};

const PROC_TO_STATUS: Record<string, '가결' | '계류' | '폐기'> = {
  '원안가결': '가결', '수정가결': '가결',
  '대안반영폐기': '폐기', '수정안반영폐기': '폐기', '폐기': '폐기', '철회': '폐기',
};

const AREA_TO_CATEGORY: Record<string, string> = {
  '복지/보건':  '보건의료',
  '환경/노동':  '환경',
  '농업/수산':  '농업',
  '산업/경제':  '산업',
  '경제/재정':  '금융',
  '정무/금융':  '금융',
  '과학기술':   '기술',
  '국토/교통':  '부동산',
  '법무/사법':  '반부패',
  '안보/정보':  '안전',
  '국방':       '안전',
  '여성/가족':  '복지',
  '교육':       '복지',
  '행정/지방':  '산업',
  '외교/통일':  '안전',
  '문화/체육':  '미디어',
};

function loadBills(): { bills: Bill[]; total: number } {
  const rawPath = path.join(process.cwd(), '..', '..', 'apps/web/data/bills.json');
  const dataPath = path.join(process.cwd(), 'data/bills.json');
  const enrichedPath = path.join(process.cwd(), 'public/data/bills-enriched.json');

  const p = fs.existsSync(dataPath) ? dataPath : fs.existsSync(rawPath) ? rawPath : null;
  if (!p) return { bills: [], total: 0 };

  let rawItems: Array<Record<string, unknown>> = [];
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    rawItems = data.items ?? [];
  } catch { return { bills: [], total: 0 }; }

  // Load enriched metadata (rule-based: law_name, area, status_label, amendment_type)
  const enrichedById: Record<string, Record<string, unknown>> = {};
  if (fs.existsSync(enrichedPath)) {
    try {
      const enriched = JSON.parse(fs.readFileSync(enrichedPath, 'utf-8'));
      for (const b of (enriched.bills ?? [])) {
        enrichedById[String(b.BILL_ID)] = b;
      }
    } catch { /* ignore */ }
  }

  // Sort by date descending, take top 400
  const sorted = [...rawItems].sort((a, b) =>
    String(b.PROPOSE_DT ?? '').localeCompare(String(a.PROPOSE_DT ?? '')),
  );
  const slice = sorted.slice(0, 400);

  const bills: Bill[] = slice.map(raw => {
    const id = String(raw.BILL_ID ?? '');
    const enriched = enrichedById[id] ?? {};
    const result = String(raw.PROC_RESULT ?? '');
    const area = String(enriched.area ?? '기타');

    return {
      id,
      bill_no: String(raw.BILL_NO ?? ''),
      title: String(enriched.law_name || raw.BILL_NAME || ''),
      proposed_date: String(raw.PROPOSE_DT ?? ''),
      proposer_name: String(raw.PUBL_PROPOSER ?? ''),
      committee: String(raw.COMMITTEE ?? ''),
      status: PROC_TO_STATUS[result] ?? '계류',
      status_detail: String(enriched.status_label || result || '심의 중'),
      ai_category: AREA_TO_CATEGORY[area],
      ai_summary: String(enriched.summary ?? ''),
      co_sponsors_count: (String(raw.PUBL_MONA_CD ?? '').split(',').filter(Boolean).length),
    } satisfies Bill;
  });

  return { bills, total: rawItems.length };
}

export default function BillsPage() {
  const { bills, total } = loadBills();
  return <BillsPageClient bills={bills} totalCount={total} />;
}
