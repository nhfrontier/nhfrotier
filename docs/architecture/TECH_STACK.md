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

### 디자인 시스템 레지스트리 (`design-systems/`) — 패키지가 아니라 자산 계층
- **무엇**: 저장소 루트의 `design-systems/` 아래 폴더 하나가 디자인 시스템 하나다. 선택지 정본은 `registry.json`이고, 코드가 읽는 것은 각 시스템의 `_ds_manifest.json` 안 `tokens[]`(컬러·타이포·간격 토큰)와 `templates[]`(완성 화면 목록) 두 개뿐이다. 소비 지점은 `mockup/lib/canvas/designSystem.ts` 한 파일이다.
- **왜 필요**: 화면 생성 프롬프트에 넣을 디자인 토큰이 **하나로 하드코딩**돼 있었다. 그 하나가 실제 NH 값이 아닌 대체 팔레트(올원뱅크 DS, teal)라 결과물을 "NH 디자인"이라 부를 수 없었다. 실제 NH 컬러를 쓰는 기업인터넷뱅킹 시스템이 들어오면서, 하나를 갈아끼우는 대신 **고를 수 있게** 만들었다.
- **왜 갈아끼우지 않았는지**: 모바일 앱(360×780 · 하단 내비)과 기업 웹(1200px · GNB)은 표면이 달라 한쪽으로 통일할 수 없다. 만들려는 화면이 어느 쪽인지는 사용자만 안다.
- **왜 `_ds_manifest.json`이 정본인지**: Claude Design export 두 벌이 모두 이 파일에 `{name, value, kind}` 형태의 동일한 토큰 배열을 갖고 있다. 반면 사람이 읽기 좋은 `tokens.json`은 `allone-bank`에만 있다. 공통으로 있는 쪽을 읽어야 새 시스템을 넣을 때 변환 작업이 생기지 않는다.
- **비용**: 0. 런타임 의존성이 아니라 읽기 전용 자산이며, `fs.readFileSync` + 캐시로 끝난다.
- **주의**: `<id>/uploads/` 는 커밋하지 않는다. 디자인 시스템을 만들 때 넣은 **실제 서비스 화면 캡처**라, 루트가 GitHub Pages로 공개 서빙되는 이 저장소에서는 그대로 공개 URL이 된다. 자산의 실체와 대체재 목록은 `design-systems/README.md`.

---

## B. 목표 운영 스택 (행내 배포)

> 아직 구현 전. 각 항목은 [04_SYSTEM_ARCHITECTURE.md](../../개발문서/04_SYSTEM_ARCHITECTURE.md)의 결정을 따른다. 버전은 행내 반입 가능 여부 확인 후 확정한다.

### Vue 3 (Frontend)
- **무엇**: 컴포넌트 기반 프론트엔드 프레임워크.
- **왜 선택**: 행내 기존 시스템과 개발 인력의 익숙함. 빌드 산출물을 Nginx에 정적 배포하는 구조라 반입이 단순하다.
- **역할 경계**: 화면 표시, 파일 선택, Chat 입력, Version/History 시각화까지. **LLM을 직접 호출하지 않는다.**

### Spring Boot (Backend)
- **무엇**: Java 기반 백엔드 프레임워크.
- **왜 선택**: 행내 표준 스택이며 SSO 연계·감사 로그·트랜잭션 처리에 대한 사내 레퍼런스가 축적되어 있다.
- **책임**: 인증/인가, 프로젝트 도메인, 파일 메타데이터, 협업, Version, History, Export orchestration.

### PostgreSQL
- **무엇**: 관계형 데이터베이스.
- **왜 선택**: Version 계보(`parent_version_id` 자기참조)와 History 이벤트를 관계로 다뤄야 하고, JSON 컬럼으로 `payload_summary` 같은 가변 구조도 함께 담을 수 있다.
- **저장 대상**: 프로젝트·사용자·멤버·파일 메타데이터·댓글·Review·Version·History·Template. **파일 바이너리는 저장하지 않는다.**

### Redis
- **무엇**: 인메모리 저장소.
- **왜 선택**: 세션·캐시·비동기 Job 상태 후보.
- **미결**: 실제 운영 용도와 운영 주체가 확정되지 않았다. 장애 시 영향 범위를 먼저 정의해야 한다.

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
| node-html-parser | HTML 정제·요소 ID 부여 | 150KB로 훨씬 가볍지만 WHATWG 스펙 비준수다. 엣지케이스를 관대하게 넘기고 직렬화가 일부를 정규화해, **정제를 겸하는 용도로는 브라우저와 해석이 갈릴 위험**이 있다 | parse5 |
| cheerio | 같음 | 셀렉터 쿼리가 필요 없다(전체 DFS 한 번이면 충분). parse5보다 무거운데 얻는 게 없다 | parse5 |
| jsdom / DOMPurify | 같음 | 10MB+ 로 무겁고 느리다. DOMPurify는 표준 정제기지만 DOM 환경이 필요하고, ID 부여 순회를 어차피 따로 해야 한다 | parse5 + 자체 화이트리스트 |
| 자작 HTML 토크나이저 | 같음 | 의존성 0이지만 정제를 겸하므로 파싱 오차가 곧 보안 구멍이 된다 | parse5 |
| DS별 토큰 변환기 자작 | 디자인 시스템마다 다른 토큰 포맷을 하나로 맞추기 | Claude Design export가 이미 `_ds_manifest.json`에 공통 스키마(`{name, value, kind}`)로 토큰을 내려준다. 변환기를 만들면 export 포맷이 바뀔 때마다 따라 고쳐야 한다 | `_ds_manifest.json`의 `tokens[]`를 그대로 읽는다 |
| 디자인 시스템 단일화(하나만 유지) | 선택 UI·분기 제거 | 모바일 앱과 기업 웹은 캔버스 폭·내비게이션 구조가 달라 한쪽으로 통일하면 다른 쪽 화면을 만들 수 없다 | `design-systems/registry.json` 기반 선택 |
| 그래프 라이브러리 (react-flow 등) | 화면 흐름도 | 화면 8개 이하 격자 배치면 충분하다. 절대배치 박스 + SVG 라인 100줄로 해결됨 | `ScreenFlow.tsx` 직접 구현 |

---

## D. 새 기술·패키지 추가 절차

1. 위 **C. 검토 후 제외한 기술** 표에 이미 있는지 확인한다. 있으면 도입하지 않는다.
2. A(프로토타입) / B(운영) 중 어느 스택인지 정한다.
3. 직접 구현으로 대체 가능한 간단한 기능이면 패키지를 쓰지 않는다.
4. 사용자 승인을 받는다.
5. 도입 후 이 문서의 해당 절에 **무엇 / 왜 선택 / 대안 대비 이유**를 기록한다. 제외한 후보도 C 표에 남긴다.
