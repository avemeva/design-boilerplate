"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Tool UI — https://www.tool-ui.com/
 *
 * A shadcn registry of 27 surfaces for rendering what a tool call
 * returns: approval-card, audio, chart, citation, code-block,
 * code-diff, data-table, geo-map, image, image-gallery,
 * instagram-post, item-carousel, link-preview, linkedin-post,
 * message-draft, option-list, order-summary, parameter-slider, plan,
 * preferences-panel, progress-tracker, question-flow, stats-display,
 * terminal, video, weather-widget, x-post.
 *
 * Read from the registry JSON rather than the docs: every item ships a
 * zod schema, and the schemas are where the thinking is — `choice`
 * written back onto the same payload, `minSelections`/`maxSelections`,
 * `exitCode`, `status: pending | in-progress | completed | failed`, a
 * `diff` beside every stat, `maxCollapsedLines`.
 *
 * Eleven of those are things a person can see the difference in. Each
 * switch below is the same assistant turn twice: once as the text a
 * chat would print, once as the surface.
 *
 * Left out: everything that needs a real remote asset to mean anything
 * — image, image-gallery, audio, video, geo-map, link-preview,
 * weather-widget — and the three social embeds (x-post, linkedin-post,
 * instagram-post), which are the link preview wearing someone else's
 * branding. Also chart, code-block, code-diff, item-carousel, plan and
 * preferences-panel, each of which repeats a point one of the eleven
 * already makes better.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const CONTROL =
  "text-ui-sm inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 transition-colors disabled:pointer-events-none disabled:opacity-50";
const SOLID = `${CONTROL} bg-foreground text-background hover:opacity-90`;
const QUIET = `${CONTROL} bg-card text-foreground border hover:bg-muted`;
const GHOST = `${CONTROL} text-muted-foreground hover:text-foreground`;
const DANGER = `${CONTROL} bg-destructive/10 text-destructive hover:bg-destructive/20`;
const FIELD =
  "text-ui-sm bg-card h-9 w-full min-w-0 rounded-lg border px-3 outline-none placeholder:text-muted-foreground";

/* ── the chat both sides live inside ──────────────────────────────── */

function Thread({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

function Ai({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        className="bg-secondary text-micro text-muted-foreground grid size-7 shrink-0 place-items-center rounded-full border uppercase"
        aria-hidden
      >
        ai
      </span>
      <div className="min-w-0 flex-1 space-y-2.5">{children}</div>
    </div>
  );
}

function You({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="bg-secondary text-ui-sm max-w-[85%] rounded-xl rounded-br-sm border px-3 py-2">
        {children}
      </p>
    </div>
  );
}

/** What a chat prints when it has nowhere better to put the answer. */
function Said({ children }: { children: ReactNode }) {
  return (
    <p className="text-ui max-w-prose-comfortable text-pretty">{children}</p>
  );
}

/** A tool surface: one step toward the canvas, hairline, no shadow. */
function ToolCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("bg-secondary rounded-xl border", className)}>
      {children}
    </div>
  );
}

/** The typing you have to do when there is nothing to press. */
function Reply({
  placeholder,
  onSend,
  disabled,
}: {
  placeholder: string;
  onSend: (value: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const id = useId();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (!v) return;
        onSend(v);
        setValue("");
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Your reply
      </label>
      <input
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        className={FIELD}
      />
      <button type="submit" className={SOLID} disabled={disabled}>
        Send
      </button>
    </form>
  );
}

function StartOver({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={GHOST} onClick={onClick}>
      <RotateCcw className="size-4" aria-hidden />
      Start over
    </button>
  );
}

/** The terminal, non-interactive record a decision collapses into. */
function Receipt({
  ok = true,
  title,
  detail,
}: {
  ok?: boolean;
  title: string;
  detail?: ReactNode;
}) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: ease.outQuart }}
    >
      <ToolCard className="flex items-center gap-3 p-3">
        <span className="bg-card grid size-8 shrink-0 place-items-center rounded-full border">
          {ok ? (
            <Check className="text-positive size-4" aria-hidden />
          ) : (
            <X className="text-muted-foreground size-4" aria-hidden />
          )}
        </span>
        <span className="text-ui-sm min-w-0">{title}</span>
        {detail && (
          <span className="text-caption text-muted-foreground ml-auto hidden shrink-0 truncate sm:block">
            {detail}
          </span>
        )}
      </ToolCard>
    </motion.div>
  );
}

const surfaceIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: duration.base, ease: ease.outQuart },
};

/* ── 1 · approval-card: agreeing to something destructive ─────────── */

const APPROVAL_META: [string, string][] = [
  ["Project", "quiet-instrument"],
  ["Deployments", "3"],
  ["Can be undone", "No"],
];

function ApprovalPair({ after }: Side) {
  const [choice, setChoice] = useState<"approved" | "denied" | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);

  const reset = () => {
    setChoice(null);
    setSaid(null);
    setMissed(false);
  };

  const reply = (v: string) => {
    setSaid(v);
    const t = v.toLowerCase();
    if (/^(y|yes|yep|yeah|do it|go ahead|confirm|delete)/.test(t)) {
      setChoice("approved");
      setMissed(false);
    } else if (/^(n|no|nope|stop|cancel|keep)/.test(t)) {
      setChoice("denied");
      setMissed(false);
    } else {
      setMissed(true);
    }
  };

  if (!after) {
    return (
      <Thread>
        <Ai>
          <Said>
            I can delete the 3 preview deployments whose branches were merged
            more than 30 days ago from quiet-instrument — pr-812-checkout,
            pr-799-billing-copy and pr-786-avatar-cache. This cannot be undone.
            Reply “yes” to go ahead, or “no” to leave them alone.
          </Said>
        </Ai>
        {said && <You>{said}</You>}
        {missed && (
          <Ai>
            <Said>Sorry — I did not catch that. Reply “yes” or “no”.</Said>
          </Ai>
        )}
        {choice && (
          <Ai>
            <Said>
              {choice === "approved"
                ? "Done. The 3 preview deployments have been deleted."
                : "Fine — I have left all 3 in place."}
            </Said>
          </Ai>
        )}
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Reply placeholder="yes / no" onSend={reply} disabled={!!choice} />
          </div>
          {(choice || missed) && <StartOver onClick={reset} />}
        </div>
      </Thread>
    );
  }

  return (
    <Thread>
      <Ai>
        <AnimatePresence mode="wait" initial={false}>
          {choice ? (
            <div key="receipt" className="space-y-2.5">
              <Receipt
                ok={choice === "approved"}
                title={
                  choice === "approved"
                    ? "Deleted 3 preview deployments"
                    : "Kept — nothing was deleted"
                }
                detail={<span data-numeric>14:02</span>}
              />
              <StartOver onClick={reset} />
            </div>
          ) : (
            <motion.div key="card" {...surfaceIn}>
              <ToolCard className="space-y-3.5 p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-card text-destructive grid size-9 shrink-0 place-items-center rounded-lg border">
                    <Trash2 className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-ui-sm">Delete 3 preview deployments</h4>
                    <p className="text-caption text-muted-foreground">
                      Branches merged more than 30 days ago.
                    </p>
                  </div>
                </div>
                <dl className="border-y">
                  {APPROVAL_META.map(([k, v], i) => (
                    <div
                      key={k}
                      className={cn(
                        "text-caption flex items-baseline justify-between gap-4 py-2",
                        i > 0 && "border-t",
                      )}
                    >
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="truncate font-mono">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className={QUIET}
                    onClick={() => setChoice("denied")}
                  >
                    Keep them
                  </button>
                  <button
                    type="button"
                    className={DANGER}
                    onClick={() => setChoice("approved")}
                  >
                    Delete 3
                  </button>
                </div>
              </ToolCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Ai>
    </Thread>
  );
}

/* ── 2 · option-list: choosing from a list ────────────────────────── */

const RELEASE_ITEMS = [
  { id: "a", label: "Faster first paint on the board", note: "12% quicker" },
  { id: "b", label: "Keyboard shortcuts for filters", note: "New" },
  { id: "c", label: "Fixed avatar cache invalidation", note: "Bug fix" },
  {
    id: "d",
    label: "New billing export",
    note: "Behind a flag",
    off: true,
  },
  { id: "e", label: "Dark mode contrast pass", note: "Bug fix" },
];
const MAX_PICKS = 3;

function OptionsPair({ after }: Side) {
  const [picked, setPicked] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [said, setSaid] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const reset = () => {
    setPicked([]);
    setDone(false);
    setSaid(null);
    setProblem(null);
  };

  const toggle = (id: string) =>
    setPicked((p) =>
      p.includes(id)
        ? p.filter((x) => x !== id)
        : p.length >= MAX_PICKS
          ? p
          : [...p, id],
    );

  const reply = (v: string) => {
    setSaid(v);
    const nums = v.match(/\d+/g)?.map(Number) ?? [];
    if (nums.length === 0) {
      setProblem("I need the numbers, like “1, 3”.");
      return;
    }
    const bad = nums.find((n) => n < 1 || n > RELEASE_ITEMS.length);
    if (bad !== undefined) {
      setProblem(`There is no item ${bad}. Pick between 1 and 5.`);
      return;
    }
    if (nums.some((n) => RELEASE_ITEMS[n - 1].off)) {
      setProblem("Item 4 is still behind a flag, so it cannot go in.");
      return;
    }
    if (nums.length > MAX_PICKS) {
      setProblem("That is more than three. Drop one and send it again.");
      return;
    }
    setProblem(null);
    setPicked(nums.map((n) => RELEASE_ITEMS[n - 1].id));
    setDone(true);
  };

  const chosen = RELEASE_ITEMS.filter((o) => picked.includes(o.id));

  if (!after) {
    return (
      <Thread>
        <Ai>
          <Said>
            Which of these should go in the release notes? Choose up to three
            and reply with the numbers.
          </Said>
          <div className="text-ui max-w-prose-comfortable space-y-0.5">
            {RELEASE_ITEMS.map((o, i) => (
              <p key={o.id}>
                {i + 1}. {o.label} ({o.note})
              </p>
            ))}
          </div>
        </Ai>
        {said && <You>{said}</You>}
        {problem && (
          <Ai>
            <Said>{problem}</Said>
          </Ai>
        )}
        {done && (
          <Ai>
            <Said>
              Added {chosen.length}: {chosen.map((o) => o.label).join(", ")}.
            </Said>
          </Ai>
        )}
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Reply placeholder="e.g. 1, 3" onSend={reply} disabled={done} />
          </div>
          {(done || problem) && <StartOver onClick={reset} />}
        </div>
      </Thread>
    );
  }

  return (
    <Thread>
      <Ai>
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <div key="receipt" className="space-y-2.5">
              <Receipt
                title={`Added ${chosen.length} to the release notes`}
                detail={chosen.map((o) => o.label.split(" ")[0]).join(" · ")}
              />
              <StartOver onClick={reset} />
            </div>
          ) : (
            <motion.div key="card" {...surfaceIn}>
              <ToolCard className="p-2">
                <p className="text-caption text-muted-foreground px-2 pt-1.5 pb-2.5">
                  Which of these should go in the release notes?
                </p>
                <div className="space-y-1">
                  {RELEASE_ITEMS.map((o) => {
                    const on = picked.includes(o.id);
                    const full = !on && picked.length >= MAX_PICKS;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        disabled={o.off || full}
                        aria-pressed={on}
                        onClick={() => toggle(o.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                          on
                            ? "bg-card border-foreground/20"
                            : "hover:bg-card border-transparent",
                          (o.off || full) && "opacity-40",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded-sm border",
                            on ? "bg-foreground border-foreground" : "bg-card",
                          )}
                          aria-hidden
                        >
                          {on && <Check className="text-background size-3" />}
                        </span>
                        <span className="text-ui-sm min-w-0 flex-1 truncate">
                          {o.label}
                        </span>
                        <span className="text-micro text-muted-foreground shrink-0 uppercase">
                          {o.note}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex items-center gap-3 border-t px-1 pt-2.5">
                  <span className="text-caption text-muted-foreground tabular-nums">
                    {picked.length} of {MAX_PICKS} chosen
                  </span>
                  <button
                    type="button"
                    className={`${SOLID} ml-auto`}
                    disabled={picked.length === 0}
                    onClick={() => setDone(true)}
                  >
                    Add to notes
                  </button>
                </div>
              </ToolCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Ai>
    </Thread>
  );
}

/* ── 3 · parameter-slider: setting an amount ──────────────────────── */

function estimateKb(quality: number, width: number) {
  return Math.round((width / 100) ** 2 * (quality / 100) * 3.4);
}

function Track({
  label,
  min,
  max,
  step,
  unit,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  const fromX = (clientX: number) => {
    const el = rail.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const raw = min + t * (max - min);
    onChange(Math.min(max, Math.max(min, Math.round(raw / step) * step)));
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ui-sm">{label}</span>
        <span className="text-ui-sm tabular-nums">
          <NumberFlow value={value} />
          {unit}
        </span>
      </div>
      <div
        ref={rail}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}${unit}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          fromX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging) fromX(e.clientX);
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setDragging(false);
        }}
        onKeyDown={(e) => {
          const d =
            e.key === "ArrowRight" || e.key === "ArrowUp"
              ? step
              : e.key === "ArrowLeft" || e.key === "ArrowDown"
                ? -step
                : 0;
          if (!d) return;
          e.preventDefault();
          onChange(Math.min(max, Math.max(min, value + d)));
        }}
        className="relative flex h-9 cursor-grab touch-none items-center rounded-lg active:cursor-grabbing"
      >
        <div className="bg-card h-1.5 w-full rounded-full border" aria-hidden />
        <div
          className="bg-foreground absolute h-1.5 rounded-full"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
        <span
          className="bg-card absolute size-4 rounded-full border shadow-xs"
          style={{ left: `calc(${pct}% - 0.5rem)` }}
          aria-hidden
        />
      </div>
      <div className="text-micro text-muted-foreground flex justify-between tabular-nums">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

function SliderPair({ after }: Side) {
  const [quality, setQuality] = useState(72);
  const [width, setWidth] = useState(1200);
  const [typedQ, setTypedQ] = useState("72");
  const [typedW, setTypedW] = useState("1200");
  const [applied, setApplied] = useState<{ q: number; w: number } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const qId = useId();
  const wId = useId();

  if (!after) {
    const apply = () => {
      const q = Number(typedQ);
      const w = Number(typedW);
      if (!Number.isFinite(q) || q < 40 || q > 95) {
        setProblem("Quality has to be between 40 and 95. Try again.");
        setApplied(null);
        return;
      }
      if (!Number.isFinite(w) || w < 480 || w > 2400) {
        setProblem("Max width has to be between 480 and 2400. Try again.");
        setApplied(null);
        return;
      }
      setProblem(null);
      setApplied({ q, w });
    };
    return (
      <Thread>
        <Ai>
          <Said>
            I can re-compress the 240 photos in the gallery. Give me a quality
            between 40 and 95, and a maximum width in pixels between 480 and
            2400.
          </Said>
        </Ai>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-24 flex-1">
            <label htmlFor={qId} className="text-caption text-muted-foreground">
              Quality
            </label>
            <input
              id={qId}
              inputMode="numeric"
              value={typedQ}
              onChange={(e) => setTypedQ(e.target.value)}
              className={`${FIELD} mt-1 tabular-nums`}
            />
          </div>
          <div className="min-w-24 flex-1">
            <label htmlFor={wId} className="text-caption text-muted-foreground">
              Max width
            </label>
            <input
              id={wId}
              inputMode="numeric"
              value={typedW}
              onChange={(e) => setTypedW(e.target.value)}
              className={`${FIELD} mt-1 tabular-nums`}
            />
          </div>
          <button type="button" className={SOLID} onClick={apply}>
            Send
          </button>
        </div>
        {problem && (
          <Ai>
            <Said>{problem}</Said>
          </Ai>
        )}
        {applied && (
          <Ai>
            <Said>
              Done — 240 photos re-compressed at quality {applied.q}, max width{" "}
              {applied.w}px. They came out around{" "}
              {estimateKb(applied.q, applied.w)} KB each.
            </Said>
          </Ai>
        )}
      </Thread>
    );
  }

  return (
    <Thread>
      <Ai>
        <motion.div {...surfaceIn}>
          <ToolCard className="space-y-3 p-4">
            <p className="text-caption text-muted-foreground">
              Re-compress 240 photos
            </p>
            <Track
              label="Quality"
              min={40}
              max={95}
              step={1}
              unit=""
              value={quality}
              onChange={setQuality}
            />
            <Track
              label="Max width"
              min={480}
              max={2400}
              step={20}
              unit="px"
              value={width}
              onChange={setWidth}
            />
            <div className="flex items-center gap-3 border-t pt-3">
              <span className="text-caption text-muted-foreground">
                About{" "}
                <span className="text-foreground tabular-nums">
                  <NumberFlow value={estimateKb(quality, width)} /> KB
                </span>{" "}
                per photo
              </span>
              <button type="button" className={`${SOLID} ml-auto`}>
                Re-compress
              </button>
            </div>
          </ToolCard>
        </motion.div>
      </Ai>
    </Thread>
  );
}

/* ── 4 · progress-tracker: watching something long run ────────────── */

const RUN_STEPS = [
  { id: "s1", label: "Reading the changelog", note: "12 commits since 2.3.4" },
  { id: "s2", label: "Building the release", note: "next build" },
  { id: "s3", label: "Running the test suite", note: "184 tests" },
  { id: "s4", label: "Publishing to the registry", note: "npm publish" },
];
const ENDS = [8, 16, 27];
const FINISH = 27;

type StepState = "pending" | "running" | "done" | "failed" | "skipped";

function stepState(i: number, tick: number): StepState {
  if (tick === 0) return "pending";
  if (i === 0) return tick >= ENDS[0] ? "done" : "running";
  if (i === 1)
    return tick >= ENDS[1] ? "done" : tick >= ENDS[0] ? "running" : "pending";
  if (i === 2)
    return tick >= ENDS[2] ? "failed" : tick >= ENDS[1] ? "running" : "pending";
  return tick >= FINISH ? "skipped" : "pending";
}

/** One 100ms interval drives both sides. Started by a press, never by
 *  an effect; the effect only clears it on unmount. */
function useRun() {
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const start = () => {
    if (timer.current) clearInterval(timer.current);
    let t = 0;
    setTick(0);
    timer.current = setInterval(() => {
      t += 1;
      setTick(t);
      if (t >= FINISH && timer.current) clearInterval(timer.current);
    }, 100);
  };

  return { tick, start };
}

function ProgressPair({ after }: Side) {
  const { tick, start } = useRun();
  const running = tick > 0 && tick < FINISH;
  const finished = tick >= FINISH;

  if (!after) {
    return (
      <Thread>
        {tick === 0 && (
          <Ai>
            <Said>Ready when you are — I will publish 2.4.0.</Said>
          </Ai>
        )}
        {tick > 0 && (
          <Ai>
            <Said>Working on it…</Said>
          </Ai>
        )}
        {tick >= 10 && (
          <Ai>
            <Said>Still working…</Said>
          </Ai>
        )}
        {tick >= 20 && (
          <Ai>
            <Said>Still working…</Said>
          </Ai>
        )}
        {finished && (
          <Ai>
            <Said>Something went wrong. I could not finish.</Said>
          </Ai>
        )}
        <button
          type="button"
          className={SOLID}
          onClick={start}
          disabled={running}
        >
          {running && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {tick === 0 ? "Publish 2.4.0" : "Run again"}
        </button>
      </Thread>
    );
  }

  const doneCount = RUN_STEPS.filter(
    (_, i) => stepState(i, tick) === "done",
  ).length;

  return (
    <Thread>
      <Ai>
        <motion.div {...surfaceIn}>
          <ToolCard className="p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="text-ui-sm">Publishing 2.4.0</p>
              <span className="text-caption text-muted-foreground tabular-nums">
                {(tick / 10).toFixed(1)}s
              </span>
            </div>
            <div className="bg-card mb-3.5 h-1 overflow-hidden rounded-full border">
              <div
                className="bg-foreground duration-fast ease-out-quart h-full transition-[width]"
                style={{ width: `${(doneCount / RUN_STEPS.length) * 100}%` }}
                aria-hidden
              />
            </div>
            <ol className="space-y-2.5">
              {RUN_STEPS.map((s, i) => {
                const st = stepState(i, tick);
                return (
                  <li key={s.id} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center">
                      {st === "done" && (
                        <Check className="text-positive size-4" aria-hidden />
                      )}
                      {st === "running" && (
                        <Loader2
                          className="text-accent-solid size-4 animate-spin"
                          aria-hidden
                        />
                      )}
                      {st === "failed" && (
                        <X className="text-destructive size-4" aria-hidden />
                      )}
                      {(st === "pending" || st === "skipped") && (
                        <span
                          className="bg-card size-2.5 rounded-full border"
                          aria-hidden
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "text-ui-sm block",
                          (st === "pending" || st === "skipped") &&
                            "text-muted-foreground",
                        )}
                      >
                        {s.label}
                      </span>
                      <span className="text-caption text-muted-foreground block">
                        {st === "failed"
                          ? "3 tests failed in board/filters.test.ts"
                          : st === "skipped"
                            ? "Not reached"
                            : s.note}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-3.5 flex items-center gap-3 border-t pt-3">
              <span className="text-caption text-muted-foreground">
                {finished
                  ? `Stopped after ${doneCount} of ${RUN_STEPS.length} steps`
                  : running
                    ? `${doneCount} of ${RUN_STEPS.length} done`
                    : "Not started"}
              </span>
              <button
                type="button"
                className={`${SOLID} ml-auto`}
                onClick={start}
                disabled={running}
              >
                {tick === 0 ? "Publish 2.4.0" : "Run again"}
              </button>
            </div>
          </ToolCard>
        </motion.div>
      </Ai>
    </Thread>
  );
}

/* ── 5 · data-table: rows of numbers ──────────────────────────────── */

type PageRow = {
  path: string;
  visitors: number;
  conversion: number;
  change: number;
};

const PAGES: PageRow[] = [
  { path: "/pricing", visitors: 12430, conversion: 4.1, change: 12.4 },
  { path: "/", visitors: 38210, conversion: 1.2, change: -3.1 },
  { path: "/docs/quickstart", visitors: 9120, conversion: 6.8, change: 41.2 },
  { path: "/changelog", visitors: 4380, conversion: 0.9, change: -18.6 },
  { path: "/blog/tool-calls", visitors: 7640, conversion: 2.2, change: 5 },
  { path: "/signup", visitors: 5210, conversion: 22.4, change: 0.8 },
];

type SortKey = keyof PageRow;

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "path", label: "Page", numeric: false },
  { key: "visitors", label: "Visitors", numeric: true },
  { key: "conversion", label: "Conv.", numeric: true },
  { key: "change", label: "Change", numeric: true },
];

function TablePair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "visitors",
    dir: "desc",
  });

  if (!after) {
    const lines = JSON.stringify(PAGES, null, 2).split("\n");
    const shown = open ? lines : lines.slice(0, 9);
    return (
      <Thread>
        <Ai>
          <Said>Here are the top 6 pages for the last 30 days.</Said>
          <pre className="bg-secondary text-muted-foreground text-caption max-w-full overflow-x-auto rounded-lg border p-3 font-mono">
            {shown.join("\n")}
            {!open && "\n  …"}
          </pre>
          <button
            type="button"
            className={QUIET}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? (
              <ChevronUp className="size-4" aria-hidden />
            ) : (
              <ChevronDown className="size-4" aria-hidden />
            )}
            {open ? "Collapse" : `Show all ${lines.length} lines`}
          </button>
        </Ai>
      </Thread>
    );
  }

  const rows = [...PAGES].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const c =
      typeof av === "string"
        ? av.localeCompare(bv as string)
        : av - (bv as number);
    return sort.dir === "asc" ? c : -c;
  });

  return (
    <Thread>
      <Ai>
        <motion.div {...surfaceIn}>
          <ToolCard className="overflow-hidden">
            <p className="text-caption text-muted-foreground border-b px-3 py-2.5">
              Top pages · last 30 days
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {COLUMNS.map((c) => {
                      const on = sort.key === c.key;
                      return (
                        <th
                          key={c.key}
                          scope="col"
                          aria-sort={
                            on
                              ? sort.dir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          className="border-b px-1 font-normal first:pl-3 last:pr-3"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSort((s) =>
                                s.key === c.key
                                  ? {
                                      key: c.key,
                                      dir: s.dir === "asc" ? "desc" : "asc",
                                    }
                                  : { key: c.key, dir: "desc" },
                              )
                            }
                            className={cn(
                              "text-micro flex h-9 w-full items-center gap-1 uppercase transition-colors",
                              c.numeric && "justify-end",
                              on
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {c.label}
                            {on &&
                              (sort.dir === "asc" ? (
                                <ArrowUp className="size-3" aria-hidden />
                              ) : (
                                <ArrowDown className="size-3" aria-hidden />
                              ))}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.path}
                      className="hover:bg-card transition-colors [&:not(:last-child)]:border-b"
                    >
                      <td className="text-ui-sm py-2 pr-2 pl-3 font-mono">
                        {r.path}
                      </td>
                      <td className="text-ui-sm px-2 py-2 text-right tabular-nums">
                        {r.visitors.toLocaleString("en-US")}
                      </td>
                      <td className="text-ui-sm px-2 py-2 text-right tabular-nums">
                        {r.conversion.toFixed(1)}%
                      </td>
                      <td
                        className={cn(
                          "text-ui-sm py-2 pr-3 pl-2 text-right tabular-nums",
                          r.change > 0 ? "text-positive" : "text-destructive",
                        )}
                      >
                        {r.change > 0 ? "+" : ""}
                        {r.change.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ToolCard>
        </motion.div>
      </Ai>
    </Thread>
  );
}

/* ── 6 · stats-display: a number next to what it was ──────────────── */

const PERIODS = ["7 days", "30 days", "90 days"] as const;
type Period = (typeof PERIODS)[number];
type Metric = { value: number; prev: number; spark: number[] };

const STATS: Record<Period, Record<"revenue" | "orders" | "rate", Metric>> = {
  "7 days": {
    revenue: { value: 11840, prev: 12610, spark: [14, 16, 13, 18, 15, 19, 17] },
    orders: { value: 312, prev: 340, spark: [38, 44, 41, 50, 46, 52, 41] },
    rate: { value: 3.6, prev: 3.8, spark: [3.9, 3.5, 3.7, 3.4, 3.6, 3.8, 3.6] },
  },
  "30 days": {
    revenue: {
      value: 48210,
      prev: 42900,
      spark: [11, 13, 12, 15, 14, 17, 16, 19],
    },
    orders: {
      value: 1284,
      prev: 1190,
      spark: [140, 152, 149, 168, 171, 190, 205, 209],
    },
    rate: { value: 3.2, prev: 3, spark: [2.8, 2.9, 3.1, 3, 3.2, 3.3, 3.2, 3.4] },
  },
  "90 days": {
    revenue: {
      value: 131500,
      prev: 148200,
      spark: [21, 19, 18, 16, 17, 15, 14, 13, 12],
    },
    orders: {
      value: 3610,
      prev: 3980,
      spark: [470, 440, 420, 405, 398, 384, 371, 362, 360],
    },
    rate: {
      value: 2.9,
      prev: 3.4,
      spark: [3.5, 3.4, 3.3, 3.1, 3, 3, 2.9, 2.9, 2.8],
    },
  },
};

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 60 + 2;
      const y = 18 - ((v - min) / span) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 64 20"
      className="text-muted-foreground h-5 w-16 shrink-0"
      fill="none"
      aria-hidden
    >
      <polyline
        points={points}
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Segmented({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="bg-secondary inline-flex rounded-lg border p-0.5">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={value === p}
          onClick={() => onChange(p)}
          className={cn(
            "text-ui-sm h-9 rounded-md px-3 transition-colors",
            value === p
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function StatsPair({ after }: Side) {
  const [period, setPeriod] = useState<Period>("30 days");
  const s = STATS[period];

  if (!after) {
    return (
      <Thread>
        <Ai>
          <Said>
            Over the last {period} you took {money(s.revenue.value)} across{" "}
            {s.orders.value.toLocaleString("en-US")} orders, at a{" "}
            {s.rate.value.toFixed(1)}% conversion rate. In the {period} before
            that it was {money(s.revenue.prev)},{" "}
            {s.orders.prev.toLocaleString("en-US")} orders and{" "}
            {s.rate.prev.toFixed(1)}%.
          </Said>
        </Ai>
        <Segmented value={period} onChange={setPeriod} />
      </Thread>
    );
  }

  const tiles = [
    { key: "revenue" as const, label: "Revenue", text: money(s.revenue.value) },
    {
      key: "orders" as const,
      label: "Orders",
      text: s.orders.value.toLocaleString("en-US"),
    },
    {
      key: "rate" as const,
      label: "Conversion",
      text: `${s.rate.value.toFixed(1)}%`,
    },
  ];

  return (
    <Thread>
      <Ai>
        <motion.div {...surfaceIn} className="space-y-2.5">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {tiles.map((t) => {
              const m = s[t.key];
              const d = ((m.value - m.prev) / m.prev) * 100;
              const up = d >= 0;
              return (
                <ToolCard key={t.key} className="p-3">
                  <p className="text-micro text-muted-foreground uppercase">
                    {t.label}
                  </p>
                  <p className="text-title mt-1 tabular-nums">{t.text}</p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span
                      className={cn(
                        "text-caption inline-flex items-center gap-0.5 tabular-nums",
                        up ? "text-positive" : "text-destructive",
                      )}
                    >
                      {up ? (
                        <ArrowUp className="size-3" aria-hidden />
                      ) : (
                        <ArrowDown className="size-3" aria-hidden />
                      )}
                      {Math.abs(d).toFixed(1)}%
                    </span>
                    <Sparkline data={m.spark} />
                  </div>
                </ToolCard>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented value={period} onChange={setPeriod} />
            <span className="text-caption text-muted-foreground">
              against the {period} before
            </span>
          </div>
        </motion.div>
      </Ai>
    </Thread>
  );
}

/* ── 7 · terminal: output from a machine ──────────────────────────── */

const BUILD: { text: string; err?: boolean }[] = [
  { text: "> quiet-instrument@2.4.0 build" },
  { text: "> next build" },
  { text: "" },
  { text: "  ▲ Next.js 15.5.2" },
  { text: "" },
  { text: "   Creating an optimized production build ..." },
  { text: " ✓ Compiled successfully in 18.2s" },
  { text: "   Linting and checking validity of types ..." },
  { text: "" },
  { text: "Failed to compile.", err: true },
  { text: "" },
  { text: "./src/app/board/page.tsx:42:11", err: true },
  {
    text: "Type error: Property 'ownerId' does not exist on type 'Card'.",
    err: true,
  },
  { text: "" },
  { text: "  41 |   const rows = cards.map((card) => ({", err: true },
  { text: "> 42 |     owner: card.ownerId,", err: true },
  { text: "     |                 ^", err: true },
  { text: "  43 |   }));", err: true },
];
const TAIL = 7;

function TerminalPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const flat = BUILD.map((l) => l.text)
    .filter(Boolean)
    .join(" ");

  if (!after) {
    return (
      <Thread>
        <Ai>
          <Said>I ran the build. Here is what came back: {flat}</Said>
          <button type="button" className={QUIET} onClick={() => setOpen(true)}>
            Run again
          </button>
          {open && <Said>I ran the build. Here is what came back: {flat}</Said>}
        </Ai>
      </Thread>
    );
  }

  const hidden = BUILD.length - TAIL;
  const lines = open ? BUILD : BUILD.slice(-TAIL);

  return (
    <Thread>
      <Ai>
        <motion.div {...surfaceIn}>
          <ToolCard className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2.5">
              <span className="text-caption min-w-0 truncate font-mono">
                <span className="text-muted-foreground">$ </span>
                npm run build
              </span>
              <span className="text-caption text-muted-foreground ml-auto tabular-nums">
                12.4s
              </span>
              <span className="text-micro text-destructive bg-destructive/10 rounded-full px-2 py-1 uppercase tabular-nums">
                exit 1
              </span>
            </div>
            {!open && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-caption text-muted-foreground hover:text-foreground hover:bg-card flex h-9 w-full items-center gap-1.5 border-b px-3 transition-colors"
              >
                <ChevronUp className="size-3.5" aria-hidden />
                Show {hidden} earlier lines
              </button>
            )}
            <div className="bg-card max-h-72 overflow-auto px-3 py-2.5">
              {lines.map((l, i) => (
                <p
                  key={`${l.text}-${i}`}
                  className={cn(
                    "text-caption font-mono whitespace-pre",
                    l.err ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {l.text || " "}
                </p>
              ))}
            </div>
            {open && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-caption text-muted-foreground hover:text-foreground hover:bg-card flex h-9 w-full items-center gap-1.5 border-t px-3 transition-colors"
              >
                <ChevronDown className="size-3.5" aria-hidden />
                Collapse
              </button>
            )}
          </ToolCard>
        </motion.div>
      </Ai>
    </Thread>
  );
}

/* ── 8 · citation: which source says what ─────────────────────────── */

const SOURCES = [
  {
    n: 1,
    title: "Interaction to Next Paint (INP)",
    snippet:
      "INP replaced First Input Delay as a Core Web Vital on 12 March 2024.",
    meta: "Jeremy Wagner · Mar 2024",
    url: "web.dev/articles/inp",
  },
  {
    n: 2,
    title: "Core Web Vitals thresholds",
    snippet:
      "Under 200 ms is good; 200–500 ms needs improvement; above 500 ms is poor.",
    meta: "Chrome team · Aug 2025",
    url: "chromium.org/web-vitals/thresholds",
  },
  {
    n: 3,
    title: "Web Almanac 2025 — Performance",
    snippet:
      "43% of origins met the good INP threshold on mobile in the 2025 crawl.",
    meta: "HTTP Archive · Nov 2025",
    url: "httparchive.org/almanac/2025/performance",
  },
];

const CLAIMS = [
  {
    n: 1,
    text: "Interaction to Next Paint replaced First Input Delay as a Core Web Vital in March 2024.",
  },
  {
    n: 2,
    text: "Anything under 200 ms counts as good, and over 500 ms as poor.",
  },
  {
    n: 3,
    text: "Only 43% of origins reached the good threshold on mobile last year.",
  },
];

function SourceCard({ n }: { n: number }) {
  const s = SOURCES[n - 1];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.fast, ease: ease.outQuart }}
    >
      <ToolCard className="space-y-1 p-3">
        <div className="flex items-center gap-2">
          <span
            className="bg-accent text-accent-foreground text-micro grid size-5 shrink-0 place-items-center rounded-full tabular-nums"
            aria-hidden
          >
            {s.n}
          </span>
          <span className="text-caption text-muted-foreground truncate font-mono">
            {s.url}
          </span>
        </div>
        <p className="text-ui-sm">{s.title}</p>
        <p className="text-caption text-muted-foreground">“{s.snippet}”</p>
        <p className="text-micro text-muted-foreground uppercase">{s.meta}</p>
      </ToolCard>
    </motion.div>
  );
}

function CitationPair({ after }: Side) {
  const [openSource, setOpenSource] = useState<number | null>(null);

  if (!after) {
    return (
      <Thread>
        <Ai>
          <Said>{CLAIMS.map((c) => c.text).join(" ")}</Said>
          <div className="space-y-1">
            <p className="text-micro text-muted-foreground uppercase">
              Sources
            </p>
            {SOURCES.map((s) => (
              <button
                key={s.n}
                type="button"
                aria-pressed={openSource === s.n}
                onClick={() => setOpenSource((o) => (o === s.n ? null : s.n))}
                className={cn(
                  "text-caption flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left font-mono transition-colors",
                  openSource === s.n
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="tabular-nums">[{s.n}]</span>
                <span className="truncate">{s.url}</span>
              </button>
            ))}
          </div>
          {openSource && <SourceCard n={openSource} />}
        </Ai>
      </Thread>
    );
  }

  return (
    <Thread>
      <Ai>
        <p className="text-ui max-w-prose-comfortable text-pretty">
          {CLAIMS.map((c) => (
            <span key={c.n}>
              <span
                className={cn(
                  openSource === c.n &&
                    "decoration-accent-solid underline decoration-dotted underline-offset-4",
                )}
              >
                {c.text}
              </span>{" "}
              {/* The chip is small because it sits in a line of text.
                  Its hit area is grown back to a real target with a
                  pseudo-element, so it is still comfortable to press. */}
              <button
                type="button"
                aria-label={`Source ${c.n}: ${SOURCES[c.n - 1].title}`}
                aria-pressed={openSource === c.n}
                onClick={() => setOpenSource((o) => (o === c.n ? null : c.n))}
                className={cn(
                  "text-micro relative mr-0.5 inline-grid size-4 place-items-center rounded-full align-super tabular-nums transition-colors after:absolute after:-inset-2.5 after:content-['']",
                  openSource === c.n
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground border",
                )}
              >
                {c.n}
              </button>
            </span>
          ))}
        </p>
        {openSource && <SourceCard n={openSource} />}
      </Ai>
    </Thread>
  );
}

/* ── 9 · message-draft: something going out in your name ──────────── */

const DRAFT_SUBJECT = "Re: invoice 2291 — corrected total";
const DRAFT_BODY =
  "Hi Dana,\n\nYou were right, 2291 was billed at the old seat rate. The corrected total is $4,180 and a credit note for the difference is on its way.\n\nSorry for the back and forth.";

function DraftPair({ after }: Side) {
  const [subject, setSubject] = useState(DRAFT_SUBJECT);
  const [body, setBody] = useState(DRAFT_BODY);
  const [sent, setSent] = useState<null | "sent" | "cancelled">(null);
  const [said, setSaid] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false);
  const subjectId = useId();
  const bodyId = useId();

  const reset = () => {
    setSubject(DRAFT_SUBJECT);
    setBody(DRAFT_BODY);
    setSent(null);
    setSaid(null);
    setNudge(false);
  };

  if (!after) {
    const reply = (v: string) => {
      setSaid(v);
      const t = v.toLowerCase();
      if (/^(send|ship|go|yes)/.test(t)) {
        setSent("sent");
        setNudge(false);
      } else if (/^(cancel|no|discard|stop)/.test(t)) {
        setSent("cancelled");
        setNudge(false);
      } else {
        setNudge(true);
      }
    };
    return (
      <Thread>
        <Ai>
          <Said>Here is the reply I have drafted for Dana.</Said>
          <Said>
            To: dana@northwind.co, cc ravi@northwind.co. Subject:{" "}
            {DRAFT_SUBJECT}. {DRAFT_BODY.replace(/\n+/g, " ")}
          </Said>
          <Said>
            Say “send” when it looks right, or tell me what to change.
          </Said>
        </Ai>
        {said && <You>{said}</You>}
        {nudge && (
          <Ai>
            <Said>
              I can change it, but you will have to describe the wording you
              want and then read the whole thing again.
            </Said>
          </Ai>
        )}
        {sent && (
          <Ai>
            <Said>
              {sent === "sent"
                ? "Sent to dana@northwind.co."
                : "Discarded — nothing was sent."}
            </Said>
          </Ai>
        )}
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Reply
              placeholder="send / cancel / what to change"
              onSend={reply}
              disabled={!!sent}
            />
          </div>
          {(sent || nudge) && <StartOver onClick={reset} />}
        </div>
      </Thread>
    );
  }

  return (
    <Thread>
      <Ai>
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <div key="receipt" className="space-y-2.5">
              <Receipt
                ok={sent === "sent"}
                title={
                  sent === "sent"
                    ? "Sent to dana@northwind.co"
                    : "Discarded — nothing was sent"
                }
                detail={sent === "sent" ? subject : undefined}
              />
              <StartOver onClick={reset} />
            </div>
          ) : (
            <motion.div key="card" {...surfaceIn}>
              <ToolCard className="space-y-2.5 p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-micro text-muted-foreground uppercase">
                    To
                  </span>
                  {["dana@northwind.co", "ravi@northwind.co"].map((a) => (
                    <span
                      key={a}
                      className="text-caption bg-card rounded-full border px-2.5 py-0.5"
                    >
                      {a}
                    </span>
                  ))}
                </div>
                <div>
                  <label
                    htmlFor={subjectId}
                    className="text-micro text-muted-foreground uppercase"
                  >
                    Subject
                  </label>
                  <input
                    id={subjectId}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`${FIELD} mt-1`}
                  />
                </div>
                <div>
                  <label
                    htmlFor={bodyId}
                    className="text-micro text-muted-foreground uppercase"
                  >
                    Message
                  </label>
                  <textarea
                    id={bodyId}
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="text-ui-sm bg-card mt-1 w-full resize-none rounded-lg border px-3 py-2 outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 border-t pt-3">
                  <span className="text-caption text-muted-foreground tabular-nums">
                    {body.length} characters
                  </span>
                  <button
                    type="button"
                    className={`${GHOST} ml-auto`}
                    onClick={() => setSent("cancelled")}
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    className={SOLID}
                    onClick={() => setSent("sent")}
                  >
                    Send
                  </button>
                </div>
              </ToolCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Ai>
    </Thread>
  );
}

/* ── 10 · order-summary: what adds up to the total ────────────────── */

const CATALOGUE = [
  { id: "n", name: "Field notebook, A5", unit: 12 },
  { id: "c", name: "Ink cartridges, blue-black", unit: 8.5 },
  { id: "m", name: "Desk mat, felt", unit: 46 },
];
const FREE_OVER = 75;

function OrderPair({ after }: Side) {
  const [qty, setQty] = useState<Record<string, number>>({ n: 2, c: 1, m: 1 });

  const lines = CATALOGUE.map((i) => ({ ...i, qty: qty[i.id] }));
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const shipping = subtotal >= FREE_OVER || subtotal === 0 ? 0 : 6;
  const tax = Math.round(subtotal * 0.08875 * 100) / 100;
  const total = subtotal + shipping + tax;
  const bump = (id: string, d: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(9, q[id] + d)) }));

  if (!after) {
    const bought = lines.filter((l) => l.qty > 0);
    return (
      <Thread>
        <Ai>
          <Said>
            {bought.length === 0
              ? "Your basket is empty."
              : `${bought
                  .map(
                    (l) => `${l.qty} × ${l.name.toLowerCase()} at ${money(l.unit)}`,
                  )
                  .join(", ")} comes to ${money(subtotal)}${
                  shipping
                    ? `, plus ${money(shipping)} shipping`
                    : ", with free shipping"
                } and ${money(tax)} tax — ${money(total)} in total.`}
          </Said>
        </Ai>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={QUIET}
            onClick={() => bump("n", 1)}
          >
            One more notebook
          </button>
          <button
            type="button"
            className={QUIET}
            onClick={() => setQty((q) => ({ ...q, m: q.m ? 0 : 1 }))}
          >
            {qty.m ? "Remove the desk mat" : "Add the desk mat"}
          </button>
        </div>
      </Thread>
    );
  }

  const rows: { label: string; value: number; shipping?: boolean }[] = [
    { label: "Subtotal", value: subtotal },
    { label: "Shipping", value: shipping, shipping: true },
    { label: "Tax (8.875%)", value: tax },
  ];

  return (
    <Thread>
      <Ai>
        <motion.div {...surfaceIn}>
          <ToolCard className="p-2">
            <div className="space-y-0.5">
              {lines.map((l) => (
                <div
                  key={l.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-1.5",
                    l.qty === 0 && "opacity-40",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-ui-sm block truncate">{l.name}</span>
                    <span className="text-caption text-muted-foreground tabular-nums">
                      {money(l.unit)} each
                    </span>
                  </span>
                  <span className="bg-card flex items-center rounded-lg border">
                    <button
                      type="button"
                      aria-label={`One fewer ${l.name}`}
                      onClick={() => bump(l.id, -1)}
                      disabled={l.qty === 0}
                      className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-lg transition-colors disabled:opacity-40"
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <span className="text-ui-sm w-5 text-center tabular-nums">
                      {l.qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`One more ${l.name}`}
                      onClick={() => bump(l.id, 1)}
                      className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-lg transition-colors"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  </span>
                  <span className="text-ui-sm w-16 shrink-0 text-right tabular-nums">
                    <NumberFlow
                      value={l.unit * l.qty}
                      format={{ style: "currency", currency: "USD" }}
                    />
                  </span>
                </div>
              ))}
            </div>
            <dl className="mt-2 space-y-1.5 border-t px-2 pt-2.5">
              {rows.map((r) => (
                <div
                  key={r.label}
                  className="text-caption flex items-baseline justify-between gap-4"
                >
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd
                    className={cn(
                      "tabular-nums",
                      r.shipping && r.value === 0 && "text-positive",
                    )}
                  >
                    {r.shipping && r.value === 0 ? (
                      "Free over $75"
                    ) : (
                      <NumberFlow
                        value={r.value}
                        format={{ style: "currency", currency: "USD" }}
                      />
                    )}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 border-t pt-2">
                <dt className="text-ui-sm">Total</dt>
                <dd className="text-ui tabular-nums">
                  <NumberFlow
                    value={total}
                    format={{ style: "currency", currency: "USD" }}
                  />
                </dd>
              </div>
            </dl>
          </ToolCard>
        </motion.div>
      </Ai>
    </Thread>
  );
}

/* ── 11 · question-flow: one thing at a time ──────────────────────── */

const FLOW = [
  {
    id: "env",
    title: "Which environment should this hook deploy?",
    short: "Environment",
    options: [
      { id: "prod", label: "Production" },
      { id: "staging", label: "Staging" },
      { id: "preview", label: "Preview branches" },
    ],
  },
  {
    id: "when",
    title: "When should it fire?",
    short: "Fires",
    options: [
      { id: "push", label: "On every push" },
      { id: "tag", label: "On tagged releases" },
      { id: "manual", label: "Only when I press deploy" },
    ],
  },
  {
    id: "who",
    title: "Who should hear about it?",
    short: "Notifies",
    options: [
      { id: "slack", label: "Slack, #releases" },
      { id: "oncall", label: "The on-call, by email" },
      { id: "nobody", label: "Nobody" },
    ],
  },
  {
    id: "retry",
    title: "If it fails, should it try again?",
    short: "Retries",
    options: [
      { id: "once", label: "Once" },
      { id: "thrice", label: "Three times" },
      { id: "never", label: "Never" },
    ],
  },
];

function QuestionPair({ after }: Side) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState(0);
  const [said, setSaid] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setAnswers({});
    setAnswered(0);
    setSaid(null);
  };

  if (!after) {
    const missing = FLOW.length - answered;
    return (
      <Thread>
        <Ai>
          <Said>
            To set up the deploy hook I need four things. 1. Which environment —
            production, staging or preview branches. 2. When it should fire — on
            every push, on tagged releases, or only when you press deploy. 3.
            Who should hear about it — Slack #releases, the on-call by email, or
            nobody. 4. Whether it should try again after a failure — once, three
            times, or never.
          </Said>
        </Ai>
        {said && <You>{said}</You>}
        {answered > 0 && missing > 0 && (
          <Ai>
            <Said>
              Thanks — I have {answered} of 4. I still need{" "}
              {FLOW.slice(answered)
                .map((_, i) => answered + i + 1)
                .join(" and ")}
              .
            </Said>
          </Ai>
        )}
        {missing === 0 && (
          <Ai>
            <Said>All four answered. The deploy hook is set up.</Said>
          </Ai>
        )}
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Reply
              placeholder="e.g. production, on tags"
              disabled={missing === 0}
              onSend={(v) => {
                setSaid(v);
                const parts = v.split(/,| and /).filter((p) => p.trim());
                setAnswered((a) => Math.min(FLOW.length, a + parts.length));
              }}
            />
          </div>
          {answered > 0 && <StartOver onClick={reset} />}
        </div>
      </Thread>
    );
  }

  const done = step >= FLOW.length;
  const q = FLOW[Math.min(step, FLOW.length - 1)];

  return (
    <Thread>
      <Ai>
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <div key="summary" className="space-y-2.5">
              <motion.div {...surfaceIn}>
                <ToolCard className="p-4">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Check className="text-positive size-4" aria-hidden />
                    <p className="text-ui-sm">Deploy hook set up</p>
                  </div>
                  <dl className="border-t">
                    {FLOW.map((f) => (
                      <div
                        key={f.id}
                        className="text-caption flex items-baseline justify-between gap-4 border-b py-2 last:border-b-0"
                      >
                        <dt className="text-muted-foreground">{f.short}</dt>
                        <dd className="shrink-0 text-right">
                          {f.options.find((o) => o.id === answers[f.id])?.label}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </ToolCard>
              </motion.div>
              <StartOver onClick={reset} />
            </div>
          ) : (
            <motion.div key={q.id} {...surfaceIn}>
              <ToolCard className="p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-micro text-muted-foreground uppercase tabular-nums">
                    Step {step + 1} of {FLOW.length}
                  </span>
                  <span className="ml-auto flex gap-1" aria-hidden>
                    {FLOW.map((f, i) => (
                      <span
                        key={f.id}
                        className={cn(
                          "size-1.5 rounded-full",
                          i <= step ? "bg-foreground" : "bg-card border",
                        )}
                      />
                    ))}
                  </span>
                </div>
                <p className="text-ui mb-3">{q.title}</p>
                <div className="space-y-1">
                  {q.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setAnswers((a) => ({ ...a, [q.id]: o.id }));
                        setStep((s) => s + 1);
                      }}
                      className={cn(
                        "text-ui-sm hover:bg-card flex h-11 w-full items-center rounded-lg border px-3 text-left transition-colors",
                        answers[q.id] === o.id
                          ? "bg-card border-foreground/20"
                          : "border-transparent",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {step > 0 && (
                  <div className="mt-3 border-t pt-2.5">
                    <button
                      type="button"
                      className={GHOST}
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                      Back
                    </button>
                  </div>
                )}
              </ToolCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Ai>
    </Thread>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function ToolUiDemo() {
  return (
    <div>
      <BeforeAfter
        principle="When something is about to be deleted for you, one press should be enough to agree — and afterwards you should still be able to see exactly what you agreed to."
        before={<ApprovalPair after={false} />}
        after={<ApprovalPair after />}
      />
      <BeforeAfter
        principle="If you are choosing from a list, you should be able to touch the things you want. Typing the numbers means counting, and hoping you counted right."
        before={<OptionsPair after={false} />}
        after={<OptionsPair after />}
      />
      <BeforeAfter
        principle="Let people drag an amount and watch what it does to the result. Type a number blind and you only find out it was wrong after you have sent it."
        before={<SliderPair after={false} />}
        after={<SliderPair after />}
      />
      <BeforeAfter
        principle="While something long is running, show which part it is on and which parts are left. “Working…” gives you nothing to wait for, and tells you nothing when it stops."
        before={<ProgressPair after={false} />}
        after={<ProgressPair after />}
      />
      <BeforeAfter
        principle="Rows of numbers belong in rows, lined up, so you can sort them and see which is biggest. Poured out as text they are just something to squint at."
        before={<TablePair after={false} />}
        after={<TablePair after />}
      />
      <BeforeAfter
        principle="A number only means something next to the number it used to be. On its own you cannot tell whether it is good news."
        before={<StatsPair after={false} />}
        after={<StatsPair after />}
      />
      <BeforeAfter
        principle="Output from a machine should look like it, and say up front whether it worked. Flattened into a sentence, a failure reads exactly like a success."
        before={<TerminalPair after={false} />}
        after={<TerminalPair after />}
      />
      <BeforeAfter
        principle="Show where each claim came from, right next to the claim. A list of links at the bottom never tells you which one backs up what."
        before={<CitationPair after={false} />}
        after={<CitationPair after />}
      />
      <BeforeAfter
        principle="If something is going out in your name, let you fix the words yourself. Describing the change you want and waiting for a rewrite is slower than typing it."
        before={<DraftPair after={false} />}
        after={<DraftPair after />}
      />
      <BeforeAfter
        principle="Show what each thing costs and let the total add itself up as you change your mind. One figure at the end is something you just have to trust."
        before={<OrderPair after={false} />}
        after={<OrderPair after />}
      />
      <BeforeAfter
        principle="Ask one question at a time. Four in one breath and people answer two, forget the rest, and have to be asked all over again."
        before={<QuestionPair after={false} />}
        after={<QuestionPair after />}
      />
    </div>
  );
}
