# 디자인 시스템 (`design-systems/`)

AI가 화면을 만들 때 **어떤 디자인으로 뽑을지** 고르는 재료다. 폴더 하나가 디자인 시스템 하나다.

선택지 정본은 [`registry.json`](registry.json)이고, 이걸 읽는 코드는 `mockup/lib/canvas/designSystem.ts` 한 곳뿐이다.

| id | UI 라벨 | 표면 | 출처 |
|---|---|---|---|
| `allone-bank` | 올원뱅크 (모바일 앱) | 모바일 360×780 | Claude Design export |
| `nh-ibz` | NH 기업인터넷뱅킹 (웹) | 웹 1200px | Claude Design export |

---

## 새 디자인 시스템을 추가하려면

1. Claude Design export를 `design-systems/<id>/` 에 푼다. **`uploads/` 는 넣지 않는다** (아래 참고).
2. `registry.json` 의 `systems` 에 한 줄 추가한다.
3. 끝이다. 생성 화면의 선택지·프롬프트 토큰·Template 카드가 자동으로 따라온다.

읽는 파일은 `<id>/_ds_manifest.json` 의 `tokens[]` 와 `templates[]` 두 개뿐이다.
`allone-bank` 만 갖고 있는 `tokens.json` 에는 의존하지 않는다 — export 마다 있을 수도 없을 수도 있어서다.

---

## `uploads/` 를 커밋하지 않는 이유

`.github/workflows/pages.yml` 이 **저장소 루트를 통째로** GitHub Pages 로 공개 서빙한다(main → `/`, dev → `/dev/`).
export 에 딸려오는 `uploads/` 는 디자인 시스템을 만들 때 넣은 **실제 화면 캡처**라 그대로 공개 URL 이 된다.

- `allone-bank/uploads/` — 올원뱅크 앱 화면 캡처 10장
- `nh-ibz/uploads/` — `ibz.nonghyup.com` 실제 화면 캡처 4.5MB

`.gitignore` 의 `design-systems/*/uploads/` 가 막는다. 파일이 없어도 빌드·생성은 그대로 동작한다.

---

## 자산의 실체 — 그대로 "NH 공식"이라고 부르면 안 되는 것들

### `allone-bank` — 이름은 올원뱅크지만 색·로고는 대체재다

올원뱅크 앱 캡처를 *입력 소재*로 삼았으나 가져온 것은 **UX 패턴뿐**이다.
브랜드 색·로고·서체는 실제 올원뱅크 CI가 아니라 검증용으로 새로 만든 대체값이다.
결과물을 "올원뱅크 공식 디자인"이라고 부르면 안 된다.

| | 실제 값 |
|---|---|
| 브랜드 색 | teal `#0B8478` — **실제 올원뱅크·NH 색이 아니다** |
| 로고 | **없다.** 워드마크 자리에 `올원`을 활자로 조판한다 |
| 폰트 | Pretendard Variable (CDN) |
| 아이콘 | Lucide |

자세한 내용은 [`allone-bank/readme.md`](allone-bank/readme.md) 의 Provenance 절.

### `nh-ibz` — 색은 실제 NH, 나머지는 대체재다

| | 실제 값 |
|---|---|
| 브랜드 색 | NH Blue `#0094D9` · NH Green `#00A04E` · navy `#122F50` — **실제 NH 색이다** |
| 로고 | `assets/logo*.svg` 는 **공식 CI 가 아니다.** "NH" 를 파란 라운드 사각형에 넣은 타이포 플레이스홀더 |
| 폰트 | NH 바른고딕(비공개) 대신 **Noto Sans KR** |
| 아이콘 | NH 자체 아이콘셋 대신 **Lucide** |
| 일러스트 | `assets/illustrations/` 는 NH 팔레트로 그린 기하 도형 플레이스홀더 |

자세한 내용은 [`nh-ibz/readme.md`](nh-ibz/readme.md) 의 "⚠️ Substitutions to confirm" 절.

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
