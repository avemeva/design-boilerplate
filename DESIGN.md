---
version: alpha
name: Quiet Instrument
description: >-
  A near-monochrome product surface where the interface recedes and the
  content carries the color. Cool paper-grey canvas, white panels, hairline
  borders, near-black for the one action that matters, and a single indigo
  reserved for "you are here". Derived from the product UI work of Louis
  Nguyen (dribbble.com/louisdainguyen).
colors:
  # Canvas and surfaces — cool grey, never warm, never pure white behind content
  canvas: "#ebebee"
  surface: "#ffffff"
  surface-sunken: "#fafafa"
  surface-raised: "#ffffff"
  # Ink
  ink: "#0a0a0b"
  ink-secondary: "#52525b"
  ink-muted: "#8b8d94"
  ink-inverse: "#fafafa"
  # Hairlines — the primary means of separation. Shadows are a last resort.
  line: "#e7e7ea"
  line-strong: "#d4d4d8"
  # Primary action is near-black, not the accent. This is the signature.
  primary: "#0a0a0b"
  on-primary: "#fafafa"
  # Accent is indigo, and it means "active / current / selected" — nothing else
  accent: "#6c66fc"
  accent-container: "#eae4fc"
  on-accent-container: "#4b45cc"
  # The one emphasised surface allowed per screen
  feature: "#0a0a0b"
  on-feature: "#fafafa"
  feature-dark: "#26262b"
  on-feature-dark: "#fafafa"
  # Status, used only in badges and inline validation
  positive: "#15803d"
  positive-container: "#dcfce7"
  critical: "#b42318"
  critical-container: "#fee4e2"
  # Dark theme
  canvas-dark: "#09090b"
  surface-dark: "#141416"
  surface-sunken-dark: "#0f0f11"
  ink-dark: "#fafafa"
  ink-secondary-dark: "#a1a1aa"
  line-dark: "#232326"
  accent-dark: "#8b86ff"
  accent-container-dark: "#2a2a5e"
typography:
  display:
    fontFamily: Geist
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: -0.035em
  h1:
    fontFamily: Geist
    fontSize: 34px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.028em
  h2:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  body:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.006em
  ui:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: -0.004em
  ui-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: -0.004em
  caption:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  micro:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.06em
  mono:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  2xl: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 80px
components:
  appRail:
    width: 256px
    background: "{colors.surface-sunken}"
    border: "{colors.line}"
  appPane:
    background: "{colors.surface}"
  navItem:
    height: 40px
    radius: "{rounded.lg}"
    paddingX: "{spacing.md}"
    gap: 10px
    iconSize: 18px
    typography: "{typography.ui}"
  appBar:
    height: 56px
    paddingX: "{spacing.lg}"
  control:
    height: 36px
    radius: "{rounded.lg}"
  button:
    radius: "{rounded.md}"
    background: "{colors.primary}"
    foreground: "{colors.on-primary}"
    paddingX: "{spacing.lg}"
    typography: "{typography.ui}"
  card:
    radius: "{rounded.xl}"
    background: "{colors.surface}"
    border: "{colors.line}"
    padding: "{spacing.xl}"
  panel:
    radius: "{rounded.2xl}"
    background: "{colors.surface-sunken}"
    border: "{colors.line}"
  tag:
    radius: "{rounded.full}"
    background: "{colors.surface-sunken}"
    foreground: "{colors.ink-muted}"
    typography: "{typography.micro}"
  navItemActive:
    background: "{colors.accent-container}"
    foreground: "{colors.on-accent-container}"
    radius: "{rounded.md}"
---

# Quiet Instrument

## Overview

This is a **working instrument**, not a brochure.

> Every number in this document was measured off eight screenshots of
> [Louis Nguyen's product UI](https://dribbble.com/louisdainguyen). The
> images are not in this repo — they are his work. This document is
> written to stand without them: the values are here, and
> `design-reference/README.md` records how they were derived if you
> need to check or re-measure.

The reference is that product UI: dense
SaaS surfaces where the chrome is almost colorless, every edge is a
hairline, and the only saturated things on screen are the user's own
content — avatars, project marks, status.

The feeling to aim for: **quiet, precise, unhurried, slightly clinical.**
A tool that a professional uses for six hours a day and never notices.

It should explicitly *not* feel: expressive, branded, playful, or
"designed". No hero gradients, no glassmorphism, no decorative blur, no
color used to create excitement. If a screen looks impressive in a
screenshot but tiring after an hour, it is wrong.

The audience is someone who already knows what they came to do. Optimise
for the second thousandth use, not the first.

### The feeling

Weightless, quiet, roomy, soft-edged. Nothing on screen appears to be
trying. It should look like the interface cost no effort, while being
obviously exact.

The trap is reading that as a component list — "it has a sidebar". It
does not come from any component. It comes from four measurable
properties, and if you get these right the feeling survives any layout.

### How the feeling is actually produced

Measured off the reference shots, not estimated:

**1. Surfaces step by 2–4% lightness, and there are three of them.**
`#ebebee` canvas → `#fafafa` rail → `#ffffff` content. Each step is
about `1.05:1`. That near-invisible laddering is what makes panels seem
to float rather than sit in boxes. One step is flat; five steps is a
Christmas tree.

**2. Every border is 1.1–1.2:1 against its surface.** `#e7e7ea` on
white measures `1.23:1`. You should be able to squint and lose it. A
border you can clearly see is already too strong, and is the single
fastest way to make this language look cheap.

**3. There are no resting shadows at all.** Walking in from the canvas
to the app frame in the reference, `#ebebee` meets `#fafafa` with no
gradient between them — a hard edge, no glow, no drop shadow. Depth
here is lightness, never blur. Only genuinely floating things
(popovers, dialogs) get the one shadow token.

**4. Air is generous and it is on the outside.** The app frame sits
with roughly 5% of the viewport as canvas around it. Inside, rows are
about 2.7x their font size tall. Density comes from small type on tall
rows, not from squeezing.

Two colour rules sit on top of that:

- **Near-black is the action colour; indigo means "you are here".**
  The primary button is `#0a0a0b`. Indigo appears only on the active
  nav row, the current tab, and focus. Never both on one control.
- **The only saturated things are the user's own content** — avatars,
  workspace marks, status. A colourless frame around colourful content
  is the whole trick.

### Do not transplant the components

The reference images are product UI. They contain a rail, a board, an
invoice table. **Those are not the language.** They are what the
language looks like when it is applied to that product.

Applying this to a reading surface, a marketing page or a form does not
mean bolting on a rail. It means the same measured properties — the
surface ladder, the near-invisible borders, the air, the type sizes,
the one quiet toolbar — arranged for whatever the content actually is.

If you find yourself copying a component because it appears in the
reference rather than because the content needs it, stop. That is the
most common way this goes wrong, and it produces something that is
recognisably imitating the source rather than sharing its taste.

### Showing versus telling

A page that teaches something has one job: put the thing in front of
the visitor and let them operate it.

The failure mode is subtle, because it looks like work. You write a
scenario, offer two options, and let the reader pick. It has buttons,
so it feels interactive. It is still text. The reader has learned
nothing they could not have got from a sentence.

The bar: **is there something to press, type in or drag, and does
pressing it show the difference?** If not, it is prose, however many
controls surround it.

Some ideas genuinely cannot be shown in a browser — anything about
process, hiring or team philosophy. Those get one short line saying so.
They do not get dressed up as a quiz. Four things a visitor can operate
are worth more than thirty they read.

### Content-dense pages

A page that lists rules, steps or examples is where this language most
easily collapses into a wall of text. Three rules hold it together:

1. **The thing you operate is the biggest element.** Text is a caption
   under it, one line. If a paragraph is doing the explaining, the
   example is not working.
2. **One container, one measure.** A nested `mx-auto` inside a page
   that already has a container pushes the body out of line with its
   own heading. Set the measure once, at the shell.
3. **Items are separated by a hairline and vertical space, not by
   boxes.** Every item in its own card produces a ladder of borders;
   the eye has nothing to rest on.

### How to tell you have lost it

- A border you notice before you notice the content.
- Any resting card with a shadow.
- More than three surface levels on one screen.
- A control shorter than about 2.5x its own font size.
- A navigation rail on a page that has no persistent navigation.
- Two paragraphs in a row anywhere near an interactive example.
- An "example" the reader judges rather than operates.
- A page body that does not line up with its own heading.
- Saturated colour on anything that is not content.

## Applying this to a project that does not have it

You have been handed a project that looks like everything else. This is
the order to change things in, by leverage. The first three moves carry
most of the feeling; doing move 7 before move 1 is wasted work.

Do them one at a time and look at the screen after each.

### 1. Take the page off white

The highest-leverage change. Most projects render content directly on
`#ffffff`. Here the page is `#ebebee` and content sits on white panels
above it.

```css
--background: oklch(0.941 0.002 286.3); /* #ebebee — the page */
--card:       oklch(1 0 0);             /* #ffffff — content */
--secondary:  oklch(0.985 0 0);         /* #fafafa — the middle step */
```

Three surfaces, never more. Each step is barely over `1:1`. If you can
clearly see where one surface ends, the step is too big.

Then inset the app from the viewport by 16–24px with canvas visible
around it, corners at 20px. That band of grey around the edge is most
of what makes it feel like a made object.

### 2. Turn the borders down until you can barely see them

Measure them. Every border lands at **1.1–1.2:1** against its surface.
`#e7e7ea` on white is `1.23:1`.

Most projects use `#d4d4d8` or `#e5e7eb` at full strength on white,
which reads at 1.4–1.6:1. That is the second biggest tell. Turn it down
and the interface relaxes immediately. There is no 2px border here.

### 3. Remove colour from the chrome

Remove every saturated colour that is not one of three things:

- the user's own content — avatars, workspace marks, images
- a status, at small size, in a muted tint
- the one accent, on the row you are currently on

Everything else goes neutral. Primary buttons go **near-black**
(`#0a0a0b`), not brand-coloured. Nav, toolbars, tabs, icons, headers:
grey. A brand colour spread through the chrome loses this fastest.

The result should read almost monochrome, with small vivid gradient
marks scattered through it. That contrast is the point.

### 4. Fix the type

- Body and UI text to **15px**. 16px reads as a marketing site.
- Secondary text is **muted grey**, not black at lower opacity.
- **In a rail, the labels are dark and the ICONS carry the muting.**
  Every label — active or not — sits at `ink`. The icon beside it sits
  at `ink-muted`, roughly two steps lighter. Muting the labels instead
  is the common mistake and it makes the rail look disabled.
- Tighten tracking as size grows: `-0.02em` at 22px, `-0.035em` at 56px.
- Never below weight 400. Never change weight on hover.

### 5. Give rows their height back

Controls and rows are about **2.7x their font size** tall: 40px rows at
15px text, 36px controls. Card padding 20–24px.

Density comes from small type in tall rows, never from squeezing. If a
project feels cramped, the fix is row height, not font size.

### 6. Round everything, proportionally

`6 / 8 / 10 / 14 / 20`. Buttons, inputs, tags at 8–10px. Cards at 14px.
Panels and the app frame at 20px. Avatars fully round. Nested corners
step down: a control inside a 14px card gets 8px.

### 7. Fix depth

Three situations, and projects usually apply one rule to all of them:

- **App frame on the canvas: no shadow at all.** Measured on the
  reference, `#ebebee` meets the frame with a hard edge — no gradient.
- **A card floating in a scrollable column: soft wide shadow, no
  border.** About 24px of spread, reaching ~10% black at its darkest.
- **Structural panels, table rows, toolbars: hairline, no shadow.**

If you remember one thing: no shadow is ever tight or dark.

### 8. Redraw the icon set

- Outline, **rounded terminals, about 2px stroke**, 18px in a rail.
- **Muted grey — lighter than the label beside them.**
- **The active icon becomes filled.** Outline to solid is how state
  reads, alongside the row background. Easy to miss, and it is a
  signature.
- Inside a tile, the glyph is a **small solid geometric shape**, not an
  outline.
- Never mix two icon families. Never duotone.

### 9. Settle the active state

**The default is a quiet pill, not the accent.** The active row gets the
`surface` colour — one step *lighter* than the rail it sits in — plus a
barely-there shadow, and the label goes semibold. The icon fills. That
is the whole treatment: no colour at all.

```
rail          surface-sunken   #fafafa
active row    surface          #ffffff  + shadow-xs + font-medium
label         ink              #0a0a0b  (same as every other row)
icon          ink-muted -> filled ink
```

The accent container (`#eae4fc` with `#4b45cc`) is the **exception**,
for a product where the current location must be unmissable. Reaching
for it by default is the single fastest way to make this look like a
different designer's work: an indigo row on a grey rail is the loudest
thing on the screen, and nothing in this language is meant to be loud.

Never both on one screen. Never a saturated fill.

### 10. Calm the motion down

Everything the user triggers resolves in 150–200ms, ease-out. Scale
from 0.96, never 0. Remove animation from anything done more than a few
times a session.

### Checking your work

Screenshot it and ask:

1. Do I notice a border before the content? → move 2
2. Is anything saturated that is not the user's content? → move 3
3. Does any resting element look heavier than a whisper? → move 7
4. Could another line of text fit inside a control? → move 5
5. Is the page white? → move 1

## Colors

The palette is a cool neutral ramp plus exactly one chromatic accent.
Everything else on screen is content.

- **Canvas (#EBEBEE):** A cool paper grey. The page background,
  always. Content never sits directly on it without a white panel.
- **Surface (#FFFFFF):** Pure white, for panels, cards, popovers, the
  content column. The contrast against the canvas is the layout.
- **Surface Sunken (#FAFAFA):** For containers that hold cards — a
  board column, a table header, a tag pill. One step *toward* the
  canvas, so nesting reads as recession.
- **Ink (#0A0A0B):** Near-black, not black, for primary text — and for
  primary buttons and featured panels. Reversing a whole card to ink
  with white text is the strongest emphasis available; use it once per
  screen at most.
- **Ink Secondary (#52525B):** Body copy that is not a heading.
- **Ink Muted (#8B8D94):** Metadata, timestamps, placeholder, the
  uppercase section labels in a sidebar.
- **Line (#E7E7EA):** The hairline. This is the workhorse of the whole
  system — used more than any color other than white.
- **Accent (#6C66FC):** A periwinkle indigo. Reserved for state, not
  decoration: the active nav item, the selected tab, focus rings,
  in-progress indicators. On light surfaces it appears as
  `Accent Container (#EAE4FC)` with `#4B45CC` text, not as a solid
  fill.

**In an app shell the rail is `surface-sunken` and the content pane is
`surface`.** The two-tone split is what makes the chrome recede and the
data come forward — a rail that matches the pane reads as one
undifferentiated sheet. This is the app-shell counterpart of "white
panels on a grey canvas": at page level the grey is outside, at app
level the grey is the rail.

Saturated color that is *not* the accent may only enter as content:
avatar gradients, project marks, status badges. That contrast — a
colorless frame around colorful content — is deliberate.

Dark theme is a genuine peer, not an inversion. The canvas goes to
`#09090B` and surfaces get *lighter* (`#141416`), because elevation in
the dark is lightness, not shadow. The accent lightens to `#8B86FF` so
it does not vibrate.

## Typography

One family, Geist, doing everything. Character comes from the weight and
size relationships, not from a display face.

- **Display / H1:** Tight. `-0.035em` at display size, `-0.028em` at
  h1. Large type looks loose at default tracking; negative tracking is
  what makes it read as considered rather than merely big.
- **Mixed-weight headings are a signature.** `**Free** forever` —
  semibold on the word that carries the meaning, regular on the rest.
  Use it for a headline that contains its own subject.
- **Body is 15px, not 16px.** This is a tool; the extra pixel reads as
  a marketing site.
- **UI text is 14px / weight 500.** Interface labels are never regular
  weight — they sit on busy surfaces and need the extra stem.
- **Micro (10px, 600, +0.06em, uppercase)** is the sidebar section
  label, the tag pill, the eyebrow. Uppercase at this size *requires*
  the added tracking to stay legible.
- **Weight below 400 is never used.** Weight never changes on hover.
- Numbers that update in place use `tabular-nums`.

## Layout

Dense but not cramped. The rhythm is 4px, and most of the work happens
between 8 and 24.

- Content column maxes at **1152px**; prose at **640px**.
- **Card padding is 24px** at desktop, 16px on small screens. Panels
  that contain cards get 12px and let the cards carry the rest.
- **Gap between sibling cards is 12px**, not 24 — the hairline plus a
  small gap reads as a set; a large gap reads as unrelated things.
- **The rail has no border.** It is separated from the content pane by
  the surface step alone. A vertical rule there reads as a seam and
  breaks the sense that the whole frame is one object.
- **One toolbar row, not two.** A page title bar stacked on a filter
  bar puts 112px of chrome above the content and makes the screen feel
  top-heavy. Put the view controls in the same 56px row as the title.
- **App chrome is airier than page content.** The rail is 256px wide,
  nav rows are **40px tall** with 10px horizontal padding and a 10px
  icon-to-label gap, and the top bar is 56px. Icons in the rail are
  18px. The hit area is the row's padding; there are no gaps between
  rows. Rows below 40px read as cramped at 15px type — this was the
  single biggest miss on the first pass.
- Controls in app chrome (search fields, tab pills, buttons) are
  **36px tall**, not 28px.
- Sections are separated by a hairline and **48px** of vertical space,
  not by a heavier rule.
- Group with proximity and a hairline before reaching for a container.
  Every extra box is a box the eye has to parse.

## Elevation & Depth

Depth is almost entirely flat. There are three levels and no more:

1. **Canvas** — the page. No shadow.
2. **Surface** — panels and cards on the canvas. Separated by a
   hairline border. **No shadow.** This is where most agents get it
   wrong: a card on this canvas does not need one.
**The feature surface** is the exception and it is a token, not a
one-off: `feature` / `on-feature`. In light mode it reverses to ink. In
dark mode ink *is* the page, so reversing means nothing — there it rises
to `#26262b` with an indigo-tinted hairline instead. One per screen.

3. **Floating** — popovers, dropdowns, dialogs, and cards sitting in a
   scrollable column. Soft wide shadow, ~24px spread, ~10% black at its
   darkest, and **no border** on a floating card. Measured on the
   reference board, the gradient below a card runs from `#dedfe2` back
   to the column background over roughly 24px. The app frame is the
   exception in the other direction: **no shadow at all**.
   `0 1px 2px rgb(9 9 11 / 0.04), 0 12px 32px -8px rgb(9 9 11 / 0.10)`.

Large blurs, glows, and inner shadows are not part of this system. In
dark mode, levels 2 and 3 are distinguished by lightness instead —
`#141416` on `#09090B` — because shadow is invisible there.

## Shapes

Radii are generous but not soft. The scale steps: 6 / 8 / 10 / 14 / 20.

- **Buttons, inputs, tags: 8px.** Small controls with large radii look
  like toys.
- **Cards: 14px.**
- **Panels and app frames: 20px.**
- **Avatars and status dots: full.**
- **Nested corners step down.** A card at 14px containing a control
  gets 8px. Matching radii at different sizes reads as a mistake.

Borders are always 1px. There is no 2px border anywhere in this system.

## Components

- **Button, primary:** ink background, white text, 8px radius, 14px/500
  text, 36px tall. One per view.
- **Button, secondary:** surface-sunken background, ink text, hairline
  border. This is the default; most buttons are secondary.
- **Featured panel:** the ink-reversed card. White text, white
  secondary button, a white pill badge. Reserved for the recommended
  plan, the primary empty-state CTA — one thing.
- **Nav item:** icon (outline, 1.5px stroke, 16px, ink-muted) plus
  14px/500 label. Active state is `accent-container` with
  `on-accent-container` text and icon. Hover is `surface-sunken`.
- **Tag / status pill:** `surface-sunken`, micro type, **fully rounded**
  with generous horizontal padding (about 10px). Measured off the
  reference board: they are pills, not small rectangles. A 6px radius
  here reads as a little box and is a common tell.
- **Table row:** hairline separators only, no zebra striping, no
  vertical rules. Row hover is `surface-sunken`.
- **Input:** hairline border, 8px radius, 14px text. Focus replaces the
  border with the accent and adds a 3px accent ring at 20% opacity.
- **Icons:** outline, rounded terminals, about 2px stroke, 18px in a
  rail, and **muted grey — lighter than the label beside them**. The
  **active icon becomes filled**; that outline-to-solid switch is how
  state reads. A glyph inside a tile is a small solid geometric shape.
  Never duotone, never two families.

## Do's and Don'ts

**Do**

- Put white panels on the grey canvas. Let the canvas show through.
- Use a hairline before you use a shadow, and proximity before either.
- Keep saturated color for content — avatars, marks, status.
- Reverse one panel to ink when something genuinely deserves emphasis.
- Set uppercase micro-labels with real letter-spacing.
- Let numbers be tabular so rows do not twitch.

**Don't**

- Don't put content directly on the canvas without a surface.
- Don't add a shadow to a resting card. It is a hairline, not a lift.
- Don't use the indigo as a button fill, a background wash, or a
  decorative gradient. It marks state and nothing else.
- Don't use a gradient as a background. Gradients belong to avatars and
  project marks, at small sizes.
- Don't set body copy at 16px or headings at default tracking.
- Don't use more than one ink-reversed panel per screen.
- Don't reach for a container when a hairline and 12px of space would
  group the same things.
- Don't animate anything the user does routinely. Motion here is for
  surfaces arriving, and it is brief — 150–200ms, ease-out.
