# NH기업뱅킹 Design System

Design system for **NH농협은행 — 기업인터넷뱅킹** (NongHyup Bank, corporate internet banking / `ibz.nonghyup.com`). It captures the brand's conservative, trustworthy financial vocabulary: NH blue, deep navy, NH green, card-based layouts on light-grey sections, isometric 3D illustrations, and the signature "자세히보기 ›" text-link / ↗ navigation patterns.

> **Scope** — This covers the **corporate web banking marketing/portal surface** (메인, 금융상품 목록, B2B전자결제 등). It is not the post-login transactional app.

## Sources used
No codebase or Figma was provided. The system was built from:
1. A written brand brief (colors, type, layout, tone, components) supplied by the user.
2. Three real reference screenshots of the live site (stored in `uploads/`):
   - `uploads/ibz.nonghyup.com_.png` — 메인 (home dashboard)
   - `uploads/ibz.nonghyup.com_servlet_ICSFP1000I.view.png` — 금융상품 예금 목록
   - `uploads/ibz.nonghyup.com_servlet_content_bb_ICBB9001M.thtml.png` — B2B전자결제

The UI kit under `ui_kits/ibz/` is a faithful recreation of those three screens.

---

## ⚠️ Substitutions to confirm
- **Font** — NH's brand face is the proprietary **NH 바른고딕**, which we cannot ship. We substitute **Noto Sans KR** (open-source, plain standard-gothic — closest match to the live site; loaded from the Fontsource CDN in `tokens/fonts.css`). Please upload NH 바른고딕 webfont files if production-grade fidelity is required. **Never substitute a different font in generated work — always `var(--font-sans)`.**
- **Icons** — NH uses a custom icon set + bespoke isometric 3D illustrations we don't have access to. UI icons substitute **Lucide** (CDN). The isometric illustrations in `assets/illustrations/` are **clean geometric placeholders** we built in the NH palette — replace with the real brand illustration assets when available.
- ~~**Logo** — `assets/logo*.svg` is a typographic lockup ("NH" in a blue rounded square + 농협은행 / 기업인터넷뱅킹), **not** the official NH trademark symbol. Swap in the real CI artwork for production.~~
  → **RESOLVED (2026-09-08).** `assets/` now carries the **official NH CI symbol and wordmark**, vector-extracted from the official raster originals in `mockup/public/assets/nh/logo/`. Do **not** hand-edit the paths — run `node scripts/trace-nh-ci.mjs`, which regenerates all five logo files plus the inline copies in `templates/`, and fails if pixel agreement (IoU) with the original drops below 99%. Only "기업뱅킹" stays typeset, as it is a service name rather than a trademark. See the 로고 section of [`../README.md`](../README.md).

---

## CONTENT FUNDAMENTALS
How NH기업뱅킹 writes.

- **Language**: Korean throughout. English appears only in product names and acronyms (`The Quicker`, `NH BOX`, `B2B`, `MMDA`, `ELD`, `ONE STOP`).
- **Voice / person**: Addresses the reader politely as 고객님; institution refers to itself as 농협은행 / NH. Honorific 합쇼체 endings: "이용해 보세요.", "안내드립니다.", "선물드려요!".
- **Tone**: Trustworthy, calm, service-oriented — but with light marketing warmth on promos ("선착순 300명에게 선물드려요!", "환급+α, 한번 더 챙기세요!"). Never slangy or jokey.
- **Casing & symbols**: Product names keep official casing. The hash motif `#빠르고 간편 #특판상품` tags promos. Bullet lists use the middot `·` ("· 서비스이용안내"). Rates read "최고 연 3.63%".
- **Hierarchy of copy**: 섹션 타이틀 (bold) → 부제목/설명 (regular, grey) → 본문/리스트. Headlines are short noun phrases ("기업 자금관리", "B2B전자결제"); supporting lines are one sentence.
- **CTAs**: Quiet inline links dominate — "자세히보기 ›", "바로가기 ›", "전체보기". Buttons are verbs/nouns: 조회, 가입하기, 로그인, 가입대상. Questions frame help sections: "도움이 필요하신가요?", "이용에 어려움이 있으신가요?".
- **Numbers**: Won amounts with thousands separators + 원 ("1,284,500,000원"); rates with % ; dates as `2026.06.27 기준`. Tabular figures.
- **Emoji**: None. Status/category is conveyed by colored pill badges (법인/개인/개인사업자, 입금/출금), not emoji.

## VISUAL FOUNDATIONS
- **Color** — 두 벌이 있고 섞어 쓰지 않는다. **CI 전용색상**(`--nh-ci-blue #005CA9` · `--nh-ci-yellow #FBBA00` · `--nh-ci-green #04A64B` · `--nh-ci-light-green #A2C617`)은 PANTONE 규격값으로 **로고·브랜드 표기 전용**이다. 화면 UI 는 아래의 ibz 실측 팔레트를 쓴다 — 이름이 같아도 값이 다르다. NH Blue `#0094D9` is the brand accent — logo, links, active tab underlines, accent CTAs, icon glyphs. **Deep navy `#122F50`** anchors 로그인 buttons and dark banners. **Slate-navy `#3F4A68`** is the workhorse filled-button color (가입하기/조회) — distinct from the bright blue. **NH Green `#00A04E`** marks NH BOX and select service tiles. Surfaces alternate **white** cards on **light-grey `#F5F6F8`** sections. Rates/negative amounts in **red `#E0392B`**; positive/입금 in green.
- **Type**: Noto Sans KR (sub for NH 바른고딕). Bold headings with tightened tracking (`-0.02em`), regular grey body. Strong, explicit 제목→부제목→본문 hierarchy. Korean reads best slightly negative-tracked; numerals are tabular.
- **Spacing**: 8px grid, generous whitespace, 1200px max container. Sections breathe (40–64px vertical rhythm). Content aligns to a 2–4 column grid.
- **Backgrounds**: Flat. White and `#F5F6F8` blocks define sections; dark navy for app/CTA banners. No photographic hero, no gradients to speak of — at most a faint tint (`--nh-blue-50`) on notice bars. Brand interest comes from **isometric 3D illustrations**, not textures or imagery.
- **Cards**: White, 1px light-grey border (`#E2E5EA`), **10px radius**, soft low shadow (`--shadow-sm`). Some carry a 3px top accent bar (e.g. green for NH BOX) or a top-right **↗** circle signalling "click to navigate". Service/promo cards pair a short headline with an isometric illustration bottom-right.
- **Borders & dividers**: Thin grey hairlines separate list rows; the product list has a 2px dark top rule. Pills use full-radius borders.
- **Shadows**: Restrained. `xs`/`sm` for cards, `md` for raised banners. No neon glows.
- **Radii**: `sm 6` (buttons/inputs), `md 10` (cards), `lg 14` (feature cards/banners), `pill` (filter & badge chips, primary list buttons).
- **Animation**: Minimal and functional — short (120–200ms) standard-ease color/shadow transitions on hover. No bounces, parallax, or decorative loops. Reduced-motion safe by default.
- **Hover / press**: Cards lift via shadow; buttons shift filter/brightness slightly. Active nav = blue text; active tab = blue underline; selected pill = filled slate-navy with white text.
- **Imagery vibe**: Cool, clean, corporate. Blues and greens, flat isometric, no grain or warmth.
- **Transparency/blur**: Sparingly — translucent white circles inside navy banners for the ↗ affordance; otherwise opaque.
- **Layout rules**: Fixed 1200px content column centered on full-bleed white/grey/navy bands. GNB is a stack: utility bar → logo+login row → main menu bar → optional blue category sub-bar.

## ICONOGRAPHY
- **System**: NH's real site uses a **bespoke icon set** plus **isometric 3D illustration icons** (계좌조회, 즉시이체, NH BOX 박스, 건물 등). These proprietary assets weren't available.
- **Substitute (UI glyphs)**: **Lucide** (CDN, `https://unpkg.com/lucide@0.460.0`) via the `Icon.jsx` wrapper (`<Icon name="Search" />`). Lucide's clean ~1.8px line style is the closest open match to NH's outline UI icons. Used for nav (Search, Star, ChevronRight/Down, Menu), quick actions (ScrollText, ArrowRightLeft, ReceiptText…), services, social, and contact. **Flagged substitution** — replace with NH's real icon font/SVGs for production.
- **Illustrations**: `assets/illustrations/*.svg` — geometric isometric placeholders (coins, card, security, transfer, building, document) in the NH palette, standing in for NH's 3D illustration set. Brand motif preserved (isometric, blue/green), but **not the real artwork**.
- **Emoji / unicode**: No emoji. A few unicode glyphs carry meaning by NH convention — `›` (자세히보기 chevron), `↗` (card navigation), `·` (list bullets), `★` (favorites). Keep these.
- **Currency**: `₩` / `원` for amounts.

---

## AI 작성 규칙 (RULES FOR AI AGENTS)
Read this section before generating anything. It is the contract — everything else in this file is context.

### 항상 (ALWAYS)
1. Link `styles.css` (or the bundled equivalent) as the **first** stylesheet. Every color, size, radius, and shadow comes from its CSS variables.
2. Use `var(--font-sans)` for all type. Korean copy, honorific 합쇼체, 고객님 address.
3. Cards: white, `1px solid var(--border-subtle)`, **10px radius**, `var(--shadow-sm)`. Sections alternate white / `var(--grey-50)`.
4. Content sits in a **1200px centered column** on full-bleed bands. 8px spacing grid.
5. Numerals: `font-variant-numeric: tabular-nums`, thousands separators + 원, rates as "최고 연 3.63%", dates as `2026.06.27 기준`.
6. Filled buttons default to `var(--surface-action)` (slate-navy). 로그인 uses `var(--nh-navy-800)`. Bright blue is for links and accents, not big buttons.
7. Inline text links read "자세히보기 ›" / "바로가기 ›". Navigable cards get a top-right ↗.
8. Korean headings want tight tracking (`letter-spacing: -0.02em` ~ `-0.04em`).

### 절대 금지 (NEVER)
1. **No hex/rgb literals.** If a color isn't a token, it isn't in the brand.
2. **No gradients**, no photographic heroes, no textures, no glows. Backgrounds are flat.
3. **No emoji.** Status is a colored pill badge. Only `›` `↗` `·` `★` `₩` are allowed glyphs.
4. **No other fonts** — no Inter, Roboto, Pretendard, system-ui stacks.
5. **No decorative animation.** Hover = 120–200ms color/shadow only. No bounce, parallax, or loops.
6. **No new radii.** 6 (buttons/inputs) · 10 (cards) · 14 (feature cards) · 999 (pills). Nothing else.
7. **No slangy or jokey copy**, no exclamation stacking outside promo lines.
8. Don't edit `_ds_bundle.js`, `_ds_manifest.json`, or `_adherence.oxlintrc.json` — they are generated.
   **한 가지 의도적 예외가 있다** — `_ds_manifest.json` 의 `tokens[]` 에 `--nh-ci-*` 4개와
   `cards[]` 에 `cards/colors-ci.html` 을 손으로 넣었다. 화면 생성 프롬프트에 나가는 토큰 목록의
   정본이 `tokens/colors.css` 가 아니라 **이 파일**이기 때문이다(`mockup/lib/canvas/designSystem.ts`).
   CSS 만 고치면 AI 는 CI 색을 보지 못한다. **export 를 다시 돌리면 이 값들이 조용히 사라지므로
   그때 다시 넣어야 한다.**

### 무엇을 먼저 볼 것인가 (WHERE TO START)
| 만들 것 | 먼저 열 파일 |
|---|---|
| 화면 목업 / 프로토타입 | `templates/` 의 해당 화면 → 복사 후 내용만 교체 |
| 전체 사이트 흐름 참고 | `ui_kits/ibz/index.html` |
| 버튼·카드·배지 등 부품 | `components/core/*.prompt.md` |
| 색·타입·간격 확인 | `cards/` 스펙시멘 카드 |

Copying a `templates/` entry and swapping the copy is **always** better than composing a screen from scratch.

### 산출물별 지침 (BY DELIVERABLE)
- **화면 목업 / 프로토타입** — start from a `templates/` entry. Keep the GNB stack (utility bar → logo+login → main nav → optional blue sub-bar) and the footer.
- **화면설계서 (spec doc)** — same tokens, but annotate: numbered callouts on the mock, a description table below. Keep the 1200px column; print at Letter/A4.
- **PPT / 발표자료** — 16:9. White or `var(--grey-50)` background, navy `var(--nh-navy-800)` for section dividers. Title 44px+, body never below 24px. Max two background colors across the whole deck.

---

## Index / manifest
**Root**
- `styles.css` — global entry (@import list). Consumers link this.
- `readme.md` — this file. `SKILL.md` — portable Agent-Skill manifest.

**`tokens/`** — `fonts.css` (Noto Sans KR @font-face), `colors.css`, `typography.css`, `spacing.css` (spacing/radius/shadow/motion/layout), `base.css` (resets).

**`assets/`** — `nh-symbol.svg`, `nh-wordmark.svg` (공식 CI 원본에서 추출), `logo.svg`, `logo-white.svg`, `logo-mark.svg` (그 둘로 조립한 락업); `illustrations/` (coins, card, security, transfer, building, document). 로고 5개는 전부 `scripts/trace-nh-ci.mjs` 산출물이다 — 손으로 고치지 말 것.

**`components/core/`** — reusable primitives (each `.jsx` + `.d.ts` + `.prompt.md`):
- `Button` — primary(blue) · slate(가입하기/조회) · navy(로그인) · accent(green) · outline · secondary · ghost.
- `LinkButton` — signature "자세히보기 ›" text link.
- `Card` — white container, optional accent bar + ↗ affordance.
- `Badge` — status/category chip (법인/입금/출금 등).
- `Input` — labeled field with focus ring, prefix/suffix.
- `Tabs` — underline (page) / pill (in-card).
- `core.card.html` — Components specimen card.

**`cards/`** — foundation specimen cards for the Design System tab: Colors (**CI 전용색상**, primary, navy+green, neutrals, semantic), Type (headings, body, numerals), Spacing (scale, radius+shadow), Brand (logo, illustrations, signature patterns).

**`ui_kits/ibz/`** — 기업인터넷뱅킹 recreation: `index.html` + `Header/Footer/Icon` + `HomeScreen/ProductListScreen/B2BScreen`. See its `README.md`.

**Namespace**: components are exposed at `window.NHDesignSystem_<id>` in card/kit HTML (run `check_design_system` for the exact suffix). Do not edit the generated `_ds_bundle.js` / `_ds_manifest.json`.
