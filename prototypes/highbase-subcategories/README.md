# Highbase — subcategories as pages (prototype)

A clickable proposal for the storefront category page, built on the Highbase design
system. It changes nothing in the system or the Figma file; it is the thing to push
to Figma next.

```
node build.js /path/to/highbase-ds   # writes index.html (and --artifact for the hosted copy)
node test.js                         # the pure rules: breadcrumb, no-children, counts, URLs
open index.html
```

`index.html` is committed, so it opens without a build. The web fonts are the only
network request; tokens, component CSS and the icon sprite are inlined.

## What it is built against

| Source | What it gave |
|---|---|
| Screen recording, 12 s, 4 Oct 2026 `(live)` | the header, the three-column mega menu, the Fresh Foods & Dairy > Dairy, Eggs & Cheese branch (verbatim), the category page: title, dot breadcrumb, search + Min/Max price + Categories control, "Only My Vendors", the 4-up product grid |
| The brief | every behaviour and the card spec |
| `highbase-ds` | every colour, space, radius and type value; Header, Search, Switch, Breadcrumb, Chip, Badge, Avatar, Pagination and Product Card are the system's own CSS |

Branches of the tree the recording did not expand are `(proposal)` fillers. Products are generated per leaf with stable counts; the two leaves seen in the recording use the product names from it.

## How the brief maps

| Brief | Where |
|---|---|
| Every level is its own page with its own URL; Back works; reload restores | hash routing stands in for Inertia visits; the prototype bar shows the real URL `/bh-en/storefront/products?filter[category]=<slug>` |
| Level 0 and level 1 show child cards; level 2 and childless level 1 show sibling pills "More in <parent>", current one `aria-current="page"` | `HBModel.section()` in `model.js`, tested |
| Breadcrumb Home > ancestors (links) > current (plain text); never the title twice | `HBModel.breadcrumb()`, tested; the Breadcrumb molecule renders it |
| Title = category name + product count | `.page__title` |
| Navigation resets filters and pagination and scrolls to top | full re-render on `hashchange`, `scrollTo(0)`, focus moves to the title |
| Category tree removed from the filter control | the "Categories" control from the recording is replaced by "Filters" with no tree |
| Mega menu keeps three columns; every entry at every level is a link | `.mega__item` is an `<a>` at levels 0, 1, 2 plus "All in …" per column; hover reveals columns on desktop, taps drill down on phones |
| Card: 1:1 grey square, 14 px radius, image contain with 10 % padding, placeholder icon when no image, bold 14 px name on two lines, outline + lift on hover/focus, whole card one `<a>` | `.scard` |
| Desktop 112 px cards, 18 px gap, wrapping; mobile 92 px in one scrolling row, no scrollbar; back link replaces breadcrumb; Filters behind the button | `.subs__grid`, the `< 760px` block |
| RTL mirrors with logical properties; chevrons flip | `[dir="rtl"]` + `data-mirror`; language switch in the header and the prototype bar |
| PostHog `storefront_subcategory_selected` with from_category, to_category, level, source card/pill/breadcrumb/mega_menu; one `$pageview` per navigation, none per keystroke | `track()` in `app.js`; the events panel (bottom corner) shows every capture |
| Keyboard: Tab reaches every card and pill, Enter opens it | links, visible `:focus-visible`; checked by `shots.js` |

## Decisions the brief leaves to you `(decision)`

- **Card background and radius.** The brief says `#F3F4F6` and 14 px. The system has no 14 px radius (12 and 16 exist) and its nearest grey is `hb-neutral-50` `#F7F8F8`. The card uses the token for the grey and a literal 14 px, marked `BRIEF` in `proto.css`. For Figma, either add `rounded/14px` or round to `rounded-xl` 12.
- **Filter panel position.** The brief says the panel stays at the side on desktop; the recording shows a top filter bar. The prototype keeps the bar as the product has it.
- **Category images.** The recording shows icons only at level 0 of the mega menu. The prototype gives a few categories drawings and leaves the rest on the placeholder so both cases are visible; which categories get real images is content.

## Not in this prototype

Filter contents, sort, search results, cart, checkout, the dashboard. The product card is the system's component and is not changed.

## Files

`model.js` data + pure rules · `test.js` their tests (17) · `app.js` rendering and routing · `proto.css` layout · `build.js` assembles `index.html` / `artifact.html` · `shots.js` screenshots and behaviour checks at 1440 and 390, EN and AR.
