---
name: nh-gibeop-banking-design
description: Use this skill to generate well-branded interfaces and assets for NH농협은행 기업인터넷뱅킹 (NongHyup Bank corporate internet banking), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the conservative, trustworthy NH 기업뱅킹 web style.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `styles.css` — link this one file to get all tokens + the Noto Sans KR webfont.
- `tokens/` — colors, typography, spacing/radius/shadow, fonts. Brand colors: NH Blue `#0094D9` (accent/links), navy `#122F50` (login/banners), slate `#3F4A68` (가입하기/조회 buttons), NH Green `#00A04E` (NH BOX).
- `assets/` — logo lockups + isometric illustrations (placeholders — see substitution notes in readme).
- `components/core/` — Button, LinkButton, Card, Badge, Input, Tabs (React; consume via `window.NHDesignSystem_<id>` after loading `_ds_bundle.js`, or just copy the patterns).
- `cards/` — foundation specimen cards (colors, type, spacing, brand).
- `templates/` — copy-ready full screens (로그인 · 상품 상세 · 메인 대시보드 · 프로세스 섹션). **Start here** for any mock, 화면설계서, or PPT — copy one and swap the content rather than composing from scratch.
- `ui_kits/ibz/` — full recreation of the 기업인터넷뱅킹 web surface (메인 · 금융상품 · B2B전자결제). Best reference for full-page layout, GNB, and footer.

## Signature patterns to honor
- Card-based layout, white cards on `#F5F6F8` sections, 10px radius, thin grey borders, soft shadows.
- "자세히보기 ›" inline text links; top-right `↗` on navigable cards.
- Slate-navy filled buttons for 가입/조회/로그인; bright blue for accents/links.
- Korean honorific tone (고객님, …하세요/…드립니다); no emoji; middot `·` bullets; rates "최고 연 3.63%".
- Isometric 3D illustrations as the main decorative motif — never gradients, photos, or textures.

## Hard rules
Never: hex literals outside tokens · gradients · emoji · other fonts · decorative animation · radii other than 6/10/14/999.
Always: `styles.css` linked first · `var(--font-sans)` · 1200px centered column · tabular numerals · slate-navy filled buttons · "자세히보기 ›" links.
Full contract: `readme.md` → **AI 작성 규칙**.

## Substitutions (flag to user for production)
- Font: **Noto Sans KR** substitutes proprietary **NH 바른고딕**.
- Icons: **Lucide** substitutes NH's custom icon set.
- Illustrations: geometric placeholders, not official CI artwork.
- ~~Logo: typographic placeholder.~~ **Resolved 2026-09-08** — `assets/` carries the official NH symbol and wordmark, vector-extracted from the official originals. Regenerate with `node scripts/trace-nh-ci.mjs`; never hand-edit the paths.

## Brand colors — two sets, do not mix
- **CI 전용색상** (`--nh-ci-blue #005CA9` · `--nh-ci-yellow #FBBA00` · `--nh-ci-green #04A64B` · `--nh-ci-light-green #A2C617`): PANTONE-spec values. Logo and brand marks only.
- **UI palette** (`--nh-blue-500 #0094D9` etc.): measured from the live ibz site. Buttons, links, surfaces.
