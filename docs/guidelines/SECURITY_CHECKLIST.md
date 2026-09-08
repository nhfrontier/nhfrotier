# 보안 체크리스트

> 이 프로젝트에서 **결정된 보안 방식**과 **ISMS-P 항목별 대응 현황**을 기록합니다.
> 규칙 원문은 [SECURITY.md](SECURITY.md)를 따릅니다. 이 문서는 "우리 프로젝트에서 그 규칙을 어떻게 지키고 있는가"를 적습니다.
>
> **관련 문서**: [보안 규칙 원문](SECURITY.md) | [아키텍처 결정](../architecture/ARCHITECTURE.md) | [배포](../architecture/DEPLOYMENT.md)

---

## 0. 코드 작성 시 반드시 지킬 것 (요약)

작업 성격에 따라 아래를 확인한다.

| 작업 | 필수 확인 |
|---|---|
| 외부 입력을 받는 코드 | 모든 요청 파라미터·헤더·쿠키를 신뢰하지 않는다. 검증·정제 후 사용 |
| DB 쿼리 작성 | 반드시 파라미터 바인딩(prepared statement). 문자열 연결 금지 |
| 리소스 조회 API | `projectId` / `fileId` / `versionId`를 받으면 **소유·멤버십을 반드시 검증**한다 (IDOR) |
| AI 호출 | 서버 측에서만 호출. credential을 응답·로그·프론트 번들에 노출하지 않는다 |
| 파일 업로드 | 확장자·MIME·용량 검증. 확장자 위장 검사 |
| HTML 렌더링 | AI 생성 HTML은 신뢰할 수 없는 입력으로 취급 (아래 4절) |
| 에러 응답 | 스택 트레이스·DB 정보·내부 경로를 사용자에게 노출하지 않는다 |
| 로그 작성 | 비밀번호·토큰·API 키·개인정보 원문을 기록하지 않는다 |
| 개인정보 화면 표시 | 마스킹 적용 (예: 홍길*, 010-****-1234, test@****.com) |

---

## 1. 결정된 보안 방식

| 항목 | 결정 | 상태 |
|---|---|---|
| 사용자 인증 | 사내 SSO 연계, **Backend에서 검증**. `backend/` 는 `AuthenticationProvider` 어댑터로 분리하고 매 요청 검증한다 | 방식 미확정 — 현재는 개발용 헤더 스텁 |
| 인가 | 프로젝트 멤버십 기반 접근 제어. 역할은 `OWNER`/`EDITOR`/`REVIEWER`/`VIEWER` 4단계 | 결정 (2026-09-08) |
| LLM credential | Secret 저장소 / 환경변수로 주입, 서버 측에서만 사용 | 결정 |
| LLM 호출 위치 | Backend AI Orchestrator. 브라우저 직접 호출 **금지** | 결정 |
| 파일 접근 | 요청마다 프로젝트 권한 확인 | 결정 |
| 파일 저장 | DB와 분리된 File Storage. DB에는 메타데이터만 | 결정 |
| 로그 | 원문·민감정보 기본 미저장. 접근·감사 로그 **1년 이상** 보존 | 결정 |
| AI 입력 자료 | 사용자가 대상 자료를 **명시적으로 선택** | 결정 |
| AI 입력 자료의 범위 (FR-15) | UX 리스크 검토는 **사람이 작성한 의견 원문**을 함께 보낸다. FR-14까지는 목업 HTML과 기획안뿐이었다 | **미결** — 아래 참고 |
| 전송 구간 | HTTPS. 공개 접점은 DMZ 배치 | 결정 |
| 프로토타입 팀 공유 접근 통제 | **공유 비밀번호 게이트**(`mockup/proxy.ts`). `/api` 포함 전 경로를 막는다. Vercel Deployment Protection은 쓰지 않는다 | 결정 (프로토타입 한정) |
| Prompt·Response 저장 | 저장 허용 범위 협의 필요 | **미결** |
| AI 입력 민감정보 처리 기준 | 어떤 자료를 AI에 넣을 수 있는지 기준 필요. **FR-15(UX 리스크 검토)가 의견 원문을 입력에 포함시키면서 범위가 넓어졌다** — 의견에는 사내 정보·개인정보가 섞일 수 있다 | **미결** |
| HTML preview 보안 정책 | 아래 4절 참고 | **미결** |
| 파일 반출(Export) 정책 | 반출 허용 범위·승인 절차 | **미결** |

---

## 2. ISMS-P 항목별 대응 현황

> [SECURITY.md](SECURITY.md)의 각 조항에 대한 현재 상태. `미적용`은 아직 구현되지 않았다는 뜻이며, 해당 기능 개발 시 반드시 채운다.

### 인증 / 인가

| 조항 | 요구사항 | 대응 |
|---|---|---|
| A-1 | 사용자 개별 식별, 공유 계정 금지 | **미적용** — 프로토타입은 `UserContext`로 사용자를 선택만 한다. `backend/`는 사용자를 개별 식별하지만 **인증하지는 않는다**(헤더 스텁). SSO 확정 시 해소 |
| A-1 | 로그인 실패 시 계정 잠금 | **SSO 위임** — 사내 SSO 정책을 따른다 |
| A-2 | 비밀번호를 bcrypt/scrypt/Argon2로 저장 | **해당 없음** — 자체 비밀번호를 보관하지 않는다 (SSO 위임). 자체 인증 도입 시 필수 적용 |
| A-3 | 최소권한 원칙, 권한 변경 로깅 | **적용** — 4단계 역할로 최소권한을 강제하고(`ProjectAccessGuard`), 멤버 추가·역할 변경·제거를 `history_events`와 `audit_logs` 양쪽에 남긴다 |
| A-4 | 관리자 권한 최소화·분리 | **미결** — 권한 모델 협의 대상 |

### 접근 통제

| 조항 | 요구사항 | 대응 |
|---|---|---|
| AC-1 | 미인가 접근 차단 | **설계 반영** — 모든 API에서 SSO 세션 검증 후 프로젝트 멤버십 확인 |
| AC-1 | 접근 로그 1년 이상 보존 | **설계 반영** — `audit_logs` 테이블. 보존 정책 협의 대상 |
| AC-2 | 공개 서비스 DMZ 분리 | **설계 반영** — [DEPLOYMENT.md](../architecture/DEPLOYMENT.md) 4절 |
| AC-2 | 최소 포트만 허용 | **설계 반영** — allow-all 금지 |

### 암호화

| 조항 | 요구사항 | 대응 |
|---|---|---|
| C-1 | 민감정보 저장·전송 암호화 | **전송 적용 예정** (HTTPS). 저장 암호화는 취급 대상 확정 후 결정 |
| C-1 | AES-256 등 검증된 알고리즘 | 자체 알고리즘 사용 금지 |
| C-2 | 키 하드코딩 금지 | **적용** — `ANTHROPIC_API_KEY`는 환경변수. `.env*`는 `.gitignore` 등록됨 |
| C-2 | 키 생명주기 로깅 | **미적용** — KMS/Secret 저장소 방식 확정 후 |

### 시큐어 코딩

| 조항 | 요구사항 | 대응 |
|---|---|---|
| D-1 | OWASP Top 10 방어를 설계 단계에 반영 | 아래 3절 |
| D-2 | 외부 입력 검증·정제 | **필수 적용** — 모든 API 진입점 |
| D-2 | 파라미터 바인딩 쿼리 | **적용** — 프로토타입은 libSQL prepared statement, 운영은 Spring `JdbcClient`. 값은 전부 `?`로 나가고 동적인 것은 `WHERE` 절 구조뿐이다 |
| D-2 | 에러에 내부 정보 미노출 | **설계 반영** — [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) 9절 |
| D-3 | SAST/DAST 주기 점검 | **미적용** — 배포 전 승인 항목에 포함 |

### 개인정보

| 조항 | 요구사항 | 대응 |
|---|---|---|
| P-1 | 최소 수집, 목적 고지·동의 | 현재 수집 항목: 사용자 이름·역할(SSO 연계 정보). 추가 수집 시 재검토 |
| P-2 | 화면 표시 시 마스킹 | **미적용** — 개인정보 표시 화면 개발 시 적용 |
| P-3 | 보관기간 만료 시 복구 불가능하게 파기 | **미적용** — 파기 절차·로그 수립 필요 |

### 로깅

| 조항 | 요구사항 | 대응 |
|---|---|---|
| L-1 | 주요 활동 로그 1년 이상 보존 | **설계 반영** — `audit_logs`, `history_events` |
| L-1 | [시각, 사용자 ID, 출발지 IP, 요청/행위, 성공/실패] 포함 | **적용** — `audit_logs` 컬럼이 이 다섯을 강제한다(`AuditLogger`). 출발지 IP는 `X-Forwarded-For` 우선 |
| L-1 | 민감정보 로깅 금지 | **필수 적용** — 프롬프트 원문·응답 저장은 허용 범위 확정 전까지 금지 |

---

## 3. OWASP Top 10 대응

| 항목 | 이 프로젝트의 위험 지점 | 대응 |
|---|---|---|
| **A01 취약한 접근 통제 (IDOR)** | `projectId` / `fileId` / `versionId` / `commentId`를 URL로 받는 API 전부 | 리소스 조회 시 **소유 프로젝트 + 요청자 멤버십**을 반드시 확인. UUID PK는 보조 수단일 뿐 검증 대체재가 아니다 |
| **A02 암호화 실패** | LLM credential, DB 접속 정보 | 환경변수·Secret 저장소. HTTPS 전송 |
| **A03 인젝션 (SQLi)** | 프로젝트·댓글·검색 조회 | 파라미터 바인딩만 사용. 동적 문자열 연결 금지. jsoup 셀렉터도 같다 — `data-nh-id` 조회에 셀렉터 문자열을 조립하지 않는다(셀렉터 주입) |
| **A03 인젝션 (XSS)** | **AI가 생성한 HTML을 화면에 렌더링** | 아래 4절 |
| **A04 안전하지 않은 설계** | AI 결과를 검증 없이 신뢰 | AI는 제안만 하고 최종 반영은 사람이 결정 (설계 원칙) |
| **A05 보안 설정 오류** | Next.js `NEXT_PUBLIC_` 접두사, 디버그 응답 | API 키에 `NEXT_PUBLIC_` 금지. 운영 빌드에서 상세 에러 비활성 |
| **A06 취약·구버전 컴포넌트** | npm/Maven 의존성 | 배포 전 취약점 스캔 |
| **A07 인증 실패** | 세션 만료 처리 | SSO 세션 만료 시 재인증. Backend에서 매 요청 검증 |
| **A08 무결성 실패** | 컨테이너 이미지 반입 경로 | Registry·반입 경로 통제 (인프라 협의) |
| **A09 로깅 실패** | 감사 로그 누락 | 로그인·개인정보 접근·권한 변경·AI 호출을 감사 로그로 기록 |
| **A10 SSRF** | AI Orchestrator가 외부 URL을 호출할 경우 | LLM endpoint를 **환경변수 화이트리스트로 고정**. 사용자 입력으로 호출 대상 URL을 결정하지 않는다 |

---

## 4. AI 생성 HTML 렌더링 정책 (이 프로젝트 고유 위험)

이 제품은 **LLM이 만든 HTML을 화면에 보여주는 것이 핵심 기능**이다. AI 출력은 신뢰할 수 없는 입력으로 취급한다.

### 위험
- 참고자료·기획안에 삽입된 문구가 프롬프트를 통해 악성 스크립트로 이어질 수 있다 (간접 프롬프트 인젝션 → 저장형 XSS).
- 생성된 HTML이 부모 페이지의 세션·토큰에 접근하면 계정 탈취로 이어진다.

### 대응 (필수)
- 미리보기는 **샌드박스 iframe**으로 격리한다. `sandbox` 속성에서 `allow-same-origin`과 `allow-scripts`를 **동시에 부여하지 않는다**.
- 부모 페이지에 `innerHTML`·`dangerouslySetInnerHTML`로 직접 주입하지 않는다.
- 생성 HTML에 `<script>`·인라인 이벤트 핸들러(`onclick` 등)·외부 리소스 로드가 포함되지 않도록 저장 전 정제한다. (현재 프롬프트가 "Do NOT use JavaScript"를 지시하지만, **프롬프트 지시는 보안 통제가 아니다.** 서버 측 정제가 필요하다.)
- CSP 헤더로 외부 스크립트·네트워크 요청을 차단한다.

### 샌드박스 조합 결정 — `allow-scripts` 단독 (2026-09-05)

~~프로토타입은 `sandbox="allow-same-origin"`(스크립트 없음)으로 렌더링한다.~~
→ **`sandbox="allow-scripts"`로 전환한다. `allow-same-origin`은 부여하지 않는다.**

- **왜 바꿨나**: 협업 디자인 캔버스가 목업 안의 요소를 클릭해 고르고 화면 사이를 이동시켜야 한다. 두 기능 다 프레임 안에서 스크립트가 돌아야 가능하다.
- **왜 규칙 위반이 아닌가**: 금지 대상은 두 값의 **동시** 부여다. `allow-scripts`만 주면 프레임은 불투명(opaque) 오리진이 되어 부모 DOM·쿠키·`localStorage`에 접근할 수 없고, 프레임이 자기 `sandbox` 속성을 지워 샌드박스를 무력화하는 경로도 막힌다. 위험한 쪽은 `allow-same-origin`이며, 그것을 뺀 것이다.
- **실측 확인**: 부모에서 `iframe.contentDocument`가 `null`이고, 부모가 받는 `event.origin`은 항상 문자열 `"null"`이다. 따라서 **origin 검증은 성립하지 않으며**, 신뢰 판정은 `event.source === iframe.contentWindow` 대조로만 한다. 이 값은 브라우저가 채우므로 위조할 수 없다.
- **반대 방향의 제약**: 불투명 오리진에는 `targetOrigin`을 지정할 수 없어 부모→프레임 전송은 `'*'`가 강제된다. 그러므로 **이 방향의 페이로드에 사용자 식별자·세션·토큰·타 프로젝트 정보를 절대 넣지 않는다.** 화면에 그리기 위한 표현 데이터만 보낸다.
- **런타임 스크립트의 출처**: 프레임 안에서 도는 스크립트는 AI 생성물이 아니라 저장소가 통제하는 `mockup/lib/canvas/runtime.ts`다. DB에 저장하지 않고 `srcDoc` 조립 시점에만 주입하므로, **저장본은 script-free로 유지**되고 HTML 다운로드도 안전하다.

### 서버 측 정제 도입 (2026-09-05)

`mockup/lib/canvas/htmlPipeline.ts`가 생성 HTML을 **저장 전에** parse5로 한 번 파싱하며 아래를 수행한다.

| 처리 | 내용 |
|---|---|
| 노드 제거 | `script`·`iframe`·`object`·`embed`·`base`·`link`·`noscript`·`template`·`foreignObject`, `meta[http-equiv]`, 주석 전부 |
| 속성 제거 | `on*` 전부, `srcdoc`·`ping`·`formaction`·`xlink:href`, AI가 붙인 `data-nh-id` |
| URL 속성 | `href`/`src`/`action`/`poster` 등은 `#앵커`와 `data:image/(png\|jpeg\|gif\|webp)`만 허용. **`data:image/svg+xml`도 차단**(SVG는 스크립트 운반 가능) |
| CSS | `@import`·`expression(`·`javascript:` 제거, 외부 `url()`은 `none`으로 무력화 |
| 화면 링크 | `data-goto`가 존재하지 않는 화면을 가리키면 제거 |

CSP는 `srcDoc` 조립 시 `<meta http-equiv="Content-Security-Policy">`로 넣는다:
`default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'`
정제가 뚫렸을 때의 2차 방어선이며, `img-src data:`로 묶여 프레임이 바깥으로 요청을 낼 수 없다.

### 편집 반영(baking)의 고유 위험 — CSP 밖으로 나가는 HTML (2026-09-08)

요소 편집은 저장본을 덮어쓰지 않고 패치로 쌓이므로, 다운로드·AI 검토는 서버에서 패치를 얹은 사본을 만든다(`lib/canvas/patches.ts` `bakeScreenHtml`). 여기에 **프레임 안에는 없던 위험 두 가지**가 생긴다.

| 위험 | 왜 프레임에는 없나 | 대응 |
|---|---|---|
| **스타일 값이 선언을 쪼갠다** | 프레임은 `el.style.setProperty(prop, value)`를 쓴다. 브라우저가 값을 검사하고 값 하나로 선언을 여러 개 만들 수 없다. baking은 문자열을 이어 붙이므로 `red; background-image: url(...)` 같은 값이 선언 둘로 갈라진다 | 값에 `;` `{` `}` `<` `>` `url(` `expression(` `javascript:` `@import` 가 섞이면 **그 선언을 적용하지 않고 버린다** |
| **CSP가 따라가지 않는다** | 프레임은 `srcDoc`에 주입한 CSP meta가 외부 요청을 막는다. **다운로드한 파일은 그 밖에서 열린다** | 교체(`aiRewrite`) 조각을 baking 시점에 **다시 정제한다.** DB에 무엇이 들어 있든 나가는 것은 정제된 것이어야 한다 |

편집 값(`element_patches.payload`)은 사용자·AI가 넣은 값이며 저장 시점에는 화이트리스트 검사만 받는다. **저장된 값을 신뢰하지 않는다**는 것이 이 두 대응의 전제다.

### 운영 프론트엔드에도 같은 조합을 적용 (2026-09-08)

`frontend/` 의 협업 캔버스가 프로토타입과 같은 결정을 따른다. 구현 위치는
`frontend/src/canvas/protocol.ts`(계약·신뢰 판정), `frontend/src/canvas/runtime.ts`(프레임 안 스크립트),
`frontend/src/components/DesignCanvas.vue`(프레임 호스트)다.

| 항목 | 확인한 값 |
|---|---|
| `sandbox` | `["allow-scripts"]` 뿐. `allow-same-origin` 없음 |
| 부모의 프레임 DOM 접근 | `iframe.contentDocument` 가 `null` — 불투명 오리진 확인 |
| 프레임 → 부모 신뢰 판정 | `event.source === iframe.contentWindow` 대조만. **origin 은 항상 `"null"` 이라 검증에 못 쓴다** |
| 부모 → 프레임 | `targetOrigin` 이 `'*'` 로 강제됨. 그래서 이 방향에 **사용자 식별자·세션·토큰을 싣지 않는다** |
| 저장본 | `<script` 없음. 런타임은 `srcdoc` 조립 시점에만 주입하고 DB 에 넣지 않는다 |

- **미리보기 전용 화면은 `sandbox=""`(모든 제약)로 둔다.** 요소 선택이 필요 없으면 스크립트 권한도 필요 없다.
  캔버스만 `allow-scripts` 를 받는다 — 필요 없는 권한을 기본값으로 만들지 않기 위해서다.
- 편집 화이트리스트(`EDITABLE_STYLE_PROPS`·`EDITABLE_ATTRS`)의 정본은 `backend/.../EditProtocol.java` 다.
  프론트의 사본은 편의일 뿐 통제가 아니며, 서버가 저장·반영 양쪽에서 다시 검사한다.

### 상태
**부분 확정** — 위 샌드박스 조합과 정제 파이프라인, baking 대응은 프로토타입에 적용 완료. 운영 적용 시 행내 보안 검토를 거쳐 확정한다.

---

## 5. 보안 테스트 체크리스트

기능 개발 후 아래를 점검한다. (출처: [07_QA_SECURITY_OPERATIONS.md](../../개발문서/07_QA_SECURITY_OPERATIONS.md))

- [ ] 브라우저 Network 탭에서 LLM credential 노출 여부
- [ ] API 직접 호출 시 권한 우회 가능 여부
- [ ] 프로젝트 간 파일 접근 차단 확인
- [ ] IDOR 검사 (`projectId` / `fileId` / `versionId` / `commentId`)
- [ ] 업로드 파일 확장자 위장 검사
- [ ] 악성 파일 업로드 방어
- [ ] 민감정보 로그 노출 여부
- [ ] SQL Injection / Command Injection 기본 검사
- [ ] XSS — AI 생성 HTML preview 격리 확인 (4절)
- [ ] CSRF / SSO 연계 방식 점검
- [ ] Secret 파일·환경변수 노출 점검
- [ ] SSO 성공 / 실패 / 세션 만료 동작
- [ ] 권한 없는 프로젝트 접근 차단

---

## 5-1. 운영 백엔드(`backend/`)의 현재 상태 — 2026-09-08

> 착수 시점의 상태다. 무엇이 되어 있고 무엇이 남았는지를 구분해 적는다.

### 적용된 것

| 항목 | 구현 |
|---|---|
| 인가 (A01 IDOR) | `ProjectAccessGuard` 한 곳. `projectId`/`fileId`/`versionId`/`commentId`/`jobId`/`exportId` 를 받는 모든 경로가 지난다. 리소스 id → 프로젝트 역추적 메서드를 가드에 모아, 호출부가 조인을 손으로 쓰다 빠뜨리는 경로를 없앴다. **`ProjectAccessGuardTest` 20건이 실제 PostgreSQL 위에서 회귀를 막는다** — 타 프로젝트 멤버의 접근, 삭제된 프로젝트·소프트 삭제 리소스, 역할 미달을 각 진입점마다 확인한다 (2026-09-08) |
| 인가 모델 | `OWNER`/`EDITOR`/`REVIEWER`/`VIEWER`. 판정은 Backend 한 곳에서만 |
| 파라미터 바인딩 (A03) | `JdbcClient` 로 값은 전부 `?`. 동적인 것은 `WHERE` 절 구조뿐이며 값 문자열을 잇지 않는다 |
| 에러 비노출 (D-2) | `GlobalExceptionHandler` 가 `ErrorCode` 로 정규화. 스택·DB 제약 메시지·내부 경로를 응답에 넣지 않고 traceId 만 준다. `server.error.include-*` 도 전부 never |
| 업로드 검증 | MIME 화이트리스트 + **매직바이트 대조**(확장자 위장) + 용량 상한 → 초과 시 413. 저장 키는 서버가 만들고 원본 파일명을 경로에 쓰지 않는다 |
| 다운로드 | 항상 `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff`. 업로드된 HTML·SVG 가 우리 오리진에서 실행되지 않게 한다 |
| 경로 조작 | `LocalFileStorage` 가 저장 키를 루트 기준으로 정규화하고 밖으로 나가면 거부 |
| AI 생성 HTML (4절) | `screen/HtmlPipeline`(jsoup)이 **저장 전** 정제하고 `data-nh-id` 를 부여한다. 규칙은 프로토타입과 동일하며 `HtmlPipelineTest` 30건이 회귀를 막는다 |
| baking (4절) | 편집 값은 저장 시점과 반영 시점 **양쪽**에서 화이트리스트 검사. 선언을 쪼갤 수 있는 스타일 값은 버리고, 교체 조각은 반영 시점에 다시 정제한다 |
| SSRF (A10) | LLM endpoint 를 설정으로 고정. 사용자 입력이 호출 대상을 정하지 않는다 |
| credential | `LLM_API_CREDENTIAL` 은 환경변수로만. `LlmProperties#toString` 이 마스킹하고, 게이트웨이 오류 본문은 로그에만 남긴다 |
| 감사 로그 (L-1) | `audit_logs` 에 [시각·사용자 ID·출발지 IP·행위·성공/실패]. 업무 트랜잭션이 롤백돼도 남도록 별도 트랜잭션 |

### 남은 격차

| 격차 | 내용 |
|---|---|
| **인증이 없다** | `AUTH_PROVIDER=dev` 는 요청 헤더의 사용자 식별자를 그대로 믿는다. **누구나 위조할 수 있어 인증이 아니다.** SSO 방식 확정 전까지 도메인·인가를 진행하기 위한 자리채움이며, 이 상태로 어떤 네트워크에도 노출하지 않는다 |
| 계정 잠금·비밀번호 정책 | SSO 위임. 자체 인증을 만들지 않는다 |
| 개인정보 마스킹 (P-2) | 미적용. 현재 표시 대상이 사용자 이름·부서뿐이나, 화면이 생기면 적용 대상을 다시 본다 |
| 파기 절차 (P-3) | 미적용. 보관기간·파기 로그 수립 필요 |
| 감사 로그 보존 | 테이블에 남기지만 **1년 이상 보존을 보장하는 운영 절차와 조회 수단이 없다** |
| **가드 호출 자체는 미검증** | 가드의 판정은 테스트가 덮지만, **컨트롤러가 그 가드를 실제로 부르는지는 확인하지 않는다.** 호출부 52곳 중 하나가 가드를 건너뛰어도 현재 테스트는 전부 통과한다. HTTP 진입점 단위 테스트가 필요하다 |
| SAST/DAST | 미적용. 배포 전 승인 항목 |
| 전송 구간 | 애플리케이션은 평문 HTTP 다. HTTPS 종단은 Reverse Proxy 몫이며 아직 구성되지 않았다 |
| AI 입력 범위 | FR-15 가 의견 원문을 LLM 에 보내는 구조는 그대로다. 필터·마스킹이 없고 허용 범위는 1절의 미결 항목이다 |

---

## 6. 프로토타입(`mockup/`)의 알려진 보안 격차

> 검증용 코드라 아래가 충족되지 않았다. **운영 코드로 이식하지 않으며**, 외부 노출 환경에 배포하지 않는다.

| 격차 | 내용 |
|---|---|
| 인증 없음 | 사용자를 목록에서 선택할 뿐 인증하지 않는다 |
| 인가 없음 | 프로젝트 멤버십 검증 없이 조회·수정이 가능하다 (IDOR 노출) |
| 감사 로그 없음 | 접근·변경 이력을 남기지 않는다 |
| 외부 LLM 직접 호출 | 행내 승인 LLM이 아닌 외부 Anthropic API를 호출한다 |
| 공유 비밀번호 게이트 | 팀 공유 배포를 위해 `proxy.ts`에 **공유 비밀번호** 하나를 둔다. `SECURITY.md` A-1의 "공유 계정 금지"에 어긋나며 누가 접속했는지 남지 않는다. 게이트가 없던 상태보다는 낫다는 판단이고, **운영 코드로 이식하지 않는다.** 운영은 SSO다.<br>비밀번호는 `PREVIEW_ACCESS_PASSWORD` 환경변수로만 주입하며 코드·로그에 넣지 않는다. 미설정 시 배포본은 503으로 막힌다 |
| 외부 SaaS에 데이터 저장 | 프로토타입 DB가 **Turso(외부 SaaS)** 로 옮겨졌다. 기획안·의견 원문·생성 HTML이 외부에 저장된다. `TECH_STACK.md` C표의 "외부 SaaS 반출 불가" 원칙은 **운영 기준**이며, 프로토타입은 이미 외부 Anthropic API를 쓰고 있어 같은 선에 있다. **실제 업무 자료를 넣지 말 것** |
| 의견 원문의 외부 전송 | FR-15 UX 리스크 검토가 **사람이 작성한 의견 원문**을 외부 Anthropic API로 보낸다. 프로토타입에는 의견 내용에 대한 필터·마스킹이 없다. 운영에서는 승인 LLM 경유가 전제이며 허용 범위는 1절의 미결 항목이다 |
| ~~HTML preview 부분 적용~~ | ~~`app/projects/[id]/page.tsx:523`에서 `<iframe srcDoc sandbox="allow-same-origin">`으로 렌더링한다. `allow-scripts`가 없어 스크립트는 실행되지 않는다. 다만 저장 전 서버 측 정제와 CSP는 없다~~ → **해소(2026-09-05).** `app/components/canvas/DesignCanvas.tsx`가 `sandbox="allow-scripts"`(불투명 오리진)로 렌더링하고, `lib/canvas/htmlPipeline.ts`가 저장 전 정제하며, `srcDoc`에 CSP meta를 주입한다. 4절 참고 |
