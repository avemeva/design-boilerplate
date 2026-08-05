"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const EASINGS = [
  ["outQuad", ease.outQuad],
  ["outCubic", ease.outCubic],
  ["outQuart", ease.outQuart],
  ["outExpo", ease.outExpo],
  ["inOutCubic", ease.inOutCubic],
  ["spring", ease.spring],
] as const;

/**
 * Side-by-side easing comparison. Reading bezier values tells you
 * nothing; watching six of them race tells you everything.
 */
export function MotionLab() {
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? "Reset" : "Play"}
        </Button>
        <span className="text-muted-foreground text-xs">
          All six run at {duration.slower * 1000}ms so only the curve differs.
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {EASINGS.map(([name, curve]) => (
          <div key={name} className="grid grid-cols-[7rem_1fr] items-center gap-4">
            <code className="text-muted-foreground font-mono text-xs">
              {name}
            </code>
            {/* The travelling dot is pinned to the right edge of a
                growing track, so the animation stays responsive
                without measuring anything. */}
            <div className="bg-muted/50 h-8 rounded-full p-1">
              <motion.div
                className="relative h-6"
                initial={false}
                animate={{ width: playing ? "100%" : "1.5rem" }}
                transition={{ duration: duration.slower, ease: curve }}
              >
                <div className="bg-primary absolute top-0 right-0 size-6 rounded-full" />
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCALES = [
  { from: 0, label: "0 → 1", wrong: true },
  { from: 0.8, label: "0.8 → 1", wrong: false },
  { from: 0.96, label: "0.96 → 1", wrong: false },
] as const;

/**
 * Why scale animations should not start at zero: the same duration
 * reads as sluggish when the distance travelled is larger.
 */
export function ScaleComparison() {
  const [key, setKey] = useState(0);

  return (
    <div>
      <Button size="sm" onClick={() => setKey((k) => k + 1)}>
        Replay
      </Button>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {SCALES.map(({ from, label, wrong }) => (
          <div key={label} className="space-y-2">
            <div className="bg-muted/40 grid h-28 place-items-center rounded-lg">
              <motion.div
                key={`${key}-${label}`}
                initial={{ opacity: 0, scale: from }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: duration.base, ease: ease.outQuart }}
                className="bg-primary text-primary-foreground grid size-16 place-items-center rounded-lg text-xs"
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
    </div>
  );
}
