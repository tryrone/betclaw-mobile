# UI Review & Improvement Plan — betclaw-mobile

Reviewed: uncommitted changes on `master` (22 files, +2,734 / −1,152). Date: 2026-07-01.

## What changed (summary)

A full dark "dashboard" redesign:

- **Theme**: lime green (`#A9E828`) → teal (`#2ef2d0`) primary with amber (`#ffd34d`) accent; app is now dark-only (both palettes contain dark values). New glassy card/surface tokens, stronger shadows.
- **Navigation**: old pill `TabBar` gutted — now delegates to new `DashboardBottomNav` (4 primary items + "More" modal sheet with 4 more).
- **New primitives**: `DashboardPrimitives.tsx` (GlassCard, SectionHeader, Metric, Chip, Button, PillField, StatePanel) and `DashboardBottomNav.tsx`.
- **Background**: added teal/amber radial glows + a grid overlay layer.
- **Screens**: home (`(tabs)/index.tsx`) and match detail (`match/[id].tsx`) heavily rebuilt; all secondary screens switched to `<Screen dashboardNav hasTabs>`.
- **Sizing**: GlassCard padding md→lg, radius lg→xl; buttons 48→44; header title 26→24 with uppercase eyebrow.

## Issues found (fix before commit)

1. **Light palette destroyed, not disabled.** `colorPalettes.light` now holds dark values. If dark-only is intentional, force the scheme in the theme controller (or `app.config.js` `userInterfaceStyle: 'dark'`) and keep one palette — don't ship a "light" palette that lies.
2. **`gridOverlay` is a no-op.** `Background.tsx` adds a `gridOverlay` view with opacity 0.14 but no background color, image, or pattern — renders nothing. Implement the grid (SVG pattern / repeated hairlines) or delete it.
3. **Inconsistent bottom clearance.** `Screen` gives `dashboardNav` screens 124px bottom padding but tab screens (`hasTabs`) only 88px — same dock (68px + glow + insets) on both. Content can sit too close to the dock on tab screens. Unify to one value/prop.
4. **`hasTabs` is now redundant noise.** Every `dashboardNav` screen also passes `hasTabs`, which is dead (dashboardNav wins the ternary). Collapse to a single `nav` prop.
5. **Hardcoded teal rgba values.** `rgba(46,242,208,…)` appears ~6× in `DashboardBottomNav.tsx` and in screens/gradients. Add tokens (e.g. `primaryGlowStrong/Soft`) so the next rebrand isn't another 20-file diff.
6. **Pointless gradient.** `primaryButton` gradient is now two identical stops (`#2ef2d0 → #2ef2d0`). Use a flat color or restore a real ramp (e.g. `#5ff7dd → #2ef2d0`).
7. **Duplication debt.** `GlassCard` vs `DashboardGlassCard`, `TabBar` vs `DashboardBottomNav` — old components survive only as shims/parallel APIs. Migrate remaining `GlassCard` users and delete the legacy ones.
8. **Monolith screens.** `(tabs)/index.tsx` is ~1,500+ lines. Extract sections (DailyTicket, LeagueFilter, TelegramCTA, FeedList) into `src/components/home/`.

## Suggested UI improvements

- **Contrast**: `muted` `#8fa09d` at 10–11px (nav labels, sheet subtitle) is borderline on the dark glass. Bump size to 11–12px or lighten to ~`#a3b3b0` for WCAG AA.
- **Nav ergonomics**: 5 slots with 10px labels is crowded on small phones. Consider icon-only inactive items with label on active, or drop "More" label.
- **"More" sheet**: items inside it (Wallet, Profile) are core destinations buried behind a modal. Consider promoting Wallet to the dock and moving Build into "More".
- **Motion**: old TabBar had spring halo animation; DashboardBottomNav has none. Add a subtle `withSpring` scale/fade on active state for parity.
- **Glow perf**: two absolute glow views + BlurView per screen; on Android BlurView is costly — verify FPS on mid-range device, consider `experimentalBlurMethod` or static gradient fallback.
- **Reduced transparency**: glass-on-glass (card 5.5% white over dark gradient) can look muddy on low-brightness OLED; consider a slightly higher floor for `card` (7–8%).

## Padding reduction plan (−50% app gutter)

Current outer gutter is defined once in `src/components/ui/Screen.tsx`:

```
content: {
  paddingHorizontal: spacing.md,  // 12 → target 6
  paddingTop: spacing.md,         // 12 → target 6
}
```

Steps:

1. Add a layout token in `src/theme/spacing.ts`:
   ```ts
   export const layout = { screenGutter: 6 } as const;
   ```
2. In `Screen.tsx`, set `paddingHorizontal: layout.screenGutter` and `paddingTop: layout.screenGutter`.
3. Match the dock: `DashboardBottomNav` `wrap.paddingHorizontal: spacing.md` → `layout.screenGutter` so the dock aligns with the new content edge (optional — keep at 12 if the dock should stay inset).
4. Out of scope (unchanged): interior paddings (`GlassCard`, buttons, chips) — those are component padding, not the app gutter.
5. Verify: run on iPhone SE-width (375) and Pixel; check edge-to-edge cards don't collide with rounded screen corners, and horizontal `ScrollView`s (league chips) still show their edge fade correctly.

## Execution order

1. Padding reduction (steps above) — small, isolated.
2. Fixes #1–#6 (correctness/token hygiene).
3. Improvements (contrast, nav ergonomics, motion).
4. Refactors #7–#8 (dedupe, extract sections).
5. Final pass: `yarn lint && npx tsc --noEmit`, manual QA on both platforms, then commit in logical chunks (theme, nav, screens).
