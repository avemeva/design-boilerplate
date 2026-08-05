"use client";

import {
  Check,
  ChevronDown,
  File,
  FileSpreadsheet,
  FileText,
  Folder,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  Presentation,
  Rows3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Extend UI — the document-agent component registry (55 items).
 *
 * Rebuilt here: the parts a person can see the difference in —
 * citations that point back at the page, confidence on extracted
 * values, page splitting, the upload surface, and the Finder-style
 * browser (type-ahead, search context, previews, panel-width layout).
 *
 * Left where it was: the registry plumbing, the shadcn install path,
 * the icon-sprite / shadow-DOM palette work, virtualization internals.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/* ── the document everything cites ────────────────────────────────── */

const PAGE_W = 252;
const PAGE_H = 326;
const PAGE_GAP = 12;
const PAGE_PAD = 12;

type Mark =
  | { kind: "text"; t: number; l: number; text: string; strong?: boolean }
  | { kind: "bar"; t: number; l: number; w: number };

const DOC: Mark[][] = [
  [
    { kind: "text", t: 6, l: 8, text: "INVOICE", strong: true },
    { kind: "text", t: 6.5, l: 58, text: "Nordwind Freight" },
    { kind: "bar", t: 13.5, l: 8, w: 30 },
    { kind: "text", t: 20, l: 8, text: "Invoice number" },
    { kind: "text", t: 20, l: 56, text: "INV-2291", strong: true },
    { kind: "text", t: 27, l: 8, text: "Issue date" },
    { kind: "text", t: 27, l: 56, text: "2026-04-02", strong: true },
    { kind: "text", t: 34, l: 8, text: "Payment terms" },
    { kind: "text", t: 34, l: 56, text: "Net 30", strong: true },
    { kind: "bar", t: 43, l: 8, w: 22 },
    { kind: "text", t: 50, l: 8, text: "Bill to" },
    { kind: "text", t: 56, l: 8, text: "Kestrel Logistics Ltd", strong: true },
    { kind: "bar", t: 64, l: 8, w: 44 },
    { kind: "bar", t: 69, l: 8, w: 38 },
    { kind: "bar", t: 79, l: 8, w: 84 },
    { kind: "bar", t: 84, l: 8, w: 72 },
    { kind: "bar", t: 89, l: 8, w: 80 },
  ],
  [
    { kind: "text", t: 7, l: 8, text: "Line items", strong: true },
    { kind: "bar", t: 16, l: 8, w: 84 },
    { kind: "bar", t: 22, l: 8, w: 78 },
    { kind: "bar", t: 28, l: 8, w: 84 },
    { kind: "bar", t: 34, l: 8, w: 66 },
    { kind: "bar", t: 40, l: 8, w: 80 },
    { kind: "bar", t: 46, l: 8, w: 74 },
    { kind: "bar", t: 52, l: 8, w: 84 },
    { kind: "text", t: 64, l: 8, text: "Total due" },
    { kind: "text", t: 64, l: 56, text: "18,420.00", strong: true },
    { kind: "bar", t: 77, l: 8, w: 60 },
    { kind: "bar", t: 82, l: 8, w: 52 },
  ],
  [
    { kind: "text", t: 7, l: 8, text: "Terms and conditions", strong: true },
    { kind: "bar", t: 16, l: 8, w: 84 },
    { kind: "bar", t: 21, l: 8, w: 80 },
    { kind: "bar", t: 26, l: 8, w: 84 },
    { kind: "bar", t: 31, l: 8, w: 62 },
    { kind: "text", t: 48, l: 8, text: "Authorised by" },
    { kind: "text", t: 54, l: 8, text: "M. Feld, Controller", strong: true },
    { kind: "bar", t: 67, l: 8, w: 40 },
  ],
];

type Cite = {
  field: string;
  value: string;
  page: number;
  box: { t: number; l: number; w: number; h: number };
};

const CITES: Cite[] = [
  {
    field: "Invoice number",
    value: "INV-2291",
    page: 0,
    box: { t: 18.6, l: 54, w: 27, h: 6 },
  },
  {
    field: "Issue date",
    value: "2026-04-02",
    page: 0,
    box: { t: 25.6, l: 54, w: 32, h: 6 },
  },
  {
    field: "Bill to",
    value: "Kestrel Logistics Ltd",
    page: 0,
    box: { t: 54.6, l: 6, w: 56, h: 6 },
  },
  {
    field: "Total due",
    value: "18,420.00",
    page: 1,
    box: { t: 62.6, l: 54, w: 30, h: 6 },
  },
  {
    field: "Signed by",
    value: "M. Feld, Controller",
    page: 2,
    box: { t: 52.6, l: 6, w: 52, h: 6 },
  },
];

function DocPage({
  index,
  zoom,
  children,
}: {
  index: number;
  zoom: number;
  children?: ReactNode;
}) {
  const w = PAGE_W * zoom;
  const h = PAGE_H * zoom;
  const size = Math.round(h * 0.033);

  return (
    <div
      className="bg-card relative shrink-0 overflow-hidden rounded-md border"
      style={{ width: w, height: h }}
    >
      {DOC[index].map((m, i) =>
        m.kind === "text" ? (
          <span
            key={i}
            className={cn(
              "absolute whitespace-nowrap",
              m.strong
                ? "text-foreground font-medium"
                : "text-muted-foreground",
            )}
            style={{
              left: `${m.l}%`,
              top: `${m.t}%`,
              fontSize: size,
              lineHeight: 1.2,
            }}
          >
            {m.text}
          </span>
        ) : (
          <div
            key={i}
            className="bg-muted absolute rounded-full"
            style={{
              left: `${m.l}%`,
              top: `${m.t}%`,
              width: `${m.w}%`,
              height: Math.max(2, h * 0.011),
            }}
          />
        ),
      )}
      <span
        className="text-muted-foreground absolute bottom-2 left-1/2 -translate-x-1/2 tabular-nums"
        style={{ fontSize: Math.max(8, Math.round(size * 0.85)) }}
      >
        {index + 1}
      </span>
      {children}
    </div>
  );
}

/* ── 1 · the value points back at the page ────────────────────────── */

function FieldRow({
  cite,
  active,
  onSelect,
}: {
  cite: Cite;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "duration-fast ease-out-quart block min-h-9 w-full rounded-lg px-3 py-2 text-left transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "hover:bg-secondary text-foreground",
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-caption",
            active ? "opacity-70" : "text-muted-foreground",
          )}
        >
          {cite.field}
        </span>
        <span
          className={cn(
            "text-micro tabular-nums",
            active ? "opacity-70" : "text-muted-foreground",
          )}
        >
          p.{cite.page + 1}
        </span>
      </span>
      <span className="text-ui-sm block truncate">{cite.value}</span>
    </button>
  );
}

function CitationPair({ after }: Side) {
  const [active, setActive] = useState<number | null>(null);
  const vp = useRef<HTMLDivElement>(null);

  const select = (i: number) => {
    setActive(i);
    if (!after) return;
    const c = CITES[i];
    const top =
      PAGE_PAD + c.page * (PAGE_H + PAGE_GAP) + (c.box.t / 100) * PAGE_H - 64;
    vp.current?.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
      <div className="space-y-0.5">
        {CITES.map((c, i) => (
          <FieldRow
            key={c.field}
            cite={c}
            active={active === i}
            onSelect={() => select(i)}
          />
        ))}
      </div>

      <div
        ref={vp}
        className="bg-secondary h-80 overflow-auto rounded-xl border p-3"
      >
        <div className="flex flex-col items-center gap-3">
          {DOC.map((_, page) => (
            <DocPage key={page} index={page} zoom={1}>
              {after && active !== null && CITES[active].page === page ? (
                <motion.span
                  key={active}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: duration.base, ease: ease.outQuart }}
                  className="border-accent-solid bg-accent/60 absolute rounded-xs border"
                  style={{
                    left: `${CITES[active].box.l}%`,
                    top: `${CITES[active].box.t}%`,
                    width: `${CITES[active].box.w}%`,
                    height: `${CITES[active].box.h}%`,
                  }}
                />
              ) : null}
            </DocPage>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 2 · the mark stays on the words when you zoom ────────────────── */

const ZOOMS = [1, 1.4, 1.8] as const;

function ZoomPair({ after }: Side) {
  const [zoom, setZoom] = useState<number>(1);
  const c = CITES[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption text-muted-foreground">
          Marked on the page: {c.field}
        </span>
        <div className="bg-secondary ml-auto inline-flex rounded-lg p-0.5">
          {ZOOMS.map((z) => (
            <button
              key={z}
              type="button"
              aria-pressed={zoom === z}
              onClick={() => setZoom(z)}
              className={cn(
                "text-ui-sm duration-fast ease-out-quart h-9 rounded-md px-3 tabular-nums transition-colors",
                zoom === z
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>
      </div>

      <div className="bg-secondary h-80 overflow-auto rounded-xl border p-3">
        <div className="flex w-fit min-w-full flex-col items-center gap-3">
          <DocPage index={0} zoom={zoom}>
            <span
              className="border-accent-solid bg-accent/60 absolute rounded-xs border"
              style={
                after
                  ? {
                      left: `${c.box.l}%`,
                      top: `${c.box.t}%`,
                      width: `${c.box.w}%`,
                      height: `${c.box.h}%`,
                    }
                  : {
                      left: (c.box.l / 100) * PAGE_W,
                      top: (c.box.t / 100) * PAGE_H,
                      width: (c.box.w / 100) * PAGE_W,
                      height: (c.box.h / 100) * PAGE_H,
                    }
              }
            />
          </DocPage>
        </div>
      </div>
    </div>
  );
}

/* ── 3 · the machine admits what it is unsure about ───────────────── */

type Guess = { field: string; value: string; confidence: number };

const GUESSES: Guess[] = [
  { field: "Invoice number", value: "INV-2291", confidence: 0.99 },
  { field: "Issue date", value: "2026-04-02", confidence: 0.97 },
  { field: "Bill to", value: "Kestrel Logistics Ltd", confidence: 0.96 },
  { field: "Purchase order", value: "PO-4417", confidence: 0.41 },
  { field: "Total due", value: "18,420.00", confidence: 0.98 },
  { field: "Tax rate", value: "7.5%", confidence: 0.38 },
];

function ConfidencePair({ after }: Side) {
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const ordered = useMemo(
    () => (after ? [...GUESSES].sort((a, b) => a.confidence - b.confidence) : GUESSES),
    [after],
  );

  const pending = GUESSES.filter(
    (g) => g.confidence < 0.7 && !confirmed.includes(g.field),
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-ui">Extracted fields</span>
        {after ? (
          <span
            className={cn(
              "text-micro rounded-full px-2.5 py-1 uppercase",
              pending > 0
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-positive",
            )}
          >
            {pending > 0 ? `${pending} to check` : "all checked"}
          </span>
        ) : (
          <span className="text-micro bg-secondary text-muted-foreground rounded-full px-2.5 py-1 uppercase">
            6 fields
          </span>
        )}
      </div>

      <div className="divide-y rounded-xl border">
        {ordered.map((g) => {
          const low = after && g.confidence < 0.7;
          const done = confirmed.includes(g.field);
          const value = draft[g.field] ?? g.value;
          return (
            <div
              key={g.field}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5",
                low && !done && "bg-secondary",
              )}
            >
              <span className="text-caption text-muted-foreground w-28 shrink-0">
                {g.field}
              </span>

              {low && !done ? (
                <>
                  <label htmlFor={`fix-${g.field}`} className="sr-only">
                    {g.field}
                  </label>
                  <input
                    id={`fix-${g.field}`}
                    value={value}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [g.field]: e.target.value }))
                    }
                    className="text-ui-sm border-border bg-card focus:border-accent-solid focus:ring-accent-solid/20 h-9 min-w-0 flex-1 rounded-lg border px-2.5 tabular-nums outline-none focus:ring-3"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmed((c) => [...c, g.field])}
                    className="text-ui-sm bg-primary text-primary-foreground hover:bg-primary/80 duration-fast ease-out-quart h-9 shrink-0 rounded-lg px-3 transition-colors"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <span className="text-ui-sm min-w-0 flex-1 truncate tabular-nums">
                  {value}
                </span>
              )}

              {after ? (
                <span
                  className={cn(
                    "text-micro inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 uppercase",
                    done
                      ? "bg-secondary text-positive"
                      : low
                        ? "bg-card text-foreground border"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 rounded-full",
                        low ? "bg-accent-solid" : "bg-positive",
                      )}
                    />
                  )}
                  {done ? "checked" : `${Math.round(g.confidence * 100)}% sure`}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 4 · cutting a file up by moving its pages ────────────────────── */

const SPLIT_PAGES = [1, 2, 3, 4, 5, 6, 7, 8];
const GROUP_NAMES = ["Invoice", "Packing slip", "Customs form"];

function PageThumb({ page, selected }: { page: number; selected?: boolean }) {
  return (
    <span
      className={cn(
        "bg-card flex h-16 w-12 shrink-0 flex-col justify-between rounded-md border p-1.5",
        selected && "border-accent-solid ring-accent-solid/20 ring-3",
      )}
    >
      <span className="block space-y-1">
        <span className="bg-muted block h-1 w-3/4 rounded-full" />
        <span className="bg-muted block h-1 w-full rounded-full" />
        <span className="bg-muted block h-1 w-2/3 rounded-full" />
      </span>
      <span className="text-micro text-muted-foreground block text-center tabular-nums">
        {page}
      </span>
    </span>
  );
}

function SplitPair({ after }: Side) {
  const [groups, setGroups] = useState<number[][]>([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8],
  ]);
  const [picked, setPicked] = useState<number | null>(null);
  const dragged = useRef<number | null>(null);

  const move = useCallback((page: number, to: number) => {
    setGroups((gs) =>
      gs.map((g, i) => {
        const without = g.filter((p) => p !== page);
        if (i !== to) return without;
        return [...without, page].sort((a, b) => a - b);
      }),
    );
  }, []);

  const groupOf = (page: number) => groups.findIndex((g) => g.includes(page));

  if (!after) {
    return (
      <div className="space-y-3">
        <div className="divide-y rounded-xl border">
          {SPLIT_PAGES.map((p) => (
            <div key={p} className="flex items-center gap-3 px-3 py-2">
              <label
                htmlFor={`split-${p}`}
                className="text-caption text-muted-foreground w-16 shrink-0 tabular-nums"
              >
                Page {p}
              </label>
              <select
                id={`split-${p}`}
                value={groupOf(p)}
                onChange={(e) => move(p, Number(e.target.value))}
                className="text-ui-sm border-border bg-card focus:border-accent-solid focus:ring-accent-solid/20 h-9 rounded-lg border px-2.5 outline-none focus:ring-3"
              >
                {GROUP_NAMES.map((n, i) => (
                  <option key={n} value={i}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="text-caption text-muted-foreground tabular-nums">
          {groups
            .map((g, i) => `${GROUP_NAMES[i]}: ${g.join(", ") || "empty"}`)
            .join("   ·   ")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {groups.map((g, gi) => (
        <div
          key={GROUP_NAMES[gi]}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const p = dragged.current;
            if (p !== null) move(p, gi);
            dragged.current = null;
          }}
          className="bg-secondary rounded-xl border p-3"
        >
          <div className="mb-2.5 flex items-baseline justify-between gap-2">
            <span className="text-ui-sm">{GROUP_NAMES[gi]}</span>
            <span className="text-micro text-muted-foreground tabular-nums uppercase">
              {g.length} pp
            </span>
          </div>
          <button
            type="button"
            aria-label={`Move the picked page into ${GROUP_NAMES[gi]}`}
            onClick={() => {
              if (picked !== null) {
                move(picked, gi);
                setPicked(null);
              }
            }}
            className={cn(
              "flex min-h-20 w-full flex-wrap gap-2 rounded-lg border border-dashed p-2 text-left transition-colors",
              picked !== null && !g.includes(picked)
                ? "border-accent-solid bg-accent/40"
                : "border-transparent",
            )}
          >
            {g.map((p) => (
              <span
                key={p}
                draggable
                onDragStart={(e) => {
                  dragged.current = p;
                  e.dataTransfer.setData("text/plain", String(p));
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  dragged.current = null;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPicked((cur) => (cur === p ? null : p));
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <PageThumb page={p} selected={picked === p} />
              </span>
            ))}
            {g.length === 0 && (
              <span className="text-caption text-muted-foreground self-center px-1">
                Drop pages here
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── 5 · a drop area that stays lit ───────────────────────────────── */

const KIND_ICON = {
  pdf: FileText,
  sheet: FileSpreadsheet,
  image: ImageIcon,
  slides: Presentation,
  other: File,
} as const;

type Kind = keyof typeof KIND_ICON;

function DropSurface({
  dragging,
  error,
}: {
  dragging: boolean;
  error?: string | null;
}) {
  return (
    <div
      className={cn(
        "duration-base ease-out-quart pointer-events-none flex min-h-52 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center transition-colors",
        error
          ? "border-destructive/60 bg-secondary"
          : dragging
            ? "border-accent-solid bg-accent/40"
            : "border-border-strong bg-secondary",
      )}
    >
      <div className="relative h-14 w-36">
        {(["image", "pdf", "sheet"] as Kind[]).map((k, i) => {
          const Icon = KIND_ICON[k];
          const idle = [
            "translate(-50%,-50%) rotate(-8deg) translateX(-18px)",
            "translate(-50%,-50%)",
            "translate(-50%,-50%) rotate(8deg) translateX(18px)",
          ][i];
          const open = [
            "translate(-50%,-50%) rotate(-14deg) translateX(-42px)",
            "translate(-50%,-50%) translateY(-8px) scale(1.08)",
            "translate(-50%,-50%) rotate(14deg) translateX(42px)",
          ][i];
          return (
            <span
              key={k}
              className={cn(
                "bg-card absolute top-1/2 left-1/2 grid size-12 place-items-center rounded-lg border transition-transform duration-300 ease-out",
                i === 1 && "z-10",
              )}
              style={{ transform: dragging ? open : idle }}
            >
              <Icon
                className="text-muted-foreground size-5"
                aria-hidden
                strokeWidth={1.5}
              />
            </span>
          );
        })}
      </div>
      <div className="space-y-1">
        <p className="text-ui-sm">
          {dragging ? "Drop to add" : "Drag a file here"}
        </p>
        <p className="text-caption text-muted-foreground">
          PDF, DOCX, XLSX, CSV, PNG
        </p>
        {error && <p className="text-caption text-destructive">{error}</p>}
      </div>
    </div>
  );
}

function DragChip({ name, kind }: { name: string; kind: Kind }) {
  const Icon = KIND_ICON[kind];
  return (
    <span
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", name);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="bg-card text-ui-sm inline-flex h-9 cursor-grab items-center gap-2 rounded-lg border px-3 select-none active:cursor-grabbing"
    >
      <Icon
        className="text-muted-foreground size-4"
        aria-hidden
        strokeWidth={1.5}
      />
      {name}
    </span>
  );
}

function FlickerPair({ after }: Side) {
  const [dragging, setDragging] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const depth = useRef(0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <DragChip name="invoice-2291.pdf" kind="pdf" />
        <DragChip name="manifest.csv" kind="sheet" />
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          depth.current = Math.max(0, depth.current - 1);
          if (!after || depth.current === 0) setDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setDragging(false);
          setAdded(e.dataTransfer.getData("text/plain") || "invoice-2291.pdf");
        }}
      >
        <DropSurface dragging={dragging} />
      </div>

      {added && (
        <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5">
          <FileText
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden
            strokeWidth={1.5}
          />
          <span className="text-ui-sm min-w-0 flex-1 truncate">{added}</span>
          <button
            type="button"
            aria-label={`Remove ${added}`}
            onClick={() => setAdded(null)}
            className="hover:bg-secondary grid size-9 shrink-0 place-items-center rounded-lg transition-colors"
          >
            <X className="text-muted-foreground size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 6 · the file it cannot take, said out loud ───────────────────── */

function RejectPair({ after }: Side) {
  const [dragging, setDragging] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const depth = useRef(0);

  const accept = (name: string) => {
    if (/\.(pdf|docx|xlsx|csv|png)$/i.test(name)) {
      setError(null);
      setAdded((a) => (a.includes(name) ? a : [...a, name]));
      return;
    }
    if (after) {
      const ext = name.split(".").pop()?.toUpperCase() ?? "Those";
      setError(`${ext} files are not supported here. Nothing was added.`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <DragChip name="invoice-2291.pdf" kind="pdf" />
        <DragChip name="scans.zip" kind="other" />
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setDragging(false);
          accept(e.dataTransfer.getData("text/plain") || "invoice-2291.pdf");
        }}
      >
        <DropSurface dragging={dragging} error={error} />
      </div>

      {added.length > 0 && (
        <div className="divide-y rounded-xl border">
          {added.map((name) => (
            <div key={name} className="flex items-center gap-3 px-3 py-2.5">
              <FileText
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
                strokeWidth={1.5}
              />
              <span className="text-ui-sm min-w-0 flex-1 truncate">{name}</span>
              <span className="text-micro bg-secondary text-muted-foreground shrink-0 rounded-full px-2.5 py-1 uppercase">
                ready
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 7 · the panel measures itself, not the window ────────────────── */

const VIEWS = [
  { id: "list", label: "List view", Icon: ListIcon },
  { id: "icons", label: "Icon view", Icon: LayoutGrid },
  { id: "columns", label: "Column view", Icon: Rows3 },
] as const;

const PANEL_FILES = [
  { name: "invoice-2291.pdf", meta: "PDF · 240 KB" },
  { name: "manifest-04-02.csv", meta: "CSV · 12 KB" },
  { name: "packing-slip.pdf", meta: "PDF · 88 KB" },
];

function PanelWidthPair({ after }: Side) {
  const [width, setWidth] = useState(560);
  const [view, setView] = useState<string>("list");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const resize = (clientX: number) => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return;
    setWidth(Math.min(box.width, Math.max(280, clientX - box.left)));
  };

  const compactSearch = after && width < 520;
  const compactSort = after && width < 430;
  const hideTitle = after && width < 370;
  const inputId = after ? "panel-search-after" : "panel-search-before";

  return (
    <div ref={wrap} className="relative">
      <div
        className="bg-card overflow-hidden rounded-xl border"
        style={{ width, maxWidth: "100%" }}
      >
        <div className="flex h-14 items-center gap-2 border-b px-3">
          {!hideTitle && (
            <span className="text-ui shrink-0 truncate">Documents</span>
          )}

          <div className="bg-secondary ml-auto inline-flex shrink-0 rounded-lg p-0.5">
            {VIEWS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={cn(
                  "duration-fast ease-out-quart grid size-9 place-items-center rounded-md transition-colors",
                  view === id
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden strokeWidth={1.5} />
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Sort by name"
            className="text-ui-sm bg-secondary text-muted-foreground hover:text-foreground inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 transition-colors"
          >
            <SlidersHorizontal
              className="size-4"
              aria-hidden
              strokeWidth={1.5}
            />
            {!compactSort && (
              <>
                <span>Name</span>
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </>
            )}
          </button>

          {compactSearch ? (
            <button
              type="button"
              aria-label="Search files"
              onClick={() => setSearchOpen((o) => !o)}
              className="bg-secondary text-muted-foreground hover:text-foreground relative grid size-9 shrink-0 place-items-center rounded-lg transition-colors"
            >
              <Search className="size-4" aria-hidden strokeWidth={1.5} />
              {query && (
                <span
                  aria-hidden
                  className="bg-accent-solid absolute top-1.5 right-1.5 size-1.5 rounded-full"
                />
              )}
            </button>
          ) : (
            <div className="relative w-44 shrink-0">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                aria-hidden
                strokeWidth={1.5}
              />
              <label htmlFor={inputId} className="sr-only">
                Search files
              </label>
              <input
                id={inputId}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="text-ui-sm border-border bg-card focus:border-accent-solid focus:ring-accent-solid/20 h-9 w-full rounded-lg border pr-2.5 pl-8 outline-none focus:ring-3"
              />
            </div>
          )}
        </div>

        {compactSearch && searchOpen && (
          <div className="border-b p-2">
            <label htmlFor={`${inputId}-compact`} className="sr-only">
              Search files
            </label>
            <input
              id={`${inputId}-compact`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="text-ui-sm border-border bg-card focus:border-accent-solid focus:ring-accent-solid/20 h-9 w-full rounded-lg border px-2.5 outline-none focus:ring-3"
            />
          </div>
        )}

        <div className="divide-y">
          {PANEL_FILES.filter((f) =>
            f.name.toLowerCase().includes(query.trim().toLowerCase()),
          ).map((f) => (
            <div key={f.name} className="flex items-center gap-3 px-3 py-2.5">
              <FileText
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
                strokeWidth={1.5}
              />
              <span className="text-ui-sm min-w-0 flex-1 truncate">
                {f.name}
              </span>
              <span className="text-caption text-muted-foreground shrink-0 tabular-nums">
                {f.meta}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Drag to resize the panel"
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            resize(e.clientX);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setWidth((w) => Math.max(280, w - 24));
          if (e.key === "ArrowRight") setWidth((w) => w + 24);
        }}
        className="bg-secondary hover:bg-muted focus-visible:ring-accent-solid/40 absolute top-1/2 -mt-6 h-12 w-2.5 -translate-x-1/2 cursor-col-resize touch-none rounded-full border transition-colors outline-none focus-visible:ring-3"
        style={{ left: width }}
      />
    </div>
  );
}

/* ── 8 · type the name, land on the file ──────────────────────────── */

const BROWSE_FILES = [
  "Acme MSA.pdf",
  "Amex statement.xlsx",
  "Berlin lease.pdf",
  "Broker note.docx",
  "Carrier invoice.pdf",
  "Customs form.pdf",
  "Delivery log.csv",
  "Freight quote.pdf",
  "Insurance rider.pdf",
  "Kestrel invoice.pdf",
  "Manifest 04-02.csv",
  "Packing slip.pdf",
  "Port receipt.pdf",
  "Rate sheet.xlsx",
  "Statement of work.docx",
  "Vendor W-9.pdf",
];

function TypeAheadPair({ after }: Side) {
  const [selected, setSelected] = useState(0);
  const [typed, setTyped] = useState("");
  const buffer = useRef("");
  const lastKey = useRef(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);

  const land = (index: number) => {
    setSelected(index);
    rows.current[index]?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      land(
        e.key === "ArrowDown"
          ? Math.min(BROWSE_FILES.length - 1, selected + 1)
          : Math.max(0, selected - 1),
      );
      return;
    }
    if (!after) return;
    if (e.key.length !== 1 || !/[a-z0-9]/i.test(e.key)) return;
    e.preventDefault();

    const now = Date.now();
    const key = e.key.toLowerCase();
    let next = now - lastKey.current > 1000 ? key : buffer.current + key;
    lastKey.current = now;

    let from = 0;
    if (next.length > 1 && next.split("").every((c) => c === next[0])) {
      next = next[0];
      from = selected + 1;
    }
    buffer.current = next;
    setTyped(next);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      buffer.current = "";
      setTyped("");
    }, 1000);

    const hit = BROWSE_FILES.map(
      (_, i) => (from + i) % BROWSE_FILES.length,
    ).find((i) => BROWSE_FILES[i].toLowerCase().startsWith(next));
    if (hit !== undefined) land(hit);
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="focus-visible:ring-accent-solid/40 rounded-xl border outline-none focus-visible:ring-3"
    >
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <Folder
          className="text-muted-foreground size-4"
          aria-hidden
          strokeWidth={1.5}
        />
        <span className="text-ui-sm">Shipments</span>
        <span
          className={cn(
            "text-micro ml-auto rounded-md border px-2 py-1 uppercase",
            typed
              ? "bg-accent text-accent-foreground border-transparent"
              : "text-muted-foreground",
          )}
        >
          {typed || "a–z"}
        </span>
      </div>
      <div className="h-56 overflow-auto">
        {BROWSE_FILES.map((name, i) => (
          <button
            key={name}
            ref={(el) => {
              rows.current[i] = el;
            }}
            type="button"
            aria-pressed={selected === i}
            onClick={() => land(i)}
            className={cn(
              "text-ui-sm flex h-10 w-full items-center gap-2.5 px-3 text-left transition-colors",
              selected === i
                ? "bg-accent text-accent-foreground"
                : "hover:bg-secondary",
            )}
          >
            <FileText
              className={cn(
                "size-4 shrink-0",
                selected === i ? "opacity-70" : "text-muted-foreground",
              )}
              aria-hidden
              strokeWidth={1.5}
            />
            <span className="truncate">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── 9 · a result still knows which folder it lives in ────────────── */

const TREE: { folder: string; files: string[] }[] = [
  { folder: "Contracts", files: ["Acme MSA.pdf", "Vendor W-9.pdf"] },
  { folder: "Invoices / 2026", files: ["invoice-2291.pdf", "rate-sheet.xlsx"] },
  { folder: "Archive / 2025", files: ["invoice-2291.pdf", "ledger.csv"] },
  { folder: "Shipping", files: ["manifest.csv", "packing-slip.pdf"] },
];

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="bg-accent text-accent-foreground rounded-xs">
        {text.slice(at, at + q.length)}
      </span>
      {text.slice(at + q.length)}
    </>
  );
}

function SearchContextPair({ after }: Side) {
  const [query, setQuery] = useState("invoice");
  const q = query.trim().toLowerCase();
  const inputId = after ? "tree-search-after" : "tree-search-before";

  const matches = TREE.map((g) => ({
    ...g,
    files: g.files.filter((f) => (q ? f.toLowerCase().includes(q) : true)),
  })).filter((g) => g.files.length > 0);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
          strokeWidth={1.5}
        />
        <label htmlFor={inputId} className="sr-only">
          Search these folders
        </label>
        <input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search these folders"
          className="text-ui-sm border-border bg-card focus:border-accent-solid focus:ring-accent-solid/20 h-9 w-full rounded-lg border pr-3 pl-9 outline-none focus:ring-3"
        />
      </div>

      <div className="min-h-56 rounded-xl border p-2">
        {matches.length === 0 && (
          <p className="text-caption text-muted-foreground px-2 py-4">
            Nothing here matches.
          </p>
        )}

        {!after
          ? matches
              .flatMap((g) => g.files)
              .map((f, i) => (
                <div
                  key={`${f}-${i}`}
                  className="text-ui-sm flex h-9 items-center gap-2.5 px-2"
                >
                  <FileText
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden
                    strokeWidth={1.5}
                  />
                  <span className="truncate">{f}</span>
                </div>
              ))
          : matches.map((g) => (
              <div key={g.folder} className="mb-1 last:mb-0">
                <div className="text-caption text-muted-foreground flex h-9 items-center gap-1.5 px-2">
                  <ChevronDown className="size-3.5 shrink-0" aria-hidden />
                  <Folder
                    className="size-4 shrink-0"
                    aria-hidden
                    strokeWidth={1.5}
                  />
                  <span className="truncate">{g.folder}</span>
                  <span className="text-micro ml-auto shrink-0 tabular-nums uppercase">
                    {g.files.length}
                  </span>
                </div>
                {g.files.map((f) => (
                  <div
                    key={f}
                    className="text-ui-sm hover:bg-secondary ml-4 flex h-9 items-center gap-2.5 rounded-lg px-2 transition-colors"
                  >
                    <FileText
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden
                      strokeWidth={1.5}
                    />
                    <span className="truncate">
                      <Highlight text={f} query={query} />
                    </span>
                  </div>
                ))}
              </div>
            ))}
      </div>
    </div>
  );
}

/* ── 10 · flicking past files without a spinner each time ─────────── */

const PREVIEW_FILES = [
  "invoice-2291.pdf",
  "manifest-04-02.csv",
  "packing-slip.pdf",
  "rate-sheet.xlsx",
  "port-receipt.pdf",
  "customs-form.pdf",
];

function PreviewSheet({ name }: { name: string }) {
  return (
    <div className="bg-card mx-auto flex h-full w-40 flex-col gap-2 rounded-md border p-3">
      <p className="text-micro text-muted-foreground truncate uppercase">
        {name}
      </p>
      <div className="bg-muted h-1.5 w-4/5 rounded-full" />
      <div className="bg-muted h-1.5 w-full rounded-full" />
      <div className="bg-muted h-1.5 w-2/3 rounded-full" />
      <div className="bg-muted h-1.5 w-11/12 rounded-full" />
      <div className="bg-muted h-1.5 w-1/2 rounded-full" />
      <div className="bg-muted mt-auto h-1.5 w-3/4 rounded-full" />
    </div>
  );
}

function ScrubPair({ after }: Side) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState<string | null>(PREVIEW_FILES[0]);
  const [loading, setLoading] = useState(false);
  const seen = useRef<Set<string>>(new Set([PREVIEW_FILES[0]]));
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = (next: number) => {
    const i = Math.max(0, Math.min(PREVIEW_FILES.length - 1, next));
    setIndex(i);
    const name = PREVIEW_FILES[i];

    if (debounce.current) clearTimeout(debounce.current);
    if (loadTimer.current) clearTimeout(loadTimer.current);

    if (after && seen.current.has(name)) {
      setLoading(false);
      setShown(name);
      return;
    }

    setShown(null);
    const start = () => {
      setLoading(true);
      loadTimer.current = setTimeout(() => {
        seen.current.add(name);
        setLoading(false);
        setShown(name);
      }, 650);
    };

    if (after) {
      setLoading(false);
      debounce.current = setTimeout(start, 300);
    } else {
      start();
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <div className="space-y-2">
        <div className="overflow-hidden rounded-xl border">
          {PREVIEW_FILES.map((name, i) => (
            <button
              key={name}
              type="button"
              aria-pressed={index === i}
              onClick={() => go(i)}
              className={cn(
                "text-ui-sm flex h-9 w-full items-center px-3 text-left transition-colors",
                index === i
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-secondary",
              )}
            >
              <span className="truncate">{name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="text-ui-sm bg-secondary hover:bg-muted h-9 flex-1 rounded-lg transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="text-ui-sm bg-secondary hover:bg-muted h-9 flex-1 rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      <div className="bg-secondary h-64 rounded-xl border p-4">
        <AnimatePresence mode="wait" initial={false}>
          {shown ? (
            <motion.div
              key={shown}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className="h-full"
            >
              <PreviewSheet name={shown} />
            </motion.div>
          ) : (
            <div
              key="empty"
              className="text-caption text-muted-foreground grid h-full place-items-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="border-muted-foreground/40 border-t-foreground size-4 animate-spin rounded-full border"
                  />
                  Loading preview…
                </span>
              ) : (
                <span aria-hidden />
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── 11 · a preview shaped like the thing it shows ────────────────── */

type Doc = { name: string; kind: Kind; ratio: number };

const SHAPES: Doc[] = [
  { name: "invoice-2291.pdf", kind: "pdf", ratio: 1 / 1.294 },
  { name: "kickoff.pptx", kind: "slides", ratio: 16 / 9 },
  { name: "rate-sheet.xlsx", kind: "sheet", ratio: 16 / 10 },
  { name: "dock-photo.png", kind: "image", ratio: 3 / 2 },
];

function ShapeContent({ doc }: { doc: Doc }) {
  if (doc.kind === "slides") {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-2 p-4">
        <div className="bg-muted h-3 w-3/5 rounded-full" />
        <div className="bg-muted h-1.5 w-4/5 rounded-full" />
        <div className="bg-muted h-1.5 w-2/3 rounded-full" />
      </div>
    );
  }
  if (doc.kind === "image") {
    return (
      <div className="bg-muted grid h-full w-full place-items-center">
        <ImageIcon
          className="text-muted-foreground size-6"
          aria-hidden
          strokeWidth={1.5}
        />
      </div>
    );
  }
  if (doc.kind === "sheet") {
    return (
      <div className="grid h-full w-full grid-cols-5 grid-rows-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="border-r border-b" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex h-full w-full flex-col gap-1.5 p-3">
      <div className="bg-muted h-2 w-1/2 rounded-full" />
      <div className="bg-muted h-1 w-full rounded-full" />
      <div className="bg-muted h-1 w-5/6 rounded-full" />
      <div className="bg-muted h-1 w-full rounded-full" />
      <div className="bg-muted h-1 w-2/3 rounded-full" />
      <div className="bg-muted mt-auto h-1 w-1/3 rounded-full" />
    </div>
  );
}

function ShapeFrame({
  doc,
  after,
  className,
}: {
  doc: Doc;
  after: boolean;
  className?: string;
}) {
  const frame: CSSProperties = { aspectRatio: after ? doc.ratio : 1 };
  const inner: CSSProperties = after
    ? { width: "100%", height: "100%" }
    : { width: "100%", aspectRatio: doc.ratio };
  return (
    <div
      className={cn("bg-card w-full overflow-hidden rounded-lg border", className)}
      style={frame}
    >
      <div className="overflow-hidden" style={inner}>
        <ShapeContent doc={doc} />
      </div>
    </div>
  );
}

function ShapePair({ after }: Side) {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SHAPES.map((doc, i) => {
          const Icon = KIND_ICON[doc.kind];
          return (
            <button
              key={doc.name}
              type="button"
              aria-pressed={open === i}
              onClick={() => setOpen(i)}
              className={cn(
                "rounded-xl p-2 text-left transition-colors",
                open === i ? "bg-secondary" : "hover:bg-secondary",
              )}
            >
              <ShapeFrame
                doc={doc}
                after={after}
                className={
                  open === i
                    ? "border-accent-solid ring-accent-solid/20 ring-3"
                    : undefined
                }
              />
              <span className="mt-2 flex items-center gap-1.5">
                <Icon
                  className="text-muted-foreground size-3.5 shrink-0"
                  aria-hidden
                  strokeWidth={1.5}
                />
                <span className="text-caption truncate">{doc.name}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-secondary grid place-items-center rounded-xl border p-4">
        <div className="w-full max-w-sm">
          <ShapeFrame doc={SHAPES[open]} after={after} />
        </div>
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function UiComponentsForDocumentAgentsExtendUiDemo() {
  return (
    <div>
      <BeforeAfter
        principle="When a computer pulls a number out of a document, you should be able to see where it got it from. Otherwise you have to go and find it yourself."
        before={<CitationPair after={false} />}
        after={<CitationPair after />}
      />

      <BeforeAfter
        principle="Zooming in to read something should not move the mark off the thing it is marking."
        before={<ZoomPair after={false} />}
        after={<ZoomPair after />}
      />

      <BeforeAfter
        principle="A computer that is guessing should say so. If every answer looks equally certain you check none of them, and the wrong one goes through."
        before={<ConfidencePair after={false} />}
        after={<ConfidencePair after />}
      />

      <BeforeAfter
        principle="Cutting one file into several should feel like moving pages around. Choosing from a menu means holding the whole document in your head."
        before={<SplitPair after={false} />}
        after={<SplitPair after />}
      />

      <BeforeAfter
        principle="A drop area should stay lit the whole time you are over it. When it flickers you think you have missed, and you let go somewhere else."
        before={<FlickerPair after={false} />}
        after={<FlickerPair after />}
      />

      <BeforeAfter
        principle="If a file cannot be used, say so. Silence looks exactly the same as a file that went in fine."
        before={<RejectPair after={false} />}
        after={<RejectPair after />}
      />

      <BeforeAfter
        principle="A panel should lay itself out for the room it actually has, not for the size of your window. Drag the handle and watch the controls."
        before={<PanelWidthPair after={false} />}
        after={<PanelWidthPair after />}
      />

      <BeforeAfter
        principle="In a long list, typing the first letters of a name should take you straight there. Click the list, then type."
        before={<TypeAheadPair after={false} />}
        after={<TypeAheadPair after />}
      />

      <BeforeAfter
        principle="A search result should still tell you which folder it came from. Two files with the same name are the same file until you can see where each one lives."
        before={<SearchContextPair after={false} />}
        after={<SearchContextPair after />}
      />

      <BeforeAfter
        principle="Flicking through files should stay calm. A spinner on every one you pass makes the whole thing feel broken, and one you already opened should come straight back."
        before={<ScrubPair after={false} />}
        after={<ScrubPair after />}
      />

      <BeforeAfter
        principle="A preview should be the shape of the thing it is showing. One square box crops the page and strands the slide."
        before={<ShapePair after={false} />}
        after={<ShapePair after />}
      />
    </div>
  );
}
