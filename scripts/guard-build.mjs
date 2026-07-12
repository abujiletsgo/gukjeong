#!/usr/bin/env node
/**
 * 빌드 가드 — `next dev`가 돌고 있는 동안 `next build`를 막는다.
 * 둘은 같은 .next 디렉터리를 쓰므로 동시 실행 시 dev 서버의 정적 청크가 전부 404가 되고
 * (hydration 사망), 프로덕션 산출물도 오염된다. (2026-07-12 QA 라운드 1 전멸 사고의 원인)
 * 우회가 꼭 필요하면: SKIP_BUILD_GUARD=1 npm run build
 */
import { execSync } from 'child_process';

if (process.env.SKIP_BUILD_GUARD === '1' || process.env.VERCEL === '1' || process.env.CI === 'true') {
  process.exit(0);
}

try {
  const out = execSync("pgrep -fl 'next dev' || true", { encoding: 'utf-8' }).trim();
  if (out) {
    console.error('\n[guard-build] `next dev` 프로세스가 실행 중입니다:');
    console.error(out.split('\n').map(l => '  ' + l).join('\n'));
    console.error('\ndev 서버와 build는 같은 .next를 공유하므로 동시에 돌리면 서버가 깨집니다.');
    console.error('dev 서버를 먼저 종료하세요. (강제 진행: SKIP_BUILD_GUARD=1)\n');
    process.exit(1);
  }
} catch { /* pgrep 없음 등 — 가드 없이 통과 */ }
