# Changelog

## [1.2.3] - 2026-03-28

### Added
- `src/post.html`: Added `.post-back` block below `{{POST_NAV}}` with a static `← 回到首页` link pointing to `../index.html`
- `src/styles.css`: `.post-back` centered container + `.post-back__link` — `var(--text-secondary)` default color, transitions to `var(--text)` on hover/active; hover wrapped in `@media (hover: hover)`

## [1.2.2] - 2026-03-28

### Added
- `src/post.html`: Added `{{POST_NAV}}` placeholder after `<article>` for build-time injection of prev/next navigation
- `src/build.js`: Computes `prevPost` (index `i-1`, newer) and `nextPost` (index `i+1`, older) for each post in the date-descending sorted list; generates `.post-nav` HTML with two `.post-nav__item` anchors (or empty `<span>` placeholders when no adjacent post exists); injected via `{{POST_NAV}}` into each post page at build time
- `src/styles.css`: `.post-nav` styles — `flex` row with `space-between`, `border-top` separator; `.post-nav__item--next` right-aligned via `text-align: right; margin-left: auto`; `.post-nav__label` in `var(--accent)` uppercase caps; `.post-nav__title` two-line clamp; hover wrapped in `@media (hover: hover)`

## [1.2.1] - 2026-03-28

### Fixed
- `src/styles.css`: Wrapped `.navbar-logo:hover .bio-card` show rule in `@media (hover: hover)` — prevents bio card from getting "stuck" open on touch devices after a tap
- `src/styles.css`: Wrapped `.post-item:hover` opacity rule in `@media (hover: hover)` — prevents list items from remaining dimmed after a tap on mobile
- `src/styles.css`: Removed `@keyframes macaron-flicker` and `.navbar-logo a:hover img` animation rule — eliminates the logo flicker effect entirely

## [1.2.0] - 2026-03-27

### Added
- `src/index.html` / `src/post.html`: Bio card tooltip on logo hover — liquid glass card (`border-radius: var(--radius-card)`) with three layers (`liquidGlass-effect/tint/shine`) appears below the logo with `opacity` + `scale` reveal animation; content: name in uppercase wide-tracked caps, gold gradient divider (`linear-gradient` from `var(--accent)`), tagline + role, awards list with gold `·` bullets; reuses the same `#glass-distortion` SVG filter already in the page
- `src/styles.css`: `.bio-card` CSS — `position: absolute; top: calc(100% + 10px)` relative to `.navbar-logo`; `.navbar-logo:hover .bio-card` shows it; `.bio-card .liquidGlass-*` overrides border-radius to `var(--radius-card)` to match the card shape; dark mode tint variant; `z-index: 200` ensures it floats above page content
- `src/styles.css`: Removed `overflow: hidden` from `.navbar` to allow bio card to extend below the navbar pill — glass layers maintain pill appearance via their own `border-radius: var(--radius-pill)`

## [1.1.9] - 2026-03-27

### Changed
- `src/index.html` / `src/post.html`: Upgraded to new liquid glass implementation — SVG filter `#glass-distortion` now uses a full pipeline: `feTurbulence` (fractalNoise, seed 17) → `feComponentTransfer` (gamma R-channel to sharpen noise) → `feGaussianBlur` (smooth the map) → `feSpecularLighting` with `fePointLight` (adds physical light reflection) → `feComposite` → `feDisplacementMap in2="softMap"` (displaces backdrop using the organic noise); HTML layers reduced from 4 to 3: `liquidGlass-effect` / `liquidGlass-tint` / `liquidGlass-shine`
- `src/styles.css`: Replaced `liquid_glass-*` rules with `liquidGlass-*`; `liquidGlass-effect` uses `backdrop-filter: blur(24px) saturate(180%)` + `filter: url(#glass-distortion)` — the SVG distortion is applied to the already-blurred backdrop output; added outer `box-shadow` to `.navbar` for depth

## [1.1.8] - 2026-03-27

### Changed
- `src/index.html` / `src/post.html`: Navbar rebuilt with true liquid glass — inline SVG `<filter id="liquid_glass_filter">` with `feDisplacementMap scale="150"` provides refractive edge distortion; four-layer structure: `liquid_glass-outer` (displacement filter masked to 5px border ring via `mask-composite: exclude`), `liquid_glass-cover` (broad `backdrop-filter: blur(48px) saturate brightness` + semi-transparent tint), `liquid_glass-sharp` (1px inset `box-shadow` edge highlights), `liquid_glass-reflect` (soft inset inner glow); content layers (`navbar-logo`, `navbar-toggle`) use `z-index: 5` to sit above all glass layers
- `src/index.html` / `src/post.html`: Removed navbar collapse/expand animation — `.navbar-fill` div and scroll event listener removed; `.navbar-toggle` uses `margin-left: auto` to maintain right-side positioning
- `src/styles.css`: Removed `--glass-bg`, `--glass-shadow`, `--glass-filter` variables (no longer needed); navbar is now a single persistent pill (`position: relative; overflow: hidden; border-radius: var(--radius-pill)`); removed `body.scrolled` state rules

## [1.1.7] - 2026-03-27

### Changed
- `src/index.html` / `src/post.html`: Replaced View Transition curtain effect with plain CSS fade — `toggleTheme` now simply sets `data-theme` and `aria-pressed`; the existing `transition: background-color 0.3s ease, color 0.3s ease` on `html` provides the smooth cross-fade with no JavaScript animation logic
- `src/styles.css`: Removed `view-transition-name: navbar-toggle` and associated `::view-transition-old/new(navbar-toggle)` rules; removed the curtain-related `::view-transition-old/new(root)` z-index workaround (root pseudo-element rules for page navigation remain)

## [1.1.6] - 2026-03-27

### Fixed
- `src/styles.css`: Toggle button no longer hidden behind the collapsing dark curtain during dark→light theme switch — `view-transition-name: navbar-toggle` lifts `.navbar-toggle` into its own compositing layer above `::view-transition-group(root)`, so the root curtain slides behind the button; `::view-transition-old(navbar-toggle){opacity:0}` / `::view-transition-new(navbar-toggle){opacity:1}` makes the toggle's own layer pass-through (live DOM always visible), leaving the bear animation fully unobstructed throughout the transition

## [1.1.5] - 2026-03-27

### Changed
- `src/styles.css`: Logo gains a macaron-palette flicker on hover — `@keyframes macaron-flicker` animates `sepia(1) saturate(4) brightness(2.2) hue-rotate()` from 340° to 700° (one full cycle plus a 20° overlap) with `steps(6, end)`, producing 6 discrete hue jumps: strawberry pink → peach → pistachio → mint → sky blue → lavender; the `brightness(2.2)` lift is necessary to give the sepia layer enough luminance for hue-rotate to produce vivid color on an otherwise near-black logo PNG; hover sets `transition: none` so entry is instant while exit smoothly returns via the existing `transition: filter 0.3s ease` on `.navbar-logo img`

## [1.1.4] - 2026-03-27

### Changed
- `src/index.html` / `src/post.html`: Replaced three-wave overlay animation with View Transition API curtain effect — **Light→Dark**: `::view-transition-new(root)` expands from `circle(0)` at button center to `circle(maxR)` (dark page grows outward from button); **Dark→Light**: `::view-transition-old(root)` shrinks from `circle(maxR)` to `circle(0)` at button center (dark screenshot collapses back into button, revealing light page underneath); a temporary style injects `z-index:1` on `old` / `z-index:0` on `new` for the dark→light case so the collapsing dark layer is visible above the already-switched light DOM; `document.documentElement.style.transition = 'none'` inside the callback prevents the html `background-color` CSS transition from appearing in the live new-state canvas mid-reveal; animation origin derived from `btn.getBoundingClientRect()` center rather than screen corner

## [1.1.3] - 2026-03-27

### Changed
- `src/index.html` / `src/post.html`: Replaced single `startViewTransition` clip-path animation with a three-wave layered ripple effect — three `div` overlays with staggered `clip-path: circle()` WAAPI animations (`waveDuration: 460ms`, `waveStagger: 110ms`, total 680ms); each wave is a step toward the destination background color (e.g. light→dark: `hsl(219,22%,36%)` → `hsl(219,26%,22%)` → `hsl(219,30%,12%)`); theme snaps under full coverage with a temporary `*{transition:none!important}` style tag, overlays and transitions restored in the same `requestAnimationFrame` paint cycle for a flicker-free reveal; `toggleTheme._busy` guard prevents overlapping clicks

## [1.1.2] - 2026-03-27

### Fixed
- `src/styles.css`: Table switched from `border-collapse: collapse` to `border-collapse: separate; border-spacing: 0` — required for `border-radius` to apply on table cells; `border-top-left-radius` / `border-top-right-radius: var(--radius-card)` added to `thead th:first-child` / `th:last-child` to round the header top corners

## [1.1.1] - 2026-03-27

### Changed
- `src/index.html` / `src/post.html`: Added LXGW WenKai Lite webfont (`jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.1.0`) as primary typeface for refined CJK + Latin rendering
- `src/styles.css`: LXGW WenKai Lite added as first entry in `font-family` stack
- `src/styles.css`: Table redesigned to match clean Apple-style layout — `thead tr` gets subtle gray background (`rgba(0,0,0,0.04)` light / `rgba(255,255,255,0.06)` dark), headers use regular weight in `--text-secondary` color (removed uppercase/letter-spacing), cell padding increased to `14px 16px`
- `src/index.html` / `src/post.html`: Clip-path theme-toggle animation duration aligned to `500ms` (was 600ms) — now matches the bear button's `--speed: 0.5s` so both animations finish together

## [1.1.0] - 2026-03-27

### Changed
- `src/styles.css`: iOS 26 liquid glass navbar — upgraded from frosted glass (`blur(24px)`) to liquid glass (`blur(48px) saturate brightness`), with multi-layer `box-shadow` including `inset 0 1px 0 rgba(255,255,255,0.80)` specular highlight and bottom shadow for physical glass material depth
- `src/styles.css` / `src/index.html` / `src/post.html`: Navbar now uses three-segment layout — `navbar-logo | navbar-fill | navbar-toggle`; the fill collapses via `transform: scaleX(0)` with `transform-origin: center` so the split opens from the center outward toward both sides; `flex: 1` on the fill keeps logo and toggle positions fixed throughout the animation
- `src/styles.css`: All three navbar segments use `align-self: stretch` so their borders align at the same vertical position, forming a seamless continuous pill; `border-right-color` / `border-left-color` transition from `transparent` → `var(--glass-border)` as each segment becomes its own pill

## [1.0.9] - 2026-03-27

### Added
- Build-time syntax highlighting via Shiki (github-light / github-dark dual-theme): HTML, CSS, JavaScript, TypeScript, Rust, Bash, JSON, YAML, Markdown; unsupported languages fall back to plain preformatted text
- `src/styles.css`: Shiki dark-mode token override via `[data-theme="dark"] .shiki span { color: var(--shiki-dark) }` — no browser JS required for theme switching

## [1.0.8] - 2026-03-27

### Changed
- `src/styles.css`: Post page main title scaled to 21px (matching list title) with weight 600; content headings adjusted to h1: 19px / h2: 17px / h3: 15px / h4: 14px; body text 15px — refined, compact typographic scale
- `src/build.js` / `src/post.html`: Moved `view-transition-name` from individual title elements to the whole header block (`div.post-item-content` ↔ `header.post-header`), so title + date + intro slide together as one unit during page navigation

## [1.0.7] - 2026-03-27

### Added
- Shared element title transition between post list and post page via `view-transition-name: post-title-{slug}`: list `<h2>` and post `<h1>` now carry matching names so the browser morphs position/size/appearance during navigation
- `src/build.js`: Inject `{{SLUG}}` placeholder into post templates; add `view-transition-name` inline style on list titles
- `src/post.html`: Add `view-transition-name: post-title-{{SLUG}}` to `<h1>`

## [1.0.6] - 2026-03-27

### Changed
- `src/styles.css`: Remove top border from first post item and bottom border from last post item — only inter-item dividers remain

## [1.0.5] - 2026-03-27

### Fixed
- `src/index.html` / `src/post.html`: Move `aria-pressed` update inside `startViewTransition()` callback so the button animation and page background change happen simultaneously — previously `aria-pressed` was set before the transition snapshot, causing the button to flip before the background

## [1.0.4] - 2026-03-27

### Changed
- `src/toggle.html`: New partial — the elaborate day/night toggle button by jh3y (codepen LYgjpYZ), featuring a sky scene with sun/moon, clouds, stars, a pilot bear (day), and an astronaut bear (night)
- `src/build.js`: Loads `src/toggle.html` at build time and injects it via `{{THEME_TOGGLE}}` placeholder in both page templates
- `src/styles.css`: Replaced simple circle button with full toggle button CSS; all CodePen variables scoped to `.toggle` to avoid conflicts; `--width: 80px` scales it down for the navbar
- `src/index.html` / `src/post.html`: Replaced inline SVG moon/sun button with `{{THEME_TOGGLE}}`; JS now bridges `aria-pressed` (drives button animation) with `data-theme` (drives blog theme)

## [1.0.3] - 2026-03-27

### Changed
- `src/build.js`: Post title is now taken from the first H1 heading (`# 标题`) in the markdown body; falls back to frontmatter `title`, then filename

## [1.0.2] - 2026-03-27

### Changed
- `src/build.js`: Extract post description from `Intro:` field in blockquote immediately below H1
- `src/build.js`: Extract post date from `Time:` field in blockquote immediately below H1 (falls back to frontmatter `date`, then file birthtime)
- `src/build.js`: Copy all non-`.md` files (images, etc.) from `posts/` to `public/posts/` so relative image paths in Markdown resolve correctly
- `src/build.js`: Post list thumbnail now uses the first image found in the article; omitted entirely when no image exists
- `src/build.js`: Image src adjusted from post-relative (`./img/x.jpg`) to index-relative (`posts/img/x.jpg`) for list thumbnails
- `src/styles.css`: `.post-thumbnail` updated to render `<img>` instead of a fixed yellow square
- `posts/*.md`: Updated sample posts to use new `Intro` / `Time` blockquote metadata format

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-03-27

### Added
- Initial implementation of Pencil blog generator
- `src/build.js`: ES module build script that converts Markdown to HTML
  - CLI support: `--posts` / `-p` and `--output` / `-o` flags for custom directories
  - Frontmatter parsing via `gray-matter` (title, date, description)
  - Markdown rendering via `marked`
  - Automatic excerpt extraction from first paragraph
  - Posts sorted by date descending (newest first)
  - Copies CSS and logo assets to public/assets/
- `src/styles.css`: Shared stylesheet for all generated pages
  - CSS custom properties for light/dark theming
  - Liquid glass navbar with `backdrop-filter` blur/saturate
  - Navbar split animation: unified pill → two separate pills on scroll
  - Apple-inspired typography and spacing
  - Full post content typography (headings, code, blockquotes, tables)
- `src/index.html`: Homepage template with post list
  - View Transition API for cross-page navigation (`@view-transition`)
  - Dark/light mode toggle with clip-path reveal animation
  - Theme persisted in `localStorage`, reads `prefers-color-scheme` as default
- `src/post.html`: Individual post page template
  - Back navigation link
  - Same navbar and theme toggle as homepage
- `posts/hello-world.md`: Sample post — Introduction to Pencil
- `posts/second-post.md`: Sample post — Liquid glass CSS technique
- `posts/third-post.md`: Sample post — View Transition API usage
