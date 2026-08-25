# BetClaw mobile design system

## Product character

BetClaw is a calm sports-intelligence product, not a casino skin. The interface should make confidence, evidence freshness, market price, expected value, and settled performance easy to distinguish. A missing or rejected pick is a valid state and must never be dressed up as a recommendation.

## Applied foundation

- Display type: Sora 700/800 for page titles and major figures.
- Body type: Inter 400–800 for compact, highly legible supporting information.
- Color: navy/indigo surfaces; coral is brand accent; green, amber, and red are reserved for semantic success, caution, and failure.
- Shape: 8/12/20/28 radii. Pills are reserved for statuses, filters, and compact actions.
- Layout: 16pt phone gutter, 520pt content cap, minimum 44pt touch targets.
- Navigation: Today, Matches, Tools, Activity, Account. Creation utilities live under Tools instead of competing with the daily intelligence feed.
- Motion: short entrance and press feedback only; reduced-motion preference remains authoritative.
- Themes: every component uses semantic light/dark tokens. Never hard-code a dark-only foreground on a light surface.

## Component rules

- Prediction cards show model probability and market-implied probability as separate measures.
- Data readiness and provider freshness are evidence labels, never confidence substitutes.
- `SHADOW` model output is always rendered as `RESEARCH ONLY`.
- Use opaque cards for dense reading. Glass is limited to hero or summary surfaces and must preserve contrast.
- Settled results show the sample size. When available, add closing-line value and the recorded postmortem.
- Premium locks explain what is unavailable and provide one clear route to access; API failures must retain a retry state rather than masquerading as an upsell.

## Visual research used as inspiration

These are mood and hierarchy references, not source components to copy:

- [Sports Betting Analytics — Dark Mobile App](https://dribbble.com/shots/27563489-Sports-Betting-Analytics-Dark-Mobile-App): evidence-led edge indicators, restrained semantic color, ROI/win-rate/CLV hierarchy.
- [AI Betting Assistant Mobile App UI](https://dribbble.com/shots/27133785-AI-Betting-Assistant-Mobile-App-UI): probability breakdown and premium feature hierarchy.
- [Fintech Trading & Portfolio Dashboard](https://dribbble.com/shots/27260786-Fintech-Mobile-App-UI-Trading-Portfolio-Dashboard-Design): clear balance between overview metrics, history, and watchlist-style scanning.

Dribbble shots are aesthetic references. Product behavior, accessibility, factual labels, and safety states come from BetClaw's own contracts and user research.
