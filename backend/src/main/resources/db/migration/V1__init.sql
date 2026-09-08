-- NH 위드캔버스 운영 스키마 v1
-- 정본: 개발문서/05_API_DB_SPEC.md 3절
-- 원칙
--   * PK 는 UUID (순번 PK 는 IDOR 추측을 쉽게 한다 — SECURITY_CHECKLIST 3절 A01)
--   * 파일 바이너리는 넣지 않는다. File Storage 경로 메타데이터만 둔다 (ARCHITECTURE 7절)
--   * 상태값은 CHECK 제약으로 고정한다. 애플리케이션 enum 과 짝을 이룬다

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    sso_subject     TEXT        NOT NULL UNIQUE,   -- 사내 SSO 가 주는 불변 식별자
    login_id        TEXT        NOT NULL UNIQUE,
    name            TEXT        NOT NULL,
    department      TEXT,
    email           TEXT,
    status          TEXT        NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'DISABLED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ
);

CREATE TABLE projects (
    id               UUID PRIMARY KEY,
    name             TEXT        NOT NULL,
    purpose          TEXT,
    description      TEXT,
    status           TEXT        NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_by       UUID        NOT NULL REFERENCES users (id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_activity ON projects (last_activity_at DESC, id DESC);

-- 권한 모델: OWNER > EDITOR > REVIEWER > VIEWER (08_DECISIONS 1절, 2026-09-08 확정)
CREATE TABLE project_members (
    project_id      UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users (id),
    role            TEXT        NOT NULL
                    CHECK (role IN ('OWNER', 'EDITOR', 'REVIEWER', 'VIEWER')),
    added_by        UUID        REFERENCES users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);
CREATE INDEX idx_project_members_user ON project_members (user_id);

CREATE TABLE files (
    id              UUID PRIMARY KEY,
    project_id      UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    original_name   TEXT        NOT NULL,
    content_type    TEXT        NOT NULL,
    byte_size       BIGINT      NOT NULL,
    checksum_sha256 TEXT        NOT NULL,
    storage_key     TEXT        NOT NULL,   -- File Storage 안의 경로. 바이너리는 DB 밖에 있다
    kind            TEXT        NOT NULL DEFAULT 'REFERENCE'
                    CHECK (kind IN ('REFERENCE', 'GENERATED', 'EXPORT')),
    uploaded_by     UUID        NOT NULL REFERENCES users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_files_project ON files (project_id, created_at DESC, id DESC);

-- AI 호출에 어떤 자료를 넣었는지의 기록 (SECURITY 5절 "대상 자료를 사용자가 명시적으로 선택")
CREATE TABLE file_references (
    id              UUID PRIMARY KEY,
    file_id         UUID        NOT NULL REFERENCES files (id) ON DELETE CASCADE,
    ref_type        TEXT        NOT NULL CHECK (ref_type IN ('AI_JOB', 'VERSION', 'COMMENT')),
    ref_id          UUID        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_file_references_ref ON file_references (ref_type, ref_id);

CREATE TABLE templates (
    id              UUID PRIMARY KEY,
    code            TEXT        NOT NULL UNIQUE,
    name            TEXT        NOT NULL,
    description     TEXT,
    -- FR-13/FR-04: 문서 양식과 브랜드 자산(디자인 시스템 포함)을 구분한다 (05 8-1절)
    template_type   TEXT        NOT NULL CHECK (template_type IN ('DOCUMENT', 'BRAND_ASSET')),
    scope           TEXT        NOT NULL DEFAULT 'OFFICIAL' CHECK (scope IN ('OFFICIAL', 'PERSONAL')),
    owner_id        UUID        REFERENCES users (id),
    status          TEXT        NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_templates_type ON templates (template_type, status);

CREATE TABLE template_versions (
    id              UUID PRIMARY KEY,
    template_id     UUID        NOT NULL REFERENCES templates (id) ON DELETE CASCADE,
    version_no      INT         NOT NULL,
    payload         JSONB       NOT NULL,   -- 디자인 토큰 / 양식 구조 / 규격 프리셋
    created_by      UUID        REFERENCES users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (template_id, version_no)
);

CREATE TABLE versions (
    id                 UUID PRIMARY KEY,
    project_id         UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    parent_version_id  UUID        REFERENCES versions (id),
    version_no         INT         NOT NULL,
    source_type        TEXT        NOT NULL
                       CHECK (source_type IN ('AI_GENERATION', 'AI_REVISION', 'MANUAL_EDIT', 'IMPORT')),
    source_job_id      UUID,
    -- FR-04: 어떤 디자인 시스템으로 만든 결과물인가. 프로젝트가 아니라 Version 에 둔다 (05 9-2절)
    -- FK 로 묶지 않는 이유도 같은 절에 있다 (목록 정본이 아직 파일이다)
    design_system_id   UUID,
    -- 이 Version 을 만든 기획안 원문. FR-15 가 근거를 대조할 때 evidence_source='PROPOSAL' 의 원문이
    -- 되므로 어딘가에 남아 있어야 한다. 파일로 올린 참고자료와는 별개다
    proposal           TEXT,
    summary            TEXT,
    status             TEXT        NOT NULL DEFAULT 'DRAFT'
                       CHECK (status IN ('DRAFT', 'READY', 'SUPERSEDED')),
    created_by         UUID        NOT NULL REFERENCES users (id),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, version_no)
);
CREATE INDEX idx_versions_project ON versions (project_id, version_no DESC);

CREATE TABLE version_files (
    id              UUID PRIMARY KEY,
    version_id      UUID        NOT NULL REFERENCES versions (id) ON DELETE CASCADE,
    file_id         UUID        NOT NULL REFERENCES files (id),
    role            TEXT        NOT NULL DEFAULT 'OUTPUT' CHECK (role IN ('OUTPUT', 'SOURCE')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (version_id, file_id)
);

CREATE TABLE ai_jobs (
    id              UUID PRIMARY KEY,
    project_id      UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    job_type        TEXT        NOT NULL
                    CHECK (job_type IN ('DOC_DRAFT', 'SCREEN_MOCKUP', 'BRAND_CONCEPT', 'REVIEW_SUMMARY', 'EXPORT')),
    status          TEXT        NOT NULL DEFAULT 'REQUESTED'
                    CHECK (status IN ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    request_payload JSONB       NOT NULL,
    idempotency_key TEXT,
    model           TEXT,
    error_code      TEXT,
    error_message   TEXT,
    attempt_count   INT         NOT NULL DEFAULT 0,
    requested_by    UUID        NOT NULL REFERENCES users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    UNIQUE (project_id, idempotency_key)
);
CREATE INDEX idx_ai_jobs_status ON ai_jobs (status, created_at);
CREATE INDEX idx_ai_jobs_project ON ai_jobs (project_id, created_at DESC, id DESC);

CREATE TABLE ai_job_inputs (
    id              UUID PRIMARY KEY,
    job_id          UUID        NOT NULL REFERENCES ai_jobs (id) ON DELETE CASCADE,
    input_type      TEXT        NOT NULL CHECK (input_type IN ('FILE', 'TEMPLATE', 'TEXT', 'VERSION')),
    ref_id          UUID,
    text_value      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_job_inputs_job ON ai_job_inputs (job_id);

CREATE TABLE ai_job_outputs (
    id              UUID PRIMARY KEY,
    job_id          UUID        NOT NULL REFERENCES ai_jobs (id) ON DELETE CASCADE,
    -- FR-13: 시안 3안. 선택 전까지 Version 이 아니다 (05 8-3절)
    variant_no      INT         NOT NULL DEFAULT 1,
    variant_label   TEXT,
    output_type     TEXT        NOT NULL CHECK (output_type IN ('HTML', 'TEXT', 'JSON', 'FILE')),
    content         TEXT,
    file_id         UUID        REFERENCES files (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, variant_no, output_type)
);

-- 협업 디자인 캔버스 (05 3-1절)
CREATE TABLE screens (
    id              UUID PRIMARY KEY,
    version_id      UUID        NOT NULL REFERENCES versions (id) ON DELETE CASCADE,
    screen_key      TEXT        NOT NULL,
    name            TEXT        NOT NULL,
    role            TEXT,
    sort_order      INT         NOT NULL DEFAULT 0,
    html_content    TEXT,
    status          TEXT        NOT NULL DEFAULT 'PLANNED'
                    CHECK (status IN ('PLANNED', 'GENERATING', 'READY', 'FAILED')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (version_id, screen_key)
);
CREATE INDEX idx_screens_version ON screens (version_id, sort_order);

CREATE TABLE screen_elements (
    id              UUID PRIMARY KEY,
    screen_id       UUID        NOT NULL REFERENCES screens (id) ON DELETE CASCADE,
    nh_id           TEXT        NOT NULL,
    tag             TEXT        NOT NULL,
    doc_order       INT         NOT NULL,
    path_sig        TEXT        NOT NULL,
    text_sig        TEXT,
    UNIQUE (screen_id, nh_id)
);

CREATE TABLE element_patches (
    id              UUID PRIMARY KEY,
    screen_id       UUID        NOT NULL REFERENCES screens (id) ON DELETE CASCADE,
    nh_id           TEXT        NOT NULL,
    user_id         UUID        NOT NULL REFERENCES users (id),
    op              TEXT        NOT NULL CHECK (op IN ('setText', 'setStyle', 'setAttr', 'aiRewrite')),
    payload         JSONB       NOT NULL,
    reason          TEXT,
    source          TEXT        NOT NULL DEFAULT 'USER' CHECK (source IN ('USER', 'AI')),
    seq             BIGINT      NOT NULL,
    comment_id      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    reverted_at     TIMESTAMPTZ,
    UNIQUE (screen_id, seq)
);
CREATE INDEX idx_element_patches_screen ON element_patches (screen_id, seq);

CREATE TABLE comments (
    id              UUID PRIMARY KEY,
    project_id      UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    version_id      UUID        REFERENCES versions (id) ON DELETE CASCADE,
    screen_id       UUID        REFERENCES screens (id) ON DELETE CASCADE,
    parent_id       UUID        REFERENCES comments (id) ON DELETE CASCADE,
    nh_id           TEXT,
    anchor_status   TEXT        NOT NULL DEFAULT 'none'
                    CHECK (anchor_status IN ('none', 'anchored', 'orphaned')),
    body            TEXT        NOT NULL,
    author_id       UUID        NOT NULL REFERENCES users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_comments_project ON comments (project_id, created_at DESC, id DESC);
CREATE INDEX idx_comments_screen ON comments (screen_id, created_at);

ALTER TABLE element_patches
    ADD CONSTRAINT fk_element_patches_comment FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE SET NULL;

-- FR-07 AI 의견 취합 / FR-08 반영 결정
CREATE TABLE review_summaries (
    id              UUID PRIMARY KEY,
    project_id      UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    version_id      UUID        REFERENCES versions (id) ON DELETE CASCADE,
    job_id          UUID        REFERENCES ai_jobs (id),
    status          TEXT        NOT NULL DEFAULT 'RUNNING'
                    CHECK (status IN ('RUNNING', 'DONE', 'FAILED')),
    model           TEXT,
    error           TEXT,
    requested_by    UUID        NOT NULL REFERENCES users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ
);
CREATE INDEX idx_review_summaries_project ON review_summaries (project_id, created_at DESC);

CREATE TABLE review_items (
    id              UUID PRIMARY KEY,
    summary_id      UUID        NOT NULL REFERENCES review_summaries (id) ON DELETE CASCADE,
    -- FR-07: 합의 / 이견 / 추가확인
    category        TEXT        NOT NULL CHECK (category IN ('AGREED', 'CONFLICTED', 'NEEDS_INFO')),
    title           TEXT        NOT NULL,
    body            TEXT        NOT NULL,
    sort_order      INT         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_review_items_summary ON review_items (summary_id, sort_order);

-- 어떤 댓글이 이 항목의 근거인가. 근거 없는 항목은 저장 단계에서 버린다
CREATE TABLE review_item_comments (
    review_item_id  UUID        NOT NULL REFERENCES review_items (id) ON DELETE CASCADE,
    comment_id      UUID        NOT NULL REFERENCES comments (id) ON DELETE CASCADE,
    PRIMARY KEY (review_item_id, comment_id)
);

CREATE TABLE review_decisions (
    id                   UUID PRIMARY KEY,
    review_item_id       UUID        NOT NULL UNIQUE REFERENCES review_items (id) ON DELETE CASCADE,
    decision             TEXT        NOT NULL CHECK (decision IN ('ACCEPTED', 'DEFERRED', 'REJECTED')),
    reason               TEXT,
    decided_by           UUID        NOT NULL REFERENCES users (id),
    decided_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    resulting_version_id UUID        REFERENCES versions (id)
);

-- FR-14 책임성 검토
CREATE TABLE responsibility_reviews (
    id              UUID PRIMARY KEY,
    version_id      UUID        NOT NULL REFERENCES versions (id) ON DELETE CASCADE,
    status          TEXT        NOT NULL DEFAULT 'RUNNING'
                    CHECK (status IN ('RUNNING', 'DONE', 'FAILED')),
    model           TEXT,
    error           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ
);
CREATE INDEX idx_responsibility_reviews_version ON responsibility_reviews (version_id, created_at DESC);

CREATE TABLE responsibility_findings (
    id                      UUID PRIMARY KEY,
    review_id               UUID        NOT NULL REFERENCES responsibility_reviews (id) ON DELETE CASCADE,
    rule_id                 TEXT        NOT NULL,
    severity                TEXT        NOT NULL CHECK (severity IN ('HIGH', 'MEDIUM', 'LOW')),
    title                   TEXT        NOT NULL,
    evidence                TEXT        NOT NULL,   -- 목업에서 그대로 인용한 근거. 없으면 저장하지 않는다
    why                     TEXT,
    suggestion              TEXT,
    needs_compliance_review BOOLEAN     NOT NULL DEFAULT FALSE,
    decision                TEXT        CHECK (decision IN ('ACCEPTED', 'DEFERRED', 'REJECTED', 'COMPLIANCE_REQUESTED')),
    decision_by             UUID        REFERENCES users (id),
    decision_reason         TEXT,
    decided_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_responsibility_findings_review ON responsibility_findings (review_id);

-- FR-15 UX 리스크 검토 (05 3-3절)
CREATE TABLE usability_reviews (
    id              UUID PRIMARY KEY,
    version_id      UUID        NOT NULL REFERENCES versions (id) ON DELETE CASCADE,
    status          TEXT        NOT NULL DEFAULT 'RUNNING'
                    CHECK (status IN ('RUNNING', 'DONE', 'FAILED')),
    model           TEXT,
    error           TEXT,
    -- 수동 트리거라 누가 불렀는지가 의미를 갖는다. FR-14 와 다른 컬럼
    requested_by    UUID        NOT NULL REFERENCES users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ
);
CREATE INDEX idx_usability_reviews_version ON usability_reviews (version_id, created_at DESC);

CREATE TABLE usability_findings (
    id              UUID PRIMARY KEY,
    review_id       UUID        NOT NULL REFERENCES usability_reviews (id) ON DELETE CASCADE,
    lens_id         TEXT        NOT NULL,   -- UR-01 ~ UR-06
    severity        TEXT        NOT NULL CHECK (severity IN ('HIGH', 'MEDIUM', 'LOW')),
    title           TEXT        NOT NULL,
    evidence        TEXT        NOT NULL,   -- 원문 대조를 통과한 인용만 저장한다
    evidence_source TEXT        NOT NULL CHECK (evidence_source IN ('PROPOSAL', 'SCREEN', 'DISCUSSION')),
    why             TEXT,
    suggestion      TEXT,
    -- COMPLIANCE_REQUESTED 없음 — 준법 축은 FR-14 고유다
    decision        TEXT        CHECK (decision IN ('ACCEPTED', 'DEFERRED', 'REJECTED')),
    decision_by     UUID        REFERENCES users (id),
    decision_reason TEXT,
    decided_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_usability_findings_review ON usability_findings (review_id);

-- FR-10 History: 과정과 의사결정 기록 (Version 과 분리 — ARCHITECTURE 5절)
CREATE TABLE history_events (
    id              UUID PRIMARY KEY,
    project_id      UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    actor_type      TEXT        NOT NULL CHECK (actor_type IN ('USER', 'AI', 'SYSTEM')),
    actor_id        UUID,
    action_type     TEXT        NOT NULL,
    target_type     TEXT        NOT NULL,
    target_id       UUID,
    payload_summary JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_project ON history_events (project_id, created_at DESC, id DESC);

CREATE TABLE exports (
    id              UUID PRIMARY KEY,
    version_id      UUID        NOT NULL REFERENCES versions (id) ON DELETE CASCADE,
    format          TEXT        NOT NULL CHECK (format IN ('HTML', 'PDF', 'PNG', 'ZIP')),
    status          TEXT        NOT NULL DEFAULT 'REQUESTED'
                    CHECK (status IN ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    file_id         UUID        REFERENCES files (id),
    error_message   TEXT,
    requested_by    UUID        NOT NULL REFERENCES users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ
);
CREATE INDEX idx_exports_status ON exports (status, created_at);

-- FR-12 감사 추적. 보존 1년 이상 (SECURITY L-1)
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id        UUID,
    actor_login_id  TEXT,
    source_ip       TEXT,
    action          TEXT        NOT NULL,
    target_type     TEXT,
    target_id       UUID,
    project_id      UUID,
    outcome         TEXT        NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE')),
    detail          TEXT
);
CREATE INDEX idx_audit_logs_time ON audit_logs (occurred_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id, occurred_at DESC);
