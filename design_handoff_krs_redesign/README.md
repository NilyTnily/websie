# Handoff: KRS Redesign — Web + Mobile App

## Overview

A full visual redesign of the KRS storefront (fine watches and jewelry), plus a
new iOS/Android shopping app. The redesign moves the site off its current
navy/brass palette onto the KRS brand-book palette, replaces five identically
weighted content bands with an editorial rhythm, promotes the loupe zoom to the
site's signature interaction, and adds two flows that do not exist today: a real
checkout and an owner's vault.

Target codebase: the `Websie` Next.js app (App Router, React 19, Tailwind v4,
Drizzle, shadcn/ui).

## About the Design Files

The files in this bundle are **design references authored in HTML** — prototypes
that show intended look, spacing, and behavior. They are **not production code
to copy**. They use a bespoke template runtime (`<x-dc>`, `{{ }}` holes,
`<sc-for>`) that has nothing to do with your app.

The task is to **recreate these designs inside the existing Next.js codebase**,
using its established patterns: React Server Components where the current pages
already are, `"use client"` only where interaction demands it, Tailwind utility
classes driven by the tokens in `src/css/globals.css`, shadcn/ui primitives
(`~/ui/primitives/*`), Drizzle queries in `src/lib/queries/*`, and server actions
in `src/app/actions/*`.

Read the HTML for values and layout. Write idiomatic React.

## Fidelity

**High-fidelity.** Colors, type, spacing, and copy are final. Recreate pixel-
accurately using the codebase's existing libraries. Every hex, size, and letter-
spacing value in this document was measured from the prototypes.

Two caveats:
- Product photography in the prototypes is Unsplash placeholder. Real
  photography is required before launch (see **Assets**).
- The About page uses drop-in image slots where workshop photography belongs.
  These are deliberately empty.

---

## Design Tokens

Replace the navy/brass token block in `src/css/globals.css`. The current file
declares a Harry Winston–referenced navy/brass scheme; the brand book is mocha,
tobacco, champagne, ivory, onyx.

### Colors

| Token | Hex | Role |
|---|---|---|
| Onyx | `#0D0D0D` | Primary dark surface, headers, footers, hero ground |
| Onyx raised | `#12100E` | Secondary dark surface (loupe band, app background) |
| Onyx card | `#171310` | Dark cards, admin panel body |
| Mocha | `#2B1E17` | Brand dark — standard band, checkout sidebar, primary button |
| Mocha tint | `#241C17` | Image placeholder ground on dark |
| Tobacco | `#6B4B3E` | Secondary text on light, eyebrow labels, muted headings |
| Champagne | `#C8A97E` | Accent — CTAs, eyebrows, rules, active nav, prices on dark |
| Champagne light | `#E0C79C` | Link hover only |
| Ivory | `#F5F2EB` | Text on dark; also the tertiary light surface |
| Ivory bright | `#FBFAF7` | Primary light page surface |
| Bone | `#EFEAE0` | Image placeholder ground on light |
| Warm grey | `#8A7A6D` | Tertiary text on light (refs, placeholders) |
| Ash | `#A3958A` | Disabled / inactive step labels |
| Alert | `#8C2A2A` | Overdue service (light surfaces) |
| Alert on dark | `#D98C6A` | Overdue service, blocking admin tags (dark surfaces) |

Alpha values used repeatedly on dark surfaces:
- Text secondary: `rgba(245,242,235,.72)`
- Text tertiary: `rgba(245,242,235,.6)`
- Text muted: `rgba(245,242,235,.5)`
- Hairline border: `rgba(245,242,235,.12)` to `rgba(245,242,235,.16)`
- Champagne hairline: `rgba(200,169,126,.25)`
- Light-surface hairline: `rgba(43,30,23,.16)`

### Typography

Two families. Drop IBM Plex Mono entirely — the current site uses uppercase mono
for nav, prices, filter labels, spec values, and footer heads all at once, which
makes the loudest device on the site carry the least important content.

- **Cinzel** (serif) — weights 400/500/600. All headings, prices, brand mark,
  numerals in stat blocks. Never for body copy.
- **Montserrat** (sans) — weights 200/300/400/500/600. Body, labels, nav, UI.

```
https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Montserrat:wght@200;300;400;500;600&display=swap
```

Scale as used (desktop):

| Role | Family | Size | Weight | Letter-spacing | Transform |
|---|---|---|---|---|---|
| Hero H1 | Cinzel | 82px / 1.06 | 400 | .01em | — |
| Page H1 | Cinzel | 44–46px | 400 | .03em | — |
| Section H2 | Cinzel | 38–42px | 400 | .03em | — |
| Card title | Cinzel | 17–24px | 400 | .02em | — |
| Price, large | Cinzel | 44px | 400 | .02em | — |
| Price, inline | Cinzel | 15–20px | 400 | — | — |
| Eyebrow | Montserrat | 10px | 400 | .32em | uppercase |
| Nav / UI label | Montserrat | 11px | 400–500 | .22em | uppercase |
| Button label | Montserrat | 11px | 600 | .22em | uppercase |
| Body | Montserrat | 15–16px | 300 | — | — |
| Body line-height | — | 1.8–1.85 | — | — | — |
| Meta / ref | Montserrat | 10–12px | 400 | .16–.24em | uppercase |

The brand mark `KRS` is Cinzel at `letter-spacing: .34em` with matching
`padding-left: .34em` so it stays optically centered.

### Geometry

- **Border radius: 0 everywhere on web.** The current site already commits to
  this; keep it. The only exceptions are the wishlist heart circle
  (`border-radius: 999px`) and Android's Material controls.
- Hairlines are `1px`. Dividers between grid cells use a `1px` gap over a
  champagne-alpha background rather than borders, so intersections stay clean.
- Section padding: `clamp(80px, 12vh, 150px)` vertical, `clamp(24px, 4vw, 56px)`
  horizontal. Content max-width `1300px`.
- No shadows on light surfaces. Depth comes from value contrast, not elevation.

---

## Screens

### 1. Home — `src/app/page.tsx`

**Purpose:** Establish the house, surface the current shelf, drive to catalog.

**Layout, top to bottom:**

1. **Transparent header over hero.** Three-column grid (`1fr auto 1fr`): left nav
   (Watches / Jewelry / Bespoke), centered `KRS` wordmark, right utilities
   (The House / Search / Account / Bag). Padding `26px clamp(24px,4vw,56px)`.
   Below it a champagne hairline that fades at both ends:
   `linear-gradient(to right, transparent, rgba(200,169,126,.45) 20%, rgba(200,169,126,.45) 80%, transparent)`.
   Bag count is an 18×18 champagne square with mocha text, not a pill.

2. **Hero, 800px tall.** Full-bleed image at `opacity: .82` over `#0D0D0D`, with a
   directional scrim:
   `linear-gradient(105deg, rgba(13,13,13,.86) 0%, rgba(13,13,13,.45) 46%, rgba(13,13,13,.15) 70%, rgba(43,30,23,.5) 100%)`.
   Content left-aligned, max-width 640px: eyebrow → H1 (82px, two lines) → 64px
   champagne rule → body → two buttons. Primary is champagne on mocha text;
   secondary is a `rgba(245,242,235,.45)` outline. Both 52px tall, 34px side padding.
   Bottom-right: a 268px "In frame" card, `rgba(13,13,13,.55)` with
   `backdrop-filter: blur(6px)` and a champagne border, naming the hero piece.

3. **House marquee.** Mocha band, 20px vertical padding, champagne hairlines top
   and bottom. 17 house names at 11px / `.3em` / uppercase, duplicated and
   translated `-50%` over 46s linear infinite.

4. **The current shelf.** Header row: eyebrow + H2 ("Nothing here is made twice")
   left, "All 96 pieces →" right, separated by a hairline. Grid is
   `1.35fr 1fr 1fr` with 32px gaps — one hero card at `aspect-ratio: 3/4` plus two
   columns of two stacked cards. Every card: image, then a hairline, then a row
   with house/ref + name on the left and price on the right, baseline-aligned.
   The hero card carries a "One of one" tag, `rgba(43,30,23,.82)`, 9px, `.26em`.

5. **Under the loupe.** Onyx band. Two columns `1.1fr .9fr`, 72px gap. Left is a
   `4/3` image with a cursor-tracking loupe (see **Interactions**). Right is
   eyebrow → H2 → body → a three-cell stat strip (10× / 96 / In-house) built as a
   `1px` grid gap over `rgba(200,169,126,.25)`.

6. **Two houses, full bleed.** Two 560px panels side by side, no gap. Each: image,
   bottom-anchored gradient, eyebrow (count) + Cinzel category name + one line of
   description. Entire panel is the link.

7. **The KRS standard.** Ivory surface. `340px 1fr` columns. Left: eyebrow, H2
   ("Four promises, no asterisks"), body. Right: 2×2 grid of numbered promises,
   `1px` gaps over `rgba(43,30,23,.16)`, each cell 36px/32px padding.

8. **Pull quote.** Centered, `#FBFAF7`, Cinzel 34px / 1.5, attribution in 11px
   champagne uppercase 32px below.

9. **Account band.** Mocha, `1fr auto`, H2 + body left, champagne CTA right.

10. **Footer.** Onyx. Four columns `1.4fr 1fr 1fr 1.2fr`: brand + description,
    Collections, The House, and a newsletter ("The dossier") whose input is a
    bottom-bordered row, not a boxed field.

**Data:** `getHomepageSettings()` already returns hero copy, section titles, and
CTA text. Keep the admin-editable contract — do not hardcode copy that is
currently editable. The "In frame" card needs the featured product; extend the
homepage query or reuse `getFeaturedProducts()[0]`.

---

### 2. Collection — `src/app/products/page.tsx` + `collection-browser.tsx`

Fixes six audit findings. Implement all of them.

**Header block:** eyebrow ("96 pieces · 17 houses"), H1 "The Collection", and on
the right a **single** search field (300px, 42px tall, magnifier icon, placeholder
"Name, house or reference") plus a sort control styled as a 42px bordered row
reading "Sort · Featured". **Remove the duplicate header search** — the current
build has two search inputs with different behavior on one screen.

**Sidebar, 232px:** each facet group is an 10px/`.26em` uppercase tobacco label
above a hairline, then the options. Groups: Category (with counts, right-aligned),
House (six shown + "+ 11 more"), Price, Case size, then a champagne "Clear all".

- **Price becomes four bands**, not a slider: Under $5,000 / $5,000–$25,000 /
  $25,000–$100,000 / $100,000 and above. The current `step={50}` slider across
  $2,200–$412,000 gives 8,196 drag positions for one thumb.
- **Case size stays a range slider** but is a two-thumb 37–42mm control.
- Watch-only facets must not render when the category scope is Jewelry.

**Active filters:** a chip row above the grid. Active chips are a `1px solid
#2B1E17` box; inactive are `rgba(43,30,23,.2)`. Each carries a `✕`.

**Grid:** three columns, `36px 28px` gaps, cards at `aspect-ratio: 4/5`. Card
anatomy: image with a 30px wishlist square top-right (`rgba(245,242,235,.6)`
border), then a hairline, then house / name / ref on the left and price right.

> **Critical fix:** the current `ProductCard` nests a wishlist `<button>` and an
> "Add to Bag" `<button>` inside the `<Link>` that wraps the whole card. That is
> invalid, breaks keyboard nav, and generates mis-clicks. Restructure so the link
> covers the media and text only, with the wishlist control a sibling positioned
> above it. **Drop "Add to Bag" from the card entirely** — at these prices the card's
> job is to get to the product page.

**Pagination:** 34px square buttons, active filled mocha. The current build renders
all 96 with no pagination.

---

### 3. Product detail — `src/app/products/[id]/page.tsx`

**Layout:** `1fr 468px`. Left is a gallery stack with 4px gaps — one square hero
image, then two squares side by side. Right is the buy rail, `position: sticky;
top: 0`, padding `56px 56px 56px 48px`.

**Buy rail order:** house eyebrow → H1 (38px Cinzel) → ref/case/availability meta
(12px, `.16em`) → **price at Cinzel 44px** → description → Add to bag (mocha,
54px, flex-1) beside a 54px wishlist square → "Book a private viewing" outline
button → assurance list.

> The current price is 24px at normal weight, visually equal to the paragraph
> beneath it. On a $34,000 piece it should be the second thing you see.

**Assurances** are a bordered stack, one row per promise, each a champagne `✦`
plus a 13px title and 12px body, with a final shipping row. These carry the entire
argument for buying here rather than at auction — they must not be a small grey
list at the bottom of the column.

**Below:** ivory band, two columns, 72px gap — "Details" as a champagne-dashed
list, "Specification" as label/value rows separated by hairlines.

**Loupe:** the product gallery is the primary home of the loupe interaction.

---

### 4. Checkout — **new route, `src/app/checkout/page.tsx`**

Does not exist today. The bag is currently a drawer that dead-ends in an inquiry
form.

**Layout:** `1fr 512px`, min-height 900px. Left is the form on `#FBFAF7`; right is
a mocha order summary.

**Left column:** brand mark, then a three-step rail (1 · Delivery, 2 · Presentation,
3 · Payment) where the active step has a champagne bottom border and inactive steps
are `#A3958A`. Then:

- **"Where should it go?"** — 2-column field grid. Labels are 10px `.22em`
  uppercase tobacco above 46px bordered inputs.
- **"How it travels"** — three selectable rows: insured courier with signature
  (Included), hand delivery by a KRS associate ($180), collect from the salon
  (Free). Selected row is `1px solid #2B1E17`; others `rgba(43,30,23,.18)`. Each
  shows a delivery estimate line.
- **"Presentation"** — three cards: house case (Included), gift presentation ($40),
  engraving ($120).

**Right column (mocha):** line items with 88×110 thumbnails, then subtotal /
insured delivery / duties, then a champagne-ruled total at Cinzel 34px, then the
champagne CTA. Below the button, one paragraph on sealing, insurance, and vault
certificates.

**Server work:** new `orders` flow, a `checkout` server action, and a
`presentation_options` concept on the order. Coordinate with whatever payment
provider you adopt — the design is provider-agnostic.

---

### 5. About — `src/app/about/page.tsx`

**Hero:** 620px, full-bleed workshop photograph, bottom gradient, eyebrow + H1
"Small on purpose" at 66px.

**Body:** two columns, 88px gap. Left is a Cinzel 26px lead paragraph followed by
Montserrat 16px/1.9 body — the existing About copy is the best writing on the site
and is currently set at 14px grey. Right is two `3/4` images, the second offset
48px down.

**Standard band:** mocha, four columns, `1px` gaps over `rgba(200,169,126,.25)`.

> Both body images and the hero are **empty drop-in slots** in the prototype. This
> page claims craft and currently shows none — it needs real workshop photography
> before it ships.

---

### 6. Account / The Vault — `src/app/dashboard/*`

The site's own CTA promises "a record of every service and restoration on your
collection" and then doesn't deliver one. Build it.

**Header:** eyebrow ("Client since 2021 · 4 pieces"), H1 "The Vault", and two
right-aligned stats: insured value ($52,750) and service due (1).

**Tabs:** My pieces / Orders / Certificates / Saved / Details, 11px `.2em`
uppercase, active with a champagne bottom border.

**Piece rows:** `132px 1fr 220px 200px` grid, bordered. Columns are thumbnail;
house / name / ref + acquired date; service status (red `#8C2A2A` when overdue);
value plus a "Certificate ↓" link.

**Below:** two cards — an in-transit tracker with a four-segment champagne progress
bar (Placed / Sealed / Shipped / Delivered), and a "Bench notice" on ivory
prompting a service booking.

> Also fix: signed-in navigation currently swaps the entire main nav for
> Profile / My Orders, so the catalog disappears while a logged-in user browses.
> Keep the catalog nav and move account links into the utility cluster.

---

### 7. Admin — `src/app/admin/*`

Nine sections and a working homepage editor already exist and are more capable
than most stores this size. The problem is that the summary opens on four flat
counters that tell the owner nothing actionable.

**Sidebar, 236px:** onyx, brand mark + "Salon desk", nav at 13px weight 300.

**Header:** date eyebrow, H1 "Today on the floor", plus "Add piece" (outline) and
"Publish shelf" (champagne).

**Stat row:** four cells with a delta line each — Revenue 30 days (+18% vs prior),
Awaiting dispatch (2 need a certificate), Inquiries aging (oldest 4 days), On the
bench (1 overdue).

**"Needs you first" queue:** the main panel. Rows carry a title, a meta line, a
colored tag (Blocking `#D98C6A`, Aging champagne, neutral for the rest), and an
"Open" action. Seed cases: missing certificate on an order shipping tomorrow, an
inquiry 4 days without reply, a low-stock piece with high view count, a bench
collection booked, a review awaiting approval.

**"Moving fastest":** four products with view counts and champagne progress bars.

---

## Interactions & Behavior

### The loupe — signature interaction

The single most distinctive thing in the current codebase is a loupe zoom that
appears on exactly one component. Promote it.

On `mousemove` over the image container, compute cursor position relative to the
element's `getBoundingClientRect()` and render a circular lens that follows it:

- Radius `100px` (diameter 200px), `border-radius: 9999px`
- Zoom factor `2.7` for the marketing band; **10× on product galleries**
- `border: 1px solid #C8A97E`
- `box-shadow: 0 0 0 1px rgba(200,169,126,.35), 0 18px 46px -10px rgba(0,0,0,.7)`
- `background-size: {w * zoom}px {h * zoom}px`
- `background-position: {-x * zoom + r}px {-y * zoom + r}px`
- `pointer-events: none`
- Hidden on `mouseleave`; container cursor is `crosshair`
- Caption swaps from "Move across the image" to "10× — dial, hallmark, setting"

Use a high-resolution source for the lens background — the lens reveals detail the
base image doesn't carry. On touch, replace with press-and-hold.

### Other behavior

- **Marquee:** `translateX(0 → -50%)` over 46–48s linear infinite on a duplicated
  list. Pause on hover.
- **Sticky buy rail:** `position: sticky; top: 0` on the product right column.
- **Links:** define `a` and `a:hover` colors globally (`#C8A97E` → `#E0C79C`).
  Undefined links render browser-default blue in the editor.
- **Reduced motion:** honor `prefers-reduced-motion: reduce` — disable the marquee.

### Not included

Scroll-driven hero animation was explored and removed at the client's request.
Do not implement it in this pass.

---

## Mobile App

Full shopping app, iOS and Android, dark by default — a lit object on a dark ground
is how jewelry is actually displayed. Palette and type are unchanged from web.

**Screens:** Onboarding, Home feed, Category browse, Product detail, Bag & checkout,
Order tracking, Vault & certificates.

**Structure:** four-tab bottom nav — Shelf / Search / Bag / Vault. Every screen is a
flex column with a scrolling body and a pinned action bar. Minimum touch target 44px.

**Notable screens:**
- *Home feed* — greeting eyebrow, a 400px hero card for the newest arrival, a
  horizontal filter chip row, then a "Under $10,000" horizontal rail.
- *Product detail* — 400px gallery with a "Hold to loupe · 10×" affordance and a
  three-segment progress indicator; pinned bar carries "Ask" beside "Add to bag".
- *Order tracking* — a four-stop vertical timeline (placed / sealed / collected /
  out for delivery) with the courier and waybill in a bordered card.
- *Vault* — insured value, piece count, service-due count, then piece cards with
  certificate download, then a "Bench notice" prompting a service booking.

**Android deltas:** gesture nav instead of home indicator, top app bar that scrolls
with content, Google Pay in place of Apple Pay, pill-shaped buttons and chips
(`border-radius: 999px`), 4px radius on cards, Material bottom nav with an active
pill indicator. Palette, type, and photography do not change.

---

## State Management

Mostly server-rendered; client state is narrow.

| State | Scope | Notes |
|---|---|---|
| Loupe position + visibility | Client, per-image | `mousemove` / `mouseleave` only. Do not lift. |
| Active filters | URL search params | Keep the existing `nuqs`/searchParams approach so filtered views are shareable. |
| Sort order | URL search params | Same. |
| Bag contents | Existing cart store | Unchanged. |
| Checkout step | Client, `useState` | Three steps; validate per step before advancing. |
| Delivery / presentation choice | Client → server action | Persist on the order. |
| Vault tab | Client, `useState` | Or a route segment if deep-linking is wanted. |

---

## Assets

- **Product photography** — every image in the prototypes is an Unsplash
  placeholder pulled from your existing seed data. Real photography is required.
  Cards are `4/5`, hero cards `3/4`, product galleries `1/1`, category panels
  `16/9`-ish at 560px tall.
- **Workshop photography** — the About page needs a hero plus two detail shots
  (bench, stone setting). These are empty slots in the prototype.
- **Logo** — `public/logo.png`, unchanged.
- **Fonts** — Cinzel and Montserrat from Google Fonts. Self-host for production.
- **Icons** — `lucide-react`, already a dependency. Stroke width `1.5`–`1.6` at
  these sizes.

I cannot generate images. Everything above needs real photography.

---

## Files in this bundle

| File | Contents |
|---|---|
| `KRS Web - Redesign.dc.html` | The seven redesigned web screens. Primary reference. |
| `KRS App - Mobile.dc.html` | Seven iOS screens plus three Android adaptations. |
| `KRS Design Audit.dc.html` | Scored audit of the current build — the reasoning behind each change. |
| `KRS Current Site - Recreation.dc.html` | The current UI rebuilt from source, for before/after comparison. |

Open them in a browser directly. Each screen carries a `data-screen-label`
attribute matching the names used in this document.

---

## Suggested order of work

1. Tokens and fonts in `globals.css` — everything else depends on this.
2. Header and footer — they appear on every screen.
3. Product card restructure (fixes the nested-interactive-element bug).
4. Collection page — sidebar facets, single search, pagination.
5. Product detail — sticky rail, price scale, assurances, loupe.
6. Home page — hero, shelf grid, loupe band, standard band.
7. Checkout — new route and server actions. Largest single piece.
8. Vault — new account surface.
9. About — needs photography first.
10. Admin — the queue view.
11. Mobile app — separate track.
