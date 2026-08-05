<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working in this project

Four things, no overlap:

| | |
| --- | --- |
| `design-reference/` | How the visual language was measured, and from what. The screenshots themselves are not redistributed. |
| `DESIGN.md` | The brief, measured off those images. Read first, every session. |
| `skills/` | How to do the craft. Vendored from the people who set the bar. **Invoke them.** |
| `skills/design-resources/find` | 138 vetted resources with install commands. **Query before web-searching.** |
| `/resources` | The same catalogue rendered as browsable docs — one page per link. |
| This file | What is true about *this repo* — stack, tokens, conventions. |

## Two hard gates

These exist because the failure they prevent is silent — you get a
plausible answer and never learn there was a better one sitting in the
repo.

**Gate 1 — before adding any UI dependency, or web-searching for a
component, library or visual reference:**

```bash
skills/design-resources/find <what you need>
```

138 entries, each already checked against this stack for install
command and Tailwind-v4 / React-19 compatibility. A hit marked
`[IN REPO]` means it is already installed — do not add a second one.
If the catalogue has nothing, say so explicitly, then search the web.

**Gate 2 — before writing UI, invoke the relevant skill from
`skills/`.** Not a recollection of it, not a summary from earlier in
the session. The file.

## Use the skills

`skills/README.md` is the index. Do not work from memory or from a
summary of a skill — including one written earlier in this session.
Open the skill.

The short version of the routing:

- Building a landing page, portfolio, marketing surface → `design-taste-frontend`
- Making something feel expensive rather than templated → `high-end-visual-design`
- Typography · color · layout · a11y · polish · copy → `better-typography` · `better-colors` · `better-layout` · `better-accessibility` · `better-ui` · `better-writing`
- Anything about motion → `emil-design-eng`, then `apple-design`, `find-animation-opportunities`, `review-animations`
- "Is this screen done?" → `web-interface-guidelines`
- Improving a UI that already exists → `redesign-existing-projects`
- Holistic review before shipping → `better-interface`

**Precedence when they disagree:** `DESIGN.md` → `web-interface-guidelines`
→ the discipline skill → style-direction skills. If two conflict and
`DESIGN.md` is silent, ask rather than picking.

## Facts about this repo

**Stack.** Next.js 16 (App Router, Turbopack, React 19) · Tailwind v4 ·
shadcn/ui (`radix-nova`, Radix primitives) · `motion` · `next-themes` ·
`sonner` · `lucide-react` · `@number-flow/react` · `react-hook-form` +
`zod`. Check `package.json` before assuming a version.

**Tailwind v4 has no config file.** Every design token is a CSS custom
property inside `@theme` in `src/app/globals.css`. Add a variable there
and the utility appears. That file holds colors, radii, the type scale,
`--duration-*`, `--ease-*` and `--container-*`.

**Motion tokens are also in JS** — `src/lib/motion.ts`, mirroring the CSS
one-for-one, plus spring configs and ready-made variants. Import from
there rather than typing bezier arrays inline.

**`/design-system` renders every token at its real value** — color,
type scale, spacing, radii, and the easing curves racing side by side.
Look at it instead of guessing.

**shadcn is source, not a dependency.** `src/components/ui/` is yours.
Edit those files directly; do not wrap them in override classes.
Note: `form` is not in this registry style — compose with `field.tsx`.

**`typedRoutes` is on.** A `<Link>` to a route that does not exist is a
build error.

**Server Components by default.** `"use client"` only where state,
effects, or handlers are needed, pushed as far down the tree as
possible.

**Layout.** `src/app/` routes · `src/components/ui/` shadcn ·
`src/components/` product components · `src/lib/utils.ts` for `cn()`.

## Non-negotiables

The skills cover craft. These are repo mechanics:

1. **Tokens, never literals.** No `#hex`, no `rgb()`, no raw Tailwind
   ramps (`bg-zinc-900`, `text-gray-500`), no `text-[13px]`. If the
   value does not exist, add it to `globals.css` first.

   **On `dark:`** — it is not banned, and the distinction matters:

   ```tsx
   dark:bg-zinc-900          // ✗ raw color. The token layer already
                             //   handles the theme; this fights it.
   dark:bg-input/30          // ✓ per-theme tint on a semantic token
   dark:ring-destructive/40  // ✓ same
   ```

   Half of `src/components/ui/` uses the second form — translucency and
   tint often need different values per theme even when the underlying
   token is correct. Copy that pattern. What is forbidden is reaching
   for a raw color *because* you did not find a token.

   Arbitrary values follow the same logic: `grid-cols-[minmax(0,16rem)_1fr]`
   is fine because a grid template cannot be tokenised. `p-[3px]` and
   `text-[0.9375rem]` are not — those are the spacing and type scales,
   and both already have a nearby step.
2. **`cn()` from `@/lib/utils`** for conditional classes. Never string
   concatenation.
3. **Motion values come from `@/lib/motion`**, not inline numbers.
4. **Icons are `lucide-react`**, `size-4` inside buttons unless there
   is a reason otherwise.
5. **`sonner` is mounted in `layout.tsx`.** Use it for things that
   happen away from the user's focus — not to confirm a button press.

## Verify

Never report a UI change as done from the diff alone.

```bash
npm run dev      # then open the page
npm run build    # type errors surface here, not in dev
npm run lint
```

In the browser: light **and** dark theme, 320px width, keyboard-only
traversal, and the loading / empty / error states.
