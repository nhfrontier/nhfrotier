import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { listVersionPatches } from '@/lib/canvas/patches';

/**
 * 한 목업 버전의 편집 내역 전체.
 *
 * `GET /api/mockups/[id]`가 내려주는 화면별 `patches`와 다르다. 그쪽은 프레임에 적용할
 * 연산(PatchOp)만 담고 있어 누가·왜·언제가 없고 되돌린 것도 빠져 있다.
 * 화면에 "AI가 반영했습니다" 카드와 편집 이력을 그리려면 원본 행이 필요하다.
 *
 * payload는 내려보내지 않는다. 목록을 그리는 데 쓰이지 않는 데다 aiRewrite의
 * payload는 HTML 조각이라 응답만 무거워진다.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mockupId: string }> }
) {
  try {
    const { mockupId } = await params;
    const db = await getDb();

    const rows = (await listVersionPatches(db, mockupId)).map((row) => {
      const { payload, ...rest } = row;
      void payload;
      return rest;
    });
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '편집 내역을 불러올 수 없습니다.' }, { status: 500 });
  }
}
