"use client";

import {
  BarChart3,
  Bell,
  Home,
  Inbox,
  MoreHorizontal,
  Pencil,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * google-labs-code/design.md — the format that hands an agent a design
 * system: YAML front matter for the exact values (`colors`,
 * `typography`, `rounded`, `spacing`, `components`, `{token.refs}`) and
 * prose for why they exist. This project's own DESIGN.md is written in
 * that format, so every `after` below is what its front matter says,
 * and every `before` is the same screen built without it — which is
 * also what the linter's rules (`contrast-ratio`, `missing-primary`,
 * `missing-typography`) each catch.
 * ------------------------------------------------------------------ */

/* ── which one am I on ──────────────────────────────────────────────
 * `missing-primary` + the Colors prose: one accent, and it only ever
 * means "current". */

const NAV = [
  { id: "home", label: "Home", icon: Home, badge: 0 },
  { id: "inbox", label: "Inbox", icon: Inbox, badge: 12 },
  { id: "reports", label: "Reports", icon: BarChart3, badge: 0 },
  { id: "alerts", label: "Alerts", icon: Bell, badge: 3 },
  { id: "settings", label: "Settings", icon: Settings, badge: 0 },
] as const;

function RailPair({ after }: { after: boolean }) {
  const [current, setCurrent] = useState("inbox");
  return (
    <div className="bg-secondary max-w-64 space-y-0.5 rounded-2xl p-2">
      {NAV.map((item) => {
        const active = current === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrent(item.id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 transition-colors",
              after
                ? active
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-card"
                : active
                  ? "bg-card text-foreground"
                  : "text-foreground hover:bg-card",
            )}
          >
            <Icon
              aria-hidden
              className={cn(
                "size-4",
                after
                  ? active
                    ? "text-accent-foreground"
                    : "text-muted-foreground"
                  : "text-accent-solid",
              )}
            />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge > 0 && (
              <span
                className={cn(
                  "text-micro rounded-full px-1.5 py-0.5 tabular-nums",
                  after
                    ? "bg-card text-muted-foreground"
                    : "bg-accent text-accent-foreground",
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── typography is a bundle, not a size ─────────────────────────────
 * A `typography` token carries fontSize *and* weight, leading and
 * tracking together; `missing-typography` fires when there is none. */

const ENTRIES = [
  {
    tag: "Changelog",
    title: "Realtime sync is out of beta",
    body: "Documents merge in under 200ms, and anything you wrote offline reconciles the moment you are back.",
    meta: "3 min read · Feb 4",
  },
  {
    tag: "Security",
    title: "Sign-in keys replace passwords",
    body: "Any workspace can now require a passkey. Existing passwords keep working until the end of March.",
    meta: "2 min read · Jan 28",
  },
];

function ChangelogPair({ after }: { after: boolean }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-2">
      {ENTRIES.map((entry, i) => (
        <button
          key={entry.title}
          type="button"
          onClick={() => setOpen(i)}
          aria-expanded={open === i}
          className={cn(
            "duration-fast ease-out-quart block w-full rounded-lg border p-4 text-left transition-colors",
            open === i ? "bg-secondary" : "bg-card hover:bg-secondary",
          )}
        >
          <span
            className={cn(
              "block",
              after ? "text-micro text-muted-foreground uppercase" : "text-ui",
            )}
          >
            {entry.tag}
          </span>
          <span
            className={cn("mt-1 block", after ? "text-ui font-medium" : "text-ui")}
          >
            {entry.title}
          </span>
          {open === i && (
            <span
              className={cn(
                "mt-1.5 block",
                after ? "text-caption text-muted-foreground" : "text-ui",
              )}
            >
              {entry.body}
            </span>
          )}
          <span
            className={cn(
              "mt-2 block",
              after ? "text-micro text-muted-foreground uppercase" : "text-ui",
            )}
          >
            {entry.meta}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── the spacing scale ──────────────────────────────────────────────
 * A `spacing` scale is what stops a label drifting closer to the wrong
 * field than to its own. */

function FormPair({ after }: { after: boolean }) {
  const [name, setName] = useState("Ada Lovelace");
  const [email, setEmail] = useState("ada@example.com");
  const [saved, setSaved] = useState(false);

  const field = cn("block", after ? "space-y-1.5" : "space-y-4");
  const input =
    "text-ui-sm bg-card focus-visible:border-ring focus-visible:ring-ring/20 h-9 w-full rounded-md border px-3 outline-none focus-visible:ring-3";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
      className={after ? "space-y-5" : "space-y-1"}
    >
      <div className={field}>
        <label htmlFor="dmd-name" className="text-ui-sm block">
          Full name
        </label>
        <input
          id="dmd-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          className={input}
        />
      </div>
      <div className={field}>
        <label htmlFor="dmd-email" className="text-ui-sm block">
          Email for receipts
        </label>
        <input
          id="dmd-email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSaved(false);
          }}
          className={input}
        />
      </div>
      <div className={cn("flex items-center gap-2", after ? "pt-1" : "pt-0")}>
        <button
          type="submit"
          className="bg-feature text-feature-foreground text-ui-sm duration-fast ease-out-quart h-9 rounded-md px-3 transition-transform active:scale-95"
        >
          Save details
        </button>
        {saved && (
          <span className="text-caption text-muted-foreground">Saved.</span>
        )}
      </div>
    </form>
  );
}

/* ── contrast-ratio ─────────────────────────────────────────────────
 * The linter's WCAG AA check on every component's textColor over its
 * backgroundColor. */

const PLANS = [
  { id: "solo", name: "Solo", note: "One editor, 5 projects", price: "$0" },
  { id: "team", name: "Team", note: "Up to 10 editors, SSO", price: "$24" },
  { id: "scale", name: "Scale", note: "Unlimited editors, audit log", price: "$80" },
];

function PlanPair({ after }: { after: boolean }) {
  const [plan, setPlan] = useState("team");
  return (
    <div className="space-y-2">
      {PLANS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setPlan(p.id)}
          aria-pressed={plan === p.id}
          className={cn(
            "duration-fast ease-out-quart flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
            plan === p.id ? "bg-secondary" : "bg-card hover:bg-secondary",
          )}
        >
          <span>
            <span className="text-ui-sm block">{p.name}</span>
            <span
              className={cn(
                "text-caption text-muted-foreground block",
                after ? "" : "opacity-35",
              )}
            >
              {p.note}
            </span>
          </span>
          <span
            className={cn(
              "text-ui-sm tabular-nums",
              after ? "" : "text-muted-foreground opacity-35",
            )}
          >
            {p.price}
            <span className="text-muted-foreground">/mo</span>
          </span>
        </button>
      ))}
      <button
        type="button"
        className={cn(
          "text-ui-sm h-9 w-full rounded-md px-3",
          after
            ? "bg-feature text-feature-foreground"
            : "bg-secondary text-muted-foreground opacity-35",
        )}
      >
        Continue with {PLANS.find((p) => p.id === plan)?.name}
      </button>
    </div>
  );
}

/* ── the rounded scale, and nesting down it ─────────────────────────
 * `rounded: sm 6 / md 8 / lg 10 / xl 14 / 2xl 20`, and a control
 * inside a card steps down rather than matching it. */

const TAGS = ["Design", "Engineering", "Research"];

function FilterPair({ after }: { after: boolean }) {
  const [query, setQuery] = useState("");
  const [on, setOn] = useState<string[]>(["Design"]);
  const toggle = (t: string) =>
    setOn((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div
      className={cn(
        "bg-secondary border p-4",
        after ? "rounded-2xl" : "rounded-md",
      )}
    >
      <label
        htmlFor="dmd-filter"
        className="text-micro text-muted-foreground uppercase"
      >
        Filter people
      </label>
      <div className="mt-1.5 flex gap-2">
        <div
          className={cn(
            "bg-card flex h-9 flex-1 items-center gap-2 border px-3",
            after ? "rounded-md" : "rounded-3xl",
          )}
        >
          <Search aria-hidden className="text-muted-foreground size-4 shrink-0" />
          <input
            id="dmd-filter"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or team"
            className="text-ui-sm w-full min-w-0 bg-transparent outline-none"
          />
        </div>
        <button
          type="button"
          className={cn(
            "bg-feature text-feature-foreground text-ui-sm h-9 px-3",
            after ? "rounded-md" : "rounded-3xl",
          )}
        >
          Apply
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            aria-pressed={on.includes(t)}
            className={cn(
              "text-micro duration-fast ease-out-quart h-9 uppercase transition-colors",
              after ? "rounded-full px-3" : "rounded-sm px-1.5",
              on.includes(t)
                ? "bg-accent text-accent-foreground"
                : "bg-card text-muted-foreground border",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── {token.references} ─────────────────────────────────────────────
 * `rounded: "{rounded.md}"` inside a component means one value, one
 * place. Copies drift; references do not. */

const CORNERS = [
  { id: "sharp", label: "Sharp", outer: "rounded-md", inner: "rounded-sm", pill: "rounded-sm" },
  { id: "soft", label: "Soft", outer: "rounded-2xl", inner: "rounded-md", pill: "rounded-full" },
  { id: "round", label: "Round", outer: "rounded-4xl", inner: "rounded-2xl", pill: "rounded-full" },
] as const;

function ReferencePair({ after }: { after: boolean }) {
  const [corner, setCorner] = useState("soft");
  const set = CORNERS.find((c) => c.id === corner) ?? CORNERS[1];
  const inner = after ? set.inner : "rounded-md";
  const pill = after ? set.pill : "rounded-full";

  return (
    <div className="space-y-3">
      <div className="bg-secondary inline-flex rounded-full p-0.5">
        {CORNERS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCorner(c.id)}
            aria-pressed={corner === c.id}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart h-9 rounded-full px-3.5 transition-colors",
              corner === c.id
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className={cn("bg-card border p-4", set.outer)}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "bg-feature text-feature-foreground text-ui-sm grid size-10 shrink-0 place-items-center",
              inner,
            )}
          >
            AL
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-ui-sm truncate">Ada Lovelace</p>
            <p className="text-caption text-muted-foreground truncate">
              Owner · Analytical Engine
            </p>
          </div>
          <span
            className={cn(
              "text-micro bg-secondary text-muted-foreground px-2.5 py-1 uppercase",
              pill,
            )}
          >
            Admin
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <div
            className={cn(
              "text-ui-sm bg-secondary flex h-9 flex-1 items-center px-3",
              inner,
            )}
          >
            ada@example.com
          </div>
          <button
            type="button"
            className={cn(
              "text-ui-sm bg-secondary hover:bg-border h-9 px-3 transition-colors",
              inner,
            )}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── component variants ─────────────────────────────────────────────
 * `button-primary-hover`, `-active`, `-pressed`: the states live in the
 * file, so they exist on screen. */

const FILES = [
  { name: "Q1 forecast.xlsx", size: "1.2 MB" },
  { name: "Brand audit.pdf", size: "4.8 MB" },
  { name: "Onboarding flow.fig", size: "820 KB" },
];

function StatesPair({ after }: { after: boolean }) {
  const [starred, setStarred] = useState<string[]>(["Brand audit.pdf"]);
  const toggle = (n: string) =>
    setStarred((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  return (
    <div className="divide-y">
      {FILES.map((f) => {
        const isStarred = starred.includes(f.name);
        return (
          <div
            key={f.name}
            className={cn(
              "flex items-center gap-3 px-2 py-2",
              after && "duration-fast ease-out-quart rounded-lg transition-colors hover:bg-secondary",
            )}
          >
            <span className="text-ui-sm flex-1 truncate">{f.name}</span>
            <span className="text-caption text-muted-foreground tabular-nums">
              {f.size}
            </span>
            <button
              type="button"
              onClick={() => toggle(f.name)}
              aria-label={isStarred ? `Unstar ${f.name}` : `Star ${f.name}`}
              aria-pressed={isStarred}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-md",
                after &&
                  "duration-fast ease-out-quart transition-[background-color,transform] hover:bg-border active:scale-90",
              )}
            >
              <Star
                aria-hidden
                className={cn(
                  "size-4",
                  after && "duration-base ease-out-quart transition-colors",
                  isStarred
                    ? "fill-foreground text-foreground"
                    : "text-muted-foreground",
                )}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── components: defined once ───────────────────────────────────────
 * The same `components.button-primary` entry, referenced by both
 * cards, instead of each screen inventing its own pair of buttons. */

function ConsistencyPair({ after }: { after: boolean }) {
  const [saved, setSaved] = useState<string[]>([]);
  const mark = (id: string) => setSaved((prev) => [...new Set([...prev, id])]);

  const cards = [
    { id: "profile", title: "Profile", line: "Ada Lovelace · Owner" },
    { id: "billing", title: "Billing", line: "Team plan · $24/mo" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card, i) => {
        const done = saved.includes(card.id);
        const primary = after
          ? "bg-feature text-feature-foreground text-ui-sm h-9 rounded-md px-3"
          : i === 0
            ? "bg-feature text-feature-foreground text-ui-sm h-9 rounded-3xl px-6"
            : "bg-secondary text-foreground text-ui-sm h-9 rounded-sm border px-2";
        const secondary = after
          ? "bg-secondary text-foreground text-ui-sm h-9 rounded-md border px-3"
          : i === 0
            ? "text-ui-sm text-muted-foreground h-9 px-2 underline"
            : "bg-secondary text-muted-foreground text-ui-sm h-9 rounded-3xl px-5";

        const save = (
          <button key="save" type="button" onClick={() => mark(card.id)} className={primary}>
            {done ? "Saved" : "Save"}
          </button>
        );
        const cancel = (
          <button key="cancel" type="button" className={secondary}>
            Cancel
          </button>
        );

        return (
          <div key={card.id} className="bg-card rounded-xl border p-4">
            <p className="text-micro text-muted-foreground uppercase">
              {card.title}
            </p>
            <p className="text-ui-sm mt-1.5">{card.line}</p>
            <div
              className={cn(
                "mt-4 flex items-center gap-2",
                after ? "justify-end" : i === 0 ? "justify-start" : "justify-end",
              )}
            >
              {after || i === 1 ? [cancel, save] : [save, cancel]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Elevation & Depth ──────────────────────────────────────────────
 * One of the eight canonical sections. Three levels: canvas, resting
 * surface with no shadow, and the floating layer. */

const MENU = [
  { label: "Rename", icon: Pencil },
  { label: "Share", icon: Share2 },
  { label: "Delete", icon: Trash2 },
];

function DepthPair({ after }: { after: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="pb-24">
      <div
        className={cn(
          "bg-card relative rounded-xl border p-4",
          after ? "" : "shadow-floating",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-ui-sm truncate">Q1 forecast.xlsx</p>
            <p className="text-caption text-muted-foreground">
              Edited 20 minutes ago
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="File actions"
            aria-expanded={open}
            className="text-muted-foreground hover:bg-secondary grid size-9 shrink-0 place-items-center rounded-md transition-colors"
          >
            <MoreHorizontal aria-hidden className="size-4" />
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className={cn(
                "bg-popover absolute top-14 right-4 w-40 origin-top-right rounded-lg p-1",
                after
                  ? "shadow-floating ring-foreground/10 ring-1"
                  : "border shadow-xs",
              )}
            >
              {MENU.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center gap-2 rounded-md px-2 text-left transition-colors"
                  >
                    <Icon aria-hidden className="text-muted-foreground size-4" />
                    {m.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function GoogleLabsCodeDesignMdDemo() {
  return (
    <div>
      <BeforeAfter
        principle="You can tell which page you are on."
        before={<RailPair after={false} />}
        after={<RailPair after />}
      />
      <BeforeAfter
        principle="You can spot the headline without reading a word."
        before={<ChangelogPair after={false} />}
        after={<ChangelogPair after />}
      />
      <BeforeAfter
        principle="Each label now sits with its own box."
        before={<FormPair after={false} />}
        after={<FormPair after />}
      />
      <BeforeAfter
        principle="You can read the prices."
        before={<PlanPair after={false} />}
        after={<PlanPair after />}
      />
      <BeforeAfter
        principle="The tags look like tags again, and the buttons stop looking like toys."
        before={<FilterPair after={false} />}
        after={<FilterPair after />}
      />
      <BeforeAfter
        principle="Pick Sharp or Round: now the whole card follows, not just the outside."
        before={<ReferencePair after={false} />}
        after={<ReferencePair after />}
      />
      <BeforeAfter
        principle="The row lights up under the pointer and the star gives way when you press it."
        before={<StatesPair after={false} />}
        after={<StatesPair after />}
      />
      <BeforeAfter
        principle="Save is in the same place, and looks the same, in both boxes."
        before={<ConsistencyPair after={false} />}
        after={<ConsistencyPair after />}
      />
      <BeforeAfter
        principle="Only the menu looks like it is floating above everything."
        before={<DepthPair after={false} />}
        after={<DepthPair after />}
      />
    </div>
  );
}
