"use client";

import {
  Archive,
  ArrowLeft,
  ArrowUp,
  Bell,
  ChevronRight,
  Clipboard,
  CloudSun,
  Image as ImageIcon,
  Music,
  RotateCcw,
  Search,
  Trash2,
  Wallet,
  Wifi,
} from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Invisible Details of Interaction Design — Rauno Freiberg, 2023.
 *
 * Thirteen sections, roughly eighteen distinct observations. The ones a
 * person can feel in a browser are rebuilt here as a switch. Icon
 * morphing artefacts, fidgetability, scroll hijacking between OS
 * windows and the essay's process notes stayed where they were.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max));

function Readout({ children }: { children: ReactNode }) {
  return (
    <p className="text-caption text-muted-foreground mt-3 tabular-nums">
      {children}
    </p>
  );
}

/* ── 1 · the swipe follows your finger ─────────────────────────────── */

const ARCHIVE_MAX = 152;
const ARCHIVE_TRIGGER = 88;

function TrackPair({ after }: Side) {
  const x = useMotionValue(0);
  const [armed, setArmed] = useState(false);
  const [count, setCount] = useState(0);
  const armedRef = useRef(false);

  return (
    <div>
      <div className="bg-secondary relative overflow-hidden rounded-xl p-2">
        <div
          className={cn(
            "duration-fast ease-out-quart absolute inset-y-2 left-2 flex w-32 items-center gap-2 rounded-lg px-3 transition-colors",
            armed ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          )}
        >
          <Archive className="size-4" aria-hidden="true" />
          <span className="text-caption">Archive</span>
        </div>

        <motion.div
          style={{ x }}
          onPan={(_, info) => {
            const dx = clamp(info.offset.x, ARCHIVE_MAX);
            const arm = dx >= ARCHIVE_TRIGGER;
            if (after) {
              x.set(dx);
            } else if (arm !== armedRef.current) {
              animate(x, arm ? ARCHIVE_MAX : 0, {
                duration: duration.base,
                ease: ease.outQuart,
              });
            }
            armedRef.current = arm;
            setArmed(arm);
          }}
          onPanEnd={() => {
            if (armedRef.current) setCount((n) => n + 1);
            armedRef.current = false;
            setArmed(false);
            animate(x, 0, spring.smooth);
          }}
          className="bg-card relative cursor-grab touch-pan-y rounded-lg border p-3 select-none active:cursor-grabbing"
        >
          <p className="text-ui">Weekly digest</p>
          <p className="text-caption text-muted-foreground mt-0.5">
            Drag the row to the right.
          </p>
        </motion.div>
      </div>
      <Readout>Archived {count}</Readout>
    </div>
  );
}

/* ── 2 · a delete waits until you let go ───────────────────────────── */

const DELETE_MAX = 152;
const DELETE_TRIGGER = 88;

function ReleasePair({ after }: Side) {
  const x = useMotionValue(0);
  const [armed, setArmed] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const armedRef = useRef(false);
  const deletedRef = useRef(false);

  const restore = () => {
    deletedRef.current = false;
    armedRef.current = false;
    setDeleted(false);
    setArmed(false);
    x.set(0);
  };

  return (
    <div className="bg-secondary relative overflow-hidden rounded-xl p-2">
      <div
        className={cn(
          "duration-fast ease-out-quart absolute inset-y-2 right-2 flex w-32 items-center justify-end gap-2 rounded-lg px-3 transition-colors",
          armed ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <span className="text-caption">Delete</span>
        <Trash2 className="size-4" aria-hidden="true" />
      </div>

      {deleted ? (
        <div className="bg-card relative flex items-center justify-between gap-3 rounded-lg border border-dashed p-3">
          <p className="text-ui-sm text-muted-foreground">Photo deleted</p>
          <Button size="lg" variant="secondary" onClick={restore}>
            <RotateCcw aria-hidden="true" />
            Put it back
          </Button>
        </div>
      ) : (
        <motion.div
          style={{ x }}
          onPan={(_, info) => {
            if (deletedRef.current) return;
            const dx = clamp(-info.offset.x, DELETE_MAX);
            const arm = dx >= DELETE_TRIGGER;
            x.set(-dx);
            armedRef.current = arm;
            setArmed(arm);
            if (!after && arm) {
              deletedRef.current = true;
              setDeleted(true);
            }
          }}
          onPanEnd={() => {
            if (after && armedRef.current) {
              deletedRef.current = true;
              setDeleted(true);
              return;
            }
            armedRef.current = false;
            setArmed(false);
            animate(x, 0, spring.smooth);
          }}
          className="bg-card relative cursor-grab touch-pan-y rounded-lg border p-3 select-none active:cursor-grabbing"
        >
          <p className="text-ui">Beach, July 2019</p>
          <p className="text-caption text-muted-foreground mt-0.5">
            Drag the row left, then all the way back.
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ── 3 · a light action happens during the drag ────────────────────── */

const PEEK = 56;
const PEEK_ROWS = ["Nadia Rahman", "Standup notes", "Invoice #2214"];

function PeekPair({ after }: Side) {
  const pull = useMotionValue(0);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  return (
    <motion.div
      onPan={(_, info) => {
        if (!after) return;
        pull.set(clamp((openRef.current ? PEEK : 0) + info.offset.y, PEEK));
      }}
      onPanEnd={(_, info) => {
        const next = clamp((openRef.current ? PEEK : 0) + info.offset.y, PEEK);
        const nowOpen = next >= PEEK / 2;
        openRef.current = nowOpen;
        setOpen(nowOpen);
        animate(
          pull,
          nowOpen ? PEEK : 0,
          after
            ? spring.smooth
            : { duration: duration.base, ease: ease.outQuart },
        );
      }}
      className="bg-secondary cursor-grab touch-pan-x overflow-hidden rounded-xl p-2 active:cursor-grabbing"
    >
      <motion.div style={{ height: pull }} className="overflow-hidden">
        <div className="flex h-14 items-center pb-2">
          <div className="bg-card flex h-9 w-full items-center gap-2 rounded-lg border px-3">
            <Search
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            <input
              type="text"
              tabIndex={open ? 0 : -1}
              aria-label="Search messages"
              placeholder="Search messages"
              className="text-ui-sm placeholder:text-muted-foreground h-9 w-full bg-transparent outline-none"
            />
          </div>
        </div>
      </motion.div>

      <div className="bg-card overflow-hidden rounded-lg border select-none">
        {PEEK_ROWS.map((row, i) => (
          <div
            key={row}
            className={cn("flex h-11 items-center px-3", i > 0 && "border-t")}
          >
            <p className="text-ui-sm">{row}</p>
          </div>
        ))}
      </div>
      <p className="text-caption text-muted-foreground mt-2 px-1">
        Drag the list slowly downwards.
      </p>
    </motion.div>
  );
}

/* ── 4 · you can turn it around mid-flight ─────────────────────────── */

const SETTINGS_ROWS = ["Wi-Fi", "Bluetooth", "Notifications"];

function InterruptPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = (next: boolean) => {
    setOpen(next);
    if (after) return;
    if (timer.current) clearTimeout(timer.current);
    setBusy(true);
    timer.current = setTimeout(() => setBusy(false), 450);
  };

  return (
    <div className="bg-secondary relative h-60 overflow-hidden rounded-xl p-3">
      <p className="text-micro text-muted-foreground mb-2 uppercase">Settings</p>
      <div className="bg-card overflow-hidden rounded-lg border">
        {SETTINGS_ROWS.map((row, i) => (
          <button
            key={row}
            type="button"
            disabled={busy}
            onClick={() => go(true)}
            className={cn(
              "text-ui-sm hover:bg-secondary flex h-11 w-full items-center justify-between px-3 text-left transition-colors disabled:opacity-50",
              i > 0 && "border-t",
            )}
          >
            {row}
            <ChevronRight
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      <motion.div
        initial={false}
        animate={{ x: open ? "0%" : "100%" }}
        transition={
          after ? spring.smooth : { duration: 0.45, ease: ease.inOutQuart }
        }
        style={{ pointerEvents: open ? "auto" : "none" }}
        className="bg-card absolute inset-0 border-l p-3"
      >
        <div className="flex items-center gap-2">
          <Button
            size="icon-lg"
            variant="ghost"
            aria-label="Back to settings"
            disabled={busy}
            onClick={() => go(false)}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <p className="text-ui">Wi-Fi</p>
        </div>
        <div className="bg-secondary mt-3 space-y-2 rounded-lg p-3">
          {["Studio 5GHz", "Studio guest", "Cafe downstairs"].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <Wifi className="text-muted-foreground size-4" aria-hidden="true" />
              <p className="text-ui-sm">{n}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ── 5 · a throw keeps its speed ───────────────────────────────────── */

function FlickPair({ after }: Side) {
  const box = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={box}
      className="bg-secondary relative h-56 overflow-hidden rounded-xl"
    >
      <motion.div
        drag
        dragConstraints={box}
        dragElastic={0.14}
        dragMomentum={after}
        dragTransition={{
          power: 0.4,
          timeConstant: 320,
          bounceStiffness: 320,
          bounceDamping: 28,
        }}
        whileDrag={{ scale: 1.02 }}
        className="bg-card absolute top-16 left-6 w-44 cursor-grab touch-none rounded-xl border p-3 select-none active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <Bell className="text-muted-foreground size-4" aria-hidden="true" />
          <p className="text-ui">Reminder</p>
        </div>
        <p className="text-caption text-muted-foreground mt-1">
          Throw the card across the box.
        </p>
      </motion.div>
    </div>
  );
}

/* ── 6 · it opens out of the thing you pressed ─────────────────────── */

const APPS = [
  { name: "Music", icon: Music, origin: "25% 28%", detail: "Now playing" },
  { name: "Photos", icon: ImageIcon, origin: "75% 28%", detail: "1,204 items" },
  { name: "Wallet", icon: Wallet, origin: "25% 78%", detail: "2 cards" },
  { name: "Weather", icon: CloudSun, origin: "75% 78%", detail: "18°, clear" },
] as const;

function OriginPair({ after }: Side) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const app = openIdx === null ? null : APPS[openIdx];

  return (
    <div className="bg-secondary relative h-64 overflow-hidden rounded-xl p-3">
      <div className="grid h-full grid-cols-2 gap-3">
        {APPS.map((a, i) => (
          <button
            key={a.name}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="bg-card hover:border-border-strong flex flex-col items-start justify-end rounded-xl border p-3 text-left transition-colors"
          >
            <a.icon className="text-muted-foreground size-5" aria-hidden="true" />
            <p className="text-ui-sm mt-2">{a.name}</p>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {app && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, scale: after ? 0.22 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: after ? 0.22 : 0.98 }}
            transition={
              after
                ? spring.smooth
                : { duration: duration.base, ease: ease.outQuart }
            }
            style={{ transformOrigin: after ? app.origin : "50% 50%" }}
            className="bg-card absolute inset-3 rounded-xl border p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-ui">{app.name}</p>
                <p className="text-caption text-muted-foreground mt-0.5">
                  {app.detail}
                </p>
              </div>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setOpenIdx(null)}
              >
                Close
              </Button>
            </div>
            <div className="bg-secondary mt-3 h-24 rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 7 · the menu you open a hundred times a day ───────────────────── */

const COMMANDS = ["New document", "Go to file", "Invite a teammate"];

function NoveltyPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="bg-secondary relative h-56 overflow-hidden rounded-xl p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" variant="outline" onClick={() => setOpen(true)}>
          <Search aria-hidden="true" />
          Open menu
        </Button>
        <span className="text-micro text-muted-foreground uppercase">
          Open it five times in a row
        </span>
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        {picked ? `Ran ${picked}` : "Nothing run yet"}
      </p>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: after ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: duration.fast } }}
            transition={{ duration: after ? 0 : duration.base }}
            className="absolute inset-0"
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="bg-background/60 absolute inset-0"
            />
            <motion.div
              initial={after ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: after ? 1 : 0.98,
                transition: { duration: duration.fast, ease: ease.outQuad },
              }}
              transition={{ duration: duration.base, ease: ease.outQuart }}
              className="bg-card shadow-floating absolute inset-x-4 top-5 rounded-xl border p-1"
            >
              <div className="flex h-9 items-center gap-2 px-2">
                <Search
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label="Run a command"
                  placeholder="Run a command"
                  className="text-ui-sm placeholder:text-muted-foreground h-9 w-full bg-transparent outline-none"
                />
              </div>
              {COMMANDS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setPicked(c);
                    setOpen(false);
                  }}
                  className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center rounded-lg px-2 text-left transition-colors"
                >
                  {c}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 8 · the drag survives leaving the bar ─────────────────────────── */

function SliderPair({ after }: Side) {
  const [value, setValue] = useState(38);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFrom = (clientX: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setValue(Math.round(clamp((clientX - r.left) / r.width, 1) * 100));
  };

  return (
    <div className="bg-secondary rounded-xl p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-ui-sm">Volume</span>
        <span className="text-caption text-muted-foreground tabular-nums">
          {value}
        </span>
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setValue((v) => Math.max(0, v - 5));
          if (e.key === "ArrowRight") setValue((v) => Math.min(100, v + 5));
        }}
        onPointerDown={(e) => {
          dragging.current = true;
          if (after) e.currentTarget.setPointerCapture(e.pointerId);
          setFrom(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) setFrom(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onPointerLeave={() => {
          if (!after) dragging.current = false;
        }}
        className="focus-visible:ring-ring/50 relative flex h-9 cursor-pointer touch-none items-center rounded-lg outline-none focus-visible:ring-3"
      >
        <div className="bg-border h-1.5 w-full rounded-full">
          <div
            className="bg-foreground h-1.5 rounded-full"
            style={{ width: `${value}%` }}
          />
        </div>
        <div
          className="bg-card absolute size-5 -translate-x-1/2 rounded-full border shadow-xs"
          style={{ left: `${value}%` }}
        />
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        Hold the bar and drift up or down while you drag.
      </p>
    </div>
  );
}

/* ── 9 · the key you pressed, above your thumb ─────────────────────── */

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

function KeyPair({ after }: Side) {
  const [entry, setEntry] = useState("07700");
  const [pressed, setPressed] = useState<string | null>(null);

  const tap = (k: string) => {
    if (k === "back") setEntry((e) => e.slice(0, -1));
    else setEntry((e) => (e.length >= 11 ? e : e + k));
  };

  return (
    <div className="bg-secondary rounded-xl p-4">
      <div className="bg-card mb-4 flex h-11 items-center rounded-lg border px-3">
        <span className="text-ui tabular-nums">{entry || "Phone number"}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k, i) =>
          k === "" ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed keypad layout
            <div key={`gap-${i}`} />
          ) : (
            <div key={k} className="relative">
              <button
                type="button"
                aria-label={k === "back" ? "Delete last digit" : `Digit ${k}`}
                onClick={() => tap(k)}
                onPointerDown={() => setPressed(k)}
                onPointerUp={() => setPressed(null)}
                onPointerLeave={() => setPressed(null)}
                onPointerCancel={() => setPressed(null)}
                className="bg-card text-ui hover:border-border-strong flex h-12 w-full items-center justify-center rounded-lg border tabular-nums transition-colors"
              >
                {k === "back" ? "⌫" : k}
              </button>

              {pressed === k && (
                <>
                  {after && (
                    <span className="bg-card text-title shadow-floating pointer-events-none absolute -top-12 left-1/2 flex h-11 w-14 -translate-x-1/2 items-center justify-center rounded-lg border tabular-nums">
                      {k === "back" ? "⌫" : k}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className="bg-muted-foreground/50 pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  />
                </>
              )}
            </div>
          ),
        )}
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        The circle is your fingertip. Press and hold a key.
      </p>
    </div>
  );
}

/* ── 10 · getting back to where you were reading ───────────────────── */

const PARAGRAPHS = [
  "The kettle came back from the repair shop with a new base and the same dent in the lid.",
  "Warm the pot first. Cold porcelain pulls a surprising amount of heat out of the water, and the first minute of the steep is the one that matters.",
  "Two grams of leaf for every hundred millilitres. A kitchen scale is worth more here than any amount of judgement by eye.",
  "Water off the boil by thirty seconds. Green leaves scorch, the taste turns flat and slightly bitter, and no amount of milk rescues it.",
  "Four minutes for a black leaf, two for a green one, one for anything rolled into pellets that will open up on its own.",
  "Take the leaves out. Leaving them in is the most common reason a good pot turns sour halfway down the second cup.",
  "Milk after, never before, unless you are pouring into bone china that might crack. Then, and only then, milk first.",
  "The second pot from the same leaves is often better than the first. The third is a courtesy to the leaves.",
  "Wash the pot with water alone. Soap lives in the glaze for weeks and turns up, faintly, in every cup after.",
];

function LandmarkPair({ after }: Side) {
  const scroller = useRef<HTMLDivElement>(null);
  const deepest = useRef(0);
  const [mark, setMark] = useState<number | null>(null);

  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop;
          if (top >= deepest.current - 4) {
            deepest.current = Math.max(deepest.current, top);
            setMark(null);
          } else if (after && deepest.current - top > 90) {
            setMark(deepest.current);
          }
        }}
        className="bg-secondary h-56 overflow-y-auto rounded-xl p-4"
      >
        <div className="space-y-3">
          {PARAGRAPHS.map((p) => (
            <p key={p.slice(0, 16)} className="text-ui-sm">
              {p}
            </p>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {mark !== null && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="absolute inset-x-0 bottom-3 flex justify-center"
          >
            <Button
              size="lg"
              variant="secondary"
              className="shadow-floating"
              onClick={() => {
                scroller.current?.scrollTo({ top: mark, behavior: "smooth" });
                setMark(null);
              }}
            >
              <ArrowUp aria-hidden="true" />
              Back to where you were
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-caption text-muted-foreground mt-3">
        Read to the bottom, then scroll back up to check something.
      </p>
    </div>
  );
}

/* ── 11 · the code you already copied ──────────────────────────────── */

const CODE = "482915";

function PastePair({ after }: Side) {
  const [digits, setDigits] = useState<string[]>(() => Array(6).fill(""));
  const [done, setDone] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const receive = (text: string) => {
    const d = text.replace(/\D/g, "");
    if (!d) return;
    setDone(false);
    if (after) {
      setDigits(Array.from({ length: 6 }, (_, i) => d[i] ?? ""));
      boxes.current[Math.min(d.length, 5)]?.focus();
    } else {
      setDigits((prev) => {
        const next = [...prev];
        next[0] = d[0];
        return next;
      });
      boxes.current[0]?.focus();
    }
  };

  const type = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < 5) boxes.current[i + 1]?.focus();
  };

  return (
    <div className="bg-secondary rounded-xl p-4">
      <p className="text-ui-sm mb-3">Enter the code we sent you</p>
      <div className="flex gap-2">
        {digits.map((d, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed six-box layout
            key={`box-${i}`}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => type(i, e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              receive(e.clipboardData.getData("text"));
            }}
            className="bg-card text-ui focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-10 rounded-lg border text-center tabular-nums outline-none focus-visible:ring-3"
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="lg" variant="secondary" onClick={() => receive(CODE)}>
          <Clipboard aria-hidden="true" />
          Paste {CODE}
        </Button>
        <Button
          size="lg"
          disabled={!digits.every(Boolean)}
          onClick={() => setDone(true)}
        >
          Continue
        </Button>
        {done && <span className="text-caption text-positive">Signed in</span>}
      </div>
    </div>
  );
}

/* ── the page ──────────────────────────────────────────────────────── */

export function InvisibleDetailsOfInteractionDesignDemo() {
  return (
    <div>
      <BeforeAfter
        principle="It moves with your finger the whole way, not in one jump."
        before={<TrackPair after={false} />}
        after={<TrackPair after />}
      />
      <BeforeAfter
        principle="You can change your mind halfway through the swipe."
        before={<ReleasePair after={false} />}
        after={<ReleasePair after />}
      />
      <BeforeAfter
        principle="You can see the search box while you are still pulling it down."
        before={<PeekPair after={false} />}
        after={<PeekPair after />}
      />
      <BeforeAfter
        principle="Go back the moment you mistap, instead of waiting it out."
        before={<InterruptPair after={false} />}
        after={<InterruptPair after />}
      />
      <BeforeAfter
        principle="Throw it and it carries on, the way it left your hand."
        before={<FlickPair after={false} />}
        after={<FlickPair after />}
      />
      <BeforeAfter
        principle="It opens out of the one you pressed, and goes back into it."
        before={<OriginPair after={false} />}
        after={<OriginPair after />}
      />
      <BeforeAfter
        principle="It is just there, however many times a day you open it."
        before={<NoveltyPair after={false} />}
        after={<NoveltyPair after />}
      />
      <BeforeAfter
        principle="Your finger can slide off the bar and it still follows."
        before={<SliderPair after={false} />}
        after={<SliderPair after />}
      />
      <BeforeAfter
        principle="You can see which key you hit, even under your thumb."
        before={<KeyPair after={false} />}
        after={<KeyPair after />}
      />
      <BeforeAfter
        principle="Look back up the page, then land exactly where you left off."
        before={<LandmarkPair after={false} />}
        after={<LandmarkPair after />}
      />
      <BeforeAfter
        principle="The code you copied fills in all six boxes."
        before={<PastePair after={false} />}
        after={<PastePair after />}
      />
    </div>
  );
}
