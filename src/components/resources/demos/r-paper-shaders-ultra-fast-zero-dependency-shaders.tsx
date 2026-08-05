"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bookmark, BookmarkCheck, Disc3, Music4, Shuffle } from "lucide-react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * @paper-design/shaders-react is not installed here, so every panel below is
 * the same technique by hand: a full-screen triangle, one fragment shader,
 * and the library's own prop vocabulary as uniforms — speed, frame, colors,
 * colorBack, grainOverlay, scale, offsetX/offsetY, fit, minPixelRatio.
 *
 * One WebGL context is shared by every canvas on the page. Each frame the
 * shared drawing buffer is rendered at the target's size and blitted into
 * that target's 2D context, so nine live panels cost one context instead of
 * nine.
 * ---------------------------------------------------------------------- */

type RGB = [number, number, number];

let probeCtx: CanvasRenderingContext2D | null = null;
const colorCache = new Map<string, RGB>();
let themeKey = "";

/** Resolve a CSS custom property name or any CSS color string to linear 0–1 RGB. */
function resolveColor(spec: string): RGB {
  const key = document.documentElement.className;
  if (key !== themeKey) {
    themeKey = key;
    colorCache.clear();
  }
  const hit = colorCache.get(spec);
  if (hit) return hit;
  if (!probeCtx) {
    const probe = document.createElement("canvas");
    probe.width = 1;
    probe.height = 1;
    probeCtx = probe.getContext("2d", { willReadFrequently: true });
  }
  const value = spec.startsWith("--")
    ? getComputedStyle(document.documentElement).getPropertyValue(spec).trim()
    : spec;
  let out: RGB = [0.5, 0.5, 0.5];
  if (probeCtx && value) {
    probeCtx.fillStyle = "var(--muted-foreground)";
    probeCtx.fillStyle = value;
    probeCtx.fillRect(0, 0, 1, 1);
    const d = probeCtx.getImageData(0, 0, 1, 1).data;
    out = [d[0] / 255, d[1] / 255, d[2] / 255];
  }
  colorCache.set(spec, out);
  return out;
}

/* ------------------------------- shaders ------------------------------- */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const LIB = `precision highp float;
uniform vec2 u_res;
uniform float u_t;
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
`;

/** MeshGradient / GrainGradient: colour spots blended under a soft warp. */
const FRAG_MESH =
  LIB +
  `uniform vec3 u_c0;uniform vec3 u_c1;uniform vec3 u_c2;uniform vec3 u_c3;uniform vec3 u_bg;
uniform float u_grain;uniform float u_steps;uniform float u_zoom;uniform float u_seed;
float spot(vec2 uv,vec2 c,float r){vec2 d=uv-c;return exp(-dot(d,d)/r);}
void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*u_res)/u_res.y/u_zoom;
  uv+=0.10*vec2(sin(uv.y*2.4+u_t*0.5),cos(uv.x*2.1-u_t*0.42));
  float s=u_seed;
  float w0=spot(uv,vec2(sin(u_t*0.31+s)*0.66,cos(u_t*0.27+s)*0.30),0.30);
  float w1=spot(uv,vec2(cos(u_t*0.23+s*1.7)*0.72,sin(u_t*0.35+s)*0.28),0.22);
  float w2=spot(uv,vec2(sin(u_t*0.41+s*2.3+2.0)*0.58,cos(u_t*0.19+s+1.0)*0.34),0.18);
  float w3=spot(uv,vec2(cos(u_t*0.29+s*3.1+4.0)*0.50,sin(u_t*0.44+s+3.0)*0.32),0.34);
  float sum=w0+w1+w2+w3+0.0001;
  vec3 col=(u_c0*w0+u_c1*w1+u_c2*w2+u_c3*w3)/sum;
  col=mix(u_bg,col,clamp(sum*1.5,0.0,1.0));
  float n=hash21(gl_FragCoord.xy+floor(u_t*20.0))-0.5;
  float levels=max(u_steps,1.0);
  col=floor(col*levels+n*u_grain+0.5)/levels;
  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

/** Halftone Dots: a hard-edged grid, the pattern that punishes low resolution. */
const FRAG_DOTS =
  LIB +
  `uniform vec3 u_ink;uniform vec3 u_bg;uniform float u_cells;
void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*u_res)/u_res.y;
  float ca=cos(0.5236),sa=sin(0.5236);
  vec2 r=vec2(uv.x*ca-uv.y*sa,uv.x*sa+uv.y*ca);
  float f=0.5+0.5*sin(uv.x*3.4+u_t*0.45)*cos(uv.y*2.6-u_t*0.33);
  f=clamp(f*1.2,0.0,1.0);
  vec2 g=fract(r*u_cells)-0.5;
  float d=length(g);
  float px=0.8*u_cells/u_res.y;
  float m=smoothstep(f*0.52+px,f*0.52-px,d);
  gl_FragColor=vec4(mix(u_bg,u_ink,m),1.0);
}`;

/** Swirl: bands twisting around a centre — the framing (scale / offset) demo. */
const FRAG_SWIRL =
  LIB +
  `uniform vec3 u_c0;uniform vec3 u_c1;uniform vec3 u_bg;
uniform float u_zoom;uniform float u_ox;uniform float u_oy;uniform float u_bands;uniform float u_twist;
void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*u_res)/u_res.y;
  uv=uv/u_zoom-vec2(u_ox,u_oy);
  float l=length(uv);
  float a=atan(uv.y,uv.x)+u_twist*4.0*l+u_t*0.22;
  float v=sin(a*u_bands-l*7.0);
  vec3 col=mix(u_c0,u_c1,smoothstep(-0.35,0.35,v));
  col=mix(col,u_bg,0.14*smoothstep(0.0,1.4,l));
  gl_FragColor=vec4(col,1.0);
}`;

/** A fixed-aspect artwork placed by `fit: contain` or `fit: cover`. */
const FRAG_FIT =
  LIB +
  `uniform vec3 u_c0;uniform vec3 u_c1;uniform vec3 u_bg;
uniform vec2 u_world;uniform float u_cover;
void main(){
  float k=u_cover>0.5
    ? max(u_res.x/u_world.x,u_res.y/u_world.y)
    : min(u_res.x/u_world.x,u_res.y/u_world.y);
  vec2 uv=(gl_FragCoord.xy-0.5*u_res)/(k*u_world.y);
  float hx=0.5*u_world.x/u_world.y;
  if(abs(uv.x)>hx||abs(uv.y)>0.5){gl_FragColor=vec4(u_bg,1.0);return;}
  float l=length(uv*vec2(1.25,1.0));
  float rings=0.5+0.5*sin(l*34.0-u_t*0.55);
  vec3 col=mix(u_c0,u_c1,smoothstep(0.2,0.8,rings));
  col=mix(u_c1,col,smoothstep(0.06,0.34,l));
  col=mix(col,u_c0,smoothstep(0.38,0.62,l));
  gl_FragColor=vec4(col,1.0);
}`;

/* ------------------------------ renderer ------------------------------- */

type Cfg = {
  frag: string;
  numbers: Record<string, number | number[]>;
  colors: Record<string, string>;
  speed: number;
  frame: number;
  ratio: number;
  ignoreReduce: boolean;
};

type Entry = { get: () => Cfg; ctx: CanvasRenderingContext2D | null };
type Program = { prog: WebGLProgram; locs: Map<string, WebGLUniformLocation | null> };

const targets = new Map<HTMLCanvasElement, Entry>();
const programs = new Map<string, Program>();
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedGl: WebGLRenderingContext | null = null;
let rafId = 0;
let clockStart = 0;
let reduceQuery: MediaQueryList | null = null;

function ensureGl() {
  if (sharedGl) return sharedGl;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  sharedCanvas = canvas;
  sharedGl = gl;
  return gl;
}

function getProgram(gl: WebGLRenderingContext, frag: string): Program {
  const cached = programs.get(frag);
  if (cached) return cached;
  const prog = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VERT],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    gl.attachShader(prog, shader);
  }
  gl.bindAttribLocation(prog, 0, "p");
  gl.linkProgram(prog);
  const record: Program = { prog, locs: new Map() };
  programs.set(frag, record);
  return record;
}

function setUniform(
  gl: WebGLRenderingContext,
  record: Program,
  name: string,
  value: number | number[],
) {
  let loc = record.locs.get(name);
  if (loc === undefined) {
    loc = gl.getUniformLocation(record.prog, name);
    record.locs.set(name, loc);
  }
  if (!loc) return;
  if (typeof value === "number") gl.uniform1f(loc, value);
  else if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
  else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
}

function frameLoop(now: number) {
  rafId = requestAnimationFrame(frameLoop);
  const gl = sharedGl;
  const shared = sharedCanvas;
  if (!gl || !shared) return;
  if (clockStart === 0) clockStart = now;
  const elapsed = (now - clockStart) / 1000;
  const reduced = reduceQuery ? reduceQuery.matches : false;

  targets.forEach((entry, canvas) => {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (cssW < 2 || cssH < 2) return;
    const cfg = entry.get();
    const w = Math.max(2, Math.round(cssW * cfg.ratio));
    const h = Math.max(2, Math.round(cssH * cfg.ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (shared.width < w) shared.width = w;
    if (shared.height < h) shared.height = h;

    const speed = reduced && !cfg.ignoreReduce ? 0 : cfg.speed;
    const t = speed === 0 ? cfg.frame / 1000 : (cfg.frame + elapsed * 1000 * speed) / 1000;

    const record = getProgram(gl, cfg.frag);
    gl.useProgram(record.prog);
    gl.viewport(0, 0, w, h);
    setUniform(gl, record, "u_res", [w, h]);
    setUniform(gl, record, "u_t", t);
    for (const key in cfg.numbers) setUniform(gl, record, key, cfg.numbers[key]);
    for (const key in cfg.colors) setUniform(gl, record, key, resolveColor(cfg.colors[key]));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const ctx = entry.ctx ?? (entry.ctx = canvas.getContext("2d"));
    if (ctx) ctx.drawImage(shared, 0, shared.height - h, w, h, 0, 0, w, h);
  });
}

function register(canvas: HTMLCanvasElement, get: () => Cfg) {
  if (!ensureGl()) return;
  if (!reduceQuery && typeof window !== "undefined") {
    reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  targets.set(canvas, { get, ctx: null });
  if (!rafId) rafId = requestAnimationFrame(frameLoop);
}

function unregister(canvas: HTMLCanvasElement) {
  targets.delete(canvas);
  if (targets.size === 0 && rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

/* ------------------------------ component ------------------------------ */

function Shader({
  frag,
  numbers = {},
  colors = {},
  speed = 1,
  frame = 0,
  ratio = 2,
  ignoreReduce = false,
  className,
}: {
  frag: string;
  numbers?: Record<string, number | number[]>;
  colors?: Record<string, string>;
  /** speed=0 stops the loop; frame alone then defines the image. */
  speed?: number;
  frame?: number;
  /** The library's minPixelRatio. 2 renders at double resolution. */
  ratio?: number;
  ignoreReduce?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cfg = useRef<Cfg>({ frag, numbers, colors, speed, frame, ratio, ignoreReduce });

  // Mirror props into a ref after commit — the rAF loop only ever reads the
  // latest value, and writing a ref during render is not safe in React 19.
  useEffect(() => {
    cfg.current = { frag, numbers, colors, speed, frame, ratio, ignoreReduce };
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    register(canvas, () => cfg.current);
    return () => unregister(canvas);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn("block h-full w-full", className)}
    />
  );
}

/* ------------------------------- palettes ------------------------------ */

const APP_MESH = {
  u_c0: "--accent-solid",
  u_c1: "--foreground",
  u_c2: "--card",
  u_c3: "--muted-foreground",
  u_bg: "--secondary",
} as const;

/* Album art, and album art is bright in either theme — both of these tokens
   hold their lightness across light and dark, so unassisted text on top of
   this has nowhere to hide in either one. */
const COVER_MESH = {
  u_c0: "--accent-solid",
  u_c1: "--feature-foreground",
  u_c2: "--accent-solid",
  u_c3: "--feature-foreground",
  u_bg: "--feature-foreground",
} as const;

/* The library ships every shader with `colors` and `colorBack`. Left at a
   stock rainbow they fight everything around them; these hsl() values stand
   in for that default. */
const STOCK_MESH = {
  u_c0: "hsl(348 92% 58%)",
  u_c1: "hsl(48 96% 56%)",
  u_c2: "hsl(174 84% 44%)",
  u_c3: "hsl(268 88% 62%)",
  u_bg: "hsl(210 60% 96%)",
} as const;

const CLEAN = { u_steps: 255, u_grain: 0 };

/* --------------------------------- 1 ----------------------------------- */

function ReleaseCard({ art }: { art: ReactNode }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="bg-secondary h-28">{art}</div>
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-ui truncate">Nightfall, deluxe edition</p>
          <p className="text-caption text-muted-foreground">Aster Vale · 12 tracks · 48 min</p>
        </div>
        <Button
          size="lg"
          variant={saved ? "secondary" : "outline"}
          onClick={() => setSaved((v) => !v)}
        >
          {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- 2 ----------------------------------- */

const GRADIENT_MOODS = [
  { id: "dusk", label: "Dusk", seed: 0 },
  { id: "tide", label: "Tide", seed: 2.4 },
  { id: "ember", label: "Ember", seed: 5.1 },
] as const;

function GradientPanel({ grain }: { grain: number }) {
  const [mood, setMood] = useState<string>("dusk");
  const seed = GRADIENT_MOODS.find((m) => m.id === mood)?.seed ?? 0;
  return (
    <div className="space-y-3">
      <div className="h-44 overflow-hidden rounded-xl border">
        <Shader
          frag={FRAG_MESH}
          colors={APP_MESH}
          numbers={{ u_steps: 9, u_grain: grain, u_zoom: 1.25, u_seed: seed }}
          speed={0.35}
          frame={4000}
        />
      </div>
      <div className="bg-secondary inline-flex gap-1 rounded-lg p-1">
        {GRADIENT_MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMood(m.id)}
            aria-pressed={mood === m.id}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart h-9 rounded-md px-3 transition-colors",
              mood === m.id
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- 3 ----------------------------------- */

function MotionCard({ honours, idPrefix }: { honours: boolean; idPrefix: string }) {
  const [reduce, setReduce] = useState(false);
  const still = honours && reduce;
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="h-36">
        <Shader
          frag={FRAG_MESH}
          colors={APP_MESH}
          numbers={{ ...CLEAN, u_zoom: 1.1, u_seed: 1.3 }}
          speed={still ? 0 : 0.9}
          frame={5200}
          ignoreReduce={!honours}
        />
      </div>
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        <Label htmlFor={`${idPrefix}-reduce`} className="text-ui">
          Reduce motion
        </Label>
        <Switch
          id={`${idPrefix}-reduce`}
          checked={reduce}
          onCheckedChange={setReduce}
        />
      </div>
    </div>
  );
}

/* --------------------------------- 4 ----------------------------------- */

function NowPlaying({ scrim }: { scrim: boolean }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="relative h-48 overflow-hidden rounded-xl border">
      <Shader
        frag={FRAG_MESH}
        colors={COVER_MESH}
        numbers={{ ...CLEAN, u_zoom: 0.9, u_seed: 3.7 }}
        speed={0.3}
        frame={9000}
        className="absolute inset-0"
      />
      {scrim && (
        <div
          aria-hidden="true"
          className="from-feature via-feature/60 absolute inset-0 bg-gradient-to-t to-transparent"
        />
      )}
      <div className="text-feature-foreground relative flex h-full flex-col justify-end gap-1 p-4">
        <p className="text-micro uppercase opacity-80">Now playing</p>
        <p className="text-title">Slow Harbour</p>
        <div className="mt-2 flex items-center gap-3">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setLiked((v) => !v)}
          >
            {liked ? "In your library" : "Add to library"}
          </Button>
          <span className="text-caption opacity-80">3:58</span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- 5 ----------------------------------- */

const COVER_TITLES = ["Low Tide", "Lanterns", "Nightjar"];

function CoverRow({ stock }: { stock: boolean }) {
  const [shuffle, setShuffle] = useState(0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {COVER_TITLES.map((title, i) => (
          <div key={title} className="bg-card overflow-hidden rounded-xl border">
            <div className="aspect-square">
              <Shader
                frag={FRAG_MESH}
                colors={stock ? STOCK_MESH : APP_MESH}
                numbers={{ ...CLEAN, u_zoom: 1, u_seed: i * 2.1 + shuffle * 1.7 }}
                speed={0.25}
                frame={2000 + i * 3000}
              />
            </div>
            <p className="text-caption truncate p-2.5">{title}</p>
          </div>
        ))}
      </div>
      <Button size="lg" variant="outline" onClick={() => setShuffle((v) => v + 1)}>
        <Shuffle aria-hidden="true" />
        Shuffle artwork
      </Button>
    </div>
  );
}

/* --------------------------------- 6 ----------------------------------- */

function HalftonePanel({ ratio, idPrefix }: { ratio: number; idPrefix: string }) {
  const [size, setSize] = useState(7);
  return (
    <div className="space-y-3">
      <div className="h-44 overflow-hidden rounded-xl border">
        <Shader
          frag={FRAG_DOTS}
          colors={{ u_ink: "--foreground", u_bg: "--card" }}
          numbers={{ u_cells: 176 / size }}
          speed={0.4}
          frame={1200}
          ratio={ratio}
        />
      </div>
      <label
        htmlFor={`${idPrefix}-size`}
        className="text-caption text-muted-foreground flex h-9 items-center gap-3"
      >
        Dot size
        <input
          id={`${idPrefix}-size`}
          type="range"
          min={4}
          max={16}
          step={1}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          style={{ accentColor: "var(--color-accent-solid)" }}
          className="h-9 min-w-24 flex-1"
        />
        <span className="w-10 text-right tabular-nums">{size}px</span>
      </label>
    </div>
  );
}

/* --------------------------------- 7 ----------------------------------- */

const STATIONS = [
  { name: "Deep focus", zoom: 1.3, ox: 0.34, oy: 0.26, bands: 5, twist: 0.6 },
  { name: "Rain radio", zoom: 0.95, ox: -0.44, oy: 0.2, bands: 3, twist: 1.0 },
  { name: "Night drive", zoom: 1.7, ox: 0.08, oy: -0.42, bands: 8, twist: 0.2 },
];

/* Zoomed all the way out, every tile collapses into the same fine ripple —
   which is exactly the point of the "before" side. */
const STATION_MUSH = { u_zoom: 0.05, u_ox: 2.2, u_oy: 1.8, u_bands: 5, u_twist: 0.6 };

function StationRow({ framed }: { framed: boolean }) {
  const [picked, setPicked] = useState(STATIONS[0].name);
  return (
    <div className="flex flex-wrap gap-3">
      {STATIONS.map((s) => (
        <button
          key={s.name}
          type="button"
          onClick={() => setPicked(s.name)}
          aria-pressed={picked === s.name}
          className={cn(
            "duration-fast ease-out-quart group rounded-xl border p-2 text-left transition-colors",
            picked === s.name ? "border-border-strong bg-secondary" : "hover:bg-secondary",
          )}
        >
          <div className="size-24 overflow-hidden rounded-lg">
            <Shader
              frag={FRAG_SWIRL}
              colors={{ u_c0: "--foreground", u_c1: "--accent-solid", u_bg: "--card" }}
              numbers={
                framed
                  ? { u_zoom: s.zoom, u_ox: s.ox, u_oy: s.oy, u_bands: s.bands, u_twist: s.twist }
                  : STATION_MUSH
              }
              speed={0.5}
              frame={3000}
            />
          </div>
          <p className="text-caption mt-2 px-0.5">{s.name}</p>
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- 8 ----------------------------------- */

const QUEUE = [
  { title: "Made for you", meta: "Updated today", feature: true },
  { title: "Recently played", meta: "34 tracks" },
  { title: "Liked songs", meta: "212 tracks" },
];

function QueueList({ restrained }: { restrained: boolean }) {
  const [open, setOpen] = useState("Made for you");
  return (
    <ul className="space-y-1.5">
      {QUEUE.map((row) => {
        const animated = restrained ? row.feature : true;
        return (
          <li key={row.title}>
            <button
              type="button"
              onClick={() => setOpen(row.title)}
              aria-pressed={open === row.title}
              className={cn(
                "duration-fast ease-out-quart flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors",
                open === row.title ? "border-border-strong bg-secondary" : "hover:bg-secondary",
              )}
            >
              <span className="size-14 shrink-0 overflow-hidden rounded-lg">
                {animated ? (
                  <Shader
                    frag={FRAG_MESH}
                    colors={APP_MESH}
                    numbers={{ ...CLEAN, u_zoom: 0.8, u_seed: row.title.length }}
                    speed={0.6}
                    frame={row.title.length * 900}
                  />
                ) : (
                  <span className="bg-secondary text-muted-foreground flex h-full w-full items-center justify-center">
                    {row.feature ? (
                      <Disc3 className="size-5" aria-hidden="true" />
                    ) : (
                      <Music4 className="size-5" aria-hidden="true" />
                    )}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-ui block truncate">{row.title}</span>
                <span className="text-caption text-muted-foreground block">{row.meta}</span>
              </span>
              {row.feature && (
                <span className="bg-feature text-feature-foreground text-micro mr-1 rounded-md px-2 py-1 uppercase">
                  For you
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* --------------------------------- 9 ----------------------------------- */

function FitCard({ cover, idPrefix }: { cover: boolean; idPrefix: string }) {
  const [width, setWidth] = useState(100);
  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div
          className="h-44 overflow-hidden rounded-xl border"
          style={{ width: `${width}%` }}
        >
          <Shader
            frag={FRAG_FIT}
            colors={{ u_c0: "--foreground", u_c1: "--accent-solid", u_bg: "--secondary" }}
            numbers={{ u_world: [3, 4], u_cover: cover ? 1 : 0 }}
            speed={0.5}
            frame={1500}
          />
        </div>
      </div>
      <label
        htmlFor={`${idPrefix}-width`}
        className="text-caption text-muted-foreground flex h-9 items-center gap-3"
      >
        Card width
        <input
          id={`${idPrefix}-width`}
          type="range"
          min={34}
          max={100}
          step={1}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          style={{ accentColor: "var(--color-accent-solid)" }}
          className="h-9 min-w-24 flex-1"
        />
        <span className="w-10 text-right tabular-nums">{width}%</span>
      </label>
    </div>
  );
}

/* --------------------------------- page -------------------------------- */

export function PaperShadersUltraFastZeroDependencyShadersDemo() {
  return (
    <div>
      <BeforeAfter
        principle="A card needs a picture and there is no picture to use. The usual answer is a flat gradient, which everyone has seen a thousand times. The graphics card will paint something that slowly moves instead, for about the same cost."
        before={
          <ReleaseCard
            art={
              <div className="from-accent to-secondary h-full w-full bg-gradient-to-br" />
            }
          />
        }
        after={
          <ReleaseCard
            art={
              <Shader
                frag={FRAG_MESH}
                colors={APP_MESH}
                numbers={{ ...CLEAN, u_zoom: 1.15, u_seed: 0.4 }}
                speed={0.5}
                frame={6400}
              />
            }
          />
        }
      />

      <BeforeAfter
        principle="Big soft gradients show ugly stripes where one shade steps into the next. Sprinkling a fine speckle over the picture breaks those steps up, and your eye reads it as smooth again."
        before={<GradientPanel grain={0} />}
        after={<GradientPanel grain={1} />}
      />

      <BeforeAfter
        principle="Some people get queasy or distracted by things that never stop moving, and ask their device to keep still. A moving background has to hear that and hold on a single frame. Try the switch on both sides."
        before={<MotionCard honours={false} idPrefix="motion-before" />}
        after={<MotionCard honours idPrefix="motion-after" />}
      />

      <BeforeAfter
        principle="Words on top of a moving picture keep sliding in and out of legibility as the colours drift under them. Darkening the picture only where the words sit fixes that without hiding the picture."
        before={<NowPlaying scrim={false} />}
        after={<NowPlaying scrim />}
      />

      <BeforeAfter
        principle="Generated artwork arrives in whatever colours the effect shipped with, usually a bright rainbow that shouts over everything near it. Feed it the colours the rest of the app already uses and it stops being a sticker. Shuffle for new artwork on either side."
        before={<CoverRow stock />}
        after={<CoverRow stock={false} />}
      />

      <BeforeAfter
        principle="A picture the computer paints has to be drawn at more detail than the screen shows, or fine patterns come out furry and start to shimmer. Drag the dots down to their smallest and the gap between the two sides widens."
        before={<HalftonePanel ratio={1} idPrefix="ratio-before" />}
        after={<HalftonePanel ratio={2} idPrefix="ratio-after" />}
      />

      <BeforeAfter
        principle="A pattern that looks good filling a whole screen collapses into grey fuzz once you shrink it to a thumbnail. Zoom into one part of it, and push the middle off to one side, and each thumbnail gets a shape you can tell apart."
        before={<StationRow framed={false} />}
        after={<StationRow framed />}
      />

      <BeforeAfter
        principle="When every row in a list carries its own moving picture, they cancel each other out and the list just feels noisy. Give the moving picture to one row only and it becomes emphasis again."
        before={<QueueList restrained={false} />}
        after={<QueueList restrained />}
      />

      <BeforeAfter
        principle="Generated artwork is drawn at one shape, but the card holding it changes shape with the window. It can sit inside the card with empty bars around it, or be cropped so it always fills. Drag the width slider on both sides."
        before={<FitCard cover={false} idPrefix="fit-before" />}
        after={<FitCard cover idPrefix="fit-after" />}
      />
    </div>
  );
}
