# NH 위드캔버스 운영 백엔드

`개발문서/04_SYSTEM_ARCHITECTURE.md` 의 **목표 운영 스택**을 구현한 코드다.
`mockup/`(Next.js 프로토타입)과는 별개이며 **프로토타입 코드를 이식하지 않는다.**
검증된 것은 화면 흐름·프롬프트 설계·데이터 모델뿐이라는 전제를 그대로 따른다.
([TECH_STACK.md](../docs/architecture/TECH_STACK.md) 0절)

## 스택

| 항목 | 선택 |
|---|---|
| 언어 / 런타임 | Java 21 LTS |
| 프레임워크 | Spring Boot 3.5.6 |
| 빌드 | Maven |
| DB | PostgreSQL 16 + Flyway |
| DB 접근 | Spring `JdbcClient` (명시적 SQL) |
| HTML 처리 | jsoup 1.18.3 |

## 실행

### 1. PostgreSQL 준비

```bash
docker run -d --name nhcanvas-db \
  -e POSTGRES_DB=nhcanvas -e POSTGRES_USER=nhcanvas -e POSTGRES_PASSWORD=<암호> \
  -p 5432:5432 postgres:16-alpine
```

스키마는 **기동 시 Flyway 가 만든다.** 초기화 SQL 을 따로 넣지 않는다.

### 2. 환경변수

`.env.example` 을 보고 채운다. 최소한 `DB_PASSWORD` 는 필요하다.
값을 이 저장소에 커밋하지 않는다.

### 3. 기동

```bash
DB_PASSWORD=<암호> mvn spring-boot:run     # http://localhost:8080
mvn test                                    # 테스트
mvn package                                 # target/canvas-backend-0.1.0-SNAPSHOT.jar
```

### 4. 호출해 보기

개발 프로파일에서는 헤더로 사용자를 정한다. **개발 전용이며 인증이 아니다.**

```bash
curl -H 'X-Dev-Login-Id: kyj' -H 'X-Dev-Name: 김영진' \
     http://localhost:8080/api/v1/me
```

## 미결 사항을 다루는 방식

행내 협의가 끝나지 않은 것들은 **인터페이스 뒤에 두고 개발용 구현을 붙였다.**
확정되면 구현체만 추가한다. 도메인 코드는 건드리지 않는다.

| 미결 | 인터페이스 | 지금 붙어 있는 것 |
|---|---|---|
| SSO 연계 방식 | `auth/AuthenticationProvider` | `DevHeaderAuthenticationProvider` — 헤더를 그대로 믿는다 |
| LLM endpoint·인증 | `ai/LlmClient` | `HttpLlmClient`(설정 주입) / `StubLlmClient`(대역) |
| File Storage 종류 | `file/FileStorage` | `LocalFileStorage` — 디스크. NFS 마운트도 동작 |
| Redis 용도 | — | **쓰지 않는다.** Job 큐는 DB 테이블 + 폴링 워커 |

`canvas.llm.enabled=false` 면 AI 결과가 대역 응답이다. 전체 흐름(Job → 워커 → 결과 저장 → 조회)은
그대로 돌지만 내용은 자리채움이며, 결과에 그 사실이 드러나게 되어 있다.

## 패키지 구조

도메인 단위로 묶는다. 타입별(`controller/`, `service/`)로 나누지 않는다
([ARCHITECTURE.md](../docs/architecture/ARCHITECTURE.md) 10절).

```
com.nh.canvas
├── common          오류 체계 · 커서 페이지네이션 · 근거 대조 · JSON
├── auth            인증 어댑터 · 사용자 · GET /me
├── project         프로젝트 · 멤버 · 권한 판정(ProjectAccessGuard)
├── file            업로드/다운로드 · 저장소 인터페이스 · 위장 검사
├── template        Template = 디자인 시스템(BRAND_ASSET)
├── ai              LLM 어댑터 · Orchestrator · Job · 워커 · 처리기
├── screen          HTML 정제/식별자 부여/baking · 캔버스 · 요소 편집
├── comment         협업 의견 · 요소 앵커 · 스레드
├── review          AI 의견 취합(FR-07) · 반영 결정(FR-08)
├── responsibility  책임성 검토(FR-14)
├── usability       UX 리스크 검토(FR-15)
├── version         Version · 비교
├── history         History 기록·조회
├── export          Export Job · 워커
├── audit           감사 로그
└── dashboard       S01 집계
```

## 알아 둘 것

### 인가는 한 곳에서만 한다

`projectId` / `fileId` / `versionId` / `commentId` 를 URL 로 받는 모든 경로는
`ProjectAccessGuard` 를 지난다. **UUID PK 는 권한 검증의 대체재가 아니다.**
리소스 id 로 프로젝트를 거슬러 올라가는 메서드를 가드에 모아 둔 것은,
호출부마다 조인을 손으로 쓰면 한 곳만 빠뜨려도 IDOR 이 되기 때문이다.

권한은 `OWNER > EDITOR > REVIEWER > VIEWER` 4단계다
([08_DECISIONS](../개발문서/08_DECISIONS_OPEN_ISSUES.md) 1절).

### AI 가 만든 HTML 은 신뢰하지 않는다

`screen/HtmlPipeline` 이 저장 **전에** jsoup 으로 한 번 파싱하며 정제하고 `data-nh-id` 를 부여한다.
프로토타입의 parse5 파이프라인을 옮긴 것이며, 규칙은
[SECURITY_CHECKLIST 4절](../docs/guidelines/SECURITY_CHECKLIST.md)에 있다.
`HtmlPipelineTest` 가 그 규칙의 회귀 방지선이다.

### 편집은 저장본을 덮어쓰지 않는다 (baking)

요소 편집은 `element_patches` 에 쌓인다. 서버에서 화면 HTML 을 읽는 곳은
**전부 `ScreenBaker` 를 거쳐야 한다.** 저장본을 직접 읽으면 다운로드·AI 검토·버전 비교만
편집 이전 상태를 보게 되어 화면과 산출물이 갈린다.

### AI 지적은 근거가 없으면 저장하지 않는다

`common/EvidenceVerifier` 가 모델이 낸 인용을 원문과 글자 그대로 대조한다.
살아남은 것이 없으면 그 지적을 통째로 버리고, 몇 개를 버렸는지를 응답에 담는다.
검증 불가능한 카드가 한 장 섞이면 담당자는 나머지 카드까지 읽지 않는다.

### 규칙·렌즈의 정본은 문서다

`src/main/resources/rules/*.json` 은 프롬프트를 규칙에서 **생성**하기 위한 사본이다.
정본은 `docs/guidelines/RESPONSIBLE_DESIGN.md` 와 `docs/guidelines/USABILITY_REVIEW.md` 이며,
규칙을 바꿀 때는 양쪽을 함께 고친다.

### 아직 없는 것

- **Dockerfile / compose / 폐쇄망 반입 번들** — 다른 작업 갈래에서 다룬다.
- **PDF·PNG Export** — 렌더러가 필요하고 포맷 우선순위가 미결이다. 현재 지원은 ZIP(화면별 HTML) 하나.
- **통합 테스트** — 단위 테스트만 있다. 실 DB 를 띄운 수동 확인은 마쳤다.
