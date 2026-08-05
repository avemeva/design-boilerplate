"use client";

import NumberFlow from "@number-flow/react";
import {
  Check,
  ChevronDown,
  FileText,
  Lightbulb,
  Plus,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Orb } from "@/components/app/orb";
import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * OpenUI — openui.com.
 *
 * Built from the docs the site publishes as llms-full.txt: the OpenUI
 * Lang pages (streaming-first render, reactive $variables, queries and
 * mutations, incremental editing, validation dropping bad statements)
 * and the Agent Interface pages (generative UI in a chat reply,
 * artifacts, tools, conversations, welcome and starters).
 *
 * Every one of those that a person can *see* is a switch below. Left
 * out: the token-count benchmarks, the Zod component definitions, the
 * CLI, devtools, MCP docs, adapters and self-hosting — all real, none
 * of it something a visitor could feel by pressing a button.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/* ── chat furniture, identical on both sides ──────────────────────── */

function UserSays({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="bg-secondary text-ui-sm max-w-xs rounded-2xl rounded-br-md px-3 py-2">
        {children}
      </p>
    </div>
  );
}

function Assistant({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <Orb seed="openui-assistant" className="mt-1" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ── 1 · an answer you press instead of an answer you retype ──────── */

const EXPENSES = [
  { id: "E-204", what: "Figma seat, November", amount: 45 },
  { id: "E-205", what: "Flight to Lisbon", amount: 218 },
  { id: "E-206", what: "Domain renewal", amount: 12 },
] as const;

function ApprovePair({ after }: Side) {
  const uid = useId();
  const [done, setDone] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [missed, setMissed] = useState(false);

  const left = EXPENSES.length - done.length;

  const approve = (id: string) => {
    setDone((d) => (d.includes(id) ? d : [...d, id]));
  };

  const send = () => {
    const hit = EXPENSES.find(
      (e) => text.toUpperCase().includes(e.id) && !done.includes(e.id),
    );
    if (hit) {
      approve(hit.id);
      setText("");
      setMissed(false);
    } else {
      setMissed(true);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      <UserSays>Which expenses are waiting on me?</UserSays>

      <Assistant>
        <p className="text-ui-sm">Three expenses are waiting on you.</p>

        {after ? (
          <ul className="mt-3 divide-y rounded-lg border">
            {EXPENSES.map((e) => {
              const ok = done.includes(e.id);
              return (
                <li key={e.id} className="flex items-center gap-3 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-ui-sm truncate",
                        ok && "text-muted-foreground",
                      )}
                    >
                      {e.what}
                    </p>
                    <p className="text-caption text-muted-foreground tabular-nums">
                      {e.id} · ${e.amount}
                    </p>
                  </div>
                  {ok ? (
                    <span className="text-caption text-positive inline-flex items-center gap-1">
                      <Check aria-hidden className="size-3.5" strokeWidth={2} />
                      Approved
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      onClick={() => {
                        approve(e.id);
                      }}
                    >
                      Approve
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <>
            <ul className="text-ui-sm text-muted-foreground mt-2 space-y-1">
              {EXPENSES.map((e) => (
                <li key={e.id} className="tabular-nums">
                  {e.id} — {e.what} — ${e.amount}
                  {done.includes(e.id) && " (approved)"}
                </li>
              ))}
            </ul>
            <p className="text-caption text-muted-foreground mt-2">
              Reply with a code and the word approve.
            </p>
          </>
        )}
      </Assistant>

      {!after && (
        <div>
          <div className="flex gap-2">
            <label htmlFor={`${uid}-reply`} className="sr-only">
              Reply to the assistant
            </label>
            <Input
              id={`${uid}-reply`}
              className="h-9"
              value={text}
              placeholder="approve E-204"
              onChange={(e) => {
                setText(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <Button type="button" size="lg" onClick={send}>
              Send
            </Button>
          </div>
          {missed && (
            <p className="text-caption text-destructive mt-2">
              I could not find a code in that.
            </p>
          )}
        </div>
      )}

      <p className="text-caption text-muted-foreground tabular-nums">
        <NumberFlow value={left} /> still waiting
      </p>
    </div>
  );
}

/* ── 2 · the answer arrives in pieces, not in one lump ────────────── */

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const REVENUE = [42, 55, 38, 71, 64, 88] as const;
const SUM = REVENUE.reduce((a, b) => a + b, 0);
const STEPS = 2 + REVENUE.length + 1;

function StreamPair({ after }: Side) {
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (timer.current) clearInterval(timer.current);
    setTick(0);
    setRunning(true);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setTick(i);
      if (i >= STEPS) {
        if (timer.current) clearInterval(timer.current);
        setRunning(false);
      }
    }, 200);
  };

  const settled = tick >= STEPS;
  const shown = after ? tick : settled ? STEPS : 0;
  const bars = Math.max(0, Math.min(REVENUE.length, shown - 2));

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      <UserSays>How did revenue go this half?</UserSays>

      <Assistant>
        <div className="min-h-56">
          {shown === 0 ? (
            <div className="text-caption text-muted-foreground flex h-56 items-center gap-2">
              {running ? (
                <>
                  <Spinner className="size-4" />
                  Thinking…
                </>
              ) : (
                "Press Ask."
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-ui">Revenue, last six months</p>

              {shown >= 2 ? (
                <p className="text-title tabular-nums">
                  $<NumberFlow value={SUM} />k
                </p>
              ) : (
                <Skeleton className="h-7 w-28" />
              )}

              <div className="space-y-1.5">
                <div className="flex h-24 items-end gap-1.5">
                  {MONTHS.map((m, i) =>
                    i < bars ? (
                      <motion.div
                        key={m}
                        initial={{ height: 0 }}
                        animate={{ height: `${String(REVENUE[i])}%` }}
                        transition={spring.smooth}
                        className="bg-foreground/20 flex-1 rounded-t-md"
                      />
                    ) : (
                      <div
                        key={m}
                        className="bg-secondary h-1 flex-1 rounded-full"
                      />
                    ),
                  )}
                </div>
                <div className="flex gap-1.5">
                  {MONTHS.map((m) => (
                    <span
                      key={m}
                      className="text-micro text-muted-foreground flex-1 text-center uppercase"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {shown >= STEPS ? (
                <p className="text-caption text-muted-foreground">
                  December was the best month, at ${REVENUE[5]}k.
                </p>
              ) : (
                <Skeleton className="h-4 w-44" />
              )}
            </div>
          )}
        </div>
      </Assistant>

      <Button type="button" size="lg" variant="secondary" onClick={start}>
        {tick === 0 && !running ? "Ask" : "Ask again"}
      </Button>
    </div>
  );
}

/* ── 3 · the controls in the answer work on their own ─────────────── */

const RANGES = [
  { id: "7", label: "7 days", data: [12, 18, 9, 22, 17, 25, 19] },
  { id: "30", label: "30 days", data: [58, 71, 44, 92, 66, 80, 74] },
  { id: "90", label: "90 days", data: [180, 210, 165, 240, 198, 255, 221] },
] as const;

function RangePair({ after }: Side) {
  const [range, setRange] = useState(0);
  const [picked, setPicked] = useState(0);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const choose = (i: number) => {
    setPicked(i);
    if (after) {
      setRange(i);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setThinking(true);
    timer.current = setTimeout(() => {
      setRange(i);
      setThinking(false);
    }, 1100);
  };

  const data = RANGES[range].data;
  const top = Math.max(...data);
  const total = data.reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      <UserSays>Show me signups.</UserSays>

      <Assistant>
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-ui">Signups</p>
            <p className="text-ui text-muted-foreground tabular-nums">
              <NumberFlow value={total} />
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {RANGES.map((r, i) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={picked === i}
                onClick={() => {
                  choose(i);
                }}
                className={cn(
                  "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg px-3 transition-colors",
                  picked === i
                    ? "bg-feature text-feature-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="flex h-24 items-end gap-1.5">
              {data.map((v, i) => (
                <motion.div
                  key={`bar-${String(i)}`}
                  animate={{ height: `${String((v / top) * 100)}%` }}
                  transition={spring.smooth}
                  className="bg-foreground/20 flex-1 rounded-t-md"
                />
              ))}
            </div>
            <AnimatePresence>
              {thinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.fast, ease: ease.outQuart }}
                  className="bg-card/80 text-caption text-muted-foreground absolute inset-0 flex items-center justify-center gap-2"
                >
                  <Spinner aria-hidden className="size-4" />
                  Thinking…
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Assistant>
    </div>
  );
}

/* ── 4 · one more thing, without losing the rest ──────────────────── */

const TICKETS = [
  { t: "Card declined on renewal", s: "Open" },
  { t: "Export finishes but the file is empty", s: "Open" },
  { t: "Invite email never arrived", s: "Waiting" },
  { t: "Change the workspace owner", s: "Closed" },
  { t: "Seat count is off by one", s: "Closed" },
] as const;

const STATUSES = ["Open", "Waiting", "Closed"] as const;

function PatchPair({ after }: Side) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const add = () => {
    if (after) {
      setAdded(true);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setRebuilding(true);
    timer.current = setTimeout(() => {
      setAdded(true);
      setRebuilding(false);
      setQuery("");
    }, 1400);
  };

  const rows = TICKETS.filter((r) =>
    r.t.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      <div className="space-y-3 rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <p className="text-ui shrink-0">Tickets</p>
          <label htmlFor={`${uid}-q`} className="sr-only">
            Filter tickets
          </label>
          <Input
            id={`${uid}-q`}
            className="h-9"
            value={query}
            placeholder="Filter…"
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </div>

        {rebuilding ? (
          <div className="space-y-2 py-1">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-4/5" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {added && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={spring.smooth}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 pb-1">
                    {STATUSES.map((s) => {
                      const n = TICKETS.filter((r) => r.s === s).length;
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <span className="text-caption text-muted-foreground w-16 shrink-0">
                            {s}
                          </span>
                          <div
                            className="bg-foreground/20 h-2 rounded-full"
                            style={{
                              width: `${String((n / TICKETS.length) * 100)}%`,
                            }}
                          />
                          <span className="text-caption text-muted-foreground tabular-nums">
                            {n}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.t} className="flex h-9 items-center gap-3">
                  <span className="text-ui-sm min-w-0 flex-1 truncate">
                    {r.t}
                  </span>
                  <span className="text-micro text-muted-foreground bg-secondary shrink-0 rounded-full px-2 py-0.5 uppercase">
                    {r.s}
                  </span>
                </li>
              ))}
              {rows.length === 0 && (
                <li className="text-caption text-muted-foreground flex h-9 items-center">
                  Nothing matches that.
                </li>
              )}
            </ul>
          </>
        )}
      </div>

      {added ? (
        <p className="text-caption text-muted-foreground">
          Breakdown added above.
        </p>
      ) : (
        <Button
          type="button"
          size="lg"
          variant="secondary"
          disabled={rebuilding}
          onClick={add}
        >
          <Plus aria-hidden className="size-4" strokeWidth={1.5} />
          Add a status breakdown
        </Button>
      )}
    </div>
  );
}

/* ── 5 · one wrong line does not take the answer with it ──────────── */

const RAW = [
  "root = Stack([title, stats, note, cta])",
  'title = TextContent("Account summary", "large-heavy")',
  'stats = Stack([Stat("Seats", "12 of 20"), Stat("Plan", "Team")], "row")',
  'note = Paragraph("Renews on 3 March")',
  'cta = Button("Manage seats", "action:seats")',
] as const;

const STATS = [
  ["Seats", "12 of 20"],
  ["Plan", "Team"],
] as const;

function SalvagePair({ after }: Side) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      <UserSays>How many seats are we using?</UserSays>

      <Assistant>
        {after ? (
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-ui">Account summary</p>
            <div className="flex gap-3">
              {STATS.map(([k, v]) => (
                <div key={k} className="bg-secondary flex-1 rounded-lg p-2.5">
                  <p className="text-micro text-muted-foreground uppercase">
                    {k}
                  </p>
                  <p className="text-ui mt-0.5 tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => {
                toast("Seats", { description: "12 of 20 in use." });
              }}
            >
              Manage seats
            </Button>
          </div>
        ) : (
          <div className="border-destructive/30 rounded-lg border p-3">
            <p className="text-ui-sm text-destructive flex items-center gap-2">
              <TriangleAlert aria-hidden className="size-4" strokeWidth={1.5} />
              This reply could not be shown.
            </p>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => {
                setOpen((v) => !v);
              }}
              className="text-caption text-muted-foreground hover:text-foreground mt-2 inline-flex h-9 items-center gap-1"
            >
              <ChevronDown
                aria-hidden
                className={cn(
                  "duration-fast ease-out-quart size-4 transition-transform",
                  open && "rotate-180",
                )}
                strokeWidth={1.5}
              />
              Show what came back
            </button>
            {open && (
              <pre className="bg-secondary text-caption mt-1 overflow-x-auto rounded-lg p-2.5 font-mono">
                {RAW.join("\n")}
              </pre>
            )}
          </div>
        )}
      </Assistant>
    </div>
  );
}

/* ── 6 · the long thing gets its own place ────────────────────────── */

const REPORT = [
  ["Headline", "Q4 closed at $1.28M, eleven percent above the plan."],
  ["Revenue", "Growth came from renewals; new business was flat in November."],
  ["Costs", "Hosting fell after the migration; travel rose with two offsites."],
  ["Customers", "Churn held at 1.4 percent. Two of the top ten expanded."],
  ["Product", "Shipped the audit log, the export queue and the new invites."],
  ["Next", "Hiring two engineers and one designer in the first quarter."],
] as const;

function ArtifactPair({ after }: Side) {
  const [open, setOpen] = useState(false);

  const body = (
    <div className="space-y-3">
      {REPORT.map(([h, p]) => (
        <div key={h}>
          <p className="text-ui-sm">{h}</p>
          <p className="text-caption text-muted-foreground mt-0.5">{p}</p>
        </div>
      ))}
    </div>
  );

  if (after && open) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: duration.base, ease: ease.outQuart }}
        className="mx-auto w-full max-w-sm rounded-lg border"
      >
        <div className="flex items-center gap-2 border-b p-2.5">
          <FileText
            aria-hidden
            className="text-muted-foreground size-4"
            strokeWidth={1.5}
          />
          <p className="text-ui-sm flex-1 truncate">Q4 report</p>
          <button
            type="button"
            aria-label="Close the report"
            onClick={() => {
              setOpen(false);
            }}
            className="text-muted-foreground hover:bg-secondary grid size-9 shrink-0 place-items-center rounded-lg"
          >
            <X aria-hidden className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-3">{body}</div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      <UserSays>Write up Q4 for the board.</UserSays>

      <Assistant>
        <p className="text-ui-sm">Here is the write-up.</p>
        {after ? (
          <div className="mt-2 flex items-center gap-2.5 rounded-lg border p-2.5">
            <div className="bg-secondary grid size-9 shrink-0 place-items-center rounded-lg">
              <FileText
                aria-hidden
                className="text-muted-foreground size-4"
                strokeWidth={1.5}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-ui-sm truncate">Q4 report</p>
              <p className="text-caption text-muted-foreground">
                6 sections · updated just now
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => {
                setOpen(true);
              }}
            >
              Open
            </Button>
          </div>
        ) : (
          <div className="mt-2">{body}</div>
        )}
      </Assistant>

      <UserSays>And what did we spend?</UserSays>

      <Assistant>
        <p className="text-ui-sm">
          $412k, mostly hosting and travel. Hosting is already down this
          quarter.
        </p>
      </Assistant>
    </div>
  );
}

/* ── 7 · something to press before you have typed a word ──────────── */

const STARTERS = [
  ["Where is my order?", "It left the warehouse on Tuesday and lands Friday."],
  ["What did we spend last month?", "$1,240 — travel was two thirds of it."],
  ["Who is on the design team?", "Four people: Marta, Adam, Rui and Sofia."],
] as const;

function StartersPair({ after }: Side) {
  const uid = useId();
  const [msgs, setMsgs] = useState<{ id: string; you: string; back: string }[]>(
    [],
  );
  const [text, setText] = useState("");

  const send = (value: string) => {
    const v = value.trim();
    if (!v) return;
    const known = STARTERS.find(([s]) => s === v);
    setMsgs((m) => [
      ...m,
      {
        id: `${v}-${String(m.length)}`,
        you: v,
        back: known ? known[1] : "Looking that up for you now.",
      },
    ]);
    setText("");
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      <div className="min-h-56 space-y-3">
        {msgs.map((m) => (
          <div key={m.id} className="space-y-3">
            <UserSays>{m.you}</UserSays>
            <Assistant>
              <p className="text-ui-sm">{m.back}</p>
            </Assistant>
          </div>
        ))}

        {msgs.length === 0 && !after && <div className="h-56" />}

        {msgs.length === 0 && after && (
          <div className="flex h-56 flex-col items-center justify-center text-center">
            <Orb seed="openui-welcome" size="lg" />
            <p className="text-ui mt-3">What can I look up for you?</p>
            <p className="text-caption text-muted-foreground mt-1">
              Ask about orders, spending or your team.
            </p>
            <div className="mt-4 w-full space-y-1.5">
              {STARTERS.map(([s]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    send(s);
                  }}
                  className="bg-secondary text-ui-sm hover:text-foreground text-muted-foreground duration-fast ease-out-quart flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left transition-colors"
                >
                  <Lightbulb
                    aria-hidden
                    className="size-4 shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <label htmlFor={`${uid}-composer`} className="sr-only">
          Send a message
        </label>
        <Input
          id={`${uid}-composer`}
          className="h-9"
          value={text}
          placeholder="Send a message"
          onChange={(e) => {
            setText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(text);
          }}
        />
        <Button
          type="button"
          size="icon-lg"
          aria-label="Send"
          onClick={() => {
            send(text);
          }}
        >
          <Send aria-hidden className="size-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function OpenuiDemo() {
  return (
    <div>
      <BeforeAfter
        principle="An assistant can answer with something you act on rather than something you read. If three expenses are waiting on you, the reply itself should be where you approve them — not a list you type codes back into."
        before={<ApprovePair after={false} />}
        after={<ApprovePair after />}
      />
      <BeforeAfter
        principle="An answer that takes two seconds to arrive can still start appearing in the first fraction of a second. The wait is the same length either way; watching it take shape is what makes it feel short."
        before={<StreamPair after={false} />}
        after={<StreamPair after />}
      />
      <BeforeAfter
        principle="Once an answer has been put together, the controls inside it should keep working on their own. Changing the range is not a new question, so it should happen the instant you press it."
        before={<RangePair after={false} />}
        after={<RangePair after />}
      />
      <BeforeAfter
        principle="When you ask for one more thing, only that thing should change. Everything you had already done inside the answer — including whatever you typed — stays where you left it."
        before={<PatchPair after={false} />}
        after={<PatchPair after />}
      />
      <BeforeAfter
        principle="Assistants get small parts of an answer wrong. When one piece is broken, the rest should still arrive and still work, instead of the whole reply vanishing behind an error."
        before={<SalvagePair after={false} />}
        after={<SalvagePair after />}
      />
      <BeforeAfter
        principle="Some answers are documents rather than messages. A long write-up needs its own place to be opened and returned to, instead of burying the conversation it came from."
        before={<ArtifactPair after={false} />}
        after={<ArtifactPair after />}
      />
      <BeforeAfter
        principle="An empty chat asks you to think of something before it will do anything. A few real questions to press is often the difference between using it and closing it."
        before={<StartersPair after={false} />}
        after={<StartersPair after />}
      />
    </div>
  );
}
