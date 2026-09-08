# FR-05 AI 제작 v1.0

> **관련 문서**: [기능명세 인덱스](개발문서/기능명세/00_INDEX.md) | [PRD](개발문서/01_PRD.md) | [IA·화면](개발문서/03_IA_FUNCTION_SPEC.md) | [API/DB](개발문서/05_API_DB_SPEC.md)

## 1. 개요

사용자의 요청과 선택한 자료/Template을 LLM API에 전달하고 결과를 저장한다. (PRD 9절)
브라우저는 LLM을 직접 호출하지 않는다 — Frontend → Backend → AI Orchestrator → LLM API Gateway 경로만 사용한다(기획안 4-2절).

## 2. 동작 상세

- 사용자 요청 + 선택한 참고자료([FR-03](개발문서/기능명세/FR-03_참고자료.md)) + Template([FR-04](개발문서/기능명세/FR-04_템플릿.md))으로 AI 작업(Job)을 생성한다.
- 산출물 종류는 `ai_jobs.job_type`으로 구분한다: `DOC_DRAFT` / `SCREEN_MOCKUP` / `BRAND_CONCEPT`. 카드·홍보물 컨셉 시안(`BRAND_CONCEPT`)은 본 Job 구조를 그대로 재사용하며 별도 파이프라인을 두지 않는다 → [FR-13](개발문서/기능명세/FR-13_브랜드시안제작.md)
- **(2026-09-05) 화면 목업은 단일 산출물이 아니다.** `SCREEN_MOCKUP`은 서로 연결된 화면 여러 장을 만들 수 있고, 생성은 2단계로 나뉜다.
  1. **화면 흐름 설계** — 기획안을 읽고 화면 목록·역할·전환 관계만 만든다. HTML을 만들지 않으므로 짧고 빠르다.
  2. **화면별 생성** — 화면마다 따로 호출해 HTML을 만든다. 토큰 한도에 걸리지 않고, **실패한 화면만 재시도**할 수 있다.
- **(2026-09-08) 두 단계의 입력이 다르다.** 선택한 디자인 시스템(→ [FR-04](개발문서/기능명세/FR-04_템플릿.md))이 양쪽 컴텍스트로 들어가되 범위가 다르다.
  - 1단계(화면 흐름 설계): 표면(mobile/web)과 기준 폭만 받는다. 화면 목록만 만들므로 그 이상은 필요 없다.
  - 2단계(화면별 생성): 컬러·간격 **디자인 토큰 전체**와 그 시스템의 **완성 화면 예시 전체**를 받는다. 사용자가 참고할 화면을 고르지 않으며, 지금 만들 화면에 어느 예시가 가까운지는 모델이 판단한다.
  - 예시는 시스템 프롬프트에 들어가 `cache_control`로 캐시된다. 화면 N장을 만들어도 캐시 쓰기 1회 + 읽기 N-1회다.
  화면 간 이동은 생성 HTML의 `data-goto` 속성으로 표현하며 별도 테이블을 두지 않는다 → [05_API_DB_SPEC.md](../05_API_DB_SPEC.md) 3-1절
- **(2026-09-05) 요소 단위 재생성** — 결과물 전체가 아니라 사용자가 지목한 요소 하나만 다시 만들 수 있다. 그 요소의 outerHTML만 모델에 보내고, 결과는 정제 후 편집 패치로 쌓는다(원본 HTML 미변경). 이쪽에는 완성 화면 예시를 넣지 않는다 — 요소 하나를 고치는 데 화면 전장은 과하다.
- 장시간 작업은 **비동기 Job**으로 처리한다. 상태 전이: `REQUESTED → PROCESSING → COMPLETED / FAILED / CANCELLED` (03 상태 모델)
- 실패한 작업은 원인 요약과 재시도 옵션을 제공한다(retry API). LLM 오류는 502/504로 정규화된다.
- 중복 제출을 방지한다. (❓ idempotency 처리 방식 미결 — [결정/미결](개발문서/08_DECISIONS_OPEN_ISSUES.md))
- 완료된 결과는 프로젝트와 연결해 저장하고, Version 생성의 근거(`source_job_id`)가 된다 → [FR-09](개발문서/기능명세/FR-09_버전관리.md)
- 입력·출력은 `ai_job_inputs` / `ai_job_outputs`로 기록한다. (❓ Prompt·Response 원문 저장 허용 범위 미결 — 확정 전 원문 저장 금지)
- 프로토타입에서 검증된 생성 흐름: 사전 검증 → 생성 중 UI(버튼 비활성) → 멀티모달 호출(참조 이미지 스타일 반영) → 응답 후처리(코드펜스 제거) → 버전 채번 → 저장·즉시 표시 → 실패 시 인라인 오류 + 재활성화.
- AI 생성 HTML은 신뢰할 수 없는 입력으로 취급하고 샌드박스 iframe으로 격리 렌더링한다(보안 규칙 [SECURITY.md](docs/guidelines/SECURITY.md), ❓ 최종 정책 미결).

## 3. 관련 화면

| 화면 | 역할 |
|---|---|
| S03 Project Workspace | 우측 AI Chat, 중앙 생성 결과물 |
| S04 AI Chat | 입력 + 참고자료 선택 + Template 선택 + 작업 유형 선택 |

정본: [03_IA_FUNCTION_SPEC.md](개발문서/03_IA_FUNCTION_SPEC.md)

## 4. 관련 API

| Method | Path | 용도 |
|---|---|---|
| POST | `/api/v1/projects/{projectId}/ai/jobs` | Job 생성 |
| GET | `/api/v1/ai/jobs/{jobId}` | 상태 조회 |
| POST | `/api/v1/ai/jobs/{jobId}/retry` | 재시도 |
| POST | `/api/v1/ai/jobs/{jobId}/cancel` | 취소 — `REQUESTED`/`PROCESSING`에서만, `CANCELLED`로 전이 |

오류: 429(호출 제한), 502/504(LLM 연계). 정본: [05_API_DB_SPEC.md](개발문서/05_API_DB_SPEC.md)

## 5. US 매핑

| US | 요지 | 핵심 AC 요약 |
|---|---|---|
| US-020 | AI 초안 생성 | 요청/참고자료/Template 기준 작업 생성, 실패 시 상태·재시도 표시, 결과-프로젝트 연결 |
| US-021 | 비동기 AI 작업 | 4단 상태 보유, 실패 원인 요약 + 재시도, 중복 제출 방지 |

AC 전문 정본: [02_USER_STORIES_AC.md](개발문서/02_USER_STORIES_AC.md)

## 6. 구현 상태

| 단계 | 상태 | 근거 |
|---|---|---|
| 설계 | ✅ | PRD FR-05 · US-020/021 · `/ai/jobs` API · AI Orchestrator 계층 반영 |
| 프로토타입 검증 | 부분 | [MockupGen](MockupGen_기능명세서.md) PFR-04(생성 파이프라인), PFR-05(격리 뷰어). 단 프로토타입은 브라우저 직접 호출·동기 처리라 Orchestrator·비동기 Job은 미검증. ~~Template 연계 미검증~~ → **(2026-09-08) 디자인 시스템 토큰과 완성 화면 예시가 2단계 프롬프트로 들어가는 경로까지 연결됨**(FR-04). 생성 품질 대조는 미실시 |
| 운영 구현 | 🟡 백엔드 완료 | 2단계 생성(`plan-screens` → `screens/{id}/generate`)·요소 AI 편집·비동기 Job·워커·AI Orchestrator. **LLM endpoint 가 미확정이라 대역 응답으로 동작한다**(`LLM_ENABLED=false`). backend/ 구현 (2026-09-08). PostgreSQL 기동·API 호출까지 확인. 프론트엔드(Vue 3)는 미착수 — 티켓 BE-006·007 |
