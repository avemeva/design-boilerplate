"use client";

import NumberFlow from "@number-flow/react";
import { ArrowRight, Bell, Check, MapPin, Phone, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Orb } from "@/components/app/orb";
import { BeforeAfter, Micro, Tabs } from "@/components/surface";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * thesysdev/openui — the repository README.
 *
 * The README is a framework pitch, so the job was to find the claims a
 * person can actually feel. Read on 2026-08-05: the five core
 * capabilities (OpenUI Lang, built-in component libraries, prompt
 * generation from your library, streaming renderer, chat and app
 * surfaces), the four Lang properties (streaming output, token
 * efficiency, controlled rendering, typed component contracts), the
 * eleven packages, and the eight rows of the comparison table — of
 * which "Tokens 1x vs 3x", "Latency 4.9s vs 14.2s" and "Consistent
 * output" are the ones with a visible consequence.
 *
 * Each switch below is one of those. Left out: the package split, the
 * CLI, the browser bundle, the LangChain adapter, the Vue and Svelte
 * bindings, the benchmark methodology, adopters and licensing — all
 * real, none of it something a visitor could see change by pressing a
 * button.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/* ── chat furniture, identical on both sides ──────────────────────── */

function Ask({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="bg-secondary text-ui-sm max-w-xs rounded-2xl rounded-br-md px-3 py-2">
        {children}
      </p>
    </div>
  );
}

function Reply({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex gap-2.5">
      <Orb seed="openui-lang" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** A card the assistant put on the screen. Nested, so one step down. */
function ReplyCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("bg-secondary rounded-lg border p-4", className)}>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t py-2 first:border-t-0 first:pt-0">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-ui-sm">{value}</span>
    </div>
  );
}

/**
 * One clock, started from a click handler.
 *
 * Everything the two streaming switches show is derived from `t`, so
 * there is a single piece of state and nothing to keep in sync.
 */
function useClock(total: number) {
  const [t, setT] = useState(0);
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => stop, []);

  const start = () => {
    stop();
    const began = performance.now();
    setT(1);
    timer.current = window.setInterval(() => {
      const e = performance.now() - began;
      if (e >= total) {
        stop();
        setT(total);
      } else {
        setT(e);
      }
    }, 50);
  };

  const reset = () => {
    stop();
    setT(0);
  };

  return { t, start, reset, started: t > 0, done: t >= total };
}

/* ================================================================== *
 * 1. Only the things the app can really do
 *
 * README: "Controlled rendering — restrict output to the components you
 * define and register", plus "prompt generation from your component
 * library". Left to itself a model offers whatever sounds helpful.
 * ================================================================== */

const DAYS = [
  { id: "thu", label: "Thu 12" },
  { id: "fri", label: "Fri 13" },
  { id: "sat", label: "Sat 14" },
] as const;

type DayId = (typeof DAYS)[number]["id"];

const INVENTED = [
  { label: "Call the courier", icon: Phone, no: "This app has no phone line" },
  {
    label: "Open tracking dashboard",
    icon: MapPin,
    no: "There is no tracking dashboard",
  },
  {
    label: "Set a delivery alert",
    icon: Bell,
    no: "Delivery alerts do not exist here",
  },
] as const;

function DeadEnds() {
  return (
    <ReplyCard>
      <p className="text-ui-sm">Sure — here is what you can do about Friday.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {INVENTED.map((b) => (
          <Button
            key={b.label}
            size="lg"
            variant="secondary"
            onClick={() => toast.error(b.no)}
          >
            <b.icon aria-hidden="true" />
            {b.label}
          </Button>
        ))}
      </div>
    </ReplyCard>
  );
}

function RealControls() {
  const [day, setDay] = useState<DayId>("fri");
  const [moved, setMoved] = useState<string | null>(null);

  const label = DAYS.find((d) => d.id === day)?.label ?? "";

  return (
    <ReplyCard>
      {moved ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease: ease.outQuart }}
          className="flex items-center gap-2"
        >
          <span className="bg-card text-positive flex size-6 shrink-0 items-center justify-center rounded-full border">
            <Check className="size-3.5" aria-hidden="true" />
          </span>
          <p className="text-ui-sm">Delivery moved to {moved} March.</p>
          <Button
            size="lg"
            variant="ghost"
            className="ml-auto"
            onClick={() => setMoved(null)}
          >
            Change
          </Button>
        </motion.div>
      ) : (
        <>
          <p className="text-ui-sm">Pick a new delivery day.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tabs options={DAYS} value={day} onChange={setDay} />
            <Button
              size="lg"
              className="ml-auto"
              onClick={() => {
                setMoved(label);
                toast.success(`Delivery moved to ${label} March`);
              }}
            >
              Confirm
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </>
      )}
    </ReplyCard>
  );
}

function ControlsPair({ after }: Side) {
  return (
    <div>
      <Ask>Move my delivery to Friday.</Ask>
      <Reply>{after ? <RealControls /> : <DeadEnds />}</Reply>
    </div>
  );
}

/* ================================================================== *
 * 2. How long the same answer takes to arrive
 *
 * README comparison table: 4.9s against 14.2s at 60 tokens a second,
 * because the same screen costs about a third of the tokens. Scaled
 * down here; the ratio is the README's.
 * ================================================================== */

const ANSWER =
  "Revenue for the quarter came to $128,400, up 12% on the one before. March was the strongest month at $47,900. Two invoices are still open, worth $9,180 together.";

const WORDS = ANSWER.split(" ");

const SLOW = 5800;
const FAST = 2000;

function SpeedPair({ after }: Side) {
  const total = after ? FAST : SLOW;
  const clock = useClock(total);
  const ratio = Math.min(1, clock.t / total);
  const shown = Math.floor(ratio * WORDS.length);

  return (
    <div>
      <Ask>How did the quarter go?</Ask>
      <Reply>
        <div>
          <div className="flex items-center gap-2">
            <Micro>{clock.done ? "Answered in" : "Answering"}</Micro>
            <span className="text-caption text-muted-foreground tabular-nums">
              <NumberFlow
                value={Number((clock.t / 1000).toFixed(1))}
                format={{
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }}
              />
              s
            </span>
          </div>

          <p className="text-ui-sm mt-2 min-h-16">
            {WORDS.slice(0, shown).join(" ")}
            {clock.started && !clock.done && (
              <span className="bg-foreground ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 rounded-xs" />
            )}
          </p>

          <div className="mt-3">
            {clock.started ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={clock.reset}
                disabled={!clock.done}
              >
                Ask again
              </Button>
            ) : (
              <Button size="lg" onClick={clock.start}>
                <Send aria-hidden="true" />
                Send
              </Button>
            )}
          </div>
        </div>
      </Reply>
    </div>
  );
}

/* ================================================================== *
 * 3. Numbers you can see the shape of
 *
 * README: "Built-in component libraries — charts, forms, tables,
 * layouts, ready to use or extend."
 * ================================================================== */

const YEAR = [
  { m: "Jan", v: 31.2 },
  { m: "Feb", v: 28.9 },
  { m: "Mar", v: 47.9 },
  { m: "Apr", v: 36.4 },
  { m: "May", v: 34.1 },
  { m: "Jun", v: 44.8 },
  { m: "Jul", v: 29.7 },
  { m: "Aug", v: 33.5 },
  { m: "Sep", v: 41.6 },
  { m: "Oct", v: 38.2 },
  { m: "Nov", v: 46.3 },
  { m: "Dec", v: 52.7 },
];

const RANGES = [
  { id: "half", label: "6 months" },
  { id: "full", label: "12 months" },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

const revenueConfig = {
  v: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

function ChartPair({ after }: Side) {
  const [range, setRange] = useState<RangeId>("full");
  const data = range === "full" ? YEAR : YEAR.slice(6);
  const best = data.reduce((a, b) => (b.v > a.v ? b : a));

  return (
    <div>
      <Ask>How did revenue go this year?</Ask>
      <Reply>
        <div>
          <Tabs options={RANGES} value={range} onChange={setRange} />

          {after ? (
            <ChartContainer config={revenueConfig} className="mt-3 h-44 w-full">
              <BarChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="m"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(v: number) => `${v}k`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `$${Number(value).toFixed(1)}k`}
                    />
                  }
                />
                <Bar dataKey="v" fill="var(--color-v)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-ui-sm mt-3">
              {data.map((d, i) => (
                <span key={d.m}>
                  {i > 0 && ", "}
                  {d.m} ${d.v.toFixed(1)}k
                </span>
              ))}
              .
            </p>
          )}

          <p className="text-caption text-muted-foreground mt-3">
            Best month {best.m}, ${best.v.toFixed(1)}k.
          </p>
        </div>
      </Reply>
    </div>
  );
}

/* ================================================================== *
 * 4. Pieces arrive finished
 *
 * README: "Parse and render model output progressively in React as
 * tokens arrive." Progressive is not the same as half-built — a piece
 * is only put on screen once it is whole, and its space is held while
 * it is on the way.
 * ================================================================== */

const REFUND = {
  title: "Refund for order 8842",
  merchant: "Halcyon Design",
  method: "Visa ending 4417",
  amount: "$248.00",
};

const BUILD_MS = 2600;

/** Four pieces, each with the height it will end up occupying. */
const BLOCKS = [
  { at: 0.18, h: "h-6" },
  { at: 0.42, h: "h-9" },
  { at: 0.66, h: "h-9" },
  { at: 0.9, h: "h-9" },
];

function blockContent(i: number) {
  if (i === 0) return <p className="text-ui">{REFUND.title}</p>;
  if (i === 1) return <Row label="Merchant" value={REFUND.merchant} />;
  if (i === 2)
    return (
      <Row
        label="Amount"
        value={<span className="tabular-nums">{REFUND.amount}</span>}
      />
    );
  return <Row label="Back on card" value={REFUND.method} />;
}

/** The half-built version: text fills in character by character. */
function partialBlock(i: number, ratio: number) {
  const span = 0.24;
  const start = BLOCKS[i].at - span;
  const p = Math.max(0, Math.min(1, (ratio - start) / span));
  if (p <= 0) return null;

  const clip = (s: string) => s.slice(0, Math.ceil(s.length * p));

  if (i === 0) return <p className="text-ui">{clip(REFUND.title)}</p>;
  if (i === 1) return <Row label="Merchant" value={clip(REFUND.merchant)} />;
  if (i === 2)
    return (
      <Row
        label="Amount"
        value={<span className="tabular-nums">{clip(REFUND.amount)}</span>}
      />
    );
  return <Row label="Back on card" value={clip(REFUND.method)} />;
}

function BuildPair({ after }: Side) {
  const clock = useClock(BUILD_MS);
  const ratio = Math.min(1, clock.t / BUILD_MS);
  const followUpId = useId();

  return (
    <div>
      <Ask>Refund the Halcyon order.</Ask>
      <Reply>
        <div>
          <ReplyCard className="py-3">
            {BLOCKS.map((b, i) => {
              if (after) {
                return (
                  <div key={b.at} className={cn("flex items-center", b.h)}>
                    {ratio >= b.at ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: duration.fast,
                          ease: ease.outQuart,
                        }}
                        className="w-full"
                      >
                        {blockContent(i)}
                      </motion.div>
                    ) : (
                      <Skeleton className="h-3.5 w-full rounded-md" />
                    )}
                  </div>
                );
              }
              const bit = partialBlock(i, ratio);
              return bit ? (
                <div key={b.at} className="w-full">
                  {bit}
                </div>
              ) : null;
            })}
          </ReplyCard>

          {/* The row underneath. On one side it stays where you left it. */}
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <label htmlFor={followUpId} className="sr-only">
              Follow-up message
            </label>
            <Input
              id={followUpId}
              placeholder="Ask a follow-up…"
              className="h-9"
            />
            <Button
              size="lg"
              variant="secondary"
              onClick={clock.started ? clock.reset : clock.start}
            >
              {clock.started ? "Again" : "Answer"}
            </Button>
          </div>
        </div>
      </Reply>
    </div>
  );
}

/* ================================================================== *
 * 5. The same question, the same answer
 *
 * README comparison table, row "Consistent output". A registered set of
 * components can only be arranged one way; free text can be arranged a
 * new way every single time.
 * ================================================================== */

const OWED = {
  ref: "INV-4021",
  amount: "$1,240.00",
  due: "4 March",
  card: "Visa ending 4417",
};

function ShapePair({ after }: Side) {
  const [n, setN] = useState(1);
  const variant = (n - 1) % 3;

  return (
    <div>
      <Ask>What do I owe on INV-4021?</Ask>
      <Reply>
        <div>
          <Micro>Answer {n}</Micro>

          <div className="mt-2 min-h-36">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={after ? "steady" : `v${variant}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
              >
                {after ? (
                  <ReplyCard className="py-2">
                    <Row label="Invoice" value={OWED.ref} />
                    <Row
                      label="Amount"
                      value={<span className="tabular-nums">{OWED.amount}</span>}
                    />
                    <Row label="Due" value={OWED.due} />
                    <Row label="Card" value={OWED.card} />
                  </ReplyCard>
                ) : variant === 0 ? (
                  <p className="text-ui-sm">
                    You currently owe 1240 USD on invoice INV-4021. The due date
                    is the 4th of March, and the card we have on file is a Visa
                    ending 4417.
                  </p>
                ) : variant === 1 ? (
                  <ul className="text-ui-sm space-y-1">
                    <li>Due: 4 Mar</li>
                    <li>Card on file: Visa •••• 4417</li>
                    <li>Outstanding total: $1,240.00</li>
                    <li>Reference: INV-4021</li>
                  </ul>
                ) : (
                  <p className="text-ui-sm">
                    <span className="text-muted-foreground">Ref</span> INV-4021 ·{" "}
                    <span className="text-muted-foreground">Balance</span>{" "}
                    1,240.00 dollars ·{" "}
                    <span className="text-muted-foreground">Payable by</span>{" "}
                    March 4 · Visa (4417)
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <Button
            size="lg"
            variant="secondary"
            className="mt-3"
            onClick={() => setN((v) => v + 1)}
          >
            Ask again
          </Button>
        </div>
      </Reply>
    </div>
  );
}

/* ================================================================== *
 * 6. A list you can scan
 *
 * README: the built-in library ships tables. A table is not a run of
 * sentences that happen to contain numbers.
 * ================================================================== */

const PAYMENTS = [
  { who: "Northwind Ltd", when: "4 Mar", loose: "$1,240", v: 1240 },
  { who: "Halcyon Design", when: "2 Mar", loose: "$98.50", v: 98.5 },
  { who: "Bellweather Co", when: "27 Feb", loose: "$12,000", v: 12000 },
  { who: "Juniper Labs", when: "24 Feb", loose: "$7.25", v: 7.25 },
];

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "largest", label: "Largest" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const money = (v: number) =>
  v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

function TablePair({ after }: Side) {
  const [sort, setSort] = useState<SortId>("newest");
  const rows =
    sort === "largest" ? [...PAYMENTS].sort((a, b) => b.v - a.v) : PAYMENTS;
  const total = PAYMENTS.reduce((s, p) => s + p.v, 0);

  return (
    <div>
      <Ask>Show the last four payments.</Ask>
      <Reply>
        <div>
          <Tabs options={SORTS} value={sort} onChange={setSort} />

          {after ? (
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => (
                    <TableRow key={p.who}>
                      <TableCell className="text-ui-sm">{p.who}</TableCell>
                      <TableCell className="text-caption text-muted-foreground">
                        {p.when}
                      </TableCell>
                      <TableCell className="text-ui-sm text-right tabular-nums">
                        {money(p.v)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="text-caption text-muted-foreground">
                      Total
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-ui-sm text-right tabular-nums">
                      {money(total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              {rows.map((p) => (
                <p key={p.who} className="text-ui-sm">
                  {p.who} paid {p.loose} on {p.when}.
                </p>
              ))}
              <p className="text-ui-sm">That comes to $13,345.75 in total.</p>
            </div>
          )}
        </div>
      </Reply>
    </div>
  );
}

/* ================================================================== */

export function ThesysdevOpenuiDemo() {
  return (
    <div>
      <BeforeAfter
        principle="An assistant should only offer things the app can really do. A button that leads nowhere wastes your time, and it makes you doubt the ones that work."
        before={<ControlsPair after={false} />}
        after={<ControlsPair after />}
      />
      <BeforeAfter
        principle="Waiting is the worst part of asking. The same answer turning up in two seconds instead of six is the difference between using this and giving up on it."
        before={<SpeedPair after={false} />}
        after={<SpeedPair after />}
      />
      <BeforeAfter
        principle="A run of numbers in a sentence tells you nothing until you have read every one of them. The same numbers drawn out hand you the answer before you start reading."
        before={<ChartPair after={false} />}
        after={<ChartPair after />}
      />
      <BeforeAfter
        principle="Things should turn up finished. A price filling in one digit at a time, while everything below it slides down the page, is how people misread an amount and lose the box they were typing in."
        before={<BuildPair after={false} />}
        after={<BuildPair after />}
      />
      <BeforeAfter
        principle="Ask the same thing twice and it should come back the same way. When the answer is rearranged every time, you have to hunt for the number instead of just looking at it."
        before={<ShapePair after={false} />}
        after={<ShapePair after />}
      />
      <BeforeAfter
        principle="A list of payments is there to be scanned. When the amounts sit inside sentences and never line up, finding the big one means reading all of it."
        before={<TablePair after={false} />}
        after={<TablePair after />}
      />
    </div>
  );
}
