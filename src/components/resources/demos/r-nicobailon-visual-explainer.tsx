"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { motion } from "motion/react";
import { Fragment, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { Bar, BarChart, XAxis } from "recharts";

import { BeforeAfter, Micro, Tabs } from "@/components/surface";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * nicobailon/visual-explainer — the skill turns terminal output into a
 * page. Every switch below is one thing it stops the terminal from
 * doing: pipe-and-dash tables, box-art flows, block-character charts,
 * a diagram with no way in, a wall of file dump. Same data on both
 * sides; only the reading of it changes.
 * ------------------------------------------------------------------ */

/* --- shared -------------------------------------------------------- */

/** The narrow column an agent actually gets to print into. */
function Terminal({ children }: { children: ReactNode }) {
  return (
    <div className="bg-secondary max-w-sm overflow-hidden rounded-lg border">
      <div className="border-b px-3 py-1.5">
        <Micro>Terminal</Micro>
      </div>
      <pre className="text-meta text-muted-foreground p-3 font-mono leading-relaxed break-all whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

function asciiTable(head: string[], body: string[][]) {
  const w = head.map((h, i) =>
    Math.max(h.length, ...body.map((r) => r[i].length)),
  );
  const rule = `+${w.map((n) => "-".repeat(n + 2)).join("+")}+`;
  const line = (c: string[]) =>
    `| ${c.map((v, i) => v.padEnd(w[i])).join(" | ")} |`;
  return [rule, line(head), rule, ...body.map(line), rule].join("\n");
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* --- 1. The table the terminal cannot hold ------------------------- */

type Plan = "covered" | "partial" | "missing";

const AUDIT: {
  item: string;
  plan: Plan;
  tests: number;
  risk: "low" | "medium" | "high";
  owner: string;
}[] = [
  { item: "Session refresh on 401", plan: "covered", tests: 12, risk: "low", owner: "Priya" },
  { item: "Rate limit on /login", plan: "partial", tests: 3, risk: "high", owner: "Marek" },
  { item: "Device fingerprint store", plan: "missing", tests: 0, risk: "high", owner: "Unassigned" },
  { item: "Password reset tokens", plan: "covered", tests: 9, risk: "low", owner: "Priya" },
  { item: "OAuth callback replay", plan: "partial", tests: 4, risk: "medium", owner: "Ada" },
  { item: "Audit log retention", plan: "missing", tests: 0, risk: "medium", owner: "Unassigned" },
  { item: "Logout across tabs", plan: "covered", tests: 6, risk: "low", owner: "Marek" },
];

const PLAN_LABEL: Record<Plan, string> = {
  covered: "Covered",
  partial: "Partial",
  missing: "Missing",
};

const PLAN_DOT: Record<Plan, string> = {
  covered: "bg-positive",
  partial: "bg-muted-foreground",
  missing: "bg-destructive",
};

const AUDIT_FILTERS = [
  { id: "all", label: "Everything", count: AUDIT.length },
  { id: "gaps", label: "Gaps", count: AUDIT.filter((r) => r.plan !== "covered").length },
] as const;

function TablePair({ after }: { after: boolean }) {
  const [filter, setFilter] = useState<"all" | "gaps">("all");
  const rows = AUDIT.filter((r) => filter === "all" || r.plan !== "covered");
  const tests = rows.reduce((n, r) => n + r.tests, 0);
  const missing = rows.filter((r) => r.plan === "missing").length;

  return (
    <div className="space-y-3">
      <Tabs options={AUDIT_FILTERS} value={filter} onChange={setFilter} />

      {after ? (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary">
                <th className="text-micro text-muted-foreground px-3 py-2 text-left uppercase">
                  Requirement
                </th>
                <th className="text-micro text-muted-foreground px-3 py-2 text-left uppercase">
                  In plan
                </th>
                <th className="text-micro text-muted-foreground px-3 py-2 text-right uppercase">
                  Tests
                </th>
                <th className="text-micro text-muted-foreground hidden px-3 py-2 text-left uppercase sm:table-cell">
                  Risk
                </th>
                <th className="text-micro text-muted-foreground hidden px-3 py-2 text-left uppercase sm:table-cell">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.item} className="hover:bg-secondary border-t">
                  <td className="text-ui-sm px-3 py-2">{r.item}</td>
                  <td className="text-caption text-muted-foreground px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn("size-1.5 shrink-0 rounded-full", PLAN_DOT[r.plan])}
                      />
                      {PLAN_LABEL[r.plan]}
                    </span>
                  </td>
                  <td className="text-caption px-3 py-2 text-right tabular-nums">
                    {r.tests}
                  </td>
                  <td
                    className={cn(
                      "text-caption hidden px-3 py-2 capitalize sm:table-cell",
                      r.risk === "high" ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {r.risk}
                  </td>
                  <td className="text-caption text-muted-foreground hidden px-3 py-2 sm:table-cell">
                    {r.owner}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-secondary border-t">
                <td className="text-micro text-muted-foreground px-3 py-2 uppercase">
                  {rows.length} items
                </td>
                <td className="text-micro text-muted-foreground px-3 py-2 uppercase">
                  {missing} missing
                </td>
                <td className="text-caption px-3 py-2 text-right tabular-nums">{tests}</td>
                <td className="hidden px-3 py-2 sm:table-cell" />
                <td className="hidden px-3 py-2 sm:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <Terminal>
          {asciiTable(
            ["Requirement", "In plan", "Tests", "Risk", "Owner"],
            rows.map((r) => [
              r.item,
              PLAN_LABEL[r.plan],
              String(r.tests),
              r.risk,
              r.owner,
            ]),
          )}
          {`\n${rows.length} items, ${tests} tests, ${missing} missing`}
        </Terminal>
      )}
    </div>
  );
}

/* --- 2. The row name that scrolls away ----------------------------- */

const WIDE_COLS = [
  "Lines",
  "Exports",
  "State",
  "Tests",
  "Deps",
  "Coverage",
  "Todos",
  "Changed",
];

const WIDE_ROWS: { file: string; values: number[] }[] = [
  { file: "auth/session.ts", values: [354, 6, 8, 12, 3, 91, 2, 148] },
  { file: "auth/tokens.ts", values: [238, 4, 4, 9, 2, 84, 0, 31] },
  { file: "render/page.ts", values: [233, 5, 6, 4, 7, 62, 5, 96] },
  { file: "render/table.ts", values: [196, 1, 3, 3, 1, 58, 1, 12] },
  { file: "cli/args.ts", values: [182, 1, 2, 6, 2, 77, 0, 4] },
  { file: "cli/open.ts", values: [64, 2, 0, 1, 1, 40, 3, 22] },
];

function WideTablePair({ after }: { after: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-max">
        <thead>
          <tr className="bg-secondary">
            <th
              className={cn(
                "text-micro text-muted-foreground px-3 py-2 text-left whitespace-nowrap uppercase",
                after && "bg-secondary sticky left-0 border-r",
              )}
            >
              File
            </th>
            {WIDE_COLS.map((c) => (
              <th
                key={c}
                className="text-micro text-muted-foreground px-4 py-2 text-right whitespace-nowrap uppercase"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WIDE_ROWS.map((r) => (
            <tr key={r.file} className="border-t">
              <td
                className={cn(
                  "text-ui-sm px-3 py-2 font-mono whitespace-nowrap",
                  after && "bg-card sticky left-0 border-r",
                )}
              >
                {r.file}
              </td>
              {r.values.map((v, i) => (
                <td
                  key={WIDE_COLS[i]}
                  className="text-caption px-4 py-2 text-right tabular-nums"
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --- 3. Box art, and a flow you can follow ------------------------- */

const STEPS = [
  { id: "parse", label: "Parse", meta: "12 files" },
  { id: "plan", label: "Plan", meta: "4 sections" },
  { id: "render", label: "Render", meta: "1 page" },
  { id: "write", label: "Write", meta: "84 kB" },
  { id: "open", label: "Open", meta: "browser" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const STEP_TABS = STEPS.map((s) => ({ id: s.id, label: s.label }));

function asciiFlow(active: StepId) {
  const w = 13;
  const bar = `+${"-".repeat(w)}+`;
  const cell = (t: string) => `|${t.padEnd(w).slice(0, w)}|`;
  const gap = " ".repeat(6);
  const arrow = "  --> ";
  return [
    STEPS.map(() => bar).join(gap),
    STEPS.map((s) => cell(`${s.id === active ? " *" : "  "}${s.label}`)).join(arrow),
    STEPS.map((s) => cell(`   ${s.meta}`)).join(gap),
    STEPS.map(() => bar).join(gap),
  ].join("\n");
}

function FlowPair({ after }: { after: boolean }) {
  const [active, setActive] = useState<StepId>("render");

  return (
    <div className="space-y-3">
      <Tabs options={STEP_TABS} value={active} onChange={setActive} />

      {after ? (
        <div className="bg-secondary flex flex-wrap items-center gap-2 rounded-lg p-4">
          {STEPS.map((s, i) => (
            <Fragment key={s.id}>
              {i > 0 && (
                <ArrowRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
              )}
              <button
                type="button"
                onClick={() => setActive(s.id)}
                aria-pressed={active === s.id}
                className={cn(
                  "duration-fast ease-out-quart h-14 w-24 rounded-lg border px-3 text-left transition-colors",
                  active === s.id
                    ? "bg-accent text-accent-foreground border-transparent"
                    : "bg-card hover:bg-secondary",
                )}
              >
                <span className="text-ui-sm block">{s.label}</span>
                <span
                  className={cn(
                    "text-meta block",
                    active === s.id ? "" : "text-muted-foreground",
                  )}
                >
                  {s.meta}
                </span>
              </button>
            </Fragment>
          ))}
        </div>
      ) : (
        <Terminal>{asciiFlow(active)}</Terminal>
      )}
    </div>
  );
}

/* --- 4. Sixteen nodes at once, or four and then four --------------- */

const GROUPS = [
  {
    id: "intake",
    label: "Intake",
    nodes: [
      { name: "read request", meta: "cli/args.ts" },
      { name: "load files", meta: "fs/walk.ts" },
      { name: "detect kind", meta: "route.ts" },
      { name: "pick template", meta: "tpl/index.ts" },
    ],
  },
  {
    id: "shape",
    label: "Shape",
    nodes: [
      { name: "build outline", meta: "plan/outline.ts" },
      { name: "group sections", meta: "plan/group.ts" },
      { name: "choose charts", meta: "plan/charts.ts" },
      { name: "assign palette", meta: "plan/theme.ts" },
    ],
  },
  {
    id: "draw",
    label: "Draw",
    nodes: [
      { name: "render cards", meta: "render/cards.ts" },
      { name: "render tables", meta: "render/table.ts" },
      { name: "render diagram", meta: "render/mermaid.ts" },
      { name: "inline styles", meta: "render/css.ts" },
    ],
  },
  {
    id: "ship",
    label: "Ship",
    nodes: [
      { name: "write html", meta: "out/write.ts" },
      { name: "name the file", meta: "out/name.ts" },
      { name: "open browser", meta: "cli/open.ts" },
      { name: "print summary", meta: "cli/log.ts" },
    ],
  },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];

const GROUP_TABS = GROUPS.map((g) => ({ id: g.id, label: g.label }));

const ALL_NODES = GROUPS.flatMap((g) => g.nodes.map((n) => ({ ...n, group: g.id })));

function CrammedPair({ after }: { after: boolean }) {
  const [group, setGroup] = useState<GroupId>("draw");
  const current = GROUPS.find((g) => g.id === group)!;

  if (!after) {
    return (
      <div className="space-y-3">
        <Tabs options={GROUP_TABS} value={group} onChange={setGroup} />
        <div className="bg-secondary relative overflow-hidden rounded-lg p-3">
          <svg
            aria-hidden
            className="text-muted-foreground/40 pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {[
              "M4 12 C40 30, 60 4, 96 40",
              "M4 40 C50 8, 40 90, 96 12",
              "M4 66 C30 30, 70 96, 96 66",
              "M4 90 C60 60, 30 20, 96 90",
              "M50 2 L50 98",
              "M2 50 L98 50",
            ].map((d) => (
              <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="0.4" />
            ))}
          </svg>
          <div className="relative grid grid-cols-4 gap-1">
            {ALL_NODES.map((n) => (
              <button
                key={n.name}
                type="button"
                onClick={() => setGroup(n.group)}
                aria-pressed={n.group === group}
                className={cn(
                  "text-meta h-9 truncate rounded-md border px-1.5 text-left",
                  n.group === group
                    ? "bg-accent text-accent-foreground border-transparent"
                    : "bg-card text-muted-foreground",
                )}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs options={GROUP_TABS} value={group} onChange={setGroup} />

      <div className="bg-secondary flex flex-wrap items-center gap-2 rounded-lg p-3">
        {GROUPS.map((g, i) => (
          <Fragment key={g.id}>
            {i > 0 && (
              <ArrowRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
            )}
            <button
              type="button"
              onClick={() => setGroup(g.id)}
              aria-pressed={g.id === group}
              className={cn(
                "duration-fast ease-out-quart h-9 rounded-lg border px-3 transition-colors",
                g.id === group
                  ? "bg-accent text-accent-foreground border-transparent"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="text-ui-sm">{g.label}</span>
            </button>
          </Fragment>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {current.nodes.map((n, i) => (
          <motion.div
            key={n.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.base,
              ease: ease.outQuart,
              delay: i * 0.04,
            }}
            className="rounded-lg border p-3"
          >
            <p className="text-ui-sm">{n.name}</p>
            <p className="text-meta text-muted-foreground mt-1 font-mono">{n.meta}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* --- 5. A diagram you can get into --------------------------------- */

const MAP_COLUMNS = [
  { title: "Client", items: ["browser tab", "file watcher", "cli session"] },
  { title: "Skill", items: ["router", "template picker", "html writer"] },
  { title: "Output", items: ["~/.agent/diagrams", "opened page", "chat summary"] },
];

function MapCanvas() {
  return (
    <div
      className="flex items-start gap-10 p-4"
      style={{ width: 900 }}
    >
      {MAP_COLUMNS.map((col, ci) => (
        <Fragment key={col.title}>
          {ci > 0 && (
            <ArrowRight aria-hidden className="text-muted-foreground mt-16 size-5 shrink-0" />
          )}
          <div className="w-56 space-y-2">
            <Micro>{col.title}</Micro>
            {col.items.map((item) => (
              <div key={item} className="bg-card rounded-lg border px-3 py-2">
                <p className="text-ui-sm">{item}</p>
                <p className="text-meta text-muted-foreground mt-0.5 font-mono">
                  {item.length * 7} lines
                </p>
              </div>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function ZoomPair({ after }: { after: boolean }) {
  const [scale, setScale] = useState(0.55);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tall, setTall] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  };
  const onUp = () => {
    drag.current = null;
  };

  if (!after) {
    return (
      <div className="bg-secondary h-56 overflow-hidden rounded-lg">
        <div style={{ transform: "scale(0.55)", transformOrigin: "0 0" }}>
          <MapCanvas />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="icon-lg"
          aria-label="Zoom out"
          onClick={() => setScale((s) => clamp(s - 0.2, 0.4, 2))}
        >
          <Minus aria-hidden />
        </Button>
        <Button
          variant="secondary"
          size="icon-lg"
          aria-label="Zoom in"
          onClick={() => setScale((s) => clamp(s + 0.2, 0.4, 2))}
        >
          <Plus aria-hidden />
        </Button>
        <Button
          variant="secondary"
          size="icon-lg"
          aria-label="Reset the view"
          onClick={() => {
            setScale(0.55);
            setPan({ x: 0, y: 0 });
          }}
        >
          <RotateCcw aria-hidden />
        </Button>
        <Button
          variant="secondary"
          size="icon-lg"
          aria-label={tall ? "Shrink the frame" : "Expand the frame"}
          onClick={() => setTall((t) => !t)}
        >
          {tall ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
        </Button>
        <span className="text-caption text-muted-foreground tabular-nums">
          {Math.round(scale * 100)}%
        </span>
      </div>

      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={cn(
          "bg-secondary touch-none cursor-grab overflow-hidden rounded-lg active:cursor-grabbing",
          tall ? "h-96" : "h-56",
        )}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <MapCanvas />
        </div>
      </div>
    </div>
  );
}

/* --- 6. Numbers in a sentence, or numbers you can see -------------- */

const METRICS = [
  { key: "bundle", label: "Bundle", unit: " kB", digits: 1, goodWhen: "down" },
  { key: "lcp", label: "LCP", unit: " ms", digits: 0, goodWhen: "down" },
  { key: "errors", label: "Errors", unit: "", digits: 0, goodWhen: "down" },
  { key: "coverage", label: "Coverage", unit: "%", digits: 0, goodWhen: "up" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

const RUNS: Record<MetricKey, number>[] = [
  { bundle: 248.4, lcp: 1840, errors: 37, coverage: 71 },
  { bundle: 241.1, lcp: 1615, errors: 12, coverage: 78 },
  { bundle: 252.9, lcp: 2010, errors: 54, coverage: 69 },
];

const SPARKS: Record<MetricKey, number[]> = {
  bundle: [231, 236, 234, 240, 244, 241, 248, 253, 249, 244],
  lcp: [1720, 1680, 1755, 1610, 1590, 1640, 1840, 2010, 1930, 1780],
  errors: [8, 14, 9, 21, 17, 12, 37, 54, 41, 26],
  coverage: [66, 68, 67, 71, 74, 78, 71, 69, 73, 76],
};

function Spark({ points }: { points: number[] }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * 60},${16 - ((p - min) / span) * 14}`)
    .join(" ");
  return (
    <svg
      aria-hidden
      viewBox="0 0 60 18"
      className="text-muted-foreground mt-2 h-4 w-full"
      preserveAspectRatio="none"
    >
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function KpiPair({ after }: { after: boolean }) {
  const [run, setRun] = useState(0);
  const now = RUNS[run % RUNS.length];
  const prev = RUNS[(run + RUNS.length - 1) % RUNS.length];

  return (
    <div className="space-y-3">
      <Button variant="secondary" size="lg" onClick={() => setRun((r) => r + 1)}>
        Run again
      </Button>

      {after ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => {
            const delta = now[m.key] - prev[m.key];
            const good = m.goodWhen === "up" ? delta > 0 : delta < 0;
            return (
              <div key={m.key} className="rounded-lg border p-3">
                <Micro>{m.label}</Micro>
                <p className="text-title mt-1 flex items-baseline">
                  <NumberFlow
                    value={now[m.key]}
                    data-numeric
                    format={{
                      minimumFractionDigits: m.digits,
                      maximumFractionDigits: m.digits,
                    }}
                  />
                  <span className="text-caption text-muted-foreground">{m.unit}</span>
                </p>
                <p
                  className={cn(
                    "text-caption mt-1 flex items-center gap-1 tabular-nums",
                    delta === 0
                      ? "text-muted-foreground"
                      : good
                        ? "text-positive"
                        : "text-destructive",
                  )}
                >
                  {delta !== 0 &&
                    (delta > 0 ? (
                      <ArrowUp aria-hidden className="size-3" />
                    ) : (
                      <ArrowDown aria-hidden className="size-3" />
                    ))}
                  {Math.abs(delta).toFixed(m.digits)}
                  {m.unit}
                </p>
                <Spark points={SPARKS[m.key].slice(run % 4, (run % 4) + 6)} />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-caption text-muted-foreground bg-secondary rounded-lg p-3">
          {METRICS.map((m, i) => {
            const delta = now[m.key] - prev[m.key];
            return (
              <span key={m.key}>
                {i > 0 && " · "}
                {m.label} {now[m.key].toFixed(m.digits)}
                {m.unit} ({delta > 0 ? "+" : ""}
                {delta.toFixed(m.digits)}
                {m.unit})
              </span>
            );
          })}
        </p>
      )}
    </div>
  );
}

/* --- 7. Block characters, or bars of the right height -------------- */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const THIS_WEEK = [186, 199, 237, 241, 209, 314, 289];
const LAST_WEEK = [142, 151, 148, 198, 176, 240, 233];

const SERIES_TABS = [
  { id: "this", label: "This week" },
  { id: "last", label: "Last week" },
  { id: "both", label: "Both" },
] as const;

type SeriesId = (typeof SERIES_TABS)[number]["id"];

const chartConfig = {
  now: { label: "This week", color: "var(--chart-1)" },
  before: { label: "Last week", color: "var(--chart-3)" },
} satisfies ChartConfig;

function asciiBars(series: SeriesId) {
  const block = (v: number) => "#".repeat(Math.max(1, Math.round(v / 50)));
  const lines: string[] = [];
  DAYS.forEach((d, i) => {
    if (series !== "last") lines.push(`${d}  ${block(THIS_WEEK[i])}`);
    if (series !== "this") lines.push(`${series === "both" ? "   " : d}  ${block(LAST_WEEK[i])}`);
  });
  return lines.join("\n");
}

function ChartPair({ after }: { after: boolean }) {
  const [series, setSeries] = useState<SeriesId>("both");
  const data = DAYS.map((d, i) => ({ d, now: THIS_WEEK[i], before: LAST_WEEK[i] }));

  return (
    <div className="space-y-3">
      <Tabs options={SERIES_TABS} value={series} onChange={setSeries} />

      {after ? (
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <XAxis dataKey="d" tickLine={false} axisLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {series !== "last" && (
              <Bar dataKey="now" fill="var(--color-now)" radius={4} isAnimationActive={false} />
            )}
            {series !== "this" && (
              <Bar
                dataKey="before"
                fill="var(--color-before)"
                radius={4}
                isAnimationActive={false}
              />
            )}
          </BarChart>
        </ChartContainer>
      ) : (
        <Terminal>{asciiBars(series)}</Terminal>
      )}
    </div>
  );
}

/* --- 8. Somewhere in the page, or right here ----------------------- */

const DOC_SECTIONS = [
  { id: "summary", title: "Summary", lines: 4 },
  { id: "arch", title: "Architecture", lines: 6 },
  { id: "risks", title: "Risks", lines: 5 },
  { id: "tests", title: "Test coverage", lines: 6 },
  { id: "next", title: "Next steps", lines: 4 },
];

function DocBody({
  scrollRef,
  sectionRefs,
  onScroll,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  sectionRefs: React.RefObject<Record<string, HTMLElement | null>>;
  onScroll?: () => void;
}) {
  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="bg-secondary h-64 flex-1 overflow-y-auto rounded-lg p-4"
    >
      {DOC_SECTIONS.map((s) => (
        <section
          key={s.id}
          ref={(el) => {
            sectionRefs.current[s.id] = el;
          }}
          className="mb-6 last:mb-0"
        >
          <h4 className="text-ui">{s.title}</h4>
          <div className="mt-2 space-y-2">
            {Array.from({ length: s.lines }).map((_, i) => (
              <div
                key={i}
                aria-hidden
                className={cn("bg-card h-2 rounded-full", i % 3 === 2 ? "w-2/3" : "w-full")}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function NavPair({ after }: { after: boolean }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [active, setActive] = useState(DOC_SECTIONS[0].id);

  const handleScroll = () => {
    const box = scrollRef.current;
    if (!box) return;
    let current = DOC_SECTIONS[0].id;
    for (const s of DOC_SECTIONS) {
      const el = sectionRefs.current[s.id];
      if (el && el.offsetTop - box.scrollTop <= 24) current = s.id;
    }
    setActive(current);
  };

  if (!after) {
    return <DocBody scrollRef={scrollRef} sectionRefs={sectionRefs} />;
  }

  return (
    <div className="flex gap-3">
      <nav className="w-32 shrink-0 space-y-1">
        {DOC_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-current={active === s.id ? "true" : undefined}
            onClick={() => {
              const box = scrollRef.current;
              const el = sectionRefs.current[s.id];
              if (box && el) box.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
            }}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart flex h-9 w-full items-center rounded-lg px-2.5 text-left transition-colors",
              active === s.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <span className="truncate">{s.title}</span>
          </button>
        ))}
      </nav>
      <DocBody scrollRef={scrollRef} sectionRefs={sectionRefs} onScroll={handleScroll} />
    </div>
  );
}

/* --- 9. The whole file, or the part that changed ------------------- */

const FILE_LINES: { n: number; text: string; kind?: "add" | "del" }[] = [
  { n: 12, text: "import { readFile } from 'node:fs/promises';" },
  { n: 13, text: "import { renderTable } from './table';" },
  { n: 14, text: "" },
  { n: 15, text: "const MAX_TERMINAL_COLS = 80;" },
  { n: 16, text: "" },
  { n: 17, text: "export async function present(rows: Row[], cols: Col[]) {" },
  { n: 18, text: "  const wide = cols.length >= 3;" },
  { n: 19, text: "  const tall = rows.length >= 4;" },
  { n: 20, text: "  if (!wide && !tall) {", kind: "del" },
  { n: 20, text: "  if (!wide && !tall && fitsInTerminal(rows, cols)) {", kind: "add" },
  { n: 21, text: "    return printAscii(rows, cols);" },
  { n: 22, text: "  }" },
  { n: 23, text: "", kind: "add" },
  { n: 24, text: "  const html = renderTable(rows, cols);", kind: "add" },
  { n: 25, text: "  const path = await write(html);" },
  { n: 26, text: "  await open(path);" },
  { n: 27, text: "  return summarise(rows, path);" },
  { n: 28, text: "}" },
  { n: 29, text: "" },
  { n: 30, text: "function fitsInTerminal(rows: Row[], cols: Col[]) {" },
  { n: 31, text: "  const width = measure(rows, cols);" },
  { n: 32, text: "  return width <= MAX_TERMINAL_COLS;" },
  { n: 33, text: "}" },
  { n: 34, text: "" },
  { n: 35, text: "function measure(rows: Row[], cols: Col[]) {" },
  { n: 36, text: "  const widths = cols.map((c, i) =>" },
  { n: 37, text: "    Math.max(c.label.length, ...rows.map((r) => cell(r, i).length)),", },
  { n: 38, text: "  );" },
  { n: 39, text: "  return widths.reduce((a, b) => a + b + 3, 1);" },
  { n: 40, text: "}" },
  { n: 41, text: "" },
  { n: 42, text: "function cell(row: Row, i: number) {" },
  { n: 43, text: "  return String(row.values[i] ?? '');" },
  { n: 44, text: "}" },
];

const HUNK = FILE_LINES.filter((l) => l.n >= 18 && l.n <= 26);

function DiffPair({ after }: { after: boolean }) {
  const [all, setAll] = useState(false);
  const lines = after && !all ? HUNK : FILE_LINES;
  const changed = FILE_LINES.filter((l) => l.kind).length;

  return (
    <div className="overflow-hidden rounded-lg border">
      {after && (
        <div className="bg-secondary flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <span className="text-caption font-mono">src/render/page.ts</span>
          <div className="flex items-center gap-3">
            <span className="text-micro text-muted-foreground uppercase">
              {changed} changed lines
            </span>
            <Button variant="secondary" size="lg" onClick={() => setAll((v) => !v)}>
              {all ? "Just the change" : `All ${FILE_LINES.length} lines`}
            </Button>
          </div>
        </div>
      )}
      <div className={cn("overflow-auto", after && !all ? "" : "h-56")}>
        {lines.map((l, i) => (
          <div
            key={`${l.n}-${i}`}
            className={cn(
              "text-meta flex gap-3 px-3 py-0.5 font-mono whitespace-pre",
              after && l.kind === "add" && "bg-positive/10",
              after && l.kind === "del" && "bg-destructive/10",
            )}
          >
            <span className="text-muted-foreground w-6 shrink-0 text-right tabular-nums">
              {l.n}
            </span>
            <span
              className={cn(
                "w-2 shrink-0",
                after && l.kind === "add" && "text-positive",
                after && l.kind === "del" && "text-destructive",
              )}
            >
              {after && l.kind === "add" ? "+" : after && l.kind === "del" ? "-" : " "}
            </span>
            <span className={cn(!after && "text-muted-foreground")}>{l.text || " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- 10. The long id that pushes everything sideways --------------- */

const START_ID = "sha256:9f2b7c1e4a8d0f6b3e5c9a1d7f4b2e8c6a0d3f5b";

function OverflowPair({ after }: { after: boolean }) {
  const [value, setValue] = useState(START_ID);
  const id = after ? "run-id-after" : "run-id-before";

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={id}>Run id</Label>
        <Input
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 font-mono"
        />
      </div>

      <div className={cn("rounded-lg border p-3", !after && "overflow-x-auto")}>
        <div
          className="grid items-center gap-3"
          style={{ gridTemplateColumns: "auto 1fr auto" }}
        >
          <Micro>Diagram</Micro>
          <span
            className={cn(
              "text-caption font-mono",
              after ? "min-w-0 break-all" : "whitespace-nowrap",
            )}
          >
            {value}
          </span>
          <Button variant="secondary" size="lg">
            Open
          </Button>
        </div>
      </div>
    </div>
  );
}

/* --- 11. Motion that never stops, or motion that lands ------------- */

const ARRIVING = [
  { title: "Architecture", meta: "16 nodes" },
  { title: "Diff review", meta: "3 files" },
  { title: "Plan audit", meta: "7 rows" },
  { title: "Recap", meta: "2 weeks" },
];

function MotionPair({ after }: { after: boolean }) {
  const [run, setRun] = useState(0);

  return (
    <div className="space-y-3">
      <Button variant="secondary" size="lg" onClick={() => setRun((r) => r + 1)}>
        Render again
      </Button>

      <div key={run} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ARRIVING.map((c, i) =>
          after ? (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: duration.base,
                ease: ease.outQuart,
                delay: i * 0.05,
              }}
              className="rounded-lg border p-3"
            >
              <p className="text-ui-sm">{c.title}</p>
              <p className="text-meta text-muted-foreground mt-1">{c.meta}</p>
            </motion.div>
          ) : (
            <motion.div
              key={c.title}
              animate={{ opacity: [1, 0.45, 1], scale: [1, 1.03, 1] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
              className="rounded-lg border p-3"
            >
              <p className="text-ui-sm flex items-center gap-2">
                <motion.span
                  aria-hidden
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="bg-destructive size-1.5 shrink-0 rounded-full"
                />
                {c.title}
              </p>
              <p className="text-meta text-muted-foreground mt-1">{c.meta}</p>
            </motion.div>
          ),
        )}
      </div>
    </div>
  );
}

/* --- the page ------------------------------------------------------ */

export function NicobailonVisualExplainerDemo() {
  return (
    <div>
      <BeforeAfter
        principle="You can find the row you want without counting dashes."
        before={<TablePair after={false} />}
        after={<TablePair after />}
      />
      <BeforeAfter
        principle="Scroll sideways and you can still tell which row you are on."
        before={<WideTablePair after={false} />}
        after={<WideTablePair after />}
      />
      <BeforeAfter
        principle="The arrows go where they say they go."
        before={<FlowPair after={false} />}
        after={<FlowPair after />}
      />
      <BeforeAfter
        principle="You see the shape of it first, then the four things inside."
        before={<CrammedPair after={false} />}
        after={<CrammedPair after />}
      />
      <BeforeAfter
        principle="Drag it around and zoom in when the labels get small."
        before={<ZoomPair after={false} />}
        after={<ZoomPair after />}
      />
      <BeforeAfter
        principle="The number you came for is the big one, and it stops jumping."
        before={<KpiPair after={false} />}
        after={<KpiPair after />}
      />
      <BeforeAfter
        principle="Two different numbers stop looking the same length."
        before={<ChartPair after={false} />}
        after={<ChartPair after />}
      />
      <BeforeAfter
        principle="You can jump straight to the part you need, and see where you are."
        before={<NavPair after={false} />}
        after={<NavPair after />}
      />
      <BeforeAfter
        principle="What changed is right there, and the rest is one press away."
        before={<DiffPair after={false} />}
        after={<DiffPair after />}
      />
      <BeforeAfter
        principle="Type a longer id — nothing slides off to the right any more."
        before={<OverflowPair after={false} />}
        after={<OverflowPair after />}
      />
      <BeforeAfter
        principle="It settles down once it has arrived."
        before={<MotionPair after={false} />}
        after={<MotionPair after />}
      />
    </div>
  );
}
