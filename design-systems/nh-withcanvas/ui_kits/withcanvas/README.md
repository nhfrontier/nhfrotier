# 위드캔버스 UI 킷

**팀에 보여줄 때는 `demo.html`을 여세요.** 무엇을 보는 것인지, 역할이 왜 셋인지, 화면 10장이 각각 무엇인지 한 장에 정리돼 있고 각 항목이 클릭스루의 해당 화면으로 바로 갑니다.

`index.html`은 클릭스루 본체입니다. 주소 끝에 `#화면이름`을 붙이면 그 화면부터 열립니다 (`index.html#reviewer`).

> **`file://` 로 직접 열면 빈 화면이 나옵니다.** Babel이 `.jsx`를 XHR로 읽어야 하는데 로컬 파일은 CORS로 막힙니다.
> 저장소 루트에서 `python3 -m http.server 8000` 을 띄우고
> <http://127.0.0.1:8000/design-systems/nh-withcanvas/ui_kits/withcanvas/index.html> 로 여세요.
> GitHub Pages에서는 같은 출처라 그냥 열립니다.

| # | 화면 | 파일 | 해시 | 원본 |
|---|---|---|---|---|
| 1 | 홈 — 내가 맡은 일 | `ProjectListScreen.jsx` | `#list` | S01·S02 |
| 2 | 새 프로젝트 만들기 | `NewProjectScreen.jsx` | `#new` | S02 · FR-02 |
| 3 | 참고자료 올리기 | `FilesScreen.jsx` | `#files` | FR-03 |
| 4 | 검토자 초대·알림 | `InviteScreen.jsx` | `#invite` | FR-01 · FR-06 |
| 5 | 세 가지만 물어보기 | `NewTaskScreen.jsx` | `#newtask` | S04 |
| 6 | 협업 캔버스 | `WorkspaceScreen.jsx` | `#workspace` | S03 |
| 7 | 개발 담당자 화면 | `ReviewerScreen.jsx` | `#reviewer` | S03 · FR-06 (검토자 권한) |
| 8 | 한 장씩 결정하기 | `DecideScreen.jsx` | `#decide` | S05 · FR-14 · FR-15 |
| 9 | 준법 검토 | `ComplianceScreen.jsx` | `#compliance` | FR-14 `COMPLIANCE_REQUESTED` |
| 10 | 무엇이 바뀌었나 | `ChangesScreen.jsx` | `#changes` | S06 |

공용 목업(`AccountMock`)과 우측 패널 껍데기(`Panel`)는 `Shared.jsx`에 있습니다.

## 이 킷의 축은 기획↔개발입니다

디자인 리뷰 도구가 아닙니다. 기획자가 만든 화면 위에서 개발 담당자가 **구현 조건**을 짚는 것이 핵심입니다.

- 개발 담당자 화면(`#reviewer`)은 짚은 요소의 **태그 · 연결 화면 · 기획서 근거**를 함께 보여주고, `상태 정의 필요` · `API 응답 확인` · `예외 처리 필요` 같은 태그를 달아 의견을 남깁니다.
- AI 정리 카드도 `개발 영향 — 미동의 시 분기 처리 1건 추가`처럼 구현 단위로 요약합니다.
- 결정 권한은 기획 담당자에게만 있습니다. 검토자 화면에는 반영·보류·반려 버튼이 없습니다.

## 원본과 달라진 것

1. **전역 탭을 없앴습니다.** 상단바에는 지금 보고 있는 것의 이름과, 이 화면에서 할 수 있는 것만 둡니다.
2. **홈은 "지금 할 일" 한 줄 + 목록 하나**입니다. 최근 Version·최근 활동 블록은 지웠습니다.
3. **결정을 한 장씩** 합니다. 검토 카드를 목록으로 늘어놓지 않습니다.
4. **말이 바뀌었습니다.** Version → 4번째 판, History → 기록, Export → 내려받기, 선택/미리보기 모드 → 짚기/보기.
5. **역할이 화면을 나눕니다.** 기획 / 개발 / 준법이 서로 다른 화면을 봅니다.

## 아직 만들지 않은 것

- 로그인·권한 관리 화면, S09 브랜드 시안 3안 비교, S10 디자인 자산 라이브러리, 기록(히스토리) 전용 화면
- 실제 AI 연동. 캔버스 안 목업은 정적 JSX이며, 실제 제품에서는 샌드박스 iframe입니다.
