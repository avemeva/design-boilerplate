"use client";

import { animate, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter, Tabs } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * svg.guide — Nanda Syahrasyad's interactive SVG animation course.
 * 39 lessons across 5 modules: foundations and the coordinate system,
 * CSS on SVG and chaining, SMIL for the attributes CSS refuses,
 * paths and path drawing, then defs / masks / gradients / filters.
 *
 * The ones a person can *see* are rebuilt below as a switch. Course
 * mechanics — pricing, exercises, "SVG describes images not documents",
 * how to integrate SMIL into a build — are left where they were.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/** Slider row. Every pair that needs one gets the same shape. */
function Scrub({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  readout,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  readout: ReactNode;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor={id} className="text-caption text-muted-foreground">
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
        className="accent-accent-solid h-9 w-40"
      />
      <span className="text-caption text-muted-foreground tabular-nums">
        {readout}
      </span>
    </div>
  );
}

/* ── 1 · an icon that grows when you make it bigger ───────────────── */

const TOOL_ICONS = [
  { name: "download", d: "M12 3v11m0 0 4-4m-4 4-4-4M4 19h16" },
  { name: "star", d: "m12 3 2.7 5.7 6.1.9-4.4 4.4 1 6.2-5.4-2.9-5.4 2.9 1-6.2-4.4-4.4 6.1-.9z" },
  { name: "bell", d: "M6.5 9a5.5 5.5 0 0 1 11 0c0 4.5 2 5.5 2 5.5h-15S6.5 13.5 6.5 9M10 18a2 2 0 0 0 4 0" },
] as const;

function ScalePair({ after }: Side) {
  const id = useId();
  const [size, setSize] = useState(56);

  return (
    <div className="space-y-4">
      <Scrub
        id={`${id}-size`}
        label="Icon size"
        value={size}
        min={24}
        max={72}
        readout={`${size}px`}
        onChange={setSize}
      />
      <div className="bg-secondary flex flex-wrap items-center gap-3 rounded-lg p-4">
        {TOOL_ICONS.map((icon) => (
          <div
            key={icon.name}
            className="bg-card grid shrink-0 place-items-center rounded-lg border"
            style={{ width: size + 20, height: size + 20 }}
          >
            <svg
              width={size}
              height={size}
              viewBox={after ? "0 0 24 24" : undefined}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground"
              aria-hidden="true"
            >
              <path d={icon.d} />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 2 · a spinner that spins on the spot ─────────────────────────── */

function SpinPair({ after }: Side) {
  return (
    <div className="bg-secondary flex items-center gap-4 rounded-lg p-4">
      <svg viewBox="0 0 48 48" className="text-foreground size-12 shrink-0" aria-hidden="true">
        <g
          className="animate-spin"
          style={{
            transformBox: "view-box",
            transformOrigin: after ? "24px 24px" : "0px 0px",
          }}
        >
          <circle
            cx={24}
            cy={24}
            r={15}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={4}
          />
          <path
            d="M24 9a15 15 0 0 1 15 15"
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div>
        <p className="text-ui">Syncing your files</p>
        <p className="text-caption text-muted-foreground tabular-nums">
          4 of 12 uploaded
        </p>
      </div>
    </div>
  );
}

/* ── 3 · a confirmation you can follow ────────────────────────────── */

function ChainPair({ after }: Side) {
  const [run, setRun] = useState(0);

  return (
    <div className="space-y-4">
      <Button size="lg" variant="secondary" onClick={() => setRun((n) => n + 1)}>
        Play again
      </Button>
      <div
        /* The switch swaps props on the same instance rather than
         * remounting, so the entrance has to be re-keyed by side too or
         * it never replays when you flip. */
        key={`${run}-${after ? "after" : "before"}`}
        className="bg-secondary grid place-items-center gap-3 rounded-lg px-4 py-8"
      >
        <svg viewBox="0 0 64 64" className="size-16" aria-hidden="true">
          <motion.circle
            cx={32}
            cy={32}
            r={26}
            fill="none"
            strokeWidth={4}
            className="stroke-positive"
            style={{
              rotate: -90,
              transformBox: "view-box",
              transformOrigin: "32px 32px",
            }}
            initial={after ? { pathLength: 0 } : { opacity: 0 }}
            animate={after ? { pathLength: 1 } : { opacity: 1 }}
            transition={{
              duration: after ? 0.55 : duration.base,
              ease: ease.outQuart,
            }}
          />
          <motion.path
            d="M20 33.5 28.5 42 45 24"
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-positive"
            initial={after ? { pathLength: 0 } : { opacity: 0 }}
            animate={after ? { pathLength: 1 } : { opacity: 1 }}
            transition={{
              duration: after ? 0.3 : duration.base,
              delay: after ? 0.45 : 0,
              ease: ease.outQuart,
            }}
          />
        </svg>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: after ? 6 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: duration.base,
            delay: after ? 0.75 : 0,
            ease: ease.outQuart,
          }}
        >
          <p className="text-ui">Payment sent</p>
          <p className="text-caption text-muted-foreground tabular-nums">
            $48.00 to Nadia
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ── 4 · a line that travels to the new numbers ───────────────────── */

const SERIES = [
  { id: "week", label: "This week", v: [22, 34, 28, 46, 38, 58, 52] },
  { id: "month", label: "This month", v: [54, 30, 44, 20, 62, 36, 26] },
] as const;

const CHART_W = 280;
const CHART_H = 92;
const CHART_PAD = 12;
const CHART_TOP = 70;

const chartX = (i: number) =>
  CHART_PAD + (i * (CHART_W - CHART_PAD * 2)) / (SERIES[0].v.length - 1);
const chartY = (v: number) =>
  CHART_H - CHART_PAD - (v / CHART_TOP) * (CHART_H - CHART_PAD * 2);

function MorphPair({ after }: Side) {
  const [active, setActive] = useState<(typeof SERIES)[number]["id"]>("week");
  const [vals, setVals] = useState<number[]>([...SERIES[0].v]);
  const valsRef = useRef<number[]>([...SERIES[0].v]);

  const go = (id: (typeof SERIES)[number]["id"]) => {
    if (id === active) return;
    setActive(id);
    const from = valsRef.current;
    const to = SERIES.find((s) => s.id === id)?.v ?? SERIES[0].v;

    if (!after) {
      valsRef.current = [...to];
      setVals([...to]);
      return;
    }
    animate(0, 1, {
      duration: 0.5,
      ease: ease.inOutCubic,
      onUpdate: (p) => {
        const next = from.map((f, k) => f + (to[k] - f) * p);
        valsRef.current = next;
        setVals(next);
      },
    });
  };

  const points = vals.map((v, i) => `${chartX(i)},${chartY(v)}`).join(" ");

  return (
    <div className="space-y-4">
      <Tabs
        options={SERIES.map((s) => ({ id: s.id, label: s.label }))}
        value={active}
        onChange={go}
      />
      <div className="bg-secondary rounded-lg p-4">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="text-foreground w-full"
          aria-hidden="true"
        >
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {vals.map((v, i) => (
            <circle
              key={chartX(i)}
              cx={chartX(i)}
              cy={chartY(v)}
              r={3.5}
              className="fill-card stroke-foreground"
              strokeWidth={2.5}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ── 5 · corners that stop growing spikes ─────────────────────────── */

const SHARP_GLYPHS = [
  { name: "tick", d: "M10 32 22 44 46 16" },
  { name: "zigzag", d: "M9 44 19 15 29 44 39 15 49 44" },
  { name: "corner", d: "M14 46 14 14 46 14" },
] as const;

function CapsPair({ after }: Side) {
  const id = useId();
  const [width, setWidth] = useState(12);

  return (
    <div className="space-y-4">
      <Scrub
        id={`${id}-weight`}
        label="Line weight"
        value={width}
        min={4}
        max={16}
        readout={`${width}px`}
        onChange={setWidth}
      />
      <div className="bg-secondary grid grid-cols-3 gap-3 rounded-lg p-4">
        {SHARP_GLYPHS.map((g) => (
          <div
            key={g.name}
            className="bg-card grid place-items-center rounded-lg border p-2"
          >
            <svg
              viewBox="0 0 56 56"
              className="text-foreground size-16"
              aria-hidden="true"
            >
              <path
                d={g.d}
                fill="none"
                stroke="currentColor"
                strokeWidth={width}
                strokeLinecap={after ? "round" : "butt"}
                strokeLinejoin={after ? "round" : "miter"}
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 6 · three icons that finish drawing together ─────────────────── */

const DRAW_GLYPHS = [
  { name: "check", d: "M12 29l10 10 22-24" },
  { name: "arrow", d: "M10 28h36M34 16l12 12-12 12" },
  { name: "ring", d: "M28 8a20 20 0 1 1-.1 0" },
] as const;

const GUESSED_DASH = 60;

function DrawPair({ after }: Side) {
  const id = useId();
  /* Rests at fully drawn: that is where the guessed dash length is most
   * obviously wrong — the arrow stops short and the ring has a hole. */
  const [t, setT] = useState(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          onClick={() =>
            animate(0, 1, {
              duration: 1.2,
              ease: ease.inOutCubic,
              onUpdate: setT,
            })
          }
        >
          Draw
        </Button>
        <Scrub
          id={`${id}-draw`}
          label="Scrub"
          value={t}
          min={0}
          max={1}
          step={0.01}
          readout={`${Math.round(t * 100)}%`}
          onChange={setT}
        />
      </div>
      <div className="bg-secondary grid grid-cols-3 gap-3 rounded-lg p-4">
        {DRAW_GLYPHS.map((g) => (
          <div
            key={g.name}
            className="bg-card grid place-items-center rounded-lg border p-2"
          >
            <svg
              viewBox="0 0 56 56"
              className="text-foreground size-16"
              aria-hidden="true"
            >
              <path
                d={g.d}
                fill="none"
                stroke="currentColor"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={after ? 1 : undefined}
                strokeDasharray={after ? 1 : GUESSED_DASH}
                strokeDashoffset={after ? 1 - t : GUESSED_DASH * (1 - t)}
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 7 · a placeholder that sweeps instead of blinking ────────────── */

function ShimmerPair({ after }: Side) {
  const id = useId();
  const gradient = `${id}-sweep`;

  return (
    <div className="bg-secondary rounded-lg p-4">
      <svg
        viewBox="0 0 300 86"
        className="text-foreground w-full"
        aria-hidden="true"
      >
        {after && (
          <defs>
            <linearGradient
              id={gradient}
              gradientUnits="userSpaceOnUse"
              x1="-150"
              y1="0"
              x2="-30"
              y2="0"
            >
              <stop offset="0" stopColor="currentColor" stopOpacity={0.09} />
              <stop offset="0.5" stopColor="currentColor" stopOpacity={0.34} />
              <stop offset="1" stopColor="currentColor" stopOpacity={0.09} />
              <animate
                attributeName="x1"
                from="-150"
                to="300"
                dur="1.4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                from="-30"
                to="420"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
        )}
        <g
          fill={after ? `url(#${gradient})` : "currentColor"}
          fillOpacity={after ? 1 : 0.14}
          className={after ? undefined : "animate-pulse"}
        >
          <circle cx="24" cy="28" r="22" />
          <rect x="62" y="12" width="150" height="14" rx="7" />
          <rect x="62" y="36" width="218" height="14" rx="7" />
          <rect x="2" y="66" width="240" height="14" rx="7" />
        </g>
      </svg>
    </div>
  );
}

/* ── 8 · avatar gaps that are actually gaps ───────────────────────── */

const SURFACES = [
  { id: "dark", label: "Dark", cls: "bg-feature" },
  { id: "grey", label: "Grey", cls: "bg-secondary" },
  { id: "white", label: "White", cls: "bg-card" },
] as const;

const FACES = [
  { initials: "NS", opacity: 1 },
  { initials: "AM", opacity: 0.78 },
  { initials: "KV", opacity: 0.58 },
] as const;

const FACE_R = 18;
const faceX = (i: number) => 22 + i * 28;

function MaskPair({ after }: Side) {
  const id = useId();
  const [surface, setSurface] = useState<(typeof SURFACES)[number]["id"]>("dark");
  const cls = SURFACES.find((s) => s.id === surface)?.cls ?? "bg-card";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {SURFACES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSurface(s.id)}
            aria-pressed={surface === s.id}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg border px-3 transition-colors",
              surface === s.id
                ? "border-border-strong text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={cn("grid place-items-center rounded-lg border p-6", cls)}>
        <svg viewBox="0 0 100 44" className="h-20" aria-hidden="true">
          {after && (
            <defs>
              {FACES.map((face, i) =>
                i === 0 ? null : (
                  <mask key={face.initials} id={`${id}-${i}`}>
                    <rect x="0" y="0" width="100" height="44" fill="white" />
                    <circle
                      cx={faceX(i - 1)}
                      cy={22}
                      r={FACE_R + 3}
                      fill="black"
                    />
                  </mask>
                ),
              )}
            </defs>
          )}
          {[...FACES].reverse().map((face) => {
            const i = FACES.indexOf(face);
            return (
              <g
                key={face.initials}
                mask={after && i > 0 ? `url(#${id}-${i})` : undefined}
              >
                <circle
                  cx={faceX(i)}
                  cy={22}
                  r={FACE_R}
                  className={cn(
                    "fill-accent-solid",
                    !after && "stroke-card",
                  )}
                  fillOpacity={face.opacity}
                  strokeWidth={after ? 0 : 3}
                />
                <text
                  x={faceX(i)}
                  y={22}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-background text-ui-sm"
                >
                  {face.initials}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ── 9 · a shadow shaped like the thing casting it ────────────────── */

const STICKERS = [
  {
    name: "star",
    d: "m32 8 7.2 15.2 16.4 2.4-11.9 11.9L46.5 54 32 46.2 17.5 54l2.8-16.5L8.4 25.6l16.4-2.4z",
  },
  {
    name: "bubble",
    d: "M12 12h40a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H32L18 54V42h-6a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z",
  },
  {
    name: "heart",
    d: "M32 52S9 38.8 9 24.4C9 16.5 15.2 11 22 11c4.6 0 8.2 2.4 10 5.6 1.8-3.2 5.4-5.6 10-5.6 6.8 0 13 5.5 13 13.4C55 38.8 32 52 32 52z",
  },
] as const;

function ShadowPair({ after }: Side) {
  const id = useId();
  const filter = `${id}-shadow`;

  return (
    <div className="bg-secondary flex flex-wrap items-center justify-center gap-8 rounded-lg p-8">
      {STICKERS.map((s) => (
        <svg
          key={s.name}
          viewBox="0 0 64 64"
          className={cn("size-16 overflow-visible", !after && "shadow-floating")}
          aria-hidden="true"
        >
          {after && (
            <defs>
              <filter
                id={filter}
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
                colorInterpolationFilters="sRGB"
              >
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.35" />
              </filter>
            </defs>
          )}
          <path
            d={s.d}
            className="fill-accent-solid"
            filter={after ? `url(#${filter})` : undefined}
          />
        </svg>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function InteractiveSvgAnimationsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Drag the size up and the icons actually get bigger."
        before={<ScalePair after={false} />}
        after={<ScalePair after />}
      />
      <BeforeAfter
        principle="The spinner spins on the spot instead of flying off."
        before={<SpinPair after={false} />}
        after={<SpinPair after />}
      />
      <BeforeAfter
        principle="It draws itself, so you can watch it land."
        before={<ChainPair after={false} />}
        after={<ChainPair after />}
      />
      <BeforeAfter
        principle="The line travels to the new numbers instead of jumping."
        before={<MorphPair after={false} />}
        after={<MorphPair after />}
      />
      <BeforeAfter
        principle="Thicken the lines and the corners stop growing spikes."
        before={<CapsPair after={false} />}
        after={<CapsPair after />}
      />
      <BeforeAfter
        principle="All three finish drawing at the same moment."
        before={<DrawPair after={false} />}
        after={<DrawPair after />}
      />
      <BeforeAfter
        principle="The placeholder sweeps instead of blinking at you."
        before={<ShimmerPair after={false} />}
        after={<ShimmerPair after />}
      />
      <BeforeAfter
        principle="The gaps between the faces are real gaps, on any background."
        before={<MaskPair after={false} />}
        after={<MaskPair after />}
      />
      <BeforeAfter
        principle="The shadow is the shape of the thing, not a box around it."
        before={<ShadowPair after={false} />}
        after={<ShadowPair after />}
      />
    </div>
  );
}
