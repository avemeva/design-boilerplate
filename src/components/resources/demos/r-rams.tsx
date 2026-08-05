"use client";

import NumberFlow from "@number-flow/react";
import {
  AlertTriangle,
  Check,
  Download,
  Pause,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * rams.ai — a design-quality engine that reads UI source against 291
 * rules in 9 categories (Accessibility, Color, Typography, Spacing,
 * Components, UX, Motion, Craft, Native) and scores it 0-100.
 *
 * The rule text lives in the engine, but the free Skill publishes its
 * own checklist — 12 accessibility checks and 13 visual-design checks
 * — and the changelog names the 16 rules added on 31 July 2026 one by
 * one. Those are the source items. The ones a person can actually SEE
 * are rebuilt below as a switch. Scoring, quota, CI and SwiftUI were
 * left where they were.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

function Note({ children }: { children: ReactNode }) {
  return <p className="text-caption text-muted-foreground mt-3">{children}</p>;
}

/* ── 1 · the whole row is the control ─────────────────────────────── */

const ALERTS = [
  { id: "digest", name: "Weekly digest", meta: "Every Monday, 9am" },
  { id: "mentions", name: "Mentions", meta: "As they happen" },
  { id: "billing", name: "Billing receipts", meta: "After each payment" },
];

function RowPair({ after }: Side) {
  const [on, setOn] = useState<string[]>(["digest"]);
  const toggle = (id: string) =>
    setOn((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      {ALERTS.map((a, i) =>
        after ? (
          <label
            key={a.id}
            htmlFor={`rams-row-${a.id}`}
            className={cn(
              "duration-fast hover:bg-secondary flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors",
              i > 0 && "border-t",
            )}
          >
            <span className="block">
              <span className="text-ui block font-medium">{a.name}</span>
              <span className="text-caption text-muted-foreground block">
                {a.meta}
              </span>
            </span>
            <Switch
              id={`rams-row-${a.id}`}
              checked={on.includes(a.id)}
              onCheckedChange={() => toggle(a.id)}
            />
          </label>
        ) : (
          <div
            key={a.id}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3",
              i > 0 && "border-t",
            )}
          >
            <div>
              <p className="text-ui font-medium">{a.name}</p>
              <p className="text-caption text-muted-foreground">{a.meta}</p>
            </div>
            <Switch
              aria-label={a.name}
              checked={on.includes(a.id)}
              onCheckedChange={() => toggle(a.id)}
            />
          </div>
        ),
      )}
    </div>
  );
}

/* ── 2 · status you can read, not just see ────────────────────────── */

const SERVICES = ["Payments", "Search", "Webhooks"];

const STATES = [
  {
    word: "Operational",
    dot: "bg-positive",
    text: "text-positive",
    Icon: Check,
  },
  {
    word: "Failing",
    dot: "bg-destructive",
    text: "text-destructive",
    Icon: AlertTriangle,
  },
  {
    word: "Paused",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    Icon: Pause,
  },
] as const;

function StatusPair({ after }: Side) {
  const [step, setStep] = useState(0);

  return (
    <div>
      <div className="bg-card divide-y rounded-xl border">
        {SERVICES.map((s, i) => {
          const st = STATES[(i + step) % STATES.length];
          return (
            <div key={s} className="flex items-center justify-between px-4 py-3">
              <p className="text-ui">{s}</p>
              {after ? (
                <span
                  className={cn("text-ui-sm flex items-center gap-1.5", st.text)}
                >
                  <st.Icon className="size-4" aria-hidden="true" />
                  {st.word}
                </span>
              ) : (
                <span
                  className={cn("size-2.5 rounded-full", st.dot)}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setStep((n) => n + 1)}
        className="text-ui-sm bg-secondary hover:bg-background duration-fast mt-3 inline-flex h-9 items-center gap-2 rounded-lg px-3 transition-colors"
      >
        <RotateCw className="size-4" aria-hidden="true" />
        Re-check
      </button>
    </div>
  );
}

/* ── 3 · buttons that answer, and one that plainly cannot ─────────── */

function StatesPair({ after }: Side) {
  const [saved, setSaved] = useState(0);

  const base = "text-ui-sm inline-flex h-9 items-center rounded-lg px-3.5";
  const feedback = after
    ? "duration-fast ease-out-quart transition active:scale-95"
    : "";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSaved((n) => n + 1)}
          className={cn(
            base,
            feedback,
            "bg-primary text-primary-foreground",
            after && "hover:bg-primary/90",
          )}
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => setSaved((n) => n + 1)}
          className={cn(base, feedback, "bg-secondary", after && "hover:bg-background")}
        >
          Duplicate
        </button>
        <button
          type="button"
          disabled={after}
          className={cn(base, feedback, "bg-secondary", after && "opacity-50")}
        >
          Publish
        </button>
      </div>
      <Note>
        {after
          ? `Publish needs a title first. Saved ${saved} time(s).`
          : `Saved ${saved} time(s).`}
      </Note>
    </div>
  );
}

/* ── 4 · you can see it working ───────────────────────────────────── */

function LoadingPair({ after }: Side) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(0);

  const send = () => {
    if (after && sending) return;
    setSending(true);
    setTimeout(() => {
      setSent((n) => n + 1);
      setSending(false);
    }, 1100);
  };

  return (
    <div>
      <button
        type="button"
        onClick={send}
        disabled={after && sending}
        className={cn(
          "text-ui-sm bg-primary text-primary-foreground duration-fast inline-flex h-9 min-w-40 items-center justify-center gap-2 rounded-lg px-3.5 transition-colors",
          after && "disabled:opacity-70",
        )}
      >
        {after && sending ? (
          <>
            <Spinner className="size-4" />
            Sending…
          </>
        ) : (
          "Send invite"
        )}
      </button>
      <Note>
        {sent === 0
          ? "No invites sent yet."
          : `${sent} invite${sent === 1 ? "" : "s"} sent.`}
      </Note>
    </div>
  );
}

/* ── 5 · it waits until you have finished ─────────────────────────── */

function ValidationPair({ after }: Side) {
  const [value, setValue] = useState("");
  const [left, setLeft] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const show = value.length > 0 && !valid && (after ? left : true);

  return (
    <div className="max-w-sm">
      <label htmlFor="rams-email" className="text-ui-sm mb-1.5 block">
        Work email
      </label>
      <Input
        id="rams-email"
        type="email"
        value={value}
        placeholder="you@company.com"
        aria-invalid={show}
        onChange={(e) => {
          setValue(e.target.value);
          if (after) setLeft(false);
        }}
        onBlur={() => setLeft(true)}
        className="h-9"
      />
      <p
        className={cn(
          "text-caption mt-1.5",
          show ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {show
          ? "That does not look like an email address."
          : "We only use it to send the invite."}
      </p>
    </div>
  );
}

/* ── 6 · Enter works, and so does the icon ────────────────────────── */

const PEOPLE = ["Ines Duarte", "Marek Novak", "Priya Raman", "Tomas Lind"];

function SearchPair({ after }: Side) {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = submitted
    ? PEOPLE.filter((p) => p.toLowerCase().includes(submitted.toLowerCase()))
    : null;

  const run = () => setSubmitted(q.trim());

  const field = (
    <div className="bg-card focus-within:border-ring flex h-9 items-center gap-2 rounded-lg border px-2.5">
      {after ? (
        <button
          type="button"
          aria-label="Search"
          onClick={() => {
            inputRef.current?.focus();
            run();
          }}
          className="text-muted-foreground hover:text-foreground duration-fast -mx-1 flex h-9 items-center px-1 transition-colors"
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
      ) : (
        <Search className="text-muted-foreground size-4" aria-hidden="true" />
      )}
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Find a teammate"
        aria-label="Find a teammate"
        className="text-ui-sm placeholder:text-muted-foreground h-9 w-full bg-transparent outline-none"
      />
    </div>
  );

  return (
    <div className="max-w-sm">
      {after ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          {field}
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>
      ) : (
        field
      )}

      <button
        type="button"
        onClick={run}
        className="text-ui-sm bg-secondary hover:bg-background duration-fast mt-2 inline-flex h-9 items-center rounded-lg px-3.5 transition-colors"
      >
        Search
      </button>

      <div className="mt-3 min-h-16">
        {results === null ? (
          <p className="text-caption text-muted-foreground">
            {after
              ? "Type a name and press Enter."
              : "Type a name, then press the button."}
          </p>
        ) : results.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            Nobody matches “{submitted}”.
          </p>
        ) : (
          <ul className="text-ui-sm space-y-1">
            {results.map((p) => (
              <li key={p} className="text-muted-foreground">
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── 7 · you can change your mind ─────────────────────────────────── */

function DeletePair({ after }: Side) {
  const [gone, setGone] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (gone) {
    return (
      <div className="flex min-h-28 flex-col items-start justify-center gap-3">
        <p className="text-ui text-muted-foreground">Northwind is gone.</p>
        {after && (
          <button
            type="button"
            onClick={() => {
              setGone(false);
              setConfirming(false);
            }}
            className="text-ui-sm bg-secondary hover:bg-background duration-fast inline-flex h-9 items-center gap-2 rounded-lg px-3.5 transition-colors"
          >
            <Undo2 className="size-4" aria-hidden="true" />
            Undo
          </button>
        )}
      </div>
    );
  }

  const danger =
    "text-ui-sm text-destructive border-destructive/40 hover:bg-destructive/10 duration-fast inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 transition-colors";
  const quiet =
    "text-ui-sm bg-secondary hover:bg-background duration-fast inline-flex h-9 items-center rounded-lg px-3.5 transition-colors";

  return (
    <div className="min-h-28">
      <p className="text-ui font-medium">Northwind</p>
      <p className="text-caption text-muted-foreground">42 files · 3 members</p>

      {after ? (
        <div className="mt-4">
          {confirming && (
            <p className="text-ui-sm mb-3">
              Delete Northwind and its 42 files?
            </p>
          )}
          <div className="flex items-center justify-between gap-8">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={quiet}
            >
              {confirming ? "Keep it" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => (confirming ? setGone(true) : setConfirming(true))}
              className={danger}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {confirming ? "Delete" : "Delete project"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-1">
          <button
            type="button"
            className="text-ui-sm bg-secondary inline-flex h-9 items-center rounded-lg px-3.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setGone(true)}
            className="text-ui-sm bg-destructive text-primary-foreground inline-flex h-9 items-center gap-2 rounded-lg px-3.5"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete project
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 8 · an empty page that says something ────────────────────────── */

function EmptyPair({ after }: Side) {
  const [views, setViews] = useState<string[]>([]);
  const add = () => setViews((v) => [...v, `Untitled view ${v.length + 1}`]);

  return (
    <div className="bg-card rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-ui font-medium">Saved views</p>
        {!after && (
          <button
            type="button"
            aria-label="New view"
            onClick={add}
            className="text-muted-foreground hover:text-foreground duration-fast flex size-9 items-center justify-center rounded-lg transition-colors"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {views.length > 0 ? (
        <ul className="divide-y">
          {views.map((v) => (
            <li key={v} className="text-ui-sm px-4 py-3">
              {v}
            </li>
          ))}
        </ul>
      ) : after ? (
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <span className="bg-secondary mb-3 flex size-10 items-center justify-center rounded-full">
            <Search
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
          </span>
          <p className="text-ui font-medium">No saved views yet</p>
          <p className="text-caption text-muted-foreground mt-1 max-w-xs">
            Save a filter you use often and it will show up here.
          </p>
          <button
            type="button"
            onClick={add}
            className="text-ui-sm bg-primary text-primary-foreground hover:bg-primary/90 duration-fast mt-4 inline-flex h-9 items-center gap-2 rounded-lg px-3.5 transition-colors"
          >
            <Plus className="size-4" aria-hidden="true" />
            New view
          </button>
        </div>
      ) : (
        <div className="px-4 py-8">
          <p className="text-caption text-muted-foreground">No data</p>
        </div>
      )}
    </div>
  );
}

/* ── 9 · the row stops shuffling ──────────────────────────────────── */

const REVENUE = [9820, 12481, 9477, 13044, 10006, 8932];

function NumberPair({ after }: Side) {
  const [i, setI] = useState(0);
  const value = REVENUE[i % REVENUE.length];

  return (
    <div>
      <div className="bg-card rounded-xl border px-4 py-3">
        <p className="text-micro text-muted-foreground uppercase">This week</p>
        <div className="mt-1 flex items-baseline gap-2">
          {after ? (
            <span className="text-ui w-20 font-medium tabular-nums">
              <NumberFlow value={value} prefix="$" />
            </span>
          ) : (
            <span className="text-ui font-medium">
              ${value.toLocaleString("en-US")}
            </span>
          )}
          <span className="text-caption text-positive">▲ 2.4%</span>
          <span className="text-caption text-muted-foreground">
            vs last week
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setI((n) => n + 1)}
        className="text-ui-sm bg-secondary hover:bg-background duration-fast mt-3 inline-flex h-9 items-center gap-2 rounded-lg px-3 transition-colors"
      >
        <RotateCw className="size-4" aria-hidden="true" />
        Update
      </button>
    </div>
  );
}

/* ── 10 · the list is just there ──────────────────────────────────── */

const INBOX = [
  "Marek Novak · Contract signed",
  "Priya Raman · Re: Q3 forecast",
  "Ines Duarte · Design review notes",
  "Tomas Lind · Invoice #2214",
  "Anna Weber · Welcome aboard",
  "Luis Ortega · Access request",
];

function EntrancePair({ after }: Side) {
  const [run, setRun] = useState(0);
  const reduced = useReducedMotion();

  return (
    <div>
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="text-ui-sm bg-secondary hover:bg-background duration-fast mb-3 inline-flex h-9 items-center gap-2 rounded-lg px-3 transition-colors"
      >
        <RotateCw className="size-4" aria-hidden="true" />
        Load inbox
      </button>

      {run === 0 ? (
        <p className="text-caption text-muted-foreground">Press Load inbox.</p>
      ) : after ? (
        <motion.ul
          key={run}
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease: ease.outQuart }}
          className="bg-card divide-y rounded-xl border"
        >
          {INBOX.map((row) => (
            <li key={row} className="text-ui-sm px-4 py-2.5">
              {row}
            </li>
          ))}
        </motion.ul>
      ) : (
        <ul key={run} className="bg-card divide-y rounded-xl border">
          {INBOX.map((row, i) => (
            <motion.li
              key={row}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                ease: ease.inOutQuart,
                delay: i * 0.18,
              }}
              className="text-ui-sm px-4 py-2.5"
            >
              {row}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── 11 · a long name stays in its lane ───────────────────────────── */

const FILES = [
  {
    name: "Q3-financial-review-final-FINAL-v7-with-appendix-and-board-notes.pdf",
    size: "4.2 MB",
  },
  { name: "logo.svg", size: "12 KB" },
];

function TruncatePair({ after }: Side) {
  const [got, setGot] = useState<string | null>(null);

  return (
    <div className="max-w-md">
      <div className="bg-card divide-y overflow-hidden rounded-xl border">
        {FILES.map((f) => (
          <div key={f.name} className="flex items-center gap-3 px-4 py-3">
            <p
              title={f.name}
              className={cn(
                "text-ui-sm whitespace-nowrap",
                after && "min-w-0 flex-1 truncate",
              )}
            >
              {f.name}
            </p>
            <span className="text-caption text-muted-foreground ml-auto shrink-0 tabular-nums">
              {f.size}
            </span>
            <button
              type="button"
              aria-label={`Download ${f.name}`}
              onClick={() => setGot(f.name)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary duration-fast flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
            >
              <Download className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <Note>{got ? `Downloading ${got}` : "Both rows download."}</Note>
    </div>
  );
}

/* ── 12 · the number beats the decoration ─────────────────────────── */

const METRICS = [
  { id: "visits", label: "Visits", value: 18402 },
  { id: "signups", label: "Sign-ups", value: 1264 },
  { id: "revenue", label: "Revenue", value: 9820 },
];

function CraftPair({ after }: Side) {
  const [picked, setPicked] = useState("visits");

  if (!after) {
    return (
      <div className="relative">
        <div
          className="from-accent via-accent-solid to-feature absolute -inset-2 rounded-2xl bg-gradient-to-br opacity-40 blur-2xl"
          aria-hidden="true"
        />
        <div className="from-accent via-accent-solid to-feature relative rounded-sm bg-gradient-to-br p-1">
          <div className="flex items-center gap-2 px-2 py-2">
            <Sparkles
              className="text-primary-foreground size-8 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-ui text-primary-foreground font-semibold">
                Your Performance Dashboard
              </p>
              <p className="text-ui text-primary-foreground font-semibold opacity-80">
                Powerful insights at a glance
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3">
            {METRICS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPicked(m.id)}
                aria-pressed={picked === m.id}
                className={cn(
                  "bg-card/85 min-h-9 rounded-2xl p-1 text-left",
                  picked === m.id && "ring-primary-foreground/70 ring-2",
                )}
              >
                <p className="text-ui font-semibold">
                  {m.value.toLocaleString("en-US")}
                </p>
                <p className="text-ui font-semibold opacity-70">{m.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-micro text-muted-foreground uppercase">Last 30 days</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setPicked(m.id)}
            aria-pressed={picked === m.id}
            className={cn(
              "duration-fast rounded-lg border p-3 text-left transition-colors",
              picked === m.id
                ? "border-accent-solid bg-accent"
                : "hover:bg-secondary",
            )}
          >
            <p className="text-ui font-medium tabular-nums">
              {m.value.toLocaleString("en-US")}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              {m.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function RamsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="A setting and its name belong together. If they read as one line, the whole line should work as one thing."
        before={<RowPair after={false} />}
        after={<RowPair after />}
      />
      <BeforeAfter
        principle="Colour on its own is not a message. Someone glancing at the screen, or seeing red and green differently, should still know what is happening."
        before={<StatusPair after={false} />}
        after={<StatusPair after />}
      />
      <BeforeAfter
        principle="A control should answer the moment you touch it. One you are not allowed to use should look that way before you try it."
        before={<StatesPair after={false} />}
        after={<StatesPair after />}
      />
      <BeforeAfter
        principle="Anything that takes a moment has to say so. Silence makes people press again, and then it happens twice."
        before={<LoadingPair after={false} />}
        after={<LoadingPair after />}
      />
      <BeforeAfter
        principle="Nobody has finished typing after three letters. Wait until someone is done before telling them they got it wrong."
        before={<ValidationPair after={false} />}
        after={<ValidationPair after />}
      />
      <BeforeAfter
        principle="Anything that looks like part of the search box should behave like it — including the key everybody presses to search."
        before={<SearchPair after={false} />}
        after={<SearchPair after />}
      />
      <BeforeAfter
        principle="Something you cannot take back should cost more than one careless click, and it should sit well away from the safe choice."
        before={<DeletePair after={false} />}
        after={<DeletePair after />}
      />
      <BeforeAfter
        principle="A screen with nothing in it is still a screen. It should say what belongs here and how to put something here."
        before={<EmptyPair after={false} />}
        after={<EmptyPair after />}
      />
      <BeforeAfter
        principle="When a number changes, only the number should change. Everything around it stays exactly where it was."
        before={<NumberPair after={false} />}
        after={<NumberPair after />}
      />
      <BeforeAfter
        principle="One arrival per thing that arrives. When every line comes in on its own schedule, you end up waiting for something you already asked for."
        before={<EntrancePair after={false} />}
        after={<EntrancePair after />}
      />
      <BeforeAfter
        principle="A long name should shorten, not shove. The things beside it have jobs of their own."
        before={<TruncatePair after={false} />}
        after={<TruncatePair after />}
      />
      <BeforeAfter
        principle="Decoration should never outrank what you came to read. If the biggest, brightest thing on the card carries no information, it is in the way."
        before={<CraftPair after={false} />}
        after={<CraftPair after />}
      />
    </div>
  );
}
