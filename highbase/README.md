# HIGHBASE — Registration Centralization prototype

A frontend-only prototype of the HIGHBASE auth pattern: **one auth component, one URL
contract, one funnel**. There is no backend, no real SMS, no real session. Everything
resets when the page is reloaded in a real browser.

Open **`index.html`** in any modern browser. No build step, no install, no server.

```
open highbase/index.html          # macOS
xdg-open highbase/index.html      # Linux
```

---

## What you are looking at

| Region | What it is |
|---|---|
| **Left, dark chrome** | A *simulated* browser — back / forward / reload wired to the app's own history stack, and a URL bar that highlights the query string as it changes. |
| **Left, white stage** | The HIGHBASE storefront and the auth surface. |
| **Right, console rail** | `EVENTS` (live session state + the event stream), `FUNNEL` (the eight steps with breakdowns), `CASES` (a launcher for every acceptance criterion). |

The contrast is the argument: the product surface on the left, what it emits on the right.

### The 30-second demo

1. `CASES → In-context gate on desktop → overlay`. The URL gains
   `?auth=signup&trigger=price_gate_pdp&step=identify&product=p_mou_pch`; an overlay
   renders over the PDP; `auth:gate_click` and `auth:open` appear in the rail with
   `presentation: overlay`.
2. Press **⟳ Reload**. The URL does not change. The presentation does — the same
   component renders as a full page, and the new `auth:open` carries
   `presentation: page` from the same `page_view`.
3. Complete the flow with the prototype code **`482913`**. Watch the eight funnel
   steps fill in, then land back on the product with the price animating in.

---

## The rules this prototype exists to prove

- **Auth state lives in the URL.** `requireAuth()` changes the URL; the component
  renders from the URL; the URL change is what emits analytics. There is no
  `openModal()` that also calls `trackEvent()`, so the modal can never open without
  firing the event, and can never fire it twice.
- **Two URL forms, one component.** Query params on the current route
  (`/product/p_mou_pch?auth=signup&…`) for in-context gates, canonical routes
  (`/login`, `/register`) for header, footer, email and deep links.
- **Never a hash fragment.** GA4's Enhanced Measurement listens for
  `pushState`/`popState`/`replaceState`; a fragment-only change emits no `page_view`
  at all. The self-test asserts no `#` ever appears in an auth URL.
- **One event per funnel step; the entry point is a property.** `trigger_source` and
  `presentation` are on 100% of auth events, so the funnel breaks down by entry point
  without a second funnel existing anywhere.
- **The account exists at L1 at the end of the OTP step**, before the business screen.
  Abandon business details and you are still registered. Watch the level pill flip to
  `L1` while the business screen is still open.
- **CR verification is asynchronous.** An L1 user browses prices and builds a cart
  while the CR is pending, and is stopped only at checkout.

## Architecture map

The PRD's §7 module layout is preserved as labelled sections inside the single file
(§12 explicitly allows a self-contained `index.html`; the architecture still applies).

| §7 path | Section in `index.html` |
|---|---|
| `styles/tokens.css` | `:root` custom properties — the exact §3 values |
| `mocks/products.ts`, `mocks/api.ts` | `PRODUCTS`, `mockApi`, `testHooks` |
| `auth/copy.ts` | `TRIGGER_COPY`, `T` (en/ar), `BIZ_TYPES` |
| `state/session.ts`, `state/intent.ts` | `S`, `pendingIntent`, `replayed` |
| `analytics/events.ts` | `EVENTS`, `emit()`, `emitGa4()` |
| `router/history.ts` | `HISTORY`, `navigate/goBack/goForward/reload`, `NAV_TYPE` |
| `router/useUrlState.ts` | `parseUrl`, `buildUrl`, `safeReturnTo`, `urlWithoutAuth` |
| `auth/requireAuth.ts` | `requireAuth()` — the only way to open auth |
| `auth/AuthSurface/AuthDialog/AuthFlow` | `openSurface`, `ensureDialog`, `shellHtml`, `paint` |
| `auth/screens/*` | `screenIdentify`, `screenOtp`, `screenBusiness`, `screenCr` |
| `storefront/*` | `homeHtml`, `pdpHtml`, `checkoutHtml`, `ordersHtml`, `supplierHtml`, `priceHtml` |
| `analytics/EventStream.tsx` | `renderRail`, `funnelHtml`, `casesHtml` |

### Console API

```js
HIGHBASE.S              // live session state
HIGHBASE.EVENTS         // the event stream, newest first
HIGHBASE.HISTORY        // the simulated history stack
HIGHBASE.testHooks      // forceNetworkFailure · forceOtpExpired · forceCrRejected
HIGHBASE.selfTest()     // the contract self-test — logs a pass/fail table
```

The self-test runs on load and stands in for the lint rule in §7.2: among other
invariants it asserts that the auth surface cannot be rendered from outside `auth/`,
that `requireAuth` rejects a trigger outside the closed vocabulary, that `return_to`
rejects absolute and protocol-relative URLs, and that none of the banned labels
("Login", "Join & View Price", "I'm not a Buyer") appear in the rendered UI.

---

## Deliberate deviations from the spec, and why

1. **Single file, no framework.** §12's sanctioned alternative. It keeps the
   prototype openable from disk with nothing installed, which is what "a reviewer can
   open the prototype" needs.
2. **The history stack is simulated, not `window.history`.** The chrome's reload
   button has to re-render from the URL with `navigationType = 'hard'` without
   discarding the session — a real reload cannot do that. Real `pushState` /
   `replaceState` calls are still made, best-effort, so the browser's own URL tracks
   the simulated one.
3. **The overlay uses `dialog.show()` plus an explicit `inert` attribute on the page
   behind it, not `showModal()`, by default.** `showModal()` inerts the entire
   document — including the simulated browser chrome the reviewer needs in order to
   press Reload. The background is still inert *in code*, which is the actual
   requirement. The **showModal** chip in the chrome switches to the genuine native
   path (verified: the dialog matches `:modal`, Escape closes it, a backdrop click
   dismisses it) so the native behaviour can be inspected. In a real SPA, where the
   document and the page are the same thing, `showModal()` is the correct default.
4. **Presentation is resolved once per flow and then sticks.** `resolvePresentation`
   is exactly as specified, but a flow entered by hard navigation would otherwise flip
   from page to overlay on its next (soft) step. It is re-resolved whenever the
   surface opens, on reload, and when the viewport toggle changes.
5. **`auth:gate_click` is emitted inside `requireAuth`**, not at each call site.
   `requireAuth` *is* the gate activation, so this guarantees exactly one gate_click
   per opening and makes it impossible for funnel step 1 to exceed step 2.
6. **`merged_items` counts line items**, matching the §7.4 copy ("We kept the 3 items
   in your cart").

## Verified against §11

Every acceptance criterion in §11 is reachable from the `CASES` tab and was exercised
headlessly (Chromium) before commit: the three presentations; back / reload / forward;
return-to-intent and its idempotency guard; anonymous cart merge; L1 immediately after
OTP; Escape, ✕ and scrim each emitting `auth:dismiss` with a distinct `reason`; focus
moving into the surface on open and returning to the invoking element on close; a Tab
trap that wraps in both directions; scroll position restored on Back; six-digit paste
filling all six boxes and auto-submitting; every error state; and the full event
schema including GA4's `login` and `sign_up`.

---

## Open questions — flagged, not guessed (§13)

These affect production but not the prototype. It is built exactly to the spec above.

1. **Is a CR legally required before a first order in Bahrain, or is it HIGHBASE
   policy?** Booker (legally trade-only in the UK) enforces via declaration plus ID on
   demand rather than upfront documents; Tradeling's Terms §1.3 exempt "Buy Now"
   buyers from the trade-licence requirement entirely. If our rule is policy, the
   two-tier model in §4 is available as specified. If it is law, L1 may not be able to
   see prices at all and the whole gate moves.
2. **What is the real CR verification SLA?** The reassurance strip — the highest-value
   sentence in the flow — currently promises "usually within 24 hours". That number
   needs to be true before it ships.
3. **Do we hold a phone number for every existing account?** Moving to phone-primary
   needs a defined fallback for email-only legacy users. The prototype models the
   email path but not the migration.
4. **Which analytics tool is authoritative — GA4, PostHog, or both?** The naming
   convention used here is PostHog's; the GA4 `login` / `sign_up` recommended events
   are emitted alongside for cross-tool comparability.
5. **Does the mobile app follow this pattern?** If not, the funnel splits again by
   platform and we have re-created the problem one layer down.

One more that surfaced while building: **`auth:otp_send`, `auth:otp_fail`,
`auth:login_success`, `auth:signup_success`, `auth:business_submit`, `auth:cr_*` are
tagged `source: 'server'` in this prototype and rendered in blue.** In production they
must genuinely be emitted server-side — client events are dropped by ad blockers and
flaky networks, and these are precisely the numbers the business will quote.
