"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The switch that flips one piece of interface between its old and new
 * version, in the same spot.
 *
 * Side by side does not work: the eye compares layouts instead of
 * feeling the change. Flipping in place is what makes "oh, that is
 * better" land.
 */
export function BeforeAfterClient({
  principle,
  before,
  after,
}: {
  principle?: string;
  before: ReactNode;
  after: ReactNode;
}) {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <section className="border-t py-6 first:border-t-0 first:pt-0">
      {/* What we were trying to achieve, before you see the switch.
          One or two plain sentences — never the technique. */}
      {principle && (
        <p className="text-ui mb-3 max-w-prose-comfortable text-pretty">
          {principle}
        </p>
      )}

      <div className="bg-secondary inline-flex rounded-full p-0.5">
        {([
          ["Before", false],
          ["After", true],
        ] as const).map(([label, v]) => (
          <button
            key={label}
            type="button"
            onClick={() => setShowAfter(v)}
            aria-pressed={showAfter === v}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart h-9 rounded-full px-4 transition-colors",
              showAfter === v
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card mt-3 rounded-xl border p-5">
        {showAfter ? after : before}
      </div>
    </section>
  );
}
