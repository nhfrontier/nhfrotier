import { v4 as uuidv4 } from 'uuid';
import { processGeneratedHtml, type ElementFingerprint } from './htmlPipeline';
import type { Db, Screen, ScreenElement } from '../db';

/** 다화면 이전에 만들어진 목업을 화면 1장으로 볼 때 쓰는 key. */
export const LEGACY_SCREEN_KEY = 'main';

/**
 * 생성된 HTML을 정제·식별자 부여한 뒤 screens와 screen_elements에 기록한다.
 * 같은 (버전, screen_key)로 다시 부르면 기존 행을 덮어쓰므로 재시도에 안전하다.
 * 호출자가 트랜잭션을 열어야 한다 — 화면과 요소가 따로 커밋되면 안 된다.
 *
 * 반환값의 html은 정제된 결과다. mockup_versions.html_content에도 이걸 넣어야
 * 저장본과 화면이 어긋나지 않는다.
 */
export async function saveScreenHtml(
  db: Db,
  args: {
    mockupVersionId: string;
    screenKey: string;
    name: string;
    role?: string | null;
    sortOrder?: number;
    rawHtml: string;
    knownScreenKeys: string[];
  }
): Promise<{
  screenId: string;
  html: string;
  warnings: string[];
  elementCount: number;
  /** 재생성일 때만 채워진다. 처음 만드는 화면이면 null. */
  reanchored: ReanchorResult | null;
}> {
  const { html, elements, warnings } = processGeneratedHtml(args.rawHtml, {
    knownScreenKeys: args.knownScreenKeys,
  });

  const existing = (await db
    .prepare('SELECT id FROM screens WHERE mockup_version_id = ? AND screen_key = ?')
    .get(args.mockupVersionId, args.screenKey)) as { id: string } | undefined;

  const screenId = existing?.id ?? uuidv4();

  // 재생성이면 옛 요소를 먼저 붙잡아 둔다. 새 요소와 대조해 의견 앵커를 다시 잇기 위해서다.
  const oldElements = existing ? await listScreenElements(db, screenId) : [];

  if (existing) {
    await db.prepare(
      `UPDATE screens
          SET name = ?, role = ?, sort_order = ?, html_content = ?,
              status = 'ready', error_message = NULL, updated_at = datetime('now')
        WHERE id = ?`
    ).run(args.name, args.role ?? null, args.sortOrder ?? 0, html, screenId);

    await db.prepare('DELETE FROM screen_elements WHERE screen_id = ?').run(screenId);
  } else {
    await db.prepare(
      `INSERT INTO screens (id, mockup_version_id, screen_key, name, role, sort_order, html_content, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')`
    ).run(
      screenId,
      args.mockupVersionId,
      args.screenKey,
      args.name,
      args.role ?? null,
      args.sortOrder ?? 0,
      html
    );
  }

  const insertElement = db.prepare(
    `INSERT INTO screen_elements (id, screen_id, nh_id, tag, doc_order, path_sig, text_sig)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const el of elements) {
    await insertElement.run(uuidv4(), screenId, el.nhId, el.tag, el.docOrder, el.pathSig, el.textSig);
  }

  const reanchored =
    oldElements.length > 0 ? await reanchorComments(db, screenId, oldElements, elements) : null;

  return { screenId, html, warnings, elementCount: elements.length, reanchored };
}

/** 앵커를 다시 이은 결과. 화면에 "위치를 잃은 의견 N건"으로 보여준다. */
export interface ReanchorResult {
  anchored: number;
  orphaned: number;
}

/**
 * 화면을 다시 만들면 요소 id가 바뀐다. 그대로 두면 의견이 사라진 것처럼 보인다.
 *
 * 완벽히 안정된 id는 만들 수 없다는 것을 전제로, 목표를 다르게 잡는다:
 * 끊어진 앵커가 조용히 사라지지 않고 orphaned로 드러나 사람이 다시 붙일 수 있게 한다.
 */
export async function reanchorComments(
  db: Db,
  screenId: string,
  oldElements: ScreenElement[],
  newElements: ElementFingerprint[]
): Promise<ReanchorResult> {
  const anchored = (await db
    .prepare("SELECT id, nh_id FROM comments WHERE screen_id = ? AND anchor_status = 'anchored'")
    .all(screenId)) as Array<{ id: string; nh_id: string }>;

  if (anchored.length === 0) return { anchored: 0, orphaned: 0 };

  const oldById = new Map(oldElements.map((e) => [e.nh_id, e]));
  const setAnchor = db.prepare(
    "UPDATE comments SET nh_id = ?, anchor_status = 'anchored' WHERE id = ?"
  );
  const setOrphan = db.prepare("UPDATE comments SET anchor_status = 'orphaned' WHERE id = ?");

  let kept = 0;
  let lost = 0;

  for (const comment of anchored) {
    const before = oldById.get(comment.nh_id);
    if (!before) {
      await setOrphan.run(comment.id);
      lost++;
      continue;
    }

    // id가 그대로면 텍스트도 구조도 그대로라는 뜻이다. 더 볼 것 없다.
    if (newElements.some((n) => n.nhId === comment.nh_id)) {
      kept++;
      continue;
    }

    let best: { nhId: string; score: number } | null = null;
    for (const candidate of newElements) {
      let score = 0;
      if (before.text_sig && candidate.textSig === before.text_sig) score += 2;
      if (candidate.pathSig === before.path_sig) score += 1;
      if (candidate.tag === before.tag) score += 1;
      if (Math.abs(candidate.docOrder - before.doc_order) <= 2) score += 0.5;

      if (!best || score > best.score) best = { nhId: candidate.nhId, score };
    }

    // 태그만 같은 정도(1점)로는 붙이지 않는다. 엉뚱한 곳에 붙은 메모가 사라진 메모보다 나쁘다.
    if (best && best.score >= 2) {
      await setAnchor.run(best.nhId, comment.id);
      kept++;
    } else {
      await setOrphan.run(comment.id);
      lost++;
    }
  }

  return { anchored: kept, orphaned: lost };
}

/**
 * screens 행이 없는 옛 목업을 화면 1장짜리로 승격한다.
 * 캔버스가 legacy 분기를 갖지 않도록, 읽기 시점에 조용히 정규화하는 것이 목적이다.
 * 멱등하며, 이미 화면이 있으면 그대로 반환한다.
 */
export async function ensureScreens(
  db: Db,
  mockupVersionId: string,
  legacyHtml: string
): Promise<Screen[]> {
  const rows = (await db
    .prepare('SELECT * FROM screens WHERE mockup_version_id = ? ORDER BY sort_order ASC')
    .all(mockupVersionId)) as Screen[];

  if (rows.length > 0) return rows;

  await db.transaction(async (tx) => {
    await saveScreenHtml(tx, {
      mockupVersionId,
      screenKey: LEGACY_SCREEN_KEY,
      name: '화면 1',
      sortOrder: 0,
      rawHtml: legacyHtml,
      knownScreenKeys: [LEGACY_SCREEN_KEY],
    });
  });

  return (await db
    .prepare('SELECT * FROM screens WHERE mockup_version_id = ? ORDER BY sort_order ASC')
    .all(mockupVersionId)) as Screen[];
}

export async function listScreenElements(db: Db, screenId: string): Promise<ScreenElement[]> {
  return (await db
    .prepare('SELECT * FROM screen_elements WHERE screen_id = ? ORDER BY doc_order ASC')
    .all(screenId)) as ScreenElement[];
}
