---
name: design-resources
description: Local catalogue of 138 vetted design-engineering resources — component registries, React libraries, UI references, design-system galleries, color and motion tools, inspiration sources. Each entry records what it is, the exact install command, whether it works with Next 16 / Tailwind v4 / React 19, and whether this repo already has it. USE THIS BEFORE web-searching or installing anything UI-related. Triggers on: need a component, need a library, pick a package, chart, toast, command menu, animated number, carousel, date picker, drag and drop, avatar, skeleton, sound, haptics, shader, icon set, font, color tool, easing, design inspiration, reference, "what should I use for", "is there a library", "find me an example", "how should this look".
---

# Design resources

A local, queryable catalogue. **Query it before you web-search for
anything UI-related, and before you `npm i` a UI package.** The
catalogue already records whether a thing works with this stack — a web
search does not.

## Query it

```bash
skills/design-resources/find <terms>          # search title + description
skills/design-resources/find chart -f use     # restrict to a format
skills/design-resources/find -f read          # everything to read
skills/design-resources/find --stats          # what is in here
```

It prints, per hit: what kind of thing it is, the exact install command,
compatibility with this stack, when to reach for it, and the one gotcha
you would otherwise learn the hard way.

`[IN REPO]` and `[VENDORED]` markers mean **stop** — it is already here.

## The decision procedure

1. **Need a component or library?** `find <thing>`.
   - Hit with `kind: npm` or `shadcn-registry` → run its `install`.
   - Hit marked `[IN REPO]` → use what is installed; do not add a second one.
   - Hit with a `compat` warning → believe it. Tailwind v3-only packages
     genuinely do not work here; there is no config file to add.
   - No hit → *then* search the web. Say out loud that the catalogue
     had nothing, so the gap is visible.
2. **Need to decide how something should look?** `find -f browse` —
   galleries of real product UI. Look before inventing.
3. **Need to understand a craft topic?** `find -f read` / `-f learn`.
   For the actual rules, use the other skills in `skills/` instead —
   they are the source, vendored in full.

## Fields

| | |
| --- | --- |
| `format` | The desengs.com taxonomy: what you *do* with it — `read` `watch` `listen` `browse` `use` `build` `learn` `join` `follow` `apply` |
| `kind` | `npm` · `shadcn-registry` · `copy-paste` · `tool` · `agent-skill` · `reference` · `dead` |
| `install` | The exact command. Empty if there is nothing to install |
| `compat` | `ok`, `unknown`, or a specific blocker verified against this stack |
| `use_when` | When an agent on *this* project would reach for it |
| `gotcha` | The non-obvious thing, learned by opening it |
| `status` | `external` · `installed` · `vendored` — what this repo already has |
| `fetch` | A raw README or real `llms.txt`, when one exists. Cheaper and more complete than fetching the marketing page |

## Read FIELD-NOTES.md before your first install

`FIELD-NOTES.md` in this directory records what actually broke when
these resources were used in this repo — verified by running the
installs, not by reading docs. The short version:

- Third-party registry installs **ignore your `components.json`
  aliases** and write wherever the registry JSON says. Run `git status`
  after every one.
- `shadcn add form` is a **silent no-op** in this style. Use `field`.
  Check that a file appeared; the CLI reports success either way.
- Several catalogued sites are SPAs that return **HTTP 200 for any
  path**, including `/llms.txt`. A body starting `<!doctype html>` is a
  miss, not a document.
- Recharts drops edge axis ticks at `margin: 0` and gives no warning.

## Fetching a resource

Use the `fetch` field if present. It is a raw README or a verified
`llms.txt`, and it is both cheaper and more complete than the rendered
page.

**Watch for soft-404s.** Several of these sites are SPAs that return
HTTP 200 with the app shell for any unknown path — `/llms.txt` included.
A "successful" fetch that starts with `<!DOCTYPE html>` is a miss, not a
document. Every `fetch` value in this catalogue was verified to be
non-HTML and non-trivial in size; URLs you construct yourself were not.

## How much of this is verified

All 86 actionable entries (`format: use` or `build`) were opened —
homepage, README, `package.json`, registry JSON — and annotated against
this exact stack. Every one has `kind`, `use_when` and `gotcha`; 57 have
an exact install command; **28 carry a real compatibility blocker**
found by reading, not guessing. A sample of what those catch:

- A popular component registry is built on **Base UI, not Radix** —
  adding it means running two primitive libraries next to shadcn/ui.
- Two registries pull **`framer-motion`** as a dependency, installing
  the legacy package alongside the `motion` already here.
- One registry's sibling namespace is **GSAP-based** and conflicts with
  `motion` if mixed.
- One "React component library" is **Remotion-only** and renders
  nothing inside a Next.js app.
- One requires a **Vite plugin** — unusable under Turbopack — and pulls
  Playwright as a hard dependency.
- One CSS framework **collides with Tailwind Preflight** via global
  element selectors.
- Several registries are **gated behind an API key** and return 401 to
  a plain `shadcn add`.

None of that is visible from a link, a title, or a search result. That
is the reason to query here first.

The 52 non-actionable entries (`read`, `browse`, `follow`, `learn`,
`join`, `apply`) keep their upstream description — there is nothing to
install, so there is nothing to verify.

## Provenance

- **[desengs.com](https://desengs.com/)** — 74 entries, parsed from
  the canonical source at
  `raw.githubusercontent.com/remvze/desengs/main/src/data/resources.ts`.
  The rendered site is an Astro SPA; the data file is the cheap path.
- **The project owner's saved-links archive** — 64 further entries,
  filtered to design/UI/React/motion.

Refresh by re-parsing the `resources.ts` above and re-running the
enrichment. Entries carry an `added` date from upstream.
