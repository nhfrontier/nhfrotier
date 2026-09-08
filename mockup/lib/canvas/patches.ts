import type { Database } from 'better-sqlite3';
import { EDITABLE_ATTRS, EDITABLE_STYLE_PROPS, type PatchOp } from './protocol';
import { applyPatchesToHtml } from './htmlPipeline';
import type { ElementPatch } from '../db';

/** 되돌리지 않은 패치만, 적용 순서대로. */
export function listActivePatches(db: Database, screenId: string): ElementPatch[] {
  return db
    .prepare(
      `SELECT p.*, u.name as user_name, u.color as user_color
         FROM element_patches p
         JOIN users u ON p.user_id = u.id
        WHERE p.screen_id = ? AND p.reverted_at IS NULL
        ORDER BY p.seq ASC`
    )
    .all(screenId) as ElementPatch[];
}

/**
 * DB 행을 프레임에 보낼 연산으로 바꾼다.
 * 화이트리스트를 여기서 한 번 더 확인한다 — DB에 어떤 값이 들어 있든
 * 프레임으로 나가는 것은 허용된 속성뿐이어야 한다.
 */
export function toPatchOps(rows: ElementPatch[]): PatchOp[] {
  const ops: PatchOp[] = [];

  for (const row of rows) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(row.payload) as Record<string, unknown>;
    } catch {
      continue;
    }

    if (row.op === 'setText' && typeof payload.value === 'string') {
      ops.push({ nhId: row.nh_id, kind: 'text', value: payload.value });
      continue;
    }
    if (row.op === 'setStyle') {
      const prop = payload.prop as (typeof EDITABLE_STYLE_PROPS)[number];
      if (EDITABLE_STYLE_PROPS.includes(prop) && typeof payload.value === 'string') {
        ops.push({ nhId: row.nh_id, kind: 'style', prop, value: payload.value });
      }
      continue;
    }
    if (row.op === 'setAttr') {
      const name = payload.name as (typeof EDITABLE_ATTRS)[number];
      if (EDITABLE_ATTRS.includes(name) && typeof payload.value === 'string') {
        ops.push({ nhId: row.nh_id, kind: 'attr', name, value: payload.value });
      }
      continue;
    }
    if (row.op === 'aiRewrite' && typeof payload.html === 'string') {
      ops.push({ nhId: row.nh_id, kind: 'replace', html: payload.html });
    }
  }

  return ops;
}

/**
 * 한 목업 버전의 모든 편집을 되돌린 것까지 포함해 시간순으로 돌려준다.
 * 두 곳이 이걸 쓴다 — 의견 스레드 안의 "AI가 반영했습니다" 카드(comment_id로 걸러서),
 * 그리고 편집 이력 목록. 되돌린 것을 빼지 않는 이유는 이력이 그것도 보여줘야 하기 때문이다.
 * (프레임에 적용할 연산만 필요하면 listActivePatches를 쓴다.)
 */
export function listVersionPatches(db: Database, mockupVersionId: string): ElementPatch[] {
  return db
    .prepare(
      `SELECT p.*, u.name as user_name, u.color as user_color, s.screen_key
         FROM element_patches p
         JOIN users u ON p.user_id = u.id
         JOIN screens s ON p.screen_id = s.id
        WHERE s.mockup_version_id = ?
        ORDER BY p.created_at ASC, p.seq ASC`
    )
    .all(mockupVersionId) as ElementPatch[];
}

/**
 * 화면 하나의 "지금 보이는 그대로"의 HTML.
 *
 * 저장본(`screens.html_content`)에 활성 편집을 얹은 사본을 만든다. 저장본은 건드리지 않는다 —
 * 편집이 patch로 쌓이는 구조 자체가 "누가 왜 바꿨는지"를 남기기 위한 것이기 때문이다.
 *
 * **서버에서 화면 HTML을 읽는 곳은 전부 이 함수를 거쳐야 한다.** 저장본을 직접 읽으면
 * 편집 이전 상태를 보게 되고, 화면에 보이는 것과 다운로드·검토 결과가 어긋난다.
 */
export function bakeScreenHtml(db: Database, screenId: string, storedHtml: string): string {
  const ops = toPatchOps(listActivePatches(db, screenId));
  return applyPatchesToHtml(storedHtml, ops).html;
}

export interface PatchInput {
  screenId: string;
  nhId: string;
  userId: string;
  op: ElementPatch['op'];
  payload: Record<string, unknown>;
  reason?: string | null;
  source?: 'manual' | 'ai';
  /** 이 편집을 부른 의견. 스레드에 결과를 되돌려 붙이기 위한 것이며 없어도 된다. */
  commentId?: string | null;
}

/**
 * 요청 payload가 허용된 형태인지 검사한다.
 * 통과하지 못하면 사람이 읽을 수 있는 이유를 돌려준다.
 */
export function validatePatch(input: PatchInput): string | null {
  const { op, payload } = input;

  if (op === 'setText' || op === 'setStyle' || op === 'setAttr') {
    if (typeof payload.value !== 'string') return '값이 없습니다.';
  }
  if (op === 'setStyle') {
    if (!EDITABLE_STYLE_PROPS.includes(payload.prop as never)) {
      return `편집할 수 없는 스타일 속성입니다: ${String(payload.prop)}`;
    }
  }
  if (op === 'setAttr') {
    if (!EDITABLE_ATTRS.includes(payload.name as never)) {
      return `편집할 수 없는 속성입니다: ${String(payload.name)}`;
    }
  }
  if (op === 'aiRewrite' && typeof payload.html !== 'string') {
    return '교체할 HTML이 없습니다.';
  }
  return null;
}

/**
 * 패치를 기록한다.
 * seq 채번과 삽입을 한 트랜잭션에 묶고 UNIQUE(screen_id, seq)로 경쟁을 막는다.
 * 같은 요소·같은 속성에 여러 사람이 쓰면 seq 순으로 마지막 것이 이긴다.
 */
export function insertPatch(db: Database, id: string, input: PatchInput): ElementPatch {
  return db.transaction(() => {
    const row = db
      .prepare('SELECT MAX(seq) as max_seq FROM element_patches WHERE screen_id = ?')
      .get(input.screenId) as { max_seq: number | null };

    db.prepare(
      `INSERT INTO element_patches (id, screen_id, nh_id, user_id, op, payload, reason, source, seq, comment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.screenId,
      input.nhId,
      input.userId,
      input.op,
      JSON.stringify(input.payload),
      input.reason ?? null,
      input.source ?? 'manual',
      (row.max_seq ?? 0) + 1,
      input.commentId ?? null
    );

    return db
      .prepare(
        `SELECT p.*, u.name as user_name, u.color as user_color
           FROM element_patches p JOIN users u ON p.user_id = u.id
          WHERE p.id = ?`
      )
      .get(id) as ElementPatch;
  })();
}
