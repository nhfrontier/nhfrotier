# 배포 / 인프라

> 배포 환경 설정 절차, 환경변수, 트러블슈팅을 기록합니다.
> **환경변수는 키와 용도만 적습니다. 실제 값은 절대 이 문서에 넣지 않습니다.**
>
> **관련 문서**: [아키텍처 결정](ARCHITECTURE.md) | [기술 스택](TECH_STACK.md) | [보안 체크리스트](../guidelines/SECURITY_CHECKLIST.md)

---

## 1. 배포 대상 요약

| 구분 | 환경 | 상태 |
|---|---|---|
| **A. 프로토타입** (`mockup/`) | 로컬 개발 PC | 동작 중 |
| **B. 운영** | 농협은행 내부 Linux 서버 + Docker | 미구축 (인프라 협의 중) |

---

## 2. 프로토타입 로컬 실행 (`mockup/`)

### 사전 요구사항
- Node.js 20 LTS 이상
- 네이티브 모듈(`better-sqlite3`) 빌드 도구 — Windows는 Visual Studio Build Tools 필요

### 절차
```bash
cd mockup
npm install
# .env.local 파일을 만들고 아래 3절의 키를 채운다
npm run dev          # http://localhost:3000
```

### 기타 명령어
```bash
npm run build        # 프로덕션 빌드
npm run start        # 빌드 결과 실행
npm run lint         # ESLint
```

### 데이터 저장 위치
- SQLite 파일: `mockup/data/mockup.db` — 최초 실행 시 `lib/db.ts`가 디렉터리와 스키마를 자동 생성한다.
- `.gitignore`에 `/data/*.db*`가 등록되어 있어 커밋되지 않는다.
- **초기화 방법**: `mockup/data/` 디렉터리를 삭제하고 재실행한다.

### 디자인 자산 이미지 (`mockup/public/assets/nh/`)

`/proto/assets`(S10 디자인 자산 갤러리)가 읽는 실물 이미지 위치다.

- **커밋하지 않는다.** `.gitignore`에 `mockup/public/assets/nh/*`가 등록되어 있고 `README.md`만 추적된다.
- **이유**: `.github/workflows/pages.yml`이 저장소 루트 전체를 GitHub Pages로 공개 서빙한다(main → `/`, dev → `/dev/`). 올원뱅크·기업인터넷뱅킹 화면 캡처나 NH 로고 원본을 커밋하면 공개 URL로 노출된다. `design-systems/*/uploads/`를 제외한 것과 같은 이유다.
- 파일이 없어도 화면은 동작한다. `AssetThumb`이 대체본을 그리고 배지로 구분한다.
- 파일명 규칙과 폴더 구조는 `mockup/public/assets/nh/README.md` 참고.

### 화면 리디자인 참고 캡처 (`reference/ui/`)

외부 서비스 UI 캡처를 모아 두는 곳이다. 화면 코드가 읽지 않는 순수 참고 자료다.

- **커밋하지 않는다.** `.gitignore`에 `reference/ui/**`가 등록되어 있고 `README.md`만 추적된다.
- **이유**: 위와 같다. 루트가 공개 서빙되는데 캡처에 사내 프로젝트명·계정명이 함께 찍혀 있다.
- 파일이 없어도 저장소·빌드는 그대로 동작한다. 자세한 내용은 `reference/ui/README.md` 참고.

### 디자인 시스템 (`design-systems/`)

화면 생성 시 고르는 디자인 시스템 자산이다. 폴더 하나가 시스템 하나이며, 선택지 정본은 `design-systems/registry.json`이다.
`mockup/lib/canvas/designSystem.ts`가 `process.cwd()/../design-systems`를 읽으므로 **`mockup/`을 다른 위치로 옮기면 이 경로가 끊긴다.**

- 본체는 **커밋한다.** 토큰·컴포넌트·템플릿은 공개돼도 무방한 대체재다.
- **`design-systems/*/uploads/` 는 커밋하지 않는다.** `.gitignore`에 등록되어 있다.
  - `allone-bank/uploads/` — 올원뱅크 앱 화면 캡처 10장
  - `nh-ibz/uploads/` — `ibz.nonghyup.com` 실제 화면 캡처 4.5MB
  - **이유**: 위와 같다. 루트가 공개 서빙되므로 실제 서비스 화면이 그대로 공개 URL이 된다.
- 원본 export zip(`올원뱅크 Design System.zip` · `NH기업뱅킹 Design System.zip`)도 같은 이유로 제외한다. 풀어서 커밋하므로 중복이기도 하다.
- 파일이 없어도 화면 생성은 그대로 동작한다. 프롬프트에서 디자인 토큰 절만 빠진다.
- 자산의 실체(무엇이 실제 NH이고 무엇이 대체재인지)는 `design-systems/README.md` 참고.

---

## 3. 환경변수

> 값은 기록하지 않는다. `.env`·`.env.local`은 `.gitignore`에 등록되어 있어야 한다.

### A. 프로토타입 (`mockup/.env.local`)

| 키 | 용도 | 필수 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API 호출용 키. `lib/generate.ts`에서 서버 측에서만 사용 | 필수 |
| `PREVIEW_ACCESS_PASSWORD` | 팀 공유용 비밀번호 게이트. `proxy.ts`가 `/api`를 포함한 전 경로를 막는다 | 배포 시 필수 |
| `TURSO_DATABASE_URL` | libSQL 접속 주소(`libsql://...`). **없으면 로컬 파일 DB를 쓴다** | 배포 시 필수 |
| `TURSO_AUTH_TOKEN` | Turso 인증 토큰 | 배포 시 필수 |

- `NEXT_PUBLIC_` 접두사를 붙이면 브라우저 번들에 포함된다. **API 키에는 절대 붙이지 않는다.**
- `PREVIEW_ACCESS_PASSWORD`를 비워 두면 로컬 개발은 그대로 통과하지만, `NODE_ENV=production`에서는 **503으로 막힌다.**
  무방비 배포를 원천 차단하기 위한 것이므로 이 동작을 완화하지 말 것.
- 키 목록의 정본은 `mockup/.env.example`이다. 키를 추가하면 그 파일도 함께 고칠 것.

### 팀 공유 배포 (Vercel) — 2026-09-08

`mockup/`을 Vercel에 올려 팀이 실물을 쓰게 한다. `mockup-site/`(정적 미러)를 손으로 유지하던 이중 작업을 없애기 위한 것이다.

| 항목 | 내용 |
|---|---|
| Root Directory | `mockup` |
| DB | Turso (파일 DB는 serverless에서 쓸 수 없다) |
| 접근 통제 | **앱 자체의 `proxy.ts` 게이트.** Vercel Deployment Protection을 쓰지 않는다 |

**왜 Vercel Deployment Protection을 쓰지 않는가**: Hobby 플랜은 production 도메인을 보호할 수 없고
(preview만 가능), 외부 사용자도 계정당 1명까지다. Password Protection은 Pro + 월 $150다.
그래서 보호를 플랫폼이 아니라 앱 안에 두었다.

**알아 둘 것**: Vercel Hobby는 fair use상 **비상업·개인 용도 전용**이며, 급여를 받는 직원이 코드를 쓰는 것도
상업적 사용으로 정의되어 있다. 이 프로젝트는 그 정의에 해당한다. 무료 조건을 우선해 감수한 선택이며,
계정 정지 가능성이 있다는 것을 전제로 쓴다.

**`design-systems/` 경로 주의**: `lib/canvas/designSystem.ts`가 `process.cwd()/../design-systems`를 읽는데
Root Directory가 `mockup`이라 기본 추적 범위 밖이다. `next.config.ts`의 `outputFileTracingRoot`·
`outputFileTracingIncludes`로 넣어 두었으나 **첫 배포에서 실제로 읽히는지 확인이 필요하다.**
읽히지 않으면 화면 생성은 계속 동작하고 프롬프트에서 디자인 토큰 절만 빠진다.

**(2026-09-08) 추적 대상이 늘었다.** 화면 생성 프롬프트가 완성 화면 예시를 함께 넣으므로
`../design-systems/*/templates/*/*.dc.html` 가 `outputFileTracingIncludes`에 추가됐다.
**빠뜨리면 로컬은 되고 배포본만 예시 없이 조용히 동작한다.**
빌드 후 확인: `.next/server/app/api/screens/[screenId]/generate/route.js.nft.json` 에
`.dc.html` 5개(nh-ibz 4 + allone-bank 1)가 들어 있어야 한다.

### B. 운영 (미확정 — 인프라 협의 후 확정)

| 키 | 용도 | 상태 |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | PostgreSQL 접속 정보 | 미확정 |
| `REDIS_HOST` / `REDIS_PORT` | Redis 접속 정보 | 미확정 (용도 자체가 미결) |
| `LLM_API_ENDPOINT` | 승인된 LLM API Gateway 주소 | 미확정 |
| `LLM_API_CREDENTIAL` | LLM 인증 정보. Token / API Key / OAuth 중 방식 미정 | 미확정 |
| `LLM_MODEL_NAME` | 호출할 모델 식별자 | 미확정 |
| `SSO_*` | 사내 SSO 연계 설정 | 미확정 (방식 미정) |
| `FILE_STORAGE_PATH` 또는 `OBJECT_STORAGE_*` | 파일 저장소 경로/접속 정보 | 미확정 (종류 미정) |

### 관리 원칙
- 비밀 값은 Secret 저장소 또는 컨테이너 환경변수로 주입한다. 이미지에 굽지 않는다.
- 개발 / 스테이징 / 프로덕션 환경을 분리한다.
- 키 값이 필요할 때 터미널 명령어 인자로 전달하지 않는다. 파일을 직접 열어 입력한다.

---

## 4. 운영 배포 구조 (목표)

```
사내 사용자 PC
      │
      ▼
Nginx / Reverse Proxy
      │
      ├─► Frontend (Vue3 빌드 산출물 / Nginx 컨테이너)
      │
      └─► Backend (Spring Boot 컨테이너)
             ├─► PostgreSQL
             ├─► Redis
             ├─► File Storage (NFS / Object Storage)
             ├─► Audit Log
             └─► AI Orchestrator ──HTTPS+인증──► LLM API Gateway ─► LLM Server
```

- 공개 접점은 DMZ에 두고 내부망과 분리한다.
- 방화벽은 서비스에 필요한 최소 포트만 허용한다. "allow all" 금지.
- Frontend / Backend / AI Worker는 stateless로 유지해 K8s 전환 여지를 남긴다.

---

## 4-1. 폐쇄망 반입 방식 — Docker 이미지 (2026-09-08 결정)

운영 소스는 **외부(개발망)에서 개발·빌드하고, 이미지를 파일로 말아 폐쇄망에 반입**한다.
폐쇄망에는 npm·Maven registry 도 Docker Hub 도 없으므로 이 방식이 아니면 의존성을 넣을 수 없다.

### 절차

```bash
# 개발망 — 번들 생성
node scripts/build-release.mjs 0.1.0     # → dist/nh-canvas-0.1.0/

# 반입 (USB / 승인된 전송 경로)

# 폐쇄망
sha256sum -c checksums.txt
docker load -i images.tar
cp .env.example .env                      # DB_PASSWORD 등을 채운다
docker compose up -d
curl -fsS http://localhost:8080/actuator/health
```

번들 구성과 설치 절차는 생성물 안의 `INSTALL.md` 를 정본으로 한다.

### 반드시 지킬 것

| 규칙 | 이유 |
|---|---|
| **`--platform linux/amd64` 로 빌드** | ARM 맥에서 빌드하면 반입 후 `exec format error` 로 죽는다. 가장 흔한 사고라 `scripts/build-release.mjs` 가 옵션을 하드코딩하고 빌드 후 아키텍처를 검증한다 |
| **베이스 이미지는 다이제스트로 고정** | 태그(`:21-jre`)는 나중에 다른 이미지를 가리켜 재현성과 심사가 무너진다 |
| **비밀값을 이미지에 굽지 않는다** | `docker history` 로 레이어가 보인다. 전부 환경변수로 주입한다 |
| **반입 이미지는 실행 전용** | 멀티스테이지의 빌더 스테이지는 최종 이미지에 없다. 폐쇄망에서 재빌드할 수 없으며 이는 의도된 동작이다 |
| **커밋 해시를 이미지에 박는다** | `org.opencontainers.image.revision`. 반입 주기가 느려 "이게 어느 소스냐"를 나중에 못 찾는다 |
| **볼륨 두 개를 함께 백업** | `db-data` 와 `file-storage` 를 따로 복구하면 DB 메타데이터와 실제 파일이 어긋난다 |

### 아직 안 된 것

- **프론트엔드(Vue 3) 이미지** — 저장소에 골격이 없다. 확정되면 `docker-compose.yml` 에 서비스로 추가하고 `build-release.mjs` 의 저장 목록에 넣는다.
- **취약점 스캔 리포트** — 반입 심사 자료로 필요하다. 현재 번들에는 의존성 목록(`dependencies.txt`)만 들어간다.
- **Maven 오프라인 의존성** — 지금은 개발망에서 빌드하므로 문제없다. 폐쇄망에서 빌드해야 할 상황이 생기면 사내 Nexus 미러가 필요하다.

---

## 5. 배포 전 승인 체크리스트

배포 전 아래 항목을 모두 확인한다. (출처: [07_QA_SECURITY_OPERATIONS.md](../../개발문서/07_QA_SECURITY_OPERATIONS.md))

- [ ] 소스/이미지 취약점 점검
- [ ] Secret·환경변수 노출 점검
- [ ] SSO 연계 테스트 완료
- [ ] LLM API 인증 테스트 완료
- [ ] 파일 저장소 권한 검증
- [ ] DB schema migration 검증
- [ ] Rollback 절차 검증
- [ ] 운영 로그·감사 로그 확인

---

## 6. 운영 점검 항목

- 컨테이너 health check
- DB backup / restore
- 파일 저장소 backup / restore
- LLM endpoint 장애 시 서비스 상태
- Retry 폭주 방지
- Job queue 적체
- 디스크 용량
- DB connection pool
- Redis 장애 시 영향 범위
- 로그 보존 정책 (접근 로그·감사 로그 1년 이상)

### 장애 대응 우선순위

| 장애 | 대응 |
|---|---|
| **LLM** | 일반 기능은 계속 사용 가능해야 한다. AI 작업은 FAILED/RETRY 상태로 남긴다. |
| **DB** | 쓰기를 제한하고 읽기 가능 여부를 판단한다. 무리한 재시작 전에 원인과 복구 상태를 먼저 확인한다. |
| **File Storage** | 신규 업로드·Export를 제한하고 Version/메타데이터 손상 여부를 확인한다. |
| **Container** | health check와 재기동 정책을 쓰되, 반복 장애는 원인을 먼저 확인한다. |

---

## 7. 인프라 협의 필요 항목 (미결)

| 항목 | 내용 |
|---|---|
| 서버 | Linux 서버 사양, 운영/개발 서버 분리 여부 |
| 컨테이너 | Docker 운영 방식, 이미지 반입 경로 및 Registry |
| 네트워크 | 내부 DNS, Reverse Proxy 구성 |
| 저장소 | NFS / Object Storage 종류와 접근권한 |
| DB | PostgreSQL·Redis 운영 주체 |
| AI | LLM endpoint, 인증 방식, 사용 가능 모델, 최대 토큰, 동시 호출 제한, Timeout/Rate Limit, Prompt·Response 저장 허용 범위 |
| 보안 | SSO 방식, 프로젝트 권한 모델, 파일 반출 정책, 로그 보존 정책 |

전체 목록은 [08_DECISIONS_OPEN_ISSUES.md](../../개발문서/08_DECISIONS_OPEN_ISSUES.md) 참고.

---

## 8. 트러블슈팅

> 배포·실행 중 발생한 오류와 해결 방법을 여기에 누적한다.

### 운영 백엔드가 기동 직후 "파일 저장소 디렉터리를 만들 수 없습니다"로 죽는다
- **증상**: 컨테이너가 올라오다 곧바로 종료된다. 로그 마지막에 위 메시지와 함께 경로·실행 계정·
  존재하는 상위 경로의 소유자·조치 방법이 찍힌다.
- **원인**: 이미지가 **비루트(uid 10001 canvas)** 로 도는데 `FILE_STORAGE_PATH` 가 가리키는 곳을
  그 uid 가 쓸 수 없다. 바인드 마운트(호스트 경로·NFS)로 바꿨을 때 생긴다 — 이름 있는 볼륨은
  Docker 가 이미지 소유권을 가져가므로 이 문제가 없다.
- **왜 기동을 끊는가**: 디렉터리가 이미 있는데 쓰기만 안 되는 경우까지 기동 시점에 확인한다.
  미루면 "기동은 됐는데 파일만 안 올라간다"가 되어 원인을 훨씬 늦게 찾는다.
- **해결**: 로그의 `조치:` 줄을 따른다. 호스트에서 `chown -R 10001:<gid> <경로>` 하거나,
  소유권을 바꿀 수 없는 NFS 라면 `docker-compose.yml` 의 `user:` 로 실행 uid 를 맞춘다.
- **주의**: Docker Desktop(Windows/macOS)은 바인드 소유권을 관대하게 매핑해 **개발 PC 에서는 재현되지 않는다.**
  실제 리눅스 호스트에서만 나타나므로 반입 전에 확인할 수 없다.

### `npm install` 직후 dev 서버가 "Cannot find module 'uuid'"로 죽는다
- **증상**: 멀쩡히 설치된 패키지를 못 찾는다고 한다. `npm ls uuid`는 정상이다.
- **원인**: `node_modules`가 바뀌었는데 Turbopack의 `.next/dev` 캐시가 stale하다.
- **해결**: `rm -rf .next` 후 재기동.

### dev 서버가 두 개 뜨지 않는다
- **증상**: `Another next dev server is already running.` 후 종료.
- **원인**: 같은 디렉터리에 대해 dev 서버는 하나만 뜬다. 포트를 바꿔도 마찬가지다.
- **해결**: 기존 프로세스를 먼저 정리한다. 메시지에 PID가 찍힌다.

### ~~`better-sqlite3` 설치·실행 실패~~ (2026-09-08 — libSQL로 교체되어 해당 없음)
- **증상**: `npm install` 시 네이티브 빌드 실패, 또는 실행 시 모듈 로드 오류.
- **원인**: 네이티브 모듈이라 Node 버전에 맞춰 컴파일되어야 한다.
- **해결**: Node 버전을 바꿨다면 `npm rebuild better-sqlite3`. Windows에서는 Visual Studio Build Tools(C++ 워크로드)가 필요하다.
- **참고**: Next.js 번들러가 네이티브 모듈을 처리하지 못하므로 `next.config.ts`의 `serverExternalPackages`에 등록되어 있다. 이 설정을 지우면 빌드가 깨진다.

### dev에 merge했는데 공유 링크에 변경이 안 보인다
- **증상**: `mockup/app/proto/assets/`(Next.js)에 자산을 붙이고 dev에 merge했는데
  `.../dev/mockup-site/design-assets.html` 은 그대로였다.
- **원인**: **Pages로 화면이 보이는 것은 `mockup-site/`(정적 HTML)뿐이다.** `mockup/`은 Next.js
  앱이라 저장소를 통째로 서빙해도 화면이 뜨지 않는다. 목업 표면이 두 벌인데 한쪽만 고친 것이다.
- **해결**: 공유 링크에 보여야 하는 변경은 `mockup-site/`에도 반영한다. → `mockup-site/README.md`

### 로컬에서는 보이는 이미지가 Pages에서 404
- **증상**: 정적 목업의 이미지가 내 브라우저에서는 멀쩡한데 공유 링크에서는 깨진다.
- **원인**: 그 이미지가 `.gitignore` 대상이라 **내 PC에만 있고 저장소에 없다.** 로컬 확인으로는
  절대 발견되지 않는다. 절대경로(`/assets/...`)를 쓴 경우도 같은 증상이다 — Pages는 `/nhfrotier/` 하위다.
- **해결**: `node scripts/check-pages-assets.mjs` 로 검사한다. `mockup-site/`를 건드린 커밋에서는
  pre-commit 훅이 자동으로 돌려 커밋을 막는다. 훅이 안 돌면 `node scripts/install-hooks.mjs`.
  공개해도 되는 자산이면 `.gitignore`에 예외를 뚫고, 아니면 이미지를 빼고 CSS/SVG 대체본을 그린다.

<!-- 새 트러블슈팅은 아래 형식으로 추가:

### [증상 한 줄]
- **증상**:
- **원인**:
- **해결**:

-->
