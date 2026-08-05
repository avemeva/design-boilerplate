"use client";

import { motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* The catalogue — the entire vocabulary the model is allowed to emit.
 * Anything outside it is dropped by the compiler, not rendered. */
const CATALOG = ["Card", "Metric", "Action"] as const;
type CatalogType = (typeof CATALOG)[number];

type Element = { id: string; type: string; props: Record<string, string> };

/* One JSON element per streamed chunk, in arrival order. */
const STREAM: Element[] = [
  { id: "card-1", type: "Card", props: { title: "Q3 revenue" } },
  { id: "metric-1", type: "Metric", props: { label: "MRR", value: "$48,210" } },
  { id: "metric-2", type: "Metric", props: { label: "Churn", value: "1.8%" } },
  { id: "chart-1", type: "Chart", props: { series: "mrr" } },
  { id: "action-1", type: "Action", props: { label: "Export report" } },
];

/* The registry — catalogue names mapped to this project's real components. */
const REGISTRY: Record<CatalogType, (p: Record<string, string>) => ReactNode> = {
  Card: (p) => <p className="text-ui border-b pb-2 font-medium">{p.title}</p>,
  Metric: (p) => (
    <div className="text-ui-sm flex items-baseline justify-between">
      <span className="text-muted-foreground">{p.label}</span>
      <span className="tabular-nums">{p.value}</span>
    </div>
  ),
  Action: (p) => (
    <Button
      variant="outline"
      className="h-8 w-full"
      onClick={() => toast("emit(\"export_report\")")}
    >
      {p.label}
    </Button>
  ),
};

const inCatalog = (e: Element): e is Element & { type: CatalogType } =>
  (CATALOG as readonly string[]).includes(e.type);

export function VercelLabsJsonRenderDemo() {
  const [n, setN] = useState(0);
  const pushed = STREAM.slice(0, n);
  const done = n >= STREAM.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button className="h-9" onClick={() => setN(done ? 0 : n + 1)}>
          {done ? "Reset" : "compiler.push(chunk)"}
        </Button>
        <span className="text-caption text-muted-foreground">
          Prompt: “show Q3 revenue with an export button”. {n} of {STREAM.length}{" "}
          chunks in.
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-secondary overflow-x-auto rounded-lg p-3 font-mono text-xs">
          <div className="text-muted-foreground">
            {'{ "root": "card-1", "elements": {'}
          </div>
          {pushed.map((e) => (
            <div
              key={e.id}
              className={cn("pl-3", !inCatalog(e) && "text-destructive line-through")}
            >
              {`"${e.id}": { "type": "${e.type}", "props": ${JSON.stringify(e.props)} },`}
            </div>
          ))}
          {!done && <div className="text-muted-foreground pl-3">…</div>}
          <div className="text-muted-foreground">{"} }"}</div>
        </div>
        <div className="bg-card space-y-2 rounded-lg border p-3">
          {pushed.filter(inCatalog).map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
            >
              {REGISTRY[e.type](e.props)}
            </motion.div>
          ))}
          {n === 0 && (
            <p className="text-caption text-muted-foreground">Nothing rendered yet.</p>
          )}
        </div>
      </div>
      <p className="text-caption text-muted-foreground">
        Chunk four asks for <code className="font-mono text-[0.9em]">Chart</code>,
        which is not in the catalogue, so the compiler drops it and the render
        pane never sees it. That is the whole argument: the model picks from a
        vocabulary you own, and the mapping from name to component stays in your
        code. This is a hand-written stand-in — the package is not installed
        here.
      </p>
    </div>
  );
}
