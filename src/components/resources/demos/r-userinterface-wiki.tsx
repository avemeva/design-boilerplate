"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/* userinterface.wiki, rule `visual-concentric-radius`: inner radius =
 * outer radius − padding. The outer card is always rounded-xl (14px);
 * only the padding and the inner radius change. */

const PADS = [
  { px: 4, box: "p-1", token: "rounded-lg", innerPx: 10 },
  { px: 6, box: "p-1.5", token: "rounded-md", innerPx: 8 },
] as const;

export function UserinterfaceWikiDemo() {
  const [i, setI] = useState(0);
  const pad = PADS[i];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {PADS.map((p, index) => (
            <button
              key={p.px}
              type="button"
              onClick={() => setI(index)}
              aria-pressed={i === index}
              className={cn(
                "text-ui h-9 rounded-lg px-3 tabular-nums transition-colors",
                i === index
                  ? "bg-feature text-feature-foreground"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {p.px}px padding
            </button>
          ))}
        </div>
        <span className="text-caption text-muted-foreground tabular-nums">
          14 − {pad.px} = {pad.innerPx}px
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "inner 14px — matched to outer", cls: "rounded-xl", wrong: true },
          { label: `inner ${pad.innerPx}px — ${pad.token}`, cls: pad.token, wrong: false },
        ].map((v) => (
          <div key={v.label} className="space-y-2">
            <div className={cn("bg-card rounded-xl border", pad.box)}>
              <div
                className={cn(
                  "bg-feature text-feature-foreground text-caption duration-fast ease-out-quart grid h-24 place-items-center transition-[color,background-color,border-color,box-shadow,opacity,transform]",
                  v.cls,
                )}
              >
                nested surface
              </div>
            </div>
            <p className={cn("text-caption tabular-nums", v.wrong ? "text-destructive" : "text-muted-foreground")}>
              {v.label}
            </p>
          </div>
        ))}
      </div>

      <p className="text-caption text-muted-foreground">
        Matching the radii leaves a wedge of card visible at each corner: the
        two arcs are no longer concentric. Subtracting the padding keeps the
        gap even the whole way round. The repo&rsquo;s radius scale — 6 / 8 /
        10 / 14 / 20 — is spaced so the subtraction lands on a token rather
        than an arbitrary value.
      </p>
    </div>
  );
}
