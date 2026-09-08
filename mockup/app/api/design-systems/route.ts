import { NextResponse } from 'next/server';
import { listDesignSystems, describeDesignSystem } from '@/lib/canvas/designSystem';

/**
 * 화면 생성 시 고를 수 있는 디자인 시스템 목록.
 *
 * 정본은 저장소 루트 design-systems/registry.json이다. 폴더를 넣고 그 파일에 한 줄 추가하면
 * 여기·생성 프롬프트·Template 카드가 함께 따라온다.
 *
 * Template 화면이 카드를 그리는 데 필요한 값은 describeDesignSystem이 얹는다.
 */
export function GET() {
  const systems = listDesignSystems().map((system) => ({
    ...system,
    ...describeDesignSystem(system.id),
  }));

  return NextResponse.json({ systems });
}
