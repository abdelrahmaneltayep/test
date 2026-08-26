# PDV2-466 — Quick Delivery activation · React reference implementation

Mrsool as default provider, full auto-setup, KSA multi-branch market linking.
Built to be read as a spec, not just run. Jira untouched.

```bash
npm install && npm run dev
npm run build && npm run preview
npm run test:smoke              # 25 assertions, needs preview on :4177
```

**Companion doc:** [`HANDOFF.md`](HANDOFF.md) — every element → Twilight component,
the API each step implies, and the five token items needing a DS decision.

---

## ⚠ Source files were not attached

`quick-delivery-activation-prototype.html` and `PDV2-466-concept-brief-and-stories.md`
were referenced but are **not in this session**. Rather than invent their contents,
this was built from:

1. **The state axes named in the request** — Mrsool off/on/conflicting-routes,
   Multi-Markets on/off, branches linked/unlinked, 4/1/0 KSA branches, fees on/off,
   success vs partial failure. All seven are implemented.
2. **The PDV2-466 Jira body**, pulled from Atlassian earlier in this session.
3. **The Salla DS component kit** for real token and component names.

**Consequence:** if the HTML covers a state outside those seven axes, it is missing here.
Arabic copy is authored from the Jira ticket's own language — **not carried over verbatim**,
because there was nothing to carry it from.

---

## Built on the live screen — corrected

A first pass invented its own layout. The live screenshots showed two mistakes,
both now fixed:

1. **It replaced the activation screen instead of extending it.** The three cards —
   *من أين ستنطلق شحناتك؟* · *إلى أي مدى تصل خدمتك؟* · *وعد التوصيل لعملائك* — belong to
   SI-311/SI-323 and are transcribed as-is in `ActivationScreen.tsx`. PDV2-466 adds
   exactly four things, each marked `⟨466⟩` in that file.
2. **It front-loaded a numbered 4-step plan.** A step list open on the page turns the
   merchant back into a configurer, which is the opposite of what this screen is for.
   The plan now sits behind *ماذا سنجهّز نيابةً عنك؟*, collapsed.

**But not everything can be collapsed.** Enabling the Multi-Branch tool on their store,
or linking their branches to a market, are changes a merchant would object to discovering
afterwards. Those are named in the **collapsed** state; only routine steps are hidden.
That distinction — routine steps collapse, store-level consequences don't — is the design
decision worth reviewing.

### The provider naming conflict, now with visual proof

The live card is labelled **بوليصات سلة** and reads *"تختار سلة أفضل مزود لكل طلب تلقائيًا"* —
an abstraction over carriers. PDV2-466 is written around **Mrsool** by name.

This build keeps the label and **discloses Mrsool as what sits behind it**, inside the
selected provider card, with its status. That is the minimal-change reading. The
alternative — renaming the option to "مرسول" — is a visible change to a screen this
ticket is not supposed to touch, and needs Idris's decision before either is estimated.

## The state model in plain language

**One input.** `QuickDeliveryActivation` takes a single prop: `MerchantState`. Seven fields:
Mrsool status, Multi-Markets flag, the branch list, a fees flag, and a harness-only
failure switch. There is no "which scenario are we in" branching anywhere — a scenario
*is* a `MerchantState` value.

**Everything else is derived.** `buildPlan(state)` returns the ordered steps. That's why
a store with Mrsool already active runs a three-step plan and one without runs four; why
a store without Multi-Markets runs `enable-multi-branch` where another runs `link-market`;
why a single-branch store never auto-enables pickup + delivery. **Reading
`src/domain/activationPlan.ts` tells you exactly what will happen to any store** — that
file is the spec.

**Three layers, and the boundary matters.**

| Layer | Contains | Knows about React? |
|---|---|---|
| `src/domain/` | state shape, plan derivation, the run machine, the runner | **No** |
| `src/components/twilight/` | thin wrappers naming their Twilight component | Yes |
| `src/components/activation/` | the flow itself | Yes |
| `src/harness/` | dev-only scenario rail | Yes — and never imported by the flow |

The domain layer is pure and testable without rendering anything. When the API contract
firms up, `runner.ts` is the only file that changes.

**Phases.** `idle → running → succeeded | partial`. Held in a reducer
(`activationMachine.ts`), not scattered booleans. Every transition is a named action, so
the eng review can ask "what puts us in `partial`?" and get one answer: `step:fail`.

**The async model is honest, and deliberately so.** Steps run in order. A step operating
per branch reports a result *per branch*. A failure stops the run there — later steps
never start, and they stay visibly `بالانتظار` rather than being marked failed. **Retry
re-runs only the failed step, and inside it only the failed items.** Nothing rolls back.
The retained-steps callout says so in the UI, because "we didn't undo your work" is only
reassuring if the merchant can see it.

That property is the reason the injected failure targets the **first** per-item step
rather than the last: failing the last step would leave nothing after it, and the
"later steps never ran" behaviour would be true but invisible.

## The dev harness

A dashed-bordered rail above the component, labelled *ليس جزءاً من المنتج*. It sets the
`MerchantState` passed in and shows the derived plan (`activate-mrsool → apply-routes → …`)
so Idris can see the logic change as he switches stores. It is rendered **outside**
`QuickDeliveryActivation` and is never imported by it — the component cannot tell it exists.
A test asserts that separation.

Eleven scenarios cover every axis and two combinations (partial failure with and without
Multi-Markets).

## Constraints honoured

- **No invented evidence.** No funnel numbers, no "% of merchants with Mrsool active",
  no fee amounts. The fees variant explicitly renders **«قيمة الرسوم غير محدّدة بعد»**.
- **Fees consent is a variant, not the default** — `feesRequireConsent: false` in the
  base state, on only in its own scenario.
- **Jira untouched.**

## Verification

25 assertions, all passing, **zero axe WCAG 2.1 A/AA violations** on four states.
Covers plan derivation per axis, all three blockers, the async run, and the partial-failure
path including retry scoping and no-rollback. 54 KB gzipped.

All 14 states screenshotted in [`docs/`](docs/).
