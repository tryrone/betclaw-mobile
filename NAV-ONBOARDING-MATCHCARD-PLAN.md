# Plan — Bottom nav, onboarding, and match cards (reference-image parity)

Reference: lime/dark design — anchored icon-only nav bar, full-bleed onboarding hero, black match cards with live score / upcoming odds layouts. Date: 2026-07-02.

## 1. Bottom nav → anchored icon bar

Target: full-width black bar sitting flush at the bottom (not a floating dock), icon-only items, active item = filled primary circle with dark icon, inactive = thin muted outline icons.

Changes in `src/components/ui/DashboardBottomNav.tsx`:

1. **Anchor it**: remove the `glow` strip and the horizontal gutter/`borderRadius` treatment on `wrap`/`dock`. New shape: `borderTopLeftRadius`/`borderTopRightRadius: 28`, width 100%, `bottom: 0`, background solid `#0b0d0a`-style token (`theme.panelElevated` solidified), hairline top border only. Safe-area inset becomes internal `paddingBottom` so the bar itself touches the screen edge.
2. **Icon-only items**: drop the `label` Text from `NavItem` and the More button (keep `accessibilityLabel`). Icons: Home, Wand2 (Fix), Wallet, History, Menu — sized 22, `strokeWidth 1.8` inactive.
3. **Active state**: replace the pill-gradient highlight with a solid primary circle (52×52, `borderRadius: pill`, `backgroundColor: theme.primary`) behind the icon; active icon color `theme.primaryDark`. Inactive: transparent, icon `theme.muted`.
4. **Height/clearance**: bar height ~72 + inset; update `NAV_CLEARANCE` in `Screen.tsx` to match (≈96).
5. More-sheet stays as is (still opens from the Menu icon).

## 2. Onboarding screen + buttons

Target (`src/app/(auth)/welcome.tsx`, 605 lines): full-bleed player hero on black, bottom-anchored copy block, pagination dots bottom-left, lime pill CTA bottom-right with trailing circular arrow chip.

1. **Hero**: full-screen `Image` (existing onboarding assets) with a bottom `LinearGradient` scrim (`transparent → #000` ~55%→100%) so text sits on black.
2. **Copy block**: two-line extra-bold headline (~34px, tight lineHeight, white) with inline emoji/icon chips after the second line; muted 15px subcopy underneath. Left-aligned, `spacing.xl` from edges.
3. **Footer row**: left = pagination dots (active dot = wide lime pill, inactive = small dark dots — style exists conceptually in welcome's step indicator; restyle to match); right = CTA.
4. **CTA**: reuse `DashboardButton` with `iconChip` (`ArrowUpRight` icon), height 52, `paddingHorizontal: 24`. Replace the legacy `GradientButton` usages on welcome/auth screens with this so all onboarding buttons match.
5. Keep the existing multi-step state machine; only the presentation changes.

## 3. Live match card (home feed)

Target: black card, header "Match day N" + stats/star icon buttons, logo+name columns left/right, league + group centered, huge score digits flanking a center pill with elapsed time + phase, red "· Live" label above the pill.

Changes in `src/app/(tabs)/index.tsx` (`MatchCard`, line ~650) — split into `LiveMatchCard` / `UpcomingMatchCard` (new `src/components/home/MatchCards.tsx`):

1. **Card shell**: solid `theme.card` bg, radius.xl, generous padding (`spacing.lg`), header row: muted "Match day {round}" caption + two circular icon buttons (BarChart, Star) right.
2. **Teams row**: 3-column grid — TeamLogo 56 + name (left, bold 15), center column league name + stage (muted), TeamLogo + name (right-aligned).
3. **Score row**: home/away scores as 48px extraBold tabular white digits at the outer thirds; center = red Live dot + "Live" label above a dark inner pill (`radius.lg`, `theme.surface`) showing `elapsedMinute'` (mm:ss if available) over "1st half/2nd half" phase from `dataSnapshot.phase`/`status`.
4. **Data**: `score` parsed via existing `parseScore`; live detection via `elapsedMinute`/`status` (helpers already exist in match/[id] — extract to `src/lib/match-status.ts` and reuse).
5. Whole card presses through to `/match/{fixtureId}` (already does).

## 4. Upcoming match card

Same shell as live card, differences:

1. **Center pill** shows date ("16 April") over kickoff time ("20:00") instead of score/live; no score digits.
2. **Odds row** underneath: three `DashboardOddsButton`s (already built) — labels "1", "x", "2".
   - Data gap: `FeedMatch` only carries `bestMarket.odds` (single value), not 1X2. Plan: (a) render the odds row when a new optional `matchOdds?: { home?: number; draw?: number; away?: number }` field is present — add to `FeedMatch` type now; (b) until the feed serializer (web repo, `matchday` router) exposes it, fall back to a single best-market pill ("{label} · {odds}") so cards never look empty.
3. Kickoff formatting helpers already exist (`formatMatchTime` in index.tsx).

## Execution order

1. Bottom nav (isolated component + `NAV_CLEARANCE`).
2. Match cards (extract `MatchCards.tsx`, wire into home feed for live/upcoming branches).
3. Onboarding restyle (largest file churn, no data risk).
4. `FeedMatch.matchOdds` type addition + fallback pill.
5. Verify: `npx tsc --noEmit`, lint changed files, simulator pass on home feed (live + upcoming fixture), onboarding flow, and nav on both notch/non-notch devices.

## Out of scope (needs server work)

- Real 1X2 odds in the home feed payload (web `matchday` serializer change).
- "Match day N" needs `round` on `FeedMatch` — fall back to league stage text if absent.
