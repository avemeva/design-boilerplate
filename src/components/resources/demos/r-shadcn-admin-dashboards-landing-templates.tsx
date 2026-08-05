"use client";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Plus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { BeforeAfter, Micro, Tabs } from "@/components/surface";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * PaceUI (paceui.com) is a registry, not a document, so its "content" is
 * what it actually ships. Read off the live site on 2026-08-05:
 *
 *   30 free blocks   — 6 charts, 4 stat cards, 4 analytics widgets,
 *                      2 tables, 2 generic widgets, 4 marketing blocks,
 *                      plus education / project / finance / health /
 *                      promo / notification / profile / language.
 *   22 motion components under /components/motion.
 *   31 block categories across dashboard, app, layout and marketing.
 *    4 templates (Ultimate Admin, Free Admin, AI Support SaaS,
 *      Personal Portfolio) and 3 chart routes including the studio.
 *
 * The marketing half of that list is covered elsewhere on this site, and
 * the registry is gated anyway (`/r/hero-section.json` answers 401), so
 * every switch below is one of its *dashboard* blocks, rebuilt twice
 * from this project's own primitives and tokens: the version a normal
 * product ships, and the version worth paying for. Same data on both
 * sides, same spot, both operable.
 */

/* ── shared ───────────────────────────────────────────────────────── */

/** setTimeout that cleans itself up. No state is ever set in an effect. */
function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
    },
    [],
  );

  return useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
}

function Frame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl", className)}>{children}</div>
  );
}

const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

/* ── 1. chart: revenue trend ──────────────────────────────────────── */

const TREND = [
  { w: "Wk 1", revenue: 31400 },
  { w: "Wk 2", revenue: 33800 },
  { w: "Wk 3", revenue: 32100 },
  { w: "Wk 4", revenue: 36900 },
  { w: "Wk 5", revenue: 35200 },
  { w: "Wk 6", revenue: 39400 },
  { w: "Wk 7", revenue: 41100 },
  { w: "Wk 8", revenue: 40300 },
  { w: "Wk 9", revenue: 43800 },
  { w: "Wk 10", revenue: 45600 },
  { w: "Wk 11", revenue: 44200 },
  { w: "Wk 12", revenue: 48210 },
] as const;

const RANGES = [
  { id: "8", label: "Last 8 weeks" },
  { id: "12", label: "Last 12 weeks" },
] as const;

const trendConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

function TrendChart({ mute }: { mute: boolean }) {
  const [range, setRange] = useState<"8" | "12">("12");
  const data = TREND.slice(TREND.length - Number(range));

  return (
    <Frame>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Micro>Revenue</Micro>
          <p className="text-title mt-1 tabular-nums">{money(48210)}</p>
        </div>
        <Tabs options={RANGES} value={range} onChange={setRange} />
      </div>

      <ChartContainer config={trendConfig} className="mt-4 h-48 w-full">
        <LineChart data={[...data]} margin={{ left: 4, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="w"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          {!mute && (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => money(Number(value))}
                />
              }
            />
          )}
          <Line
            dataKey="revenue"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={false}
            activeDot={mute ? false : { r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </Frame>
  );
}

/* ── 2. chart: profit by month ────────────────────────────────────── */

const MONTHS = [
  { m: "Mar", profit: 41200 },
  { m: "Apr", profit: 42800 },
  { m: "May", profit: 40900 },
  { m: "Jun", profit: 43500 },
  { m: "Jul", profit: 42100 },
  { m: "Aug", profit: 44000 },
] as const;

const SPREAD =
  Math.max(...MONTHS.map((x) => x.profit)) -
  Math.min(...MONTHS.map((x) => x.profit));

const profitConfig = {
  profit: { label: "Profit", color: "var(--chart-1)" },
} satisfies ChartConfig;

function ProfitChart({ cropped }: { cropped: boolean }) {
  const [picked, setPicked] = useState("Jun");
  const row = MONTHS.find((x) => x.m === picked) ?? MONTHS[0];

  return (
    <Frame>
      <Micro>Profit by month</Micro>

      <ChartContainer config={profitConfig} className="mt-3 h-44 w-full">
        <BarChart data={[...MONTHS]} margin={{ left: 4, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="m" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            domain={
              (cropped ? [40000, 44500] : [0, 48000]) as [number, number]
            }
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <Bar dataKey="profit" radius={4} isAnimationActive={false}>
            {MONTHS.map((x) => (
              <Cell
                key={x.m}
                fill={x.m === picked ? "var(--color-profit)" : "var(--muted)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {MONTHS.map((x) => (
          <button
            key={x.m}
            type="button"
            aria-pressed={x.m === picked}
            onClick={() => setPicked(x.m)}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg px-3 transition-colors",
              x.m === picked
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {x.m}
          </button>
        ))}
      </div>

      <p className="text-caption text-muted-foreground mt-2">
        {row.m} made <span className="text-foreground">{money(row.profit)}</span>
        . Best to worst, the six months are {money(SPREAD)} apart.
      </p>
    </Frame>
  );
}

/* ── 3. stat card ─────────────────────────────────────────────────── */

const METRICS = [
  {
    id: "mrr",
    label: "Monthly revenue",
    values: [
      38.2, 39.1, 38.6, 40.4, 41.2, 40.8, 42.6, 43.9, 43.1, 45.2, 46.8, 48.2,
    ],
    format: (n: number) => money(n * 1000),
  },
  {
    id: "users",
    label: "Active accounts",
    values: [
      940, 968, 1002, 995, 1041, 1077, 1064, 1112, 1150, 1163, 1188, 1204,
    ],
    format: (n: number) => n.toLocaleString("en-US"),
  },
  {
    id: "churn",
    label: "Churn",
    values: [3.4, 3.2, 3.3, 2.9, 2.8, 2.9, 2.6, 2.4, 2.5, 2.2, 2.0, 1.8],
    format: (n: number) => `${n.toFixed(1)}%`,
  },
] as const;

const METRIC_TABS = METRICS.map((m) => ({ id: m.id, label: m.label }));

/** NumberFlow wants the real quantity plus an Intl format, not a string. */
function flowProps(id: string, n: number) {
  if (id === "mrr")
    return {
      value: n * 1000,
      format: {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      } as const,
    };
  if (id === "churn")
    return {
      value: n / 100,
      format: { style: "percent", maximumFractionDigits: 1 } as const,
    };
  return { value: n, format: { maximumFractionDigits: 0 } as const };
}

function Spark({ values }: { values: readonly number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 100},${26 - ((v - min) / span) * 22}`,
    )
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="mt-4 h-7 w-full"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-chart-1"
      />
    </svg>
  );
}

function StatCard({ flat }: { flat: boolean }) {
  const [id, setId] = useState<string>("mrr");
  const metric = METRICS.find((m) => m.id === id) ?? METRICS[0];
  const values = metric.values;
  const now = values[values.length - 1];
  const prev = values[values.length - 2];
  const change = ((now - prev) / prev) * 100;
  const up = change >= 0;
  const good = metric.id === "churn" ? !up : up;

  return (
    <Frame className="max-w-md">
      <Tabs options={METRIC_TABS} value={id} onChange={setId} />

      <div className="mt-3 rounded-xl border p-5">
        <Micro>{metric.label}</Micro>

        {flat ? (
          <>
            <p className="text-title mt-2">{metric.format(now)}</p>
            <p className="text-caption text-muted-foreground mt-2">
              {change.toFixed(1)}% change
            </p>
          </>
        ) : (
          <>
            <NumberFlow
              locales="en-US"
              className="text-title mt-2 block tabular-nums"
              {...flowProps(metric.id, now)}
            />
            <p className="text-caption mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5",
                  good ? "text-positive" : "text-destructive",
                )}
              >
                {up ? (
                  <ArrowUp className="size-3.5" aria-hidden />
                ) : (
                  <ArrowDown className="size-3.5" aria-hidden />
                )}
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">
                on the week before, over 12 weeks
              </span>
            </p>
            <Spark values={values} />
          </>
        )}
      </div>
    </Frame>
  );
}

/* ── 4. table: team members ───────────────────────────────────────── */

type Member = {
  name: string;
  role: string;
  team: "design" | "engineering";
  status: "Active" | "Invited" | "Away";
  tasks: number;
  hours: number;
};

const MEMBERS: Member[] = [
  {
    name: "Priya Raman",
    role: "Design lead",
    team: "design",
    status: "Active",
    tasks: 12,
    hours: 31.5,
  },
  {
    name: "Tomás Okafor",
    role: "Engineer",
    team: "engineering",
    status: "Active",
    tasks: 47,
    hours: 6.25,
  },
  {
    name: "Lena Fischer",
    role: "Product designer",
    team: "design",
    status: "Away",
    tasks: 3,
    hours: 18,
  },
  {
    name: "Sam Whitlock",
    role: "Platform engineer",
    team: "engineering",
    status: "Invited",
    tasks: 21,
    hours: 2.75,
  },
  {
    name: "Adaeze Nwosu",
    role: "Engineer",
    team: "engineering",
    status: "Active",
    tasks: 8,
    hours: 44,
  },
];

const TEAM_TABS = [
  { id: "all", label: "Everyone" },
  { id: "design", label: "Design" },
  { id: "engineering", label: "Engineering" },
] as const;

type SortKey = "name" | "role" | "tasks" | "hours";

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "name", label: "Member", numeric: false },
  { key: "role", label: "Role", numeric: false },
  { key: "tasks", label: "Open tasks", numeric: true },
  { key: "hours", label: "Hours this week", numeric: true },
];

function TeamTable({ dead }: { dead: boolean }) {
  const [team, setTeam] = useState<(typeof TEAM_TABS)[number]["id"]>("all");
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: "name",
    asc: true,
  });

  const rows = useMemo(() => {
    const filtered = MEMBERS.filter((m) => team === "all" || m.team === team);
    if (dead) return filtered;
    const dir = sort.asc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
      return String(x).localeCompare(String(y)) * dir;
    });
  }, [team, sort, dead]);

  return (
    <Frame>
      <Tabs options={TEAM_TABS} value={team} onChange={setTeam} />

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-96">
          <thead>
            <tr className="border-b">
              {COLUMNS.map((c) => {
                const active = !dead && sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={
                      active ? (sort.asc ? "ascending" : "descending") : "none"
                    }
                    className={cn(
                      "px-2 first:pl-0 last:pr-0",
                      !dead && c.numeric && "text-right",
                    )}
                  >
                    {dead ? (
                      <span className="text-micro text-muted-foreground flex h-9 items-center uppercase">
                        {c.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setSort((s) =>
                            s.key === c.key
                              ? { key: c.key, asc: !s.asc }
                              : { key: c.key, asc: true },
                          )
                        }
                        className={cn(
                          "text-micro duration-fast ease-out-quart flex h-9 w-full items-center gap-1 uppercase transition-colors",
                          c.numeric && "justify-end",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {c.label}
                        {active ? (
                          sort.asc ? (
                            <ChevronUp className="size-3" aria-hidden />
                          ) : (
                            <ChevronDown className="size-3" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown
                            className="size-3 opacity-50"
                            aria-hidden
                          />
                        )}
                      </button>
                    )}
                  </th>
                );
              })}
              <th scope="col" className="px-2 last:pr-0">
                <span className="text-micro text-muted-foreground flex h-9 items-center uppercase">
                  Status
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.name} className="border-b last:border-0">
                <td className="text-ui-sm px-2 py-3 first:pl-0">{m.name}</td>
                <td className="text-caption text-muted-foreground px-2 py-3">
                  {m.role}
                </td>
                <td
                  className={cn(
                    "text-ui-sm px-2 py-3",
                    dead ? "" : "text-right tabular-nums",
                  )}
                >
                  {m.tasks}
                </td>
                <td
                  className={cn(
                    "text-ui-sm px-2 py-3",
                    dead ? "" : "text-right tabular-nums",
                  )}
                >
                  {dead ? m.hours : m.hours.toFixed(2)}
                </td>
                <td className="px-2 py-3 last:pr-0">
                  <span className="text-micro text-muted-foreground bg-secondary inline-flex items-center rounded-full px-2.5 py-1 uppercase">
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

/* ── 5. activity stream ───────────────────────────────────────────── */

const BASE_MS = Date.UTC(2026, 7, 5, 14, 44, 0);

type Event = { id: number; text: string; kind: "ok" | "warn" | "bad"; mins: number };

const EVENTS: Event[] = [
  { id: 1, text: "Deploy 4f21c9 finished", kind: "ok", mins: 12 },
  { id: 2, text: "Payment webhook retried twice", kind: "warn", mins: 74 },
  { id: 3, text: "Invoice 8841 failed to send", kind: "bad", mins: 168 },
  { id: 4, text: "Nightly backup completed", kind: "ok", mins: 1_020 },
  { id: 5, text: "Rate limit hit on /v1/search", kind: "warn", mins: 1_610 },
];

const NEW_EVENTS = [
  { text: "Northwind Traders paid invoice 9014", kind: "ok" as const },
  { text: "Queue depth above 500", kind: "warn" as const },
  { text: "Sign-in failed five times for ada@", kind: "bad" as const },
];

const stamp = (mins: number) => new Date(BASE_MS - mins * 60_000);

function exact(mins: number) {
  return stamp(mins).toISOString().replace(".000", "");
}

function relative(mins: number) {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (mins < 1_440) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.round(mins / 1_440);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}

const DOT = {
  ok: "bg-positive",
  warn: "bg-chart-4",
  bad: "bg-destructive",
} as const;

function ActivityStream({ raw }: { raw: boolean }) {
  const [events, setEvents] = useState(EVENTS);
  const nextIndex = useRef(0);

  function add() {
    const seed = NEW_EVENTS[nextIndex.current % NEW_EVENTS.length];
    nextIndex.current += 1;
    setEvents((e) => [
      { id: Date.now(), text: seed.text, kind: seed.kind, mins: 0 },
      ...e,
    ]);
  }

  const groups = raw
    ? [{ heading: null as string | null, items: events }]
    : [
        { heading: "Today", items: events.filter((e) => e.mins < 880) },
        { heading: "Yesterday", items: events.filter((e) => e.mins >= 880) },
      ].filter((g) => g.items.length > 0);

  return (
    <Frame>
      <div className="flex items-center justify-between gap-3">
        <Micro>Activity</Micro>
        <Button size="lg" variant="secondary" onClick={add}>
          <Plus aria-hidden />
          New event
        </Button>
      </div>

      <div className="mt-3">
        {groups.map((g) => (
          <div key={g.heading ?? "all"}>
            {g.heading && (
              <p className="text-micro text-muted-foreground border-b py-2 uppercase">
                {g.heading}
              </p>
            )}
            <AnimatePresence initial={false}>
              {g.items.map((e) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: duration.base, ease: ease.outQuart }}
                  className="flex items-center gap-3 border-b py-3 last:border-0"
                >
                  {raw ? (
                    <span className="text-caption text-muted-foreground">
                      [{e.kind.toUpperCase()}]
                    </span>
                  ) : (
                    <span
                      className={cn("size-1.5 shrink-0 rounded-full", DOT[e.kind])}
                      aria-hidden
                    />
                  )}

                  <span className="text-ui-sm min-w-0 flex-1 truncate">
                    {e.text}
                  </span>

                  {raw ? (
                    <span className="text-caption text-muted-foreground font-mono">
                      {exact(e.mins)}
                    </span>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-caption text-muted-foreground shrink-0 tabular-nums">
                            {relative(e.mins)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{exact(e.mins)}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ── 6. notifications ─────────────────────────────────────────────── */

const NOTES = [
  { id: "n1", title: "Halden & Co is 12 days overdue", meta: "Billing" },
  { id: "n2", title: "Lena Fischer joined the workspace", meta: "Team" },
  { id: "n3", title: "Two seats left on your plan", meta: "Billing" },
  { id: "n4", title: "Export finished — 4,812 rows", meta: "Reports" },
  { id: "n5", title: "API key rotates in 3 days", meta: "Security" },
] as const;

function Notifications({ stuck }: { stuck: boolean }) {
  const [read, setRead] = useState<string[]>([]);
  const unread = stuck ? NOTES.length : NOTES.length - read.length;

  return (
    <Frame className="max-w-md">
      <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
        <span className="text-ui-sm">Workspace</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="lg">
              <Bell className="text-muted-foreground" aria-hidden />
              Notifications
              {unread > 0 && (
                <span className="bg-accent text-accent-foreground text-micro ml-0.5 flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 tabular-nums">
                  {stuck ? (
                    NOTES.length
                  ) : (
                    <NumberFlow value={unread} locales="en-US" />
                  )}
                </span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
              <Micro>
                {unread > 0 ? `${unread} unread` : "You are all caught up"}
              </Micro>
              {!stuck && unread > 0 && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-caption text-muted-foreground"
                  onClick={() => setRead(NOTES.map((n) => n.id))}
                >
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {NOTES.map((n) => {
                const isRead = !stuck && read.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (stuck) {
                        toast(n.title);
                        return;
                      }
                      setRead((r) => (r.includes(n.id) ? r : [...r, n.id]));
                    }}
                    className="hover:bg-secondary duration-fast ease-out-quart flex w-full items-start gap-2.5 border-b px-3 py-3 text-left transition-colors last:border-0"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        stuck || !isRead ? "bg-accent-solid" : "bg-transparent",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "text-ui-sm block",
                          isRead && "text-muted-foreground",
                        )}
                      >
                        {n.title}
                      </span>
                      <span className="text-caption text-muted-foreground block">
                        {n.meta}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </Frame>
  );
}

/* ── 7. allocation ────────────────────────────────────────────────── */

const HOLDINGS = [
  { id: "gold", name: "Gold", amount: 42_400, bar: "bg-chart-1" },
  { id: "silver", name: "Silver", amount: 28_100, bar: "bg-chart-2" },
  { id: "crude", name: "Crude oil", amount: 17_900, bar: "bg-chart-3" },
  { id: "cash", name: "Cash", amount: 11_600, bar: "bg-chart-4" },
] as const;

const TOTAL = HOLDINGS.reduce((s, h) => s + h.amount, 0);

function Allocation({ split }: { split: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <Frame className="max-w-md">
      <Micro>Portfolio</Micro>

      {!split && (
        <div className="mt-3 flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
          {HOLDINGS.map((h) => (
            <div
              key={h.id}
              style={{ flexGrow: h.amount }}
              className={cn(
                "duration-fast ease-out-quart h-full rounded-full transition-opacity",
                h.bar,
                picked && picked !== h.id && "opacity-25",
              )}
            />
          ))}
        </div>
      )}

      <div className="mt-4">
        {HOLDINGS.map((h) => {
          const share = (h.amount / TOTAL) * 100;
          const isPicked = picked === h.id;
          return (
            <button
              key={h.id}
              type="button"
              aria-pressed={isPicked}
              onClick={() => setPicked(isPicked ? null : h.id)}
              className={cn(
                "duration-fast ease-out-quart w-full rounded-lg px-2 py-2 text-left transition-colors",
                isPicked ? "bg-secondary" : "hover:bg-secondary",
              )}
            >
              {split ? (
                <>
                  <span className="text-ui-sm flex min-h-5 items-center">
                    {h.name}
                  </span>
                  <span className="bg-muted mt-2 block h-2 w-full overflow-hidden rounded-full">
                    <span
                      className={cn("block h-full rounded-full", h.bar)}
                      style={{ width: `${share}%` }}
                    />
                  </span>
                  <span className="text-caption text-muted-foreground mt-1 block">
                    {share.toFixed(1)}% of the portfolio
                  </span>
                </>
              ) : (
                <span className="flex min-h-5 items-center gap-2.5">
                  <span
                    className={cn("size-2 shrink-0 rounded-full", h.bar)}
                    aria-hidden
                  />
                  <span className="text-ui-sm min-w-0 flex-1 truncate">
                    {h.name}
                  </span>
                  <span className="text-ui-sm shrink-0 tabular-nums">
                    {money(h.amount)}
                  </span>
                  <span className="text-caption text-muted-foreground w-12 shrink-0 text-right tabular-nums">
                    {share.toFixed(0)}%
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Frame>
  );
}

/* ── 8. seat picker ───────────────────────────────────────────────── */

const ROWS = ["A", "B", "C", "D"] as const;
const SEATS = [1, 2, 3, 4, 5, 6] as const;
const TAKEN = new Set([
  "A2",
  "A3",
  "B1",
  "B5",
  "B6",
  "C3",
  "C4",
  "D2",
  "D5",
]);
const SEAT_PRICE = 14;

function SeatPicker({ vague }: { vague: boolean }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const total = chosen.length * SEAT_PRICE;

  function press(id: string) {
    if (TAKEN.has(id)) {
      if (vague) {
        setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
      }
      return;
    }
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  function book() {
    const clash = chosen.filter((id) => TAKEN.has(id));
    if (clash.length > 0) {
      toast(`${clash.join(", ")} ${clash.length === 1 ? "is" : "are"} already taken`);
      return;
    }
    if (chosen.length === 0) {
      toast("Pick a seat first");
      return;
    }
    toast(`Booked ${chosen.length} ${chosen.length === 1 ? "seat" : "seats"}`);
  }

  return (
    <Frame className="max-w-sm">
      <Micro>Pick your seats</Micro>

      <div className="mt-3 space-y-1.5">
        {ROWS.map((r) => (
          <div key={r} className="flex items-center gap-1.5">
            <span className="text-caption text-muted-foreground w-4 shrink-0 tabular-nums">
              {r}
            </span>
            {SEATS.map((n) => {
              const id = `${r}${n}`;
              const taken = TAKEN.has(id);
              const picked = chosen.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={
                    vague
                      ? `Seat ${id}`
                      : taken
                        ? `Seat ${id}, already taken`
                        : `Seat ${id}, ${picked ? "selected" : "free"}`
                  }
                  aria-pressed={vague || !taken ? picked : undefined}
                  aria-disabled={!vague && taken ? true : undefined}
                  onClick={() => press(id)}
                  className={cn(
                    "text-caption duration-fast ease-out-quart h-9 flex-1 rounded-lg transition-colors",
                    vague
                      ? picked
                        ? "bg-muted text-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-muted"
                      : taken
                        ? "bg-muted text-muted-foreground/50 cursor-not-allowed line-through"
                        : picked
                          ? "bg-feature text-feature-foreground"
                          : "bg-secondary text-foreground hover:bg-muted",
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {!vague && (
        <div className="text-caption text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="bg-secondary size-2.5 rounded-sm" aria-hidden />
            Free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-feature size-2.5 rounded-sm" aria-hidden />
            Yours
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-muted size-2.5 rounded-sm" aria-hidden />
            Taken
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
        {vague ? (
          <p className="text-ui-sm">Total ${total}</p>
        ) : (
          <p className="text-ui-sm flex items-baseline gap-1.5">
            <NumberFlow
              value={total}
              locales="en-US"
              format={{
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }}
              className="tabular-nums"
            />
            <span className="text-caption text-muted-foreground">
              {chosen.length} {chosen.length === 1 ? "seat" : "seats"}
            </span>
          </p>
        )}
        <Button size="lg" onClick={book}>
          Book
        </Button>
      </div>
    </Frame>
  );
}

/* ── 9. upgrade promo ─────────────────────────────────────────────── */

function Promo({ shouty }: { shouty: boolean }) {
  const [gone, setGone] = useState(false);
  const after = useTimers();

  return (
    <Frame className="max-w-md">
      <AnimatePresence initial={false} mode="popLayout">
        {gone ? (
          <motion.div
            key="gone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="flex items-center justify-between gap-3 py-2"
          >
            <p className="text-caption text-muted-foreground">
              Hidden for now.
            </p>
            <Button size="lg" variant="secondary" onClick={() => setGone(false)}>
              Undo
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="promo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
          >
            {shouty ? (
              <div className="bg-feature text-feature-foreground rounded-xl p-6 text-center">
                <p className="text-title">Unlock premium analytics</p>
                <p className="text-body mt-2 opacity-80">
                  Historical data, cohort splits and unlimited exports. Two
                  years of history, from the day you upgrade.
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  className="mt-5 w-full"
                  onClick={() => {
                    after(() => toast("Opening the plans"), 200);
                  }}
                >
                  Upgrade now
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Micro>Pro</Micro>
                    <p className="text-ui-sm mt-1.5">
                      Two years of history, cohort splits and unlimited exports.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Hide this"
                    className="text-muted-foreground shrink-0"
                    onClick={() => setGone(true)}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => toast("Opening the plans")}
                >
                  See what changes
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Frame>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function ShadcnAdminDashboardsLandingTemplatesDemo() {
  return (
    <div>
      <BeforeAfter
        principle="A chart is only worth its space if you can get a number out of it. We wanted the exact figure for any week, without anyone squinting between the gridlines."
        before={<TrendChart mute />}
        after={<TrendChart mute={false} />}
      />

      <BeforeAfter
        principle="People read bars by comparing their heights, so where the bottom of the chart sits decides what they end up believing. We wanted six similar months to look like six similar months."
        before={<ProfitChart cropped />}
        after={<ProfitChart cropped={false} />}
      />

      <BeforeAfter
        principle="One big number tells you where you are, but not whether that is good news. We wanted the card to answer up or down, by how much, and compared to what."
        before={<StatCard flat />}
        after={<StatCard flat={false} />}
      />

      <BeforeAfter
        principle="Lists get long and the row you want is rarely at the top. We wanted the table to take whatever order the question needs, and the numbers to sit under each other so they can be compared."
        before={<TeamTable dead />}
        after={<TeamTable dead={false} />}
      />

      <BeforeAfter
        principle="Nobody opens a feed in order to do arithmetic on dates. We wanted when something happened to be something you take in, with the precise moment still there if you go looking for it."
        before={<ActivityStream raw />}
        after={<ActivityStream raw={false} />}
      />

      <BeforeAfter
        principle="A count that never moves teaches you to ignore it within a day. We wanted reading a notification to actually count for something."
        before={<Notifications stuck />}
        after={<Notifications stuck={false} />}
      />

      <BeforeAfter
        principle="The question people bring to a breakdown is always which one is biggest. We wanted that answered by looking, rather than by holding four percentages in your head."
        before={<Allocation split />}
        after={<Allocation split={false} />}
      />

      <BeforeAfter
        principle="Picking a seat and being told afterwards that it is gone is the worst possible order to find out. We wanted what is already taken to be plain before anyone chooses."
        before={<SeatPicker vague />}
        after={<SeatPicker vague={false} />}
      />

      <BeforeAfter
        principle="Every product wants to sell you the next tier up. We wanted it to ask once, quietly, and to go away when the answer is no."
        before={<Promo shouty />}
        after={<Promo shouty={false} />}
      />
    </div>
  );
}
