import type { ComponentProps, ElementType, ReactNode } from "react";

import { BeforeAfterClient } from "@/components/before-after";
import { cn } from "@/lib/utils";

/**
 * The white panel that content sits on.
 *
 * DESIGN.md → Elevation & Depth: the page is grey, content is white,
 * and the two are separated by a hairline. A resting panel gets **no
 * shadow**. `floating` is level 3 — popovers, dialogs, things that
 * genuinely sit above the page.
 */
export function Panel({
  as: Tag = "div",
  className,
  inset = "lg",
  floating = false,
  ...props
}: {
  as?: ElementType;
  inset?: "none" | "sm" | "md" | "lg";
  floating?: boolean;
} & ComponentProps<"div">) {
  return (
    <Tag
      className={cn(
        "bg-card rounded-xl border",
        { none: "", sm: "p-3", md: "p-4", lg: "p-5 sm:p-6" }[inset],
        floating && "shadow-floating",
        className,
      )}
      {...props}
    />
  );
}

/**
 * One step *toward* the canvas — for containers that hold panels, table
 * headers, and tag pills, so nesting reads as recession rather than
 * another lift.
 */
export function Sunken({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-secondary rounded-2xl border p-3", className)}
      {...props}
    />
  );
}

/** Uppercase 10px label. Sidebar sections, eyebrows, column headers. */
export function Micro({
  className,
  children,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-micro text-muted-foreground uppercase", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/** The tiny metadata pill. Quiet — it is not a button. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="text-micro text-muted-foreground bg-secondary inline-flex items-center rounded-full px-2.5 py-1 uppercase">
      {children}
    </span>
  );
}


/**
 * Frames a deliberately flawed example.
 *
 * A demo that renders a violation without labelling it reads as the
 * site breaking its own rules. If a page shows the wrong way to do
 * something, the frame has to say so.
 */
export function Flawed({
  label = "Deliberately flawed",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-destructive/30 rounded-xl border border-dashed p-3">
      <p className="text-micro text-destructive mb-2 uppercase">{label}</p>
      {children}
    </div>
  );
}


/**
 * One item inside a demo: a rule, a step, a principle.
 *
 * Demos kept turning into walls of prose because every one invented its
 * own layout. This fixes the shape: a short label, the thing you
 * operate, and at most one line of result. There is nowhere to put a
 * paragraph, which is the point.
 */
export function Item({
  label,
  badge,
  result,
  children,
}: {
  label: string;
  badge?: ReactNode;
  /** One line. What just happened, or what to look for. */
  result?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t py-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className="text-ui">{label}</h3>
        {badge}
      </div>
      <div className="mt-3">{children}</div>
      {result && (
        <p className="text-caption text-muted-foreground mt-2.5">{result}</p>
      )}
    </section>
  );
}

/** Side-by-side right/wrong. The most common shape a demo needs. */
export function Compare({
  rightLabel,
  wrongLabel,
  right,
  wrong,
}: {
  rightLabel: string;
  wrongLabel: string;
  right: ReactNode;
  wrong: ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="text-micro text-positive mb-1.5 uppercase">{rightLabel}</p>
        <div className="bg-secondary rounded-lg p-3">{right}</div>
      </div>
      <div>
        <p className="text-micro text-destructive mb-1.5 uppercase">{wrongLabel}</p>
        <div className="bg-secondary rounded-lg p-3">{wrong}</div>
      </div>
    </div>
  );
}

/** Row of filter or section buttons. Keeps every demo's tabs identical. */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={cn(
            "text-ui-sm h-9 rounded-lg px-3 transition-colors",
            value === o.id
              ? "bg-feature text-feature-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className="ml-1.5 tabular-nums opacity-60">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}




/**
 * Before and after, the way a designer shows work.
 *
 * One switch. The same piece of interface flips between the old version
 * and the new one, in place, so the improvement is felt rather than
 * explained. There is no room here for a rule, an objective or a
 * technique, because a user does not care about any of those — they
 * care that it got better.
 */
export function BeforeAfter({
  principle,
  before,
  after,
}: {
  /**
   * One or two plain sentences: what we were trying to achieve, and
   * what the source taught. Written for someone with no background.
   * Never the technique, never a property name.
   */
  principle: string;
  before: ReactNode;
  after: ReactNode;
}) {
  return (
    <BeforeAfterClient principle={principle} before={before} after={after} />
  );
}
