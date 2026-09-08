# UI Kit — 기업인터넷뱅킹 (ibz.nonghyup.com)

High-fidelity recreation of NH농협은행 기업인터넷뱅킹's public web surface, composed from the design-system primitives.

## Run
Open `index.html`. It loads React + Babel + Lucide + the compiled `_ds_bundle.js`, then mounts the screens. Use the main nav (`조회/이체 … 금융상품`) to switch between recreated screens; other nav items fall back to the 홈 dashboard.

## Screens
| Nav item | File | Reference |
|---|---|---|
| 홈 (default) | `HomeScreen.jsx` | `uploads/ibz.nonghyup.com_.png` |
| 금융상품 | `ProductListScreen.jsx` | `uploads/ibz.nonghyup.com_servlet_ICSFP1000I.view.png` |
| B2B전자결제 | `B2BScreen.jsx` | `uploads/ibz.nonghyup.com_servlet_content_bb_ICBB9001M.thtml.png` |
| 맞춤상품추천 | `ProductRecommendScreen.jsx` | 신규 기능 화면 (단독 카드: `recommend.html`) |

### 맞춤 상품 추천
4개 항목(자금 목적·기업 규모·운용 기간·사업자 형태)을 선택하면 상품별 가중치 매칭 점수가 실시간으로 재계산되어 1순위 추천 카드 + 순위 리스트가 갱신됩니다. 비교함(sticky bar)에 담기, 비슷한 기업 가입 상품, 유의사항 문구 포함. 점수 로직은 `CATALOG[].pref` + `WEIGHT` 상수로 조정합니다.

## Shared chrome
- `Header.jsx` — utility bar, logo + 로그인/인증센터, main GNB, optional blue category sub-bar (`subNav` prop).
- `Footer.jsx` — quick links, policy row, contact numbers, affiliate dropdown, cert badges.
- `Icon.jsx` — thin React wrapper over **Lucide** UMD (`<Icon name="Search" />`). Lucide substitutes for NH's proprietary icon set — see root `readme.md` ICONOGRAPHY.

## Notes
- Design width is **1200px** (page min-width 1200). Built for desktop, like the real product.
- Workhorse filled buttons (가입하기/조회/로그인) use the **slate-navy** action color, not bright NH blue — matches the live site.
- Data (product rates, copy) is illustrative, transcribed from the reference screenshots.
- This is a cosmetic recreation: no real auth, routing, or banking logic.
