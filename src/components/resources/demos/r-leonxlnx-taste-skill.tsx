"use client";

import { Check, ImageIcon, User } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Leonxlnx/taste-skill, vendored here as skills/design-taste-frontend
 * (plus skills/high-end-visual-design).
 *
 * Counted: 343 rule bullets across sections 0-14, 62 of them restated as
 * boxes in the Final Pre-Flight Check, plus 40 mapping-table rows.
 *
 * Most of that is process. Brief inference, dial values, which official
 * package to install, redesign audits, SEO migration: nobody looking at
 * the finished page can see any of it. What is left is the part the
 * skill actually exists for, the "AI tells" a person recognises on
 * sight, and each of those is one switch here. Same page, old version
 * and new one, in the same spot.
 *
 * The file itself keeps the skill's most-violated rule: no long dash
 * anywhere, including in these comments.
 */

/* ── shared pieces ────────────────────────────────────────────────── */

/** A miniature page you can scroll inside. */
function Screen({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={label}
      className={cn(
        "bg-secondary focus-visible:border-accent-solid h-64 overflow-y-auto rounded-xl border p-3 outline-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Where a real photograph goes. */
function ImageSlot({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground grid place-items-center rounded-lg",
        className,
      )}
    >
      <ImageIcon className="size-5" aria-hidden />
    </div>
  );
}

function Wordmark({ mark, name }: { mark: string; name: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="bg-secondary text-micro text-muted-foreground grid size-7 place-items-center rounded-md"
      >
        {mark}
      </span>
      <span className="sr-only">{name}</span>
    </span>
  );
}

const TRUST = [
  { mark: "HL", name: "Halyard Logistics" },
  { mark: "CB", name: "Cobalt Bank" },
  { mark: "NR", name: "Norrland Rail" },
  { mark: "PH", name: "Portside Health" },
] as const;

/* ── 1. the hero ──────────────────────────────────────────────────── */

function Hero({ crammed }: { crammed: boolean }) {
  return (
    <Screen label="Landing page, top of the scroll">
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <span className="text-ui-sm">Halyard</span>
          <span className="text-caption text-muted-foreground flex gap-3">
            <span>Product</span>
            <span>Pricing</span>
            <span>Docs</span>
          </span>
        </div>

        <div className={cn(crammed ? "pt-16" : "pt-6")}>
          {crammed && (
            <p className="text-micro text-muted-foreground uppercase">
              Invite-only preview, v0.6
            </p>
          )}
          <h3 className="text-title mt-2 max-w-md">
            The freight desk your dispatchers keep asking for
          </h3>
          <p className="text-caption text-muted-foreground mt-2 max-w-md">
            Every load, every driver, every exception on one screen.
            {crammed &&
              " Built by people who ran a night desk for six years, so the shortcuts are where your hands already go. Works with the tracking you already pay for, and with the spreadsheet you swore you would stop using."}
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="lg" onClick={() => toast("Trial started")}>
              Start free trial
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => toast("Booking a walkthrough")}
            >
              Book a walkthrough
            </Button>
          </div>
          {crammed && (
            <>
              <p className="text-caption text-muted-foreground mt-3">
                Works with Samsara, Motive, and your own ELD feed.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <p className="text-micro text-muted-foreground uppercase">
                  Used by dispatch teams at
                </p>
                {TRUST.map((t) => (
                  <span key={t.mark} className="text-caption">
                    {t.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {!crammed && (
        <>
          <div className="bg-card mt-3 flex items-center gap-4 rounded-xl border px-4 py-3">
            {TRUST.map((t) => (
              <Wordmark key={t.mark} {...t} />
            ))}
          </div>
          <div className="bg-card mt-3 rounded-xl border p-4">
            <h4 className="text-ui">What you get on day one</h4>
            <p className="text-caption text-muted-foreground mt-1.5 max-w-md">
              Built by people who ran a night desk for six years, so the
              shortcuts are where your hands already go. Works with Samsara,
              Motive, and your own ELD feed.
            </p>
          </div>
        </>
      )}
    </Screen>
  );
}

/* ── 2. the buttons ───────────────────────────────────────────────── */

function Buttons({ broken }: { broken: boolean }) {
  return (
    <div className="bg-secondary flex flex-wrap items-start gap-3 rounded-xl border p-4">
      <button
        type="button"
        onClick={() => toast("Opening the work")}
        className={cn(
          "text-ui-sm bg-primary text-primary-foreground duration-fast ease-out-quart h-9 rounded-lg px-4 transition-transform",
          broken ? "h-auto w-24 py-2 uppercase" : "active:translate-y-px",
        )}
      >
        View selected work
      </button>

      <button
        type="button"
        onClick={() => toast("Pricing opened")}
        className={cn(
          "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg px-4 transition-transform",
          broken
            ? "bg-secondary text-secondary"
            : "bg-card text-foreground border active:translate-y-px",
        )}
      >
        See pricing
      </button>

      <button
        type="button"
        onClick={() => toast("Docs opened")}
        className={cn(
          "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg px-4 transition-transform",
          broken
            ? "text-muted-foreground/30"
            : "text-foreground hover:bg-card border border-transparent active:translate-y-px",
        )}
      >
        Read the docs
      </button>
    </div>
  );
}

/* ── 3. one name per thing ────────────────────────────────────────── */

function OneIntent({ scattered }: { scattered: boolean }) {
  const contact = "Contact us";
  return (
    <Screen label="Landing page with contact links">
      <div className="bg-card flex items-center justify-between rounded-xl border px-4 py-3">
        <span className="text-ui-sm">Halyard</span>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => toast("Contact form opened")}
        >
          {scattered ? "Start a project" : contact}
        </Button>
      </div>

      <div className="bg-card mt-3 rounded-xl border p-4">
        <h4 className="text-title">Dispatch, without the phone tree</h4>
        <div className="mt-3 flex gap-2">
          <Button size="lg" onClick={() => toast("Contact form opened")}>
            {scattered ? "Let us talk" : contact}
          </Button>
        </div>
      </div>

      <div className="bg-card mt-3 rounded-xl border p-4">
        <p className="text-caption text-muted-foreground">
          Six people, two time zones, one night desk.
        </p>
        <button
          type="button"
          onClick={() => toast("Contact form opened")}
          className="text-ui-sm mt-2 h-9 underline underline-offset-4"
        >
          {scattered ? "Reach out" : contact}
        </button>
      </div>

      <div className="bg-card mt-3 flex items-center justify-between rounded-xl border px-4 py-3">
        <span className="text-caption text-muted-foreground">Halyard, 2026</span>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => toast("Contact form opened")}
        >
          {scattered ? "Get in touch" : contact}
        </Button>
      </div>
    </Screen>
  );
}

/* ── 4. the section headings ──────────────────────────────────────── */

const HEADINGS = [
  {
    eyebrow: "001 · Capabilities",
    title: "What the desk does",
    body: "Loads, drivers, and exceptions on one screen, with the shortcuts where your hands already go.",
    meta: "Each of these ships today, not on a roadmap. The list will stay short on purpose.",
  },
  {
    eyebrow: "002 · Featured commission",
    title: "Norrland Rail",
    body: "Four hundred daily transfers moved off a shared inbox in under a month.",
    meta: "A quiet piece of work we are still fond of, in its own understated way.",
  },
  {
    eyebrow: "003 · How it works",
    title: "Three steps to the first load",
    body: "Connect your tracking, import your lanes, and put the night desk on it.",
    meta: "No migration project, no professional services engagement, no six-week onboarding.",
  },
] as const;

function Headings({ noisy }: { noisy: boolean }) {
  return (
    <Screen label="Three section headings on the same page">
      <div className="space-y-3">
        {HEADINGS.map((h) => (
          <div key={h.title} className="bg-card rounded-xl border p-4">
            {noisy ? (
              <>
                <p className="text-micro text-muted-foreground uppercase">
                  {h.eyebrow}
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
                  <h4 className="text-title">{h.title}</h4>
                  <p className="text-caption text-muted-foreground">{h.body}</p>
                </div>
                <p className="text-caption text-muted-foreground mt-2">
                  {h.meta}
                </p>
              </>
            ) : (
              <>
                <h4 className="text-title">{h.title}</h4>
                <p className="text-caption text-muted-foreground mt-1.5 max-w-md">
                  {h.body}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ── 5. one colour for "selected" ─────────────────────────────────── */

const VIEWS = [
  { id: "board", label: "Board" },
  { id: "lanes", label: "Lanes" },
  { id: "drivers", label: "Drivers" },
] as const;

const NAV = [
  { id: "today", label: "Today" },
  { id: "exceptions", label: "Exceptions" },
  { id: "archive", label: "Archive" },
] as const;

function AccentLock({ mixed }: { mixed: boolean }) {
  const [view, setView] = useState<string>(VIEWS[0].id);
  const [nav, setNav] = useState<string>(NAV[0].id);

  return (
    <div className="bg-secondary grid gap-3 rounded-xl border p-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <nav aria-label="Sections" className="space-y-1">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setNav(n.id)}
            aria-current={nav === n.id ? "page" : undefined}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart flex h-9 w-full items-center rounded-md px-2.5 transition-colors",
              nav === n.id
                ? mixed
                  ? "bg-positive text-primary-foreground"
                  : "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-card",
            )}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <div className="bg-card rounded-xl border p-3">
        <div className="flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              className={cn(
                "text-ui-sm duration-fast ease-out-quart h-9 rounded-md px-3 transition-colors",
                view === v.id
                  ? mixed
                    ? "bg-destructive/15 text-destructive"
                    : "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-1.5">
          {["Load 4821 to Duluth", "Load 4822 to Fargo"].map((l, i) => (
            <div
              key={l}
              className={cn(
                "flex items-center justify-between rounded-md border px-2.5 py-2",
                i === 0 &&
                  (mixed
                    ? "border-positive bg-positive/10"
                    : "border-accent-solid bg-accent"),
              )}
            >
              <span className="text-ui-sm">{l}</span>
              <span
                className={cn(
                  "text-micro rounded-full px-2 py-1 uppercase",
                  i === 0
                    ? mixed
                      ? "bg-destructive/15 text-destructive"
                      : "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {i === 0 ? "Selected" : "Queued"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 6. the corners ───────────────────────────────────────────────── */

function Corners({ mixed }: { mixed: boolean }) {
  const [note, setNote] = useState("");
  return (
    <div
      className={cn(
        "bg-secondary border p-4",
        mixed ? "rounded-none" : "rounded-2xl",
      )}
    >
      <div
        className={cn(
          "bg-card border p-4",
          mixed ? "rounded-3xl" : "rounded-xl",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              "bg-secondary text-micro text-muted-foreground grid size-8 place-items-center",
              mixed ? "rounded-sm" : "rounded-full",
            )}
          >
            RS
          </span>
          <div>
            <p className="text-ui-sm">Rosa Simonyan</p>
            <p className="text-caption text-muted-foreground">Night desk</p>
          </div>
          <span
            className={cn(
              "text-micro bg-secondary text-muted-foreground ml-auto px-2.5 py-1 uppercase",
              mixed ? "rounded-none" : "rounded-full",
            )}
          >
            On shift
          </span>
        </div>

        <div className="mt-3">
          <Label htmlFor="corner-note" className="text-caption">
            Handover note
          </Label>
          <input
            id="corner-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Two trucks still out"
            className={cn(
              "bg-card text-ui-sm focus-visible:border-accent-solid mt-1.5 h-9 w-full border px-2.5 outline-none",
              mixed ? "rounded-none" : "rounded-md",
            )}
          />
        </div>

        <button
          type="button"
          onClick={() => toast("Handover saved")}
          className={cn(
            "text-ui-sm bg-primary text-primary-foreground mt-3 h-9 px-4 active:translate-y-px",
            mixed ? "rounded-full" : "rounded-md",
          )}
        >
          Save handover
        </button>
      </div>
    </div>
  );
}

/* ── 7. the feature grid ──────────────────────────────────────────── */

const FEATURES = [
  { title: "Live board", body: "Every load and its next checkpoint." },
  { title: "Exceptions", body: "Late, stuck, or silent, in one queue." },
  { title: "Driver chat", body: "Replies land next to the load." },
  { title: "Lane costs", body: "What each run actually earned." },
  { title: "Night handover", body: "The shift note writes itself." },
] as const;

function FeatureGrid({ stamped }: { stamped: boolean }) {
  if (stamped) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <button
            key={f.title}
            type="button"
            onClick={() => toast(`${f.title} opened`)}
            className="bg-card hover:border-border-strong rounded-xl border p-4 text-left transition-colors"
          >
            <p className="text-ui">{f.title}</p>
            <p className="text-caption text-muted-foreground mt-1">{f.body}</p>
          </button>
        ))}
        <div className="bg-card rounded-xl border p-4" aria-hidden />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <button
        type="button"
        onClick={() => toast("Live board opened")}
        className="bg-feature text-feature-foreground border-feature-line flex flex-col justify-between rounded-xl border p-4 text-left sm:col-span-2 sm:row-span-2"
      >
        <div>
          <p className="text-title">{FEATURES[0].title}</p>
          <p className="text-caption mt-1 opacity-70">{FEATURES[0].body}</p>
        </div>
        <ImageSlot className="mt-4 h-20 w-full" />
      </button>

      {FEATURES.slice(1, 3).map((f) => (
        <button
          key={f.title}
          type="button"
          onClick={() => toast(`${f.title} opened`)}
          className="bg-card hover:border-border-strong rounded-xl border p-4 text-left transition-colors"
        >
          <p className="text-ui">{f.title}</p>
          <p className="text-caption text-muted-foreground mt-1">{f.body}</p>
        </button>
      ))}

      {FEATURES.slice(3).map((f) => (
        <button
          key={f.title}
          type="button"
          onClick={() => toast(`${f.title} opened`)}
          className="bg-secondary hover:border-border-strong flex items-center gap-3 rounded-xl border p-4 text-left transition-colors"
        >
          <ImageSlot className="size-10 shrink-0" />
          <span>
            <span className="text-ui block">{f.title}</span>
            <span className="text-caption text-muted-foreground block">
              {f.body}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── 8. the spec sheet ────────────────────────────────────────────── */

const SPECS = [
  { group: "Materials", label: "Body", value: "5-ply stainless" },
  { group: "Materials", label: "Handle", value: "Cast, riveted" },
  { group: "Materials", label: "Lid", value: "Tempered glass" },
  { group: "Cooking", label: "Capacity", value: "6 qt" },
  { group: "Cooking", label: "Oven safe", value: "260 C" },
  { group: "Cooking", label: "Induction", value: "Yes" },
  { group: "Cooking", label: "Weight", value: "2.4 kg" },
  { group: "Care", label: "Dishwasher", value: "Yes" },
  { group: "Care", label: "Warranty", value: "Lifetime" },
  { group: "Care", label: "Made in", value: "Vermont" },
] as const;

const GROUPS = ["Materials", "Cooking", "Care"] as const;

function Specs({ ruled }: { ruled: boolean }) {
  if (ruled) {
    return (
      <div className="bg-card rounded-xl border p-4">
        <ul>
          {SPECS.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between border-t border-b py-2"
            >
              <span className="text-ui-sm text-muted-foreground">{s.label}</span>
              <span className="text-ui-sm tabular-nums">{s.value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2">
          {[
            { label: "Heat evenness", pct: 82 },
            { label: "Sear retention", pct: 64 },
          ].map((b) => (
            <div key={b.label}>
              <p className="text-caption text-muted-foreground">{b.label}</p>
              <div className="bg-secondary mt-1 h-3 w-full rounded-full">
                <div
                  className="bg-primary h-3 rounded-full"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {GROUPS.map((g) => (
        <div key={g} className="bg-card rounded-xl border p-4">
          <p className="text-micro text-muted-foreground uppercase">{g}</p>
          <dl className="mt-2 space-y-1.5">
            {SPECS.filter((s) => s.group === g).map((s) => (
              <div key={s.label} className="flex items-baseline justify-between">
                <dt className="text-ui-sm text-muted-foreground">{s.label}</dt>
                <dd className="text-ui-sm tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <div className="bg-card flex gap-8 rounded-xl border p-4 sm:col-span-3">
        {[
          { label: "Heat evenness", value: "82" },
          { label: "Sear retention", value: "64" },
        ].map((b) => (
          <div key={b.label}>
            <p className="text-title tabular-nums">{b.value}</p>
            <p className="text-caption text-muted-foreground">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 9. waiting for the orders ────────────────────────────────────── */

const ORDERS = [
  { id: "4821", place: "Duluth", amount: "$1,240.00" },
  { id: "4822", place: "Fargo", amount: "$980.50" },
  { id: "4823", place: "Bemidji", amount: "$2,115.75" },
] as const;

function OrderRow({ o }: { o: (typeof ORDERS)[number] }) {
  return (
    <div className="flex h-10 items-center justify-between border-b px-3 last:border-b-0">
      <span className="text-ui-sm">
        Load {o.id}, {o.place}
      </span>
      <span className="text-ui-sm tabular-nums">{o.amount}</span>
    </div>
  );
}

function Orders({ jumpy }: { jumpy: boolean }) {
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function load() {
    if (timer.current) clearTimeout(timer.current);
    setPhase("loading");
    timer.current = setTimeout(() => setPhase("done"), 1100);
  }

  return (
    <div>
      <Button size="lg" variant="secondary" onClick={load}>
        {phase === "done" ? "Load again" : "Load orders"}
      </Button>

      <div className="bg-card mt-3 rounded-xl border">
        {phase === "idle" && (
          <p className="text-caption text-muted-foreground px-3 py-3">
            Nothing loaded yet.
          </p>
        )}

        {phase === "loading" &&
          (jumpy ? (
            <div className="flex items-center justify-center py-3">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : (
            <div>
              {ORDERS.map((o) => (
                <div
                  key={o.id}
                  className="flex h-10 items-center justify-between border-b px-3 last:border-b-0"
                >
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ))}

        {phase === "done" && (
          <div>
            {ORDERS.map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 10. the form ─────────────────────────────────────────────────── */

function ContactForm({ placeholderOnly }: { placeholderOnly: boolean }) {
  const [email, setEmail] = useState("");
  const [lanes, setLanes] = useState("");
  const bad = email.length > 0 && !email.includes("@");

  return (
    <form
      className="max-w-sm space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        toast(bad ? "Fix the email first" : "Request sent");
      }}
    >
      <div>
        {!placeholderOnly && (
          <Label htmlFor="taste-email" className="text-caption">
            Work email
          </Label>
        )}
        {placeholderOnly && bad && (
          <p className="text-caption text-muted-foreground/50">
            Value failed validation
          </p>
        )}
        <Input
          id="taste-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={bad || undefined}
          aria-label={placeholderOnly ? "Work email" : undefined}
          placeholder="Work email"
          className={cn(
            "h-9",
            !placeholderOnly && "mt-1.5",
            placeholderOnly && "placeholder:text-muted-foreground/40",
          )}
        />
        {!placeholderOnly &&
          (bad ? (
            <p className="text-caption text-destructive mt-1.5">
              Add the @ so we can reach you.
            </p>
          ) : (
            <p className="text-caption text-muted-foreground mt-1.5">
              We reply from a person, not a queue.
            </p>
          ))}
      </div>

      <div>
        {!placeholderOnly && (
          <Label htmlFor="taste-lanes" className="text-caption">
            Busiest lane
          </Label>
        )}
        <Input
          id="taste-lanes"
          value={lanes}
          onChange={(e) => setLanes(e.target.value)}
          aria-label={placeholderOnly ? "Busiest lane" : undefined}
          placeholder="Busiest lane"
          className={cn(
            "h-9",
            !placeholderOnly && "mt-1.5",
            placeholderOnly && "placeholder:text-muted-foreground/40",
          )}
        />
      </div>

      <Button size="lg" type="submit">
        Request access
      </Button>
    </form>
  );
}

/* ── 11. the testimonial ──────────────────────────────────────────── */

/**
 * The long dash is written as an escape so that this file contains zero
 * of them as characters, which is the skill's Section 9.G rule. It is
 * still rendered on the "before" side, because that is the tell.
 */
const LONG_DASH = "\u2014";

const GENERIC_QUOTE = `"This platform has been an absolutely game-changing addition to our operational stack ${LONG_DASH} from the very first week of onboarding, the team was able to unlock a level of visibility we simply did not have before, and the results speak for themselves. Honestly, we cannot imagine going back to the way things were."`;

function Testimonial({ generic }: { generic: boolean }) {
  return (
    <div className="bg-card max-w-lg rounded-xl border p-5">
      {generic ? (
        <p className="text-ui">
          {GENERIC_QUOTE}
        </p>
      ) : (
        <p className="text-ui">
          &ldquo;Our night desk stopped guessing. The first week we caught four
          late loads before the customer did.&rdquo;
        </p>
      )}

      <div className="mt-4 flex items-center gap-2.5">
        {generic ? (
          <span
            aria-hidden
            className="bg-secondary text-muted-foreground grid size-9 place-items-center rounded-full"
          >
            <User className="size-4" />
          </span>
        ) : (
          <span
            aria-hidden
            className="bg-feature text-feature-foreground text-micro grid size-9 place-items-center rounded-full"
          >
            PR
          </span>
        )}
        <div>
          <p className="text-ui-sm">
            {generic ? `${LONG_DASH} Sarah` : "Priya Raghunathan"}
          </p>
          <p className="text-caption text-muted-foreground">
            {generic
              ? "CEO, Acme Inc"
              : "Head of dispatch, Halyard Logistics"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-8 border-t pt-3">
        <div>
          <p className="text-title tabular-nums">
            {generic ? "99.99%" : "97.4%"}
          </p>
          <p className="text-caption text-muted-foreground">On-time pickups</p>
        </div>
        <div>
          <p className="text-title tabular-nums">{generic ? "50%" : "31%"}</p>
          <p className="text-caption text-muted-foreground">Fewer check calls</p>
        </div>
      </div>
    </div>
  );
}

/* ── 12. the words ────────────────────────────────────────────────── */

function Copy({ slop }: { slop: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card max-w-lg rounded-xl border p-5">
      <p className="text-micro text-muted-foreground uppercase">
        {slop ? "From the field" : "Customer stories"}
      </p>
      <h4 className="text-title mt-2">
        {slop
          ? "Elevate your logistics with a seamless, next-gen operations layer"
          : "Move a night desk off email in an afternoon"}
      </h4>
      <p className="text-ui text-muted-foreground mt-2">
        {slop
          ? "Our revolutionary platform unleashes the power of your data to drive frictionless outcomes at scale. We build slowly, and we respect the French ones."
          : "Import your lanes, connect the tracker you already pay for, and watch the first load appear on the board."}
      </p>

      {open && (
        <p className="text-ui text-muted-foreground mt-2">
          {slop
            ? "Quietly in use at forward-thinking enterprises who understand that logistics is, at its heart, a story about people. To put it on the table: we plan to stay that way."
            : "Nothing to migrate. If it does not fit your lanes in a week, we refund the month and export your data as CSV."}
        </p>
      )}

      <Button
        size="lg"
        variant="secondary"
        className="mt-3"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? "Show less" : "Show more"}
      </Button>
    </div>
  );
}

/* ── 13. the decoration ───────────────────────────────────────────── */

const CHROME_NAV = [
  { id: "work", label: "Work" },
  { id: "studio", label: "Studio" },
  { id: "journal", label: "Journal" },
] as const;

function Chrome({ decorated }: { decorated: boolean }) {
  const [tab, setTab] = useState<string>(CHROME_NAV[0].id);

  return (
    <Screen label="Page chrome, top to bottom">
      <div className="bg-card rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav aria-label="Sections" className="flex gap-1">
            {CHROME_NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setTab(n.id)}
                aria-current={tab === n.id ? "page" : undefined}
                className={cn(
                  "text-ui-sm duration-fast ease-out-quart flex h-9 items-center gap-1.5 rounded-md px-2.5 transition-colors",
                  tab === n.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {decorated && (
                  <span
                    aria-hidden
                    className="bg-positive size-1.5 rounded-full"
                  />
                )}
                {n.label}
              </button>
            ))}
          </nav>
          {decorated && (
            <span className="text-micro text-muted-foreground uppercase">
              LIS 14:23 · 18 C · ESTD. 2018
            </span>
          )}
        </div>

        <h4 className="text-title mt-6">Brand, motion, and spatial work</h4>
        <p className="text-caption text-muted-foreground mt-1.5 max-w-md">
          A studio of six, working with founders who ship.
        </p>

        {decorated && (
          <>
            <p className="text-micro text-muted-foreground mt-6 uppercase">
              Brand. Motion. Spatial. · Type / Form / Motion · Design · Build ·
              Ship
            </p>
            <p className="text-caption text-muted-foreground mt-3">
              Scroll to explore
            </p>
          </>
        )}
      </div>

      <div className="bg-card mt-3 rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="bg-positive size-1.5 rounded-full" />
          <span className="text-ui-sm">One slot open for Q4</span>
        </div>
        <p className="text-caption text-muted-foreground mt-1.5">
          Projects start in October.
        </p>
      </div>

      <div className="bg-card mt-3 flex items-center justify-between rounded-xl border px-4 py-3">
        <span className="text-caption text-muted-foreground">
          {decorated
            ? "v1.4.2 · Build 0048 · last sync 4s ago · main"
            : "Studio Halyard, 2026"}
        </span>
        <span className="text-caption text-muted-foreground flex gap-3">
          <span>Contact</span>
          <span>Privacy</span>
        </span>
      </div>
    </Screen>
  );
}

/* ── 14. what moves ───────────────────────────────────────────────── */

const TASKS = [
  { id: "a", label: "Confirm the Duluth pickup" },
  { id: "b", label: "Reassign load 4822" },
  { id: "c", label: "Call back Norrland Rail" },
  { id: "d", label: "Close the night handover" },
] as const;

function MotionList({ restless }: { restless: boolean }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState<string[]>([]);
  const open = TASKS.filter((t) => !done.includes(t.id));

  return (
    <div>
      {restless && (
        <div className="bg-secondary mb-3 overflow-hidden rounded-lg border py-2">
          <motion.p
            className="text-micro text-muted-foreground w-max uppercase"
            animate={reduce ? undefined : { x: ["0%", "-50%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            Dispatch. Tracking. Settlement. Dispatch. Tracking. Settlement.
            Dispatch. Tracking. Settlement. Dispatch. Tracking. Settlement.
          </motion.p>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {open.map((t) =>
            restless ? (
              <motion.div
                key={t.id}
                animate={reduce ? undefined : { y: [0, -3, 0], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="bg-card flex items-center justify-between rounded-xl border px-3 py-2.5"
              >
                <span className="text-ui-sm">{t.label}</span>
                <button
                  type="button"
                  aria-label={`Mark "${t.label}" done`}
                  onClick={() => setDone((d) => [...d, t.id])}
                  className="text-muted-foreground hover:bg-secondary grid size-9 place-items-center rounded-md"
                >
                  <Check className="size-4" aria-hidden />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={t.id}
                layout
                exit={
                  reduce ? { opacity: 0 } : { opacity: 0, x: 24, height: 0 }
                }
                transition={{ duration: duration.base, ease: ease.outQuart }}
                className="bg-card flex items-center justify-between rounded-xl border px-3 py-2.5"
              >
                <span className="text-ui-sm">{t.label}</span>
                <button
                  type="button"
                  aria-label={`Mark "${t.label}" done`}
                  onClick={() => setDone((d) => [...d, t.id])}
                  className="text-muted-foreground hover:bg-secondary grid size-9 place-items-center rounded-md active:translate-y-px"
                >
                  <Check className="size-4" aria-hidden />
                </button>
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>

      {open.length < TASKS.length && (
        <Button
          size="lg"
          variant="secondary"
          className="mt-3"
          onClick={() => setDone([])}
        >
          Bring them back
        </Button>
      )}
    </div>
  );
}

/* ── 15. the shape of the page ────────────────────────────────────── */

const RHYTHM = [
  { title: "The board", body: "Every load and its next checkpoint." },
  { title: "The exceptions queue", body: "Late, stuck, or silent, in one list." },
  { title: "The handover", body: "The shift note writes itself." },
  { title: "The numbers", body: "What each lane actually earned." },
] as const;

function Rhythm({ zigzag }: { zigzag: boolean }) {
  if (zigzag) {
    return (
      <Screen label="Four sections, scrolled">
        <div className="space-y-3">
          {RHYTHM.map((s, i) => (
            <div key={s.title} className="bg-card rounded-xl border p-4">
              <div
                className={cn(
                  "flex flex-col items-center gap-4 sm:flex-row",
                  i % 2 === 1 && "sm:flex-row-reverse",
                )}
              >
                <ImageSlot className="h-20 w-full sm:w-1/2" />
                <div className="w-full sm:w-1/2">
                  <p className="text-ui">{s.title}</p>
                  <p className="text-caption text-muted-foreground mt-1">
                    {s.body}
                  </p>
                  <button
                    type="button"
                    onClick={() => toast(`${s.title} opened`)}
                    className="text-ui-sm mt-2 h-9 underline underline-offset-4"
                  >
                    See it
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Screen>
    );
  }

  return (
    <Screen label="Four sections, scrolled">
      <div className="space-y-3">
        <div className="bg-card grid items-center gap-4 rounded-xl border p-4 sm:grid-cols-2">
          <ImageSlot className="h-20 w-full" />
          <div>
            <p className="text-ui">{RHYTHM[0].title}</p>
            <p className="text-caption text-muted-foreground mt-1">
              {RHYTHM[0].body}
            </p>
            <button
              type="button"
              onClick={() => toast(`${RHYTHM[0].title} opened`)}
              className="text-ui-sm mt-2 h-9 underline underline-offset-4"
            >
              See it
            </button>
          </div>
        </div>

        <div className="bg-feature text-feature-foreground border-feature-line rounded-xl border p-5">
          <p className="text-title max-w-sm">{RHYTHM[1].title}</p>
          <p className="text-caption mt-1.5 max-w-sm opacity-70">
            {RHYTHM[1].body}
          </p>
          <button
            type="button"
            onClick={() => toast(`${RHYTHM[1].title} opened`)}
            className="text-ui-sm mt-2 h-9 underline underline-offset-4"
          >
            See it
          </button>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <p className="text-ui">{RHYTHM[2].title}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {["22:00 count", "Open exceptions", "Handover note"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toast(`${c} opened`)}
                className="bg-secondary hover:border-border-strong rounded-lg border p-3 text-left transition-colors"
              >
                <span className="text-ui-sm block">{c}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card flex items-center gap-6 rounded-xl border p-4">
          <div>
            <p className="text-title tabular-nums">31%</p>
            <p className="text-caption text-muted-foreground">
              Fewer check calls
            </p>
          </div>
          <p className="text-caption text-muted-foreground max-w-xs">
            {RHYTHM[3].body}
          </p>
          <button
            type="button"
            onClick={() => toast(`${RHYTHM[3].title} opened`)}
            className="text-ui-sm ml-auto h-9 underline underline-offset-4"
          >
            See it
          </button>
        </div>
      </div>
    </Screen>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function LeonxlnxTasteSkillDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The button you came for is on screen before you scroll."
        before={<Hero crammed />}
        after={<Hero crammed={false} />}
      />

      <BeforeAfter
        principle="You can read every button, and it answers when you press it."
        before={<Buttons broken />}
        after={<Buttons broken={false} />}
      />

      <BeforeAfter
        principle="The same thing is called the same thing everywhere."
        before={<OneIntent scattered />}
        after={<OneIntent scattered={false} />}
      />

      <BeforeAfter
        principle="You can find the headings again."
        before={<Headings noisy />}
        after={<Headings noisy={false} />}
      />

      <BeforeAfter
        principle="One colour means the thing you picked."
        before={<AccentLock mixed />}
        after={<AccentLock mixed={false} />}
      />

      <BeforeAfter
        principle="The corners agree with each other."
        before={<Corners mixed />}
        after={<Corners mixed={false} />}
      />

      <BeforeAfter
        principle="There is no blank tile, and the important one looks important."
        before={<FeatureGrid stamped />}
        after={<FeatureGrid stamped={false} />}
      />

      <BeforeAfter
        principle="You can find the one line you were looking for."
        before={<Specs ruled />}
        after={<Specs ruled={false} />}
      />

      <BeforeAfter
        principle="Nothing jumps when the orders arrive."
        before={<Orders jumpy />}
        after={<Orders jumpy={false} />}
      />

      <BeforeAfter
        principle="You can still tell what each box is for after you type in it."
        before={<ContactForm placeholderOnly />}
        after={<ContactForm placeholderOnly={false} />}
      />

      <BeforeAfter
        principle="It reads like a person said it."
        before={<Testimonial generic />}
        after={<Testimonial generic={false} />}
      />

      <BeforeAfter
        principle="It says what the thing actually does."
        before={<Copy slop />}
        after={<Copy slop={false} />}
      />

      <BeforeAfter
        principle="The decoration is gone, so the links are easy to find."
        before={<Chrome decorated />}
        after={<Chrome decorated={false} />}
      />

      <BeforeAfter
        principle="Only the thing you changed moves."
        before={<MotionList restless />}
        after={<MotionList restless={false} />}
      />

      <BeforeAfter
        principle="The page stops repeating the same shape."
        before={<Rhythm zigzag />}
        after={<Rhythm zigzag={false} />}
      />
    </div>
  );
}
