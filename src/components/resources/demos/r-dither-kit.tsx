"use client";

import { AnimatePresence, motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { cn } from "@/lib/utils";

/* ==================================================================== *
 * dither-kit — https://tripwire.sh/dither-kit
 *
 * The registry writes to `components/dither-kit/`, so nothing here can
 * import it. Every switch below is a port of the matching source file,
 * read out of the registry payloads (core 20 files, area-chart 4,
 * bar-chart 3, pie-chart 3, radar-chart 4, avatar/button/gradient).
 *
 * The `before` side of each switch is the same port with exactly one
 * decision taken back out — the chart you get if you ship the obvious
 * thing.
 *
 * One deliberate departure: the kit hardcodes seven RGB seeds and this
 * site is token-only, so every fill paints with a token colour read off
 * the canvas and modulates `globalAlpha` — which is exactly the
 * substitution the engine's own rule asks for (two alpha tiers of one
 * colour, never a second shade).
 * ==================================================================== */

/* ── dither-paint.ts / pixel.ts ────────────────────────────────────── */

const RAW_BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const BAYER = RAW_BAYER.map((row) => row.map((v) => (v + 0.5) / 16));

const CELL = 2;
const MAX_COLS = 520;
const MAX_ROWS = 240;
const BORDER_ALPHA = 0.72;
const OFF_TIER = 0.4;
const STAGGER = 0.55;
const POP = 5;
const TOP_ANGLE = -Math.PI / 2;
const TAU = Math.PI * 2;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

type Variant = "gradient" | "dotted" | "hatched" | "solid";

type ColumnOpts = {
  variant: Variant;
  intensity: number;
  dim: number;
  stacked: boolean;
  sparse?: number;
  border?: boolean;
};

/** paintColumn, from core/dither-paint.ts. */
function paintColumn(
  o: CanvasRenderingContext2D,
  x: number,
  top: number,
  floor: number,
  { variant, intensity, dim, stacked, sparse = 0, border = true }: ColumnOpts,
) {
  const t = Math.round(top);
  const f = Math.round(floor);
  const depth = f - t;
  if (depth <= 0) {
    o.globalAlpha = BORDER_ALPHA * dim;
    o.fillRect(x, t, 1, 1);
    return;
  }
  const bias = (variant === "dotted" ? 0.12 : 0) + (stacked ? 0.2 : 0) - sparse;
  for (let y = t; y < f; y++) {
    // 0 at the value line, 1 at the floor — weight at the base, dissolve
    // at the top.
    let density = (y - t) / depth;
    if (stacked) density = 0.5 + 0.5 * density;
    if (variant === "hatched" && ((x + y) & 3) >= 2) continue;
    const lit =
      variant === "solid" ||
      density > BAYER[y & 3][x & 3] - 0.1 * intensity - bias;
    if (variant === "dotted" && !lit) continue;
    const k = (0.3 + density * 0.7) * (1 + 0.22 * intensity);
    o.globalAlpha = clamp01((lit ? k : k * OFF_TIER) * dim);
    o.fillRect(x, y, 1, 1);
  }
  if (!border) return;
  o.globalAlpha = BORDER_ALPHA * dim;
  o.fillRect(x, t, 1, 1);
  if (depth > 1) {
    o.globalAlpha = BORDER_ALPHA * 0.5 * dim;
    o.fillRect(x, t + 1, 1, 1);
  }
}

/** The plain translucent area fill every chart library ships. */
function paintSlab(
  o: CanvasRenderingContext2D,
  x: number,
  top: number,
  floor: number,
  dim = 1,
) {
  const t = Math.round(top);
  const f = Math.round(floor);
  o.globalAlpha = 0.24 * dim;
  o.fillRect(x, Math.min(t, f), 1, Math.max(1, Math.abs(f - t)));
  o.globalAlpha = 0.95 * dim;
  o.fillRect(x, t, 1, 1);
}

/** Linear resample to `cols` columns. */
function resample(src: number[], cols: number): number[] {
  const out = new Array<number>(cols);
  const last = Math.max(src.length - 1, 1);
  for (let c = 0; c < cols; c++) {
    const t = (c / Math.max(cols - 1, 1)) * last;
    const i = Math.floor(t);
    const f = t - i;
    const a = src[i] ?? 0;
    const b = src[Math.min(i + 1, src.length - 1)] ?? a;
    out[c] = a + (b - a) * f;
  }
  return out;
}

/** Nearest-neighbour — what resample() deliberately is not. */
function resampleStep(src: number[], cols: number): number[] {
  const last = Math.max(src.length - 1, 1);
  return Array.from(
    { length: cols },
    (_, c) => src[Math.round((c / Math.max(cols - 1, 1)) * last)] ?? 0,
  );
}

/* ── scales.ts ─────────────────────────────────────────────────────── */

/** d3's tick step, so `.nice()` and `.ticks(n)` agree. */
function tickStep(span: number, count: number) {
  const step0 = Math.abs(span) / Math.max(count, 1) || 1;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const err = step0 / mag;
  return mag * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
}

/** buildYScale: the domain always includes zero, then `.nice()`. */
function niceScale(min: number, max: number) {
  const lo0 = Math.min(0, min);
  const hi0 = Math.max(0, max);
  const step = tickStep((hi0 === lo0 ? 1 : hi0 - lo0) || 1, 4);
  const lo = Math.floor(lo0 / step) * step;
  const hi = Math.ceil((hi0 === lo0 ? lo0 + 1 : hi0) / step) * step;
  const s = tickStep(hi - lo, 4);
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / s) * s; v <= hi + 1e-9; v += s)
    ticks.push(Number(v.toPrecision(12)));
  return { lo, hi, ticks };
}

/** The scale you get without the zero floor and without `.nice()`. */
function rawScale(min: number, max: number) {
  const ticks = Array.from({ length: 5 }, (_, i) =>
    Math.round(min + ((max - min) * i) / 4),
  );
  return { lo: min, hi: max, ticks };
}

/** scaleBand with the kit's paddingInner .28 / paddingOuter .18. */
function band(n: number, inner = 0.28, outer = 0.18) {
  const step = 1 / Math.max(1, n - inner + outer * 2);
  const width = step * (1 - inner);
  const start = (1 - step * (n - inner)) / 2;
  return { x: (i: number) => start + step * i, width };
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

function pieSlices(values: number[]) {
  const total = sum(values) || 1;
  let a = TOP_ANGLE;
  return values.map((v) => {
    const span = (v / total) * TAU;
    const s = { value: v, start: a, end: a + span };
    a += span;
    return s;
  });
}

function pointInPolygon(px: number, py: number, poly: number[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i];
    const yi = poly[i + 1];
    const xj = poly[j];
    const yj = poly[j + 1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function strokePoly(
  o: CanvasRenderingContext2D,
  poly: number[],
  alpha: number,
) {
  o.globalAlpha = alpha;
  for (let i = 0; i < poly.length; i += 2) {
    const j = (i + 2) % poly.length;
    const x0 = poly[i];
    const y0 = poly[i + 1];
    const dx = poly[j] - x0;
    const dy = poly[j + 1] - y0;
    const steps = Math.max(2, Math.ceil(Math.hypot(dx, dy)));
    for (let s = 0; s <= steps; s++)
      o.fillRect(
        Math.round(x0 + (dx * s) / steps),
        Math.round(y0 + (dy * s) / steps),
        1,
        1,
      );
  }
}

/* ── avatar/pixel.ts ───────────────────────────────────────────────── */

function fnv1a(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function xorshift32(seed: number) {
  let s = seed || 0x9e3779b9;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x100000000;
  };
}

/* ── demo data ─────────────────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DESKTOP = [186, 240, 205, 173, 209, 264, 232, 278, 241, 305, 289, 341];
const MOBILE = [80, 100, 120, 90, 130, 140, 110, 160, 150, 180, 170, 210];
const TABLET = [45, 60, 52, 71, 66, 84, 78, 92, 88, 101, 96, 120];

const Q = MONTHS.slice(0, 6);
const QD = DESKTOP.slice(0, 6);
const QM = MOBILE.slice(0, 6);

const TONE = ["text-chart-1", "text-chart-3", "text-chart-5"];
const ALL_TONES = TONE.join("|");
const FIVE_TONES = [
  "text-chart-1",
  "text-chart-2",
  "text-chart-3",
  "text-chart-4",
  "text-chart-5",
].join("|");

/* ── canvas host ───────────────────────────────────────────────────── */

type PaintArgs = {
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  ink: string[];
  t: number;
};

function readInk(host: HTMLElement, tones: string) {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden";
  host.appendChild(probe);
  const out = tones.split("|").map((c) => {
    probe.className = c;
    return getComputedStyle(probe).color;
  });
  probe.remove();
  return out;
}

const reduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A low-res backing canvas stretched up `pixelated`. Repaints when
 * `redraw` changes, on resize, and on a theme flip — the ink is read off
 * a token, so the class swap has to re-measure.
 */
function Pixels({
  paint,
  redraw = 0,
  tones = TONE[0],
  cell = CELL,
  duration = 0,
  className,
  label,
  children,
  ...rest
}: {
  paint: (a: PaintArgs) => void;
  redraw?: string | number;
  tones?: string;
  cell?: number;
  duration?: number;
  className?: string;
  label: string;
  children?: React.ReactNode;
} & Pick<
  React.ComponentProps<"div">,
  "onPointerMove" | "onPointerLeave" | "onPointerDown"
>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef(paint);
  paintRef.current = paint;

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = cvRef.current;
    const ctx = cv?.getContext("2d");
    if (!wrap || !cv || !ctx) return;

    let raf = 0;
    let start = 0;
    let cols = 8;
    let rows = 8;
    let ink: string[] = [];
    const dur = reduced() ? 0 : duration;

    const measure = () => {
      const box = wrap.getBoundingClientRect();
      cols = Math.min(MAX_COLS, Math.max(8, Math.round(box.width / cell)));
      rows = Math.min(MAX_ROWS, Math.max(8, Math.round(box.height / cell)));
      cv.width = cols;
      cv.height = rows;
      ink = readInk(wrap, tones);
    };

    const frame = (now: number) => {
      if (!start) start = now;
      const t = dur > 0 ? clamp01((now - start) / dur) : 1;
      ctx.clearRect(0, 0, cols, rows);
      ctx.globalAlpha = 1;
      paintRef.current({ ctx, cols, rows, ink, t });
      ctx.globalAlpha = 1;
      if (dur > 0 && t < 1) raf = requestAnimationFrame(frame);
    };

    const restart = () => {
      measure();
      start = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    };

    restart();
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(restart);
    ro?.observe(wrap);
    const mo = new MutationObserver(restart);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      mo.disconnect();
    };
  }, [redraw, tones, cell, duration]);

  return (
    <div ref={wrapRef} className={cn("relative", className)} {...rest}>
      <canvas
        ref={cvRef}
        role="img"
        aria-label={label}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
      {children}
    </div>
  );
}

/* ── product chrome shared by every switch ─────────────────────────── */

function Head({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <p className="text-ui">{title}</p>
        {meta && <p className="text-caption text-muted-foreground">{meta}</p>}
      </div>
      {children}
    </div>
  );
}

function Axis({
  ticks,
  lo,
  hi,
  children,
  height = "h-40",
}: {
  ticks: number[];
  lo: number;
  hi: number;
  children: React.ReactNode;
  height?: string;
}) {
  return (
    <div className="flex">
      <div className={cn("relative w-10 shrink-0", height)}>
        {ticks.map((v) => (
          <span
            key={v}
            className="text-micro text-muted-foreground absolute right-2 -translate-y-1/2 tabular-nums"
            style={{ top: `${(1 - (v - lo) / (hi - lo || 1)) * 100}%` }}
          >
            {v}
          </span>
        ))}
      </div>
      <div className={cn("relative min-w-0 flex-1", height)}>{children}</div>
    </div>
  );
}

function XLabels({ labels }: { labels: string[] }) {
  return (
    <div className="text-micro text-muted-foreground ml-10 mt-1.5 flex justify-between">
      {labels.map((m) => (
        <span key={m}>{m}</span>
      ))}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-caption text-muted-foreground tabular-nums">
      {label} <span className="text-foreground">{value}</span>
    </p>
  );
}

function Quiet({
  children,
  onClick,
  pressed,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={cn(
        "text-ui-sm duration-fast flex h-9 items-center gap-1.5 rounded-lg border px-3 transition-colors",
        pressed
          ? "bg-feature text-feature-foreground border-transparent"
          : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Pointer x → nearest data index, for point-spaced (area/line) plots. */
function usePoint(n: number) {
  const [i, setI] = useState<number | null>(null);
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const t = clamp01((e.clientX - b.left) / (b.width || 1));
    setI(Math.round(t * (n - 1)));
  };
  return [i, { onPointerMove, onPointerLeave: () => setI(null) }] as const;
}

/** Pointer x → band index, for bar plots. */
function useBand(n: number) {
  const [i, setI] = useState<number | null>(null);
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const t = Math.max(0, Math.min(0.999, (e.clientX - b.left) / (b.width || 1)));
    setI(Math.min(n - 1, Math.floor(t * n)));
  };
  return [i, { onPointerMove, onPointerLeave: () => setI(null) }] as const;
}

/* ================================================================== *
 * 1 — the area fill itself
 * ================================================================== */

function FillPair({ after }: { after: boolean }) {
  const [i, handlers] = usePoint(12);
  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      ctx.fillStyle = ink[0];
      const tops = resample(
        DESKTOP.map((v) => (1 - v / 360) * (rows - 2)),
        cols,
      );
      for (let x = 0; x < cols; x++) {
        if (after)
          paintColumn(ctx, x, tops[x], rows - 1, {
            variant: "gradient",
            intensity: 0,
            dim: 1,
            stacked: false,
          });
        else paintSlab(ctx, x, tops[x], rows - 1);
      }
    },
    [after],
  );
  const shown = i ?? 11;
  return (
    <div>
      <Head title="Visitors" meta="Last 12 months">
        <Readout label={MONTHS[shown]} value={DESKTOP[shown].toLocaleString()} />
      </Head>
      <Axis ticks={[0, 100, 200, 300]} lo={0} hi={360}>
        <Pixels
          paint={paint}
          redraw={after ? "after" : "before"}
          className="h-full w-full"
          label="Monthly visitors as an area chart"
          {...handlers}
        >
          {i !== null && (
            <span
              className="bg-border-strong pointer-events-none absolute inset-y-0 w-px"
              style={{ left: `${(i / 11) * 100}%` }}
            />
          )}
        </Pixels>
      </Axis>
      <XLabels labels={MONTHS} />
    </div>
  );
}

/* ================================================================== *
 * 2 — three series on top of each other
 * ================================================================== */

function LayersPair({ after }: { after: boolean }) {
  const [i, handlers] = usePoint(12);
  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      const variants: Variant[] = ["gradient", "hatched", "dotted"];
      [DESKTOP, MOBILE, TABLET].forEach((series, si) => {
        ctx.fillStyle = ink[si];
        const tops = resample(
          series.map((v) => (1 - v / 360) * (rows - 2)),
          cols,
        );
        for (let x = 0; x < cols; x++) {
          if (after)
            paintColumn(ctx, x, tops[x], rows - 1, {
              variant: variants[si],
              intensity: 0,
              dim: 1,
              stacked: false,
              sparse: si * 0.14,
            });
          else paintSlab(ctx, x, tops[x], rows - 1, 0.9);
        }
      });
    },
    [after],
  );
  const shown = i ?? 9;
  return (
    <div>
      <Head title="Visitors by device" meta="Last 12 months">
        <Readout
          label={MONTHS[shown]}
          value={`${DESKTOP[shown]} · ${MOBILE[shown]} · ${TABLET[shown]}`}
        />
      </Head>
      <Axis ticks={[0, 100, 200, 300]} lo={0} hi={360}>
        <Pixels
          paint={paint}
          redraw={after ? "after" : "before"}
          tones={ALL_TONES}
          className="h-full w-full"
          label="Desktop, mobile and tablet visitors overlaid"
          {...handlers}
        >
          {i !== null && (
            <span
              className="bg-border-strong pointer-events-none absolute inset-y-0 w-px"
              style={{ left: `${(i / 11) * 100}%` }}
            />
          )}
        </Pixels>
      </Axis>
      <XLabels labels={MONTHS} />
      <div className="text-caption text-muted-foreground mt-2 flex flex-wrap gap-x-4">
        {["Desktop", "Mobile", "Tablet"].map((l, si) => (
          <span key={l} className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-xs",
                ["bg-chart-1", "bg-chart-3", "bg-chart-5"][si],
              )}
              aria-hidden
            />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== *
 * 3 — the line between the points
 * ================================================================== */

function StepPair({ after }: { after: boolean }) {
  const [i, handlers] = usePoint(12);
  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      ctx.fillStyle = ink[0];
      const glow = Math.max(6, Math.round(rows * 0.16));
      const src = DESKTOP.map((v) => (1 - v / 360) * (rows - 2));
      const fn = after ? resample : resampleStep;
      const tops = fn(src, cols);
      for (let x = 0; x < cols; x++)
        paintColumn(ctx, x, tops[x], Math.min(rows - 1, tops[x] + glow), {
          variant: "gradient",
          intensity: 0,
          dim: 1,
          stacked: false,
        });
    },
    [after],
  );
  const shown = i ?? 5;
  return (
    <div>
      <Head title="Response time" meta="p95, ms">
        <Readout label={MONTHS[shown]} value={`${DESKTOP[shown]} ms`} />
      </Head>
      <Axis ticks={[0, 100, 200, 300]} lo={0} hi={360}>
        <Pixels
          paint={paint}
          redraw={after ? "after" : "before"}
          className="h-full w-full"
          label="Response time as a line chart"
          {...handlers}
        >
          {i !== null && (
            <span
              className="bg-border-strong pointer-events-none absolute inset-y-0 w-px"
              style={{ left: `${(i / 11) * 100}%` }}
            />
          )}
        </Pixels>
      </Axis>
      <XLabels labels={MONTHS} />
    </div>
  );
}

/* ================================================================== *
 * 4 — where the bars start
 * ================================================================== */

function ScalePair({ after }: { after: boolean }) {
  const [i, handlers] = useBand(6);
  const scale = after
    ? niceScale(0, Math.max(...QD))
    : rawScale(Math.min(...QD), Math.max(...QD));
  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      ctx.fillStyle = ink[0];
      const b = band(6);
      const y = (v: number) =>
        (1 - (v - scale.lo) / (scale.hi - scale.lo || 1)) * (rows - 1);
      QD.forEach((v, idx) => {
        const c0 = Math.round(b.x(idx) * cols);
        const c1 = Math.round((b.x(idx) + b.width) * cols);
        for (let x = c0; x < c1; x++)
          paintColumn(ctx, x, y(v), rows - 1, {
            variant: "gradient",
            intensity: 0,
            dim: 1,
            stacked: false,
          });
      });
    },
    [scale.lo, scale.hi],
  );
  const shown = i ?? 3;
  return (
    <div>
      <Head title="Sign-ups" meta="First half">
        <Readout label={Q[shown]} value={QD[shown].toLocaleString()} />
      </Head>
      <Axis ticks={scale.ticks} lo={scale.lo} hi={scale.hi}>
        <Pixels
          paint={paint}
          redraw={`${scale.lo}-${scale.hi}`}
          className="h-full w-full"
          label="Monthly sign-ups as a bar chart"
          {...handlers}
        />
      </Axis>
      <XLabels labels={Q} />
    </div>
  );
}

/* ================================================================== *
 * 5 — how the bars arrive
 * ================================================================== */

function GrowPair({ after }: { after: boolean }) {
  const [token, setToken] = useState(0);
  const paint = useCallback(({ ctx, cols, rows, ink, t }: PaintArgs) => {
    ctx.fillStyle = ink[0];
    const b = band(6);
    const y = (v: number) => (1 - v / 300) * (rows - 1);
    QD.forEach((v, idx) => {
      const p = easeOutCubic(
        clamp01((t - (idx / 5) * STAGGER) / (1 - STAGGER)),
      );
      const grown = rows - 1 + (y(v) - (rows - 1)) * p;
      const c0 = Math.round(b.x(idx) * cols);
      const c1 = Math.round((b.x(idx) + b.width) * cols);
      for (let x = c0; x < c1; x++)
        paintColumn(ctx, x, grown, rows - 1, {
          variant: "gradient",
          intensity: 0,
          dim: 1,
          stacked: false,
        });
    });
  }, []);
  return (
    <div>
      <Head title="Sign-ups" meta="First half">
        <Quiet onClick={() => setToken((v) => v + 1)}>
          <RotateCcw className="size-3.5" aria-hidden />
          Play again
        </Quiet>
      </Head>
      <Axis ticks={[0, 100, 200, 300]} lo={0} hi={300}>
        <Pixels
          paint={paint}
          redraw={token}
          duration={after ? 1000 : 0}
          className="h-full w-full"
          label="Monthly sign-ups as a bar chart"
        />
      </Axis>
      <XLabels labels={Q} />
    </div>
  );
}

/* ================================================================== *
 * 6 — the bar you are pointing at
 * ================================================================== */

function FocusPair({ after }: { after: boolean }) {
  const [i, handlers] = useBand(6);
  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      ctx.fillStyle = ink[0];
      const b = band(6);
      const y = (v: number) => (1 - v / 300) * (rows - 1);
      QD.forEach((v, idx) => {
        const active = after && i === idx;
        const dim = after && i !== null && i !== idx ? 0.5 : 1;
        const c0 = Math.round(b.x(idx) * cols);
        const c1 = Math.round((b.x(idx) + b.width) * cols);
        for (let x = c0; x < c1; x++)
          paintColumn(ctx, x, y(v), rows - 1, {
            variant: "gradient",
            intensity: active ? 1 : 0,
            dim,
            stacked: false,
          });
      });
    },
    [after, i],
  );
  return (
    <div>
      <Head title="Sign-ups" meta="First half">
        <Readout
          label={i === null ? "Point at a bar" : Q[i]}
          value={i === null ? "" : QD[i].toLocaleString()}
        />
      </Head>
      <Axis ticks={[0, 100, 200, 300]} lo={0} hi={300}>
        <Pixels
          paint={paint}
          redraw={`${after}-${i}`}
          className="h-full w-full"
          label="Monthly sign-ups as a bar chart"
          {...handlers}
        />
      </Axis>
      <XLabels labels={Q} />
    </div>
  );
}

/* ================================================================== *
 * 7 — bars piled on top of each other
 * ================================================================== */

function StackPair({ after }: { after: boolean }) {
  const [i, handlers] = useBand(6);
  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      const b = band(6);
      const hi = 460;
      const y = (v: number) => (1 - v / hi) * (rows - 1);
      [QD, QM].forEach((series, si) => {
        ctx.fillStyle = ink[si === 0 ? 0 : 1];
        series.forEach((v, idx) => {
          const base = si === 0 ? 0 : QD[idx];
          const c0 = Math.round(b.x(idx) * cols);
          const c1 = Math.round((b.x(idx) + b.width) * cols);
          for (let x = c0; x < c1; x++)
            paintColumn(ctx, x, y(base + v), y(base), {
              variant: "gradient",
              intensity: 0,
              dim: 1,
              stacked: si > 0 && after,
            });
        });
      });
    },
    [after],
  );
  const shown = i ?? 5;
  return (
    <div>
      <Head title="Sign-ups by device" meta="Stacked">
        <Readout
          label={Q[shown]}
          value={`${QD[shown]} + ${QM[shown]} = ${QD[shown] + QM[shown]}`}
        />
      </Head>
      <Axis ticks={[0, 200, 400]} lo={0} hi={460}>
        <Pixels
          paint={paint}
          redraw={after ? "after" : "before"}
          tones={ALL_TONES}
          className="h-full w-full"
          label="Desktop and mobile sign-ups stacked"
          {...handlers}
        />
      </Axis>
      <XLabels labels={Q} />
    </div>
  );
}

/* ================================================================== *
 * 8 — the reading that follows your pointer
 * ================================================================== */

function TooltipPair({ after }: { after: boolean }) {
  const [i, setI] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const t = clamp01((e.clientX - b.left) / (b.width || 1));
    setI(Math.round(t * 11));
    setPos({ x: t * 100, y: clamp01((e.clientY - b.top) / (b.height || 1)) * 100 });
  };

  const paint = useCallback(({ ctx, cols, rows, ink }: PaintArgs) => {
    ctx.fillStyle = ink[0];
    const tops = resample(
      DESKTOP.map((v) => (1 - v / 360) * (rows - 2)),
      cols,
    );
    for (let x = 0; x < cols; x++)
      paintColumn(ctx, x, tops[x], rows - 1, {
        variant: "gradient",
        intensity: 0,
        dim: 1,
        stacked: false,
      });
  }, []);

  const anchorX = i === null ? 0 : (i / 11) * 100;
  const anchorY = i === null ? 0 : (1 - DESKTOP[i] / 360) * 100;

  return (
    <div>
      <Head title="Visitors" meta="Last 12 months" />
      <Axis ticks={[0, 100, 200, 300]} lo={0} hi={360}>
        <Pixels
          paint={paint}
          className="h-full w-full"
          label="Monthly visitors as an area chart"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setI(null)}
        >
          {after && i !== null && (
            <>
              <span
                className="bg-border-strong pointer-events-none absolute inset-y-0 w-px"
                style={{ left: `${anchorX}%` }}
              />
              <span
                className="bg-foreground ring-card pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
                style={{ left: `${anchorX}%`, top: `${anchorY}%` }}
              />
            </>
          )}
          <AnimatePresence>
            {i !== null && (
              <motion.div
                key="tip"
                initial={{
                  opacity: 0,
                  left: `${after ? anchorX : pos.x}%`,
                  top: `${after ? anchorY : pos.y}%`,
                }}
                animate={{
                  opacity: 1,
                  left: `${after ? anchorX : pos.x}%`,
                  top: `${after ? anchorY : pos.y}%`,
                }}
                exit={{ opacity: 0 }}
                transition={
                  after
                    ? { type: "spring", stiffness: 520, damping: 38, mass: 0.6 }
                    : { duration: 0 }
                }
                className="bg-popover text-popover-foreground pointer-events-none absolute z-10 -mt-2 -translate-x-1/2 -translate-y-full rounded-md border px-2 py-1 shadow-xs"
              >
                <p className="text-micro text-muted-foreground">{MONTHS[i]}</p>
                <p className="text-caption tabular-nums">
                  {DESKTOP[i].toLocaleString()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Pixels>
      </Axis>
      <XLabels labels={MONTHS} />
    </div>
  );
}

/* ================================================================== *
 * 9 — the legend
 * ================================================================== */

const NAMES = ["Desktop", "Mobile", "Tablet"];
const SWATCH = ["bg-chart-1", "bg-chart-3", "bg-chart-5"];

function LegendPair({ after }: { after: boolean }) {
  const [sel, setSel] = useState<number | null>(null);
  const [i, handlers] = usePoint(12);
  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      const variants: Variant[] = ["gradient", "hatched", "dotted"];
      [DESKTOP, MOBILE, TABLET].forEach((series, si) => {
        ctx.fillStyle = ink[si];
        const tops = resample(
          series.map((v) => (1 - v / 360) * (rows - 2)),
          cols,
        );
        const dim = sel !== null && sel !== si ? 0.25 : 1;
        for (let x = 0; x < cols; x++)
          paintColumn(ctx, x, tops[x], rows - 1, {
            variant: variants[si],
            intensity: 0,
            dim,
            stacked: false,
            sparse: si * 0.14,
          });
      });
    },
    [sel],
  );
  const shown = i ?? 9;
  return (
    <div>
      <Head title="Visitors by device" meta="Last 12 months">
        <Readout
          label={MONTHS[shown]}
          value={`${DESKTOP[shown]} · ${MOBILE[shown]} · ${TABLET[shown]}`}
        />
      </Head>
      <Axis ticks={[0, 100, 200, 300]} lo={0} hi={360}>
        <Pixels
          paint={paint}
          redraw={`${after}-${sel}`}
          tones={ALL_TONES}
          className="h-full w-full"
          label="Desktop, mobile and tablet visitors overlaid"
          {...handlers}
        />
      </Axis>
      <XLabels labels={MONTHS} />
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {NAMES.map((l, si) =>
          after ? (
            <button
              key={l}
              type="button"
              onClick={() => setSel(sel === si ? null : si)}
              aria-pressed={sel === si}
              className={cn(
                "text-caption duration-fast flex h-9 items-center gap-1.5 rounded-lg px-2 transition-colors",
                sel === si
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground",
                sel !== null && sel !== si && "opacity-50",
              )}
            >
              <span className={cn("size-2 rounded-xs", SWATCH[si])} aria-hidden />
              {l}
            </button>
          ) : (
            <span
              key={l}
              className="text-caption text-muted-foreground flex h-9 items-center gap-1.5 px-2"
            >
              <span className={cn("size-2 rounded-xs", SWATCH[si])} aria-hidden />
              {l}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/* ================================================================== *
 * 10 — the pie
 * ================================================================== */

const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Other"];
const SHARE = [275, 200, 187, 173, 90];

function PiePair({ after }: { after: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const slices = useMemo(() => pieSlices(SHARE), []);
  const total = sum(SHARE);

  const hit = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const cx = b.width / 2;
    const cy = b.height / 2;
    const dx = e.clientX - b.left - cx;
    const dy = e.clientY - b.top - cy;
    const r = Math.hypot(dx, dy);
    const R = Math.min(cx, cy);
    if (r > R || r < R * 0.5) return setHover(null);
    let a = Math.atan2(dy, dx);
    while (a < TOP_ANGLE) a += TAU;
    while (a >= TOP_ANGLE + TAU) a -= TAU;
    const idx = slices.findIndex((s) => a >= s.start && a < s.end);
    setHover(idx < 0 ? null : idx);
  };

  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      const cx = cols / 2;
      const cy = rows / 2;
      const R = Math.min(cx, cy) - 1;
      const rIn = R * 0.5;
      const variants: Variant[] = ["gradient", "dotted", "hatched", "gradient", "dotted"];
      slices.forEach((s, si) => {
        const variant = variants[si % variants.length];
        const lifted = after && hover === si;
        const dim =
          sel !== null && sel !== si
            ? 0.35
            : after && hover !== null && hover !== si
              ? 0.6
              : 1;
        const mid = (s.start + s.end) / 2;
        const ox = lifted ? Math.cos(mid) * POP : 0;
        const oy = lifted ? Math.sin(mid) * POP : 0;
        ctx.fillStyle = ink[si % ink.length];
        for (let y = 0; y < rows; y++)
          for (let x = 0; x < cols; x++) {
            const dx = x + 0.5 - cx - ox;
            const dy = y + 0.5 - cy - oy;
            const r = Math.hypot(dx, dy);
            if (r < rIn || r > R) continue;
            let a = Math.atan2(dy, dx);
            while (a < TOP_ANGLE) a += TAU;
            while (a >= TOP_ANGLE + TAU) a -= TAU;
            if (a < s.start || a >= s.end) continue;
            const d = 1 - (r - rIn) / (R - rIn || 1);
            if (!after) {
              ctx.globalAlpha = 0.62 * dim;
              ctx.fillRect(x, y, 1, 1);
              continue;
            }
            if (variant === "hatched" && ((x + y) & 3) >= 2) continue;
            const lit =
              d >
              BAYER[y & 3][x & 3] -
                (lifted ? 0.1 : 0) -
                (variant === "dotted" ? 0.12 : 0);
            if (variant === "dotted" && !lit) continue;
            const k = (0.3 + d * 0.7) * (lifted ? 1.22 : 1);
            ctx.globalAlpha = clamp01((lit ? k : k * OFF_TIER) * dim);
            ctx.fillRect(x, y, 1, 1);
          }
        // crisp outer arc, the polar cousin of the column outline
        ctx.globalAlpha = BORDER_ALPHA * dim;
        for (let a = s.start; a < s.end; a += 0.006)
          ctx.fillRect(
            Math.round(cx + ox + Math.cos(a) * (R - 0.5)),
            Math.round(cy + oy + Math.sin(a) * (R - 0.5)),
            1,
            1,
          );
      });
    },
    [after, hover, sel, slices],
  );

  const shown = hover ?? sel;
  return (
    <div>
      <Head title="Browsers" meta="This week">
        <Readout
          label={shown === null ? "Point at a slice" : BROWSERS[shown]}
          value={
            shown === null
              ? ""
              : `${SHARE[shown]} · ${Math.round((SHARE[shown] / total) * 100)}%`
          }
        />
      </Head>
      <div className="flex flex-wrap items-center gap-5">
        <Pixels
          paint={paint}
          redraw={`${after}-${hover}-${sel}`}
          tones={FIVE_TONES}
          className="size-40 shrink-0"
          label="Browser share as a donut chart"
          onPointerMove={hit}
          onPointerLeave={() => setHover(null)}
          onPointerDown={() => setSel(hover === sel ? null : hover)}
        />
        <div className="flex min-w-40 flex-1 flex-col">
          {BROWSERS.map((b, si) => (
            <button
              key={b}
              type="button"
              onClick={() => setSel(sel === si ? null : si)}
              aria-pressed={sel === si}
              className={cn(
                "text-caption duration-fast flex h-9 items-center gap-2 rounded-lg px-2 tabular-nums transition-colors",
                sel === si
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-xs",
                  ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"][si],
                )}
                aria-hidden
              />
              {b}
              <span className="ml-auto">{SHARE[si]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * 11 — the radar
 * ================================================================== */

const AXES = ["Speed", "Power", "Range", "Uptime", "Cost", "Support"];
const PLAN_A = [186, 205, 237, 173, 209, 264];
const PLAN_B = [120, 250, 160, 245, 120, 190];

function RadarPair({ after }: { after: boolean }) {
  const [front, setFront] = useState(0);
  const order = front === 0 ? [1, 0] : [0, 1];
  const series = [PLAN_A, PLAN_B];

  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      const cx = cols / 2;
      const cy = rows / 2;
      const R = Math.min(cx, cy) - 2;
      const hi = 300;

      // frame rings + spokes
      ctx.fillStyle = ink[2];
      for (const f of [0.33, 0.66, 1]) {
        ctx.globalAlpha = 0.35;
        for (let a = 0; a < TAU; a += 0.01)
          ctx.fillRect(
            Math.round(cx + Math.cos(a + TOP_ANGLE) * R * f),
            Math.round(cy + Math.sin(a + TOP_ANGLE) * R * f),
            1,
            1,
          );
      }

      for (const si of order) {
        const poly: number[] = [];
        series[si].forEach((v, k) => {
          const a = TOP_ANGLE + (k / AXES.length) * TAU;
          const r = (v / hi) * R;
          poly.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        });
        let minX = cols;
        let maxX = 0;
        let minY = rows;
        let maxY = 0;
        for (let p = 0; p < poly.length; p += 2) {
          minX = Math.min(minX, poly[p]);
          maxX = Math.max(maxX, poly[p]);
          minY = Math.min(minY, poly[p + 1]);
          maxY = Math.max(maxY, poly[p + 1]);
        }
        ctx.fillStyle = ink[si];
        for (let y = Math.max(0, minY | 0); y <= Math.min(rows - 1, maxY); y++)
          for (let x = Math.max(0, minX | 0); x <= Math.min(cols - 1, maxX); x++) {
            if (!pointInPolygon(x + 0.5, y + 0.5, poly)) continue;
            if (!after) {
              ctx.globalAlpha = 0.85;
              ctx.fillRect(x, y, 1, 1);
              continue;
            }
            if (si === 1 && ((x + y) & 3) >= 2) continue;
            const d = clamp01(1 - Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R);
            const lit = d > BAYER[y & 3][x & 3] - si * 0.14;
            const k = 0.3 + d * 0.7;
            ctx.globalAlpha = clamp01(lit ? k : k * OFF_TIER);
            ctx.fillRect(x, y, 1, 1);
          }
        strokePoly(ctx, poly, BORDER_ALPHA);
      }
    },
    [after, front],
  );

  return (
    <div>
      <Head title="Plan comparison" meta="Six measures">
        <div className="flex gap-1.5">
          {["Standard", "Pro"].map((l, si) => (
            <Quiet
              key={l}
              onClick={() => setFront(si)}
              pressed={front === si}
              label={`Draw ${l} in front`}
            >
              {l} in front
            </Quiet>
          ))}
        </div>
      </Head>
      <div className="flex flex-wrap items-center gap-5">
        <Pixels
          paint={paint}
          redraw={`${after}-${front}`}
          tones={ALL_TONES}
          className="size-52 shrink-0"
          label="Two plans compared across six measures"
        />
        <div className="min-w-40 flex-1">
          <div className="text-caption text-muted-foreground mb-2 flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="bg-chart-1 size-2 rounded-xs" aria-hidden />
              Standard
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-chart-3 size-2 rounded-xs" aria-hidden />
              Pro
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4">
            {AXES.map((a, k) => (
              <div key={a} className="flex justify-between border-b py-1.5">
                <dt className="text-caption text-muted-foreground">{a}</dt>
                <dd className="text-caption tabular-nums">
                  {PLAN_A[k]}/{PLAN_B[k]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * 12 — the fade behind a footer
 * ================================================================== */

type Dir = "up" | "down" | "left" | "right";
const DIRS: Dir[] = ["up", "down", "left", "right"];

function GradientPair({ after }: { after: boolean }) {
  const [dir, setDir] = useState<Dir>("up");
  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      ctx.fillStyle = ink[0];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const t =
            dir === "up"
              ? 1 - (y + 0.5) / rows
              : dir === "down"
                ? (y + 0.5) / rows
                : dir === "left"
                  ? 1 - (x + 0.5) / cols
                  : (x + 0.5) / cols;
          const density = 1 - t;
          if (after) {
            const lit = density > BAYER[y & 3][x & 3];
            const alpha = (lit ? 0.35 + 0.65 * density : 0.12 * density) * 0.5;
            if (alpha <= 0.004) continue;
            ctx.globalAlpha = alpha;
          } else {
            // The banded fade: one flat alpha per step.
            const stepped = Math.round(density * 7) / 7;
            if (stepped <= 0) continue;
            ctx.globalAlpha = stepped * 0.4;
          }
          ctx.fillRect(x, y, 1, 1);
        }
    },
    [after, dir],
  );
  return (
    <div>
      <Head title="Footer wash">
        <div className="flex flex-wrap gap-1.5">
          {DIRS.map((d) => (
            <Quiet
              key={d}
              onClick={() => setDir(d)}
              pressed={dir === d}
              label={`Fade ${d}`}
            >
              {d}
            </Quiet>
          ))}
        </div>
      </Head>
      <div className="bg-card relative h-44 overflow-hidden rounded-xl border">
        <Pixels
          paint={paint}
          redraw={`${after}-${dir}`}
          cell={3}
          className="absolute inset-0"
          label={`A background wash fading ${dir}`}
        />
        <div
          className={cn(
            "relative flex h-full p-4",
            {
              up: "items-start justify-center text-center",
              down: "items-end justify-center text-center",
              left: "items-center justify-start",
              right: "items-center justify-end text-right",
            }[dir],
          )}
        >
          <div>
            <p className="text-ui">Dither Kit</p>
            <p className="text-caption text-muted-foreground">
              Charts, avatars and washes on one canvas engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * 13 — the avatar
 * ================================================================== */

const GRID = 8;
const AV_CELL = 4;
const TEAM = ["ana", "dan", "kai", "mira", "sol"];

function avatarModel(name: string) {
  const rand = xorshift32(fnv1a(name));
  const bits = Array.from({ length: 32 }, () => rand() < 0.5);
  const vertical = rand() < 0.5;
  const tone = Math.floor(rand() * 5);
  const half = Array.from({ length: 32 }, () => 0.55 + rand() * 0.45);
  const on = new Array<boolean>(GRID * GRID);
  const density = new Array<number>(GRID * GRID);
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++) {
      const i = vertical
        ? Math.min(r, GRID - 1 - r) * GRID + c
        : r * (GRID / 2) + Math.min(c, GRID - 1 - c);
      on[r * GRID + c] = bits[i];
      density[r * GRID + c] = half[i];
    }
  return { on, density, tone };
}

function DitherAvatar({ name, className }: { name: string; className: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = cvRef.current;
    const ctx = cv?.getContext("2d");
    if (!wrap || !cv || !ctx) return;
    let raf = 0;

    const run = () => {
      const model = avatarModel(name);
      const px = GRID * AV_CELL;
      cv.width = px;
      cv.height = px;
      const ink = readInk(wrap, FIVE_TONES);
      ctx.fillStyle = ink[model.tone];
      const anim = !reduced();

      const draw = (progress: number) => {
        ctx.clearRect(0, 0, px, px);
        for (let r = 0; r < GRID; r++)
          for (let c = 0; c < GRID; c++) {
            if (!model.on[r * GRID + c]) continue;
            // Cells materialize in Bayer order — the entrance is made of
            // the same matrix as the texture.
            const start = BAYER[r % 4][c % 4] * 0.7;
            const cellAlpha = clamp01((progress - start) / 0.3);
            if (cellAlpha <= 0) continue;
            const d = model.density[r * GRID + c];
            const base = 0.35 + 0.65 * d;
            for (let py = 0; py < AV_CELL; py++)
              for (let pxi = 0; pxi < AV_CELL; pxi++) {
                const gx = c * AV_CELL + pxi;
                const gy = r * AV_CELL + py;
                const lit = d > BAYER[gy & 3][gx & 3];
                ctx.globalAlpha = (lit ? base : base * 0.35) * cellAlpha;
                ctx.fillRect(gx, gy, 1, 1);
              }
          }
      };

      if (!anim) return draw(1);
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = clamp01((now - t0) / 600);
        draw(easeOutCubic(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    run();
    const mo = new MutationObserver(run);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [name]);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={`${name} avatar`}
      className={cn("relative", className)}
    >
      <canvas
        ref={cvRef}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

function Initials({ name, className }: { name: string; className: string }) {
  return (
    <div
      role="img"
      aria-label={`${name} avatar`}
      className={cn(
        "bg-secondary text-muted-foreground grid place-items-center rounded-full uppercase",
        className,
      )}
    >
      {name.slice(0, 2) || "?"}
    </div>
  );
}

function AvatarPair({ after }: { after: boolean }) {
  const [name, setName] = useState("jordan");
  const id = useId();
  const Face = after ? DitherAvatar : Initials;
  return (
    <div>
      <Head title="Workspace members" />
      <div className="mb-4 flex h-9 items-center gap-2">
        <label htmlFor={id} className="text-caption text-muted-foreground">
          Invite
        </label>
        <input
          id={id}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 16))}
          placeholder="name"
          className="bg-card text-ui-sm focus-visible:ring-ring h-9 min-w-0 flex-1 rounded-lg border px-3 focus-visible:ring-2 focus-visible:outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <Face name={name || "?"} className="text-caption size-12 shrink-0" />
        <div className="min-w-0">
          <p className="text-ui-sm truncate">{name || "New member"}</p>
          <p className="text-caption text-muted-foreground">Pending invite</p>
        </div>
      </div>
      <div className="mt-4 border-t pt-3">
        {TEAM.map((t) => (
          <div key={t} className="flex items-center gap-3 py-1.5">
            <Face name={t} className="text-micro size-8 shrink-0" />
            <p className="text-ui-sm">{t}</p>
            <p className="text-caption text-muted-foreground ml-auto">Member</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== *
 * 14 — the number on its own
 * ================================================================== */

const PERIODS = ["7 days", "30 days", "90 days"] as const;
const STATS = [
  { label: "Visitors", base: DESKTOP, unit: "" },
  { label: "Sign-ups", base: MOBILE, unit: "" },
  { label: "Revenue", base: TABLET, unit: "k" },
];

function SparkPair({ after }: { after: boolean }) {
  const [p, setP] = useState(1);
  const spans = [4, 8, 12];
  const n = spans[p];

  return (
    <div>
      <Head title="Overview">
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((label, i) => (
            <Quiet key={label} onClick={() => setP(i)} pressed={p === i}>
              {label}
            </Quiet>
          ))}
        </div>
      </Head>
      <div className="grid gap-3 sm:grid-cols-3">
        {STATS.map((s, si) => {
          const slice = s.base.slice(12 - n);
          const value = slice[slice.length - 1];
          const first = slice[0];
          const delta = Math.round(((value - first) / (first || 1)) * 100);
          return (
            <div key={s.label} className="bg-secondary rounded-lg p-3">
              <p className="text-caption text-muted-foreground">{s.label}</p>
              <p className="text-ui mt-0.5 tabular-nums">
                {value.toLocaleString()}
                {s.unit}
              </p>
              {after ? (
                <SparkCanvas values={slice} tone={si} />
              ) : (
                <div className="h-13" />
              )}
              <p className="text-caption text-muted-foreground tabular-nums">
                {delta >= 0 ? "+" : ""}
                {delta}% over {PERIODS[p]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SparkCanvas({ values, tone }: { values: number[]; tone: number }) {
  const paint = useCallback(
    ({ ctx, cols, rows, ink }: PaintArgs) => {
      ctx.fillStyle = ink[tone];
      const lo = Math.min(...values);
      const hi = Math.max(...values);
      const tops = resample(
        values.map((v) => (1 - (v - lo) / (hi - lo || 1)) * (rows - 3) + 1),
        cols,
      );
      for (let x = 0; x < cols; x++)
        paintColumn(ctx, x, tops[x], rows - 1, {
          variant: "gradient",
          intensity: 0,
          dim: 1,
          stacked: false,
        });
    },
    [values, tone],
  );
  return (
    <Pixels
      paint={paint}
      redraw={`${values.length}-${tone}`}
      tones={ALL_TONES}
      className="my-1.5 h-10 w-full"
      label="Trend over the selected period"
    />
  );
}

/* ================================================================== *
 * the page
 * ================================================================== */

export function DitherKitDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The chart fades out toward the line instead of sitting on the page as a solid slab."
        before={<FillPair after={false} />}
        after={<FillPair after />}
      />
      <BeforeAfter
        principle="You can tell the three apart where they overlap."
        before={<LayersPair after={false} />}
        after={<LayersPair after />}
      />
      <BeforeAfter
        principle="The line is a line, not a staircase."
        before={<StepPair after={false} />}
        after={<StepPair after />}
      />
      <BeforeAfter
        principle="The bars start at zero, so Jun is half again as tall as Apr — not ten times."
        before={<ScalePair after={false} />}
        after={<ScalePair after />}
      />
      <BeforeAfter
        principle="Press Play again: the bars grow up one after another instead of all landing at once."
        before={<GrowPair after={false} />}
        after={<GrowPair after />}
      />
      <BeforeAfter
        principle="You can see which bar the number belongs to."
        before={<FocusPair after={false} />}
        after={<FocusPair after />}
      />
      <BeforeAfter
        principle="You can tell where the first device stops and the second starts."
        before={<StackPair after={false} />}
        after={<StackPair after />}
      />
      <BeforeAfter
        principle="The reading settles on the nearest point instead of chasing your pointer."
        before={<TooltipPair after={false} />}
        after={<TooltipPair after />}
      />
      <BeforeAfter
        principle="Tap a name to see just that one."
        before={<LegendPair after={false} />}
        after={<LegendPair after />}
      />
      <BeforeAfter
        principle="The slice you point at lifts out of the ring."
        before={<PiePair after={false} />}
        after={<PiePair after />}
      />
      <BeforeAfter
        principle="Whichever plan you bring forward, you can still see the other one."
        before={<RadarPair after={false} />}
        after={<RadarPair after />}
      />
      <BeforeAfter
        principle="The fade is smooth instead of stripey."
        before={<GradientPair after={false} />}
        after={<GradientPair after />}
      />
      <BeforeAfter
        principle="Everyone gets their own face, and it is the same face every time."
        before={<AvatarPair after={false} />}
        after={<AvatarPair after />}
      />
      <BeforeAfter
        principle="You can see which way each number has been going, not just where it landed."
        before={<SparkPair after={false} />}
        after={<SparkPair after />}
      />
    </div>
  );
}
