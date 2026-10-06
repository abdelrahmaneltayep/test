# Highbase — buyer journey prototype

A clickable prototype of the redesigned buyer journey, built on the Highbase design system (tokens, Public Sans /
Noto Kufi Arabic, Button, Chip, Text Field, Select, Add to Cart, Breadcrumb, Snackbar, Bottom Sheet, Product Card
base, Header, Footer, Empty State). It replaces the staging site audited in the "Highbase Plan Page by Page" deck.

| | |
|---|---|
| Open | `index.html` from disk. Starts at `#home` in Desktop · EN · Signed-in. Needs `img/` beside it. |
| Prototype bar | top-right chip "Prototype": Desktop / Mobile (390×844 frame), EN / AR, Guest / Signed-in, Simulate failure, Go to route. Not part of the product. |
| Build | `node build.js <path-to-highbase-ds>` inlines the design system into one file (`--artifact` for the hosted copy). The deliverable is still a single HTML file with inline CSS and vanilla JS. |
| Source | `data.js` (categories, 6 suppliers, 12 brands, 45 products, buyer, last order), `app.js` (routing, pages, events), `app.css` (tokens only; bare numbers are page geometry marked `LAYOUT`). |
| Screenshots | `screens/` — every route at 1440 and 390, EN and AR (`<route>-<desk|mob>-<en|ar>.png`). |
| Events | `data-event` attributes and `window.__hbEvents`: `search_submitted` (per submit), `filter_applied`, `add_to_cart` (source card / pdp), `match_price_opened`, `checkout_started`, `order_placed`, `order_failed` (reason), `reorder_clicked`. |

## Routes and what each page fixes

| Route | Fix |
|---|---|
| `#landing` | One sentence on what Highbase is, six featured products with list prices, one primary button, supplier count and delivery promise; the chat widget is hidden here. Mobile first. |
| `#home` | Recent searches, Order again strip with one Reorder button, This week's offers with real % off, categories grid (first on mobile), Your suppliers, brands with fallback tiles. No slogans, side banners, countdown or "Showing 1 to 10". |
| `#category/foods` · `/dairy` · `/dairy/fresh-milk` | Each level is its own page with a breadcrumb from Home; subcategory cards at the top and middle levels, "More in <parent>" pills at the lowest; side filter panel / mobile sheet with price, brand search, supplier + "My suppliers only", "Ordered before"; sort above the grid; applied filters as removable chips; mega menu opens on click with three fixed columns. |
| Product card | Two-line name, pack line, one price per pack with price per unit, tier hint, MOQ, supplier link, delivery promise, one Add button that becomes a typed stepper in place with no spinner, "Out of stock until …" / "Sign up to order" with no secondary button, save icon with a clear filled state. No "Wholesale" badge, no "Match My Price" on the card. |
| `#brands` | Popular brands first, A–Z index (Arabic letters in AR) with sticky letter headers, logo or initials tile, instant search, no seller banner, no digit groups. |
| `#search` | Focus shows recent searches and popular categories; typing shows grouped suggestions with typo tolerance and "See all results"; results use the category filters; a real no-results page with suggestions and "Request this product". One search box per page, also on mobile. |
| `#product/:id` | Breadcrumb, gallery, supplier card with rating, delivery and "Message supplier", buy box with price per pack and per unit, tier table, MOQ, stock, stepper, Add to cart, "Match my price" as a text link; Description / Specifications / Supplier policies tabs; "From the same supplier" and "Similar products". |
| `#cart` | Items grouped by supplier with minimum progress ("BHD 20.000 minimum · BHD 4.400 to go") and delivery fee; typed quantity, line total, remove; coupon field that changes the line before the total; one Order Summary (Items, Discounts, Delivery, VAT, Total); checkout button carries the total. No checkboxes, no grid/list toggle. |
| `#checkout` | One page: Delivery (saved address, branch, +973 phone, Change), Items by supplier (collapsed, expandable), Payment (Bank transfer, Cash on delivery, Pay later with ineligible suppliers named inline); summary identical to the cart; sticky "Place order · BHD x"; documents as one line "Company documents verified ✓". |
| Place order | Button shows the amount and a loading state; success goes to the order page; with "Simulate failure" on, one inline error at the top of the summary ("We couldn't place your order. Nothing was charged.") with Retry and Contact support, and the cart is kept. |
| `#order/:id` | Status steps, payment instructions with deadline and Copy IBAN, items by supplier, Order again and Download invoice, "We'll remind you once before the payment deadline." |
| `#rewards` | Named rewards with what you get, progress capped at 100%, Reached state with the coupon and "Use at checkout", Active / Reached / Used / Expired tabs. |
| `#notifications` | Grouped by order, one line per event with a link to the order, mark all as read, buyer-only texts. Browser permission is asked only from the settings card here, after the first order. |
| `#messages` | Drawer with suppliers and their last message; opens a chat inside the marketplace. The floating "Chat with us" button opens the same drawer. |
| `#signup` | Mobile number → one-time code (1234 in the prototype) → business name and branch. Continue is always active, errors inline as you type, documents deferred with a note. |
| `#signin` | Show/hide password, loading state, inline error naming the field ("The password for … is wrong"), "Sign in with a code", reset flow with the branded email preview. The password "wrong" fails on purpose. |

## Rules that hold on every page

No browser push prompt (only the Notifications settings switch asks). One search box. Toasts in buyer language
("Added to cart · View cart", "Quantity updated"). Skeleton cards on navigation; broken images fall back to a
placeholder tile (six of the twelve brand logos are deliberately missing). One `totals()` function feeds the header
badge tooltip, the cart, checkout and the order page. No seller content. A breadcrumb from Home on every page.
Logical CSS properties only, so Arabic is `dir="rtl"` with no RTL variants. Touch targets are 44px or more on mobile.

## Assumptions (proposal)

- Top and middle category pages list the products of their whole branch under the subcategory cards, so a buyer on Foods can already shop with filters.
- VAT 10% on items and delivery; delivery fee per supplier; supplier minimums and credit terms are sample values.
- Coupons: `NADEC10` (10% off Nadec) and `FRESH5` (5% off everything), earned on the Rewards page.
- Pay later is ineligible for suppliers that are not yet "my suppliers"; the checkout names them inline.
- Tier prices apply from the first unit of the tier; the cart line shows the tier price it is using.
- Sample catalogue, suppliers, brands, order history, messages and rewards are invented but shaped like the live data; no real listing is reproduced.
- The account page is minimal (address, phone, documents) since it is outside the journey.
