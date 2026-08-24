# PRD — Quick Delivery Activation: Tayaar Fleet App Cross-sell with Free Trial Week

| | |
|---|---|
| **Jira** | [PDV2-422](https://salla-dev.atlassian.net/browse/PDV2-422) · Feature · `New Request` |
| **Interlocks with** | [PDV2-466](https://salla-dev.atlassian.net/browse/PDV2-466) — Mrsool default provider + KSA multi-branch auto-setup (**same screen**) |
| **Parent** | Epic [SHPD-9119](https://salla-dev.atlassian.net/browse/SHPD-9119) · Initiative [SI-323](https://salla-dev.atlassian.net/browse/SI-323) · [SI-311](https://salla-dev.atlassian.net/browse/SI-311) |
| **Unit / System** | Shipping — Quick Delivery activation (Shipping Settings) |
| **Reporter** | Idris Yahya Bakur Goni (PM) |
| **Design owner** | Abdelrahman Eltayeb — Senior Product Designer, OMS |
| **GMV lever** | **Orders per Seller — OPS: Express Delivery** (exactly one) |
| **Plan gating** | Pro and Special only |
| **Status** | Initial design concept — not yet committed to the board |

---

## 0. TL;DR — the design position

The brief asks for a "cross-sell card." **Shipping it as a cross-sell card is the main risk in this feature**, for three reasons:

1. A promotional card inside a promise-critical setup flow reads as an ad. Merchants dismiss ads. Adoption target dies.
2. The brief's own Note flags that every Tayaar statistic (error reduction, delivery time) is **unvalidated** and must clear Data + Partnerships before launch. A card whose persuasion rests on statistics is a card that may be **empty at launch**.
3. It leaves the platform promise unprotected. Nothing in a card stops a merchant from clicking "later" and switching on a two-hour badge their couriers cannot honour.

**The design position in this PRD:** do not sell Tayaar. State the requirement.

When a merchant selects **مناديب متجري** (own couriers) in the `اختر المزود` dropdown, the system runs a **Quick Delivery readiness check** and shows three requirements — order status updates, dispatch verification, live tracking — as **unmet**. These are real, platform-owned requirements, true independently of Tayaar. Tayaar is then presented as the one-tap way to satisfy all three, free for a week.

This changes the merchant's question from *"do I want to buy an app?"* to *"do I want this branch to qualify?"* — and it needs **zero unvalidated statistics to work**, so it ships on schedule regardless of what Data and Partnerships conclude.

**Consequence, stated honestly and designed for:** a branch that does not meet the three requirements still joins Quick Delivery — as pickup / standard delivery — but **does not display the two-hour badge at checkout.** The badge is the thing Salla owns and the thing Salla must be able to back.

This one decision resolves **Open Question 3** (what happens when a trial ends without conversion) and converts the cross-sell from a sales pitch into a merchant self-interest argument.

---

## 1. Problem statement

### 1.1 The structural problem

[SI-323](https://salla-dev.atlassian.net/browse/SI-323) already lets a merchant choose, per branch, between a Salla shipping provider and "private delivery through an external carrier or their own couriers." For own-courier branches, that choice creates a gap between what Salla promises the customer and what Salla can observe:

| Promise requirement | Salla-provider branch | Own-courier branch today |
|---|---|---|
| Order status updates reach the platform | Provider webhook | **None** — the courier is a person with a phone |
| Verification that the correct order left the branch | AWB scan at pickup | **None** — no scan, no check |
| Live tracking for customer and merchant | Provider tracking feed | **None** — no map, no ETA |

The two-hour promise is **owned by Salla and displayed by Salla at checkout**. So the exposure is not distributed across merchants — it lands on the platform. One own-courier merchant silently missing the window damages trust in the Quick Delivery badge everywhere it appears.

### 1.2 Why the two obvious options both fail

- **Exclude own-courier merchants.** This removes retail, flowers, pharmacies, and food operations that run their own riders — in KSA these are not an edge segment, they are the operators for whom two-hour delivery is *already the daily business*. Excluding them removes exactly the merchants whose customers most expect speed.
- **Admit them with no tooling.** This puts an unbackable promise on the storefront and makes the badge unreliable, which devalues it for every merchant including the compliant ones.

The gap is not a merchant motivation problem. It is a **tooling** problem, and Tayaar — already Salla-native, already solving it — closes it without Salla operating a fleet.

### 1.3 Merchant voice — an honest evidence gap

**The evidence triangle for this feature is incomplete, and I am flagging that rather than filling it with invented numbers.**

| Corner | Source | Status |
|---|---|---|
| **Scale** — how many merchants / orders / SAR | Looker | ❌ **Not supplied in the brief.** Required before commit. |
| **Location** — where merchants drop off | PostHog | ❌ **Not supplied.** SI-311 is cited as having funnel evidence; it has not been shared into this ticket. |
| **Voice** — the merchant saying it | Intercom / features.salla.sa | ❌ **Not retrieved.** Board and MCP unreachable from this environment. |

**Data requests — must be answered before this leaves `Task-Review`:**

1. **Looker** — Of merchants who reached the branch/provider step in Quick Delivery activation, what share selected "own couriers", and what share of those abandoned before completing activation? This is the single number that sizes the feature. *Without it the Adoption goal has no denominator.*
2. **Looker** — How many active KSA branches currently fulfil via own couriers, on Pro and Special plans? This bounds the reachable population.
3. **PostHog** — Funnel from `quick_delivery_activation_started` → provider selection → completion, split by provider type. Confirms or refutes the core hypothesis that own-courier merchants drop out *at that step*.
4. **Looker / Tayaar** — Current Tayaar install base among Pro/Special merchants, and its current organic trial→paid rate. This is the honest baseline the 30-day conversion target must beat; setting a target without it is a guess.
5. **features.salla.sa** — Run: category `الشحن والتوصيل` (~393 ideas), search `مندوبين`, `تتبع المندوب`, `التوصيل الخاص`, `إدارة المندوبين`. Report titles, vote counts, `SUG-I-` IDs. Gives merchant-native vocabulary for the UI copy — **the card should use the merchants' own words, not ours.**
6. **Intercom** — Tickets mentioning own-courier delivery + order tracking in the last 2 quarters. Three quotable pains for the PM narrative.

**Assessment:** the *problem logic* here is sound without the data — the promise gap is structural and provable from the platform's own architecture, not from a funnel. So the concept is safe to build and react to now. The **targets** are not safe to set until items 1–4 land.

---

## 2. Goal and hypothesis

### 2.1 GMV lever

**Orders per Seller — OPS: Express Delivery.** One lever, no hedging.

The chain: own-courier merchants become Quick-Delivery-eligible → more stores display the two-hour promise at checkout → order completion and repeat purchase rise on those stores → orders per seller rises. Tayaar simultaneously raises promise *compliance* for the segment, which protects the badge's value for every other store carrying it.

### 2.2 Hypothesis

> **By** surfacing the three unmet Quick Delivery requirements at the exact moment a merchant selects "own couriers", and offering Tayaar as a one-tap, one-week free way to satisfy all three without leaving the dashboard,
> **we improve** activation completion rate for own-courier branches and two-hour promise compliance for that segment,
> **because** these merchants are already motivated to complete activation — they are blocked by missing tooling they do not know exists, and the requirement framing makes the gap and its remedy visible in the same view.

### 2.3 Measurable goals

| # | Goal | Metric | Target | Blocked on |
|---|---|---|---|---|
| G1 | **Adoption** | Share of merchants reaching the "own couriers" step who start the Tayaar trial | TBD — set from data request #1 | Looker baseline |
| G2 | **Trial → Paid** | Share of trials converting to paid within 30 days of trial end | TBD — must exceed current organic Tayaar rate | Data request #4 |
| G3 | **Promise quality** | Two-hour compliance on own-courier branches using Tayaar | **≥ 90%**, parity with Salla-provider branches | — |
| G4 | **Segment unlock** | Net new own-courier merchants eligible for and activating Quick Delivery | TBD | Looker baseline |
| G5 | **Speed** *(added)* | Time from selecting "own couriers" to trial active | **< 60 seconds**, zero external redirects | — |
| G6 | **Promise integrity** *(added)* | Own-courier branches displaying the two-hour badge **without** promise tooling in place | **0** — structurally impossible by design | — |

> **G6 is the guardrail metric.** Every other target can be missed and the feature is merely disappointing. If G6 is ever non-zero, the feature is actively damaging the platform promise it was built to protect.

### 2.4 Post-launch Looker-ready statement

> We expect own-courier branch activation completion to move from **[baseline]%** to **[target]%**, and two-hour compliance on own-courier branches to reach **≥90%**, within **60 days** of launch on Pro and Special plans — while the count of own-courier branches showing the two-hour badge without promise tooling remains at **0**.

---

## 3. Scope

### 3.1 In scope

- **ST1** — Contextual readiness check + Tayaar card at the "own couriers" branch/provider step.
- **ST2** — One-week free-trial activation from the dashboard, covering order preparation and delivery, with explicit consent and no external redirect.
- **ST3** — Post-activation state: Tayaar reflected as the fulfilment method satisfying the Quick Delivery promise for that branch.
- **ST4** — Trial lifecycle messaging: started, days remaining, ending, ended, and the paid entry point from 5 SAR.
- **ST5** *(added — see §7)* — Promise-protection behaviour when requirements are unmet or the trial lapses.

### 3.2 Out of scope

- Building any Tayaar functionality — Tayaar is an existing app; this is a cross-sell and activation surface only.
- Quick Delivery routing, coverage, or migration logic — owned by SI-323 / SHPD-9119.
- Non-own-courier providers — the Salla AWB provider flow is unchanged.
- Tayaar billing or pricing changes beyond surfacing the free trial and the 5 SAR entry point.
- Branch/provider selection UI itself (SI-323 S2), coverage zones (S3), auto-created operational settings (S4), migration (S6).

### 3.3 Delta vs SI-323 — what is genuinely new

| Area | Already exists (do not touch) | New here |
|---|---|---|
| Provider selection per branch | "own couriers / external carrier" option | Readiness check + Tayaar card when "own couriers" is chosen |
| Activation flow | Branch, coverage, routing setup | Tayaar free-trial activation step inside the same flow |
| Fulfilment method | Salla AWB, generic private delivery | Tayaar as a recommended, promise-compliant own-courier method |
| Promise compliance | Assumed for Salla-provider branches | Barcode verification, live tracking, status updates for own-courier branches |
| Badge eligibility | Implicit | **Explicit and enforced per branch** (new — see §7) |

---

## 4. The screen this lands on

**Corrected against the live activation screen.** An earlier draft of this PRD assumed a per-branch list with a Mrsool-vs-own-couriers choice per row. The production screen is different, and the difference changes where the cross-sell fires.

### 4.1 The real structure — one page, three sections

| Section | Arabic heading | Contains |
|---|---|---|
| 1 | **من أين ستنطلق شحناتك؟** | Branch multi-select (chip field) → provider radio → conditional sub-provider |
| 2 | **إلى أي مدى تصل خدمتك؟** | Coverage radius (default 25 km), optional per-branch |
| 3 | **وعد التوصيل لعملائك** | Prep time, delivery time, available hours, available days |

Then a single launch bar: *جاهز للانطلاق؟* → **إطلاق الخدمة**.

This is a **confirm-not-configure** page, consistent with SI-311's sub-one-minute target. It is not a wizard, and not a per-branch table by default.

### 4.2 The provider model — and the correction that matters

The provider radio has two options:

- **بوليصات سلة** — marked `موصى به` and `جاهز فورًا`. "Salla picks the best provider for each order automatically", 23 cities, avg 60 min, no contracts.
- **توصيل خاص** — "شركات شحن خارجية أو مناديب متجرك، أو كليهما معًا."

Selecting **توصيل خاص** reveals a **تخصيص المزود لكل فرع** toggle (off by default) and a required **اختر المزود** dropdown.

**The consequence for this feature:** "own couriers" is not a provider option. It is a **value inside the `اختر المزود` dropdown**, alongside "external carrier" and "both".

> **This answers OQ7 directly.** Own couriers and external carriers are *one* provider option (`توصيل خاص`) with a sub-selection — not two separate options. The Tayaar cross-sell therefore triggers on the **sub-provider dropdown**, never on the provider radio.

**Trigger rule:** fire the readiness check when the selected sub-provider is `مناديب متجري` **or** `كلاهما معًا` — in the unified case, or for any branch set to either value in per-branch mode. Never fire on `شركة شحن خارجية` alone.

### 4.3 Section 3 is the natural home for the promise argument

Section 3 is literally titled **وعد التوصيل لعملائك** — "your delivery promise to your customers" — and the merchant configures that promise themselves (prep time + delivery time).

This is a better anchor than anything invented: the merchant has just *authored* a promise Salla will display on their behalf. So the honest note belongs right there:

> **هذا الوعد لن يظهر لعملائك على فروع مناديبك** — تعرض سلة هذا الوعد عند الدفع نيابةً عنك، ولذلك نعرضه فقط حيث نستطيع التحقق منه.

The consequence appears where the merchant feels it, in their own words, rather than as a warning bolted onto a sales card. It flips to a green confirmation once Tayaar is active.

### 4.4 Interlock with PDV2-466

| Interaction | Risk | Resolution |
|---|---|---|
| 466 makes a provider the pre-selected default | Merchant may never see the Tayaar card | **Correct and intended.** 422 responds to an explicit merchant choice, never pre-empts. The default path stays a confirm. |
| 466 auto-activates a courier; 422 starts a trial | Two auto-enrolments with cost implications | **Both require explicit consent.** SI-311's guardrail is honoured in 422 by a consent sheet naming the day-7 outcome. |
| 466 filters to KSA branches | Tayaar coverage mismatch | Readiness is evaluated after the KSA filter. Non-KSA branches never reach this logic. |
| Both edit Section 1 | Conflicting structure | Section 1 is one component. It must be built once, by whichever ticket lands first. |

> ⚠️ **Naming discrepancy to resolve with the PM.** The live screen names the Salla option **بوليصات سلة** and describes it as *"Salla picks the best provider for each order automatically"* — an abstraction over carriers. PDV2-466 is written in terms of **Mrsool** as the named default provider. Either 466 changes what sits *behind* بوليصات سلة (no UI change), or it renames the option (a visible change to a screen this ticket also touches). **These are very different tickets.** Confirm which before either is estimated — this is **OQ10**.

**Recommendation:** ship 466 first, then 422 as the branch-off. In the same sprint, Section 1 is one design and one build ticket.

## 5. Users and journey

### 5.1 Primary user

A **Pro or Special merchant in KSA who runs their own riders** — flower shops, pharmacies, restaurants, local retail with one to several branches. They already deliver fast; they do not have software proving it. They are typically operating from mobile or a back-office desktop, in Arabic.

### 5.2 Flow — before → after

**Before (own-courier merchant who wants Quick Delivery today):**

1. Open Shipping Settings → Quick Delivery
2. Start activation
3. Select branch
4. Select توصيل خاص → مناديب متجري
5. Complete activation — **with no status, verification, or tracking**
6. *(Either the branch is quietly non-compliant, or the merchant discovers the gap later)*
7. Merchant independently discovers fleet tooling exists
8. Leave the dashboard → App Store
9. Search for a fleet app
10. Compare options, read details
11. Install
12. Configure couriers and branches separately
13. Return to Shipping Settings
14. Re-enter Quick Delivery activation

**≈ 14 steps, 2 surfaces, and steps 7–14 are entirely unprompted — most merchants never take them.**

**After:**

1. Open Shipping Settings → Quick Delivery
2. Select branches *(KSA-filtered — PDV2-466)*
3. Select **توصيل خاص** → choose **مناديب متجري** in `اختر المزود`
4. **Readiness check appears inline — three requirements unmet, Tayaar offered.** Tap **ابدأ أسبوع مجاني** → consent → confirm
5. Requirements met; Section 3 confirms the promise will show; **إطلاق الخدمة**

**5 steps, 1 surface, 0 redirects.**

> **Steps reduced: 14 → 5 = −9 steps**, and the removed steps are the ones with the highest abandonment (an unprompted cross-surface detour).
> Measured on the *complete* merchant journey to a compliant own-courier Quick Delivery branch. Measured only on the in-flow portion, it is 5 → 5: the feature does not lengthen the activation flow, which is the constraint from SI-311's sub-one-minute target.

---

## 6. Detailed design

### 6.1 State model

State is held on the **activation page**, not on a branch row. Per-branch mode is a variation of the same model.

| State | Sub-provider | Requirements | Promise shown | Section 1 | Section 3 |
|---|---|---|---|---|---|
| `salla` | — (بوليصات سلة) | Met by provider | ✅ | Collapsed | — |
| `private-carrier` | شركة شحن خارجية | N/A — carrier reports status | ✅ | Collapsed | — |
| `own-unverified` | مناديب متجري / كلاهما | **3 unmet** | ❌ Withheld | **Readiness + Tayaar card** | ⚠️ "won't show" note |
| `own-trial-active` | مناديب متجري | Met | ✅ | Readiness met | ✅ green note |
| `own-trial-ending` | مناديب متجري | Met | ✅ | Readiness met + banner | ✅ green note |
| `own-grace` | مناديب متجري | **At risk** | ✅ (48h) | Amber banner | ✅ green note |
| `own-lapsed` | مناديب متجري | **3 unmet** | ⏸ Suspended | Readiness unmet | ⚠️ "won't show" note |
| `own-paid` | مناديب متجري | Met | ✅ | Readiness met | ✅ green note |
| `own-declined` | مناديب متجري | 3 unmet, acknowledged | ❌ Withheld | Neutral consequence note | ⚠️ "won't show" note |

**Per-branch mode (`تخصيص المزود لكل فرع` on):** each branch gets its own sub-provider, with an inline status pill per row (`متطلبات ناقصة` / `عبر طيّار` / `لا ينطبق`). The readiness check evaluates once for the *set* of own-courier branches and states the count — `مناديبك لا يستوفون متطلبات وعد الساعتين (2 فرع)`. One Tayaar activation covers all of them; a card repeated per branch would be unusable at scale (E10).

### 6.2 ST1 — Readiness check and Tayaar card

**Trigger:** the selected sub-provider under `توصيل خاص` is **مناديب متجري** or **كلاهما معًا** (§4.2). Inline expansion directly beneath the `اختر المزود` dropdown — **not a modal.** A modal would interrupt a one-page flow the merchant is mid-way through, and would have to be re-summoned every time they changed the dropdown.

**Content, in order:**

1. **Heading (the requirement, not the pitch):**
   > **مناديبك لا يستوفون متطلبات وعد الساعتين**  *(+ `(N فرع)` in per-branch mode)*
   >
   > Sub-line: *وعد التوصيل تعرضه سلة للعميل عند الدفع، ولذلك نحتاج أن نتحقّق منه.*
   > This frames the requirement as **Salla needing to verify a promise it displays** — not as a deficiency in the merchant's couriers.

2. **The three requirements, each shown as unmet:**

   | Requirement (AR) | English | Why it exists |
   |---|---|---|
   | تحديث حالة الطلب | Order status updates | The customer and the platform need to know where the order is |
   | التحقق من الطلب قبل الخروج | Dispatch verification | The right order left the branch — fewer errors and returns |
   | التتبع المباشر للمندوب | Live courier tracking | The customer sees the courier; the merchant sees the fleet |

   Each carries a neutral "unmet" indicator — **not a red error.** The merchant has done nothing wrong; they have simply chosen a fulfilment method that needs tooling.

3. **The remedy — Tayaar:**
   > **طيّار يوفّر هذه المتطلبات الثلاثة**
   > تطبيق من سلة لإدارة مندوبيك — أسبوع مجاني يشمل التجهيز والتوصيل، ثم من ٥ ر.س
   > *"Tayaar provides all three. A Salla app to manage your couriers — one free week covering preparation and delivery, then from 5 SAR."*

   Capabilities listed factually: assign and manage your own couriers · verify each order by barcode before printing the AWB · manage multiple stores from one account · live status updates · real-time courier map.

4. **Two actions, both honest:**
   - Primary: **ابدأ أسبوع مجاني** — "Start a free week"
   - Secondary: **المتابعة بدون طيّار** — "Continue without Tayaar" → sets `own-declined`, shows the consequence plainly (§7.1)

**Copy rules:**
- **No statistics of any kind at launch.** No "reduce errors by X%", no "faster by Y minutes". The brief's Note makes every such claim a launch blocker; the requirement framing makes them unnecessary. If Data and Partnerships later validate a figure, it can be added as a single supporting line — the card does not depend on it.
- Merchant vocabulary — **مناديب**, matching the production screen own wording (*مناديب متجرك*). Never "أسطول" or "fleet". Confirm the rest against features.salla.sa (data request #5).
- Never imply the merchant's couriers are bad. The gap is in *visibility*, not in their operation.

### 6.3 ST2 — Trial activation

**Consent sheet — required.** Mirrors the SI-311 guardrail that 466 must also honour.

Contents:
- What is included: order preparation + delivery, full Tayaar feature set, unlimited during trial.
- Duration: **7 days**, with the exact end date shown in Hijri-aware Gregorian format used by the dashboard.
- **What happens at day 7, stated before the merchant commits:** the trial ends; Tayaar continues from 5 SAR; if it is not continued, the branch keeps Quick Delivery as pickup/standard but the two-hour badge is suspended.
- **No card required to start.** No silent auto-charge — the merchant makes an explicit choice at day 7.
- Plan gate: Pro and Special. A Basic/Plus merchant reaching this point sees the upgrade path instead (`theme="feature"` button), not a dead end.

**Activation:** single confirm → inline progress → success. No redirect, no new tab, no external onboarding. Target < 60 seconds end to end (G5).

**Failure handling:** if activation fails, the branch stays `own-unverified` with a retry — **never a half-activated state**, and never a branch that believes it is compliant when it is not.

### 6.4 ST3 — Post-activation state

The readiness block collapses to its met state:

- Heading flips to **مناديبك يستوفون متطلبات وعد الساعتين**; the three requirements show met
- **Section 3 flips to a green confirmation** — *هذا الوعد سيظهر لعملائك على كل فروعك*
- The launch bar reflects it — *وعد الساعتين سيظهر لعملائك*
- In per-branch mode, each own-courier row shows a `عبر طيّار` pill
- A trial chip shows remaining days
- **A first-run task list appears once** — assign your first courier, print your first verified AWB, watch your first delivery on the map. This is the bridge from *activated* to *actually used*; without it the trial expires unused and G2 fails regardless of G1.

The launch bar states the outcome in one line before the merchant commits — branch count plus whether the two-hour promise will show — so a multi-branch merchant is never surprised by what reaches checkout.

### 6.5 ST4 — Trial lifecycle

| Day | State | Surface | Message |
|---|---|---|---|
| 0 | Started | Success + first-run tasks | Trial started, ends [date]. Here are three things to do first. |
| 1–4 | Active | Quiet inline banner | `تجربة طيّار فعّالة — تبقّى 5 أيام` |
| 5–6 | Ending soon | Chip turns amber + one dashboard notice | Trial ends in N days. Continue from 5 SAR to keep the two-hour badge. |
| 7 | Decision | AlertBox on branch + Quick Delivery page | Trial ends today. Continue from 5 SAR, or this branch moves to pickup/standard. |
| +0–48h | **Grace** | Amber AlertBox, badge **still on** | Trial ended. Two-hour badge stays on for 48 hours — continue Tayaar to keep it. |
| +48h | Lapsed | Badge **suspended**, branch stays active | Two-hour badge suspended for this branch. Reactivate Tayaar to restore it. |
| any | Converted | Chip clears | Tayaar active. |

**Escalation is deliberately gentle until day 5.** A merchant nagged from day 1 learns to ignore the chip by day 6, exactly when it matters.

**The 48-hour grace window is a customer-protection mechanism, not a merchant courtesy.** Orders placed before the trial lapsed were promised two hours; the window lets those complete with tracking intact rather than going dark mid-delivery.

---

## 7. Promise protection — ST5 (new, and the answer to Open Question 3)

### 7.1 The rule

> **A branch displays the two-hour badge at checkout only while the three promise requirements are met.**
> Quick Delivery membership and badge eligibility are separate. Losing tooling costs the badge, never the branch.

Applied consistently:

| Situation | Quick Delivery | Two-hour badge | Merchant sees |
|---|---|---|---|
| Own couriers + Tayaar (trial or paid) | Active | ✅ On | Compliant |
| Own couriers, declined Tayaar | Active — pickup/standard | ❌ Off | "This branch delivers without the two-hour promise" |
| Trial lapsed, within 48h grace | Active | ✅ On (grace) | Amber warning, countdown |
| Trial lapsed, past grace | Active | ⏸ Suspended | Reactivation path, one tap |
| Salla provider (Mrsool) | Active | ✅ On | Compliant |

### 7.2 Why this is the right answer to OQ3

The open question asks whether lapsed branches should be "downgraded." Framing it as downgrade makes it a punishment and guarantees PM resistance. Framing it as **badge eligibility** makes it a factual consequence:

- It protects the customer — no unbacked promise ever reaches checkout (**G6**).
- It protects the merchant — they never lose Quick Delivery, orders, or configuration; only a badge they cannot currently honour.
- It makes the cross-sell self-motivating — the merchant renews to keep something valuable they have experienced for a week, which is a far stronger conversion driver than any statistic on the original card.
- It is reversible in one tap — the branch reactivates instantly.

**This requires PM confirmation.** It is a product-policy decision, not a design decision, and it has revenue implications for the Quick Delivery funnel. It is stated here as a position to react to, not as a settled outcome.

---

## 8. Edge cases

| # | Case | Behaviour |
|---|---|---|
| E1 | Tayaar **already installed and paid** | No cross-sell, no trial offer. Requirements show met. Never sell a merchant something they own. |
| E2 | Tayaar **installed but trial already used** | No second free trial. Card shows the paid entry from 5 SAR. |
| E3 | **Multi-branch**, some own-courier some Mrsool | Readiness runs per branch; one trial covers the account, all own-courier branches become compliant together. *(Pending OQ2 — per store or per seat.)* |
| E4 | Merchant on **Basic / Plus** | Plan gate. `theme="feature"` upgrade path, not a dead end. |
| E5 | Merchant **declines**, then returns later | Card reappears on next visit to the branch — but quieter, no re-expansion. Once declined, never nag. |
| E6 | **Trial activation fails** (API/billing) | Branch stays `own-unverified`. Retry offered. Never a half-activated state. |
| E7 | Merchant **deactivates Quick Delivery** during trial | Tayaar trial continues — it is an independent app. Do not silently uninstall a merchant's app. |
| E8 | Branch **outside KSA** | Never reaches this logic — filtered upstream by PDV2-466. |
| E9 | **Non-KSA multi-market** merchant | Tayaar applies to Saudi-market branches only, consistent with 466. |
| E10 | **200+ branches** (enterprise scale) | Readiness check must be per-row lazy, not a blocking account-wide call. Bulk action: "apply Tayaar to all own-courier branches." A per-branch card repeated 200 times is unusable. |
| E11 | **Trial active but no courier assigned** by day 3 | First-run task reminder. This is the silent-failure case for G2 — an unused trial never converts. |
| E12 | Merchant **cancels Tayaar mid-trial** | Immediate move to `own-lapsed` after grace. Same badge rule. |
| E13 | **Slow/failed** readiness check | Skeleton, then a neutral retry. Never assume compliant on failure — failing open puts an unbacked badge at checkout. |
| E14 | Merchant selects **شركة شحن خارجية** only | No cross-sell — the carrier reports status itself. Card fires only on `مناديب متجري` or `كلاهما معًا` (§4.2). ✅ Resolved. |
| E15 | Merchant selects **كلاهما معًا** | Cross-sell **does** fire — own couriers are in the mix, so the promise gap exists. |
| E16 | Merchant switches sub-provider away from own couriers after declining | Readiness and consequence notes clear; no residual state. |

---

## 9. 7-Point Building Dashboard analysis

| # | Metric | Finding |
|---|---|---|
| **1** | **Flows simplified** | Cross-sell, discovery, install, and configuration collapse into the activation flow the merchant is already in. Removes a cross-surface App Store detour entirely. |
| **2** | **Steps reduced** | **14 → 5 = −9** on the full journey to a compliant own-courier branch. **5 → 5** on the in-flow portion — the activation flow itself does not get longer. |
| **3** | **Differentiated experience** | Shopify has no equivalent: Local Delivery relies on third-party apps (EasyRoutes and similar) the merchant must discover unaided, and Shopify makes **no platform-owned delivery-time promise** — so it never needs to verify one. **MENA context:** own-courier fleets (مندوبين) are the operating norm for flowers, pharmacy, and food in KSA, not an edge case. Salla can treat this segment as core where Shopify treats it as a plugin problem. Contextual in-flow activation with no external onboarding is the differentiator. |
| **4** | **Happy moments** | (a) **First courier assigned** — "your fleet is on the map"; (b) **first barcode-verified AWB** — the moment the merchant sees a wrong order caught before it leaves; (c) **first on-time two-hour delivery with the badge live** — connect the tooling to the promise explicitly, this is the moment that converts the trial. |
| **5** | **Re-purpose features** | Reuse App Store trial/subscription infrastructure (no new billing surface). Reuse the SI-323 branch/provider row. Hook barcode verification into the **existing AWB print flow** rather than adding a step. Reuse dashboard notification infrastructure for lifecycle messaging. |
| **6** | **AI experience considered** | (a) **Courier assignment suggestion** by zone, load, and current position — removes the highest-frequency manual decision; (b) **breach prediction** — flag an order that will miss the two-hour window while there is still time to act, which directly serves G3; (c) **auto-detect eligible branches** — propose which branches should be own-courier vs Mrsool from historical delivery data, turning the readiness check from reactive to proactive. All three are post-MVP; (b) has the strongest tie to the guardrail metric. |
| **7** | **Cross-features mapped** | **Before:** Branches, Multi-Markets, Multi-Branch tool, Shipping Settings, Plans/Subscriptions. **After:** Orders (status), AWB printing (verification), Storefront checkout (badge), Notifications, Reports (compliance), App Store (Tayaar billing). **State passes at:** branch↔market linking (466), branch↔provider, trial↔badge eligibility, courier status↔order status↔checkout badge. **Breakage risk:** the badge is rendered by Storefront but its truth is owned by Shipping — that contract must be explicit, or a lapsed trial silently keeps promising two hours at checkout. **This is the highest-risk integration in the feature.** |

### Score table for the Figma summary page

| Metric | Before | After | Delta |
|---|---|---|---|
| Flows Simplified | Cross-surface discovery + install + config | Single in-flow activation | 1 flow merged |
| Steps Reduced | 14 | 5 | **−9** |
| Differentiated Experience | Parity (no offer) | In-context, promise-anchored, no external onboarding | +1 |
| Happy Moments | 0 | 3 | **+3** |
| Re-purpose Features | — | Trial infra, Section 1 provider UI, AWB print, notifications | 4 reused |
| AI Experience Considered | 0 | 3 identified (post-MVP) | +3 |
| Cross-Features Mapped | — | 11 features, 4 state hand-offs, 1 high-risk contract | 11 mapped |

---

## 10. User stories and acceptance criteria

### ST1 — Contextual readiness check and Tayaar card

> **As a** merchant activating Quick Delivery for a branch I deliver myself,
> **I want** to see what my branch is missing for the two-hour promise and how to fix it,
> **so that** I can qualify without leaving the flow or researching apps.

**Acceptance criteria**

- [ ] Selecting `مناديب متجري` **or** `كلاهما معًا` in `اختر المزود` expands the readiness check inline beneath the dropdown — not a modal, not a page change.
- [ ] Selecting `شركة شحن خارجية` alone does **not** trigger it.
- [ ] In per-branch mode, the check evaluates across the own-courier branch set and states the count.
- [ ] Three requirements render as unmet with neutral (not error) styling.
- [ ] The Tayaar card lists capabilities factually and contains **no statistical claims**.
- [ ] Primary action starts the trial; secondary action continues without Tayaar and states the badge consequence.
- [ ] Card does not appear when Tayaar is already active (E1).
- [ ] Card shows the paid entry point, not a free trial, when the trial is already used (E2).
- [ ] Basic/Plus merchants see the plan upgrade path (E4).
- [ ] Readiness check is lazy per row and does not block rendering at 200+ branches (E10).
- [ ] Check failure shows a retry and never reports "compliant" (E13).
- [ ] Full RTL, Arabic copy, Arabic-Indic digits per dashboard convention.

### ST2 — One-week free-trial activation

> **As a** merchant, **I want** to start Tayaar free for a week in one step from where I am, **so that** I can qualify immediately without external setup.

**Acceptance criteria**

- [ ] Consent sheet appears before activation and states inclusions, the exact end date, what happens at day 7, and the 5 SAR entry point.
- [ ] No payment method required to start; no automatic charge at trial end.
- [ ] Activation completes without redirect or new tab.
- [ ] End-to-end selection → active in **under 60 seconds** (G5).
- [ ] Trial covers **both order preparation and delivery**.
- [ ] Failure leaves the branch in `own-unverified` with a retry — no partial state (E6).
- [ ] Plan gate enforced server-side, not only in UI.

### ST3 — Post-activation state

> **As a** merchant who activated Tayaar, **I want** my branch to visibly satisfy the promise, **so that** I know the two-hour badge will show.

**Acceptance criteria**

- [ ] Readiness block shows met; per-branch rows show `عبر طيّار`.
- [ ] **Section 3 (وعد التوصيل) flips to the green confirmation**, and the launch bar reflects the promise will show.
- [ ] Trial chip shows remaining days.
- [ ] First-run task list appears once, covering first courier, first verified AWB, first tracked delivery.
- [ ] Launch bar states branch count and whether the promise will show, before launch.
- [ ] Badge eligibility is written to the Shipping-owned contract that Storefront reads (§9 metric 7).

### ST4 — Trial lifecycle messaging

> **As a** merchant on a trial, **I want** to know where I stand and what happens next, **so that** I am never surprised by a change to my storefront.

**Acceptance criteria**

- [ ] Day 1–4: quiet chip only, no notifications.
- [ ] Day 5–6: amber chip + one dashboard notice.
- [ ] Day 7: AlertBox with continue-from-5-SAR and the pickup/standard consequence.
- [ ] Grace window (48h): badge remains on, amber warning, countdown visible.
- [ ] Past grace: badge suspended, branch remains active, one-tap reactivation.
- [ ] Converting at any point clears all lifecycle messaging immediately.
- [ ] No merchant reaches badge suspension without having seen at least the day 7 and grace messages.

### ST5 — Promise protection *(new)*

> **As** Salla, **we need** the two-hour badge to appear only where it can be honoured, **so that** the platform promise stays credible.

**Acceptance criteria**

- [ ] Badge eligibility is evaluated per branch against the three requirements.
- [ ] Declining Tayaar keeps Quick Delivery and removes only the badge.
- [ ] Grace window behaves per §7.1.
- [ ] G6 is instrumented: count of branches showing the badge without tooling, alerting at any non-zero value.
- [ ] Reactivation restores eligibility within one tap and one page.

---

## 11. Development hand-off — component mapping

Real Salla merchant-dashboard tokens and Twilight components. Runtime: `https://dashboard-ui-components.pages.dev` (`admin-ui.esm.js` + `styles.css`).

### Tokens

```css
--primary: #004A57;   --primary-100: #F1F8F9;  --primary-400: #348D9D;
--secondary: #A3FFE5; --secondary-100: #F0FFFB;
--gray-100: #FCFCFC;  --gray-200: #F7F7F7;  --gray-400: #EDEDED;  --gray-500: #DEDEDE;
--dark: #333333;      --dark-100: #737373;  --dark-200: #666666;
--danger: #F55157;    --success: #00AD6B;
--radius-lg: 8px;     --radius-xl: 12px;
--shadow-sm: 0 2px 4px 0 rgba(0,0,0,.08);
--font: 'PingARLT','PT Sans',system-ui,-apple-system,'Segoe UI',sans-serif;
```

### Components

| UI element | Twilight component | Props / notes |
|---|---|---|
| Section card (×3) | `<s-panel>` | `layout="relaxed"` — existing, do not rebuild |
| Branch multi-select | `<s-tags-input>` | Existing (SI-323) |
| Provider radio cards | `<s-radio>` | Existing (SI-323) |
| **`اختر المزود` dropdown** | `<s-select>` | **Existing — 422 only listens to its value** |
| `تخصيص المزود لكل فرع` | `<s-toggle>` | `layout="start"` `wide` — existing |
| **Readiness block** | `<s-alert-box>` | **New** · `theme="warning"` unmet / `theme="secondary"` met |
| Requirement item | `<s-list-item>` + `<s-icon>` | `hgi-stroke hgi-alert-02` unmet · `hgi-tick-02` met |
| **Tayaar card** | `<s-panel>` | **New** · `layout="compact"`, nested inside the alert box |
| Start trial (primary) | `<s-button>` | `theme="white"` — the mint CTA used by `إطلاق الخدمة` |
| Continue without | `<s-button>` | `theme="transparent"` `no-padding` `class="text-primary underline"` |
| Upgrade path (Basic/Plus) | `<s-button>` | `theme="feature"` (crown) |
| Consent sheet | `<s-modal>` | **New** |
| Per-branch status pill | `<s-tag>` | `theme="warning"` unmet · `theme="secondary"` covered · `theme="default"` n/a |
| Trial chip | `<s-tag>` | `theme="info"` (d1–4) · `theme="warning"` (d5–7) · `theme="danger"` (lapsed) |
| **Section 3 promise note** | `<s-alert-box>` | **New** · `theme="warning"` / `theme="secondary"` |
| Day 7 / grace notice | `<s-alert-box>` | `theme="warning"` + `<s-alert-box-action layout="btn">` |
| First-run tasks | `<s-panel>` + `<s-checkbox>` | **New** |
| Loading | `<s-skeleton>` / `<s-loader>` | Scoped, never full-page |
| Activation progress | `<s-progress-bar>` | — |

**Only 6 elements are new.** Everything in Section 1 above the readiness block already exists in SI-323 and must not be rebuilt.

> ⚠️ `--success` (`#00AF6C`) is **Figma-only** — there is no runtime `theme="success"` on `<s-button>`. Use `theme="default"` or explicit tokens; do not invent the theme.

### API requirements

| Endpoint | Purpose |
|---|---|
| `GET /branches/{id}/quick-delivery/readiness` | Returns the three requirement states + `badge_eligible`. Per-branch, lazy (E10). |
| `GET /apps/tayaar/status` | `not_installed` · `trial_active` · `trial_used` · `paid`, with `trial_ends_at`. Drives E1/E2. |
| `POST /apps/tayaar/trial` | Starts the trial. Idempotent. Returns `trial_ends_at`. Server-side plan gate. |
| `PATCH /branches/{id}/provider` | Sets provider; recomputes readiness; writes badge eligibility. |
| `GET /branches/{id}/badge-eligibility` | **The Shipping↔Storefront contract.** Storefront must read this, never infer from Quick Delivery membership. |

### Instrumentation

`tayaar_crosssell_shown` · `tayaar_crosssell_declined` · `tayaar_trial_started` (with time-from-selection for G5) · `tayaar_first_courier_assigned` · `tayaar_first_verified_awb` · `tayaar_trial_converted` · `badge_suspended` · **`badge_without_tooling` (G6 — alert on any non-zero)**

---

## 12. Open questions

### Carried from the brief

| # | Question | Design impact | Position |
|---|---|---|---|
| OQ1 | Who bears the free-trial cost — Salla, Tayaar, or shared? | **None on UI.** Blocks launch commercially, not design. | Proceed with design. |
| OQ2 | Trial per store or per courier seat? | **High.** Per-seat breaks the multi-branch story (E3) and needs a seat picker in the consent sheet — a materially different design. | **Recommend per store.** Per-seat introduces a quantity decision into a flow targeting sub-60-second activation. |
| OQ3 | What happens when a trial ends without conversion? | **High.** | **Answered in §7** — badge eligibility, not downgrade. Needs PM confirmation. |
| OQ4 | Tayaar statistics validation (Note) | **Removed as a dependency** — §6.2 uses no statistics. | Card ships regardless of the Data/Partnerships outcome. |

### Raised by this analysis

| # | Question | Why it matters |
|---|---|---|
| OQ5 | **Do 422 and 466 ship together?** | Same screen, same row component (§4). Unresolved, they collide in build. |
| OQ6 | Does Storefront currently read badge eligibility from a Shipping-owned contract, or infer it from Quick Delivery membership? | If inferred, §7 **cannot be enforced** and G6 is unachievable without a Storefront change. Highest technical risk in the feature. |
| ~~OQ7~~ | ~~Is "own couriers" distinct from "external carrier"?~~ | ✅ **ANSWERED by the live screen** — one option (`توصيل خاص`) with a sub-selection. Trigger is the dropdown (§4.2). Confirm the exact enum values with the EM. |
| OQ8 | Is there an existing Tayaar trial, and has any target merchant already used it? | Drives E2, and the G2 baseline. |
| OQ9 | What is the current organic Tayaar trial→paid rate? | Without it, the G2 target is a number with no meaning. |
| **OQ10** | **Does PDV2-466 rename `بوليصات سلة` to Mrsool, or only change what sits behind it?** | §4.4. A rename is a visible change to a screen 422 also touches; a backend default is not. Materially different tickets — resolve before either is estimated. |

---

## 13. Prototype

**`prototype.html`** — self-contained, Arabic RTL, real Salla tokens, built on the **actual production activation screen** (all three sections, correct headings, correct provider model). Opens in any browser, no build step.

19 states via the switcher panel:

| Group | States |
|---|---|
| Base flow | بوليصات سلة default · توصيل خاص before sub-provider |
| **ST1** | مناديب متجري · كلاهما معًا · per-branch mode · external carrier (no card) · Basic plan gate · trial used · already paid |
| **ST2** | consent sheet · activation failure |
| **ST3** | post-activation + first-run tasks |
| **ST4** | day 2 · day 6 · day 7 · 48h grace · lapsed · converted to paid |
| **ST5** | declined — promise withheld |

Fully interactive: change branches, provider, sub-provider, per-branch toggle, run the real activation sequence.

**Verified with 45 automated interaction assertions** across all 19 states — trigger correctness, consent gating, no-statistics rule, grace/lapse behaviour, failure atomicity, and restore. Zero page errors.

`prototype-v1-branchlist.html` is the superseded first version, kept only to show what the per-branch-list assumption looked like before the production screen corrected it.

## 14. What this needs before it moves on the board

Per the workflow's Stage 1 exit criteria, before **PDV2-422** leaves `New Request`:

- [ ] **Input Metrics** (`customfield_19144`) set from §9
- [ ] **Original estimate** in hours
- [ ] Problem statement recorded, one GMV lever recorded (OPS: Express Delivery)
- [ ] Data requests §1.3 items 1–4 answered — targets G1, G2, G4 are placeholders until then
- [ ] PM decision on **OQ2**, **OQ3**, **OQ5**
- [ ] EM answer on **OQ6** — the badge contract

**The ticket has deliberately not been transitioned.** This is an initial design concept to react to; moving it is the design owner's call.
