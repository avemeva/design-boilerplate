"use client";

import NumberFlow from "@number-flow/react";
import {
  AtSign,
  Bold,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code,
  CreditCard,
  FileText,
  Filter,
  Folder,
  GripVertical,
  Inbox,
  Italic,
  LayoutGrid,
  Mail,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  TriangleAlert,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * devl.dev — 158 compositions under /c/<category>/<name>, across 18
 * categories (auth 14, layouts 12, settings 12, timelines 12, profile
 * 10, modals 10, empty-states 10, cards 10, tables 9, dashboards 9,
 * charts 9, calendars 9, tours 6, toasts 6, threads 6, pricing 6,
 * forms 4, filters 4). Counted off the live index; the source itself
 * is not published — only light and dark preview images — so there is
 * nothing to install and nothing to paraphrase.
 *
 * What is left is the brief. Each switch below takes one named route
 * and flips it between the version a normal product ships and the
 * version worth screenshotting. All 18 categories are represented.
 * The route name lives in this comment, never on the page.
 * ------------------------------------------------------------------ */

/* ── kit ──────────────────────────────────────────────────────────── */

const FIELD =
  "text-ui-sm bg-background h-9 w-full rounded-lg border px-2.5 outline-none focus-visible:border-ring";
const CARD = "bg-card rounded-lg border";

/** The sunken tray a stage sits in, so cards on it read as content. */
function Stage({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-secondary flex min-h-64 flex-col rounded-xl border p-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

function Av({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "text-micro bg-secondary text-secondary-foreground grid size-7 shrink-0 place-items-center rounded-full uppercase",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

function Dot({ tone = "bg-positive" }: { tone?: string }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", tone)} />;
}

/** Interactive pill. Full height, because you have to be able to hit it. */
function Pill({
  children,
  active,
  onClick,
  label,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "text-caption inline-flex h-9 items-center gap-1.5 rounded-full border px-3 whitespace-nowrap transition-colors",
        active
          ? "bg-card text-foreground border-border-strong"
          : "text-muted-foreground bg-secondary hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Quiet segmented control: the selected item is a surface, not a colour. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="bg-secondary inline-flex rounded-full p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={cn(
            "text-caption duration-fast ease-out-quart h-9 rounded-full px-3 transition-colors",
            value === o
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const money = (n: number) => n.toLocaleString("en-US");

/* ── auth/otp-verify ──────────────────────────────────────────────── */

function OtpBefore() {
  const id = useId();
  const [v, setV] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");
  return (
    <Stage className="items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setState(/^\d{6}$/.test(v) ? "done" : "error");
        }}
        className="w-full max-w-64 space-y-2"
      >
        <p className="text-ui font-semibold">Enter the code</p>
        <p className="text-caption text-muted-foreground">Six digits, sent to ••• 4417.</p>
        <label htmlFor={id} className="text-caption text-muted-foreground block">
          Verification code
        </label>
        <input
          id={id}
          value={v}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          onChange={(e) => {
            setV(e.target.value);
            setState("idle");
          }}
          className={FIELD}
        />
        {state === "error" && (
          <p className="text-caption text-destructive">Code must be exactly 6 digits.</p>
        )}
        <Button type="submit" size="lg" className="w-full">
          Verify
        </Button>
        {state === "done" && <p className="text-caption text-positive">Verified.</p>}
      </form>
    </Stage>
  );
}

function OtpAfter() {
  const [vals, setVals] = useState<string[]>(() => Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const full = vals.every(Boolean);

  const put = (i: number, raw: string) => {
    const c = raw.replace(/\D/g, "").slice(-1);
    const next = vals.slice();
    next[i] = c;
    setVals(next);
    if (c && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <Stage className="items-center justify-center">
      <div className="w-full max-w-64 space-y-2 text-center">
        <p className="text-ui font-semibold">Enter the code</p>
        <p className="text-caption text-muted-foreground">Six digits, sent to ••• 4417.</p>
        <div className="flex justify-center gap-1.5">
          {vals.map((v, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={v}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => put(i, e.target.value)}
              onPaste={(e) => {
                const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (!digits) return;
                e.preventDefault();
                const next = Array(6).fill("");
                digits.split("").forEach((d, k) => {
                  next[k] = d;
                });
                setVals(next);
                refs.current[Math.min(digits.length, 5)]?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !v && i > 0) refs.current[i - 1]?.focus();
                if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
                if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
              }}
              className={cn(
                "text-ui size-9 rounded-lg border text-center tabular-nums outline-none focus-visible:border-ring",
                v ? "bg-card" : "bg-background",
              )}
            />
          ))}
        </div>
        <p className={cn("text-caption", full ? "text-positive" : "text-muted-foreground")}>
          {full ? `Verified — ${vals.join("")}` : "It checks itself once all six are in."}
        </p>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => {
            setVals(Array(6).fill(""));
            refs.current[0]?.focus();
          }}
        >
          Clear
        </Button>
      </div>
    </Stage>
  );
}

/* ── auth/centered-signup ─────────────────────────────────────────── */

function pwChecks(v: string) {
  return [
    { t: "8 characters", ok: v.length >= 8 },
    { t: "a capital letter", ok: /[A-Z]/.test(v) },
    { t: "a number", ok: /\d/.test(v) },
    { t: "a symbol", ok: /[^A-Za-z0-9]/.test(v) },
  ];
}

function SignupBefore() {
  const id = useId();
  const [v, setV] = useState("");
  const [errs, setErrs] = useState<string[]>([]);
  return (
    <Stage className="items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErrs(pwChecks(v).filter((c) => !c.ok).map((c) => c.t));
        }}
        className="w-full max-w-64 space-y-2"
      >
        <p className="text-ui font-semibold">Create your account</p>
        <label htmlFor={id} className="text-caption text-muted-foreground block">
          Password
        </label>
        <input
          id={id}
          type="password"
          value={v}
          autoComplete="new-password"
          onChange={(e) => setV(e.target.value)}
          className={FIELD}
        />
        <Button type="submit" size="lg" className="w-full">
          Create account
        </Button>
        {errs.length > 0 && (
          <p className="text-caption text-destructive">
            Password must contain {errs.join(", ")}.
          </p>
        )}
      </form>
    </Stage>
  );
}

function SignupAfter() {
  const id = useId();
  const [v, setV] = useState("");
  const checks = pwChecks(v);
  const score = checks.filter((c) => c.ok).length;
  const missing = checks.filter((c) => !c.ok);
  return (
    <Stage className="items-center justify-center">
      <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-64 space-y-2">
        <p className="text-ui font-semibold">Create your account</p>
        <label htmlFor={id} className="text-caption text-muted-foreground block">
          Password
        </label>
        <input
          id={id}
          type="password"
          value={v}
          autoComplete="new-password"
          onChange={(e) => setV(e.target.value)}
          className={FIELD}
        />
        <div className="flex gap-1" aria-hidden>
          {checks.map((c, i) => (
            <span
              key={c.t}
              className={cn(
                "duration-fast ease-out-quart h-1 flex-1 rounded-full transition-colors",
                i < score
                  ? score === 4
                    ? "bg-positive"
                    : "bg-foreground/50"
                  : "bg-foreground/10",
              )}
            />
          ))}
        </div>
        <p
          className={cn(
            "text-caption",
            score === 4 ? "text-positive" : "text-muted-foreground",
          )}
          aria-live="polite"
        >
          {v.length === 0
            ? "Still needs 8 characters, a capital, a number and a symbol."
            : score === 4
              ? "Strong enough."
              : `Still needs ${missing.map((c) => c.t).join(", ")}.`}
        </p>
        <Button type="submit" size="lg" className="w-full" disabled={score < 4}>
          Create account
        </Button>
      </form>
    </Stage>
  );
}

/* ── calendars/date-range ─────────────────────────────────────────── */

const DOW = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAME = "April";

/** Monday-first 42-cell grid. Pure, so server and client agree. */
function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Array.from({ length: 35 }, (_, i) => {
    const n = i - lead + 1;
    return { n, out: n < 1 || n > days, key: `d${i}` };
  });
}

function RangeBefore() {
  const a = useId();
  const b = useId();
  const [from, setFrom] = useState("2026-04-08");
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const apply = () => {
    const ok = /^2026-04-\d{2}$/;
    if (!ok.test(from) || !ok.test(to)) {
      setMsg("Use the format YYYY-MM-DD.");
      return;
    }
    const n = Number(to.slice(-2)) - Number(from.slice(-2));
    setMsg(n > 0 ? `${n} nights` : "The end date must come after the start date.");
  };

  return (
    <Stage className="items-center justify-center">
      <div className="w-full max-w-72 space-y-2">
        <p className="text-ui font-semibold">Choose your dates</p>
        <div>
          <label htmlFor={a} className="text-caption text-muted-foreground block">
            Check in
          </label>
          <input
            id={a}
            value={from}
            spellCheck={false}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="YYYY-MM-DD"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor={b} className="text-caption text-muted-foreground block">
            Check out
          </label>
          <input
            id={b}
            value={to}
            spellCheck={false}
            onChange={(e) => setTo(e.target.value)}
            placeholder="YYYY-MM-DD"
            className={FIELD}
          />
        </div>
        <Button size="lg" className="w-full" onClick={apply}>
          Apply dates
        </Button>
        <p
          className={cn(
            "text-caption",
            msg && msg.includes("nights") ? "text-foreground" : "text-destructive",
          )}
          aria-live="polite"
        >
          {msg ?? " "}
        </p>
      </div>
    </Stage>
  );
}

function RangeAfter() {
  const cells = useMemo(() => monthGrid(2026, 3), []);
  const [from, setFrom] = useState<number | null>(8);
  const [to, setTo] = useState<number | null>(17);

  const pick = (d: number) => {
    if (from === null || to !== null) {
      setFrom(d);
      setTo(null);
    } else if (d <= from) {
      setFrom(d);
    } else {
      setTo(d);
    }
  };
  const between = (d: number) => from !== null && to !== null && d > from && d < to;

  return (
    <Stage className="items-center justify-center">
      <div className={cn(CARD, "w-full max-w-72 p-3")}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-ui-sm font-medium">
            {MONTH_NAME} <span className="text-muted-foreground tabular-nums">2026</span>
          </p>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-lg" aria-label="Previous month" disabled>
              <ChevronLeft aria-hidden />
            </Button>
            <Button variant="ghost" size="icon-lg" aria-label="Next month" disabled>
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7">
          {DOW.map((d, i) => (
            <span
              key={`${d}${i}`}
              className="text-micro text-muted-foreground grid h-6 place-items-center uppercase"
            >
              {d}
            </span>
          ))}
          {cells.map((c) =>
            c.out ? (
              <span key={c.key} className="h-9" />
            ) : (
              <button
                key={c.key}
                type="button"
                onClick={() => pick(c.n)}
                aria-pressed={c.n === from || c.n === to}
                className={cn(
                  "text-caption duration-fast grid h-9 place-items-center tabular-nums transition-colors",
                  between(c.n) && "bg-secondary",
                  c.n === from && "bg-feature text-feature-foreground rounded-l-lg",
                  c.n === to && "bg-feature text-feature-foreground rounded-r-lg",
                  c.n !== from && c.n !== to && !between(c.n) && "hover:bg-secondary rounded-lg",
                )}
              >
                {c.n}
              </button>
            ),
          )}
        </div>
        <p className="text-caption text-muted-foreground mt-2 text-center" aria-live="polite">
          {from !== null && to !== null
            ? `${to - from} nights · ${from}–${to} ${MONTH_NAME}`
            : "Pick the day you leave"}
        </p>
      </div>
    </Stage>
  );
}

/* ── cards/invoice ────────────────────────────────────────────────── */

const INVOICE = [
  { d: "Design retainer", p: 4200 },
  { d: "Component build", p: 180 },
  { d: "Support hours", p: 120 },
  { d: "Icon set licence", p: 95 },
];

function useQty() {
  const [qty, setQty] = useState<number[]>([1, 12, 6, 2]);
  const bump = (i: number, d: number) =>
    setQty((q) => q.map((v, k) => (k === i ? Math.max(1, Math.min(99, v + d)) : v)));
  const total = qty.reduce((n, q, i) => n + q * INVOICE[i].p, 0);
  return { qty, bump, total };
}

function Stepper({
  i,
  q,
  bump,
  name,
}: {
  i: number;
  q: number;
  bump: (i: number, d: number) => void;
  name: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={`One fewer ${name}`}
        onClick={() => bump(i, -1)}
      >
        <Minus aria-hidden />
      </Button>
      <span className="text-caption w-6 text-center tabular-nums">{q}</span>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={`One more ${name}`}
        onClick={() => bump(i, 1)}
      >
        <Plus aria-hidden />
      </Button>
    </span>
  );
}

function InvoiceCardBefore() {
  const { qty, bump, total } = useQty();
  return (
    <Stage className="items-center justify-center">
      <div className={cn(CARD, "w-full max-w-80 p-3")}>
        <p className="text-ui-sm font-medium">Invoice INV-2026-0417</p>
        <ul className="mt-2 space-y-1">
          {INVOICE.map((l, i) => (
            <li key={l.d} className="text-caption flex items-center gap-2">
              <span className="text-muted-foreground">{l.d}</span>
              <span>€{qty[i] * l.p}</span>
              <Stepper i={i} q={qty[i]} bump={bump} name={l.d} />
            </li>
          ))}
        </ul>
        <p className="text-ui mt-2 border-t pt-2">
          Total <span className="font-semibold">€{total}</span>
        </p>
      </div>
    </Stage>
  );
}

function InvoiceCardAfter() {
  const { qty, bump, total } = useQty();
  return (
    <Stage className="items-center justify-center">
      <div className={cn(CARD, "w-full max-w-80 p-3")}>
        <p className="text-ui-sm font-medium">Invoice INV-2026-0417</p>
        <ul className="mt-2 space-y-0.5">
          {INVOICE.map((l, i) => (
            <li key={l.d} className="flex items-center gap-2">
              <span className="text-caption text-muted-foreground flex-1 truncate">{l.d}</span>
              <Stepper i={i} q={qty[i]} bump={bump} name={l.d} />
              <span className="text-caption w-20 text-right tabular-nums">
                €{money(qty[i] * l.p)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center border-t pt-2">
          <span className="text-caption text-muted-foreground flex-1">Total</span>
          <span className="text-ui w-20 text-right font-semibold tabular-nums">
            €{money(total)}
          </span>
        </div>
      </div>
    </Stage>
  );
}

/* ── cards/payment-method ─────────────────────────────────────────── */

function brandOf(digits: string) {
  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return null;
}

function PaymentBefore() {
  const n = useId();
  const m = useId();
  const c = useId();
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  return (
    <Stage className="items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const digits = num.replace(/\D/g, "");
          const bad =
            digits.length !== 16
              ? "Invalid card number."
              : !/^\d{2}\/\d{2}$/.test(exp)
                ? "Invalid expiry date."
                : cvc.length !== 3
                  ? "Invalid security code."
                  : null;
          setErr(bad);
          setSaved(!bad);
        }}
        className={cn(CARD, "w-full max-w-72 space-y-2 p-3")}
      >
        <p className="text-ui-sm font-medium">Add a card</p>
        <label htmlFor={n} className="text-caption text-muted-foreground block">
          Card number
        </label>
        <input
          id={n}
          value={num}
          inputMode="numeric"
          autoComplete="cc-number"
          onChange={(e) => setNum(e.target.value)}
          className={FIELD}
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={m} className="text-caption text-muted-foreground block">
              Expiry
            </label>
            <input
              id={m}
              value={exp}
              autoComplete="cc-exp"
              placeholder="MM/YY"
              onChange={(e) => setExp(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={c} className="text-caption text-muted-foreground block">
              Security code
            </label>
            <input
              id={c}
              value={cvc}
              autoComplete="cc-csc"
              onChange={(e) => setCvc(e.target.value)}
              className={FIELD}
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full">
          Save card
        </Button>
        {err && <p className="text-caption text-destructive">{err}</p>}
        {saved && <p className="text-caption text-positive">Card saved.</p>}
      </form>
    </Stage>
  );
}

function PaymentAfter() {
  const n = useId();
  const m = useId();
  const c = useId();
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [saved, setSaved] = useState(false);
  const digits = num.replace(/\D/g, "");
  const brand = brandOf(digits);
  const ready = digits.length === 16 && exp.length === 5 && cvc.length === 3;
  return (
    <Stage className="items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
        className={cn(CARD, "w-full max-w-72 space-y-2 p-3")}
      >
        <p className="text-ui-sm font-medium">Add a card</p>
        <label htmlFor={n} className="text-caption text-muted-foreground block">
          Card number
        </label>
        <div className="relative">
          <input
            id={n}
            value={num}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 16);
              setNum(d.replace(/(.{4})/g, "$1 ").trim());
              setSaved(false);
            }}
            className={cn(FIELD, "pr-20 tabular-nums")}
          />
          <span className="text-micro text-muted-foreground pointer-events-none absolute top-0 right-2.5 flex h-9 items-center gap-1 uppercase">
            {brand ? (
              brand
            ) : (
              <CreditCard className="size-3.5" aria-hidden />
            )}
            {digits.length === 16 && <Check className="text-positive size-3.5" aria-hidden />}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={m} className="text-caption text-muted-foreground block">
              Expiry
            </label>
            <input
              id={m}
              value={exp}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
              }}
              className={cn(FIELD, "tabular-nums")}
            />
          </div>
          <div>
            <label htmlFor={c} className="text-caption text-muted-foreground block">
              Security code
            </label>
            <input
              id={c}
              value={cvc}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
              className={cn(FIELD, "tabular-nums")}
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={!ready}>
          Save card
        </Button>
        {saved && <p className="text-caption text-positive">Card saved.</p>}
      </form>
    </Stage>
  );
}

/* ── charts/revenue-area ──────────────────────────────────────────── */

const SERIES = [
  2140, 2380, 2210, 2790, 3120, 2960, 3480, 3310, 3890, 4120, 3970, 4460, 4310, 4820,
];
const DAY_LABEL = (i: number) => `${i + 1} April`;

function areaPaths(values: number[], w: number, h: number) {
  const pad = 6;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const x = (i: number) => pad + (i / (values.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return { line, fill: `${line} L${x(values.length - 1)},${h} L${x(0)},${h} Z`, x, y };
}

function ChartBefore() {
  const { line, fill } = areaPaths(SERIES, 320, 110);
  return (
    <Stage className="justify-center">
      <div className={cn(CARD, "p-3")}>
        <p className="text-ui-sm font-medium">Revenue</p>
        <p className="text-caption text-muted-foreground">Last 14 days</p>
        <svg viewBox="0 0 320 110" className="mt-2 w-full" aria-label="Revenue, last 14 days">
          <title>Revenue, last 14 days</title>
          <path d={fill} className="fill-foreground/5" />
          <path
            d={line}
            className="stroke-foreground fill-none"
            strokeWidth={1.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="text-micro text-muted-foreground mt-1 flex justify-between uppercase">
          <span>1 Apr</span>
          <span>14 Apr</span>
        </div>
      </div>
    </Stage>
  );
}

function ChartAfter() {
  const [i, setI] = useState(SERIES.length - 1);
  const { line, fill, x, y } = areaPaths(SERIES, 320, 110);
  return (
    <Stage className="justify-center">
      <div className={cn(CARD, "p-3")}>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-ui-sm font-medium">Revenue</p>
            <p className="text-caption text-muted-foreground">Last 14 days</p>
          </div>
          <div className="text-right">
            <p className="text-ui font-semibold tabular-nums" aria-live="polite">
              €{money(SERIES[i])}
            </p>
            <p className="text-caption text-muted-foreground tabular-nums">{DAY_LABEL(i)}</p>
          </div>
        </div>
        <div className="relative mt-2">
          <svg viewBox="0 0 320 110" className="w-full" aria-hidden="true">
            <path d={fill} className="fill-foreground/5" />
            <path
              d={line}
              className="stroke-foreground fill-none"
              strokeWidth={1.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={x(i)}
              x2={x(i)}
              y1={0}
              y2={110}
              className="stroke-accent-solid"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={x(i)} cy={y(SERIES[i])} r={3.5} className="fill-accent-solid" />
          </svg>
          <div className="absolute inset-0 flex">
            {SERIES.map((v, k) => (
              <button
                key={DAY_LABEL(k)}
                type="button"
                className="flex-1 rounded-sm outline-none focus-visible:bg-foreground/5"
                aria-label={`${DAY_LABEL(k)}: €${money(v)}`}
                onFocus={() => setI(k)}
                onPointerEnter={() => setI(k)}
              />
            ))}
          </div>
        </div>
        <div className="text-micro text-muted-foreground mt-1 flex justify-between uppercase">
          <span>1 Apr</span>
          <span>14 Apr</span>
        </div>
      </div>
    </Stage>
  );
}

/* ── dashboards/metrics-overview ──────────────────────────────────── */

const PERIODS = ["7d", "30d", "90d"] as const;
type Period = (typeof PERIODS)[number];

const METRICS: { label: string; unit: string; by: Record<Period, number> }[] = [
  { label: "Revenue", unit: "€", by: { "7d": 12480, "30d": 48120, "90d": 141900 } },
  { label: "Signups", unit: "", by: { "7d": 318, "30d": 1204, "90d": 3810 } },
  { label: "Active teams", unit: "", by: { "7d": 96, "30d": 412, "90d": 907 } },
  { label: "Churn", unit: "%", by: { "7d": 1.2, "30d": 2.4, "90d": 3.1 } },
  { label: "Tickets", unit: "", by: { "7d": 47, "30d": 188, "90d": 512 } },
  { label: "Uptime", unit: "%", by: { "7d": 99.98, "30d": 99.95, "90d": 99.91 } },
];

function MetricsBefore() {
  const [p, setP] = useState<Period>("30d");
  return (
    <Stage className="min-h-72 justify-start">
      <div className={cn(CARD, "border-border-strong p-3")}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-ui font-semibold uppercase">Metrics overview</p>
          <div className="flex gap-1">
            {PERIODS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setP(o)}
                aria-pressed={p === o}
                className={cn(
                  "text-caption h-9 rounded-lg border px-3",
                  p === o ? "bg-feature text-feature-foreground" : "bg-secondary",
                )}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {METRICS.map((mtr, k) => (
            <div
              key={mtr.label}
              className={cn(
                "bg-card border-border-strong shadow-floating rounded-lg border p-3",
                k % 2 === 0 ? "text-center" : "text-left",
              )}
            >
              <p className="text-micro text-muted-foreground uppercase">{mtr.label}</p>
              <p className={cn(k % 3 === 0 ? "text-ui font-semibold" : "text-ui-sm")}>
                {mtr.unit === "€" ? "€" : ""}
                {money(mtr.by[p])}
                {mtr.unit === "%" ? "%" : ""}
              </p>
              <p className="text-micro text-positive uppercase">▲ up</p>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

function MetricsAfter() {
  const [p, setP] = useState<Period>("30d");
  return (
    <Stage className="min-h-72 justify-start">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-ui font-medium">Overview</p>
        <Segmented options={PERIODS} value={p} onChange={setP} label="Period" />
      </div>
      <div className={cn(CARD, "grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-3")}>
        {METRICS.map((mtr) => (
          <div key={mtr.label} className="bg-card p-3">
            <p className="text-caption text-muted-foreground truncate">{mtr.label}</p>
            <p className="text-ui mt-0.5 font-semibold tabular-nums">
              {mtr.unit === "€" ? "€" : ""}
              {money(mtr.by[p])}
              {mtr.unit === "%" ? "%" : ""}
            </p>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ── empty-states/no-results ──────────────────────────────────────── */

const DOCS = [
  { t: "Q2 pricing model", who: "Nadia Rahal", status: "Draft" },
  { t: "Brand refresh brief", who: "Ivo Marek", status: "Shared" },
  { t: "Onboarding copy", who: "You", status: "Draft" },
  { t: "Invoice template", who: "You", status: "Shared" },
  { t: "Support macros", who: "Sam Oyelaran", status: "Draft" },
];

function useDocFilters() {
  const [q, setQ] = useState("invoice 99");
  const [status, setStatus] = useState<string | null>("Shared");
  const [mine, setMine] = useState(true);
  const rows = DOCS.filter(
    (d) =>
      d.t.toLowerCase().includes(q.trim().toLowerCase()) &&
      (status === null || d.status === status) &&
      (!mine || d.who === "You"),
  );
  return { q, setQ, status, setStatus, mine, setMine, rows };
}

function DocRows({ rows }: { rows: typeof DOCS }) {
  return (
    <ul className={cn(CARD, "divide-y")}>
      {rows.map((d) => (
        <li key={d.t} className="flex items-center gap-2 px-3 py-2">
          <FileText className="text-muted-foreground size-3.5" aria-hidden />
          <span className="text-ui-sm flex-1 truncate">{d.t}</span>
          <span className="text-caption text-muted-foreground">{d.who}</span>
        </li>
      ))}
    </ul>
  );
}

function NoResultsBefore() {
  const { q, setQ, rows } = useDocFilters();
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <Stage className="justify-start">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Search files
        </label>
        <input
          id={id}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search files"
          className={FIELD}
        />
        <Button variant="outline" size="lg" onClick={() => setOpen(!open)} aria-expanded={open}>
          <Filter aria-hidden /> Filters
        </Button>
      </div>
      {open && (
        <p className="text-caption text-muted-foreground mt-2">
          Status: Shared · Owner: me
        </p>
      )}
      <div className="mt-3 flex-1">
        {rows.length === 0 ? (
          <p className="text-caption text-muted-foreground grid h-32 place-items-center">
            No results found.
          </p>
        ) : (
          <DocRows rows={rows} />
        )}
      </div>
    </Stage>
  );
}

function NoResultsAfter() {
  const { q, setQ, status, setStatus, mine, setMine, rows } = useDocFilters();
  const id = useId();
  const active = [
    q.trim() && { k: "q", label: `“${q.trim()}”`, clear: () => setQ("") },
    status && { k: "s", label: `Status: ${status}`, clear: () => setStatus(null) },
    mine && { k: "m", label: "Owner: me", clear: () => setMine(false) },
  ].filter(Boolean) as { k: string; label: string; clear: () => void }[];

  return (
    <Stage className="justify-start">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Search files
        </label>
        <input
          id={id}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search files"
          className={FIELD}
        />
      </div>
      <div className="mt-3 flex-1">
        {rows.length === 0 ? (
          <div className="grid place-items-center py-6 text-center">
            <Search className="text-muted-foreground size-5" aria-hidden />
            <p className="text-ui-sm mt-2 font-medium">No file matches all three</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {active.map((f) => (
                <Pill key={f.k} onClick={f.clear} label={`Remove ${f.label}`}>
                  {f.label} <X className="size-3" aria-hidden />
                </Pill>
              ))}
            </div>
            <Button
              variant="outline"
              size="lg"
              className="mt-3"
              onClick={() => {
                setQ("");
                setStatus(null);
                setMine(false);
              }}
            >
              Clear all and show 5 files
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {active.map((f) => (
                <Pill key={f.k} onClick={f.clear} label={`Remove ${f.label}`}>
                  {f.label} <X className="size-3" aria-hidden />
                </Pill>
              ))}
            </div>
            <DocRows rows={rows} />
          </>
        )}
      </div>
    </Stage>
  );
}

/* ── empty-states/offline ─────────────────────────────────────────── */

const QUEUE = [
  { t: "Reply to Ivo", meta: "Draft saved" },
  { t: "Weekly report", meta: "Draft saved" },
  { t: "Invite Sam", meta: "Queued" },
];

function OfflineBefore() {
  const [tries, setTries] = useState(0);
  return (
    <Stage className="justify-center">
      <div className="border-destructive/40 bg-destructive/5 rounded-lg border p-3">
        <p className="text-caption text-destructive flex items-center gap-2">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          <span className="font-mono">
            TypeError: Failed to fetch (net::ERR_INTERNET_DISCONNECTED)
          </span>
        </p>
      </div>
      <div className="mt-3 grid h-24 place-items-center">
        <p className="text-caption text-muted-foreground">Could not load.</p>
      </div>
      <Button variant="outline" size="lg" className="mt-3" onClick={() => setTries((t) => t + 1)}>
        Retry
      </Button>
      {tries > 0 && (
        <p className="text-caption text-destructive mt-2">
          TypeError: Failed to fetch (net::ERR_INTERNET_DISCONNECTED)
        </p>
      )}
    </Stage>
  );
}

function OfflineAfter() {
  const [online, setOnline] = useState(false);
  return (
    <Stage className="justify-start">
      <div className={cn(CARD, "flex items-center gap-2 px-3 py-2")}>
        {online ? (
          <Dot />
        ) : (
          <WifiOff className="text-muted-foreground size-4 shrink-0" aria-hidden />
        )}
        <p className="text-caption flex-1" aria-live="polite">
          {online ? (
            <span className="text-positive">Back online. Everything is sent.</span>
          ) : (
            <>
              You are offline.{" "}
              <span className="text-muted-foreground">
                Your three drafts are saved here and go out when you reconnect.
              </span>
            </>
          )}
        </p>
        <Button size="lg" variant="outline" onClick={() => setOnline(!online)}>
          <RefreshCw aria-hidden />
          {online ? "Go offline" : "Try now"}
        </Button>
      </div>
      <ul className={cn(CARD, "mt-3 divide-y")}>
        {QUEUE.map((q) => (
          <li key={q.t} className="flex items-center gap-2 px-3 py-2">
            <Mail className="text-muted-foreground size-3.5" aria-hidden />
            <span className={cn("text-ui-sm flex-1 truncate", !online && "text-muted-foreground")}>
              {q.t}
            </span>
            <span className={cn("text-micro uppercase", online ? "text-positive" : "text-muted-foreground")}>
              {online ? "Sent" : q.meta}
            </span>
          </li>
        ))}
      </ul>
    </Stage>
  );
}

/* ── filters/chips ────────────────────────────────────────────────── */

const ISSUES = [
  { id: "ENG-241", t: "Sheet drags past its stop", state: "Open", label: "Bug", who: "Nadia Rahal" },
  { id: "ENG-238", t: "Rail collapses on resize", state: "Open", label: "Bug", who: "Ivo Marek" },
  { id: "ENG-233", t: "Add tabular figures to tables", state: "Closed", label: "Polish", who: "You" },
  { id: "ENG-229", t: "Empty state for search", state: "Open", label: "Polish", who: "You" },
  { id: "ENG-224", t: "Toast stacking order", state: "Closed", label: "Bug", who: "Sam Oyelaran" },
  { id: "ENG-219", t: "Keyboard traps in dialog", state: "Open", label: "Bug", who: "You" },
];

function useIssueFilters() {
  const [state, setState] = useState<string | null>("Open");
  const [label, setLabel] = useState<string | null>("Bug");
  const [mine, setMine] = useState(false);
  const rows = ISSUES.filter(
    (r) =>
      (state === null || r.state === state) &&
      (label === null || r.label === label) &&
      (!mine || r.who === "You"),
  );
  return { state, setState, label, setLabel, mine, setMine, rows };
}

function IssueRows({ rows }: { rows: typeof ISSUES }) {
  return (
    <ul className={cn(CARD, "divide-y")}>
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-2 px-3 py-2">
          <span className="text-caption text-muted-foreground w-16 shrink-0 tabular-nums">
            {r.id}
          </span>
          <span className="text-ui-sm flex-1 truncate">{r.t}</span>
          <Av name={r.who} />
        </li>
      ))}
    </ul>
  );
}

function ChipsBefore() {
  const f = useIssueFilters();
  const [open, setOpen] = useState(false);
  const count = [f.state, f.label, f.mine ? "mine" : null].filter(Boolean).length;
  return (
    <Stage className="justify-start">
      <div className="relative">
        <Button variant="outline" size="lg" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Filter aria-hidden /> Filters {count > 0 && <span className="tabular-nums">({count})</span>}
        </Button>
        {open && (
          <div className="bg-popover shadow-floating absolute top-11 left-0 z-10 w-56 space-y-2 rounded-xl border p-3">
            {(
              [
                ["State", ["Open", "Closed"], f.state, f.setState],
                ["Label", ["Bug", "Polish"], f.label, f.setLabel],
              ] as const
            ).map(([title, opts, val, set]) => (
              <div key={title}>
                <p className="text-micro text-muted-foreground uppercase">{title}</p>
                {opts.map((o) => (
                  <label key={o} className="text-caption flex h-9 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={val === o}
                      onChange={() => (set as (v: string | null) => void)(val === o ? null : o)}
                      className="size-4"
                    />
                    {o}
                  </label>
                ))}
              </div>
            ))}
            <label className="text-caption flex h-9 items-center gap-2">
              <input
                type="checkbox"
                checked={f.mine}
                onChange={(e) => f.setMine(e.target.checked)}
                className="size-4"
              />
              Only mine
            </label>
          </div>
        )}
      </div>
      <p className="text-caption text-muted-foreground mt-3 tabular-nums">
        {f.rows.length} of {ISSUES.length} issues
      </p>
      <div className="mt-2">
        <IssueRows rows={f.rows} />
      </div>
    </Stage>
  );
}

function ChipsAfter() {
  const f = useIssueFilters();
  const chips = [
    f.state && { k: "s", label: `State: ${f.state}`, clear: () => f.setState(null) },
    f.label && { k: "l", label: `Label: ${f.label}`, clear: () => f.setLabel(null) },
    f.mine && { k: "m", label: "Only mine", clear: () => f.setMine(false) },
  ].filter(Boolean) as { k: string; label: string; clear: () => void }[];

  return (
    <Stage className="justify-start">
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <Pill key={c.k} active onClick={c.clear} label={`Remove ${c.label}`}>
            {c.label} <X className="size-3" aria-hidden />
          </Pill>
        ))}
        {!f.state && (
          <Pill onClick={() => f.setState("Open")}>
            <Plus className="size-3" aria-hidden /> State: Open
          </Pill>
        )}
        {!f.label && (
          <Pill onClick={() => f.setLabel("Bug")}>
            <Plus className="size-3" aria-hidden /> Label: Bug
          </Pill>
        )}
        {!f.mine && (
          <Pill onClick={() => f.setMine(true)}>
            <Plus className="size-3" aria-hidden /> Only mine
          </Pill>
        )}
      </div>
      <p className="text-caption text-muted-foreground mt-3 tabular-nums">
        {f.rows.length} of {ISSUES.length} issues
      </p>
      <div className="mt-2">
        <IssueRows rows={f.rows} />
      </div>
    </Stage>
  );
}

/* ── forms/invite-teammates ───────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteBefore() {
  const id = useId();
  const [v, setV] = useState("");
  const [list, setList] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Stage className="justify-start">
      <p className="text-ui font-semibold">Invite your team</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!EMAIL_RE.test(v.trim())) {
            setErr("Enter one valid email address.");
            setV("");
            return;
          }
          setList((l) => [...l, v.trim()]);
          setV("");
          setErr(null);
        }}
        className="mt-2 flex gap-2"
      >
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          value={v}
          type="email"
          autoComplete="off"
          placeholder="name@company.com"
          onChange={(e) => setV(e.target.value)}
          className={FIELD}
        />
        <Button type="submit" size="lg">
          Add
        </Button>
      </form>
      {err && <p className="text-caption text-destructive mt-2">{err}</p>}
      <ul className="mt-3 space-y-1">
        {list.map((e) => (
          <li key={e} className="text-caption text-muted-foreground">
            {e}
          </li>
        ))}
      </ul>
      <Button
        size="lg"
        className="mt-auto self-start"
        disabled={list.length === 0}
        onClick={() => setList([])}
      >
        Send {list.length} invites
      </Button>
    </Stage>
  );
}

function InviteAfter() {
  const id = useId();
  const [v, setV] = useState("");
  const [list, setList] = useState<string[]>([]);
  const commit = (raw: string) => {
    const parts = raw
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setList((l) => [...l, ...parts.filter((p) => !l.includes(p))]);
    setV("");
  };
  const good = list.filter((e) => EMAIL_RE.test(e));
  const bad = list.length - good.length;

  return (
    <Stage className="justify-start">
      <p className="text-ui font-semibold">Invite your team</p>
      <label htmlFor={id} className="text-caption text-muted-foreground mt-2 block">
        Paste as many as you like — commas, spaces or new lines
      </label>
      <div className="bg-background mt-1 flex flex-wrap gap-1.5 rounded-lg border p-1.5">
        {list.map((e) => {
          const ok = EMAIL_RE.test(e);
          return (
            <button
              key={e}
              type="button"
              aria-label={`Remove ${e}`}
              onClick={() => setList((l) => l.filter((x) => x !== e))}
              className={cn(
                "text-caption inline-flex h-9 items-center gap-1.5 rounded-full border px-3",
                ok ? "bg-secondary" : "border-destructive/40 text-destructive bg-destructive/5",
              )}
            >
              {e}
              <X className="size-3" aria-hidden />
            </button>
          );
        })}
        <input
          id={id}
          value={v}
          type="text"
          autoComplete="off"
          placeholder={list.length === 0 ? "name@company.com, other@company.com" : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (/[,;\s]$/.test(raw)) commit(raw);
            else setV(raw);
          }}
          onBlur={() => commit(v)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(v);
            }
            if (e.key === "Backspace" && v === "") setList((l) => l.slice(0, -1));
          }}
          className="text-ui-sm h-9 min-w-40 flex-1 bg-transparent px-2 outline-none"
        />
      </div>
      <p className="text-caption text-muted-foreground mt-2" aria-live="polite">
        {list.length === 0
          ? "Nothing added yet."
          : bad > 0
            ? `${good.length} ready, ${bad} need fixing — press one to remove it.`
            : `${good.length} ready to invite.`}
      </p>
      <Button
        size="lg"
        className="mt-auto self-start"
        disabled={good.length === 0 || bad > 0}
        onClick={() => setList([])}
      >
        Send {good.length} invites
      </Button>
    </Stage>
  );
}

/* ── layouts/split-resizable ──────────────────────────────────────── */

const FILES = [
  "quarterly-revenue-projection-v4-final.csv",
  "brand-guidelines-2026.pdf",
  "onboarding-flow-copy.md",
  "support-macros-export.json",
];

function SplitPanes({
  pct,
  divider,
}: {
  pct: number;
  divider?: React.ReactNode;
}) {
  const [sel, setSel] = useState(0);
  return (
    <div className={cn(CARD, "flex min-h-52 overflow-hidden")}>
      <div style={{ width: `${pct}%` }} className="min-w-0 border-r">
        <ul className="divide-y">
          {FILES.map((f, i) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => setSel(i)}
                aria-pressed={sel === i}
                className={cn(
                  "flex h-9 w-full items-center gap-2 px-2.5 text-left",
                  sel === i ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <Folder className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                <span className="text-caption truncate">{f}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {divider}
      <div className="min-w-0 flex-1 p-3">
        <p className="text-ui-sm truncate font-medium">{FILES[sel]}</p>
        <p className="text-caption text-muted-foreground mt-1">
          Edited by Nadia Rahal · 2.4 MB
        </p>
      </div>
    </div>
  );
}

function SplitBefore() {
  return (
    <Stage className="justify-center">
      <SplitPanes pct={40} />
      <p className="text-caption text-muted-foreground mt-2 tabular-nums">40%</p>
    </Stage>
  );
}

function SplitAfter() {
  const box = useRef<HTMLDivElement | null>(null);
  const [pct, setPct] = useState(40);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPct(Math.max(20, Math.min(80, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <Stage className="justify-center">
      <div ref={box}>
        <SplitPanes
          pct={pct}
          divider={
            <button
              type="button"
              aria-label={`Resize panes, currently ${Math.round(pct)} percent`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX);
              }}
              onDoubleClick={() => setPct(40)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setPct((v) => Math.max(20, v - 4));
                if (e.key === "ArrowRight") setPct((v) => Math.min(80, v + 4));
              }}
              className="hover:bg-secondary group flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center"
            >
              <GripVertical className="text-muted-foreground size-3" aria-hidden />
            </button>
          }
        />
      </div>
      <p className="text-caption text-muted-foreground mt-2 tabular-nums">
        {Math.round(pct)}%
      </p>
    </Stage>
  );
}

/* ── layouts/mini-rail ────────────────────────────────────────────── */

const RAIL = [
  { icon: Inbox, label: "Inbox" },
  { icon: LayoutGrid, label: "Projects" },
  { icon: Users, label: "People" },
  { icon: FileText, label: "Reports" },
  { icon: Shield, label: "Security" },
  { icon: Settings, label: "Settings" },
];

function RailBefore() {
  const [at, setAt] = useState(1);
  return (
    <Stage className="justify-center">
      <div className={cn(CARD, "flex min-h-52 overflow-hidden")}>
        <div className="bg-secondary flex flex-col gap-1 border-r p-1.5">
          {RAIL.map((r, i) => (
            <button
              key={r.label}
              type="button"
              aria-label={r.label}
              aria-current={at === i ? "page" : undefined}
              onClick={() => setAt(i)}
              className="grid size-9 place-items-center rounded-lg"
            >
              <r.icon
                className={cn("size-4", at === i ? "text-foreground" : "text-muted-foreground")}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <div className="flex-1 p-3">
          <p className="text-ui-sm font-medium">{RAIL[at].label}</p>
          <p className="text-caption text-muted-foreground mt-1">Nothing new today.</p>
        </div>
      </div>
    </Stage>
  );
}

function RailAfter() {
  const [at, setAt] = useState(1);
  return (
    <Stage className="justify-center">
      <div className={cn(CARD, "flex min-h-52 overflow-hidden")}>
        <div className="bg-secondary flex flex-col gap-1 p-1.5">
          {RAIL.map((r, i) => (
            <div key={r.label} className="group relative">
              <button
                type="button"
                aria-label={r.label}
                aria-current={at === i ? "page" : undefined}
                onClick={() => setAt(i)}
                className={cn(
                  "grid size-9 place-items-center rounded-lg outline-none",
                  at === i ? "bg-card shadow-xs" : "hover:bg-card/60",
                )}
              >
                <r.icon
                  className={cn(
                    "size-4",
                    at === i ? "text-foreground" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
              </button>
              <span
                aria-hidden
                className="text-caption bg-popover shadow-floating duration-fast ease-out-quart pointer-events-none absolute top-1.5 left-11 z-10 rounded-lg border px-2 py-1 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {r.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex-1 border-l p-3">
          <p className="text-ui-sm font-medium">{RAIL[at].label}</p>
          <p className="text-caption text-muted-foreground mt-1">Nothing new today.</p>
        </div>
      </div>
    </Stage>
  );
}

/* ── modals/confirm-delete ────────────────────────────────────────── */

const PROJECTS = [
  { name: "Q2 pricing", files: 24, shares: 3 },
  { name: "Brand refresh", files: 61, shares: 8 },
  { name: "Support macros", files: 9, shares: 1 },
];

function useProjects() {
  const [live, setLive] = useState(PROJECTS.map((p) => p.name));
  const [target, setTarget] = useState<string | null>(null);
  const project = PROJECTS.find((p) => p.name === target);
  return { live, setLive, target, setTarget, project };
}

function ProjectList({
  live,
  onDelete,
}: {
  live: string[];
  onDelete: (name: string) => void;
}) {
  return (
    <ul className={cn(CARD, "divide-y")}>
      {PROJECTS.filter((p) => live.includes(p.name)).map((p) => (
        <li key={p.name} className="flex items-center gap-2 px-3 py-2">
          <Folder className="text-muted-foreground size-3.5" aria-hidden />
          <span className="text-ui-sm flex-1 truncate">{p.name}</span>
          <span className="text-caption text-muted-foreground tabular-nums">{p.files} files</span>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={`Delete ${p.name}`}
            onClick={() => onDelete(p.name)}
          >
            <Trash2 aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-foreground/40 p-3">
      <div className="bg-popover shadow-floating w-full max-w-72 rounded-xl p-4">{children}</div>
    </div>
  );
}

function ConfirmBefore() {
  const { live, setLive, target, setTarget } = useProjects();
  return (
    <Stage className="relative justify-start">
      <ProjectList live={live} onDelete={setTarget} />
      {live.length < 3 && (
        <Button
          variant="outline"
          size="lg"
          className="mt-3 self-start"
          onClick={() => setLive(PROJECTS.map((p) => p.name))}
        >
          Put them back
        </Button>
      )}
      {target && (
        <Overlay>
          <p className="text-ui font-semibold">Are you sure?</p>
          <p className="text-caption text-muted-foreground mt-1">
            This action cannot be undone.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="lg" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setLive((l) => l.filter((n) => n !== target));
                setTarget(null);
              }}
            >
              OK
            </Button>
          </div>
        </Overlay>
      )}
    </Stage>
  );
}

function ConfirmAfter() {
  const { live, setLive, target, setTarget, project } = useProjects();
  return (
    <Stage className="relative justify-start">
      <ProjectList live={live} onDelete={setTarget} />
      {live.length < 3 && (
        <Button
          variant="outline"
          size="lg"
          className="mt-3 self-start"
          onClick={() => setLive(PROJECTS.map((p) => p.name))}
        >
          Put them back
        </Button>
      )}
      {project && (
        <Overlay>
          <p className="text-ui font-semibold">Delete “{project.name}”?</p>
          <p className="text-caption text-muted-foreground mt-1">
            Its <span className="text-foreground tabular-nums">{project.files} files</span> and{" "}
            <span className="text-foreground tabular-nums">{project.shares} shared links</span> go
            with it. Nobody can get them back.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                setLive((l) => l.filter((n) => n !== project.name));
                setTarget(null);
              }}
            >
              Delete project
            </Button>
            <Button size="lg" onClick={() => setTarget(null)}>
              Keep it
            </Button>
          </div>
        </Overlay>
      )}
    </Stage>
  );
}

/* ── modals/upload-files ──────────────────────────────────────────── */

const UPLOADS = [
  { name: "brand-guidelines-2026.pdf", size: "8.4 MB", step: 7 },
  { name: "hero-render.png", size: "24.1 MB", step: 3 },
  { name: "customers-export.csv", size: "1.2 MB", step: 17 },
];

function UploadBefore() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  return (
    <Stage className="items-center justify-center">
      <div className={cn(CARD, "w-full max-w-72 p-4 text-center")}>
        <p className="text-ui-sm font-medium">Upload files</p>
        <p className="text-caption text-muted-foreground mt-1">3 files selected · 33.7 MB</p>
        <div className="my-4 grid h-16 place-items-center">
          {state === "busy" ? (
            <RefreshCw className="text-muted-foreground size-5 animate-spin" aria-hidden />
          ) : state === "done" ? (
            <p className="text-caption text-positive">Done.</p>
          ) : (
            <p className="text-caption text-muted-foreground">Ready when you are.</p>
          )}
        </div>
        <Button
          size="lg"
          className="w-full"
          disabled={state === "busy"}
          onClick={() => {
            setState("busy");
            timer.current = window.setTimeout(() => setState("done"), 4000);
          }}
        >
          {state === "busy" ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </Stage>
  );
}

function UploadAfter() {
  const [prog, setProg] = useState<number[]>([0, 0, 0]);
  const ref = useRef<number[]>([0, 0, 0]);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };

  const start = () => {
    if (timer.current) return;
    ref.current = [0, 0, 0];
    setProg([0, 0, 0]);
    timer.current = window.setInterval(() => {
      const next = ref.current.map((v, i) => (v < 0 ? v : Math.min(100, v + UPLOADS[i].step)));
      ref.current = next;
      setProg(next);
      if (next.every((v) => v < 0 || v >= 100)) stop();
    }, 220);
  };

  const cancel = (i: number) => {
    const next = ref.current.slice();
    next[i] = -1;
    ref.current = next;
    setProg(next);
    if (next.every((v) => v < 0 || v >= 100)) stop();
  };

  const running = prog.some((v) => v >= 0 && v < 100);
  const doneCount = prog.filter((v) => v >= 100).length;

  return (
    <Stage className="items-center justify-center">
      <div className={cn(CARD, "w-full max-w-80 p-3")}>
        <div className="flex items-baseline justify-between">
          <p className="text-ui-sm font-medium">Upload files</p>
          <p className="text-caption text-muted-foreground tabular-nums" aria-live="polite">
            {doneCount} of 3 done
          </p>
        </div>
        <ul className="mt-2 space-y-2">
          {UPLOADS.map((u, i) => (
            <li key={u.name}>
              <div className="flex items-center gap-2">
                <FileText className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                <span className="text-caption flex-1 truncate">{u.name}</span>
                <span className="text-caption text-muted-foreground w-16 text-right tabular-nums">
                  {prog[i] < 0 ? "Stopped" : prog[i] >= 100 ? "Done" : `${prog[i]}%`}
                </span>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={`Stop uploading ${u.name}`}
                  disabled={prog[i] < 0 || prog[i] >= 100}
                  onClick={() => cancel(i)}
                >
                  <X aria-hidden />
                </Button>
              </div>
              <div className="bg-foreground/10 mt-1 h-1 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "duration-base ease-out-quart h-full rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform]",
                    prog[i] < 0 ? "bg-foreground/20" : prog[i] >= 100 ? "bg-positive" : "bg-foreground/60",
                  )}
                  style={{ width: `${Math.max(0, prog[i])}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <Button size="lg" className="mt-3 w-full" disabled={running} onClick={start}>
          {running ? "Uploading…" : "Upload 3 files"}
        </Button>
      </div>
    </Stage>
  );
}

/* ── pricing/monthly-yearly ───────────────────────────────────────── */

const TIERS = [
  { name: "Starter", m: 12, y: 115 },
  { name: "Team", m: 29, y: 278 },
  { name: "Scale", m: 79, y: 758 },
];

function PricingBefore() {
  const [yearly, setYearly] = useState(false);
  return (
    <Stage className="justify-center">
      <div className="flex justify-center">
        <Segmented
          options={["Monthly", "Yearly"] as const}
          value={yearly ? "Yearly" : "Monthly"}
          onChange={(v) => setYearly(v === "Yearly")}
          label="Billing period"
        />
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {TIERS.map((t) => (
          <div key={t.name} className={cn(CARD, "p-3 text-center")}>
            {yearly && (
              <p className="text-micro text-positive uppercase">Save 20 percent</p>
            )}
            <p className="text-ui-sm font-medium">{t.name}</p>
            <p className="text-ui font-semibold">€{yearly ? t.y : t.m}</p>
            <p className="text-caption text-muted-foreground">
              {yearly ? "per year, billed annually" : "per month"}
            </p>
          </div>
        ))}
      </div>
    </Stage>
  );
}

function PricingAfter() {
  const [yearly, setYearly] = useState(false);
  return (
    <Stage className="justify-center">
      <div className="flex justify-center">
        <Segmented
          options={["Monthly", "Yearly"] as const}
          value={yearly ? "Yearly" : "Monthly"}
          onChange={(v) => setYearly(v === "Yearly")}
          label="Billing period"
        />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {TIERS.map((t) => (
          <div key={t.name} className={cn(CARD, "p-3 text-center")}>
            <p className="text-micro text-positive h-3 uppercase">
              {yearly ? "Save 20 percent" : " "}
            </p>
            <p className="text-ui-sm mt-1 font-medium">{t.name}</p>
            <p className="text-ui font-semibold tabular-nums">
              €<NumberFlow value={yearly ? t.y : t.m} />
            </p>
            <p className="text-caption text-muted-foreground">
              {yearly ? "per year" : "per month"}
            </p>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ── pricing/slider-seats ─────────────────────────────────────────── */

function seatPrice(seats: number) {
  if (seats <= 10) return 12;
  if (seats <= 50) return 10;
  return 8;
}

function SeatsBefore() {
  const id = useId();
  const [typed, setTyped] = useState("8");
  const [applied, setApplied] = useState(8);
  const stale = Number(typed) !== applied;
  return (
    <Stage className="items-center justify-center">
      <div className={cn(CARD, "w-full max-w-72 space-y-2 p-3")}>
        <label htmlFor={id} className="text-caption text-muted-foreground block">
          Number of seats
        </label>
        <input
          id={id}
          value={typed}
          inputMode="numeric"
          onChange={(e) => setTyped(e.target.value.replace(/\D/g, "").slice(0, 3))}
          className={cn(FIELD, "tabular-nums")}
        />
        <Button size="lg" className="w-full" onClick={() => setApplied(Number(typed) || 1)}>
          Update total
        </Button>
        <div className="border-t pt-2">
          <p className="text-ui font-semibold tabular-nums">
            €{money(applied * seatPrice(applied))} per month
          </p>
          <p className="text-caption text-muted-foreground tabular-nums">
            {applied} seats at €{seatPrice(applied)}
          </p>
          {stale && (
            <p className="text-caption text-destructive">
              This total is for {applied} seats, not {typed || 0}.
            </p>
          )}
        </div>
      </div>
    </Stage>
  );
}

function SeatsAfter() {
  const id = useId();
  const [seats, setSeats] = useState(8);
  const unit = seatPrice(seats);
  const nextTier = seats <= 10 ? 11 : seats <= 50 ? 51 : null;
  return (
    <Stage className="items-center justify-center">
      <div className={cn(CARD, "w-full max-w-72 space-y-2 p-3")}>
        <div className="flex items-baseline justify-between">
          <label htmlFor={id} className="text-caption text-muted-foreground">
            Number of seats
          </label>
          <span className="text-ui-sm tabular-nums">{seats}</span>
        </div>
        <input
          id={id}
          type="range"
          min={1}
          max={100}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="h-9 w-full"
        />
        <div className="border-t pt-2">
          <p className="text-ui font-semibold tabular-nums">
            €<NumberFlow value={seats * unit} /> per month
          </p>
          <p className="text-caption text-muted-foreground tabular-nums">
            {seats} seats at €{unit}
          </p>
          <p className="text-caption text-muted-foreground">
            {nextTier
              ? `At ${nextTier} seats the price per seat drops to €${seatPrice(nextTier)}.`
              : "This is the lowest price per seat."}
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ── profile/hover-card ───────────────────────────────────────────── */

const PEOPLE: Record<string, { role: string; where: string; local: string; free: boolean }> = {
  "Nadia Rahal": { role: "Design lead", where: "Amsterdam", local: "16:20", free: true },
  "Ivo Marek": { role: "Engineer", where: "Prague", local: "16:20", free: false },
  "Sam Oyelaran": { role: "Support", where: "Lagos", local: "15:20", free: true },
};

const MENTION_LINE = [
  { who: "Nadia Rahal", said: "moved this to In review" },
  { who: "Ivo Marek", said: "left 3 comments" },
  { who: "Sam Oyelaran", said: "linked a customer ticket" },
];

function HoverBefore() {
  return (
    <Stage className="justify-center">
      <ul className={cn(CARD, "divide-y")}>
        {MENTION_LINE.map((m) => (
          <li key={m.who} className="flex items-center gap-2 px-3 py-2">
            <Av name={m.who} />
            <p className="text-ui-sm">
              <span title={m.who} className="font-medium underline decoration-dotted">
                {m.who}
              </span>{" "}
              <span className="text-muted-foreground">{m.said}</span>
            </p>
          </li>
        ))}
      </ul>
    </Stage>
  );
}

function HoverAfter() {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const show = (who: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(who), 120);
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), 120);
  };

  return (
    <Stage className="justify-center">
      <ul className={cn(CARD, "divide-y")}>
        {MENTION_LINE.map((m) => {
          const p = PEOPLE[m.who];
          return (
            <li key={m.who} className="flex items-center gap-2 px-3 py-2">
              <Av name={m.who} />
              <p className="text-ui-sm">
                <span className="relative inline-block">
                  <button
                    type="button"
                    onPointerEnter={() => show(m.who)}
                    onPointerLeave={hide}
                    onFocus={() => setOpen(m.who)}
                    onBlur={() => setOpen(null)}
                    className="font-medium underline decoration-dotted underline-offset-2"
                  >
                    {m.who}
                  </button>
                  {open === m.who && (
                    <span
                      onPointerEnter={() => show(m.who)}
                      onPointerLeave={hide}
                      className="bg-popover shadow-floating absolute bottom-6 left-0 z-10 block w-56 rounded-xl border p-3"
                    >
                      <span className="flex items-center gap-2">
                        <Av name={m.who} className="size-8" />
                        <span className="block min-w-0">
                          <span className="text-ui-sm block truncate font-medium">{m.who}</span>
                          <span className="text-caption text-muted-foreground block truncate">
                            {p.role} · {p.where}
                          </span>
                        </span>
                      </span>
                      <span className="text-caption text-muted-foreground mt-2 flex items-center gap-1.5">
                        <Dot tone={p.free ? "bg-positive" : "bg-foreground/30"} />
                        {p.local} local time · {p.free ? "free now" : "in a meeting"}
                      </span>
                    </span>
                  )}
                </span>{" "}
                <span className="text-muted-foreground">{m.said}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </Stage>
  );
}

/* ── settings/permissions ─────────────────────────────────────────── */

const MEMBERS = ["Nadia Rahal", "Ivo Marek", "Sam Oyelaran"] as const;
const ROLES = ["Viewer", "Editor", "Admin"] as const;
type Role = (typeof ROLES)[number];

function PermissionsBefore() {
  const [grid, setGrid] = useState<Record<string, boolean[]>>({
    "Nadia Rahal": [true, true, false],
    "Ivo Marek": [true, false, false],
    "Sam Oyelaran": [true, false, false],
  });
  const [saved, setSaved] = useState(false);
  return (
    <Stage className="justify-start">
      <div className={cn(CARD, "overflow-hidden")}>
        <div className="text-micro text-muted-foreground bg-secondary flex items-center gap-2 px-3 py-2 uppercase">
          <span className="flex-1">Member</span>
          {["View", "Edit", "Admin"].map((h) => (
            <span key={h} className="w-12 text-center">
              {h}
            </span>
          ))}
        </div>
        <ul className="divide-y">
          {MEMBERS.map((m) => (
            <li key={m} className="flex items-center gap-2 px-3 py-2">
              <span className="text-ui-sm flex-1 truncate">{m}</span>
              {grid[m].map((on, i) => (
                <span key={ROLES[i]} className="grid w-12 place-items-center">
                  <input
                    type="checkbox"
                    checked={on}
                    aria-label={`${["View", "Edit", "Admin"][i]} for ${m}`}
                    onChange={() => {
                      setSaved(false);
                      setGrid((g) => ({
                        ...g,
                        [m]: g[m].map((v, k) => (k === i ? !v : v)),
                      }));
                    }}
                    className="size-4"
                  />
                </span>
              ))}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="lg" onClick={() => setSaved(true)}>
          Save changes
        </Button>
        {saved && <span className="text-caption text-muted-foreground">Saved</span>}
      </div>
    </Stage>
  );
}

function PermissionsAfter() {
  const [roles, setRoles] = useState<Record<string, Role>>({
    "Nadia Rahal": "Editor",
    "Ivo Marek": "Viewer",
    "Sam Oyelaran": "Viewer",
  });
  const [last, setLast] = useState<{ who: string; from: Role; to: Role } | null>(null);
  return (
    <Stage className="justify-start">
      <ul className={cn(CARD, "divide-y")}>
        {MEMBERS.map((m) => (
          <li key={m} className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Av name={m} />
            <span className="text-ui-sm min-w-0 flex-1 truncate">{m}</span>
            <Segmented
              options={ROLES}
              value={roles[m]}
              label={`Role for ${m}`}
              onChange={(r) => {
                setLast({ who: m, from: roles[m], to: r });
                setRoles((v) => ({ ...v, [m]: r }));
              }}
            />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex min-h-9 items-center gap-2" aria-live="polite">
        {last && (
          <>
            <p className="text-caption text-muted-foreground">
              {last.who.split(" ")[0]} is now {last.to === "Admin" ? "an" : "a"}{" "}
              <span className="text-foreground">{last.to}</span>.
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setRoles((v) => ({ ...v, [last.who]: last.from }));
                setLast(null);
              }}
            >
              Undo
            </Button>
          </>
        )}
      </div>
    </Stage>
  );
}

/* ── tables/invoices ──────────────────────────────────────────────── */

const INVOICES = [
  { id: "INV-0417", who: "Northwind Ltd", amount: 4820, due: "30 Apr", state: "Paid" },
  { id: "INV-0416", who: "Contoso BV", amount: 1180, due: "24 Apr", state: "Open" },
  { id: "INV-0415", who: "Fabrikam GmbH", amount: 9640, due: "18 Apr", state: "Paid" },
  { id: "INV-0414", who: "Adventure Works", amount: 720, due: "11 Apr", state: "Late" },
];

function InvoiceDetail({ row }: { row: (typeof INVOICES)[number] }) {
  return (
    <div className="bg-secondary text-caption text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 px-3 py-2">
      <span>
        Issued <span className="text-foreground">1 April 2026</span>
      </span>
      <span>
        Terms <span className="text-foreground">30 days</span>
      </span>
      <span>
        Contact <span className="text-foreground">billing@{row.who.split(" ")[0].toLowerCase()}.com</span>
      </span>
    </div>
  );
}

function TableBefore() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Stage className="justify-start">
      <div className={cn(CARD, "overflow-hidden")}>
        {INVOICES.map((r) => (
          <div key={r.id} className="border-b last:border-b-0">
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="text-caption text-muted-foreground w-20 shrink-0 tabular-nums">
                {r.id}
              </span>
              <span className="text-ui-sm flex-1 truncate">{r.who}</span>
              <span className="text-caption tabular-nums">€{money(r.amount)}</span>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`Show details for ${r.id}`}
                onClick={() => setOpen(open === r.id ? null : r.id)}
              >
                <ChevronDown
                  className={cn("duration-fast transition-transform", open === r.id && "rotate-180")}
                  aria-hidden
                />
              </Button>
            </div>
            {open === r.id && <InvoiceDetail row={r} />}
          </div>
        ))}
      </div>
    </Stage>
  );
}

function TableAfter() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Stage className="justify-start">
      <div className={cn(CARD, "overflow-hidden")}>
        {INVOICES.map((r) => (
          <div key={r.id} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => setOpen(open === r.id ? null : r.id)}
              aria-expanded={open === r.id}
              className={cn(
                "hover:bg-secondary flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
                open === r.id && "bg-secondary",
              )}
            >
              <span className="text-caption text-muted-foreground w-20 shrink-0 tabular-nums">
                {r.id}
              </span>
              <span className="text-ui-sm flex-1 truncate">{r.who}</span>
              <span className="text-caption tabular-nums">€{money(r.amount)}</span>
              <ChevronDown
                className={cn(
                  "text-muted-foreground duration-fast size-4 transition-transform",
                  open === r.id && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {open === r.id && <InvoiceDetail row={r} />}
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ── threads/mention-popover ──────────────────────────────────────── */

const TEAM = ["Nadia Rahal", "Ivo Marek", "Sam Oyelaran", "Priya Nair"];

function MentionBefore() {
  const id = useId();
  const [v, setV] = useState("");
  const [posted, setPosted] = useState<string | null>(null);
  const unknown = posted
    ? (posted.match(/@[\w.]+/g) ?? []).filter(
        (h) => !TEAM.some((t) => t.toLowerCase().replace(" ", ".") === h.slice(1).toLowerCase()),
      )
    : [];
  return (
    <Stage className="justify-start">
      <label htmlFor={id} className="text-caption text-muted-foreground">
        Add a comment
      </label>
      <textarea
        id={id}
        value={v}
        rows={3}
        placeholder="Type @ and the exact handle to mention someone"
        onChange={(e) => setV(e.target.value)}
        className="text-ui-sm bg-background mt-1 w-full rounded-lg border p-2.5 outline-none focus-visible:border-ring"
      />
      <Button
        size="lg"
        className="mt-2 self-start"
        disabled={!v.trim()}
        onClick={() => {
          setPosted(v);
          setV("");
        }}
      >
        Comment
      </Button>
      {posted && (
        <div className={cn(CARD, "mt-3 p-3")}>
          <p className="text-ui-sm break-words">{posted}</p>
          {unknown.length > 0 && (
            <p className="text-caption text-destructive mt-1">
              {unknown.join(", ")} did not match anyone, so nobody was told.
            </p>
          )}
        </div>
      )}
    </Stage>
  );
}

function MentionAfter() {
  const id = useId();
  const [v, setV] = useState("");
  const [idx, setIdx] = useState(0);
  const [posted, setPosted] = useState<string[] | null>(null);
  const ta = useRef<HTMLTextAreaElement | null>(null);

  const m = /(?:^|\s)@([\w ]*)$/.exec(v);
  const query = m?.[1]?.toLowerCase() ?? null;
  const matches =
    query === null ? [] : TEAM.filter((t) => t.toLowerCase().includes(query.trim())).slice(0, 4);
  const open = matches.length > 0;

  const insert = (name: string) => {
    setV(`${v.replace(/@[\w ]*$/, `@${name}`)} `);
    setIdx(0);
    ta.current?.focus();
  };

  return (
    <Stage className="justify-start">
      <label htmlFor={id} className="text-caption text-muted-foreground">
        Add a comment
      </label>
      <div className="relative mt-1">
        <textarea
          id={id}
          ref={ta}
          value={v}
          rows={3}
          placeholder="Type @ to mention someone"
          onChange={(e) => {
            setV(e.target.value);
            setIdx(0);
          }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIdx((i) => (i + 1) % matches.length);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setIdx((i) => (i - 1 + matches.length) % matches.length);
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              insert(matches[idx]);
            }
            if (e.key === "Escape") setV(`${v} `);
          }}
          className="text-ui-sm bg-background w-full rounded-lg border p-2.5 outline-none focus-visible:border-ring"
        />
        {open && (
          <ul className="bg-popover shadow-floating absolute top-full left-0 z-10 mt-1 w-56 overflow-hidden rounded-xl border">
            {matches.map((t, i) => (
              <li key={t}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insert(t)}
                  onPointerEnter={() => setIdx(i)}
                  className={cn(
                    "flex h-9 w-full items-center gap-2 px-2.5 text-left",
                    i === idx && "bg-secondary",
                  )}
                >
                  <Av name={t} className="size-5" />
                  <span className="text-caption truncate">{t}</span>
                  {i === idx && (
                    <span className="text-micro text-muted-foreground ml-auto uppercase">Enter</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        size="lg"
        className="mt-2 self-start"
        disabled={!v.trim()}
        onClick={() => {
          setPosted(v.split(/(@[\w]+(?: [\w]+)?)/g).filter(Boolean));
          setV("");
        }}
      >
        Comment
      </Button>
      {posted && (
        <div className={cn(CARD, "mt-3 p-3")}>
          <p className="text-ui-sm break-words">
            {posted.map((part, i) =>
              part.startsWith("@") && TEAM.includes(part.slice(1)) ? (
                <span
                  key={`${part}-${i}`}
                  className="bg-accent text-accent-foreground rounded-md px-1"
                >
                  {part}
                </span>
              ) : (
                <span key={`${part}-${i}`}>{part}</span>
              ),
            )}
          </p>
        </div>
      )}
    </Stage>
  );
}

/* ── threads/compose-rich ─────────────────────────────────────────── */

function rich(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return (
        <strong key={`${p}-${i}`} className="font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    if (p.startsWith("_") && p.endsWith("_"))
      return <em key={`${p}-${i}`}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code key={`${p}-${i}`} className="bg-secondary rounded-sm px-1 font-mono">
          {p.slice(1, -1)}
        </code>
      );
    return <span key={`${p}-${i}`}>{p}</span>;
  });
}

const DRAFT = "The sheet **drags past its stop** on iOS — see `useDragConstraints`.";

function ComposeBefore() {
  const id = useId();
  const [v, setV] = useState(DRAFT);
  const [posted, setPosted] = useState<string | null>(null);
  return (
    <Stage className="justify-start">
      <label htmlFor={id} className="text-caption text-muted-foreground">
        Reply
      </label>
      <textarea
        id={id}
        value={v}
        rows={3}
        onChange={(e) => setV(e.target.value)}
        className="text-ui-sm bg-background mt-1 w-full rounded-lg border p-2.5 outline-none focus-visible:border-ring"
      />
      <Button
        size="lg"
        className="mt-2 self-start"
        onClick={() => {
          setPosted(v);
          setV("");
        }}
      >
        Reply
      </Button>
      {posted && (
        <div className={cn(CARD, "mt-3 p-3")}>
          <p className="text-ui-sm break-words">{posted}</p>
        </div>
      )}
    </Stage>
  );
}

function ComposeAfter() {
  const id = useId();
  const [v, setV] = useState(DRAFT);
  const [posted, setPosted] = useState<string | null>(null);
  const ta = useRef<HTMLTextAreaElement | null>(null);

  const wrap = (mark: string) => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const chosen = v.slice(s, e) || "text";
    const next = `${v.slice(0, s)}${mark}${chosen}${mark}${v.slice(e)}`;
    setV(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + mark.length, s + mark.length + chosen.length);
    });
  };

  return (
    <Stage className="justify-start">
      <label htmlFor={id} className="text-caption text-muted-foreground">
        Reply
      </label>
      <div className="bg-background mt-1 rounded-lg border">
        <div className="flex items-center gap-1 border-b p-1">
          {(
            [
              ["**", Bold, "Bold"],
              ["_", Italic, "Italic"],
              ["`", Code, "Code"],
            ] as const
          ).map(([mark, Icon, label]) => (
            <Button
              key={label}
              variant="ghost"
              size="icon-lg"
              aria-label={label}
              onClick={() => wrap(mark)}
            >
              <Icon aria-hidden />
            </Button>
          ))}
          <span className="text-micro text-muted-foreground ml-auto pr-2 uppercase">⌘B works</span>
        </div>
        <textarea
          id={id}
          ref={ta}
          value={v}
          rows={3}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
              e.preventDefault();
              wrap("**");
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
              e.preventDefault();
              wrap("_");
            }
          }}
          className="text-ui-sm w-full resize-none bg-transparent p-2.5 outline-none"
        />
      </div>
      <p className="text-caption text-muted-foreground mt-2">
        Preview: <span className="text-foreground">{rich(v)}</span>
      </p>
      <Button
        size="lg"
        className="mt-2 self-start"
        onClick={() => {
          setPosted(v);
          setV("");
        }}
      >
        Reply
      </Button>
      {posted && (
        <div className={cn(CARD, "mt-3 p-3")}>
          <p className="text-ui-sm break-words">{rich(posted)}</p>
        </div>
      )}
    </Stage>
  );
}

/* ── timelines/activity-feed ──────────────────────────────────────── */

const FEED = [
  { who: "Nadia Rahal", what: "moved ENG-241 to In review", mins: 22 },
  { who: "Ivo Marek", what: "opened a pull request on the rail", mins: 96 },
  { who: "You", what: "commented on ENG-233", mins: 240 },
  { who: "Sam Oyelaran", what: "linked a customer ticket", mins: 1500 },
  { who: "Nadia Rahal", what: "shipped v2.1 to production", mins: 1620 },
  { who: "Priya Nair", what: "invited two teammates", mins: 3100 },
  { who: "Ivo Marek", what: "closed ENG-201", mins: 4400 },
  { who: "You", what: "created the Q2 pricing project", mins: 5900 },
];

const STAMP = (mins: number) => {
  const day = 13 - Math.floor(mins / 1440);
  const h = String(((24 - Math.floor(mins / 60)) % 24 + 24) % 24).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `2026-04-${String(day).padStart(2, "0")}T${h}:${mm}:00Z`;
};

const RELATIVE = (mins: number) =>
  mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.round(mins / 60)} h ago` : "";

function bucket(mins: number) {
  if (mins < 1440) return "Today";
  if (mins < 2880) return "Yesterday";
  return "Earlier";
}

function FeedBefore() {
  const [n, setN] = useState(5);
  return (
    <Stage className="justify-start">
      <ul className={cn(CARD, "divide-y")}>
        {FEED.slice(0, n).map((f) => (
          <li key={f.what} className="flex gap-2 px-3 py-2">
            <span className="text-caption text-muted-foreground shrink-0 font-mono">
              {STAMP(f.mins)}
            </span>
            <span className="text-caption truncate">
              {f.who.toLowerCase().replace(" ", ".")} — {f.what}
            </span>
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        size="lg"
        className="mt-3 self-start"
        disabled={n >= FEED.length}
        onClick={() => setN(FEED.length)}
      >
        Load more
      </Button>
    </Stage>
  );
}

function FeedAfter() {
  const [n, setN] = useState(5);
  const shown = FEED.slice(0, n);
  const groups = ["Today", "Yesterday", "Earlier"].filter((g) =>
    shown.some((f) => bucket(f.mins) === g),
  );
  return (
    <Stage className="justify-start">
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g}>
            <p className="text-micro text-muted-foreground mb-1 uppercase">{g}</p>
            <ul className={cn(CARD, "divide-y")}>
              {shown
                .filter((f) => bucket(f.mins) === g)
                .map((f) => (
                  <li key={f.what} className="flex items-center gap-2 px-3 py-2">
                    <Av name={f.who} />
                    <p className="text-ui-sm min-w-0 flex-1 truncate">
                      <span className="font-medium">{f.who}</span>{" "}
                      <span className="text-muted-foreground">{f.what}</span>
                    </p>
                    {RELATIVE(f.mins) && (
                      <span className="text-caption text-muted-foreground shrink-0 tabular-nums">
                        {RELATIVE(f.mins)}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="lg"
        className="mt-3 self-start"
        disabled={n >= FEED.length}
        onClick={() => setN(FEED.length)}
      >
        Load more
      </Button>
    </Stage>
  );
}

/* ── toasts/undo ──────────────────────────────────────────────────── */

const VIEWS = ["Everything open", "Assigned to me", "Bugs this week", "Waiting on customer"];

function ViewList({
  views,
  onDelete,
  onReset,
}: {
  views: string[];
  onDelete: (v: string) => void;
  onReset: () => void;
}) {
  return (
    <>
      <ul className={cn(CARD, "divide-y")}>
        {views.map((v) => (
          <li key={v} className="flex items-center gap-2 px-3 py-2">
            <Search className="text-muted-foreground size-3.5" aria-hidden />
            <span className="text-ui-sm flex-1 truncate">{v}</span>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={`Delete ${v}`}
              onClick={() => onDelete(v)}
            >
              <Trash2 aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      {views.length < VIEWS.length && (
        <Button variant="outline" size="lg" className="mt-3 self-start" onClick={onReset}>
          Start over
        </Button>
      )}
    </>
  );
}

function UndoBefore() {
  const [views, setViews] = useState(VIEWS);
  return (
    <Stage className="justify-start">
      <ViewList
        views={views}
        onReset={() => setViews(VIEWS)}
        onDelete={(v) => {
          setViews((l) => l.filter((x) => x !== v));
          toast("View deleted");
        }}
      />
    </Stage>
  );
}

function UndoAfter() {
  const [views, setViews] = useState(VIEWS);
  return (
    <Stage className="justify-start">
      <ViewList
        views={views}
        onReset={() => setViews(VIEWS)}
        onDelete={(v) => {
          const at = views.indexOf(v);
          setViews((l) => l.filter((x) => x !== v));
          toast(`“${v}” deleted`, {
            action: {
              label: "Undo",
              onClick: () =>
                setViews((l) => {
                  if (l.includes(v)) return l;
                  const next = l.slice();
                  next.splice(at, 0, v);
                  return next;
                }),
            },
          });
        }}
      />
    </Stage>
  );
}

/* ── tours/inline-hint ────────────────────────────────────────────── */

const TOUR = [
  { t: "Welcome to Workspaces", b: "This is where your team's projects live." },
  { t: "Everything hangs off a workspace", b: "Projects, members and billing." },
  { t: "You can rename it later", b: "Changing the address breaks old links." },
];

function WorkspacePanel({ dim }: { dim?: boolean }) {
  const a = useId();
  const b = useId();
  return (
    <div className={cn(CARD, "space-y-2 p-3", dim && "opacity-40")}>
      <p className="text-ui-sm font-medium">Workspace</p>
      <div>
        <label htmlFor={a} className="text-caption text-muted-foreground block">
          Name
        </label>
        <input id={a} defaultValue="Analytical Engines" className={FIELD} />
      </div>
      <div>
        <label htmlFor={b} className="text-caption text-muted-foreground block">
          Address
        </label>
        <input id={b} defaultValue="analytical-engines" className={cn(FIELD, "font-mono")} />
      </div>
    </div>
  );
}

function TourBefore() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  return (
    <Stage className="relative justify-center">
      <WorkspacePanel dim={!done} />
      {!done && (
        <Overlay>
          <p className="text-ui font-semibold">{TOUR[step].t}</p>
          <p className="text-caption text-muted-foreground mt-1">{TOUR[step].b}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-caption text-muted-foreground tabular-nums">
              {step + 1} of {TOUR.length}
            </span>
            <Button
              size="lg"
              className="ml-auto"
              onClick={() => (step === TOUR.length - 1 ? setDone(true) : setStep(step + 1))}
            >
              {step === TOUR.length - 1 ? "Start using it" : "Next"}
            </Button>
          </div>
        </Overlay>
      )}
      {done && (
        <Button
          variant="outline"
          size="lg"
          className="mt-3 self-start"
          onClick={() => {
            setDone(false);
            setStep(0);
          }}
        >
          Show it again
        </Button>
      )}
    </Stage>
  );
}

function TourAfter() {
  const a = useId();
  const b = useId();
  const [hint, setHint] = useState(true);
  return (
    <Stage className="justify-center">
      <div className={cn(CARD, "space-y-2 p-3")}>
        <p className="text-ui-sm font-medium">Workspace</p>
        <div>
          <label htmlFor={a} className="text-caption text-muted-foreground block">
            Name
          </label>
          <input id={a} defaultValue="Analytical Engines" className={FIELD} />
        </div>
        <div>
          <label htmlFor={b} className="text-caption text-muted-foreground block">
            Address
          </label>
          <input id={b} defaultValue="analytical-engines" className={cn(FIELD, "font-mono")} />
          {hint && (
            <div className="bg-accent text-accent-foreground mt-1.5 flex items-start gap-2 rounded-lg p-2">
              <AtSign className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <p className="text-caption flex-1">
                Changing this breaks links people already have. The old address keeps working for
                30 days.
              </p>
              <button type="button" aria-label="Dismiss hint" onClick={() => setHint(false)}>
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
      {!hint && (
        <Button variant="outline" size="lg" className="mt-3 self-start" onClick={() => setHint(true)}>
          Show it again
        </Button>
      )}
    </Stage>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function DevlDevDemo() {
  return (
    <>
      {/* tables/invoices */}
      <BeforeAfter
        principle="Now you can press anywhere on the row."
        before={<TableBefore />}
        after={<TableAfter />}
      />

      {/* auth/otp-verify */}
      <BeforeAfter
        principle="Type the code and it moves along by itself."
        before={<OtpBefore />}
        after={<OtpAfter />}
      />

      {/* pricing/monthly-yearly */}
      <BeforeAfter
        principle="The price stops jumping around when it changes."
        before={<PricingBefore />}
        after={<PricingAfter />}
      />

      {/* cards/payment-method */}
      <BeforeAfter
        principle="The card number spaces itself as you type, so you can check it."
        before={<PaymentBefore />}
        after={<PaymentAfter />}
      />

      {/* calendars/date-range */}
      <BeforeAfter
        principle="Pick the two days instead of typing them."
        before={<RangeBefore />}
        after={<RangeAfter />}
      />

      {/* charts/revenue-area */}
      <BeforeAfter
        principle="You can read the exact day you point at."
        before={<ChartBefore />}
        after={<ChartAfter />}
      />

      {/* toasts/undo */}
      <BeforeAfter
        principle="You can take it back."
        before={<UndoBefore />}
        after={<UndoAfter />}
      />

      {/* empty-states/no-results */}
      <BeforeAfter
        principle="One press gets your files back."
        before={<NoResultsBefore />}
        after={<NoResultsAfter />}
      />

      {/* filters/chips */}
      <BeforeAfter
        principle="You can see what you filtered by without opening anything."
        before={<ChipsBefore />}
        after={<ChipsAfter />}
      />

      {/* forms/invite-teammates */}
      <BeforeAfter
        principle="Paste the whole list at once."
        before={<InviteBefore />}
        after={<InviteAfter />}
      />

      {/* threads/mention-popover */}
      <BeforeAfter
        principle="Type @ and pick the person."
        before={<MentionBefore />}
        after={<MentionAfter />}
      />

      {/* threads/compose-rich */}
      <BeforeAfter
        principle="Select a word, press bold, and it is bold."
        before={<ComposeBefore />}
        after={<ComposeAfter />}
      />

      {/* layouts/split-resizable */}
      <BeforeAfter
        principle="Drag the divider to give the side you are reading more room."
        before={<SplitBefore />}
        after={<SplitAfter />}
      />

      {/* layouts/mini-rail */}
      <BeforeAfter
        principle="You can tell what the icons do before you press one."
        before={<RailBefore />}
        after={<RailAfter />}
      />

      {/* modals/confirm-delete */}
      <BeforeAfter
        principle="It tells you exactly what is about to disappear."
        before={<ConfirmBefore />}
        after={<ConfirmAfter />}
      />

      {/* modals/upload-files */}
      <BeforeAfter
        principle="You can see how far each file has got, and stop one."
        before={<UploadBefore />}
        after={<UploadAfter />}
      />

      {/* pricing/slider-seats */}
      <BeforeAfter
        principle="Drag the seats and the price keeps up."
        before={<SeatsBefore />}
        after={<SeatsAfter />}
      />

      {/* settings/permissions */}
      <BeforeAfter
        principle="Changing someone's access takes one press, and it says what happened."
        before={<PermissionsBefore />}
        after={<PermissionsAfter />}
      />

      {/* profile/hover-card */}
      <BeforeAfter
        principle="Point at a name to see who they are without leaving the page."
        before={<HoverBefore />}
        after={<HoverAfter />}
      />

      {/* timelines/activity-feed */}
      <BeforeAfter
        principle="You can see what happened today without decoding a timestamp."
        before={<FeedBefore />}
        after={<FeedAfter />}
      />

      {/* cards/invoice */}
      <BeforeAfter
        principle="The amounts line up in a column you can add with your eyes."
        before={<InvoiceCardBefore />}
        after={<InvoiceCardAfter />}
      />

      {/* auth/centered-signup */}
      <BeforeAfter
        principle="You find out the password is good enough while you type it."
        before={<SignupBefore />}
        after={<SignupAfter />}
      />

      {/* dashboards/metrics-overview */}
      <BeforeAfter
        principle="It stops shouting, so you can find the number you came for."
        before={<MetricsBefore />}
        after={<MetricsAfter />}
      />

      {/* empty-states/offline */}
      <BeforeAfter
        principle="Your work is still there, and it tells you when it is going out."
        before={<OfflineBefore />}
        after={<OfflineAfter />}
      />

      {/* tours/inline-hint */}
      <BeforeAfter
        principle="Nothing stands in front of the screen before you have looked at it."
        before={<TourBefore />}
        after={<TourAfter />}
      />
    </>
  );
}
