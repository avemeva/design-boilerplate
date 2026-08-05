"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { BeforeAfter, Tabs } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* ==================================================================== *
 * thinking-orbs 0.2.0, ported.
 *
 * The package is not installed here, so the engine below is a faithful
 * re-implementation of `dist/index.es.js`: all nine painters (orbits,
 * globe, rubik, wave, web, braid, ribbon/ring, morph), the base option
 * table, the two per-size preset tables and the count/radius scaling
 * rules that turn one painter into two separate designs at 64px and
 * 20px. Plain 2D canvas arcs, no filter, no WebGL, DPR capped at 2 —
 * the same choices the package makes.
 *
 * One deliberate departure. The package paints fixed monochrome greys
 * and decides light-or-dark itself from an ancestor `dark` class, so it
 * cannot follow this project's tokens. Here each dot's grey level is
 * folded into its alpha and the ink comes from the canvas's own
 * `currentColor` — which is exactly the difference the fourth switch
 * below puts on screen.
 * ==================================================================== */

/* ── math ─────────────────────────────────────────────────────────── */

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fract = (v: number) => v - Math.floor(v);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (v: number) => v * v * (3 - 2 * v);

function hash(x: number, y: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Smoothed value noise — drifts the constellation nodes. */
function noise2(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let fx = x - xi;
  let fy = y - yi;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Golden-angle spiral: evenly spread points, no clumping at the poles. */
function fibonacci(i: number, n: number): [number, number, number] {
  const inc = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (2 * (i + 0.5)) / n;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const a = i * inc;
  return [r * Math.cos(a), y, r * Math.sin(a)];
}

/** Shortest signed angle from b to a. */
const angleTo = (a: number, b: number) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Yaw then pitch, then flatten. Returns [x, y, depth-z]. */
function camera(
  yaw: number,
  pitch: number,
  cx: number,
  cy: number,
  scale: number,
) {
  const sp = Math.sin(pitch);
  const cp = Math.cos(pitch);
  const sy = Math.sin(yaw);
  const cw = Math.cos(yaw);
  return (x: number, y: number, z: number) => {
    const rx = x * cw + z * sy;
    const rz = -x * sy + z * cw;
    const ry = y * cp - rz * sp;
    return [cx + rx * scale, cy - ry * scale, y * sp + rz * cp] as const;
  };
}

/** Dot radius scales sub-linearly with the orb — that is why 20px is not 64px shrunk. */
const dotScale = (size: number, pow: number) => (size / 300) ** pow;

/* ── painting ─────────────────────────────────────────────────────── */

type Dot = { x: number; y: number; z: number; r: number; ink: number; a?: number };
type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ink: number;
  a: number;
  w: number;
};
type Opts = Record<string, number | undefined>;
type Painter = (
  ctx: CanvasRenderingContext2D,
  size: number,
  t: number,
  o: Opts,
) => void;

/**
 * The package writes each dot as a grey level, which on a white page is
 * the same as painting the page ink at `1 - level` alpha. Doing it as
 * alpha is what lets the ink stay a token.
 */
const weight = (ink: number) => 1 - clamp01(ink);

/** Back to front, so the far side of the sphere sits under the near side. */
function paintDots(ctx: CanvasRenderingContext2D, dots: Dot[], rMin = 0.3) {
  dots.sort((a, b) => a.z - b.z);
  for (const d of dots) {
    const a = d.a ?? 1;
    if (a < 0.02) continue;
    ctx.globalAlpha = Math.min(1, a * weight(d.ink));
    ctx.beginPath();
    ctx.arc(d.x, d.y, Math.max(rMin, d.r), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function paintLines(ctx: CanvasRenderingContext2D, lines: Line[]) {
  for (const l of lines) {
    if (l.a < 0.02) continue;
    ctx.globalAlpha = Math.min(1, l.a * weight(l.ink));
    ctx.lineWidth = l.w;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ── the nine painters ────────────────────────────────────────────── */

/** working — particles running tilted orbits inside a ghost cage. */
const orbits: Painter = (ctx, size, t, o) => {
  const c = size / 2;
  const r = (size / 2) * 0.82;
  const cam = camera(t * 0.12, 0.3, c, c, 1);
  const ds = dotScale(size, o.rsPow ?? 0.6);
  const dots: Dot[] = [];
  const rings = o.orbitN ?? 12;
  const ghosts = o.ghostN ?? 40;
  const particles = o.particles ?? 3;

  for (let i = 0; i < rings; i++) {
    const ha = hash(i, 1.7);
    const hb = hash(i, 5.2);
    const hc = hash(i, 8.9);
    const rad = r * (0.45 + 0.52 * ha);
    const az = ha * TAU;
    const pol = Math.acos(2 * hb - 1);
    const nx = Math.sin(pol) * Math.cos(az);
    const ny = Math.cos(pol);
    const nz = Math.sin(pol) * Math.sin(az);
    // Any two vectors in the orbit plane; the third is their cross product.
    let ux = -ny;
    let uy = nx;
    const uz = 0;
    const len = Math.max(1e-6, Math.hypot(ux, uy));
    ux /= len;
    uy /= len;
    const vx = ny * uz - nz * uy;
    const vy = nz * ux - nx * uz;
    const vz = nx * uy - ny * ux;
    const spin = (0.25 + 0.55 * hc) * (hc > 0.5 ? 1 : -1);

    for (let g = 0; g < ghosts; g++) {
      const a = (g / ghosts) * TAU;
      const [x, y, z] = cam(
        (ux * Math.cos(a) + vx * Math.sin(a)) * rad,
        (uy * Math.cos(a) + vy * Math.sin(a)) * rad,
        (uz * Math.cos(a) + vz * Math.sin(a)) * rad,
      );
      const depth = (z / rad + 1) / 2;
      dots.push({
        x,
        y,
        z,
        r: (o.ghostR ?? 0.9) * ds,
        ink: 0.72,
        a: (o.ghostA ?? 0.5) * (0.4 + 0.6 * depth),
      });
    }

    for (let p = 0; p < particles; p++) {
      const a = t * spin + (p / particles) * TAU + hb * 6;
      const [x, y, z] = cam(
        (ux * Math.cos(a) + vx * Math.sin(a)) * rad,
        (uy * Math.cos(a) + vy * Math.sin(a)) * rad,
        (uz * Math.cos(a) + vz * Math.sin(a)) * rad,
      );
      const depth = (z / rad + 1) / 2;
      dots.push({
        x,
        y,
        z,
        r: ((o.partR ?? 1.2) + (o.partRDepth ?? 1.6) * depth) * ds,
        ink: 0.3 - 0.22 * depth,
      });
    }
  }
  paintDots(ctx, dots, o.rMin);
};

/** searching — a scan meridian sweeps a dotted globe. */
const globe: Painter = (ctx, size, t, o) => {
  const c = size / 2;
  const r = (size / 2) * 0.82;
  const cam = camera(t * 0.5, 0.4 + 0.06 * Math.sin(t * 0.35), c, c, r);
  const scan = t * (0.5 + 1.2 * (o.scanMul ?? 1));
  const ds = dotScale(size, o.rsPow ?? 0.6);
  const dim = o.dimBase ?? 1;
  const dots: Dot[] = [];
  const rings = o.latRings ?? 17;
  const lon = o.lonDensity ?? 44;

  for (let i = 0; i <= rings; i++) {
    const lat = -Math.PI / 2 + (i / rings) * Math.PI;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    const n = Math.max(1, Math.round(Math.abs(cl) * lon));
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU;
      const [x, y, z] = cam(cl * Math.cos(a), sl, cl * Math.sin(a));
      const depth = (z + 1) / 2;
      const d = angleTo(a + t * 0.5, scan);
      const lit = Math.exp(-(d * d) / 0.18) * Math.max(0, z);
      dots.push({
        x,
        y,
        z,
        r:
          ((o.rBase ?? 0.6) +
            (o.rDepth ?? 1.7) * depth +
            (o.rBoost ?? 1) * lit) *
          ds,
        ink: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth,
        // dimBase < 1 fades the unscanned dots so the meridian reads.
        a: dim + (1 - dim) * Math.min(1, lit),
      });
    }
  }
  paintDots(ctx, dots, o.rMin);
};

/* rubik — quarter-turn layers scramble, then unwind in reverse. */

type Move = { axis: number; lo: number; hi: number; ang: number };

function moveList(n: number): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < n; i++) {
    const axis = Math.min(2, Math.floor(hash(i, 2.3) * 3));
    const lo = -1 + 0.5 * Math.min(3, Math.floor(hash(i, 5.9) * 4));
    const dir = hash(i, 7.7) < 0.5 ? 1 : -1;
    out.push({ axis, lo, hi: lo + 0.5, ang: (dir * Math.PI) / 2 });
  }
  return out;
}

/** How far each move has been applied at time t, and which one is moving. */
function schedule(t: number, n: number, per: number, gap: number) {
  const cycle = 2 * n * per + gap;
  const e = t % cycle;
  const amount = new Array<number>(n).fill(0);
  let active = -1;
  if (e < 2 * n * per) {
    const step = Math.floor(e / per);
    const f = (e - step * per) / per;
    const eased = 1 - (1 - Math.min(1, f / 0.7)) ** 3;
    if (step < n) {
      for (let i = 0; i < step; i++) amount[i] = 1;
      amount[step] = eased;
      active = step;
    } else {
      const back = 2 * n - 1 - step;
      for (let i = 0; i < back; i++) amount[i] = 1;
      amount[back] = 1 - eased;
      active = back;
    }
  }
  return { amount, active };
}

function applyMoves(
  p: [number, number, number],
  moves: Move[],
  s: { amount: number[]; active: number },
): [number, number, number, boolean] {
  let [x, y, z] = p;
  let moving = false;
  for (let i = 0; i < moves.length; i++) {
    if (s.amount[i] <= 0) continue;
    const m = moves[i];
    const coord = m.axis === 0 ? x : m.axis === 1 ? y : z;
    if (coord < m.lo || coord >= m.hi) continue;
    if (i === s.active) moving = true;
    const a = m.ang * s.amount[i];
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    if (m.axis === 0) {
      const ny = y * ca - z * sa;
      z = y * sa + z * ca;
      y = ny;
    } else if (m.axis === 1) {
      const nx = x * ca + z * sa;
      z = -x * sa + z * ca;
      x = nx;
    } else {
      const nx = x * ca - y * sa;
      y = x * sa + y * ca;
      x = nx;
    }
  }
  return [x, y, z, moving];
}

/** solving — bands scramble in quarter turns, then click back solved. */
const rubik: Painter = (ctx, size, t, o) => {
  const c = size / 2;
  const r = (size / 2) * 0.82;
  const cam = camera(t * 0.55, 0.35 + 0.1 * Math.sin(t * 0.9), c, c, r);
  const ds = dotScale(size, o.rsPow ?? 0.6);
  const count = o.moveCount ?? 14;
  const moves = moveList(count);
  const s = schedule(t, count, 0.42, 1.2);
  const dots: Dot[] = [];
  const rings = o.latRings ?? 15;
  const lon = o.lonDensity ?? 40;

  for (let i = 0; i <= rings; i++) {
    const lat = -Math.PI / 2 + (i / rings) * Math.PI;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    const n = Math.max(1, Math.round(Math.abs(cl) * lon));
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU;
      const [px, py, pz, moving] = applyMoves(
        [cl * Math.cos(a), sl, cl * Math.sin(a)],
        moves,
        s,
      );
      const [x, y, z] = cam(px, py, pz);
      const depth = (z + 1) / 2;
      dots.push({
        x,
        y,
        z,
        r:
          ((o.rBase ?? 0.6) +
            (o.rDepth ?? 1.7) * depth +
            (moving ? (o.rActive ?? 0.3) : 0)) *
          ds,
        ink:
          (o.inkFar ?? 0.62) -
          (o.inkSpan ?? 0.54) * depth -
          (moving ? 0.14 : 0),
      });
    }
  }
  paintDots(ctx, dots, o.rMin);
};

/** listening — a waveform rolls bottom to top through the latitude rings. */
const wave: Painter = (ctx, size, t, o) => {
  const c = size / 2;
  const r = (size / 2) * 0.874;
  const cam = camera(t * 0.18, 0.38, c, c, 1);
  const ds = dotScale(size, o.rsPow ?? 0.6);
  const dots: Dot[] = [];
  const rings = o.rings ?? 15;
  const lon = o.lonDensity ?? 40;

  for (let i = 0; i <= rings; i++) {
    const lat = -Math.PI / 2 + (i / rings) * Math.PI;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    const swell =
      0.62 * Math.sin(t * 2.1 - i * 0.52) + 0.38 * Math.sin(t * 1.27 + i * 0.83);
    const rr = r * (0.88 + 0.105 * swell);
    const n = Math.max(1, Math.round(Math.abs(cl) * lon));
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU;
      const [x, y, z] = cam(cl * Math.cos(a) * rr, sl * rr, cl * Math.sin(a) * rr);
      const depth = (z / r + 1) / 2;
      const crest = Math.max(0, swell);
      dots.push({
        x,
        y,
        z,
        r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth) * (1 + 0.4 * crest) * ds,
        ink: 0.66 - 0.56 * depth - 0.1 * crest,
      });
    }
  }
  paintDots(ctx, dots, o.rMin);
};

/** connecting — a constellation wires itself, packets running the edges. */
const web: Painter = (ctx, size, t, o) => {
  const c = size / 2;
  const r = (size / 2) * 0.8 * (o.spread ?? 1);
  const cam = camera(t * 0.12, 0.32, c, c, r);
  const ds = dotScale(size, o.rsPow ?? 0.6);
  const n = o.nodeN ?? 30;
  const thr = o.thr ?? 0.72;
  const nodeR = o.nodeR ?? 1.4;
  const nodeRDepth = o.nodeRDepth ?? 1.8;

  const nodes: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p = fibonacci(i, n);
    const x = p[0] + 0.3 * (noise2(i * 0.31 + 9, t * 0.24) - 0.5) * 2;
    const y = p[1] + 0.3 * (noise2(i * 0.53 + 27, t * 0.21) - 0.5) * 2;
    const z = p[2] + 0.3 * (noise2(i * 0.77 + 55, t * 0.27) - 0.5) * 2;
    const len = Math.max(1e-6, Math.hypot(x, y, z));
    nodes.push([x / len, y / len, z / len]);
  }

  const lines: Line[] = [];
  const dots: Dot[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(
        nodes[i][0] - nodes[j][0],
        nodes[i][1] - nodes[j][1],
        nodes[i][2] - nodes[j][2],
      );
      if (d >= thr) continue;
      const [ax, ay, az] = cam(...nodes[i]);
      const [bx, by, bz] = cam(...nodes[j]);
      const depth = ((az + bz) / 2 + 1) / 2;
      lines.push({
        x1: ax,
        y1: ay,
        x2: bx,
        y2: by,
        ink: 0.42,
        a: (1 - d / thr) * (0.3 + 0.55 * depth),
        w: Math.max(0.6, (o.lineW ?? 0.8) * ds),
      });
    }
  }

  for (let i = 0; i < n; i++) {
    const [x, y, z] = cam(...nodes[i]);
    const depth = (z + 1) / 2;
    const pulse = 1 + 0.25 * Math.sin(t * 1.4 + i * 2.7);
    dots.push({
      x,
      y,
      z,
      r: (nodeR + nodeRDepth * depth) * pulse * ds,
      ink: 0.55 - 0.45 * depth,
    });
  }

  const signals = o.signals ?? 5;
  for (let i = 0; i < signals; i++) {
    const tick = Math.floor(t * 0.55 + i * 7.31);
    const from = Math.floor(hash(tick, i * 3.1 + 1.7) * n);
    const to = Math.floor(hash(tick, i * 5.7 + 4.2) * n);
    if (from === to) continue;
    const f = fract(t * 0.55 + i * 7.31);
    const px = lerp(nodes[from][0], nodes[to][0], f);
    const py = lerp(nodes[from][1], nodes[to][1], f);
    const pz = lerp(nodes[from][2], nodes[to][2], f);
    const len = Math.max(1e-6, Math.hypot(px, py, pz));
    const [x, y, z] = cam(px / len, py / len, pz / len);
    const depth = (z + 1) / 2;
    dots.push({
      x,
      y,
      z,
      r: (nodeR * 1.5 + nodeRDepth * depth) * ds,
      ink: 0.05,
      a: 0.5 + 0.5 * depth,
    });
  }

  paintLines(ctx, lines);
  paintDots(ctx, dots, o.rMin);
};

/** weaving — three strands plait around the sphere. */
const braid: Painter = (ctx, size, t, o) => {
  const c = size / 2;
  const r = (size / 2) * 0.76;
  const cam = camera(t * 0.4, 0.3, c, c, 1);
  const ds = dotScale(size, o.rsPow ?? 0.6);
  const dots: Dot[] = [];
  const ghosts = o.ghostN ?? 150;

  for (let i = 0; i < ghosts; i++) {
    const p = fibonacci(i, ghosts);
    const [x, y, z] = cam(p[0] * r, p[1] * r, p[2] * r);
    dots.push({
      x,
      y,
      z,
      r: 0.8 * ds,
      ink: 0.78,
      a: 0.1 + 0.22 * ((z / r + 1) / 2),
    });
  }

  const per = o.strandN ?? 52;
  const turns = o.turns ?? 3;
  for (let s = 0; s < 3; s++) {
    const phase = (s / 3) * TAU;
    for (let i = 0; i < per; i++) {
      const u = (fract(i / per + t * 0.045) * 2 - 1) * 0.96;
      const ring = Math.sqrt(Math.max(0, 1 - u * u));
      const fade = Math.min(1, (1 - Math.abs(u)) / 0.1);
      const a = u * Math.PI * turns + phase;
      const puff =
        1 + 0.075 * Math.sin(u * Math.PI * turns * 2 + phase * 2 + t * 0.8);
      const rr = ring * r * puff;
      const [x, y, z] = cam(Math.cos(a) * rr, u * r * puff, Math.sin(a) * rr);
      const depth = (z / r + 1) / 2;
      dots.push({
        x,
        y,
        z,
        r: ((o.rBase ?? 1.2) + (o.rDepth ?? 1.8) * depth) * ds,
        ink: 0.55 - 0.45 * depth,
        a: fade * (0.45 + 0.55 * depth),
      });
    }
  }
  paintDots(ctx, dots, o.rMin);
};

/**
 * composing / breathing — an undulating multi-band sash.
 * `faceOn` cancels the camera tilt and moves the undulation onto the
 * radius, which turns the sash into the breathing ring.
 */
const ribbon: Painter = (ctx, size, t, o) => {
  const c = size / 2;
  const r = (size / 2) * 0.78;
  const spin = o.spin ?? 1;
  const pitch = 0.3;
  const cam = camera(t * 0.1 * spin, pitch, c, c, 1);
  const ds = dotScale(size, o.rsPow ?? 0.6);
  const dots: Dot[] = [];
  const ghosts = o.ghostN ?? 150;

  for (let i = 0; i < ghosts; i++) {
    const p = fibonacci(i, ghosts);
    const [x, y, z] = cam(p[0] * r, p[1] * r, p[2] * r);
    dots.push({
      x,
      y,
      z,
      r: 0.8 * ds,
      ink: 0.78,
      a: 0.1 + 0.22 * ((z / r + 1) / 2),
    });
  }

  const yaw = t * 0.24 * spin;
  const tilt = o.faceOn ? -pitch : 0.55 + 0.3 * Math.sin(t * 0.18) * spin;
  // Three orthogonal axes: the band circle lies in (ax, bx), offset along (cx).
  const a1 = Math.cos(yaw);
  const a2 = 0;
  const a3 = Math.sin(yaw);
  const b1 = -a3 * Math.sin(tilt);
  const b2 = Math.cos(tilt);
  const b3 = a1 * Math.sin(tilt);
  const c1 = a2 * b3 - a3 * b2;
  const c2 = a3 * b1 - a1 * b3;
  const c3 = a1 * b2 - a2 * b1;

  const wob = 0.23 * (o.wobMul ?? 1);
  const reach = o.faceOn ? r / (1 + 0.85 * wob) : r;
  const lanes = o.lanes ?? 5;
  const segs = o.segs ?? 88;
  const bands = Math.max(1, Math.round(lanes * (o.bandMul ?? 1)));

  for (let i = 0; i < bands; i++) {
    const off = (i - (bands - 1) / 2) * 0.075;
    const edge = Math.abs(i - (bands - 1) / 2) / Math.max(1, (bands - 1) / 2);
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * TAU;
      const undulate =
        (0.16 * Math.sin(a * 3 - t * 1.7 + i * 0.22) +
          0.07 * Math.sin(a * 5 + t * 1.1)) *
        (o.wobMul ?? 1);
      const grow = o.faceOn ? 1 + undulate : 1;
      const side = o.faceOn ? off : off + undulate;
      const vx = a1 * Math.cos(a) + b1 * Math.sin(a) + c1 * side;
      const vy = a2 * Math.cos(a) + b2 * Math.sin(a) + c2 * side;
      const vz = a3 * Math.cos(a) + b3 * Math.sin(a) + c3 * side;
      const len = Math.hypot(vx, vy, vz);
      const rr = reach * grow;
      const [x, y, z] = cam((vx / len) * rr, (vy / len) * rr, (vz / len) * rr);
      const depth = (z / r + 1) / 2;
      dots.push({
        x,
        y,
        z,
        r:
          ((o.rBase ?? 1.1) + (o.rDepth ?? 1.7) * depth) *
          (1 - 0.25 * edge) *
          ds,
        ink: 0.52 - 0.44 * depth + 0.18 * edge,
        a: 0.4 + 0.6 * depth,
      });
    }
  }
  paintDots(ctx, dots, o.rMin);
};

/* morph — a dotted outline walks circle → triangle → square. */

type Outline = (u: number) => [number, number];

/** Walk a closed polygon at constant speed, so dots stay evenly spaced. */
function polygon(points: [number, number][]): Outline {
  const n = points.length;
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push(d);
    total += d;
  }
  return (u) => {
    let want = u * total;
    let i = 0;
    while (want > seg[i] && i < n - 1) {
      want -= seg[i];
      i++;
    }
    const a = points[i];
    const b = points[(i + 1) % n];
    const f = seg[i] ? Math.min(1, want / seg[i]) : 0;
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  };
}

const circle: Outline = (u) => {
  const a = -Math.PI / 2 + u * TAU;
  return [Math.cos(a) * 0.24, Math.sin(a) * 0.24];
};
const triangle = polygon([
  [0, -0.26],
  [0.24, 0.16],
  [-0.24, 0.16],
]);
const square = polygon([
  [0, -0.2],
  [0.2, -0.2],
  [0.2, 0.2],
  [-0.2, 0.2],
  [-0.2, -0.2],
]);
const SHAPES: Outline[] = [circle, triangle, square];
const HOLD = 1.4;
const TWEEN = 0.9;

/** shaping — dotted outline: circle → triangle → square. */
const morph: Painter = (ctx, size, t, o) => {
  const cycle = HOLD + TWEEN;
  const span = cycle * SHAPES.length;
  const local0 = t % span;
  const index = Math.floor(local0 / cycle);
  const local = local0 - index * cycle;
  const mix = local > HOLD ? smoothstep((local - HOLD) / TWEEN) : 0;
  const spread = o.spread ?? 1;
  const from = SHAPES[index];
  const to = SHAPES[(index + 1) % SHAPES.length];

  const samples = 160;
  const path: [number, number][] = [];
  for (let i = 0; i < samples; i++) {
    const u = i / samples;
    const a = from(u);
    const b = to(u);
    path.push([
      (a[0] + (b[0] - a[0]) * mix) * spread,
      (a[1] + (b[1] - a[1]) * mix) * spread,
    ]);
  }

  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < samples; i++) {
    const a = path[i];
    const b = path[(i + 1) % samples];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push(d);
    total += d;
  }

  const n = Math.max(6, Math.round(34 * (o.iconD ?? 1)));
  const r = (o.rDot ?? 0.021) * 1.35 * spread;
  const breathe = 1 + 0.02 * Math.sin(local * 3.1);
  const dots: Dot[] = [];
  let cursor = 0;
  let walked = 0;
  for (let i = 0; i < n; i++) {
    const want = (i / n) * total;
    while (walked + seg[cursor] < want && cursor < samples - 1) {
      walked += seg[cursor];
      cursor++;
    }
    const a = path[cursor];
    const b = path[(cursor + 1) % samples];
    const f = seg[cursor] ? Math.min(1, (want - walked) / seg[cursor]) : 0;
    const x = (a[0] + (b[0] - a[0]) * f) * breathe;
    const y = (a[1] + (b[1] - a[1]) * f) * breathe;
    dots.push({
      x: size / 2 + x * size,
      y: size / 2 + y * size,
      z: 0,
      r: Math.max(0.35, r * size),
      ink: 0.1,
    });
  }
  paintDots(ctx, dots, o.rMin);
};

/* ── states, modes, presets ───────────────────────────────────────── */

const STATES = [
  "working",
  "searching",
  "solving",
  "listening",
  "connecting",
  "weaving",
  "composing",
  "breathing",
  "shaping",
] as const;
type OrbState = (typeof STATES)[number];
type ModeKey =
  | "orbits"
  | "globe"
  | "rubik"
  | "wave"
  | "web"
  | "braid"
  | "ribbon"
  | "ring"
  | "morph";
type OrbSize = 64 | 20;

const PAINTERS: Record<ModeKey, Painter> = {
  orbits,
  globe,
  rubik,
  wave,
  web,
  braid,
  ribbon,
  // ring shares ribbon's painter — the faceOn flag switches it.
  ring: ribbon,
  morph,
};

const STATE_TO_MODE: Record<OrbState, ModeKey> = {
  working: "orbits",
  searching: "globe",
  solving: "rubik",
  listening: "wave",
  connecting: "web",
  weaving: "braid",
  composing: "ribbon",
  breathing: "ring",
  shaping: "morph",
};

const LABEL: Record<OrbState, string> = {
  working: "Working…",
  searching: "Searching…",
  solving: "Solving…",
  listening: "Listening…",
  connecting: "Connecting…",
  weaving: "Weaving…",
  composing: "Composing…",
  breathing: "Thinking…",
  shaping: "Shaping…",
};

const BASE: Record<ModeKey, Opts> = {
  globe: {
    latRings: 17,
    lonDensity: 44,
    rBase: 0.6,
    rDepth: 1.7,
    rBoost: 1,
    inkFar: 0.62,
    inkSpan: 0.54,
    rsPow: 0.6,
    rMin: 0.3,
  },
  orbits: {
    orbitN: 12,
    ghostN: 40,
    ghostR: 0.9,
    ghostA: 0.5,
    particles: 3,
    partR: 1.2,
    partRDepth: 1.6,
    rsPow: 0.6,
    rMin: 0.3,
  },
  rubik: {
    latRings: 15,
    lonDensity: 40,
    moveCount: 14,
    rBase: 0.6,
    rDepth: 1.7,
    rActive: 0.3,
    inkFar: 0.62,
    inkSpan: 0.54,
    rsPow: 0.6,
    rMin: 0.3,
  },
  wave: {
    rings: 15,
    lonDensity: 40,
    rBase: 0.6,
    rDepth: 1.7,
    rsPow: 0.6,
    rMin: 0.3,
  },
  web: {
    nodeN: 30,
    thr: 0.72,
    signals: 5,
    nodeR: 1.4,
    nodeRDepth: 1.8,
    lineW: 0.8,
    rsPow: 0.6,
    rMin: 0.3,
  },
  braid: {
    strandN: 52,
    turns: 3,
    ghostN: 150,
    rBase: 1.2,
    rDepth: 1.8,
    rsPow: 0.6,
    rMin: 0.3,
  },
  ribbon: {
    lanes: 5,
    segs: 88,
    ghostN: 150,
    rBase: 1.1,
    rDepth: 1.7,
    rsPow: 0.6,
    rMin: 0.3,
  },
  ring: {
    lanes: 5,
    segs: 88,
    ghostN: 0,
    faceOn: 1,
    rBase: 1.1,
    rDepth: 1.7,
    rsPow: 0.6,
    rMin: 0.3,
  },
  morph: { rDot: 0.021, iconD: 1, rMin: 0.25 },
};

type SizeTune = {
  speed: number;
  count: number;
  size: number;
  extra?: Opts;
};

/**
 * The two shipped sizes, straight from the package. Read the 20 column
 * against the 64 one: a tenth of the dots, each up to twice as fat, at
 * a different speed. That is a second design, not a scale factor.
 */
const TUNE: Record<ModeKey, Record<OrbSize, SizeTune>> = {
  orbits: {
    64: { speed: 1.885, count: 1, size: 1 },
    20: { speed: 3.9, count: 0.238, size: 2.4 },
  },
  globe: {
    64: {
      speed: 2.015,
      count: 0.42,
      size: 1.15,
      extra: { scanMul: 4.08, dimBase: 0.45 },
    },
    20: {
      speed: 2.665,
      count: 0.105,
      size: 1.75,
      extra: { scanMul: 4.335, dimBase: 0.45 },
    },
  },
  rubik: {
    64: { speed: 1.82, count: 0.35, size: 1.05 },
    20: { speed: 1.95, count: 0.088, size: 1.9 },
  },
  wave: {
    64: { speed: 4.388, count: 0.341, size: 1 },
    20: { speed: 3.998, count: 0.105, size: 1.6 },
  },
  web: {
    64: { speed: 3.315, count: 1.35, size: 0.95 },
    20: { speed: 6.63, count: 0.25, size: 1.52 },
  },
  braid: {
    64: { speed: 1.625, count: 0.5, size: 1 },
    20: { speed: 2.75, count: 0.1125, size: 1.36 },
  },
  ribbon: {
    64: {
      speed: 2.34,
      count: 0.25,
      size: 0.85,
      extra: { spin: 0, bandMul: 3.9, wobMul: 1 },
    },
    20: {
      speed: 3.12,
      count: 0.051,
      size: 1.073,
      extra: { spin: 0, bandMul: 4.94, wobMul: 1 },
    },
  },
  ring: {
    64: {
      speed: 3.24,
      count: 0.25,
      size: 0.956,
      extra: { spin: 0, bandMul: 3.627, wobMul: 0.368 },
    },
    20: {
      speed: 3.78,
      count: 0.028,
      size: 1.622,
      extra: { spin: 0, bandMul: 3.968, wobMul: 0.565 },
    },
  },
  morph: {
    64: { speed: 2.405, count: 0.702, size: 0.395, extra: { spread: 1.45 } },
    20: { speed: 2.08, count: 0.53, size: 1.011, extra: { spread: 1.45 } },
  },
};

const GRID_PAIRS: [string, string][] = [
  ["latRings", "lonDensity"],
  ["rings", "lonDensity"],
  ["lanes", "segs"],
];
const COUNT_KEYS = ["orbitN", "ghostN", "nodeN", "strandN", "signals"];
const DENSITY_KEYS = ["iconD"];
const RADIUS_KEYS = [
  "rBase",
  "rDepth",
  "rActive",
  "rDot",
  "ghostR",
  "partR",
  "partRDepth",
  "nodeR",
  "nodeRDepth",
];

/** A grid loses dots on both axes, so each axis takes the square root. */
function scaleCount(o: Opts, f: number): Opts {
  const out = { ...o };
  const done = new Set<string>();
  const side = Math.sqrt(f);
  for (const [a, b] of GRID_PAIRS) {
    const va = out[a];
    const vb = out[b];
    if (va == null || vb == null || done.has(a) || done.has(b)) continue;
    out[a] = Math.max(2, Math.round(va * side));
    out[b] = Math.max(2, Math.round(vb * side));
    done.add(a);
    done.add(b);
  }
  for (const k of COUNT_KEYS) {
    const v = out[k];
    if (v == null || v === 0 || done.has(k)) continue;
    out[k] = Math.max(1, Math.round(v * f));
  }
  for (const k of DENSITY_KEYS) {
    const v = out[k];
    if (v != null) out[k] = Math.max(0.02, v * f);
  }
  return out;
}

function scaleRadius(o: Opts, m: number): Opts {
  const out = { ...o };
  for (const k of RADIUS_KEYS) {
    const v = out[k];
    if (v != null) out[k] = v * m;
  }
  return out;
}

const cache = new Map<string, { mode: ModeKey; speed: number; opts: Opts }>();

function resolvePreset(state: OrbState, size: OrbSize) {
  const key = `${state}-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const mode = STATE_TO_MODE[state];
  const tune = TUNE[mode][size];
  let opts = { ...BASE[mode] };
  if (tune.count !== 1) opts = scaleCount(opts, tune.count);
  if (tune.size !== 1) opts = scaleRadius(opts, tune.size);
  if (tune.extra) opts = { ...opts, ...tune.extra };
  const resolved = { mode, speed: tune.speed, opts };
  cache.set(key, resolved);
  return resolved;
}

/* ── the orb ──────────────────────────────────────────────────────── */

function subscribeStill(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** The real setting, honoured by every orb on this page. */
function useSystemStill() {
  return useSyncExternalStore(
    subscribeStill,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function Orb({
  state,
  size = 64,
  /** Which preset to paint, when it differs from the box it is shown in. */
  drawAt,
  /** `shared` is one wall clock for every orb; `own` restarts at mount. */
  clock = "shared",
  still = false,
  /** `page` resolves the ink from the document, `surface` from the orb's own box. */
  inkFrom = "surface",
  className,
}: {
  state: OrbState;
  size?: OrbSize;
  drawAt?: OrbSize;
  clock?: "shared" | "own";
  still?: boolean;
  inkFrom?: "surface" | "page";
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const preset = drawAt ?? size;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(preset * dpr);
    canvas.height = Math.round(preset * dpr);

    const { mode, speed, opts } = resolvePreset(state, preset);
    const paint = PAINTERS[mode];
    // `page` is what the package does: resolve one ink for the whole
    // document and use it everywhere, whatever the orb is sitting on.
    const source = inkFrom === "page" ? document.body : canvas;

    const render = (seconds: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, preset, preset);
      const ink = getComputedStyle(source).color;
      ctx.fillStyle = ink;
      ctx.strokeStyle = ink;
      paint(ctx, preset, seconds, opts);
    };

    if (still) {
      render(0.6);
      return;
    }

    const born = performance.now();
    let raf = 0;
    let running = false;
    const frame = () => {
      const now = performance.now();
      const elapsed = clock === "shared" ? now : now - born;
      render((elapsed / 1000) * speed);
      if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    frame();
    let onScreen = true;
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            if (onScreen && document.visibilityState !== "hidden") start();
            else stop();
          })
        : null;
    io?.observe(canvas);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else if (onScreen) start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!io) start();

    return () => {
      stop();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state, size, drawAt, clock, still, inkFrom]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={LABEL[state]}
      className={cn("block shrink-0", size === 64 ? "size-16" : "size-5", className)}
    />
  );
}

type Side = { side: "before" | "after" };

/* ── 1. one spinner, or nine ──────────────────────────────────────── */

const VERB_OPTIONS = STATES.map((s) => ({
  id: s,
  label: s[0].toUpperCase() + s.slice(1),
}));

function Verbs({ side }: Side) {
  const [state, setState] = useState<OrbState>("searching");
  const still = useSystemStill();

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <div className="bg-secondary grid h-32 place-items-center rounded-xl border sm:w-40">
        {side === "before" ? (
          <Spinner className="text-muted-foreground size-8" />
        ) : (
          <Orb state={state} size={64} still={still} />
        )}
      </div>
      <div className="space-y-3">
        <p className="text-ui">{LABEL[state]}</p>
        <Tabs options={VERB_OPTIONS} value={state} onChange={setState} />
      </div>
    </div>
  );
}

/* ── 2. the inline size ───────────────────────────────────────────── */

function Inline({ side }: Side) {
  const still = useSystemStill();
  const drawAt: OrbSize | undefined = side === "before" ? 64 : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Orb state="searching" size={64} still={still} />
        <div>
          <p className="text-ui">Reading the invoice table</p>
          <p className="text-caption text-muted-foreground">412 line items</p>
        </div>
      </div>
      <ul className="space-y-2 border-t pt-3">
        <li className="text-ui flex items-center gap-2">
          <Orb state="searching" size={20} drawAt={drawAt} still={still} />
          <span>Matching supplier names</span>
        </li>
        <li className="text-ui flex items-center gap-2">
          <Orb state="listening" size={20} drawAt={drawAt} still={still} />
          <span>Waiting for the bank to answer</span>
        </li>
      </ul>
    </div>
  );
}

/* ── 3. all on one clock ──────────────────────────────────────────── */

const READERS = ["Invoices", "Contracts", "Payroll", "Receipts"];

function Together({ side }: Side) {
  // Readers arrive one at a time, which is when a per-instance clock
  // shows its hand: each new orb starts its own beat.
  const [count, setCount] = useState(1);
  const [run, setRun] = useState(0);
  const still = useSystemStill();
  const clock = side === "before" ? "own" : "shared";

  return (
    <div className="space-y-3">
      <div className="bg-secondary flex flex-wrap gap-3 rounded-xl border p-3">
        {READERS.slice(0, count).map((name, i) => (
          <div key={`${run}-${i}`} className="w-20 space-y-1">
            <Orb
              state="listening"
              size={64}
              clock={clock}
              still={still}
              className="mx-auto"
            />
            <p className="text-caption text-muted-foreground text-center">
              {name}
            </p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          size="lg"
          variant="secondary"
          onClick={() => setCount((c) => Math.min(READERS.length, c + 1))}
          disabled={count === READERS.length}
        >
          Add a reader
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={() => {
            setCount(2);
            setRun((r) => r + 1);
          }}
        >
          Start over
        </Button>
      </div>
    </div>
  );
}

/* ── 4. the ink of whatever it sits on ────────────────────────────── */

function OnDark({ side }: Side) {
  const [running, setRunning] = useState(true);
  const still = useSystemStill();
  const inkFrom = side === "before" ? "page" : "surface";

  return (
    <div className="space-y-3">
      <div className="bg-secondary flex items-center gap-2.5 rounded-xl border p-3">
        <Orb state="working" size={20} inkFrom={inkFrom} still={still} />
        <span className="text-ui-sm text-muted-foreground">
          On the card, where it was designed
        </span>
      </div>
      <Button size="lg" onClick={() => setRunning((v) => !v)}>
        {running ? (
          <>
            <Orb state="working" size={20} inkFrom={inkFrom} still={still} />
            Stop the agent
          </>
        ) : (
          "Run the agent"
        )}
      </Button>
    </div>
  );
}

/* ── 5. when movement is turned off ───────────────────────────────── */

function Motion({ side }: Side) {
  const id = useId();
  const [reduced, setReduced] = useState(true);
  const system = useSystemStill();
  // The before side ignores the setting; both always honour the real one.
  const still = side === "after" ? reduced || system : system;

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <div className="bg-secondary grid h-32 place-items-center rounded-xl border sm:w-40">
        <Orb state="working" size={64} still={still} />
      </div>
      <div className="flex items-center gap-2.5">
        <Switch id={id} checked={reduced} onCheckedChange={setReduced} />
        <Label htmlFor={id}>Reduce motion</Label>
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export function ThinkingOrbsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="A busy indicator can tell you what it is busy with. When every step spins the same way, the only thing you learn is that it has not finished."
        before={<Verbs key="before" side="before" />}
        after={<Verbs key="after" side="after" />}
      />
      <BeforeAfter
        principle="A tiny indicator needs to be drawn small, not shrunk. Squeeze the big one down and the detail turns into a smudge you cannot read."
        before={<Inline key="before" side="before" />}
        after={<Inline key="after" side="after" />}
      />
      <BeforeAfter
        principle="When several things are working at once, they should move together. Out of step, the row twitches and keeps pulling your eye about."
        before={<Together key="before" side="before" />}
        after={<Together key="after" side="after" />}
      />
      <BeforeAfter
        principle="A busy dot has to show up on whatever it is sitting on. If it picks its colour from the page instead, it vanishes the moment you put it on a dark button."
        before={<OnDark key="before" side="before" />}
        after={<OnDark key="after" side="after" />}
      />
      <BeforeAfter
        principle="Some people feel ill when things move on a screen, so they turn animation off. Their indicator should hold still and still look like it is working."
        before={<Motion key="before" side="before" />}
        after={<Motion key="after" side="after" />}
      />
    </div>
  );
}
