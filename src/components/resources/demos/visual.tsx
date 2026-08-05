"use client";

import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Easing Graphs / animations.dev — six curves, same duration.
 * ------------------------------------------------------------------ */

const CURVES = [
  ["outQuad", ease.outQuad],
  ["outCubic", ease.outCubic],
  ["outQuart", ease.outQuart],
  ["outExpo", ease.outExpo],
  ["inOutCubic", ease.inOutCubic],
  ["spring", ease.spring],
] as const;

export function EasingDemo() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button className="h-9" onClick={() => setPlaying((p) => !p)}>
          {playing ? "Reset" : "Play"}
        </Button>
        <span className="text-caption text-muted-foreground">
          All six at {duration.slower * 1000}ms, so only the curve differs.
        </span>
      </div>
      {CURVES.map(([name, curve]) => (
        <div key={name} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
          <code className="text-muted-foreground font-mono text-xs">{name}</code>
          <div className="bg-secondary h-7 rounded-full p-1">
            <motion.div
              className="relative h-5"
              initial={false}
              animate={{ width: playing ? "100%" : "1.25rem" }}
              transition={{ duration: duration.slower, ease: curve }}
            >
              <div className="bg-accent-solid absolute top-0 right-0 size-5 rounded-full" />
            </motion.div>
          </div>
        </div>
      ))}
      <p className="text-caption text-muted-foreground">
        <code className="font-mono text-[0.9em]">outQuart</code> is this
        project’s default. It starts at full speed, so the motion has already
        begun by the time your eye arrives — which is what makes an interface
        feel instant even when it isn’t.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 12 Principles of Animation — proportionality (“slow in / slow out”
 * plus scale relative to the trigger).
 * ------------------------------------------------------------------ */

const SCALES = [
  { from: 0, label: "0 → 1", wrong: true },
  { from: 0.8, label: "0.8 → 1", wrong: false },
  { from: 0.96, label: "0.96 → 1", wrong: false },
] as const;

export function ProportionDemo() {
  const [k, setK] = useState(0);
  return (
    <div className="space-y-3">
      <Button className="h-9" onClick={() => setK((v) => v + 1)}>
        Replay
      </Button>
      <div className="grid gap-3 sm:grid-cols-3">
        {SCALES.map(({ from, label, wrong }) => (
          <div key={label} className="space-y-2">
            <div className="bg-secondary grid h-28 place-items-center rounded-lg">
              <motion.div
                key={`${k}-${label}`}
                initial={{ opacity: 0, scale: from }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: duration.base, ease: ease.outQuart }}
                className="bg-feature text-feature-foreground text-caption grid size-16 place-items-center rounded-lg"
              >
                Dialog
              </motion.div>
            </div>
            <p
              className={cn(
                "font-mono text-xs",
                wrong ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {label} {wrong && "— too far"}
            </p>
          </div>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">
        Identical duration on all three. The one starting at zero reads as slow
        because it has further to travel — that is the principle, not a
        preference.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Transitions.dev — the swap-in-place recipe.
 * ------------------------------------------------------------------ */

const STATES = ["Draft", "In review", "Approved", "Paid"] as const;

export function TransitionDemo() {
  const [i, setI] = useState(0);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button className="h-9" onClick={() => setI((v) => (v + 1) % STATES.length)}>
          Advance
        </Button>
        <div className="bg-card flex h-9 items-center overflow-hidden rounded-lg border px-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={STATES[i]}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className="text-ui"
            >
              {STATES[i]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <p className="text-caption text-muted-foreground">
        <code className="font-mono text-[0.9em]">mode=&quot;wait&quot;</code> is
        what makes this read as one thing changing rather than two things
        crossfading. The exit is shorter than the entrance — the user has
        already decided.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * NumberFlow — digits that animate without the row twitching.
 * ------------------------------------------------------------------ */

export function NumberFlowDemo() {
  const [n, setN] = useState(1813);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <NumberFlow value={n} data-numeric className="text-display" />
        <div className="flex gap-2">
          <Button variant="outline" className="h-9" onClick={() => setN((v) => v - 137)}>
            −137
          </Button>
          <Button variant="outline" className="h-9" onClick={() => setN((v) => v + 428)}>
            +428
          </Button>
        </div>
      </div>
      <p className="text-caption text-muted-foreground">
        The digits roll, and the layout does not move — the global
        <code className="font-mono text-[0.9em]"> [data-numeric]</code> rule in
        <code className="font-mono text-[0.9em]"> globals.css</code> applies
        <code className="font-mono text-[0.9em]"> tabular-nums</code>. Without
        it every tick would shift the buttons. Used on{" "}
        <Link href="/" className="underline underline-offset-4">the home page</Link>.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * shadowLab — the one shadow in this system, and why level 2 has none.
 * ------------------------------------------------------------------ */

export function ShadowDemo() {
  const [level, setLevel] = useState<"flat" | "hairline" | "floating">("hairline");
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {(["flat", "hairline", "floating"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            aria-pressed={level === l}
            className={cn(
              "text-ui h-9 rounded-lg px-3 capitalize transition-colors",
              level === l
                ? "bg-feature text-feature-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="bg-background grid h-40 place-items-center rounded-xl p-6">
        <div
          className={cn(
            "bg-card grid h-24 w-56 place-items-center rounded-xl",
            level === "flat" && "",
            level === "hairline" && "border",
            level === "floating" && "border shadow-floating",
          )}
        >
          <span className="text-caption text-muted-foreground capitalize">
            {level}
          </span>
        </div>
      </div>
      <p className="text-caption text-muted-foreground">
        On a grey canvas, <strong className="text-foreground">hairline</strong>{" "}
        is enough — the white already separates the surface. Flat disappears;
        floating is reserved for things that genuinely sit above the page.
        There is exactly one shadow token in this project and it lives on
        popover, dropdown, sheet and select.
      </p>
    </div>
  );
}
