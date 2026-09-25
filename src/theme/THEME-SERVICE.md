# Theme Service

This app's theming comes from the shared **theme-service**, currently on version `1.5.0`.
`theme.css`, `effects.css`, `dropdown.css`, `dropdown.js`, `themes.index.json`, `tokens.json` and
`theme-init.js` in this folder are vendored copies of the source of truth. Don't hand-edit them, and don't hardcode colors: consume the theme tokens (`var(--…)`).

## For agents working in this repo

This repo **already uses the theme-service** (see History below). Use the **theme-service skill**
(or its `AGENTS.md`) for any theme work here. Don't improvise, and don't re-apply from scratch.

- Update to latest: "Update this repo to the latest theme-service version."
- Add or change themes: see the theme-service repo's `CREATING-THEMES.md`.

Rules:

- Keep WCAG 2.2 AA.
- The default theme is Rink Classic (Auto).
- `theme-init.js` loads as an **external** script in `src/index.html`. Never inline it; strict CSP blocks inline scripts.
- This is an Angular app, so `theme-select.js` is **not** used. `ThemeService`
  (`src/app/core/services/theme.ts`) and `ThemePicker` (`src/app/shared/components/theme-picker/`)
  are the selector. The picker reads `themes.index.json` (and each theme's accents from `tokens.json`), so new
  themes from an update appear automatically. Re-copy `dropdown.css` / `dropdown.js` with the others on update.

## App-owned pieces (not vendored; keep them through updates)

- `src/original-theme.css`: the **Note and Seek Original** theme (`note-and-seek-original`), the app's
  pre-theme-service look kept alongside. Its id must match `ORIGINAL_THEME` in `theme.ts`.
- `src/styles.scss`: the **bridge** (`--app-*` properties) and the **Reduce motion** rule.
  - The bridge maps the app's color roles onto the tokens. Its tints are global so component styles stay under
    the 12 kB `anyComponentStyle` budget (`note-tutor.scss` is about 11.5 kB).
  - Reduce motion stops the app's own animations under `data-motion="off"` and `prefers-reduced-motion`.
    theme-service stops only its own effects.
- `ThemeService` / `ThemePicker`, and the form-control guard in `note-input.ts`, which keeps digits typed
  into the picker (its listbox and trigger included) from answering the quiz.
  - `theme-picker.scss` ports the A11Y Way pages' theme console (theme-service
    `a11y-way-pages/assets/site-header.css`, `.theme-console`). Re-sync from there if it changes.
    It also ports `components.css`'s `.switch` toggle for Reduce motion, and defines the tokens both need
    from `components.css` (`--font-ui`, `--font-mono`, `--radius`, `--radius-sm`, `--radius-pill`, `--dur`),
    scoped to the picker.
- `angular.json`: the theme CSS in `styles` and `dropdown.js` in `scripts` (build and test), the `theme-init.js` asset, and production
  `optimization.styles.inlineCritical: false`. With critical-CSS inlining on, the full stylesheet loads
  asynchronously and `[data-theme]` rules miss first paint, so a saved theme would flash the default.

## Applied configuration (current decisions on record)

- Component styling: `colors-only`. Existing components keep their shape and layout; only colors map to tokens.
- Fonts: `kept app fonts` (Courier New monospace). `components.css` is not used.
- Background effect: `game area`. `.fx-grid` is on `main.game-area`, where the app's own grid already was.
  The panels cover nearly the whole page background, so it wouldn't show elsewhere.
  The Original theme redraws its original 40px grid through `--fx-backdrop-image`.
- Selector: the A11Y Way pages' **theme console**, plus a Reduce motion checkbox. Placement: the header, right of
  the title; it wraps below the title on phones.
  - The console has a "Theme" cap, four lamps showing the current palette, and theme-service's accessible listbox
    (`dropdown.js`). The listbox groups themes by family, with dot swatches (`data-dropdown-swatch-style="dots"`),
    and shows the full name on the closed trigger. The panel anchors to the whole console.
  - The native `<select>` stays underneath as the value store and the no-JS fallback.
  - One deliberate difference from the pages: the cap text is `--text`, not `--text-muted`. Muted falls below
    4.5:1 on the cap's tint in the NEO and RFG themes, and the pages' own header has the same shortfall.
  - Reduce motion is the pages' switch (track and thumb), placed left of the console as on the pages.
    It shows as on and disabled, with "(set by your device)", when the OS already asks for reduced motion.
  - Phones (≤620px) follow the pages: one row with the switch then the console. The console fills what the
    switch leaves, and the cap is visually hidden but still names the control.
  - Only the selector and the switch follow the pages; nothing else in the app was restyled.
- Existing themes: `kept alongside`. The Original is listed right after Auto; Auto (Rink Classic) is the default.
  - The Original fixes 5 spots that fell short of AA: list markers use `--accent-purple` `#9a68cd`;
    Hint/Reset borders use `--border-strong` `#8142c0`; the active menu row tint is 10%, down from 15%;
    "Loading…" uses solid muted text. The Original's palette passes every pair the theme-service build validates.
- App color decisions made during the apply:
  - Key badges (1–7) use `--app-badge-text` (`--text`), because muted text fell short of AA on their tint.
  - A keyboard-focused menu row or Level/Clef/Note button drops its hover/active tint, because some themes'
    focus rings fell below 3:1 on it.
- Known exception: in **NEO · Dark** (with background), the Hint/Reset button border (`--border-strong`) measures
  2.72:1 against the single brightest falling-code glyph. theme-service validates rain over `--bg`, but the
  game area is `--bg-panel`. The button text passes, and WCAG doesn't require a border on a text-labelled
  button. It's left as-is pending a decision (options: dim the rain in the game area, or accept it).

## History

<!-- Append one entry per apply/update. Most recent last. Never edit past entries. -->
- `2026-09-24`: Applied theme-service `v1.5.0` (colors-only, existing Angular app).
  - Vendored `theme.css`, `effects.css`, `themes.index.json` and `theme-init.js`.
  - Mapped every hardcoded color in the app's SCSS to tokens and the `--app-*` bridge.
  - Kept the original look as "Note and Seek Original", with 5 AA fixes.
  - Added the header theme picker and Reduce motion toggle, and put `.fx-grid` on the game area.
  - Disabled critical-CSS inlining to prevent a theme flash in production.
  - Fixed pre-existing focus rings clipped by `clip-path` or `overflow`.
  - Checked the app-specific contrast pairs in all 25 themes: one exception remains (NEO Dark rain, above).
- `2026-09-24`: Restyled the theme selector as the A11Y Way pages' theme console.
  - Vendored `dropdown.css`, `dropdown.js` and `tokens.json`.
  - The native `<select>` is now enhanced into theme-service's grouped listbox with dot swatches.
  - Cap text is `--text` for AA; nothing else was restyled.
- `2026-09-24`: Made Reduce motion the pages' switch and moved it left of the theme console.
  - Adopted the pages' phone layout: one row, cap hidden.
  - Added the pages' Windows High Contrast outlines for the lamps and swatch dots.
- `2026-09-25`: Fixed the theme selector widening the page on phones when a long theme name was selected.
  - Ported the pages' 1080px sizing: a fluid console up to 340px, the control filling the rest, and long names
    ellipsizing.
  - At ≤620px the console gets `contain: inline-size`. The note tutor's grid column can't shrink below its
    content, which the pages' header doesn't have, so this keeps the console's width out of the page.
  - No overflow from 360px up. At 320px the pre-existing Level/Clef/Note row still sets a 343px minimum.
