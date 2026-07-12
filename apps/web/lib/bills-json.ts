// bills.json + bills-enriched.json에서 단일 법안을 찾는 서버 전용 폴백.
// DB(getBillByIdFromDB)와 시드(getBillById) 모두 실패했을 때 상세 페이지가
// "찾을 수 없습니다"로 떨어지지 않게 한다 (의원 상세의 raw fallback과 같은 원리).
import fs from 'fs';
import path from 'path';
import type { Bill } from './types';

const PROC_TO_STATUS: Record<string, Bill['status']> = {
  '원안가결': '가결', '수정가결': '가결', '대안반영폐기': '폐기',
  '폐기': '폐기', '철회': '폐기', '부결': '부결',
};

const AREA_TO_CATEGORY: Record<string, Bill['ai_category']> = {
  '노동/고용': '노동', '주거/부동산': '주거', '교육': '교육', '복지/보건': '복지',
  '경제/금융': '경제', '환경/에너지': '환경', '안전/국방': '안전', '디지털/과학': '미디어',
  '정치/행정': '기타', '사법/인권': '기타', '농림/해양': '기타', '기타': '기타',
  '외교/통일': '안전', '문화/체육': '미디어',
};

let _byId: Map<string, Bill> | null = null;

function buildIndex(): Map<string, Bill> {
  const byId = new Map<string, Bill>();
  const rawPath = path.join(process.cwd(), '..', '..', 'apps/web/data/bills.json');
  const dataPath = path.join(process.cwd(), 'data/bills.json');
  const enrichedPath = path.join(process.cwd(), 'public/data/bills-enriched.json');
  const p = fs.existsSync(dataPath) ? dataPath : fs.existsSync(rawPath) ? rawPath : null;
  if (!p) return byId;

  let rawItems: Array<Record<string, unknown>> = [];
  try {
    rawItems = JSON.parse(fs.readFileSync(p, 'utf-8')).items ?? [];
  } catch { return byId; }

  const enrichedById: Record<string, Record<string, unknown>> = {};
  if (fs.existsSync(enrichedPath)) {
    try {
      for (const b of (JSON.parse(fs.readFileSync(enrichedPath, 'utf-8')).bills ?? [])) {
        enrichedById[String(b.BILL_ID)] = b;
      }
    } catch { /* enriched 없이도 동작 */ }
  }

  for (const raw of rawItems) {
    const id = String(raw.BILL_ID ?? '');
    if (!id) continue;
    const enriched = enrichedById[id] ?? {};
    const result = String(raw.PROC_RESULT ?? '');
    const area = String(enriched.area ?? '기타');
    byId.set(id, {
      id,
      bill_no: String(raw.BILL_NO ?? ''),
      title: String(enriched.law_name || raw.BILL_NAME || ''),
      proposed_date: String(raw.PROPOSE_DT ?? ''),
      proposer_name: String(raw.PUBL_PROPOSER ?? raw.PROPOSER ?? ''),
      committee: String(raw.COMMITTEE ?? ''),
      status: PROC_TO_STATUS[result] ?? '계류',
      status_detail: String(enriched.status_label || result || '심의 중'),
      ai_category: AREA_TO_CATEGORY[area],
      ai_summary: String(enriched.summary ?? ''),
      co_sponsors_count: Number(enriched.co_sponsor_count ?? 0) ||
        String(raw.PUBL_MONA_CD ?? '').split(',').filter(Boolean).length,
    } satisfies Bill);
  }
  return byId;
}

/** BILL_ID로 법안 1건 조회 (첫 호출에서 전체 인덱스 구축 후 프로세스 수명 동안 캐시) */
export function getBillFromJSON(id: string): Bill | undefined {
  if (!_byId) _byId = buildIndex();
  return _byId.get(id);
}
