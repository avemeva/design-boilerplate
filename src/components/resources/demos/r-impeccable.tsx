"use client";

import {
  AlertTriangle,
  Check,
  FileText,
  Gauge,
  Lock,
  Repeat2,
  ShieldCheck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Impeccable — the slop catalog behind `npx impeccable detect`.
 *
 * The registry ships 59 rules (32 tagged `slop`, 27 tagged `quality`).
 * Every one of them that a person can actually SEE flip is rebuilt
 * below as a switch on the same piece of a fictional invoicing app.
 *
 * Left out because a visitor cannot see them move: font-family choice
 * (overused-font, italic-serif-display, design-system-font), palette
 * drift (cream-palette, design-system-color/radius/font-size), a
 * hand-assembled SVG illustration, uncaught script errors, broken
 * <img> sources, heading-level order, and first-viewport column
 * balance — all of which need a whole page or a devtools panel.
 *
 * Deliberately-wrong values live in inline styles on the `before` side
 * only, because being off the token ramp is the point of that side.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/** The grey canvas each example sits on, inside the white panel. */
function Stage({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("bg-background rounded-xl p-4", className)}
      style={style}
    >
      {children}
    </div>
  );
}

/* ── 1 · the coloured bar down the side of a card ─────────────────── */

function StripePair({ after }: Side) {
  return (
    <Stage>
      <div
        className={cn(
          "bg-card rounded-xl border p-4",
          !after && "border-l-destructive border-l-4",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-ui">Payment failed</p>
            <p className="text-caption text-muted-foreground mt-1">
              Northwind Ltd · $2,400 · the card on file expired
            </p>
          </div>
          <span className="text-micro bg-destructive/10 text-destructive rounded-full px-2 py-1 uppercase">
            Failed
          </span>
        </div>
        <Button size="lg" variant="secondary" className="mt-4">
          Retry the charge
        </Button>
      </div>
    </Stage>
  );
}

/* ── 2 · boxes inside boxes ───────────────────────────────────────── */

const NOTIFY = [
  { id: "paid", label: "Invoice paid", hint: "Every payment that clears" },
  { id: "late", label: "Payment late", hint: "Three days after the due date" },
  { id: "fail", label: "Card declined", hint: "Immediately, once per card" },
];

function NestedPair({ after }: Side) {
  const uid = useId();
  const [on, setOn] = useState<Record<string, boolean>>({
    paid: true,
    late: true,
    fail: false,
  });

  const rows = NOTIFY.map((r) => (
    <div
      key={r.id}
      className={cn(
        "flex items-center justify-between gap-4",
        after ? "px-4 py-3" : "bg-card rounded-lg border p-3",
      )}
    >
      <label htmlFor={`${uid}-${r.id}`} className="min-w-0">
        <span className="text-ui-sm block">{r.label}</span>
        <span className="text-caption text-muted-foreground block">
          {r.hint}
        </span>
      </label>
      <Switch
        id={`${uid}-${r.id}`}
        checked={on[r.id]}
        onCheckedChange={(v) => setOn((s) => ({ ...s, [r.id]: v }))}
      />
    </div>
  ));

  return (
    <Stage>
      {after ? (
        <div className="bg-card divide-y rounded-xl border">
          <p className="text-micro text-muted-foreground px-4 pt-4 pb-2 uppercase">
            Email me when
          </p>
          {rows}
        </div>
      ) : (
        <div className="bg-secondary rounded-2xl border p-3">
          <div className="bg-card rounded-xl border p-3">
            <p className="text-micro text-muted-foreground mb-3 uppercase">
              Email me when
            </p>
            <div className="space-y-2">{rows}</div>
          </div>
        </div>
      )}
    </Stage>
  );
}

/* ── 3 · everything the same size, everything the same gap ────────── */

const FIGURES = [
  { label: "Collected", value: "$48,210" },
  { label: "Outstanding", value: "$9,340" },
  { label: "Overdue", value: "$1,120" },
];

function HierarchyPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-5">
        {after ? (
          <>
            <h4 className="text-title">October</h4>
            <p className="text-caption text-muted-foreground mt-1">
              128 invoices, 6 still unpaid
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {FIGURES.map((f) => (
                <div key={f.label}>
                  <p className="text-micro text-muted-foreground uppercase">
                    {f.label}
                  </p>
                  <p className="text-title mt-1 tabular-nums">{f.value}</p>
                </div>
              ))}
            </div>
            <p className="text-caption text-muted-foreground mt-6">
              Figures update when the bank feed syncs at 6am.
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-ui-sm">October</p>
            <p className="text-ui-sm">128 invoices, 6 still unpaid</p>
            <div className="grid grid-cols-3 gap-3">
              {FIGURES.map((f) => (
                <div key={f.label} className="space-y-3">
                  <p className="text-ui-sm">{f.label}</p>
                  <p className="text-ui-sm tabular-nums">{f.value}</p>
                </div>
              ))}
            </div>
            <p className="text-ui-sm">
              Figures update when the bank feed syncs at 6am.
            </p>
          </div>
        )}
      </div>
    </Stage>
  );
}

/* ── 4 · the rounded icon box above every heading ─────────────────── */

const FEATURES = [
  { icon: Repeat2, title: "Recurring", body: "Bill the same client monthly." },
  { icon: ShieldCheck, title: "Approvals", body: "Two people sign anything over $5k." },
  { icon: Gauge, title: "Reconcile", body: "Match payments to the bank feed." },
];

function IconTilePair({ after }: Side) {
  return (
    <Stage>
      <div className="grid gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-card rounded-xl border p-4">
            {after ? (
              <div className="flex items-center gap-2">
                <f.icon aria-hidden className="text-muted-foreground size-4" />
                <h4 className="text-ui-sm">{f.title}</h4>
              </div>
            ) : (
              <>
                <div className="bg-secondary grid size-10 place-items-center rounded-xl">
                  <f.icon aria-hidden className="text-muted-foreground size-5" />
                </div>
                <h4 className="text-ui-sm mt-3">{f.title}</h4>
              </>
            )}
            <p className="text-caption text-muted-foreground mt-2">{f.body}</p>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ── 5 · the tiny label above the heading ─────────────────────────── */

function EyebrowPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-6">
        {!after && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-micro text-muted-foreground tabular-nums">
              01
            </span>
            <span className="text-micro text-muted-foreground bg-secondary rounded-full px-2.5 py-1 uppercase">
              The platform
            </span>
          </div>
        )}
        <h4 className="text-title">Every invoice, from draft to deposit</h4>
        <p className="text-body text-muted-foreground mt-2 max-w-prose">
          Drafts, approvals, reminders and reconciliation happen in one place,
          so nobody has to reconcile a spreadsheet against a bank statement
          again.
        </p>
      </div>
    </Stage>
  );
}

/* ── 6 · a long headline blown up too big ─────────────────────────── */

function HeadlinePair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card overflow-hidden rounded-xl border p-6">
        <h4
          className={cn(after && "text-title")}
          style={
            after
              ? undefined
              : {
                  fontSize: "2.6rem",
                  lineHeight: 0.92,
                  letterSpacing: "-0.085em",
                  fontWeight: 600,
                }
          }
        >
          Everything your finance team needs to close the month on time
        </h4>
        <p className="text-body text-muted-foreground mt-3 max-w-prose">
          Close in two days instead of nine.
        </p>
        <Button size="lg" className="mt-4">
          Start a trial
        </Button>
      </div>
    </Stage>
  );
}

/* ── 7 · the gradient number ──────────────────────────────────────── */

const GRADIENT_TEXT: CSSProperties = {
  backgroundImage:
    "linear-gradient(95deg, var(--accent-solid), var(--destructive))",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

function GradientPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-5">
        <p className="text-micro text-muted-foreground uppercase">
          Collected this month
        </p>
        <p
          className="text-title mt-2 tabular-nums"
          style={after ? undefined : GRADIENT_TEXT}
        >
          $48,210.00
        </p>
        <span
          className={cn(
            "text-micro mt-3 inline-flex rounded-full px-2.5 py-1 uppercase",
            after && "bg-secondary text-muted-foreground",
          )}
          style={
            after
              ? undefined
              : {
                  backgroundImage:
                    "linear-gradient(95deg, var(--accent-solid), var(--destructive))",
                  color: "var(--primary-foreground)",
                }
          }
        >
          Up 12%
        </span>
      </div>
    </Stage>
  );
}

/* ── 8 · the glow ─────────────────────────────────────────────────── */

function GlowPair({ after }: Side) {
  return (
    <Stage>
      <div
        className="bg-feature text-feature-foreground relative overflow-hidden rounded-xl p-6"
        style={
          after
            ? undefined
            : {
                backgroundImage:
                  "radial-gradient(90% 120% at 50% 0%, color-mix(in oklch, var(--accent-solid) 55%, transparent), transparent 65%)",
              }
        }
      >
        <h4 className="text-title">Ledger closes your books</h4>
        <p className="text-body mt-2 opacity-80">
          Connect a bank account and the first reconciliation runs tonight.
        </p>
        <button
          type="button"
          className="text-ui-sm bg-card text-foreground mt-4 h-9 rounded-lg px-4"
          style={
            after
              ? undefined
              : {
                  boxShadow:
                    "0 0 28px 2px color-mix(in oklch, var(--accent-solid) 70%, transparent)",
                }
          }
        >
          Connect a bank
        </button>
      </div>
    </Stage>
  );
}

/* ── 9 · graph paper and barber-pole stripes ──────────────────────── */

function TexturePair({ after }: Side) {
  return (
    <Stage
      style={
        after
          ? undefined
          : {
              backgroundImage:
                "linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--border-strong) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }
      }
    >
      <div className="bg-card overflow-hidden rounded-xl border">
        <div
          className="border-b px-4 py-3"
          style={
            after
              ? undefined
              : {
                  backgroundImage:
                    "repeating-linear-gradient(135deg, var(--secondary) 0 8px, transparent 8px 16px)",
                }
          }
        >
          <p className="text-ui-sm">Reconciliation queue</p>
        </div>
        <div className="divide-y">
          {["Northwind Ltd", "Contoso", "Fabrikam"].map((c) => (
            <div key={c} className="flex items-center justify-between px-4 py-3">
              <span className="text-ui-sm">{c}</span>
              <span className="text-caption text-muted-foreground tabular-nums">
                2 items
              </span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ── 10 · a hairline and a big shadow, both at once ───────────────── */

function EdgePair({ after }: Side) {
  return (
    <Stage className="py-8">
      <div
        className={cn(
          "bg-card mx-auto max-w-sm rounded-xl border p-4",
          !after && "shadow-floating",
        )}
      >
        <p className="text-ui-sm">Invoice #2041</p>
        <p className="text-caption text-muted-foreground mt-1">
          Sent to accounts@contoso.com · due in 5 days
        </p>
      </div>
    </Stage>
  );
}

/* ── 11 · words squashed against the border ───────────────────────── */

function PaddingPair({ after }: Side) {
  const [shown, setShown] = useState(true);
  if (!shown) {
    return (
      <Stage>
        <Button size="lg" variant="secondary" onClick={() => setShown(true)}>
          Show the notice again
        </Button>
      </Stage>
    );
  }
  return (
    <Stage>
      <div
        className={cn(
          "border-border-strong bg-card rounded-xl border",
          after ? "p-4" : "p-0.5",
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            aria-hidden
            className="text-destructive mt-0.5 size-4 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-ui-sm">Two invoices could not be sent</p>
            <p className="text-caption text-muted-foreground mt-1">
              Contoso and Fabrikam have no billing address on file.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss this notice"
            onClick={() => setShown(false)}
            className="hover:bg-secondary grid size-9 shrink-0 place-items-center rounded-lg"
          >
            <X aria-hidden className="text-muted-foreground size-4" />
          </button>
        </div>
      </div>
    </Stage>
  );
}

/* ── 12 · small print you have to lean in for ─────────────────────── */

const RANGES = ["7 days", "30 days", "This quarter"];

function TinyTextPair({ after }: Side) {
  const [range, setRange] = useState(RANGES[1]);
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-4">
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-lg transition-colors",
                after
                  ? "text-ui-sm h-9 px-3"
                  : "h-8 px-1.5.5",
                range === r
                  ? "bg-feature text-feature-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
              style={after ? undefined : { fontSize: 9, letterSpacing: "0.02em" }}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="mt-4 divide-y border-t">
          {[
            ["Northwind Ltd", "$2,400", "12 Oct, 09:41"],
            ["Contoso", "$860", "11 Oct, 16:02"],
          ].map(([who, amt, when]) => (
            <div key={who} className="flex items-baseline justify-between py-3">
              <span className={after ? "text-ui-sm" : undefined} style={after ? undefined : { fontSize: 10 }}>
                {who}
              </span>
              <span
                className={cn(
                  "text-muted-foreground tabular-nums",
                  after && "text-caption",
                )}
                style={after ? undefined : { fontSize: 9 }}
              >
                {amt} · {when}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ── 13 · the paragraph ───────────────────────────────────────────── */

const PARAGRAPH =
  "When a payment lands in your bank feed, Ledger looks for an invoice with the same amount and a matching reference. If it finds exactly one, it marks that invoice paid and files the payment against it. If it finds several, or none, the payment waits in the reconciliation queue until somebody decides where it belongs.";

function ParagraphPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-5">
        <h4 className="text-ui-sm">How matching works</h4>
        <p
          className={cn(
            "text-muted-foreground mt-2",
            after ? "text-body max-w-prose" : "text-body",
          )}
          style={
            after
              ? undefined
              : { lineHeight: 1.12, textAlign: "justify", maxWidth: "none" }
          }
        >
          {PARAGRAPH}
        </p>
      </div>
    </Stage>
  );
}

/* ── 14 · shouting in small caps ──────────────────────────────────── */

function CapsPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-5">
        <p className="text-micro text-muted-foreground uppercase">Before you send</p>
        <p
          className={cn(
            "text-body mt-2 max-w-prose",
            after ? "text-muted-foreground" : "text-foreground uppercase",
          )}
          style={after ? undefined : { letterSpacing: "0.18em", lineHeight: 1.5 }}
        >
          Invoices are sent from billing@ledger.co. Add that address to your
          contacts so receipts and payment reminders do not end up in a spam
          folder.
        </p>
      </div>
    </Stage>
  );
}

/* ── 15 · the menu that wobbles ───────────────────────────────────── */

function EasingPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  return (
    <Stage className="min-h-56">
      <Button size="lg" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? "Close" : "Open"} the actions menu
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: duration.fast } }}
            transition={
              after
                ? spring.snappy
                : { type: "spring", stiffness: 320, damping: 6.5, mass: 1 }
            }
            className="bg-card mt-3 w-56 origin-top rounded-xl border p-1 shadow-floating"
          >
            {["Duplicate invoice", "Send a reminder", "Mark as paid"].map((a) => (
              <button
                key={a}
                type="button"
                className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center rounded-lg px-3 text-left"
              >
                {a}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  );
}

/* ── 16 · pretending to be live ───────────────────────────────────── */

function LivenessPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "bg-positive size-2 rounded-full",
              !after && "animate-pulse",
            )}
          />
          <span className="text-caption text-muted-foreground">
            Last synced 14 minutes ago
          </span>
        </div>
        <h4 className="text-title mt-3">
          Your books, closed by Tuesday
          {!after && (
            <motion.span
              aria-hidden
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="bg-foreground ml-1 inline-block h-5 w-0.5 align-middle"
            />
          )}
        </h4>
      </div>
    </Stage>
  );
}

/* ── 17 · the sliding logo strip ──────────────────────────────────── */

const CUSTOMERS = [
  "Northwind",
  "Contoso",
  "Fabrikam",
  "Tailspin",
  "Proseware",
  "Adventure Works",
];

function MarqueePair({ after }: Side) {
  return (
    <Stage>
      <p className="text-micro text-muted-foreground mb-3 uppercase">
        Closing their books with Ledger
      </p>
      {after ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {CUSTOMERS.map((c) => (
            <span key={c} className="text-ui-sm text-muted-foreground">
              {c}
            </span>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden">
          <motion.div
            className="flex w-max gap-6"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          >
            {[...CUSTOMERS, ...CUSTOMERS].map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="text-ui-sm text-muted-foreground whitespace-nowrap"
              >
                {c}
              </span>
            ))}
          </motion.div>
        </div>
      )}
    </Stage>
  );
}

/* ── 18 · hovering one tile shoves the rest ───────────────────────── */

const DOCS = ["Oct", "Sep", "Aug", "Jul", "Jun"];

function HoverPair({ after }: Side) {
  const [hot, setHot] = useState<number | null>(null);
  return (
    <Stage>
      <div className="flex items-center gap-3">
        {DOCS.map((d, i) => (
          <button
            key={d}
            type="button"
            onPointerEnter={() => setHot(i)}
            onPointerLeave={() => setHot(null)}
            onFocus={() => setHot(i)}
            onBlur={() => setHot(null)}
            className={cn(
              "bg-card grid h-20 shrink-0 place-items-center rounded-xl border",
              after && "w-16",
              after && hot === i && "border-border-strong bg-secondary",
            )}
            style={
              after
                ? undefined
                : {
                    width: hot === i ? 104 : 64,
                    transform: hot === i ? "scale(1.08)" : "scale(1)",
                    transition: "width 240ms ease, transform 240ms ease",
                  }
            }
          >
            <span className="text-caption text-muted-foreground">{d}</span>
          </button>
        ))}
        <span className="text-caption text-muted-foreground">
          Monthly statements
        </span>
      </div>
    </Stage>
  );
}

/* ── 19 · the tooltip cut in half ─────────────────────────────────── */

function ClipPair({ after }: Side) {
  const [tip, setTip] = useState(false);
  return (
    <Stage>
      <div
        className={cn(
          "bg-card rounded-xl border",
          after ? "overflow-visible" : "overflow-hidden",
        )}
      >
        <div className="relative flex items-center justify-between px-4 py-3">
          <span className="text-ui-sm">Invoice #2041</span>
          <button
            type="button"
            aria-label="Why is this invoice locked?"
            onPointerEnter={() => setTip(true)}
            onPointerLeave={() => setTip(false)}
            onFocus={() => setTip(true)}
            onBlur={() => setTip(false)}
            className="hover:bg-secondary grid size-9 place-items-center rounded-lg"
          >
            <Lock aria-hidden className="text-muted-foreground size-4" />
          </button>
          <AnimatePresence>
            {tip && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                className="text-caption bg-feature text-feature-foreground absolute right-0 bottom-full mb-2 w-56 rounded-lg px-3 py-2"
              >
                Locked because it has already been sent to the client.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="border-t px-4 py-3">
          <span className="text-caption text-muted-foreground">
            Sent 12 Oct · due 26 Oct
          </span>
        </div>
      </div>
    </Stage>
  );
}

/* ── 20 · the address that will not fit ───────────────────────────── */

function OverflowPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card w-64 rounded-xl border p-4">
        <p className="text-micro text-muted-foreground uppercase">Send to</p>
        <p
          className={cn(
            "text-ui-sm mt-1",
            after ? "break-all" : "whitespace-nowrap",
          )}
        >
          accounts.payable.emea@northwind-logistics.example
        </p>
        <p className="text-micro text-muted-foreground mt-4 uppercase">
          Attachment
        </p>
        <p
          className={cn(
            "text-caption text-muted-foreground mt-1",
            after ? "truncate" : "whitespace-nowrap",
          )}
          title="northwind-october-consolidated-invoice-2041.pdf"
        >
          northwind-october-consolidated-invoice-2041.pdf
        </p>
      </div>
    </Stage>
  );
}

/* ── 21 · the badge sitting on the words ──────────────────────────── */

function OcclusionPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card relative rounded-xl border p-4">
        <div className={cn(after && "flex items-start justify-between gap-3")}>
          <h4 className="text-ui">
            October consolidated statement for Northwind
          </h4>
          <span
            className={cn(
              "text-micro bg-accent text-accent-foreground rounded-full px-2 py-1 whitespace-nowrap uppercase",
              after ? "shrink-0" : "absolute top-4 right-4",
            )}
          >
            New
          </span>
        </div>
        <p className="text-caption text-muted-foreground mt-2">
          14 invoices · $18,240 · generated this morning
        </p>
      </div>
    </Stage>
  );
}

/* ── 22 · the row that starts flush against the edge ──────────────── */

function ScrollerPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card overflow-hidden rounded-xl border">
        <p className="text-micro text-muted-foreground px-4 pt-4 uppercase">
          Recent clients
        </p>
        <div
          className={cn(
            "flex gap-3 overflow-x-auto",
            after ? "p-4" : "py-4 pr-4",
          )}
        >
          {CUSTOMERS.map((c) => (
            <div
              key={c}
              className="bg-secondary w-40 shrink-0 rounded-xl border p-3"
            >
              <p className="text-ui-sm truncate">{c}</p>
              <p className="text-caption text-muted-foreground mt-1 tabular-nums">
                3 open invoices
              </p>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ── 23 · text you have to squint at ──────────────────────────────── */

function ContrastPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-feature rounded-xl p-5">
        <h4
          className={cn(
            "text-title",
            after ? "text-feature-foreground" : "text-muted-foreground",
          )}
        >
          You are on the Team plan
        </h4>
        <p
          className={cn(
            "text-body mt-2",
            after ? "text-feature-foreground/75" : "text-muted-foreground/60",
          )}
        >
          Five seats, unlimited invoices, renews 1 November.
        </p>
        <span
          className={cn(
            "text-micro mt-4 inline-flex rounded-full px-2.5 py-1 uppercase",
            after
              ? "bg-accent text-accent-foreground"
              : "bg-accent text-muted-foreground",
          )}
        >
          Renews soon
        </span>
      </div>
    </Stage>
  );
}

/* ── 24 · saying it three times ───────────────────────────────────── */

function RepeatPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-ui">Invoice #2038</p>
            <p className="text-caption text-muted-foreground mt-1">
              {after ? "Contoso · $860" : "Contoso · $860 · Paid"}
            </p>
          </div>
          <span className="text-micro bg-positive/10 text-positive rounded-full px-2 py-1 uppercase">
            Paid
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t pt-3">
          <Check aria-hidden className="text-positive size-4" />
          <span className="text-caption text-muted-foreground">
            {after ? "12 October, by bank transfer" : "Paid on 12 October, by bank transfer"}
          </span>
        </div>
      </div>
    </Stage>
  );
}

/* ── 25 · the reveal that never fired ─────────────────────────────── */

function RevealPair({ after }: Side) {
  const [run, setRun] = useState(0);
  return (
    <Stage>
      <Button size="lg" variant="secondary" onClick={() => setRun((n) => n + 1)}>
        Reload this panel
      </Button>
      <div className="bg-card mt-3 min-h-40 rounded-xl border p-5">
        <motion.div
          key={run}
          initial={after ? { opacity: 0, y: 6 } : false}
          animate={after ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: duration.slow, ease: ease.outQuart }}
          style={after ? undefined : { opacity: 0 }}
        >
          <h4 className="text-title">Nothing is overdue</h4>
          <p className="text-body text-muted-foreground mt-2 max-w-prose">
            All 128 invoices sent in October have either been paid or are still
            inside their payment terms.
          </p>
        </motion.div>
      </div>
    </Stage>
  );
}

/* ── 26 · headings that caption the wrong thing ───────────────────── */

const SECTIONS = [
  {
    h: "Sending",
    p: "Invoices go out at 9am in the client's own timezone.",
  },
  {
    h: "Reminders",
    p: "A first reminder three days before the due date, a second on the day.",
  },
  {
    h: "Chasing",
    p: "After seven days overdue the invoice moves to the collections list.",
  },
];

function RhythmPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-5">
        {SECTIONS.map((s, i) => (
          <div key={s.h} className={cn(!after && "space-y-3 pt-3 first:pt-0")}>
            <h4 className={cn("text-ui-sm", after && (i === 0 ? "" : "mt-7"))}>
              {s.h}
            </h4>
            <p
              className={cn(
                "text-caption text-muted-foreground max-w-prose",
                after && "mt-1.5",
              )}
            >
              {s.p}
            </p>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ── 27 · the copy ────────────────────────────────────────────────── */

function CopyPair({ after }: Side) {
  return (
    <Stage>
      <div className="bg-card rounded-xl border p-6">
        <h4 className="text-title max-w-prose">
          {after
            ? "Send invoices, chase the late ones, close the month"
            : "Streamline your workflow with next-generation invoicing"}
        </h4>
        <p className="text-body text-muted-foreground mt-3 max-w-prose">
          {after
            ? "Ledger matches every payment in your bank feed against an open invoice each morning, sends reminders three days before the due date, and hands you a closed set of books on the first working day of the month."
            : "Enterprise-grade controls — built for teams that ship — meet a world-class reconciliation engine. Not a tool. A platform. Compliance theater? No — cutting-edge controls that empower your finance org."}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button size="lg">Start a 14-day trial</Button>
          <Button size="lg" variant="ghost">
            <FileText aria-hidden />
            See a sample invoice
          </Button>
        </div>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */

export function ImpeccableDemo() {
  const pairs: { principle: string; render: (p: Side) => ReactNode }[] = [
    {
      principle: "You read what the card says instead of the coloured bar down its side.",
      render: (p) => <StripePair {...p} />,
    },
    {
      principle: "Three boxes became one, and the settings line up.",
      render: (p) => <NestedPair {...p} />,
    },
    {
      principle: "You can tell at a glance which numbers matter.",
      render: (p) => <HierarchyPair {...p} />,
    },
    {
      principle: "The words lead now, not the little rounded squares.",
      render: (p) => <IconTilePair {...p} />,
    },
    {
      principle: "The tiny label above the heading said nothing the heading did not.",
      render: (p) => <EyebrowPair {...p} />,
    },
    {
      principle: "The whole sentence fits, and the letters are not squeezed into each other.",
      render: (p) => <HeadlinePair {...p} />,
    },
    { principle: "The number is just a number again.", render: (p) => <GradientPair {...p} /> },
    { principle: "Nothing is glowing at you.", render: (p) => <GlowPair {...p} /> },
    { principle: "The graph paper behind the list is gone.", render: (p) => <TexturePair {...p} /> },
    {
      principle: "The card sits on the page instead of hovering above it.",
      render: (p) => <EdgePair {...p} />,
    },
    { principle: "The words are not squashed against the edge.", render: (p) => <PaddingPair {...p} /> },
    { principle: "You can read the row without leaning in.", render: (p) => <TinyTextPair {...p} /> },
    {
      principle: "Your eye finds the start of the next line without hunting for it.",
      render: (p) => <ParagraphPair {...p} />,
    },
    { principle: "It reads like a sentence, not a warning sign.", render: (p) => <CapsPair {...p} /> },
    { principle: "The menu lands instead of wobbling.", render: (p) => <EasingPair {...p} /> },
    { principle: "Nothing blinks to look busy.", render: (p) => <LivenessPair {...p} /> },
    { principle: "The names hold still long enough to read.", render: (p) => <MarqueePair {...p} /> },
    {
      principle: "Pointing at one month no longer shoves the others sideways.",
      render: (p) => <HoverPair {...p} />,
    },
    {
      principle: "Point at the lock — the explanation is no longer cut off by the card.",
      render: (p) => <ClipPair {...p} />,
    },
    { principle: "The long address stays inside the card.", render: (p) => <OverflowPair {...p} /> },
    { principle: "The badge stopped sitting on top of the title.", render: (p) => <OcclusionPair {...p} /> },
    { principle: "Both ends of the row have the same margin.", render: (p) => <ScrollerPair {...p} /> },
    { principle: "You can actually read it.", render: (p) => <ContrastPair {...p} /> },
    { principle: "It says “Paid” once instead of three times.", render: (p) => <RepeatPair {...p} /> },
    {
      principle: "The words are still there when the animation does not run. Press Reload.",
      render: (p) => <RevealPair {...p} />,
    },
    {
      principle: "Each heading belongs to what is under it, not what is above it.",
      render: (p) => <RhythmPair {...p} />,
    },
    { principle: "It tells you what the thing actually does.", render: (p) => <CopyPair {...p} /> },
  ];

  return (
    <div>
      {pairs.map((pair, i) => (
        <BeforeAfter
          key={i}
          principle={pair.principle}
          before={pair.render({ after: false })}
          after={pair.render({ after: true })}
        />
      ))}
    </div>
  );
}
