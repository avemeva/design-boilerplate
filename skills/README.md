# Skills

Vendored, unmodified, from the people who set the bar for design
engineering. These are the source of truth for craft decisions in this
project. **Invoke them — do not work from a summary, including one you
wrote earlier in the session.**

Claude Code picks these up automatically from `.claude/skills/`.
Other agents: read the `SKILL.md` in the relevant directory.

## Provenance

| Upstream | Skills | License |
| --- | --- | --- |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) — Emil Kowalski, design engineer at Linear | 8 | MIT |
| [jakubkrehel/skills](https://github.com/jakubkrehel/skills) — Jakub Krehel, founding design engineer at Interfere | 7 | MIT |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) — [tasteskill.dev](https://www.tasteskill.dev/) | 12 | MIT |
| [raunofreiberg/interfaces](https://github.com/raunofreiberg/interfaces) — [interfaces.rauno.me](https://interfaces.rauno.me) | 1 | — |

Upstream READMEs and licenses are preserved in `_upstream/`.
All were vendored 2026-08-05. To refresh, re-clone and copy over —
they are unmodified, so a straight overwrite is safe.

---

## Which one do I need?

### Building something new

| | |
| --- | --- |
| `design-taste-frontend` | The anti-slop skill. Reads the brief, infers a direction, ships UI that does not look templated. Start here for landing pages, portfolios, marketing surfaces. |
| `high-end-visual-design` | Exact fonts, spacing, shadows, card structures and animations that make a site feel expensive. Blocks the defaults that make AI output look cheap. |
| `prototype` | Builds several genuinely different versions behind a visual picker so you can flip through them and promote the one that feels right. Explicit invoke only. |
| `better-interface` | Cross-discipline review that coordinates the other `better-*` skills. Explicit invoke only. |

### A specific discipline

| | |
| --- | --- |
| `better-typography` | Choosing and pairing faces, variable fonts, OpenType, scales, wrapping, truncation, punctuation |
| `better-colors` | OKLCH, conversion, palettes, contrast, gamut, Tailwind v4 theming |
| `better-layout` | Grouping, alignment, reading order, progressive disclosure, breakpoints, RTL |
| `better-accessibility` | Focus, keyboard, ARIA, forms, screen readers, hit areas, motion and zoom |
| `better-ui` | Polish: hover states, shadows, borders, icons, micro-interactions, surfaces, performance |
| `better-writing` | Button labels, errors, empty states, placeholders, onboarding copy |

### Motion

| | |
| --- | --- |
| `emil-design-eng` | The philosophy: polish, component design, when to animate, invisible details |
| `find-animation-opportunities` | Read-only sweep for things that should animate and do not — and rejects everything that shouldn't |
| `improve-animations` | Audits existing motion and writes implementation plans |
| `review-animations` | Reviews motion against a high craft bar. Defaults to flagging; approval is earned |
| `apple-design` | Gestures, springs, interruptible transitions, materials, depth |
| `animation-vocabulary` | Reverse lookup: "the bouncy thing when a popover opens" → *Pop in* |

### Checking work

| | |
| --- | --- |
| `web-interface-guidelines` | Rauno Freiberg's checklist, verbatim. The tiebreaker for interface details |
| `redesign-existing-projects` | Audits an existing UI, identifies generic AI patterns, upgrades without breaking it |

### Style directions

Reach for these only when `DESIGN.md` calls for that character.

| | |
| --- | --- |
| `minimalist-ui` | Clean editorial, warm monochrome, flat bento, no gradients |
| `industrial-brutalist-ui` | Swiss print × military terminal. Rigid grids, extreme type contrast |

### Adjacent

| | |
| --- | --- |
| `pick-ui-library` | Curated, opinionated picks per problem: OTP inputs, charts, virtualization, DnD, command menus. Explicit invoke only |
| `brandkit` | Brand-guideline boards, logo systems, identity decks (image generation) |
| `imagegen-frontend-web` / `imagegen-frontend-mobile` | Generate design references before coding (image generation) |
| `image-to-code` | Generate the design image first, analyse it, then implement to match |
| `stitch-design-taste` | Generates agent-friendly `DESIGN.md` files |
| `gpt-taste` | GSAP-heavy editorial motion. Targets GPT/Codex; overlaps with `design-taste-frontend` |
| `full-output-enforcement` | Suppresses truncation and placeholder output on long generation tasks |

---

## Note on overlap

These collections disagree with each other in places — `high-end-visual-design`
and `minimalist-ui` want different things, and that is the point. They
are style directions, not laws.

When they conflict, the order of precedence is:

1. `DESIGN.md` — this product's brief
2. `web-interface-guidelines` — mechanical correctness
3. The discipline skill for the area you are in
4. Style-direction skills

A conflict between two of them is a decision for `DESIGN.md` to settle.
If `DESIGN.md` is silent on it, ask the user rather than picking.
