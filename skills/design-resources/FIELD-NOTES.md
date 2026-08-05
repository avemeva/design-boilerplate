# Field notes

Things that only surface by actually using these resources in this repo,
not by reading about them. Each one cost real time to find. Read this
before you spend that time again.

Everything here was hit while building `src/components/live-stats.tsx`
(chart + animated numbers) and installing from a third-party registry.

---

## desengs.com has no `llms.txt` — and lies about it

`https://desengs.com/llms.txt` returns **HTTP 200 with 65KB of the Astro
app shell**. It is a soft-404. Any naive "did the fetch succeed?" check
passes, and you get an HTML document that contains none of the
resources.

**The cheap path is the repo's data file:**

```
https://raw.githubusercontent.com/remvze/desengs/main/src/data/resources.ts
```

19KB, all 74 entries, and it carries the `format` field
(`read watch listen browse use build learn join follow apply`) — which
the rendered site shows only as filter chips and which is the single
most useful axis in the whole catalogue. Parse the `_resources` array
(note the leading underscore; the exported `resources` is a reversed
view).

**Generalise this.** Several sites in the catalogue are SPAs that 200
on any path. Before trusting a fetch, check the body does not start with
`<!doctype html>`. Every `fetch` field in `resources.json` was verified
this way; a URL you construct yourself was not.

## shadcn CLI has moved

Flags in your training data are wrong:

- `--base-color` **no longer exists**. Init takes `-p <preset>` —
  `nova vega maia lyra mira luma sera rhea` — and `-b <base>`
  (`base` | `radix` | `aria`). This repo is `-b radix -p nova`, i.e.
  style `radix-nova`.
- `shadcn add form` **silently does nothing** in this style. It prints
  "Checking registry ✔" and writes no file. Use `@shadcn/field`.
  A silent no-op is the worst failure mode here — check that a file
  actually appeared.
- `npx shadcn@latest search @shadcn -q <term>` is the way to find out
  whether an item exists before you try to add it.

## Third-party registry installs do not respect your aliases

Verified by installing `soundcn`:

```bash
npx shadcn@latest add https://soundcn.xyz/r/click-soft.json
```

It wrote to `src/lib/`, not `src/components/ui/`, because the registry
JSON declares its own target paths. `components.json` aliases do not
override that. `dither-kit` does the same thing into
`components/dither-kit/`.

**So: after any third-party registry install, run `git status` and look
at where the files actually landed.** Then decide whether to move them.

Also verified: the installed soundcn bundle declares `UseSoundReturn` in
`sound-types.ts` but **ships no `useSound` hook**. You call
`playSound()` from `sound-engine.ts` yourself. The registry item is
partial; do not assume a declared type implies an implementation.

## `--chart-*` shipped broken and it was invisible in dark mode

The scaffolded shadcn tokens define `--chart-1 … --chart-5` with
**byte-identical values in `:root` and `.dark`**. Every shadcn chart
example defaults to `var(--chart-1)`. At its original `oklch(0.87 0 0)`
that is **1.48:1 on white** — effectively invisible, and failing WCAG
1.4.11's 3:1 floor for graphical objects.

It looks perfect in dark mode, so it survives any casual check. If you
only ever look at one theme, you will ship it.

Fixed here: the light ramp descends `0.32 → 0.62`, the dark ramp ascends
`0.92 → 0.54`. All ten combinations now clear 3:1. **Re-measure if you
retheme** — the useful lightness window on white is roughly `L ≤ 0.62`,
which is why a monochrome ramp can only carry about five
distinguishable series before you have to reach for hue.

## Tailwind v4 theme values must be on one line

A `@theme` value wrapped onto the following line is **silently not
parsed** — the utility is never generated, no error, no warning:

```css
/* broken — `shadow-floating` does not exist */
--shadow-floating:
  0 1px 2px rgb(9 9 11 / 0.04), 0 12px 32px -8px rgb(9 9 11 / 0.1);

/* works */
--shadow-floating: 0 1px 2px rgb(9 9 11 / 0.04), 0 12px 32px -8px rgb(9 9 11 / 0.1);
```

Worse, the failure is invisible: `class="shadow-floating"` on a shadcn
`PopoverContent` just leaves the primitive's own `shadow-md` in place,
which looks plausible. Verify a new token with
`getComputedStyle(el).getPropertyValue('--tw-shadow')`, not by eye.

## Utility class order does not decide the winner

Two utilities setting the same property are resolved by their order in
Tailwind's **generated stylesheet**, not by the order you wrote them in
`className`. `shadow-floating` after `shadow-md` in the attribute still
loses.

The fix in this repo is not `!important` — shadcn is source, so change
the primitive. `ui/popover.tsx`, `ui/dropdown-menu.tsx`, `ui/sheet.tsx`
and `ui/select.tsx` now carry `shadow-floating` directly, which makes
"one shadow, system-wide" true rather than aspirational.

## Recharts specifics

- `ChartContainer` collapses to zero height unless the parent resolves
  one. `className="h-40 w-full"` on the container, not on the chart.
- `margin={{ left: 0, right: 0 }}` **silently drops the first and last
  axis tick** when the label would overflow the plot box. "Mon"
  disappeared and nothing warned. 16px each side was enough.
- `isAnimationActive` defaults to true and replays the whole draw on
  every state update. With a value that ticks on an interval, that is a
  permanent animation. Turn it off for live data.
- `var(--color-<dataKey>)` only resolves inside `ChartContainer`, which
  injects the mapping from your `ChartConfig`.

## Verified installs, this repo, 2026-08-05

| | |
| --- | --- |
| `npx shadcn@latest add chart` | works — pulls `recharts@3.8.0`, exists in `radix-nova` |
| `npx shadcn@latest add https://soundcn.xyz/r/click-soft.json` | works — see the path caveat above |
| `npx shadcn@latest add @shadcn/field` | works |
| `npx shadcn@latest add form` | **no-op**, no error |

## When you find something new

Correct the entry in `resources.json` rather than only noting it here —
`use_when`, `gotcha` and `compat` are what `find` prints. Put the word
`VERIFIED` in the gotcha when you actually ran the install, so the next
agent can tell first-hand evidence from a reading of the docs.
