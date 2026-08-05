"use client";

import { Copy, Pause, Play, Zap } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* ==================================================================== *
 * FragCoord.xyz — https://fragcoord.xyz
 *
 * A hosted GLSL editor. Everything below is that editor's surface,
 * rebuilt: the constant tuner, the built-in uniform panel, the
 * expression inspector, the per-line error markers, the out-of-range
 * check, the instruction heatmap, the frame graph, the Shadertoy
 * importer, the multi-language export and the scrubbable timeline.
 *
 * The shaders are real. Every canvas is a live WebGL2 program, every
 * compile error comes from the driver, and the Shadertoy conversion is
 * run on the text you can edit.
 *
 * The `before` side of each switch is the same feature as a normal
 * editor ships it. Only the quality changes.
 * ==================================================================== */

/* ── colour, read off the tokens ──────────────────────────────────── */

type RGB = [number, number, number];
type Tones = [RGB, RGB, RGB, RGB];

const TONE_CLASSES = [
  "text-card",
  "text-foreground",
  "text-muted-foreground",
  "text-destructive",
];

let swatch: CanvasRenderingContext2D | null | undefined;

/** Resolve any CSS colour — oklch included — to linear 0..1 sRGB. */
function cssToRGB(css: string): RGB {
  if (swatch === undefined) {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    swatch = c.getContext("2d", { willReadFrequently: true });
  }
  if (!swatch) return [0.5, 0.5, 0.5];
  swatch.fillStyle = "var(--muted-foreground)";
  swatch.fillStyle = css;
  swatch.fillRect(0, 0, 1, 1);
  const d = swatch.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
}

/** card, ink, muted, destructive — measured inside the themed tree. */
function readTones(host: HTMLElement): Tones {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  host.appendChild(probe);
  const out = TONE_CLASSES.map((cls) => {
    probe.className = cls;
    return cssToRGB(getComputedStyle(probe).color);
  }) as Tones;
  probe.remove();
  return out;
}

/* ── shader plumbing ──────────────────────────────────────────────── */

const VERT = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p, 0., 1.); }`;

const HEAD = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_ink;
uniform vec3 u_bg;
uniform vec3 u_dim;
uniform vec3 u_hot;
uniform float u_a;
uniform float u_b;
uniform float u_c;
vec3 tone(float g){ return mix(u_bg, u_ink, clamp(g, 0., 1.)); }
vec3 heat(float t){ t = clamp(t, 0., 1.); vec3 lo = mix(u_bg, u_dim, .16); return t < .5 ? mix(lo, u_dim, t * 2.) : mix(u_dim, u_hot, (t - .5) * 2.); }
`;

const OPEN = "void main() {\n";
/** Source lines that sit above the first editable line. */
const OFFSET = (HEAD + OPEN).split("\n").length - 1;

const wrap = (body: string) => `${HEAD}${OPEN}${body}\n}\n`;

let validator: WebGL2RenderingContext | null | undefined;

/** Compile a fragment shader off-screen and hand back the driver's log. */
function compileLog(src: string): string {
  if (validator === undefined) {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    validator = c.getContext("webgl2", { antialias: false });
  }
  const gl = validator;
  if (!gl) return "";
  const s = gl.createShader(gl.FRAGMENT_SHADER);
  if (!s) return "";
  gl.shaderSource(s, src);
  gl.compileShader(s);
  const ok = gl.getShaderParameter(s, gl.COMPILE_STATUS) as boolean;
  const log = ok ? "" : (gl.getShaderInfoLog(s) ?? "Compilation failed.");
  gl.deleteShader(s);
  return log.trim();
}

type Mark = { line: number; text: string };

/** `ERROR: 0:19: 'flot' : syntax error` → line 3 of what you typed. */
function parseLog(log: string, offset: number): Mark[] {
  const out: Mark[] = [];
  for (const raw of log.split("\n")) {
    const m = /^\s*(?:ERROR|WARNING):\s*\d+:(\d+):\s*(.+)$/.exec(raw);
    if (!m) continue;
    out.push({ line: Number(m[1]) - offset - 1, text: m[2].trim() });
  }
  return out;
}

/* ── the canvas ───────────────────────────────────────────────────── */

type Vars = { a?: number; b?: number; c?: number };

type FrameInfo = {
  dt: number;
  time: number;
  frame: number;
  w: number;
  h: number;
  mouse: [number, number] | null;
};

function ShaderCanvas({
  frag,
  varsRef,
  timeRef,
  onFrame,
  onSample,
  label,
  className,
}: {
  frag: string;
  varsRef?: React.RefObject<Vars>;
  timeRef?: React.RefObject<number>;
  onFrame?: (info: FrameInfo) => void;
  onSample?: (value: number | null) => void;
  label: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const mouse = useRef<[number, number] | null>(null);
  const cbs = useRef({ onFrame, onSample });

  useEffect(() => {
    cbs.current = { onFrame, onSample };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let gl = glRef.current;
    if (!gl) {
      gl = canvas.getContext("webgl2", { antialias: false });
      if (!gl) return;
      glRef.current = gl;
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    }
    const ctx = gl;

    const build = (kind: number, src: string) => {
      const s = ctx.createShader(kind);
      if (!s) return null;
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      return s;
    };
    const vs = build(ctx.VERTEX_SHADER, VERT);
    const fs = build(ctx.FRAGMENT_SHADER, frag);
    const prog = ctx.createProgram();
    if (!vs || !fs || !prog) return;
    ctx.attachShader(prog, vs);
    ctx.attachShader(prog, fs);
    ctx.bindAttribLocation(prog, 0, "p");
    ctx.linkProgram(prog);
    ctx.deleteShader(vs);
    ctx.deleteShader(fs);
    if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) {
      ctx.deleteProgram(prog);
      return;
    }
    ctx.useProgram(prog);
    const at = (n: string) => ctx.getUniformLocation(prog, n);
    const loc = {
      res: at("u_resolution"),
      time: at("u_time"),
      mouse: at("u_mouse"),
      ink: at("u_ink"),
      bg: at("u_bg"),
      dim: at("u_dim"),
      hot: at("u_hot"),
      a: at("u_a"),
      b: at("u_b"),
      c: at("u_c"),
    };

    const host = canvas.parentElement ?? canvas;
    let tones = readTones(host);
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: "160px" },
    );
    io.observe(canvas);

    /* Someone who asked for less motion gets a still frame. The tuner,
     * the inspector and the timeline all still work — the picture just
     * stops moving on its own. */
    const rate =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 1;

    const px = new Uint8Array(4);
    /* The first rAF timestamp can predate the effect, so the clock
     * starts on the first frame rather than on setup. Otherwise frame
     * one reports a negative elapsed time. */
    let t0 = 0;
    let prev = 0;
    let frame = 0;
    let raf = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!t0) {
        t0 = now;
        prev = now;
      }
      const dt = Math.min(Math.max(now - prev, 0), 500);
      prev = now;
      if (!visible) return;
      if (frame % 30 === 0) tones = readTones(host);
      frame += 1;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const time = timeRef ? timeRef.current : ((now - t0) / 1000) * rate;
      const p = mouse.current;

      ctx.viewport(0, 0, w, h);
      ctx.uniform2f(loc.res, w, h);
      ctx.uniform1f(loc.time, time);
      ctx.uniform2f(
        loc.mouse,
        p ? p[0] * dpr : w * 0.5,
        p ? h - p[1] * dpr : h * 0.5,
      );
      ctx.uniform3fv(loc.bg, tones[0]);
      ctx.uniform3fv(loc.ink, tones[1]);
      ctx.uniform3fv(loc.dim, tones[2]);
      ctx.uniform3fv(loc.hot, tones[3]);
      const v = varsRef?.current;
      ctx.uniform1f(loc.a, v?.a ?? 0);
      ctx.uniform1f(loc.b, v?.b ?? 0);
      ctx.uniform1f(loc.c, v?.c ?? 0);
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);

      const cb = cbs.current;
      if (cb.onSample) {
        if (p) {
          ctx.readPixels(
            Math.min(w - 1, Math.max(0, Math.round(p[0] * dpr))),
            Math.min(h - 1, Math.max(0, Math.round(h - p[1] * dpr))),
            1,
            1,
            ctx.RGBA,
            ctx.UNSIGNED_BYTE,
            px,
          );
          const span = tones[1][0] - tones[0][0] || 1;
          const value = (px[0] / 255 - tones[0][0]) / span;
          cb.onSample(Math.min(1, Math.max(0, value)));
        } else {
          cb.onSample(null);
        }
      }
      cb.onFrame?.({ dt, time, frame, w, h, mouse: p });
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ctx.deleteProgram(prog);
    };
  }, [frag, varsRef, timeRef]);

  /* Contexts are capped by the browser, so hand this one back when the
   * canvas goes away — but only once it really has. In development the
   * component is mounted, torn down and mounted again on purpose, and
   * releasing on that first teardown leaves every later frame drawing
   * into a lost context. */
  useEffect(
    () => () => {
      const canvas = canvasRef.current;
      const gl = glRef.current;
      setTimeout(() => {
        if (gl && canvas && !canvas.isConnected) {
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        }
      }, 0);
    },
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      aria-label={label}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mouse.current = [e.clientX - r.left, e.clientY - r.top];
      }}
      onPointerLeave={() => {
        mouse.current = null;
      }}
      className={cn("bg-secondary block w-full rounded-lg border", className)}
    />
  );
}

/* ── small shared pieces ──────────────────────────────────────────── */

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

function Code({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-secondary text-caption overflow-x-auto rounded-lg border p-3 font-mono whitespace-pre",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="bg-secondary inline-flex flex-wrap rounded-full p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={cn(
            "text-ui-sm duration-fast ease-out-quart h-9 rounded-full px-3.5 transition-colors",
            value === o.id
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="text-caption text-muted-foreground w-28 shrink-0">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary h-9 min-w-0 flex-1"
      />
      <span className="text-caption w-14 shrink-0 text-right font-mono tabular-nums">
        {(format ?? ((v: number) => v.toFixed(2)))(value)}
      </span>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex h-9 items-center gap-2.5">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="text-ui-sm cursor-pointer">
        {label}
      </label>
    </div>
  );
}

/* ================================================================== *
 * 1 — the constant tuner
 * ================================================================== */

const ringsBody = (freq: string) => `  vec2 uv = (2. * gl_FragCoord.xy - u_resolution) / u_resolution.y;
  vec2 m = (2. * u_mouse - u_resolution) / u_resolution.y;
  float d = length(uv - m * .6);
  float g = .5 + .5 * sin(d * ${freq} - u_time * 1.2);
  fragColor = vec4(tone(g * exp(-d * .7) * .92 + .04), 1.);`;

const RINGS_LIVE = wrap(ringsBody("u_a"));
const ringsFixed = (v: number) => wrap(ringsBody(v.toFixed(1)));

function DragNumber({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const grab = useRef<{ x: number; v: number } | null>(null);
  const round = (v: number) => Math.round(clamp(v, min, max) / step) * step;
  return (
    <button
      type="button"
      role="slider"
      aria-label="Ring frequency"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Number(value.toFixed(1))}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        grab.current = { x: e.clientX, v: value };
      }}
      onPointerMove={(e) => {
        const g = grab.current;
        if (!g) return;
        onChange(round(g.v + (e.clientX - g.x) * ((max - min) / 260)));
      }}
      onPointerUp={(e) => {
        grab.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onKeyDown={(e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        onChange(round(value + d * step * (e.shiftKey ? 10 : 1)));
      }}
      className="text-caption hover:bg-muted focus-visible:ring-ring/50 mx-1 inline-flex h-9 min-w-14 cursor-ew-resize items-center justify-center rounded-md px-1.5 font-mono tabular-nums underline decoration-dotted decoration-1 underline-offset-4 transition-colors outline-none select-none focus-visible:ring-3"
    >
      {value.toFixed(1)}
    </button>
  );
}

function TunerBefore() {
  const [typed, setTyped] = useState("9.0");
  const [applied, setApplied] = useState(9);
  const id = useId();
  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={ringsFixed(applied)}
        label="Concentric rings drawn by a fragment shader"
        className="h-48"
      />
      <Code>
        {"float g = .5 + .5 * sin(d * "}
        <input
          id={id}
          aria-label="Ring frequency"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="bg-card focus-visible:ring-ring/50 focus-visible:border-ring text-caption h-9 w-20 rounded-md border px-2 text-center font-mono tabular-nums outline-none focus-visible:ring-3"
        />
        {" - u_time * 1.2);"}
      </Code>
      <Button
        size="lg"
        onClick={() => {
          const v = Number.parseFloat(typed);
          if (Number.isFinite(v)) setApplied(clamp(v, 1, 30));
        }}
      >
        Compile
      </Button>
    </div>
  );
}

function TunerAfter() {
  const vars = useRef<Vars>({ a: 9 });
  const [freq, setFreq] = useState(9);
  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={RINGS_LIVE}
        varsRef={vars}
        label="Concentric rings drawn by a fragment shader"
        className="h-48"
      />
      <Code className="flex flex-wrap items-center gap-x-1 whitespace-normal">
        <span>{"float g = .5 + .5 * sin(d *"}</span>
        <DragNumber
          value={freq}
          min={1}
          max={30}
          step={0.1}
          onChange={(v) => {
            vars.current.a = v;
            setFreq(v);
          }}
        />
        <span>{"- u_time * 1.2);"}</span>
      </Code>
    </div>
  );
}

/* ================================================================== *
 * 2 — the built-in uniform panel
 * ================================================================== */

const UNIFORMS = [
  { name: "u_resolution", type: "vec2", used: true },
  { name: "u_time", type: "float", used: true },
  { name: "u_mouse", type: "vec2", used: true },
  { name: "u_frame", type: "int", used: false },
  { name: "u_delta", type: "float", used: false },
  { name: "u_pixelRatio", type: "float", used: false },
  { name: "u_channel0", type: "sampler2D", used: false },
] as const;

const RINGS_FIXED = ringsFixed(9);

function UniformsBefore() {
  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={RINGS_FIXED}
        label="Rings that follow the pointer"
        className="h-44"
      />
      <div className="text-caption grid gap-x-6 gap-y-1.5 font-mono sm:grid-cols-2">
        {UNIFORMS.map((u) => (
          <span key={u.name}>
            {u.type} {u.name};
          </span>
        ))}
      </div>
    </div>
  );
}

function UniformsAfter() {
  const cells = useRef<Record<string, HTMLSpanElement | null>>({});
  const onFrame = useCallback((i: FrameInfo) => {
    const set = (k: string, v: string) => {
      const el = cells.current[k];
      if (el && el.textContent !== v) el.textContent = v;
    };
    set("u_resolution", `${i.w} × ${i.h}`);
    set("u_time", i.time.toFixed(2));
    set("u_mouse", i.mouse ? `${Math.round(i.mouse[0])}, ${Math.round(i.mouse[1])}` : "off canvas");
    set("u_frame", String(i.frame));
    set("u_delta", i.dt.toFixed(1) + " ms");
    set("u_pixelRatio", (window.devicePixelRatio || 1).toFixed(2));
    set("u_channel0", "none bound");
  }, []);

  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={RINGS_FIXED}
        onFrame={onFrame}
        label="Rings that follow the pointer"
        className="h-44"
      />
      <div className="grid gap-x-6 sm:grid-cols-2">
        {UNIFORMS.map((u) => (
          <div
            key={u.name}
            className="flex items-baseline justify-between gap-3 border-b py-1.5 last:border-b-0"
          >
            <span
              className={cn(
                "text-caption font-mono",
                u.used ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              {u.name}
            </span>
            <span
              ref={(el) => {
                cells.current[u.name] = el;
              }}
              className={cn(
                "text-caption shrink-0 font-mono tabular-nums",
                u.used ? "text-muted-foreground" : "text-muted-foreground/60",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== *
 * 3 — the expression inspector
 * ================================================================== */

const INSPECT_STEPS = `  vec2 uv = (2. * gl_FragCoord.xy - u_resolution) / u_resolution.y;
  vec2 m = (2. * u_mouse - u_resolution) / u_resolution.y;
  float d = length(uv - m);
  float w = sin(d * 8. - u_time * 1.2);
  float g = (.5 + .5 * w) * exp(-d * .7);`;

const inspectFrag = (expr: string) =>
  wrap(`${INSPECT_STEPS}\n  fragColor = vec4(tone(${expr}), 1.);`);

const CHIPS = [
  { label: "uv.x", expr: "uv.x * .5 + .5" },
  { label: "d", expr: "d * .5" },
  { label: "w", expr: "w * .5 + .5" },
  { label: "g", expr: "g" },
] as const;

function InspectBefore() {
  const [typed, setTyped] = useState("");
  const [frag, setFrag] = useState(() => inspectFrag("g"));
  const [error, setError] = useState("");
  const id = useId();

  const run = () => {
    const expr = typed.trim() || "g";
    const next = inspectFrag(expr);
    const log = compileLog(next);
    setError(log);
    if (!log) setFrag(next);
  };

  return (
    <div className="space-y-3">
      <ShaderCanvas frag={frag} label="Shader output" className="h-48" />
      <Code>{INSPECT_STEPS}</Code>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <label htmlFor={id} className="text-caption text-muted-foreground">
          Output
        </label>
        <input
          id={id}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="g"
          className="bg-card focus-visible:ring-ring/50 focus-visible:border-ring text-caption h-9 min-w-0 flex-1 rounded-md border px-2.5 font-mono outline-none focus-visible:ring-3"
        />
        <Button size="lg" type="submit">
          Compile
        </Button>
      </form>
      {error && (
        <pre className="text-caption text-destructive overflow-x-auto font-mono">
          {error}
        </pre>
      )}
    </div>
  );
}

function InspectAfter() {
  const [pick, setPick] = useState<string>("g");
  const readout = useRef<HTMLSpanElement>(null);
  const onSample = useCallback((v: number | null) => {
    const el = readout.current;
    if (!el) return;
    const text = v === null ? "hover the image" : v.toFixed(3);
    if (el.textContent !== text) el.textContent = text;
  }, []);
  const active = CHIPS.find((c) => c.label === pick) ?? CHIPS[3];

  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={inspectFrag(active.expr)}
        onSample={onSample}
        label={`Shader output for ${active.label}`}
        className="h-48"
      />
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-caption text-muted-foreground">
          {active.label} under the pointer
        </span>
        <span
          ref={readout}
          className="text-caption font-mono tabular-nums"
        >
          hover the image
        </span>
      </div>
      <Code className="whitespace-pre-wrap">
        {`  vec2 uv = (2. * gl_FragCoord.xy - u_resolution) / u_resolution.y;\n  vec2 m  = (2. * u_mouse - u_resolution) / u_resolution.y;\n  float `}
        <ExprChip chip={CHIPS[1]} pick={pick} onPick={setPick} />
        {` = length(`}
        <ExprChip chip={CHIPS[0]} pick={pick} onPick={setPick} label="uv" />
        {` - m);\n  float `}
        <ExprChip chip={CHIPS[2]} pick={pick} onPick={setPick} />
        {` = sin(d * 8. - u_time * 1.2);\n  float `}
        <ExprChip chip={CHIPS[3]} pick={pick} onPick={setPick} />
        {` = (.5 + .5 * w) * exp(-d * .7);`}
      </Code>
    </div>
  );
}

function ExprChip({
  chip,
  pick,
  onPick,
  label,
}: {
  chip: { label: string; expr: string };
  pick: string;
  onPick: (v: string) => void;
  label?: string;
}) {
  const on = pick === chip.label;
  return (
    <button
      type="button"
      onClick={() => onPick(chip.label)}
      aria-pressed={on}
      className={cn(
        "duration-fast ease-out-quart focus-visible:ring-ring/50 relative mx-0.5 inline-flex h-8 items-center rounded-md px-1.5.5 align-middle font-mono transition-colors outline-none after:absolute after:-inset-x-1 after:-inset-y-2 focus-visible:ring-3",
        on
          ? "bg-accent text-accent-foreground"
          : "bg-card hover:bg-muted border",
      )}
    >
      {label ?? chip.label}
    </button>
  );
}

/* ================================================================== *
 * 4 — errors, pointed at the line
 * ================================================================== */

const START_LINES = [
  "  vec2 uv = (2. * gl_FragCoord.xy - u_resolution) / u_resolution.y;",
  "  float d = length(uv);",
  "  flot g = .5 + .5 * sin(d * 9. - u_time);",
  "  fragColor = vec4(tone(g * exp(-d * .7)), 1.);",
];

function useErrors(lines: string[]) {
  const marks = useRef<Mark[]>([]);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const note = useRef<HTMLParagraphElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const rawPane = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const log = compileLog(wrap(lines.join("\n")));
    const found = parseLog(log, OFFSET);
    marks.current = found;

    lines.forEach((_, i) => {
      const hit = found.some((m) => m.line === i);
      dots.current[i]?.classList.toggle("opacity-0", !hit);
      rows.current[i]?.classList.toggle("border-destructive", hit);
      rows.current[i]?.classList.toggle("border-transparent", !hit);
    });

    const first = found[0];
    if (note.current) {
      note.current.textContent = first
        ? `Line ${first.line + 1} — ${first.text}`
        : "";
      note.current.classList.toggle("hidden", !first);
    }
    if (pill.current) {
      pill.current.textContent = found.length
        ? `${found.length} ${found.length === 1 ? "error" : "errors"}`
        : "Compiles";
      pill.current.classList.toggle("text-destructive", found.length > 0);
      pill.current.classList.toggle("text-positive", found.length === 0);
    }
    if (rawPane.current) {
      rawPane.current.textContent = log || "Shader compiled.";
    }
  }, [lines]);

  return { dots, rows, note, pill, rawPane };
}

function ErrorsBefore() {
  const [lines, setLines] = useState(START_LINES);
  const { rawPane } = useErrors(lines);
  return (
    <div className="space-y-3">
      <div className="bg-secondary rounded-lg border p-1.5">
        {lines.map((l, i) => (
          <input
            key={i}
            aria-label={`Source line ${i + 1}`}
            value={l}
            onChange={(e) =>
              setLines(lines.map((v, j) => (j === i ? e.target.value : v)))
            }
            className="text-caption focus-visible:bg-card h-9 w-full rounded-md bg-transparent px-2 font-mono outline-none"
          />
        ))}
      </div>
      <pre
        ref={rawPane}
        className="bg-secondary text-caption text-muted-foreground max-h-32 overflow-auto rounded-lg border p-3 font-mono"
      />
    </div>
  );
}

function ErrorsAfter() {
  const [lines, setLines] = useState(START_LINES);
  const { dots, rows, note, pill } = useErrors(lines);
  return (
    <div className="space-y-3">
      <div className="bg-secondary rounded-lg border p-1.5">
        {lines.map((l, i) => (
          <div
            key={i}
            ref={(el) => {
              rows.current[i] = el;
            }}
            className="flex items-center gap-1.5 border-l-2 border-transparent"
          >
            <span
              ref={(el) => {
                dots.current[i] = el;
              }}
              aria-hidden="true"
              className="bg-destructive duration-fast ml-1 size-1.5 shrink-0 rounded-full opacity-0 transition-opacity"
            />
            <span
              aria-hidden="true"
              className="text-caption text-muted-foreground/60 w-4 shrink-0 text-right font-mono tabular-nums"
            >
              {i + 1}
            </span>
            <input
              aria-label={`Source line ${i + 1}`}
              value={l}
              onChange={(e) =>
                setLines(lines.map((v, j) => (j === i ? e.target.value : v)))
              }
              className="text-caption focus-visible:bg-card h-9 w-full rounded-md bg-transparent px-2 font-mono outline-none"
            />
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <p ref={note} className="text-caption text-destructive font-mono" />
        <span ref={pill} className="text-micro shrink-0 uppercase" />
      </div>
    </div>
  );
}

/* ================================================================== *
 * 5 — where the colour blows past white
 * ================================================================== */

const EXPOSURE = wrap(`  vec2 uv = (2. * gl_FragCoord.xy - u_resolution) / u_resolution.y;
  float d = length(uv);
  float g = (.55 + .45 * sin(d * 7. - u_time * .9)) * exp(-d * d * 1.1) * u_a;
  float over = step(1.0001, g);
  float ck = mod(floor(gl_FragCoord.x / 7.) + floor(gl_FragCoord.y / 7.), 2.);
  vec3 warn = mix(u_hot, u_bg, ck * .75);
  fragColor = vec4(mix(tone(g), warn, over * u_b), 1.);`);

function OverBefore() {
  const vars = useRef<Vars>({ a: 2.2, b: 0 });
  const [exp, setExp] = useState(2.2);
  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={EXPOSURE}
        varsRef={vars}
        label="A glowing ring pattern"
        className="h-48"
      />
      <Slider
        label="Brightness"
        value={exp}
        min={0.4}
        max={3.4}
        step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => {
          vars.current.a = v;
          setExp(v);
        }}
      />
    </div>
  );
}

function OverAfter() {
  const vars = useRef<Vars>({ a: 2.2, b: 1 });
  const [exp, setExp] = useState(2.2);
  const [check, setCheck] = useState(true);
  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={EXPOSURE}
        varsRef={vars}
        label="A glowing ring pattern with the flattened areas marked"
        className="h-48"
      />
      <Slider
        label="Brightness"
        value={exp}
        min={0.4}
        max={3.4}
        step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => {
          vars.current.a = v;
          setExp(v);
        }}
      />
      <Toggle
        label="Mark what has gone flat"
        checked={check}
        onChange={(v) => {
          vars.current.b = v ? 1 : 0;
          setCheck(v);
        }}
      />
    </div>
  );
}

/* ================================================================== *
 * 6 — which pixels cost the most
 * ================================================================== */

const COST = wrap(`  vec2 uv = (2. * gl_FragCoord.xy - u_resolution) / u_resolution.y;
  vec2 c = uv * 1.25 + vec2(-.62, 0.);
  vec2 z = vec2(0.);
  float i = 0.;
  for (int k = 0; k < 160; k++) {
    if (float(k) >= u_a) break;
    z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y) + c;
    if (dot(z, z) > 4.) break;
    i += 1.;
  }
  float t = i / max(u_a, 1.);
  fragColor = vec4(mix(tone(t * .95 + .04), heat(pow(t, .55)), u_b), 1.);`);

const cost = (steps: number) => Math.round(14 + steps * 9);

function CostBefore() {
  const vars = useRef<Vars>({ a: 72, b: 0 });
  const [steps, setSteps] = useState(72);
  return (
    <div className="space-y-3">
      <ShaderCanvas frag={COST} varsRef={vars} label="An escape-time fractal" className="h-48" />
      <Slider
        label="Loop limit"
        value={steps}
        min={12}
        max={160}
        step={1}
        format={(v) => v.toFixed(0)}
        onChange={(v) => {
          vars.current.a = v;
          setSteps(v);
        }}
      />
      <p className="text-caption text-muted-foreground tabular-nums">
        ≈ {cost(steps)} instructions
      </p>
    </div>
  );
}

function CostAfter() {
  const vars = useRef<Vars>({ a: 72, b: 1 });
  const [steps, setSteps] = useState(72);
  const [heatOn, setHeatOn] = useState(true);
  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={COST}
        varsRef={vars}
        label="An escape-time fractal shaded by how much work each pixel took"
        className="h-48"
      />
      <Slider
        label="Loop limit"
        value={steps}
        min={12}
        max={160}
        step={1}
        format={(v) => v.toFixed(0)}
        onChange={(v) => {
          vars.current.a = v;
          setSteps(v);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle
          label="Shade by cost"
          checked={heatOn}
          onChange={(v) => {
            vars.current.b = v ? 1 : 0;
            setHeatOn(v);
          }}
        />
        <p className="text-caption text-muted-foreground tabular-nums">
          ≈ {cost(steps)} instructions
        </p>
      </div>
    </div>
  );
}

/* ================================================================== *
 * 7 — the hitch you would otherwise miss
 * ================================================================== */

const HITCH_MS = 160;

function stall() {
  const end = performance.now() + HITCH_MS;
  while (performance.now() < end) {
    /* block the frame on purpose */
  }
}

function HitchButton() {
  return (
    <Button size="lg" variant="secondary" onClick={stall}>
      <Zap aria-hidden="true" />
      Cause a hitch
    </Button>
  );
}

function FramesBefore() {
  const out = useRef<HTMLSpanElement>(null);
  const acc = useRef({ ms: 0, n: 0 });
  const onFrame = useCallback((i: FrameInfo) => {
    const a = acc.current;
    a.ms += i.dt;
    a.n += 1;
    if (a.ms < 500) return;
    const fps = Math.round((a.n * 1000) / a.ms);
    a.ms = 0;
    a.n = 0;
    if (out.current) out.current.textContent = `${fps} FPS`;
  }, []);
  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={RINGS_FIXED}
        onFrame={onFrame}
        label="Animated rings"
        className="h-44"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HitchButton />
        <span ref={out} className="text-ui font-mono tabular-nums">
          — FPS
        </span>
      </div>
    </div>
  );
}

function FramesAfter() {
  const graph = useRef<HTMLCanvasElement>(null);
  const buf = useRef<number[]>([]);
  const worst = useRef<HTMLSpanElement>(null);
  const tones = useRef<Tones | null>(null);
  const count = useRef(0);

  const onFrame = useCallback((i: FrameInfo) => {
    const cv = graph.current;
    if (!cv) return;
    const b = buf.current;
    b.push(Math.min(i.dt, 220));
    if (b.length > 150) b.shift();

    if (count.current % 30 === 0 || !tones.current) {
      tones.current = readTones(cv.parentElement ?? cv);
    }
    count.current += 1;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(cv.clientWidth * dpr));
    const h = Math.max(1, Math.round(cv.clientHeight * dpr));
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    const ctx = cv.getContext("2d");
    const tn = tones.current;
    if (!ctx || !tn) return;
    const css = (c: RGB, a = 1) =>
      `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

    ctx.clearRect(0, 0, w, h);
    const top = 60;
    const y16 = h - (16.7 / top) * h;
    ctx.strokeStyle = css(tn[2], 0.4);
    ctx.setLineDash([3 * dpr, 4 * dpr]);
    ctx.lineWidth = dpr;
    ctx.beginPath();
    ctx.moveTo(0, y16);
    ctx.lineTo(w, y16);
    ctx.stroke();
    ctx.setLineDash([]);

    const bw = w / 150;
    let peak = 0;
    b.forEach((ms, k) => {
      peak = Math.max(peak, ms);
      const bh = Math.max(dpr, Math.min(h, (ms / top) * h));
      ctx.fillStyle = ms > 24 ? css(tn[3]) : css(tn[2], 0.65);
      ctx.fillRect(k * bw, h - bh, Math.max(dpr, bw - dpr), bh);
    });
    if (worst.current) {
      const text = `worst ${peak.toFixed(0)} ms`;
      if (worst.current.textContent !== text) worst.current.textContent = text;
    }
  }, []);

  return (
    <div className="space-y-3">
      <ShaderCanvas
        frag={RINGS_FIXED}
        onFrame={onFrame}
        label="Animated rings"
        className="h-44"
      />
      <div className="bg-secondary rounded-lg border p-2">
        <canvas
          ref={graph}
          aria-label="Frame time over the last 150 frames"
          className="block h-16 w-full"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HitchButton />
        <span ref={worst} className="text-ui font-mono tabular-nums">
          worst — ms
        </span>
      </div>
    </div>
  );
}

/* ================================================================== *
 * 8 — pasting a Shadertoy shader in
 * ================================================================== */

const SHADERTOY = `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  float d = length(uv);
  float g = 0.5 + 0.5 * sin(d * 10.0 - iTime * 1.5);
  fragColor = vec4(vec3(g * exp(-d * 0.8)), 1.0);
}`;

const RAW_PREFIX = "#version 300 es\nprecision highp float;\nout vec4 outColor;\n";
const RAW_OFFSET = RAW_PREFIX.split("\n").length - 1;

/** What the importer does: rename the built-ins, then wrap mainImage. */
function convert(src: string) {
  const body = src
    .replace(/\biResolution\.xy\b/g, "u_resolution")
    .replace(/\biResolution\b/g, "vec3(u_resolution, 1.)")
    .replace(/\biTime\b/g, "u_time")
    .replace(/\biMouse\.xy\b/g, "u_mouse")
    .replace(/\biMouse\b/g, "vec4(u_mouse, 0., 0.)")
    .replace(/\bfragColor\b/g, "O");
  return `${HEAD}${body}
void main() {
  vec4 c = vec4(0.);
  mainImage(c, gl_FragCoord.xy);
  fragColor = vec4(tone(dot(c.rgb, vec3(.3333))), 1.);
}
`;
}

function Paste({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-caption text-muted-foreground">
        Pasted from Shadertoy
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        rows={6}
        className="bg-secondary focus-visible:ring-ring/50 focus-visible:border-ring text-caption w-full resize-y rounded-lg border p-3 font-mono outline-none focus-visible:ring-3"
      />
    </div>
  );
}

const CONVERTED = convert(SHADERTOY);

function ImportBefore() {
  const [src, setSrc] = useState(SHADERTOY);
  const [marks, setMarks] = useState<Mark[]>(() => []);
  const [ran, setRan] = useState(false);
  return (
    <div className="space-y-3">
      <div className="bg-secondary flex h-44 items-center justify-center rounded-lg border">
        <p className="text-caption text-muted-foreground">
          {ran && marks.length
            ? `Did not compile — ${marks.length} ${marks.length === 1 ? "error" : "errors"}`
            : "Nothing running"}
        </p>
      </div>
      <Paste value={src} onChange={setSrc} />
      <Button
        size="lg"
        onClick={() => {
          setMarks(parseLog(compileLog(RAW_PREFIX + src), RAW_OFFSET));
          setRan(true);
        }}
      >
        Load
      </Button>
      {ran && marks.length > 0 && (
        <ul className="space-y-1">
          {marks.slice(0, 4).map((m, i) => (
            <li key={i} className="text-caption text-destructive font-mono">
              line {m.line + 1} — {m.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ImportAfter() {
  const [src, setSrc] = useState(SHADERTOY);
  const [frag, setFrag] = useState<string | null>(CONVERTED);
  const [failed, setFailed] = useState("");
  return (
    <div className="space-y-3">
      {frag ? (
        <ShaderCanvas frag={frag} label="The imported shader, running" className="h-44" />
      ) : (
        <div className="bg-secondary flex h-44 items-center justify-center rounded-lg border">
          <p className="text-caption text-muted-foreground">
            {failed || "Nothing running"}
          </p>
        </div>
      )}
      <Paste value={src} onChange={setSrc} />
      <Button
        size="lg"
        onClick={() => {
          const next = convert(src);
          const log = compileLog(next);
          if (log) {
            setFailed(parseLog(log, 0)[0]?.text ?? "Could not convert this one.");
            setFrag(null);
          } else {
            setFailed("");
            setFrag(next);
          }
        }}
      >
        Load
      </Button>
    </div>
  );
}

/* ================================================================== *
 * 9 — getting it back out
 * ================================================================== */

const TARGETS = [
  { id: "webgl", label: "WebGL" },
  { id: "shadertoy", label: "Shadertoy" },
  { id: "hlsl", label: "HLSL" },
  { id: "metal", label: "Metal" },
  { id: "wgsl", label: "WGSL" },
] as const;

type Target = (typeof TARGETS)[number]["id"];

const EXPORTS: Record<Target, string> = {
  webgl: `out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;

void main() {
  vec2 uv = (2. * gl_FragCoord.xy - u_resolution) / u_resolution.y;
  float g = .5 + .5 * sin(length(uv) * 9. - u_time);
  fragColor = vec4(vec3(g), 1.);
}`,
  shadertoy: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2. * fragCoord - iResolution.xy) / iResolution.y;
  float g = .5 + .5 * sin(length(uv) * 9. - iTime);
  fragColor = vec4(vec3(g), 1.);
}`,
  hlsl: `cbuffer Args : register(b0) { float2 uResolution; float uTime; };

float4 main(float4 pos : SV_Position) : SV_Target {
  float2 uv = (2.0 * pos.xy - uResolution) / uResolution.y;
  float g = 0.5 + 0.5 * sin(length(uv) * 9.0 - uTime);
  return float4(g.xxx, 1.0);
}`,
  metal: `fragment float4 shade(VertexOut in [[stage_in]],
                      constant Args &u [[buffer(0)]]) {
  float2 uv = (2.0 * in.position.xy - u.resolution) / u.resolution.y;
  float g = 0.5 + 0.5 * sin(length(uv) * 9.0 - u.time);
  return float4(float3(g), 1.0);
}`,
  wgsl: `@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (2.0 * pos.xy - u.resolution) / u.resolution.y;
  let g = 0.5 + 0.5 * sin(length(uv) * 9.0 - u.time);
  return vec4f(vec3f(g), 1.0);
}`,
};

function copy(text: string, what: string) {
  void navigator.clipboard?.writeText(text).then(
    () => toast.success(`${what} copied`),
    () => toast.error("Could not copy"),
  );
}

function ExportBefore() {
  return (
    <div className="space-y-3">
      <Code className="max-h-56 overflow-auto">{EXPORTS.webgl}</Code>
      <Button size="lg" variant="secondary" onClick={() => copy(EXPORTS.webgl, "Source")}>
        <Copy aria-hidden="true" />
        Copy source
      </Button>
    </div>
  );
}

function ExportAfter() {
  const [target, setTarget] = useState<Target>("wgsl");
  const label = TARGETS.find((t) => t.id === target)?.label ?? "";
  return (
    <div className="space-y-3">
      <Segmented
        label="Export target"
        options={TARGETS}
        value={target}
        onChange={setTarget}
      />
      <Code className="max-h-56 overflow-auto">{EXPORTS[target]}</Code>
      <Button
        size="lg"
        variant="secondary"
        onClick={() => copy(EXPORTS[target], `${label} source`)}
      >
        <Copy aria-hidden="true" />
        Copy {label}
      </Button>
    </div>
  );
}

/* ================================================================== *
 * 10 — going back to the frame you liked
 * ================================================================== */

const LOOP = 5;
const TIMELINE = wrap(`  vec2 uv = (2. * gl_FragCoord.xy - u_resolution) / u_resolution.y;
  float d = length(uv);
  float a = atan(uv.y, uv.x);
  float g = .5 + .5 * sin(d * 8. + a * 3. - u_time * 1.2566);
  fragColor = vec4(tone(g * exp(-d * .7) * .92 + .04), 1.);`);

function useClock() {
  const time = useRef(0);
  const running = useRef(true);
  const [playing, setPlaying] = useState(true);
  const scrub = useRef<HTMLInputElement>(null);
  const readout = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(now - prev, 500) / 1000;
      prev = now;
      if (running.current) {
        time.current = (time.current + dt) % LOOP;
        if (scrub.current) scrub.current.value = time.current.toFixed(3);
      }
      if (readout.current) {
        const text = `${time.current.toFixed(2)}s`;
        if (readout.current.textContent !== text) readout.current.textContent = text;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggle = () => {
    running.current = !running.current;
    setPlaying(running.current);
  };

  return { time, playing, toggle, scrub, readout, running };
}

function PlayButton({ playing, onClick }: { playing: boolean; onClick: () => void }) {
  return (
    <Button
      size="icon-lg"
      variant="secondary"
      onClick={onClick}
      aria-label={playing ? "Pause" : "Play"}
    >
      {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
    </Button>
  );
}

function TimeBefore() {
  const { time, playing, toggle } = useClock();
  return (
    <div className="space-y-3">
      <ShaderCanvas frag={TIMELINE} timeRef={time} label="A looping spiral" className="h-48" />
      <PlayButton playing={playing} onClick={toggle} />
    </div>
  );
}

function TimeAfter() {
  const { time, playing, toggle, scrub, readout, running } = useClock();
  const id = useId();
  return (
    <div className="space-y-3">
      <ShaderCanvas frag={TIMELINE} timeRef={time} label="A looping spiral" className="h-48" />
      <div className="flex items-center gap-3">
        <PlayButton playing={playing} onClick={toggle} />
        <input
          ref={scrub}
          id={id}
          type="range"
          aria-label="Scrub the timeline"
          min={0}
          max={LOOP}
          step={0.001}
          defaultValue={0}
          onPointerDown={() => {
            running.current = false;
          }}
          onChange={(e) => {
            time.current = Number(e.target.value);
          }}
          className="accent-primary h-9 min-w-0 flex-1"
        />
        <span
          ref={readout}
          className="text-caption w-12 shrink-0 text-right font-mono tabular-nums"
        >
          0.00s
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */

export function FragcoordXyzDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Drag the number in the code and the picture moves with your finger."
        before={<TunerBefore />}
        after={<TunerAfter />}
      />
      <BeforeAfter
        principle="You can see which ones the shader is using, and what they are right now."
        before={<UniformsBefore />}
        after={<UniformsAfter />}
      />
      <BeforeAfter
        principle="Click a piece of the formula to see it on its own, and read the value under your pointer."
        before={<InspectBefore />}
        after={<InspectAfter />}
      />
      <BeforeAfter
        principle="It points at the broken line instead of making you count them."
        before={<ErrorsBefore />}
        after={<ErrorsAfter />}
      />
      <BeforeAfter
        principle="Turn the brightness up. You can see exactly where the picture has gone flat instead of guessing."
        before={<OverBefore />}
        after={<OverAfter />}
      />
      <BeforeAfter
        principle="Now you can see which pixels are the expensive ones."
        before={<CostBefore />}
        after={<CostAfter />}
      />
      <BeforeAfter
        principle="Press the button. The stutter stays on screen instead of disappearing into an average."
        before={<FramesBefore />}
        after={<FramesAfter />}
      />
      <BeforeAfter
        principle="Paste someone else's shader and it just runs."
        before={<ImportBefore />}
        after={<ImportAfter />}
      />
      <BeforeAfter
        principle="Pick where you are pasting it and it comes out in that language."
        before={<ExportBefore />}
        after={<ExportAfter />}
      />
      <BeforeAfter
        principle="You can go back to the exact moment you liked."
        before={<TimeBefore />}
        after={<TimeAfter />}
      />
    </div>
  );
}
