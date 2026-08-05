"use client";

import {
  Bell,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Loader2Icon,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Fluid Functionalism — a shadcn registry of 52 items (23 documented
 * components, plus the springs / surfaces / proximity-hover libs they
 * all share). None of it is installed here: the registry targets
 * `components/ui/*` and would overwrite this project's own primitives,
 * and it pulls framer-motion alongside the installed `motion`.
 *
 * So every `after` below is a reimplementation of one registry item's
 * behaviour on this project's tokens, and every `before` is the same
 * piece of UI written the obvious way.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const ROW = 36; // h-9 — every list row on this page
const PAD_Y = 8; // py-2 on the proximity menu
const PAD = 4; // p-1 on the checkbox list

/* ================================================================== *
 * 1 — Proximity hover  (use-proximity-hover, dropdown, table)
 * ================================================================== */

const MENU = [
  { icon: User, label: "Profile" },
  { icon: Bell, label: "Notifications" },
  { icon: CreditCard, label: "Billing" },
  { icon: Settings, label: "Preferences" },
  { icon: LogOut, label: "Sign out" },
] as const;

function ProximityPair({ after }: Side) {
  const listRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState<number | null>(null);
  const [picked, setPicked] = useState<string>("Profile");

  const track = (e: React.MouseEvent) => {
    const el = listRef.current;
    if (!el) return;
    const y = e.clientY - el.getBoundingClientRect().top - PAD_Y;
    const i = Math.min(MENU.length - 1, Math.max(0, Math.floor(y / ROW)));
    setNear(i);
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div
        ref={listRef}
        onMouseMove={after ? track : undefined}
        onMouseLeave={after ? () => setNear(null) : undefined}
        className="bg-card shadow-floating relative w-56 rounded-xl border px-1 py-2"
      >
        {after && (
          <motion.span
            aria-hidden
            className="bg-secondary pointer-events-none absolute inset-x-1 rounded-lg"
            style={{ top: PAD_Y, height: ROW }}
            animate={{ y: (near ?? 0) * ROW, opacity: near === null ? 0 : 1 }}
            transition={spring.snappy}
          />
        )}
        {MENU.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => setPicked(m.label)}
            className={cn(
              "text-ui-sm relative flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left",
              !after && "duration-instant hover:bg-secondary transition-colors",
            )}
          >
            <m.icon
              size={16}
              strokeWidth={1.5}
              aria-hidden
              className="text-muted-foreground shrink-0"
            />
            <span className="flex-1">{m.label}</span>
            {picked === m.label && (
              <Check size={14} strokeWidth={2} aria-hidden className="text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">
        Opens on <span className="text-foreground">{picked}</span>
      </p>
    </div>
  );
}

/* ================================================================== *
 * 2 — Contiguous selections merge  (use-merge-split, checkbox-group)
 * ================================================================== */

const PERMS = [
  "Dashboards",
  "Alerts",
  "Audit log",
  "Billing",
  "Members",
  "Webhooks",
] as const;

type Run = { start: number; len: number };

function runsOf(selected: Set<number>, total: number): Run[] {
  const out: Run[] = [];
  let i = 0;
  while (i < total) {
    if (!selected.has(i)) {
      i += 1;
      continue;
    }
    let j = i;
    while (j + 1 < total && selected.has(j + 1)) j += 1;
    out.push({ start: i, len: j - i + 1 });
    i = j + 1;
  }
  return out;
}

function Tick({ on, after }: { on: boolean; after: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "duration-instant grid size-4 shrink-0 place-items-center rounded-sm border transition-colors",
        on ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border-strong",
      )}
    >
      {after ? (
        <motion.span
          className="flex"
          animate={{ scale: on ? 1 : 0.4, opacity: on ? 1 : 0 }}
          initial={false}
          transition={spring.bouncy}
        >
          <Check size={11} strokeWidth={3} />
        </motion.span>
      ) : (
        on && <Check size={11} strokeWidth={3} />
      )}
    </span>
  );
}

function MergePair({ after }: Side) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set([1, 2, 4]));

  const toggle = (i: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const runs = after ? runsOf(selected, PERMS.length) : [];

  return (
    <div className="bg-card relative w-64 rounded-xl border p-1">
      {after && (
        <AnimatePresence initial={false}>
          {runs.map((r) => (
            <motion.span
              key={`run-${r.start}`}
              aria-hidden
              className="bg-secondary pointer-events-none absolute inset-x-1 rounded-lg"
              initial={{ opacity: 0, top: PAD + r.start * ROW, height: r.len * ROW }}
              animate={{ opacity: 1, top: PAD + r.start * ROW, height: r.len * ROW }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring.smooth}
            />
          ))}
        </AnimatePresence>
      )}
      {PERMS.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => toggle(i)}
          aria-pressed={selected.has(i)}
          className={cn(
            "text-ui-sm relative flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left",
            !after && selected.has(i) && "bg-secondary",
          )}
        >
          <Tick on={selected.has(i)} after={after} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ================================================================== *
 * 3 — Segmented control  (tabs)
 * ================================================================== */

const TABS = ["Overview", "Activity", "Members", "Settings"] as const;

function TabsPair({ after }: Side) {
  const [tab, setTab] = useState<string>(TABS[0]);

  return (
    <div className="bg-secondary inline-flex rounded-xl p-1">
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          aria-pressed={tab === t}
          className={cn(
            "text-ui-sm relative h-9 rounded-lg px-3.5",
            tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab === t &&
            (after ? (
              <motion.span
                layoutId="ff-tab-pill"
                aria-hidden
                className="bg-card absolute inset-0 rounded-lg shadow-xs"
                transition={spring.snappy}
              />
            ) : (
              <span aria-hidden className="bg-card absolute inset-0 rounded-lg shadow-xs" />
            ))}
          <span className="relative">{t}</span>
        </button>
      ))}
    </div>
  );
}

/* ================================================================== *
 * 4 — The switch you can flick  (switch)
 * ================================================================== */

const TRAVEL = 16; // w-9 track, size-4 thumb, 2px inset each side

function FluidSwitch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const x = useMotionValue(on ? TRAVEL : 0);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const dragging = useRef(false);
  const origin = useRef<{ cx: number; x: number } | null>(null);

  const extra = pressed ? 4 : hovered ? 2 : 0;
  const target = on ? TRAVEL - extra : 0;

  useEffect(() => {
    if (dragging.current) return;
    animate(x, target, spring.snappy);
  }, [target, x]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        setPressed(true);
        dragging.current = false;
        origin.current = { cx: e.clientX, x: x.get() };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!origin.current) return;
        const d = e.clientX - origin.current.cx;
        if (!dragging.current) {
          if (Math.abs(d) < 3) return;
          dragging.current = true;
        }
        x.set(Math.max(0, Math.min(TRAVEL - 4, origin.current.x + d)));
      }}
      onPointerUp={() => {
        setPressed(false);
        const wasDrag = dragging.current;
        const at = x.get();
        origin.current = null;
        dragging.current = false;
        if (!wasDrag) {
          onChange(!on);
          return;
        }
        const next = at > (TRAVEL - 4) / 2;
        if (next === on) animate(x, next ? TRAVEL : 0, spring.snappy);
        else onChange(next);
      }}
      onPointerCancel={() => {
        setPressed(false);
        origin.current = null;
        dragging.current = false;
        animate(x, on ? TRAVEL : 0, spring.snappy);
      }}
      onClick={(e) => {
        if (e.detail === 0) onChange(!on); // keyboard-triggered click only
      }}
      className="flex h-9 touch-none items-center gap-3 rounded-lg pr-2 text-left"
    >
      <span
        className={cn(
          "duration-fast relative h-5 w-9 shrink-0 rounded-full transition-colors",
          on ? "bg-primary" : "bg-input",
        )}
      >
        <motion.span
          aria-hidden
          className="bg-background absolute top-0.5 left-0.5 rounded-full"
          style={{ x }}
          animate={{
            width: 16 + extra,
            height: pressed ? 12 : 16,
            y: pressed ? 2 : 0,
          }}
          initial={false}
          transition={spring.snappy}
        />
      </span>
      <span className="text-ui-sm">{label}</span>
    </button>
  );
}

function PlainSwitch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex h-9 items-center gap-3 rounded-lg pr-2 text-left"
    >
      <span
        className={cn(
          "duration-fast relative h-5 w-9 shrink-0 rounded-full transition-colors",
          on ? "bg-primary" : "bg-input",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "bg-background duration-fast absolute top-0.5 left-0.5 size-4 rounded-full transition-transform",
            on && "translate-x-4",
          )}
        />
      </span>
      <span className="text-ui-sm">{label}</span>
    </button>
  );
}

function SwitchPair({ after }: Side) {
  const [renew, setRenew] = useState(true);
  const [receipts, setReceipts] = useState(false);
  const Ctl = after ? FluidSwitch : PlainSwitch;

  return (
    <div className="flex flex-col items-start gap-1">
      <Ctl on={renew} onChange={setRenew} label="Renew automatically" />
      <Ctl on={receipts} onChange={setReceipts} label="Email me a receipt" />
    </div>
  );
}

/* ================================================================== *
 * 5 — Menus that stay on top  (surfaces, elevated, select)
 * ================================================================== */

const ENVS = ["Production", "Preview", "Development"] as const;

function SurfacePair({ after }: Side) {
  const [open, setOpen] = useState(true);
  const [env, setEnv] = useState<string>("Production");

  return (
    <div className="bg-secondary rounded-2xl border p-4">
      <div className="bg-card rounded-xl border p-4">
        <p className="text-ui">Deploy target</p>
        <p className="text-caption text-muted-foreground mt-1">
          Where a push to main ends up.
        </p>

        <div className="relative mt-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="text-ui-sm hover:bg-secondary duration-instant flex h-9 w-56 items-center justify-between rounded-lg border px-3 transition-colors"
          >
            {env}
            <ChevronDown size={16} strokeWidth={1.5} aria-hidden className="text-muted-foreground" />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                className={cn(
                  "absolute top-full left-0 z-10 mt-1.5 w-56 rounded-xl border p-1",
                  after ? "bg-popover shadow-floating" : "bg-card",
                )}
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                  transition: { duration: duration.fast, ease: ease.outQuad },
                }}
                transition={{ duration: duration.base, ease: ease.outQuart }}
                style={{ transformOrigin: "top left" }}
              >
                {ENVS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setEnv(e);
                      setOpen(false);
                    }}
                    className="text-ui-sm hover:bg-secondary duration-instant flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left transition-colors"
                  >
                    {e}
                    {env === e && (
                      <Check size={14} strokeWidth={2} aria-hidden className="text-muted-foreground" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <dl className="mt-4 space-y-2">
          {[
            ["Region", "fra1"],
            ["Build", "next build"],
            ["Node", "22.x"],
            ["Install", "npm ci"],
          ].map(([k, v]) => (
            <div key={k} className="text-caption flex justify-between">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ================================================================== *
 * 6 — A button that holds its size  (button, loading)
 * ================================================================== */

type SaveState = "idle" | "saving" | "saved";

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "Save changes",
  saving: "Saving",
  saved: "Saved",
};

function SavePair({ after }: Side) {
  const [state, setState] = useState<SaveState>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => {
      for (const id of t) clearTimeout(id);
    };
  }, []);

  const run = () => {
    if (state === "saving") return;
    setState("saving");
    timers.current.push(setTimeout(() => setState("saved"), 1300));
    timers.current.push(setTimeout(() => setState("idle"), 3200));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        aria-busy={state === "saving"}
        className="bg-primary text-primary-foreground text-ui-sm hover:bg-primary/90 duration-instant inline-flex h-9 items-center justify-center rounded-lg px-4 transition-colors"
      >
        {after ? (
          <span className="grid items-center">
            <span aria-hidden className="col-start-1 row-start-1 flex items-center gap-1.5 opacity-0">
              <span className="size-4" />
              Save changes
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={state}
                className="col-start-1 row-start-1 flex items-center justify-center gap-1.5"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5, transition: { duration: duration.instant } }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
              >
                {state === "saving" && (
                  <Loader2Icon size={16} aria-hidden className="animate-spin" />
                )}
                {state === "saved" && <Check size={16} strokeWidth={2} aria-hidden />}
                {SAVE_LABEL[state]}
              </motion.span>
            </AnimatePresence>
          </span>
        ) : (
          <span>{state === "saving" ? "Saving…" : SAVE_LABEL[state]}</span>
        )}
      </button>
      <p className="text-caption text-muted-foreground">Last edited 4 minutes ago</p>
    </div>
  );
}

/* ================================================================== *
 * 7 — Copy that says it copied  (input-copy)
 * ================================================================== */

const API_KEY = "sk_live_9f2c4a71e0b8";

function CopyPair({ after }: Side) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(API_KEY);
    } catch {
      /* clipboard blocked — the feedback is the point here, not the write */
    }
    if (!after) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex h-11 w-full max-w-sm items-center gap-2 rounded-xl border pr-1 pl-3">
      <span className="text-ui-sm text-muted-foreground flex-1 truncate font-mono">
        {API_KEY}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied API key" : "Copy API key"}
        className="hover:bg-secondary duration-instant grid size-9 shrink-0 place-items-center rounded-lg transition-colors"
      >
        {after ? (
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="done"
                className="col-start-1 row-start-1 flex"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={spring.bouncy}
              >
                <Check size={16} strokeWidth={2} aria-hidden />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                className="col-start-1 row-start-1 flex"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={spring.bouncy}
              >
                <Copy size={16} strokeWidth={1.5} aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        ) : (
          <Copy size={16} strokeWidth={1.5} aria-hidden />
        )}
      </button>
    </div>
  );
}

/* ================================================================== *
 * 8 — Something is happening  (thinking-indicator)
 * ================================================================== */

const CIRCLE_A =
  "M 12 8 C 14.21 8 16 9.79 16 12 C 16 14.21 14.21 16 12 16 C 9.79 16 8 14.21 8 12 C 8 9.79 9.79 8 12 8 Z";
const LOOP =
  "M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z";
const CIRCLE_B =
  "M 12 16 C 14.21 16 16 14.21 16 12 C 16 9.79 14.21 8 12 8 C 9.79 8 8 9.79 8 12 C 8 14.21 9.79 16 12 16 Z";

const WORDS = ["Thinking", "Reading the diff", "Planning", "Writing"] as const;

function FluidThinking() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion() ?? false;
  const longest = WORDS.reduce((a, b) => (a.length >= b.length ? a : b));

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), 1800);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div role="status" className="flex h-9 items-center gap-2">
      <span className="sr-only">Working…</span>
      <motion.svg
        aria-hidden
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground shrink-0"
      >
        {reduce ? (
          <path d={LOOP} />
        ) : (
          <motion.path
            animate={{ d: [CIRCLE_A, LOOP, CIRCLE_B, LOOP, CIRCLE_A] }}
            transition={{
              duration: 6,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          />
        )}
      </motion.svg>
      <span aria-hidden className="text-ui-sm text-muted-foreground inline-grid overflow-hidden">
        <span className="col-start-1 row-start-1 opacity-0">{longest}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={WORDS[i]}
            className="col-start-1 row-start-1"
            initial={{ y: "80%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-80%", opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
          >
            {WORDS[i]}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

function PlainThinking() {
  return (
    <div role="status" className="text-ui-sm text-muted-foreground flex h-9 items-center gap-2">
      <Loader2Icon size={16} aria-hidden className="animate-spin" />
      Loading…
    </div>
  );
}

function ThinkingPair({ after }: Side) {
  const [phase, setPhase] = useState<"idle" | "busy" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const ask = () => {
    if (phase === "busy") return;
    setPhase("busy");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase("done"), 5000);
  };

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="bg-secondary text-ui-sm ml-auto w-fit rounded-2xl px-3.5 py-2">
        Why did the build get slower?
      </div>
      <div className="min-h-9">
        {phase === "idle" && (
          <p className="text-caption text-muted-foreground flex h-9 items-center">
            Press Ask to send it.
          </p>
        )}
        {phase === "busy" && (after ? <FluidThinking /> : <PlainThinking />)}
        {phase === "done" && (
          <p className="text-ui-sm">
            The cache key changed on Tuesday, so every install runs cold.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => (phase === "done" ? setPhase("idle") : ask())}
        className="text-ui-sm hover:bg-secondary duration-instant inline-flex h-9 items-center rounded-lg border px-4 transition-colors"
      >
        {phase === "done" ? "Ask again" : "Ask"}
      </button>
    </div>
  );
}

/* ================================================================== *
 * 9 — Closing is not the opening in reverse  (springs, dialog)
 * ================================================================== */

function DialogPair({ after }: Side) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-secondary relative h-64 overflow-hidden rounded-2xl border">
      <div className="space-y-2 p-4">
        <div className="bg-card h-9 rounded-lg border" />
        <div className="bg-card h-9 rounded-lg border" />
        <div className="bg-card h-9 rounded-lg border" />
      </div>

      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground text-ui-sm hover:bg-primary/90 duration-instant inline-flex h-9 items-center rounded-lg px-4 transition-colors"
        >
          Invite people
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="bg-foreground/15 absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: after
                  ? { duration: duration.instant }
                  : { duration: duration.slower, ease: ease.spring },
              }}
              transition={{ duration: duration.fast }}
            />
            <motion.div
              className="bg-card shadow-floating absolute inset-x-6 top-14 rounded-2xl border p-4"
              initial={
                after ? { opacity: 0, scale: 0.96, y: 6 } : { opacity: 0, scale: 0.8, y: 28 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                after
                  ? {
                      opacity: 0,
                      scale: 0.98,
                      transition: { duration: duration.instant, ease: ease.outQuad },
                    }
                  : {
                      opacity: 0,
                      scale: 0.8,
                      y: 28,
                      transition: { duration: duration.slower, ease: ease.spring },
                    }
              }
              transition={
                after ? spring.smooth : { duration: duration.slower, ease: ease.spring }
              }
            >
              <p className="text-ui">Invite people</p>
              <p className="text-caption text-muted-foreground mt-1">
                They will get an email with a join link.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-ui-sm hover:bg-secondary duration-instant inline-flex h-9 items-center rounded-lg border px-3.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bg-primary text-primary-foreground text-ui-sm hover:bg-primary/90 duration-instant inline-flex h-9 items-center rounded-lg px-3.5 transition-colors"
                >
                  Send invites
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== *
 * 10 — Sections that open instead of appearing  (accordion)
 * ================================================================== */

const FAQ = [
  {
    q: "When am I charged?",
    a: "On the first of the month, for the month ahead. Changing plan mid-month is prorated to the day.",
  },
  {
    q: "Can I change plan later?",
    a: "Any time. An upgrade takes effect immediately; a downgrade waits until the current month is up.",
  },
  {
    q: "What counts as a seat?",
    a: "Anyone who signs in during the billing period. People you invited but who never signed in are free.",
  },
] as const;

function AccordionPair({ after }: Side) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="w-full max-w-md">
      <div className="bg-card overflow-hidden rounded-xl border">
        {FAQ.map((f, i) => (
          <div key={f.q} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => setOpen((o) => (o === i ? null : i))}
              aria-expanded={open === i}
              className="text-ui-sm hover:bg-secondary duration-instant flex h-11 w-full items-center justify-between gap-3 px-3.5 text-left transition-colors"
            >
              {f.q}
              {after ? (
                <motion.span
                  aria-hidden
                  className="text-muted-foreground flex shrink-0"
                  animate={{ rotate: open === i ? 180 : 0 }}
                  initial={false}
                  transition={spring.snappy}
                >
                  <ChevronDown size={16} strokeWidth={1.5} />
                </motion.span>
              ) : (
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden
                  className={cn("text-muted-foreground shrink-0", open === i && "rotate-180")}
                />
              )}
            </button>

            {after ? (
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="body"
                    className="overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: duration.base, ease: ease.outQuart }}
                  >
                    <p className="text-caption text-muted-foreground px-3.5 pb-3.5">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              open === i && (
                <p className="text-caption text-muted-foreground px-3.5 pb-3.5">{f.a}</p>
              )
            )}
          </div>
        ))}
      </div>
      <p className="text-caption text-muted-foreground mt-3">Still stuck? Email support.</p>
    </div>
  );
}

/* ================================================================== */

export function FluidFunctionalismDemo() {
  return (
    <div>
      <BeforeAfter
        principle="One highlight slides to where you are pointing, instead of blinking on and off."
        before={<ProximityPair after={false} />}
        after={<ProximityPair after />}
      />
      <BeforeAfter
        principle="Tick two rows next to each other and they join into one block."
        before={<MergePair after={false} />}
        after={<MergePair after />}
      />
      <BeforeAfter
        principle="TODO: plain-language principle." before={<TabsPair after={false} />} after={<TabsPair after />} />
      <BeforeAfter
        principle="You can flick it across with your thumb, not just click it."
        before={<SwitchPair after={false} />}
        after={<SwitchPair after />}
      />
      <BeforeAfter
        principle="The menu sits on top of the card instead of dissolving into it."
        before={<SurfacePair after={false} />}
        after={<SurfacePair after />}
      />
      <BeforeAfter
        principle="Nothing shuffles sideways while it saves."
        before={<SavePair after={false} />}
        after={<SavePair after />}
      />
      <BeforeAfter
        principle="You can tell it actually copied."
        before={<CopyPair after={false} />}
        after={<CopyPair after />}
      />
      <BeforeAfter
        principle="You can see it is getting somewhere, not just sitting there."
        before={<ThinkingPair after={false} />}
        after={<ThinkingPair after />}
      />
      <BeforeAfter
        principle="Closing it is over at once instead of drifting away."
        before={<DialogPair after={false} />}
        after={<DialogPair after />}
      />
      <BeforeAfter
        principle="TODO: plain-language principle." before={<AccordionPair after={false} />} after={<AccordionPair after />} />
    </div>
  );
}
