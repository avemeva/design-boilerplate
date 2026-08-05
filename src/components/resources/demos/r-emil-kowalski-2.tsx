"use client";

import NumberFlow from "@number-flow/react";
import {
  Archive,
  Check,
  ChevronRight,
  Copy,
  Minus,
  MoreHorizontal,
  Plus,
  Trash2,
  Volume2,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * emilkowal.ski/skill — the eight skills, shown instead of listed.
 * Each switch flips one piece of interface between the version most
 * products ship and the version the skills argue for.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const CTRL =
  "text-ui-sm ring-ring/50 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 whitespace-nowrap select-none outline-none focus-visible:ring-3";
const PRIMARY = cn(CTRL, "bg-primary text-primary-foreground");
const QUIET = cn(CTRL, "bg-secondary text-foreground");
const STAGE = "bg-secondary relative overflow-hidden rounded-xl";
const OUT = "var(--ease-out-quart)";

/* ------------------------------------------------------------------ *
 * 1 — the two properties you meant, not everything
 * ------------------------------------------------------------------ */

const CHIPS = ["All", "Design", "Engineering", "Archive"];

function ChipsPair({ after }: Side) {
  const [sel, setSel] = useState("Design");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {CHIPS.map((c) => {
          const on = sel === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => setSel(c)}
              style={{
                paddingInline: on ? 16 : 12,
                transition: after
                  ? `background-color 150ms ${OUT}, color 150ms ${OUT}`
                  : "all 300ms ease",
              }}
              className={cn(
                "text-ui-sm ring-ring/50 inline-flex h-9 items-center gap-1.5 rounded-full outline-none focus-visible:ring-3",
                on
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {on && <Check className="size-3.5" aria-hidden="true" />}
              {c}
            </button>
          );
        })}
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        Showing {sel === "All" ? "everything" : sel.toLowerCase()} — 12 files
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2 — the highlight and the label, in step
 * ------------------------------------------------------------------ */

const TABS = ["Overview", "Activity", "Members"];
const TAB_BODY = [
  "Two deploys today, both green.",
  "Mira renamed the staging branch 20 minutes ago.",
  "Four people, two of them admins.",
];

function TabsPair({ after }: Side) {
  const [i, setI] = useState(0);
  const slot = 100 / TABS.length;

  return (
    <div>
      <div className="bg-secondary relative flex rounded-full p-1">
        <span
          aria-hidden="true"
          className="bg-primary absolute top-1 bottom-1 rounded-full"
          style={{
            left: 4,
            width: `calc((100% - 8px) / ${TABS.length})`,
            transform: `translateX(${i * 100}%)`,
            transition: `transform 240ms ${OUT}`,
          }}
        />
        {TABS.map((t, idx) => (
          <button
            key={t}
            type="button"
            aria-pressed={idx === i}
            onClick={() => setI(idx)}
            style={
              after
                ? undefined
                : {
                    color:
                      idx === i
                        ? "var(--primary-foreground)"
                        : "var(--muted-foreground)",
                  }
            }
            className={cn(
              "text-ui-sm ring-ring/50 relative z-10 h-9 flex-1 rounded-full outline-none focus-visible:ring-3",
              after && "text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
        {after && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-1 z-10 flex"
            style={{
              clipPath: `inset(0 ${(TABS.length - 1 - i) * slot}% 0 ${i * slot}%)`,
              transition: `clip-path 240ms ${OUT}`,
            }}
          >
            {TABS.map((t) => (
              <span
                key={t}
                className="text-ui-sm text-primary-foreground grid h-9 flex-1 place-items-center"
              >
                {t}
              </span>
            ))}
          </span>
        )}
      </div>
      <p className="text-caption text-muted-foreground mt-3">{TAB_BODY[i]}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3 — one word replacing another
 * ------------------------------------------------------------------ */

function SavePair({ after }: Side) {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const timers = useRef<number[]>([]);
  const label =
    state === "idle" ? "Save changes" : state === "saving" ? "Saving" : "Saved";

  const run = () => {
    for (const t of timers.current) clearTimeout(t);
    setState("saving");
    timers.current = [
      window.setTimeout(() => setState("saved"), 750),
      window.setTimeout(() => setState("idle"), 2400),
    ];
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <motion.button
        type="button"
        onClick={run}
        whileTap={after ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.16, ease: ease.outQuart }}
        style={{ width: 150 }}
        className={cn(PRIMARY, "relative overflow-hidden px-0")}
      >
        <AnimatePresence initial={false}>
          <motion.span
            key={label}
            className="absolute inset-0 grid place-items-center"
            initial={
              after ? { opacity: 0, filter: "blur(5px)", y: 6 } : { opacity: 0 }
            }
            animate={
              after ? { opacity: 1, filter: "blur(0px)", y: 0 } : { opacity: 1 }
            }
            exit={
              after
                ? { opacity: 0, filter: "blur(5px)", y: -6 }
                : { opacity: 0 }
            }
            transition={{ duration: after ? 0.18 : 0.38, ease: ease.outQuart }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <p className="text-caption text-muted-foreground">
        Press it, then watch the word.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 4 — a number you can follow
 * ------------------------------------------------------------------ */

function TotalPair({ after }: Side) {
  const [seats, setSeats] = useState(3);
  const total = seats * 29;
  const money = total.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-5">
      <div>
        <p className="text-micro text-muted-foreground mb-2 uppercase">Seats</p>
        <div className="bg-secondary inline-flex items-center gap-1 rounded-lg p-1">
          <button
            type="button"
            aria-label="One fewer seat"
            onClick={() => setSeats((s) => Math.max(1, s - 1))}
            className="text-foreground ring-ring/50 grid size-9 place-items-center rounded-md outline-none focus-visible:ring-3"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="text-ui w-8 text-center tabular-nums">{seats}</span>
          <button
            type="button"
            aria-label="One more seat"
            onClick={() => setSeats((s) => Math.min(48, s + 1))}
            className="text-foreground ring-ring/50 grid size-9 place-items-center rounded-md outline-none focus-visible:ring-3"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="text-micro text-muted-foreground mb-2 uppercase">
          Billed monthly
        </p>
        {after ? (
          <NumberFlow
            value={total}
            locales="en-US"
            format={{
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }}
            className="text-title"
          />
        ) : (
          <p className="text-title">{money}</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 5 — hidden by its own height, not by a guess
 * ------------------------------------------------------------------ */

const SHEET_ITEMS = [
  "Duplicate",
  "Move to project",
  "Add to favourites",
  "Share a link",
  "Export as CSV",
];

function SheetPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(3);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={PRIMARY}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close the sheet" : "Open the sheet"}
        </button>
        <button
          type="button"
          className={QUIET}
          onClick={() => setCount((c) => (c >= SHEET_ITEMS.length ? 2 : c + 1))}
        >
          Put another item in it
        </button>
      </div>

      <div className={cn(STAGE, "mt-3")} style={{ height: 260 }}>
        <p className="text-caption text-muted-foreground p-4">
          Proposal.pdf — 2.4 MB
        </p>
        <div
          className="bg-card absolute inset-x-0 bottom-0 rounded-t-xl border p-2"
          style={{
            transform: open
              ? "translateY(0px)"
              : after
                ? "translateY(100%)"
                : "translateY(120px)",
            transition: `transform 300ms ${OUT}`,
          }}
        >
          <p className="text-micro text-muted-foreground px-2 pt-1 pb-2 uppercase">
            File actions
          </p>
          {SHEET_ITEMS.slice(0, count).map((s) => (
            <p key={s} className="text-ui-sm rounded-md px-2 py-2">
              {s}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 6 — a panel that opens without re-typesetting itself
 * ------------------------------------------------------------------ */

const NOTE_W = 250;
const NOTE_H = 132;

function RevealPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const note = (
    <div className="p-4">
      <p className="text-ui-sm mb-1">Renewal moves to 12 March</p>
      <p className="text-caption text-muted-foreground">
        The two seats you added today are billed pro rata, so this month is
        shorter than the next one.
      </p>
    </div>
  );

  return (
    <div>
      <button
        type="button"
        className={PRIMARY}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide the note" : "Show the note"}
      </button>

      <div className="mt-3 flex items-start gap-3">
        <div
          className="bg-card shrink-0 rounded-xl border p-4"
          style={{ width: 168 }}
        >
          <p className="text-micro text-muted-foreground mb-1 uppercase">
            Next invoice
          </p>
          <p className="text-ui tabular-nums">$87</p>
        </div>

        <div style={{ width: NOTE_W, height: NOTE_H }}>
          {after ? (
            <div
              className="bg-secondary overflow-hidden rounded-xl"
              style={{
                width: NOTE_W,
                height: NOTE_H,
                clipPath: open ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                transition: `clip-path 260ms ${OUT}`,
              }}
            >
              <div style={{ width: NOTE_W }}>{note}</div>
            </div>
          ) : (
            <div
              className="bg-secondary overflow-hidden rounded-xl"
              style={{
                width: open ? NOTE_W : 0,
                height: NOTE_H,
                transition: `width 260ms ${OUT}`,
              }}
            >
              {note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 7 — a menu that stays on screen and knows when to leave
 * ------------------------------------------------------------------ */

const MENU_ROWS = ["Rename", "Duplicate", "Move to project"];
const FILES = ["Q3 report.pdf", "Brand assets.zip", "Meeting notes.md"];

function MenuPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!after || !open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [after, open]);

  return (
    <div className={STAGE} style={{ height: 216 }}>
      <div className="p-3">
        {FILES.map((f) => (
          <div
            key={f}
            className="bg-card mb-2 flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <span className="text-ui-sm flex-1 truncate">{f}</span>
            <ChevronRight
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      <div ref={wrap} className="absolute right-3 bottom-3">
        <button
          type="button"
          aria-label="More actions"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="bg-card ring-ring/50 grid size-9 place-items-center rounded-lg border outline-none focus-visible:ring-3"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>

        {open && (
          <div
            className={cn(
              "absolute right-0",
              after ? "bottom-full mb-1.5" : "top-full mt-1.5",
            )}
          >
            <div className="bg-card shadow-floating w-44 rounded-lg border p-1">
              {MENU_ROWS.map((r) => (
                <p
                  key={r}
                  className="text-ui-sm hover:bg-secondary rounded-md px-2 py-1.5"
                >
                  {r}
                </p>
              ))}
              <p className="text-destructive text-ui-sm hover:bg-secondary flex items-center gap-2 rounded-md px-2 py-1.5">
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 8 — a code field that takes a pasted code
 * ------------------------------------------------------------------ */

const CODE = "428913";
const EMPTY = ["", "", "", "", "", ""];

function OtpPair({ after }: Side) {
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const [copied, setCopied] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const filled = digits.filter(Boolean).length;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CODE);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, []);

  const change = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "");
    setDigits((prev) => {
      const next = [...prev];
      if (!after) {
        next[i] = v.slice(-1);
        return next;
      }
      const chars = v.split("");
      for (let k = 0; k < chars.length && i + k < 6; k++) {
        next[i + k] = chars[k];
      }
      return next;
    });
    if (after && v) refs.current[Math.min(i + v.length, 5)]?.focus();
  };

  return (
    <div>
      <p className="text-ui-sm mb-1">Enter the code we sent you</p>
      <p className="text-caption text-muted-foreground mb-3">
        Copy it, then paste into the first box — or type it out.
      </p>

      <div
        className="flex gap-2"
        onPaste={(e) => {
          if (!after) return;
          const v = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);
          if (!v) return;
          e.preventDefault();
          setDigits(Array.from({ length: 6 }, (_, k) => v[k] ?? ""));
          refs.current[Math.min(v.length, 5)]?.focus();
        }}
      >
        {digits.map((d, i) => (
          <input
            key={`box-${i + 1}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            aria-label={`Digit ${i + 1} of 6`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={after ? 6 : 1}
            onFocus={after ? (e) => e.currentTarget.select() : undefined}
            onChange={(e) => change(i, e.target.value)}
            onKeyDown={(e) => {
              if (!after) return;
              if (e.key === "Backspace" && !digits[i] && i > 0) {
                e.preventDefault();
                setDigits((prev) => {
                  const next = [...prev];
                  next[i - 1] = "";
                  return next;
                });
                refs.current[i - 1]?.focus();
              }
            }}
            className="bg-card text-ui ring-ring/50 size-11 rounded-lg border text-center tabular-nums outline-none focus-visible:ring-3"
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className={QUIET} onClick={() => void copy()}>
          <Copy className="size-3.5" aria-hidden="true" />
          {copied ? "Copied" : `Copy ${CODE}`}
        </button>
        <span className="text-caption text-muted-foreground tabular-nums">
          {filled === 6 ? "Code complete" : `${filled} of 6`}
        </span>
        <button type="button" className={QUIET} onClick={() => setDigits(EMPTY)}>
          Clear
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 9 — a drag that does not let go
 * ------------------------------------------------------------------ */

function SliderPair({ after }: Side) {
  const track = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(42);
  const [dragging, setDragging] = useState(false);

  const set = (clientX: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const next = ((clientX - r.left) / r.width) * 100;
    setPct(Math.round(Math.min(100, Math.max(0, next))));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-ui-sm flex items-center gap-2">
          <Volume2
            className="text-muted-foreground size-4"
            aria-hidden="true"
          />
          Output volume
        </span>
        <span className="text-ui-sm tabular-nums">{pct}%</span>
      </div>

      <div ref={track} className="bg-secondary relative h-2 rounded-full">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Output volume"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setPct((p) => Math.min(100, p + 2));
            if (e.key === "ArrowLeft") setPct((p) => Math.max(0, p - 2));
          }}
          onPointerDown={(e) => {
            setDragging(true);
            if (after) e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragging) set(e.clientX);
          }}
          onPointerLeave={() => {
            if (!after) setDragging(false);
          }}
          onPointerUp={(e) => {
            setDragging(false);
            if (after && e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
          }}
          className="bg-card ring-ring/50 absolute top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-xs outline-none focus-visible:ring-3"
          style={{ left: `${pct}%`, touchAction: "none" }}
        />
      </div>

      <p className="text-caption text-muted-foreground mt-6">
        Grab the handle and swing your pointer well above the track.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 10 — a decoration with some weight in it
 * ------------------------------------------------------------------ */

function TiltPair({ after }: Side) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 100, damping: 10, mass: 1 });
  const sy = useSpring(my, { stiffness: 100, damping: 10, mass: 1 });
  const x = after ? sx : mx;
  const y = after ? sy : my;
  const rotateY = useTransform(x, [-1, 1], [-16, 16]);
  const rotateX = useTransform(y, [-1, 1], [12, -12]);

  return (
    <div
      className={cn(STAGE, "grid place-items-center")}
      style={{ height: 208 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 700, width: 208 }}
        className="bg-card rounded-xl border p-4"
      >
        <p className="text-micro text-muted-foreground mb-2 uppercase">
          Membership
        </p>
        <p className="text-ui mb-6">Nadia Halloway</p>
        <p className="text-caption text-muted-foreground tabular-nums">
          4821 · expires 09/29
        </p>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 11 — numbers you are trying to read
 * ------------------------------------------------------------------ */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const METRICS = ["Requests", "Errors", "p95 latency"];

function jitter(n: number, spread: number) {
  return Math.round(n * (1 + (Math.random() - 0.5) * spread));
}

function DataPair({ after }: Side) {
  const [tick, setTick] = useState(0);
  const [bars, setBars] = useState([62, 48, 71, 55, 80, 44, 58]);
  const [rows, setRows] = useState([128400, 312, 184]);

  const refresh = () => {
    setTick((t) => t + 1);
    setBars((b) => b.map((v) => Math.min(100, Math.max(22, jitter(v, 0.45)))));
    setRows((r) => [jitter(r[0], 0.06), jitter(r[1], 0.4), jitter(r[2], 0.16)]);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" className={PRIMARY} onClick={refresh}>
          New reading
        </button>
        {!after && (
          <span className="text-caption text-muted-foreground flex items-center gap-2">
            <span
              className="bg-primary size-1.5 animate-pulse rounded-full"
              aria-hidden="true"
            />
            live
          </span>
        )}
      </div>

      <div
        key={after ? "steady" : tick}
        className="flex items-end gap-1.5"
        style={{ height: 88 }}
      >
        {bars.map((v, i) =>
          after ? (
            <div
              key={DAYS[i]}
              className="bg-primary flex-1 rounded-t-sm"
              style={{ height: `${v}%` }}
            />
          ) : (
            <motion.div
              key={DAYS[i]}
              className="bg-primary flex-1 origin-bottom rounded-t-sm"
              style={{ height: `${v}%` }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: i * 0.06,
                ease: ease.outQuart,
              }}
            />
          ),
        )}
      </div>
      <div className="text-micro text-muted-foreground mt-1.5 flex gap-1.5 uppercase">
        {DAYS.map((d) => (
          <span key={d} className="flex-1 text-center">
            {d}
          </span>
        ))}
      </div>

      <div className="mt-4 divide-y border-t">
        {METRICS.map((m, i) => (
          <div key={m} className="flex items-center justify-between py-2.5">
            <span className="text-ui-sm text-muted-foreground">{m}</span>
            <div
              className="relative flex h-6 items-center justify-end overflow-hidden"
              style={{ width: 112 }}
            >
              {after ? (
                <span className="text-ui tabular-nums">
                  {rows[i].toLocaleString("en-US")}
                </span>
              ) : (
                <AnimatePresence initial={false}>
                  <motion.span
                    key={`${m}-${tick}`}
                    className="text-ui absolute right-0"
                    initial={{ opacity: 0, y: 12, filter: "blur(3px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -12, filter: "blur(3px)" }}
                    transition={{ duration: 0.45, ease: ease.outQuart }}
                  >
                    {rows[i].toLocaleString("en-US")}
                  </motion.span>
                </AnimatePresence>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 12 — a very long list
 * ------------------------------------------------------------------ */

const FIRST = ["Mira", "Jonas", "Priya", "Tomas", "Ada", "Rune", "Ines", "Kofi"];
const LAST = ["Halloway", "Vester", "Rao", "Novak", "Lindqvist", "Baptiste"];
const TOTAL = 3000;
const ROW_H = 44;
const VIEW_H = 264;

function ListPair({ after }: Side) {
  const [loaded, setLoaded] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  const people = useMemo(
    () =>
      loaded
        ? Array.from({ length: TOTAL }, (_, i) => ({
            id: i,
            name: `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`,
            mail: `${FIRST[i % FIRST.length].toLowerCase()}${i}@company.com`,
          }))
        : [],
    [loaded],
  );

  const first = after ? Math.max(0, Math.floor(scrollTop / ROW_H) - 4) : 0;
  const last = after
    ? Math.min(people.length, first + Math.ceil(VIEW_H / ROW_H) + 8)
    : people.length;
  const slice = people.slice(first, last);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={cn(PRIMARY, loaded && "opacity-50")}
          onClick={() => setLoaded(true)}
          disabled={loaded}
        >
          Load all 3,000 contacts
        </button>
        <span className="text-caption text-muted-foreground tabular-nums">
          {loaded ? "3,000 contacts" : "nothing loaded yet"}
        </span>
      </div>

      <div
        className={cn(STAGE, "overflow-y-auto")}
        style={{ height: VIEW_H }}
        onScroll={
          after ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined
        }
      >
        <div style={{ height: loaded ? people.length * ROW_H : VIEW_H }}>
          <div style={{ transform: `translateY(${first * ROW_H}px)` }}>
            {slice.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3"
                style={{ height: ROW_H }}
              >
                <span className="bg-card text-micro grid size-7 shrink-0 place-items-center rounded-full border uppercase">
                  {p.name[0]}
                </span>
                <span className="text-ui-sm min-w-0 flex-1 truncate">
                  {p.name}
                </span>
                <span className="text-caption text-muted-foreground hidden truncate sm:block">
                  {p.mail}
                </span>
                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden="true"
                />
              </div>
            ))}
            {!loaded && (
              <p className="text-caption text-muted-foreground p-4">
                Press the button and count the wait.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 13 — notifications that behave like a stack
 * ------------------------------------------------------------------ */

const MAILS = [
  "Quarterly review",
  "Invoice #2481",
  "Re: staging is down",
  "Welcome to the team",
];

function ToastPair({ after }: Side) {
  const [i, setI] = useState(0);
  const [homemade, setHomemade] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const archive = () => {
    const subject = MAILS[i % MAILS.length];
    setI((n) => n + 1);
    if (after) {
      toast.success("Message archived", {
        description: subject,
        action: { label: "Undo", onClick: () => {} },
      });
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setHomemade(subject);
    timer.current = window.setTimeout(() => setHomemade(null), 3000);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button type="button" className={PRIMARY} onClick={archive}>
          <Archive className="size-3.5" aria-hidden="true" />
          Archive
        </button>
        <span className="text-caption text-muted-foreground">
          Press it four or five times quickly.
        </span>
      </div>

      <div className="divide-y border-t">
        {MAILS.map((m, idx) => (
          <p
            key={m}
            className={cn(
              "text-ui-sm py-2.5",
              idx < i % MAILS.length && "text-muted-foreground line-through",
            )}
          >
            {m}
          </p>
        ))}
      </div>

      {!after && homemade && (
        <div className="pointer-events-none fixed right-4 bottom-4 z-50">
          <div
            className="bg-popover text-popover-foreground rounded-xl border p-4"
            style={{ width: 288 }}
          >
            <p className="text-ui-sm">Message archived</p>
            <p className="text-caption text-muted-foreground mt-1 truncate">
              {homemade}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function EmilKowalski2Demo() {
  return (
    <div>
      <BeforeAfter
        principle="Only the colour changes — the row stops shuffling itself about."
        before={<ChipsPair after={false} />}
        after={<ChipsPair after />}
      />
      <BeforeAfter
        principle="The label turns white exactly as the highlight reaches it."
        before={<TabsPair after={false} />}
        after={<TabsPair after />}
      />
      <BeforeAfter
        principle="The word swaps cleanly instead of showing you two at once."
        before={<SavePair after={false} />}
        after={<SavePair after />}
      />
      <BeforeAfter
        principle="You can watch the total change instead of it blinking."
        before={<TotalPair after={false} />}
        after={<TotalPair after />}
      />
      <BeforeAfter
        principle="It hides completely, however much is inside it."
        before={<SheetPair after={false} />}
        after={<SheetPair after />}
      />
      <BeforeAfter
        principle="The words stop re-wrapping while the panel opens."
        before={<RevealPair after={false} />}
        after={<RevealPair after />}
      />
      <BeforeAfter
        principle="It opens where there is room, and it goes away when you click elsewhere."
        before={<MenuPair after={false} />}
        after={<MenuPair after />}
      />
      <BeforeAfter
        principle="Paste the code once and the boxes fill themselves in."
        before={<OtpPair after={false} />}
        after={<OtpPair after />}
      />
      <BeforeAfter
        principle="Keep dragging even when your pointer strays off the handle."
        before={<SliderPair after={false} />}
        after={<SliderPair after />}
      />
      <BeforeAfter
        principle="It settles instead of snapping to your pointer."
        before={<TiltPair after={false} />}
        after={<TiltPair after />}
      />
      <BeforeAfter
        principle="The numbers hold still long enough to read them."
        before={<DataPair after={false} />}
        after={<DataPair after />}
      />
      <BeforeAfter
        principle="The list is there the moment you ask for it."
        before={<ListPair after={false} />}
        after={<ListPair after />}
      />
      <BeforeAfter
        principle="They stack up, wait while you read, and you can flick them away."
        before={<ToastPair after={false} />}
        after={<ToastPair after />}
      />
    </div>
  );
}
