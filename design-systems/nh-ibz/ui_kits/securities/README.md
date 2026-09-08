# UI Kit — 증권 브랜드 랜딩 (NH 증권)

증권사 브랜드 마케팅 랜딩 페이지. NH기업뱅킹 디자인 시스템 토큰·컴포넌트 위에, PRD(2026-06-27 v1.0) 구조로 제작한 **풀 반응형 인터랙티브 프로토타입**.

> 카카오페이증권을 레퍼런스로 한 PRD지만, 경쟁사 고유 브랜딩·캐릭터는 복제하지 않고 일반적인 랜딩 구조만 NH 디자인으로 **원본 제작**했습니다.

## 실행
`index.html` 열기 — React + Babel + Lucide + `_ds_bundle.js` 로드 후 마운트.

## 구성 (PRD 섹션 매핑)
- NH기업뱅킹 글로벌 헤더(`../ibz/Header.jsx`) 재사용 — 레퍼런스(ibz.nonghyup.com) GNB 그대로.
- `Hero.jsx` — Section 1. 라이트 키비주얼(흰색+연한 핑크, NH 레퍼런스 톤), 컴팩트 높이, 아이소메트릭 오브젝트 + 캡슐 강조 키워드.
- `Mission.jsx` — Section 2. 브랜드 미션(연한 블루 톤, 중앙).
- `AccountBenefits.jsx` — Section 3. 계좌 개설 혜택 4종 2열 카드.
- `Features.jsx` — Section 4. 카테고리 탭 전환 → 우측 기능 목록 + 좌측 비주얼 교체(크로스페이드).
- `Disclaimer.jsx` — Section 5(법적 고지) + 다크 Footer(법적 링크·회사정보·tel 링크).
- `Icon.jsx` — Lucide 래퍼.
- `securities.css` — 레이아웃·반응형(데스크탑/태블릿/모바일)·스크롤 리빌·GNB 상태.

## 인터랙션
- GNB 스크롤 투명→불투명, 드롭다운, 모바일 햄버거 오버레이.
- 기능 카테고리 탭 클릭 → 목록/비주얼 전환.
- 스크롤 진입 리빌(IntersectionObserver), `prefers-reduced-motion` 대응.
- 본문 바로가기 Skip Navigation, 고객센터 `tel:` 링크.

## 구현 메모
- **모션은 transform 기반**(opacity 숨김 미사용)으로, 정적 렌더·캡처 환경에서도 콘텐츠가 항상 보이도록 안전 처리.
- 데이터·카피는 PRD 기반 예시값. 3D 오브젝트·아이콘은 디자인 시스템 아이소메트릭 일러스트 + Lucide 플레이스홀더(실물 에셋 교체 필요).
