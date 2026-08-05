"use client";

import { Bold, Code, Italic, Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * jakubkrehel/skills, vendored here as skills/better-accessibility.
 * hit-areas.md: "The visible element can stay small; the hit area is
 * what must be big." Its Tailwind example grows a 20px control to 44px
 * with a pseudo-element, and its collision rule caps that expansion
 * where two targets would start to overlap. 20px marks on a 24px gap
 * give a 44px pitch, so the areas tile exactly and never collide.
 * ------------------------------------------------------------------ */

const TOOLS = [
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Link2, label: "Link" },
  { icon: Code, label: "Code" },
] as const;

const ROWS = [
  { title: "Target = the icon (20px)", area: "hover:outline" },
  {
    title: "Target expanded to 44px",
    area:
      "after:absolute after:top-1/2 after:left-1/2 after:size-11 " +
      "after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-lg hover:after:outline",
  },
] as const;

export function JakubkrehelSkillsDemo() {
  const [tally, setTally] = useState([
    { hit: 0, miss: 0 },
    { hit: 0, miss: 0 },
  ]);
  const bump = (i: number, key: "hit" | "miss") =>
    setTally((t) => t.map((r, j) => (j === i ? { ...r, [key]: r[key] + 1 } : r)));

  return (
    <div className="space-y-3">
      <p className="text-caption text-muted-foreground">
        Click the four icons in each strip at the speed you normally would.
        Hover to see the target each one actually has.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ROWS.map((row, i) => (
          <div key={row.title} className="bg-card space-y-3 rounded-xl border p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <span className="text-ui-sm">{row.title}</span>
              <span
                className={cn(
                  "text-micro bg-secondary rounded-md px-2 py-1 tabular-nums uppercase",
                  tally[i].miss ? "text-destructive" : "text-positive",
                )}
              >
                {tally[i].hit} hit / {tally[i].miss} lost
              </span>
            </div>
            <div
              role="presentation"
              onClick={() => bump(i, "miss")}
              className="bg-secondary flex h-11 w-fit items-center gap-6 rounded-lg px-3"
            >
              {TOOLS.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  onClick={(e) => {
                    e.stopPropagation();
                    bump(i, "hit");
                  }}
                  className={cn(
                    "text-muted-foreground hover:text-foreground duration-fast ease-out-quart relative grid size-5 place-items-center transition-colors",
                    row.area,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-9"
          onClick={() => setTally([{ hit: 0, miss: 0 }, { hit: 0, miss: 0 }])}
        >
          Reset
        </Button>
        <p className="text-caption text-muted-foreground">
          Same icons, same 20px on screen, same 152px strip. Only the second
          one clears the 24px floor the skill cites from WCAG 2.5.8.
        </p>
      </div>
    </div>
  );
}
