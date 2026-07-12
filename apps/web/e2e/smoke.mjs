#!/usr/bin/env node
/**
 * e2e 스모크 매트릭스 — 핵심 플로우 회귀 테스트 (qa-cycle 78행 매트릭스의 상시 실행판).
 *
 *   사전조건: 프로덕션 빌드가 http://localhost:3000 에서 서빙 중 (next start)
 *   실행:     node e2e/smoke.mjs            # apps/web에서
 *             npm run test:e2e              # build + start + smoke 자동
 *
 * 실패 시 exit 1. CI(GitHub Actions)에서 매 push마다 돈다.
 */
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';
const results = [];
let browser;

function ok(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? '  ✓' : '  ✗ FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}

async function page(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  p._errs = [];
  p.on('pageerror', e => p._errs.push(String(e.message)));
  p.on('console', m => { if (m.type() === 'error') p._errs.push(m.text()); });
  return p;
}
const errs = p => p._errs.filter(e => !/favicon|legislators-thumb/.test(e));

(async () => {
  browser = await chromium.launch();

  // ── 1. 핵심 라우트 응답 + 콘솔 클린 ──
  for (const [path, marker] of [
    ['/', '숫자로 보는'],
    ['/audit', '기관'],
    ['/popular', '화제'],
    ['/legislators', '국회의원'],
    ['/bills', '법안'],
    ['/budget', '예산'],
    ['/presidents', '대통령'],
    ['/vendors', '업체'],
    ['/simulator', '시뮬레이터'],
    ['/news', '뉴스'],
    ['/search', '통합 검색'],
    ['/local', '재정'],
  ]) {
    const p = await page();
    await p.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForTimeout(path === '/audit' ? 8000 : 2000);
    const body = (await p.textContent('body')) || '';
    ok(`route ${path}`, body.includes(marker) && errs(p).length === 0,
      errs(p).length ? `console: ${errs(p)[0]?.slice(0, 80)}` : (body.includes(marker) ? '' : `marker '${marker}' missing`));
    await p.context().close();
  }

  // ── 2. 감사: 경량 인덱스 로드 + 딥링크 필터 + 상세 왕복 ──
  {
    const p = await page();
    const t0 = Date.now();
    await p.goto(BASE + '/audit', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.querySelectorAll('a[href^="/audit/af-"]').length > 0, { timeout: 30000 }).catch(() => {});
    ok('audit list settles < 15s', Date.now() - t0 < 15000, `${Date.now() - t0}ms`);
    await p.context().close();
  }
  {
    const p = await page();
    await p.goto(BASE + '/audit?q=' + encodeURIComponent('조달청'), { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(8000);
    const insts = await p.locator('h3').evaluateAll(hs => hs.slice(0, 4).map(h => h.textContent.trim()));
    ok('audit ?q= deep-link filters', insts.length > 0 && insts.every(t => t.includes('조달청')), insts[0]);
    await p.context().close();
  }
  {
    const p = await page();
    await p.goto(BASE + '/audit?sev=high', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.querySelectorAll('a[href^="/audit/af-"]').length > 0, { timeout: 30000 }).catch(() => {});
    const card = p.locator('a[href^="/audit/af-"]').first();
    if (await card.count()) {
      await card.click();
      await p.waitForURL('**/audit/af-**', { timeout: 30000 });
      const h1 = await p.locator('h1').first().textContent().catch(() => '');
      await p.locator('a:has-text("감사 목록")').first().click();
      await p.waitForTimeout(1500);
      ok('audit detail round-trip keeps sev=high', p.url().includes('sev=high'), `h1=${h1?.slice(0, 20)}`);
    } else ok('audit detail round-trip keeps sev=high', false, 'no cards');
    await p.context().close();
  }

  // ── 3. 검색: ?q= 복원 + 결과 ──
  {
    const p = await page();
    await p.goto(BASE + '/search?q=' + encodeURIComponent('조달청'), { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(4000);
    const val = await p.inputValue('input[type="search"]');
    const links = await p.locator('section ul a').count();
    ok('search deep-link restores + results', val === '조달청' && links > 0, `input='${val}' links=${links}`);
    await p.context().close();
  }

  // ── 4. 업체: 목록 → 프로필 → 감사 상세 ──
  {
    const p = await page();
    await p.goto(BASE + '/vendors', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('a[href^="/vendors/v"]', { timeout: 20000 }).catch(() => {});
    const first = p.locator('a[href^="/vendors/v"]').first();
    if (await first.count()) {
      await first.click();
      await p.waitForURL('**/vendors/v**', { timeout: 30000 });
      const flagLink = await p.locator('a[href^="/audit/"]').count();
      ok('vendor profile links to audit flags', flagLink > 0, `flagLinks=${flagLink}`);
    } else ok('vendor profile links to audit flags', false, 'no vendor rows');
    await p.context().close();
  }

  // ── 5. 모바일: 탭바 + 더보기 시트 ──
  {
    const p = await page({ width: 390, height: 844 });
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    const tabs = await p.locator('nav[aria-label="모바일 메뉴"] a').count();
    await p.locator('nav[aria-label="모바일 메뉴"] button:has-text("더보기")').click();
    await p.waitForTimeout(400);
    const sheetLinks = await p.locator('[role="dialog"][aria-label="전체 메뉴"] a').count();
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    const closed = (await p.locator('[role="dialog"][aria-label="전체 메뉴"]').count()) === 0;
    ok('mobile tabbar + more-sheet', tabs === 5 && sheetLinks >= 11 && closed, `tabs=${tabs} sheet=${sheetLinks} escClosed=${closed}`);
    await p.context().close();
  }

  // ── 6. 시스템: 404 + 피드 + OG ──
  {
    const p = await page();
    await p.goto(BASE + '/definitely-not-a-route', { waitUntil: 'domcontentloaded' });
    const body = (await p.textContent('body')) || '';
    ok('korean 404 with exits', body.includes('페이지를 찾을 수 없습니다') && (await p.locator('a[href="/search"]').count()) > 0);
    await p.context().close();
  }
  {
    const res = await fetch(BASE + '/feed.xml');
    const xml = await res.text();
    ok('rss feed', res.ok && xml.includes('<rss') && xml.includes('/audit/'));
  }
  {
    const res = await fetch(BASE + '/og?score=88&title=t&desc=d&pattern=x');
    ok('og finding card renders', res.ok && (res.headers.get('content-type') || '').includes('image'));
  }

  // ── 7. 시뮬레이터 ──
  {
    const p = await page();
    await p.goto(BASE + '/simulator?income=6000', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    const rows = await p.locator('a[href^="/budget/"]').count();
    const restored = await p.inputValue('#income');
    ok('simulator computes + restores income', rows >= 10 && restored === '6000', `rows=${rows} income=${restored}`);
    await p.context().close();
  }

  await browser.close();
  const fails = results.filter(r => !r.pass);
  console.log(`\n${results.length} checks, ${results.length - fails.length} pass, ${fails.length} fail`);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('RUNNER ERROR:', e.message); process.exit(1); });
