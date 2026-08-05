"use client";

import { RotateCw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Liveline (benjitaylor/liveline) — a real-time canvas chart.
 *
 * The library is not a dependency here, so every switch below is the
 * smallest honest rebuild of one thing it does: monotone splines,
 * frame-rate-independent lerp on value / range / window, the tip
 * badge, grid, scrub with binary-search lookup, momentum, pulse,
 * multi-series with a re-fitting axis, the candle-to-line morph, the
 * loading morph, and ResizeObserver + devicePixelRatio sizing.
 *
 * Both sides of every switch are live canvases fed by the same
 * stream. Only the quality changes.
 * ------------------------------------------------------------------ */

const TAU = Math.PI * 2;

type Side = { after: boolean };
type Sample = { t: number; v: number };
type P = [number, number];

/* ── the stream ───────────────────────────────────────────────────── */

type Spec = {
  step: number;
  vol: number;
  spike: number;
  base: number;
  seed: number;
  wave?: number;
  period?: number;
  /** How much of a spike the next sample gives back. 1 = an impulse. */
  snap?: number;
  /** Fixed spike size, when the spikes should tower over the noise. */
  pop?: number;
};

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A tick source that lives outside React. Every chart on the page
 * pulls from one of these, so flipping Before/After does not restart
 * the data — the same stream keeps running underneath.
 */
class Feed {
  pts: Sample[] = [];
  private r: () => number;
  private jolt = 0;

  constructor(private s: Spec) {
    this.r = rand(s.seed);
  }

  tick(now: number) {
    const s = this.s;
    const tail = this.pts[this.pts.length - 1];
    if (!tail || now - tail.t > s.step * 400) {
      this.pts = [{ t: now - s.step * 220, v: s.base }];
    }
    let last = this.pts[this.pts.length - 1];
    while (last.t + s.step <= now) {
      const t = last.t + s.step;
      const pull = s.base + (s.wave ? Math.sin(t / (s.period ?? 7000)) * s.wave : 0);
      let d: number;
      if (this.jolt !== 0) {
        d = -this.jolt * (s.snap ?? 0.7);
        this.jolt = 0;
      } else if (this.r() < s.spike) {
        this.jolt = (this.r() < 0.5 ? -1 : 1) * (s.pop ?? s.vol * (4 + this.r() * 3));
        d = this.jolt;
      } else {
        d = (this.r() - 0.5) * s.vol * 2;
      }
      last = { t, v: last.v + d + (pull - last.v) * 0.06 };
      this.pts.push(last);
    }
    if (this.pts.length > 400) this.pts.splice(0, this.pts.length - 400);
    return this.pts;
  }
}

const FEEDS = new Map<string, Feed>();
function feedOf(id: string, s: Spec) {
  let f = FEEDS.get(id);
  if (!f) {
    f = new Feed(s);
    FEEDS.set(id, f);
  }
  return f;
}

const CALM: Spec = { step: 240, vol: 0.45, spike: 0.02, base: 50, seed: 7 };
const SLOW: Spec = { step: 900, vol: 3.4, spike: 0.16, base: 50, seed: 11 };
const SPIKY: Spec = {
  step: 1000,
  vol: 0.45,
  spike: 0.2,
  base: 50,
  seed: 23,
  snap: 1,
  pop: 15,
};
const CASH: Spec = { step: 280, vol: 1.5, spike: 0.05, base: 1204, seed: 3 };
const TREND: Spec = {
  step: 240,
  vol: 0.6,
  spike: 0.02,
  base: 40,
  seed: 5,
  wave: 12,
  period: 6200,
};
const YES: Spec = { step: 260, vol: 0.5, spike: 0.03, base: 61, seed: 41, wave: 7, period: 9000 };
const NO: Spec = { step: 260, vol: 0.5, spike: 0.03, base: 39, seed: 42, wave: 7, period: 9000 };
const TICKS: Spec = { step: 200, vol: 1.1, spike: 0.06, base: 1204, seed: 17 };

/* ── formatting ───────────────────────────────────────────────────── */

const plain = (v: number) => v.toFixed(1);
const raw = (v: number) => v.toFixed(2);
const money = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const percent = (v: number) => `${v.toFixed(1)}%`;

/* ── canvas host ──────────────────────────────────────────────────── */

type Cols = {
  ink: string;
  alt: string;
  dim: string;
  line: string;
  card: string;
  fg: string;
  up: string;
  down: string;
  font: string;
};

/** Only ever used for the frame before the tokens are first read. */
const FALLBACK: Cols = {
  ink: "slateblue",
  alt: "gray",
  dim: "gray",
  line: "silver",
  card: "white",
  fg: "black",
  up: "seagreen",
  down: "firebrick",
  font: "system-ui, sans-serif",
};

type Frame = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  dt: number;
  now: number;
  C: Cols;
};

/**
 * One canvas, one requestAnimationFrame loop, no React render per
 * tick. `crisp` is the whole point of the last switch on the page:
 * with it the backing store is resized by a ResizeObserver at device
 * pixel ratio; without it the bitmap is a fixed size that the browser
 * stretches.
 */
function Live({
  draw,
  label,
  className = "h-40",
  crisp = true,
  cursor = false,
  onHover,
}: {
  draw: (f: Frame) => void;
  label: string;
  className?: string;
  crisp?: boolean;
  cursor?: boolean;
  onHover?: (x: number | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fn = useRef(draw);

  useEffect(() => {
    fn.current = draw;
  });

  useEffect(() => {
    const el = box.current;
    const cnv = cv.current;
    const ctx = cnv?.getContext("2d");
    if (!el || !cnv || !ctx) return;

    let raf = 0;
    let prev = performance.now();
    let f = 0;
    let w = 0;
    let h = 0;
    let on = true;
    const C: Cols = { ...FALLBACK };

    const measure = () => {
      if (crisp) {
        const dpr = window.devicePixelRatio || 1;
        w = el.clientWidth;
        h = el.clientHeight;
        cnv.width = Math.round(w * dpr);
        cnv.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
        w = 520;
        h = 152;
        cnv.width = w;
        cnv.height = h;
      }
    };
    measure();

    const ro = crisp ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    const io = new IntersectionObserver((e) => {
      on = e[0].isIntersecting;
    });
    io.observe(el);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - prev, 50);
      prev = now;
      if (!on || w < 8) return;

      // Canvas has no class hooks, so the theme has to be handed to
      // it. Reading every 24th frame is cheap and survives a toggle.
      if (f++ % 24 === 0) {
        const s = getComputedStyle(el);
        const g = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
        C.ink = g("--accent-solid", FALLBACK.ink);
        C.alt = g("--chart-3", FALLBACK.alt);
        C.dim = g("--muted-foreground", FALLBACK.dim);
        C.line = g("--border", FALLBACK.line);
        C.card = g("--card", FALLBACK.card);
        C.fg = g("--foreground", FALLBACK.fg);
        C.up = g("--positive", FALLBACK.up);
        C.down = g("--destructive", FALLBACK.down);
        C.font = s.fontFamily || FALLBACK.font;
      }

      ctx.clearRect(0, 0, w, h);
      fn.current({ ctx, w, h, dt, now, C });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io.disconnect();
    };
  }, [crisp]);

  return (
    <div
      ref={box}
      role="img"
      aria-label={label}
      onPointerMove={
        onHover
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onHover((e.clientX - r.left) / r.width);
            }
          : undefined
      }
      onPointerLeave={onHover ? () => onHover(null) : undefined}
      className={cn(
        "bg-secondary relative overflow-hidden rounded-lg border",
        cursor && "cursor-crosshair",
        className,
      )}
    >
      <canvas ref={cv} className="block size-full" />
    </div>
  );
}

/* ── geometry ─────────────────────────────────────────────────────── */

/** Slope at point i. Clamped → Fritsch–Carlson; loose → Catmull–Rom. */
function tangent(p: P[], i: number, clamp: boolean) {
  const a = p[i - 1];
  const b = p[i + 1];
  if (!a) return b ? (b[1] - p[i][1]) / (b[0] - p[i][0]) : 0;
  if (!b) return (p[i][1] - a[1]) / (p[i][0] - a[0]);
  const d0 = (p[i][1] - a[1]) / (p[i][0] - a[0]);
  const d1 = (b[1] - p[i][1]) / (b[0] - p[i][0]);
  const m = (d0 + d1) / 2;
  if (!clamp) return m;
  if (d0 * d1 <= 0) return 0; // an extremum: leave it flat
  return Math.sign(m) * Math.min(Math.abs(m), 3 * Math.min(Math.abs(d0), Math.abs(d1)));
}

/**
 * The control points of a natural cubic spline — one global solve, C²
 * everywhere, and no idea that the data has a maximum. This is what a
 * chart draws when nobody thought about overshoot.
 */
function natural(x: number[]) {
  const n = x.length - 1;
  const a = new Array<number>(n);
  const b = new Array<number>(n);
  const r = new Array<number>(n);
  a[0] = 0;
  b[0] = 2;
  r[0] = x[0] + 2 * x[1];
  for (let i = 1; i < n - 1; i++) {
    a[i] = 1;
    b[i] = 4;
    r[i] = 4 * x[i] + 2 * x[i + 1];
  }
  a[n - 1] = 2;
  b[n - 1] = 7;
  r[n - 1] = 8 * x[n - 1] + x[n];
  for (let i = 1; i < n; i++) {
    const m = a[i] / b[i - 1];
    b[i] -= m;
    r[i] -= m * r[i - 1];
  }
  a[n - 1] = r[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; i--) a[i] = (r[i] - a[i + 1]) / b[i];
  b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (let i = 0; i < n - 1; i++) b[i] = 2 * x[i + 1] - a[i + 1];
  return [a, b] as const;
}

function trace(ctx: CanvasRenderingContext2D, p: P[], mono: boolean) {
  if (!mono && p.length > 2) {
    const [ax, bx] = natural(p.map((q) => q[0]));
    const [ay, by] = natural(p.map((q) => q[1]));
    for (let i = 0; i < p.length - 1; i++) {
      ctx.bezierCurveTo(ax[i], ay[i], bx[i], by[i], p[i + 1][0], p[i + 1][1]);
    }
    return;
  }
  for (let i = 0; i < p.length - 1; i++) {
    const third = (p[i + 1][0] - p[i][0]) / 3;
    ctx.bezierCurveTo(
      p[i][0] + third,
      p[i][1] + tangent(p, i, mono) * third,
      p[i + 1][0] - third,
      p[i + 1][1] - tangent(p, i + 1, mono) * third,
      p[i + 1][0],
      p[i + 1][1],
    );
  }
}

function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Value at an arbitrary time. Binary search, then linear blend. */
function valueAt(pts: Sample[], t: number) {
  let lo = 0;
  let hi = pts.length - 1;
  if (t <= pts[0].t) return pts[0].v;
  if (t >= pts[hi].t) return pts[hi].v;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (pts[m].t <= t) lo = m;
    else hi = m;
  }
  const a = pts[lo];
  const b = pts[hi];
  return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t);
}

function inWindow(pts: Sample[], now: number, win: number) {
  let i = pts.length - 1;
  while (i > 0 && pts[i].t > now - win) i--;
  return pts.slice(Math.max(0, i - 1));
}

/* ── the line renderer ────────────────────────────────────────────── */

type Opts = {
  curve?: "monotone" | "loose";
  fixed?: [number, number];
  glide?: boolean;
  warp?: boolean;
  dots?: boolean;
  grid?: boolean;
  fill?: boolean;
  badge?: boolean;
  corner?: boolean;
  pulse?: boolean;
  momentum?: boolean;
  scrub?: boolean;
  high?: boolean;
  fmt?: (v: number) => string;
};

type St = {
  lo: number;
  hi: number;
  v: number;
  win: number;
  m: number;
  hover: number | null;
  ready: boolean;
};

function newSt(win: number, m = 1): St {
  return { lo: 0, hi: 1, v: 0, win, m, hover: null, ready: false };
}

function drawLine(f: Frame, o: Opts, st: St, pts: Sample[], win: number, m = 1) {
  const { ctx, w, h, dt, now, C } = f;
  const k = (s: number) => 1 - (1 - s) ** (dt / 16.67);
  const fmt = o.fmt ?? plain;
  const padR = o.badge || o.grid ? 78 : 10;
  const x0 = 12;
  const x1 = Math.max(x0 + 30, w - padR);
  const y0 = 16;
  const y1 = h - 18;
  if (y1 - y0 < 20) return;

  const vis = inWindow(pts, now, win);
  if (vis.length < 3) return;

  let min = Infinity;
  let max = -Infinity;
  for (const s of vis) {
    if (s.v < min) min = s.v;
    if (s.v > max) max = s.v;
  }
  const peak = max;
  let lo: number;
  let hi: number;
  if (o.fixed) {
    lo = o.fixed[0];
    hi = o.fixed[1];
  } else {
    const pad = (max - min) * 0.2 + 0.6;
    lo = min - pad;
    hi = max + pad;
  }

  const live = vis[vis.length - 1].v;
  if (!st.ready) {
    st.lo = lo;
    st.hi = hi;
    st.v = live;
    st.ready = true;
  }
  // Frame-rate-independent lerp: the same glide at 60 and at 120fps.
  const g = o.glide ? k(0.11) : 1;
  st.lo += (lo - st.lo) * g;
  st.hi += (hi - st.hi) * g;
  st.v += (live - st.v) * (o.glide ? k(0.17) : 1);

  const span = st.hi - st.lo || 1;
  const X = (t: number) => x1 - ((now - t) / win) * (x1 - x0);
  const Y = (v: number) => y1 - ((v - st.lo) / span) * (y1 - y0);

  const p: P[] = vis.map((s) => [X(s.t), Y(s.v)] as P);
  // The live tip sits at the right edge. If the newest sample has just
  // landed there, move it rather than stacking a second point on top.
  if (x1 - p[p.length - 1][0] > 5) p.push([x1, Y(st.v)]);
  else p[p.length - 1] = [x1, Y(st.v)];

  if (m < 1) {
    const mid = (y0 + y1) / 2;
    const e = m * m * (3 - 2 * m);
    for (const q of p) {
      const yw = mid + Math.sin(q[0] / 46 + now / 400) * (y1 - y0) * 0.16;
      q[1] = yw + (q[1] - yw) * e;
    }
  }

  const full = m > 0.55;
  const mono = o.curve !== "loose";
  const back = vis[Math.max(0, vis.length - 9)].v;
  const dir = live - back;
  const tone = o.momentum ? (dir >= 0 ? C.up : C.down) : C.ink;

  if (o.fill) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - 1, 0, x1 - x0 + 2, h);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    trace(ctx, p, mono);
    ctx.lineTo(p[p.length - 1][0], y1 + 60);
    ctx.lineTo(p[0][0], y1 + 60);
    ctx.closePath();
    ctx.globalAlpha = 0.2 * m;
    ctx.fillStyle = C.ink;
    ctx.fill();
    ctx.globalAlpha = 1;
    const grad = ctx.createLinearGradient(0, y0, 0, y1 + 8);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "color-mix(in oklab, var(--foreground) 95%, transparent)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  if (o.grid && full) {
    ctx.save();
    ctx.globalAlpha = m;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.fillStyle = C.dim;
    ctx.font = `500 10px ${C.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < 4; i++) {
      const v = st.lo + (span * (i + 0.5)) / 4;
      const y = Math.round(Y(v)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      ctx.fillText(fmt(v), x1 + 8, y);
    }
    ctx.restore();
  }

  if (o.high && full) {
    const y = Y(peak);
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = C.dim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = C.dim;
    ctx.font = `500 10px ${C.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("highest reading", x0 + 2, y - 6);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 - 2, 0, x1 - x0 + 4, h);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  trace(ctx, p, mono);
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.4 + 0.6 * m;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  if (o.dots && full) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.dim;
    for (let i = 0; i < p.length - 1; i++) {
      ctx.beginPath();
      ctx.arc(p[i][0], p[i][1], 2.5, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();

  const tip = p[p.length - 1];
  if (full) {
    if (o.pulse) {
      const ph = (now % 1500) / 1500;
      ctx.globalAlpha = 0.32 * (1 - ph);
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], 4 + 13 * ph, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (o.momentum) {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], 8, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = tone;
    ctx.beginPath();
    ctx.arc(tip[0], tip[1], 3.5, 0, TAU);
    ctx.fill();
  }

  if (o.badge && full) {
    const text = fmt(st.v);
    ctx.font = `600 11px ${C.font}`;
    const arrow = o.momentum ? 12 : 0;
    const bw = ctx.measureText(text).width + 16 + arrow;
    const bh = 21;
    const bx = Math.min(w - bw - 3, tip[0] + 12);
    const by = Math.min(h - bh - 3, Math.max(3, tip[1] - bh / 2));
    const ty = Math.min(by + bh - 6, Math.max(by + 6, tip[1]));
    ctx.fillStyle = tone;
    ctx.beginPath();
    ctx.moveTo(bx + 2, ty - 4);
    ctx.lineTo(bx - 6, ty);
    ctx.lineTo(bx + 2, ty + 4);
    ctx.closePath();
    ctx.fill();
    pill(ctx, bx, by, bw, bh, 7);
    ctx.fillStyle = C.card;
    ctx.fill();
    ctx.strokeStyle = tone;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (o.momentum) {
      const ax = bx + 11;
      const ay = by + bh / 2;
      ctx.fillStyle = tone;
      ctx.beginPath();
      if (dir >= 0) {
        ctx.moveTo(ax, ay - 4);
        ctx.lineTo(ax + 4, ay + 3);
        ctx.lineTo(ax - 4, ay + 3);
      } else {
        ctx.moveTo(ax, ay + 4);
        ctx.lineTo(ax + 4, ay - 3);
        ctx.lineTo(ax - 4, ay - 3);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = C.fg;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + 9 + arrow, by + bh / 2 + 0.5);
  }

  if (o.corner && full) {
    ctx.fillStyle = C.dim;
    ctx.font = `500 11px ${C.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(fmt(st.v), x0, 3);
  }

  if (o.scrub && st.hover !== null && full) {
    const hx = Math.min(x1, Math.max(x0, st.hover * w));
    const t = now - ((x1 - hx) / (x1 - x0)) * win;
    const v = valueAt(vis, t);
    const hy = Y(v);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = C.dim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx, y0 - 8);
    ctx.lineTo(hx, y1 + 8);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = C.card;
    ctx.beginPath();
    ctx.arc(hx, hy, 5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, 4, 0, TAU);
    ctx.stroke();
    const secs = Math.max(0, Math.round((now - t) / 1000));
    const text = `${fmt(v)} · ${secs}s ago`;
    ctx.font = `600 11px ${C.font}`;
    const right = hx > x1 - 96;
    const tx = hx + (right ? -8 : 8);
    ctx.textAlign = right ? "right" : "left";
    ctx.textBaseline = "top";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.strokeStyle = C.card;
    ctx.strokeText(text, tx, 3);
    ctx.fillStyle = C.fg;
    ctx.fillText(text, tx, 3);
  }
}

/* ── the line chart ───────────────────────────────────────────────── */

function LineChart({
  id,
  spec,
  o,
  win,
  label,
  className,
  crisp = true,
}: {
  id: string;
  spec: Spec;
  o: Opts;
  win: number;
  label: string;
  className?: string;
  crisp?: boolean;
}) {
  const st = useRef<St>(newSt(win));
  const feed = feedOf(id, spec);

  const draw = (f: Frame) => {
    const pts = feed.tick(f.now);
    const k = 1 - 0.88 ** (f.dt / 16.67);
    st.current.win += (win - st.current.win) * (o.warp ? k : 1);
    drawLine(f, o, st.current, pts, st.current.win);
  };

  return (
    <Live
      draw={draw}
      label={label}
      className={className}
      crisp={crisp}
      cursor={o.scrub}
      onHover={
        o.scrub
          ? (x) => {
              st.current.hover = x;
            }
          : undefined
      }
    />
  );
}

/* ── shared controls ──────────────────────────────────────────────── */

function Segment({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { id: string; label: string; dot?: string }[];
  value: string | string[];
  onChange: (id: string) => void;
  label: string;
}) {
  const on = (id: string) => (Array.isArray(value) ? value.includes(id) : value === id);
  return (
    <div className="bg-secondary inline-flex gap-1 rounded-lg p-1" role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-pressed={on(opt.id)}
          className={cn(
            "text-ui-sm duration-fast ease-out-quart flex h-9 items-center gap-2 rounded-md px-3 transition-colors",
            on(opt.id) ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.dot && (
            <span
              aria-hidden="true"
              className={cn("size-2 rounded-full", opt.dot, !on(opt.id) && "opacity-40")}
            />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── 1 · the axis fits what is happening ──────────────────────────── */

function RangePair({ after }: Side) {
  return (
    <LineChart
      id="calm"
      spec={CALM}
      win={22000}
      label={`Live line chart, ${after ? "scale fitted to the readings" : "fixed 0 to 100 scale"}`}
      o={{
        glide: true,
        grid: true,
        fill: true,
        badge: true,
        pulse: true,
        fmt: plain,
        fixed: after ? undefined : [0, 100],
      }}
    />
  );
}

/* ── 2 · the value glides instead of teleporting ──────────────────── */

function GlidePair({ after }: Side) {
  return (
    <LineChart
      id="slow"
      spec={SLOW}
      win={20000}
      label={`Live line chart updating about once a second, ${after ? "gliding to each new reading" : "jumping to each new reading"}`}
      o={{ glide: after, grid: true, fill: true, badge: true, pulse: after, fmt: plain }}
    />
  );
}

/* ── 3 · the curve never invents a peak ───────────────────────────── */

function PeakPair({ after }: Side) {
  return (
    <LineChart
      id="spiky"
      spec={SPIKY}
      win={14000}
      label={`Spiky live chart with every reading marked, ${after ? "the curve stays inside them" : "the curve overshoots them"}`}
      o={{
        glide: true,
        dots: true,
        high: true,
        curve: after ? "monotone" : "loose",
        fmt: plain,
      }}
    />
  );
}

/* ── 4 · you can read what the heights are worth ──────────────────── */

function ScalePair({ after }: Side) {
  return (
    <LineChart
      id="cash"
      spec={CASH}
      win={24000}
      label={`Live price chart, ${after ? "with a labelled scale" : "with no scale"}`}
      o={{
        glide: true,
        fill: true,
        badge: true,
        pulse: true,
        grid: after,
        fmt: after ? money : raw,
      }}
    />
  );
}

/* ── 5 · the number rides the end of the line ─────────────────────── */

function BadgePair({ after }: Side) {
  return (
    <LineChart
      id="cash"
      spec={CASH}
      win={24000}
      label={`Live price chart, current price ${after ? "pinned to the end of the line" : "in the corner"}`}
      o={{
        glide: true,
        fill: true,
        pulse: true,
        badge: after,
        corner: !after,
        fmt: money,
      }}
    />
  );
}

/* ── 6 · point at any moment ──────────────────────────────────────── */

function ScrubPair({ after }: Side) {
  return (
    <LineChart
      id="cash"
      spec={CASH}
      win={24000}
      label={`Live price chart, ${after ? "point at it to read any moment" : "pointing at it does nothing"}`}
      o={{
        glide: true,
        fill: true,
        grid: true,
        badge: true,
        scrub: after,
        fmt: money,
      }}
    />
  );
}

/* ── 7 · live, and heading somewhere ──────────────────────────────── */

function MomentumPair({ after }: Side) {
  return (
    <LineChart
      id="trend"
      spec={TREND}
      win={20000}
      label={`Live chart, ${after ? "the tip pulses and turns green or red with the direction" : "with a plain static tip"}`}
      o={{
        glide: true,
        fill: true,
        badge: true,
        momentum: after,
        pulse: after,
        fmt: plain,
      }}
    />
  );
}

/* ── 8 · changing the range does not yank the chart ───────────────── */

const RANGES = [
  { id: "10s", label: "10s", ms: 10000 },
  { id: "30s", label: "30s", ms: 30000 },
  { id: "2m", label: "2m", ms: 120000 },
] as const;

function WindowPair({ after }: Side) {
  const [range, setRange] = useState<string>("30s");
  const win = RANGES.find((r) => r.id === range)?.ms ?? 30000;

  return (
    <div className="space-y-3">
      <Segment options={RANGES} value={range} onChange={setRange} label="Time range" />
      <LineChart
        id="calm"
        spec={CALM}
        win={win}
        label={`Live chart over the last ${range}`}
        o={{
          glide: true,
          warp: after,
          grid: true,
          fill: true,
          badge: true,
          pulse: true,
          fmt: plain,
        }}
      />
    </div>
  );
}

/* ── 9 · hide one line, the other fills the space ─────────────────── */

function drawSeries(
  f: Frame,
  st: { a: number[]; lo: number; hi: number; ready: boolean },
  sets: { pts: Sample[]; on: boolean; accent: boolean }[],
  win: number,
  smooth: boolean,
) {
  const { ctx, w, h, dt, now, C } = f;
  const k = 1 - 0.88 ** (dt / 16.67);
  const x0 = 12;
  const x1 = Math.max(x0 + 30, w - 62);
  const y0 = 16;
  const y1 = h - 18;
  if (y1 - y0 < 20) return;

  sets.forEach((s, i) => {
    st.a[i] += ((s.on ? 1 : 0) - st.a[i]) * (smooth ? k : 1);
  });

  const cuts = sets.map((s) => inWindow(s.pts, now, win));
  let min = Infinity;
  let max = -Infinity;
  cuts.forEach((pts, i) => {
    // The improved side drops hidden lines from the range, so the one
    // left standing gets the whole height.
    if (smooth && st.a[i] < 0.03) return;
    for (const s of pts) {
      if (s.v < min) min = s.v;
      if (s.v > max) max = s.v;
    }
  });
  if (min === Infinity) return;

  const pad = (max - min) * 0.2 + 0.6;
  if (!st.ready) {
    st.lo = min - pad;
    st.hi = max + pad;
    st.ready = true;
  }
  st.lo += (min - pad - st.lo) * k;
  st.hi += (max + pad - st.hi) * k;
  const span = st.hi - st.lo || 1;
  const X = (t: number) => x1 - ((now - t) / win) * (x1 - x0);
  const Y = (v: number) => y1 - ((v - st.lo) / span) * (y1 - y0);

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = Math.round(Y(st.lo + (span * (i + 0.5)) / 4)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }

  cuts.forEach((pts, i) => {
    const a = st.a[i];
    if (a < 0.02 || pts.length < 3) return;
    const color = sets[i].accent ? C.ink : C.alt;
    const p: P[] = pts.map((s) => [X(s.t), Y(s.v)] as P);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - 2, 0, x1 - x0 + 4, h);
    ctx.clip();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    trace(ctx, p, true);
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();

    const tip = p[p.length - 1];
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(tip[0], tip[1], 3.5, 0, TAU);
    ctx.fill();
    ctx.font = `600 11px ${C.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(percent(pts[pts.length - 1].v), x1 + 9, tip[1]);
    ctx.globalAlpha = 1;
  });
}

const LEGS = [
  { id: "yes", label: "Yes", dot: "bg-accent-solid" },
  { id: "no", label: "No", dot: "bg-chart-3" },
] as const;

function SeriesPair({ after }: Side) {
  const [shown, setShown] = useState<string[]>(["yes", "no"]);
  const st = useRef({ a: [1, 1], lo: 0, hi: 1, ready: false });
  const yes = feedOf("yes", YES);
  const no = feedOf("no", NO);

  const draw = (f: Frame) => {
    drawSeries(
      f,
      st.current,
      [
        { pts: yes.tick(f.now), on: shown.includes("yes"), accent: true },
        { pts: no.tick(f.now), on: shown.includes("no"), accent: false },
      ],
      30000,
      after,
    );
  };

  return (
    <div className="space-y-3">
      <Segment
        options={LEGS}
        value={shown}
        label="Lines"
        onChange={(id) =>
          setShown((s) => {
            const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
            return next.length ? next : s;
          })
        }
      />
      <Live
        draw={draw}
        label={`Two live lines, Yes and No, ${shown.length === 2 ? "both shown" : "one shown"}`}
      />
    </div>
  );
}

/* ── 10 · bars and line are the same picture ──────────────────────── */

const BUCKET = 2400;

function drawCandles(
  f: Frame,
  st: { lo: number; hi: number; m: number; ready: boolean },
  pts: Sample[],
  win: number,
  target: number,
  smooth: boolean,
) {
  const { ctx, w, h, dt, now, C } = f;
  const k = 1 - 0.88 ** (dt / 16.67);
  const x0 = 12;
  const x1 = Math.max(x0 + 40, w - 78);
  const y0 = 16;
  const y1 = h - 18;
  if (y1 - y0 < 20) return;

  st.m += (target - st.m) * (smooth ? 1 - 0.9 ** (dt / 16.67) : 1);
  const m = st.m;

  const vis = inWindow(pts, now, win);
  if (vis.length < 4) return;

  const bars: { b: number; o: number; h: number; l: number; c: number }[] = [];
  for (const s of vis) {
    const b = Math.floor(s.t / BUCKET);
    const last = bars[bars.length - 1];
    if (!last || last.b !== b) bars.push({ b, o: s.v, h: s.v, l: s.v, c: s.v });
    else {
      last.h = Math.max(last.h, s.v);
      last.l = Math.min(last.l, s.v);
      last.c = s.v;
    }
  }
  if (bars.length < 3) return;

  let min = Infinity;
  let max = -Infinity;
  for (const b of bars) {
    if (b.l < min) min = b.l;
    if (b.h > max) max = b.h;
  }
  const pad = (max - min) * 0.15 + 0.4;
  if (!st.ready) {
    st.lo = min - pad;
    st.hi = max + pad;
    st.ready = true;
  }
  st.lo += (min - pad - st.lo) * k;
  st.hi += (max + pad - st.hi) * k;
  const span = st.hi - st.lo || 1;
  const X = (t: number) => x1 - ((now - t) / win) * (x1 - x0);
  const Y = (v: number) => y1 - ((v - st.lo) / span) * (y1 - y0);
  const bw = Math.max(3, ((BUCKET / win) * (x1 - x0)) / 1.7);

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.fillStyle = C.dim;
  ctx.font = `500 10px ${C.font}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (let i = 0; i < 4; i++) {
    const v = st.lo + (span * (i + 0.5)) / 4;
    const y = Math.round(Y(v)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.fillText(money(v), x1 + 8, y);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 - 2, 0, x1 - x0 + 6, h);
  ctx.clip();

  // Bodies collapse toward their close price as the morph runs.
  if (m < 0.995) {
    ctx.globalAlpha = 1 - m;
    for (const b of bars) {
      const cx = X(b.b * BUCKET + BUCKET / 2);
      const yc = Y(b.c);
      const col = b.c >= b.o ? C.up : C.down;
      const top = Y(Math.max(b.o, b.c));
      const bot = Y(Math.min(b.o, b.c));
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(cx) + 0.5, yc + (Y(b.h) - yc) * (1 - m));
      ctx.lineTo(Math.round(cx) + 0.5, yc + (Y(b.l) - yc) * (1 - m));
      ctx.stroke();
      const t2 = yc + (top - yc) * (1 - m);
      const b2 = yc + (bot - yc) * (1 - m);
      ctx.fillRect(cx - bw / 2, t2, bw, Math.max(1.5, b2 - t2));
    }
    ctx.globalAlpha = 1;
  }

  if (m > 0.005) {
    const p: P[] = bars.map((b) => [X(b.b * BUCKET + BUCKET / 2), Y(b.c)] as P);
    p.push([x1, Y(vis[vis.length - 1].v)]);
    ctx.globalAlpha = m;
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    trace(ctx, p, true);
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(p[p.length - 1][0], p[p.length - 1][1], 3.5, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

const MODES = [
  { id: "candle", label: "Bars" },
  { id: "line", label: "Line" },
] as const;

function MorphPair({ after }: Side) {
  const [mode, setMode] = useState<string>("candle");
  const st = useRef({ lo: 0, hi: 1, m: 0, ready: false });
  const feed = feedOf("ticks", TICKS);

  const draw = (f: Frame) => {
    drawCandles(f, st.current, feed.tick(f.now), 40000, mode === "line" ? 1 : 0, after);
  };

  return (
    <div className="space-y-3">
      <Segment options={MODES} value={mode} onChange={setMode} label="Chart type" />
      <Live draw={draw} label={`Live price chart shown as ${mode === "line" ? "a line" : "bars"}`} />
    </div>
  );
}

/* ── 11 · something is on screen while it waits ───────────────────── */

const WAIT_OPTS: Opts = {
  glide: true,
  grid: true,
  fill: true,
  badge: true,
  pulse: true,
  fmt: plain,
};

function WaitPair({ after }: Side) {
  const st = useRef<St>(newSt(20000));
  const until = useRef(0);
  const feed = feedOf("wait", CALM);

  const draw = (f: Frame) => {
    const pts = feed.tick(f.now);
    const loading = f.now < until.current;
    if (!after) {
      // The naive version has nothing to show until data lands.
      if (loading) return;
      st.current.m = 1;
      drawLine(f, WAIT_OPTS, st.current, pts, 20000, 1);
      return;
    }
    const k = 1 - 0.94 ** (f.dt / 16.67);
    st.current.m += ((loading ? 0 : 1) - st.current.m) * k;
    drawLine(f, WAIT_OPTS, st.current, pts, 20000, st.current.m);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          until.current = performance.now() + 1700;
          st.current.m = 0;
        }}
        className="text-ui-sm bg-secondary text-foreground duration-fast ease-out-quart hover:bg-muted inline-flex h-9 items-center gap-2 rounded-lg px-4 transition-colors"
      >
        <RotateCw aria-hidden="true" className="size-4" />
        Reconnect
      </button>
      <Live draw={draw} label="Live chart, reconnecting to the stream" />
    </div>
  );
}

/* ── 12 · sharp at any size ───────────────────────────────────────── */

function SizePair({ after }: Side) {
  const id = useId();
  const [pct, setPct] = useState(100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="text-ui-sm text-foreground">
          Panel width
        </label>
        <input
          id={id}
          type="range"
          min={35}
          max={100}
          step={1}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="accent-accent-solid h-9 w-44"
        />
        <span className="text-caption text-muted-foreground tabular-nums">{pct}%</span>
      </div>
      <div style={{ width: `${pct}%` }}>
        <LineChart
          id="calm"
          spec={CALM}
          win={22000}
          crisp={after}
          label={`Live chart at ${pct} percent of the panel width`}
          o={{ glide: true, grid: true, fill: true, badge: true, pulse: true, fmt: plain }}
        />
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function LivelineDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Now you can see the small moves instead of a flat line."
        before={<RangePair after={false} />}
        after={<RangePair after />}
      />
      <BeforeAfter
        principle="The line travels to the new number instead of teleporting to it."
        before={<GlidePair after={false} />}
        after={<GlidePair after />}
      />
      <BeforeAfter
        principle="The curve stops drawing peaks that never happened — the dots are the real readings."
        before={<PeakPair after={false} />}
        after={<PeakPair after />}
      />
      <BeforeAfter
        principle="You can tell what the heights are worth, not just the shape."
        before={<ScalePair after={false} />}
        after={<ScalePair after />}
      />
      <BeforeAfter
        principle="The current price rides the end of the line, so you never hunt for it."
        before={<BadgePair after={false} />}
        after={<BadgePair after />}
      />
      <BeforeAfter
        principle="Point anywhere on the chart to see what it was at that moment."
        before={<ScrubPair after={false} />}
        after={<ScrubPair after />}
      />
      <BeforeAfter
        principle="You can tell it is still live, and which way it is heading, without reading anything."
        before={<MomentumPair after={false} />}
        after={<MomentumPair after />}
      />
      <BeforeAfter
        principle="Switching the time range slides the chart instead of snapping it."
        before={<WindowPair after={false} />}
        after={<WindowPair after />}
      />
      <BeforeAfter
        principle="Hide one and the other one uses the whole height."
        before={<SeriesPair after={false} />}
        after={<SeriesPair after />}
      />
      <BeforeAfter
        principle="Switching between bars and the line keeps your place."
        before={<MorphPair after={false} />}
        after={<MorphPair after />}
      />
      <BeforeAfter
        principle="Press reconnect — there is something on screen while it waits for the first reading."
        before={<WaitPair after={false} />}
        after={<WaitPair after />}
      />
      <BeforeAfter
        principle="Drag it narrower: the chart stays sharp instead of turning into a smear."
        before={<SizePair after={false} />}
        after={<SizePair after />}
      />
    </div>
  );
}
