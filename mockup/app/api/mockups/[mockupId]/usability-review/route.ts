import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { bakeScreenHtml } from '@/lib/canvas/patches';
import { v4 as uuidv4 } from 'uuid';
import {
  reviewUsability,
  InputTooLargeError,
  USABILITY_MODEL,
  type ReviewComment,
  type ReviewScreen,
} from '@/lib/review-usability';

const FINDINGS_QUERY = `
  SELECT f.*, u.name as decided_by_name, u.color as decided_by_color
  FROM usability_findings f
  LEFT JOIN users u ON f.decision_by = u.id
  WHERE f.review_id = ?
  ORDER BY
    CASE f.severity WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END,
    f.lens_id ASC
`;

/** 해당 목업의 가장 최근 검토 + 지적 목록 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mockupId: string }> }
) {
  try {
    const { mockupId } = await params;
    const db = getDb();

    const review = db.prepare(`
      SELECT * FROM usability_reviews
      WHERE mockup_version_id = ?
      ORDER BY created_at DESC, rowid DESC
      LIMIT 1
    `).get(mockupId) as { id: string } | undefined;

    if (!review) return NextResponse.json({ review: null, findings: [] });

    const findings = db.prepare(FINDINGS_QUERY).all(review.id);
    return NextResponse.json({ review, findings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '검토 결과를 불러올 수 없습니다.' }, { status: 500 });
  }
}

interface ScreenRow {
  id: string;
  screen_key: string;
  name: string;
  html_content: string | null;
}

interface CommentRow {
  content: string;
  created_at: string;
  user_name: string;
  screen_key: string | null;
  nh_id: string | null;
  anchor_status: string;
}

/**
 * 검토 입력을 DB에서 조립한다.
 *
 * 화면을 나눠 부르지 않고 전부 한 컨텍스트에 넣는다 — 누적을 보려면 흐름 전체가 함께 있어야 한다.
 * (화면당 분리 호출하는 lib/canvas/generateScreen.ts와 반대 방향이다.)
 */
function collectInput(
  db: ReturnType<typeof getDb>,
  mockup: { id: string; html_content: string; proposal_content: string }
) {
  const screenRows = db.prepare(`
    SELECT id, screen_key, name, html_content
    FROM screens
    WHERE mockup_version_id = ? AND html_content IS NOT NULL
    ORDER BY sort_order ASC
  `).all(mockup.id) as ScreenRow[];

  // 캔버스 이전에 만들어진 목업은 screens 행이 없다. 그때는 버전 HTML 한 장이 전부다.
  // 저장본이 아니라 편집을 반영한 HTML을 검토한다.
  // 저장본을 그대로 넣으면 사람이 이미 고친 것을 AI가 다시 지적한다.
  const screens: ReviewScreen[] = screenRows.length
    ? screenRows.map((s) => ({
        screenKey: s.screen_key,
        name: s.name,
        html: bakeScreenHtml(db, s.id, s.html_content ?? ''),
      }))
    : [{ screenKey: 'main', name: '화면', html: mockup.html_content }];

  const commentRows = db.prepare(`
    SELECT c.content, c.created_at, c.anchor_status, c.nh_id,
           u.name as user_name, s.screen_key
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN screens s ON c.screen_id = s.id
    WHERE c.mockup_version_id = ?
    ORDER BY c.created_at ASC
  `).all(mockup.id) as CommentRow[];

  const comments: ReviewComment[] = commentRows.map((c, i) => ({
    no: i + 1,
    author: c.user_name,
    createdAt: c.created_at,
    anchor:
      c.anchor_status === 'anchored' && c.screen_key && c.nh_id
        ? `화면 ${c.screen_key} / 요소 ${c.nh_id}`
        : null,
    content: c.content,
  }));

  return { proposal: mockup.proposal_content, screens, comments };
}

/** 검토 실행. 담당자 요청 시에만 호출된다. 이전 검토는 남겨 두고 새 review 행을 만든다. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mockupId: string }> }
) {
  const { mockupId } = await params;
  const db = getDb();

  let userId: unknown = null;
  try {
    ({ userId } = await req.json());
  } catch {
    // 본문 없이 호출되면 요청자를 남기지 않는다
  }

  const mockup = db.prepare(
    'SELECT id, html_content, proposal_content FROM mockup_versions WHERE id = ?'
  ).get(mockupId) as
    | { id: string; html_content: string; proposal_content: string }
    | undefined;

  if (!mockup) return NextResponse.json({ error: '목업을 찾을 수 없습니다.' }, { status: 404 });

  const requestedBy =
    typeof userId === 'string' && db.prepare('SELECT id FROM users WHERE id = ?').get(userId)
      ? userId
      : null;

  const reviewId = uuidv4();
  db.prepare(
    'INSERT INTO usability_reviews (id, mockup_version_id, status, model, requested_by) VALUES (?, ?, ?, ?, ?)'
  ).run(reviewId, mockupId, 'RUNNING', USABILITY_MODEL, requestedBy);

  try {
    const findings = await reviewUsability(collectInput(db, mockup));

    const insert = db.prepare(`
      INSERT INTO usability_findings
        (id, review_id, lens_id, severity, title, evidence, evidence_source, why, suggestion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAll = db.transaction((items: typeof findings) => {
      for (const f of items) {
        insert.run(
          uuidv4(),
          reviewId,
          f.lens_id,
          f.severity,
          f.title,
          f.evidence,
          f.evidence_source,
          f.why,
          f.suggestion
        );
      }
    });
    insertAll(findings);

    db.prepare('UPDATE usability_reviews SET status = ? WHERE id = ?').run('DONE', reviewId);

    const review = db.prepare('SELECT * FROM usability_reviews WHERE id = ?').get(reviewId);
    const rows = db.prepare(FINDINGS_QUERY).all(reviewId);
    return NextResponse.json({ review, findings: rows }, { status: 201 });
  } catch (error) {
    console.error(error);
    // 원인 문자열에 프롬프트·응답 원문이 섞이지 않도록 사용자에게는 정형 메시지만 준다
    const tooLarge = error instanceof InputTooLargeError;
    db.prepare('UPDATE usability_reviews SET status = ?, error = ? WHERE id = ?').run(
      'FAILED',
      tooLarge ? 'INPUT_TOO_LARGE' : 'REVIEW_FAILED',
      reviewId
    );
    return tooLarge
      ? NextResponse.json(
          { error: '화면과 의견의 양이 한 번에 검토할 수 있는 크기를 넘었습니다.' },
          { status: 413 }
        )
      : NextResponse.json({ error: 'UX 리스크 검토에 실패했습니다.' }, { status: 502 });
  }
}
