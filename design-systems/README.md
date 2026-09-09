# 디자인 시스템 (`design-systems/`)

AI가 화면을 만들 때 **어떤 디자인으로 뽑을지** 고르는 재료다. 폴더 하나가 디자인 시스템 하나다.

선택지 정본은 [`registry.json`](registry.json)이고, 이걸 읽는 코드는 `mockup/lib/canvas/designSystem.ts` 한 곳뿐이다.

| id | UI 라벨 | 표면 | 출처 |
|---|---|---|---|
| `nh-allonebank` | NH올원뱅크 (모바일 앱) | 모바일 402×852 | Claude Design **아트보드** (프로젝트 export 아님) |
| `nh-ibz` | NH 기업인터넷뱅킹 (웹) | 웹 1200px | Claude Design export |
| `nh-withcanvas` | **없음 — `registry.json` 미등록** | 웹 1440×900 | Claude Design export |

### `nh-withcanvas` 는 왜 `registry.json` 에 없나

앞의 둘과 성격이 다르다. `nh-allonebank`·`nh-ibz` 는 **AI가 만들어 줄 화면**(고객이 보는 올원뱅크·기업뱅킹)의
재료다. `nh-withcanvas` 는 **이 제품 자신의 화면**(담당자가 쓰는 위드캔버스)이다.

registry 에 등재하면 생성 화면의 선택지에 "위드캔버스"가 뜬다. 그러면 사용자가 고객용 계좌 신청 화면을
사내 협업 툴 스타일로 뽑게 된다 — 재료로서 틀렸다. 그래서 폴더는 여기 두되 등재하지 않는다.
`designSystem.ts` 는 `registry.json` 만 읽으므로 등재되지 않은 폴더는 무해하다(디렉터리를 훑지 않는다).

이 시스템이 쓰이는 자리는 공유 링크의 화면구성이다 — `mockup-site/main.html` 이 진입 문서이고
클릭스루 본체는 `nh-withcanvas/ui_kits/withcanvas/index.html` 이다. 킷 설명은
[`nh-withcanvas/ui_kits/withcanvas/README.md`](nh-withcanvas/ui_kits/withcanvas/README.md).

---

## 새 디자인 시스템을 추가하려면

1. Claude Design export를 `design-systems/<id>/` 에 푼다. **`uploads/` 는 넣지 않는다** (아래 참고).
2. `registry.json` 의 `systems` 에 한 줄 추가한다.
3. 끝이다. 생성 화면의 선택지·프롬프트 토큰·Template 카드가 자동으로 따라온다.

읽는 파일은 `<id>/_ds_manifest.json` 의 `tokens[]` 와 `templates[]` 두 개뿐이다.
`nh-ibz` 만 갖고 있는 `tokens.json` 에는 의존하지 않는다 — export 마다 있을 수도 없을 수도 있어서다.

**디자인 시스템 export 가 아니라 아트보드만 있는 경우**(`nh-allonebank` 가 그렇다)는
`_ds_manifest.json` 을 직접 짓는다. `tokens[]` 는 아트보드에 **실제로 쓰인 값에서 추출**하고,
`source.kind` 를 `artboard-derived` 로 적어 출처를 남긴다. 값을 지어내지 않는 것이 핵심이다.

---

## `uploads/` 를 커밋하지 않는 이유

`.github/workflows/pages.yml` 이 **저장소 루트를 통째로** GitHub Pages 로 공개 서빙한다(main → `/`, dev → `/dev/`).
export 에 딸려오는 `uploads/` 는 디자인 시스템을 만들 때 넣은 **실제 화면 캡처**라 그대로 공개 URL 이 된다.

- `nh-allonebank/uploads/` — 올원뱅크 앱 화면 캡처
- `nh-ibz/uploads/` — `ibz.nonghyup.com` 실제 화면 캡처 4.5MB

`.gitignore` 의 `design-systems/*/uploads/` 가 막는다. 파일이 없어도 빌드·생성은 그대로 동작한다.

---

## 자산의 실체 — 그대로 "NH 공식"이라고 부르면 안 되는 것들

### `nh-allonebank` — 화면은 실물 기반, 나머지는 대체재다

Claude Design 프로젝트 `NH올원뱅크 와이어프레임`(`04f34704-5cb5-49e5-aaf0-c70b5e7f524c`)에서
**아트보드만** 가져왔다. 디자인 시스템 export 가 아니다.

| | 실제 값 |
|---|---|
| 화면 구조·흐름 | **실제 올원뱅크 앱 스크린샷 기반.** 계좌카드·금융상품 카테고리 12종·거래내역 형식이 실물을 따른다 |
| 브랜드 색 | `#2440CE` · `#1B2A6B` · `#00A651` · `#FFD666` — **아트보드에서 추출한 값이다.** NH 컬러 규격서를 옮긴 것이 아니다 |
| 로고 | **없다.** 계좌 아바타의 `NH` 는 원형에 얹은 활자다 |
| 폰트 | Pretendard Variable — NH 공식 서체가 아니다 |
| 일러스트 | **없다.** 점선 자리표시로 대체했다 |
| 컴포넌트 | **없다.** `components[]` 가 비어 있고 `_ds_bundle.js` 도 없다 |

원본 프로젝트의 `_ds/` 는 **Apple iOS/iPadOS 26 UI Kit** 이라 반입하지 않았다.
거기서 쓰던 상태바·토글·홈 인디케이터 3개는 마크업으로 다시 그렸다 — 장식 요소 3개를 위해
Apple 킷(번들 + CSS 24개 + 폰트)을 들이면 "무엇이 NH 자산인가" 가 다시 흐려진다.

자세한 내용은 [`nh-allonebank/readme.md`](nh-allonebank/readme.md).

### `nh-ibz` — 색은 실제 NH, 나머지는 대체재다

| | 실제 값 |
|---|---|
| 브랜드 색 | NH Blue `#0094D9` · NH Green `#00A04E` · navy `#122F50` — **실제 NH 색이다** |
| 로고 | `assets/logo*.svg` 는 **공식 CI 가 아니다.** "NH" 를 파란 라운드 사각형에 넣은 타이포 플레이스홀더 |
| 폰트 | NH 바른고딕(비공개) 대신 **Noto Sans KR** |
| 아이콘 | NH 자체 아이콘셋 대신 **Lucide** |
| 일러스트 | `assets/illustrations/` 는 NH 팔레트로 그린 기하 도형 플레이스홀더 |

자세한 내용은 [`nh-ibz/readme.md`](nh-ibz/readme.md) 의 "⚠️ Substitutions to confirm" 절.

### `nh-withcanvas` — 색은 실제 NH 규격, 심볼은 실제 CI다

| | 실제 값 |
|---|---|
| 브랜드 색 | NH Blue `#005CA9`(PANTONE 300 C) · Yellow `#FBBA00`(1235 C) · Green `#04A64B`(354 C) — **CI 규격서 값이다** |
| 로고 | `assets/nh-symbol-bank.jpg` — **실제 농협 심볼마크.** 대외 공개 자산이라 커밋한다 |
| 폰트 | 나눔스퀘어네오. NH 바른고딕(비공개) 대신 쓰며 **공개 CDN(jsDelivr) 사본을 참조**한다 → 운영 반입 시 `tokens/fonts.css` 의 `src` 만 사내 경로 woff2 로 교체 |
| 아이콘 | NH 자체 아이콘셋 대신 **Lucide** (unpkg CDN) |
| 화면 내용 | 전부 **가상 데이터**다. 사람 이름(김민준·이준호 등)·상품명·금리는 지어낸 값이며 실제 고객·상품이 아니다 |

클릭스루는 React·Babel·Lucide 를 **unpkg CDN 에서 받는다.** 사내망에서는 열리지 않을 수 있다.

### 공식 CI 자산의 정본은 여기가 아니다

농협 공식 심볼마크·워드마크·전용색상은 `mockup/public/assets/nh/` 가 정본이다.
반입 절차와 PANTONE 값은 `mockup/public/assets/nh/README.md` 를 따른다.

> **운영 반입 시 교체 대상**: 위 표의 "대체재" 행 전부.
> 담당 주체는 미결이다 — [08_DECISIONS_OPEN_ISSUES.md](../개발문서/08_DECISIONS_OPEN_ISSUES.md)

---

## 이 폴더가 제품에서 갖는 위치

FR-04 Template 의 `BRAND_ASSET` 유형에 해당한다. 문서 양식(`DOCUMENT`)이 아니라
**로고·컬러 토큰·서체 규칙을 공급하는 업무 자산 계층**이다.
명세는 [`개발문서/기능명세/FR-04_템플릿.md`](../개발문서/기능명세/FR-04_템플릿.md).
