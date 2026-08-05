"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* Typed JSON IR — four edges, one shared target. No Mermaid, no auto-layout. */
const NODES = [
  { id: "api", y: 23 },
  { id: "auth", y: 65 },
  { id: "worker", y: 107 },
  { id: "cron", y: 149 },
] as const;

const TX = 300; // target's left edge
const CY = 104; // target's midpoint
const GAP = 14; // deterministic port spacing
const T = { duration: duration.slow, ease: ease.outQuart };

export function TtA1iArchifyDemo() {
  const [spread, setSpread] = useState(false);
  const [route, setRoute] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button className="h-9" onClick={() => setSpread((s) => !s)}>
          {spread ? "Pile endpoints" : "Spread endpoints"}
        </Button>
        <div className="flex gap-1.5">
          {NODES.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-pressed={route === n.id}
              aria-label={`Trace route ${n.id} to postgres`}
              onClick={() => setRoute((r) => (r === n.id ? null : n.id))}
              className={cn(
                "text-caption h-9 rounded-md px-2 font-mono transition-colors",
                route === n.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {n.id}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border p-3">
        <svg
          viewBox="0 0 440 208"
          preserveAspectRatio="xMidYMid meet"
          className="h-52 w-full"
          role="img"
          aria-label={`Four services writing to one postgres node, endpoints ${spread ? "spread" : "piled"}`}
        >
          {NODES.map((n, i) => {
            const y2 = spread ? CY + (i - 1.5) * GAP : CY;
            const tone = route === n.id ? "text-accent-solid" : route ? "text-border" : "text-border-strong";
            return (
              <g key={n.id} className={tone}>
                <motion.path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  initial={false}
                  animate={{ d: `M112 ${n.y}C196 ${n.y} 216 ${y2} ${TX - 9} ${y2}` }}
                  transition={T}
                />
                <motion.g initial={false} animate={{ y: y2 - CY }} transition={T}>
                  <path d={`M${TX} ${CY}l-9-4.5v9z`} fill="currentColor" />
                </motion.g>
              </g>
            );
          })}
          {NODES.map((n) => (
            <g key={n.id} aria-hidden="true">
              <rect x={8} y={n.y - 17} width={104} height={34} rx={8} className="fill-card stroke-border" />
              <text x={60} y={n.y + 4} textAnchor="middle" className="text-ui-sm fill-foreground font-mono">
                {n.id}
              </text>
            </g>
          ))}
          <g aria-hidden="true">
            <rect x={TX} y={78} width={124} height={52} rx={8} className="fill-feature" />
            <text x={TX + 62} y={CY + 4} textAnchor="middle" className="text-ui-sm fill-feature-foreground font-mono">
              postgres
            </text>
          </g>
        </svg>
      </div>

      <p className={cn("text-caption tabular-nums", spread ? "text-positive" : "text-destructive")}>
        {spread
          ? `layout/endpoint-spread — postgres.in: 4 endpoints, min clearance ${GAP}px — passed`
          : "layout/endpoint-collision — postgres.in: 4 edges share (300, 104), clearance 0px"}
      </p>

      <p className="text-caption text-muted-foreground">
        Archify is not installed here, so this is its layout rule rebuilt by hand:
        edges sharing a target get deterministic ports along that target&rsquo;s
        edge, and the check below reports a rule code with the measured clearance
        instead of a vague warning. The four name buttons apply its{" "}
        <code className="font-mono">#route=&lt;source&gt;~postgres</code> anchor,
        which dims every edge except the one you asked about.
      </p>
    </div>
  );
}
