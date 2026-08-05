"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  RefreshCw,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * tasteskill — the anti-slop frontend skill.
 *
 * Vendored at skills/design-taste-frontend/SKILL.md: 14 sections and
 * three appendices, roughly 300 rules, ending in a 62-box pre-flight
 * check. Most of it is the same move made over and over: the model
 * reaches for a default, the default is the tell, here is what to do
 * instead.
 *
 * The ones a person can *see* are switches here. Left out: everything
 * that happens before a pixel exists (brief inference, the three dials,
 * which design system to install, the redesign audit protocol, the
 * block-library contract), and the checks that live off-screen (bundle
 * size, Core Web Vitals, z-index scales, reduced motion, dark mode
 * parity), because a visitor cannot press them.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/* ── 1 · the top of the page ──────────────────────────────────────── */

function HeroPair({ after }: Side) {
  const [started, setStarted] = useState(false);

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button size="lg" onClick={() => setStarted(true)}>
        {started ? (
          <>
            <Check aria-hidden="true" /> Trial started
          </>
        ) : (
          "Start free trial"
        )}
      </Button>
      <Button size="lg" variant="outline">
        Watch the tour
      </Button>
    </div>
  );

  return (
    <div className="bg-background mx-auto h-72 w-full max-w-md overflow-y-auto rounded-xl border">
      {after ? (
        <div className="space-y-4 px-5 py-8">
          <h4 className="text-title text-balance">
            Ship the release notes with the release.
          </h4>
          <p className="text-caption text-muted-foreground">
            Marlow writes your changelog from merged pull requests, so nobody
            has to remember what went out.
          </p>
          {actions}
        </div>
      ) : (
        <div className="space-y-4 px-5 pt-20 pb-8">
          <p className="text-micro text-muted-foreground uppercase">
            V0.6 · Invite-only preview
          </p>
          <h4 className="text-title text-balance">
            Ship the release notes with the release, every single time, without
            anyone having to remember what went out this week.
          </h4>
          <p className="text-caption text-muted-foreground">
            Marlow reads every merged pull request, groups the work by area,
            writes the changelog in your voice, posts it where your team already
            reads, and keeps a searchable history of every version you have ever
            shipped.
          </p>
          <p className="text-caption text-muted-foreground">
            Works with GitHub, GitLab and self-hosted Git.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {["Wanderloom", "Bright Harbor", "Kestrel Freight"].map((n) => (
              <span
                key={n}
                className="text-micro text-muted-foreground bg-secondary rounded-full px-2.5 py-1 uppercase"
              >
                {n}
              </span>
            ))}
          </div>
          <p className="text-caption text-muted-foreground">
            Free for solo, 10 dollars per person for teams.
          </p>
          {actions}
        </div>
      )}
    </div>
  );
}

/* ── 2 · the menu across the top ──────────────────────────────────── */

const NAV = [
  { long: "Product overview", short: "Product" },
  { long: "Solutions for teams", short: "Teams" },
  { long: "Developer documentation", short: "Docs" },
  { long: "Pricing and plans", short: "Pricing" },
  { long: "Customer stories", short: "Customers" },
  { long: "Changelog and releases", short: "Changelog" },
  { long: "Company and careers", short: "Company" },
  { long: "Support and contact", short: "Support" },
];

function NavPair({ after }: Side) {
  const [active, setActive] = useState("Product overview");
  const [more, setMore] = useState(false);
  const visible = after ? NAV.slice(0, 5) : NAV;
  const hidden = after ? NAV.slice(5) : [];

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className={cn(
          "bg-card relative rounded-xl border px-3",
          after ? "py-2.5" : "py-5",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          <span className="text-ui-sm mr-2 font-semibold">Marlow</span>
          {visible.map((item) => (
            <button
              key={item.long}
              type="button"
              onClick={() => setActive(item.long)}
              aria-pressed={active === item.long}
              className={cn(
                "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg px-2.5 transition-colors",
                active === item.long
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {after ? item.short : item.long}
            </button>
          ))}
          {after && (
            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              aria-expanded={more}
              className="text-ui-sm text-muted-foreground hover:text-foreground duration-fast h-9 rounded-lg px-2.5 transition-colors"
            >
              More
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "duration-fast ml-1 inline size-3.5 transition-transform",
                  more && "rotate-180",
                )}
              />
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {after && more && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className="bg-card shadow-floating absolute right-3 z-10 mt-1 w-48 rounded-xl p-1"
            >
              {hidden.map((item) => (
                <button
                  key={item.long}
                  type="button"
                  onClick={() => {
                    setActive(item.long);
                    setMore(false);
                  }}
                  className="text-ui-sm hover:bg-secondary block h-9 w-full rounded-lg px-2.5 text-left"
                >
                  {item.short}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="text-caption text-muted-foreground mt-2">{active}</p>
    </div>
  );
}

/* ── 3 · one button, one line ─────────────────────────────────────── */

const WORK = [
  "Kestrel Freight, booking flow",
  "Wanderloom, brand and site",
  "Bright Harbor Labs, dashboard",
];

function CtaPair({ after }: Side) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-sm">
      {after ? (
        <Button size="lg" onClick={() => setOpen((v) => !v)}>
          View work
          <ArrowRight aria-hidden="true" />
        </Button>
      ) : (
        <div className="flex flex-wrap items-start gap-2">
          <Button
            size="lg"
            onClick={() => setOpen((v) => !v)}
            className="h-auto w-32 py-2 whitespace-normal"
          >
            View selected work from the archive
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setOpen((v) => !v)}
            className="h-auto w-32 py-2 whitespace-normal"
          >
            Browse all of our projects
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setOpen((v) => !v)}
            className="h-auto w-32 py-2 whitespace-normal"
          >
            See what we have made
          </Button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="mt-3 overflow-hidden"
          >
            {WORK.map((w) => (
              <li key={w} className="text-ui-sm border-t py-2.5 first:border-t-0">
                {w}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 4 · a button you can read ────────────────────────────────────── */

function ContrastPair({ after }: Side) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-secondary mx-auto w-full max-w-sm rounded-xl border p-5">
      <p className="text-ui">Move Kestrel Freight to the new plan?</p>
      <p className="text-caption text-muted-foreground mt-1">
        Billing changes on the first of next month.
      </p>
      <div className="mt-4 flex gap-2">
        {after ? (
          <>
            <Button size="lg" onClick={() => setSaved(true)}>
              {saved ? "Moved" : "Move plan"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setSaved(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSaved(true)}
              className="bg-card text-card-foreground/20 h-9 rounded-lg px-3 text-sm font-medium"
            >
              {saved ? "Moved" : "Move plan"}
            </button>
            <button
              type="button"
              onClick={() => setSaved(false)}
              className="text-secondary-foreground/25 h-9 rounded-lg px-3 text-sm font-medium"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 5 · the name of the box stays ────────────────────────────────── */

function FormPair({ after }: Side) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const bad = tried && !email.includes("@");

  return (
    <form
      className="mx-auto w-full max-w-sm space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
      }}
    >
      {after ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="ts-name">Full name</Label>
            <Input
              id="ts-name"
              className="h-9"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ts-email">Work email</Label>
            <Input
              id="ts-email"
              className="h-9"
              value={email}
              aria-invalid={bad}
              aria-describedby="ts-email-help"
              onChange={(e) => setEmail(e.target.value)}
            />
            <p
              id="ts-email-help"
              className={cn(
                "text-caption",
                bad ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {bad
                ? "That address is missing an @. Try name@studio.com"
                : "We send the invoice here."}
            </p>
          </div>
        </>
      ) : (
        <>
          <Input
            aria-label="Full name"
            className="h-9"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            aria-label="Work email"
            className="h-9"
            placeholder="Work email"
            value={email}
            aria-invalid={bad}
            onChange={(e) => setEmail(e.target.value)}
          />
        </>
      )}
      <Button size="lg" type="submit" variant="outline">
        Create account
      </Button>
    </form>
  );
}

/* ── 6 · what loading looks like ──────────────────────────────────── */

const RELEASES = [
  ["v4.12", "Booking flow, 9 changes"],
  ["v4.11", "Search, 3 changes"],
  ["v4.10", "Billing, 14 changes"],
  ["v4.9", "Onboarding, 2 changes"],
];

function LoadingPair({ after }: Side) {
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = () => {
    if (timer.current) clearTimeout(timer.current);
    setBusy(true);
    timer.current = setTimeout(() => setBusy(false), 1600);
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <Button size="lg" variant="outline" onClick={reload}>
        <RefreshCw aria-hidden="true" />
        Reload releases
      </Button>

      <div className="mt-3">
        {busy ? (
          after ? (
            <div>
              {RELEASES.map(([v]) => (
                <div key={v} className="flex items-center gap-3 border-t py-3 first:border-t-0">
                  <div className="bg-muted h-4 w-12 animate-pulse rounded-md" />
                  <div className="bg-muted h-4 w-40 animate-pulse rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center">
              <Spinner className="text-muted-foreground size-5" />
            </div>
          )
        ) : (
          <div>
            {RELEASES.map(([v, label]) => (
              <div key={v} className="flex items-center gap-3 border-t py-3 first:border-t-0">
                <span className="text-ui-sm w-12 tabular-nums">{v}</span>
                <span className="text-ui-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 7 · the button gives way ─────────────────────────────────────── */

function PressPair({ after }: Side) {
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState(128);

  const toggle = () => {
    setSaved((v) => !v);
    setCount((c) => (saved ? c - 1 : c + 1));
  };

  return (
    <div className="mx-auto flex w-full max-w-sm items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        className={cn(
          "text-ui-sm flex h-9 items-center gap-2 rounded-lg border px-3",
          after
            ? "duration-instant ease-out-quart transition-[transform,background-color,color] active:translate-y-px active:scale-95 hover:bg-secondary"
            : "transition-none",
          saved && "bg-secondary",
        )}
      >
        <Heart
          aria-hidden="true"
          className={cn("size-4", saved && "fill-current")}
        />
        {saved ? "Saved" : "Save"}
      </button>
      <span className="text-ui-sm text-muted-foreground tabular-nums">
        <NumberFlow value={count} data-numeric /> people saved this
      </span>
    </div>
  );
}

/* ── 8 · movement that means something ────────────────────────────── */

const JOBS = [
  "Kestrel Freight, booking flow",
  "Wanderloom, brand and site",
  "Bright Harbor Labs, dashboard",
];

function MotionPair({ after }: Side) {
  const [syncing, setSyncing] = useState(true);

  return (
    <div className="mx-auto w-full max-w-sm">
      {!after && (
        <div className="bg-secondary mb-3 overflow-hidden rounded-lg py-1.5">
          <motion.p
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
            className="text-micro text-muted-foreground whitespace-nowrap uppercase"
          >
            {"Build · Ship · Repeat · Build · Ship · Repeat · ".repeat(4)}
          </motion.p>
        </div>
      )}

      <div className="bg-card rounded-xl border">
        {JOBS.map((job, i) => (
          <div
            key={job}
            className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0"
          >
            {after ? (
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  i === 0 && syncing ? "bg-accent-solid" : "bg-transparent",
                )}
              />
            ) : (
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  delay: i * 0.2,
                }}
                className="bg-positive size-1.5 shrink-0 rounded-full"
              />
            )}
            <span className="text-ui-sm flex-1">{job}</span>
            {after ? (
              i === 0 && syncing ? (
                <Spinner className="text-muted-foreground size-3.5" />
              ) : (
                <Check
                  aria-hidden="true"
                  className="text-muted-foreground size-3.5"
                />
              )
            ) : (
              <motion.span
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.3 }}
              >
                <Check
                  aria-hidden="true"
                  className="text-muted-foreground size-3.5"
                />
              </motion.span>
            )}
          </div>
        ))}
      </div>

      <Button
        size="lg"
        variant="outline"
        className="mt-3"
        onClick={() => setSyncing((v) => !v)}
      >
        {syncing ? "Finish sync" : "Sync again"}
      </Button>
    </div>
  );
}

/* ── 9 · one colour, one job ──────────────────────────────────────── */

const PLANS = [
  { id: "solo", name: "Solo", price: 0, note: "One person" },
  { id: "team", name: "Team", price: 10, note: "Per person" },
  { id: "studio", name: "Studio", price: 24, note: "Per person" },
];

function AccentPair({ after }: Side) {
  const [picked, setPicked] = useState("team");

  return (
    <div className="mx-auto grid w-full max-w-md gap-2 sm:grid-cols-3">
      {PLANS.map((p, i) => {
        const on = picked === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setPicked(p.id)}
            aria-pressed={on}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              after
                ? on
                  ? "bg-accent text-accent-foreground border-transparent"
                  : "bg-card hover:bg-secondary"
                : [
                    "bg-card",
                    i === 0 && "border-positive/40",
                    i === 1 && "border-destructive/40",
                    i === 2 && "bg-feature text-feature-foreground border-transparent",
                  ],
            )}
          >
            <span className="text-ui-sm block font-semibold">{p.name}</span>
            <span
              className={cn(
                "text-title mt-1 block tabular-nums",
                !after && i === 0 && "text-positive",
                !after && i === 1 && "text-destructive",
              )}
            >
              {p.price === 0 ? "Free" : `$${p.price}`}
            </span>
            <span
              className={cn(
                "text-caption mt-1 block",
                after
                  ? on
                    ? ""
                    : "text-muted-foreground"
                  : i === 2
                    ? ""
                    : "text-muted-foreground",
              )}
            >
              {p.note}
            </span>
            {!after && i === 1 && (
              <span className="text-micro bg-feature text-feature-foreground mt-3 inline-block rounded-full px-2 py-1 uppercase">
                Most popular
              </span>
            )}
            {after && on && (
              <span className="text-micro mt-3 inline-flex items-center gap-1 uppercase">
                <Check aria-hidden="true" className="size-3" /> Selected
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── 10 · corners that agree ──────────────────────────────────────── */

function ShapePair({ after }: Side) {
  const [note, setNote] = useState("");

  return (
    <div
      className={cn(
        "bg-card mx-auto w-full max-w-sm border p-5",
        after ? "rounded-xl" : "rounded-none",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "bg-secondary text-ui-sm flex size-9 items-center justify-center",
            after ? "rounded-full" : "rounded-md",
          )}
        >
          PR
        </span>
        <div>
          <p className="text-ui-sm">Priya Raghunathan</p>
          <p className="text-caption text-muted-foreground">
            Head of platform
          </p>
        </div>
        <span
          className={cn(
            "text-micro bg-secondary text-muted-foreground ml-auto px-2 py-1 uppercase",
            after ? "rounded-md" : "rounded-3xl",
          )}
        >
          Owner
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="ts-note">Add a note</Label>
        <Input
          id="ts-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={cn("h-9", after ? "rounded-lg" : "rounded-3xl")}
        />
      </div>

      <button
        type="button"
        onClick={() => setNote("")}
        className={cn(
          "bg-primary text-primary-foreground text-ui-sm mt-3 h-9 px-3",
          after ? "rounded-lg" : "rounded-full",
        )}
      >
        Clear
      </button>
    </div>
  );
}

/* ── 11 · a long list of facts ────────────────────────────────────── */

const SPECS: {
  group: string;
  items: [string, string, string][];
}[] = [
  {
    group: "Materials",
    items: [
      ["Body", "5-ply stainless", "Heats evenly on induction."],
      ["Handle", "Cast, riveted", "Stays cool on the hob."],
      ["Lid", "Tempered glass", "You can watch without lifting."],
    ],
  },
  {
    group: "Cooking",
    items: [
      ["Capacity", "6 quarts", "Feeds four with leftovers."],
      ["Oven safe", "260 C", "Sear then finish in the oven."],
      ["Weight", "3.1 kg", "Heavy enough to sit still."],
      ["Diameter", "24 cm", "Fits a standard burner."],
    ],
  },
  {
    group: "Warranty",
    items: [
      ["Cover", "Lifetime", "Against manufacturing faults."],
      ["Repairs", "In house", "Rivets replaced, not the pan."],
      ["Returns", "60 days", "Cook with it first."],
    ],
  },
];

const FLAT = SPECS.flatMap((g) => g.items);

function SpecPair({ after }: Side) {
  const [open, setOpen] = useState<string | null>(null);

  const row = (spec: [string, string, string], flat: boolean) => (
    <button
      key={spec[0]}
      type="button"
      onClick={() => setOpen((v) => (v === spec[0] ? null : spec[0]))}
      aria-expanded={open === spec[0]}
      className={cn(
        "block w-full text-left",
        flat
          ? "border-t border-b px-1 py-2"
          : "bg-card hover:bg-secondary rounded-lg border p-3 transition-colors",
      )}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-ui-sm text-muted-foreground">{spec[0]}</span>
        <span className="text-ui-sm tabular-nums">{spec[1]}</span>
      </span>
      <AnimatePresence initial={false}>
        {open === spec[0] && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="text-caption text-muted-foreground block overflow-hidden"
          >
            {spec[2]}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (!after) {
    return (
      <div className="mx-auto w-full max-w-sm">
        {FLAT.map((s) => row(s, true))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      {SPECS.map((g) => (
        <div key={g.group}>
          <p className="text-ui-sm mb-2 font-semibold">{g.group}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.items.map((s) => row(s, false))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 12 · a tiny label above every heading ────────────────────────── */

const SECTIONS: [string, string, string][] = [
  [
    "Selected work",
    "Built for the second thousandth use",
    "Three projects, each one still running in production.",
  ],
  [
    "The hardware",
    "Every edge is a hairline",
    "One material, one radius, no decoration on top.",
  ],
  [
    "Four colourways",
    "One accent, and it only marks state",
    "Sage, ink, bone and rust. Nothing glows.",
  ],
  [
    "How it works",
    "A grey canvas, white panels on top",
    "The contrast between the two is the entire layout.",
  ],
  [
    "Pricing",
    "Free while this is alpha",
    "One plan, no seats, cancel by closing the tab.",
  ],
  [
    "Get started",
    "Open it and begin",
    "No install, no account for the first project.",
  ],
];

function EyebrowPair({ after }: Side) {
  const [open, setOpen] = useState(0);
  /* One eyebrow per three sections. Six sections, so two. */
  const allowed = after ? [0, 3] : [0, 1, 2, 3, 4, 5];

  return (
    <div className="bg-background mx-auto h-72 w-full max-w-sm divide-y overflow-y-auto rounded-xl border">
      {SECTIONS.map(([eyebrow, headline, body], i) => (
        <button
          key={headline}
          type="button"
          onClick={() => setOpen(i)}
          aria-expanded={open === i}
          className="hover:bg-secondary block w-full px-4 py-4 text-left transition-colors"
        >
          {allowed.includes(i) && (
            <span className="text-micro text-muted-foreground block uppercase">
              {eyebrow}
            </span>
          )}
          <span className="text-ui block pt-1 font-semibold">{headline}</span>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.span
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                className="text-caption text-muted-foreground block overflow-hidden"
              >
                {body}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      ))}
    </div>
  );
}

/* ── 13 · everything nobody asked for ─────────────────────────────── */

const TABS = ["Work", "Studio", "Contact"];
const TAB_COPY: Record<string, string> = {
  Work: "Nine projects since 2018, three of them still shipping weekly.",
  Studio: "Four people, one room, no account managers.",
  Contact: "Write to hello@marlow.studio and someone answers the same day.",
};

function DecorationPair({ after }: Side) {
  const [tab, setTab] = useState("Work");

  return (
    <div className="bg-card mx-auto w-full max-w-sm rounded-xl border p-4">
      <div className="flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={cn(
              "text-ui-sm duration-fast h-9 rounded-lg px-2.5 transition-colors",
              tab === t
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {!after && (
              <span className="bg-positive mr-1.5 inline-block size-1.5 rounded-full align-middle" />
            )}
            {t}
          </button>
        ))}
        {!after && (
          <span className="text-micro text-muted-foreground ml-auto uppercase">
            LIS 14:23 · 18°C
          </span>
        )}
      </div>

      <div className="mt-4">
        {!after && (
          <p className="text-micro text-muted-foreground uppercase">
            00 / Index · Est. 2018
          </p>
        )}
        <p className="text-title mt-1">{tab}</p>
        <p className="text-caption text-muted-foreground mt-1">
          {TAB_COPY[tab]}
        </p>
      </div>

      <div className="bg-secondary relative mt-4 h-24 rounded-lg">
        {!after && (
          <span className="text-micro text-muted-foreground absolute bottom-2 left-2 uppercase">
            Plate 03 · House archive
          </span>
        )}
      </div>

      {!after && (
        <p className="text-micro text-muted-foreground mt-3 text-center uppercase">
          ↓ Scroll to explore
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-caption text-muted-foreground">
          hello@marlow.studio
        </span>
        {!after && (
          <span className="text-micro text-muted-foreground uppercase">
            v1.4.2 · Build 0048 · last sync 4s ago
          </span>
        )}
      </div>
    </div>
  );
}

/* ── 14 · real people, honest numbers ─────────────────────────────── */

const VOICES = [
  {
    initials: "PR",
    name: "Priya Raghunathan",
    role: "Head of platform, Wanderloom",
    fake: "Sarah",
    short:
      "We stopped writing release notes by hand. The draft is ready before the deploy finishes.",
    long: "Honestly — and I mean this — the platform has been a total game changer for our whole team. We were completely drowning in manual work before we found it, and now everything just flows. It has elevated our entire release process — seamlessly — and I genuinely could not imagine going back to the way we worked before.",
  },
  {
    initials: "TO",
    name: "Tomás Okonkwo",
    role: "Engineering lead, Kestrel Freight",
    fake: "John",
    short:
      "Our changelog used to lag two weeks behind the code. Now support reads it before customers ask.",
    long: "I would say that on the whole this is easily the most seamless and next-generation solution we have adopted in years — it has revolutionised how we think about shipping, and unleashed a level of clarity across the org that we simply did not have before we onboarded.",
  },
  {
    initials: "MH",
    name: "Marit Hovland",
    role: "Product, Bright Harbor Labs",
    fake: "Jane",
    short:
      "I fix the wording and press publish. That used to be a Friday afternoon.",
    long: "The team has been absolutely elevated by this seamless next-gen tool — we are shipping faster than ever, our stakeholders are delighted, and the entire release motion has been revolutionised end to end in a way that feels genuinely game changing for us.",
  },
];

const STATS_BEFORE = [
  ["99.99%", "Uptime"],
  ["50%", "Faster"],
  ["1234567", "Users"],
];
const STATS_AFTER = [
  ["47.2%", "Less release admin"],
  ["3,180", "Teams"],
  ["12 min", "Median review"],
];

function VoicePair({ after }: Side) {
  const [i, setI] = useState(0);
  const v = VOICES[i];
  const stats = after ? STATS_AFTER : STATS_BEFORE;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="bg-card rounded-xl border p-5">
        <p className="text-ui text-pretty">
          {after ? `“${v.short}”` : `"${v.long}"`}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="bg-secondary text-ui-sm text-muted-foreground flex size-9 items-center justify-center rounded-full">
            {after ? (
              v.initials
            ) : (
              <User aria-hidden="true" className="size-4" />
            )}
          </span>
          {after ? (
            <span>
              <span className="text-ui-sm block">{v.name}</span>
              <span className="text-caption text-muted-foreground block">
                {v.role}
              </span>
            </span>
          ) : (
            <span className="text-ui-sm text-muted-foreground">
              — {v.fake}
            </span>
          )}
          <span className="ml-auto flex gap-1">
            <Button
              size="icon-lg"
              variant="outline"
              aria-label="Previous quote"
              onClick={() => setI((n) => (n + VOICES.length - 1) % VOICES.length)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              size="icon-lg"
              variant="outline"
              aria-label="Next quote"
              onClick={() => setI((n) => (n + 1) % VOICES.length)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {stats.map(([n, label]) => (
          <div key={label} className="bg-card rounded-xl border p-3">
            <p className="text-ui font-semibold tabular-nums">{n}</p>
            <p className="text-caption text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 15 · say it plainly ──────────────────────────────────────────── */

const LINES = [
  {
    before:
      "Elevate your release process — seamlessly — with next-gen automation that just works.",
    after: "Marlow writes your changelog from merged pull requests.",
  },
  {
    before:
      "Quietly in use at teams who care about the craft — and we plan to stay that way.",
    after:
      "Used by 3,180 teams, including Wanderloom and Bright Harbor Labs.",
  },
  {
    before: "Unleash your changelog — free on its past, honest about its future.",
    after: "Free for one person. 10 dollars per person for teams.",
  },
];

function CopyPair({ after }: Side) {
  const [i, setI] = useState(0);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="bg-card flex min-h-24 items-center rounded-xl border p-5">
        <p className="text-ui text-pretty">
          {after ? LINES[i].after : LINES[i].before}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="lg"
          variant="outline"
          onClick={() => setI((n) => (n + LINES.length - 1) % LINES.length)}
        >
          Back
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setI((n) => (n + 1) % LINES.length)}
        >
          Next line
        </Button>
        <span className="text-caption text-muted-foreground ml-auto tabular-nums">
          {i + 1} of {LINES.length}
        </span>
      </div>
    </div>
  );
}

/* ── 16 · as many boxes as you have things ────────────────────────── */

const FEATURES: [string, string][] = [
  ["Changelog from pull requests", "Grouped by area, written in your voice."],
  ["Posts to Slack", "The channel you already read."],
  ["Version tagging", "Tags the commit it described."],
  ["Draft review", "Two people sign off before it goes out."],
  ["Search every release", "Back to the first version you shipped."],
];

function GridPair({ after }: Side) {
  const [picked, setPicked] = useState(0);

  const cell = (i: number, span: boolean) => (
    <button
      key={FEATURES[i][0]}
      type="button"
      onClick={() => setPicked(i)}
      aria-pressed={picked === i}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        span && "sm:col-span-2",
        picked === i ? "bg-secondary" : "bg-card hover:bg-secondary",
      )}
    >
      <span className="text-ui-sm block">{FEATURES[i][0]}</span>
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-md">
      {after ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {cell(0, true)}
          {cell(1, false)}
          {cell(2, false)}
          {cell(3, false)}
          {cell(4, false)}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => cell(i, false))}
          <div
            aria-hidden="true"
            className="rounded-xl border border-dashed p-3"
          />
        </div>
      )}
      <p className="text-caption text-muted-foreground mt-3">
        {FEATURES[picked][1]}
      </p>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

function Pair({
  principle,
  render,
}: {
  principle: string;
  render: (side: Side) => ReactNode;
}) {
  return (
    <BeforeAfter
      principle={principle}
      before={render({ after: false })}
      after={render({ after: true })}
    />
  );
}

export function TasteSkillDemo() {
  return (
    <div>
      <Pair
        principle="Everything at the top of a page should fit on one screen. If you have to scroll to find the button, most people never find it."
        render={(s) => <HeroPair {...s} />}
      />
      <Pair
        principle="The menu across the top belongs on one line. When it wraps onto two, the page looks broken before you have read a word."
        render={(s) => <NavPair {...s} />}
      />
      <Pair
        principle="One button, and its words fit on one line. Three buttons that all mean the same thing only make you stop and pick."
        render={(s) => <CtaPair {...s} />}
      />
      <Pair
        principle="You should be able to read what a button says. If it fades into the page behind it, nobody presses it."
        render={(s) => <ContrastPair {...s} />}
      />
      <Pair
        principle="The name of a box should stay visible while you type in it. Otherwise you fill in three fields and forget which one was which."
        render={(s) => <FormPair {...s} />}
      />
      <Pair
        principle="While something is loading, show the shape of what is coming. A spinner in an empty box tells you nothing, and then the page jumps."
        render={(s) => <LoadingPair {...s} />}
      />
      <Pair
        principle="A button should give way under your finger. Without that little push, you are never quite sure it took."
        render={(s) => <PressPair {...s} />}
      />
      <Pair
        principle="Things should only move when the movement is telling you something. A page where everything is always moving is tiring to look at."
        render={(s) => <MotionPair {...s} />}
      />
      <Pair
        principle="Pick one colour and give it one job. When five things are five colours, none of them stands out."
        render={(s) => <AccentPair {...s} />}
      />
      <Pair
        principle="Corners should agree with each other. Mixed shapes make one panel look like it was assembled from spare parts."
        render={(s) => <ShapePair {...s} />}
      />
      <Pair
        principle="A long list of facts is easier in a few small groups. Ten rows with a line under each is a wall you skim past."
        render={(s) => <SpecPair {...s} />}
      />
      <Pair
        principle="A tiny label above every heading makes every part of a page look the same. The heading already told you what it is."
        render={(s) => <EyebrowPair {...s} />}
      />
      <Pair
        principle="Only put things on a page that someone needs. Build numbers, the local weather and a note saying scroll down are all things you have to read past."
        render={(s) => <DecorationPair {...s} />}
      />
      <Pair
        principle="Real people, short quotes, honest numbers. Nobody believes a rave review from Sarah, or that anything is 99.99% perfect."
        render={(s) => <VoicePair {...s} />}
      />
      <Pair
        principle="Say the thing plainly. Long dashes and words like elevate make a sentence take longer to read and leave you knowing less."
        render={(s) => <CopyPair {...s} />}
      />
      <Pair
        principle="A grid should hold exactly as many boxes as you have things. An empty one at the end looks like something failed to load."
        render={(s) => <GridPair {...s} />}
      />
    </div>
  );
}
