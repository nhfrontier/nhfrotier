# 기술 스택

> 이 프로젝트에 사용된 기술을 설명합니다.
> 나중에 다시 봤을 때 "왜 이걸 썼지?"를 바로 이해할 수 있도록 작성합니다.
>
> **관련 문서**: [아키텍처 결정](ARCHITECTURE.md) | [배포](DEPLOYMENT.md) | [보안 체크리스트](../guidelines/SECURITY_CHECKLIST.md)

---

## 0. 이 문서를 읽는 법 — 스택이 두 벌인 이유

이 프로젝트에는 성격이 다른 두 스택이 공존한다. 새 기술을 도입할 때 **어느 쪽 스택에 넣는 것인지 먼저 정하고** 그 절에 기록한다.

| 구분 | 위치 | 스택 | 목적 |
|---|---|---|---|
| **A. 프로토타입 스택** | `mockup/` | Next.js 16 + React 19 + libSQL/Turso | 아이디어 검증·데모용. 행내 반입 대상이 아니다. |
| **B. 목표 운영 스택** | 미구현 | Vue 3 + Spring Boot + PostgreSQL + Docker | 행내 Linux 서버에 실제 배포할 스택. [04_SYSTEM_ARCHITECTURE.md](../../개발문서/04_SYSTEM_ARCHITECTURE.md) 기준. |

두 스택은 겹치는 부분이 거의 없다. **프로토타입 코드는 운영 스택으로 이식되지 않으며**, 검증된 것은 화면 흐름·프롬프트 설계·데이터 모델뿐이다. 이 점을 전제로 아래를 읽는다.

---

## A. 프로토타입 스택 (`mockup/`)

> 현재 유일하게 동작하는 코드. AI 목업 생성 흐름과 협업 UX를 빠르게 검증하기 위한 것이다.

### Next.js 16.2.9
- **무엇**: React 기반 풀스택 웹 프레임워크. 화면(App Router)과 API(Route Handlers)를 한 프로젝트에서 만든다.
- **왜 선택**: 프론트와 백엔드를 따로 띄우지 않고 한 명령(`npm run dev`)으로 전체 흐름을 굴릴 수 있어, 검증 단계에서 가장 빠르다.
- **주의**: 16.x는 이전 버전과 API·규약이 다르다. 코드 작성 전 `mockup/node_modules/next/dist/docs/`의 해당 가이드를 확인한다. (`mockup/AGENTS.md` 지시)

### React 19.2.4 / TypeScript 5
- **무엇**: UI 라이브러리와 정적 타입 언어.
- **왜 선택**: Next.js가 요구하는 조합. TypeScript는 DB row 타입(`lib/db.ts`의 `Project`, `MockupVersion` 등)을 API 응답까지 그대로 이어 붙여 계약을 강제하는 용도.

### Tailwind CSS v4
- **무엇**: 클래스 이름으로 스타일을 직접 지정하는 CSS 프레임워크.
- **왜 선택**: 별도 CSS 파일 관리 없이 화면을 빠르게 조립할 수 있다. 검증 단계라 디자인 시스템을 세우지 않았다.

### @libsql/client 0.18 (Turso) — 2026-09-08 도입
- **무엇**: SQLite 호환 DB 클라이언트. 로컬은 파일(`mockup/data/mockup.db`), 배포는 Turso 원격을 같은 코드로 쓴다.
  접속 대상은 `TURSO_DATABASE_URL` 유무로 갈린다.
- **왜 선택**: 팀 공유를 위해 Vercel에 올리기로 했는데 **serverless는 파일시스템에 쓸 수 없어** ~~better-sqlite3~~를 계속 쓸 수 없었다.
  libSQL은 SQLite의 포크라 **SQL 방언이 같다** — 쿼리 문자열 115곳을 한 글자도 고치지 않고 옮겼다.
  `datetime('now')`·`PRAGMA user_version`·`PRAGMA table_info`가 전부 그대로 동작하므로 마이그레이션 러너도 그대로 남았다.
- **왜 Postgres가 아닌지**: C 표 참고. 요약하면 이 저장소에 테스트가 하나도 없어서, `?`→`$n`과 방언 차이를 손으로 115번 고치는 것이
  가장 큰 사고 위험이었다. 운영 스택은 그대로 PostgreSQL이며 프로토타입 코드는 어차피 이식되지 않는다(0절).
- **무엇이 바뀌었나**: 호출이 전부 async가 됐다. `getDb()`는 `Promise<Db>`를 돌려주고, `prepare().get/all/run`은 **모양은 그대로**지만 Promise를 반환한다.
  `db.transaction(fn)`은 `(tx: Db) => Promise<T>`를 받는 형태로 바뀌었다 — 트랜잭션 안에서는 `db`가 아니라 `tx`를 써야 한다.
- **한계**: 무료 5GB. 참조 화면 이미지가 base64로 DB에 들어가므로(`reference_screens.image_data`) 용량이 여기서 먼저 찬다.
- **주의**: 네이티브 모듈(`libsql`)을 포함하므로 `next.config.ts`의 `serverExternalPackages`에 `@libsql/client`·`libsql`이 등록되어 있다.
- **마이그레이션의 달라진 점**: 각 단계를 트랜잭션으로 감싸지 않는다. libSQL에서 다문장(`executeMultiple`)을 트랜잭션 안에서 돌리는 것이 보장되지 않기 때문이다.
  대신 **모든 단계가 멱등이어야 한다**(원래도 그랬다). 실패하면 `user_version`이 오르지 않아 다음 기동에서 같은 단계를 다시 실행한다.

### ~~better-sqlite3 12.11~~ (2026-09-08 사용 중단)
- 위 항목으로 대체됐다. `package.json`에는 아직 남아 있으나 코드에서 참조하지 않는다.

### @anthropic-ai/sdk 0.106
- **무엇**: Claude API 클라이언트. `lib/generate.ts`에서 기획안 텍스트 + 참조 화면 이미지를 넣고 HTML 목업을 받는다.
- **왜 선택**: 이미지 입력(참조 화면 스타일 분석)과 긴 HTML 출력이 모두 필요했다.
- **운영 스택과의 차이**: 프로토타입은 외부 Anthropic API를 직접 호출한다. **운영에서는 행내 승인 LLM만 사용하며**, 이 SDK 호출부는 AI Orchestrator로 대체된다. ([ARCHITECTURE.md](ARCHITECTURE.md) 2·3절)
- **키 관리**: `ANTHROPIC_API_KEY` 환경변수로만 주입한다. 코드·로그에 절대 넣지 않는다.

### parse5 8.0.1
- **무엇**: WHATWG 표준을 그대로 구현한 HTML 파서. jsdom·cheerio·Angular가 내부에서 쓰는 그 파서다. `lib/canvas/htmlPipeline.ts`에서 AI가 생성한 HTML을 저장 전에 한 번 파싱한다.
- **왜 필요**: 한 번의 파싱으로 두 가지를 동시에 한다 — ① `<script>`·`on*` 핸들러·외부 리소스 제거(정제) ② 요소마다 `data-nh-id` 부여(협업 캔버스의 선택·메모 앵커). 정규식으로 HTML을 다루는 것은 정제 우회 취약점의 고전적 원천이라 파서가 필요하다.
- **왜 parse5인지**: `<style>` 같은 raw-text 영역, HTML 엔티티, 잘못 닫힌 태그를 스펙대로 처리한다. **정제를 겸하는 파서에서는 스펙 준수가 곧 보안**이다. 관대하게 넘어가는 파서는 브라우저와 해석이 갈리는 지점을 만든다.
- **비용**: 430KB, 순수 JS, MIT. 네이티브 빌드가 없어 `serverExternalPackages` 등록이 필요 없다.
- **주의**: AI가 붙인 `data-nh-id`는 정제 단계에서 **전부 제거**한다. 식별자 부여 권한은 서버 파이프라인에만 있다.

### uuid 14
- **무엇**: 고유 ID 생성기. 모든 테이블의 PK가 TEXT UUID다.
- **왜 선택**: 순번 PK는 URL에 노출될 때 다른 리소스를 추측하기 쉽다(IDOR). UUID로 추측 난이도를 올린다. 단, **UUID는 권한 검증의 대체재가 아니다** — 조회 시 멤버십 확인은 별도로 해야 한다.

### gsap 3.15 (SplitText 포함) — 2026-09-08 도입
- **무엇**: 애니메이션 라이브러리. 대시보드 히어로 섹션의 진입 연출과 3단계 흐름 루프에 쓴다. 소비 지점은 `mockup/app/proto/hero-lab/variants/` 의 `"use client"` 컴포넌트뿐이다.
- **왜 선택**: 히어로가 헤드라인을 단어 단위로 쪼개 순차 리빌하고, 그 뒤 3단계 배지가 무한 루프로 점등해야 한다. 순수 CSS `@keyframes`로는 **단어 단위 분할 자체가 불가능**하고(DOM을 쪼개 줄 주체가 없다), 여러 요소의 stagger·타임라인 오프셋(`"-=0.34"`)을 손으로 계산해 유지하는 비용이 크다.
- **왜 SplitText가 무료인가**: 2025년 Webflow 인수 후 GSAP 3.13부터 SplitText를 포함한 전 플러그인이 표준 라이선스에 들어왔다. Club 계정·유료 등록이 필요 없고 공개 npm `gsap` 패키지에 `gsap/SplitText`로 들어 있다. 도구 제안 규칙(무과금 범위)에 맞는다.
- **왜 framer-motion이 아닌지**: 텍스트 분할이 없어 SplitText에 해당하는 것을 직접 만들어야 하고, React 렌더 사이클에 묶여 있어 정적 목업 미러(`mockup-site/`, React 없음)에 같은 연출을 옮길 수 없다. GSAP은 CDN 스크립트 한 줄로 그쪽에서도 동일하게 돈다.
- **비용**: 클라이언트 번들에만 들어간다. 네이티브 모듈이 없어 `serverExternalPackages` 등록이 필요 없고, `/proto/hero-lab`이 정적 프리렌더되는 것으로 SSR 안전이 확인됐다.
- **주의 — 반드시 지킬 것**:
  - `gsap.matchMedia().add()`에 조건을 **양쪽 다** 등록한다. `reduce` 하나만 넣으면 모션을 켠 일반 환경에서 콜백이 아예 실행되지 않아 애니메이션이 통째로 사라진다.
  - `repeat: -1` 타임라인을 다른 타임라인 안에 `add()`로 넣지 않는다. 부모가 유한한 duration을 요구한다. 형제로 두고 `delay`로 이어 붙인다.
  - `useLayoutEffect`는 SSR에서 경고를 낸다. `typeof window` 분기로 감싼다.
  - 정리는 `gsap.context(fn, ref)` + `ctx.revert()`. SplitText는 `split.revert()`도 함께 부른다.

### 디자인 시스템 레지스트리 (`design-systems/`) — 패키지가 아니라 자산 계층
- **무엇**: 저장소 루트의 `design-systems/` 아래 폴더 하나가 디자인 시스템 하나다. 선택지 정본은 `registry.json`이고, 코드가 읽는 것은 각 시스템의 `_ds_manifest.json` 안 `tokens[]`(컬러·타이포·간격 토큰)와 `templates[]`(완성 화면 목록) 두 개다. **(2026-09-08) `templates[]`는 이름만이 아니라 `entryPath`가 가리키는 `.dc.html` 본문까지 읽어 화면 생성 프롬프트의 예시로 넣는다**(`buildExampleScreensSection`). 사용자에게 참고할 화면을 고르게 하는 대신 그 시스템의 완성 화면을 전부 넣고 모델이 고르게 한다. 예시는 `sanitizeFragment`(parse5)를 거치고 `var(--token)`을 실값으로 치환해 넣는다 — 생성 규칙이 CSS 변수를 금지하므로 예시도 같은 형태여야 한다. 소비 지점은 `mockup/lib/canvas/designSystem.ts` 한 파일이다.
- **왜 필요**: 화면 생성 프롬프트에 넣을 디자인 토큰이 **하나로 하드코딩**돼 있었다. 그 하나가 실제 NH 값이 아닌 대체 팔레트(올원뱅크 DS, teal)라 결과물을 "NH 디자인"이라 부를 수 없었다. 실제 NH 컬러를 쓰는 기업인터넷뱅킹 시스템이 들어오면서, 하나를 갈아끼우는 대신 **고를 수 있게** 만들었다.
- **왜 갈아끼우지 않았는지**: 모바일 앱(360×780 · 하단 내비)과 기업 웹(1200px · GNB)은 표면이 달라 한쪽으로 통일할 수 없다. 만들려는 화면이 어느 쪽인지는 사용자만 안다.
- **왜 `_ds_manifest.json`이 정본인지**: Claude Design export 두 벌이 모두 이 파일에 `{name, value, kind}` 형태의 동일한 토큰 배열을 갖고 있다. 반면 사람이 읽기 좋은 `tokens.json`은 `allone-bank`에만 있다. 공통으로 있는 쪽을 읽어야 새 시스템을 넣을 때 변환 작업이 생기지 않는다.
- **비용**: 0. 런타임 의존성이 아니라 읽기 전용 자산이며, `fs.readFileSync` + 캐시로 끝난다.
- **주의**: `<id>/uploads/` 는 커밋하지 않는다. 디자인 시스템을 만들 때 넣은 **실제 서비스 화면 캡처**라, 루트가 GitHub Pages로 공개 서빙되는 이 저장소에서는 그대로 공개 URL이 된다. 자산의 실체와 대체재 목록은 `design-systems/README.md`.

### 농협 공식 CI 벡터 추출 (`scripts/trace-nh-ci.mjs`) — 2026-09-08 도입
- **무엇**: 농협 공식 CI 원본 JPG(`mockup/public/assets/nh/logo/`)에서 심볼마크·워드마크의 **윤곽을 추출해 SVG path 로 바꾸는** 빌드 스크립트다. 락업 3종(`logo.svg`·`logo-white.svg`·`logo-mark.svg`)까지 조립하고, `design-systems/nh-ibz/templates/` 3장에 **인라인 SVG 로 박아 넣는다.**
- **왜 필요**: `design-systems/nh-ibz` 의 로고가 활자 플레이스홀더라 결과물을 NH 자산이라 부를 수 없었다. 그런데 저장소에 있는 공식 자산은 **JPG 4장뿐이고 벡터 원본(AI/EPS/SVG)이 없다.** 래스터를 그대로 쓰면 다크 배경(흰 사각형)과 확대에서 무너진다.
- **왜 손으로 그리지 않는지**: 공식 CI 를 눈대중으로 다시 그리는 것은 상표 왜곡이다. 스크립트는 산출물이 원본에서 기계적으로 유도됐음을 보이고, 만든 SVG 를 **다시 래스터로 그려 원본과 픽셀 일치율(IoU)** 을 잰다. 99% 미만이면 비정상 종료해 나쁜 산출물이 조용히 커밋되는 것을 막는다. 실측 IoU 는 심볼 99.703% / 워드마크 99.759%.
- **왜 base64 PNG 가 아닌지**: 템플릿은 AI 화면 생성 프롬프트의 예시로 들어가고 그 예산은 60,000자다. 투명 PNG 는 96px 기준 base64 5.4KB 라 3장에 넣으면 예산을 잠식한다. 벡터 path 는 심볼 3.4KB·워드마크 1.0KB 이며 확대에도 견딘다.
- **왜 파일 참조가 아니라 인라인인지**: 정제 파이프라인(`mockup/lib/canvas/htmlPipeline.ts`)이 상대경로 `src` 를 **속성째 잘라낸다**(허용은 `#`앵커와 `data:image/(png|jpe?g|gif|webp);base64,` 뿐). `<img src="../../assets/logo.svg">` 로 두면 모델에게는 빈 `<img>` 만 보인다. 인라인 `<svg>` 는 `DROP_TAGS` 에 없어 그대로 통과한다. `data:image/svg+xml` 은 차단되므로 이 경로도 쓸 수 없다.
- **비용**: 0. 이미지 처리는 `mockup/` 에 이미 있는 `sharp` 를 `createRequire` 로 빌려 쓴다. **새 의존성을 추가하지 않았다.** 런타임 코드가 아니라 빌드 시점 스크립트다.
- **주의**: 로고 path 를 손으로 고치지 말 것. 같은 path 가 락업 3개와 템플릿 3개, 총 여섯 곳에 들어 있어 한 곳만 고치면 조용히 갈라진다. 스크립트가 여섯 곳을 한 번에 갱신한다.
- **주의 — 매니페스트 예외**: 프롬프트에 나가는 토큰 목록의 정본은 `tokens/colors.css` 가 아니라 `_ds_manifest.json` 의 `tokens[]` 다. CI 색 4개(`--nh-ci-*`)를 그 생성 파일에 **손으로 넣었다.** export 를 다시 돌리면 사라지므로 그때 다시 넣어야 한다.

---

## B. 목표 운영 스택 (행내 배포)

> ~~아직 구현 전.~~ → **2026-09-08 착수.** Backend 는 `backend/` 에 구현되어 있다(기동·Flyway 마이그레이션·API 호출 확인 완료).
> Frontend(Vue 3)는 아직 없다. 각 항목은 [04_SYSTEM_ARCHITECTURE.md](../../개발문서/04_SYSTEM_ARCHITECTURE.md)의 결정을 따른다.

### Vue 3.5 + Vite 6 + TypeScript (Frontend) — 2026-09-08 착수
- **무엇**: 컴포넌트 기반 프론트엔드. 구현 위치는 `frontend/` 다. 빌드 산출물을 Nginx 이미지로 굽는다.
- **왜 선택**: 행내 기존 시스템과 개발 인력의 익숙함. 빌드 산출물을 Nginx에 정적 배포하는 구조라 반입이 단순하다.
- **역할 경계**: 화면 표시, 파일 선택, Chat 입력, Version/History 시각화까지. **LLM을 직접 호출하지 않는다.**
- **현재 범위**: 프로젝트 목록·상세 두 화면뿐인 walking skeleton 이다. 반입 경로를 먼저 뚫는 것이 목적이었고, 업무 화면은 아직 없다.
- **의존성을 최소로 둔 이유**: 지금 있는 것은 `vue` 와 `vue-router` 둘뿐이다. 상태 관리(Pinia)와 UI 프레임워크는 **필요해진 뒤에** 넣는다 — 반입 심사에 올라가는 의존성 목록을 짧게 유지하는 편이 낫고, 화면이 두 개인 지금은 정당화되지 않는다.
- **`@types/node` 를 넣지 않은 이유**: `vite.config.ts` 에서 `node:url`·`process` 를 쓰지 않고 Vite 의 루트 기준 별칭(`"@": "/src"`)으로 대체했다. 의존성 하나를 줄인다.
- **소스맵을 끈 이유**: 폐쇄망에 반출되는 산출물에 소스맵이 들어가면 소스가 그대로 노출된다. 필요해지면 별도 반출 절차를 정한다.

### Vitest (Frontend 테스트) — 2026-09-08 도입
- **무엇**: Vite 위에서 도는 테스트 러너. `frontend/` 의 `npm test` 가 이것이다.
- **왜 선택**: Vite 설정(별칭 `@`, TS 변환)을 그대로 재사용한다. 별도 빌드 파이프라인이 생기지 않는다.
- **왜 이것만 넣었는지**: `@vue/test-utils` 와 `jsdom` 을 함께 넣으면 컴포넌트를 마운트할 수 있지만, **지금 지켜야 할 것은 렌더링 모양이 아니라 보안 불변식과 서버 규칙 일치**다. 그 셋(`buildSrcDoc` · `isTrustedFrameMessage` · `isSafeStyleValue`)은 전부 순수 함수라 DOM 이 필요 없다. 반입 심사에 올라가는 의존성 목록을 짧게 유지하는 편이 낫다.
- **무엇을 지키는가**: 저장본이 script-free 로 남는지, CSP 가 `img-src data:` 로 묶여 프레임이 바깥으로 요청을 내지 못하는지, 프레임 메시지 신뢰 판정이 `event.source` 대조를 유지하는지, 편집 화이트리스트와 스타일 값 규칙이 서버와 같은지, 한글 이름이 HTTP 헤더에 실리지 않는지.
- **검증 방법**: 통과만으로는 부족해서 **변이 테스트로 확인했다.** `event.source` 대조 제거 · CSP `img-src` 개방 · 헤더 가드 제거를 각각 넣었을 때 정확히 해당 테스트 1건씩 실패하는 것을 확인했다.
- **아직 없는 것**: 컴포넌트 렌더링 테스트와 E2E. 화면이 맞는지는 여전히 **브라우저 수동 확인**에 의존한다.

### Nginx (Frontend 서빙 + API 프록시)
- **무엇**: `frontend/nginx.conf`. 정적 파일을 서빙하고 `/api` 만 백엔드로 넘긴다. SPA 라 나머지는 `index.html` 로 폴백한다.
- **왜 이 구조**: [04_SYSTEM_ARCHITECTURE.md](../../개발문서/04_SYSTEM_ARCHITECTURE.md) 2절의 `U → RP → FE → BE` 경로 그대로다. 운영에서 백엔드는 호스트로 열지 않는다.
- **주의 — 타임아웃**: 프록시 타임아웃을 180초로 늘렸다. AI 동기 단건 호출이 수십 초 걸려 Nginx 기본 60초로는 502 가 난다.
- **주의 — 업로드 상한**: `client_max_body_size` 를 백엔드 `FILE_MAX_BYTES` 기본값(50MB)과 맞췄다. 여기서 먼저 잘리면 백엔드의 413 대신 Nginx 기본 오류 페이지가 나가 원인이 안 보인다. **한쪽만 바꾸지 말 것.**

### Spring Boot 3.5.6 / Java 21 LTS / Maven (Backend) — 2026-09-08 구현
- **무엇**: Java 기반 백엔드 프레임워크. 구현 위치는 `backend/` 다.
- **왜 선택**: 행내 표준 스택이며 SSO 연계·감사 로그·트랜잭션 처리에 대한 사내 레퍼런스가 축적되어 있다.
- **왜 Java 21인지**: LTS 이며 record·sealed interface·switch 패턴 매칭을 쓸 수 있다. DTO 와 편집 연산(`PatchOp`)을
  record/sealed 로 두면 필드가 늘 때 컴파일이 누락을 잡아 준다.
- **왜 Maven 인지**: 행내 Nexus 미러·오프라인 반입 레퍼런스가 많고 심사 대상 빌드 파일이 `pom.xml` 하나다.
  Gradle 은 빌드 스크립트가 코드라 반입 심사 대상이 하나 더 늘어난다.
- **책임**: 인증/인가, 프로젝트 도메인, 파일 메타데이터, 협업, Version, History, Export orchestration.

### Spring `JdbcClient` (DB 접근) — ORM 을 쓰지 않는다
- **무엇**: Spring Framework 6.1 이 제공하는 SQL 실행 API. 파라미터 바인딩과 record 매핑을 해 준다.
- **왜 선택**: 이 제품의 목록 API 는 전부 **집계를 함께 반환**해야 한다(05_API_DB_SPEC 1절 "N+1 금지").
  프로젝트 목록 한 줄에 멤버 수·미처리 검토 건수가 붙고, 커서 페이지네이션은 `(created_at, id)` 튜플 비교를 쓴다.
  이런 질의는 SQL 로 쓰는 편이 짧고 무엇이 실행되는지가 코드에 드러난다.
- **왜 JPA 가 아닌지**: JPA 의 지연 로딩이 05 명세가 금지한 N+1 을 만들어 내는 가장 흔한 원인이다.
  막으려면 fetch join·`@EntityGraph`·DTO projection 을 결국 손으로 쓰게 되는데, 그러면 SQL 을 쓰는 것과 같아지면서
  영속성 컨텍스트라는 추가 개념만 남는다. 엔티티 그래프가 얕고(대부분 단일 테이블 + 집계) 쓰기가 단순해 얻는 것이 적다.
- **보안상 같은 점**: 파라미터 바인딩만 쓴다. 문자열 연결로 값을 넣지 않는다 (SECURITY D-2).
  동적인 것은 `WHERE` 절의 **구조**뿐이고 값은 언제나 `?` 로 나간다.
- **바인딩 주의**: PostgreSQL JDBC 드라이버는 `java.time.Instant` 를 바인딩하지 못한다("Can't infer the SQL type").
  커서 위치는 `Cursors.Position#at()` 이 `OffsetDateTime` 으로 바꿔 주고, 시각 컬럼은 가급적 DB 의 `now()` 로 채운다.

### jsoup 1.18.3 (HTML 정제·요소 ID 부여·baking) — 2026-09-08 도입
- **무엇**: WHATWG 준수 HTML 파서 + Safelist 정제기. `backend/.../screen/HtmlPipeline.java` 에서 쓴다.
- **왜 필요**: 프로토타입의 parse5 파이프라인을 운영 스택으로 옮겨야 했다. 한 번의 파싱으로 정제와 `data-nh-id` 부여를
  함께 하고, 편집 반영(baking) 시 DOM 을 조작해 다시 직렬화한다.
- **왜 jsoup 인지**: 파서와 정제기를 한 라이브러리가 갖고 있다. 정제를 겸하는 용도에서는 스펙 준수가 곧 보안이며,
  DOM 순회·재직렬화 API 가 있어야 ID 부여와 baking 을 같은 트리 위에서 할 수 있다.
- **비용**: 약 450KB, 순수 Java, MIT, 추가 의존성 없음.
- **주의**: `data-nh-id` 조회에 셀렉터 문자열을 조립하지 않는다. 값이 요청 본문에서 오므로 셀렉터 주입이 된다 —
  `getElementsByAttributeValue` 를 쓴다.

### Testcontainers 1.21 (test scope) — 2026-09-08 도입

- **무엇**: 테스트가 도는 동안 실제 PostgreSQL 컨테이너를 띄우는 라이브러리. `spring-boot-testcontainers` + `org.testcontainers:postgresql` + `junit-jupiter` 세 개이며 **전부 `test` scope** 다. 버전은 `spring-boot-dependencies` 의 `testcontainers-bom` 이 관리한다.
- **왜 필요**: 인가 단일 지점인 `ProjectAccessGuard` 에 테스트가 없었다. 이 클래스의 위험은 역할 비교가 아니라 **리소스 → 프로젝트 역추적 SQL 이 틀리는 것**이다. `requireForExport` 의 `exports → versions` 조인이 어긋나면 남의 프로젝트 Export 가 통과한다. SQL 이 실제로 실행되어야만 잡히는 종류다.
- **왜 H2 가 아닌지**: `V1__init.sql` 이 `JSONB` 를 쓰는데 H2 는 받지 못한다. 테스트용 스키마를 따로 두면 **운영과 다른 스키마를 검증**하게 된다. 초록불인데 운영에서 깨지는 전형적 경로다.
- **왜 JdbcClient 대역(Mockito)이 아닌지**: SQL 문자열이 실행되지 않으므로 조인이 틀려도 통과한다. 정작 막으려던 것을 못 막는다. 실제로 조인을 깨는 변이를 넣어 테스트가 그것을 잡는 것을 확인했다.
- **비용**: 반입 이미지에 들어가지 않는다. `backend/Dockerfile` 의 builder 스테이지가 `-DskipTests` 로 빌드하므로 test scope 는 최종 산출물과 무관하다. 대신 **`mvn test` 에 Docker 가 필요해진다.**
- **주의 — Docker Engine 29 이상**: `pom.xml` 의 surefire 설정에 `api.version=1.44` 가 들어 있다. **지우면 테스트가 통째로 죽는다.** Engine 29 는 API 1.40 미만을 거절하는데(`MinAPIVersion=1.40`) docker-java 3.4.2 가 그보다 낮게 붙는다. 증상이 원인을 가린다 — `docker ps` 도 되고 컨테이너도 도는데 테스트만 `Could not find a valid Docker environment` 로 죽고, `/info` 가 본문 없는 400 만 준다. `DOCKER_API_VERSION=1.32 docker info` 로 같은 400 을 재현할 수 있다.

### PostgreSQL
- **무엇**: 관계형 데이터베이스.
- **왜 선택**: Version 계보(`parent_version_id` 자기참조)와 History 이벤트를 관계로 다뤄야 하고, JSON 컬럼으로 `payload_summary` 같은 가변 구조도 함께 담을 수 있다.
- **저장 대상**: 프로젝트·사용자·멤버·파일 메타데이터·댓글·Review·Version·History·Template. **파일 바이너리는 저장하지 않는다.**

### Redis — **도입하지 않았다** (2026-09-08)
- **무엇**: 인메모리 저장소. 세션·캐시·Job 상태의 후보였다.
- **왜 지금 넣지 않았는지**: 실제 운영 용도와 운영 주체가 미결인데, 미결인 컴포넌트를 먼저 넣으면
  장애 시 영향 범위를 정의하지 못한 채 의존만 생긴다. 초기 규모에서는 **DB 테이블 자체가 큐로 충분하다** —
  `ai_jobs` / `exports` 를 `FOR UPDATE SKIP LOCKED` 로 집으므로 컨테이너를 늘려도 한 작업이 두 번 실행되지 않는다.
- **어디를 고치면 되는지**: 큐를 밖으로 빼야 하면 `ai/AiJobWorker` · `export/ExportWorker` 두 클래스만 바꾼다.
  세션은 애초에 없다(SSO 위임). 캐시는 아직 필요한 지점이 나오지 않았다.
- **미결**: 위 판단은 초기 규모 전제다. 사용자·동시 호출이 늘면 재검토한다.

### Docker / Nginx
- **무엇**: 컨테이너 런타임과 리버스 프록시.
- **왜 선택**: 행내 서버 사양 확정 전에도 이미지 단위로 반입·배포가 가능하다. 상세는 [DEPLOYMENT.md](DEPLOYMENT.md).

### File Storage (NFS 또는 Object Storage)
- **무엇**: 원본 참고자료와 Version별 산출물의 저장소.
- **미결**: 종류와 접근권한 미확정. 인프라 협의 대상.

### AI Orchestrator (자체 구현 계층)
- **무엇**: 승인된 LLM API를 호출하는 전용 계층. 프레임워크가 아니라 직접 만드는 모듈이다.
- **왜 선택**: 모델·endpoint·인증 방식이 확정되지 않았고 이후 교체 가능성이 크다. 교체 지점을 한곳에 모은다. ([ARCHITECTURE.md](ARCHITECTURE.md) 3절)
- **책임**: 프롬프트 구성, credential 주입, 모델 라우팅, timeout/retry, 오류 정규화, 사용량 메타데이터.

---

## C. 검토 후 제외한 기술

> 도입을 고려했지만 제외한 것들. **새 의존성을 추가하기 전 이 표를 먼저 확인한다.**

| 기술 | 용도 | 제외 이유 | 대안 |
|---|---|---|---|
| 자체 LLM 개발/파인튜닝 | AI 생성 품질 확보 | 학습 데이터·GPU·운영 인력 부담이 과도하고, 행내 승인 절차와 무관하게 별도 심사가 필요하다 | 승인된 LLM API 호출 + 프롬프트/RAG 개선 |
| 브라우저에서 LLM 직접 호출 | 응답 지연 감소 | credential이 클라이언트에 노출된다. ISMS-P 위반 | Backend AI Orchestrator 경유 |
| GraphQL | API 조회 유연성 | 단일 endpoint 임의 쿼리가 경로 기반 접근 통제·감사 로그와 맞지 않고, 초기 규모에서 스키마 운영 비용이 크다 | REST `/api/v1` |
| Kubernetes (초기 도입) | 오케스트레이션 | 초기 사용자 규모 대비 운영 부담이 크다 | Docker 단일/소수 컨테이너, stateless 설계로 전환 여지 확보 |
| DB BLOB 파일 저장 | 파일 관리 단순화 | 백업/복구 시간과 커넥션 점유가 급증한다 | File Storage + DB 메타데이터 |
| SQLite (운영) | DB 설치 부담 제거 | 단일 파일·단일 프로세스 전제라 동시 쓰기와 다중 컨테이너에 부적합 | PostgreSQL (프로토타입에서만 SQLite 유지) |
| better-sqlite3 (배포본) | 프로토타입 DB | Vercel serverless는 파일시스템에 쓸 수 없다. 로컬 전용이면 팀이 볼 수 없다 | `@libsql/client` + Turso |
| Neon Postgres (프로토타입 DB) | Vercel 네이티브 연동·운영 스택과 동일한 Postgres | 방언이 달라 `?`→`$n`, `datetime('now')` 등을 115곳에서 손으로 고쳐야 한다. **테스트가 하나도 없는 저장소에서 가장 큰 사고 위험.** 무료 용량도 0.5GB로 base64 이미지에 빠듯하다 | libSQL(SQL 무변경, 무료 5GB) |
| Vercel Pro ($20/월) | production 배포 보호·팀 뷰어 무료 | 무료 조건에 어긋난다. 대신 앱 자체에 `proxy.ts` 비밀번호 게이트를 달아 Deployment Protection 없이 전 경로를 막았다 | 자체 게이트 |
| Tailscale (무료 Personal) | 도메인 없이 팀 사설 접근 | 무료 Personal은 **비상업 전용**이고 회사 도메인 이메일은 자동으로 비즈니스로 분류된다. 이 프로젝트에 쓸 수 없다 | 자체 게이트 + 공개 URL |
| Cloudflare Zero Trust Access | 무료 50명 이메일 인증 | Access를 걸려면 Cloudflare에 등록된 **도메인이 필요**하다(유료). 완전 무료 조건에 맞지 않는다 | 자체 게이트 |
| 외부 SaaS 협업 도구 연동 | 협업 기능 확보 | 행내 업무 자료의 외부 반출 불가 | 내부 구축 |
| 외부 이미지 생성 AI (DALL·E, Imagen 등) | 카드·홍보물 시안의 그래픽 소재 생성 | 행내 반입 승인 절차가 별도로 필요하고, 업무 자료의 외부 반출이 불가하며, 생성 이미지의 저작권·상표 리스크를 은행 산출물에 지울 수 없다 | 브랜드 자산 라이브러리(FR-04 `BRAND_ASSET`)에 사전 등록된 소재 + CSS/SVG 조합. AI는 배치만 한다 |
| 신규 NH 디자인 시스템 구축 | UI 일관성 | 기존 NH 자산과 중복되며 유지 주체가 이원화된다 | 기존 NH 디자인 자산을 업무 맥락에 연결 |
| JPA / Hibernate (운영 백엔드) | DB 접근 | 목록마다 집계를 함께 반환해야 하는데(05 1절 N+1 금지) 지연 로딩이 그 금지를 어기는 주된 경로다. 막으려면 결국 DTO projection 을 손으로 쓰게 되어 SQL 을 쓰는 것과 같아지고, 영속성 컨텍스트라는 개념만 추가된다. 엔티티 그래프가 얕아 얻는 것이 적다 | Spring `JdbcClient` + 명시적 SQL |
| Gradle (운영 백엔드 빌드) | 빌드 도구 | 빌드 스크립트가 코드라 폐쇄망 반입 심사 대상이 하나 더 늘어난다. 행내 Nexus 미러 레퍼런스도 Maven 쪽이 많다 | Maven (`pom.xml` 하나) |
| H2 (인가·SQL 테스트용 DB) | Docker 없이 도는 테스트 DB | `V1__init.sql` 의 `JSONB` 를 받지 못해 테스트용 스키마를 따로 써야 한다. 그러면 운영과 다른 스키마를 검증하게 되어, 초록불인데 운영에서 깨지는 상태가 된다 | Testcontainers + 실제 PostgreSQL |
| Mockito 로 `JdbcClient` 대역 | 의존성 없이 가드 테스트 | SQL 이 실행되지 않아 조인이 틀려도 통과한다. `ProjectAccessGuard` 에서 정작 막으려는 위험(리소스→프로젝트 역추적 오류)을 못 막는다 | Testcontainers + 실제 PostgreSQL |
| Redis (초기 도입) | 세션·캐시·Job 큐 | 운영 용도·운영 주체가 미결인데 먼저 넣으면 장애 영향 범위를 정의하지 못한 채 의존만 생긴다. 초기 규모에서는 DB 테이블 + `FOR UPDATE SKIP LOCKED` 로 충분하다 | `ai_jobs`·`exports` 테이블 큐 + 폴링 워커 |
| OWASP Java HTML Sanitizer | 운영 백엔드 HTML 정제 | 정제는 강하지만 DOM 순회·재직렬화 API 가 없어 `data-nh-id` 부여와 baking 을 못 한다. 파서를 하나 더 써야 해 의존성이 둘이 된다 | jsoup |
| node-html-parser | HTML 정제·요소 ID 부여 | 150KB로 훨씬 가볍지만 WHATWG 스펙 비준수다. 엣지케이스를 관대하게 넘기고 직렬화가 일부를 정규화해, **정제를 겸하는 용도로는 브라우저와 해석이 갈릴 위험**이 있다 | parse5 |
| cheerio | 같음 | 셀렉터 쿼리가 필요 없다(전체 DFS 한 번이면 충분). parse5보다 무거운데 얻는 게 없다 | parse5 |
| jsdom / DOMPurify | 같음 | 10MB+ 로 무겁고 느리다. DOMPurify는 표준 정제기지만 DOM 환경이 필요하고, ID 부여 순회를 어차피 따로 해야 한다 | parse5 + 자체 화이트리스트 |
| 자작 HTML 토크나이저 | 같음 | 의존성 0이지만 정제를 겸하므로 파싱 오차가 곧 보안 구멍이 된다 | parse5 |
| DS별 토큰 변환기 자작 | 디자인 시스템마다 다른 토큰 포맷을 하나로 맞추기 | Claude Design export가 이미 `_ds_manifest.json`에 공통 스키마(`{name, value, kind}`)로 토큰을 내려준다. 변환기를 만들면 export 포맷이 바뀔 때마다 따라 고쳐야 한다 | `_ds_manifest.json`의 `tokens[]`를 그대로 읽는다 |
| 디자인 시스템 단일화(하나만 유지) | 선택 UI·분기 제거 | 모바일 앱과 기업 웹은 캔버스 폭·내비게이션 구조가 달라 한쪽으로 통일하면 다른 쪽 화면을 만들 수 없다 | `design-systems/registry.json` 기반 선택 |
| 참고 템플릿 선택 UI | 생성 출발점 지정 | 고른 값이 프롬프트까지 가지 않아 사용자 선택이 버려지고 있었다. 고르게 하는 것보다 **완성 화면을 전부 넣고 모델이 고르게 하는 편**이 정확하고, 시스템 프롬프트 캐시도 살린다 | `buildExampleScreensSection` 자동 주입 |
| framer-motion | 히어로 애니메이션 | 텍스트를 단어 단위로 쪼개는 기능이 없어 SplitText에 해당하는 것을 직접 만들어야 한다. React 렌더 사이클에 묶여 있어 정적 목업 미러(`mockup-site/`)로 같은 연출을 옮길 수 없다 | gsap 3.15 |
| 순수 CSS `@keyframes`만으로 히어로 연출 | 의존성 0 | 헤드라인 단어 단위 분할이 원리상 불가능하다(DOM을 쪼갤 주체가 없다). 여러 요소의 stagger·오프셋을 손으로 유지하는 비용도 크다 | gsap 3.15 |
| @gsap/react (`useGSAP` 훅) | GSAP 정리(cleanup) 자동화 | `gsap.context()` + `ctx.revert()`로 같은 일을 한다. 훅이 감싸는 것이 그것뿐이라 패키지를 하나 더 늘릴 이유가 없다 | `gsap.context` 직접 사용 |
| 그래프 라이브러리 (react-flow 등) | 화면 흐름도 | 화면 8개 이하 격자 배치면 충분하다. 절대배치 박스 + SVG 라인 100줄로 해결됨 | `ScreenFlow.tsx` 직접 구현 |

---

## D. 새 기술·패키지 추가 절차

1. 위 **C. 검토 후 제외한 기술** 표에 이미 있는지 확인한다. 있으면 도입하지 않는다.
2. A(프로토타입) / B(운영) 중 어느 스택인지 정한다.
3. 직접 구현으로 대체 가능한 간단한 기능이면 패키지를 쓰지 않는다.
4. 사용자 승인을 받는다.
5. 도입 후 이 문서의 해당 절에 **무엇 / 왜 선택 / 대안 대비 이유**를 기록한다. 제외한 후보도 C 표에 남긴다.
