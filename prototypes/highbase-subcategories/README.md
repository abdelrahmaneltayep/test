# Highbase — subcategories as pages (prototype)

A clickable proposal for the storefront category page, built on the Highbase design
system. It changes nothing in the system or the Figma file; it is the thing to push
to Figma next. This revision follows the attached `Highbase_Category_Prototype.html`
(side filter panel, buyer/guest views, cart bar, bottom sheets) rebuilt from the system's
own components.

```
node build.js /path/to/highbase-ds   # writes index.html (and --artifact for the hosted copy)
node test.js                         # the pure rules: breadcrumb, no-children, counts, URLs, filters, sort, tiers
NODE_PATH=... node shots.js out/      # Playwright screenshots + behaviour checks
open index.html
```

`index.html` is committed, so it opens without a build. The web fonts are the only
network request; tokens, component CSS, the icon sprite and the product data are inlined.

## The prototype bar

| Control | What it does |
|---|---|
| Preview Desktop / Mobile | Mobile renders the page inside a 390 × 844 phone frame with the same rules a real narrow window gets |
| Viewing as Signed-in buyer / Guest | Guest sees list prices, "Your business price after sign-in" and "Sign in to order" `(proposal)` |
| Language English / العربية | flips `dir`, the font family and the copy; the URL prefix follows (`/bh-en`, `/bh-ar`) |
| No children / Lowest level | jump links to the two edge cases |
| PostHog events (bottom corner) | every capture the page would send |

## What it is built against

| Source | What it gave |
|---|---|
| Screen recording, 12 s, 4 Oct 2026 `(live)` | the header, the three-column mega menu, the Fresh Foods & Dairy > Dairy, Eggs & Cheese branch (verbatim), title, dot breadcrumb, the 4-up product grid |
| The brief | every navigation behaviour and the tile spec |
| `Highbase_Category_Prototype.html` (attached) | the side filter panel and its groups, promo chips, sort options, applied chips, the product card content (pack line, per-unit price, tier pill, delivery, minimum order, line total), add → stepper, cart bar, toast, guest and not-my-supplier states, Filters/Sort bottom sheets, bottom nav, the 26 illustrative products and the Arabic copy |
| `highbase-ds` | every colour, space, radius and type value; Header, Search, Card, Text Field, Checkbox, Radio, Switch, Chip, Badge, Avatar, Breadcrumb, Product Card, Add to Cart, Snackbar, Bottom Sheet, Dialog Header, Dialog Actions and Empty State are the system's own CSS |

Branches of the tree the recording did not expand are `(proposal)` fillers. The 26 products
are the attached prototype's, mapped onto the tree's leaves; leaves without any get stable
generated fillers so no page is empty.

## How the brief maps

| Brief | Where |
|---|---|
| Every level is its own page with its own URL; Back works; reload restores | hash routing stands in for Inertia visits; the address bar shows the real URL `/bh-en/storefront/products?filter[category]=<slug>` |
| Level 0 and level 1 show child tiles; level 2 and childless level 1 show sibling pills "More in <parent>", current one `aria-current="page"` | `HBModel.section()` in `model.js`, tested |
| Breadcrumb Home > ancestors (links) > current (plain text) | `HBModel.breadcrumb()`, tested; the Breadcrumb molecule renders it |
| Title = category name + product count | `.page__title` |
| Navigation resets filters, pagination and scroll; focus moves to the title | full re-render on `hashchange`; checked by `shots.js` |
| Filter panel at the side on desktop, no category tree in it; behind a Filters button on mobile | `.fpanel` (Card organism, 250 px, sticky); the Filters sheet on mobile applies on "Show n products" |
| Mega menu keeps three columns; every entry at every level is a link | `.mega__item` is an `<a>` at levels 0, 1, 2 plus "All in …" per column; hover reveals columns on desktop, taps drill down on phones |
| Tile: 1:1 grey square, 14 px radius, image contain with 10 % padding, placeholder icon when no image, bold 14 px name on two lines, outline + lift on hover/focus, whole tile one `<a>` | `.scard` |
| Desktop 112 px tiles, 18 px gap, wrapping; mobile 92 px in one scrolling row, no scrollbar; back link replaces breadcrumb | `.subs__grid`, the `.m` rules |
| RTL mirrors with logical properties; chevrons flip; Latin product data keeps its reading order inside Arabic | `[dir="rtl"]`, `data-mirror`, `unicode-bidi: plaintext` on product text |
| PostHog `storefront_subcategory_selected` {from_category, to_category, level, source card/pill/breadcrumb/mega_menu}; one `$pageview` per navigation, none per keystroke or filter change | `track()` in `app.js`; the events panel shows every capture |
| Keyboard: Tab reaches every tile, pill, crumb and menu entry, Enter opens it; Escape closes the menu and the sheets | checked by `shots.js` |

## Decisions the brief leaves to you `(decision)`

- **Tile background and radius.** The brief says `#F3F4F6` and 14 px. The system has no 14 px radius and its nearest grey is `surface-container-low`. The tile uses the token for the grey and a literal 14 px, marked `BRIEF` in `proto.css`. For Figma, either add `rounded/14px` or round to 12.
- **Current sibling pill.** The attached prototype paints it dark (`surface-dark`); the earlier revision used `primary/700`. Dark is what ships here.
- **Discount chip.** The system's Chip has no offer style, so the chip uses the secondary container colours via `data-tone="offer"`; a Chip variant would make it official.
- **Category images.** The recording shows icons only at level 0 of the mega menu. The prototype gives a few categories drawings and leaves the rest on the placeholder so both cases are visible; which categories get real images is content.
- **Bottom navigation.** The system documents no bottom navigation; the attached prototype has one, so it is here as a `(proposal)`.

## Proposals that need a business decision `(proposal)`

Guest list price (shown as business price × 1.08), adding a supplier from the card, whether
"My suppliers" starts on (it starts off here), and the 10 % placeholder discount on offers.

## Not in this prototype

Search results, the cart page, checkout, the dashboard. Product names, prices, suppliers and
tiers are illustrative.

## Files

`model.js` data + pure rules · `products.json` the 26 products · `test.js` their tests (17 + 9) · `app.js` rendering, routing, cart and sheets · `proto.css` layout · `build.js` assembles `index.html` / `artifact.html` · `shots.js` screenshots and behaviour checks at 1440 and 390, EN and AR, buyer and guest.
