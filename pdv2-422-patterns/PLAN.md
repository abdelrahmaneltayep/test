# Build order

1. Scaffold: Vite + React 18 + TS + Tailwind, pinned versions
2. tokens.css + tailwind.config.js — REAL Salla tokens (see README deviations)
3. lib/num.ts — numeral formatter, one switch (Western default, production-accurate)
4. ui/: Button, AlertBox, Chip, Toggle, Radio, Dropdown, Toast, Confetti
5. shell/: TopBar, SubNav, SallaShell, PatternNavigator
6. store/tayaarStore.ts — activation, trial, dismissals, failure-rate dev toggle
7. tayaar/: ActivationDrawer, TayaarCard, SummaryStrip, TrialBanner
8. Pattern 1 (contextual card, 6 states) — the reference implementation
9. Pattern 2 (marketplace + detail sub-route)
10. Pattern 3 (5-step wizard)
11. Pattern 4 (dashboard banner, compact/expanded, 24h snooze)
12. Pattern 5 (orders empty state)
13. Prototype-notes modal + README
14. Verify: tsc, build, gzip bundle size, axe-core a11y, Playwright smoke on 5 routes
