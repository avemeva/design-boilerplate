---
name: web-interface-guidelines
description: Rauno Freiberg's Web Interface Guidelines — the non-exhaustive list of details that make a good web interface, covering interactivity, typography, motion, touch, optimizations, accessibility and design. Use when building, reviewing or polishing any web UI, when the user asks whether an interface is "done", or before shipping a screen. Triggers on interface review, UI checklist, polish, craft, details, focus states, hover states, input handling, touch targets, animation timing.
---

# Web Interface Guidelines

Read `GUIDELINES.md` in this directory. It is the upstream document,
verbatim and unabridged — do not work from a summary of it, including
one you wrote earlier in the session.

Source: <https://interfaces.rauno.me> ·
<https://github.com/raunofreiberg/interfaces>

## How to use it

**Building a screen** — read the whole document first, then build. It
is short. The rules are cheap to follow up front and expensive to
retrofit.

**Reviewing a screen** — go section by section against the actual
rendered UI, not the diff. Report violations with the specific rule
they break.

**Settling an argument about a detail** — the document is the
tiebreaker. If it does not cover the case, say so rather than inventing
a rule and attributing it here.

## Project-specific notes

Several guidelines are already implemented globally in this codebase —
check before flagging them as missing:

- Font smoothing, `text-rendering`, `-webkit-text-size-adjust`,
  `::selection`, box-shadow focus rings, `prefers-reduced-motion`, and
  `pointer-events` on `[data-decoration]` are all handled in the
  `@layer base` block of `src/app/globals.css`.
- Theme switching already suppresses transitions via `ThemeProvider`.
- Motion durations and easing curves are tokenised in
  `src/lib/motion.ts` and `src/app/globals.css`.

Everything else is per-component and is your responsibility.
