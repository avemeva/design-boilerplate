"use client";

import { ArrowUp, Bold, Italic, Underline } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

import { Orb } from "@/components/app/orb";
import { BeforeAfter } from "@/components/surface";
import { cn } from "@/lib/utils";

/* ==================================================================== *
 * gradient-border-plugin — https://gradient-border.floriankiem.com/
 *
 * The package is a CSS file you `@import` next to Tailwind, and it is
 * not installed here, so `Ring` below is the plugin's `::before` written
 * out as a real node: `inset: 0`, `border-radius: inherit`, the gradient
 * as the background, `padding` as the stroke width, and the two-layer
 * mask composited with `exclude` so only the padding band survives.
 *
 * Everything else — the widths, the from/via/to stops, the angle, the
 * rotating variant and its duration, `pointer-events: none` — is carried
 * over one for one.
 * ==================================================================== */

const MASK =
  "linear-gradient(currentcolor 0 0) content-box, linear-gradient(currentcolor 0 0)";

/** `color-mix` instead of hex, so every stop stays a token. */
const mix = (token: string, pct: number) =>
  `color-mix(in oklab, var(${token}) ${pct}%, transparent)`;

/** The plugin default: dark at the top, gone by the bottom. */
const NEUTRAL = `linear-gradient(180deg, ${mix("--foreground", 24)}, ${mix("--foreground", 4)})`;
/** The same idea reversed out, for the ink panel. */
const GLASS = `linear-gradient(180deg, ${mix("--feature-foreground", 60)}, ${mix("--feature-foreground", 4)})`;
/** from / via / to, the state colour. */
const ACCENT = `linear-gradient(170deg, var(--accent-solid), ${mix("--accent-solid", 40)} 45%, transparent)`;
/** The arbitrary override: a conic sweep, spun by --gb-angle. */
const SPIN = `conic-gradient(from calc(var(--gb-angle) * 1deg), var(--accent-solid), ${mix("--accent-solid", 6)} 55%, var(--accent-solid))`;

/**
 * One gradient stroke, hugging whatever radius its parent already has.
 *
 * `blocking` exists only so the "before" side can show the version
 * people hand-roll: the identical layer, minus `pointer-events: none`.
 */
function Ring({
  image,
  width = 1,
  spin = false,
  duration = 2,
  blocking = false,
}: {
  image: string;
  width?: number;
  spin?: boolean;
  duration?: number;
  blocking?: boolean;
}) {
  return (
    <motion.span
      aria-hidden
      className={cn("absolute inset-0", !blocking && "pointer-events-none")}
      style={
        {
          borderRadius: "inherit",
          padding: width,
          backgroundImage: image,
          mask: MASK,
          maskComposite: "exclude",
          WebkitMask: MASK,
          WebkitMaskComposite: "xor",
          "--gb-angle": 0,
        } as React.CSSProperties
      }
      animate={{ "--gb-angle": spin ? 360 : 0 }}
      transition={
        spin ? { duration, ease: "linear", repeat: Infinity } : { duration: 0 }
      }
    />
  );
}

/** Shared segmented control, so both sides of a switch are identical. */
function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="bg-secondary inline-flex rounded-full p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
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

/* ================================================================== *
 * 1 — a border can only hold one colour per side
 * ================================================================== */

const TOOLS = [
  { id: "bold", Icon: Bold, label: "Bold" },
  { id: "italic", Icon: Italic, label: "Italic" },
  { id: "underline", Icon: Underline, label: "Underline" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

function GlassBarPair({ after }: { after: boolean }) {
  const [on, setOn] = useState<Record<ToolId, boolean>>({
    bold: true,
    italic: false,
    underline: false,
  });
  const [shared, setShared] = useState(false);

  /* One colour per side is all a border can hold. */
  const bevel =
    "border border-t-feature-foreground/60 border-x-feature-foreground/20 border-b-feature-foreground/4";

  return (
    <div className="bg-feature text-feature-foreground rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {TOOLS.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={on[id]}
            onClick={() => setOn((s) => ({ ...s, [id]: !s[id] }))}
            className={cn(
              "duration-fast relative grid size-10 place-items-center rounded-full transition-colors",
              on[id]
                ? "bg-feature-foreground/15"
                : "bg-feature-foreground/5 hover:bg-feature-foreground/10",
              !after && bevel,
            )}
          >
            <Icon className="size-4" aria-hidden />
            {after && <Ring image={GLASS} width={2} />}
          </button>
        ))}

        <span className="bg-feature-foreground/15 mx-1 h-6 w-px" aria-hidden />

        <button
          type="button"
          aria-pressed={shared}
          onClick={() => setShared((s) => !s)}
          className={cn(
            "text-ui-sm duration-fast relative h-10 rounded-full px-4 transition-colors",
            shared
              ? "bg-feature-foreground/15"
              : "bg-feature-foreground/5 hover:bg-feature-foreground/10",
            !after && bevel,
          )}
        >
          {shared ? "Shared" : "Share"}
          {after && <Ring image={GLASS} width={2} />}
        </button>
      </div>

      <p
        className={cn(
          "text-ui mt-5 max-w-prose-comfortable",
          on.bold && "font-semibold",
          on.italic && "italic",
          on.underline && "underline underline-offset-4",
        )}
      >
        Every commit on this branch has been signed since Tuesday, and the
        checks now finish before the review request goes out.
      </p>
    </div>
  );
}

/* ================================================================== *
 * 2 — the stroke follows the shape
 * ================================================================== */

const SHAPES = [
  { id: "squircle", label: "Squircle", cls: "rounded-2xl" },
  { id: "rounded", label: "Rounded", cls: "rounded-lg" },
  { id: "circle", label: "Circle", cls: "rounded-full" },
] as const;

type ShapeId = (typeof SHAPES)[number]["id"];

const SPACES = [
  { seed: "atlas-labs", name: "Atlas", initial: "A" },
  { seed: "north-supply", name: "North", initial: "N" },
  { seed: "verity-co", name: "Verity", initial: "V" },
  { seed: "kite-studio", name: "Kite", initial: "K" },
];

/** The mark itself — grid, so it is never an inline box. */
function Mark({ initial, cls }: { initial: string; cls: string }) {
  return (
    <span
      className={cn(
        "bg-secondary text-ui-sm text-muted-foreground grid size-14 place-items-center",
        cls,
      )}
    >
      {initial}
    </span>
  );
}

function ShapePair({ after }: { after: boolean }) {
  const [shape, setShape] = useState<ShapeId>("circle");
  const [current, setCurrent] = useState("atlas-labs");
  const cls = SHAPES.find((s) => s.id === shape)!.cls;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Seg options={SHAPES} value={shape} onChange={setShape} />
      </div>

      <div className="flex flex-wrap gap-5">
        {SPACES.map((w) => (
          <button
            key={w.seed}
            type="button"
            aria-pressed={current === w.seed}
            onClick={() => setCurrent(w.seed)}
            className="group flex flex-col items-center gap-2"
          >
            {after ? (
              /* One node. The stroke reads border-radius off the mark. */
              <span className={cn("relative inline-flex", cls)}>
                <Mark initial={w.initial} cls={cls} />
                <Ring image={NEUTRAL} width={2} />
              </span>
            ) : (
              /* The wrapper hack: a second node whose radius was written
               * once, for one shape, and never tracked the mark again. */
              <span
                className="inline-flex rounded-xl"
                style={{ backgroundImage: NEUTRAL, padding: 2 }}
              >
                <Mark initial={w.initial} cls={cls} />
              </span>
            )}
            <span
              className={cn(
                "text-caption duration-fast transition-colors",
                current === w.seed
                  ? "text-foreground"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {w.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== *
 * 3 — marking the one you picked
 * ================================================================== */

const PLANS = [
  { id: "starter", name: "Starter", price: "$0", note: "1 project, 2 seats" },
  { id: "team", name: "Team", price: "$24", note: "10 projects, 10 seats" },
  { id: "business", name: "Business", price: "$60", note: "Unlimited seats" },
];

function PickPair({ after }: { after: boolean }) {
  const [picked, setPicked] = useState("team");

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {PLANS.map((p) => {
        const on = picked === p.id;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={on}
            onClick={() => setPicked(p.id)}
            className={cn(
              "text-ui duration-fast relative rounded-xl border p-4 text-left transition-colors",
              on
                ? after
                  ? "bg-card"
                  : "bg-card ring-accent-solid ring-2 ring-inset"
                : "hover:bg-secondary",
            )}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-ui-sm">{p.name}</span>
              <span className="text-caption text-muted-foreground tabular-nums">
                {p.price}/mo
              </span>
            </span>
            <span className="text-caption text-muted-foreground mt-1 block">
              {p.note}
            </span>
            <span
              className={cn(
                "text-micro text-accent-foreground mt-3 block uppercase",
                !on && "invisible",
              )}
            >
              Your plan
            </span>
            {after && on && <Ring image={ACCENT} width={2} />}
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== *
 * 4 — the rotating variant, doing an actual job
 * ================================================================== */

const REPLIES = [
  "4,120 sign-ups last week — up 12% on the week before.",
  "Three invoices are overdue. The oldest is nine days out.",
  "Every check is green. The last deploy shipped 26 minutes ago.",
];

type Msg = { from: "you" | "bot"; text: string };

const OPENING: Msg[] = [
  { from: "you", text: "How did last week go?" },
  { from: "bot", text: "Traffic held flat and churn dropped to 1.8%." },
];

function ThinkingPair({ after }: { after: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>(OPENING);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turn = useRef(0);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const q = draft.trim() || "What changed since yesterday?";
    setMsgs((m) => [...m, { from: "you", text: q } as Msg].slice(-4));
    setDraft("");
    setBusy(true);
    timer.current = setTimeout(() => {
      const text = REPLIES[turn.current++ % REPLIES.length];
      setMsgs((m) => [...m, { from: "bot", text } as Msg].slice(-4));
      setBusy(false);
    }, 2400);
  };

  const hot = after && busy;

  return (
    <div>
      <div className="flex items-center gap-3">
        {/* The stroke lives on the padded wrapper, so it rides the card
         * rather than the mark and stays legible against it. */}
        <span className="relative inline-flex shrink-0 rounded-full p-1">
          <Orb seed="assistant-mark" className="size-10" />
          <Ring
            image={hot ? SPIN : NEUTRAL}
            width={hot ? 2 : 1}
            spin={hot && !reduce}
          />
        </span>
        <div>
          <p className="text-ui-sm">Assistant</p>
          <p className="text-caption text-muted-foreground">Workspace data</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {msgs.map((m, i) => (
          <p
            key={`${i}-${m.text}`}
            className={cn(
              "text-ui-sm w-fit max-w-prose-comfortable rounded-xl px-3 py-2",
              m.from === "you"
                ? "bg-secondary ml-auto"
                : "bg-card text-muted-foreground border",
            )}
          >
            {m.text}
          </p>
        ))}
      </div>

      <form onSubmit={ask} className="mt-4 flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Message the assistant
        </label>
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about the workspace"
          className="bg-card text-ui-sm focus-visible:ring-ring h-9 min-w-0 flex-1 rounded-lg border px-3 focus-visible:ring-2 focus-visible:outline-none"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={busy}
          className="bg-primary text-primary-foreground duration-fast grid size-9 shrink-0 place-items-center rounded-lg transition-opacity disabled:opacity-40"
        >
          <ArrowUp className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}

/* ================================================================== *
 * 5 — a decoration that never takes a press
 *
 * The stroke is a layer on the pill, sitting over the field and the send
 * button. A press that lands on it is a press on the pill, not on what
 * is underneath — which is the whole reason the plugin's ::before ships
 * with pointer-events: none.
 * ================================================================== */

const CHIPS = [
  "Summarise this week",
  "Find overdue invoices",
  "Who joined recently?",
];

function ComposerPair({ after }: { after: boolean }) {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const id = useId();

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setSent((s) => [t, ...s].slice(0, 3));
    setDraft("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setDraft(c)}
            className="text-ui-sm text-muted-foreground hover:text-foreground hover:bg-secondary duration-fast h-9 rounded-full border px-3 transition-colors"
          >
            {c}
          </button>
        ))}
      </div>

      <form
        onSubmit={send}
        className="bg-secondary relative mt-4 flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5"
      >
        <label htmlFor={id} className="sr-only">
          Message the assistant
        </label>
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask anything"
          className="text-ui-sm h-9 min-w-0 flex-1 bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="bg-primary text-primary-foreground duration-fast grid size-9 shrink-0 place-items-center rounded-full transition-opacity hover:opacity-85"
        >
          <ArrowUp className="size-4" aria-hidden />
        </button>
        {/* Identical layer on both sides. One of them stays out of the
         * way of the pointer. */}
        <Ring image={NEUTRAL} width={2} blocking={!after} />
      </form>

      <ul className="mt-3 space-y-1">
        {sent.length === 0 ? (
          <li className="text-caption text-muted-foreground">
            Nothing sent yet.
          </li>
        ) : (
          sent.map((s, i) => (
            <li key={`${i}-${s}`} className="text-caption text-muted-foreground">
              Sent — {s}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

/* ================================================================== *
 * the page
 * ================================================================== */

export function GradientBorderPluginDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The edge fades from top to bottom instead of breaking into four pieces at the corners."
        before={<GlassBarPair after={false} />}
        after={<GlassBarPair after />}
      />
      <BeforeAfter
        principle="The outline fits whatever shape you pick, right down to a circle."
        before={<ShapePair after={false} />}
        after={<ShapePair after />}
      />
      <BeforeAfter
        principle="The plan you picked catches the light along its edge instead of sitting in a hard box."
        before={<PickPair after={false} />}
        after={<PickPair after />}
      />
      <BeforeAfter
        principle="Ask it something: you can tell it is still working before the answer lands."
        before={<ThinkingPair after={false} />}
        after={<ThinkingPair after />}
      />
      <BeforeAfter
        principle="Pick a suggestion, then press send. The box takes the press again."
        before={<ComposerPair after={false} />}
        after={<ComposerPair after />}
      />
    </div>
  );
}
