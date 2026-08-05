"use client";

import NumberFlow from "@number-flow/react";
import {
  Bell,
  Bookmark,
  Boxes,
  ChevronRight,
  Circle,
  CornerUpLeft,
  Hexagon,
  Layers,
  Minus,
  Pin,
  Play,
  Plus,
  RotateCw,
  Search,
  Share2,
  Sparkles,
  Square,
  Star,
  Trash2,
  Triangle,
} from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Devouring Details — Rauno Freiberg's interactive reference manual.
 *
 * 27 chapters across three units: 8 Principles, 11 Prototypes,
 * 8 Resources. The ones a person can actually *see* the difference in
 * are rebuilt here as a switch. Naming, pricing, moodboards, workflow,
 * bookmarks and community were left where they were.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

function Readout({ children }: { children: ReactNode }) {
  return (
    <p className="text-caption text-muted-foreground mt-3 tabular-nums">
      {children}
    </p>
  );
}

/* ── 1 · a menu that waits for you ────────────────────────────────── */

const SHARE_ITEMS = ["Copy link", "Email", "Embed"];

function IntentPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [reached, setReached] = useState(0);
  const [lost, setLost] = useState(0);
  const openRef = useRef(false);
  const enteredRef = useRef(false);
  const dx = useRef(0);
  const lastX = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const close = useCallback(() => {
    if (openRef.current && !enteredRef.current) setLost((n) => n + 1);
    openRef.current = false;
    setOpen(false);
  }, []);

  return (
    <div>
      <div
        className="bg-background relative h-60 rounded-xl p-3"
        onPointerMove={(e) => {
          dx.current = e.clientX - lastX.current;
          lastX.current = e.clientX;
        }}
        onPointerLeave={() => {
          cancel();
          close();
        }}
      >
        <div className="bg-card w-36 rounded-lg border p-1">
          {["Rename", "Duplicate"].map((item) => (
            <div
              key={item}
              className="text-ui-sm text-muted-foreground flex h-8 items-center rounded-md px-2"
            >
              {item}
            </div>
          ))}
          <button
            type="button"
            onPointerEnter={() => {
              cancel();
              enteredRef.current = false;
              openRef.current = true;
              setOpen(true);
            }}
            onPointerLeave={() => {
              if (after && dx.current > 1) {
                cancel();
                timer.current = setTimeout(close, 300);
              } else {
                close();
              }
            }}
            className={cn(
              "text-ui-sm text-foreground flex h-9 w-full items-center gap-2 rounded-md px-2 text-left",
              open && "bg-secondary",
            )}
          >
            <Share2 className="size-3.5" aria-hidden="true" />
            Share
            <ChevronRight className="ml-auto size-3.5" aria-hidden="true" />
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              onPointerEnter={() => {
                cancel();
                if (!enteredRef.current) {
                  enteredRef.current = true;
                  setReached((n) => n + 1);
                }
              }}
              className="bg-card shadow-floating absolute top-28 left-40 w-32 origin-top-left rounded-lg border p-1"
            >
              {SHARE_ITEMS.map((item) => (
                <div
                  key={item}
                  className="text-ui-sm hover:bg-secondary flex h-9 items-center rounded-md px-2"
                >
                  {item}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-caption text-muted-foreground absolute top-3 right-3 tabular-nums">
          got there <span className="text-positive">{reached}</span> · lost it{" "}
          <span className="text-destructive">{lost}</span>
        </p>
      </div>
      <Readout>Hover Share, then move down and across to the submenu.</Readout>
    </div>
  );
}

/* ── 2 · a switch you can slide ───────────────────────────────────── */

function SwitchPair({ after }: Side) {
  const TRAVEL = 24;
  const [on, setOn] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const origin = useRef(0);
  const moved = useRef(false);
  const x = dragX ?? (on ? TRAVEL : 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-ui">Airplane mode</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Airplane mode"
          onPointerDown={(e) => {
            if (!after) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            origin.current = e.clientX - x;
            moved.current = false;
          }}
          onPointerMove={(e) => {
            if (!after || !e.currentTarget.hasPointerCapture(e.pointerId))
              return;
            moved.current = true;
            setDragX(Math.min(TRAVEL, Math.max(0, e.clientX - origin.current)));
          }}
          onPointerUp={() => {
            if (!after) return;
            if (moved.current && dragX !== null) setOn(dragX > TRAVEL / 2);
            else setOn((v) => !v);
            setDragX(null);
          }}
          onClick={() => {
            if (!after) setOn((v) => !v);
          }}
          className={cn(
            "relative flex h-9 w-16 shrink-0 items-center rounded-full border p-1 transition-colors",
            on ? "bg-feature" : "bg-secondary",
          )}
        >
          <span
            className={cn(
              "bg-card size-7 rounded-full border shadow-xs",
              dragX === null &&
                "ease-out-quart duration-fast transition-transform",
              after && "cursor-grab active:cursor-grabbing",
            )}
            style={{ transform: `translateX(${x}px)` }}
          />
        </button>
      </div>
      <Readout>Try to push the knob across with your finger.</Readout>
    </div>
  );
}

/* ── 3 · the menu opens where you clicked ─────────────────────────── */

function PointerMenuPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState({ x: 0, y: 0 });
  const [travel, setTravel] = useState<number | null>(null);
  const acc = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);

  return (
    <div>
      <div
        className="bg-background relative h-52 overflow-hidden rounded-xl"
        onPointerMove={(e) => {
          if (!open) return;
          if (last.current) {
            acc.current += Math.hypot(
              e.clientX - last.current.x,
              e.clientY - last.current.y,
            );
          }
          last.current = { x: e.clientX, y: e.clientY };
        }}
      >
        <Button
          size="lg"
          variant="outline"
          className="absolute bottom-3 left-3"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(e) => {
            const box = e.currentTarget.parentElement?.getBoundingClientRect();
            if (box) setAt({ x: e.clientX - box.left, y: e.clientY - box.top });
            acc.current = 0;
            last.current = null;
            setTravel(null);
            setOpen(true);
          }}
        >
          Row options
        </Button>

        {open && (
          <div
            role="menu"
            className="bg-card shadow-floating absolute z-10 w-32 rounded-lg border p-1"
            style={
              after
                ? { left: at.x, top: Math.max(4, at.y - 120) }
                : { right: 12, top: 12 }
            }
          >
            {["Rename", "Duplicate", "Delete"].map((item) => (
              <button
                key={item}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTravel(Math.round(acc.current));
                  setOpen(false);
                }}
                className={cn(
                  "text-ui-sm hover:bg-secondary flex h-9 w-full items-center rounded-md px-2 text-left",
                  item === "Delete" && "text-destructive",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
      <Readout>
        {travel === null
          ? "Open the menu, then pick Delete."
          : `your hand moved ${travel}px`}
      </Readout>
    </div>
  );
}

/* ── 4 · a flick that carries ─────────────────────────────────────── */

function FlickPair({ after }: Side) {
  const KNOB = 40;
  const STOPS = 4;
  const x = useMotionValue(0);
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  return (
    <div>
      <div
        ref={track}
        className="bg-secondary relative flex h-14 items-center rounded-xl p-1.5"
      >
        {Array.from({ length: STOPS }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full",
              i === idx ? "bg-accent-foreground" : "bg-border-strong",
            )}
            style={{ left: `calc(${(i / (STOPS - 1)) * 100}% - 3px)` }}
          />
        ))}
        <motion.div
          drag="x"
          dragConstraints={track}
          dragElastic={after ? 0.12 : 0}
          dragMomentum={false}
          style={{ x }}
          onDragEnd={(_, info) => {
            const w = (track.current?.offsetWidth ?? 260) - KNOB - 12;
            const step = w / (STOPS - 1);
            const projected = x.get() + (after ? info.velocity.x * 0.055 : 0);
            const i = Math.max(
              0,
              Math.min(STOPS - 1, Math.round(projected / step)),
            );
            setIdx(i);
            void animate(
              x,
              i * step,
              after
                ? { type: "spring", stiffness: 420, damping: 26 }
                : { duration: 0.3, ease: "linear" },
            );
          }}
          className="bg-card text-ui-sm relative z-10 grid size-10 cursor-grab place-items-center rounded-lg border shadow-xs tabular-nums active:cursor-grabbing"
        >
          {idx + 1}
        </motion.div>
      </div>
      <Readout>Flick it. Don&apos;t drag it all the way.</Readout>
    </div>
  );
}

/* ── 5 · rows that arrive one after another ───────────────────────── */

const CHOREO_ROWS = ["Overview", "Members", "Billing", "Integrations", "Audit"];

function ChoreoPair({ after }: Side) {
  const [run, setRun] = useState(0);

  return (
    <div>
      <Button size="lg" variant="outline" onClick={() => setRun((n) => n + 1)}>
        <RotateCw aria-hidden="true" />
        Play again
      </Button>
      <div key={run} className="mt-3 space-y-1.5">
        {CHOREO_ROWS.map((row, i) => (
          <motion.div
            key={row}
            initial={
              after
                ? { opacity: 0, y: -8, scale: 0.98 }
                : { opacity: 0, scale: 0 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              after
                ? {
                    duration: duration.base,
                    ease: ease.outQuart,
                    delay: i * 0.045,
                  }
                : { duration: 0.5, ease: "linear" }
            }
            className="bg-secondary text-ui-sm flex h-10 items-center rounded-lg px-3"
          >
            {row}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 6 · the count moves the moment you press ─────────────────────── */

function OptimisticPair({ after }: Side) {
  const [n, setN] = useState(128);
  const [ms, setMs] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <Button
        size="lg"
        disabled={busy}
        className="w-full"
        onClick={() => {
          const t = performance.now();
          if (after) {
            setN((v) => v + 1);
            setMs(Math.round(performance.now() - t));
          } else {
            setBusy(true);
            setTimeout(() => {
              setN((v) => v + 1);
              setMs(Math.round(performance.now() - t));
              setBusy(false);
            }, 700);
          }
        }}
      >
        <Star aria-hidden="true" />
        {busy ? "Saving…" : "Applaud"}
      </Button>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-title tabular-nums">
          <NumberFlow value={n} />
        </span>
        <span className="text-caption text-muted-foreground tabular-nums">
          {ms === null ? "press it" : `it changed ${ms}ms after you pressed`}
        </span>
      </div>
    </div>
  );
}

/* ── 7 · the scroll stays in the box ──────────────────────────────── */

function OverscrollPair({ after }: Side) {
  const [outer, setOuter] = useState(0);

  return (
    <div>
      <div
        onScroll={(e) => setOuter(Math.round(e.currentTarget.scrollTop))}
        className="bg-background h-52 overflow-y-auto rounded-xl p-3"
      >
        <p className="text-caption text-muted-foreground mb-2">
          The article you were reading
        </p>
        <div
          className={cn(
            "bg-card h-28 overflow-y-auto rounded-lg border p-2",
            after ? "overscroll-contain" : "overscroll-auto",
          )}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i} className="text-ui-sm py-1">
              Comment {i + 1}
            </p>
          ))}
        </div>
        <div className="text-caption text-muted-foreground space-y-2 pt-3">
          {Array.from({ length: 10 }, (_, i) => (
            <p key={i}>More of the article, paragraph {i + 1}</p>
          ))}
        </div>
      </div>
      <Readout>
        Scroll the comments to their end, then keep going · the article behind
        moved{" "}
        <span className={outer > 0 ? "text-destructive" : "text-positive"}>
          {outer}px
        </span>
      </Readout>
    </div>
  );
}

/* ── 8 · a map of the page instead of a bar ───────────────────────── */

const DOC_LINES = Array.from({ length: 44 }, (_, i) => ({
  w: 26 + ((i * 41) % 68),
  head: i % 9 === 0,
}));
const LINE_H = 16;
const DOC_H = 180;
const DOC_TOTAL = DOC_LINES.length * LINE_H;
const MAP_BOX = (DOC_H / DOC_TOTAL) * DOC_H;

function MinimapPair({ after }: Side) {
  const doc = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLDivElement>(null);
  const [frac, setFrac] = useState(0);

  const scrollTo = (clientY: number) => {
    const box = map.current?.getBoundingClientRect();
    if (!box || !doc.current) return;
    const f = Math.min(
      1,
      Math.max(0, (clientY - box.top - MAP_BOX / 2) / (DOC_H - MAP_BOX)),
    );
    doc.current.scrollTop = f * (DOC_TOTAL - DOC_H);
  };

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div
          ref={doc}
          id={after ? "dd-minimap-doc" : undefined}
          onScroll={(e) =>
            setFrac(
              e.currentTarget.scrollTop /
                (e.currentTarget.scrollHeight - e.currentTarget.clientHeight),
            )
          }
          className="overflow-y-auto overscroll-contain"
          style={{ height: DOC_H }}
        >
          {DOC_LINES.map((l, i) => (
            <div
              key={i}
              className="flex items-center"
              style={{ height: LINE_H }}
            >
              <span
                className={cn(
                  "text-micro truncate normal-case",
                  l.head ? "text-foreground" : "text-muted-foreground",
                )}
                style={{ width: `${l.w}%` }}
              >
                {l.head ? `Section ${i / 9 + 1}` : `line ${i + 1}`}
              </span>
            </div>
          ))}
        </div>

        {after ? (
          <div
            ref={map}
            role="scrollbar"
            aria-label="Where you are in the page"
            aria-controls="dd-minimap-doc"
            aria-orientation="vertical"
            aria-valuenow={Math.round(frac * 100)}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              scrollTo(e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                scrollTo(e.clientY);
            }}
            className="bg-secondary relative w-16 shrink-0 cursor-pointer touch-none rounded-lg p-1.5"
            style={{ height: DOC_H }}
          >
            {DOC_LINES.map((l, i) => (
              <div
                key={i}
                aria-hidden="true"
                className={cn(
                  "rounded-full",
                  l.head ? "bg-foreground/70" : "bg-muted-foreground/35",
                )}
                style={{
                  width: `${l.w}%`,
                  height: 2,
                  marginBottom: (DOC_H - 12) / DOC_LINES.length - 2,
                }}
              />
            ))}
            <div
              className="border-accent-foreground bg-accent/50 pointer-events-none absolute inset-x-0 top-0 rounded-md border"
              style={{
                height: MAP_BOX,
                transform: `translateY(${frac * (DOC_H - MAP_BOX)}px)`,
              }}
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="bg-secondary relative w-2.5 shrink-0 rounded-full"
            style={{ height: DOC_H }}
          >
            <div
              className="bg-border-strong absolute inset-x-0 rounded-full"
              style={{
                height: MAP_BOX,
                transform: `translateY(${frac * (DOC_H - MAP_BOX)}px)`,
              }}
            />
          </div>
        )}
      </div>
      <Readout>Get to Section 4 without reading your way there.</Readout>
    </div>
  );
}

/* ── 9 · a ruler you can spin ─────────────────────────────────────── */

const TICK_W = 12;
const TICKS = 61;

function RulerPair({ after }: Side) {
  const [value, setValue] = useState(24);

  return (
    <div>
      <div className="bg-background relative overflow-hidden rounded-xl py-4">
        <div className="pointer-events-none mb-3 text-center">
          <span className="text-title tabular-nums">
            <NumberFlow value={value} suffix="°" />
          </span>
        </div>

        {after ? (
          <>
            <div
              onScroll={(e) =>
                setValue(
                  Math.max(
                    0,
                    Math.min(
                      TICKS - 1,
                      Math.round(e.currentTarget.scrollLeft / TICK_W),
                    ),
                  ),
                )
              }
              className="flex snap-x snap-mandatory items-end overflow-x-auto overscroll-x-contain"
              style={{
                paddingInline: "50%",
                height: 44,
                scrollbarWidth: "none",
              }}
            >
              {Array.from({ length: TICKS }, (_, i) => (
                <div
                  key={i}
                  className="flex shrink-0 snap-center flex-col items-center justify-end"
                  style={{ width: TICK_W, height: 44 }}
                >
                  {i % 10 === 0 && (
                    <span className="text-micro text-muted-foreground mb-1 tabular-nums">
                      {i}
                    </span>
                  )}
                  <div
                    className={cn(
                      "w-px",
                      i % 10 === 0
                        ? "bg-foreground/60 h-5"
                        : i % 5 === 0
                          ? "bg-muted-foreground/60 h-3.5"
                          : "bg-border-strong h-2",
                    )}
                  />
                </div>
              ))}
            </div>
            <div
              aria-hidden="true"
              className="bg-accent-foreground pointer-events-none absolute bottom-4 left-1/2 h-6 w-0.5 -translate-x-1/2 rounded-full"
            />
          </>
        ) : (
          <div
            className="flex items-center justify-center gap-2"
            style={{ height: 44 }}
          >
            <Button
              size="icon-lg"
              variant="outline"
              aria-label="One degree less"
              onClick={() => setValue((v) => Math.max(0, v - 1))}
            >
              <Minus aria-hidden="true" />
            </Button>
            <span className="text-ui-sm bg-card grid h-9 w-16 place-items-center rounded-lg border tabular-nums">
              {value}°
            </span>
            <Button
              size="icon-lg"
              variant="outline"
              aria-label="One degree more"
              onClick={() => setValue((v) => Math.min(TICKS - 1, v + 1))}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      <Readout>Set it to 47°.</Readout>
    </div>
  );
}

/* ── 10 · a dial for a length of time ─────────────────────────────── */

const PRESETS = [15, 30, 45, 60];

function DialPair({ after }: Side) {
  const [deg, setDeg] = useState(126);
  const svg = useRef<SVGSVGElement>(null);
  const R = 58;
  const C = 2 * Math.PI * R;

  const fromEvent = (clientX: number, clientY: number) => {
    const b = svg.current?.getBoundingClientRect();
    if (!b) return;
    const a =
      (Math.atan2(
        clientY - (b.top + b.height / 2),
        clientX - (b.left + b.width / 2),
      ) *
        180) /
        Math.PI +
      90;
    setDeg(a < 0 ? a + 360 : a);
  };

  const mins = Math.round(deg / 6);
  const rad = ((deg - 90) * Math.PI) / 180;

  return (
    <div>
      <div className="bg-background grid h-52 place-items-center rounded-xl p-4">
        {after ? (
          <div
            role="slider"
            tabIndex={0}
            aria-label="Timer length in minutes"
            aria-valuemin={0}
            aria-valuemax={60}
            aria-valuenow={mins}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                setDeg((d) => Math.min(360, d + 6));
              }
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                setDeg((d) => Math.max(0, d - 6));
              }
            }}
            className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3"
          >
            <svg
              ref={svg}
              viewBox="0 0 144 144"
              className="size-36 cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                fromEvent(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  fromEvent(e.clientX, e.clientY);
              }}
            >
              {Array.from({ length: 60 }, (_, i) => {
                const a = ((i * 6 - 90) * Math.PI) / 180;
                const inner = i % 5 === 0 ? 48 : 52;
                return (
                  <line
                    key={i}
                    x1={72 + Math.cos(a) * inner}
                    y1={72 + Math.sin(a) * inner}
                    x2={72 + Math.cos(a) * 56}
                    y2={72 + Math.sin(a) * 56}
                    className={
                      i * 6 <= deg
                        ? "stroke-foreground/50"
                        : "stroke-border-strong"
                    }
                    strokeWidth={1}
                  />
                );
              })}
              <circle
                cx={72}
                cy={72}
                r={R}
                className="stroke-feature fill-none"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={`${(deg / 360) * C} ${C}`}
                transform="rotate(-90 72 72)"
              />
              <circle
                cx={72 + Math.cos(rad) * R}
                cy={72 + Math.sin(rad) * R}
                r={6}
                className="fill-accent-foreground stroke-background"
                strokeWidth={2}
              />
              <text
                x={72}
                y={78}
                textAnchor="middle"
                className="fill-foreground text-title tabular-nums"
              >
                {mins}m
              </text>
            </svg>
          </div>
        ) : (
          <div className="w-full">
            <p className="text-title mb-4 text-center tabular-nums">{mins}m</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={mins === p}
                  onClick={() => setDeg(p * 6)}
                  className={cn(
                    "text-ui-sm h-9 rounded-lg border px-3.5 transition-colors",
                    mins === p
                      ? "bg-feature text-feature-foreground border-transparent"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p}m
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <Readout>Set it to 37 minutes.</Readout>
    </div>
  );
}

/* ── 11 · the button becomes the box ──────────────────────────────── */

function ReplyBody({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="border-t p-3">
      <textarea
        aria-label="Your reply"
        rows={2}
        defaultValue="Sounds good — shipping this afternoon."
        className="text-ui-sm focus-visible:border-ring w-full resize-none rounded-lg border p-2 outline-none"
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button size="lg" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="lg">Send</Button>
      </div>
    </div>
  );
}

function MorphPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const label = (
    <>
      <Sparkles className="text-accent-foreground size-4" aria-hidden="true" />
      {open ? "Compose reply" : "Reply"}
    </>
  );

  return (
    <div className="bg-background grid min-h-48 place-items-center rounded-xl p-4">
      {after ? (
        <motion.div
          layout
          transition={spring.smooth}
          className={cn(
            "bg-card shadow-floating overflow-hidden rounded-xl border",
            open ? "w-full" : "w-40",
          )}
        >
          <motion.button
            layout="position"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="text-ui-sm flex h-10 w-full items-center gap-2 px-3 text-left"
          >
            {label}
          </motion.button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast }}
              >
                <ReplyBody onCancel={() => setOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div
          className={cn(
            "bg-card shadow-floating overflow-hidden rounded-xl border",
            open ? "w-full" : "w-40",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="text-ui-sm flex h-10 w-full items-center gap-2 px-3 text-left"
          >
            {label}
          </button>
          {open && <ReplyBody onCancel={() => setOpen(false)} />}
        </div>
      )}
    </div>
  );
}

/* ── 12 · point anywhere at the chart ─────────────────────────────── */

const SERIES = [
  12, 18, 16, 24, 31, 28, 35, 33, 41, 38, 46, 52, 49, 57, 61, 58, 66, 72, 69,
  78, 74, 83, 88, 92,
];
const GW = 320;
const GH = 120;

function GraphPair({ after }: Side) {
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const max = Math.max(...SERIES);
  const pt = (v: number, i: number) => ({
    x: (i / (SERIES.length - 1)) * GW,
    y: GH - (v / max) * (GH - 12) - 6,
  });
  const path = SERIES.map((v, i) => {
    const { x, y } = pt(v, i);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const active = hover === null ? null : pt(SERIES[hover], hover);

  return (
    <div>
      <svg
        ref={svg}
        viewBox={`0 0 ${GW} ${GH}`}
        role="img"
        aria-label="Signups over 24 days"
        className="w-full touch-none"
        style={{ height: GH }}
        onPointerMove={
          after
            ? (e) => {
                const b = svg.current?.getBoundingClientRect();
                if (!b) return;
                const f = (e.clientX - b.left) / b.width;
                setHover(
                  Math.max(
                    0,
                    Math.min(
                      SERIES.length - 1,
                      Math.round(f * (SERIES.length - 1)),
                    ),
                  ),
                );
              }
            : undefined
        }
        onPointerLeave={after ? () => setHover(null) : undefined}
      >
        <path
          d={`${path} L${GW},${GH} L0,${GH} Z`}
          className="fill-feature/10 stroke-none"
        />
        <path
          d={path}
          className="stroke-feature fill-none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {!after &&
          SERIES.map((v, i) => {
            const p = pt(v, i);
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={3}
                className="fill-card stroke-feature"
                strokeWidth={1.5}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              />
            );
          })}
        {active && (
          <>
            <line
              x1={active.x}
              y1={0}
              x2={active.x}
              y2={GH}
              className="stroke-border-strong"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={active.x}
              cy={active.y}
              r={4}
              className="fill-accent-foreground stroke-card"
              strokeWidth={2}
            />
          </>
        )}
      </svg>
      <div className="text-caption text-muted-foreground mt-1 flex justify-between tabular-nums">
        <span>day 1</span>
        <span className={hover === null ? "" : "text-foreground"}>
          {hover === null
            ? "read off day 17"
            : `day ${hover + 1} · ${SERIES[hover]}k`}
        </span>
        <span>day {SERIES.length}</span>
      </div>
    </div>
  );
}

/* ── 13 · a logo strip that stops for you ─────────────────────────── */

const LOGOS = [
  { Icon: Hexagon, name: "Hexline" },
  { Icon: Triangle, name: "Delta" },
  { Icon: Square, name: "Quadrant" },
  { Icon: Circle, name: "Orbit" },
  { Icon: Layers, name: "Strata" },
  { Icon: Boxes, name: "Latticework" },
];

const MARQUEE_MASK =
  "linear-gradient(90deg, transparent, black 14%, black 86%, transparent)";

function MarqueePair({ after }: Side) {
  const [paused, setPaused] = useState(false);

  return (
    <div>
      <div
        className="bg-background overflow-hidden rounded-xl py-5"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        style={
          after
            ? { maskImage: MARQUEE_MASK, WebkitMaskImage: MARQUEE_MASK }
            : undefined
        }
      >
        <div
          className="flex w-max"
          style={{
            animation: "dd-marquee 18s linear infinite",
            animationPlayState: after && paused ? "paused" : "running",
          }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex" aria-hidden={copy === 1}>
              {LOGOS.map(({ Icon, name }) => (
                <div
                  key={name}
                  className="text-muted-foreground flex w-40 shrink-0 items-center justify-center gap-2"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="text-ui-sm">{name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes dd-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <Readout>Read the fourth name.</Readout>
    </div>
  );
}

/* ── 14 · you can follow where each row went ──────────────────────── */

const DECK = ["Ada", "Grace", "Alan", "Katherine", "Edsger"];

function ShufflePair({ after }: Side) {
  const [order, setOrder] = useState(DECK);

  return (
    <div>
      <Button
        size="lg"
        variant="outline"
        onClick={() =>
          setOrder((o) => {
            const next = [...o];
            for (let i = next.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [next[i], next[j]] = [next[j], next[i]];
            }
            return next;
          })
        }
      >
        <RotateCw aria-hidden="true" />
        Shuffle
      </Button>
      <div className="mt-3 space-y-1.5">
        {order.map((n) =>
          after ? (
            <motion.div
              key={n}
              layout
              transition={spring.snappy}
              className="bg-secondary text-ui-sm flex h-10 items-center rounded-lg px-3"
            >
              {n}
            </motion.div>
          ) : (
            <div
              key={n}
              className="bg-secondary text-ui-sm flex h-10 items-center rounded-lg px-3"
            >
              {n}
            </div>
          ),
        )}
      </div>
      <Readout>Keep your eye on Grace.</Readout>
    </div>
  );
}

/* ── 15 · the text fades out instead of stopping at a line ────────── */

const BLUR_LAYERS = [
  { cls: "backdrop-blur-xs", stop: 25 },
  { cls: "backdrop-blur-sm", stop: 50 },
  { cls: "backdrop-blur-md", stop: 75 },
  { cls: "backdrop-blur-lg", stop: 100 },
];

function BlurPair({ after }: Side) {
  return (
    <div className="bg-card relative h-48 overflow-hidden rounded-xl border">
      <div className="h-full overflow-y-auto overscroll-contain p-3">
        {Array.from({ length: 18 }, (_, i) => (
          <p key={i} className="text-ui-sm py-1">
            Scroll this text up past the top edge · line {i + 1}
          </p>
        ))}
      </div>
      {after ? (
        BLUR_LAYERS.map((l, i) => {
          const mask = `linear-gradient(black ${l.stop - 25}%, black ${l.stop}%, transparent ${l.stop}%)`;
          return (
            <div
              key={l.cls}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0",
                l.cls,
              )}
              style={{
                height: 52,
                maskImage: mask,
                WebkitMaskImage: mask,
                zIndex: BLUR_LAYERS.length - i,
              }}
            />
          );
        })
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 backdrop-blur-md"
          style={{ height: 52 }}
        />
      )}
    </div>
  );
}

/* ── 16 · the whole history is right there ────────────────────────── */

const HISTORY = [
  { label: "Initial draft", when: "6 days ago", diff: "+128 −0" },
  { label: "Rewrote intro", when: "4 days ago", diff: "+41 −60" },
  { label: "Added pricing", when: "2 days ago", diff: "+96 −4" },
  { label: "Copy edit", when: "yesterday", diff: "+12 −18" },
  { label: "Fixed the table", when: "3 hours ago", diff: "+7 −7" },
  { label: "Current", when: "just now", diff: "—" },
];

function HistoryPair({ after }: Side) {
  const [i, setI] = useState(HISTORY.length - 1);
  const current = HISTORY[i];

  return (
    <div>
      <div className="bg-background relative grid h-48 place-items-center overflow-hidden rounded-xl">
        {after ? (
          HISTORY.map((h, idx) => {
            const d = idx - i;
            if (d < 0 || d > 3) return null;
            return (
              <motion.div
                key={h.label}
                animate={{
                  y: -d * 12,
                  scale: 1 - d * 0.05,
                  opacity: 1 - d * 0.26,
                }}
                transition={spring.smooth}
                style={{ zIndex: HISTORY.length - d }}
                className="bg-card shadow-floating absolute w-60 rounded-xl border p-3"
              >
                <p className="text-ui">{h.label}</p>
                <p className="text-caption text-muted-foreground mt-1 tabular-nums">
                  {h.when} · {h.diff}
                </p>
              </motion.div>
            );
          })
        ) : (
          <div className="bg-card w-60 rounded-xl border p-3">
            <p className="text-ui">{current.label}</p>
            <p className="text-caption text-muted-foreground mt-1 tabular-nums">
              {current.when} · {current.diff}
            </p>
          </div>
        )}
      </div>

      {after ? (
        <>
          <label htmlFor="dd-history-range" className="sr-only">
            Version history
          </label>
          <input
            id="dd-history-range"
            type="range"
            min={0}
            max={HISTORY.length - 1}
            value={i}
            onChange={(e) => setI(Number(e.target.value))}
            className="accent-foreground mt-3 h-9 w-full"
          />
        </>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="dd-history-select" className="text-ui-sm">
            Version
          </label>
          <select
            id="dd-history-select"
            value={i}
            onChange={(e) => setI(Number(e.target.value))}
            className="text-ui-sm bg-card h-9 flex-1 rounded-lg border px-2"
          >
            {HISTORY.map((h, idx) => (
              <option key={h.label} value={idx}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <Readout>Go back three versions.</Readout>
    </div>
  );
}

/* ── 17 · the page holds still while the clip loads ───────────────── */

const CLIP_COMMENTS = ["Ada", "Grace", "Alan"];

function VideoPair({ after }: Side) {
  const [phase, setPhase] = useState<"idle" | "loading" | "ready">("idle");

  return (
    <div>
      <Button
        size="lg"
        variant="outline"
        disabled={phase === "loading"}
        onClick={() => {
          setPhase("loading");
          setTimeout(() => setPhase("ready"), 1100);
        }}
      >
        <RotateCw aria-hidden="true" />
        {phase === "loading" ? "Loading…" : "Load the clip"}
      </Button>

      <div className="bg-background mt-3 h-64 overflow-y-auto rounded-xl p-3">
        <p className="text-ui-sm">Motion choreography, in one take</p>

        {after ? (
          <div className="relative mt-2 aspect-video overflow-hidden rounded-lg">
            <div
              aria-hidden="true"
              className={cn(
                "bg-secondary duration-slow ease-out-quart absolute inset-0 overflow-hidden transition-opacity",
                phase === "ready" ? "opacity-0" : "opacity-100",
              )}
            >
              <div className="bg-feature/40 absolute top-1/4 left-1/4 size-24 rounded-full blur-xl" />
              <div className="bg-accent absolute right-2 bottom-0 size-20 rounded-full blur-xl" />
            </div>
            <div
              className={cn(
                "bg-feature text-feature-foreground duration-slow ease-out-quart absolute inset-0 grid place-items-center transition-opacity",
                phase === "ready" ? "opacity-100" : "opacity-0",
              )}
            >
              <Play className="size-7" aria-hidden="true" />
            </div>
          </div>
        ) : (
          phase === "ready" && (
            <div className="bg-feature text-feature-foreground mt-2 grid aspect-video place-items-center rounded-lg">
              <Play className="size-7" aria-hidden="true" />
            </div>
          )
        )}

        <p className="text-caption text-muted-foreground mt-2">
          Three takes, forty seconds.
        </p>
        <div className="mt-3 space-y-1.5">
          {CLIP_COMMENTS.map((n) => (
            <div
              key={n}
              className="bg-card flex h-10 items-center gap-2 rounded-lg border px-2.5"
            >
              <span className="text-ui-sm">{n}</span>
              <span className="text-caption text-muted-foreground">
                this is the bit I keep rewatching
              </span>
            </div>
          ))}
        </div>
      </div>
      <Readout>Start reading a comment, then press Load the clip.</Readout>
    </div>
  );
}

/* ── 18 · a way back from the footnote ────────────────────────────── */

const PARAS = [
  "Some animation sequences get better with a touch of delay.",
  "Some interactions feel better with no motion at all.",
  "A prototype says more in five seconds than a video does in five minutes.",
  "Care shows up in the pages nobody plans for.",
  "An indicator that jumps when you approach it is one you learn to avoid.",
  "The bar is set by the things you notice on the second look.",
];

const NOTES = [
  "Because the eye needs a beat to catch up with the hand.",
  "Movement is a cost. Charge it only where it buys something.",
];

function FootnotePair({ after }: Side) {
  const box = useRef<HTMLDivElement>(null);
  const notes = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const returnTo = useRef(0);

  const jump = (i: number) => {
    const b = box.current;
    const el = notes.current[i];
    if (!b || !el) return;
    returnTo.current = b.scrollTop;
    b.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
    if (after) setActive(i);
  };

  return (
    <div>
      <div
        ref={box}
        className="bg-background relative h-56 overflow-y-auto overscroll-contain rounded-xl p-3"
      >
        {PARAS.map((p, i) => (
          <p key={p} className="text-ui mb-3">
            {p}
            {i < NOTES.length && (
              <button
                type="button"
                aria-label={`Go to note ${i + 1}`}
                onClick={() => jump(i)}
                className="text-accent-foreground text-caption hover:bg-accent ml-0.5 rounded px-1.5 py-1 align-super"
              >
                {i + 1}
              </button>
            )}
          </p>
        ))}

        <p className="text-micro text-muted-foreground mt-6 uppercase">Notes</p>
        <ol className="mt-2 space-y-2">
          {NOTES.map((n, i) => (
            <li
              key={n}
              ref={(el) => {
                notes.current[i] = el;
              }}
              className={cn(
                "text-caption rounded-lg p-2 transition-colors",
                active === i ? "bg-accent" : "bg-card",
              )}
            >
              <span className="text-accent-foreground mr-1.5">{i + 1}</span>
              {n}
              {active === i && (
                <Button
                  size="lg"
                  variant="ghost"
                  className="mt-1.5 flex"
                  onClick={() => {
                    box.current?.scrollTo({
                      top: returnTo.current,
                      behavior: "smooth",
                    });
                    setActive(null);
                  }}
                >
                  <CornerUpLeft aria-hidden="true" />
                  Back to where I was
                </Button>
              )}
            </li>
          ))}
        </ol>
        <div className="h-24" />
      </div>
      <Readout>Press the little 1, then get back to your place.</Readout>
    </div>
  );
}

/* ── 19 · icons that line up ──────────────────────────────────────── */

const TOOLS = [
  { Icon: Search, label: "Search" },
  { Icon: Bell, label: "Notifications" },
  { Icon: Star, label: "Favourite" },
  { Icon: Bookmark, label: "Save" },
  { Icon: Trash2, label: "Delete" },
];

const RAGGED = [
  { size: "size-5", stroke: 1, fill: false },
  { size: "size-3.5", stroke: 2.5, fill: false },
  { size: "size-4", stroke: 2, fill: true },
  { size: "size-5", stroke: 1.25, fill: false },
  { size: "size-3.5", stroke: 2, fill: false },
];

function IconPair({ after }: Side) {
  return (
    <div>
      <div className="bg-background flex h-12 items-center gap-1 rounded-xl px-2">
        {TOOLS.map(({ Icon, label }, i) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className="hover:bg-secondary grid size-9 place-items-center rounded-lg"
          >
            <Icon
              className={cn(
                after ? "size-4" : RAGGED[i].size,
                !after && RAGGED[i].fill && "fill-foreground",
              )}
              strokeWidth={after ? 1.5 : RAGGED[i].stroke}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      <p className="text-ui mt-4">
        {after ? (
          <span className="inline-flex items-center gap-1.5 align-middle">
            <Pin className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Pinned to the top of the channel
          </span>
        ) : (
          <>
            <Pin
              className="mr-1.5 inline size-5"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            Pinned to the top of the channel
          </>
        )}
      </p>
      <Readout>Look along the row, then at the line of text.</Readout>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function DevouringDetailsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The submenu waits while you move across to it."
        before={<IntentPair after={false} />}
        after={<IntentPair after />}
      />
      <BeforeAfter
        principle="You can slide it, the way the picture says you can."
        before={<SwitchPair after={false} />}
        after={<SwitchPair after />}
      />
      <BeforeAfter
        principle="The menu comes to you instead of sending you across the screen."
        before={<PointerMenuPair after={false} />}
        after={<PointerMenuPair after />}
      />
      <BeforeAfter
        principle="A flick is enough — it carries on to where you were throwing it."
        before={<FlickPair after={false} />}
        after={<FlickPair after />}
      />
      <BeforeAfter
        principle="The rows arrive one after another instead of all popping at once."
        before={<ChoreoPair after={false} />}
        after={<ChoreoPair after />}
      />
      <BeforeAfter
        principle="The number moves the instant you press."
        before={<OptimisticPair after={false} />}
        after={<OptimisticPair after />}
      />
      <BeforeAfter
        principle="Scrolling the comments no longer runs away with the article."
        before={<OverscrollPair after={false} />}
        after={<OverscrollPair after />}
      />
      <BeforeAfter
        principle="You can see the shape of the whole page and jump straight into it."
        before={<MinimapPair after={false} />}
        after={<MinimapPair after />}
      />
      <BeforeAfter
        principle="Spin it with your thumb instead of tapping twenty times."
        before={<RulerPair after={false} />}
        after={<RulerPair after />}
      />
      <BeforeAfter
        principle="Any length you like, not just the four somebody picked for you."
        before={<DialPair after={false} />}
        after={<DialPair after />}
      />
      <BeforeAfter
        principle="The button opens out into the box instead of being replaced by it."
        before={<MorphPair after={false} />}
        after={<MorphPair after />}
      />
      <BeforeAfter
        principle="Point anywhere near the line and it tells you the day."
        before={<GraphPair after={false} />}
        after={<GraphPair after />}
      />
      <BeforeAfter
        principle="It stops when you look at it, and stops being sliced off at the edges."
        before={<MarqueePair after={false} />}
        after={<MarqueePair after />}
      />
      <BeforeAfter
        principle="You can see where each name went."
        before={<ShufflePair after={false} />}
        after={<ShufflePair after />}
      />
      <BeforeAfter
        principle="The text fades away at the top instead of hitting a line."
        before={<BlurPair after={false} />}
        after={<BlurPair after />}
      />
      <BeforeAfter
        principle="You can feel how much history there is, and slide back through it."
        before={<HistoryPair after={false} />}
        after={<HistoryPair after />}
      />
      <BeforeAfter
        principle="The comment you were reading stays where it was."
        before={<VideoPair after={false} />}
        after={<VideoPair after />}
      />
      <BeforeAfter
        principle="After you follow a note, you can get back to your place."
        before={<FootnotePair after={false} />}
        after={<FootnotePair after />}
      />
      <BeforeAfter
        principle="The icons stop being slightly different sizes and weights."
        before={<IconPair after={false} />}
        after={<IconPair after />}
      />
    </div>
  );
}
