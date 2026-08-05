"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowUp,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  Copy,
  FileText,
  FolderInput,
  Globe,
  LayoutGrid,
  Rocket,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * mickadesign/fluid-functionalism — a shadcn registry of 23 components
 * plus four claims about why they feel different: motion as
 * information, hover as preview, spring physics, drop-in tokens.
 *
 * The registry itself cannot be installed here (its `button` and `card`
 * items overwrite this project's own ui files, and every item pulls in
 * legacy framer-motion). So each idea a person can actually SEE is
 * rebuilt from scratch on this project's tokens, and shown as a switch.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/** The grey page the mock interface sits on, so white can read as white. */
function Stage({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("bg-background rounded-xl p-4 sm:p-5", className)}>
      {children}
    </div>
  );
}

const ROW = 40; // nav / list row height, DESIGN.md → Layout
const PAD = 6; // p-1.5 on the surrounding panel

/* ── 1 · hover as preview ─────────────────────────────────────────── */

const NAV = [
  { icon: LayoutGrid, label: "Overview" },
  { icon: Rocket, label: "Deployments" },
  { icon: BarChart3, label: "Analytics" },
  { icon: FileText, label: "Logs" },
  { icon: Globe, label: "Domains" },
];

const FALLOFF = 78; // px of pointer reach either side of a row's centre

function NavPair({ after }: Side) {
  const [active, setActive] = useState(0);
  const [pointer, setPointer] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const hovered =
    pointer === null
      ? null
      : Math.min(
          NAV.length - 1,
          Math.max(0, Math.floor((pointer - PAD) / ROW)),
        );

  const near = (i: number) => {
    if (pointer === null) return 0;
    const d = Math.abs(pointer - (PAD + i * ROW + ROW / 2));
    return Math.max(0, 1 - d / FALLOFF);
  };

  return (
    <Stage>
      <div
        ref={ref}
        onPointerMove={(e) =>
          setPointer(
            e.clientY - (ref.current?.getBoundingClientRect().top ?? 0),
          )
        }
        onPointerLeave={() => setPointer(null)}
        className="bg-card relative w-full max-w-64 rounded-2xl border p-1.5"
      >
        {after && (
          <motion.span
            aria-hidden="true"
            className="bg-foreground/5 pointer-events-none absolute inset-x-1.5 h-10 rounded-lg"
            initial={false}
            animate={{
              top: PAD + (hovered ?? 0) * ROW,
              opacity: hovered === null || hovered === active ? 0 : 1,
            }}
            transition={spring.snappy}
          />
        )}

        {NAV.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "text-ui-sm relative flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left",
              i === active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
              !after && i !== active && "hover:bg-foreground/5",
            )}
          >
            <motion.span
              className="flex items-center gap-2.5"
              initial={false}
              animate={{
                opacity: after && i !== active ? 0.55 + 0.45 * near(i) : 1,
              }}
              transition={spring.snappy}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </motion.span>
          </button>
        ))}
      </div>
    </Stage>
  );
}

/* ── 2 · the segmented control ────────────────────────────────────── */

const TABS = [
  { id: "activity", label: "Activity", body: "3 deployments today" },
  { id: "usage", label: "Usage", body: "12.4 GB of 50 GB used" },
  { id: "members", label: "Members", body: "8 people, 2 invites pending" },
  { id: "billing", label: "Billing", body: "Next invoice on 1 September" },
];

function TabsPair({ after }: Side) {
  const [tab, setTab] = useState(TABS[0].id);
  const i = Math.max(
    0,
    TABS.findIndex((t) => t.id === tab),
  );

  return (
    <Stage>
      <div className="bg-card rounded-2xl border p-3">
        <div className="bg-foreground/5 relative flex rounded-lg p-1">
          <div aria-hidden="true" className="pointer-events-none absolute inset-1">
            <motion.span
              className="bg-card absolute inset-y-0 rounded-md shadow-xs"
              style={{ width: `${100 / TABS.length}%` }}
              initial={false}
              animate={{ left: `${(i * 100) / TABS.length}%` }}
              transition={after ? spring.snappy : { duration: 0 }}
            />
          </div>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={t.id === tab}
              className={cn(
                "text-ui-sm relative z-10 h-9 flex-1 rounded-md",
                t.id === tab ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex h-9 items-center px-1">
          {after ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={tab}
                className="text-ui-sm text-muted-foreground"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
              >
                {TABS[i].body}
              </motion.p>
            </AnimatePresence>
          ) : (
            <p className="text-ui-sm text-muted-foreground">{TABS[i].body}</p>
          )}
        </div>
      </div>
    </Stage>
  );
}

/* ── 3 · picks that sit together read as one ──────────────────────── */

const TEAMS = ["Design", "Engineering", "Marketing", "Sales", "Support"];

function runsOf(sel: number[]) {
  const sorted = [...sel].sort((a, b) => a - b);
  const out: { start: number; end: number }[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i === last.end + 1) last.end = i;
    else out.push({ start: i, end: i });
  }
  return out;
}

function CheckboxPair({ after }: Side) {
  const [selected, setSelected] = useState<number[]>([1, 2]);

  /* Stable ids so a run that grows keeps its block instead of swapping
   * one element for another — that is what makes merge and split read
   * as movement rather than a flicker. */
  const idMap = useRef(new Map<number, number>());
  const counter = useRef(0);
  const used = new Set<number>();
  const nextMap = new Map<number, number>();
  const blocks = runsOf(selected).map((run) => {
    let reused: number | null = null;
    for (let i = run.start; i <= run.end; i++) {
      const prev = idMap.current.get(i);
      if (prev !== undefined && !used.has(prev)) {
        reused = prev;
        break;
      }
    }
    counter.current += reused === null ? 1 : 0;
    const id = reused ?? counter.current;
    used.add(id);
    for (let i = run.start; i <= run.end; i++) nextMap.set(i, id);
    return { ...run, id };
  });
  idMap.current = nextMap;

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  return (
    <Stage>
      <div className="bg-card relative w-full max-w-72 rounded-2xl border p-1.5">
        {after && (
          <AnimatePresence initial={false}>
            {blocks.map((b) => (
              <motion.span
                key={b.id}
                aria-hidden="true"
                className="bg-foreground/5 pointer-events-none absolute inset-x-1.5 rounded-lg"
                initial={{
                  opacity: 0,
                  top: PAD + b.start * ROW,
                  height: (b.end - b.start + 1) * ROW,
                }}
                animate={{
                  opacity: 1,
                  top: PAD + b.start * ROW,
                  height: (b.end - b.start + 1) * ROW,
                }}
                exit={{ opacity: 0 }}
                transition={spring.smooth}
              />
            ))}
          </AnimatePresence>
        )}

        {TEAMS.map((team, i) => {
          const checked = selected.includes(i);
          return (
            <button
              key={team}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggle(i)}
              className={cn(
                "text-ui-sm relative flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left",
                !after && checked && "bg-foreground/5",
                checked ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                  checked && "bg-primary border-transparent",
                )}
              >
                {after ? (
                  <AnimatePresence initial={false}>
                    {checked && (
                      <motion.span
                        key="mark"
                        className="flex"
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.3, opacity: 0 }}
                        transition={spring.bouncy}
                      >
                        <Check
                          className="text-primary-foreground size-3"
                          strokeWidth={3}
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                ) : (
                  checked && (
                    <Check
                      className="text-primary-foreground size-3"
                      strokeWidth={3}
                    />
                  )
                )}
              </span>
              {team}
            </button>
          );
        })}
      </div>
    </Stage>
  );
}

/* ── 4 · sections that open ───────────────────────────────────────── */

const FAQ = [
  {
    q: "How do I add a custom domain?",
    a: "Open the project, go to Domains, and paste the hostname. We show you the two DNS records to add and check them every minute until they resolve.",
  },
  {
    q: "What happens when a build fails?",
    a: "The last good deployment keeps serving traffic. Nothing goes live until a build finishes green.",
  },
  {
    q: "Can I roll back?",
    a: "Any deployment from the last 30 days can be promoted back to production in one click.",
  },
];

function AccordionPair({ after }: Side) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Stage>
      <div className="bg-card rounded-2xl border px-4">
        {FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="border-t first:border-t-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="text-ui flex h-12 w-full items-center justify-between gap-3 text-left"
              >
                {item.q}
                <motion.span
                  aria-hidden="true"
                  className="text-muted-foreground flex"
                  initial={false}
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={after ? spring.snappy : { duration: 0 }}
                >
                  <ChevronDown className="size-4" />
                </motion.span>
              </button>

              {after ? (
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      className="overflow-hidden"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={spring.smooth}
                    >
                      <p className="text-ui-sm text-muted-foreground pb-4">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                isOpen && (
                  <p className="text-ui-sm text-muted-foreground pb-4">
                    {item.a}
                  </p>
                )
              )}
            </div>
          );
        })}
      </div>
    </Stage>
  );
}

/* ── 5 · a handle that settles ────────────────────────────────────── */

const STEP = 20;

function SliderPair({ after }: Side) {
  const [pct, setPct] = useState(40); // where the handle is drawn
  const [value, setValue] = useState(40); // the step it belongs to
  const [dragging, setDragging] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  const snap = (v: number) => Math.round(v / STEP) * STEP;

  const at = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r || r.width === 0) return 0;
    return Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
  };

  const move = (clientX: number) => {
    const raw = at(clientX);
    setValue(snap(raw));
    setPct(after ? raw : snap(raw));
  };

  const settle = (clientX: number) => {
    setDragging(false);
    const s = snap(at(clientX));
    setValue(s);
    setPct(s);
  };

  const nudge = (delta: number) => {
    const v = Math.min(100, Math.max(0, value + delta));
    setValue(v);
    setPct(v);
  };

  return (
    <Stage>
      <div className="bg-card rounded-2xl border p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-ui-sm text-muted-foreground">Image quality</span>
          <span className="text-ui tabular-nums">
            {after ? <NumberFlow value={value} /> : value}%
          </span>
        </div>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Image quality"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              nudge(STEP);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              nudge(-STEP);
            }
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            move(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging) move(e.clientX);
          }}
          onPointerUp={(e) => settle(e.clientX)}
          onPointerCancel={(e) => settle(e.clientX)}
          className="relative flex h-9 w-full touch-none items-center"
        >
          <div
            ref={track}
            className="bg-foreground/10 relative h-1.5 w-full rounded-full"
          >
            <motion.span
              aria-hidden="true"
              className="bg-foreground absolute inset-y-0 left-0 rounded-full"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={
                dragging || !after ? { duration: 0 } : spring.smooth
              }
            />
            {[0, 20, 40, 60, 80, 100].map((s) => (
              <span
                key={s}
                aria-hidden="true"
                style={{ left: `${s}%` }}
                className="bg-card absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
              />
            ))}
          </div>
          <motion.span
            aria-hidden="true"
            className="bg-card shadow-floating absolute top-1/2 -mt-2.5 -ml-2.5 block size-5 rounded-full border"
            initial={false}
            animate={{ left: `${pct}%` }}
            transition={dragging || !after ? { duration: 0 } : spring.smooth}
          />
        </div>
      </div>
    </Stage>
  );
}

/* ── 6 · a box that grows ─────────────────────────────────────────── */

const SEED =
  "Hi Dana — staging is green and I moved the release notes into the shared doc. Could you take a look before the 4pm call?";

function ComposerPair({ after }: Side) {
  const [text, setText] = useState(SEED);
  const [sent, setSent] = useState<string[]>([]);

  /* Runs on every render — the ref identity changes, so flipping the
   * switch re-measures. Without the reset, the height written by the
   * grown version would survive onto the fixed-height one. */
  const grow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    if (!after) {
      el.style.height = "";
      return;
    }
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  return (
    <Stage>
      <div className="bg-card w-full max-w-sm rounded-2xl border p-3">
        {sent.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {sent.slice(-2).map((m, i) => (
              <p
                key={`${m}-${i}`}
                className="text-ui-sm bg-foreground/5 ml-auto w-fit max-w-xs rounded-xl px-3 py-2"
              >
                {m}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <label htmlFor="ff-composer" className="sr-only">
            Message
          </label>
          <textarea
            id="ff-composer"
            ref={grow}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              grow(e.target);
            }}
            placeholder="Write a message"
            style={after ? { maxHeight: 132 } : undefined}
            className={cn(
              "text-ui-sm placeholder:text-muted-foreground w-full resize-none rounded-lg border px-3 py-2 outline-none",
              after ? "overflow-y-auto" : "h-9 overflow-y-auto",
            )}
          />
          <button
            type="button"
            aria-label="Send message"
            disabled={text.trim() === ""}
            onClick={() => {
              setSent((s) => [...s, text.trim()]);
              setText("");
            }}
            className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg disabled:opacity-40"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Stage>
  );
}

/* ── 7 · feedback for an action that leaves no trace ──────────────── */

const KEY = "sk_live_9f2ab41c7d0e4856";

function CopyPair({ after }: Side) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = () => {
    void navigator.clipboard?.writeText(KEY).catch(() => {});
    if (!after) return;
    if (timer.current) clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Stage>
      <div className="bg-card rounded-2xl border p-5">
        <label htmlFor="ff-key" className="text-ui-sm mb-2 block">
          Secret key
        </label>
        <div className="relative">
          <input
            id="ff-key"
            readOnly
            value={KEY}
            className={cn(
              "text-ui-sm h-9 w-full rounded-lg border bg-transparent pr-24 pl-3 font-mono outline-none",
              after && copied && "border-positive",
            )}
          />
          <div className="absolute inset-y-0 right-1 flex items-center gap-1">
            <AnimatePresence initial={false}>
              {after && copied && (
                <motion.span
                  key="said"
                  className="text-caption text-positive"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={spring.snappy}
                >
                  Copied
                </motion.span>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy secret key"
              className="hover:bg-foreground/5 flex size-7 items-center justify-center rounded-md"
            >
              {after && copied ? (
                <motion.span
                  key="check"
                  className="flex"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring.bouncy}
                >
                  <Check className="text-positive size-4" aria-hidden="true" />
                </motion.span>
              ) : (
                <Copy
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ── 8 · a button that admits it is working ───────────────────────── */

function SavePair({ after }: Side) {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [sends, setSends] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const save = () => {
    setSends((n) => n + 1);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setState("saving");
    timers.current.push(setTimeout(() => setState("saved"), 1400));
    timers.current.push(setTimeout(() => setState("idle"), 3000));
  };

  const busy = after && state === "saving";

  return (
    <Stage>
      <div className="bg-card rounded-2xl border p-5">
        <p className="text-ui">Deploy hooks</p>
        <p className="text-ui-sm text-muted-foreground mt-1">
          Rebuild the site whenever the content changes.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className={cn(
              "bg-primary text-primary-foreground text-ui-sm relative flex h-9 min-w-36 items-center justify-center rounded-lg px-4",
              busy && "opacity-70",
            )}
          >
            {after ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={state}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: duration.instant, ease: ease.outQuart }}
                >
                  {state === "saving" && (
                    <motion.span
                      aria-hidden="true"
                      className="border-primary-foreground/30 border-t-primary-foreground size-3.5 rounded-full border"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.7,
                        ease: "linear",
                        repeat: Infinity,
                      }}
                    />
                  )}
                  {state === "saved" && (
                    <Check className="size-3.5" aria-hidden="true" />
                  )}
                  {state === "saving"
                    ? "Saving"
                    : state === "saved"
                      ? "Saved"
                      : "Save changes"}
                </motion.span>
              </AnimatePresence>
            ) : (
              "Save changes"
            )}
          </button>

          <span className="text-caption text-muted-foreground tabular-nums">
            {sends === 0 ? "Nothing sent yet" : `${sends} sent`}
          </span>
        </div>

        {!after && state === "saved" && (
          <p className="text-caption text-positive mt-3">Saved.</p>
        )}
      </div>
    </Stage>
  );
}

/* ── 9 · labels that keep up with the cursor ──────────────────────── */

const TOOLS = [
  { icon: Star, label: "Add to favourites" },
  { icon: Share2, label: "Share" },
  { icon: Bell, label: "Notify me" },
  { icon: Trash2, label: "Delete" },
];

const TOOL_STEP = 40; // size-9 button + gap-1
const TOOL_CENTRE = 18;

function TooltipPair({ after }: Side) {
  const [shown, setShown] = useState<number | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef<number | null>(null);

  const clear = (t: typeof openTimer) => {
    if (t.current) clearTimeout(t.current);
    t.current = null;
  };

  const show = (i: number | null) => {
    shownRef.current = i;
    setShown(i);
  };

  const enter = (i: number) => {
    clear(closeTimer);
    if (after && shownRef.current !== null) {
      show(i);
      return;
    }
    clear(openTimer);
    openTimer.current = setTimeout(() => show(i), after ? 320 : 550);
  };

  const leave = () => {
    clear(openTimer);
    if (after) {
      closeTimer.current = setTimeout(() => show(null), 140);
    } else {
      show(null);
    }
  };

  return (
    <Stage>
      <div className="bg-card rounded-2xl border p-5">
        <div className="relative pt-8">
          <div className="pointer-events-none absolute top-0 left-0 h-8">
            <AnimatePresence>
              {shown !== null &&
                (after ? (
                  <motion.span
                    key="tip"
                    className="bg-foreground text-background text-caption absolute top-0 block w-max rounded-md px-2 py-1"
                    initial={{
                      opacity: 0,
                      scale: 0.96,
                      y: 4,
                      x: "-50%",
                      left: shown * TOOL_STEP + TOOL_CENTRE,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      x: "-50%",
                      left: shown * TOOL_STEP + TOOL_CENTRE,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.98,
                      transition: { duration: duration.instant },
                    }}
                    transition={spring.snappy}
                  >
                    {TOOLS[shown].label}
                  </motion.span>
                ) : (
                  <span
                    key={`tip-${shown}`}
                    style={{ left: shown * TOOL_STEP + TOOL_CENTRE }}
                    className="bg-foreground text-background text-caption absolute top-0 block w-max -translate-x-1/2 rounded-md px-2 py-1"
                  >
                    {TOOLS[shown].label}
                  </span>
                ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-1" onPointerLeave={leave}>
            {TOOLS.map((tool, i) => (
              <button
                key={tool.label}
                type="button"
                aria-label={tool.label}
                onPointerEnter={() => enter(i)}
                className="hover:bg-foreground/5 flex size-9 items-center justify-center rounded-lg"
              >
                <tool.icon
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ── 10 · waiting, with something to look at ──────────────────────── */

const WORK = [
  "Reading the changelog",
  "Comparing three releases",
  "Checking open issues",
  "Writing the summary",
];

function ThinkingPair({ after }: Side) {
  const [step, setStep] = useState(-1); // -1 idle, n = finished
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const run = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStep(0);
    if (after) {
      WORK.forEach((_, i) =>
        timers.current.push(
          setTimeout(() => setStep(i + 1), (i + 1) * 750),
        ),
      );
    } else {
      timers.current.push(setTimeout(() => setStep(WORK.length), 3000));
    }
  };

  const done = step >= WORK.length;

  return (
    <Stage>
      <div className="bg-card min-h-52 rounded-2xl border p-5">
        <button
          type="button"
          onClick={run}
          className="bg-primary text-primary-foreground text-ui-sm flex h-9 items-center rounded-lg px-4"
        >
          {step === -1 ? "Summarise the release" : "Run it again"}
        </button>

        <div className="mt-4">
          {step === -1 && (
            <p className="text-ui-sm text-muted-foreground">
              Nothing running.
            </p>
          )}

          {step >= 0 && !after && (
            <div className="space-y-2">
              {!done && (
                <p className="text-ui-sm text-muted-foreground">Working…</p>
              )}
              {done &&
                WORK.map((w) => (
                  <p key={w} className="text-ui-sm text-muted-foreground">
                    {w}
                  </p>
                ))}
              {done && (
                <p className="text-ui pt-1">
                  Three releases, one breaking change.
                </p>
              )}
            </div>
          )}

          {step >= 0 && after && (
            <div className="space-y-2">
              {WORK.slice(0, Math.min(step + 1, WORK.length)).map((w, i) => (
                <motion.div
                  key={w}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: i < step ? 0.5 : 1, y: 0 }}
                  transition={spring.smooth}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {i < step ? (
                      <Check
                        className="text-positive size-3.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <motion.span
                        aria-hidden="true"
                        className="border-muted-foreground/30 border-t-foreground size-3.5 rounded-full border"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.7,
                          ease: "linear",
                          repeat: Infinity,
                        }}
                      />
                    )}
                  </span>
                  <span className="text-ui-sm text-muted-foreground">{w}</span>
                </motion.div>
              ))}
              <AnimatePresence>
                {done && (
                  <motion.p
                    key="answer"
                    className="text-ui pt-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring.smooth}
                  >
                    Three releases, one breaking change.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Stage>
  );
}

/* ── 11 · what is on top of what ──────────────────────────────────── */

const MOVE_TO = ["Personal", "Acme Inc.", "Archive"];

function SurfacesPair({ after }: Side) {
  const [dialog, setDialog] = useState(true);
  const [menu, setMenu] = useState(true);

  return (
    <Stage className="relative overflow-hidden">
      <div className="bg-card rounded-2xl border p-3">
        <p className="text-ui px-2.5 pt-1 pb-3">Projects</p>
        {["landing-page", "docs-site", "internal-tools", "status"].map((p) => (
          <div
            key={p}
            className="text-ui-sm text-muted-foreground flex h-10 items-center px-2.5"
          >
            {p}
          </div>
        ))}
        <div className="px-2.5 pt-2 pb-1">
          <button
            type="button"
            onClick={() => setDialog(true)}
            className="text-ui-sm hover:bg-foreground/5 flex h-9 items-center rounded-lg border px-3"
          >
            Rename project
          </button>
        </div>
      </div>

      {dialog && after && (
        <button
          type="button"
          aria-label="Close dialog"
          onClick={() => {
            setDialog(false);
            setMenu(false);
          }}
          className="bg-background/70 absolute inset-0"
        />
      )}

      {dialog && (
        <div
          role="dialog"
          aria-label="Rename project"
          className={cn(
            "absolute inset-x-6 top-10 rounded-xl p-4 sm:inset-x-12",
            after ? "bg-card shadow-floating" : "bg-card border",
          )}
        >
          <p className="text-ui">Rename project</p>
          <input
            aria-label="Project name"
            defaultValue="landing-page"
            className="text-ui-sm mt-3 h-9 w-full rounded-lg border bg-transparent px-3 outline-none"
          />

          <div className="relative mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              className="text-ui-sm hover:bg-foreground/5 flex h-9 items-center gap-2 rounded-lg border px-3"
            >
              <FolderInput className="size-4" aria-hidden="true" />
              Move to…
            </button>
            <button
              type="button"
              onClick={() => {
                setDialog(false);
                setMenu(false);
              }}
              className="bg-primary text-primary-foreground text-ui-sm flex h-9 items-center rounded-lg px-4"
            >
              Save
            </button>

            {menu && (
              <div
                className={cn(
                  "absolute top-10 left-0 w-44 rounded-lg p-1",
                  after
                    ? "bg-popover shadow-floating dark:border"
                    : "bg-popover border",
                )}
              >
                {MOVE_TO.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMenu(false)}
                    className="text-ui-sm text-muted-foreground hover:bg-foreground/5 flex h-9 w-full items-center rounded-md px-2.5 text-left"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Stage>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function MickadesignFluidFunctionalismDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Run your cursor down the list — the highlight travels with you instead of blinking on and off."
        before={<NavPair after={false} />}
        after={<NavPair after />}
      />
      <BeforeAfter
        principle="You can see which tab you came from and which one you landed on."
        before={<TabsPair after={false} />}
        after={<TabsPair after />}
      />
      <BeforeAfter
        principle="Tick two rows next to each other and they join into one block."
        before={<CheckboxPair after={false} />}
        after={<CheckboxPair after />}
      />
      <BeforeAfter
        principle="Answers open and close instead of jumping."
        before={<AccordionPair after={false} />}
        after={<AccordionPair after />}
      />
      <BeforeAfter
        principle="Drag it — the handle stays under your finger, then settles onto the nearest step."
        before={<SliderPair after={false} />}
        after={<SliderPair after />}
      />
      <BeforeAfter
        principle="The box grows with your message instead of hiding it behind a scrollbar."
        before={<ComposerPair after={false} />}
        after={<ComposerPair after />}
      />
      <BeforeAfter
        principle="You can tell the key actually copied."
        before={<CopyPair after={false} />}
        after={<CopyPair after />}
      />
      <BeforeAfter
        principle="Press Save — the button says it is working, so you do not press it three more times."
        before={<SavePair after={false} />}
        after={<SavePair after />}
      />
      <BeforeAfter
        principle="Move across the icons — the label keeps up instead of making you wait each time."
        before={<TooltipPair after={false} />}
        after={<TooltipPair after />}
      />
      <BeforeAfter
        principle="You can see what it is doing while you wait."
        before={<ThinkingPair after={false} />}
        after={<ThinkingPair after />}
      />
      <BeforeAfter
        principle="You can tell the menu is on top of the dialog, and the dialog is on top of the page."
        before={<SurfacesPair after={false} />}
        after={<SurfacesPair after />}
      />
    </div>
  );
}
