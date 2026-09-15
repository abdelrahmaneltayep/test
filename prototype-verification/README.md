# Highbase checkout verification & payment — proposal v2

`highbase-verification-proposal.html` is the published artifact: the two pages that follow
**Confirm order** on the live storefront — the business-documents / ID page and the payment
confirmation — rebuilt as one clear flow. It is a separate prototype from the cart proposal
and is assembled the same way: `03_Tokens/dist/tokens.css` and 34 component stylesheets are
inlined **verbatim** from `abdelrahmaneltayep/highbase-ds`, and the icon symbols come from
`05_Icons` through the repo's own `spriteFor()` helper.

## What it answers

The WhatsApp note (10 Sep, 15:08): the cart, review and final cart are complete; the gap is
the two pages after Confirm Order — documents / ID upload, then a payment page that "only
confirms the order was made and shows bank details underneath" — "the flow is not clear, and
I cannot do anything". The Loom recording (2:37) shows the rest: the stock check fails only
after the documents were uploaded and sends the buyer back to the cart; the ID preview renders
a personal photo at full width; the receipt upload lives two screens away behind "Skip for now".

## Screens

1. **Checkout Verification** — the live page's own sections and values, kept as they are:
   *Branch Details* (Branch Name · Branch Phone · Branch Email), *Delivery Address* (Country ·
   State / Province · City · Street Address · Building · ZIP / Postal Code, with the map pin) and
   *Business Documents* (CR Number · Commercial License (CR) · Have VAT certificate → Tax Number
   + VAT Certificate · Personal ID Document), then Place Order. What changed is how they are
   edited and how files upload:
   - **Edit Details / Edit Address** swap the saved values for the Text Field, Phone Field and
     Select molecules in place — required marks, inline errors on Save, Cancel restores, and
     Place Order refuses while an edit is open. The map pin is visible in the saved state too.
   - **Upload zones** are the File Upload molecule in its own states: a document already on file
     is a card (name, size, date, Preview / Replace / Remove); an empty zone says Required or
     Optional and the accepted types; a wrong type or a file over 10 MB is refused in the zone;
     a good file shows progress then the card. Ticking *Have VAT certificate* reveals the tax
     number and its zone, as on the live page. Place Order refuses while a required document is
     missing, and says which.
   - The **"Scenario: stock changes"** toggle in the review bar makes one line change on submit,
     resolved in a Confirmation Dialog instead of a bounce to the cart.
2. **Order received — awaiting your transfer** — one status, a five-step progress that moves
   when the receipt is submitted · Stat Card facts: amount, **payment reference**, transfer-by
   deadline · bank details with copy, Copy all, PDF, Send to finance · Benefit Pay / Fawri+ QR ·
   **receipt upload on the page** with a real preview and Submit · order details · one primary.
3. **Evaluation** — 14 findings with severity, heuristic, what the recording shows and what the
   prototype does. Pin numbers on the screens match the rows.

## Rebuilding and checking

```
./assemble.sh                                  # slices → body.html → build.js → the artifact
node audit.js                                  # static: raw hex, physical left/right, off-scale
                                               # spacing, dangling token/sprite refs, verbatim DS
NODE_PATH=../node_modules node sweep.js        # browser: contrast on every text node, both
                                               # directions, overflow at 1440 and 390, real-file
                                               # uploads, the stock scenario, copy, receipt flow
```

## Components used

Header · Footer · Scroll to Top · Drawer · Confirmation Dialog · Data Table (evaluation) ·
Empty State · Page Header · File Upload · List Item · Stat Card · Inline Alert · Banner ·
Snackbar · Text Field · Text Area · Phone Field · Select · Search · Dialog Header · Dialog
Actions · Logo · Avatar · Button · Icon Button · Chip · Checkbox · Radio Button · Badge · Divider.

## Tagged (proposal)

- the review shell — top bar, screen switcher, scenario toggle, annotation pins
- `--proto-*` geometry: page max, rail width, hairline, document thumbnail (64), QR size (148)
- the stepper and the five-step order progress — the system has no stepper
- the readiness checklist in the summary rail, and the map tile
- `.hb-btn.proto-block` — the Button has no full-width variant
- the placeholder QR — the real code is the bank's

## Open decisions and gaps met

- **`icon/phone` and `icon/mail` are not in the icon library.** The contact rows in the footer
  and the phone field flag it and substitute nothing; the Phone Field's country flag stands in.
- **The Inline Alert exposes one message and no action slot in Figma**, though `Alert.css` has
  a title, text and actions. The pre-flight banner uses the CSS Banner with all three.
- **Noto Kufi Arabic is not installed**; the artifact loads it from Google Fonts for viewers.
- The 48-hour reservation, the two-working-hour receipt check and "orders under BHD 500" for
  cash on delivery are stated as examples of the pattern, not as policy — confirm the numbers.
