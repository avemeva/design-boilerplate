"use client";

import NumberFlow from "@number-flow/react";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
} from "motion/react";
import {
  ArrowRight,
  AtSign,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Gauge,
  Image as ImageIcon,
  Layers,
  MessageCircle,
  RefreshCw,
  Rss,
  Search,
  Send,
  Settings,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { BeforeAfter, Micro } from "@/components/surface";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Efferd is a shadcn registry, not a document, so its "content" is the
 * 201 items at https://efferd.com/r/registry.json — 166 blocks across
 * 17 categories, 30 components, 4 hooks and 1 style.
 *
 * Every switch below is one of those categories, rebuilt twice from
 * this project's own primitives: the version a normal product ships,
 * and the version worth paying for. Same content on both sides, same
 * spot, both operable.
 *
 * Category counts, read off the live registry on 2026-08-05:
 *   cta 20 · auth 14 · footer 14 · header 14 · integrations 12 ·
 *   contact 11 · logo-cloud 11 · app-shell 10 · dashboard 10 ·
 *   features 10 · hero 9 · faqs 8 · testimonials 8 · pricing 7 ·
 *   blogs 5 · not-found 2 · image-gallery 1
 */

/* ── shared ───────────────────────────────────────────────────────── */

/** setTimeout that cleans itself up. No state is ever set in an effect. */
function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
    },
    [],
  );

  return useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
}

function Frame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl", className)}>{children}</div>
  );
}

/* ── 1. auth ──────────────────────────────────────────────────────── */

function SignIn({ vague }: { vague: boolean }) {
  const [email, setEmail] = useState("ada@lovelace");
  const [password, setPassword] = useState("babbage");
  const [banner, setBanner] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const emailOk = /.+@.+\..+/.test(email);
    const passwordOk = password.length >= 8;

    if (emailOk && passwordOk) {
      setBanner(false);
      setEmailError(null);
      setPasswordError(null);
      toast("Signed in as " + email);
      return;
    }

    if (vague) {
      setBanner(true);
      setEmail("");
      setPassword("");
      return;
    }

    setEmailError(
      emailOk ? null : "This address is missing its ending, like .com.",
    );
    setPasswordError(passwordOk ? null : "Passwords are at least 8 characters.");
    (emailOk ? passwordRef : emailRef).current?.focus();
  }

  return (
    <Frame className="max-w-sm">
      <h3 className="text-title">Sign in</h3>
      <p className="text-caption text-muted-foreground mt-1">
        Use the email your licence was sent to.
      </p>

      <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
        {vague && banner && (
          <p className="text-caption text-destructive bg-secondary rounded-lg px-3 py-2">
            Something went wrong. Please try again.
          </p>
        )}

        <div className="space-y-1.5">
          {!vague && <Label htmlFor="ef-email">Email</Label>}
          <Input
            id="ef-email"
            ref={emailRef}
            className="h-9"
            type="email"
            value={email}
            placeholder={vague ? "Email" : "you@studio.com"}
            aria-label={vague ? "Email" : undefined}
            aria-invalid={!vague && emailError ? true : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
            }}
          />
          {!vague && emailError && (
            <p className="text-caption text-destructive">{emailError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          {!vague && <Label htmlFor="ef-password">Password</Label>}
          <div className="relative">
            <Input
              id="ef-password"
              ref={passwordRef}
              className={cn("h-9", !vague && "pr-10")}
              type={!vague && reveal ? "text" : "password"}
              value={password}
              placeholder={vague ? "Password" : "At least 8 characters"}
              aria-label={vague ? "Password" : undefined}
              aria-invalid={!vague && passwordError ? true : undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
            />
            {!vague && (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label={reveal ? "Hide password" : "Show password"}
                className="text-muted-foreground absolute top-0 right-0"
                onClick={() => setReveal((r) => !r)}
              >
                {reveal ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </Button>
            )}
          </div>
          {!vague && passwordError && (
            <p className="text-caption text-destructive">{passwordError}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </form>
    </Frame>
  );
}

/* ── 2. contact ───────────────────────────────────────────────────── */

function ContactForm({ placeholderOnly }: { placeholderOnly: boolean }) {
  const [name, setName] = useState("Ada Lovelace");
  const [email, setEmail] = useState("ada@analyticalengine.co");
  const [message, setMessage] = useState(
    "Does the Pro licence cover client work?",
  );

  return (
    <Frame>
      <h3 className="text-title">Talk to us</h3>
      <p className="text-caption text-muted-foreground mt-1">
        We answer within a working day.
      </p>

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast("Message sent", { description: "We will reply to " + email });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            {!placeholderOnly && <Label htmlFor="ef-name">Your name</Label>}
            <Input
              id="ef-name"
              className="h-9"
              value={name}
              placeholder={placeholderOnly ? "Your name" : "Ada Lovelace"}
              aria-label={placeholderOnly ? "Your name" : undefined}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            {!placeholderOnly && <Label htmlFor="ef-reply">Reply to</Label>}
            <Input
              id="ef-reply"
              className="h-9"
              value={email}
              placeholder={placeholderOnly ? "Reply to" : "you@studio.com"}
              aria-label={placeholderOnly ? "Reply to" : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          {!placeholderOnly && (
            <Label htmlFor="ef-message">What do you need?</Label>
          )}
          <Textarea
            id="ef-message"
            rows={3}
            value={message}
            placeholder={
              placeholderOnly ? "What do you need?" : "A sentence is plenty."
            }
            aria-label={placeholderOnly ? "What do you need?" : undefined}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <Button type="submit" size="lg">
          Send
        </Button>
      </form>
    </Frame>
  );
}

/* ── 3. hero ──────────────────────────────────────────────────────── */

function Hero({ equalWeight }: { equalWeight: boolean }) {
  return (
    <Frame className="py-4 text-center">
      <button
        type="button"
        onClick={() => toast("14 new blocks this month")}
        className="text-caption text-muted-foreground hover:text-foreground bg-secondary duration-fast ease-out-quart inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 transition-colors"
      >
        14 new blocks this month
        <ArrowRight className="size-3.5" aria-hidden />
      </button>

      <h3 className="text-title mt-5">
        <span className="font-semibold">166 sections</span> you do not have to
        build
      </h3>
      <p className="text-body text-muted-foreground mx-auto mt-3 max-w-sm">
        Headers, pricing, dashboards. One command each, and they already look
        finished.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button size="lg" onClick={() => toast("Starting your project")}>
          Start building
        </Button>
        <Button
          size="lg"
          variant={equalWeight ? "default" : "secondary"}
          onClick={() => toast("Browsing all 166 blocks")}
        >
          Browse the blocks
        </Button>
      </div>
    </Frame>
  );
}

/* ── 4. pricing ───────────────────────────────────────────────────── */

const PLANS = [
  { id: "hobby", name: "Hobby", monthly: 0, yearly: 0, note: "3 hero blocks" },
  { id: "pro", name: "Pro", monthly: 9, yearly: 86, note: "All 166 blocks" },
  { id: "team", name: "Team", monthly: 29, yearly: 278, note: "Five seats" },
] as const;

function Pricing({ jumpy }: { jumpy: boolean }) {
  const [yearly, setYearly] = useState(false);
  const switchId = jumpy ? "ef-freq-before" : "ef-freq-after";

  return (
    <Frame>
      <div className="flex items-center justify-center gap-3">
        <Label htmlFor={switchId} className="text-ui-sm">
          Pay yearly
        </Label>
        <Switch id={switchId} checked={yearly} onCheckedChange={setYearly} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {PLANS.map((p) => {
          const amount = yearly ? p.yearly : p.monthly;
          const saving = p.monthly * 12 - p.yearly;
          return (
            <div key={p.id} className="rounded-xl border p-4">
              <p className="text-ui-sm">{p.name}</p>

              <div className="mt-3 flex items-baseline gap-1">
                {jumpy ? (
                  <span className="text-title">${amount}</span>
                ) : (
                  <NumberFlow
                    value={amount}
                    locales="en-US"
                    format={{
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }}
                    className="text-title tabular-nums"
                  />
                )}
                <span className="text-caption text-muted-foreground">
                  {yearly ? "/year" : "/month"}
                </span>
              </div>

              <p className="text-caption text-positive mt-2 h-5">
                {!jumpy && yearly && saving > 0 ? `Saves $${saving} a year` : ""}
              </p>

              <p className="text-caption text-muted-foreground mt-1">{p.note}</p>

              <Button
                size="lg"
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => toast(`${p.name} selected`)}
              >
                Choose {p.name}
              </Button>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

/* ── 5. faqs ──────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "What do I actually get?",
    a: "166 finished sections plus 30 smaller components, added to your own project one command at a time.",
  },
  {
    q: "Do I need a subscription?",
    a: "No. Pro is paid once and the blocks stay yours, including the ones added later.",
  },
  {
    q: "Can I change a block afterwards?",
    a: "They land in your repository as ordinary files. Edit them like anything else you wrote.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. A handful of blocks, including three hero sections, are free forever.",
  },
  {
    q: "Can I use them for client work?",
    a: "One licence covers unlimited projects, including the ones you are paid for.",
  },
] as const;

function Faqs({ snap }: { snap: boolean }) {
  const [open, setOpen] = useState<string[]>([]);

  if (snap) {
    return (
      <Frame>
        {FAQS.map((f) => {
          const isOpen = open.includes(f.q);
          return (
            <div key={f.q} className="border-b last:border-b-0">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((o) =>
                    o.includes(f.q) ? o.filter((x) => x !== f.q) : [...o, f.q],
                  )
                }
                className="text-ui-sm flex min-h-9 w-full items-center justify-between gap-3 py-3 text-left"
              >
                {f.q}
                <ChevronDown
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
              </button>
              {isOpen && (
                <p className="text-caption text-muted-foreground pb-3">{f.a}</p>
              )}
            </div>
          );
        })}
      </Frame>
    );
  }

  return (
    <Frame>
      <Accordion type="single" collapsible>
        {FAQS.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-ui-sm min-h-9 items-center py-3 hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-caption text-muted-foreground pb-3">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Frame>
  );
}

/* ── 6. header ────────────────────────────────────────────────────── */

const PAGES = [
  {
    id: "blocks",
    label: "Blocks",
    body: "166 finished sections across 17 kinds.",
  },
  {
    id: "components",
    label: "Components",
    body: "30 small pieces the blocks are built from.",
  },
  {
    id: "templates",
    label: "Templates",
    body: "Whole pages, already assembled.",
  },
  {
    id: "pricing",
    label: "Pricing",
    body: "A free tier, or one payment for everything.",
  },
] as const;

function SiteHeader({ noCurrent }: { noCurrent: boolean }) {
  const [page, setPage] = useState<string>("blocks");
  const current = PAGES.find((p) => p.id === page) ?? PAGES[0];

  return (
    <Frame>
      <div className="flex h-14 items-center gap-1 rounded-xl border px-2">
        <span className="text-ui-sm px-2 font-semibold">Efferd</span>
        <nav className="flex items-center gap-0.5">
          {PAGES.map((p) => {
            const active = p.id === page;
            return (
              <button
                key={p.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setPage(p.id)}
                className={cn(
                  "text-ui-sm duration-fast ease-out-quart relative h-9 rounded-lg px-2.5 transition-colors sm:px-3",
                  !noCurrent && active
                    ? "text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {!noCurrent && active && (
                  <motion.span
                    layoutId="ef-nav-indicator"
                    className="bg-accent absolute inset-0 rounded-lg"
                    transition={{ duration: duration.base, ease: ease.outQuart }}
                  />
                )}
                <span className="relative">{p.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-secondary mt-3 rounded-xl p-4">
        <p className="text-ui">{current.label}</p>
        <p className="text-caption text-muted-foreground mt-1">{current.body}</p>
      </div>
    </Frame>
  );
}

/* ── 7. app shell ─────────────────────────────────────────────────── */

const RAIL = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "blocks", label: "My blocks", icon: Boxes },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

function AppRail({ tight }: { tight: boolean }) {
  const [active, setActive] = useState("blocks");
  const current = RAIL.find((r) => r.id === active) ?? RAIL[0];

  return (
    <Frame>
      <div className="grid gap-3 sm:grid-cols-[13rem_1fr]">
        <div className="bg-secondary rounded-xl p-2">
          {RAIL.map((r) => {
            const isActive = r.id === active;

            if (tight) {
              return (
                <div key={r.id} className="px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setActive(r.id)}
                    className={cn(
                      "text-ui-sm inline-flex items-center gap-2 text-left hover:underline",
                      isActive && "font-semibold",
                    )}
                  >
                    <r.icon className="size-4" aria-hidden />
                    {r.label}
                  </button>
                </div>
              );
            }

            return (
              <button
                key={r.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActive(r.id)}
                className={cn(
                  "text-ui-sm duration-fast ease-out-quart flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors",
                  isActive ? "bg-card font-medium shadow-xs" : "hover:bg-card",
                )}
              >
                <r.icon
                  className={cn(
                    "size-4.5",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-ui">{current.label}</p>
          <p className="text-caption text-muted-foreground mt-1">
            Everything under {current.label.toLowerCase()} lives here.
          </p>
        </div>
      </div>
    </Frame>
  );
}

/* ── 8. dashboard ─────────────────────────────────────────────────── */

function StatTile({ wipes }: { wipes: boolean }) {
  const [value, setValue] = useState(48219);
  const [delta, setDelta] = useState(6.4);
  const [busy, setBusy] = useState(false);
  const after = useTimers();

  function refresh() {
    if (busy) return;
    setBusy(true);
    after(() => {
      setValue((v) => v + 400 + Math.round(Math.random() * 3000));
      setDelta(Number((2 + Math.random() * 9).toFixed(1)));
      setBusy(false);
    }, 900);
  }

  return (
    <Frame className="max-w-sm">
      <div className="rounded-xl border p-5">
        {wipes && busy ? (
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <Micro>Blocks installed</Micro>
              {!wipes && busy && (
                <Spinner className="text-muted-foreground size-3.5" />
              )}
            </div>

            {wipes ? (
              <p className="text-title mt-2">{value.toLocaleString("en-US")}</p>
            ) : (
              <NumberFlow
                value={value}
                locales="en-US"
                className="text-title mt-2 block tabular-nums"
              />
            )}

            <p className="text-caption text-muted-foreground mt-2">
              <span className="text-positive">+{delta}%</span> since last week
            </p>
          </>
        )}

        <Button
          size="lg"
          variant="secondary"
          className="mt-5"
          onClick={refresh}
          disabled={busy}
        >
          <RefreshCw className={cn(busy && "animate-spin")} aria-hidden />
          Refresh
        </Button>
      </div>
    </Frame>
  );
}

/* ── 9. testimonials ──────────────────────────────────────────────── */

const QUOTES = [
  {
    name: "Priya Raman",
    role: "Founder, Kettle",
    text: "Shipped the marketing site in a weekend.",
  },
  {
    name: "Tom Okafor",
    role: "Engineer, Northbound",
    text: "I stopped arguing with myself about padding — the blocks already had an answer. The parts I did change were ordinary files sitting in my own repository, not something buried in a package I would have to fight later.",
  },
  {
    name: "Lena Fischer",
    role: "Design lead, Auger",
    text: "The dashboard block saved us about three weeks of fiddling with charts.",
  },
] as const;

function Testimonials({ resizes }: { resizes: boolean }) {
  const [i, setI] = useState(1);
  const q = QUOTES[i];

  const go = (step: number) =>
    setI((n) => (n + step + QUOTES.length) % QUOTES.length);

  return (
    <Frame>
      <div
        className={cn(
          "rounded-xl border p-5",
          !resizes && "flex min-h-56 flex-col sm:min-h-44",
        )}
      >
        <p className={cn("text-body", !resizes && "flex-1")}>
          &ldquo;{q.text}&rdquo;
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-ui-sm">{q.name}</p>
            <p className="text-caption text-muted-foreground">{q.role}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Previous quote"
              onClick={() => go(-1)}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Next quote"
              onClick={() => go(1)}
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-1">
        {QUOTES.map((item, n) => (
          <button
            key={item.name}
            type="button"
            aria-label={`Quote ${n + 1} of ${QUOTES.length}`}
            aria-current={n === i ? "true" : undefined}
            onClick={() => setI(n)}
            className="grid h-9 w-7 place-items-center"
          >
            <span
              className={cn(
                "duration-fast ease-out-quart rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform]",
                !resizes && n === i
                  ? "bg-foreground h-1.5 w-5"
                  : "bg-border size-1.5",
              )}
            />
          </button>
        ))}
      </div>
    </Frame>
  );
}

/* ── 10. logo cloud ───────────────────────────────────────────────── */

const BRANDS = [
  "Northbound",
  "Kettle",
  "Auger",
  "Fieldnote",
  "Halcyon",
  "Verso",
  "Marrow",
  "Tallow",
] as const;

function BrandRow({
  relentless,
  clone,
  trackRef,
}: {
  relentless: boolean;
  clone: boolean;
  trackRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="flex shrink-0" ref={trackRef} aria-hidden={clone || undefined}>
      {BRANDS.map((b, n) => (
        <button
          key={b}
          type="button"
          tabIndex={clone ? -1 : undefined}
          onClick={() => toast(`${b} builds on Efferd`)}
          className={cn(
            "flex h-9 shrink-0 items-center px-5 whitespace-nowrap",
            relentless
              ? cn(
                  n % 3 === 0 && "text-title",
                  n % 3 === 1 && "text-caption",
                  n % 3 === 2 && "text-ui",
                )
              : "text-ui-sm text-muted-foreground hover:text-foreground duration-fast transition-colors",
          )}
        >
          {b}
        </button>
      ))}
    </div>
  );
}

function LogoCloud({ relentless }: { relentless: boolean }) {
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useAnimationFrame((_, delta) => {
    if (!relentless && paused.current) return;
    const width = trackRef.current?.offsetWidth ?? 0;
    if (!width) return;
    let next = x.get() - (delta / 1000) * 46;
    if (next <= -width) next += width;
    x.set(next);
  });

  return (
    <Frame>
      <Micro className="text-center">Trusted by</Micro>
      <div
        className="mt-4 overflow-hidden"
        onPointerEnter={() => {
          paused.current = true;
        }}
        onPointerLeave={() => {
          paused.current = false;
        }}
        onFocusCapture={() => {
          paused.current = true;
        }}
        onBlurCapture={() => {
          paused.current = false;
        }}
      >
        <motion.div className="flex w-max" style={{ x }}>
          <BrandRow relentless={relentless} clone={false} trackRef={trackRef} />
          <BrandRow relentless={relentless} clone />
        </motion.div>
      </div>
    </Frame>
  );
}

/* ── 11. integrations ─────────────────────────────────────────────── */

const APPS = [
  { id: "figma", name: "Figma", icon: Layers, note: "Pull tokens from a file" },
  { id: "linear", name: "Linear", icon: Zap, note: "One issue per block" },
  { id: "vercel", name: "Vercel", icon: Send, note: "Preview every branch" },
  { id: "sentry", name: "Sentry", icon: Shield, note: "Watch for render errors" },
] as const;

type ConnState = "off" | "pending" | "on";

function Integrations({ irreversible }: { irreversible: boolean }) {
  const [state, setState] = useState<Record<string, ConnState>>({
    figma: "on",
    linear: "off",
    vercel: "off",
    sentry: "off",
  });
  const after = useTimers();

  function connect(id: string, name: string) {
    if (irreversible) {
      setState((s) => ({ ...s, [id]: "on" }));
      return;
    }
    setState((s) => ({ ...s, [id]: "pending" }));
    after(() => {
      setState((s) => ({ ...s, [id]: "on" }));
      toast(`${name} connected`);
    }, 700);
  }

  return (
    <Frame>
      <div className="grid gap-3 sm:grid-cols-2">
        {APPS.map((a) => {
          const s = state[a.id] ?? "off";
          return (
            <div key={a.id} className="rounded-xl border p-4">
              <div className="flex items-center gap-2.5">
                <span className="bg-secondary grid size-9 shrink-0 place-items-center rounded-lg">
                  <a.icon className="text-muted-foreground size-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-ui-sm truncate">{a.name}</p>
                  <p className="text-caption text-muted-foreground truncate">
                    {a.note}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {s === "off" && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full"
                    onClick={() => connect(a.id, a.name)}
                  >
                    Connect
                  </Button>
                )}

                {s === "pending" && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full"
                    disabled
                  >
                    <Spinner className="size-3.5" />
                    Connecting
                  </Button>
                )}

                {s === "on" &&
                  (irreversible ? (
                    <p className="text-caption text-muted-foreground flex h-9 items-center gap-1.5">
                      <Check className="size-4" aria-hidden />
                      Connected
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-caption text-muted-foreground flex h-9 flex-1 items-center gap-1.5">
                        <Check className="text-positive size-4" aria-hidden />
                        Connected
                      </p>
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => {
                          setState((st) => ({ ...st, [a.id]: "off" }));
                          toast(`${a.name} disconnected`);
                        }}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

/* ── 12. cta ──────────────────────────────────────────────────────── */

function Cta({ noFeedback }: { noFeedback: boolean }) {
  const [email, setEmail] = useState("ada@analyticalengine.co");
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const after = useTimers();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (noFeedback) {
      after(() => toast("Added to the list"), 1400);
      return;
    }
    if (phase !== "idle") return;
    setPhase("sending");
    after(() => setPhase("done"), 1400);
  }

  return (
    <Frame>
      <div className="bg-feature text-feature-foreground rounded-xl p-6 text-center">
        <h3 className="text-title">Get the next 14 blocks first</h3>
        <p className="text-caption mt-2 opacity-70">
          One email when a new category lands. Nothing else.
        </p>

        <form
          className="mx-auto mt-5 flex max-w-sm flex-col gap-2 sm:flex-row"
          onSubmit={submit}
        >
          <Label htmlFor={noFeedback ? "ef-cta-b" : "ef-cta-a"} className="sr-only">
            Email address
          </Label>
          <Input
            id={noFeedback ? "ef-cta-b" : "ef-cta-a"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-card text-foreground h-9 flex-1 border-transparent"
          />

          {phase === "done" ? (
            <p className="text-ui-sm flex h-9 items-center justify-center gap-1.5 px-3">
              <Check className="size-4" aria-hidden />
              You are on the list
            </p>
          ) : (
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              disabled={phase === "sending"}
            >
              {phase === "sending" && <Spinner className="size-3.5" />}
              {phase === "sending" ? "Adding" : "Notify me"}
            </Button>
          )}
        </form>
      </div>
    </Frame>
  );
}

/* ── 13. footer ───────────────────────────────────────────────────── */

const FOOTER_GROUPS = [
  {
    heading: "Blocks",
    links: ["Heroes", "Pricing", "Dashboards", "Headers", "Footers", "Auth"],
  },
  {
    heading: "Learn",
    links: [
      "Getting started",
      "Changelog",
      "Registry API",
      "Examples",
      "FAQ",
      "Support",
    ],
  },
  {
    heading: "Company",
    links: ["About", "Licence", "Affiliates", "Contact", "Privacy", "Terms"],
  },
] as const;

const SOCIAL = [
  { id: "email", label: "Email the team", icon: AtSign },
  { id: "chat", label: "Community chat", icon: MessageCircle },
  { id: "feed", label: "Changelog feed", icon: Rss },
  { id: "alerts", label: "Release alerts", icon: Bell },
] as const;

function Footer({ flat }: { flat: boolean }) {
  const all = FOOTER_GROUPS.flatMap((g) => g.links);

  return (
    <Frame>
      {flat ? (
        <div className="flex flex-wrap gap-x-4">
          {all.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => toast(l)}
              className="text-ui-sm text-muted-foreground hover:text-foreground h-9 whitespace-nowrap transition-colors"
            >
              {l}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-3">
          {FOOTER_GROUPS.map((g) => (
            <div key={g.heading}>
              <Micro>{g.heading}</Micro>
              <div className="mt-1 flex flex-col items-start">
                {g.links.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toast(l)}
                    className="text-ui-sm text-muted-foreground hover:text-foreground h-9 transition-colors"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t pt-3">
        <p className="text-caption text-muted-foreground">© Efferd</p>
        <div className="flex gap-0.5">
          {SOCIAL.map((s) => (
            <Button
              key={s.id}
              variant="ghost"
              size="icon-lg"
              aria-label={s.label}
              className="text-muted-foreground"
              onClick={() => toast(s.label)}
            >
              <s.icon aria-hidden />
            </Button>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ── 14. blogs ────────────────────────────────────────────────────── */

const POSTS = [
  { title: "Why we ship files, not a package", meta: "6 min read" },
  { title: "Fourteen headers, one scroll behaviour", meta: "4 min read" },
  { title: "The dashboard block, taken apart", meta: "9 min read" },
] as const;

const RAGGED_HEIGHTS = ["h-20", "h-36", "h-28"] as const;

function BlogGrid({ shifts }: { shifts: boolean }) {
  const [loaded, setLoaded] = useState<number[]>([0, 1, 2]);
  const after = useTimers();

  function reload() {
    setLoaded([]);
    POSTS.forEach((_, i) => {
      after(
        () => setLoaded((l) => (l.includes(i) ? l : [...l, i])),
        500 + i * 450,
      );
    });
  }

  return (
    <Frame>
      <div className="flex items-center justify-between gap-3">
        <Micro>Latest</Micro>
        <Button size="lg" variant="secondary" onClick={reload}>
          <RefreshCw aria-hidden />
          Reload
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {POSTS.map((p, i) => {
          const ready = loaded.includes(i);
          return (
            <button
              key={p.title}
              type="button"
              onClick={() => toast(p.title)}
              className="rounded-xl border p-3 text-left"
            >
              {shifts ? (
                ready ? (
                  <div
                    className={cn(
                      "bg-secondary grid w-full place-items-center rounded-lg",
                      RAGGED_HEIGHTS[i],
                    )}
                  >
                    <ImageIcon
                      className="text-muted-foreground size-5"
                      aria-hidden
                    />
                  </div>
                ) : null
              ) : (
                <div className="bg-secondary relative aspect-video w-full overflow-hidden rounded-lg">
                  {ready ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: duration.base,
                        ease: ease.outQuart,
                      }}
                      className="grid size-full place-items-center"
                    >
                      <ImageIcon
                        className="text-muted-foreground size-5"
                        aria-hidden
                      />
                    </motion.div>
                  ) : (
                    <Skeleton className="size-full rounded-none" />
                  )}
                </div>
              )}

              <p className="text-ui-sm mt-3">{p.title}</p>
              <p className="text-caption text-muted-foreground mt-1">{p.meta}</p>
            </button>
          );
        })}
      </div>
    </Frame>
  );
}

/* ── 15. not found ────────────────────────────────────────────────── */

const SUGGESTIONS = [
  "hero-1 — centered, with an announcement badge",
  "hero-3 — left aligned, with a dashboard preview",
  "hero-4 — outline text on a dot grid",
  "header-4 — sticky, scroll aware",
] as const;

function NotFound({ bare }: { bare: boolean }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(
    () =>
      SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  if (bare) {
    return (
      <Frame className="max-w-md py-8 text-center">
        <p className="text-title">404</p>
        <p className="text-caption text-muted-foreground mt-2">Not Found</p>
        <Button
          size="lg"
          variant="secondary"
          className="mt-6"
          onClick={() => toast("Back to the home page")}
        >
          Go home
        </Button>
      </Frame>
    );
  }

  return (
    <Frame className="max-w-md">
      <Micro>404</Micro>
      <h3 className="text-title mt-2">There is no block called hero-12</h3>
      <p className="text-caption text-muted-foreground mt-2">
        Efferd has nine hero blocks, numbered 1 to 9. Try one of these.
      </p>

      <div className="relative mt-5">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 size-4"
          aria-hidden
        />
        <Label htmlFor="ef-404" className="sr-only">
          Search the blocks
        </Label>
        <Input
          id="ef-404"
          className="h-9 pl-9"
          value={query}
          placeholder="Search 166 blocks"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-2 flex flex-col items-stretch">
        {matches.length === 0 ? (
          <p className="text-caption text-muted-foreground py-2">
            Nothing matches that yet.
          </p>
        ) : (
          matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toast(`${s.split(" — ")[0]} opened`)}
              className="text-ui-sm hover:bg-secondary flex h-10 items-center rounded-lg px-2.5 text-left transition-colors"
            >
              {s}
            </button>
          ))
        )}
      </div>

      <Button
        size="lg"
        variant="secondary"
        className="mt-4"
        onClick={() => toast("Back to the home page")}
      >
        Go home
      </Button>
    </Frame>
  );
}

/* ── 16. features ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    id: "install",
    icon: Boxes,
    title: "One command",
    body: "A block lands in your repo as ordinary files.",
    more: "It brings its own dependencies and nothing else. No wrapper package, no version to keep in step with.",
  },
  {
    id: "variants",
    icon: Layers,
    title: "Two flavours",
    body: "Every block ships for Radix and for Base UI.",
    more: "Pick the one your project already uses and the imports line up with what you have.",
  },
  {
    id: "dark",
    icon: Gauge,
    title: "Dark from the start",
    body: "Both themes are drawn, not derived.",
    more: "Surfaces get lighter in the dark rather than keeping a shadow nobody can see.",
  },
] as const;

const NOISY_ICON = ["size-7", "size-4", "size-6"] as const;
const NOISY_TINT = [
  "text-destructive",
  "text-positive",
  "text-accent-foreground",
] as const;
const NOISY_TITLE = ["text-title", "text-caption", "text-ui"] as const;

function Features({ noisy }: { noisy: boolean }) {
  const [open, setOpen] = useState<string | null>("install");

  return (
    <Frame>
      <div className="grid gap-3 sm:grid-cols-3">
        {FEATURES.map((f, i) => {
          const isOpen = open === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : f.id)}
              className="hover:bg-secondary duration-fast ease-out-quart rounded-xl border p-4 text-left transition-colors"
            >
              <span className="flex h-7 items-center">
                <f.icon
                  className={cn(
                    noisy
                      ? cn(NOISY_ICON[i], NOISY_TINT[i])
                      : "text-muted-foreground size-4.5",
                  )}
                  aria-hidden
                />
              </span>

              <span
                className={cn(
                  "mt-2 block",
                  noisy ? NOISY_TITLE[i] : "text-ui-sm",
                )}
              >
                {f.title}
              </span>
              <span className="text-caption text-muted-foreground mt-1 block">
                {f.body}
              </span>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: duration.base, ease: ease.outQuart }}
                    className="text-caption text-muted-foreground block overflow-hidden"
                  >
                    <span className="mt-2 block">{f.more}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </Frame>
  );
}

/* ── 17. copy button ──────────────────────────────────────────────── */

const COMMAND = "npx shadcn@latest add @efferd/auth-1";

function InstallRow({ silent }: { silent: boolean }) {
  const [copied, setCopied] = useState(false);
  const after = useTimers();

  function copy() {
    void navigator.clipboard?.writeText(COMMAND).catch(() => undefined);
    if (silent) return;
    setCopied(true);
    toast("Command copied");
    after(() => setCopied(false), 1400);
  }

  return (
    <Frame className="max-w-md">
      <Micro>Install auth-1</Micro>
      <div className="bg-secondary mt-2 flex items-center gap-2 rounded-lg py-1 pr-1 pl-3">
        <code className="text-caption min-w-0 flex-1 truncate font-mono">
          {COMMAND}
        </code>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={copied ? "Copied" : "Copy command"}
          className="text-muted-foreground"
          onClick={copy}
        >
          {copied ? (
            <Check className="text-positive" aria-hidden />
          ) : (
            <Copy aria-hidden />
          )}
        </Button>
      </div>
    </Frame>
  );
}

/* ── 18. image gallery ────────────────────────────────────────────── */

const SHOTS = [
  { id: "s1", label: "Hero 3", height: "h-24" },
  { id: "s2", label: "Pricing 4", height: "h-40" },
  { id: "s3", label: "Dashboard 2", height: "h-28" },
  { id: "s4", label: "Footer 7", height: "h-36" },
  { id: "s5", label: "Auth 5", height: "h-20" },
  { id: "s6", label: "FAQ 4", height: "h-32" },
] as const;

function Gallery({ ragged }: { ragged: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const shot = SHOTS.find((s) => s.id === open);

  if (ragged) {
    return (
      <Frame>
        <div className="columns-3 gap-2">
          {SHOTS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "bg-secondary mb-2 grid place-items-center rounded-lg",
                s.height,
              )}
            >
              <span className="text-caption text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <AnimatePresence initial={false}>
        {shot && (
          <motion.div
            key={shot.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="overflow-hidden"
          >
            <div className="bg-secondary relative mb-3 grid aspect-video place-items-center rounded-xl">
              <span className="text-ui text-muted-foreground">{shot.label}</span>
              <Button
                variant="secondary"
                size="icon-lg"
                aria-label="Close preview"
                className="absolute top-2 right-2"
                onClick={() => setOpen(null)}
              >
                <X aria-hidden />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-2">
        {SHOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Open ${s.label}`}
            aria-pressed={s.id === open}
            onClick={() => setOpen(s.id === open ? null : s.id)}
            className={cn(
              "duration-fast ease-out-quart grid aspect-square place-items-center rounded-lg transition-colors",
              s.id === open
                ? "bg-card shadow-xs border"
                : "bg-secondary hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "text-caption",
                s.id === open ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </Frame>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function EfferdBeautifulShadcnBlocksForBusySmartDevsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="It says which box is wrong, and keeps what you typed."
        before={<SignIn vague />}
        after={<SignIn vague={false} />}
      />

      <BeforeAfter
        principle="The labels stay put once you start typing."
        before={<ContactForm placeholderOnly />}
        after={<ContactForm placeholderOnly={false} />}
      />

      <BeforeAfter
        principle="You can tell which of the two is the main button."
        before={<Hero equalWeight />}
        after={<Hero equalWeight={false} />}
      />

      <BeforeAfter
        principle="The prices roll over instead of jumping, and it says what you save."
        before={<Pricing jumpy />}
        after={<Pricing jumpy={false} />}
      />

      <BeforeAfter
        principle="The answer slides open instead of snapping the page around."
        before={<Faqs snap />}
        after={<Faqs snap={false} />}
      />

      <BeforeAfter
        principle="You can see which page you are on."
        before={<SiteHeader noCurrent />}
        after={<SiteHeader noCurrent={false} />}
      />

      <BeforeAfter
        principle="You can press anywhere on the row, not only the word."
        before={<AppRail tight />}
        after={<AppRail tight={false} />}
      />

      <BeforeAfter
        principle="Refreshing no longer wipes the number you were reading."
        before={<StatTile wipes />}
        after={<StatTile wipes={false} />}
      />

      <BeforeAfter
        principle="The card stops resizing as you move between quotes."
        before={<Testimonials resizes />}
        after={<Testimonials resizes={false} />}
      />

      <BeforeAfter
        principle="It stops when you point at it, so you can read the names."
        before={<LogoCloud relentless />}
        after={<LogoCloud relentless={false} />}
      />

      <BeforeAfter
        principle="You can undo it when you connect the wrong one."
        before={<Integrations irreversible />}
        after={<Integrations irreversible={false} />}
      />

      <BeforeAfter
        principle="Press it twice and you are still only signed up once."
        before={<Cta noFeedback />}
        after={<Cta noFeedback={false} />}
      />

      <BeforeAfter
        principle="You can find the link you want without reading all eighteen."
        before={<Footer flat />}
        after={<Footer flat={false} />}
      />

      <BeforeAfter
        principle="The page stops jumping while the pictures load."
        before={<BlogGrid shifts />}
        after={<BlogGrid shifts={false} />}
      />

      <BeforeAfter
        principle="There is somewhere to go from here."
        before={<NotFound bare />}
        after={<NotFound bare={false} />}
      />

      <BeforeAfter
        principle="The icons stop shouting over the words."
        before={<Features noisy />}
        after={<Features noisy={false} />}
      />

      <BeforeAfter
        principle="You can tell it copied."
        before={<InstallRow silent />}
        after={<InstallRow silent={false} />}
      />

      <BeforeAfter
        principle="Press a picture and it opens."
        before={<Gallery ragged />}
        after={<Gallery ragged={false} />}
      />
    </div>
  );
}
