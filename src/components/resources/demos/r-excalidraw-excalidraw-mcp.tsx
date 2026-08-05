"use client";

import { ArrowRight, ChevronRight, GripVertical, Plus, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { Fragment, useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter, Tabs } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * excalidraw-mcp — the server hands the model a `read_me` cheat sheet
 * before it is allowed to draw. Everything below is one of that sheet's
 * rules, flipped between the diagram you get without it and the diagram
 * you get with it.
 * ------------------------------------------------------------------ */

function Stage({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("bg-secondary overflow-hidden rounded-lg", className)}>{children}</div>
  );
}

function Node({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("bg-card grid place-items-center rounded-lg border", className)}>
      {children}
    </div>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* --- 1. Drawing order --------------------------------------------- */

const FLOW = ["Prompt", "Model", "Diagram"] as const;
const GROUPED = ["b0", "b1", "b2", "t0", "t1", "t2", "a0", "a1"];
const PROGRESSIVE = ["b0", "t0", "a0", "b1", "t1", "a1", "b2", "t2"];
const BEAT = 0.3;

function Reveal({ id, order, children }: { id: string; order: string[]; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: duration.base,
        ease: ease.outQuart,
        delay: order.indexOf(id) * BEAT,
      }}
    >
      {children}
    </motion.div>
  );
}

function OrderPair({ after }: { after: boolean }) {
  const [run, setRun] = useState(0);
  const order = after ? PROGRESSIVE : GROUPED;

  return (
    <div className="space-y-3">
      <Stage className="p-5">
        <div key={run} className="flex items-center justify-center gap-2 sm:gap-3">
          {FLOW.map((node, i) => (
            <Fragment key={node}>
              {i > 0 && (
                <Reveal id={`a${i - 1}`} order={order}>
                  <ArrowRight aria-hidden className="text-muted-foreground size-4" />
                </Reveal>
              )}
              <Reveal id={`b${i}`} order={order}>
                <Node className="h-14 w-20 sm:w-24">
                  <Reveal id={`t${i}`} order={order}>
                    <span className="text-ui-sm">{node}</span>
                  </Reveal>
                </Node>
              </Reveal>
            </Fragment>
          ))}
        </div>
      </Stage>
      <Button size="lg" variant="secondary" onClick={() => setRun((r) => r + 1)}>
        <RotateCcw aria-hidden />
        Draw again
      </Button>
    </div>
  );
}

/* --- 2. The view follows the drawing ------------------------------- */

const SHOTS = [
  { z: 2.5, cx: 0.5, cy: 0.14 },
  { z: 2.1, cx: 0.2, cy: 0.46 },
  { z: 2.1, cx: 0.5, cy: 0.46 },
  { z: 2.1, cx: 0.8, cy: 0.46 },
  { z: 1, cx: 0.5, cy: 0.5 },
];
const SHOT_TIMES = [0, 0.18, 0.3, 0.44, 0.52, 0.66, 0.74, 0.86, 1];
const SHOT_DURATION = 3.8;

const camScale: number[] = [];
const camX: string[] = [];
const camY: string[] = [];
SHOTS.forEach((s, i) => {
  const repeats = i === SHOTS.length - 1 ? 1 : 2;
  for (let k = 0; k < repeats; k += 1) {
    camScale.push(s.z);
    camX.push(`${-(s.cx - 0.5) * s.z * 100}%`);
    camY.push(`${-(s.cy - 0.5) * s.z * 100}%`);
  }
});

type ScenePiece = {
  kind: "title" | "node" | "arrow" | "note";
  at: [number, number];
  text?: string;
  delay: number;
};

const SCENE: ScenePiece[] = [
  { kind: "title", at: [0.5, 0.14], text: "Photosynthesis", delay: 0.15 },
  { kind: "node", at: [0.2, 0.46], text: "Sunlight", delay: 1.2 },
  { kind: "arrow", at: [0.35, 0.46], delay: 1.95 },
  { kind: "node", at: [0.5, 0.46], text: "Leaf", delay: 2.05 },
  { kind: "arrow", at: [0.65, 0.46], delay: 2.8 },
  { kind: "node", at: [0.8, 0.46], text: "Glucose", delay: 2.9 },
  { kind: "note", at: [0.5, 0.76], text: "6CO2 + 6H2O", delay: 3.5 },
];

function CameraPair({ after }: { after: boolean }) {
  const [run, setRun] = useState(0);

  return (
    <div className="space-y-3">
      <Stage className="relative w-full">
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <motion.div
            key={run}
            className="absolute inset-0"
            animate={
              after
                ? { scale: camScale, x: camX, y: camY }
                : { scale: 1, x: "0%", y: "0%" }
            }
            transition={
              after
                ? {
                    duration: SHOT_DURATION,
                    times: SHOT_TIMES,
                    ease: ease.inOutCubic,
                  }
                : { duration: 0 }
            }
          >
            {SCENE.map((piece) => (
              <div
                key={`${piece.kind}-${piece.at[0]}-${piece.at[1]}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${piece.at[0] * 100}%`, top: `${piece.at[1] * 100}%` }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: duration.base,
                    ease: ease.outQuart,
                    delay: piece.delay,
                  }}
                >
                  {piece.kind === "title" && (
                    <span className="text-ui-sm whitespace-nowrap">{piece.text}</span>
                  )}
                  {piece.kind === "node" && (
                    <Node className="text-micro h-8 w-20 whitespace-nowrap">{piece.text}</Node>
                  )}
                  {piece.kind === "arrow" && (
                    <ArrowRight aria-hidden className="text-muted-foreground size-3" />
                  )}
                  {piece.kind === "note" && (
                    <span className="text-micro text-muted-foreground whitespace-nowrap">
                      {piece.text}
                    </span>
                  )}
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </Stage>
      <Button size="lg" variant="secondary" onClick={() => setRun((r) => r + 1)}>
        <RotateCcw aria-hidden />
        Draw again
      </Button>
    </div>
  );
}

/* --- 3. The name inside the box ------------------------------------ */

function LabelPair({ after }: { after: boolean }) {
  const [text, setText] = useState("Notification dispatcher");
  const inputId = after ? "excalidraw-label-after" : "excalidraw-label-before";
  const estimated = text.length * 7;

  return (
    <div className="space-y-4">
      <Stage className="grid place-items-center p-6">
        {after ? (
          <Node className="text-ui-sm h-16 min-w-36 px-5 whitespace-nowrap">{text || " "}</Node>
        ) : (
          <div className="bg-card relative h-16 w-36 rounded-lg border">
            <span
              className="text-ui-sm absolute top-1/2 -translate-y-1/2 whitespace-nowrap"
              style={{ left: 72 - estimated / 2 }}
            >
              {text}
            </span>
          </div>
        )}
      </Stage>
      <div className="flex items-center gap-3">
        <Label htmlFor={inputId} className="text-ui-sm shrink-0">
          Box name
        </Label>
        <Input
          id={inputId}
          className="h-9 max-w-64"
          maxLength={26}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
    </div>
  );
}

/* --- 4. Still readable when the view pulls back -------------------- */

const FRAMES = [
  { id: "s", label: "Close" },
  { id: "m", label: "Medium" },
  { id: "l", label: "Wide" },
  { id: "xl", label: "Panorama" },
] as const;

type FrameId = (typeof FRAMES)[number]["id"];

const FRAME_SCALE: Record<FrameId, number> = { s: 1.7, m: 1.25, l: 0.95, xl: 0.62 };
const ZOOM_NODES = ["Parse", "Check", "Store"];

function ZoomPair({ after }: { after: boolean }) {
  const [frame, setFrame] = useState<FrameId>("l");

  return (
    <div className="space-y-3">
      <Stage className="relative">
        <div className="relative w-full" style={{ aspectRatio: "16 / 6" }}>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: FRAME_SCALE[frame] }}
            transition={{ duration: duration.slow, ease: ease.outQuart }}
          >
            <div
              className={cn(
                "flex origin-center items-center",
                after ? "gap-4" : "scale-75 gap-2",
              )}
            >
              {ZOOM_NODES.map((node, i) => (
                <Fragment key={node}>
                  {i > 0 && (
                    <ArrowRight
                      aria-hidden
                      className={cn("text-muted-foreground", after ? "size-4" : "size-2.5")}
                    />
                  )}
                  <Node
                    className={cn(
                      "whitespace-nowrap",
                      after ? "text-ui-sm h-12 w-24" : "text-micro h-7 w-14",
                    )}
                  >
                    {node}
                  </Node>
                </Fragment>
              ))}
            </div>
          </motion.div>
        </div>
      </Stage>
      <Tabs options={FRAMES} value={frame} onChange={setFrame} />
    </div>
  );
}

/* --- 5. Reshaping the frame ---------------------------------------- */

function Cat() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={200} cy={150} r={68} />
      <polyline points="152,104 158,54 196,86" />
      <polyline points="248,104 242,54 204,86" />
      <circle cx={178} cy={142} r={6} fill="currentColor" stroke="none" />
      <circle cx={222} cy={142} r={6} fill="currentColor" stroke="none" />
      <path d="M193 164 L207 164 L200 172 Z" fill="currentColor" stroke="none" />
      <path d="M200 172 q -12 14 -22 2" />
      <path d="M200 172 q 12 14 22 2" />
      <path d="M136 152 L106 146" />
      <path d="M136 164 L106 168" />
      <path d="M264 152 L294 146" />
      <path d="M264 164 L294 168" />
    </g>
  );
}

function AspectPair({ after }: { after: boolean }) {
  const [width, setWidth] = useState(400);
  const drag = useRef<{ x: number; w: number } | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-1">
        <Stage className="text-foreground h-44 max-w-full shrink-0">
          <div className="h-full" style={{ width }}>
            <svg
              viewBox="0 0 400 300"
              preserveAspectRatio={after ? "xMidYMid meet" : "none"}
              className="h-full w-full"
              role="img"
              aria-label="A drawing of a cat inside the frame"
            >
              <Cat />
            </svg>
          </div>
        </Stage>
        <button
          type="button"
          aria-label="Drag to change the frame width"
          className="bg-secondary text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 grid h-44 w-6 shrink-0 cursor-ew-resize touch-none place-items-center rounded-lg transition-colors outline-none focus-visible:ring-3"
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, w: width };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setWidth(clamp(drag.current.w + e.clientX - drag.current.x, 130, 440));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setWidth((w) => clamp(w - 16, 130, 440));
            if (e.key === "ArrowRight") setWidth((w) => clamp(w + 16, 130, 440));
          }}
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* --- 6. Adding one more step --------------------------------------- */

const STEPS = ["Idea", "Sketch", "Draft", "Review", "Ship"];

function GrowPair({ after }: { after: boolean }) {
  const [count, setCount] = useState(2);
  const [gen, setGen] = useState(0);
  const full = count >= STEPS.length;

  return (
    <div className="space-y-3">
      <Stage className="p-5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STEPS.slice(0, count).map((step, i) => (
            <Fragment key={after ? step : `${gen}-${step}`}>
              {i > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: duration.base,
                    ease: ease.outQuart,
                    delay: after ? 0 : i * 0.12,
                  }}
                >
                  <ArrowRight aria-hidden className="text-muted-foreground size-4" />
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: duration.slow,
                  ease: ease.outQuart,
                  delay: after ? 0 : i * 0.12,
                }}
              >
                <Node className="text-ui-sm h-12 w-20">{step}</Node>
              </motion.div>
            </Fragment>
          ))}
        </div>
      </Stage>
      <Button
        size="lg"
        variant="secondary"
        onClick={() => {
          setCount(full ? 2 : count + 1);
          setGen((g) => g + 1);
        }}
      >
        {full ? <RotateCcw aria-hidden /> : <Plus aria-hidden />}
        {full ? "Start over" : "Add a step"}
      </Button>
    </div>
  );
}

/* --- 7. Words on an arrow ------------------------------------------ */

const ARROW_LABELS = [
  { id: "short", label: "ATP" },
  { id: "mid", label: "ATP + NADPH" },
  { id: "long", label: "parsed result" },
] as const;

type ArrowLabelId = (typeof ARROW_LABELS)[number]["id"];

function ArrowLabelPair({ after }: { after: boolean }) {
  const [choice, setChoice] = useState<ArrowLabelId>("mid");
  const label = ARROW_LABELS.find((o) => o.id === choice)?.label ?? "";

  return (
    <div className="space-y-3">
      <Stage className="grid place-items-center p-6">
        <div className="flex items-center justify-center">
          <Node className="text-ui-sm h-14 w-20 shrink-0">Light</Node>
          {after ? (
            <div className="flex items-center gap-1.5 px-2">
              <div className="bg-border-strong h-px w-4 shrink-0" />
              <span className="text-caption text-muted-foreground whitespace-nowrap">{label}</span>
              <div className="bg-border-strong h-px w-4 shrink-0" />
              <ChevronRight aria-hidden className="text-muted-foreground -ml-2.5 size-3.5" />
            </div>
          ) : (
            <div className="relative flex h-14 w-12 shrink-0 items-center">
              <div className="bg-border-strong h-px w-full" />
              <ChevronRight aria-hidden className="text-muted-foreground absolute right-0 size-3.5" />
              <span className="text-caption absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
                {label}
              </span>
            </div>
          )}
          <Node className="text-ui-sm h-14 w-20 shrink-0">Calvin</Node>
        </div>
      </Stage>
      <Tabs options={ARROW_LABELS} value={choice} onChange={setChoice} />
    </div>
  );
}

/* --- 8. Notes you can read ----------------------------------------- */

const NOTES = [
  { id: "in", label: "Input", note: "Where the raw file lands." },
  { id: "job", label: "Job", note: "Runs every night at 02:00." },
  { id: "out", label: "Output", note: "Read by the billing report." },
];

function ContrastPair({ after }: { after: boolean }) {
  const [selected, setSelected] = useState("job");
  const active = NOTES.find((n) => n.id === selected) ?? NOTES[0];

  return (
    <Stage className="p-5">
      <div className="flex items-center justify-center gap-2">
        {NOTES.map((n, i) => (
          <Fragment key={n.id}>
            {i > 0 && (
              <ArrowRight
                aria-hidden
                className={cn(
                  "size-4",
                  after ? "text-muted-foreground" : "text-muted-foreground/25",
                )}
              />
            )}
            <button
              type="button"
              aria-pressed={selected === n.id}
              onClick={() => setSelected(n.id)}
              className={cn(
                "bg-card text-ui-sm h-11 w-20 rounded-lg border transition-colors sm:w-24",
                selected === n.id ? "border-border-strong" : "",
                after ? "text-foreground" : "text-muted-foreground/40",
              )}
            >
              {n.label}
            </button>
          </Fragment>
        ))}
      </div>
      <p
        className={cn(
          "text-caption mt-4 text-center",
          after ? "text-muted-foreground" : "text-muted-foreground/30",
        )}
      >
        {active.note}
      </p>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */

export function ExcalidrawExcalidrawMcpDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Every box turns up with its name already on it."
        before={<OrderPair after={false} />}
        after={<OrderPair after />}
      />
      <BeforeAfter
        principle="The view goes to whatever is being drawn, so you can follow along."
        before={<CameraPair after={false} />}
        after={<CameraPair after />}
      />
      <BeforeAfter
        principle="The name stays in the middle of the box, however long you make it."
        before={<LabelPair after={false} />}
        after={<LabelPair after />}
      />
      <BeforeAfter
        principle="The drawing fills the frame, so you can still read it pulled right back."
        before={<ZoomPair after={false} />}
        after={<ZoomPair after />}
      />
      <BeforeAfter
        principle="Drag the edge — the cat keeps its shape instead of stretching."
        before={<AspectPair after={false} />}
        after={<AspectPair after />}
      />
      <BeforeAfter
        principle="Adding one more step no longer redraws the whole thing."
        before={<GrowPair after={false} />}
        after={<GrowPair after />}
      />
      <BeforeAfter
        principle="Writing on an arrow stops landing on top of the boxes."
        before={<ArrowLabelPair after={false} />}
        after={<ArrowLabelPair after />}
      />
      <BeforeAfter
        principle="You can actually read the notes on the drawing."
        before={<ContrastPair after={false} />}
        after={<ContrastPair after />}
      />
    </div>
  );
}
