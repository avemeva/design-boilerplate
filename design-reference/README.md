# Design reference

**Source: <https://dribbble.com/louisdainguyen> — Louis Nguyen.**

The screenshots themselves are **not** in this repo — they are Louis
Nguyen's work and redistributing them is not ours to do. What is here
is everything that was measured out of them, so `DESIGN.md` stands on
its own without the images.

To look at the source yourself, open the portfolio above. To re-derive
the numbers, see "Re-fetching" at the bottom.

The eight shots that were measured, and what each one settled:

| Shot | What it settled |
| --- | --- |
| Dashboard, light | Overall weight. How little contrast the chrome carries |
| Documents menu | Menu surfaces, the one shadow, item density |
| Invoices view picker | The rail, the table, the two-column icon/title/blurb popover |
| Pricing | The ink-reversed feature panel; mixed-weight headings |
| Sidebar variants, dark | Dark mode as a peer; the indigo active row |
| Share dialog | Dialog proportions and form controls |
| Project board | Board columns, tag pills, avatar stacks, section labels |
| Documents list | List density, muted metadata columns |

## What was measured off them

Do not re-derive these by eye; they were sampled from the pixels.

- **Surface ladder, three steps:** canvas `#ebebee` → rail `#fafafa` →
  content `#ffffff`. Each step is a hair over 1:1. This is what makes
  panels float.
- **Borders sit at 1.1–1.2:1** against their surface. `#e7e7ea` on white
  measures `1.23:1`. If you can see a border before you see the content,
  it is wrong.
- **No resting shadows.** Walking in from the canvas to the app frame,
  `#ebebee` meets `#fafafa` with a hard edge — no gradient, no glow.
  Depth is lightness. Only popovers and dialogs get a shadow.
- **Accent `#6c66fc`** appears in under 1% of pixels. It marks the
  active nav row and nothing else. Finding it required filtering for
  saturation above 25%; it does not show up in a dominant-colour pass.
- **Air is on the outside:** roughly 5% of the viewport is canvas around
  the app frame.
- **Rows are ~2.7x their font size tall** — 40px rows at 15px type.
  Density comes from small type on tall rows, never from squeezing.

## Re-fetching

The originals are 4800x3600; these are halved. To get them again, the
CDN paths are recoverable from the portfolio page — Dribbble strips
query strings from `img.src` when read via JS, so read
`new URL(img.currentSrc).origin + pathname` instead. Canvas pixel reads
are blocked by CORS, so download the files and sample them offline.
