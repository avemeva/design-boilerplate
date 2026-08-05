"use client";

import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * curtains.js — HTML elements become WebGL planes.
 *
 * The library is not installed here, so every switch below is a
 * hand-rolled version of one thing it does: planes glued to a DOM rect
 * through scroll and resize, the texture matrix that covers instead of
 * squashing, the model/projection matrices, the render loop, ping-pong
 * frame buffers, a shader pass, and a texture that waits to be ready.
 * ------------------------------------------------------------------ */

/* ── colour: read the tokens, convert once, paint with them ───────── */

type RGB = [number, number, number];

const TOKENS = [
  "--feature",
  "--feature-foreground",
  "--accent-solid",
  "--secondary",
  "--muted-foreground",
] as const;

type Token = (typeof TOKENS)[number];
type Palette = { c: Record<Token, RGB>; font: string };

/**
 * The tokens are authored in oklch and a browser hands them back in
 * whatever colour space it fancies (`lab(...)` in Chrome today), so the
 * conversion is left to the one thing that always agrees with the page:
 * paint a pixel and read it back.
 */
function toRGB(ctx: CanvasRenderingContext2D | null, value: string): RGB {
  if (!ctx) return [0.5, 0.5, 0.5];
  ctx.globalCompositeOperation = "copy";
  ctx.fillStyle = "var(--muted-foreground)";
  ctx.fillStyle = value.trim();
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
}

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const scratch = document.createElement("canvas");
  scratch.width = 1;
  scratch.height = 1;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });
  const c = {} as Record<Token, RGB>;
  for (const t of TOKENS) c[t] = toRGB(ctx, cs.getPropertyValue(t));
  return { c, font: cs.fontFamily || "sans-serif" };
}

function css([r, g, b]: RGB, a = 1) {
  const n = (v: number) => Math.round(v * 255);
  return `rgba(${n(r)}, ${n(g)}, ${n(b)}, ${a})`;
}

/* ── the picture every plane is textured with ─────────────────────── */

const TEX_W = 512;
const TEX_H = 320;

/**
 * A circle and a square, because the moment a plane stops respecting
 * the texture's shape you can watch the circle turn into an egg.
 */
function pictureCanvas(p: Palette, title: string) {
  const el = document.createElement("canvas");
  el.width = TEX_W;
  el.height = TEX_H;
  const ctx = el.getContext("2d");
  if (!ctx) return el;

  ctx.fillStyle = css(p.c["--feature"]);
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = css(p.c["--feature-foreground"]);
  ctx.lineWidth = 26;
  for (let i = -4; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 64, 0);
    ctx.lineTo(i * 64 + TEX_H, TEX_H);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = css(p.c["--accent-solid"], 0.22);
  ctx.beginPath();
  ctx.arc(178, 148, 88, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = css(p.c["--accent-solid"]);
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.strokeStyle = css(p.c["--feature-foreground"], 0.65);
  ctx.lineWidth = 8;
  ctx.strokeRect(310, 60, 144, 144);

  ctx.fillStyle = css(p.c["--feature-foreground"]);
  ctx.font = `600 40px ${p.font}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, 66, 288);

  ctx.globalAlpha = 0.55;
  ctx.font = `500 20px ${p.font}`;
  ctx.textAlign = "right";
  ctx.fillText(`${TEX_W} × ${TEX_H}`, TEX_W - 66, 288);

  return el;
}

/* ── the smallest WebGL kit that can stand in for the library ─────── */

const VS_FLAT = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
varying vec2 vTextureCoord;
void main(){
  vTextureCoord = aTextureCoord;
  gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}`;

/* the README's vertex shader: the plane is placed by two matrices */
const VS_3D = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
varying vec2 vTextureCoord;
void main(){
  vTextureCoord = aTextureCoord;
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);
}`;

/* the README's fragment shader, plus a cover matrix, a sweep and a fade */
const FS_FILM = `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler0;
uniform float uTime;
uniform float uAmp;
uniform float uSweep;
uniform float uFade;
uniform vec2 uScale;
uniform vec3 uBlank;
void main(){
  vec2 uv = (vTextureCoord - 0.5) * uScale + 0.5;
  uv.x += sin(uv.y * 25.0) * cos(uv.x * 25.0) * cos(uTime / 50.0) * uAmp / 25.0;
  vec3 c = texture2D(uSampler0, clamp(uv, 0.002, 0.998)).rgb;
  float sweep = fract(uTime / 260.0) * 1.6 - 0.3;
  c += uSweep * max(0.0, 1.0 - abs(sweep - vTextureCoord.x) * 6.0) * 0.4;
  gl_FragColor = vec4(mix(uBlank, c, uFade), 1.0);
}`;

const FILM_UNIFORMS = [
  "uSampler0",
  "uTime",
  "uAmp",
  "uSweep",
  "uFade",
  "uScale",
  "uBlank",
] as const;

function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    depth: false,
  });
  if (!gl) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    // x, y, u, v — one triangle strip, v already flipped by UNPACK_FLIP_Y
    new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  return gl;
}

function makeProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram() as WebGLProgram;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const sh = gl.createShader(type) as WebGLShader;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    gl.attachShader(prog, sh);
    gl.deleteShader(sh);
  }
  gl.bindAttribLocation(prog, 0, "aVertexPosition");
  gl.bindAttribLocation(prog, 1, "aTextureCoord");
  gl.linkProgram(prog);
  return prog;
}

/** Every `gl.useProgram` in the file goes through here, because the name
 * reads as a React hook to the linter and this is the one place to say
 * that it is not one. */
function activate(gl: WebGLRenderingContext, prog: WebGLProgram) {
  // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API, not a React hook
  gl.useProgram(prog);
}

function locate<K extends string>(
  gl: WebGLRenderingContext,
  prog: WebGLProgram,
  names: readonly K[],
) {
  const out = {} as Record<K, WebGLUniformLocation | null>;
  for (const n of names) out[n] = gl.getUniformLocation(prog, n);
  return out;
}

function makeTexture(gl: WebGLRenderingContext, src?: TexImageSource) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (src) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  }
  return tex;
}

function makeTarget(gl: WebGLRenderingContext, w: number, h: number) {
  const tex = makeTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, tex };
}

const dpr = () =>
  typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);

/** Resize the drawing buffer to the box the element actually occupies. */
function fit(canvas: HTMLCanvasElement, scale = 1) {
  const d = dpr() * scale;
  const w = Math.max(1, Math.round(canvas.clientWidth * d));
  const h = Math.max(1, Math.round(canvas.clientHeight * d));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return [w, h] as const;
}

/** The texture matrix, reduced to the two numbers that matter. */
function cover(w: number, h: number): [number, number] {
  const plane = w / Math.max(1, h);
  const tex = TEX_W / TEX_H;
  return plane > tex ? [1, tex / plane] : [plane / tex, 1];
}

type Scene = { frame: (t: number) => void; dispose?: () => void };

type Env = {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
  palette: Palette;
  /** Read on every frame: pressing the switch swaps the prop, not the canvas. */
  after: () => boolean;
};

/**
 * One canvas, one WebGL context, one render loop, torn down properly.
 *
 * The switch keeps the same element in the same slot, so the context is
 * built once and the side is asked for per frame rather than captured.
 */
function useScene(after: boolean, build: (env: Env) => Scene) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buildRef = useRef(build);
  const afterRef = useRef(after);

  useEffect(() => {
    afterRef.current = after;
  }, [after]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = initGL(canvas);
    if (!gl) return;

    const scene = buildRef.current({
      gl,
      canvas,
      palette: readPalette(canvas),
      after: () => afterRef.current,
    });
    let raf = 0;
    const loop = (t: number) => {
      scene.frame(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      scene.dispose?.();
      // Hand the context back only once the canvas is really gone: a
      // canvas keeps the same context across a remount, and a context
      // that has been lost never comes back on its own.
      setTimeout(() => {
        if (!canvas.isConnected) {
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        }
      }, 0);
    };
  }, []);

  return canvasRef;
}

/* ── shared chrome ────────────────────────────────────────────────── */

function Knob({
  id,
  label,
  min,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex h-9 items-center gap-3">
      <label htmlFor={id} className="text-caption text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary h-9 w-40 cursor-pointer"
      />
    </div>
  );
}

const PICTURE_LABEL = "A ring and a square on a dark field";

/** The frame a plane lives in — close to the texture's own 512 × 320. */
function Film({
  canvasRef,
  className,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto h-72 w-full max-w-md overflow-hidden rounded-lg",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={PICTURE_LABEL}
        className="block h-full w-full"
      />
    </div>
  );
}

/* ── 1 · the plane keeps up with the scroll ───────────────────────── */

const ROWS = [
  { title: "Coastline", meta: "4 min" },
  { title: "Harbour", meta: "2 min" },
  { title: "Signal", meta: "6 min" },
  { title: "Low tide", meta: "3 min" },
];

function ScrollPair({ after }: { after: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const slots = useRef<(HTMLDivElement | null)[]>([]);

  const canvasRef = useScene(after, ({ gl, canvas, palette, after }) => {
    const prog = makeProgram(gl, VS_FLAT, FS_FILM);
    const tex = makeTexture(gl, pictureCanvas(palette, "PLANE"));
    const u = locate(gl, prog, FILM_UNIFORMS);
    let locked: number[][] | null = null;
    let mode = after();
    let t = 0;

    return {
      frame() {
        const host = hostRef.current;
        if (!host) return;
        if (mode !== after()) {
          mode = after();
          locked = null;
        }
        const [w, h] = fit(canvas);
        const d = dpr();
        const hr = host.getBoundingClientRect();

        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);
        activate(gl, prog);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(u.uSampler0, 0);
        t += 1;
        gl.uniform1f(u.uTime, t);
        gl.uniform1f(u.uAmp, 0.16);
        gl.uniform1f(u.uSweep, 0);
        gl.uniform1f(u.uFade, 1);
        gl.uniform3f(u.uBlank, 0, 0, 0);

        // every plane's box comes straight from its element's box
        const live = slots.current.map((el) => {
          if (!el) return [0, 0, 0, 0];
          const r = el.getBoundingClientRect();
          return [
            (r.left - hr.left) * d,
            (hr.bottom - r.bottom) * d,
            r.width * d,
            r.height * d,
          ];
        });
        if (!locked) locked = live;

        for (const [x, y, pw, ph] of mode ? live : locked) {
          if (pw < 1 || ph < 1) continue;
          gl.viewport(Math.round(x), Math.round(y), Math.round(pw), Math.round(ph));
          gl.uniform2f(u.uScale, ...cover(pw, ph));
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      },
      dispose() {
        gl.deleteProgram(prog);
        gl.deleteTexture(tex);
      },
    };
  });

  return (
    <div ref={hostRef} className="bg-background relative overflow-hidden rounded-xl">
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="relative h-56 space-y-3 overflow-y-auto p-3">
        {ROWS.map((row, i) => (
          <div key={row.title} className="flex items-center gap-3">
            <div
              ref={(el) => {
                slots.current[i] = el;
              }}
              className="h-20 w-32 shrink-0 rounded-lg border border-dashed"
            />
            <div>
              <p className="text-ui">{row.title}</p>
              <p className="text-caption text-muted-foreground">{row.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 2 · the plane keeps up when the layout moves ─────────────────── */

function LayoutPair({ after }: { after: boolean }) {
  const [big, setBig] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  const canvasRef = useScene(after, ({ gl, canvas, palette, after }) => {
    const prog = makeProgram(gl, VS_FLAT, FS_FILM);
    const tex = makeTexture(gl, pictureCanvas(palette, "PLANE"));
    const u = locate(gl, prog, FILM_UNIFORMS);
    let locked: number[] | null = null;
    let mode = after();
    let t = 0;

    return {
      frame() {
        const host = hostRef.current;
        const slot = slotRef.current;
        if (!host || !slot) return;
        if (mode !== after()) {
          mode = after();
          locked = null;
        }
        const [w, h] = fit(canvas);
        const d = dpr();
        const hr = host.getBoundingClientRect();
        const r = slot.getBoundingClientRect();

        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const live = [
          (r.left - hr.left) * d,
          (hr.bottom - r.bottom) * d,
          r.width * d,
          r.height * d,
        ];
        if (!locked) locked = live;
        const [x, y, pw, ph] = mode ? live : locked;
        if (pw < 1 || ph < 1) return;

        activate(gl, prog);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.viewport(Math.round(x), Math.round(y), Math.round(pw), Math.round(ph));
        gl.uniform1i(u.uSampler0, 0);
        t += 1;
        gl.uniform1f(u.uTime, t);
        gl.uniform1f(u.uAmp, 0.16);
        gl.uniform1f(u.uSweep, 0);
        gl.uniform1f(u.uFade, 1);
        gl.uniform3f(u.uBlank, 0, 0, 0);
        gl.uniform2f(u.uScale, ...cover(pw, ph));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose() {
        gl.deleteProgram(prog);
        gl.deleteTexture(tex);
      },
    };
  });

  return (
    <div>
      <Button size="lg" variant="secondary" onClick={() => setBig((v) => !v)}>
        {big ? "Make it smaller" : "Make it bigger"}
      </Button>
      <div
        ref={hostRef}
        className="bg-background relative mt-3 grid h-64 place-items-center overflow-hidden rounded-xl"
      >
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <div
          ref={slotRef}
          className={cn(
            "duration-slower ease-out-quart relative rounded-lg border border-dashed transition-[color,background-color,border-color,box-shadow,opacity,transform]",
            big ? "h-52 w-80" : "h-24 w-40",
          )}
        />
      </div>
    </div>
  );
}

/* ── 3 · the texture covers instead of squashing ──────────────────── */

function CoverPair({ after }: { after: boolean }) {
  const [width, setWidth] = useState(100);

  const canvasRef = useScene(after, ({ gl, canvas, palette, after }) => {
    const prog = makeProgram(gl, VS_FLAT, FS_FILM);
    const tex = makeTexture(gl, pictureCanvas(palette, "PLANE"));
    const u = locate(gl, prog, FILM_UNIFORMS);
    let t = 0;

    return {
      frame() {
        const [w, h] = fit(canvas);
        gl.viewport(0, 0, w, h);
        activate(gl, prog);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(u.uSampler0, 0);
        t += 1;
        gl.uniform1f(u.uTime, t);
        gl.uniform1f(u.uAmp, 0.2);
        gl.uniform1f(u.uSweep, 0);
        gl.uniform1f(u.uFade, 1);
        gl.uniform3f(u.uBlank, 0, 0, 0);
        const [sx, sy] = after() ? cover(w, h) : [1, 1];
        gl.uniform2f(u.uScale, sx, sy);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose() {
        gl.deleteProgram(prog);
        gl.deleteTexture(tex);
      },
    };
  });

  return (
    <div>
      <Knob
        id="cjs-cover-width"
        label="Frame width"
        min={30}
        max={100}
        value={width}
        onChange={setWidth}
      />
      <div className="bg-background mt-3 rounded-xl p-4">
        <div className="mx-auto w-full max-w-md">
          <div
            className="mx-auto h-64 overflow-hidden rounded-lg"
            style={{ width: `${width}%` }}
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={PICTURE_LABEL}
              className="block h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 4 · the plane leans, with perspective ────────────────────────── */

type M4 = Float32Array;

function mul(a: M4, b: M4): M4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  }
  return o;
}

const NEAR = 0.1;
const FAR = 100;
const FOV = Math.PI / 4;
const Z = -2.4;

function perspective(aspect: number): M4 {
  const f = 1 / Math.tan(FOV / 2);
  // biome-ignore format: a matrix reads better as a matrix
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (FAR + NEAR) / (NEAR - FAR), -1,
    0, 0, (2 * FAR * NEAR) / (NEAR - FAR), 0,
  ]);
}

function model(rx: number, ry: number, sx: number, sy: number): M4 {
  const cx = Math.cos(rx);
  const px = Math.sin(rx);
  const cy = Math.cos(ry);
  const py = Math.sin(ry);
  // biome-ignore format: a matrix reads better as a matrix
  const move = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, Z, 1,
  ]);
  // biome-ignore format: a matrix reads better as a matrix
  const turnX = new Float32Array([
    1, 0, 0, 0,
    0, cx, px, 0,
    0, -px, cx, 0,
    0, 0, 0, 1,
  ]);
  // biome-ignore format: a matrix reads better as a matrix
  const turnY = new Float32Array([
    cy, 0, -py, 0,
    0, 1, 0, 0,
    py, 0, cy, 0,
    0, 0, 0, 1,
  ]);
  // biome-ignore format: a matrix reads better as a matrix
  const size = new Float32Array([
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
  return mul(mul(move, mul(turnX, turnY)), size);
}

function TiltPair({ after }: { after: boolean }) {
  const point = useRef({ x: 0, y: 0, on: 0 });

  const canvasRef = useScene(after, ({ gl, canvas, palette, after }) => {
    const prog = makeProgram(gl, VS_3D, FS_FILM);
    const tex = makeTexture(gl, pictureCanvas(palette, "PLANE"));
    const u = locate(gl, prog, [...FILM_UNIFORMS, "uMVMatrix", "uPMatrix"]);
    const cur = { x: 0, y: 0, on: 0 };
    let t = 0;

    return {
      frame() {
        const [w, h] = fit(canvas);
        const aspect = w / h;
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        for (const k of ["x", "y", "on"] as const) {
          cur[k] += (point.current[k] - cur[k]) * 0.12;
        }

        // the plane fills the frame at rest, then leans into the cursor
        const half = Math.tan(FOV / 2) * -Z * 0.86;
        const swell = 1 + cur.on * 0.06;
        const mv = after()
          ? model(cur.y * 0.3, cur.x * 0.36, half * aspect, half)
          : model(0, 0, half * aspect * swell, half * swell);

        activate(gl, prog);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniformMatrix4fv(u.uPMatrix, false, perspective(aspect));
        gl.uniformMatrix4fv(u.uMVMatrix, false, mv);
        gl.uniform1i(u.uSampler0, 0);
        t += 1;
        gl.uniform1f(u.uTime, t);
        gl.uniform1f(u.uAmp, 0.16);
        gl.uniform1f(u.uSweep, 0);
        gl.uniform1f(u.uFade, 1);
        gl.uniform3f(u.uBlank, 0, 0, 0);
        const [sx, sy] = cover(w, h);
        gl.uniform2f(u.uScale, sx, sy);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose() {
        gl.deleteProgram(prog);
        gl.deleteTexture(tex);
      },
    };
  });

  return (
    <div
      className="bg-background rounded-xl p-4"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        point.current = {
          x: ((e.clientX - r.left) / r.width) * 2 - 1,
          y: ((e.clientY - r.top) / r.height) * 2 - 1,
          on: 1,
        };
      }}
      onPointerLeave={() => {
        point.current = { x: 0, y: 0, on: 0 };
      }}
    >
      <Film canvasRef={canvasRef} />
      <p className="text-caption text-muted-foreground mt-3">
        Move your cursor over the picture.
      </p>
    </div>
  );
}

/* ── 5 · the wake that remembers where you were ───────────────────── */

const FS_TRAIL = `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uPrev;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uKeep;
uniform float uOn;
void main(){
  float prev = texture2D(uPrev, vTextureCoord).r * uKeep;
  vec2 d = (vTextureCoord - uMouse) * vec2(uAspect, 1.0);
  float splat = uOn * exp(-dot(d, d) * 150.0);
  gl_FragColor = vec4(vec3(min(1.0, prev + splat)), 1.0);
}`;

const FS_SMEAR = `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler0;
uniform sampler2D uTrail;
uniform vec2 uScale;
void main(){
  float m = texture2D(uTrail, vTextureCoord).r;
  vec2 uv = (vTextureCoord - 0.5) * uScale + 0.5;
  uv += vec2(m * 0.05, m * -0.03);
  vec3 c = texture2D(uSampler0, clamp(uv, 0.002, 0.998)).rgb;
  gl_FragColor = vec4(c + m * 0.5, 1.0);
}`;

function TrailPair({ after }: { after: boolean }) {
  const point = useRef({ x: 0.5, y: 0.5, on: 0 });

  const canvasRef = useScene(after, ({ gl, canvas, palette, after }) => {
    const paint = makeProgram(gl, VS_FLAT, FS_TRAIL);
    const show = makeProgram(gl, VS_FLAT, FS_SMEAR);
    const pu = locate(gl, paint, ["uPrev", "uMouse", "uAspect", "uKeep", "uOn"]);
    const su = locate(gl, show, ["uSampler0", "uTrail", "uScale"]);
    const tex = makeTexture(gl, pictureCanvas(palette, "PLANE"));

    let size: [number, number] = [0, 0];
    let targets: ReturnType<typeof makeTarget>[] = [];
    let flip = 0;

    const drop = () => {
      for (const t of targets) {
        gl.deleteFramebuffer(t.fb);
        gl.deleteTexture(t.tex);
      }
      targets = [];
    };

    return {
      frame() {
        const [w, h] = fit(canvas);
        const bw = Math.max(1, Math.round(w / 2));
        const bh = Math.max(1, Math.round(h / 2));
        if (size[0] !== bw || size[1] !== bh) {
          drop();
          targets = [makeTarget(gl, bw, bh), makeTarget(gl, bw, bh)];
          size = [bw, bh];
        }

        const src = targets[flip];
        const dst = targets[1 - flip];
        flip = 1 - flip;

        // read the last frame, fade it down, stamp the cursor into it
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
        gl.viewport(0, 0, bw, bh);
        activate(gl, paint);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.tex);
        gl.uniform1i(pu.uPrev, 0);
        gl.uniform2f(pu.uMouse, point.current.x, 1 - point.current.y);
        gl.uniform1f(pu.uAspect, bw / bh);
        gl.uniform1f(pu.uKeep, after() ? 0.965 : 0);
        gl.uniform1f(pu.uOn, point.current.on);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        activate(gl, show);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(su.uSampler0, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, dst.tex);
        gl.uniform1i(su.uTrail, 1);
        const [sx, sy] = cover(w, h);
        gl.uniform2f(su.uScale, sx, sy);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.activeTexture(gl.TEXTURE0);
      },
      dispose() {
        gl.deleteProgram(paint);
        gl.deleteProgram(show);
        gl.deleteTexture(tex);
        drop();
      },
    };
  });

  return (
    <div
      className="bg-background rounded-xl p-4"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        point.current = {
          x: (e.clientX - r.left) / r.width,
          y: (e.clientY - r.top) / r.height,
          on: 1,
        };
      }}
      onPointerLeave={() => {
        point.current = { ...point.current, on: 0 };
      }}
    >
      <Film canvasRef={canvasRef} />
      <p className="text-caption text-muted-foreground mt-3">
        Sweep your cursor across the picture.
      </p>
    </div>
  );
}

/* ── 6 · the loop that draws on every frame ───────────────────────── */

function LoopPair({ after }: { after: boolean }) {
  const canvasRef = useScene(after, ({ gl, canvas, palette, after }) => {
    const prog = makeProgram(gl, VS_FLAT, FS_FILM);
    const tex = makeTexture(gl, pictureCanvas(palette, "PLANE"));
    const u = locate(gl, prog, FILM_UNIFORMS);
    let t = 0;
    let shown = 0;
    let last = 0;

    return {
      frame(now) {
        const [w, h] = fit(canvas);
        t += 1;
        // before: the uniform is pushed on a timer instead of every frame
        if (after()) {
          shown = t;
        } else if (now - last > 110) {
          shown = t;
          last = now;
        }
        gl.viewport(0, 0, w, h);
        activate(gl, prog);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(u.uSampler0, 0);
        gl.uniform1f(u.uTime, shown);
        gl.uniform1f(u.uAmp, 1.2);
        gl.uniform1f(u.uSweep, 1);
        gl.uniform1f(u.uFade, 1);
        gl.uniform3f(u.uBlank, 0, 0, 0);
        const [sx, sy] = cover(w, h);
        gl.uniform2f(u.uScale, sx, sy);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose() {
        gl.deleteProgram(prog);
        gl.deleteTexture(tex);
      },
    };
  });

  return (
    <div className="bg-background rounded-xl p-4">
      <Film canvasRef={canvasRef} />
    </div>
  );
}

/* ── 7 · the pass that cleans up the edges ────────────────────────── */

const FS_SHAPES = `precision mediump float;
varying vec2 vTextureCoord;
uniform float uTime;
uniform float uAspect;
uniform vec3 uBg;
uniform vec3 uInk;
uniform vec3 uMark;
void main(){
  vec2 p = (vTextureCoord - 0.5) * vec2(uAspect, 1.0);
  float a = uTime / 240.0;
  vec2 q = vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
  float tri = max(abs(q.x) * 0.866 + q.y * 0.5, -q.y) - 0.15;
  float ring = abs(length(p) - 0.34) - 0.016;
  vec3 c = mix(uBg, uMark, step(ring, 0.0));
  c = mix(c, uInk, step(tri, 0.0));
  gl_FragColor = vec4(c, 1.0);
}`;

const FS_COPY = `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler0;
void main(){
  gl_FragColor = vec4(texture2D(uSampler0, vTextureCoord).rgb, 1.0);
}`;

/* the FXAA pass, boiled down: find the edge, blend along it */
const FS_FXAA = `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler0;
uniform vec2 uRes;
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
void main(){
  vec2 inv = 1.0 / uRes;
  vec2 v = vTextureCoord;
  vec3 nw = texture2D(uSampler0, v + vec2(-1.0, -1.0) * inv).rgb;
  vec3 ne = texture2D(uSampler0, v + vec2( 1.0, -1.0) * inv).rgb;
  vec3 sw = texture2D(uSampler0, v + vec2(-1.0,  1.0) * inv).rgb;
  vec3 se = texture2D(uSampler0, v + vec2( 1.0,  1.0) * inv).rgb;
  vec3 mm = texture2D(uSampler0, v).rgb;
  float lnw = luma(nw), lne = luma(ne), lsw = luma(sw), lse = luma(se), lm = luma(mm);
  float lo = min(lm, min(min(lnw, lne), min(lsw, lse)));
  float hi = max(lm, max(max(lnw, lne), max(lsw, lse)));
  vec2 dir = vec2(-((lnw + lne) - (lsw + lse)), ((lnw + lsw) - (lne + lse)));
  float reduce = max((lnw + lne + lsw + lse) * 0.03125, 0.0078125);
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
  dir = clamp(dir * rcp, -8.0, 8.0) * inv;
  vec3 a = 0.5 * (
    texture2D(uSampler0, v + dir * -0.166667).rgb +
    texture2D(uSampler0, v + dir *  0.166667).rgb);
  vec3 b = a * 0.5 + 0.25 * (
    texture2D(uSampler0, v + dir * -0.5).rgb +
    texture2D(uSampler0, v + dir *  0.5).rgb);
  float lb = luma(b);
  gl_FragColor = vec4((lb < lo || lb > hi) ? a : b, 1.0);
}`;

function EdgePair({ after }: { after: boolean }) {
  const canvasRef = useScene(after, ({ gl, canvas, palette, after }) => {
    const draw = makeProgram(gl, VS_FLAT, FS_SHAPES);
    const plain = makeProgram(gl, VS_FLAT, FS_COPY);
    const fxaa = makeProgram(gl, VS_FLAT, FS_FXAA);
    const du = locate(gl, draw, ["uTime", "uAspect", "uBg", "uInk", "uMark"]);
    const pu = {
      plain: locate(gl, plain, ["uSampler0"]),
      fxaa: locate(gl, fxaa, ["uSampler0", "uRes"]),
    };
    let size: [number, number] = [0, 0];
    let target: ReturnType<typeof makeTarget> | null = null;
    let t = 0;

    const drop = () => {
      if (!target) return;
      gl.deleteFramebuffer(target.fb);
      gl.deleteTexture(target.tex);
      target = null;
    };

    return {
      frame() {
        // a deliberately coarse buffer, so the staircase is big enough to see
        const [w, h] = fit(canvas, 0.4);
        if (size[0] !== w || size[1] !== h) {
          drop();
          target = makeTarget(gl, w, h);
          size = [w, h];
        }
        if (!target) return;

        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
        gl.viewport(0, 0, w, h);
        activate(gl, draw);
        t += 1;
        gl.uniform1f(du.uTime, t);
        gl.uniform1f(du.uAspect, w / h);
        gl.uniform3fv(du.uBg, palette.c["--feature"]);
        gl.uniform3fv(du.uInk, palette.c["--feature-foreground"]);
        gl.uniform3fv(du.uMark, palette.c["--accent-solid"]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.bindTexture(gl.TEXTURE_2D, target.tex);
        if (after()) {
          activate(gl, fxaa);
          gl.uniform1i(pu.fxaa.uSampler0, 0);
          gl.uniform2f(pu.fxaa.uRes, w, h);
        } else {
          activate(gl, plain);
          gl.uniform1i(pu.plain.uSampler0, 0);
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose() {
        gl.deleteProgram(draw);
        gl.deleteProgram(plain);
        gl.deleteProgram(fxaa);
        drop();
      },
    };
  });

  return (
    <div className="bg-background rounded-xl p-4">
      <div className="mx-auto h-72 w-full max-w-md overflow-hidden rounded-lg">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A slowly turning triangle inside a ring, magnified"
          className="block h-full w-full"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

/* ── 8 · the picture waits until it is ready ──────────────────────── */

function LoadPair({ after }: { after: boolean }) {
  const startRef = useRef(0);

  const canvasRef = useScene(after, ({ gl, canvas, palette, after }) => {
    const prog = makeProgram(gl, VS_FLAT, FS_FILM);
    const blank = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const tex = makeTexture(gl, pictureCanvas(palette, "PLANE"));
    const u = locate(gl, prog, FILM_UNIFORMS);
    const rest = palette.c["--secondary"];
    let mode = after();
    let t = 0;

    return {
      frame(now) {
        // pressing the switch counts as asking for the picture again
        if (mode !== after()) {
          mode = after();
          startRef.current = 0;
        }
        if (!startRef.current) startRef.current = now;
        const age = now - startRef.current;
        const ready = age > 900;
        const fade = mode ? Math.min(1, Math.max(0, (age - 900) / 420)) : 1;

        const [w, h] = fit(canvas);
        gl.viewport(0, 0, w, h);
        activate(gl, prog);
        gl.bindTexture(gl.TEXTURE_2D, ready ? tex : blank);
        gl.uniform1i(u.uSampler0, 0);
        t += 1;
        gl.uniform1f(u.uTime, t);
        gl.uniform1f(u.uAmp, 0.2);
        gl.uniform1f(u.uSweep, 0);
        gl.uniform1f(u.uFade, fade);
        gl.uniform3fv(u.uBlank, rest);
        const [sx, sy] = cover(w, h);
        gl.uniform2f(u.uScale, sx, sy);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose() {
        gl.deleteProgram(prog);
        gl.deleteTexture(tex);
        gl.deleteTexture(blank);
      },
    };
  });

  return (
    <div>
      <Button
        size="lg"
        variant="secondary"
        onClick={() => {
          startRef.current = 0;
        }}
      >
        Load it again
      </Button>
      <div className="bg-background mt-3 rounded-xl p-4">
        <Film canvasRef={canvasRef} className="bg-secondary" />
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function MartinlaxenaireCurtainsjsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="A picture with an effect running on it still has to behave like an ordinary picture. Scroll the list, and each one should travel with the row it belongs to."
        before={<ScrollPair after={false} />}
        after={<ScrollPair after />}
      />
      <BeforeAfter
        principle="When a picture's frame changes size, the picture should fill the new frame the whole way through the change, not turn up at the old size."
        before={<LayoutPair after={false} />}
        after={<LayoutPair after />}
      />
      <BeforeAfter
        principle="A picture should never be stretched to fit. Squeeze the frame and everything in it should keep its proper shape, even if that means you see less of it."
        before={<CoverPair after={false} />}
        after={<CoverPair after />}
      />
      <BeforeAfter
        principle="Something that answers your cursor feels like a real object when it leans in space. Anything that only swells still reads as a flat sticker."
        before={<TiltPair after={false} />}
        after={<TiltPair after />}
      />
      <BeforeAfter
        principle="Movement should leave something behind it. When the effect under your cursor vanishes the instant you pass, the picture feels dead."
        before={<TrailPair after={false} />}
        after={<TrailPair after />}
      />
      <BeforeAfter
        principle="Anything moving should be redrawn as often as the screen refreshes. Slower than that and it reads as a stutter, however good the effect is."
        before={<LoopPair after={false} />}
        after={<LoopPair after />}
      />
      <BeforeAfter
        principle="Sloping edges get drawn onto a grid of little squares, so they come out as a staircase. Softening those steps is what makes a shape look solid."
        before={<EdgePair after={false} />}
        after={<EdgePair after />}
      />
      <BeforeAfter
        principle="While a picture is still on its way, hold something calm in its place and bring it in gently. A black hole followed by a snap is jarring."
        before={<LoadPair after={false} />}
        after={<LoadPair after />}
      />
    </div>
  );
}
