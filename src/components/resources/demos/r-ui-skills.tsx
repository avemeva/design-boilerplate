"use client";

import {
  ArrowUpDown,
  Bell,
  Check,
  FileText,
  Link2,
  MoreHorizontal,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * UI Skills — https://www.ui-skills.com
 *
 * The site is an index: /skills/registry.txt is a 202-row TSV of raw
 * SKILL.md URLs, and `npx ui-skills get <slug>` just fetches the
 * markdown. Its own authored content is seven skills by ibelick
 * (ui-skills-root, baseline-ui, improve-ui, fixing-accessibility,
 * fixing-motion-performance, fixing-metadata, create-design-md) plus a
 * /design.md for the site itself.
 *
 * Counted rules across the four rule-shaped skills: 42 in baseline-ui,
 * 51 in fixing-accessibility, 55 in fixing-motion-performance, 7 in
 * fixing-metadata, plus 8 routing rules in ui-skills-root and ~25
 * lines of guidance in /design.md.
 *
 * Everything below is one of those rules, built twice: the `before` is
 * the version you get without the skill, the `after` is the version the
 * rule asks for. improve-ui and create-design-md are audit workflows
 * with no visible output, and the routing rules are about which file an
 * agent opens, so neither appears here.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const CTRL =
  "text-ui-sm ring-ring/50 duration-fast ease-out-quart inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 whitespace-nowrap outline-none transition-colors select-none focus-visible:ring-3";
const PRIMARY = cn(CTRL, "bg-primary text-primary-foreground");
const QUIET = cn(CTRL, "bg-secondary text-foreground border");
const DANGER = cn(CTRL, "bg-destructive/10 text-destructive");
const ICON_BTN =
  "text-muted-foreground hover:text-foreground ring-ring/50 grid size-9 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-3";
const FIELD =
  "text-ui ring-ring/50 h-9 w-full rounded-lg border bg-card px-3 outline-none focus-visible:ring-3";

/* ------------------------------------------------------------------ *
 * 1 — the click you cannot take back
 * baseline-ui → Interaction: MUST use an AlertDialog for destructive
 * or irreversible actions.
 * ------------------------------------------------------------------ */

const PROJECTS = [
  "Q3 revenue report",
  "Onboarding rewrite",
  "Pricing experiment",
];

function DeletePair({ after }: Side) {
  const [items, setItems] = useState(PROJECTS);
  const [pending, setPending] = useState<string | null>(null);

  const remove = (name: string) =>
    setItems((list) => list.filter((n) => n !== name));

  return (
    <div className="space-y-3">
      <div className="divide-y">
        {items.map((name) => (
          <div key={name} className="flex items-center gap-3 py-2 first:pt-0">
            <FileText
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="text-ui min-w-0 flex-1 truncate">{name}</span>
            <button
              type="button"
              className={DANGER}
              onClick={() => (after ? setPending(name) : remove(name))}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-ui text-muted-foreground py-2">
            All three projects are gone.
          </p>
        )}
      </div>

      <button
        type="button"
        className={QUIET}
        onClick={() => setItems(PROJECTS)}
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Put them back
      </button>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{pending}”?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              The project and its history are removed for everyone on the team.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <button type="button" className={QUIET}>
                Keep it
              </button>
            </DialogClose>
            <button
              type="button"
              className={DANGER}
              onClick={() => {
                if (pending) remove(pending);
                setPending(null);
              }}
            >
              Delete project
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2 — waiting
 * baseline-ui → Interaction: SHOULD use structural skeletons for
 * loading states.
 * ------------------------------------------------------------------ */

const INVOICE_ROWS = [
  { who: "Northwind Studio", when: "2 Mar", amount: "$1,240.00" },
  { who: "Atlas Freight", when: "28 Feb", amount: "$318.00" },
  { who: "Corner Bakery", when: "24 Feb", amount: "$96.50" },
];

function LoadingPair({ after }: Side) {
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const reload = () => {
    if (timer.current) clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(() => setLoading(false), 1600);
  };

  return (
    <div className="space-y-3">
      <button type="button" className={PRIMARY} onClick={reload}>
        <RefreshCw className="size-4" aria-hidden="true" />
        Reload invoices
      </button>

      <div className="min-h-40">
        {loading ? (
          after ? (
            <div className="divide-y">
              {INVOICE_ROWS.map((r) => (
                <div
                  key={r.who}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0"
                >
                  <div className="space-y-1.5">
                    <div className="bg-muted h-4 w-40 max-w-full animate-pulse rounded" />
                    <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                  </div>
                  <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-40 items-center justify-center">
              <span
                className="border-muted-foreground/30 border-t-foreground size-5 animate-spin rounded-full border"
                aria-hidden="true"
              />
              <span className="sr-only">Loading</span>
            </div>
          )
        ) : (
          <div className="divide-y">
            {INVOICE_ROWS.map((r) => (
              <div
                key={r.who}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="text-ui truncate">{r.who}</p>
                  <p className="text-caption text-muted-foreground">{r.when}</p>
                </div>
                <p className="text-ui tabular-nums">{r.amount}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3 — the button that will not press
 * baseline-ui → Interaction: MUST show errors next to where the action
 * happens. fixing-accessibility → forms and errors: disabled submit
 * actions must explain why; errors must be linked to fields.
 * ------------------------------------------------------------------ */

function FormPair({ after }: Side) {
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("");
  const [tried, setTried] = useState(false);
  const [paid, setPaid] = useState(false);

  const digits = card.replace(/\D/g, "");
  const emailBad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const cardBad = digits.length !== 16;
  const valid = !emailBad && !cardBad;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={`email-${after}`} className="text-ui-sm block">
          Email
        </label>
        <input
          id={`email-${after}`}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setPaid(false);
          }}
          placeholder="you@company.com"
          aria-invalid={after && tried && emailBad}
          aria-describedby={
            after && tried && emailBad ? `email-err-${after}` : undefined
          }
          className={cn(
            FIELD,
            after && tried && emailBad && "border-destructive",
          )}
        />
        {after && tried && emailBad && (
          <p id={`email-err-${after}`} className="text-caption text-destructive">
            This needs to look like an address — name, then @, then the company.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`card-${after}`} className="text-ui-sm block">
          Card number
        </label>
        <input
          id={`card-${after}`}
          inputMode="numeric"
          value={card}
          onChange={(e) => {
            setCard(e.target.value);
            setPaid(false);
          }}
          placeholder="16 digits"
          aria-invalid={after && tried && cardBad}
          aria-describedby={
            after && tried && cardBad ? `card-err-${after}` : undefined
          }
          className={cn(
            FIELD,
            "tabular-nums",
            after && tried && cardBad && "border-destructive",
          )}
        />
        {after && tried && cardBad && (
          <p id={`card-err-${after}`} className="text-caption text-destructive">
            {digits.length} of 16 digits so far.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <button
          type="button"
          className={PRIMARY}
          disabled={!after && !valid}
          onClick={() => {
            setTried(true);
            if (valid) setPaid(true);
          }}
        >
          Pay $49
        </button>
        {paid && (
          <span className="text-ui text-positive inline-flex items-center gap-1.5">
            <Check className="size-4" aria-hidden="true" />
            Paid
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 4 — nothing here yet
 * baseline-ui → Design: MUST give empty states one clear next action.
 * /design.md: give empty states one clear action.
 * ------------------------------------------------------------------ */

function EmptyStatePair({ after }: Side) {
  const [items, setItems] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const add = () =>
    setItems((list) => [`Invoice ${String(1041 + list.length)}`, ...list]);

  const shown = items.filter((i) =>
    i.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <label htmlFor={`q-${after}`} className="sr-only">
            Search invoices
          </label>
          <input
            id={`q-${after}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices"
            className={cn(FIELD, "pl-9")}
          />
        </div>
        {!after && (
          <button type="button" className={QUIET} onClick={add}>
            New
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        after ? (
          <div className="bg-secondary grid place-items-center gap-3 rounded-xl px-6 py-10 text-center">
            <span className="bg-card grid size-10 place-items-center rounded-xl border">
              <Receipt
                className="text-muted-foreground size-5"
                aria-hidden="true"
              />
            </span>
            <div>
              <p className="text-ui">No invoices yet</p>
              <p className="text-caption text-muted-foreground mt-1">
                Bill a customer and it will show up here.
              </p>
            </div>
            <button type="button" className={PRIMARY} onClick={add}>
              <Plus className="size-4" aria-hidden="true" />
              Create your first invoice
            </button>
          </div>
        ) : (
          <div className="grid place-items-center px-6 py-10">
            <p className="text-ui text-muted-foreground">No invoices found.</p>
          </div>
        )
      ) : (
        <div className="divide-y">
          {shown.map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 py-3 first:pt-0"
            >
              <span className="text-ui truncate">{i}</span>
              <span className="text-ui text-muted-foreground tabular-nums">
                $240.00
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 5 — numbers that will not sit still
 * baseline-ui → Typography: MUST use tabular-nums for data.
 * ------------------------------------------------------------------ */

const REGIONS = ["North", "South", "East", "West"];
const AMOUNTS = [
  [11841, 10118, 18011, 11118],
  [98032, 74390, 60874, 89203],
  [11111, 88888, 10101, 71117],
  [40218, 31984, 27403, 55190],
];

function TabularPair({ after }: Side) {
  const [set, setSet] = useState(0);
  const row = AMOUNTS[set % AMOUNTS.length];

  return (
    <div className="space-y-3">
      <div className="divide-y">
        {REGIONS.map((region, i) => (
          <div
            key={region}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5 first:pt-0"
          >
            <span className="text-ui truncate">{region}</span>
            <span className={cn("text-ui", after && "tabular-nums")}>
              ${row[i].toLocaleString("en-US")}.00
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={PRIMARY}
        onClick={() => setSet((s) => s + 1)}
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        New figures
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 6 — a name too long for the row
 * baseline-ui → Typography: SHOULD use truncate or line-clamp for
 * dense UI.
 * ------------------------------------------------------------------ */

const LONG_NAME =
  "Final final approved Q3 revenue report with the board comments merged.pdf";

function TruncatePair({ after }: Side) {
  const [name, setName] = useState(LONG_NAME);

  return (
    <div className="space-y-4">
      <div className="divide-y">
        {[
          { n: name, size: "4.2 MB", when: "2 Mar" },
          { n: "Budget.xlsx", size: "812 KB", when: "1 Mar" },
          { n: "Team photo.jpg", size: "3.1 MB", when: "27 Feb" },
        ].map((f, i) => (
          <div
            key={f.size}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0"
          >
            <FileText
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            <span className={cn("text-ui min-w-0", after && "truncate")}>
              {i === 0 ? name || "Untitled.pdf" : f.n}
            </span>
            <span className="text-caption text-muted-foreground shrink-0 tabular-nums">
              {f.size} · {f.when}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 border-t pt-4">
        <label htmlFor={`rename-${after}`} className="text-ui-sm block">
          Rename the first file
        </label>
        <input
          id={`rename-${after}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={FIELD}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 7 — a headline that breaks badly
 * baseline-ui → Typography: MUST use text-balance for headings and
 * text-pretty for body.
 * ------------------------------------------------------------------ */

const WIDTHS = [
  { id: "narrow", label: "Narrow", cls: "max-w-xs" },
  { id: "medium", label: "Medium", cls: "max-w-sm" },
  { id: "wide", label: "Wide", cls: "max-w-md" },
] as const;

function BalancePair({ after }: Side) {
  const [w, setW] = useState(1);
  const width = WIDTHS[w];

  return (
    <div className="space-y-4">
      <div className={cn("space-y-2", width.cls)}>
        <h3 className={cn("text-title", after && "text-balance")}>
          Everything your finance team needs, in one quiet place
        </h3>
        <p
          className={cn(
            "text-caption text-muted-foreground",
            after && "text-pretty",
          )}
        >
          Invoices, receipts and payouts, reconciled every morning before anyone
          arrives.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        {WIDTHS.map((option, i) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={w === i}
            onClick={() => setW(i)}
            className={cn(
              CTRL,
              "border",
              w === i
                ? "bg-feature text-feature-foreground border-transparent"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 8 — the pause after a press
 * baseline-ui → Animation: NEVER exceed 200ms for interaction feedback;
 * SHOULD use ease-out on entrance; scale from near the target.
 * ------------------------------------------------------------------ */

const SORTS = [
  { id: "recent", label: "Most recent" },
  { id: "amount", label: "Largest amount" },
  { id: "name", label: "Name A–Z" },
] as const;

const ORDERS = {
  recent: ["Northwind Studio", "Atlas Freight", "Corner Bakery"],
  amount: ["Northwind Studio", "Corner Bakery", "Atlas Freight"],
  name: ["Atlas Freight", "Corner Bakery", "Northwind Studio"],
};

function SpeedPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<keyof typeof ORDERS>("recent");

  return (
    <div className="space-y-3">
      <div className="relative inline-block">
        <button
          type="button"
          className={QUIET}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <ArrowUpDown className="size-4" aria-hidden="true" />
          {SORTS.find((s) => s.id === sort)?.label}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{
                opacity: 0,
                scale: after ? 0.96 : 0.7,
                y: after ? -4 : -18,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: after ? 0.98 : 0.7 }}
              transition={
                after
                  ? { duration: duration.base, ease: ease.outQuart }
                  : { duration: 0.7, ease: ease.inOutQuart }
              }
              style={{ originY: 0, originX: 0 }}
              className="bg-popover shadow-floating absolute top-full left-0 z-20 mt-1.5 w-52 rounded-xl p-1"
            >
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={cn(
                    CTRL,
                    "hover:bg-secondary w-full justify-start px-2.5",
                  )}
                  onClick={() => {
                    setSort(s.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      sort === s.id ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="divide-y">
        {ORDERS[sort].map((n) => (
          <p key={n} className="text-ui py-2.5 first:pt-0">
            {n}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 9 — the menu that falls off the card
 * baseline-ui → Components: MUST use accessible component primitives
 * for anything with keyboard or focus behavior; NEVER rebuild keyboard
 * or focus behavior by hand. Layout: MUST use a fixed z-index scale.
 * ------------------------------------------------------------------ */

const MEMBERS = [
  { name: "Anna Reyes", role: "Owner" },
  { name: "Tom Baker", role: "Editor" },
  { name: "Priya Nair", role: "Viewer" },
];

const MEMBER_ACTIONS = ["Change role", "Resend invite", "Remove from team"];

function MenuPair({ after }: Side) {
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-xl border",
          after ? "overflow-visible" : "overflow-hidden",
        )}
      >
        {MEMBERS.map((m, i) => (
          <div
            key={m.name}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5",
              i > 0 && "border-t",
            )}
          >
            <span className="bg-secondary text-micro grid size-8 shrink-0 place-items-center rounded-full uppercase">
              {m.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ui truncate">{m.name}</p>
              <p className="text-caption text-muted-foreground">{m.role}</p>
            </div>
            <button
              type="button"
              aria-label={`Actions for ${m.name}`}
              aria-expanded={open === m.name}
              className={ICON_BTN}
              onClick={() => setOpen((v) => (v === m.name ? null : m.name))}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>

            {open === m.name && (
              <div
                className={cn(
                  "bg-popover shadow-floating absolute right-3 w-48 rounded-xl p-1",
                  after ? "bottom-full z-30 mb-1.5" : "top-full z-0 mt-1.5",
                )}
              >
                {MEMBER_ACTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={cn(
                      CTRL,
                      "hover:bg-secondary w-full justify-start px-2.5",
                    )}
                    onClick={() => {
                      setNote(`${a} · ${m.name}`);
                      setOpen(null);
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-caption text-muted-foreground min-h-5">
        {note ?? " "}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 10 — colour everywhere
 * baseline-ui → Design: SHOULD limit accent color usage to one per
 * view; SHOULD use existing theme tokens. /design.md: keep the palette
 * neutral, reserve the darkest values for important actions.
 * ------------------------------------------------------------------ */

const PLANS = [
  { id: "starter", name: "Starter", price: "$0", note: "1 workspace" },
  { id: "team", name: "Team", price: "$49", note: "10 workspaces" },
  { id: "scale", name: "Scale", price: "$199", note: "Unlimited" },
];

function AccentPair({ after }: Side) {
  const [plan, setPlan] = useState("team");
  const [confirmed, setConfirmed] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-micro rounded-full px-2.5 py-1 uppercase",
            after
              ? "bg-secondary text-muted-foreground"
              : "bg-accent text-accent-foreground",
          )}
        >
          14 days left
        </span>
        <span
          className={cn(
            "text-micro rounded-full px-2.5 py-1 uppercase",
            after ? "bg-secondary text-muted-foreground" : "bg-positive/15 text-positive",
          )}
        >
          Card on file
        </span>
        <span
          className={cn(
            "text-micro rounded-full px-2.5 py-1 uppercase",
            after
              ? "bg-secondary text-muted-foreground"
              : "bg-destructive/10 text-destructive",
          )}
        >
          3 seats over
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {PLANS.map((p) => {
          const active = plan === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setPlan(p.id);
                setConfirmed(null);
              }}
              className={cn(
                "duration-fast ease-out-quart rounded-xl border p-3 text-left transition-colors",
                active
                  ? after
                    ? "bg-accent text-accent-foreground border-transparent"
                    : "bg-feature text-feature-foreground border-transparent"
                  : "bg-card hover:bg-secondary",
              )}
            >
              <p className="text-ui-sm">{p.name}</p>
              <p className="text-ui mt-1 tabular-nums">{p.price}</p>
              <p
                className={cn(
                  "text-caption mt-0.5",
                  active && !after ? "opacity-80" : "text-muted-foreground",
                )}
              >
                {p.note}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <button
          type="button"
          className={cn(
            CTRL,
            after
              ? "bg-primary text-primary-foreground"
              : "bg-feature text-feature-foreground",
          )}
          onClick={() => setConfirmed(plan)}
        >
          Switch plan
        </button>
        <a
          href="#billing"
          onClick={(e) => e.preventDefault()}
          className={cn(
            "text-ui-sm underline-offset-4 hover:underline",
            after ? "text-muted-foreground" : "text-accent-foreground",
          )}
        >
          Compare plans
        </a>
        {confirmed && (
          <span className="text-caption text-muted-foreground">
            Now on {PLANS.find((p) => p.id === confirmed)?.name}.
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 11 — everything moving at once
 * baseline-ui → Animation: NEVER add animation unless it is explicitly
 * requested; MUST animate only compositor props; SHOULD use ease-out
 * on entrance. fixing-motion-performance → one-shot effects are
 * acceptable more often than continuous motion.
 * ------------------------------------------------------------------ */

const NOTICES = [
  "Anna commented on the pricing draft",
  "Payout of $2,140.00 settled",
  "Tom joined the workspace",
];

function MotionPair({ after }: Side) {
  const [items, setItems] = useState(NOTICES);

  const add = () =>
    setItems((list) => [
      `New reply from Priya · ${list.length - NOTICES.length + 1}`,
      ...list,
    ]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={PRIMARY} onClick={add}>
          <Bell className="size-4" aria-hidden="true" />
          New notification
        </button>
        <motion.span
          animate={after ? undefined : { scale: [1, 1.25, 1] }}
          transition={
            after
              ? undefined
              : { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }
          className={cn(
            "text-micro rounded-full px-2.5 py-1 tabular-nums uppercase",
            after
              ? "bg-secondary text-muted-foreground"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {items.length} unread
        </motion.span>
        <button
          type="button"
          className={QUIET}
          onClick={() => setItems(NOTICES)}
        >
          Reset
        </button>
      </div>

      {after ? (
        <div className="divide-y">
          <AnimatePresence initial={false}>
            {items.map((n) => (
              <motion.p
                key={n}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: duration.base, ease: ease.outQuart }}
                className="text-ui py-2.5"
              >
                {n}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div key={items.length} className="divide-y">
          {items.map((n, i) => (
            <motion.p
              key={n}
              initial={{ opacity: 0, y: -14, scale: 0.9 }}
              animate={{
                opacity: [1, 0.5, 1],
                y: 0,
                scale: 1,
              }}
              transition={{
                opacity: {
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.12,
                },
                y: { duration: 0.5, delay: i * 0.12, ease: "easeInOut" },
                scale: { duration: 0.5, delay: i * 0.12, ease: "easeInOut" },
              }}
              className="text-ui py-2.5"
            >
              {n}
            </motion.p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 12 — the link you send someone
 * fixing-metadata → titles, descriptions, Open Graph and Twitter cards
 * so a shared link renders a real preview.
 * ------------------------------------------------------------------ */

const PAGES = [
  {
    id: "pricing",
    chip: "Pricing",
    url: "acme.com/pricing",
    title: "Pricing — Acme",
    description:
      "Three plans, no setup fee, and every plan includes unlimited invoices.",
  },
  {
    id: "guide",
    chip: "Guide",
    url: "acme.com/guides/reconciliation",
    title: "How reconciliation works — Acme",
    description:
      "What happens to a payment between the bank feed and your ledger.",
  },
  {
    id: "changelog",
    chip: "Changelog",
    url: "acme.com/changelog/march",
    title: "March changelog — Acme",
    description: "Bulk payouts, a faster ledger, and 14 fixes.",
  },
];

function MetadataPair({ after }: Side) {
  const [pick, setPick] = useState(PAGES[0]);
  const [sent, setSent] = useState<typeof PAGES>([]);

  return (
    <div className="space-y-3">
      <div className="bg-secondary min-h-40 space-y-2 rounded-xl p-3">
        {sent.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            Nothing shared yet.
          </p>
        ) : (
          sent.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="bg-card ml-auto max-w-xs space-y-2 rounded-xl border p-3"
            >
              <p className="text-caption text-muted-foreground">
                Have a look at this
              </p>
              {after ? (
                <div className="rounded-lg border">
                  <div className="flex items-center gap-3 p-2.5">
                    <span className="bg-feature text-feature-foreground grid size-9 shrink-0 place-items-center rounded-lg">
                      <Receipt className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-ui-sm truncate">{p.title}</p>
                      <p className="text-micro text-muted-foreground mt-0.5 uppercase">
                        acme.com
                      </p>
                    </div>
                  </div>
                  <p className="text-caption text-muted-foreground border-t px-2.5 py-2">
                    {p.description}
                  </p>
                </div>
              ) : (
                <p className="text-ui-sm text-accent-foreground inline-flex min-w-0 items-center gap-1.5">
                  <Link2 className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">https://{p.url}</span>
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={pick.id === p.id}
            onClick={() => setPick(p)}
            className={cn(
              CTRL,
              "border",
              pick.id === p.id
                ? "bg-feature text-feature-foreground border-transparent"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {p.chip}
          </button>
        ))}
        <button
          type="button"
          className={PRIMARY}
          onClick={() => setSent((list) => [...list, pick])}
        >
          <Send className="size-4" aria-hidden="true" />
          Share the link
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * the page
 * ------------------------------------------------------------------ */

export function UiSkillsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Anything you cannot take back should ask first. One stray click should never wipe out a week of work."
        before={<DeletePair after={false} />}
        after={<DeletePair after />}
      />
      <BeforeAfter
        principle="While something is loading, show the shape of what is coming. A spinning circle tells you nothing about what you are waiting for."
        before={<LoadingPair after={false} />}
        after={<LoadingPair after />}
      />
      <BeforeAfter
        principle="A button that will not work should say what is missing, right next to the thing that is wrong. Otherwise you sit there poking at a dead control, guessing."
        before={<FormPair after={false} />}
        after={<FormPair after />}
      />
      <BeforeAfter
        principle="An empty screen should hand you the next thing to do. “Nothing found” leaves you stuck."
        before={<EmptyStatePair after={false} />}
        after={<EmptyStatePair after />}
      />
      <BeforeAfter
        principle="Numbers should stay in their column when they change. Otherwise the figures shuffle sideways while you are trying to read them."
        before={<TabularPair after={false} />}
        after={<TabularPair after />}
      />
      <BeforeAfter
        principle="In a tight list, a long name should be cut short rather than shove everything else around. Rows that change shape as you type are hard to scan."
        before={<TruncatePair after={false} />}
        after={<TruncatePair after />}
      />
      <BeforeAfter
        principle="A headline should break into even lines. One word stranded on the last line reads as a mistake."
        before={<BalancePair after={false} />}
        after={<BalancePair after />}
      />
      <BeforeAfter
        principle="When you press something it should answer straight away. A slow, drifting animation makes the whole product feel like it is thinking."
        before={<SpeedPair after={false} />}
        after={<SpeedPair after />}
      />
      <BeforeAfter
        principle="A menu has to stay on screen. Cut off by the edge of the panel it opened in, half of it is unreachable."
        before={<MenuPair after={false} />}
        after={<MenuPair after />}
      />
      <BeforeAfter
        principle="Colour should point at one thing. When five things are coloured, none of them stands out and you do not know where to look."
        before={<AccentPair after={false} />}
        after={<AccentPair after />}
      />
      <BeforeAfter
        principle="Movement should show you what just changed. When everything on screen is already moving, the new thing arrives unnoticed."
        before={<MotionPair after={false} />}
        after={<MotionPair after />}
      />
      <BeforeAfter
        principle="A link you send should show what is on the other end. A bare address tells the person nothing about whether it is worth opening."
        before={<MetadataPair after={false} />}
        after={<MetadataPair after />}
      />
    </div>
  );
}
