"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Three.js Collection — 19 drop-in components. Every page shows a
 * video and then "Login to get the source code", so nothing here is
 * copied: each switch below is the *idea* of one component, rebuilt
 * from the effect you can see in its preview.
 *
 * Fresnel Effect · Follow Cursor · Camera Rig · Float · Showcase
 * Podium · Pop In Animation · 3D Wave · 3D Image Carousel · Gravity
 * Center (with Mini Cubes, which does the same falloff).
 *
 * three.js is not installed, so a sphere is shaded by the fresnel term
 * itself rather than by a mesh, the cube is six CSS faces, and the
 * ring is a ring of real DOM cards.
 * ------------------------------------------------------------------ */

const TAU = Math.PI * 2;

/* ── the frame loop ───────────────────────────────────────────────── */

/**
 * A render loop whose callback is always the one from the latest
 * render. Pressing the switch swaps a prop, so the next frame draws
 * the other side instead of the whole scene being torn down.
 */
function useFrame(step: (now: number) => void) {
  const latest = useRef(step);

  useEffect(() => {
    latest.current = step;
  });

  useEffect(() => {
    let raf = requestAnimationFrame(function tick(now: number) {
      raf = requestAnimationFrame(tick);
      latest.current(now);
    });
    return () => cancelAnimationFrame(raf);
  }, []);
}

/* ── colour, borrowed from the page ───────────────────────────────── */

const TOKENS = ["--foreground", "--feature-foreground"] as const;

type TokenName = (typeof TOKENS)[number];
type Palette = Record<TokenName, (alpha?: number) => string>;

/**
 * The tokens are authored in oklch and a browser hands them back in
 * whatever colour space it fancies, so the conversion is left to the
 * one thing that always agrees with the page: paint a pixel, read it
 * back, keep the channels.
 */
function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const scratch = document.createElement("canvas");
  scratch.width = 1;
  scratch.height = 1;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });
  const out = {} as Palette;
  for (const name of TOKENS) {
    let rgb = "128, 128, 128";
    if (ctx) {
      ctx.globalCompositeOperation = "copy";
      ctx.fillStyle = "var(--muted-foreground)";
      ctx.fillStyle = cs.getPropertyValue(name).trim();
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      rgb = `${d[0]}, ${d[1]}, ${d[2]}`;
    }
    out[name] = (alpha = 1) => `rgba(${rgb}, ${alpha})`;
  }
  return out;
}

type Scene = {
  c: CanvasRenderingContext2D;
  w: number;
  h: number;
  now: number;
  p: Palette;
};

/** One canvas, sized to its box, cleared and handed the page's colours. */
function useCanvas(paint: (scene: Scene) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const paletteRef = useRef<{ theme: string; p: Palette } | null>(null);

  useFrame((now) => {
    const el = ref.current;
    if (!el) return;
    if (!ctxRef.current) ctxRef.current = el.getContext("2d");
    const c = ctxRef.current;
    if (!c) return;

    // read once, and again if the page changes theme under us
    const theme = document.documentElement.className;
    if (!paletteRef.current || paletteRef.current.theme !== theme) {
      paletteRef.current = { theme, p: readPalette(el) };
    }

    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w < 1 || h < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (el.width !== bw || el.height !== bh) {
      el.width = bw;
      el.height = bh;
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    paint({ c, w, h, now, p: paletteRef.current.p });
  });

  return ref;
}

/* ── the pointer, in 0..1 over whatever it is bound to ────────────── */

type Point = { x: number; y: number; on: number };

function usePointer(rest: { x: number; y: number } = { x: 0.5, y: 0.5 }) {
  const point = useRef<Point>({ ...rest, on: 0 });
  const bind = {
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      point.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
        on: 1,
      };
    },
    onPointerLeave: () => {
      point.current = { ...rest, on: 0 };
    },
  };
  return [point, bind] as const;
}

/** Damped follow — the whole of a follow-cursor rig, one line of it. */
function chase(cur: Point, to: Point, k: number) {
  cur.x += (to.x - cur.x) * k;
  cur.y += (to.y - cur.y) * k;
  cur.on += (to.on - cur.on) * k;
}

/** A short line of instruction. Never an explanation. */
function Hint({ children }: { children: string }) {
  return <p className="text-caption text-muted-foreground mt-3">{children}</p>;
}

/* ── 1 · Fresnel Effect ───────────────────────────────────────────── */

function FresnelPair({ after }: { after: boolean }) {
  const [point, bind] = usePointer();
  const eased = useRef<Point>({ x: 0.5, y: 0.5, on: 0 });

  const canvasRef = useCanvas(({ c, w, h, p }) => {
    chase(eased.current, point.current, 0.1);
    const radius = Math.min(w, h) * 0.34;
    const cx = radius + (w - 2 * radius) * eased.current.x;
    const cy = radius + (h - 2 * radius) * eased.current.y;
    const ink = p["--feature-foreground"];

    if (after) {
      // The fresnel term is pow(1 - dot(N, V), power). Looking straight
      // at a sphere, dot(N, V) is sqrt(1 - r²) — so the whole thing is a
      // function of radius, which is exactly what a radial gradient is.
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, radius);
      for (let i = 0; i <= 24; i++) {
        const r = i / 24;
        const facing = Math.sqrt(Math.max(0, 1 - r * r));
        g.addColorStop(r, ink(0.04 + 0.96 * (1 - facing) ** 3));
      }
      c.fillStyle = g;
    } else {
      c.fillStyle = ink(0.4);
    }

    c.beginPath();
    c.arc(cx, cy, radius, 0, TAU);
    c.fill();
  });

  return (
    <div>
      <div className="bg-feature h-60 overflow-hidden rounded-xl" {...bind}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={after ? "A ball lit around its edge" : "A flat pale disc"}
          className="block h-full w-full"
        />
      </div>
      <Hint>Move your pointer over the panel.</Hint>
    </div>
  );
}

/* ── 2 · Follow Cursor ────────────────────────────────────────────── */

const TRAIL = [
  { size: 14, k: 0.32, solid: true },
  { size: 30, k: 0.15, solid: false },
  { size: 46, k: 0.08, solid: false },
];

function CursorPair({ after }: { after: boolean }) {
  const [point, bind] = usePointer();
  const hostRef = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLDivElement | null)[]>([]);
  const at = useRef(TRAIL.map(() => ({ x: 0, y: 0, on: 0 })));

  useFrame(() => {
    const host = hostRef.current;
    if (!host) return;
    const r = host.getBoundingClientRect();
    const to = {
      x: point.current.x * r.width,
      y: point.current.y * r.height,
      on: point.current.on,
    };
    TRAIL.forEach((cfg, i) => {
      const cur = at.current[i];
      // before: every ring is pinned to the pointer, exactly, always
      chase(cur, to, after ? cfg.k : 1);
      const el = dots.current[i];
      if (!el) return;
      el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%)`;
    });
  });

  return (
    <div>
      <div
        ref={hostRef}
        className="bg-secondary relative h-60 touch-none overflow-hidden rounded-xl"
        {...bind}
      >
        {TRAIL.map((cfg, i) => (
          <div
            key={cfg.size}
            ref={(el) => {
              dots.current[i] = el;
            }}
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-0 left-0 rounded-full",
              cfg.solid ? "bg-foreground" : "border-foreground/35 border",
            )}
            style={{ width: cfg.size, height: cfg.size }}
          />
        ))}
      </div>
      <Hint>Move your pointer across the panel, then flick it.</Hint>
    </div>
  );
}

/* ── 3 · Camera Rig ───────────────────────────────────────────────── */

/** Deterministic scatter — the same sky on every render. */
function scatter(i: number, salt: number) {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/* Rounded, because a percentage carrying sixteen digits is serialised
   one way on the server and another in the browser. */
const SKY = Array.from({ length: 30 }, (_, i) => ({
  left: `${(6 + scatter(i, 1) * 88).toFixed(2)}%`,
  top: `${(8 + scatter(i, 2) * 74).toFixed(2)}%`,
  size: 2 + Math.round(scatter(i, 3) * 2),
}));

const SLABS = [
  { left: "12%", top: "44%", w: 74, h: 46 },
  { left: "62%", top: "34%", w: 96, h: 58 },
  { left: "40%", top: "62%", w: 58, h: 36 },
];

/** How far each layer travels. Before, everything shares the middle one. */
const DEPTH = [0.12, 0.45, 1];

function RigPair({ after }: { after: boolean }) {
  const [point, bind] = usePointer();
  const eased = useRef<Point>({ x: 0.5, y: 0.5, on: 0 });
  const layers = useRef<(HTMLDivElement | null)[]>([]);

  useFrame(() => {
    chase(eased.current, point.current, 0.09);
    const dx = (eased.current.x - 0.5) * 2;
    const dy = (eased.current.y - 0.5) * 2;
    layers.current.forEach((el, i) => {
      if (!el) return;
      const depth = after ? DEPTH[i] : DEPTH[1];
      const shift = after ? 46 : 20;
      const scale = after ? 1 + depth * 0.03 : 1;
      el.style.transform = `translate3d(${-dx * depth * shift}px, ${
        -dy * depth * shift * 0.6
      }px, 0) scale(${scale})`;
    });
  });

  return (
    <div>
      <div
        className="bg-secondary relative h-60 overflow-hidden rounded-xl"
        {...bind}
      >
        <div
          ref={(el) => {
            layers.current[0] = el;
          }}
          aria-hidden
          className="absolute inset-0"
        >
          {SKY.map((star) => (
            <span
              key={`${star.left}${star.top}`}
              className="bg-foreground/25 absolute rounded-full"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
              }}
            />
          ))}
        </div>

        <div
          ref={(el) => {
            layers.current[1] = el;
          }}
          aria-hidden
          className="absolute inset-0"
        >
          {SLABS.map((slab) => (
            <span
              key={slab.left}
              className="bg-card absolute rounded-lg border"
              style={{
                left: slab.left,
                top: slab.top,
                width: slab.w,
                height: slab.h,
              }}
            />
          ))}
        </div>

        <div
          ref={(el) => {
            layers.current[2] = el;
          }}
          className="absolute inset-0 grid place-items-center"
        >
          <div className="bg-card shadow-floating rounded-xl px-4 py-3">
            <p className="text-ui">Orbit</p>
            <p className="text-caption text-muted-foreground">Nine tracks</p>
          </div>
        </div>
      </div>
      <Hint>Move your pointer across the panel.</Hint>
    </div>
  );
}

/* ── 4 · Float ────────────────────────────────────────────────────── */

const FLOATERS = [
  { name: "Ceramic", period: 2100, amp: 8, phase: 0 },
  { name: "Basalt", period: 2750, amp: 11, phase: 2.1 },
  { name: "Chalk", period: 1780, amp: 6.5, phase: 3.9 },
];

function FloatPair({ after }: { after: boolean }) {
  const items = useRef<(HTMLDivElement | null)[]>([]);

  useFrame((now) => {
    FLOATERS.forEach((f, i) => {
      const el = items.current[i];
      if (!el) return;
      // before: one sine for all three, so the row drifts as a single sheet
      const period = after ? f.period : 2200;
      const amp = after ? f.amp : 8;
      const phase = after ? f.phase : 0;
      const y = Math.sin((now / period) * TAU + phase) * amp;
      const tilt = after
        ? Math.sin((now / (f.period * 1.7)) * TAU + phase) * 2.4
        : 0;
      el.style.transform = `translate3d(0, ${y}px, 0) rotate(${tilt}deg)`;
    });
  });

  return (
    <div className="bg-secondary grid h-60 grid-cols-3 items-center gap-3 rounded-xl px-4">
      {FLOATERS.map((f, i) => (
        <div
          key={f.name}
          ref={(el) => {
            items.current[i] = el;
          }}
          className="will-change-transform"
        >
          <div className="bg-card duration-fast ease-out-quart rounded-xl border p-3 transition-transform hover:scale-105">
            <div className="bg-foreground/85 mb-3 h-20 rounded-lg" />
            <p className="text-ui-sm truncate">{f.name}</p>
            <p className="text-caption text-muted-foreground">In stock</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 5 · Showcase Podium ──────────────────────────────────────────── */

const CUBE = 96;
const HALF = CUBE / 2;

const FACES = [
  { key: "front", t: `translateZ(${HALF}px)`, tone: "bg-foreground/85" },
  { key: "back", t: `rotateY(180deg) translateZ(${HALF}px)`, tone: "bg-foreground/85" },
  { key: "right", t: `rotateY(90deg) translateZ(${HALF}px)`, tone: "bg-foreground/95" },
  { key: "left", t: `rotateY(-90deg) translateZ(${HALF}px)`, tone: "bg-foreground/70" },
  { key: "top", t: `rotateX(90deg) translateZ(${HALF}px)`, tone: "bg-foreground/60" },
  { key: "bottom", t: `rotateX(-90deg) translateZ(${HALF}px)`, tone: "bg-foreground" },
];

function PodiumPair({ after }: { after: boolean }) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const spin = useRef({ angle: -28, drag: null as number | null });

  useFrame((now) => {
    const el = cubeRef.current;
    if (!el) return;
    if (spin.current.drag === null) spin.current.angle += 0.22;
    const lift = (Math.sin((now / 2600) * TAU) + 1) / 2;
    el.style.transform = `translateY(${-6 - lift * 10}px) rotateX(-16deg) rotateY(${
      spin.current.angle
    }deg)`;
    const shadow = shadowRef.current;
    if (!shadow) return;
    // the shadow tightens as the cube rises: that is what says "floor"
    shadow.style.transform = `translateX(-50%) scale(${1.06 - lift * 0.2})`;
    shadow.style.opacity = `${0.34 - lift * 0.1}`;
  });

  const grab = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    spin.current.drag = e.clientX;
  };
  const turn = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (spin.current.drag === null) return;
    spin.current.angle += (e.clientX - spin.current.drag) * 0.45;
    spin.current.drag = e.clientX;
  };
  const release = () => {
    spin.current.drag = null;
  };

  return (
    <div>
      <div
        className="bg-secondary relative h-64 touch-none overflow-hidden rounded-xl select-none"
        onPointerDown={grab}
        onPointerMove={turn}
        onPointerUp={release}
        onPointerCancel={release}
      >
        {after && (
          <>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(58% 46% at 50% 40%, var(--color-card) 0%, transparent 72%)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-24"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, var(--color-border))",
              }}
            />
          </>
        )}

        <div
          className="absolute inset-0 grid place-items-center"
          style={{ perspective: "760px" }}
        >
          <div className="relative">
            {after && (
              <div
                ref={shadowRef}
                aria-hidden
                className="bg-foreground absolute left-1/2 blur-lg"
                style={{
                  top: CUBE + 18,
                  width: CUBE * 1.5,
                  height: 20,
                  borderRadius: "50%",
                }}
              />
            )}
            <div
              ref={cubeRef}
              role="img"
              aria-label="A slowly turning cube"
              className="relative"
              style={{
                width: CUBE,
                height: CUBE,
                transformStyle: "preserve-3d",
              }}
            >
              {FACES.map((face) => (
                <div
                  key={face.key}
                  className={cn("absolute inset-0 rounded-xs", face.tone)}
                  style={{ transform: face.t }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <Hint>Drag sideways to spin it.</Hint>
    </div>
  );
}

/* ── 6 · Pop In Animation ─────────────────────────────────────────── */

const TILES = ["Atlas", "Beacon", "Cobalt", "Draft", "Ember", "Foxglove"];

function PopPair({ after }: { after: boolean }) {
  const [run, setRun] = useState(0);

  return (
    <div>
      <Button size="lg" variant="secondary" onClick={() => setRun((r) => r + 1)}>
        Play it again
      </Button>
      <div key={run} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TILES.map((tile, i) => (
          <motion.div
            key={tile}
            initial={{ opacity: 0, scale: after ? 0.96 : 1, y: after ? 14 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              after
                ? { delay: i * 0.06, duration: duration.slow, ease: ease.spring }
                : { duration: duration.slow, ease: "linear" }
            }
            className="bg-secondary rounded-xl border p-3"
          >
            <div className="bg-foreground/85 mb-3 aspect-video rounded-lg" />
            <p className="text-ui-sm truncate">{tile}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 7 · 3D Wave ──────────────────────────────────────────────────── */

const COLS = 26;
const ROWS = 13;
const REPEAT = 2800;

function WavePair({ after }: { after: boolean }) {
  const ripple = useRef({ x: 0.5, y: 0.6, t0: 0 });

  const canvasRef = useCanvas(({ c, w, h, now, p }) => {
    if (!ripple.current.t0 || now - ripple.current.t0 > REPEAT) {
      ripple.current = { ...ripple.current, t0: now };
    }
    const age = now - ripple.current.t0;
    const ox = ripple.current.x * w;
    const oy = ripple.current.y * h;
    // before: the whole sheet pumps at once and settles — a flash
    const flat = Math.sin(age * 0.011) * Math.exp(-age / 620) * 22;
    const front = age * 0.55;

    for (let row = 0; row < ROWS; row++) {
      const v = row / (ROWS - 1);
      const near = 0.55 + 0.45 * v;
      const baseY = h * (0.14 + 0.76 * v ** 1.3);
      c.beginPath();
      for (let col = 0; col < COLS; col++) {
        const u = col / (COLS - 1);
        const x = w / 2 + (u - 0.5) * w * 0.94 * near;
        let lift = flat;
        if (after) {
          // one wave packet, leaving where you touched and dying out
          const gap = Math.hypot(x - ox, baseY - oy) - front;
          lift =
            Math.sin(gap * 0.05) *
            Math.exp(-(gap * gap) / 7000) *
            Math.exp(-front / 460) *
            40;
        }
        const y = baseY - lift * near;
        if (col === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.strokeStyle = p["--foreground"](0.1 + 0.42 * v);
      c.lineWidth = 0.75 + v * 0.9;
      c.stroke();
    }
  });

  return (
    <div>
      <div
        className="bg-secondary h-60 touch-none overflow-hidden rounded-xl"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          ripple.current = {
            x: (e.clientX - r.left) / r.width,
            y: (e.clientY - r.top) / r.height,
            t0: performance.now(),
          };
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A grid of lines drawn as a surface"
          className="block h-full w-full"
        />
      </div>
      <Hint>Press anywhere on the surface.</Hint>
    </div>
  );
}

/* ── 8 · 3D Image Carousel ────────────────────────────────────────── */

const CARDS = ["Harbour", "Low tide", "Signal", "Coastline", "Drift", "Marram", "Quay"];
const STEP = 360 / CARDS.length;
const RING = 230;

function CarouselPair({ after }: { after: boolean }) {
  const [index, setIndex] = useState(0);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const turn = useRef({
    angle: 0,
    velocity: 0,
    target: 0 as number | null,
    grabX: null as number | null,
  });

  useFrame(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const t = turn.current;
    if (t.grabX === null) {
      if (t.target !== null) {
        t.angle += (t.target - t.angle) * 0.16;
      } else {
        t.angle += t.velocity;
        t.velocity *= 0.94;
        // once it has run out of push, settle on whichever card is nearest
        if (Math.abs(t.velocity) < 0.04) {
          t.velocity = 0;
          t.target = Math.round(t.angle / STEP) * STEP;
        }
      }
    }
    ring.style.transform = `translateZ(${-RING}px) rotateY(${t.angle}deg)`;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const facing = Math.cos(((t.angle + i * STEP) * TAU) / 360);
      el.style.opacity = `${0.18 + 0.82 * ((facing + 1) / 2) ** 2}`;
      el.style.zIndex = `${Math.round(facing * 10) + 10}`;
    });
  });

  const step = (dir: number) => {
    if (after) {
      const t = turn.current;
      const from = t.target ?? Math.round(t.angle / STEP) * STEP;
      t.target = from - dir * STEP;
      t.velocity = 0;
    } else {
      setIndex((i) => (i + dir + CARDS.length) % CARDS.length);
    }
  };

  const arrows = (
    <div className="mt-3 flex items-center gap-2">
      <Button
        size="icon-lg"
        variant="secondary"
        aria-label="Previous picture"
        onClick={() => step(-1)}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <Button
        size="icon-lg"
        variant="secondary"
        aria-label="Next picture"
        onClick={() => step(1)}
      >
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );

  if (!after) {
    return (
      <div>
        <div className="bg-secondary h-60 overflow-hidden rounded-xl p-6">
          <div className="mx-auto h-full w-44 overflow-hidden">
            <div
              className="duration-base ease-out-quart flex h-full transition-transform"
              style={{ transform: `translateX(${-index * 100}%)` }}
            >
              {CARDS.map((card) => (
                <div key={card} className="h-full w-full shrink-0">
                  <div className="bg-card flex h-full flex-col rounded-xl border p-3">
                    <div className="bg-foreground/85 flex-1 rounded-lg" />
                    <p className="text-ui-sm mt-3 truncate">{card}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {arrows}
      </div>
    );
  }

  return (
    <div>
      <div
        className="bg-secondary h-60 cursor-grab touch-none overflow-hidden rounded-xl select-none active:cursor-grabbing"
        style={{ perspective: "900px" }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          turn.current.grabX = e.clientX;
          turn.current.target = null;
          turn.current.velocity = 0;
        }}
        onPointerMove={(e) => {
          const t = turn.current;
          if (t.grabX === null) return;
          const delta = (e.clientX - t.grabX) * 0.32;
          t.angle += delta;
          t.velocity = delta;
          t.grabX = e.clientX;
        }}
        onPointerUp={() => {
          turn.current.grabX = null;
        }}
        onPointerCancel={() => {
          turn.current.grabX = null;
        }}
      >
        <div
          ref={ringRef}
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {CARDS.map((card, i) => (
            <div
              key={card}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute top-1/2 left-1/2 h-40 w-44"
              style={{
                marginTop: -80,
                marginLeft: -88,
                // the far half of the ring faces away; without this you
                // read its cards backwards through the front ones
                backfaceVisibility: "hidden",
                transform: `rotateY(${i * STEP}deg) translateZ(${RING}px)`,
              }}
            >
              <div className="bg-card flex h-full flex-col rounded-xl border p-3">
                <div className="bg-foreground/85 flex-1 rounded-lg" />
                <p className="text-ui-sm mt-3 truncate">{card}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {arrows}
      <Hint>Drag the ring sideways and let go.</Hint>
    </div>
  );
}

/* ── 9 · Gravity Center ───────────────────────────────────────────── */

const FIELD_X = 22;
const FIELD_Y = 12;

function GravityPair({ after }: { after: boolean }) {
  const [point, bind] = usePointer();
  const eased = useRef<Point>({ x: 0.5, y: 0.5, on: 0 });

  const canvasRef = useCanvas(({ c, w, h, p }) => {
    chase(eased.current, point.current, 0.12);
    const mx = eased.current.x * w;
    const my = eased.current.y * h;
    const on = eased.current.on;
    // before: one offset, applied to every dot in the field
    const flatX = (mx - w / 2) * 0.12 * on;
    const flatY = (my - h / 2) * 0.12 * on;

    for (let gx = 0; gx < FIELD_X; gx++) {
      for (let gy = 0; gy < FIELD_Y; gy++) {
        const bx = ((gx + 0.5) / FIELD_X) * w;
        const by = ((gy + 0.5) / FIELD_Y) * h;
        let x = bx + flatX;
        let y = by + flatY;
        let pull = 0;
        if (after) {
          const dx = mx - bx;
          const dy = my - by;
          const d = Math.hypot(dx, dy);
          pull = on / (1 + (d / 72) ** 2);
          x = bx + dx * pull * 0.55;
          y = by + dy * pull * 0.55;
        }
        c.beginPath();
        c.arc(x, y, 1.5 + pull * 2.6, 0, TAU);
        c.fillStyle = p["--foreground"](0.28 + pull * 0.55);
        c.fill();
      }
    }
  });

  return (
    <div>
      <div className="bg-secondary h-60 overflow-hidden rounded-xl" {...bind}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A field of small dots"
          className="block h-full w-full"
        />
      </div>
      <Hint>Move your pointer over the field.</Hint>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function ThreeJsCollectionFreePremiumThreeJsComponentsForDevDemo() {
  return (
    <div>
      <BeforeAfter
        principle="A ball should catch the light around its edge. Lit evenly all over it stops being a ball and turns into a sticker."
        before={<FresnelPair after={false} />}
        after={<FresnelPair after />}
      />
      <BeforeAfter
        principle="Something that follows your pointer should take a moment to catch up. Stuck to it exactly, it stops feeling like an object and starts feeling like part of the cursor."
        before={<CursorPair after={false} />}
        after={<CursorPair after />}
      />
      <BeforeAfter
        principle="When you move, near things should slide further than far things. That one difference turns a flat picture into somewhere you can look into."
        before={<RigPair after={false} />}
        after={<RigPair after />}
      />
      <BeforeAfter
        principle="Things sitting and waiting should drift a little, and never all together. Moving in perfect step, three objects read as one sheet sliding about."
        before={<FloatPair after={false} />}
        after={<FloatPair after />}
      />
      <BeforeAfter
        principle="Put light and a shadow under an object and it lands on a floor. Without them you cannot tell how big it is or where it is standing."
        before={<PodiumPair after={false} />}
        after={<PodiumPair after />}
      />
      <BeforeAfter
        principle="Things should arrive one after another, each landing with a small overshoot. All at once is a jump cut and nobody sees where anything came from."
        before={<PopPair after={false} />}
        after={<PopPair after />}
      />
      <BeforeAfter
        principle="Touch a surface and the dent should travel out from the spot you touched and fade. A surface that shudders all over tells you nothing about what you did."
        before={<WavePair after={false} />}
        after={<WavePair after />}
      />
      <BeforeAfter
        principle="You should be able to grab a row of pictures and swing it, and see the ones waiting either side. One at a time behind arrows hides how many there are."
        before={<CarouselPair after={false} />}
        after={<CarouselPair after />}
      />
      <BeforeAfter
        principle="Only the things near your pointer should notice it, and the nearer they are the more they should move. When a whole field reacts at once, nothing feels like it is under your hand."
        before={<GravityPair after={false} />}
        after={<GravityPair after />}
      />
    </div>
  );
}
