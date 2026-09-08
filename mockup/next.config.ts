import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libsql은 네이티브 모듈을 포함한다. 번들러가 처리하지 못하므로 외부로 둔다.
  serverExternalPackages: ['@libsql/client', 'libsql'],

  // lib/canvas/designSystem.ts가 저장소 루트의 design-systems/를 읽는다.
  // mockup/ 밖이라 기본 추적 범위에 들어오지 않는다 — 루트를 넓히고 필요한 파일만 명시한다.
  outputFileTracingRoot: path.join(__dirname, '..'),
  outputFileTracingIncludes: {
    '/api/**': [
      '../design-systems/registry.json',
      '../design-systems/*/_ds_manifest.json',
      // 완성 화면 예시 본문. 빠뜨리면 로컬만 되고 배포본은 조용히 예시 없이 동작한다.
      '../design-systems/*/templates/*/*.dc.html',
    ],
  },
};

export default nextConfig;
