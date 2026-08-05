"use client";

import { motion, useAnimationFrame } from "motion/react";
import {
  ChevronDown,
  Clipboard,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ================================================================== *
 * DialKit v1.4.3 — before and after.
 *
 * `dialkit` is dev tooling and is not a dependency of this repo, so the
 * panels, sliders, spring editor and timeline below are reimplemented
 * from the package README. Both sides of every switch are real, working
 * UI: the left one is what a normal tweaking panel ships, the right one
 * is what DialKit does instead.
 * ================================================================== */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* ── springs ──────────────────────────────────────────────────────── */

type Spring =
  | { mode: "time"; visualDuration: number; bounce: number }
  | { mode: "physics"; stiffness: number; damping: number; mass: number };

function springParams(s: Spring) {
  if (s.mode === "physics") {
    const w0 = Math.sqrt(s.stiffness / s.mass);
    const zeta = s.damping / (2 * Math.sqrt(s.stiffness * s.mass));
    return { w0, zeta };
  }
  const zeta = clamp(1 - s.bounce, 0.05, 1);
  const w0 = (2 * Math.PI) / (s.visualDuration * 1.2);
  return { w0, zeta };
}

/** Damped-spring position, 0 → 1. A preview, not Motion frame-for-frame. */
function springAt(t: number, s: Spring) {
  const { w0, zeta } = springParams(s);
  if (t <= 0) return 0;
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * w0 * t) *
        (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
    );
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

function settleTime(s: Spring) {
  const { w0, zeta } = springParams(s);
  return clamp(5.3 / (zeta * w0), 0.1, 6);
}

/** The whole curve squeezed into 0 → 1, however long it settles. */
function springEase(p: number, bounce: number) {
  const s: Spring = { mode: "time", visualDuration: 1, bounce };
  return springAt(clamp(p, 0, 1) * settleTime(s), s);
}

/** README → "Auto-inferred": min/max/step for a bare number. */
function inferRange(v: number) {
  const a = Math.abs(v);
  if (a <= 1) return { min: 0, max: 1, step: 0.01 };
  const max = a >= 100 ? Math.round(v * 3) : Math.round(v * 300) / 100;
  if (a <= 10) return { min: 0, max, step: 0.1 };
  if (a <= 100) return { min: 0, max, step: 1 };
  return { min: 0, max, step: 10 };
}

/* ── primitives ───────────────────────────────────────────────────── */

function Stage({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "bg-secondary relative grid min-h-44 place-items-center overflow-hidden rounded-xl border",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Chrome({
  title,
  tools,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  tools?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card shadow-floating w-full overflow-hidden rounded-xl border",
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between gap-2 border-b px-2.5">
        <span className="text-micro text-muted-foreground truncate uppercase">
          {title}
        </span>
        {tools}
      </div>
      <div className={cn("space-y-2.5 p-2.5", bodyClassName)}>{children}</div>
    </div>
  );
}

function Split({ stage, panel }: { stage: ReactNode; panel: ReactNode }) {
  return (
    <div className="grid items-start gap-3 sm:grid-cols-[1fr_15rem]">
      <div>{stage}</div>
      <div>{panel}</div>
    </div>
  );
}

function Pill({ text, on }: { text: string; on?: boolean }) {
  return (
    <span
      className={cn(
        "text-micro duration-fast shrink-0 rounded border px-1.5 py-0.5 uppercase transition-colors",
        on
          ? "bg-accent text-accent-foreground border-transparent"
          : "bg-secondary text-muted-foreground",
      )}
    >
      {text}
    </span>
  );
}

function Folder({
  label,
  startOpen = true,
  children,
}: {
  label: string;
  startOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="text-caption flex h-9 w-full items-center gap-1.5 px-2"
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        {label}
      </button>
      {open && <div className="space-y-2.5 border-t p-2">{children}</div>}
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
      className="bg-secondary flex gap-0.5 rounded-lg border p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "text-caption duration-fast h-9 flex-1 rounded-md transition-colors",
            value === o.id
              ? "bg-card text-foreground border shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── the slider ───────────────────────────────────────────────────── */

function Track({
  value,
  min,
  max,
  step,
  onChange,
  labelledBy,
  live,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  labelledBy: string;
  /** DialKit feel: a press springs the fill across, the ends push back. */
  live?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState(0);

  const quant = (v: number) => {
    const q = Math.round((v - min) / step) * step + min;
    return clamp(Number(q.toFixed(4)), min, max);
  };

  const read = (clientX: number) => {
    const el = track.current;
    if (!el) return { v: value, band: 0 };
    const r = el.getBoundingClientRect();
    const raw = min + ((clientX - r.left) / r.width) * (max - min);
    const excess =
      clientX < r.left
        ? clientX - r.left
        : clientX > r.right
          ? clientX - r.right
          : 0;
    // Resistance grows with distance, capped at 14px.
    const band = Math.sign(excess) * 14 * (1 - 1 / (1 + Math.abs(excess) / 70));
    return { v: quant(raw), band: live ? band : 0 };
  };

  const pct = ((clamp(value, min, max) - min) / (max - min)) * 100;

  return (
    <div
      ref={track}
      role="slider"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(quant(value + step));
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(quant(value - step));
        }
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        onChange(read(e.clientX).v);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        const { v, band } = read(e.clientX);
        onChange(v);
        setOver(band);
      }}
      onPointerUp={() => {
        setDragging(false);
        setOver(0);
      }}
      onPointerCancel={() => {
        setDragging(false);
        setOver(0);
      }}
      className="bg-secondary focus-visible:border-ring h-9 cursor-ew-resize touch-none overflow-hidden rounded-lg border outline-none"
    >
      <div
        className={cn(
          "bg-feature h-full",
          live && !dragging && "ease-spring transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300",
        )}
        style={{ width: `${pct}%`, transform: `translateX(${over}px)` }}
      />
    </div>
  );
}

/** The number beside a slider. Typeable only in the DialKit version. */
function ValueField({
  value,
  decimals,
  onCommit,
  typeable,
}: {
  value: number;
  decimals: number;
  onCommit: (v: number) => void;
  typeable?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!typeable)
    return (
      <span className="text-caption text-muted-foreground tabular-nums">
        {value.toFixed(decimals)}
      </span>
    );

  if (editing)
    return (
      <input
        autoFocus
        value={draft}
        aria-label="Exact value"
        inputMode="decimal"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = Number(draft);
          if (draft.trim() !== "" && !Number.isNaN(n)) onCommit(n);
          setEditing(false);
          setArmed(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setEditing(false);
            setArmed(false);
          }
        }}
        className="text-caption bg-background focus-visible:border-ring h-9 w-16 rounded-md border px-1.5 text-right tabular-nums outline-none"
      />
    );

  return (
    <button
      type="button"
      aria-label="Type an exact value"
      onPointerEnter={() => {
        timer.current = setTimeout(() => setArmed(true), 800);
      }}
      onPointerLeave={() => {
        if (timer.current) clearTimeout(timer.current);
        setArmed(false);
      }}
      onFocus={() => setArmed(true)}
      onBlur={() => setArmed(false)}
      onClick={() => {
        setDraft(value.toFixed(decimals));
        setEditing(true);
      }}
      className={cn(
        "text-caption duration-fast h-9 rounded-md border px-1.5 tabular-nums transition-colors",
        armed
          ? "bg-secondary text-foreground cursor-text"
          : "text-muted-foreground border-transparent",
      )}
    >
      {value.toFixed(decimals)}
    </button>
  );
}

let rowSeq = 0;

function NumRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  live,
  typeable,
  pill,
  bounds,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  live?: boolean;
  typeable?: boolean;
  pill?: ReactNode;
  bounds?: boolean;
}) {
  const id = useMemo(() => {
    rowSeq += 1;
    return `dk-row-${rowSeq}`;
  }, []);
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  const quant = (v: number) =>
    clamp(
      Number((Math.round((v - min) / step) * step + min).toFixed(4)),
      min,
      max,
    );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span id={id} className="text-caption truncate">
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {pill}
          <ValueField
            value={value}
            decimals={decimals}
            typeable={typeable}
            onCommit={(v) => onChange(quant(v))}
          />
        </div>
      </div>
      <Track
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        labelledBy={id}
        live={live}
      />
      {bounds && (
        <div className="text-micro text-muted-foreground flex justify-between tabular-nums">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

/* ── artwork ──────────────────────────────────────────────────────── */

function PhotoCard({
  style,
  accent,
  title = "Japan",
  sub = "December 2025",
  className,
}: {
  style?: CSSProperties;
  accent?: string;
  title?: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      style={style}
      className={cn(
        "bg-card w-40 shrink-0 overflow-hidden rounded-xl border",
        className,
      )}
    >
      <div
        className="h-20"
        style={{ background: accent ?? "var(--feature)" }}
        aria-hidden
      />
      <div className="p-2.5">
        <p className="text-ui-sm truncate">{title}</p>
        <p className="text-caption text-muted-foreground truncate">{sub}</p>
      </div>
    </div>
  );
}

/* ── 1 · the range fits the value ─────────────────────────────────── */

function RangeDemo({ pro }: { pro: boolean }) {
  const [scale, setScale] = useState(1.2);
  const r = pro ? inferRange(1.2) : { min: 0, max: 100, step: 1 };
  return (
    <Split
      stage={
        <Stage className="min-h-56">
          <PhotoCard style={{ transform: `scale(${scale})` }} />
        </Stage>
      }
      panel={
        <Chrome title="Card">
          <NumRow
            label="Scale"
            value={scale}
            min={r.min}
            max={r.max}
            step={r.step}
            onChange={setScale}
            bounds
          />
        </Chrome>
      }
    />
  );
}

/* ── 2 · how the slider moves ─────────────────────────────────────── */

function FeelDemo({ pro }: { pro: boolean }) {
  const [blur, setBlur] = useState(18);
  return (
    <Split
      stage={
        <Stage>
          <PhotoCard style={{ filter: `blur(${blur / 4}px)` }} />
        </Stage>
      }
      panel={
        <Chrome title="Card">
          <NumRow
            label="Blur"
            value={blur}
            min={0}
            max={100}
            step={1}
            onChange={setBlur}
            live={pro}
          />
        </Chrome>
      }
    />
  );
}

/* ── 3 · type the number you already know ─────────────────────────── */

function TypeDemo({ pro }: { pro: boolean }) {
  const [radius, setRadius] = useState(14);
  return (
    <Split
      stage={
        <Stage>
          <PhotoCard style={{ borderRadius: radius }} />
        </Stage>
      }
      panel={
        <Chrome title="Card">
          <NumRow
            label="Corner radius"
            value={radius}
            min={0}
            max={64}
            step={1}
            onChange={setRadius}
            live={pro}
            typeable={pro}
          />
        </Chrome>
      }
    />
  );
}

/* ── 4 · picking a colour ─────────────────────────────────────────── */

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function ColourDemo({ pro }: { pro: boolean }) {
  // taste-check-ignore: typing a hex IS this demo
  const [text, setText] = useState("#c41e3a");
  const valid = HEX.test(text.trim());
  const colour = valid ? text.trim() : "transparent";
  return (
    <Split
      stage={
        <Stage>
          <PhotoCard accent={colour} />
        </Stage>
      }
      panel={
        <Chrome title="Card">
          <div className="space-y-1">
            <label htmlFor="dk-accent" className="text-caption block">
              Accent colour
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="dk-accent"
                value={text}
                spellCheck={false}
                onChange={(e) => setText(e.target.value)}
                className="text-caption bg-background focus-visible:border-ring h-9 w-full min-w-0 rounded-md border px-2 font-mono outline-none"
              />
              {pro && (
                <label
                  className="focus-within:border-ring size-9 shrink-0 cursor-pointer rounded-md border"
                  style={{ background: colour }}
                  aria-label="Open the colour picker"
                >
                  <input
                    type="color"
                    // taste-check-ignore: fallback for the picker input
                    value={valid ? text.trim() : "#000000"}
                    onChange={(e) => setText(e.target.value)}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>
        </Chrome>
      }
    />
  );
}

/* ── 5 · the spring editor ────────────────────────────────────────── */

function SpringCurve({ s }: { s: Spring }) {
  const d = useMemo(() => {
    const T = settleTime(s);
    const pts: string[] = [];
    for (let i = 0; i <= 72; i++) {
      const t = (i / 72) * T;
      pts.push(`${(i / 72) * 100},${46 - springAt(t, s) * 32}`);
    }
    return `M${pts.join(" L")}`;
  }, [s]);
  return (
    <svg
      viewBox="0 0 100 56"
      preserveAspectRatio="none"
      className="h-14 w-full"
      aria-hidden
    >
      <line
        x1="0"
        y1="14"
        x2="100"
        y2="14"
        className="stroke-border"
        strokeWidth="0.5"
      />
      <line
        x1="0"
        y1="46"
        x2="100"
        y2="46"
        className="stroke-border"
        strokeWidth="0.5"
      />
      <path
        d={d}
        fill="none"
        className="stroke-accent-solid"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type SpringField = {
  k: string;
  v: number;
  min: number;
  max: number;
  step: number;
};

function SpringDemo({ pro }: { pro: boolean }) {
  const [s, setS] = useState<Spring>({
    mode: "physics",
    stiffness: 200,
    damping: 14,
    mass: 1,
  });
  const [side, setSide] = useState(-1);

  const transition =
    s.mode === "time"
      ? {
          type: "spring" as const,
          visualDuration: s.visualDuration,
          bounce: s.bounce,
        }
      : {
          type: "spring" as const,
          stiffness: s.stiffness,
          damping: s.damping,
          mass: s.mass,
        };

  const rows: SpringField[] =
    s.mode === "time"
      ? [
          {
            k: "Visual duration",
            v: s.visualDuration,
            min: 0.1,
            max: 1,
            step: 0.05,
          },
          { k: "Bounce", v: s.bounce, min: 0, max: 1, step: 0.01 },
        ]
      : [
          { k: "Stiffness", v: s.stiffness, min: 1, max: 600, step: 1 },
          { k: "Damping", v: s.damping, min: 1, max: 60, step: 1 },
          { k: "Mass", v: s.mass, min: 0.1, max: 4, step: 0.1 },
        ];

  const setField = (k: string, v: number) =>
    setS((p) => {
      if (p.mode === "time")
        return k === "Visual duration"
          ? { ...p, visualDuration: v }
          : { ...p, bounce: v };
      if (k === "Stiffness") return { ...p, stiffness: v };
      if (k === "Damping") return { ...p, damping: v };
      return { ...p, mass: v };
    });

  return (
    <Split
      stage={
        <Stage className="place-items-stretch p-4">
          <div className="flex flex-col justify-between gap-4">
            <div className="grid flex-1 place-items-center">
              <motion.div
                animate={{ x: side * 70 }}
                transition={transition}
                className="bg-feature text-feature-foreground text-caption grid size-14 place-items-center rounded-xl"
              >
                x
              </motion.div>
            </div>
            <Button
              variant="outline"
              className="h-9 self-start"
              onClick={() => setSide((p) => -p)}
            >
              <Play aria-hidden className="size-3.5" />
              Play
            </Button>
          </div>
        </Stage>
      }
      panel={
        <Chrome title="Card">
          {pro && (
            <>
              <Segmented
                label="Spring mode"
                value={s.mode}
                onChange={(m) =>
                  setS(
                    m === "time"
                      ? { mode: "time", visualDuration: 0.5, bounce: 0.4 }
                      : {
                          mode: "physics",
                          stiffness: 200,
                          damping: 14,
                          mass: 1,
                        },
                  )
                }
                options={[
                  { id: "time" as const, label: "Time" },
                  { id: "physics" as const, label: "Physics" },
                ]}
              />
              <div className="bg-background rounded-lg border px-1">
                <SpringCurve s={s} />
              </div>
            </>
          )}
          {pro
            ? rows.map((r) => (
                <NumRow
                  key={r.k}
                  label={r.k}
                  value={r.v}
                  min={r.min}
                  max={r.max}
                  step={r.step}
                  onChange={(v) => setField(r.k, v)}
                  live
                />
              ))
            : rows.map((r) => (
                <div key={r.k} className="space-y-1">
                  <label
                    htmlFor={`dk-plain-${r.k}`}
                    className="text-caption block truncate"
                  >
                    {r.k}
                  </label>
                  <input
                    id={`dk-plain-${r.k}`}
                    type="number"
                    value={r.v}
                    min={r.min}
                    max={r.max}
                    step={r.step}
                    onChange={(e) =>
                      setField(
                        r.k,
                        clamp(e.target.valueAsNumber || 0, r.min, r.max),
                      )
                    }
                    className="text-caption bg-background focus-visible:border-ring h-9 w-full rounded-md border px-2 tabular-nums outline-none"
                  />
                </div>
              ))}
        </Chrome>
      }
    />
  );
}

/* ── 6 · folders ──────────────────────────────────────────────────── */

type Field = {
  key: string;
  flat: string;
  short: string;
  group?: "Back photo" | "Shadow" | "Legacy";
  min: number;
  max: number;
  step: number;
  def: number;
};

const STACK_FIELDS: Field[] = [
  { key: "radius", flat: "Radius", short: "Radius", min: 0, max: 40, step: 1, def: 14 },
  { key: "pagePadding", flat: "Page Padding", short: "Page padding", min: 0, max: 56, step: 1, def: 20 },
  { key: "offsetX", flat: "Back Photo Offset X", short: "Offset X", group: "Back photo", min: 0, max: 120, step: 1, def: 46 },
  { key: "offsetY", flat: "Back Photo Offset Y", short: "Offset Y", group: "Back photo", min: 0, max: 60, step: 1, def: 10 },
  { key: "backScale", flat: "Back Photo Scale", short: "Scale", group: "Back photo", min: 0.5, max: 1, step: 0.01, def: 0.82 },
  { key: "overlay", flat: "Back Photo Overlay Opacity", short: "Overlay opacity", group: "Back photo", min: 0, max: 1, step: 0.01, def: 0.4 },
  { key: "shadowBlur", flat: "Shadow Blur", short: "Blur", group: "Shadow", min: 0, max: 60, step: 1, def: 18 },
  { key: "shadowOpacity", flat: "Shadow Opacity", short: "Opacity", group: "Shadow", min: 0, max: 0.6, step: 0.01, def: 0.18 },
  { key: "shadowSpread", flat: "Shadow Spread", short: "Spread", group: "Shadow", min: 0, max: 12, step: 1, def: 0 },
  { key: "grain", flat: "Legacy Grain", short: "Grain", group: "Legacy", min: 0, max: 1, step: 0.01, def: 0.2 },
  { key: "vignette", flat: "Legacy Vignette", short: "Vignette", group: "Legacy", min: 0, max: 1, step: 0.01, def: 0.3 },
];

const STACK_DEFAULTS = Object.fromEntries(
  STACK_FIELDS.map((f) => [f.key, f.def]),
) as Record<string, number>;

function PhotoStack({ v }: { v: Record<string, number> }) {
  return (
    <div
      className="grid w-full place-items-center transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200"
      style={{ padding: v.pagePadding }}
    >
      <div className="relative h-32 w-64">
        <div
          className="bg-card absolute h-28 w-36 overflow-hidden border"
          style={{
            left: v.offsetX,
            top: v.offsetY,
            borderRadius: v.radius,
            transform: `scale(${v.backScale})`,
          }}
        >
          <div className="h-full" style={{ background: "var(--feature)" }} />
          <div
            className="absolute inset-0"
            style={{ background: "var(--card)", opacity: v.overlay }}
          />
        </div>
        <div
          className="bg-card absolute top-0 left-0 h-28 w-36 overflow-hidden border"
          style={{
            borderRadius: v.radius,
            boxShadow: `0 6px ${v.shadowBlur}px ${v.shadowSpread}px color-mix(in oklab, var(--foreground) ${
              v.shadowOpacity * 100
            }%, transparent)`,
          }}
        >
          <div className="h-20" style={{ background: "var(--feature)" }} />
          <div className="px-2 py-1">
            <p className="text-caption truncate">Japan</p>
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, transparent 40%, var(--foreground) 140%)",
              opacity: v.vignette * 0.5 + v.grain * 0.1,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function FolderDemo({ pro }: { pro: boolean }) {
  const [v, setV] = useState(STACK_DEFAULTS);
  const set = (k: string) => (n: number) => setV((p) => ({ ...p, [k]: n }));

  const row = (f: Field, short: boolean) => (
    <NumRow
      key={f.key}
      label={short ? f.short : f.flat}
      value={v[f.key]}
      min={f.min}
      max={f.max}
      step={f.step}
      onChange={set(f.key)}
      live={pro}
    />
  );

  const group = (name: Field["group"]) =>
    STACK_FIELDS.filter((f) => f.group === name);

  return (
    <Split
      stage={
        <Stage className="p-0">
          <PhotoStack v={v} />
        </Stage>
      }
      panel={
        <Chrome title="Photo Stack" bodyClassName="max-h-96 overflow-y-auto">
          {pro ? (
            <>
              {group(undefined).map((f) => row(f, true))}
              <Folder label="Back photo">
                {group("Back photo").map((f) => row(f, true))}
              </Folder>
              <Folder label="Shadow">
                {group("Shadow").map((f) => row(f, true))}
              </Folder>
              <Folder label="Legacy" startOpen={false}>
                {group("Legacy").map((f) => row(f, true))}
              </Folder>
            </>
          ) : (
            STACK_FIELDS.map((f) => row(f, false))
          )}
        </Chrome>
      }
    />
  );
}

/* ── 7 · versions you can go back to ──────────────────────────────── */

const PRESET_FIELDS = [
  { key: "radius", label: "Radius", min: 0, max: 48, step: 1, def: 14 },
  { key: "blur", label: "Blur", min: 0, max: 40, step: 1, def: 0 },
  { key: "scale", label: "Scale", min: 0.5, max: 1.6, step: 0.01, def: 1 },
];

const PRESET_DEFAULTS = Object.fromEntries(
  PRESET_FIELDS.map((f) => [f.key, f.def]),
) as Record<string, number>;

function PresetDemo({ pro }: { pro: boolean }) {
  const [versions, setVersions] = useState<
    { name: string; values: Record<string, number> }[]
  >([{ name: "Version 1", values: PRESET_DEFAULTS }]);
  const [active, setActive] = useState(0);

  const values = versions[active].values;
  const set = (k: string) => (n: number) =>
    setVersions((p) =>
      p.map((ver, i) =>
        i === active ? { ...ver, values: { ...ver.values, [k]: n } } : ver,
      ),
    );

  const addVersion = () => {
    setVersions((p) => [...p, { name: `Version ${p.length + 1}`, values }]);
    setActive(versions.length);
  };

  const copy = () => {
    navigator.clipboard
      ?.writeText(JSON.stringify(values, null, 2))
      .then(() =>
        toast.success("Copied", { description: "The values are on your clipboard." }),
      )
      .catch(() => toast.error("Clipboard unavailable"));
  };

  return (
    <Split
      stage={
        <Stage>
          <PhotoCard
            style={{
              borderRadius: values.radius,
              filter: `blur(${values.blur / 4}px)`,
              transform: `scale(${values.scale})`,
            }}
          />
        </Stage>
      }
      panel={
        <Chrome
          title="Card"
          tools={
            pro ? (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Save these values as a new version"
                  onClick={addVersion}
                  className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-md"
                >
                  <Plus aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Copy the values"
                  onClick={copy}
                  className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-md"
                >
                  <Clipboard aria-hidden className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Reset to the defaults"
                onClick={() => {
                  setVersions([{ name: "Version 1", values: PRESET_DEFAULTS }]);
                  setActive(0);
                }}
                className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-md"
              >
                <RotateCcw aria-hidden className="size-3.5" />
              </button>
            )
          }
        >
          {pro && (
            <div className="space-y-1">
              <label htmlFor="dk-version" className="text-caption block">
                Version
              </label>
              <select
                id="dk-version"
                value={active}
                onChange={(e) => setActive(Number(e.target.value))}
                className="text-caption bg-background focus-visible:border-ring h-9 w-full rounded-md border px-2 outline-none"
              >
                {versions.map((ver, i) => (
                  <option key={ver.name} value={i}>
                    {ver.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {PRESET_FIELDS.map((f) => (
            <NumRow
              key={f.key}
              label={f.label}
              value={values[f.key]}
              min={f.min}
              max={f.max}
              step={f.step}
              onChange={set(f.key)}
              live={pro}
            />
          ))}
        </Chrome>
      }
    />
  );
}

/* ── 8 · it survives a reload ─────────────────────────────────────── */

const STORE_KEY = "dialkit:onboarding";

type Onboarding = { avatarScale: number; name: string };
const ONBOARDING_DEFAULTS: Onboarding = { avatarScale: 1, name: "Avery" };

function PersistPanel({
  persist,
  restore,
}: {
  persist: boolean;
  restore: boolean;
}) {
  const [values, setValues] = useState<Onboarding>(() => {
    if (!persist || !restore) return ONBOARDING_DEFAULTS;
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw) as Onboarding;
    } catch {
      /* storage unavailable */
    }
    return ONBOARDING_DEFAULTS;
  });

  const write = (next: Onboarding) => {
    setValues(next);
    if (!persist) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <Split
      stage={
        <Stage>
          <div className="flex flex-col items-center">
            <div
              className="bg-feature text-feature-foreground text-title grid size-16 place-items-center rounded-full"
              style={{ transform: `scale(${values.avatarScale})` }}
              aria-hidden
            >
              {values.name.trim().slice(0, 1).toUpperCase() || "?"}
            </div>
            <p className="text-ui mt-6">{values.name || "—"}</p>
          </div>
        </Stage>
      }
      panel={
        <Chrome title="Onboarding">
          <div className="space-y-1">
            <label htmlFor="dk-name" className="text-caption block">
              Name
            </label>
            <input
              id="dk-name"
              value={values.name}
              placeholder="Name"
              onChange={(e) => write({ ...values, name: e.target.value })}
              className="text-caption bg-background focus-visible:border-ring h-9 w-full rounded-md border px-2 outline-none"
            />
          </div>
          <NumRow
            label="Avatar scale"
            value={values.avatarScale}
            min={0.6}
            max={1.6}
            step={0.01}
            onChange={(v) => write({ ...values, avatarScale: v })}
            live={persist}
          />
        </Chrome>
      }
    />
  );
}

function PersistDemo({ pro }: { pro: boolean }) {
  const [nonce, setNonce] = useState(0);
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="h-9"
        onClick={() => setNonce((n) => n + 1)}
      >
        <RotateCcw aria-hidden className="size-3.5" />
        Reload the page
      </Button>
      <PersistPanel key={nonce} persist={pro} restore={nonce > 0} />
    </div>
  );
}

/* ── 9 · adjust without going to the panel ────────────────────────── */

function ShortcutDemo({ pro }: { pro: boolean }) {
  const [blur, setBlur] = useState(6);
  const [held, setHeld] = useState(false);
  const inside = useRef(false);
  const lastX = useRef<number | null>(null);
  const blurRef = useRef(blur);
  blurRef.current = blur;

  useEffect(() => {
    if (!pro) return;
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "b" || !inside.current) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      e.preventDefault();
      setHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "b") return;
      lastX.current = null;
      setHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [pro]);

  return (
    <Split
      stage={
        <Stage
          className={cn(held && "border-accent-solid")}
          style={{ cursor: held ? "ew-resize" : undefined }}
        >
          <div
            className="absolute inset-0 z-10"
            onPointerEnter={() => {
              inside.current = true;
            }}
            onPointerLeave={() => {
              inside.current = false;
              lastX.current = null;
            }}
            onPointerMove={(e) => {
              if (!held) return;
              if (lastX.current === null) {
                lastX.current = e.clientX;
                return;
              }
              const dx = e.clientX - lastX.current;
              lastX.current = e.clientX;
              setBlur(
                Math.round(clamp(blurRef.current + dx * 0.25, 0, 40) * 2) / 2,
              );
            }}
          />
          <PhotoCard style={{ filter: `blur(${blur / 3}px)` }} />
          {pro && (
            <div className="pointer-events-none absolute bottom-2 left-2">
              <Pill text="Hold B, then move" on={held} />
            </div>
          )}
        </Stage>
      }
      panel={
        <Chrome title="Card">
          <NumRow
            label="Blur"
            value={blur}
            min={0}
            max={40}
            step={0.5}
            onChange={setBlur}
            live={pro}
            pill={pro ? <Pill text="B+Move" on={held} /> : undefined}
          />
        </Chrome>
      }
    />
  );
}

/* ── 10 · get the panel out of the way ────────────────────────────── */

type Corner = "top-right" | "top-left";

function OverlapDemo({ pro }: { pro: boolean }) {
  const [blur, setBlur] = useState(4);
  const [radius, setRadius] = useState(14);
  const [open, setOpen] = useState(true);
  const [side, setSide] = useState<Corner>("top-right");
  const [drop, setDrop] = useState<{ x: number; y: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  const anchor: CSSProperties =
    side === "top-right" ? { top: 10, right: 10 } : { top: 10, left: 10 };

  return (
    <div
      ref={stage}
      className="bg-secondary relative h-80 overflow-hidden rounded-xl border"
    >
      <div className="grid h-full place-items-center">
        <PhotoCard
          title="Kyoto, 06:14"
          sub="The corner you cannot see"
          style={{ borderRadius: radius, filter: `blur(${blur / 4}px)` }}
        />
      </div>

      {open ? (
        <div className="absolute w-56" style={anchor}>
          <Chrome
            title="Card"
            tools={
              pro ? (
                <button
                  type="button"
                  aria-label="Collapse the panel"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-md"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              ) : undefined
            }
          >
            <NumRow
              label="Blur"
              value={blur}
              min={0}
              max={40}
              step={1}
              onChange={setBlur}
              live={pro}
            />
            <NumRow
              label="Radius"
              value={radius}
              min={0}
              max={48}
              step={1}
              onChange={setRadius}
              live={pro}
            />
          </Chrome>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Open the panel"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const r = stage.current?.getBoundingClientRect();
            if (!r) return;
            setDrop({
              x: clamp(e.clientX - r.left - 20, 6, r.width - 46),
              y: clamp(e.clientY - r.top - 20, 6, r.height - 46),
            });
          }}
          onClick={() => {
            const w = stage.current?.clientWidth ?? 0;
            if (drop) setSide(drop.x + 20 < w / 2 ? "top-left" : "top-right");
            setOpen(true);
          }}
          className="bg-card shadow-floating absolute grid size-10 cursor-grab touch-none place-items-center rounded-full border active:cursor-grabbing"
          style={drop ? { left: drop.x, top: drop.y } : anchor}
        >
          <Settings2 aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ── 11 · two panels, one shell ───────────────────────────────────── */

function TwoPanelsDemo({ pro }: { pro: boolean }) {
  const [photo, setPhoto] = useState({ blur: 6, scale: 1 });
  const [pad, setPad] = useState(24);
  const [shut, setShut] = useState<Record<string, boolean>>({});

  const photoRows = (
    <>
      <NumRow
        label="Blur"
        value={photo.blur}
        min={0}
        max={40}
        step={1}
        onChange={(v) => setPhoto((p) => ({ ...p, blur: v }))}
        live={pro}
      />
      <NumRow
        label="Scale"
        value={photo.scale}
        min={0.5}
        max={2}
        step={0.01}
        onChange={(v) => setPhoto((p) => ({ ...p, scale: v }))}
        live={pro}
      />
    </>
  );
  const stageRows = (
    <NumRow
      label="Page padding"
      value={pad}
      min={0}
      max={64}
      step={1}
      onChange={setPad}
      live={pro}
    />
  );
  const sections: { name: string; rows: ReactNode }[] = [
    { name: "Photo Stack", rows: photoRows },
    { name: "Stage", rows: stageRows },
  ];

  return (
    <div className="bg-secondary relative h-96 overflow-hidden rounded-xl border">
      <div
        className="grid h-full place-items-center transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200"
        style={{ padding: pad }}
      >
        <PhotoCard
          style={{
            filter: `blur(${photo.blur / 4}px)`,
            transform: `scale(${photo.scale})`,
          }}
        />
      </div>

      {pro ? (
        <div className="bg-card shadow-floating absolute top-10 right-10 w-56 overflow-hidden rounded-xl border">
          <div className="flex h-10 items-center border-b px-2.5">
            <span className="text-micro text-muted-foreground uppercase">
              DialKit
            </span>
          </div>
          {sections.map((s) => (
            <div key={s.name} className="border-b last:border-b-0">
              <button
                type="button"
                aria-expanded={!shut[s.name]}
                onClick={() =>
                  setShut((p) => ({ ...p, [s.name]: !p[s.name] }))
                }
                className="text-caption flex h-9 w-full items-center gap-1.5 px-2"
              >
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    shut[s.name] && "-rotate-90",
                  )}
                />
                {s.name}
              </button>
              {!shut[s.name] && (
                <div className="space-y-2.5 p-2.5 pt-0">{s.rows}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="absolute top-10 right-10 w-56">
            <Chrome title="Photo Stack">{photoRows}</Chrome>
          </div>
          <div className="absolute top-24 right-4 w-56">
            <Chrome title="Stage">{stageRows}</Chrome>
          </div>
        </>
      )}
    </div>
  );
}

/* ── 12 & 13 · the timeline ───────────────────────────────────────── */

type Frame = { y: number; opacity: number; scale: number };

type Clip = {
  key: string;
  label: string;
  at: number;
  dur: number;
  bounce: number;
  from: Frame;
  to: Frame;
};

const CLIPS: Clip[] = [
  {
    key: "headline",
    label: "Headline",
    at: 0,
    dur: 0.6,
    bounce: 0.2,
    from: { y: 26, opacity: 0, scale: 1 },
    to: { y: 0, opacity: 1, scale: 1 },
  },
  {
    key: "card",
    label: "Card",
    at: 0.45,
    dur: 0.7,
    bounce: 0.35,
    from: { y: 44, opacity: 0, scale: 0.94 },
    to: { y: 0, opacity: 1, scale: 1 },
  },
];

function sampleClip(c: Clip, time: number): Frame {
  const e = springEase((time - c.at) / c.dur, c.bounce);
  return {
    y: c.from.y + (c.to.y - c.from.y) * e,
    opacity: c.from.opacity + (c.to.opacity - c.from.opacity) * e,
    scale: c.from.scale + (c.to.scale - c.from.scale) * e,
  };
}

function TimelineArt({
  headline,
  card,
}: {
  headline: Frame;
  card: Frame;
}) {
  return (
    <div className="flex w-full max-w-72 flex-col items-center gap-5 px-4">
      <p
        className="text-title text-center"
        style={{
          transform: `translateY(${headline.y}px)`,
          opacity: headline.opacity,
        }}
      >
        Ship the moment.
      </p>
      <PhotoCard
        style={{
          transform: `translateY(${card.y}px) scale(${card.scale})`,
          opacity: card.opacity,
        }}
      />
    </div>
  );
}

function useTransport(total: number) {
  // Parked at the end, so the finished screen is what you see first.
  const [time, setTime] = useState(total);
  const [playing, setPlaying] = useState(false);
  const timeRef = useRef(total);
  const playRef = useRef(false);
  const lastRef = useRef(0);
  const totalRef = useRef(total);
  totalRef.current = total;

  useAnimationFrame((t) => {
    if (!playRef.current) {
      lastRef.current = t;
      return;
    }
    const dt = Math.min(0.05, (t - lastRef.current) / 1000);
    lastRef.current = t;
    const next = timeRef.current + dt;
    if (next >= totalRef.current) {
      timeRef.current = totalRef.current;
      playRef.current = false;
      setPlaying(false);
      setTime(totalRef.current);
    } else {
      timeRef.current = next;
      setTime(next);
    }
  });

  const seek = (v: number) => {
    const n = clamp(v, 0, totalRef.current);
    timeRef.current = n;
    setTime(n);
  };
  const pause = () => {
    playRef.current = false;
    setPlaying(false);
  };
  const play = () => {
    if (timeRef.current >= totalRef.current - 0.001) seek(0);
    playRef.current = true;
    setPlaying(true);
  };
  const replay = () => {
    seek(0);
    playRef.current = true;
    setPlaying(true);
  };

  return { time, playing, seek, play, pause, replay };
}

function ClipBar({
  clip,
  total,
  editable,
  onChange,
  containerRef,
}: {
  clip: Clip;
  total: number;
  editable: boolean;
  onChange: (next: Clip) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const mode = useRef<"move" | "resize" | null>(null);
  const startX = useRef(0);
  const startAt = useRef(0);
  const startDur = useRef(0);

  const begin = (e: ReactPointerEvent<HTMLElement>, m: "move" | "resize") => {
    if (!editable) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    mode.current = m;
    startX.current = e.clientX;
    startAt.current = clip.at;
    startDur.current = clip.dur;
  };

  const move = (e: ReactPointerEvent<HTMLElement>) => {
    if (!mode.current) return;
    e.stopPropagation();
    const w = containerRef.current?.clientWidth ?? 1;
    const d = ((e.clientX - startX.current) * total) / w;
    if (mode.current === "move") {
      onChange({
        ...clip,
        at: Math.max(0, Math.round((startAt.current + d) * 100) / 100),
      });
    } else {
      onChange({
        ...clip,
        dur: clamp(Math.round((startDur.current + d) * 100) / 100, 0.1, 3),
      });
    }
  };

  const end = () => {
    mode.current = null;
  };

  return (
    <div
      data-clip=""
      onPointerDown={(e) => begin(e, "move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className={cn(
        "bg-feature text-feature-foreground absolute inset-y-1 flex items-center rounded-md px-2 select-none",
        editable
          ? "cursor-grab touch-none active:cursor-grabbing"
          : "cursor-default",
      )}
      style={{
        left: `${(clip.at / total) * 100}%`,
        width: `${(clip.dur / total) * 100}%`,
      }}
    >
      <span className="text-micro truncate uppercase">{clip.label}</span>
      {editable && (
        <span
          role="presentation"
          onPointerDown={(e) => begin(e, "resize")}
          onPointerMove={move}
          onPointerUp={end}
          className="absolute inset-y-0 right-0 w-4 cursor-ew-resize touch-none"
        >
          <span className="bg-feature-line absolute top-1/2 right-1.5 h-4 w-0.5 -translate-y-1/2 rounded-full" />
        </span>
      )}
    </div>
  );
}

function TimelineDock({
  clips,
  setClips,
  editable,
}: {
  clips: Clip[];
  setClips?: (c: Clip[]) => void;
  editable: boolean;
}) {
  const total = Math.max(1.6, ...clips.map((c) => c.at + c.dur)) + 0.3;
  const { time, playing, seek, play, pause, replay } = useTransport(total);
  const grid = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);

  const seekFromX = (clientX: number) => {
    const r = grid.current?.getBoundingClientRect();
    if (!r) return;
    seek(((clientX - r.left) / r.width) * total);
  };

  return (
    <div className="space-y-3">
      <Stage className="min-h-64 py-6">
        <TimelineArt
          headline={sampleClip(clips[0], time)}
          card={sampleClip(clips[1], time)}
        />
      </Stage>

      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="flex h-12 items-center gap-2 border-b px-2">
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => (playing ? pause() : play())}
            className="bg-secondary hover:bg-muted grid size-9 shrink-0 place-items-center rounded-md border"
          >
            {playing ? (
              <Pause aria-hidden className="size-3.5" />
            ) : (
              <Play aria-hidden className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            aria-label="Replay from the start"
            onClick={replay}
            className="bg-secondary hover:bg-muted grid size-9 shrink-0 place-items-center rounded-md border"
          >
            <RotateCcw aria-hidden className="size-3.5" />
          </button>
          <span className="text-caption text-muted-foreground ml-1 tabular-nums">
            {time.toFixed(2)}s
          </span>
        </div>

        <div className="relative p-2">
          <div
            ref={grid}
            className="relative"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("[data-clip]")) return;
              scrubbing.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              pause();
              seekFromX(e.clientX);
            }}
            onPointerMove={(e) => {
              if (!scrubbing.current) return;
              seekFromX(e.clientX);
            }}
            onPointerUp={() => {
              scrubbing.current = false;
            }}
            onPointerCancel={() => {
              scrubbing.current = false;
            }}
          >
            <div
              role="slider"
              tabIndex={0}
              aria-label="Playhead"
              aria-valuenow={Math.round(time * 100) / 100}
              aria-valuemin={0}
              aria-valuemax={Math.round(total * 100) / 100}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  pause();
                  seek(time + 0.05);
                }
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  pause();
                  seek(time - 0.05);
                }
              }}
              className="bg-secondary focus-visible:border-ring relative mb-1.5 h-9 cursor-ew-resize touch-none overflow-hidden rounded-lg border outline-none"
            >
              {Array.from({ length: Math.ceil(total * 2) }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="text-micro text-muted-foreground absolute top-1/2 -translate-y-1/2 pl-1 tabular-nums"
                  style={{ left: `${((i * 0.5) / total) * 100}%` }}
                >
                  {(i * 0.5).toFixed(1)}
                </span>
              ))}
            </div>

            <div className="space-y-1.5">
              {clips.map((c, i) => (
                <div
                  key={c.key}
                  className="bg-secondary relative h-11 touch-none rounded-lg border"
                >
                  <ClipBar
                    clip={c}
                    total={total}
                    editable={editable}
                    containerRef={grid}
                    onChange={(next) =>
                      setClips?.(clips.map((x, j) => (j === i ? next : x)))
                    }
                  />
                </div>
              ))}
            </div>

            <div
              aria-hidden
              className="bg-accent-solid pointer-events-none absolute inset-y-0 w-0.5 rounded-full"
              style={{ left: `${(time / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The before side: press replay and try to catch it. */
function ReplayOnly({
  clips,
  setClips,
  fields,
}: {
  clips: Clip[];
  setClips?: (c: Clip[]) => void;
  fields: boolean;
}) {
  const [run, setRun] = useState(0);
  return (
    <div className="space-y-3">
      <Stage className="min-h-64 py-6">
        <div className="flex w-full max-w-72 flex-col items-center gap-5 px-4">
          {clips.map((c, i) => (
            <motion.div
              key={`${c.key}-${run}`}
              initial={{
                y: c.from.y,
                opacity: c.from.opacity,
                scale: c.from.scale,
              }}
              animate={{ y: c.to.y, opacity: c.to.opacity, scale: c.to.scale }}
              transition={{
                type: "spring",
                visualDuration: c.dur,
                bounce: c.bounce,
                delay: c.at,
              }}
              className={i === 0 ? "w-full" : undefined}
            >
              {i === 0 ? (
                <p className="text-title text-center">Ship the moment.</p>
              ) : (
                <PhotoCard />
              )}
            </motion.div>
          ))}
        </div>
      </Stage>

      <div className="bg-card space-y-3 rounded-xl border p-3">
        <Button
          variant="outline"
          className="h-9"
          onClick={() => setRun((r) => r + 1)}
        >
          <RotateCcw aria-hidden className="size-3.5" />
          Replay
        </Button>
        {fields && (
          <div className="grid gap-3 sm:grid-cols-2">
            {clips.map((c, i) => (
              <div key={c.key} className="space-y-1.5">
                <p className="text-micro text-muted-foreground uppercase">
                  {c.label}
                </p>
                <div className="flex gap-2">
                  {(["at", "dur"] as const).map((f) => (
                    <div key={f} className="flex-1 space-y-1">
                      <label
                        htmlFor={`dk-${c.key}-${f}`}
                        className="text-caption text-muted-foreground block"
                      >
                        {f === "at" ? "Starts at" : "Lasts"}
                      </label>
                      <input
                        id={`dk-${c.key}-${f}`}
                        type="number"
                        step={0.05}
                        min={f === "dur" ? 0.1 : 0}
                        value={c[f]}
                        onChange={(e) =>
                          setClips?.(
                            clips.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    [f]: Math.max(
                                      f === "dur" ? 0.1 : 0,
                                      e.target.valueAsNumber || 0,
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                        className="text-caption bg-background focus-visible:border-ring h-9 w-full rounded-md border px-2 tabular-nums outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScrubDemo({ pro }: { pro: boolean }) {
  return pro ? (
    <TimelineDock clips={CLIPS} editable={false} />
  ) : (
    <ReplayOnly clips={CLIPS} fields={false} />
  );
}

function RetimeDemo({ pro }: { pro: boolean }) {
  const [clips, setClips] = useState(CLIPS);
  return pro ? (
    <TimelineDock clips={clips} setClips={setClips} editable />
  ) : (
    <ReplayOnly clips={clips} setClips={setClips} fields />
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function DialkitDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The slider only covers the sizes that make sense for this thing."
        before={<RangeDemo pro={false} />}
        after={<RangeDemo pro />}
      />
      <BeforeAfter
        principle="The bar glides to where you press, and pushes back when you drag past the end."
        before={<FeelDemo pro={false} />}
        after={<FeelDemo pro />}
      />
      <BeforeAfter
        principle="Rest on the number for a moment, then click and type the exact one you want."
        before={<TypeDemo pro={false} />}
        after={<TypeDemo pro />}
      />
      <BeforeAfter
        principle="Pick the colour instead of guessing the code."
        before={<ColourDemo pro={false} />}
        after={<ColourDemo pro />}
      />
      <BeforeAfter
        principle="You can see the bounce before you play it."
        before={<SpringDemo pro={false} />}
        after={<SpringDemo pro />}
      />
      <BeforeAfter
        principle="Related dials sit together, and the ones you never touch stay shut."
        before={<FolderDemo pro={false} />}
        after={<FolderDemo pro />}
      />
      <BeforeAfter
        principle="Keep the version you liked and flip back to it."
        before={<PresetDemo pro={false} />}
        after={<PresetDemo pro />}
      />
      <BeforeAfter
        principle="Your tuning is still there when the page comes back."
        before={<PersistDemo pro={false} />}
        after={<PersistDemo pro />}
      />
      <BeforeAfter
        principle="Hold B and move the mouse over the picture — the blur follows, without looking away."
        before={<ShortcutDemo pro={false} />}
        after={<ShortcutDemo pro />}
      />
      <BeforeAfter
        principle="Move the panel off whatever you are trying to look at."
        before={<OverlapDemo pro={false} />}
        after={<OverlapDemo pro />}
      />
      <BeforeAfter
        principle="Two sets of dials stop stacking on top of each other."
        before={<TwoPanelsDemo pro={false} />}
        after={<TwoPanelsDemo pro />}
      />
      <BeforeAfter
        principle="Stop the animation anywhere and look at it."
        before={<ScrubDemo pro={false} />}
        after={<ScrubDemo pro />}
      />
      <BeforeAfter
        principle="Drag the bar to change when it starts and how long it lasts."
        before={<RetimeDemo pro={false} />}
        after={<RetimeDemo pro />}
      />
    </div>
  );
}
