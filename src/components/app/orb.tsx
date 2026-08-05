import { cn } from "@/lib/utils";

/**
 * Deterministic gradient orb.
 *
 * DESIGN.md → Colors: "Saturated color that is not the accent may only
 * enter as content." These orbs are that content — workspace marks and
 * avatars are the only place the interface is allowed to be colourful.
 * The chrome around them stays grey.
 *
 * Hue is derived from the string, so the same workspace is always the
 * same colour without anyone storing one. (Same idea as Hashvatar in
 * the resource catalogue — one dependency lighter.)
 */
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SIZE = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-5",
  lg: "size-7",
} as const;

export function Orb({
  seed,
  size = "sm",
  className,
}: {
  seed: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const h = hash(seed);
  const from = h % 360;
  // A near-neighbour, never a clash — the orbs read as one family.
  const to = (from + 40 + (h % 40)) % 360;

  return (
    <span
      aria-hidden
      className={cn("shrink-0 rounded-full", SIZE[size], className)}
      style={{
        backgroundImage: `linear-gradient(140deg, oklch(0.72 0.19 ${from}), oklch(0.62 0.21 ${to}))`,
      }}
    />
  );
}

/** Overlapping avatar stack. Ring matches the surface it sits on. */
export function OrbStack({
  seeds,
  max = 4,
}: {
  seeds: string[];
  max?: number;
}) {
  const shown = seeds.slice(0, max);
  const rest = seeds.length - shown.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((s) => (
          <Orb key={s} seed={s} className="ring-card ring-2" />
        ))}
      </div>
      {rest > 0 && (
        <span className="text-micro text-muted-foreground ml-2 tabular-nums">
          +{rest}
        </span>
      )}
    </div>
  );
}
