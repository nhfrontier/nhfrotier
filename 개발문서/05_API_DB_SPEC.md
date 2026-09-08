# API / DB 초안 v1.0

## 1. API 기본 원칙
- REST API 기준
- `/api/v1` 버전 사용
- 사용자 인증은 사내 SSO 연계
- 서버 간 AI 호출은 내부 credential을 사용
- 장시간 작업은 Job 리소스로 비동기 처리
- 목록 API는 커서 기반 페이지네이션을 기본으로 한다 (`?cursor=&limit=`, limit 기본 20 · 최대 100). 무한 증가하는 리소스(history 등)의 전체 반환 금지 (2026-09-06 추가)
- 목록 화면에 필요한 집계는 목록 응답에 포함한다 — 프론트가 행마다 추가 호출하는 N+1 금지 (2026-09-06 추가)
- 비동기 Job 상태는 폴링으로 조회한다 (권장 주기 2~3초 — [04_SYSTEM_ARCHITECTURE.md](04_SYSTEM_ARCHITECTURE.md) 4절)
- 파일 다운로드는 Backend 경유 스트리밍이며 모든 다운로드는 감사 대상 이벤트다 (2026-09-06 추가)

## 2. 주요 API
### Auth
`GET /api/v1/me`

### Dashboard
`GET /api/v1/dashboard`  — S01 대시보드 집계를 1회 호출로 반환 (최근 프로젝트 · 나의 작업 · 검토 대기 · 최근 Version · 최근 활동). 화면 1개당 API 다중 호출 방지 (2026-09-06 추가)

### Project
`GET /api/v1/projects`  — 응답에 S02 목록 표시용 집계 포함 (멤버 수 · 미처리 검토 건수 · 마지막 활동)
`POST /api/v1/projects`
`GET /api/v1/projects/{projectId}`
`PATCH /api/v1/projects/{projectId}`
`POST /api/v1/projects/{projectId}/members`

### Files
`POST /api/v1/projects/{projectId}/files`
`GET /api/v1/projects/{projectId}/files`
`GET /api/v1/projects/{projectId}/files/{fileId}/content`  — 원본 다운로드, 스트리밍 (2026-09-06 추가)
`DELETE /api/v1/projects/{projectId}/files/{fileId}`

### Template
`GET /api/v1/templates`  — `?type=DOCUMENT|BRAND_ASSET`로 유형 필터
`GET /api/v1/templates/{templateId}`

### AI Job
`POST /api/v1/projects/{projectId}/ai/jobs`  — body의 `job_type`으로 산출물 종류를 구분 (8절)
`GET /api/v1/ai/jobs/{jobId}`  — `BRAND_CONCEPT` Job은 출력 3건을 함께 반환
`POST /api/v1/ai/jobs/{jobId}/retry`
`POST /api/v1/ai/jobs/{jobId}/cancel`  — `REQUESTED`/`PROCESSING`에서만 허용 → `CANCELLED` (03 상태 모델 대응, 2026-09-06 추가)

### Collaboration
`GET /api/v1/projects/{projectId}/comments`
`POST /api/v1/projects/{projectId}/comments`
`PATCH /api/v1/comments/{commentId}`

### AI Review
`POST /api/v1/projects/{projectId}/reviews/summarize`
`GET /api/v1/projects/{projectId}/reviews`
`POST /api/v1/reviews/{reviewId}/decisions`

### Responsibility Review (FR-14)
`POST /api/v1/versions/{versionId}/responsibility-review`  — 검토 실행. 이전 검토를 덮어쓰지 않고 새 이력을 만든다
`GET /api/v1/versions/{versionId}/responsibility-review`  — 최신 검토 + 지적 목록
`PATCH /api/v1/responsibility-findings/{findingId}`  — body의 `decision`은 `ACCEPTED` / `DEFERRED` / `REJECTED` / `COMPLIANCE_REQUESTED`

### Usability Review (FR-15)
`POST /api/v1/versions/{versionId}/usability-review`  — 검토 실행. **담당자 요청 시에만** 호출된다. body의 `userId`가 `requested_by`로 기록된다. 이전 검토를 덮어쓰지 않고 새 이력을 만든다
`GET /api/v1/versions/{versionId}/usability-review`  — 최신 검토 + 지적 목록
`PATCH /api/v1/usability-findings/{findingId}`  — body의 `decision`은 `ACCEPTED` / `DEFERRED` / `REJECTED` (`COMPLIANCE_REQUESTED` 없음 — 준법 축은 FR-14 고유)

입력이 전 화면 HTML + 의견 전문이라 요청 본문이 아닌 **서버가 DB에서 조립한다.** 총량이 상한을 넘으면 `413`으로 거부한다. 잘라내면 잘린 뒷부분의 문제를 못 봐서 결과가 조용히 틀린다.

### Version
`GET /api/v1/projects/{projectId}/versions`
`GET /api/v1/versions/{versionId}`
`GET /api/v1/versions/{versionId}/files/{fileId}/content`  — Version 산출물 다운로드 (2026-09-06 추가)
`GET /api/v1/versions/{versionId}/compare?baseVersionId=...`  — 비교는 화면(`screens`)·파일(`version_files`) 단위로 전/후를 짝지어 반환

### History
`GET /api/v1/projects/{projectId}/history`

### Export
`POST /api/v1/versions/{versionId}/exports`
`GET /api/v1/exports/{exportId}`  — 상태·메타데이터 조회
`GET /api/v1/exports/{exportId}/download`  — 완료된 결과 파일 다운로드, 감사 대상 (2026-09-06 추가)

## 3. 주요 DB
```text
users
projects
project_members
files
file_references
templates
template_versions
ai_jobs
ai_job_inputs
ai_job_outputs
comments
review_summaries
review_items
review_decisions
responsibility_reviews
responsibility_findings
usability_reviews  (2026-09-08 추가 — FR-15)
usability_findings  (2026-09-08 추가)
versions
version_files
history_events
exports
audit_logs
screens            (2026-09-05 추가 — 협업 디자인 캔버스)
screen_elements    (2026-09-05 추가)
element_patches    (2026-09-05 추가)
```

### 3-1. 협업 디자인 캔버스 (2026-09-05)

한 Version이 화면 여러 장을 갖고, 화면 안의 요소 단위로 메모·수정이 붙는다.
([03_IA_FUNCTION_SPEC.md](03_IA_FUNCTION_SPEC.md) S03)

| 테이블 | 주요 컬럼 | 목적 |
|---|---|---|
| `screens` | `version_id`, `screen_key`, `name`, `role`, `sort_order`, `html_content`, `status`, `error_message` | Version에 속한 화면 한 장. `status`로 화면별 생성 성공/실패를 따로 다뤄 실패한 화면만 재시도한다 |
| `screen_elements` | `screen_id`, `nh_id`, `tag`, `doc_order`, `path_sig`, `text_sig` | 요소 지문. 화면을 다시 만든 뒤 메모를 원래 자리에 다시 잇는 데 쓴다 |
| `element_patches` | `screen_id`, `nh_id`, `user_id`, `op`, `payload`, `reason`, `source`, `seq`, `reverted_at` | 요소 편집 이력. `op`은 `setText`/`setStyle`/`setAttr`/`aiRewrite`. **원본 HTML을 덮어쓰지 않는다** |

`comments` 확장: `screen_id`, `nh_id`, `anchor_status`(`none`/`anchored`/`orphaned`), `resolved_at`.
`anchor_status='none'`이 일반 의견이고, 요소를 지목한 의견은 `anchored`다. 재생성으로 앵커가 끊기면 삭제하지 않고 `orphaned`로 남겨 사람이 다시 붙일 수 있게 한다. ([FR-06](기능명세/FR-06_협업의견.md)의 "일반 의견과 특정 영역/요소에 대한 의견을 구분해 등록한다"가 여기서 실체를 얻는다)

**화면 간 이동 관계는 테이블로 두지 않는다.** 생성 HTML의 `data-goto="화면key"` 속성이 유일한 출처이며, 저장 시 존재하지 않는 화면을 가리키는 값은 제거된다. 별도 테이블을 두면 HTML과 어긋날 수 있고, 어긋나면 "눌러도 반응 없는 버튼"이 된다.

### 3-2. 캔버스 API (2026-09-05)

화면 생성은 **2단계**다. 한 번에 여러 화면의 HTML을 만들면 토큰 한도와 타임아웃에 걸리고, 어느 화면이 실패했는지도 보이지 않는다.

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/projects/{projectId}/plan-screens` | 1단계. 화면 목록·역할·전환 관계만 만든다. HTML은 만들지 않는다 |
| POST | `/screens/{screenId}/generate` | 2단계. 화면 한 장. 다시 호출하면 그대로 재시도 |
| POST | `/screens/{screenId}/patches` · DELETE `/patches/{patchId}` | 요소 편집 기록 / 되돌리기(soft revert) |
| POST | `/screens/{screenId}/ai-edit` | 선택한 요소만 AI가 재생성. 요소의 outerHTML만 보낸다 |
| GET/POST | `/screens/{screenId}/comments` | 요소 앵커 의견 |

팬아웃(화면별 호출)은 **클라이언트가 한다.** 서버가 한 요청에서 N개를 처리하면 타임아웃 위험이 커지고 부분 실패가 감춰진다.

### 3-3. UX 리스크 검토 (2026-09-08)

FR-14의 두 테이블과 구조가 같고 세 곳이 다르다. ([FR-15](기능명세/FR-15_UX리스크검토.md))

| 테이블 | 주요 컬럼 | 목적 |
|---|---|---|
| `usability_reviews` | `version_id`, `status`(`RUNNING`/`DONE`/`FAILED`), `model`, `error`, `requested_by` | 검토 1회 실행. **`requested_by`가 FR-14와 다른 컬럼** — 수동 트리거라 누가 불렀는지가 의미를 갖는다 |
| `usability_findings` | `review_id`, `lens_id`, `severity`, `title`, `evidence`, `evidence_source`, `why`, `suggestion`, `decision`, `decision_by`, `decision_reason`, `decided_at` | 지적 한 건. `lens_id`는 `UR-01`~`UR-06` |

- `evidence_source`는 `PROPOSAL` / `SCREEN` / `DISCUSSION` 중 하나다. 근거가 기획안·화면·의견 중 어디서 왔는지가 담당자의 판단 재료다.
- `evidence`에는 **원문 대조를 통과한 인용만** 저장한다. 모델이 낸 인용 조각을 기획안 + 전 화면 HTML + 전 의견 본문과 부분문자열로 대조하고, 살아남은 것이 없으면 그 지적을 저장하지 않는다.
- `needs_compliance_review` / `COMPLIANCE_REQUESTED`는 **두지 않는다.** 준법 축은 FR-14의 몫이다.
- **`comments` 테이블은 건드리지 않는다.** AI 지적을 사람 댓글 행으로 넣으면 근거·심각도·결정 필드를 붙여야 하고, 삭제·해결 토글의 의미가 사람 댓글과 달라져 스키마가 탁해진다. 화면에서만 시간순으로 합쳐 보여준다.

## 4. 핵심 관계
```text
USER 1:N PROJECT_MEMBER N:1 PROJECT
PROJECT 1:N FILE
PROJECT 1:N AI_JOB
PROJECT 1:N COMMENT
VERSION 1:N RESPONSIBILITY_REVIEW 1:N RESPONSIBILITY_FINDING
VERSION 1:N USABILITY_REVIEW 1:N USABILITY_FINDING
PROJECT 1:N VERSION
PROJECT 1:N HISTORY_EVENT
VERSION 1:N VERSION_FILE
COMMENT 1:N REVIEW_ITEM
REVIEW_ITEM 1:1 REVIEW_DECISION
AI_JOB 1:N AI_JOB_INPUT/OUTPUT
TEMPLATE 1:N TEMPLATE_VERSION
```

## 5. Version 모델
Version은 결과물의 논리적 스냅샷이다.
- version_id
- project_id
- parent_version_id
- version_no
- source_type(AI_GENERATION, AI_REVISION, MANUAL_EDIT, IMPORT)
- source_job_id
- created_by
- created_at
- summary
- status

## 6. History 모델
History는 과정과 의사결정 기록이다.
- history_id
- project_id
- actor_type(USER, AI, SYSTEM)
- actor_id
- action_type
- target_type
- target_id
- payload_summary
- created_at

## 7. API 오류 원칙
- 400 입력 오류
- 401 인증 필요
- 403 권한 없음
- 404 대상 없음
- 409 Version/동시성 충돌
- 413 파일 용량 초과
- 422 업무 규칙 위반
- 429 AI 호출 제한
- 500 서버 오류
- 502/504 LLM/외부 연계 오류

## 8. 산출물 유형 확장 (FR-13 브랜드 시안)

카드 실물·홍보물 컨셉 시안을 위해 **새 테이블과 새 엔드포인트를 만들지 않는다.** 기존 리소스에 구분 필드만 둔다. 근거: [FR-13](개발문서/기능명세/FR-13_브랜드시안제작.md)

### 8-1. 추가 필드

| 테이블 | 필드 | 값 | 용도 |
|---|---|---|---|
| `templates` | `template_type` | `DOCUMENT` / `BRAND_ASSET` | 문서 양식과 브랜드 자산(로고·컬러 토큰·서체 규칙·규격 프리셋)을 구분 |
| `ai_jobs` | `job_type` | `DOC_DRAFT` / `SCREEN_MOCKUP` / `BRAND_CONCEPT` | 산출물 종류별 프롬프트·후처리 분기 |
| `ai_job_outputs` | `variant_no` | 1 · 2 · 3 | 한 Job이 만든 시안 3안의 구분 |
| `ai_job_outputs` | `variant_label` | 텍스트 | 방향 설명 (예: "정통·신뢰형") |

### 8-2. 규격 프리셋

프리셋은 코드가 아니라 `templates`(`BRAND_ASSET`) 데이터로 관리한다. 유형 추가 시 코드를 고치지 않는다.

| 프리셋 ID | 비율 |
|---|---|
| `CARD_H` | 1.586 : 1 |
| `CARD_V` | 1 : 1.586 |
| `POSTER_A` | 1 : 1.414 |
| `BANNER_SQ` | 1 : 1 |

### 8-3. Version 생성 시점

`BRAND_CONCEPT` Job이 완료돼도 **Version은 생성되지 않는다.** 3안은 `ai_job_outputs`에만 남는 후보다.
사용자가 하나를 선택할 때 `versions` 1행이 생성되며 `source_type = AI_GENERATION`, `source_job_id`로 Job과 연결된다. 선택되지 않은 시안은 Version이 되지 않는다.

---

## 9. 디자인 시스템 선택 (FR-04)

산출물이 어떤 디자인으로 만들어질지는 **생성 시점에 사용자가 고른다.** 근거: [FR-04](개발문서/기능명세/FR-04_템플릿.md)

### 9-1. 운영 스펙 — 새 리소스를 만들지 않는다

디자인 시스템은 `templates` 의 `template_type = BRAND_ASSET` 레코드다. 별도 테이블·엔드포인트를 두지 않는다.

| Method | Path | 용도 |
|---|---|---|
| GET | `/api/v1/templates?type=BRAND_ASSET` | 선택 가능한 디자인 시스템 목록 |

### 9-2. 추가 필드

| 테이블 | 필드 | 값 | 용도 |
|---|---|---|---|
| `versions` | `design_system_id` | `templates.id` (`BRAND_ASSET`) 참조. NULL 허용 | **어떤 디자인 시스템으로 만든 결과물인가.** 재생성·요소 편집이 같은 시스템을 쓰도록 하고, 버전 비교 시 디자인 축을 고정한다 |

- 프로젝트가 아니라 **Version에 둔다.** 같은 프로젝트에서 v1은 모바일, v2는 웹으로 만들 수 있어야 하기 때문이다.
- NULL 은 "선택 이전에 만들어진 결과물"이다. 값이 없으면 화면에 배지를 그리지 않는다.
- 값 검증은 애플리케이션에서 한다. FK 제약으로 묶지 않는 이유는 프로토타입 단계에서 목록 정본이 DB가 아니라 파일(`design-systems/registry.json`)이기 때문이다. 운영에서 `templates` 로 흡수되면 FK 로 전환한다.

### 9-3. 프로토타입 대응

| 프로토타입 (`mockup/`) | 운영 스펙 |
|---|---|
| `GET /api/design-systems` | `GET /api/v1/templates?type=BRAND_ASSET` |
| `design-systems/registry.json` (파일) | `templates` 테이블 (`template_type = BRAND_ASSET`) |
| `mockup_versions.design_system_id` | `versions.design_system_id` |

프로토타입은 파일을 목록 정본으로 쓴다. 반입할 NH 실제 자산의 관리 주체가 미결이라 등록·수정 화면을 만들 근거가 없기 때문이다 — [08_DECISIONS_OPEN_ISSUES.md](개발문서/08_DECISIONS_OPEN_ISSUES.md)
