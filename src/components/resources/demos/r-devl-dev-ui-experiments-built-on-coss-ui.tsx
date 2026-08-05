"use client";

import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Filter,
  Globe,
  Inbox,
  Key,
  LayoutDashboard,
  Link2,
  Lock,
  Mail,
  MessageSquare,
  MousePointer2,
  Search,
  Settings,
  Shield,
  Sparkles,
  Square,
  Trash2,
  Type,
  Undo2,
  Upload,
  User,
  Users,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * devl.dev publishes 158 screen-level experiments across 18 categories,
 * and it publishes them as light/dark PNGs — no source, no registry
 * (`/r/registry.json` and `/llms.txt` both 404). The components beneath
 * them come from coss-ui, which is Base UI, not Radix, so nothing
 * copies into a shadcn project either.
 *
 * So all 158 are rebuilt here in real DOM, on this project's tokens,
 * under the gallery's own 18 category names and counts. Each is either
 * `live` — you can operate it — or `render`, a composition you can
 * inspect but not drive, which is still a step past the screenshot the
 * gallery ships.
 *
 * The counts in the header are reduced from the table at the bottom, so
 * they cannot drift from what is actually here.
 */

type Kind = "live" | "render";

interface Entry {
  slug: string;
  name: string;
  kind: Kind;
  Demo: React.ComponentType;
}

/* ── shared kit ───────────────────────────────────────────────────── */

const FIELD =
  "text-ui-sm bg-card h-8 w-full rounded-md border px-2.5 outline-none focus-visible:border-ring";
const SOLID =
  "text-ui-sm bg-feature text-feature-foreground inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 transition-opacity hover:opacity-90 disabled:opacity-40";
const GHOST =
  "text-ui-sm text-muted-foreground hover:text-foreground bg-card inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 transition-colors";
const ROW = "text-ui-sm flex h-8 items-center gap-2 rounded-md px-2";

/** Skeleton line. `w` is a Tailwind fraction so nothing is arbitrary. */
function Bar({
  w = "w-full",
  h = "h-2",
  tone = "bg-secondary",
}: {
  w?: string;
  h?: string;
  tone?: string;
}) {
  return <div className={cn("rounded-full", w, h, tone)} aria-hidden="true" />;
}

function Ini({
  n,
  size = "size-6",
  tone = "bg-secondary text-muted-foreground",
}: {
  n: string;
  size?: string;
  tone?: string;
}) {
  return (
    <span
      className={cn(
        "text-micro inline-flex shrink-0 items-center justify-center rounded-full",
        size,
        tone,
      )}
    >
      {n}
    </span>
  );
}

function Dot({ tone = "bg-accent-solid" }: { tone?: string }) {
  return (
    <span
      className={cn("size-1.5 shrink-0 rounded-full", tone)}
      aria-hidden="true"
    />
  );
}

function Chip({
  on,
  children,
  onClick,
}: {
  on?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const cls = cn(
    "text-caption inline-flex h-8 items-center gap-1.5 rounded-full border px-3 transition-colors",
    on
      ? "bg-accent text-accent-foreground border-transparent"
      : "bg-card text-muted-foreground hover:text-foreground",
  );
  if (!onClick) return <span className={cls}>{children}</span>;
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** Switch with an h-8 hit area around a small track. */
function Sw({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className="flex h-8 shrink-0 items-center"
    >
      <span
        className={cn(
          "duration-fast ease-out-quart relative block h-5 w-9 rounded-full border transition-colors",
          on ? "bg-feature border-transparent" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "duration-fast ease-out-quart absolute top-0.5 size-3.5 rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform]",
            on ? "bg-feature-foreground left-4" : "bg-muted-foreground left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Seg<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="bg-secondary inline-flex h-8 items-center gap-0.5 rounded-md border p-0.5"
    >
      {items.map((i) => (
        <button
          key={i}
          type="button"
          aria-pressed={value === i}
          onClick={() => onChange(i)}
          className={cn(
            "text-caption h-8 rounded px-2 transition-colors",
            value === i
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

/** Fixed-height stage, so the gallery reads as a grid of screens. */
function Screen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card h-52 overflow-hidden rounded-lg border", className)}>
      {children}
    </div>
  );
}

/* ══ Layouts ══════════════════════════════════════════════════════ */

const RAIL = [
  { icon: LayoutDashboard, label: "Overview" },
  { icon: Inbox, label: "Inbox" },
  { icon: Users, label: "People" },
  { icon: Settings, label: "Settings" },
];

function LWorkspaceRail() {
  const [at, setAt] = useState(0);
  return (
    <Screen className="grid grid-cols-[9.5rem_minmax(0,1fr)]">
      <div className="bg-secondary space-y-0.5 border-r p-2">
        <p className="text-micro text-muted-foreground px-2 pt-1 pb-2 uppercase">
          Acme Inc
        </p>
        {RAIL.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            type="button"
            aria-current={at === i ? "page" : undefined}
            onClick={() => setAt(i)}
            className={cn(
              ROW,
              "w-full transition-colors",
              at === i
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-3 p-4">
        <p className="text-ui">{RAIL[at].label}</p>
        <Bar w="w-2/3" />
        <Bar />
        <Bar w="w-1/2" />
      </div>
    </Screen>
  );
}

function LMiniRail() {
  const [at, setAt] = useState(1);
  return (
    <Screen className="grid grid-cols-[3rem_minmax(0,1fr)]">
      <div className="bg-secondary flex flex-col items-center gap-1 border-r py-2">
        {RAIL.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-current={at === i ? "page" : undefined}
            onClick={() => setAt(i)}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors",
              at === i
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="space-y-3 p-4">
        <p className="text-ui">{RAIL[at].label}</p>
        <p className="text-caption text-muted-foreground">
          Labels collapse into the icon; the name lives in the pane.
        </p>
        <Bar w="w-3/4" />
        <Bar w="w-1/2" />
      </div>
    </Screen>
  );
}

const TREE = [
  { name: "Getting started", kids: ["Install", "CLI", "Theming"] },
  { name: "Components", kids: ["Button", "Dialog", "Table"] },
  { name: "Recipes", kids: ["Forms", "Data"] },
];

function LDocsTree() {
  const [open, setOpen] = useState<string[]>(["Components"]);
  const [at, setAt] = useState("Dialog");
  return (
    <Screen className="grid grid-cols-[10rem_minmax(0,1fr)]">
      <div className="bg-secondary overflow-y-auto border-r p-2">
        {TREE.map((g) => {
          const isOpen = open.includes(g.name);
          return (
            <div key={g.name}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((v) =>
                    isOpen ? v.filter((x) => x !== g.name) : [...v, g.name],
                  )
                }
                className={cn(ROW, "text-muted-foreground w-full")}
              >
                <ChevronRight
                  className={cn(
                    "duration-fast size-3 transition-transform",
                    isOpen && "rotate-90",
                  )}
                  aria-hidden="true"
                />
                {g.name}
              </button>
              {isOpen &&
                g.kids.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setAt(k)}
                    className={cn(
                      ROW,
                      "ml-4 border-l pl-3 transition-colors",
                      at === k
                        ? "text-accent-foreground border-accent-solid"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {k}
                  </button>
                ))}
            </div>
          );
        })}
      </div>
      <div className="space-y-3 p-4">
        <p className="text-ui">{at}</p>
        <Bar w="w-full" />
        <Bar w="w-5/6" />
        <Bar w="w-2/3" />
      </div>
    </Screen>
  );
}

const THREADS = [
  { from: "Nadia Okonkwo", sub: "Re: Q3 pricing", unread: true },
  { from: "Build bot", sub: "Deploy 4f2a succeeded", unread: true },
  { from: "Tomás Ruiz", sub: "Design review notes", unread: false },
  { from: "Billing", sub: "Invoice #2214", unread: false },
];

function LInboxRail() {
  const [at, setAt] = useState(0);
  return (
    <Screen className="grid grid-cols-[11rem_minmax(0,1fr)]">
      <div className="bg-secondary divide-y overflow-y-auto border-r">
        {THREADS.map((t, i) => (
          <button
            key={t.sub}
            type="button"
            aria-current={at === i ? "true" : undefined}
            onClick={() => setAt(i)}
            className={cn(
              "block w-full px-2.5 py-2 text-left transition-colors",
              at === i ? "bg-card" : "hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-1.5">
              {t.unread && <Dot />}
              <span className="text-ui-sm truncate">{t.from}</span>
            </span>
            <span className="text-caption text-muted-foreground block truncate">
              {t.sub}
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-3 p-4">
        <p className="text-ui">{THREADS[at].sub}</p>
        <p className="text-caption text-muted-foreground">{THREADS[at].from}</p>
        <Bar />
        <Bar w="w-3/4" />
      </div>
    </Screen>
  );
}

function LAppShell() {
  const [panel, setPanel] = useState(true);
  return (
    <Screen className="flex flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-2.5">
        <Ini n="A" tone="bg-feature text-feature-foreground" size="size-5" />
        <span className="text-ui-sm">Acme</span>
        <button
          type="button"
          aria-pressed={panel}
          onClick={() => setPanel((v) => !v)}
          className={cn(GHOST, "ml-auto")}
        >
          {panel ? "Hide panel" : "Show panel"}
        </button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[2.5rem_minmax(0,1fr)_auto]">
        <div className="bg-secondary flex flex-col items-center gap-1 border-r py-2">
          {RAIL.slice(0, 3).map(({ icon: Icon, label }, i) => (
            <span
              key={label}
              className={cn(
                "flex size-8 items-center justify-center rounded-md",
                i === 0
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
          ))}
        </div>
        <div className="space-y-2.5 p-4">
          <Bar w="w-1/2" h="h-2.5" />
          <Bar />
          <Bar w="w-5/6" />
          <Bar w="w-2/3" />
        </div>
        {panel && (
          <div className="bg-secondary w-28 space-y-2 border-l p-2.5">
            <p className="text-micro text-muted-foreground uppercase">Details</p>
            <Bar w="w-full" />
            <Bar w="w-2/3" />
          </div>
        )}
      </div>
    </Screen>
  );
}

const FILES = ["index.tsx", "layout.tsx", "page.tsx", "utils.ts"];

function LTwoPane() {
  const [at, setAt] = useState(0);
  return (
    <Screen className="grid grid-cols-[10rem_minmax(0,1fr)]">
      <div className="bg-secondary space-y-0.5 border-r p-2">
        {FILES.map((f, i) => (
          <button
            key={f}
            type="button"
            onClick={() => setAt(i)}
            aria-current={at === i ? "true" : undefined}
            className={cn(
              ROW,
              "w-full font-mono transition-colors",
              at === i
                ? "bg-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileText className="size-3.5" aria-hidden="true" />
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2.5 p-4">
        <p className="text-ui font-mono">{FILES[at]}</p>
        <Bar w="w-2/3" />
        <Bar w="w-5/6" />
        <Bar w="w-1/2" />
      </div>
    </Screen>
  );
}

const FOLDERS = ["Inbox", "Starred", "Archive"];

function LThreePane() {
  const [folder, setFolder] = useState(0);
  const [item, setItem] = useState(0);
  const items = useMemo(
    () => [0, 1, 2].map((n) => `${FOLDERS[folder]} item ${n + 1}`),
    [folder],
  );
  return (
    <Screen className="grid grid-cols-[5.5rem_7.5rem_minmax(0,1fr)]">
      <div className="bg-secondary space-y-0.5 border-r p-1.5">
        {FOLDERS.map((f, i) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFolder(i);
              setItem(0);
            }}
            aria-current={folder === i ? "true" : undefined}
            className={cn(
              "text-caption flex h-8 w-full items-center rounded-md px-2 transition-colors",
              folder === i
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="divide-y border-r">
        {items.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setItem(i)}
            aria-current={item === i ? "true" : undefined}
            className={cn(
              "text-caption block w-full px-2 py-2 text-left transition-colors",
              item === i ? "bg-secondary" : "text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-2.5 p-3.5">
        <p className="text-ui-sm">{items[item]}</p>
        <Bar />
        <Bar w="w-2/3" />
      </div>
    </Screen>
  );
}

function LSplitResizable() {
  const [pct, setPct] = useState(38);
  const drag = (e: React.PointerEvent<HTMLDivElement>) => {
    const host = e.currentTarget.parentElement;
    if (!host) return;
    const box = host.getBoundingClientRect();
    const move = (ev: PointerEvent) =>
      setPct(
        Math.min(70, Math.max(20, ((ev.clientX - box.left) / box.width) * 100)),
      );
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <Screen className="flex">
      <div
        className="bg-secondary shrink-0 space-y-2 p-3"
        style={{ width: `${pct}%` }}
      >
        <p className="text-micro text-muted-foreground tabular-nums uppercase">
          {Math.round(pct)}%
        </p>
        <Bar w="w-full" />
        <Bar w="w-2/3" />
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panes"
        onPointerDown={drag}
        className="bg-border hover:bg-accent-solid w-px shrink-0 cursor-col-resize border-x-4 border-transparent bg-clip-padding transition-colors"
      />
      <div className="min-w-0 flex-1 space-y-2 p-3">
        <p className="text-ui-sm">Drag the divider</p>
        <Bar />
        <Bar w="w-5/6" />
        <Bar w="w-1/2" />
      </div>
    </Screen>
  );
}

function LFocusMode() {
  const [focus, setFocus] = useState(false);
  return (
    <Screen className="flex flex-col">
      <AnimatePresence initial={false}>
        {!focus && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 36, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="flex shrink-0 items-center gap-2 overflow-hidden border-b px-2.5"
          >
            <Ini n="A" size="size-5" />
            <Bar w="w-1/4" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex min-h-0 flex-1">
        <AnimatePresence initial={false}>
          {!focus && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 88 }}
              exit={{ width: 0 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className="bg-secondary shrink-0 space-y-1.5 overflow-hidden border-r p-2"
            >
              <Bar w="w-2/3" />
              <Bar w="w-full" />
              <Bar w="w-1/2" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div className="space-y-2">
            <p className="text-ui">The chrome retracts</p>
            <Bar w="w-5/6" />
            <Bar w="w-2/3" />
          </div>
          <button
            type="button"
            aria-pressed={focus}
            onClick={() => setFocus((v) => !v)}
            className={cn(GHOST, "self-start")}
          >
            {focus ? "Exit focus" : "Enter focus"}
          </button>
        </div>
      </div>
    </Screen>
  );
}

function LFloatingToolbar() {
  const [marks, setMarks] = useState<string[]>(["bold"]);
  const tools = [
    { id: "bold", label: "Bold", node: <span className="font-semibold">B</span> },
    { id: "italic", label: "Italic", node: <span className="italic">I</span> },
    {
      id: "link",
      label: "Link",
      node: <Link2 className="size-3.5" aria-hidden="true" />,
    },
    { id: "code", label: "Code", node: <span className="font-mono">{"<>"}</span> },
  ];
  const toggle = (id: string) =>
    setMarks((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  return (
    <Screen className="relative p-4">
      <p
        className={cn(
          "text-ui",
          marks.includes("bold") && "font-semibold",
          marks.includes("italic") && "italic",
          marks.includes("link") && "text-accent-foreground underline",
          marks.includes("code") && "bg-secondary rounded px-1 font-mono",
        )}
      >
        The selected run of text.
      </p>
      <p className="text-caption text-muted-foreground mt-2">
        The bar floats over the selection instead of living in top chrome.
      </p>
      <div className="shadow-floating bg-card absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border p-1">
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-label={t.label}
            aria-pressed={marks.includes(t.id)}
            onClick={() => toggle(t.id)}
            className={cn(
              "text-caption flex size-8 items-center justify-center rounded-md transition-colors",
              marks.includes(t.id)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.node}
          </button>
        ))}
      </div>
    </Screen>
  );
}

function LCanvasTools() {
  const [tool, setTool] = useState("Select");
  const tools = [
    { id: "Select", icon: MousePointer2 },
    { id: "Frame", icon: Square },
    { id: "Text", icon: Type },
    { id: "Pen", icon: Sparkles },
  ];
  return (
    <Screen className="relative">
      <div className="bg-secondary size-full p-6">
        <div className="bg-card grid h-full place-items-center rounded-lg border border-dashed">
          <span className="text-caption text-muted-foreground">
            {tool} tool active
          </span>
        </div>
      </div>
      <div className="shadow-floating bg-card absolute top-1/2 left-3 flex -translate-y-1/2 flex-col gap-0.5 rounded-lg border p-1">
        {tools.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-label={id}
            aria-pressed={tool === id}
            onClick={() => setTool(id)}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors",
              tool === id
                ? "bg-feature text-feature-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        ))}
      </div>
    </Screen>
  );
}

function LBottomNav() {
  const [at, setAt] = useState(0);
  const tabs = [
    { icon: LayoutDashboard, label: "Home" },
    { icon: Search, label: "Search" },
    { icon: Bell, label: "Alerts" },
    { icon: User, label: "You" },
  ];
  return (
    <Screen className="mx-auto flex w-48 flex-col">
      <div className="flex-1 space-y-2.5 p-4">
        <p className="text-ui">{tabs[at].label}</p>
        <Bar w="w-2/3" />
        <Bar />
        <Bar w="w-1/2" />
      </div>
      <div className="flex shrink-0 border-t">
        {tabs.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            type="button"
            aria-current={at === i ? "page" : undefined}
            onClick={() => setAt(i)}
            className={cn(
              "flex h-11 flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
              at === i ? "text-accent-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="text-micro">{label}</span>
          </button>
        ))}
      </div>
    </Screen>
  );
}

/* ══ Forms ════════════════════════════════════════════════════════ */

function FWorkspaceSettings() {
  const id = useId();
  const [name, setName] = useState("Acme Inc");
  const [slug, setSlug] = useState("acme");
  const dirty = name !== "Acme Inc" || slug !== "acme";
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Workspace</p>
      <div className="mt-3 space-y-2.5">
        <div>
          <label
            htmlFor={`${id}-n`}
            className="text-caption text-muted-foreground mb-1 block"
          >
            Name
          </label>
          <input
            id={`${id}-n`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={FIELD}
          />
        </div>
        <div>
          <label
            htmlFor={`${id}-s`}
            className="text-caption text-muted-foreground mb-1 block"
          >
            URL slug
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-caption text-muted-foreground shrink-0 font-mono">
              acme.co/
            </span>
            <input
              id={`${id}-s`}
              value={slug}
              spellCheck={false}
              onChange={(e) => setSlug(e.target.value)}
              className={cn(FIELD, "font-mono")}
            />
          </div>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2 pt-3">
        <button
          type="button"
          disabled={!dirty}
          onClick={() => toast.success("Workspace updated")}
          className={SOLID}
        >
          Save
        </button>
        <span className="text-caption text-muted-foreground">
          {dirty ? "Unsaved changes" : "Up to date"}
        </span>
      </div>
    </Screen>
  );
}

function FInvite() {
  const [rows, setRows] = useState([
    { email: "sam@acme.co", role: "Admin" },
    { email: "", role: "Member" },
  ]);
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Invite teammates</p>
      <div className="mt-3 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              value={r.email}
              placeholder="name@company.com"
              aria-label={`Invitee ${i + 1} email`}
              onChange={(e) =>
                setRows((v) =>
                  v.map((x, j) =>
                    j === i ? { ...x, email: e.target.value } : x,
                  ),
                )
              }
              className={FIELD}
            />
            <button
              type="button"
              onClick={() =>
                setRows((v) =>
                  v.map((x, j) =>
                    j === i
                      ? { ...x, role: x.role === "Admin" ? "Member" : "Admin" }
                      : x,
                  ),
                )
              }
              className={cn(GHOST, "w-20 shrink-0")}
            >
              {r.role}
            </button>
            <button
              type="button"
              aria-label={`Remove invitee ${i + 1}`}
              onClick={() => setRows((v) => v.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-destructive flex size-8 shrink-0 items-center justify-center rounded-md transition-colors"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((v) => [...v, { email: "", role: "Member" }])}
        className={cn(GHOST, "mt-2 self-start")}
      >
        Add another
      </button>
      <p className="text-caption text-muted-foreground mt-auto pt-3">
        <span className="text-foreground tabular-nums">{rows.length}</span> seat
        {rows.length === 1 ? "" : "s"} on this invite.
      </p>
    </Screen>
  );
}

const NOTIFY = ["Mentions", "Replies", "Deploys", "Digest"];

function FNotifications() {
  const [on, setOn] = useState<Record<string, string[]>>({
    Mentions: ["email", "push"],
    Replies: ["push"],
    Deploys: ["email"],
    Digest: [],
  });
  const toggle = (row: string, ch: string) =>
    setOn((v) => ({
      ...v,
      [row]: v[row].includes(ch)
        ? v[row].filter((x) => x !== ch)
        : [...v[row], ch],
    }));
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Notifications</p>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] items-center">
        <span />
        <span className="text-micro text-muted-foreground text-center uppercase">
          Email
        </span>
        <span className="text-micro text-muted-foreground text-center uppercase">
          Push
        </span>
        {NOTIFY.map((r) => (
          <div key={r} className="contents">
            <span className="text-caption border-t py-1">{r}</span>
            {["email", "push"].map((ch) => (
              <span key={ch} className="flex justify-center border-t py-1">
                <Sw
                  on={on[r].includes(ch)}
                  onToggle={() => toggle(r, ch)}
                  label={`${r} via ${ch}`}
                />
              </span>
            ))}
          </div>
        ))}
      </div>
    </Screen>
  );
}

function FApiKey() {
  const id = useId();
  const [name, setName] = useState("");
  const [key, setKey] = useState<string | null>(null);
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Create API key</p>
      <label
        htmlFor={id}
        className="text-caption text-muted-foreground mt-3 mb-1 block"
      >
        Label
      </label>
      <input
        id={id}
        value={name}
        placeholder="Production server"
        onChange={(e) => setName(e.target.value)}
        className={FIELD}
      />
      {key ? (
        <div className="bg-secondary mt-3 rounded-md border p-2.5">
          <p className="text-micro text-muted-foreground uppercase">
            Copy it now — shown once
          </p>
          <p className="text-caption mt-1 truncate font-mono">{key}</p>
        </div>
      ) : (
        <p className="text-caption text-muted-foreground mt-3">
          The secret is displayed a single time, at creation.
        </p>
      )}
      <button
        type="button"
        disabled={!name}
        onClick={() => {
          setKey(
            `sk_live_${Math.random().toString(36).slice(2, 10)}${Math.random()
              .toString(36)
              .slice(2, 10)}`,
          );
          toast.success("API key created");
        }}
        className={cn(SOLID, "mt-auto self-start")}
      >
        <Key className="size-3.5" aria-hidden="true" />
        Generate key
      </button>
    </Screen>
  );
}

/* ══ Auth & Onboarding ════════════════════════════════════════════ */

function AuthCard({
  title,
  sub,
  children,
  footer,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-64">
      <p className="text-ui">{title}</p>
      {sub && (
        <p className="text-caption text-muted-foreground mt-0.5">{sub}</p>
      )}
      <div className="mt-3 space-y-2">{children}</div>
      {footer && (
        <p className="text-caption text-muted-foreground mt-3">{footer}</p>
      )}
    </div>
  );
}

function ALogin() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const bad = email.length > 0 && !email.includes("@");
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Signed in");
        }}
        className="bg-card w-full max-w-64 rounded-lg border p-4"
      >
        <p className="text-ui">Sign in</p>
        <label
          htmlFor={`${id}-e`}
          className="text-caption text-muted-foreground mt-3 mb-1 block"
        >
          Email
        </label>
        <input
          id={`${id}-e`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={bad}
          className={cn(FIELD, bad && "border-destructive")}
        />
        <label
          htmlFor={`${id}-p`}
          className="text-caption text-muted-foreground mt-2 mb-1 block"
        >
          Password
        </label>
        <input
          id={`${id}-p`}
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className={FIELD}
        />
        {bad && (
          <p className="text-caption text-destructive mt-1.5">
            That is missing an @.
          </p>
        )}
        <button
          type="submit"
          disabled={bad || !email || !pw}
          className={cn(SOLID, "mt-3 w-full")}
        >
          Continue
        </button>
      </form>
    </Screen>
  );
}

const ONBOARD = ["Your name", "Your team", "Invite people"];

function AOnboarding() {
  const [step, setStep] = useState(0);
  return (
    <Screen className="flex flex-col p-4">
      <div className="flex gap-1">
        {ONBOARD.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= step ? "bg-accent-solid" : "bg-secondary",
            )}
          />
        ))}
      </div>
      <p className="text-micro text-muted-foreground mt-2 uppercase">
        Step {step + 1} of {ONBOARD.length}
      </p>
      <p className="text-ui mt-1">{ONBOARD[step]}</p>
      <input
        aria-label={ONBOARD[step]}
        placeholder={ONBOARD[step]}
        className={cn(FIELD, "mt-3")}
      />
      <div className="mt-auto flex gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className={GHOST}
        >
          Back
        </button>
        <button
          type="button"
          onClick={() =>
            step === ONBOARD.length - 1
              ? toast.success("Workspace ready")
              : setStep((s) => s + 1)
          }
          className={cn(SOLID, "flex-1")}
        >
          {step === ONBOARD.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </Screen>
  );
}

function AWaitlist() {
  const id = useId();
  const [joined, setJoined] = useState(false);
  return (
    <Screen className="bg-feature text-feature-foreground grid place-items-center p-4">
      {joined ? (
        <div className="text-center">
          <Check className="mx-auto size-6" aria-hidden="true" />
          <p className="text-ui mt-2">You are #1,284 in line</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setJoined(true);
          }}
          className="w-full max-w-64 text-center"
        >
          <p className="text-title">Early access</p>
          <p className="text-caption mt-1 opacity-70">
            We are letting people in weekly.
          </p>
          <label htmlFor={id} className="sr-only">
            Email
          </label>
          <input
            id={id}
            type="email"
            required
            placeholder="you@work.com"
            className="text-ui-sm border-feature-line placeholder:text-feature-foreground/50 mt-3 h-8 w-full rounded-md border bg-transparent px-2.5 outline-none"
          />
          <button
            type="submit"
            className="text-ui-sm bg-card text-foreground mt-2 h-8 w-full rounded-md transition-opacity hover:opacity-90"
          >
            Join waitlist
          </button>
        </form>
      )}
    </Screen>
  );
}

function ACheckEmail() {
  const [left, setLeft] = useState(0);
  const tick = () => {
    setLeft(30);
    const t = setInterval(
      () =>
        setLeft((v) => {
          if (v <= 1) clearInterval(t);
          return v - 1;
        }),
      1000,
    );
  };
  return (
    <Screen className="grid place-items-center p-4 text-center">
      <div>
        <Mail className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
        <p className="text-ui mt-2">Check your email</p>
        <p className="text-caption text-muted-foreground mt-1">
          A sign-in link is on its way to sam@acme.co.
        </p>
        <button
          type="button"
          disabled={left > 0}
          onClick={tick}
          className={cn(GHOST, "mt-3")}
        >
          {left > 0 ? `Resend in ${left}s` : "Resend link"}
        </button>
      </div>
    </Screen>
  );
}

function AInsetLogin() {
  return (
    <Screen className="bg-feature p-2">
      <div className="bg-card grid size-full place-items-center rounded-md p-4">
        <AuthCard title="Welcome back" sub="The card is inset in a tinted frame.">
          <input aria-label="Email" placeholder="Email" className={FIELD} />
          <button type="button" className={cn(SOLID, "w-full")}>
            Continue
          </button>
        </AuthCard>
      </div>
    </Screen>
  );
}

function ACenteredSignin() {
  const [remember, setRemember] = useState(true);
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-64 rounded-lg border p-4">
        <AuthCard title="Sign in">
          <input aria-label="Email" placeholder="Email" className={FIELD} />
          <input
            aria-label="Password"
            type="password"
            placeholder="Password"
            className={FIELD}
          />
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground">
              Remember me
            </span>
            <Sw
              on={remember}
              onToggle={() => setRemember((v) => !v)}
              label="Remember me"
            />
          </div>
          <button type="button" className={cn(SOLID, "w-full")}>
            Sign in
          </button>
        </AuthCard>
      </div>
    </Screen>
  );
}

function ACenteredSignup() {
  const [ok, setOk] = useState(false);
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-64 rounded-lg border p-4">
        <AuthCard title="Create account">
          <input aria-label="Full name" placeholder="Full name" className={FIELD} />
          <input aria-label="Work email" placeholder="Work email" className={FIELD} />
          <label className="text-caption text-muted-foreground flex items-center gap-2">
            <input
              type="checkbox"
              checked={ok}
              onChange={(e) => setOk(e.target.checked)}
              className="accent-accent-solid size-3.5"
            />
            I accept the terms
          </label>
          <button
            type="button"
            disabled={!ok}
            className={cn(SOLID, "w-full")}
          >
            Create account
          </button>
        </AuthCard>
      </div>
    </Screen>
  );
}

function ASplitSignin({ side }: { side: "left" | "right" }) {
  const form = (
    <div className="grid place-items-center p-4">
      <AuthCard title="Sign in" sub={`Form on the ${side}.`}>
        <input aria-label="Email" placeholder="Email" className={FIELD} />
        <button type="button" className={cn(SOLID, "w-full")}>
          Continue
        </button>
      </AuthCard>
    </div>
  );
  const art = (
    <div className="bg-feature text-feature-foreground hidden flex-col justify-end gap-2 p-4 sm:flex">
      <Sparkles className="size-5" aria-hidden="true" />
      <p className="text-ui-sm">Ship the whole screen, not the button.</p>
    </div>
  );
  return (
    <Screen className="grid grid-cols-1 sm:grid-cols-2">
      {side === "left" ? form : art}
      {side === "left" ? art : form}
    </Screen>
  );
}

function ALeftSignin() {
  return <ASplitSignin side="left" />;
}

function ARightSignin() {
  return <ASplitSignin side="right" />;
}

function AGlassSignup() {
  return (
    <Screen className="bg-feature relative grid place-items-center p-4">
      <span
        className="bg-accent-solid absolute -top-8 -left-6 size-32 rounded-full opacity-40 blur-2xl"
        aria-hidden="true"
      />
      <span
        className="bg-card absolute -right-4 -bottom-10 size-28 rounded-full opacity-20 blur-2xl"
        aria-hidden="true"
      />
      <div className="border-feature-line text-feature-foreground bg-card/10 relative w-full max-w-64 rounded-lg border p-4 backdrop-blur-md">
        <p className="text-ui">Get started</p>
        <input
          aria-label="Email"
          placeholder="you@work.com"
          className="text-ui-sm border-feature-line placeholder:text-feature-foreground/50 mt-3 h-8 w-full rounded-md border bg-transparent px-2.5 outline-none"
        />
        <button
          type="button"
          className="text-ui-sm bg-card text-foreground mt-2 h-8 w-full rounded-md"
        >
          Sign up
        </button>
      </div>
    </Screen>
  );
}

function AOtpVerify() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const full = code.every((c) => c);
  return (
    <Screen className="grid place-items-center p-4">
      <div className="text-center">
        <p className="text-ui">Enter the 6-digit code</p>
        <div className="mt-3 flex justify-center gap-1.5">
          {code.map((c, i) => (
            <input
              key={i}
              value={c}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                setCode((p) => p.map((x, j) => (j === i ? v : x)));
                if (v) {
                  const next = e.target.parentElement?.children[
                    i + 1
                  ] as HTMLInputElement | undefined;
                  next?.focus();
                }
              }}
              className={cn(
                "text-ui bg-card size-9 rounded-md border text-center tabular-nums outline-none",
                c ? "border-border-strong" : "",
                "focus-visible:border-ring",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          disabled={!full}
          onClick={() => toast.success("Verified")}
          className={cn(SOLID, "mt-3")}
        >
          Verify
        </button>
      </div>
    </Screen>
  );
}

function AResetPassword() {
  const id = useId();
  const [pw, setPw] = useState("");
  const score =
    (pw.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/\d/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  const words = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return (
    <Screen className="grid place-items-center p-4">
      <div className="w-full max-w-64">
        <p className="text-ui">Set a new password</p>
        <label
          htmlFor={id}
          className="text-caption text-muted-foreground mt-3 mb-1 block"
        >
          New password
        </label>
        <input
          id={id}
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className={FIELD}
        />
        <div className="mt-2 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i < score
                  ? score >= 3
                    ? "bg-positive"
                    : "bg-accent-solid"
                  : "bg-secondary",
              )}
            />
          ))}
        </div>
        <p className="text-caption text-muted-foreground mt-1.5">
          {words[score]} — 8+ chars, a capital, a digit, a symbol.
        </p>
      </div>
    </Screen>
  );
}

function ATwoFactor() {
  const [method, setMethod] = useState<"App" | "SMS" | "Key">("App");
  return (
    <Screen className="grid place-items-center p-4">
      <div className="w-full max-w-64">
        <Shield className="text-muted-foreground size-5" aria-hidden="true" />
        <p className="text-ui mt-2">Two-factor required</p>
        <div className="mt-3 space-y-1.5">
          {(["App", "SMS", "Key"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={method === m}
              onClick={() => setMethod(m)}
              className={cn(
                "text-ui-sm flex h-9 w-full items-center gap-2 rounded-md border px-2.5 transition-colors",
                method === m
                  ? "border-accent-solid bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "size-3 rounded-full border",
                  method === m && "border-accent-solid border-4",
                )}
                aria-hidden="true"
              />
              {m === "App"
                ? "Authenticator app"
                : m === "SMS"
                  ? "Text message"
                  : "Security key"}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function AMagicLinkSent() {
  const [opened, setOpened] = useState(false);
  return (
    <Screen className="grid place-items-center p-4 text-center">
      <div>
        <span
          className={cn(
            "mx-auto grid size-10 place-items-center rounded-full",
            opened ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground",
          )}
        >
          {opened ? (
            <Check className="size-5" aria-hidden="true" />
          ) : (
            <Link2 className="size-5" aria-hidden="true" />
          )}
        </span>
        <p className="text-ui mt-2">
          {opened ? "Signed in on this device" : "Magic link sent"}
        </p>
        <p className="text-caption text-muted-foreground mt-1">
          {opened
            ? "The tab that opened the link takes over the session."
            : "Expires in 10 minutes. One use."}
        </p>
        <button
          type="button"
          onClick={() => setOpened((v) => !v)}
          className={cn(GHOST, "mt-3")}
        >
          {opened ? "Reset" : "Simulate opening the link"}
        </button>
      </div>
    </Screen>
  );
}

/* ══ Dashboards ═══════════════════════════════════════════════════ */

const SPARK = [12, 18, 14, 22, 19, 27, 24, 31, 28, 36, 33, 41];

function Spark({ data = SPARK }: { data?: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="text-accent-solid h-8 w-full"
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Metric({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="bg-card rounded-md border p-2.5">
      <p className="text-micro text-muted-foreground uppercase">{label}</p>
      <p className="text-ui mt-0.5 tabular-nums">{value}</p>
      {delta && <p className="text-caption text-positive">{delta}</p>}
    </div>
  );
}

function DMetricsOverview() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const mult = { "7d": 0.3, "30d": 1, "90d": 2.8 }[range];
  return (
    <Screen className="bg-secondary flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <p className="text-ui-sm">Overview</p>
        <Seg
          items={["7d", "30d", "90d"] as const}
          value={range}
          onChange={setRange}
          label="Date range"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Metric
          label="Revenue"
          value={`$${Math.round(48214 * mult).toLocaleString()}`}
          delta="+12.4%"
        />
        <Metric
          label="Signups"
          value={Math.round(1204 * mult).toLocaleString()}
          delta="+3.1%"
        />
        <Metric
          label="Churn"
          value={`${(1.8 / mult).toFixed(1)}%`}
        />
      </div>
      <div className="bg-card flex-1 rounded-md border p-2.5">
        <Spark data={SPARK.map((v) => v * mult)} />
      </div>
    </Screen>
  );
}

function DUsage() {
  const [seats, setSeats] = useState(18);
  const pct = (seats / 25) * 100;
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Plan usage</p>
      <div className="mt-3 space-y-3">
        {[
          { label: "Seats", used: seats, cap: 25 },
          { label: "API calls", used: 812, cap: 1000 },
          { label: "Storage GB", used: 34, cap: 100 },
        ].map((r) => (
          <div key={r.label}>
            <div className="text-caption flex justify-between">
              <span>{r.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {r.used} / {r.cap}
              </span>
            </div>
            <div className="bg-secondary mt-1 h-1.5 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full",
                  (r.used / r.cap) > 0.8 ? "bg-destructive" : "bg-accent-solid",
                )}
                style={{ width: `${(r.used / r.cap) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSeats((s) => Math.min(25, s + 1))}
          className={GHOST}
        >
          Add a seat
        </button>
        <span className="text-caption text-muted-foreground tabular-nums">
          {Math.round(pct)}% of seats used
        </span>
      </div>
    </Screen>
  );
}

function DAnalytics() {
  const [hover, setHover] = useState<number | null>(null);
  const days = [22, 34, 28, 41, 37, 19, 12];
  const names = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Sessions this week</p>
      <p className="text-caption text-muted-foreground mt-0.5 tabular-nums">
        {hover === null
          ? `${days.reduce((a, b) => a + b, 0)}k total`
          : `${names[hover]} · ${days[hover]}k`}
      </p>
      <div className="mt-auto flex h-24 items-end gap-1.5">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${names[i]}: ${d}k sessions`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="flex flex-1 flex-col justify-end"
          >
            <span
              className={cn(
                "duration-fast w-full rounded-t transition-colors",
                hover === i ? "bg-accent-solid" : "bg-secondary",
              )}
              style={{ height: `${(d / 41) * 96}px` }}
            />
          </button>
        ))}
      </div>
      <div className="text-micro text-muted-foreground mt-1 flex gap-1.5">
        {names.map((n, i) => (
          <span key={i} className="flex-1 text-center">
            {n}
          </span>
        ))}
      </div>
    </Screen>
  );
}

function DHome() {
  const [done, setDone] = useState<number[]>([0]);
  const todo = ["Review PR #482", "Approve invoice", "Reply to Nadia"];
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui">Good afternoon, Sam</p>
      <p className="text-caption text-muted-foreground">
        {todo.length - done.length} things need you.
      </p>
      <div className="mt-3 space-y-1">
        {todo.map((t, i) => (
          <label
            key={t}
            className="text-ui-sm flex h-8 cursor-pointer items-center gap-2"
          >
            <input
              type="checkbox"
              checked={done.includes(i)}
              onChange={() =>
                setDone((v) =>
                  v.includes(i) ? v.filter((x) => x !== i) : [...v, i],
                )
              }
              className="accent-accent-solid size-3.5"
            />
            <span
              className={cn(
                done.includes(i) && "text-muted-foreground line-through",
              )}
            >
              {t}
            </span>
          </label>
        ))}
      </div>
    </Screen>
  );
}

function DRevenue() {
  const bars = [
    { m: "Jan", v: 32 },
    { m: "Feb", v: 41 },
    { m: "Mar", v: 38 },
    { m: "Apr", v: 52 },
    { m: "May", v: 61 },
  ];
  return (
    <Screen className="bg-secondary flex flex-col gap-2 p-3">
      <div className="bg-card rounded-md border p-2.5">
        <p className="text-micro text-muted-foreground uppercase">MRR</p>
        <p className="text-title tabular-nums">$61,400</p>
        <p className="text-caption text-positive">+17.7% MoM</p>
      </div>
      <div className="bg-card flex flex-1 items-end gap-2 rounded-md border p-2.5">
        {bars.map((b) => (
          <div key={b.m} className="flex flex-1 flex-col items-center gap-1">
            <span
              className="bg-accent-solid w-full rounded-t"
              style={{ height: `${b.v}px` }}
              aria-hidden="true"
            />
            <span className="text-micro text-muted-foreground">{b.m}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

const SERVICES = [
  { name: "api", up: true, ms: 41 },
  { name: "web", up: true, ms: 88 },
  { name: "worker", up: false, ms: 0 },
  { name: "db", up: true, ms: 12 },
];

function DServices() {
  const [only, setOnly] = useState(false);
  const rows = only ? SERVICES.filter((s) => !s.up) : SERVICES;
  return (
    <Screen className="flex flex-col p-4">
      <div className="flex items-center justify-between">
        <p className="text-ui-sm">Service health</p>
        <button
          type="button"
          aria-pressed={only}
          onClick={() => setOnly((v) => !v)}
          className={GHOST}
        >
          {only ? "Show all" : "Failing only"}
        </button>
      </div>
      <div className="mt-2 divide-y">
        {rows.map((s) => (
          <div key={s.name} className="flex h-9 items-center gap-2">
            <Dot tone={s.up ? "bg-positive" : "bg-destructive"} />
            <span className="text-ui-sm font-mono">{s.name}</span>
            <span className="text-caption text-muted-foreground ml-auto tabular-nums">
              {s.up ? `${s.ms}ms` : "down"}
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function DEngineering() {
  return (
    <Screen className="grid grid-cols-2 gap-2 p-3">
      {[
        { k: "Cycle time", v: "2.1d", d: "-0.4d" },
        { k: "PRs merged", v: "48", d: "+9" },
        { k: "Review wait", v: "5h", d: "-1h" },
        { k: "Deploys", v: "31", d: "+4" },
      ].map((m) => (
        <div key={m.k} className="bg-secondary rounded-md border p-2.5">
          <p className="text-micro text-muted-foreground uppercase">{m.k}</p>
          <p className="text-ui mt-0.5 tabular-nums">{m.v}</p>
          <p className="text-caption text-positive">{m.d}</p>
        </div>
      ))}
    </Screen>
  );
}

function DSupport() {
  const [q, setQ] = useState<"Open" | "Pending" | "Solved">("Open");
  const counts = { Open: 24, Pending: 7, Solved: 118 };
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Support queue</p>
      <div className="mt-2 flex gap-1.5">
        {(["Open", "Pending", "Solved"] as const).map((k) => (
          <Chip key={k} on={q === k} onClick={() => setQ(k)}>
            {k} <span className="tabular-nums opacity-60">{counts[k]}</span>
          </Chip>
        ))}
      </div>
      <div className="mt-3 divide-y">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex h-9 items-center gap-2">
            <Ini n={["JD", "LR", "MK"][i]} size="size-5" />
            <span className="text-caption truncate">
              {q} ticket #{2200 + i}
            </span>
            <span className="text-micro text-muted-foreground ml-auto">
              {i + 1}h
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function DMarket() {
  const rows = [
    { t: "AAPL", p: "228.41", d: 1.2 },
    { t: "MSFT", p: "412.09", d: -0.6 },
    { t: "NVDA", p: "121.55", d: 3.4 },
    { t: "TSLA", p: "244.80", d: -2.1 },
  ];
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Markets</p>
      <div className="mt-2 divide-y">
        {rows.map((r) => (
          <div key={r.t} className="flex h-9 items-center gap-2">
            <span className="text-ui-sm w-12 font-mono">{r.t}</span>
            <span className="text-caption tabular-nums">{r.p}</span>
            <span
              className={cn(
                "text-caption ml-auto tabular-nums",
                r.d >= 0 ? "text-positive" : "text-destructive",
              )}
            >
              {r.d >= 0 ? "+" : ""}
              {r.d}%
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ══ Tables ═══════════════════════════════════════════════════════ */

function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "text-micro text-muted-foreground bg-secondary px-2 py-1.5 text-left font-normal uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

const INVOICES = [
  { id: "INV-2214", who: "Northwind", amt: 4200, st: "Paid" },
  { id: "INV-2215", who: "Initech", amt: 980, st: "Open" },
  { id: "INV-2216", who: "Umbrella", amt: 15400, st: "Overdue" },
  { id: "INV-2217", who: "Hooli", amt: 2300, st: "Paid" },
];

function TInvoices() {
  const [key, setKey] = useState<"amt" | "who">("amt");
  const [dir, setDir] = useState<1 | -1>(-1);
  const rows = [...INVOICES].sort((a, b) =>
    key === "amt" ? (a.amt - b.amt) * dir : a.who.localeCompare(b.who) * dir,
  );
  const sort = (k: "amt" | "who") => {
    if (k === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setKey(k);
      setDir(1);
    }
  };
  return (
    <Screen className="overflow-auto">
      <table className="w-full">
        <thead>
          <tr>
            <TH>Invoice</TH>
            <TH>
              <button
                type="button"
                onClick={() => sort("who")}
                aria-sort={key === "who" ? (dir === 1 ? "ascending" : "descending") : "none"}
                className="hover:text-foreground uppercase"
              >
                Customer {key === "who" ? (dir === 1 ? "↑" : "↓") : ""}
              </button>
            </TH>
            <TH className="text-right">
              <button
                type="button"
                onClick={() => sort("amt")}
                aria-sort={key === "amt" ? (dir === 1 ? "ascending" : "descending") : "none"}
                className="hover:text-foreground uppercase"
              >
                Amount {key === "amt" ? (dir === 1 ? "↑" : "↓") : ""}
              </button>
            </TH>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="text-caption px-2 py-2 font-mono">{r.id}</td>
              <td className="text-caption px-2 py-2">
                {r.who}
                <span
                  className={cn(
                    "text-micro ml-1.5 rounded-full px-1.5 py-0.5 uppercase",
                    r.st === "Overdue"
                      ? "bg-destructive/10 text-destructive"
                      : r.st === "Paid"
                        ? "bg-secondary text-positive"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {r.st}
                </span>
              </td>
              <td className="text-caption px-2 py-2 text-right tabular-nums">
                ${r.amt.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Screen>
  );
}

const MEMBERS = [
  { n: "Sam Ortiz", i: "SO", r: "Owner" },
  { n: "Nadia Okonkwo", i: "NO", r: "Admin" },
  { n: "Tomás Ruiz", i: "TR", r: "Member" },
  { n: "Lin Wei", i: "LW", r: "Member" },
];

function TMembers() {
  const [sel, setSel] = useState<string[]>([]);
  const all = sel.length === MEMBERS.length;
  return (
    <Screen className="flex flex-col">
      <div className="bg-secondary flex h-9 shrink-0 items-center gap-2 border-b px-2">
        <input
          type="checkbox"
          checked={all}
          aria-label="Select all members"
          onChange={() => setSel(all ? [] : MEMBERS.map((m) => m.n))}
          className="accent-accent-solid size-3.5"
        />
        <span className="text-caption text-muted-foreground">
          {sel.length ? `${sel.length} selected` : "Team members"}
        </span>
        {sel.length > 0 && (
          <button
            type="button"
            onClick={() => {
              toast.success(`Removed ${sel.length}`);
              setSel([]);
            }}
            className="text-caption text-destructive ml-auto"
          >
            Remove
          </button>
        )}
      </div>
      <div className="divide-y overflow-y-auto">
        {MEMBERS.map((m) => (
          <label
            key={m.n}
            className={cn(
              "flex h-10 cursor-pointer items-center gap-2 px-2",
              sel.includes(m.n) && "bg-accent/40",
            )}
          >
            <input
              type="checkbox"
              checked={sel.includes(m.n)}
              onChange={() =>
                setSel((v) =>
                  v.includes(m.n) ? v.filter((x) => x !== m.n) : [...v, m.n],
                )
              }
              className="accent-accent-solid size-3.5"
            />
            <Ini n={m.i} size="size-6" />
            <span className="text-caption truncate">{m.n}</span>
            <span className="text-micro text-muted-foreground ml-auto uppercase">
              {m.r}
            </span>
          </label>
        ))}
      </div>
    </Screen>
  );
}

function TOrders() {
  const [dense, setDense] = useState(false);
  const rows = [
    ["#4821", "Shipped", "$142"],
    ["#4822", "Packing", "$88"],
    ["#4823", "Shipped", "$412"],
    ["#4824", "Refunded", "$0"],
    ["#4825", "Packing", "$219"],
  ];
  return (
    <Screen className="flex flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b px-2">
        <span className="text-caption">Orders</span>
        <Seg
          items={["Cozy", "Dense"] as const}
          value={dense ? "Dense" : "Cozy"}
          onChange={(v) => setDense(v === "Dense")}
          label="Row density"
        />
      </div>
      <div className="divide-y overflow-y-auto">
        {rows.map((r) => (
          <div
            key={r[0]}
            className={cn(
              "flex items-center gap-2 px-2",
              dense ? "h-7" : "h-10",
            )}
          >
            <span className="text-caption font-mono">{r[0]}</span>
            <span className="text-caption text-muted-foreground">{r[1]}</span>
            <span className="text-caption ml-auto tabular-nums">{r[2]}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

const LOGS = [
  { lvl: "INFO", msg: "GET /api/users 200 41ms" },
  { lvl: "WARN", msg: "cache miss ratio 0.62" },
  { lvl: "ERROR", msg: "upstream timeout after 5000ms" },
  { lvl: "INFO", msg: "POST /api/session 201 88ms" },
  { lvl: "ERROR", msg: "ECONNRESET worker-3" },
];

function TLogs() {
  const [lvl, setLvl] = useState<string | null>(null);
  const rows = lvl ? LOGS.filter((l) => l.lvl === lvl) : LOGS;
  return (
    <Screen className="flex flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b px-2">
        {["INFO", "WARN", "ERROR"].map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={lvl === l}
            onClick={() => setLvl((v) => (v === l ? null : l))}
            className={cn(
              "text-micro h-8 rounded px-2 uppercase transition-colors",
              lvl === l
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="overflow-y-auto p-2">
        {rows.map((l, i) => (
          <p key={i} className="text-caption flex gap-2 font-mono">
            <span
              className={cn(
                "w-11 shrink-0",
                l.lvl === "ERROR"
                  ? "text-destructive"
                  : l.lvl === "WARN"
                    ? "text-accent-foreground"
                    : "text-muted-foreground",
              )}
            >
              {l.lvl}
            </span>
            <span className="truncate">{l.msg}</span>
          </p>
        ))}
      </div>
    </Screen>
  );
}

function TApiKeys() {
  const [revealed, setRevealed] = useState<string | null>(null);
  const keys = [
    { n: "Production", k: "sk_live_9fa2c1", used: "2m ago" },
    { n: "Staging", k: "sk_test_44bd80", used: "3d ago" },
    { n: "CI", k: "sk_test_10ee7c", used: "never" },
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">API keys</p>
      <div className="mt-2 divide-y">
        {keys.map((k) => (
          <div key={k.n} className="flex h-11 items-center gap-2">
            <div className="min-w-0">
              <p className="text-caption">{k.n}</p>
              <p className="text-micro text-muted-foreground font-mono">
                {revealed === k.n ? k.k : "sk_••••••••••"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRevealed((v) => (v === k.n ? null : k.n))}
              className={cn(GHOST, "ml-auto")}
            >
              {revealed === k.n ? "Hide" : "Reveal"}
            </button>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function TInventory() {
  const [stock, setStock] = useState([12, 0, 48, 3]);
  const items = ["Hoodie", "Cap", "Sticker pack", "Mug"];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Inventory</p>
      <div className="mt-2 divide-y">
        {items.map((n, i) => (
          <div key={n} className="flex h-11 items-center gap-2">
            <span className="text-caption flex-1 truncate">{n}</span>
            <span
              className={cn(
                "text-micro rounded-full px-1.5 py-0.5 uppercase",
                stock[i] === 0
                  ? "bg-destructive/10 text-destructive"
                  : stock[i] < 5
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {stock[i] === 0 ? "Out" : stock[i] < 5 ? "Low" : "In stock"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={`Decrease ${n}`}
                onClick={() =>
                  setStock((v) =>
                    v.map((x, j) => (j === i ? Math.max(0, x - 1) : x)),
                  )
                }
                className="text-muted-foreground hover:text-foreground size-8 rounded-md border"
              >
                −
              </button>
              <span className="text-caption w-6 text-center tabular-nums">
                {stock[i]}
              </span>
              <button
                type="button"
                aria-label={`Increase ${n}`}
                onClick={() =>
                  setStock((v) => v.map((x, j) => (j === i ? x + 1 : x)))
                }
                className="text-muted-foreground hover:text-foreground size-8 rounded-md border"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function TIssues() {
  const [page, setPage] = useState(0);
  const all = [
    "Sidebar collapses on iPad",
    "Retry loop on 429",
    "Dark mode chart contrast",
    "Slug validation is off",
    "Webhook signature mismatch",
    "Export drops emoji",
  ];
  const per = 3;
  const rows = all.slice(page * per, page * per + per);
  const pages = Math.ceil(all.length / per);
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Issues</p>
      <div className="mt-2 flex-1 divide-y">
        {rows.map((t, i) => (
          <div key={t} className="flex h-11 items-center gap-2">
            <Dot tone={i === 0 ? "bg-positive" : "bg-border-strong"} />
            <span className="text-caption truncate">{t}</span>
            <span className="text-micro text-muted-foreground ml-auto font-mono">
              #{482 + page * per + i}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className={cn(GHOST, "size-8 px-0")}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="text-caption text-muted-foreground tabular-nums">
          {page + 1} / {pages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pages - 1}
          onClick={() => setPage((p) => p + 1)}
          className={cn(GHOST, "size-8 px-0")}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </Screen>
  );
}

function TTransactions() {
  const rows = [
    { d: "Aug 4", w: "Stripe payout", a: 4210 },
    { d: "Aug 3", w: "AWS", a: -892 },
    { d: "Aug 2", w: "Figma", a: -45 },
    { d: "Aug 1", w: "Stripe payout", a: 3980 },
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Transactions</p>
      <div className="mt-2 divide-y">
        {rows.map((r, i) => (
          <div key={i} className="flex h-10 items-center gap-2">
            <span className="text-micro text-muted-foreground w-10">{r.d}</span>
            <span className="text-caption truncate">{r.w}</span>
            <span
              className={cn(
                "text-caption ml-auto tabular-nums",
                r.a > 0 ? "text-positive" : "",
              )}
            >
              {r.a > 0 ? "+" : "−"}${Math.abs(r.a).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function TAuditLog() {
  const [q, setQ] = useState("");
  const all = [
    { who: "sam", act: "rotated api key", at: "12:04" },
    { who: "nadia", act: "invited tomas", at: "11:52" },
    { who: "system", act: "backup completed", at: "09:00" },
    { who: "tomas", act: "changed billing plan", at: "08:31" },
  ];
  const rows = all.filter((r) =>
    `${r.who} ${r.act}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Screen className="flex flex-col p-3">
      <label htmlFor="audit-q" className="sr-only">
        Filter audit log
      </label>
      <input
        id="audit-q"
        value={q}
        placeholder="Filter events"
        onChange={(e) => setQ(e.target.value)}
        className={FIELD}
      />
      <div className="mt-2 divide-y">
        {rows.length === 0 && (
          <p className="text-caption text-muted-foreground py-3">
            No events match “{q}”.
          </p>
        )}
        {rows.map((r, i) => (
          <div key={i} className="flex h-9 items-center gap-2">
            <span className="text-caption font-mono">{r.who}</span>
            <span className="text-caption text-muted-foreground truncate">
              {r.act}
            </span>
            <span className="text-micro text-muted-foreground ml-auto tabular-nums">
              {r.at}
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ══ Filters ══════════════════════════════════════════════════════ */

function FiToolbar() {
  const [status, setStatus] = useState("Any");
  const [owner, setOwner] = useState("Anyone");
  const [q, setQ] = useState("");
  return (
    <Screen className="flex flex-col p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-2 left-2 size-4"
            aria-hidden="true"
          />
          <input
            value={q}
            aria-label="Search"
            placeholder="Search"
            onChange={(e) => setQ(e.target.value)}
            className={cn(FIELD, "pl-7")}
          />
        </div>
        <label className="sr-only" htmlFor="fi-st">
          Status
        </label>
        <select
          id="fi-st"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={cn(FIELD, "w-auto")}
        >
          <option>Any</option>
          <option>Open</option>
          <option>Closed</option>
        </select>
        <label className="sr-only" htmlFor="fi-ow">
          Owner
        </label>
        <select
          id="fi-ow"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className={cn(FIELD, "w-auto")}
        >
          <option>Anyone</option>
          <option>Me</option>
        </select>
      </div>
      <p className="text-caption text-muted-foreground mt-auto">
        Query:{" "}
        <span className="text-foreground font-mono">
          status:{status.toLowerCase()} owner:{owner.toLowerCase()}
          {q && ` "${q}"`}
        </span>
      </p>
    </Screen>
  );
}

const FACETS = ["Bug", "Feature", "Docs", "Chore", "Security"];

function FiFaceted() {
  const [open, setOpen] = useState(true);
  const [on, setOn] = useState<string[]>(["Bug"]);
  return (
    <Screen className="relative p-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={GHOST}
      >
        <Filter className="size-3.5" aria-hidden="true" />
        Label
        {on.length > 0 && (
          <span className="bg-accent text-accent-foreground text-micro rounded-full px-1.5">
            {on.length}
          </span>
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.fast, ease: ease.outQuart }}
          className="shadow-floating bg-card absolute top-12 left-3 w-44 rounded-lg border p-1"
        >
          {FACETS.map((f) => (
            <label
              key={f}
              className="text-caption flex h-8 cursor-pointer items-center gap-2 rounded px-2"
            >
              <input
                type="checkbox"
                checked={on.includes(f)}
                onChange={() =>
                  setOn((v) =>
                    v.includes(f) ? v.filter((x) => x !== f) : [...v, f],
                  )
                }
                className="accent-accent-solid size-3.5"
              />
              {f}
            </label>
          ))}
        </motion.div>
      )}
    </Screen>
  );
}

function FiChips() {
  const [chips, setChips] = useState([
    "status:open",
    "assignee:me",
    "label:bug",
    "since:7d",
  ]);
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Active filters</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            className="bg-secondary text-caption inline-flex h-8 items-center gap-1 rounded-full border pr-1 pl-2.5 font-mono"
          >
            {c}
            <button
              type="button"
              aria-label={`Remove ${c}`}
              onClick={() => setChips((v) => v.filter((x) => x !== c))}
              className="text-muted-foreground hover:text-foreground grid size-6 place-items-center rounded-full"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        {chips.length === 0 && (
          <p className="text-caption text-muted-foreground">
            No filters — showing everything.
          </p>
        )}
      </div>
      {chips.length > 0 && (
        <button
          type="button"
          onClick={() => setChips([])}
          className={cn(GHOST, "mt-auto self-start")}
        >
          Clear all
        </button>
      )}
    </Screen>
  );
}

function FiSidebar() {
  const [price, setPrice] = useState(60);
  const [cats, setCats] = useState<string[]>(["Tools"]);
  return (
    <Screen className="grid grid-cols-[9rem_minmax(0,1fr)]">
      <div className="bg-secondary space-y-2 border-r p-2.5">
        <p className="text-micro text-muted-foreground uppercase">Category</p>
        {["Tools", "Design", "Data"].map((c) => (
          <label key={c} className="text-caption flex h-8 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={cats.includes(c)}
              onChange={() =>
                setCats((v) =>
                  v.includes(c) ? v.filter((x) => x !== c) : [...v, c],
                )
              }
              className="accent-accent-solid size-3.5"
            />
            {c}
          </label>
        ))}
        <label
          htmlFor="fi-price"
          className="text-micro text-muted-foreground block pt-1 uppercase"
        >
          Max ${price}
        </label>
        <input
          id="fi-price"
          type="range"
          min={0}
          max={200}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="accent-accent-solid w-full"
        />
      </div>
      <div className="space-y-2 p-3">
        <p className="text-caption text-muted-foreground">
          {cats.length || "No"} categor{cats.length === 1 ? "y" : "ies"} under $
          {price}
        </p>
        <Bar w="w-full" />
        <Bar w="w-2/3" />
        <Bar w="w-5/6" />
      </div>
    </Screen>
  );
}

/* ══ Empty states ═════════════════════════════════════════════════ */

function Empty({
  icon: Icon,
  title,
  body,
  action,
  onAction,
  tone = "text-muted-foreground",
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
  tone?: string;
}) {
  return (
    <Screen className="grid place-items-center p-5 text-center">
      <div>
        <Icon className={cn("mx-auto size-6", tone)} aria-hidden={true} />
        <p className="text-ui mt-2">{title}</p>
        <p className="text-caption text-muted-foreground mx-auto mt-1 max-w-56">
          {body}
        </p>
        {action && (
          <button type="button" onClick={onAction} className={cn(SOLID, "mt-3")}>
            {action}
          </button>
        )}
      </div>
    </Screen>
  );
}

function EInboxZero() {
  const [count, setCount] = useState(0);
  return (
    <Screen className="grid place-items-center p-5 text-center">
      <div>
        <Inbox className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
        <p className="text-ui mt-2">
          {count === 0 ? "Inbox zero" : `${count} new`}
        </p>
        <p className="text-caption text-muted-foreground mt-1">
          {count === 0
            ? "Nothing left to triage. Enjoy it."
            : "Something arrived while you were reading."}
        </p>
        <button
          type="button"
          onClick={() => setCount((c) => (c === 0 ? 3 : 0))}
          className={cn(GHOST, "mt-3")}
        >
          {count === 0 ? "Simulate new mail" : "Clear again"}
        </button>
      </div>
    </Screen>
  );
}

function ENoResults() {
  const [q, setQ] = useState("quantum");
  const hits = ["query", "queue", "quick"].filter((h) => h.startsWith(q.slice(0, 2)));
  return (
    <Screen className="flex flex-col p-4">
      <label htmlFor="nores" className="sr-only">
        Search
      </label>
      <input
        id="nores"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={FIELD}
      />
      {hits.length === 0 ? (
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <p className="text-ui-sm">No results for “{q}”</p>
            <p className="text-caption text-muted-foreground mt-1">
              Try fewer words, or clear the filters.
            </p>
            <button
              type="button"
              onClick={() => setQ("qu")}
              className={cn(GHOST, "mt-2")}
            >
              Reset search
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 divide-y">
          {hits.map((h) => (
            <p key={h} className="text-caption py-2">
              {h}
            </p>
          ))}
        </div>
      )}
    </Screen>
  );
}

function EFirstProject() {
  return (
    <Empty
      icon={Sparkles}
      title="Create your first project"
      body="Projects hold your environments, keys and deploys."
      action="New project"
      onAction={() => toast.success("Project created")}
    />
  );
}

function EEndOfFeed() {
  return (
    <Screen className="flex flex-col justify-end p-4">
      <div className="space-y-2 opacity-60">
        <Bar w="w-2/3" />
        <Bar w="w-full" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="bg-border h-px flex-1" aria-hidden="true" />
        <span className="text-micro text-muted-foreground uppercase">
          You are all caught up
        </span>
        <span className="bg-border h-px flex-1" aria-hidden="true" />
      </div>
    </Screen>
  );
}

function ENoTeam() {
  return (
    <Empty
      icon={Users}
      title="Just you in here"
      body="Invite a teammate and they will show up on this list."
      action="Invite people"
      onAction={() => toast.success("Invite sent")}
    />
  );
}

function ETrash() {
  const [items, setItems] = useState(2);
  return items === 0 ? (
    <Empty icon={Trash2} title="Trash is empty" body="Deleted items land here for 30 days." />
  ) : (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Trash</p>
      <div className="mt-2 flex-1 divide-y">
        {Array.from({ length: items }, (_, i) => (
          <div key={i} className="flex h-9 items-center gap-2">
            <FileText className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="text-caption">deleted-file-{i + 1}.tsx</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setItems(0)}
        className={cn(GHOST, "text-destructive self-start")}
      >
        Empty trash
      </button>
    </Screen>
  );
}

function E404() {
  return (
    <Screen className="grid place-items-center p-5 text-center">
      <div>
        <p className="text-title text-muted-foreground font-mono tabular-nums">
          404
        </p>
        <p className="text-ui mt-1">We cannot find that page</p>
        <p className="text-caption text-muted-foreground mt-1">
          It may have been renamed or moved.
        </p>
        <button type="button" className={cn(GHOST, "mt-3")}>
          Back to dashboard
        </button>
      </div>
    </Screen>
  );
}

function EMaintenance() {
  return (
    <Screen className="grid place-items-center p-5 text-center">
      <div>
        <Zap className="text-accent-foreground mx-auto size-6" aria-hidden="true" />
        <p className="text-ui mt-2">Scheduled maintenance</p>
        <p className="text-caption text-muted-foreground mt-1">
          Back at 03:00 UTC. Reads keep working; writes are paused.
        </p>
        <div className="bg-secondary mt-3 h-1.5 overflow-hidden rounded-full">
          <div className="bg-accent-solid h-full w-3/5 rounded-full" />
        </div>
      </div>
    </Screen>
  );
}

function ENoFiles() {
  const [over, setOver] = useState(false);
  return (
    <Screen className="p-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          toast.success("Files uploaded");
        }}
        className={cn(
          "grid h-full place-items-center rounded-md border border-dashed text-center transition-colors",
          over ? "border-accent-solid bg-accent/40" : "",
        )}
      >
        <div>
          <Upload className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
          <p className="text-ui-sm mt-2">
            {over ? "Drop to upload" : "No files yet"}
          </p>
          <p className="text-caption text-muted-foreground mt-1">
            Drag something onto this box.
          </p>
        </div>
      </div>
    </Screen>
  );
}

function EOffline() {
  const [online, setOnline] = useState(false);
  return (
    <Screen className="grid place-items-center p-5 text-center">
      <div>
        {online ? (
          <Check className="text-positive mx-auto size-6" aria-hidden="true" />
        ) : (
          <WifiOff className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
        )}
        <p className="text-ui mt-2">{online ? "Back online" : "You are offline"}</p>
        <p className="text-caption text-muted-foreground mt-1">
          {online
            ? "Queued changes have been flushed."
            : "Edits are queued locally and will sync."}
        </p>
        <button
          type="button"
          onClick={() => setOnline((v) => !v)}
          className={cn(GHOST, "mt-3")}
        >
          {online ? "Go offline" : "Retry connection"}
        </button>
      </div>
    </Screen>
  );
}

/* ══ Settings ═════════════════════════════════════════════════════ */

function SettingRow({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-caption">{title}</p>
        {body && (
          <p className="text-micro text-muted-foreground normal-case">{body}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function SProfile() {
  const id = useId();
  const [name, setName] = useState("Sam Ortiz");
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <Screen className="flex flex-col p-4">
      <div className="flex items-center gap-3">
        <Ini n={initials || "?"} size="size-10" tone="bg-feature text-feature-foreground" />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={id}
            className="text-caption text-muted-foreground mb-1 block"
          >
            Display name
          </label>
          <input
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={FIELD}
          />
        </div>
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        The avatar falls back to initials, so it changes as you type.
      </p>
    </Screen>
  );
}

function SAppearance() {
  const [mode, setMode] = useState<"Light" | "Dark" | "System">("System");
  const [density, setDensity] = useState<"Cozy" | "Compact">("Cozy");
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Appearance</p>
      <div className="mt-2 divide-y">
        <SettingRow title="Theme" body="Applies to this browser only">
          <Seg
            items={["Light", "Dark", "System"] as const}
            value={mode}
            onChange={setMode}
            label="Theme"
          />
        </SettingRow>
        <SettingRow title="Density">
          <Seg
            items={["Cozy", "Compact"] as const}
            value={density}
            onChange={setDensity}
            label="Density"
          />
        </SettingRow>
      </div>
      <div
        className={cn(
          "bg-secondary mt-auto space-y-1.5 rounded-md border",
          density === "Cozy" ? "p-3" : "p-1.5",
        )}
      >
        <Bar w="w-2/3" />
        <Bar w="w-full" />
      </div>
    </Screen>
  );
}

function SBilling() {
  const [yearly, setYearly] = useState(false);
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Billing</p>
      <div className="bg-secondary mt-2 rounded-md border p-3">
        <p className="text-micro text-muted-foreground uppercase">Current plan</p>
        <p className="text-title tabular-nums">
          ${yearly ? 290 : 29}
          <span className="text-caption text-muted-foreground">
            /{yearly ? "yr" : "mo"}
          </span>
        </p>
      </div>
      <div className="divide-y">
        <SettingRow title="Annual billing" body="Two months free">
          <Sw
            on={yearly}
            onToggle={() => setYearly((v) => !v)}
            label="Annual billing"
          />
        </SettingRow>
      </div>
      <button type="button" className={cn(GHOST, "mt-auto self-start")}>
        <CreditCard className="size-3.5" aria-hidden="true" />
        Manage card
      </button>
    </Screen>
  );
}

const INTEGRATIONS = [
  { n: "GitHub", d: "Sync issues and PRs" },
  { n: "Slack", d: "Post deploy alerts" },
  { n: "Linear", d: "Two-way issue sync" },
];

function SIntegrations() {
  const [on, setOn] = useState<string[]>(["GitHub"]);
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Integrations</p>
      <div className="mt-2 divide-y">
        {INTEGRATIONS.map((i) => (
          <SettingRow key={i.n} title={i.n} body={i.d}>
            <button
              type="button"
              onClick={() =>
                setOn((v) =>
                  v.includes(i.n) ? v.filter((x) => x !== i.n) : [...v, i.n],
                )
              }
              className={on.includes(i.n) ? GHOST : SOLID}
            >
              {on.includes(i.n) ? "Disconnect" : "Connect"}
            </button>
          </SettingRow>
        ))}
      </div>
    </Screen>
  );
}

function SSecurity() {
  const [twofa, setTwofa] = useState(true);
  const [sessions, setSessions] = useState(3);
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Security</p>
      <div className="mt-2 divide-y">
        <SettingRow title="Two-factor auth" body={twofa ? "Enabled" : "Off"}>
          <Sw on={twofa} onToggle={() => setTwofa((v) => !v)} label="Two-factor auth" />
        </SettingRow>
        <SettingRow title="Active sessions" body={`${sessions} devices signed in`}>
          <button
            type="button"
            disabled={sessions <= 1}
            onClick={() => {
              setSessions(1);
              toast.success("Other sessions revoked");
            }}
            className={GHOST}
          >
            Revoke others
          </button>
        </SettingRow>
      </div>
    </Screen>
  );
}

const ROLES = ["Owner", "Admin", "Member", "Viewer"] as const;
const CAPS = ["Read", "Write", "Billing", "Delete"];

function SPermissions() {
  const [role, setRole] = useState<(typeof ROLES)[number]>("Admin");
  const allowed: Record<string, string[]> = {
    Owner: CAPS,
    Admin: ["Read", "Write", "Delete"],
    Member: ["Read", "Write"],
    Viewer: ["Read"],
  };
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Roles & permissions</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ROLES.map((r) => (
          <Chip key={r} on={role === r} onClick={() => setRole(r)}>
            {r}
          </Chip>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {CAPS.map((c) => (
          <div
            key={c}
            className={cn(
              "text-caption flex h-8 items-center gap-1.5 rounded-md border px-2",
              allowed[role].includes(c)
                ? "text-foreground"
                : "text-muted-foreground opacity-60",
            )}
          >
            {allowed[role].includes(c) ? (
              <Check className="text-positive size-3.5" aria-hidden="true" />
            ) : (
              <X className="size-3.5" aria-hidden="true" />
            )}
            {c}
          </div>
        ))}
      </div>
    </Screen>
  );
}

function SBranding() {
  const [radius, setRadius] = useState(10);
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Workspace branding</p>
      <label
        htmlFor="brand-r"
        className="text-caption text-muted-foreground mt-3 mb-1 block"
      >
        Corner radius — {radius}px
      </label>
      <input
        id="brand-r"
        type="range"
        min={0}
        max={20}
        value={radius}
        onChange={(e) => setRadius(Number(e.target.value))}
        className="accent-accent-solid w-full"
      />
      <div className="mt-4 flex items-center gap-2">
        <span
          className="bg-feature text-feature-foreground text-micro grid size-10 place-items-center"
          style={{ borderRadius: `${radius}px` }}
        >
          A
        </span>
        <span
          className="bg-secondary text-caption grid h-10 flex-1 place-items-center border"
          style={{ borderRadius: `${radius}px` }}
        >
          Preview surface
        </span>
      </div>
    </Screen>
  );
}

function SLocalization() {
  const [lang, setLang] = useState("en-US");
  const sample: Record<string, string> = {
    "en-US": "8/5/2026 · 1,234.56 · $",
    "de-DE": "5.8.2026 · 1.234,56 · €",
    "ja-JP": "2026/8/5 · 1,234.56 · ¥",
  };
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Localization</p>
      <label
        htmlFor="loc"
        className="text-caption text-muted-foreground mt-3 mb-1 block"
      >
        Locale
      </label>
      <select
        id="loc"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className={FIELD}
      >
        {Object.keys(sample).map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
      <div className="bg-secondary mt-3 rounded-md border p-3">
        <p className="text-micro text-muted-foreground uppercase">
          Dates, numbers, currency
        </p>
        <p className="text-caption mt-1 font-mono tabular-nums">{sample[lang]}</p>
      </div>
      <p className="text-caption text-muted-foreground mt-auto">
        <Globe className="mr-1 inline size-3" aria-hidden="true" />
        Changing the locale changes formatting, not just strings.
      </p>
    </Screen>
  );
}

function SWebhooks() {
  const [hooks, setHooks] = useState([
    { url: "https://acme.co/hooks/deploy", ok: true },
    { url: "https://acme.co/hooks/billing", ok: false },
  ]);
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Webhooks</p>
      <div className="mt-2 divide-y">
        {hooks.map((h, i) => (
          <div key={h.url} className="flex h-11 items-center gap-2">
            <Dot tone={h.ok ? "bg-positive" : "bg-destructive"} />
            <span className="text-caption truncate font-mono">{h.url}</span>
            <button
              type="button"
              onClick={() => {
                setHooks((v) =>
                  v.map((x, j) => (j === i ? { ...x, ok: true } : x)),
                );
                toast.success("Test delivery 200");
              }}
              className={cn(GHOST, "ml-auto")}
            >
              Test
            </button>
          </div>
        ))}
      </div>
      <p className="text-caption text-muted-foreground mt-auto">
        Failing endpoints retry with backoff for 24h.
      </p>
    </Screen>
  );
}

function SPrivacy() {
  const [track, setTrack] = useState(true);
  const [share, setShare] = useState(false);
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Privacy & data</p>
      <div className="mt-2 divide-y">
        <SettingRow title="Product analytics" body="Anonymous usage events">
          <Sw on={track} onToggle={() => setTrack((v) => !v)} label="Product analytics" />
        </SettingRow>
        <SettingRow title="Share with partners" body="Off by default">
          <Sw on={share} onToggle={() => setShare((v) => !v)} label="Share with partners" />
        </SettingRow>
      </div>
      <button
        type="button"
        onClick={() => toast.success("Export queued — emailed when ready")}
        className={cn(GHOST, "mt-auto self-start")}
      >
        <Download className="size-3.5" aria-hidden="true" />
        Export my data
      </button>
    </Screen>
  );
}

function SDeveloper() {
  const [beta, setBeta] = useState(false);
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Developer</p>
      <div className="mt-2 divide-y">
        <SettingRow title="Beta APIs" body="v2 endpoints, may break">
          <Sw on={beta} onToggle={() => setBeta((v) => !v)} label="Beta APIs" />
        </SettingRow>
      </div>
      <pre className="bg-secondary text-micro mt-3 overflow-x-auto rounded-md border p-2.5 font-mono">
        {`curl https://api.acme.co/${beta ? "v2" : "v1"}/projects \\
  -H "Authorization: Bearer sk_live_…"`}
      </pre>
    </Screen>
  );
}

function SSso() {
  const [step, setStep] = useState(0);
  const steps = ["Add metadata URL", "Verify domain", "Enforce for everyone"];
  return (
    <Screen className="flex flex-col p-4">
      <p className="text-ui-sm">Single sign-on</p>
      <div className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "text-micro grid size-5 shrink-0 place-items-center rounded-full",
                i < step
                  ? "bg-positive text-feature-foreground"
                  : i === step
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-caption",
                i > step && "text-muted-foreground",
              )}
            >
              {s}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={step >= steps.length}
        onClick={() => setStep((s) => s + 1)}
        className={cn(SOLID, "mt-auto self-start")}
      >
        <Lock className="size-3.5" aria-hidden="true" />
        {step >= steps.length ? "SSO enforced" : "Complete step"}
      </button>
    </Screen>
  );
}

/* ══ Cards ════════════════════════════════════════════════════════ */

function CStatTile() {
  const [range, setRange] = useState<"D" | "W" | "M">("M");
  const v = { D: 1642, W: 11208, M: 48214 }[range];
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-56 rounded-lg border p-4">
        <div className="flex items-start justify-between">
          <p className="text-micro text-muted-foreground uppercase">Revenue</p>
          <Seg items={["D", "W", "M"] as const} value={range} onChange={setRange} label="Range" />
        </div>
        <p className="text-title mt-1 tabular-nums">${v.toLocaleString()}</p>
        <p className="text-caption text-positive">+12.4% vs previous</p>
        <Spark />
      </div>
    </Screen>
  );
}

function CProfileCard() {
  const [follow, setFollow] = useState(false);
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-56 rounded-lg border p-4 text-center">
        <Ini n="NO" size="size-12" tone="bg-feature text-feature-foreground" />
        <p className="text-ui mt-2">Nadia Okonkwo</p>
        <p className="text-caption text-muted-foreground">Staff engineer</p>
        <button
          type="button"
          aria-pressed={follow}
          onClick={() => setFollow((v) => !v)}
          className={cn(follow ? GHOST : SOLID, "mt-3 w-full")}
        >
          {follow ? "Following" : "Follow"}
        </button>
      </div>
    </Screen>
  );
}

const TIERS = [
  { n: "Starter", p: 0, f: "1 project" },
  { n: "Pro", p: 29, f: "Unlimited" },
  { n: "Team", p: 99, f: "SSO + audit" },
];

function CPricing() {
  const [pick, setPick] = useState("Pro");
  return (
    <Screen className="bg-secondary grid grid-cols-3 gap-2 p-3">
      {TIERS.map((t) => (
        <button
          key={t.n}
          type="button"
          aria-pressed={pick === t.n}
          onClick={() => setPick(t.n)}
          className={cn(
            "flex flex-col rounded-lg border p-2.5 text-left transition-colors",
            pick === t.n
              ? "border-accent-solid bg-card"
              : "bg-card/60 hover:bg-card",
          )}
        >
          <span className="text-micro text-muted-foreground uppercase">{t.n}</span>
          <span className="text-ui mt-0.5 tabular-nums">${t.p}</span>
          <span className="text-micro text-muted-foreground mt-auto normal-case">
            {t.f}
          </span>
        </button>
      ))}
    </Screen>
  );
}

function CProduct() {
  const [qty, setQty] = useState(1);
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-56 overflow-hidden rounded-lg border">
        <div className="bg-secondary grid h-20 place-items-center border-b">
          <Sparkles className="text-muted-foreground size-6" aria-hidden="true" />
        </div>
        <div className="p-3">
          <p className="text-ui-sm">Field notebook</p>
          <p className="text-caption text-muted-foreground tabular-nums">
            $24.00 · {qty} in cart
          </p>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className={cn(SOLID, "mt-2 w-full")}
          >
            Add to cart
          </button>
        </div>
      </div>
    </Screen>
  );
}

function CInvoice() {
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-64 rounded-lg border p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-caption font-mono">INV-2216</span>
          <span className="text-micro text-destructive uppercase">Overdue</span>
        </div>
        <div className="mt-2 space-y-1">
          {[
            ["Pro seats × 12", "$348.00"],
            ["Overage", "$52.00"],
          ].map(([k, v]) => (
            <div key={k} className="text-caption text-muted-foreground flex justify-between">
              <span>{k}</span>
              <span className="tabular-nums">{v}</span>
            </div>
          ))}
        </div>
        <div className="text-ui-sm mt-2 flex justify-between border-t pt-2">
          <span>Total</span>
          <span className="tabular-nums">$400.00</span>
        </div>
      </div>
    </Screen>
  );
}

const COLS = ["Todo", "Doing", "Done"];

function CTask() {
  const [col, setCol] = useState(1);
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-56 rounded-lg border p-3">
        <div className="flex items-center gap-1.5">
          <Dot tone="bg-accent-solid" />
          <span className="text-micro text-muted-foreground uppercase">
            ENG-482
          </span>
        </div>
        <p className="text-ui-sm mt-1">Rework the sidebar collapse</p>
        <div className="mt-2 flex items-center gap-1.5">
          <Ini n="TR" size="size-5" />
          <span className="text-micro text-muted-foreground">3 pts</span>
          <button
            type="button"
            onClick={() => setCol((c) => (c + 1) % COLS.length)}
            className={cn(GHOST, "ml-auto")}
          >
            {COLS[col]}
          </button>
        </div>
      </div>
    </Screen>
  );
}

function CEvent() {
  const [going, setGoing] = useState<"yes" | "no" | null>(null);
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-56 rounded-lg border p-3">
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-micro text-muted-foreground uppercase">Aug</p>
            <p className="text-ui tabular-nums">12</p>
          </div>
          <div className="min-w-0">
            <p className="text-ui-sm truncate">Design review</p>
            <p className="text-caption text-muted-foreground">14:00 – 15:00</p>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5">
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={going === v}
              onClick={() => setGoing(v)}
              className={cn(
                "text-caption h-8 flex-1 rounded-md border transition-colors",
                going === v
                  ? "bg-accent text-accent-foreground border-transparent"
                  : "text-muted-foreground",
              )}
            >
              {v === "yes" ? "Going" : "Can't"}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function CIntegration() {
  const [on, setOn] = useState(true);
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-56 rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <span className="bg-secondary grid size-8 place-items-center rounded-md border">
            <MessageSquare className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-ui-sm">Slack</p>
            <p className="text-micro text-muted-foreground">
              {on ? "#deploys" : "Not connected"}
            </p>
          </div>
          <span className="ml-auto">
            <Sw on={on} onToggle={() => setOn((v) => !v)} label="Slack integration" />
          </span>
        </div>
      </div>
    </Screen>
  );
}

function CMedia() {
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-64 overflow-hidden rounded-lg border">
        <div className="bg-feature h-16" aria-hidden="true" />
        <div className="p-3">
          <p className="text-micro text-accent-foreground uppercase">Engineering</p>
          <p className="text-ui-sm mt-0.5">Why we stopped shipping components</p>
          <p className="text-caption text-muted-foreground mt-1">
            Sam Ortiz · 6 min read
          </p>
        </div>
      </div>
    </Screen>
  );
}

function CPaymentMethod() {
  const [pick, setPick] = useState(0);
  const cards = [
    { b: "Visa", l: "4242", d: "04/28" },
    { b: "Amex", l: "0091", d: "11/26" },
  ];
  return (
    <Screen className="bg-secondary flex flex-col justify-center gap-2 p-4">
      {cards.map((c, i) => (
        <button
          key={c.l}
          type="button"
          aria-pressed={pick === i}
          onClick={() => setPick(i)}
          className={cn(
            "bg-card flex items-center gap-2 rounded-lg border p-3 transition-colors",
            pick === i && "border-accent-solid",
          )}
        >
          <CreditCard className="text-muted-foreground size-4" aria-hidden="true" />
          <span className="text-caption">
            {c.b} •••• {c.l}
          </span>
          <span className="text-micro text-muted-foreground ml-auto tabular-nums">
            {c.d}
          </span>
          {pick === i && (
            <Check className="text-accent-foreground size-4" aria-hidden="true" />
          )}
        </button>
      ))}
    </Screen>
  );
}

/* ══ Modals ═══════════════════════════════════════════════════════ */

/** Modals render inline over their own stage — no portal, no scroll lock. */
function Stage({
  open,
  onClose,
  children,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Screen className="bg-secondary relative grid place-items-center p-4">
      <button type="button" onClick={() => onClose()} className={GHOST}>
        {label}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast }}
              className="bg-feature/40 absolute inset-0"
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="false"
              initial={{ opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className="shadow-floating bg-card absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-lg border p-4"
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Screen>
  );
}

function MConfirmDelete() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  return (
    <Stage
      open={open}
      onClose={() => setOpen((v) => !v)}
      label={open ? "Close" : "Delete project"}
    >
      <p className="text-ui">Delete “atlas”?</p>
      <p className="text-caption text-muted-foreground mt-1">
        This removes 4 environments and 12 keys. Type the name to confirm.
      </p>
      <label htmlFor="del-c" className="sr-only">
        Project name
      </label>
      <input
        id="del-c"
        value={typed}
        placeholder="atlas"
        onChange={(e) => setTyped(e.target.value)}
        className={cn(FIELD, "mt-3")}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className={GHOST}>
          Cancel
        </button>
        <button
          type="button"
          disabled={typed !== "atlas"}
          onClick={() => {
            setOpen(false);
            setTyped("");
            toast.success("Project deleted");
          }}
          className={cn(SOLID, "bg-destructive")}
        >
          Delete
        </button>
      </div>
    </Stage>
  );
}

function MShareLink() {
  const [open, setOpen] = useState(false);
  const [access, setAccess] = useState<"Restricted" | "Anyone">("Restricted");
  return (
    <Stage open={open} onClose={() => setOpen((v) => !v)} label={open ? "Close" : "Share"}>
      <p className="text-ui">Share document</p>
      <div className="bg-secondary mt-3 flex items-center gap-2 rounded-md border p-2">
        <Link2 className="text-muted-foreground size-4" aria-hidden="true" />
        <span className="text-caption truncate font-mono">acme.co/d/9fa2</span>
        <button
          type="button"
          onClick={() => toast.success("Link copied")}
          className={cn(GHOST, "ml-auto")}
        >
          Copy
        </button>
      </div>
      <div className="mt-3">
        <Seg
          items={["Restricted", "Anyone"] as const}
          value={access}
          onChange={setAccess}
          label="Link access"
        />
        <p className="text-caption text-muted-foreground mt-1.5">
          {access === "Restricted"
            ? "Only invited people can open it."
            : "Anyone with the link can view."}
        </p>
      </div>
    </Stage>
  );
}

function MUploadFiles() {
  const [open, setOpen] = useState(false);
  const [pct, setPct] = useState(0);
  const go = () => {
    setPct(1);
    const t = setInterval(
      () =>
        setPct((v) => {
          if (v >= 100) {
            clearInterval(t);
            return 100;
          }
          return v + 7;
        }),
      120,
    );
  };
  return (
    <Stage open={open} onClose={() => setOpen((v) => !v)} label={open ? "Close" : "Upload files"}>
      <p className="text-ui">Upload</p>
      <div className="mt-3 grid h-16 place-items-center rounded-md border border-dashed">
        <span className="text-caption text-muted-foreground">
          Drop files or choose
        </span>
      </div>
      {pct > 0 && (
        <div className="mt-2">
          <div className="bg-secondary h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-accent-solid h-full rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform]"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <p className="text-micro text-muted-foreground mt-1 tabular-nums">
            {Math.min(100, pct)}%
          </p>
        </div>
      )}
      <button type="button" onClick={go} className={cn(SOLID, "mt-3 w-full")}>
        Start upload
      </button>
    </Stage>
  );
}

const PALETTE = [
  "Go to project",
  "Create issue",
  "Invite teammate",
  "Toggle theme",
  "Open billing",
];

function MCommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const hits = PALETTE.filter((p) => p.toLowerCase().includes(q.toLowerCase()));
  return (
    <Stage open={open} onClose={() => setOpen((v) => !v)} label={open ? "Close" : "Open palette"}>
      <label htmlFor="pal" className="sr-only">
        Command
      </label>
      <input
        id="pal"
        value={q}
        placeholder="Type a command"
        onChange={(e) => setQ(e.target.value)}
        className={cn(FIELD, "h-9")}
      />
      <div className="mt-2 max-h-24 overflow-y-auto">
        {hits.length === 0 && (
          <p className="text-caption text-muted-foreground py-2">No commands.</p>
        )}
        {hits.map((h, i) => (
          <button
            key={h}
            type="button"
            onClick={() => {
              setOpen(false);
              toast.success(h);
            }}
            className={cn(
              "text-caption flex h-8 w-full items-center rounded px-2 text-left",
              i === 0 && "bg-accent text-accent-foreground",
            )}
          >
            {h}
          </button>
        ))}
      </div>
    </Stage>
  );
}

function MFeedback() {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  return (
    <Stage open={open} onClose={() => setOpen((v) => !v)} label={open ? "Close" : "Give feedback"}>
      <p className="text-ui">How is it going?</p>
      <div className="mt-3 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} out of 5`}
            aria-pressed={score === n}
            onClick={() => setScore(n)}
            className={cn(
              "text-caption h-8 flex-1 rounded-md border tabular-nums transition-colors",
              score === n
                ? "bg-accent text-accent-foreground border-transparent"
                : "text-muted-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        aria-label="What could be better?"
        placeholder="What could be better?"
        className="text-ui-sm bg-card mt-2 h-14 w-full resize-none rounded-md border p-2 outline-none focus-visible:border-ring"
      />
      <button
        type="button"
        disabled={score === null}
        onClick={() => {
          setOpen(false);
          toast.success("Thanks — feedback sent");
        }}
        className={cn(SOLID, "mt-2 w-full")}
      >
        Send
      </button>
    </Stage>
  );
}

function MShortcuts() {
  const [open, setOpen] = useState(false);
  const keys = [
    ["⌘K", "Command palette"],
    ["G then I", "Go to issues"],
    ["⌘⏎", "Submit form"],
    ["?", "This dialog"],
  ];
  return (
    <Stage open={open} onClose={() => setOpen((v) => !v)} label={open ? "Close" : "Shortcuts"}>
      <p className="text-ui">Keyboard shortcuts</p>
      <div className="mt-2 divide-y">
        {keys.map(([k, d]) => (
          <div key={k} className="flex h-8 items-center justify-between">
            <span className="text-caption text-muted-foreground">{d}</span>
            <kbd className="bg-secondary text-micro rounded border px-1.5 py-0.5 font-mono">
              {k}
            </kbd>
          </div>
        ))}
      </div>
    </Stage>
  );
}

function MUpgrade() {
  const [open, setOpen] = useState(false);
  return (
    <Stage open={open} onClose={() => setOpen((v) => !v)} label={open ? "Close" : "Upgrade"}>
      <p className="text-micro text-accent-foreground uppercase">Limit reached</p>
      <p className="text-ui mt-1">You are out of seats</p>
      <p className="text-caption text-muted-foreground mt-1">
        Starter caps at 5. Pro raises it to 25 for $29/mo.
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className={cn(GHOST, "flex-1")}>
          Not now
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            toast.success("Upgraded to Pro");
          }}
          className={cn(SOLID, "flex-1")}
        >
          Upgrade
        </button>
      </div>
    </Stage>
  );
}

function MExport() {
  const [open, setOpen] = useState(false);
  const [fmt, setFmt] = useState<"CSV" | "JSON" | "XLSX">("CSV");
  return (
    <Stage open={open} onClose={() => setOpen((v) => !v)} label={open ? "Close" : "Export data"}>
      <p className="text-ui">Export</p>
      <p className="text-caption text-muted-foreground mt-1">
        4,182 rows will be written.
      </p>
      <div className="mt-3">
        <Seg
          items={["CSV", "JSON", "XLSX"] as const}
          value={fmt}
          onChange={setFmt}
          label="Export format"
        />
      </div>
      <p className="text-caption text-muted-foreground mt-2 font-mono">
        transactions-2026-08.{fmt.toLowerCase()}
      </p>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          toast.success(`Export started (${fmt})`);
        }}
        className={cn(SOLID, "mt-3 w-full")}
      >
        <Download className="size-3.5" aria-hidden="true" />
        Export
      </button>
    </Stage>
  );
}

function MCreateWorkspace() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (
    <Stage open={open} onClose={() => setOpen((v) => !v)} label={open ? "Close" : "New workspace"}>
      <p className="text-ui">Create workspace</p>
      <label htmlFor="ws-n" className="text-caption text-muted-foreground mt-3 mb-1 block">
        Name
      </label>
      <input
        id="ws-n"
        value={name}
        placeholder="Acme Design"
        onChange={(e) => setName(e.target.value)}
        className={FIELD}
      />
      <p className="text-caption text-muted-foreground mt-1.5 font-mono">
        acme.co/{slug || "…"}
      </p>
      <button
        type="button"
        disabled={!slug}
        onClick={() => {
          setOpen(false);
          toast.success(`Created ${slug}`);
        }}
        className={cn(SOLID, "mt-3 w-full")}
      >
        Create
      </button>
    </Stage>
  );
}

function MTwoFactorSetup() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  return (
    <Stage open={open} onClose={() => setOpen((v) => !v)} label={open ? "Close" : "Set up 2FA"}>
      <p className="text-ui">Scan then confirm</p>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="bg-feature grid size-16 shrink-0 grid-cols-4 gap-0.5 rounded p-1.5"
          aria-hidden="true"
        >
          {Array.from({ length: 16 }, (_, i) => (
            <span
              key={i}
              className={cn("rounded-xs", i % 3 === 0 ? "bg-feature-foreground" : "")}
            />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="tfa" className="text-caption text-muted-foreground mb-1 block">
            6-digit code
          </label>
          <input
            id="tfa"
            value={code}
            inputMode="numeric"
            maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={cn(FIELD, "font-mono tabular-nums")}
          />
        </div>
      </div>
      <button
        type="button"
        disabled={code.length !== 6}
        onClick={() => {
          setOpen(false);
          setCode("");
          toast.success("Two-factor enabled");
        }}
        className={cn(SOLID, "mt-3 w-full")}
      >
        Confirm
      </button>
    </Stage>
  );
}

/* ══ Charts — pure SVG, as the gallery does them ══════════════════ */

function ChRevenueArea() {
  const [at, setAt] = useState<number | null>(null);
  const d = [18, 26, 22, 34, 30, 44, 41, 52];
  const max = Math.max(...d);
  const pt = (v: number, i: number) =>
    `${(i / (d.length - 1)) * 100},${40 - (v / max) * 34}`;
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Revenue</p>
      <p className="text-caption text-muted-foreground tabular-nums">
        {at === null ? "Hover a point" : `Month ${at + 1} · $${d[at]}k`}
      </p>
      <svg
        viewBox="0 0 100 44"
        preserveAspectRatio="none"
        className="mt-auto h-28 w-full"
        role="img"
        aria-label="Revenue by month, rising from 18k to 52k"
      >
        <polygon
          points={`0,44 ${d.map(pt).join(" ")} 100,44`}
          className="fill-accent-solid opacity-15"
        />
        <polyline
          points={d.map(pt).join(" ")}
          className="stroke-accent-solid fill-none"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {d.map((v, i) => (
          <circle
            key={i}
            cx={(i / (d.length - 1)) * 100}
            cy={40 - (v / max) * 34}
            r={at === i ? 2.5 : 1.5}
            className={cn(at === i ? "fill-accent-solid" : "fill-card stroke-accent-solid")}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            onMouseEnter={() => setAt(i)}
            onMouseLeave={() => setAt(null)}
          />
        ))}
      </svg>
    </Screen>
  );
}

function ChCohortHeatmap() {
  const [cell, setCell] = useState<string | null>(null);
  const rows = ["W1", "W2", "W3", "W4"];
  const vals = [
    [100, 62, 48, 41],
    [100, 58, 44, 0],
    [100, 66, 0, 0],
    [100, 0, 0, 0],
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Retention by cohort</p>
      <p className="text-caption text-muted-foreground tabular-nums">
        {cell ?? "Hover a cell"}
      </p>
      <div className="mt-2 grid grid-cols-[2rem_repeat(4,minmax(0,1fr))] gap-1">
        {rows.map((r, i) => (
          <div key={r} className="contents">
            <span className="text-micro text-muted-foreground flex items-center">
              {r}
            </span>
            {vals[i].map((v, j) => (
              <button
                key={j}
                type="button"
                aria-label={`${r} week ${j}: ${v}%`}
                onMouseEnter={() => setCell(`${r} → +${j}w · ${v}%`)}
                onMouseLeave={() => setCell(null)}
                onFocus={() => setCell(`${r} → +${j}w · ${v}%`)}
                onBlur={() => setCell(null)}
                className="bg-accent-solid h-7 rounded-sm"
                style={{ opacity: v === 0 ? 0.06 : 0.15 + (v / 100) * 0.85 }}
              />
            ))}
          </div>
        ))}
      </div>
    </Screen>
  );
}

function ChFunnel() {
  const steps = [
    { n: "Visited", v: 12400 },
    { n: "Signed up", v: 3120 },
    { n: "Activated", v: 1480 },
    { n: "Paid", v: 412 },
  ];
  return (
    <Screen className="flex flex-col justify-center gap-1.5 p-4">
      {steps.map((s, i) => (
        <div key={s.n}>
          <div className="text-caption flex justify-between">
            <span>{s.n}</span>
            <span className="text-muted-foreground tabular-nums">
              {s.v.toLocaleString()}
              {i > 0 &&
                ` · ${Math.round((s.v / steps[i - 1].v) * 100)}%`}
            </span>
          </div>
          <div
            className="bg-accent-solid mt-0.5 h-4 rounded-sm"
            style={{ width: `${(s.v / steps[0].v) * 100}%`, opacity: 1 - i * 0.15 }}
            aria-hidden="true"
          />
        </div>
      ))}
    </Screen>
  );
}

function ChGauges() {
  const [load, setLoad] = useState(68);
  const gauges = [
    { n: "CPU", v: load },
    { n: "Memory", v: 44 },
    { n: "Disk", v: 82 },
  ];
  return (
    <Screen className="flex flex-col items-center justify-center gap-3 p-4">
      <div className="flex gap-4">
        {gauges.map((g) => {
          const r = 16;
          const c = 2 * Math.PI * r;
          return (
            <div key={g.n} className="text-center">
              <svg viewBox="0 0 40 40" className="size-14" role="img" aria-label={`${g.n} ${g.v}%`}>
                <circle
                  cx="20"
                  cy="20"
                  r={r}
                  className="stroke-secondary fill-none"
                  strokeWidth="4"
                />
                <circle
                  cx="20"
                  cy="20"
                  r={r}
                  className={cn(
                    "fill-none transition-[color,background-color,border-color,box-shadow,opacity,transform]",
                    g.v > 80 ? "stroke-destructive" : "stroke-accent-solid",
                  )}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={c - (g.v / 100) * c}
                  transform="rotate(-90 20 20)"
                />
              </svg>
              <p className="text-micro text-muted-foreground uppercase">{g.n}</p>
              <p className="text-caption tabular-nums">{g.v}%</p>
            </div>
          );
        })}
      </div>
      <label htmlFor="gauge" className="sr-only">
        CPU load
      </label>
      <input
        id="gauge"
        type="range"
        min={0}
        max={100}
        value={load}
        onChange={(e) => setLoad(Number(e.target.value))}
        className="accent-accent-solid w-40"
      />
    </Screen>
  );
}

function ChBarGrouped() {
  const [series, setSeries] = useState<string[]>(["New", "Returning"]);
  const data = [
    { m: "Apr", New: 28, Returning: 18 },
    { m: "May", New: 34, Returning: 24 },
    { m: "Jun", New: 30, Returning: 31 },
    { m: "Jul", New: 42, Returning: 27 },
  ];
  return (
    <Screen className="flex flex-col p-3">
      <div className="flex gap-1.5">
        {(["New", "Returning"] as const).map((s, i) => (
          <button
            key={s}
            type="button"
            aria-pressed={series.includes(s)}
            onClick={() =>
              setSeries((v) =>
                v.includes(s) ? v.filter((x) => x !== s) : [...v, s],
              )
            }
            className="text-micro text-muted-foreground flex h-8 items-center gap-1.5 uppercase"
          >
            <span
              className={cn(
                "size-2 rounded-full",
                series.includes(s) ? "bg-accent-solid" : "bg-border-strong",
              )}
              style={{ opacity: i === 1 ? 0.5 : 1 }}
            />
            {s}
          </button>
        ))}
      </div>
      <div className="mt-auto flex h-24 items-end gap-2">
        {data.map((d) => (
          <div key={d.m} className="flex flex-1 items-end justify-center gap-0.5">
            {series.includes("New") && (
              <span
                className="bg-accent-solid w-2.5 rounded-t"
                style={{ height: `${d.New * 2}px` }}
                aria-hidden="true"
              />
            )}
            {series.includes("Returning") && (
              <span
                className="bg-accent-solid w-2.5 rounded-t opacity-50"
                style={{ height: `${d.Returning * 2}px` }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-micro text-muted-foreground mt-1 flex gap-2">
        {data.map((d) => (
          <span key={d.m} className="flex-1 text-center">
            {d.m}
          </span>
        ))}
      </div>
    </Screen>
  );
}

function ChLineMulti() {
  const a = [10, 18, 15, 26, 24, 33];
  const b = [22, 20, 27, 24, 31, 29];
  const line = (d: number[]) =>
    d.map((v, i) => `${(i / (d.length - 1)) * 100},${40 - v}`).join(" ");
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Two series</p>
      <div className="text-micro text-muted-foreground mt-1 flex gap-3">
        <span className="flex items-center gap-1">
          <span className="bg-accent-solid size-2 rounded-full" /> API
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-border-strong size-2 rounded-full" /> Web
        </span>
      </div>
      <svg
        viewBox="0 0 100 44"
        preserveAspectRatio="none"
        className="mt-auto h-28 w-full"
        role="img"
        aria-label="API and Web latency over six intervals"
      >
        {[10, 20, 30].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} className="stroke-border" strokeWidth="0.5" />
        ))}
        <polyline
          points={line(a)}
          className="stroke-accent-solid fill-none"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={line(b)}
          className="stroke-border-strong fill-none"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </Screen>
  );
}

function ChDonut() {
  const [at, setAt] = useState<number | null>(null);
  const parts = [
    { n: "Pro", v: 52 },
    { n: "Team", v: 28 },
    { n: "Starter", v: 20 },
  ];
  const r = 16;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <Screen className="flex items-center justify-center gap-4 p-4">
      <svg viewBox="0 0 40 40" className="size-24" role="img" aria-label="Revenue split by plan">
        {parts.map((p, i) => {
          const off = acc;
          acc += p.v;
          return (
            <circle
              key={p.n}
              cx="20"
              cy="20"
              r={r}
              className="stroke-accent-solid fill-none transition-opacity"
              strokeWidth={at === i ? 8 : 6}
              strokeDasharray={`${(p.v / 100) * c} ${c}`}
              strokeDashoffset={-((off / 100) * c)}
              transform="rotate(-90 20 20)"
              style={{ opacity: 1 - i * 0.3 }}
              onMouseEnter={() => setAt(i)}
              onMouseLeave={() => setAt(null)}
            />
          );
        })}
      </svg>
      <div className="space-y-1">
        {parts.map((p, i) => (
          <button
            key={p.n}
            type="button"
            onMouseEnter={() => setAt(i)}
            onMouseLeave={() => setAt(null)}
            onFocus={() => setAt(i)}
            onBlur={() => setAt(null)}
            className={cn(
              "text-caption flex h-8 items-center gap-2",
              at === i ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className="bg-accent-solid size-2 rounded-full"
              style={{ opacity: 1 - i * 0.3 }}
            />
            {p.n}
            <span className="tabular-nums">{p.v}%</span>
          </button>
        ))}
      </div>
    </Screen>
  );
}

function ChScatter() {
  const pts = [
    [12, 30],
    [22, 24],
    [30, 34],
    [38, 18],
    [48, 26],
    [56, 12],
    [64, 20],
    [72, 8],
    [84, 14],
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Latency vs payload</p>
      <svg
        viewBox="0 0 100 44"
        className="mt-auto h-32 w-full"
        role="img"
        aria-label="Scatter of latency against payload size"
      >
        <line x1="0" y1="40" x2="100" y2="40" className="stroke-border" strokeWidth="0.5" />
        <line x1="2" y1="0" x2="2" y2="40" className="stroke-border" strokeWidth="0.5" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" className="fill-accent-solid opacity-70" />
        ))}
        <line
          x1="8"
          y1="31"
          x2="88"
          y2="13"
          className="stroke-border-strong"
          strokeWidth="0.8"
          strokeDasharray="3 2"
        />
      </svg>
      <p className="text-micro text-muted-foreground">
        Dashed line is the fitted trend.
      </p>
    </Screen>
  );
}

function ChWaterfall() {
  const steps = [
    { n: "Start", v: 40, kind: "base" },
    { n: "New", v: 18, kind: "up" },
    { n: "Expansion", v: 9, kind: "up" },
    { n: "Churn", v: -12, kind: "down" },
    { n: "End", v: 55, kind: "base" },
  ];
  let run = 0;
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">MRR bridge</p>
      <div className="mt-auto flex h-28 items-end gap-1.5">
        {steps.map((s) => {
          const isBase = s.kind === "base";
          const bottom = isBase ? 0 : s.v > 0 ? run : run + s.v;
          const height = isBase ? s.v : Math.abs(s.v);
          if (!isBase) run += s.v;
          else run = s.v;
          return (
            <div key={s.n} className="relative flex flex-1 flex-col justify-end">
              <span
                className={cn(
                  "w-full rounded-sm",
                  isBase
                    ? "bg-feature"
                    : s.v > 0
                      ? "bg-positive"
                      : "bg-destructive",
                )}
                style={{ height: `${height * 1.8}px`, marginBottom: `${bottom * 1.8}px` }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
      <div className="text-micro text-muted-foreground mt-1 flex gap-1.5">
        {steps.map((s) => (
          <span key={s.n} className="flex-1 truncate text-center">
            {s.n}
          </span>
        ))}
      </div>
    </Screen>
  );
}

/* ══ Timelines ════════════════════════════════════════════════════ */

function Rail({
  items,
}: {
  items: { t: string; d: string; tone?: string }[];
}) {
  return (
    <div className="relative pl-4">
      <span className="bg-border absolute top-1 bottom-1 left-1 w-px" aria-hidden="true" />
      <div className="space-y-2.5">
        {items.map((i, n) => (
          <div key={n} className="relative">
            <span
              className={cn(
                "border-card absolute top-1 -left-3.5 size-2 rounded-full border",
                i.tone ?? "bg-accent-solid",
              )}
              aria-hidden="true"
            />
            <p className="text-caption">{i.t}</p>
            <p className="text-micro text-muted-foreground normal-case">{i.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TlAudit() {
  const [who, setWho] = useState<string | null>(null);
  const all = [
    { t: "sam rotated an API key", d: "12:04 · from 10.0.0.4", who: "sam" },
    { t: "nadia invited tomas", d: "11:52 · role admin", who: "nadia" },
    { t: "sam changed the billing plan", d: "08:31 · Pro → Team", who: "sam" },
  ];
  const rows = who ? all.filter((a) => a.who === who) : all;
  return (
    <Screen className="flex flex-col p-3">
      <div className="flex gap-1.5">
        {["sam", "nadia"].map((p) => (
          <Chip key={p} on={who === p} onClick={() => setWho((v) => (v === p ? null : p))}>
            {p}
          </Chip>
        ))}
      </div>
      <div className="mt-3">
        <Rail items={rows} />
      </div>
    </Screen>
  );
}

function TlNotifications() {
  const [read, setRead] = useState<number[]>([2]);
  const items = [
    "Nadia mentioned you in #design",
    "Build 4f2a finished",
    "Invoice 2214 was paid",
  ];
  return (
    <Screen className="flex flex-col p-3">
      <div className="flex items-center justify-between">
        <p className="text-ui-sm">Notifications</p>
        <button
          type="button"
          onClick={() => setRead(items.map((_, i) => i))}
          className={GHOST}
        >
          Mark all read
        </button>
      </div>
      <div className="mt-2 divide-y">
        {items.map((n, i) => (
          <button
            key={n}
            type="button"
            onClick={() => setRead((v) => (v.includes(i) ? v : [...v, i]))}
            className="flex w-full items-center gap-2 py-2 text-left"
          >
            {read.includes(i) ? (
              <span className="size-1.5 shrink-0" aria-hidden="true" />
            ) : (
              <Dot />
            )}
            <span
              className={cn(
                "text-caption truncate",
                read.includes(i) && "text-muted-foreground",
              )}
            >
              {n}
            </span>
          </button>
        ))}
      </div>
    </Screen>
  );
}

function TlChangelog() {
  const [open, setOpen] = useState("2.4.0");
  const rel = [
    { v: "2.4.0", d: "Sidebar rework, faster tables" },
    { v: "2.3.1", d: "Fix webhook retry backoff" },
    { v: "2.3.0", d: "Audit log export" },
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Changelog</p>
      <div className="mt-2 divide-y">
        {rel.map((r) => (
          <div key={r.v}>
            <button
              type="button"
              aria-expanded={open === r.v}
              onClick={() => setOpen((v) => (v === r.v ? "" : r.v))}
              className="flex h-9 w-full items-center gap-2"
            >
              <span className="text-caption font-mono">{r.v}</span>
              <ChevronRight
                className={cn(
                  "text-muted-foreground duration-fast ml-auto size-3.5 transition-transform",
                  open === r.v && "rotate-90",
                )}
                aria-hidden="true"
              />
            </button>
            {open === r.v && (
              <p className="text-caption text-muted-foreground pb-2">{r.d}</p>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

function TlCommits() {
  return (
    <Screen className="p-3">
      <p className="text-ui-sm mb-2">Commits</p>
      <Rail
        items={[
          { t: "fix: guard against empty slug", d: "9fa2c1 · sam · 2m ago" },
          { t: "feat: bulk row actions", d: "44bd80 · nadia · 1h ago" },
          { t: "chore: bump tailwind", d: "10ee7c · tomas · 3h ago" },
        ]}
      />
    </Screen>
  );
}

function TlApprovals() {
  const [state, setState] = useState<"pending" | "approved" | "rejected">("pending");
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Expense #4821</p>
      <div className="mt-3">
        <Rail
          items={[
            { t: "Submitted by Tomás", d: "Aug 3 · $1,240", tone: "bg-border-strong" },
            { t: "Manager review", d: "Aug 4 · approved", tone: "bg-positive" },
            {
              t: "Finance review",
              d:
                state === "pending"
                  ? "waiting on you"
                  : state === "approved"
                    ? "approved"
                    : "rejected",
              tone:
                state === "pending"
                  ? "bg-accent-solid"
                  : state === "approved"
                    ? "bg-positive"
                    : "bg-destructive",
            },
          ]}
        />
      </div>
      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={() => setState("rejected")}
          className={cn(GHOST, "flex-1")}
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => setState("approved")}
          className={cn(SOLID, "flex-1")}
        >
          Approve
        </button>
      </div>
    </Screen>
  );
}

function TlPullRequest() {
  const [checks, setChecks] = useState(false);
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Rework sidebar collapse</p>
      <p className="text-micro text-muted-foreground">
        #482 · tomas wants to merge into main
      </p>
      <div className="mt-3 space-y-1.5">
        {["lint", "typecheck", "e2e"].map((c, i) => (
          <div key={c} className="flex items-center gap-2">
            <Dot tone={checks || i < 2 ? "bg-positive" : "bg-accent-solid"} />
            <span className="text-caption font-mono">{c}</span>
            <span className="text-micro text-muted-foreground ml-auto">
              {checks || i < 2 ? "passed" : "running"}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={!checks}
        onClick={() => toast.success("Merged into main")}
        className={cn(SOLID, "mt-auto")}
      >
        {checks ? "Merge pull request" : "Waiting for checks"}
      </button>
      {!checks && (
        <button
          type="button"
          onClick={() => setChecks(true)}
          className="text-micro text-muted-foreground mt-1.5 underline"
        >
          finish the running check
        </button>
      )}
    </Screen>
  );
}

function TlPrOpsConsole() {
  const [sel, setSel] = useState(0);
  const prs = [
    { t: "Rework sidebar", s: "ready" },
    { t: "Retry backoff", s: "conflict" },
    { t: "Audit export", s: "draft" },
  ];
  return (
    <Screen className="grid grid-cols-[10rem_minmax(0,1fr)]">
      <div className="bg-secondary divide-y border-r">
        {prs.map((p, i) => (
          <button
            key={p.t}
            type="button"
            onClick={() => setSel(i)}
            aria-current={sel === i ? "true" : undefined}
            className={cn(
              "flex w-full items-center gap-1.5 px-2 py-2 text-left",
              sel === i ? "bg-card" : "",
            )}
          >
            <Dot
              tone={
                p.s === "ready"
                  ? "bg-positive"
                  : p.s === "conflict"
                    ? "bg-destructive"
                    : "bg-border-strong"
              }
            />
            <span className="text-caption truncate">{p.t}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2 p-3">
        <p className="text-ui-sm">{prs[sel].t}</p>
        <p className="text-micro text-muted-foreground uppercase">{prs[sel].s}</p>
        <Bar w="w-2/3" />
        <Bar w="w-full" />
      </div>
    </Screen>
  );
}

function TlReleases() {
  return (
    <Screen className="p-3">
      <p className="text-ui-sm mb-2">Releases</p>
      <Rail
        items={[
          { t: "v2.4.0 — general availability", d: "Aug 5 · 100% of traffic" },
          { t: "v2.4.0-rc.2", d: "Aug 2 · 10% canary", tone: "bg-accent-solid" },
          { t: "v2.3.1", d: "Jul 28 · superseded", tone: "bg-border-strong" },
        ]}
      />
    </Screen>
  );
}

function TlStatusPage() {
  const days = Array.from({ length: 30 }, (_, i) =>
    i === 11 ? "down" : i === 12 || i === 20 ? "degraded" : "up",
  );
  return (
    <Screen className="flex flex-col p-3">
      <div className="flex items-center gap-2">
        <Dot tone="bg-positive" />
        <p className="text-ui-sm">All systems operational</p>
      </div>
      <div className="mt-3 flex items-end gap-0.5">
        {days.map((d, i) => (
          <span
            key={i}
            title={d}
            className={cn(
              "h-8 flex-1 rounded-xs",
              d === "up"
                ? "bg-positive"
                : d === "degraded"
                  ? "bg-accent-solid"
                  : "bg-destructive",
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="text-micro text-muted-foreground mt-1 flex justify-between">
        <span>30 days ago</span>
        <span className="tabular-nums">99.87% uptime</span>
        <span>today</span>
      </p>
    </Screen>
  );
}

function TlDeploys() {
  const [rollback, setRollback] = useState(false);
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Deploys</p>
      <div className="mt-2 flex-1">
        <Rail
          items={[
            {
              t: rollback ? "rollback to 2.3.1" : "2.4.0 → production",
              d: rollback ? "just now · by you" : "2m ago · 41s build",
              tone: rollback ? "bg-destructive" : "bg-positive",
            },
            { t: "2.4.0 → staging", d: "18m ago · 39s build", tone: "bg-positive" },
            { t: "2.3.1 → production", d: "yesterday", tone: "bg-border-strong" },
          ]}
        />
      </div>
      <button
        type="button"
        disabled={rollback}
        onClick={() => setRollback(true)}
        className={cn(GHOST, "self-start")}
      >
        <Undo2 className="size-3.5" aria-hidden="true" />
        {rollback ? "Rolled back" : "Roll back"}
      </button>
    </Screen>
  );
}

function TlInboxThread() {
  const [expanded, setExpanded] = useState(2);
  const msgs = [
    { w: "Nadia", t: "Can we ship the rail on Thursday?" },
    { w: "Sam", t: "Only if the e2e suite is green." },
    { w: "Tomás", t: "It went green ten minutes ago." },
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Ship the rail?</p>
      <div className="mt-2 divide-y">
        {msgs.map((m, i) => (
          <button
            key={i}
            type="button"
            aria-expanded={expanded === i}
            onClick={() => setExpanded(i)}
            className="flex w-full gap-2 py-2 text-left"
          >
            <Ini n={m.w.slice(0, 2).toUpperCase()} size="size-6" />
            <div className="min-w-0">
              <p className="text-caption">{m.w}</p>
              <p
                className={cn(
                  "text-micro text-muted-foreground normal-case",
                  expanded === i ? "" : "truncate",
                )}
              >
                {m.t}
              </p>
            </div>
          </button>
        ))}
      </div>
    </Screen>
  );
}

function TlActivityFeed() {
  const [items, setItems] = useState(3);
  const all = [
    { t: "Sam merged #482", d: "2m ago" },
    { t: "Nadia commented on #479", d: "14m ago" },
    { t: "Build 4f2a passed", d: "1h ago" },
    { t: "Tomás opened #483", d: "2h ago" },
    { t: "Invoice 2214 paid", d: "4h ago" },
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm mb-2">Activity</p>
      <div className="flex-1 overflow-hidden">
        <Rail items={all.slice(0, items)} />
      </div>
      {items < all.length && (
        <button
          type="button"
          onClick={() => setItems(all.length)}
          className={cn(GHOST, "mt-2 self-start")}
        >
          Load {all.length - items} more
        </button>
      )}
    </Screen>
  );
}

/* ══ Calendars ════════════════════════════════════════════════════ */

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

function CalMonth() {
  const [month, setMonth] = useState(7);
  const [pick, setPick] = useState(12);
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return (
    <Screen className="flex flex-col p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonth((m) => (m + 11) % 12)}
          className={cn(GHOST, "size-8 px-0")}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="text-ui-sm">{names[month]} 2026</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth((m) => (m + 1) % 12)}
          className={cn(GHOST, "size-8 px-0")}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="text-micro text-muted-foreground mt-1.5 grid grid-cols-7 text-center">
        {DOW.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5">
        {Array.from({ length: 35 }, (_, i) => {
          const day = i - 2;
          const valid = day >= 1 && day <= 31;
          return (
            <button
              key={i}
              type="button"
              disabled={!valid}
              onClick={() => setPick(day)}
              aria-label={valid ? `${names[month]} ${day}` : undefined}
              className={cn(
                "text-micro grid h-6 place-items-center rounded tabular-nums transition-colors",
                !valid && "opacity-0",
                pick === day
                  ? "bg-feature text-feature-foreground"
                  : "hover:bg-secondary text-muted-foreground",
              )}
            >
              {valid ? day : ""}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

function CalWeek() {
  const slots = [
    { d: 0, t: 1, h: 2, n: "Standup" },
    { d: 2, t: 2, h: 3, n: "Review" },
    { d: 3, t: 0, h: 2, n: "1:1" },
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Week of Aug 3</p>
      <div className="mt-2 grid flex-1 grid-cols-5 gap-1">
        {[0, 1, 2, 3, 4].map((d) => (
          <div key={d} className="relative flex flex-col gap-0.5">
            <span className="text-micro text-muted-foreground text-center">
              {DOW[d]}
            </span>
            <div className="bg-secondary relative flex-1 rounded-sm">
              {slots
                .filter((s) => s.d === d)
                .map((s) => (
                  <span
                    key={s.n}
                    className="bg-accent text-accent-foreground text-micro absolute inset-x-0 grid place-items-center rounded-sm px-0.5"
                    style={{ top: `${s.t * 22}%`, height: `${s.h * 22}%` }}
                  >
                    {s.n}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function CalAgenda() {
  const [day, setDay] = useState(0);
  const events: Record<number, { t: string; n: string }[]> = {
    0: [
      { t: "09:30", n: "Standup" },
      { t: "14:00", n: "Design review" },
    ],
    1: [{ t: "11:00", n: "1:1 with Nadia" }],
    2: [],
  };
  return (
    <Screen className="flex flex-col p-3">
      <div className="flex gap-1.5">
        {["Today", "Tomorrow", "Wed"].map((d, i) => (
          <Chip key={d} on={day === i} onClick={() => setDay(i)}>
            {d}
          </Chip>
        ))}
      </div>
      <div className="mt-3 divide-y">
        {events[day].length === 0 ? (
          <p className="text-caption text-muted-foreground py-3">
            Nothing scheduled. A clear day.
          </p>
        ) : (
          events[day].map((e) => (
            <div key={e.n} className="flex h-10 items-center gap-3">
              <span className="text-caption text-muted-foreground tabular-nums">
                {e.t}
              </span>
              <span className="bg-accent-solid h-6 w-0.5 rounded-full" aria-hidden="true" />
              <span className="text-caption">{e.n}</span>
            </div>
          ))
        )}
      </div>
    </Screen>
  );
}

function CalDateRange() {
  const [from, setFrom] = useState<number | null>(8);
  const [to, setTo] = useState<number | null>(14);
  const click = (d: number) => {
    if (from === null || to !== null) {
      setFrom(d);
      setTo(null);
    } else if (d < from) {
      setTo(from);
      setFrom(d);
    } else setTo(d);
  };
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-caption text-muted-foreground tabular-nums">
        {from ?? "—"} → {to ?? "pick an end"}
      </p>
      <div className="mt-2 grid grid-cols-7 gap-0.5">
        {Array.from({ length: 28 }, (_, i) => {
          const d = i + 1;
          const inRange = from !== null && to !== null && d > from && d < to;
          const edge = d === from || d === to;
          return (
            <button
              key={d}
              type="button"
              onClick={() => click(d)}
              aria-label={`Day ${d}`}
              className={cn(
                "text-micro grid h-7 place-items-center tabular-nums transition-colors",
                edge
                  ? "bg-feature text-feature-foreground rounded"
                  : inRange
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-secondary text-muted-foreground rounded",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

function CalTimezone() {
  const [hour, setHour] = useState(14);
  const zones = [
    { n: "San Francisco", off: -7 },
    { n: "London", off: 1 },
    { n: "Tokyo", off: 9 },
  ];
  const fmt = (h: number) => `${((h % 24) + 24) % 24}`.padStart(2, "0") + ":00";
  return (
    <Screen className="flex flex-col p-3">
      <label htmlFor="tz" className="text-caption text-muted-foreground mb-1 block">
        UTC {fmt(hour)}
      </label>
      <input
        id="tz"
        type="range"
        min={0}
        max={23}
        value={hour}
        onChange={(e) => setHour(Number(e.target.value))}
        className="accent-accent-solid w-full"
      />
      <div className="mt-3 divide-y">
        {zones.map((z) => {
          const local = ((hour + z.off) % 24 + 24) % 24;
          const work = local >= 9 && local < 18;
          return (
            <div key={z.n} className="flex h-9 items-center gap-2">
              <span className="text-caption truncate">{z.n}</span>
              <span
                className={cn(
                  "text-caption ml-auto tabular-nums",
                  work ? "text-positive" : "text-muted-foreground",
                )}
              >
                {fmt(local)} {work ? "" : "· off hours"}
              </span>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

function CalMini() {
  const [pick, setPick] = useState(12);
  return (
    <Screen className="grid place-items-center p-4">
      <div className="bg-card w-44 rounded-lg border p-2.5">
        <p className="text-caption mb-1 text-center">August</p>
        <div className="text-micro text-muted-foreground grid grid-cols-7 text-center">
          {DOW.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 28 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPick(i + 1)}
              aria-label={`August ${i + 1}`}
              className={cn(
                "text-micro grid h-5 place-items-center rounded-sm tabular-nums",
                pick === i + 1
                  ? "bg-accent-solid text-feature-foreground"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function CalYearHeatmap() {
  const [cell, setCell] = useState<string | null>(null);
  const weeks = 26;
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Contributions</p>
      <p className="text-micro text-muted-foreground">{cell ?? "Hover a day"}</p>
      <div className="mt-2 flex gap-0.5 overflow-hidden">
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} className="flex flex-1 flex-col gap-0.5">
            {Array.from({ length: 7 }, (_, d) => {
              const v = (w * 7 + d * 3) % 5;
              return (
                <button
                  key={d}
                  type="button"
                  aria-label={`Week ${w + 1} day ${d + 1}: ${v} commits`}
                  onMouseEnter={() => setCell(`W${w + 1} D${d + 1} · ${v} commits`)}
                  onMouseLeave={() => setCell(null)}
                  className="bg-accent-solid h-2.5 rounded-xs"
                  style={{ opacity: v === 0 ? 0.08 : 0.25 + v * 0.18 }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </Screen>
  );
}

function CalRecurring() {
  const [freq, setFreq] = useState<"Daily" | "Weekly" | "Monthly">("Weekly");
  const [days, setDays] = useState<number[]>([0, 2, 4]);
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Repeats</p>
      <div className="mt-2">
        <Seg
          items={["Daily", "Weekly", "Monthly"] as const}
          value={freq}
          onChange={setFreq}
          label="Frequency"
        />
      </div>
      {freq === "Weekly" && (
        <div className="mt-3 flex gap-1">
          {DOW.map((d, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Day ${i + 1}`}
              aria-pressed={days.includes(i)}
              onClick={() =>
                setDays((v) =>
                  v.includes(i) ? v.filter((x) => x !== i) : [...v, i],
                )
              }
              className={cn(
                "text-micro size-8 rounded-full border transition-colors",
                days.includes(i)
                  ? "bg-accent text-accent-foreground border-transparent"
                  : "text-muted-foreground",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      <p className="text-caption text-muted-foreground mt-auto">
        {freq === "Weekly"
          ? `Every week on ${days.length} day${days.length === 1 ? "" : "s"}`
          : `${freq}, until cancelled`}
      </p>
    </Screen>
  );
}

function CalHolidays() {
  const rows = [
    { n: "Sam Ortiz", d: "Aug 10 – 14", k: "PTO" },
    { n: "Nadia Okonkwo", d: "Aug 12", k: "Holiday" },
    { n: "Tomás Ruiz", d: "Aug 18 – 22", k: "PTO" },
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Time off</p>
      <div className="mt-2 divide-y">
        {rows.map((r) => (
          <div key={r.n} className="flex h-11 items-center gap-2">
            <Ini n={r.n.slice(0, 2).toUpperCase()} size="size-6" />
            <div className="min-w-0">
              <p className="text-caption truncate">{r.n}</p>
              <p className="text-micro text-muted-foreground normal-case">{r.d}</p>
            </div>
            <span
              className={cn(
                "text-micro ml-auto rounded-full px-1.5 py-0.5 uppercase",
                r.k === "PTO"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {r.k}
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ══ Profile ══════════════════════════════════════════════════════ */

function PrHero() {
  const [tab, setTab] = useState<"Overview" | "Activity" | "Teams">("Overview");
  return (
    <Screen className="flex flex-col">
      <div className="bg-feature h-12 shrink-0" aria-hidden="true" />
      <div className="-mt-5 px-3">
        <Ini n="SO" size="size-10" tone="bg-card border text-foreground" />
        <p className="text-ui mt-1">Sam Ortiz</p>
        <p className="text-caption text-muted-foreground">
          Design engineer · San Francisco
        </p>
      </div>
      <div className="mt-2 flex gap-1 border-b px-3">
        {(["Overview", "Activity", "Teams"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-current={tab === t ? "true" : undefined}
            onClick={() => setTab(t)}
            className={cn(
              "text-caption h-8 border-b-2 px-2 transition-colors",
              tab === t
                ? "border-accent-solid text-foreground"
                : "text-muted-foreground border-transparent",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-2 p-3">
        <Bar w="w-2/3" />
        <Bar w="w-full" />
      </div>
    </Screen>
  );
}

function PrHoverCard() {
  const [open, setOpen] = useState(false);
  return (
    <Screen className="relative grid place-items-center p-4">
      <p className="text-caption text-muted-foreground">
        Reviewed by{" "}
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="text-accent-foreground underline underline-offset-2"
        >
          @nadia
        </button>{" "}
        yesterday.
      </p>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="shadow-floating bg-card absolute top-1/2 left-1/2 w-48 -translate-x-1/2 rounded-lg border p-3"
          >
            <div className="flex items-center gap-2">
              <Ini n="NO" size="size-8" />
              <div>
                <p className="text-caption">Nadia Okonkwo</p>
                <p className="text-micro text-muted-foreground normal-case">
                  Staff engineer
                </p>
              </div>
            </div>
            <p className="text-micro text-muted-foreground mt-2 normal-case">
              482 commits · 31 reviews this month
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
}

const TEAM = [
  { n: "Sam Ortiz", i: "SO", r: "Design eng" },
  { n: "Nadia Okonkwo", i: "NO", r: "Staff eng" },
  { n: "Tomás Ruiz", i: "TR", r: "Frontend" },
  { n: "Lin Wei", i: "LW", r: "Data" },
  { n: "Ada Poole", i: "AP", r: "PM" },
  { n: "Jon Vidal", i: "JV", r: "Support" },
];

function PrTeamGrid() {
  return (
    <Screen className="grid grid-cols-3 gap-2 overflow-y-auto p-3">
      {TEAM.map((m) => (
        <div key={m.n} className="bg-secondary rounded-md border p-2 text-center">
          <Ini n={m.i} size="size-8" />
          <p className="text-micro mt-1 truncate normal-case">{m.n}</p>
          <p className="text-micro text-muted-foreground truncate normal-case">
            {m.r}
          </p>
        </div>
      ))}
    </Screen>
  );
}

function PrDirectory() {
  const [q, setQ] = useState("");
  const rows = TEAM.filter((m) =>
    `${m.n} ${m.r}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Screen className="flex flex-col p-3">
      <label htmlFor="dir-q" className="sr-only">
        Search people
      </label>
      <input
        id="dir-q"
        value={q}
        placeholder="Search people"
        onChange={(e) => setQ(e.target.value)}
        className={FIELD}
      />
      <div className="mt-2 divide-y overflow-y-auto">
        {rows.length === 0 && (
          <p className="text-caption text-muted-foreground py-3">
            Nobody matches “{q}”.
          </p>
        )}
        {rows.map((m) => (
          <div key={m.n} className="flex h-10 items-center gap-2">
            <Ini n={m.i} size="size-6" />
            <span className="text-caption truncate">{m.n}</span>
            <span className="text-micro text-muted-foreground ml-auto normal-case">
              {m.r}
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function PrCompactCard() {
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card flex w-full max-w-64 items-center gap-2 rounded-lg border p-2.5">
        <span className="relative">
          <Ini n="TR" size="size-8" />
          <span
            className="bg-positive border-card absolute right-0 bottom-0 size-2.5 rounded-full border"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <p className="text-caption truncate">Tomás Ruiz</p>
          <p className="text-micro text-muted-foreground normal-case">
            Active now
          </p>
        </div>
        <button
          type="button"
          aria-label="Message Tomás Ruiz"
          className="text-muted-foreground hover:text-foreground ml-auto grid size-8 place-items-center rounded-md border"
        >
          <MessageSquare className="size-4" aria-hidden="true" />
        </button>
      </div>
    </Screen>
  );
}

function PrOrgChart() {
  return (
    <Screen className="flex flex-col items-center justify-center gap-1 p-4">
      <div className="bg-secondary text-caption rounded-md border px-3 py-1.5">
        Ada Poole · VP
      </div>
      <span className="bg-border h-3 w-px" aria-hidden="true" />
      <div className="flex items-start gap-2">
        {["Sam Ortiz", "Nadia Okonkwo"].map((n) => (
          <div key={n} className="flex flex-col items-center gap-1">
            <span className="bg-border h-3 w-px" aria-hidden="true" />
            <div className="bg-card text-caption rounded-md border px-2.5 py-1.5">
              {n.split(" ")[0]}
            </div>
            <span className="bg-border h-3 w-px" aria-hidden="true" />
            <div className="bg-card text-micro text-muted-foreground rounded-md border px-2 py-1 normal-case">
              2 reports
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function PrSkills() {
  const skills = [
    { n: "TypeScript", v: 5 },
    { n: "CSS", v: 4 },
    { n: "Motion", v: 3 },
    { n: "Rust", v: 2 },
  ];
  return (
    <Screen className="flex flex-col justify-center gap-2 p-4">
      {skills.map((s) => (
        <div key={s.n} className="flex items-center gap-2">
          <span className="text-caption w-20 shrink-0 truncate">{s.n}</span>
          <span className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={cn(
                  "size-2.5 rounded-full",
                  n <= s.v ? "bg-accent-solid" : "bg-secondary",
                )}
                aria-hidden="true"
              />
            ))}
          </span>
          <span className="text-micro text-muted-foreground ml-auto tabular-nums">
            {s.v}/5
          </span>
        </div>
      ))}
    </Screen>
  );
}

function PrPresenceRail() {
  const [me, setMe] = useState<"Active" | "Away" | "DND">("Active");
  const tone = { Active: "bg-positive", Away: "bg-accent-solid", DND: "bg-destructive" };
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Who is around</p>
      <div className="mt-2 flex-1 space-y-1.5">
        {TEAM.slice(0, 4).map((m, i) => (
          <div key={m.n} className="flex items-center gap-2">
            <span className="relative">
              <Ini n={m.i} size="size-6" />
              <span
                className={cn(
                  "border-card absolute right-0 bottom-0 size-2 rounded-full border",
                  i === 0 ? tone[me] : i % 2 ? "bg-positive" : "bg-border-strong",
                )}
                aria-hidden="true"
              />
            </span>
            <span className="text-caption truncate">{m.n}</span>
          </div>
        ))}
      </div>
      <Seg
        items={["Active", "Away", "DND"] as const}
        value={me}
        onChange={setMe}
        label="My presence"
      />
    </Screen>
  );
}

function PrIntroductions() {
  const [seen, setSeen] = useState(0);
  const people = [
    { n: "Lin Wei", why: "Also works on the data platform" },
    { n: "Ada Poole", why: "Runs the roadmap you contribute to" },
    { n: "Jon Vidal", why: "Handles tickets from your feature" },
  ];
  const p = people[seen % people.length];
  return (
    <Screen className="grid place-items-center p-4 text-center">
      <div>
        <Ini n={p.n.slice(0, 2).toUpperCase()} size="size-10" />
        <p className="text-ui mt-2">{p.n}</p>
        <p className="text-caption text-muted-foreground mx-auto mt-1 max-w-48">
          {p.why}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setSeen((s) => s + 1)}
            className={GHOST}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => {
              setSeen((s) => s + 1);
              toast.success(`Intro requested with ${p.n}`);
            }}
            className={SOLID}
          >
            Say hello
          </button>
        </div>
      </div>
    </Screen>
  );
}

function PrCredentials() {
  const [revoked, setRevoked] = useState<string[]>([]);
  const creds = [
    { n: "MacBook Pro", d: "San Francisco · now" },
    { n: "iPhone 15", d: "San Francisco · 2h" },
    { n: "Chrome, Windows", d: "Frankfurt · 3d" },
  ];
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-ui-sm">Signed-in devices</p>
      <div className="mt-2 divide-y">
        {creds.map((c) => (
          <div key={c.n} className="flex h-11 items-center gap-2">
            <div className="min-w-0">
              <p className={cn("text-caption truncate", revoked.includes(c.n) && "line-through opacity-50")}>
                {c.n}
              </p>
              <p className="text-micro text-muted-foreground normal-case">{c.d}</p>
            </div>
            <button
              type="button"
              disabled={revoked.includes(c.n)}
              onClick={() => setRevoked((v) => [...v, c.n])}
              className={cn(GHOST, "ml-auto")}
            >
              {revoked.includes(c.n) ? "Revoked" : "Revoke"}
            </button>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ══ Toasts & banners ═════════════════════════════════════════════ */

function ToastStage({
  label,
  fire,
  body,
}: {
  label: string;
  fire: () => void;
  body: string;
}) {
  return (
    <Screen className="grid place-items-center p-4 text-center">
      <div>
        <button type="button" onClick={fire} className={SOLID}>
          {label}
        </button>
        <p className="text-caption text-muted-foreground mx-auto mt-2 max-w-56">
          {body}
        </p>
      </div>
    </Screen>
  );
}

function ToSuccess() {
  return (
    <ToastStage
      label="Save changes"
      fire={() => toast.success("Changes saved")}
      body="Confirmation is ephemeral: it says what happened and leaves."
    />
  );
}

function ToErrorRetry() {
  return (
    <ToastStage
      label="Publish"
      fire={() =>
        toast.error("Publish failed — upstream timeout", {
          action: { label: "Retry", onClick: () => toast.success("Published") },
        })
      }
      body="An error keeps the recovery next to the message, not in a log."
    />
  );
}

function ToInfoBanner() {
  const [show, setShow] = useState(true);
  return (
    <Screen className="flex flex-col p-3">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            role="status"
            className="bg-feature text-feature-foreground flex items-center gap-2 rounded-md p-2.5"
          >
            <Zap className="size-4 shrink-0" aria-hidden="true" />
            <p className="text-caption">
              Maintenance at 03:00 UTC. Writes pause for 20 minutes.
            </p>
            <button
              type="button"
              aria-label="Dismiss banner"
              onClick={() => setShow(false)}
              className="ml-auto grid size-8 shrink-0 place-items-center rounded"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {!show && (
        <button
          type="button"
          onClick={() => setShow(true)}
          className={cn(GHOST, "self-start")}
        >
          Bring it back
        </button>
      )}
      <div className="mt-3 space-y-2">
        <Bar w="w-2/3" />
        <Bar w="w-full" />
      </div>
    </Screen>
  );
}

function ToProgress() {
  return (
    <ToastStage
      label="Start export"
      fire={() => {
        const id = toast.loading("Exporting 4,182 rows…");
        setTimeout(() => toast.success("Export ready", { id }), 1800);
      }}
      body="One toast, two states — it resolves in place instead of stacking."
    />
  );
}

function ToUndo() {
  return (
    <ToastStage
      label="Archive thread"
      fire={() =>
        toast("Thread archived", {
          icon: <Undo2 className="size-4" aria-hidden="true" />,
          action: { label: "Undo", onClick: () => toast.success("Restored") },
          duration: 6000,
        })
      }
      body="Destructive-ish actions get a window to change your mind, not a dialog before."
    />
  );
}

function ToRich() {
  return (
    <ToastStage
      label="Mention someone"
      fire={() =>
        toast(
          <span className="flex items-center gap-2">
            <Ini n="NO" size="size-6" />
            <span>
              <span className="text-ui-sm block">Nadia Okonkwo</span>
              <span className="text-caption text-muted-foreground">
                mentioned you in #design
              </span>
            </span>
          </span>,
          { action: { label: "Open", onClick: () => toast.success("Opened") } },
        )
      }
      body="A toast can carry an avatar and two lines and still be dismissible."
    />
  );
}

/* ══ Pricing ══════════════════════════════════════════════════════ */

function PgThreeTier() {
  const [pick, setPick] = useState("Pro");
  return (
    <Screen className="bg-secondary grid grid-cols-3 gap-2 p-3">
      {TIERS.map((t) => (
        <button
          key={t.n}
          type="button"
          aria-pressed={pick === t.n}
          onClick={() => setPick(t.n)}
          className={cn(
            "relative flex flex-col rounded-lg border p-2.5 text-left transition-colors",
            pick === t.n ? "bg-feature text-feature-foreground border-transparent" : "bg-card",
          )}
        >
          {t.n === "Pro" && (
            <span
              className={cn(
                "text-micro absolute top-1.5 right-1.5 rounded-full px-1.5 uppercase",
                pick === t.n ? "bg-feature-foreground text-feature" : "bg-accent text-accent-foreground",
              )}
            >
              Popular
            </span>
          )}
          <span className="text-micro uppercase opacity-70">{t.n}</span>
          <span className="text-ui mt-1 tabular-nums">${t.p}</span>
          <span className="text-micro mt-auto normal-case opacity-70">{t.f}</span>
        </button>
      ))}
    </Screen>
  );
}

function PgComparison() {
  const feats = [
    { n: "Projects", v: ["1", "∞", "∞"] },
    { n: "Seats", v: ["1", "25", "∞"] },
    { n: "SSO", v: ["—", "—", "✓"] },
    { n: "Audit log", v: ["—", "✓", "✓"] },
  ];
  return (
    <Screen className="overflow-auto p-3">
      <table className="w-full">
        <thead>
          <tr>
            <TH>Feature</TH>
            {TIERS.map((t) => (
              <TH key={t.n} className="text-center">
                {t.n}
              </TH>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {feats.map((f) => (
            <tr key={f.n}>
              <td className="text-caption py-1.5">{f.n}</td>
              {f.v.map((v, i) => (
                <td key={i} className="text-caption py-1.5 text-center tabular-nums">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Screen>
  );
}

function PgSliderSeats() {
  const [seats, setSeats] = useState(12);
  const unit = seats > 50 ? 19 : seats > 20 ? 24 : 29;
  return (
    <Screen className="flex flex-col justify-center p-4">
      <p className="text-title tabular-nums">
        ${(seats * unit).toLocaleString()}
        <span className="text-caption text-muted-foreground">/mo</span>
      </p>
      <p className="text-caption text-muted-foreground tabular-nums">
        {seats} seats × ${unit} — volume pricing kicks in at 21 and 51
      </p>
      <label htmlFor="seats" className="sr-only">
        Seats
      </label>
      <input
        id="seats"
        type="range"
        min={1}
        max={100}
        value={seats}
        onChange={(e) => setSeats(Number(e.target.value))}
        className="accent-accent-solid mt-4 w-full"
      />
    </Screen>
  );
}

function PgSimpleCard() {
  return (
    <Screen className="bg-secondary grid place-items-center p-4">
      <div className="bg-card w-full max-w-56 rounded-lg border p-4 text-center">
        <p className="text-micro text-muted-foreground uppercase">One plan</p>
        <p className="text-title mt-1 tabular-nums">
          $29<span className="text-caption text-muted-foreground">/mo</span>
        </p>
        <div className="text-caption text-muted-foreground mt-3 space-y-1">
          {["Unlimited projects", "25 seats", "Audit log"].map((f) => (
            <p key={f} className="flex items-center gap-1.5">
              <Check className="text-positive size-3.5 shrink-0" aria-hidden="true" />
              {f}
            </p>
          ))}
        </div>
        <button type="button" className={cn(SOLID, "mt-3 w-full")}>
          Start free trial
        </button>
      </div>
    </Screen>
  );
}

function PgContactSales() {
  const [sent, setSent] = useState(false);
  return (
    <Screen className="grid place-items-center p-4">
      {sent ? (
        <div className="text-center">
          <Check className="text-positive mx-auto size-6" aria-hidden="true" />
          <p className="text-ui mt-2">We will be in touch</p>
          <p className="text-caption text-muted-foreground mt-1">
            Usually within one business day.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="w-full max-w-64"
        >
          <p className="text-ui">Talk to sales</p>
          <input aria-label="Work email" required placeholder="Work email" className={cn(FIELD, "mt-3")} />
          <label htmlFor="cs-size" className="sr-only">
            Company size
          </label>
          <select id="cs-size" className={cn(FIELD, "mt-2")}>
            <option>1–50 people</option>
            <option>51–500</option>
            <option>500+</option>
          </select>
          <button type="submit" className={cn(SOLID, "mt-2 w-full")}>
            Request a call
          </button>
        </form>
      )}
    </Screen>
  );
}

function PgMonthlyYearly() {
  const [yearly, setYearly] = useState(false);
  return (
    <Screen className="flex flex-col items-center justify-center gap-3 p-4">
      <div className="flex items-center gap-2">
        <span className={cn("text-caption", !yearly && "text-foreground")}>
          Monthly
        </span>
        <Sw on={yearly} onToggle={() => setYearly((v) => !v)} label="Annual billing" />
        <span className={cn("text-caption", yearly && "text-foreground")}>
          Yearly
        </span>
        <span className="bg-accent text-accent-foreground text-micro rounded-full px-1.5 py-0.5 uppercase">
          −17%
        </span>
      </div>
      <div className="grid w-full grid-cols-3 gap-2">
        {TIERS.map((t) => (
          <div key={t.n} className="bg-secondary rounded-md border p-2.5 text-center">
            <p className="text-micro text-muted-foreground uppercase">{t.n}</p>
            <p className="text-ui tabular-nums">
              ${yearly ? Math.round(t.p * 10) : t.p}
            </p>
            <p className="text-micro text-muted-foreground normal-case">
              /{yearly ? "yr" : "mo"}
            </p>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ══ Tours & coachmarks ═══════════════════════════════════════════ */

const CAROUSEL = [
  { t: "Welcome to Acme", d: "Three things worth knowing before you start." },
  { t: "Everything is a project", d: "Keys, deploys and members hang off one." },
  { t: "Press ⌘K anywhere", d: "The palette reaches every screen." },
];

function TrWelcomeCarousel() {
  const [i, setI] = useState(0);
  return (
    <Screen className="flex flex-col p-4 text-center">
      <div className="grid flex-1 place-items-center">
        <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: duration.fast, ease: ease.outQuart }}>
          <Sparkles className="text-accent-foreground mx-auto size-6" aria-hidden="true" />
          <p className="text-ui mt-2">{CAROUSEL[i].t}</p>
          <p className="text-caption text-muted-foreground mx-auto mt-1 max-w-56">
            {CAROUSEL[i].d}
          </p>
        </motion.div>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        {CAROUSEL.map((_, n) => (
          <button
            key={n}
            type="button"
            aria-label={`Slide ${n + 1}`}
            aria-current={i === n ? "true" : undefined}
            onClick={() => setI(n)}
            className="flex h-8 items-center"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform]",
                i === n ? "bg-accent-solid w-4" : "bg-secondary w-1.5",
              )}
            />
          </button>
        ))}
      </div>
    </Screen>
  );
}

const SPOTS = [
  { t: "Your projects live here", pos: "top-2 left-2", w: "w-24 h-16" },
  { t: "Metrics update live", pos: "top-2 right-2", w: "w-28 h-16" },
  { t: "Publish from here", pos: "bottom-2 left-2", w: "w-20 h-10" },
];

function TrSpotlight() {
  const [step, setStep] = useState(0);
  const s = SPOTS[step];
  return (
    <Screen className="relative">
      <div className="grid size-full grid-cols-2 gap-2 p-2">
        <div className="bg-secondary rounded-md" />
        <div className="bg-secondary rounded-md" />
        <div className="bg-secondary col-span-2 rounded-md" />
      </div>
      <div className="bg-feature/60 absolute inset-0" aria-hidden="true" />
      <motion.div
        layout
        transition={{ duration: duration.base, ease: ease.outQuart }}
        className={cn(
          "border-accent-solid bg-card/10 absolute rounded-md border",
          s.pos,
          s.w,
        )}
        aria-hidden="true"
      />
      <div className="text-feature-foreground absolute inset-x-3 bottom-3 flex items-center gap-2">
        <p className="text-caption">{s.t}</p>
        <button
          type="button"
          onClick={() => setStep((v) => (v + 1) % SPOTS.length)}
          className="text-ui-sm bg-card text-foreground ml-auto h-8 shrink-0 rounded-md px-3"
        >
          {step === SPOTS.length - 1 ? "Restart" : "Next"}
          <span className="text-micro ml-1 tabular-nums opacity-60">
            {step + 1}/{SPOTS.length}
          </span>
        </button>
      </div>
    </Screen>
  );
}

function TrArrowTooltip() {
  const [side, setSide] = useState<"top" | "bottom">("bottom");
  return (
    <Screen className="relative grid place-items-center p-4">
      <button
        type="button"
        onClick={() => setSide((v) => (v === "top" ? "bottom" : "top"))}
        className={SOLID}
      >
        Flip the tooltip
      </button>
      <motion.div
        layout
        transition={{ duration: duration.fast, ease: ease.outQuart }}
        className={cn(
          "bg-feature text-feature-foreground text-caption absolute left-1/2 w-44 -translate-x-1/2 rounded-md px-2.5 py-1.5 text-center",
          side === "top" ? "top-8" : "bottom-8",
        )}
      >
        The arrow tracks the side it opens on.
        <span
          className={cn(
            "bg-feature absolute left-1/2 size-2 -translate-x-1/2 rotate-45",
            side === "top" ? "-bottom-1" : "-top-1",
          )}
          aria-hidden="true"
        />
      </motion.div>
    </Screen>
  );
}

function TrBeacon() {
  const [found, setFound] = useState(false);
  return (
    <Screen className="relative grid place-items-center">
      <div className="grid size-full grid-cols-2 gap-2 p-3">
        <div className="bg-secondary rounded-md" />
        <div className="bg-secondary rounded-md" />
      </div>
      {!found ? (
        <button
          type="button"
          aria-label="Show the hint"
          onClick={() => setFound(true)}
          className="absolute top-1/3 right-1/3 grid size-8 place-items-center"
        >
          <span className="bg-accent-solid absolute size-3 rounded-full" />
          <motion.span
            className="bg-accent-solid absolute size-3 rounded-full"
            animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.fast, ease: ease.outQuart }}
          className="shadow-floating bg-card absolute top-1/3 right-6 w-40 rounded-lg border p-2.5"
        >
          <p className="text-caption">Filters moved here</p>
          <button
            type="button"
            onClick={() => setFound(false)}
            className="text-micro text-muted-foreground mt-1 underline"
          >
            got it
          </button>
        </motion.div>
      )}
    </Screen>
  );
}

function TrInlineHint() {
  const [show, setShow] = useState(true);
  return (
    <Screen className="flex flex-col gap-2 p-3">
      <input aria-label="Project name" placeholder="Project name" className={FIELD} />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="bg-accent text-accent-foreground overflow-hidden rounded-md"
          >
            <p className="text-caption flex items-start gap-2 p-2.5">
              <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Names are public in shared links — pick something you would say out loud.
              <button
                type="button"
                aria-label="Dismiss hint"
                onClick={() => setShow(false)}
                className="ml-auto"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <Bar w="w-2/3" />
      <Bar w="w-full" />
    </Screen>
  );
}

function TrChecklist() {
  const [done, setDone] = useState<number[]>([0, 1]);
  const steps = [
    "Create a workspace",
    "Invite a teammate",
    "Connect a repo",
    "Ship a deploy",
  ];
  const pct = Math.round((done.length / steps.length) * 100);
  return (
    <Screen className="flex flex-col p-3">
      <div className="flex items-center justify-between">
        <p className="text-ui-sm">Get set up</p>
        <span className="text-caption text-muted-foreground tabular-nums">
          {pct}%
        </span>
      </div>
      <div className="bg-secondary mt-1.5 h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-accent-solid h-full rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 space-y-0.5">
        {steps.map((s, i) => (
          <label key={s} className="text-caption flex h-8 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={done.includes(i)}
              onChange={() =>
                setDone((v) =>
                  v.includes(i) ? v.filter((x) => x !== i) : [...v, i],
                )
              }
              className="accent-accent-solid size-3.5"
            />
            <span className={cn(done.includes(i) && "text-muted-foreground line-through")}>
              {s}
            </span>
          </label>
        ))}
      </div>
    </Screen>
  );
}

/* ══ Threads & comments ═══════════════════════════════════════════ */

function ThInlineThread() {
  const [msgs, setMsgs] = useState([
    { w: "NO", t: "Should this be 12px or 14px?" },
    { w: "SO", t: "14 — it sits next to body text." },
  ]);
  const [draft, setDraft] = useState("");
  return (
    <Screen className="flex flex-col p-3">
      <p className="text-caption bg-accent text-accent-foreground rounded px-1.5 py-0.5">
        …the label under each field…
      </p>
      <div className="mt-2 flex-1 space-y-2 overflow-y-auto">
        {msgs.map((m, i) => (
          <div key={i} className="flex gap-2">
            <Ini n={m.w} size="size-6" />
            <p className="text-caption">{m.t}</p>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft) return;
          setMsgs((v) => [...v, { w: "YO", t: draft }]);
          setDraft("");
        }}
        className="flex gap-1.5"
      >
        <label htmlFor="th-r" className="sr-only">
          Reply
        </label>
        <input
          id="th-r"
          value={draft}
          placeholder="Reply…"
          onChange={(e) => setDraft(e.target.value)}
          className={FIELD}
        />
        <button type="submit" disabled={!draft} className={SOLID}>
          Send
        </button>
      </form>
    </Screen>
  );
}

function ThSidePanel() {
  const [open, setOpen] = useState(true);
  return (
    <Screen className="flex">
      <div className="min-w-0 flex-1 space-y-2 p-3">
        <p className="text-ui-sm">Spec draft</p>
        <Bar w="w-full" />
        <Bar w="w-5/6" />
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={GHOST}
        >
          {open ? "Hide comments" : "3 comments"}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 132 }}
            exit={{ width: 0 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="bg-secondary shrink-0 overflow-hidden border-l"
          >
            <div className="w-33 space-y-2 p-2.5">
              {["NO", "SO", "TR"].map((w) => (
                <div key={w} className="flex gap-1.5">
                  <Ini n={w} size="size-5" />
                  <Bar w="w-2/3" tone="bg-card" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
}

const REACTIONS = ["👍", "🎉", "👀"];

function ThCommentRow() {
  const [re, setRe] = useState<Record<string, number>>({ "👍": 2 });
  return (
    <Screen className="flex flex-col justify-center p-4">
      <div className="flex gap-2">
        <Ini n="NO" size="size-7" />
        <div className="min-w-0">
          <p className="text-caption">
            Nadia Okonkwo{" "}
            <span className="text-micro text-muted-foreground normal-case">
              · 14m ago
            </span>
          </p>
          <p className="text-caption text-muted-foreground mt-0.5">
            Shipping this behind a flag first.
          </p>
          <div className="mt-1.5 flex gap-1">
            {REACTIONS.map((r) => (
              <button
                key={r}
                type="button"
                aria-label={`React ${r}`}
                onClick={() =>
                  setRe((v) => ({ ...v, [r]: (v[r] ?? 0) + 1 }))
                }
                className={cn(
                  "text-caption inline-flex h-8 items-center gap-1 rounded-full border px-2 transition-colors",
                  re[r] ? "bg-accent text-accent-foreground border-transparent" : "text-muted-foreground",
                )}
              >
                {r}
                {re[r] ? <span className="tabular-nums">{re[r]}</span> : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

function ThMentionPopover() {
  const [text, setText] = useState("Thanks @");
  const q = text.split("@").pop() ?? "";
  const open = text.includes("@") && !text.endsWith(" ");
  const hits = TEAM.filter((m) => m.n.toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen className="relative flex flex-col p-3">
      <label htmlFor="mention" className="text-caption text-muted-foreground mb-1">
        Type @ to mention
      </label>
      <input
        id="mention"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={FIELD}
      />
      {open && hits.length > 0 && (
        <div className="shadow-floating bg-card absolute top-20 right-3 left-3 rounded-lg border p-1">
          {hits.slice(0, 3).map((m) => (
            <button
              key={m.n}
              type="button"
              onClick={() => setText(`${text.split("@")[0]}@${m.n.split(" ")[0]} `)}
              className="text-caption flex h-8 w-full items-center gap-2 rounded px-2 text-left"
            >
              <Ini n={m.i} size="size-5" />
              {m.n}
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}

function ThResolved() {
  const [resolved, setResolved] = useState(true);
  return (
    <Screen className="flex flex-col p-3">
      <div
        className={cn(
          "rounded-md border p-2.5 transition-opacity",
          resolved && "opacity-60",
        )}
      >
        <div className="flex items-center gap-2">
          {resolved && <Check className="text-positive size-3.5" aria-hidden="true" />}
          <span className="text-caption">Spacing between rows</span>
          <button
            type="button"
            onClick={() => setResolved((v) => !v)}
            className={cn(GHOST, "ml-auto")}
          >
            {resolved ? "Reopen" : "Resolve"}
          </button>
        </div>
        <p className="text-micro text-muted-foreground mt-1 normal-case">
          {resolved
            ? "Resolved by Sam — collapsed, not deleted."
            : "Open — 2 replies"}
        </p>
      </div>
      <p className="text-caption text-muted-foreground mt-auto">
        Resolving dims and collapses; the history stays reachable.
      </p>
    </Screen>
  );
}

function ThComposeRich() {
  const [marks, setMarks] = useState<string[]>([]);
  const [body, setBody] = useState("Looks good to me.");
  return (
    <Screen className="flex flex-col p-3">
      <div className="flex items-center gap-0.5 rounded-t-md border border-b-0 p-1">
        {[
          { id: "bold", label: "Bold", n: <span className="font-semibold">B</span> },
          { id: "italic", label: "Italic", n: <span className="italic">I</span> },
          { id: "code", label: "Code", n: <span className="font-mono text-xs">{"<>"}</span> },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            aria-label={t.label}
            aria-pressed={marks.includes(t.id)}
            onClick={() =>
              setMarks((v) =>
                v.includes(t.id) ? v.filter((x) => x !== t.id) : [...v, t.id],
              )
            }
            className={cn(
              "text-caption grid size-8 place-items-center rounded transition-colors",
              marks.includes(t.id)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.n}
          </button>
        ))}
      </div>
      <label htmlFor="rich" className="sr-only">
        Comment
      </label>
      <textarea
        id="rich"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className={cn(
          "text-ui-sm bg-card h-16 w-full resize-none rounded-b-md border p-2 outline-none focus-visible:border-ring",
          marks.includes("bold") && "font-semibold",
          marks.includes("italic") && "italic",
          marks.includes("code") && "font-mono",
        )}
      />
      <div className="mt-2 flex items-center gap-2">
        <span className="text-micro text-muted-foreground tabular-nums">
          {body.length}/500
        </span>
        <button
          type="button"
          disabled={!body}
          onClick={() => toast.success("Comment posted")}
          className={cn(SOLID, "ml-auto")}
        >
          Comment
        </button>
      </div>
    </Screen>
  );
}

/* ── the gallery, in the source's own 18 categories ───────────────── */

const CATS: {
  key: string;
  name: string;
  blurb: string;
  entries: Entry[];
}[] = [
  {
    key: "layouts",
    name: "Layouts",
    blurb: "App shells, sidebars, multi-pane splits, focus modes, canvases.",
    entries: [
      { slug: "workspace-rail", name: "Workspace rail", kind: "live", Demo: LWorkspaceRail },
      { slug: "mini-rail", name: "Mini icon rail", kind: "live", Demo: LMiniRail },
      { slug: "docs-tree", name: "Docs tree", kind: "live", Demo: LDocsTree },
      { slug: "inbox-rail", name: "Inbox rail", kind: "live", Demo: LInboxRail },
      { slug: "app-shell", name: "App shell", kind: "live", Demo: LAppShell },
      { slug: "two-pane", name: "Two-pane", kind: "live", Demo: LTwoPane },
      { slug: "three-pane", name: "Three-pane", kind: "live", Demo: LThreePane },
      { slug: "split-resizable", name: "Split resizable", kind: "live", Demo: LSplitResizable },
      { slug: "focus-mode", name: "Focus mode", kind: "live", Demo: LFocusMode },
      { slug: "floating-toolbar", name: "Floating toolbar", kind: "live", Demo: LFloatingToolbar },
      { slug: "canvas-tools", name: "Canvas tools", kind: "live", Demo: LCanvasTools },
      { slug: "bottom-nav", name: "Bottom nav", kind: "live", Demo: LBottomNav },
    ],
  },
  {
    key: "forms",
    name: "Forms",
    blurb: "Settings, invites, preferences, API keys.",
    entries: [
      { slug: "workspace-settings", name: "Workspace settings", kind: "live", Demo: FWorkspaceSettings },
      { slug: "invite-teammates", name: "Invite teammates", kind: "live", Demo: FInvite },
      { slug: "notifications", name: "Notification preferences", kind: "live", Demo: FNotifications },
      { slug: "api-key", name: "Create API key", kind: "live", Demo: FApiKey },
    ],
  },
  {
    key: "auth",
    name: "Auth & Onboarding",
    blurb: "Sign-in, magic-link, OAuth, waitlist.",
    entries: [
      { slug: "login", name: "Login", kind: "live", Demo: ALogin },
      { slug: "onboarding", name: "Onboarding", kind: "live", Demo: AOnboarding },
      { slug: "waitlist", name: "Waitlist landing", kind: "live", Demo: AWaitlist },
      { slug: "check-email", name: "Check your email", kind: "live", Demo: ACheckEmail },
      { slug: "inset-login", name: "Inset login", kind: "render", Demo: AInsetLogin },
      { slug: "centered-signin", name: "Centered signin", kind: "live", Demo: ACenteredSignin },
      { slug: "centered-signup", name: "Centered signup", kind: "live", Demo: ACenteredSignup },
      { slug: "left-signin", name: "Left signin", kind: "render", Demo: ALeftSignin },
      { slug: "right-signin", name: "Right signin", kind: "render", Demo: ARightSignin },
      { slug: "glass-signup", name: "Glass signup", kind: "render", Demo: AGlassSignup },
      { slug: "otp-verify", name: "OTP verify", kind: "live", Demo: AOtpVerify },
      { slug: "reset-password", name: "Reset password", kind: "live", Demo: AResetPassword },
      { slug: "two-factor", name: "Two-factor", kind: "live", Demo: ATwoFactor },
      { slug: "magic-link-sent", name: "Magic link sent", kind: "live", Demo: AMagicLinkSent },
    ],
  },
  {
    key: "dashboards",
    name: "Dashboards",
    blurb: "Metric grids, sparklines, activity feeds, plan usage.",
    entries: [
      { slug: "metrics-overview", name: "Metrics overview", kind: "live", Demo: DMetricsOverview },
      { slug: "usage", name: "Plan usage", kind: "live", Demo: DUsage },
      { slug: "analytics", name: "Analytics", kind: "live", Demo: DAnalytics },
      { slug: "home", name: "Personal home", kind: "live", Demo: DHome },
      { slug: "revenue", name: "Revenue", kind: "render", Demo: DRevenue },
      { slug: "services", name: "Service health", kind: "live", Demo: DServices },
      { slug: "engineering", name: "Engineering velocity", kind: "render", Demo: DEngineering },
      { slug: "support", name: "Support queue", kind: "live", Demo: DSupport },
      { slug: "market", name: "Markets", kind: "render", Demo: DMarket },
    ],
  },
  {
    key: "tables",
    name: "Tables",
    blurb: "Sortable rows, density, bulk actions.",
    entries: [
      { slug: "invoices", name: "Invoices", kind: "live", Demo: TInvoices },
      { slug: "members", name: "Team members", kind: "live", Demo: TMembers },
      { slug: "orders", name: "Orders", kind: "live", Demo: TOrders },
      { slug: "logs", name: "Server logs", kind: "live", Demo: TLogs },
      { slug: "api-keys", name: "API keys", kind: "live", Demo: TApiKeys },
      { slug: "inventory", name: "Inventory", kind: "live", Demo: TInventory },
      { slug: "issues", name: "Issue tracker", kind: "live", Demo: TIssues },
      { slug: "transactions", name: "Transactions", kind: "render", Demo: TTransactions },
      { slug: "audit-log", name: "Audit log", kind: "live", Demo: TAuditLog },
    ],
  },
  {
    key: "filters",
    name: "Filters",
    blurb: "Toolbars, faceted popovers, chips, and sidebar filter rails.",
    entries: [
      { slug: "toolbar", name: "Filter toolbar", kind: "live", Demo: FiToolbar },
      { slug: "faceted", name: "Faceted popover", kind: "live", Demo: FiFaceted },
      { slug: "chips", name: "Active filter chips", kind: "live", Demo: FiChips },
      { slug: "sidebar", name: "Filter sidebar", kind: "live", Demo: FiSidebar },
    ],
  },
  {
    key: "empty-states",
    name: "Empty states",
    blurb: "First-run, zero-data, end-of-list.",
    entries: [
      { slug: "inbox-zero", name: "Inbox zero", kind: "live", Demo: EInboxZero },
      { slug: "no-results", name: "No results", kind: "live", Demo: ENoResults },
      { slug: "first-project", name: "First project", kind: "live", Demo: EFirstProject },
      { slug: "end-of-feed", name: "End of feed", kind: "render", Demo: EEndOfFeed },
      { slug: "no-team", name: "No teammates", kind: "live", Demo: ENoTeam },
      { slug: "trash", name: "Empty trash", kind: "live", Demo: ETrash },
      { slug: "404", name: "404", kind: "render", Demo: E404 },
      { slug: "maintenance", name: "Maintenance", kind: "render", Demo: EMaintenance },
      { slug: "no-files", name: "No files", kind: "live", Demo: ENoFiles },
      { slug: "offline", name: "Offline", kind: "live", Demo: EOffline },
    ],
  },
  {
    key: "settings",
    name: "Settings",
    blurb: "Profile, appearance, billing, integrations.",
    entries: [
      { slug: "profile", name: "Profile", kind: "live", Demo: SProfile },
      { slug: "appearance", name: "Appearance", kind: "live", Demo: SAppearance },
      { slug: "billing", name: "Billing", kind: "live", Demo: SBilling },
      { slug: "integrations", name: "Integrations", kind: "live", Demo: SIntegrations },
      { slug: "security", name: "Security", kind: "live", Demo: SSecurity },
      { slug: "permissions", name: "Roles & permissions", kind: "live", Demo: SPermissions },
      { slug: "branding", name: "Workspace branding", kind: "live", Demo: SBranding },
      { slug: "localization", name: "Localization", kind: "live", Demo: SLocalization },
      { slug: "webhooks", name: "Webhooks", kind: "live", Demo: SWebhooks },
      { slug: "privacy", name: "Privacy & data", kind: "live", Demo: SPrivacy },
      { slug: "developer", name: "Developer", kind: "live", Demo: SDeveloper },
      { slug: "sso", name: "Single sign-on", kind: "live", Demo: SSso },
    ],
  },
  {
    key: "cards",
    name: "Cards",
    blurb: "Stat tiles, list items, surface containers.",
    entries: [
      { slug: "stat-tile", name: "Stat tile", kind: "live", Demo: CStatTile },
      { slug: "profile", name: "Profile card", kind: "live", Demo: CProfileCard },
      { slug: "pricing", name: "Pricing tiers", kind: "live", Demo: CPricing },
      { slug: "product", name: "Product card", kind: "live", Demo: CProduct },
      { slug: "invoice", name: "Invoice line", kind: "render", Demo: CInvoice },
      { slug: "task", name: "Kanban task", kind: "live", Demo: CTask },
      { slug: "event", name: "Calendar event", kind: "live", Demo: CEvent },
      { slug: "integration", name: "Integration", kind: "live", Demo: CIntegration },
      { slug: "media", name: "Article preview", kind: "render", Demo: CMedia },
      { slug: "payment-method", name: "Payment method", kind: "live", Demo: CPaymentMethod },
    ],
  },
  {
    key: "modals",
    name: "Modals",
    blurb: "Dialogs, drawers, command palettes, confirmations.",
    entries: [
      { slug: "confirm-delete", name: "Confirm delete", kind: "live", Demo: MConfirmDelete },
      { slug: "share-link", name: "Share link", kind: "live", Demo: MShareLink },
      { slug: "upload-files", name: "Upload files", kind: "live", Demo: MUploadFiles },
      { slug: "command-palette", name: "Command palette", kind: "live", Demo: MCommandPalette },
      { slug: "feedback", name: "Feedback", kind: "live", Demo: MFeedback },
      { slug: "shortcuts", name: "Keyboard shortcuts", kind: "live", Demo: MShortcuts },
      { slug: "upgrade", name: "Upgrade plan", kind: "live", Demo: MUpgrade },
      { slug: "export", name: "Export data", kind: "live", Demo: MExport },
      { slug: "create-workspace", name: "Create workspace", kind: "live", Demo: MCreateWorkspace },
      { slug: "two-factor", name: "Two-factor setup", kind: "live", Demo: MTwoFactorSetup },
    ],
  },
  {
    key: "charts",
    name: "Charts",
    blurb: "Area, bar, donut, funnel, heatmap, gauge — pure SVG.",
    entries: [
      { slug: "revenue-area", name: "Revenue area", kind: "live", Demo: ChRevenueArea },
      { slug: "cohort-heatmap", name: "Cohort heatmap", kind: "live", Demo: ChCohortHeatmap },
      { slug: "funnel", name: "Funnel", kind: "render", Demo: ChFunnel },
      { slug: "gauges", name: "Radial gauges", kind: "live", Demo: ChGauges },
      { slug: "bar-grouped", name: "Grouped bars", kind: "live", Demo: ChBarGrouped },
      { slug: "line-multi", name: "Multi-series line", kind: "render", Demo: ChLineMulti },
      { slug: "donut", name: "Donut breakdown", kind: "live", Demo: ChDonut },
      { slug: "scatter", name: "Scatter plot", kind: "render", Demo: ChScatter },
      { slug: "waterfall", name: "Waterfall", kind: "render", Demo: ChWaterfall },
    ],
  },
  {
    key: "timelines",
    name: "Timelines",
    blurb: "Audit trails, changelogs, deploys, status, mentions.",
    entries: [
      { slug: "audit", name: "Audit trail", kind: "live", Demo: TlAudit },
      { slug: "notifications", name: "Notifications panel", kind: "live", Demo: TlNotifications },
      { slug: "changelog", name: "Changelog", kind: "live", Demo: TlChangelog },
      { slug: "commits", name: "Commit history", kind: "render", Demo: TlCommits },
      { slug: "approvals", name: "Approvals", kind: "live", Demo: TlApprovals },
      { slug: "pull-request", name: "Pull request", kind: "live", Demo: TlPullRequest },
      { slug: "pr-ops-console", name: "PR ops console", kind: "live", Demo: TlPrOpsConsole },
      { slug: "releases", name: "Release timeline", kind: "render", Demo: TlReleases },
      { slug: "status-page", name: "Status page", kind: "render", Demo: TlStatusPage },
      { slug: "deploys", name: "Deploy history", kind: "live", Demo: TlDeploys },
      { slug: "inbox-thread", name: "Inbox thread", kind: "live", Demo: TlInboxThread },
      { slug: "activity-feed", name: "Activity feed", kind: "live", Demo: TlActivityFeed },
    ],
  },
  {
    key: "calendars",
    name: "Calendars",
    blurb: "Month grids, week schedules, agenda lists, heatmaps.",
    entries: [
      { slug: "month", name: "Month view", kind: "live", Demo: CalMonth },
      { slug: "week", name: "Week schedule", kind: "render", Demo: CalWeek },
      { slug: "agenda", name: "Agenda list", kind: "live", Demo: CalAgenda },
      { slug: "date-range", name: "Date range picker", kind: "live", Demo: CalDateRange },
      { slug: "timezone", name: "Timezone planner", kind: "live", Demo: CalTimezone },
      { slug: "mini", name: "Mini calendar", kind: "live", Demo: CalMini },
      { slug: "year-heatmap", name: "Contribution heatmap", kind: "live", Demo: CalYearHeatmap },
      { slug: "recurring", name: "Recurring event", kind: "live", Demo: CalRecurring },
      { slug: "holidays", name: "Holidays & PTO", kind: "render", Demo: CalHolidays },
    ],
  },
  {
    key: "profile",
    name: "Profile",
    blurb: "User pages, hover cards, team grids, presence rails.",
    entries: [
      { slug: "hero", name: "Profile hero", kind: "live", Demo: PrHero },
      { slug: "hover-card", name: "Hover card", kind: "live", Demo: PrHoverCard },
      { slug: "team-grid", name: "Team grid", kind: "render", Demo: PrTeamGrid },
      { slug: "directory", name: "Contact directory", kind: "live", Demo: PrDirectory },
      { slug: "compact-card", name: "Compact user card", kind: "render", Demo: PrCompactCard },
      { slug: "org-chart", name: "Org chart", kind: "render", Demo: PrOrgChart },
      { slug: "skills", name: "Skills matrix", kind: "render", Demo: PrSkills },
      { slug: "presence-rail", name: "Presence rail", kind: "live", Demo: PrPresenceRail },
      { slug: "introductions", name: "Suggested intros", kind: "live", Demo: PrIntroductions },
      { slug: "credentials", name: "Security credentials", kind: "live", Demo: PrCredentials },
    ],
  },
  {
    key: "toasts",
    name: "Toasts & banners",
    blurb: "Ephemeral feedback — confirmation, errors, undos, progress.",
    entries: [
      { slug: "success", name: "Success toast", kind: "live", Demo: ToSuccess },
      { slug: "error-retry", name: "Error with retry", kind: "live", Demo: ToErrorRetry },
      { slug: "info-banner", name: "System banner", kind: "live", Demo: ToInfoBanner },
      { slug: "progress", name: "Progress toast", kind: "live", Demo: ToProgress },
      { slug: "undo", name: "Undo toast", kind: "live", Demo: ToUndo },
      { slug: "rich", name: "Rich toast", kind: "live", Demo: ToRich },
    ],
  },
  {
    key: "pricing",
    name: "Pricing",
    blurb: "Tier comparisons, sliders, contact-sales, billing toggles.",
    entries: [
      { slug: "three-tier", name: "Three-tier", kind: "live", Demo: PgThreeTier },
      { slug: "comparison-table", name: "Feature matrix", kind: "render", Demo: PgComparison },
      { slug: "slider-seats", name: "Seat slider", kind: "live", Demo: PgSliderSeats },
      { slug: "simple-card", name: "Single plan", kind: "render", Demo: PgSimpleCard },
      { slug: "contact-sales", name: "Contact sales", kind: "live", Demo: PgContactSales },
      { slug: "monthly-yearly", name: "Billing toggle", kind: "live", Demo: PgMonthlyYearly },
    ],
  },
  {
    key: "tours",
    name: "Tours & coachmarks",
    blurb: "Welcome modals, spotlights, beacons, onboarding checklists.",
    entries: [
      { slug: "welcome-carousel", name: "Welcome carousel", kind: "live", Demo: TrWelcomeCarousel },
      { slug: "spotlight", name: "Spotlight tour", kind: "live", Demo: TrSpotlight },
      { slug: "arrow-tooltip", name: "Arrow tooltip", kind: "live", Demo: TrArrowTooltip },
      { slug: "beacon", name: "Beacon hint", kind: "live", Demo: TrBeacon },
      { slug: "inline-hint", name: "Inline hint", kind: "live", Demo: TrInlineHint },
      { slug: "checklist", name: "Onboarding checklist", kind: "live", Demo: TrChecklist },
    ],
  },
  {
    key: "threads",
    name: "Threads & comments",
    blurb: "Inline threads, side panels, reactions, mention popovers.",
    entries: [
      { slug: "inline-thread", name: "Inline thread", kind: "live", Demo: ThInlineThread },
      { slug: "side-panel", name: "Side panel", kind: "live", Demo: ThSidePanel },
      { slug: "comment-row", name: "Comment row", kind: "live", Demo: ThCommentRow },
      { slug: "mention-popover", name: "@mention popover", kind: "live", Demo: ThMentionPopover },
      { slug: "resolved", name: "Resolved thread", kind: "live", Demo: ThResolved },
      { slug: "compose-rich", name: "Rich composer", kind: "live", Demo: ThComposeRich },
    ],
  },
];

const TOTAL = CATS.reduce((n, c) => n + c.entries.length, 0);
const LIVE = CATS.reduce(
  (n, c) => n + c.entries.filter((e) => e.kind === "live").length,
  0,
);

export function DevlDevUiExperimentsBuiltOnCossUiDemo() {
  const [open, setOpen] = useState(CATS[0].key);
  const cat = CATS.find((c) => c.key === open)!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setOpen(c.key)}
            aria-pressed={open === c.key}
            className={cn(
              "text-ui-sm h-9 rounded-lg border px-3 transition-colors",
              open === c.key
                ? "bg-feature text-feature-foreground border-transparent"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {c.name}{" "}
            <span className="tabular-nums opacity-60">{c.entries.length}</span>
          </button>
        ))}
      </div>

      <p className="text-caption text-muted-foreground">
        All <span className="text-foreground tabular-nums">{TOTAL}</span>{" "}
        experiments devl.dev publishes, in its own{" "}
        <span className="text-foreground tabular-nums">{CATS.length}</span>{" "}
        categories, rebuilt in real DOM on this project&rsquo;s tokens.{" "}
        <span className="text-foreground tabular-nums">{LIVE}</span> of them you
        can operate; the other{" "}
        <span className="text-foreground tabular-nums">{TOTAL - LIVE}</span> are
        compositions to read. The gallery itself ships only light/dark PNGs, and
        the components under them are coss-ui — Base UI, not Radix — so nothing
        copies across. What transfers is the unit: a whole screen.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {cat.entries.map((e) => (
          <div key={e.slug}>
            <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-ui">{e.name}</span>
              <span className="text-caption text-muted-foreground font-mono">
                {cat.key}/{e.slug}.tsx
              </span>
              <span
                className={cn(
                  "text-micro ml-auto uppercase",
                  e.kind === "live" ? "text-positive" : "text-muted-foreground",
                )}
              >
                {e.kind}
              </span>
            </div>
            <e.Demo />
          </div>
        ))}
      </div>

      <p className="text-caption text-muted-foreground">
        <span className="text-foreground">{cat.name}</span> — {cat.blurb}
      </p>
    </div>
  );
}

