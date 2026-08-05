# Design Boilerplate

A Next.js starting point for building interfaces with an AI agent, where
the craft knowledge and the resource index already live in the repo.

The problem: an agent handed an empty Next.js project re-derives what
"good" means on every screen, web-searches for libraries it can't verify
against the stack, and lands on the same generic result every time. This
repo removes all three steps.

```bash
npm install
npm run dev          # http://localhost:3000
```

Then open `/design-system` — every token rendered at its real value.

---

## What is in here

### `skills/` — the craft, vendored verbatim

28 skills copied unmodified from the people who set the bar. Not
summaries of them.

| Source | What it brings |
| --- | --- |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) — Emil Kowalski, Linear | Motion philosophy, animation review, Apple-style interaction, prototyping |
| [jakubkrehel/skills](https://github.com/jakubkrehel/skills) — Jakub Krehel, Interfere | Typography, color, layout, accessibility, UI polish, UX writing |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Anti-slop frontend, high-end visual design, redesign audits, style directions |
| [raunofreiberg/interfaces](https://github.com/raunofreiberg/interfaces) | Web Interface Guidelines — the interface-detail checklist |

`skills/README.md` indexes them and sets precedence for when they
disagree. Licenses preserved in `skills/_upstream/`.

Claude Code discovers them via `.claude/skills` → `../skills`. Other
agents read `skills/*/SKILL.md` directly.

### `skills/design-resources/` — 138 resources, queryable offline

Two surfaces over one file:

```bash
skills/design-resources/find toast      # for the agent, mid-task
skills/design-resources/find chart -f use
```

```
/resources          # for humans: searchable index, filtered by format
/resources/[slug]   # one page per link — install command, caveat, gotcha
```

Merged from [desengs.com](https://desengs.com/) (74, parsed from the
canonical data file rather than the rendered site) and the project
owner's saved-links archive (64). Every actionable entry was opened and
annotated with:

- **kind** — npm package, shadcn registry, copy-paste, tool, reference
- **install** — the exact command
- **compat** — verified against Next 16 / Tailwind v4 / React 19
- **use_when / gotcha** — when to reach for it, and what bites
- **status** — `[IN REPO]` / `[VENDORED]` if this project already has it

The point is that an agent never web-searches for a component, and never
installs something that turns out to need a `tailwind.config.js`.

### `DESIGN.md` — the product brief

Voice, personality, references, density, constraints. **Fill this in
first.** Skipping it is the single biggest cause of generic output.

### `AGENTS.md` — what is true about this repo

Stack, tokens, conventions, and the two hard gates: query the resource
catalogue before installing or searching; open the skill before writing
UI. `CLAUDE.md` points here.

---

## The stack

Next.js 16 (App Router, Turbopack, React 19) · Tailwind CSS v4 ·
shadcn/ui (`radix-nova`) · Motion · next-themes · Sonner · Lucide ·
NumberFlow · react-hook-form + Zod.

28 shadcn components pre-installed, plus a theme toggle, site header,
and a copy button demonstrating inline feedback.

## The token layer

Everything design-related is a CSS custom property in
`src/app/globals.css`, mirrored in `src/lib/motion.ts` for JS:

- **Color** — OKLCH semantic tokens, light and dark
- **Type** — fluid display sizes via `clamp()`, fixed body sizes
- **Motion** — five durations, seven named easing curves, three spring
  configs
- **Layout** — one content measure, one prose measure
- **Base layer** — font smoothing, `::selection`, box-shadow focus
  rings, tabular figures, reduced-motion, iOS text-size-adjust

Tailwind v4 has no config file: add a variable inside `@theme` and the
utility appears.

---

## Using it

1. `npm install && npm run dev`
2. Fill in `DESIGN.md` with the user.
3. Encode the color and type decisions in `src/app/globals.css`.
4. Delete `src/app/page.tsx` and build.

---

## Credit

Resource curation from [desengs.com](https://desengs.com/) by
[Maze Heart](https://x.com/remvze). Vendored skills remain under their
upstream MIT licenses.
