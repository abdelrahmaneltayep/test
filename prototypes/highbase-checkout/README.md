# Highbase — checkout proposal (prototype)

A **separate proposal**. It changes nothing in the Highbase design system or the
Figma file. One self-contained page, built on the system's tokens and component CSS.

```
node build.js /path/to/highbase-ds   # writes index.html
open index.html
```

`index.html` is committed, so it opens without a build. The two web fonts are the
only network request; tokens, component CSS and all 66 icons are inlined.

The dark **Prototype controls** bar is not part of the proposal. It exposes states
you would otherwise have to seed — direction, and whether the account is verified.

---

## What this is built against

| Source | What it gave |
|---|---|
| `HIGHBASE checkout evaluation.pptx`, 40 slides | **the brief** — 26 findings, severities, and the fix specified for each |
| Loom, 2:37, silent, 10 Sep 2026 `(live)` | the flow: `/cart` → `/review` → `/address-confirmation`, and the failure states |
| Four screenshots of `Checkout Verification` `(live)` | the screen this replaces |
| `highbase-ds` | every colour, space, radius and type value |

Every finding ID from the deck appears as a comment in `app.js` — search `[C6]`,
`[A7]`, `[P3]` to find the code that answers it.

**The voice note is still not in this.** The proxy in this session blocks the model
download needed to transcribe it. If it sets a direction the deck does not, this
needs another pass.

---

## Coverage — all 26 findings

**Cart** — `/storefront/cart`

| | Finding | What the prototype does |
|---|---|---|
| **C1** | Sells stock that isn't there · *4 catastrophic* | Quantity clamps to stock; `+` disables at the ceiling; typing more snaps back. A line already in conflict **shows no total at all** (`—`) and offers **Reduce to 1** plus **Alert me when restocked**. |
| **C2** | BHD 10 delivery fee a page late · *4* | Items, Delivery, discounts, Total and VAT itemised **in the cart**, and identical on all three screens. |
| **C3** | Ignores supplier boundaries · *3* | Items sit in supplier groups carrying that supplier's minimum, delivery fee, discounts and its own subtotal. |
| **C4** | Same warning four times · *3* | One progress bar per supplier — reached, target, exact gap, and a link that closes it. |
| **C5** | No price per piece · *3* | Every line shows price per case, **price per piece**, and total piece count. |
| **C6** | One short supplier stalls the basket · *3* | Ready suppliers check out now. The button reads **"Check out 1 supplier · BHD 24.000"**; the rest stays in the cart, **named beneath it**. |
| **C7** | Partial selection changes the total silently · *2* | Summary states *"Covers 5 lines from 1 supplier."* Each group reads **Ready to order** / **Not ready — stays in cart** / **Excluded from this order**. |
| **C8** | No way to reorder · *2* | Quick-add by SKU with catalogue autocomplete, **Save as list**, saved lists as one-tap reloads, and a recurring-basket prompt on the confirmation. |

**Review** — folded into the cart summary, which is now the same component on every screen

| | Finding | What the prototype does |
|---|---|---|
| **R1** | "Seller Total" is not the total · *3* | One hierarchy — Items, Delivery, named discounts, **Total**, VAT — rendered by one function, so no figure can differ between screens. |
| **R2** | Discounts labelled with internal codes · *2* | *"Supplier coupon ALMANAR2 · −BHD 2.000"*. Source and value, never a raw identifier. |
| **R3** | Coupon field after the decision · *2* | Coupon entry sits at the **top of the summary**, above the figures it changes. |

**Delivery & purchase details** — replaces `/address-confirmation`

| | Finding | What the prototype does |
|---|---|---|
| **A1** | No summary at the moment of commitment · *4* | The summary is pinned to every screen, directly above the button. |
| **A2** | Trade documents on every order · *4* | Verification is an **account property**. Verified shows CR, VAT and expiry as a value. Unverified still orders — **dispatch waits, not the order**. Zero uploads inside the flow. |
| **A3** | Uploaded ID takes over the page · *4* | Attachments are fixed-height rows — thumbnail, name, size, preview, remove. User content never sets page height. |
| **A4** | No real progress indicator · *3* | One indicator, three counted steps: **Cart → Delivery & purchase details → Payment**. Completed steps are clickable. |
| **A5** | Settled values styled as warnings · *3* | Values in heading ink on white. Orange appears nowhere in this flow; amber is reserved for genuine attention states. |
| **A6** | "Place Order" carries no amount · *3* | **"Place order · BHD 23.000"**. |
| **A7** | No delivery date or window · *3* | Day and time-window pickers **per shipment**, capacity shown, shipment count stated up front. The order cannot be placed until every shipment has a window. |
| **A8** | None of the fields procurement runs on · *3* | Optional **PO number**, **cost centre** and **invoice recipient**, stated as printed on the tax invoice. The email is format-validated. |
| **A9** | An empty VAT panel · *2* | VAT is part of the verification line, stated as a value. The empty container is gone. |
| **A10** | A map pin that confirms nothing · *2* | The pin shows its saved coordinates, says it is what the driver navigates to rather than the typed address, and is adjustable in place. |

**Payment** — replaces the confirmation screen

| | Finding | What the prototype does |
|---|---|---|
| **P1** | Payment finished on another page · *4* | The receipt dropzone sits under the bank details, with **"I'll pay later"** as the explicit alternative. |
| **P2** | "Placed successfully" while unpaid · *3* | **"Order received"**, with *payment outstanding* in the subtitle, the payment card outlined in amber as the loudest thing on the page, and the stage marked on the timeline. |
| **P3** | No payment deadline · *3* | A named expiry with a **live countdown**, and the reservation rule in the first sentence: transfer by then or the reservation is released. |
| **P4** | The page ends at the bank details · *3* | A timeline through to **tax invoice issued** — including each shipment's chosen window — plus track, proforma download and message-supplier. |
| **P5** | No transfer reference · *2* | The reference is its own copyable field, tinted apart from the rest, with the matching rule beneath it. It is the one value that never breaks across lines. |

## Two things added beyond the deck

Both `(proposal)`, neither silent:

- **Per-supplier lead times** are *not* included — the deck specifies day and window
  pickers instead, which is stronger, so the invented "2–3 business days" from the
  first draft was removed.
- **Stock levels** other than the observed "Only 1 item in stock" are invented; the
  recording never exposes real numbers.

## Checks run

Driven in Chromium — 32 assertions, one per behaviour, all passing:

| Check | Result |
|---|---|
| Every finding's fix, asserted individually | 32/32 pass |
| Typing `99` against stock `1` | returns `1`, line total voided |
| Place order without a delivery window | blocked, shipment flagged |
| Invalid invoice email | blocked and flagged |
| Countdown ticks | value changes within 1.3s |
| Transfer reference wrapping | single unbroken line (20px) |
| Dangling `#hb-i-*` references | none — 29 icons, build fails on an unknown key |
| Horizontal overflow at 390px | 0px |
| Console | clean (the only error offline is the font CDN's TLS, which is the sandbox proxy) |

**RTL is verified as mechanics, not translation.** Direction, mirroring and layout
flip correctly; copy stays English apart from the chrome. A real Arabic pass needs
translated strings and bidi work — "2–7 business days" still reorders in RTL, which
is exactly what that pass exists to catch.

## Still open

The deck's own two questions stand, and they gate the two structural changes:

1. **A2** — does Bahrain trade regulation or your supplier agreements require documents
   against each individual order? If so the fix becomes *collect once, attach
   automatically* rather than *collect once, skip afterwards*.
2. **P1** — was the receipt-on-another-page split deliberate, for a finance workflow that
   needs the receipt tied to a tracked order record? If so this page can still host the
   upload and post to the same record.

Mine to add:

3. Is a supplier minimum a hard block, or can a buyer pay a small-order fee instead?
4. Is the BHD 10 delivery fee flat per supplier, or does it vary by basket or distance?
5. Is 48 hours the right reservation window?
6. Bank transfer is the only method in the recording — is anything else coming?

## Re-running the checks

```
python3 verify.py     # needs playwright; launches the pre-installed Chromium
```
