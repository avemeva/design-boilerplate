"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Each of these tools mounts inside its own demo and tears itself down
 * on unmount. Nothing here is global — leaving an annotation toolbar or
 * a render overlay on every page of the site would be exactly the kind
 * of ambient noise these tools are meant to help you find.
 */

/* ------------------------------------------------------------------ *
 * react-scan
 * ------------------------------------------------------------------ */

export function ReactScanDemo() {
  const [on, setOn] = useState(false);
  const [tick, setTick] = useState(0);
  const scanRef = useRef<((o: { enabled: boolean }) => void) | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 800);
    return () => clearInterval(id);
  }, []);

  // Loaded on demand, and switched off again when you leave the page.
  useEffect(() => {
    let live = true;
    void import("react-scan").then((m) => {
      if (!live) return;
      scanRef.current = ({ enabled }) =>
        m.scan({ enabled, showToolbar: enabled });
      m.scan({ enabled: false, showToolbar: false });
    });
    return () => {
      live = false;
      scanRef.current?.({ enabled: false });
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !on;
    setOn(next);
    scanRef.current?.({ enabled: next });
  }, [on]);

  return (
    <div className="space-y-4">
      <Button className="h-9" onClick={toggle}>
        {on ? "Stop scanning" : "Start scanning"}
      </Button>

      <div className="bg-secondary grid gap-3 rounded-lg p-4 sm:grid-cols-3">
        <Cell label="updates every 800ms" value={tick} />
        <Cell label="updates every 800ms" value={tick * 2} />
        <Cell label="never updates" value={0} />
      </div>

      <p className="text-caption text-muted-foreground">
        With scanning on, the first two tiles get outlined on every tick and
        the third stays quiet.
      </p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-lg border p-3">
      <p className="text-micro text-muted-foreground uppercase">{label}</p>
      <p className="text-title mt-1 tabular-nums">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * react-grab
 * ------------------------------------------------------------------ */

export function ReactGrabDemo() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let api: { destroy?: () => void } | null = null;
    let live = true;

    void import("react-grab").then((m) => {
      if (!live) return;
      api = m.init() as unknown as { destroy?: () => void };
      setReady(true);
    });

    return () => {
      live = false;
      api?.destroy?.();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-secondary rounded-lg p-6">
        <div className="bg-card mx-auto max-w-sm rounded-lg border p-4">
          <p className="text-micro text-muted-foreground uppercase">Target</p>
          <p className="text-ui mt-1">Hold the activation key, click this.</p>
          <div className="mt-3 flex gap-2">
            <Button className="h-9">Primary</Button>
            <Button variant="outline" className="h-9">
              Secondary
            </Button>
          </div>
        </div>
      </div>

      <p className="text-caption text-muted-foreground">
        {ready
          ? "Active on this page only. It copies the component name, the source file and line, and the computed styles, ready to paste."
          : "Loading…"}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * agentation
 * ------------------------------------------------------------------ */

export function AgentationDemo() {
  const [Toolbar, setToolbar] = useState<React.ComponentType<
    Record<string, unknown>
  > | null>(null);
  const [notes, setNotes] = useState(0);

  useEffect(() => {
    let live = true;
    void import("agentation").then((m) => {
      if (!live) return;
      setToolbar(
        () => m.Agentation as unknown as React.ComponentType<Record<string, unknown>>,
      );
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-secondary grid place-items-center rounded-lg p-8">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease: ease.outQuart }}
          className="bg-card rounded-lg border px-4 py-3"
        >
          <p className="text-ui">Annotate this element</p>
          <p className="text-caption text-muted-foreground mt-1">
            Notes pinned: <span className="tabular-nums">{notes}</span>
          </p>
        </motion.div>
      </div>

      <p className="text-caption text-muted-foreground">
        The toolbar at the bottom of the window belongs to this page and
        unmounts when you leave. It captures the selector, the component path
        and the computed styles alongside your note.
      </p>

      {/* Mounted here, not in the root layout. */}
      {Toolbar && <Toolbar onAnnotationAdd={() => setNotes((n) => n + 1)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * react-doctor / Biome — real findings from this repo
 * ------------------------------------------------------------------ */

import analysis from "@/components/resources/demos/analysis.json";

export function StaticAnalysisDemo() {
  const [tool, setTool] = useState<"all" | "react-doctor" | "biome">("all");
  // Written by `npm run analysis`, which runs both tools against this
  // repo. Nothing here is hand-authored.
  const rows = analysis.rules.filter((f) => tool === "all" || f.tool === tool);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {(["all", "react-doctor", "biome"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTool(t)}
            aria-pressed={tool === t}
            className={cn(
              "text-ui-sm h-9 rounded-lg border px-3 transition-colors",
              tool === t
                ? "bg-feature text-feature-foreground border-transparent"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-card divide-y rounded-lg border">
        {rows.map((f) => (
          <div key={f.tool + f.rule} className="p-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <code className="font-mono text-xs">{f.rule}</code>
              <span className="text-micro text-muted-foreground ml-auto tabular-nums">
                {f.count}x
              </span>
            </div>
            <p className="text-caption text-muted-foreground mt-1 text-pretty">
              {f.message}
            </p>
            <p className="text-micro text-muted-foreground mt-1 font-mono">
              {f.files.join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <p className="text-caption text-muted-foreground">
        {analysis.total} findings, produced by{" "}
        <code className="font-mono">npm run analysis</code> against this
        repository. Re-run it and this list changes.
      </p>
    </div>
  );
}
