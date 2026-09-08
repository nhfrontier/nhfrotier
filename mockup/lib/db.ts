import { createClient, type Client, type InValue, type Transaction } from '@libsql/client';
import path from 'path';
import fs from 'fs';

/**
 * libSQL(Turso) 클라이언트.
 *
 * SQL 방언이 SQLite와 같아 **쿼리 문자열은 한 글자도 바뀌지 않았다.** 달라진 것은 호출이
 * async가 된 것뿐이다. better-sqlite3에서 옮겨온 이유는 Vercel serverless가 파일시스템에
 * 쓸 수 없기 때문이다. 자세한 내용은 docs/architecture/TECH_STACK.md 참고.
 *
 * - TURSO_DATABASE_URL이 있으면 원격(배포)
 * - 없으면 data/mockup.db 로컬 파일(개발) — Turso 계정 없이도 개발이 돌아간다
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'mockup.db');

/** better-sqlite3의 prepare().get/all/run 모양을 그대로 유지한 async 어댑터. */
export interface Stmt {
  get(...args: unknown[]): Promise<unknown>;
  all(...args: unknown[]): Promise<unknown[]>;
  run(...args: unknown[]): Promise<{ changes: number }>;
}

export interface Db {
  prepare(sql: string): Stmt;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
}

type Executor = Pick<Client, 'execute' | 'executeMultiple'>;

/**
 * better-sqlite3는 undefined와 boolean을 던지면 예외를 냈으므로 호출부에 그런 값은 없다.
 * 그래도 넘어오면 조용히 깨지는 대신 SQLite가 쓰던 표현으로 맞춰 둔다.
 */
function toArgs(args: unknown[]): InValue[] {
  return args.map((a) => {
    if (a === undefined) return null;
    if (typeof a === 'boolean') return a ? 1 : 0;
    return a as InValue;
  });
}

function makeDb(ex: Executor, client: Client | null): Db {
  return {
    prepare(sql: string): Stmt {
      return {
        async get(...args: unknown[]) {
          return (await ex.execute({ sql, args: toArgs(args) })).rows[0];
        },
        async all(...args: unknown[]) {
          return (await ex.execute({ sql, args: toArgs(args) })).rows;
        },
        async run(...args: unknown[]) {
          const result = await ex.execute({ sql, args: toArgs(args) });
          return { changes: result.rowsAffected };
        },
      };
    },

    async exec(sql: string) {
      await ex.executeMultiple(sql);
    },

    async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
      if (!client) throw new Error('중첩 트랜잭션은 지원하지 않습니다.');
      const tx: Transaction = await client.transaction('write');
      try {
        const result = await fn(makeDb(tx, null));
        await tx.commit();
        return result;
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally {
        tx.close();
      }
    },
  };
}

let dbPromise: Promise<Db> | null = null;

/**
 * 최초 호출에서 접속과 마이그레이션을 끝낸다. 같은 promise를 공유하므로
 * 동시 요청이 마이그레이션을 두 번 돌리지 않는다. 실패하면 다음 호출에서 다시 시도한다.
 */
export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = init().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

async function init(): Promise<Db> {
  const url = process.env.TURSO_DATABASE_URL;
  let client: Client;

  if (url) {
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  } else {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    client = createClient({ url: `file:${DB_PATH}` });
  }

  // libSQL은 외래키가 기본 ON이다. 꺼져 있으면 ON DELETE CASCADE가 조용히 무시되므로 확인만 한다.
  const fk = await client.execute('PRAGMA foreign_keys');
  if (Number((fk.rows[0] as Record<string, unknown>)?.foreign_keys) !== 1) {
    console.warn('[db] foreign_keys가 꺼져 있습니다. CASCADE 삭제가 동작하지 않습니다.');
  }

  const db = makeDb(client, client);
  await migrate(client, db);
  return db;
}

const SCHEMA_V1 = `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reference_screens (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      image_data TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'image/png',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mockup_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      proposal_content TEXT NOT NULL,
      html_content TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      color TEXT NOT NULL DEFAULT 'indigo',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      mockup_version_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (mockup_version_id) REFERENCES mockup_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS responsibility_reviews (
      id TEXT PRIMARY KEY,
      mockup_version_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'RUNNING',
      model TEXT,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (mockup_version_id) REFERENCES mockup_versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS responsibility_findings (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      evidence TEXT NOT NULL,
      why TEXT NOT NULL,
      suggestion TEXT NOT NULL,
      needs_compliance_review INTEGER NOT NULL DEFAULT 0,
      decision TEXT,
      decision_by TEXT,
      decision_reason TEXT,
      decided_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (review_id) REFERENCES responsibility_reviews(id) ON DELETE CASCADE,
      FOREIGN KEY (decision_by) REFERENCES users(id) ON DELETE SET NULL
    );
`;

/**
 * PRAGMA user_version 기반 순차 마이그레이션.
 * 배열 인덱스 i를 적용하면 user_version이 i+1이 된다.
 * 기존 DB는 user_version이 0이라 v1이 다시 실행되지만 전부 IF NOT EXISTS라 멱등이다.
 * 각 단계는 새 테이블 추가·ADD COLUMN 같은 가산적 변경만 담는다.
 * 테이블 재구축은 foreign_keys=ON과 충돌하므로 이 러너에 넣지 않는다.
 */
/**
 * 협업 디자인 캔버스.
 * 화면(screens) · 요소 지문(screen_elements) · 편집 패치(element_patches)를 추가하고
 * comments에 요소 앵커를 붙인다. mockup_versions는 건드리지 않는다 —
 * html_content는 sort_order=0 화면의 HTML로 계속 채워져 기존 조회·다운로드가 그대로 동작한다.
 */
const SCHEMA_V2 = `
    CREATE TABLE IF NOT EXISTS screens (
      id TEXT PRIMARY KEY,
      mockup_version_id TEXT NOT NULL,
      screen_key TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      html_content TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (mockup_version_id) REFERENCES mockup_versions(id) ON DELETE CASCADE,
      UNIQUE(mockup_version_id, screen_key)
    );

    CREATE TABLE IF NOT EXISTS screen_elements (
      id TEXT PRIMARY KEY,
      screen_id TEXT NOT NULL,
      nh_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      doc_order INTEGER NOT NULL,
      path_sig TEXT NOT NULL,
      text_sig TEXT,
      FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE,
      UNIQUE(screen_id, nh_id)
    );

    CREATE TABLE IF NOT EXISTS element_patches (
      id TEXT PRIMARY KEY,
      screen_id TEXT NOT NULL,
      nh_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      op TEXT NOT NULL,
      payload TEXT NOT NULL,
      reason TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      seq INTEGER NOT NULL,
      reverted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(screen_id, seq)
    );

    CREATE INDEX IF NOT EXISTS idx_patches_screen_seq ON element_patches(screen_id, seq);
    CREATE INDEX IF NOT EXISTS idx_screens_version ON screens(mockup_version_id, sort_order);
`;

/**
 * comments 확장은 ADD COLUMN이라 IF NOT EXISTS가 없다.
 * 이미 있는 컬럼이면 조용히 넘어간다 — 러너가 멱등해야 하기 때문이다.
 * REFERENCES 절은 일부러 붙이지 않는다: foreign_keys=ON 상태의 ADD COLUMN에 제약이 있어
 * 관계는 코드에서 강제한다.
 */
async function columnNames(db: Db, table: string): Promise<Set<string>> {
  const rows = (await db.prepare(`PRAGMA table_info(${table})`).all()) as Array<{ name: string }>;
  return new Set(rows.map((c) => c.name));
}

async function addCommentAnchorColumns(db: Db) {
  const existing = await columnNames(db, 'comments');
  const columns: Array<[string, string]> = [
    ['screen_id', 'TEXT'],
    ['nh_id', 'TEXT'],
    ['anchor_status', "TEXT NOT NULL DEFAULT 'none'"],
    ['resolved_at', 'TEXT'],
  ];
  for (const [name, type] of columns) {
    if (!existing.has(name)) await db.exec(`ALTER TABLE comments ADD COLUMN ${name} ${type}`);
  }
}

/**
 * UX 리스크 검토 (FR-15).
 * responsibility_* 두 테이블과 구조가 같고 세 곳이 다르다 —
 * 수동 트리거라 requested_by를 남기고, 근거의 출처(evidence_source)를 기록하며,
 * 준법 축이 없으므로 needs_compliance_review와 COMPLIANCE_REQUESTED를 두지 않는다.
 * comments 테이블은 건드리지 않는다: AI 지적을 사람 댓글 행으로 넣으면
 * 삭제·해결 토글의 의미가 달라진다. 합치는 것은 화면에서만 한다.
 */
const SCHEMA_V4 = `
    CREATE TABLE IF NOT EXISTS usability_reviews (
      id TEXT PRIMARY KEY,
      mockup_version_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'RUNNING',
      model TEXT,
      error TEXT,
      requested_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (mockup_version_id) REFERENCES mockup_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS usability_findings (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      lens_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      evidence TEXT NOT NULL,
      evidence_source TEXT NOT NULL,
      why TEXT NOT NULL,
      suggestion TEXT NOT NULL,
      decision TEXT,
      decision_by TEXT,
      decision_reason TEXT,
      decided_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (review_id) REFERENCES usability_reviews(id) ON DELETE CASCADE,
      FOREIGN KEY (decision_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_usability_reviews_version
      ON usability_reviews(mockup_version_id, created_at);
`;

/**
 * 어떤 디자인 시스템으로 만든 버전인지 남긴다 (FR-04).
 * design-systems/registry.json의 id를 담는다. 값 검증은 코드에서 한다 —
 * 레지스트리는 파일이라 DB 제약으로 묶으면 시스템을 추가할 때마다 마이그레이션이 필요해진다.
 */
async function addMockupVersionDesignSystemColumn(db: Db) {
  const existing = await columnNames(db, 'mockup_versions');
  if (!existing.has('design_system_id')) {
    await db.exec('ALTER TABLE mockup_versions ADD COLUMN design_system_id TEXT');
  }
}

/**
 * 의견 스레드와, 그 의견이 부른 편집을 잇는 두 컬럼 (FR-06).
 *
 * - `comments.parent_id` — 답글. 답글은 **자기 앵커를 갖지 않는다.**
 *   스레드가 가리키는 요소는 뿌리 의견의 것이고, 핀도 뿌리에만 붙는다.
 *   답글마다 앵커를 주면 같은 요소에 핀이 여러 개 겹친다.
 * - `element_patches.comment_id` — 이 편집을 부른 의견.
 *
 * AI의 답을 `comments` 행으로 만들지 않는 이유는 ARCHITECTURE.md 12절과 같다:
 * 사람 댓글 테이블에 AI용 필드를 붙이면 삭제·해결 토글의 의미가 달라진다.
 * 그런데 여기서는 별도 테이블도 필요 없다 — **AI의 답이 곧 패치**다.
 * `element_patches`에 이미 reason(요청 문구)·source·payload·reverted_at이 있으므로
 * 어느 의견이 그것을 불렀는지만 이어주면 화면에서 스레드로 합칠 수 있다.
 * 저장은 분리된 채로 두고 합치는 것은 화면에서만 한다.
 *
 * ADD COLUMN이라 IF NOT EXISTS가 없다. 러너가 멱등해야 하므로 직접 확인한다.
 * REFERENCES 절은 붙이지 않는다 — foreign_keys=ON 상태의 ADD COLUMN 제약.
 */
async function addThreadColumns(db: Db) {
  const commentCols = await columnNames(db, 'comments');
  if (!commentCols.has('parent_id')) {
    await db.exec('ALTER TABLE comments ADD COLUMN parent_id TEXT');
  }

  const patchCols = await columnNames(db, 'element_patches');
  if (!patchCols.has('comment_id')) {
    await db.exec('ALTER TABLE element_patches ADD COLUMN comment_id TEXT');
  }
}

/**
 * 새 단계는 반드시 **배열 끝에 덧붙인다.** 중간에 끼워 넣으면 인덱스가 밀려,
 * 이미 그 자리를 지나간 DB가 새 단계를 건너뛴 채 버전만 올라간다.
 */
const MIGRATIONS: Array<(db: Db) => Promise<void>> = [
  (db) => db.exec(SCHEMA_V1),
  async (db) => {
    await db.exec(SCHEMA_V2);
    await addCommentAnchorColumns(db);
  },
  addMockupVersionDesignSystemColumn,
  (db) => db.exec(SCHEMA_V4),
  addThreadColumns,
];

/**
 * better-sqlite3 시절과 달리 각 단계를 트랜잭션으로 감싸지 않는다 —
 * libSQL에서 여러 문장(executeMultiple)을 트랜잭션 안에서 돌리는 것이 보장되지 않기 때문이다.
 * 대신 위 단계들은 전부 멱등이어야 한다(IF NOT EXISTS · 컬럼 존재 확인).
 * 중간에 실패해도 user_version이 오르지 않으므로 다음 기동에서 같은 단계를 다시 실행한다.
 */
async function migrate(client: Client, db: Db) {
  const row = (await db.prepare('PRAGMA user_version').get()) as { user_version: number } | undefined;
  const current = Number(row?.user_version ?? 0);
  for (let v = current; v < MIGRATIONS.length; v += 1) {
    await MIGRATIONS[v](db);
    await client.execute(`PRAGMA user_version = ${v + 1}`);
  }
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ReferenceScreen {
  id: string;
  project_id: string;
  name: string;
  image_data: string;
  mime_type: string;
  created_at: string;
}

export interface MockupVersion {
  id: string;
  project_id: string;
  version: number;
  proposal_content: string;
  html_content: string;
  description: string | null;
  created_at: string;
  /** design-systems/registry.json의 id. 옛 버전 행은 null이다. */
  design_system_id: string | null;
}

export interface User {
  id: string;
  name: string;
  role: string;
  color: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_name?: string;
  user_color?: string;
  user_role?: string;
}

/** 'none' = 요소를 지목하지 않은 일반 의견. 'orphaned' = 재생성으로 앵커가 끊긴 상태. */
export type AnchorStatus = 'none' | 'anchored' | 'orphaned';

export interface Comment {
  id: string;
  mockup_version_id: string;
  user_id: string;
  content: string;
  created_at: string;
  screen_id: string | null;
  nh_id: string | null;
  anchor_status: AnchorStatus;
  resolved_at: string | null;
  /** 답글이면 뿌리 의견의 id. 답글은 자기 앵커를 갖지 않는다 — 핀은 뿌리에만 붙는다. */
  parent_id: string | null;
  user_name?: string;
  user_color?: string;
}

export type ScreenStatus = 'pending' | 'generating' | 'ready' | 'failed';

export interface Screen {
  id: string;
  mockup_version_id: string;
  /** data-goto가 가리키는 값. 한 버전 안에서 유일하다. */
  screen_key: string;
  name: string;
  role: string | null;
  sort_order: number;
  /** 정제 + data-nh-id 부여를 마친 HTML. 미생성이면 null. 런타임 스크립트는 포함하지 않는다. */
  html_content: string | null;
  status: ScreenStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenElement {
  id: string;
  screen_id: string;
  nh_id: string;
  tag: string;
  doc_order: number;
  path_sig: string;
  text_sig: string | null;
}

/** aiRewrite는 선택한 요소만 AI가 다시 만든 결과다. */
export type PatchOpKind = 'setText' | 'setStyle' | 'setAttr' | 'aiRewrite';

export interface ElementPatch {
  id: string;
  screen_id: string;
  nh_id: string;
  user_id: string;
  op: PatchOpKind;
  /** JSON 문자열. op에 따라 형태가 다르다. */
  payload: string;
  reason: string | null;
  source: 'manual' | 'ai';
  seq: number;
  reverted_at: string | null;
  created_at: string;
  /** 이 편집을 부른 의견. 스레드 안에 결과 카드로 끼워 넣을 때 쓴다. */
  comment_id: string | null;
  user_name?: string;
  user_color?: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_color?: string;
}

export type ReviewStatus = 'RUNNING' | 'DONE' | 'FAILED';

/** 반영 / 보류 / 반려 / 준법 검토 요청 */
export type FindingDecision = 'ACCEPTED' | 'DEFERRED' | 'REJECTED' | 'COMPLIANCE_REQUESTED';

export interface ResponsibilityReview {
  id: string;
  mockup_version_id: string;
  status: ReviewStatus;
  model: string | null;
  error: string | null;
  created_at: string;
}

/** 반영 / 보류 / 반려 — FR-15에는 준법 검토 요청이 없다 */
export type UsabilityDecision = 'ACCEPTED' | 'DEFERRED' | 'REJECTED';

export interface UsabilityReview {
  id: string;
  mockup_version_id: string;
  status: ReviewStatus;
  model: string | null;
  error: string | null;
  /** 수동 트리거라 누가 불렀는지가 의미를 갖는다 */
  requested_by: string | null;
  created_at: string;
}

export interface UsabilityFindingRow {
  id: string;
  review_id: string;
  lens_id: string;
  severity: string;
  title: string;
  /** 원문 대조를 통과한 인용만 담긴다 */
  evidence: string;
  evidence_source: string;
  why: string;
  suggestion: string;
  decision: UsabilityDecision | null;
  decision_by: string | null;
  decision_reason: string | null;
  decided_at: string | null;
  created_at: string;
  decided_by_name?: string;
  decided_by_color?: string;
}

export interface ResponsibilityFindingRow {
  id: string;
  review_id: string;
  rule_id: string;
  category: string;
  severity: string;
  title: string;
  evidence: string;
  why: string;
  suggestion: string;
  needs_compliance_review: number;
  decision: FindingDecision | null;
  decision_by: string | null;
  decision_reason: string | null;
  decided_at: string | null;
  created_at: string;
  decided_by_name?: string;
  decided_by_color?: string;
}
