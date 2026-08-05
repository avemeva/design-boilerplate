"use client";

import { useEffect, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * liveline — benji.org/liveline
 *
 * The package is not installed here (no "use client" banner in its
 * dist, and it paints to a canvas that no Tailwind token can reach),
 * so every chart below is a hand-rolled stand-in that behaves the way
 * the docs describe: one canvas, one requestAnimationFrame loop, a
 * frame-rate-independent lerp on value and on the Y range, monotone
 * splines, a badge riding the tip, crosshair scrubbing, a loading
 * morph, multi-series toggles and a candle/line morph.
 *
 * Each `before` is the same chart with exactly one of those decisions
 * taken back out — the chart you get if you ship the obvious thing.
 * Canvas has no class hooks, so the tokens are handed to it by name
 * and resolved to rgb through a 1x1 probe.
 * ------------------------------------------------------------------ */

/* ── tokens on canvas ───────────────────────────────────────────── */

type Paint = {
  ink: string;
  fg: string;
  mut: string;
  line: string;
  sunk: string;
  pos: string;
  neg: string;
  chip: string;
  chipFg: string;
  alt: string;
};

const SLOTS: [keyof Paint, string][] = [
  ["ink", "--accent-solid"],
  ["fg", "--foreground"],
  ["mut", "--muted-foreground"],
  ["line", "--border"],
  ["sunk", "--secondary"],
  ["pos", "--positive"],
  ["neg", "--destructive"],
  ["chip", "--feature"],
  ["chipFg", "--feature-foreground"],
  ["alt", "--chart-3"],
];

const rgbCache = new Map<string, string>();
let probe: CanvasRenderingContext2D | null = null;

function toRGB(css: string) {
  const hit = rgbCache.get(css);
  if (hit) return hit;
  if (!probe) {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    probe = c.getContext("2d", { willReadFrequently: true });
  }
  let out = "128,128,128";
  if (probe) {
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = css || "#888";
    probe.fillRect(0, 0, 1, 1);
    const d = probe.getImageData(0, 0, 1, 1).data;
    if (d[3] > 0) out = `${d[0]},${d[1]},${d[2]}`;
  }
  rgbCache.set(css, out);
  return out;
}

function readPaint(el: HTMLElement) {
  const s = getComputedStyle(el);
  const out = {} as Paint;
  for (const [k, v] of SLOTS) out[k] = toRGB(s.getPropertyValue(v).trim());
  return out;
}

const rgba = (c: string, alpha: number) => `rgba(${c},${alpha})`;

/* ── small maths ────────────────────────────────────────────────── */

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/** "Move k of the way every frame", made independent of frame length. */
const rate = (k: number, dt: number) => 1 - Math.pow(1 - k, dt / 16.67);

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type XY = { x: number; y: number };

/**
 * Tangents for a cubic hermite through the points. `monotone` is the
 * Fritsch–Carlson clamp the docs name: it cannot swing past a local
 * min or max. `catmull` is the same curve without the clamp, which is
 * what most smoothing helpers do — and it overshoots on a spike.
 */
function tangents(p: XY[], monotone: boolean) {
  const n = p.length;
  const d: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++)
    d[i] = (p[i + 1].y - p[i].y) / Math.max(0.001, p[i + 1].x - p[i].x);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = (d[i - 1] + d[i]) / 2;
  if (!monotone) return m;
  for (let i = 1; i < n - 1; i++) if (d[i - 1] * d[i] <= 0) m[i] = 0;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return m;
}

type Curve = "linear" | "monotone" | "catmull";

function tracePath(ctx: CanvasRenderingContext2D, p: XY[], curve: Curve) {
  if (p.length < 2) return;
  ctx.moveTo(p[0].x, p[0].y);
  if (curve === "linear" || p.length < 3) {
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
    return;
  }
  const m = tangents(p, curve === "monotone");
  for (let i = 0; i < p.length - 1; i++) {
    const dx = (p[i + 1].x - p[i].x) / 3;
    ctx.bezierCurveTo(
      p[i].x + dx,
      p[i].y + m[i] * dx,
      p[i + 1].x - dx,
      p[i + 1].y - m[i + 1] * dx,
      p[i + 1].x,
      p[i + 1].y,
    );
  }
}

function roundRect(
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

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-6))));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
}

const clockAt = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-GB", { hour12: false });

/* ── the feed ───────────────────────────────────────────────────── */

type Feed = {
  start: number;
  vol: number;
  lo: number;
  hi: number;
  /** [min, max] milliseconds between arrivals. */
  gap: [number, number];
  /** Bursts of packets with the occasional second of silence. */
  burst?: boolean;
  /** Every n-th arrival jumps to `spikeTo`, then falls straight back. */
  spikeEvery?: number;
  spikeTo?: number;
  /** Arrivals to hold at `spikeTo` — a step instead of a spike. */
  spikeHold?: number;
  /** Hold near `start` instead of wandering. */
  hold?: boolean;
};

/* ── the single-series chart ────────────────────────────────────── */

type Cfg = {
  feed: Feed;
  label: string;
  aria: string;
  windowMs?: number;
  /** Fraction of the remaining distance covered per frame. */
  lerp?: number;
  /** Repaint only when a packet lands — the declarative-chart default. */
  stepped?: boolean;
  curve?: Curve;
  /** `zero` anchors the axis at 0, `tight` is the exaggerated range,
   *  `fixed` is the hand-written domain that the data outgrows. */
  yMode?: "zero" | "auto" | "tight" | "fixed";
  fixedRange?: [number, number];
  /** Headroom above and below the data, as a fraction of its span. */
  padFrac?: number;
  /** Range grows the instant data leaves it, instead of easing there. */
  snap?: boolean;
  rangeLerp?: number;
  grid?: boolean;
  dots?: boolean;
  badge?: boolean;
  momentum?: boolean;
  pulse?: boolean;
  scrub?: boolean;
  reference?: { value: number; label: string };
  format?: (v: number) => string;
  headerValue?: boolean;
  /** `blank` shows nothing until data lands, `breathe` breathes. */
  loading?: "off" | "blank" | "breathe";
};

const LOAD_MS = 1900;
const MORPH_MS = 620;

function LiveChart(o: Cfg) {
  // Both sides of a switch sit in the same slot, so React keeps one
  // instance and swaps the props. The loop therefore reads its
  // settings live, every frame, and the chart changes without a blink.
  const cfg = useRef(o);
  cfg.current = o;
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const out = useRef<HTMLSpanElement>(null);
  const restart = useRef(0);

  useEffect(() => {
    const el = box.current;
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!el || !c || !ctx) return;

    const f = cfg.current.feed;
    const loading0 = cfg.current.loading ?? "off";

    let w = 0;
    let h = 0;
    let seen = 0;
    let onScreen = true;
    let paint = readPaint(el);
    let font = getComputedStyle(el).fontFamily || "system-ui, sans-serif";

    const st = {
      pts: [] as { t: number; v: number }[],
      target: f.start,
      drawn: f.start,
      last: performance.now(),
      lo: 0,
      hi: 1,
      ready: false,
      n: 0,
      holdLeft: 0,
      born: performance.now(),
      live: loading0 === "off",
      morph: loading0 === "off" ? 1 : 0,
      dir: 0,
      hover: null as number | null,
      seed: restart.current,
    };

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      w = el.clientWidth;
      h = el.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(el);

    const io = new IntersectionObserver(
      (e) => {
        onScreen = e[0]?.isIntersecting ?? true;
      },
      { rootMargin: "160px" },
    );
    io.observe(el);

    let timer = 0;
    const tick = () => {
      st.n++;
      const prev = st.target;
      if (f.spikeEvery && f.spikeTo !== undefined && st.n % f.spikeEvery === 0) {
        st.target = f.spikeTo;
        st.holdLeft = (f.spikeHold ?? 1) - 1;
      } else if (st.holdLeft > 0 && f.spikeTo !== undefined) {
        st.target = f.spikeTo;
        st.holdLeft--;
      } else if (f.hold)
        st.target = f.start + (Math.random() - 0.5) * f.vol;
      else
        st.target = clamp(
          st.target + (Math.random() - 0.5) * f.vol,
          f.lo,
          f.hi,
        );
      if (Math.abs(st.target - prev) > f.vol * 0.08)
        st.dir = st.target > prev ? 1 : -1;
      const now = performance.now();
      st.pts.push({ t: now, v: st.target });
      st.last = now;
      const wait =
        f.burst && Math.random() < 0.26
          ? 850 + Math.random() * 1000
          : f.gap[0] + Math.random() * (f.gap[1] - f.gap[0]);
      timer = window.setTimeout(tick, wait);
    };
    timer = window.setTimeout(tick, 120);

    const onMove = (e: PointerEvent) => {
      if (!cfg.current.scrub) return;
      st.hover = e.clientX - el.getBoundingClientRect().left;
    };
    const onLeave = () => {
      st.hover = null;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let prevT = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - prevT, 64);
      prevT = now;
      const q = cfg.current;
      const win = q.windowMs ?? 12000;
      const fmt = q.format ?? ((v: number) => v.toFixed(2));
      const curve: Curve = q.curve ?? "monotone";
      const yMode = q.yMode ?? "auto";
      const snap = q.snap ?? true;
      const rangeK = q.rangeLerp ?? 0.08;
      const lerpK = q.lerp ?? 0.1;
      const loading = q.loading ?? "off";
      if (seen++ % 40 === 0) {
        paint = readPaint(el);
        font = getComputedStyle(el).fontFamily || font;
      }

      if (restart.current !== st.seed) {
        st.seed = restart.current;
        st.born = now;
        st.live = false;
        st.morph = 0;
        st.pts = [];
        st.ready = false;
      }
      if (!st.live && now - st.born > LOAD_MS) st.live = true;
      if (st.live && st.morph < 1)
        st.morph = Math.min(1, st.morph + dt / MORPH_MS);

      st.drawn += (st.target - st.drawn) * rate(lerpK, dt);
      // The value is written straight to the node, like liveline's
      // overlay: sixty updates a second, no React render behind them.
      if (out.current) out.current.textContent = fmt(st.drawn);

      if (!onScreen || !w || !h) return;

      // Everything to the left of the window is off the canvas.
      while (st.pts.length > 2 && st.pts[1].t < now - win - 500) st.pts.shift();

      const padT = 14;
      const padB = q.grid ? 22 : 12;
      const padL = 10;
      const padR = q.badge ? 82 : q.grid ? 46 : 12;
      const plotW = Math.max(10, w - padL - padR);
      const plotH = Math.max(10, h - padT - padB);
      const right = padL + plotW;
      const bottom = padT + plotH;

      // In stepped mode the clock only advances when a packet lands.
      const head = q.stepped ? st.last : now;
      const tipV = q.stepped ? st.target : st.drawn;

      const vis = st.pts.filter((p) => p.t >= head - win);
      let lo = tipV;
      let hi = tipV;
      for (const p of vis) {
        if (p.v < lo) lo = p.v;
        if (p.v > hi) hi = p.v;
      }
      if (q.reference) {
        lo = Math.min(lo, q.reference.value);
        hi = Math.max(hi, q.reference.value);
      }
      let tLo: number;
      let tHi: number;
      if (yMode === "fixed" && q.fixedRange) {
        tLo = q.fixedRange[0];
        tHi = q.fixedRange[1];
      } else if (yMode === "zero") {
        tLo = 0;
        tHi = Math.max(hi * 1.15, 1);
      } else {
        const span = Math.max(hi - lo, Math.abs(hi) * 0.0005, 0.5);
        const pad = span * (q.padFrac ?? (yMode === "tight" ? 0.14 : 0.3));
        tLo = lo - pad;
        tHi = hi + pad;
      }
      if (!st.ready) {
        st.lo = tLo;
        st.hi = tHi;
        st.ready = true;
      } else {
        if (snap) {
          st.lo = Math.min(st.lo, tLo);
          st.hi = Math.max(st.hi, tHi);
        }
        const k = rate(rangeK, dt);
        st.lo += (tLo - st.lo) * k;
        st.hi += (tHi - st.hi) * k;
      }

      const span = Math.max(st.hi - st.lo, 1e-6);
      const X = (t: number) => right - ((head - t) / win) * plotW;
      const Yraw = (v: number) => bottom - ((v - st.lo) / span) * plotH;
      const mid = padT + plotH / 2;
      const m = easeOut(st.morph);
      const Y = (v: number) => mid + (Yraw(v) - mid) * m;

      ctx.clearRect(0, 0, w, h);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // Nothing at all while a plain chart waits for its first packet.
      if (!st.live && loading === "blank") return;

      if (!st.live && loading === "breathe") {
        const amp = plotH * 0.2;
        ctx.beginPath();
        for (let x = padL; x <= right; x += 4) {
          const p = (x - padL) / plotW;
          const y =
            mid +
            Math.sin(p * Math.PI * 2 - now / 420) *
              amp *
              Math.sin(p * Math.PI) *
              (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(now / 700)));
          if (x === padL) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(paint.ink, 0.55);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = `500 12px ${font}`;
        ctx.fillStyle = rgba(paint.mut, 1);
        ctx.textAlign = "center";
        ctx.fillText("Connecting…", padL + plotW / 2, bottom - 2);
        ctx.textAlign = "left";
        return;
      }

      // Grid: four gridlines on a round step, labels in the right pad.
      if (q.grid) {
        const step = niceStep(span / 4);
        ctx.font = `500 11px ${font}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (let v = Math.ceil(st.lo / step) * step; v < st.hi; v += step) {
          const y = Y(v);
          ctx.beginPath();
          ctx.moveTo(padL, y);
          ctx.lineTo(right, y);
          ctx.strokeStyle = rgba(paint.line, m);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = rgba(paint.mut, 0.85 * m);
          ctx.fillText(fmt(v), right + 8, y);
        }
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = rgba(paint.mut, 0.85 * m);
        const wall = Date.now() - (now - head);
        for (let i = 0; i <= 2; i++) {
          const t = head - win + (win / 2) * i;
          const label = clockAt(wall - (head - t));
          ctx.textAlign = i === 0 ? "left" : i === 2 ? "right" : "center";
          ctx.fillText(label, clamp(X(t), padL, right), h - 6);
        }
        ctx.textAlign = "left";
      }

      if (q.reference) {
        const y = Y(q.reference.value);
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(right, y);
        ctx.strokeStyle = rgba(paint.fg, 0.45 * m);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        ctx.font = `500 11px ${font}`;
        ctx.fillStyle = rgba(paint.fg, 0.75 * m);
        ctx.fillText(q.reference.label, padL + 2, y - 6);
      }

      const path: XY[] = vis.map((p) => ({ x: X(p.t), y: Y(p.v) }));
      path.push({ x: X(head), y: Y(tipV) });
      if (path.length < 2) return;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL - 1, padT - 1, plotW + 2, plotH + 2);
      ctx.clip();
      ctx.beginPath();
      tracePath(ctx, path, curve);
      ctx.strokeStyle = rgba(paint.ink, m);
      ctx.lineWidth = 2;
      ctx.stroke();

      if (q.dots) {
        ctx.fillStyle = rgba(paint.ink, 0.9 * m);
        for (const p of path.slice(0, -1)) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      const tip = path[path.length - 1];
      const upColor = st.dir >= 0 ? paint.pos : paint.neg;

      if (q.pulse) {
        const p = (now % 1500) / 1500;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 3 + p * 9, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(paint.ink, 0.35 * (1 - p) * m);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = rgba(q.momentum ? upColor : paint.ink, m);
      ctx.fill();

      if (q.badge) {
        const text = fmt(st.drawn);
        ctx.font = `500 12px ${font}`;
        const tw = ctx.measureText(text).width;
        const bw = tw + 18;
        const bh = 22;
        const bx = Math.min(tip.x + 12, w - bw - 4);
        const by = clamp(tip.y - bh / 2, 2, h - bh - 2);
        // The tail that points the pill back at the line.
        ctx.beginPath();
        ctx.moveTo(bx, clamp(tip.y, by + 6, by + bh - 6) - 5);
        ctx.lineTo(bx - 6, clamp(tip.y, by + 6, by + bh - 6));
        ctx.lineTo(bx, clamp(tip.y, by + 6, by + bh - 6) + 5);
        ctx.closePath();
        ctx.fillStyle = rgba(paint.chip, m);
        ctx.fill();
        roundRect(ctx, bx, by, bw, bh, 8);
        ctx.fillStyle = rgba(paint.chip, m);
        ctx.fill();
        ctx.fillStyle = rgba(paint.chipFg, m);
        ctx.textBaseline = "middle";
        ctx.fillText(text, bx + 9, by + bh / 2 + 0.5);
        ctx.textBaseline = "alphabetic";

        if (q.momentum) {
          const ax = bx - 14;
          const ay = by + bh / 2;
          const d = st.dir >= 0 ? -1 : 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay + d * 4);
          ctx.lineTo(ax - 4, ay - d * 3);
          ctx.lineTo(ax + 4, ay - d * 3);
          ctx.closePath();
          ctx.fillStyle = rgba(upColor, m);
          ctx.fill();
        }
      }

      if (q.scrub && st.hover !== null) {
        const hx = clamp(st.hover, padL, right);
        let best = path[0];
        for (const p of path) if (Math.abs(p.x - hx) < Math.abs(best.x - hx)) best = p;
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hx, padT);
        ctx.lineTo(hx, bottom);
        ctx.strokeStyle = rgba(paint.fg, 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(best.x, best.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = rgba(paint.sunk, 1);
        ctx.fill();
        ctx.strokeStyle = rgba(paint.ink, 1);
        ctx.lineWidth = 2;
        ctx.stroke();

        const value = st.lo + ((bottom - best.y) / plotH) * span;
        const at = clockAt(Date.now() - (head - (head - ((right - hx) / plotW) * win)));
        ctx.font = `500 12px ${font}`;
        const label = fmt(value);
        const lx = clamp(best.x, padL + 4, right - ctx.measureText(label).width - 4);
        ctx.lineWidth = 3;
        ctx.strokeStyle = rgba(paint.sunk, 0.9);
        ctx.strokeText(label, lx, Math.max(best.y - 12, padT + 10));
        ctx.fillStyle = rgba(paint.fg, 1);
        ctx.fillText(label, lx, Math.max(best.y - 12, padT + 10));
        ctx.font = `500 11px ${font}`;
        ctx.strokeText(at, lx, bottom - 4);
        ctx.fillStyle = rgba(paint.mut, 1);
        ctx.fillText(at, lx, bottom - 4);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [cfg]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <span className="text-ui-sm text-muted-foreground">{o.label}</span>
        {o.loading && o.loading !== "off" && (
          <button
            type="button"
            onClick={() => {
              restart.current += 1;
            }}
            className="bg-secondary text-ui-sm hover:bg-muted duration-fast ease-out-quart h-9 rounded-lg border px-3 transition-colors"
          >
            Reconnect
          </button>
        )}
        {o.headerValue && (
          <span
            ref={out}
            className="text-ui text-foreground ml-auto tabular-nums"
          >
            {(o.format ?? ((v: number) => v.toFixed(2)))(o.feed.start)}
          </span>
        )}
      </div>
      <div
        ref={box}
        className={cn(
          "bg-secondary h-44 overflow-hidden rounded-lg border",
          o.scrub && "cursor-crosshair",
        )}
        role="img"
        aria-label={o.aria}
      >
        <canvas ref={cv} className="block size-full" />
      </div>
    </div>
  );
}

/* ── two lines that can be switched off ─────────────────────────── */

type SeriesCfg = {
  /** The hidden line fades out and the axis re-ranges to what is left. */
  smooth: boolean;
};

const SERIES: {
  id: string;
  label: string;
  start: number;
  lo: number;
  hi: number;
}[] = [
  { id: "yes", label: "Yes", start: 74, lo: 62, hi: 88 },
  { id: "no", label: "No", start: 20, lo: 9, hi: 31 },
];

function SeriesChart({ smooth }: SeriesCfg) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const vis = useRef<Record<string, boolean>>({ yes: true, no: true });
  const [shown, setShown] = useState<Record<string, boolean>>({
    yes: true,
    no: true,
  });
  const mode = useRef(smooth);
  mode.current = smooth;

  useEffect(() => {
    const el = box.current;
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!el || !c || !ctx) return;

    const win = 14000;
    let w = 0;
    let h = 0;
    let seen = 0;
    let onScreen = true;
    let paint = readPaint(el);
    let font = getComputedStyle(el).fontFamily || "system-ui, sans-serif";

    const lines = SERIES.map((s) => ({
      id: s.id,
      lo: s.lo,
      hi: s.hi,
      target: s.start,
      drawn: s.start,
      alpha: 1,
      pts: [] as { t: number; v: number }[],
    }));
    let lo = 20;
    let hi = 80;
    let ready = false;

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      w = el.clientWidth;
      h = el.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(el);
    const io = new IntersectionObserver(
      (e) => {
        onScreen = e[0]?.isIntersecting ?? true;
      },
      { rootMargin: "160px" },
    );
    io.observe(el);

    let timer = 0;
    const tick = () => {
      const now = performance.now();
      for (const l of lines) {
        l.target = clamp(l.target + (Math.random() - 0.5) * 7, l.lo, l.hi);
        l.pts.push({ t: now, v: l.target });
      }
      timer = window.setTimeout(tick, 220 + Math.random() * 220);
    };
    timer = window.setTimeout(tick, 120);

    let raf = 0;
    let prevT = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - prevT, 64);
      prevT = now;
      if (seen++ % 40 === 0) {
        paint = readPaint(el);
        font = getComputedStyle(el).fontFamily || font;
      }
      const k = rate(0.1, dt);
      for (const l of lines) {
        l.drawn += (l.target - l.drawn) * k;
        const want = vis.current[l.id] ? 1 : 0;
        // Without the fade a line simply blinks out of existence.
        l.alpha = mode.current
          ? l.alpha + (want - l.alpha) * rate(0.14, dt)
          : want;
        while (l.pts.length > 2 && l.pts[1].t < now - win - 500) l.pts.shift();
      }
      if (!onScreen || !w || !h) return;

      const padT = 14;
      const padB = 12;
      const padL = 10;
      const padR = 52;
      const plotW = Math.max(10, w - padL - padR);
      const plotH = Math.max(10, h - padT - padB);
      const right = padL + plotW;
      const bottom = padT + plotH;

      let mn = Infinity;
      let mx = -Infinity;
      for (const l of lines) {
        // The whole point: a hidden line stops holding the axis open.
        if (mode.current && !vis.current[l.id]) continue;
        for (const p of l.pts) {
          if (p.t < now - win) continue;
          if (p.v < mn) mn = p.v;
          if (p.v > mx) mx = p.v;
        }
      }
      if (!isFinite(mn)) {
        mn = 40;
        mx = 60;
      }
      const pad = Math.max(mx - mn, 1) * 0.18;
      if (!ready) {
        lo = mn - pad;
        hi = mx + pad;
        ready = true;
      } else {
        lo = Math.min(lo, mn - pad);
        hi = Math.max(hi, mx + pad);
        const rk = rate(0.06, dt);
        lo += (mn - pad - lo) * rk;
        hi += (mx + pad - hi) * rk;
      }
      const span = Math.max(hi - lo, 1e-6);
      const X = (t: number) => right - ((now - t) / win) * plotW;
      const Y = (v: number) => bottom - ((v - lo) / span) * plotH;

      ctx.clearRect(0, 0, w, h);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const step = niceStep(span / 4);
      ctx.font = `500 11px ${font}`;
      ctx.textBaseline = "middle";
      for (let v = Math.ceil(lo / step) * step; v < hi; v += step) {
        const y = Y(v);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(right, y);
        ctx.strokeStyle = rgba(paint.line, 1);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = rgba(paint.mut, 0.85);
        ctx.fillText(`${v.toFixed(0)}%`, right + 8, y);
      }
      ctx.textBaseline = "alphabetic";

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL - 1, padT - 1, plotW + 2, plotH + 2);
      ctx.clip();
      lines.forEach((l, i) => {
        if (l.alpha < 0.01) return;
        const path = l.pts
          .filter((p) => p.t >= now - win)
          .map((p) => ({ x: X(p.t), y: Y(p.v) }));
        path.push({ x: right, y: Y(l.drawn) });
        if (path.length < 2) return;
        ctx.beginPath();
        tracePath(ctx, path, "monotone");
        ctx.strokeStyle = rgba(i === 0 ? paint.ink : paint.alt, l.alpha);
        ctx.lineWidth = 2;
        ctx.stroke();
        const tip = path[path.length - 1];
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = rgba(i === 0 ? paint.ink : paint.alt, l.alpha);
        ctx.fill();
      });
      ctx.restore();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        {SERIES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={shown[s.id]}
            onClick={() => {
              const next = { ...vis.current, [s.id]: !vis.current[s.id] };
              if (!next.yes && !next.no) return;
              vis.current = next;
              setShown(next);
            }}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart flex h-9 items-center gap-2 rounded-full border px-3.5 transition-colors",
              shown[s.id]
                ? "bg-secondary text-foreground"
                : "text-muted-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                i === 0 ? "bg-accent-solid" : "bg-chart-3",
                !shown[s.id] && "opacity-30",
              )}
            />
            {s.label}
          </button>
        ))}
        <span className="text-caption text-muted-foreground ml-auto">
          Will it close above 50?
        </span>
      </div>
      <div
        ref={box}
        className="bg-secondary h-44 overflow-hidden rounded-lg border"
        role="img"
        aria-label="Two live lines, Yes and No, each switchable from the chips above"
      >
        <canvas ref={cv} className="block size-full" />
      </div>
    </div>
  );
}

/* ── candles that become a line ─────────────────────────────────── */

const BUCKET = 2200;

function CandleChart({ morphing }: { morphing: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const want = useRef(0);
  const [line, setLine] = useState(false);
  const mode = useRef(morphing);
  mode.current = morphing;

  useEffect(() => {
    const el = box.current;
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!el || !c || !ctx) return;

    const win = 22000;
    let w = 0;
    let h = 0;
    let seen = 0;
    let onScreen = true;
    let paint = readPaint(el);
    let font = getComputedStyle(el).fontFamily || "system-ui, sans-serif";

    type Candle = { t: number; o: number; h: number; l: number; c: number };
    const candles: Candle[] = [];
    const ticks: { t: number; v: number }[] = [];
    let price = 118.4;
    let drawn = price;
    let live: Candle | null = null;
    let lo = 0;
    let hi = 1;
    let ready = false;
    let m = 0;

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      w = el.clientWidth;
      h = el.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(el);
    const io = new IntersectionObserver(
      (e) => {
        onScreen = e[0]?.isIntersecting ?? true;
      },
      { rootMargin: "160px" },
    );
    io.observe(el);

    let timer = 0;
    const tick = () => {
      const now = performance.now();
      price = clamp(price + (Math.random() - 0.5) * 1.5, 108, 130);
      ticks.push({ t: now, v: price });
      const slot = Math.floor(now / BUCKET) * BUCKET;
      if (!live || live.t !== slot) {
        if (live) candles.push(live);
        live = { t: slot, o: price, h: price, l: price, c: price };
      } else {
        live.h = Math.max(live.h, price);
        live.l = Math.min(live.l, price);
        live.c = price;
      }
      timer = window.setTimeout(tick, 110 + Math.random() * 90);
    };
    timer = window.setTimeout(tick, 60);

    let raf = 0;
    let prevT = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - prevT, 64);
      prevT = now;
      if (seen++ % 40 === 0) {
        paint = readPaint(el);
        font = getComputedStyle(el).fontFamily || font;
      }
      drawn += (price - drawn) * rate(0.1, dt);
      // Snap or morph: the same toggle, with and without the crossfade.
      m = mode.current
        ? m + (want.current - m) * rate(0.12, dt)
        : want.current;
      while (candles.length && candles[0].t < now - win - BUCKET)
        candles.shift();
      while (ticks.length > 2 && ticks[1].t < now - win - 500) ticks.shift();
      if (!onScreen || !w || !h) return;

      const padT = 14;
      const padB = 12;
      const padL = 10;
      const padR = 54;
      const plotW = Math.max(10, w - padL - padR);
      const plotH = Math.max(10, h - padT - padB);
      const right = padL + plotW;
      const bottom = padT + plotH;

      const all = live ? [...candles, live] : candles;
      let mn = Infinity;
      let mx = -Infinity;
      for (const k of all) {
        if (k.t < now - win) continue;
        mn = Math.min(mn, k.l);
        mx = Math.max(mx, k.h);
      }
      if (!isFinite(mn)) {
        mn = price - 2;
        mx = price + 2;
      }
      const pad = Math.max(mx - mn, 0.5) * 0.16;
      if (!ready) {
        lo = mn - pad;
        hi = mx + pad;
        ready = true;
      } else {
        lo = Math.min(lo, mn - pad);
        hi = Math.max(hi, mx + pad);
        const rk = rate(0.07, dt);
        lo += (mn - pad - lo) * rk;
        hi += (mx + pad - hi) * rk;
      }
      const span = Math.max(hi - lo, 1e-6);
      const X = (t: number) => right - ((now - t) / win) * plotW;
      const Y = (v: number) => bottom - ((v - lo) / span) * plotH;
      const money = (v: number) => `$${v.toFixed(2)}`;

      ctx.clearRect(0, 0, w, h);
      ctx.lineJoin = "round";
      ctx.lineCap = "butt";

      const step = niceStep(span / 4);
      ctx.font = `500 11px ${font}`;
      ctx.textBaseline = "middle";
      for (let v = Math.ceil(lo / step) * step; v < hi; v += step) {
        const y = Y(v);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(right, y);
        ctx.strokeStyle = rgba(paint.line, 1);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = rgba(paint.mut, 0.85);
        ctx.fillText(money(v), right + 8, y);
      }
      ctx.textBaseline = "alphabetic";

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL - 1, padT - 1, plotW + 2, plotH + 2);
      ctx.clip();

      // Candles: bodies collapse toward the close as the line takes over.
      if (m < 0.999) {
        const bw = Math.max(4, (BUCKET / win) * plotW * 0.62);
        for (const k of all) {
          if (k.t + BUCKET < now - win) continue;
          const x = X(k.t + BUCKET / 2);
          const up = k.c >= k.o;
          const col = up ? paint.pos : paint.neg;
          const yc = Y(k.c);
          const shrink = 1 - m;
          const yo = yc + (Y(k.o) - yc) * shrink;
          const yh = yc + (Y(k.h) - yc) * shrink;
          const yl = yc + (Y(k.l) - yc) * shrink;
          ctx.strokeStyle = rgba(col, 1 - m);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, yh);
          ctx.lineTo(x, yl);
          ctx.stroke();
          ctx.fillStyle = rgba(col, 1 - m);
          const top = Math.min(yo, yc);
          ctx.fillRect(
            x - (bw * (1 - m * 0.5)) / 2,
            top,
            bw * (1 - m * 0.5),
            Math.max(1.5, Math.abs(yc - yo)),
          );
        }
      }

      // Line: extends out from the middle of the chart as it arrives.
      if (m > 0.001) {
        const cx = padL + plotW / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx - (plotW / 2) * m, padT - 1, plotW * m, plotH + 2);
        ctx.clip();
        const path = ticks
          .filter((p) => p.t >= now - win)
          .map((p) => ({ x: X(p.t), y: Y(p.v) }));
        path.push({ x: right, y: Y(drawn) });
        if (path.length > 1) {
          ctx.beginPath();
          tracePath(ctx, path, "monotone");
          ctx.strokeStyle = rgba(paint.ink, m);
          ctx.lineWidth = 2;
          ctx.stroke();
          const tip = path[path.length - 1];
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = rgba(paint.ink, m);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <span className="text-ui-sm text-muted-foreground">SOL / USD</span>
        <div className="bg-secondary ml-auto flex gap-1 rounded-lg p-1">
          {[
            ["Candles", false],
            ["Line", true],
          ].map(([label, v]) => (
            <button
              key={String(label)}
              type="button"
              aria-pressed={line === v}
              onClick={() => {
                want.current = v ? 1 : 0;
                setLine(Boolean(v));
              }}
              className={cn(
                "text-ui-sm duration-fast ease-out-quart h-9 rounded-md px-3 transition-colors",
                line === v
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={box}
        className="bg-secondary h-44 overflow-hidden rounded-lg border"
        role="img"
        aria-label="Live price, switchable between candles and a line"
      >
        <canvas ref={cv} className="block size-full" />
      </div>
    </div>
  );
}

/* ── the feeds ──────────────────────────────────────────────────── */

const BURSTY: Feed = {
  start: 52,
  vol: 20,
  lo: 12,
  hi: 90,
  gap: [420, 620],
  burst: true,
};
const HEART: Feed = { start: 72, vol: 2.2, lo: 68, hi: 77, gap: [260, 380] };
const SPIKY: Feed = {
  start: 41,
  vol: 3,
  lo: 34,
  hi: 48,
  gap: [340, 420],
  hold: true,
  spikeEvery: 13,
  spikeTo: 96,
};
const STEPPY: Feed = {
  start: 0,
  vol: 0,
  lo: 0,
  hi: 0,
  gap: [430, 520],
  hold: true,
  spikeEvery: 9,
  spikeTo: 40,
  spikeHold: 4,
};
const PRICE: Feed = {
  start: 67432.1,
  vol: 90,
  lo: 66900,
  hi: 68100,
  gap: [180, 280],
};
const STEADY: Feed = { start: 58, vol: 9, lo: 24, hi: 88, gap: [200, 300] };
const TARGETED: Feed = { start: 66, vol: 11, lo: 48, hi: 88, gap: [220, 320] };

const money = (v: number) =>
  `$${v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/* ── the page ───────────────────────────────────────────────────── */

export function Liveline2Demo() {
  return (
    <div>
      <BeforeAfter
        principle="The chart keeps moving between packets instead of freezing and lurching."
        before={
          <LiveChart
            feed={BURSTY}
            label="Requests / sec"
            aria="Live chart that only redraws when a packet arrives"
            stepped
            lerp={1}
            curve="linear"
            headerValue
          />
        }
        after={
          <LiveChart
            feed={BURSTY}
            label="Requests / sec"
            aria="Live chart that keeps moving between packets"
            lerp={0.08}
            headerValue
          />
        }
      />

      <BeforeAfter
        principle="You can see the small changes now."
        before={
          <LiveChart
            feed={HEART}
            label="Heart rate"
            aria="Heart rate on an axis that starts at zero"
            yMode="zero"
            grid
            format={(v) => v.toFixed(0)}
          />
        }
        after={
          <LiveChart
            feed={HEART}
            label="Heart rate"
            aria="Heart rate on a tight axis"
            yMode="tight"
            grid
            format={(v) => v.toFixed(0)}
          />
        }
      />

      <BeforeAfter
        principle="A sudden jump does not get cut off the top."
        before={
          <LiveChart
            feed={SPIKY}
            label="Queue depth"
            aria="Live chart on a fixed axis that clips its spikes"
            yMode="fixed"
            fixedRange={[32, 52]}
            snap={false}
            grid
            format={(v) => v.toFixed(0)}
          />
        }
        after={
          <LiveChart
            feed={SPIKY}
            label="Queue depth"
            aria="Live chart whose axis makes room for a spike at once"
            snap
            rangeLerp={0.05}
            grid
            format={(v) => v.toFixed(0)}
          />
        }
      />

      <BeforeAfter
        principle="The line stops inventing dips that never happened."
        before={
          <LiveChart
            feed={STEPPY}
            label="Errors / min"
            aria="Smoothed line that swings past its own data points"
            curve="catmull"
            dots
            windowMs={14000}
            grid
            padFrac={0.14}
            format={(v) => v.toFixed(0)}
          />
        }
        after={
          <LiveChart
            feed={STEPPY}
            label="Errors / min"
            aria="Smoothed line that stays between its own data points"
            curve="monotone"
            dots
            windowMs={14000}
            grid
            padFrac={0.14}
            format={(v) => v.toFixed(0)}
          />
        }
      />

      <BeforeAfter
        principle="You can read the actual price off it."
        before={
          <LiveChart
            feed={PRICE}
            label="BTC / USD"
            aria="Price chart with no scale and an unformatted number"
            badge
            format={(v) => String(v)}
          />
        }
        after={
          <LiveChart
            feed={PRICE}
            label="BTC / USD"
            aria="Price chart with a labelled scale and formatted prices"
            badge
            grid
            format={money}
          />
        }
      />

      <BeforeAfter
        principle="The number rides along with the line and shows which way it is going."
        before={
          <LiveChart
            feed={STEADY}
            label="Active users"
            aria="Live chart with the value parked in the corner"
            headerValue
            format={(v) => v.toFixed(0)}
          />
        }
        after={
          <LiveChart
            feed={STEADY}
            label="Active users"
            aria="Live chart with the value riding the tip of the line"
            badge
            momentum
            pulse
            format={(v) => v.toFixed(0)}
          />
        }
      />

      <BeforeAfter
        principle="Point at any moment to see what it was."
        before={
          <LiveChart
            feed={STEADY}
            label="Latency (ms)"
            aria="Live chart that ignores the pointer"
            grid
            format={(v) => v.toFixed(0)}
          />
        }
        after={
          <LiveChart
            feed={STEADY}
            label="Latency (ms)"
            aria="Live chart with a crosshair that reads out the value under the pointer"
            grid
            scrub
            format={(v) => v.toFixed(0)}
          />
        }
      />

      <BeforeAfter
        principle="You can tell at a glance whether it is above target."
        before={
          <LiveChart
            feed={TARGETED}
            label="Delivery rate · target 70"
            aria="Live chart with the target written in the label only"
            grid
            badge
            format={(v) => v.toFixed(0)}
          />
        }
        after={
          <LiveChart
            feed={TARGETED}
            label="Delivery rate · target 70"
            aria="Live chart with the target drawn across it"
            grid
            badge
            reference={{ value: 70, label: "Target 70" }}
            format={(v) => v.toFixed(0)}
          />
        }
      />

      <BeforeAfter
        principle="While it is connecting you can tell it is working, not broken. Press Reconnect."
        before={
          <LiveChart
            feed={STEADY}
            label="Throughput"
            aria="Chart that shows an empty box until data arrives"
            loading="blank"
            grid
            badge
            format={(v) => v.toFixed(0)}
          />
        }
        after={
          <LiveChart
            feed={STEADY}
            label="Throughput"
            aria="Chart that breathes while connecting, then grows into the data"
            loading="breathe"
            grid
            badge
            format={(v) => v.toFixed(0)}
          />
        }
      />

      <BeforeAfter
        principle="Switch a line off and the rest of the chart fills the space."
        before={<SeriesChart smooth={false} />}
        after={<SeriesChart smooth />}
      />

      <BeforeAfter
        principle="Switching views does not lose your place."
        before={<CandleChart morphing={false} />}
        after={<CandleChart morphing />}
      />
    </div>
  );
}
