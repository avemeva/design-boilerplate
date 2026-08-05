"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FolderPlus,
  HelpCircle,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Shared control styles. Both sides of every switch use the same ones,
 * so the only thing that changes is the detail being shown.
 * ------------------------------------------------------------------ */

const field =
  "text-ui h-9 w-full rounded-lg border bg-transparent px-3 outline-none placeholder:text-muted-foreground focus-visible:border-ring";

const btn =
  "text-ui-sm bg-card inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border px-3.5 transition-colors hover:bg-secondary disabled:opacity-50";

const btnPrimary =
  "text-ui-sm bg-primary text-primary-foreground inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 transition-opacity hover:opacity-90 disabled:opacity-50";

const menuRow =
  "text-ui-sm flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left transition-colors hover:bg-secondary";

function copyText(text: string) {
  void navigator.clipboard?.writeText(text).catch(() => {});
}

/* ── 1. Where you can press ───────────────────────────────────────── */

const VIEWS = [
  { label: "Inbox", count: 24 },
  { label: "Assigned to me", count: 6 },
  { label: "Recently updated", count: 12 },
  { label: "Archived", count: 3 },
];

function ViewsBefore() {
  const [sel, setSel] = useState("Inbox");
  return (
    <ul className="max-w-xs space-y-3">
      {VIEWS.map((v) => (
        <li key={v.label} className="flex items-center gap-3 px-2.5">
          <button
            type="button"
            onClick={() => setSel(v.label)}
            className={cn(
              "text-ui-sm hover:underline",
              sel === v.label && "text-accent-foreground",
            )}
          >
            {v.label}
          </button>
          <span className="text-caption text-muted-foreground ml-auto">
            {v.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ViewsAfter() {
  const [sel, setSel] = useState("Inbox");
  return (
    <ul className="max-w-xs">
      {VIEWS.map((v) => (
        <li key={v.label}>
          <button
            type="button"
            onClick={() => setSel(v.label)}
            aria-pressed={sel === v.label}
            className={cn(
              "text-ui-sm duration-fast flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors",
              sel === v.label
                ? "bg-accent text-accent-foreground"
                : "hover:bg-secondary",
            )}
          >
            {v.label}
            <span
              className={cn(
                "text-caption ml-auto tabular-nums",
                sel === v.label
                  ? "text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              {v.count}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ── 2. The sign-in form ──────────────────────────────────────────── */

function SignInBefore() {
  const [done, setDone] = useState(false);
  return (
    <div className="max-w-xs space-y-3">
      <div className="space-y-1.5">
        <div className="text-ui-sm">Work email</div>
        <input className={field} type="text" spellCheck autoComplete="on" />
      </div>
      <div className="space-y-1.5">
        <div className="text-ui-sm">Password</div>
        <input className={field} type="text" spellCheck autoComplete="on" />
      </div>
      <button type="button" className={btnPrimary} onClick={() => setDone(true)}>
        Sign in
      </button>
      {done && <p className="text-caption text-positive">Signed in.</p>}
    </div>
  );
}

function SignInAfter() {
  const [done, setDone] = useState(false);
  return (
    <form
      className="max-w-xs space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <div className="space-y-1.5">
        <Label className="text-ui-sm" htmlFor="wig-email">
          Work email
        </Label>
        <input
          id="wig-email"
          className={field}
          type="email"
          required
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-ui-sm" htmlFor="wig-password">
          Password
        </Label>
        <input
          id="wig-password"
          className={field}
          type="password"
          required
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <button type="submit" className={btnPrimary}>
        Sign in
      </button>
      {done && <p className="text-caption text-positive">Signed in.</p>}
    </form>
  );
}

/* ── 3. Icons in the search box ───────────────────────────────────── */

function SearchBefore() {
  const [q, setQ] = useState("quarterly");
  return (
    <div className="flex max-w-sm items-center gap-2">
      <Search aria-hidden className="text-muted-foreground size-4 shrink-0" />
      <input
        className={field}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search files"
      />
      <button type="button" className={btn} onClick={() => setQ("")}>
        Clear
      </button>
    </div>
  );
}

function SearchAfter() {
  const [q, setQ] = useState("quarterly");
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="relative max-w-sm">
      <span
        onMouseDown={(e) => {
          e.preventDefault();
          input.current?.focus();
        }}
        className="absolute inset-y-0 left-0 flex w-9 items-center justify-center"
      >
        <Search aria-hidden className="text-muted-foreground size-4" />
      </span>
      <input
        ref={input}
        className={cn(field, "pr-9 pl-9")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search files"
      />
      {q && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQ("");
            input.current?.focus();
          }}
          className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-lg"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ── 4. Toggles ───────────────────────────────────────────────────── */

const PREFS = [
  { id: "digest", label: "Weekly digest" },
  { id: "mentions", label: "When someone mentions me" },
] as const;

type PrefId = (typeof PREFS)[number]["id"];
type Prefs = Record<PrefId, boolean>;
const INITIAL_PREFS: Prefs = { digest: true, mentions: false };

function prefSummary(p: Prefs) {
  const on = PREFS.filter((x) => p[x.id]).map((x) => x.label.toLowerCase());
  return on.length
    ? `We email you about: ${on.join(", ")}.`
    : "We email you nothing.";
}

function TogglesBefore() {
  const [draft, setDraft] = useState<Prefs>(INITIAL_PREFS);
  const [saved, setSaved] = useState<Prefs>(INITIAL_PREFS);
  const dirty = PREFS.some((p) => draft[p.id] !== saved[p.id]);
  return (
    <div className="max-w-sm space-y-3">
      {PREFS.map((p) => (
        <div key={p.id} className="flex h-9 items-center justify-between gap-4">
          <Label className="text-ui-sm" htmlFor={`wig-b-${p.id}`}>
            {p.label}
          </Label>
          <Switch
            id={`wig-b-${p.id}`}
            checked={draft[p.id]}
            onCheckedChange={(v) => setDraft({ ...draft, [p.id]: v })}
          />
        </div>
      ))}
      <div className="flex items-center gap-3 border-t pt-3">
        <button
          type="button"
          className={btnPrimary}
          disabled={!dirty}
          onClick={() => setSaved(draft)}
        >
          Save changes
        </button>
        {dirty && (
          <p className="text-caption text-destructive">Unsaved changes</p>
        )}
      </div>
      <p className="text-caption text-muted-foreground">{prefSummary(saved)}</p>
    </div>
  );
}

function TogglesAfter() {
  const [prefs, setPrefs] = useState<Prefs>(INITIAL_PREFS);
  const [flash, setFlash] = useState<PrefId | null>(null);
  return (
    <div className="max-w-sm space-y-3">
      {PREFS.map((p) => (
        <div key={p.id} className="flex h-9 items-center justify-between gap-4">
          <Label className="text-ui-sm" htmlFor={`wig-a-${p.id}`}>
            {p.label}
          </Label>
          <div className="flex items-center gap-2.5">
            {flash === p.id && (
              <span className="text-caption text-muted-foreground inline-flex items-center gap-1">
                <Check aria-hidden className="size-3.5" />
                Saved
              </span>
            )}
            <Switch
              id={`wig-a-${p.id}`}
              checked={prefs[p.id]}
              onCheckedChange={(v) => {
                setPrefs({ ...prefs, [p.id]: v });
                setFlash(p.id);
                window.setTimeout(() => setFlash(null), 1400);
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-caption text-muted-foreground border-t pt-3">
        {prefSummary(prefs)}
      </p>
    </div>
  );
}

/* ── 5. Pressing twice ────────────────────────────────────────────── */

function OrderList({
  orders,
  onReset,
}: {
  orders: number[];
  onReset: () => void;
}) {
  if (!orders.length) return null;
  return (
    <div className="space-y-2 border-t pt-3">
      {orders.map((n, i) => (
        <p
          key={`${n}-${i}`}
          className="text-caption text-muted-foreground flex items-center gap-2"
        >
          <Check aria-hidden className="text-positive size-3.5" />
          Order #{n} confirmed · $48.00 charged
        </p>
      ))}
      <button type="button" className={btn} onClick={onReset}>
        Start over
      </button>
    </div>
  );
}

function OrderBefore() {
  const [orders, setOrders] = useState<number[]>([]);
  return (
    <div className="max-w-sm space-y-3">
      <button
        type="button"
        className={btnPrimary}
        onClick={() =>
          window.setTimeout(
            () => setOrders((o) => [...o, 1001 + o.length]),
            500,
          )
        }
      >
        Place order · $48.00
      </button>
      <OrderList orders={orders} onReset={() => setOrders([])} />
    </div>
  );
}

function OrderAfter() {
  const [orders, setOrders] = useState<number[]>([]);
  const [pending, setPending] = useState(false);
  const locked = pending || orders.length > 0;
  return (
    <div className="max-w-sm space-y-3">
      <button
        type="button"
        className={btnPrimary}
        disabled={locked}
        onClick={() => {
          setPending(true);
          window.setTimeout(() => {
            setPending(false);
            setOrders([1001]);
          }, 500);
        }}
      >
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {pending ? "Placing order…" : "Place order · $48.00"}
      </button>
      <OrderList
        orders={orders}
        onReset={() => {
          setOrders([]);
          setPending(false);
        }}
      />
    </div>
  );
}

/* ── 6. Why the button is grey ────────────────────────────────────── */

function InviteBefore() {
  const [email, setEmail] = useState("");
  const [tip, setTip] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="max-w-sm space-y-3">
      <div className="space-y-1.5">
        <Label className="text-ui-sm" htmlFor="wig-invite-b">
          Invite a teammate
        </Label>
        <input
          id="wig-invite-b"
          className={field}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
        />
      </div>
      <div className="relative inline-block">
        <button
          type="button"
          className={btnPrimary}
          disabled={!email}
          onMouseEnter={() => setTip(true)}
          onMouseLeave={() => setTip(false)}
          onClick={() => setSent(email)}
        >
          Send invite
        </button>
        {tip && (
          <span className="bg-primary text-primary-foreground text-caption absolute bottom-full left-0 mb-2 w-max rounded-lg px-2.5 py-1.5">
            Enter an email address first
          </span>
        )}
      </div>
      {sent && (
        <p className="text-caption text-positive">Invite sent to {sent}.</p>
      )}
    </div>
  );
}

function InviteAfter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="max-w-sm space-y-3">
      <div className="space-y-1.5">
        <Label className="text-ui-sm" htmlFor="wig-invite-a">
          Invite a teammate
        </Label>
        <input
          id="wig-invite-a"
          ref={input}
          className={cn(field, error && "border-destructive")}
          type="email"
          aria-invalid={!!error}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="name@company.com"
        />
        {error && <p className="text-caption text-destructive">{error}</p>}
      </div>
      <button
        type="button"
        className={btnPrimary}
        onClick={() => {
          if (!email) {
            setError("Add an email address so we know who to invite.");
            input.current?.focus();
            return;
          }
          setSent(email);
        }}
      >
        Send invite
      </button>
      {sent && (
        <p className="text-caption text-positive">Invite sent to {sent}.</p>
      )}
    </div>
  );
}

/* ── 7. Copying a key ─────────────────────────────────────────────── */

const API_KEY = "sk_live_9f2c_41ab_7d30";

function CopyBefore() {
  return (
    <div className="flex max-w-md items-center gap-3">
      <code className="text-ui-sm bg-secondary flex h-9 flex-1 items-center rounded-lg px-3 font-mono">
        {API_KEY}
      </code>
      <button
        type="button"
        className={btn}
        onClick={() => {
          copyText(API_KEY);
          toast.success("Copied to clipboard");
        }}
      >
        <Copy aria-hidden className="size-4" />
        Copy
      </button>
    </div>
  );
}

function CopyAfter() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex max-w-md items-center gap-3">
      <code className="text-ui-sm bg-secondary flex h-9 flex-1 items-center rounded-lg px-3 font-mono">
        {API_KEY}
      </code>
      <button
        type="button"
        className={cn(btn, "w-28")}
        onClick={() => {
          copyText(API_KEY);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? (
          <Check aria-hidden className="text-positive size-4" />
        ) : (
          <Copy aria-hidden className="size-4" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/* ── 8. Saving an article ─────────────────────────────────────────── */

const ARTICLES = [
  { id: 1, title: "Designing focus states", saves: 128, fails: false },
  { id: 2, title: "Motion that gets out of the way", saves: 64, fails: false },
  { id: 3, title: "The real cost of a spinner", saves: 21, fails: true },
];

function SaveRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b py-2 last:border-b-0">
      <p className="text-ui-sm">{title}</p>
      {children}
    </div>
  );
}

function SavesBefore() {
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState<number | null>(null);
  return (
    <div className="max-w-md">
      {ARTICLES.map((a) => (
        <SaveRow key={a.id} title={a.title}>
          <button
            type="button"
            className={cn(btn, "w-24")}
            disabled={busy === a.id}
            onClick={() => {
              setBusy(a.id);
              window.setTimeout(() => {
                setBusy(null);
                if (a.fails) toast.error("Couldn't save that one");
                else setSaved((s) => ({ ...s, [a.id]: !s[a.id] }));
              }, 800);
            }}
          >
            {busy === a.id ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Star
                aria-hidden
                className={cn("size-4", saved[a.id] && "fill-current")}
              />
            )}
            <span className="tabular-nums">
              {a.saves + (saved[a.id] ? 1 : 0)}
            </span>
          </button>
        </SaveRow>
      ))}
    </div>
  );
}

function SavesAfter() {
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState<number | null>(null);
  return (
    <div className="max-w-md">
      {ARTICLES.map((a) => (
        <SaveRow key={a.id} title={a.title}>
          <div className="flex items-center gap-2.5">
            {failed === a.id && (
              <span className="text-caption text-destructive">
                Didn&rsquo;t save
              </span>
            )}
            <button
              type="button"
              className={cn(btn, "w-24")}
              onClick={() => {
                const next = !saved[a.id];
                setSaved((s) => ({ ...s, [a.id]: next }));
                setFailed(null);
                if (a.fails) {
                  window.setTimeout(() => {
                    setSaved((s) => ({ ...s, [a.id]: !next }));
                    setFailed(a.id);
                  }, 800);
                }
              }}
            >
              <Star
                aria-hidden
                className={cn("size-4", saved[a.id] && "fill-current")}
              />
              <span className="tabular-nums">
                {a.saves + (saved[a.id] ? 1 : 0)}
              </span>
            </button>
          </div>
        </SaveRow>
      ))}
    </div>
  );
}

/* ── 9. An empty list ─────────────────────────────────────────────── */

const TEMPLATES = ["Product launch", "Design review"];

function useProjects() {
  const [items, setItems] = useState<string[]>([]);
  const n = useRef(0);
  const add = (name: string) => {
    n.current += 1;
    setItems((i) => [...i, `${name} ${n.current}`]);
  };
  return { items, add, clear: () => setItems([]) };
}

function ProjectList({
  items,
  onClear,
}: {
  items: string[];
  onClear: () => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((p) => (
        <div
          key={p}
          className="flex h-10 items-center gap-2.5 rounded-lg border px-3"
        >
          <FolderPlus aria-hidden className="text-muted-foreground size-4" />
          <span className="text-ui-sm">{p}</span>
        </div>
      ))}
      <button type="button" className={btn} onClick={onClear}>
        Clear all
      </button>
    </div>
  );
}

function EmptyBefore() {
  const { items, add, clear } = useProjects();
  return (
    <div className="max-w-md">
      <div className="flex items-center justify-between gap-4">
        <p className="text-ui">Projects</p>
        <button type="button" className={btn} onClick={() => add("Project")}>
          New
        </button>
      </div>
      {items.length ? (
        <ProjectList items={items} onClear={clear} />
      ) : (
        <div className="mt-3 flex h-36 items-center justify-center rounded-xl border border-dashed">
          <p className="text-caption text-muted-foreground">No projects.</p>
        </div>
      )}
    </div>
  );
}

function EmptyAfter() {
  const { items, add, clear } = useProjects();
  return (
    <div className="max-w-md">
      <div className="flex items-center justify-between gap-4">
        <p className="text-ui">Projects</p>
        <button type="button" className={btn} onClick={() => add("Project")}>
          New
        </button>
      </div>
      {items.length ? (
        <ProjectList items={items} onClear={clear} />
      ) : (
        <div className="mt-3 flex flex-col items-center gap-3 rounded-xl border border-dashed px-5 py-7 text-center">
          <span className="bg-secondary flex size-10 items-center justify-center rounded-full">
            <FolderPlus aria-hidden className="text-muted-foreground size-5" />
          </span>
          <div>
            <p className="text-ui">Nothing here yet</p>
            <p className="text-caption text-muted-foreground mt-0.5">
              A project keeps your files, notes and people together.
            </p>
          </div>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => add("Project")}
          >
            <Plus aria-hidden className="size-4" />
            Create a project
          </button>
          <div className="flex flex-wrap justify-center gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                className="text-ui-sm bg-secondary text-muted-foreground hover:text-foreground h-9 rounded-full px-3.5 transition-colors"
                onClick={() => add(t)}
              >
                Start from {t.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 10. Numbers that change ──────────────────────────────────────── */

function Seats({ steady }: { steady: boolean }) {
  const [seats, setSeats] = useState(37);
  const total = (seats * 24).toLocaleString("en-US");
  const id = steady ? "wig-seats-a" : "wig-seats-b";
  return (
    <div className="max-w-md space-y-4">
      <div className={cn("space-y-1", steady && "tabular-nums")}>
        <p className="text-ui">{seats} seats × $24.00 each, billed monthly</p>
        <p className="text-title">${total}.00 due today</p>
      </div>
      <div className="flex items-center gap-3">
        <Label className="text-caption text-muted-foreground" htmlFor={id}>
          Seats
        </Label>
        <input
          id={id}
          type="range"
          min={1}
          max={99}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="accent-primary h-9 flex-1"
        />
      </div>
    </div>
  );
}

/* ── 11. A headline in a narrow space ─────────────────────────────── */

function Headline({ fluid }: { fluid: boolean }) {
  const [w, setW] = useState(340);
  const id = fluid ? "wig-width-a" : "wig-width-b";
  return (
    <div className="space-y-4">
      <div
        className="@container bg-secondary rounded-xl border p-4"
        style={{ width: w, maxWidth: "100%" }}
      >
        <p
          className="font-semibold"
          style={{
            fontSize: fluid ? "clamp(1.125rem, 7cqi, 2.125rem)" : "2.125rem",
            lineHeight: 1.1,
            letterSpacing: "-0.028em",
          }}
        >
          Everything your team ships, in one place
        </p>
        <p className="text-caption text-muted-foreground mt-2">
          Drafts, reviews and releases, together.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Label className="text-caption text-muted-foreground" htmlFor={id}>
          Window
        </Label>
        <input
          id={id}
          type="range"
          min={240}
          max={640}
          value={w}
          onChange={(e) => setW(Number(e.target.value))}
          className="accent-primary h-9 flex-1"
        />
      </div>
    </div>
  );
}

/* ── 12. Hovering a row of tabs ───────────────────────────────────── */

const TABS = ["Overview", "Activity", "Members", "Settings", "Billing"];

function TabRow({ steady }: { steady: boolean }) {
  const [active, setActive] = useState("Overview");
  return (
    <div className="flex flex-wrap items-center gap-1 border-b pb-2">
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setActive(t)}
          aria-pressed={active === t}
          className={cn(
            "text-ui-sm duration-fast h-9 rounded-lg px-2.5 transition-colors",
            steady ? "hover:bg-secondary" : "hover:font-semibold",
            active === t &&
              (steady ? "bg-accent text-accent-foreground" : "underline"),
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ── 13. Opening a small dialog ───────────────────────────────────── */

function RenameDemo({ loud }: { loud: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Quarterly review");
  return (
    <div className="relative flex min-h-48 justify-center">
      <motion.button
        type="button"
        className={btnPrimary}
        whileTap={{ scale: loud ? 0.82 : 0.97 }}
        transition={
          loud
            ? { type: "spring", stiffness: 260, damping: 10 }
            : { duration: duration.instant, ease: ease.outQuart }
        }
        onClick={() => setOpen(true)}
      >
        Rename project
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: loud ? 0 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: loud ? 0 : 0.98 }}
            transition={
              loud
                ? { duration: 0.6, ease: ease.spring }
                : { duration: duration.base, ease: ease.outQuart }
            }
            className="bg-card shadow-floating absolute inset-x-0 top-12 mx-auto w-full max-w-xs space-y-3 rounded-xl p-4"
          >
            <Label className="text-ui-sm" htmlFor={`wig-rename-${loud}`}>
              Project name
            </Label>
            <input
              id={`wig-rename-${loud}`}
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={btn}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => setOpen(false)}
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 14. Adding things to a list ──────────────────────────────────── */

const LABEL_POOL = ["Research", "Copy", "Handoff", "Bug", "Polish", "Idea"];

function RemoveChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Remove ${label}`}
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground hover:bg-card flex size-6 items-center justify-center rounded-full transition-colors"
    >
      <X aria-hidden className="size-3.5" />
    </button>
  );
}

function TagList({ showy }: { showy: boolean }) {
  const [items, setItems] = useState([
    { id: 1, label: "Design" },
    { id: 2, label: "Review" },
  ]);
  const next = useRef(3);
  const add = () => {
    const id = next.current;
    next.current += 1;
    setItems((i) => [
      ...i,
      { id, label: LABEL_POOL[i.length % LABEL_POOL.length] },
    ]);
  };
  const remove = (id: number) =>
    setItems((i) => i.filter((item) => item.id !== id));

  const chip =
    "text-ui-sm bg-secondary inline-flex h-9 items-center gap-1.5 rounded-full pr-1.5 pl-3.5";

  return (
    <div className="max-w-md space-y-3">
      <div className="flex min-h-9 flex-wrap gap-2">
        {showy ? (
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.span
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.6, y: -14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: 14 }}
                transition={{ type: "spring", stiffness: 190, damping: 13 }}
                className={chip}
              >
                {item.label}
                <RemoveChip label={item.label} onClick={() => remove(item.id)} />
              </motion.span>
            ))}
          </AnimatePresence>
        ) : (
          items.map((item) => (
            <span key={item.id} className={chip}>
              {item.label}
              <RemoveChip label={item.label} onClick={() => remove(item.id)} />
            </span>
          ))
        )}
      </div>
      <button type="button" className={btn} onClick={add}>
        <Plus aria-hidden className="size-4" />
        Add label
      </button>
    </div>
  );
}

/* ── 15. Jumping to a section ─────────────────────────────────────── */

const DOC_SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    body: "A workspace holds every project your team is running, plus the people working on them.",
  },
  {
    id: "pricing",
    title: "Pricing",
    body: "Seats are billed monthly. Change the count whenever you like and we charge the difference.",
  },
  {
    id: "limits",
    title: "Limits",
    body: "Uploads cap at 2 GB per file. Version history is kept for ninety days on every plan.",
  },
  {
    id: "faq",
    title: "Questions",
    body: "Everything else lives in the help centre, or you can write to the team directly.",
  },
];

function Docs({ smooth }: { smooth: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const targets = useRef<Record<string, HTMLElement | null>>({});
  const go = (id: string) => {
    const c = scroller.current;
    const t = targets.current[id];
    if (!c || !t) return;
    c.scrollTo({
      top: t.offsetTop - (smooth ? 62 : 0),
      behavior: smooth ? "smooth" : "auto",
    });
  };
  return (
    <div
      ref={scroller}
      className="relative h-56 overflow-y-auto rounded-xl border"
    >
      <div className="bg-card sticky top-0 z-10 flex flex-wrap gap-1 border-b p-2">
        {DOC_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="text-ui-sm hover:bg-secondary h-9 rounded-lg px-2.5 transition-colors"
            onClick={() => go(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>
      <div className="space-y-8 p-4 pb-48">
        {DOC_SECTIONS.map((s) => (
          <section
            key={s.id}
            ref={(el) => {
              targets.current[s.id] = el;
            }}
          >
            <h4 className="text-ui">{s.title}</h4>
            <p className="text-caption text-muted-foreground mt-1">{s.body}</p>
            <p className="text-caption text-muted-foreground mt-2">
              Every change is saved as you go, so nothing is lost when you close
              the tab. Older versions stay available from the history panel.
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ── 16. Opening a menu ───────────────────────────────────────────── */

const SORTS = ["Newest first", "Oldest first", "Most active", "A to Z"];

function SortMenu({ onPress }: { onPress: boolean }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(SORTS[0]);
  const trigger = onPress
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
          e.preventDefault();
          e.currentTarget.focus();
          setOpen((o) => !o);
        },
      }
    : { onClick: () => setOpen((o) => !o) };

  return (
    <div className="flex min-h-52 justify-start">
      <div className="relative">
        <button
          type="button"
          className={btn}
          aria-haspopup="menu"
          aria-expanded={open}
          {...trigger}
        >
          {choice}
          <ChevronDown aria-hidden className="size-4" />
        </button>
        {open && (
          <>
            <div
              aria-hidden
              className="fixed inset-0 z-10"
              onPointerDown={() => setOpen(false)}
            />
            <div
              role="menu"
              className="bg-popover shadow-floating absolute top-full left-0 z-20 mt-1.5 w-48 rounded-xl p-1"
            >
              {SORTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  className={menuRow}
                  onClick={() => {
                    setChoice(s);
                    setOpen(false);
                  }}
                >
                  {s === choice ? (
                    <Check aria-hidden className="size-3.5 shrink-0" />
                  ) : (
                    <span aria-hidden className="w-3.5 shrink-0" />
                  )}
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 17. Reaching a submenu ───────────────────────────────────────── */

const FOLDERS = ["Clients", "Archive 2025", "Personal", "Shared with me"];

function ContextMenu({ forgiving }: { forgiving: boolean }) {
  const [open, setOpen] = useState(false);
  const [moved, setMoved] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const cancel = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const leave = () => {
    cancel();
    if (forgiving) timer.current = window.setTimeout(() => setOpen(false), 600);
    else setOpen(false);
  };

  return (
    <div className="min-h-56">
      <div className="bg-card w-56 rounded-xl border p-1">
        <button type="button" className={menuRow}>
          Rename
        </button>
        <div className="relative" onMouseEnter={cancel} onMouseLeave={leave}>
          <button
            type="button"
            className={cn(menuRow, open && "bg-secondary")}
            onMouseEnter={() => {
              cancel();
              setOpen(true);
            }}
          >
            Move to
            <ChevronRight aria-hidden className="ml-auto size-4" />
          </button>
          {open && (
            <div className="bg-popover shadow-floating absolute top-7 left-full z-20 w-48 rounded-xl p-1">
              {FOLDERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={menuRow}
                  onClick={() => {
                    setMoved(f);
                    setOpen(false);
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className={menuRow}>
          Duplicate
        </button>
        <button type="button" className={cn(menuRow, "text-destructive")}>
          Delete
        </button>
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        {moved ? `Moved to ${moved}.` : "Sitting in Everything."}
      </p>
    </div>
  );
}

/* ── 18. A link inside a tooltip ──────────────────────────────────── */

function RefundHelp({ reachable }: { reachable: boolean }) {
  const [tip, setTip] = useState(false);
  const [policy, setPolicy] = useState(false);
  return (
    <div className="min-h-32 space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-ui">Refunds</p>
        <div className="relative inline-flex">
          <button
            type="button"
            aria-label="About refunds"
            className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors"
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
          >
            <HelpCircle aria-hidden className="size-4" />
          </button>
          {tip && (
            <span className="bg-primary text-primary-foreground text-caption absolute bottom-full left-1/2 mb-2 w-52 -translate-x-1/2 rounded-lg px-2.5 py-2">
              Money lands back on your card in three to five days.
              {!reachable && (
                <button
                  type="button"
                  className="mt-1 block underline"
                  onClick={() => setPolicy(true)}
                >
                  Read the policy
                </button>
              )}
            </span>
          )}
        </div>
        {reachable && (
          <button
            type="button"
            className="text-ui-sm text-accent-foreground h-9 rounded-lg underline underline-offset-4"
            onClick={() => setPolicy(true)}
          >
            Read the policy
          </button>
        )}
      </div>
      {policy && (
        <p className="text-caption text-muted-foreground max-w-sm">
          Anything bought in the last thirty days can be refunded in full, no
          questions asked.
        </p>
      )}
    </div>
  );
}

/* ── 19. Walking a list with the keyboard ─────────────────────────── */

const PEOPLE = [
  "Ana Ruiz",
  "Ben Okafor",
  "Chi Nakamura",
  "Dara Singh",
  "Eli Fischer",
];

function Recipients({ keyboard }: { keyboard: boolean }) {
  const [items, setItems] = useState(PEOPLE);
  const [active, setActive] = useState(0);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);

  const remove = (i: number) => {
    setItems((list) => list.filter((_, n) => n !== i));
    setActive((a) => Math.max(0, Math.min(a, items.length - 2)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!keyboard) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(
        items.length - 1,
        Math.max(0, active + (e.key === "ArrowDown" ? 1 : -1)),
      );
      setActive(next);
      rows.current[next]?.focus();
    }
    if (e.key === "Backspace" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      remove(active);
    }
  };

  return (
    <div className="max-w-sm" onKeyDown={onKeyDown}>
      {items.map((p, i) => (
        <div key={p} className="flex items-center gap-2">
          <button
            type="button"
            ref={(el) => {
              rows.current[i] = el;
            }}
            tabIndex={keyboard && i !== active ? -1 : 0}
            onClick={() => setActive(i)}
            className={cn(
              "text-ui-sm duration-fast flex h-10 flex-1 items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors",
              i === active
                ? "bg-accent text-accent-foreground"
                : "hover:bg-secondary",
            )}
          >
            <span
              aria-hidden
              className="bg-card text-micro text-muted-foreground flex size-6 items-center justify-center rounded-full border uppercase"
            >
              {p[0]}
            </span>
            {p}
          </button>
          <button
            type="button"
            aria-label={`Remove ${p}`}
            onClick={() => remove(i)}
            className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors"
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      ))}
      {!items.length && (
        <p className="text-caption text-muted-foreground">Nobody left.</p>
      )}
    </div>
  );
}

/* ── 20. Dragging across controls ─────────────────────────────────── */

const RANGES = ["Today", "This week", "This month"];

function Segmented({ clean }: { clean: boolean }) {
  const [range, setRange] = useState(RANGES[1]);
  return (
    <div className={cn("max-w-md space-y-3", clean && "select-none")}>
      <p className="text-ui">Revenue</p>
      <div className="bg-secondary inline-flex rounded-full p-0.5">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={cn(
              "text-ui-sm duration-fast h-9 rounded-full px-3.5 transition-colors",
              range === r
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">
        $12,480 across 96 orders
      </p>
    </div>
  );
}

/* ── 21. A decoration over a button ───────────────────────────────── */

function Promo({ safe }: { safe: boolean }) {
  const [count, setCount] = useState(0);
  return (
    <div className="bg-secondary relative max-w-md overflow-hidden rounded-xl border p-5">
      <p className="text-ui">Two months free on the yearly plan</p>
      <p className="text-caption text-muted-foreground mt-1">
        Switch any time before the trial ends.
      </p>
      <button
        type="button"
        className={cn(btnPrimary, "mt-4")}
        onClick={() => setCount((c) => c + 1)}
      >
        Switch to yearly
      </button>
      <p className="text-caption text-muted-foreground mt-2">
        {count === 0 ? "Not switched yet" : `Pressed ${count}×`}
      </p>
      <div
        data-decoration={safe ? "" : undefined}
        className="bg-accent absolute -bottom-14 left-2 size-44 rounded-full opacity-70 blur-2xl"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function WebInterfaceGuidelinesDemo() {
  return (
    <div>
      <BeforeAfter
        principle="You can press anywhere on the row."
        before={<ViewsBefore />}
        after={<ViewsAfter />}
      />

      <BeforeAfter
        principle="Press a label to start typing, and Enter signs you in."
        before={<SignInBefore />}
        after={<SignInAfter />}
      />

      <BeforeAfter
        principle="The icons sit inside the box, and pressing one starts you typing."
        before={<SearchBefore />}
        after={<SearchAfter />}
      />

      <BeforeAfter
        principle="The switch just takes effect. Nothing to save."
        before={<TogglesBefore />}
        after={<TogglesAfter />}
      />

      <BeforeAfter
        principle="Pressing twice doesn't order twice."
        before={<OrderBefore />}
        after={<OrderAfter />}
      />

      <BeforeAfter
        principle="It tells you what is missing instead of just going grey."
        before={<InviteBefore />}
        after={<InviteAfter />}
      />

      <BeforeAfter
        principle="The button tells you itself, instead of a note in the corner."
        before={<CopyBefore />}
        after={<CopyAfter />}
      />

      <BeforeAfter
        principle="The star fills the moment you press it."
        before={<SavesBefore />}
        after={<SavesAfter />}
      />

      <BeforeAfter
        principle="There is something to press when it is empty."
        before={<EmptyBefore />}
        after={<EmptyAfter />}
      />

      <BeforeAfter
        principle="The price stops jumping around as it changes."
        before={<Seats steady={false} />}
        after={<Seats steady />}
      />

      <BeforeAfter
        principle="The headline fits the space instead of taking it over."
        before={<Headline fluid={false} />}
        after={<Headline fluid />}
      />

      <BeforeAfter
        principle="Sweeping across the tabs does not shove them around."
        before={<TabRow steady={false} />}
        after={<TabRow steady />}
      />

      <BeforeAfter
        principle="Pressing feels like pressing, not like launching something."
        before={<RenameDemo loud />}
        after={<RenameDemo loud={false} />}
      />

      <BeforeAfter
        principle="Adding one is instant, however fast you press."
        before={<TagList showy />}
        after={<TagList showy={false} />}
      />

      <BeforeAfter
        principle="You can see where you landed, instead of arriving behind the bar."
        before={<Docs smooth={false} />}
        after={<Docs smooth />}
      />

      <BeforeAfter
        principle="Press and hold — the menu is open before you let go."
        before={<SortMenu onPress={false} />}
        after={<SortMenu onPress />}
      />

      <BeforeAfter
        principle="You can cut the corner across to the folders without losing them."
        before={<ContextMenu forgiving={false} />}
        after={<ContextMenu forgiving />}
      />

      <BeforeAfter
        principle="The link does not vanish before you can press it."
        before={<RefundHelp reachable={false} />}
        after={<RefundHelp reachable />}
      />

      <BeforeAfter
        principle="Press a row, then walk the list with ↑ ↓ — and ⌘⌫ takes one off."
        before={<Recipients keyboard={false} />}
        after={<Recipients keyboard />}
      />

      <BeforeAfter
        principle="Drag across the buttons — nothing gets smeared in highlight."
        before={<Segmented clean={false} />}
        after={<Segmented clean />}
      />

      <BeforeAfter
        principle="The button works wherever you press it."
        before={<Promo safe={false} />}
        after={<Promo safe />}
      />
    </div>
  );
}
