"use client";

import NumberFlow from "@number-flow/react";
import {
  Check,
  ChevronDown,
  Copy,
  FileText,
  Info,
  Minus,
  Plus,
  SearchX,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * The Component Gallery — component.gallery, by Iain Bean.
 *
 * The source is 60 component entries, each one a definition plus the
 * names design systems give it and the examples that back it up. The
 * definitions are the substance: a dropdown menu "shows actions or
 * navigation options and is not a form input"; a popover "differs from
 * a tooltip in that it is usually triggered via click instead of hover
 * and can contain interactive elements"; a combobox is a select "with
 * the addition of a free text input to filter options"; a progress bar
 * reports "completion status", where a spinner only says the interface
 * "is not yet ready for interaction"; an empty state "often includes an
 * alternative action". Every switch below is one of those distinctions,
 * shipped the common way and then shipped the way the gallery has it.
 *
 * Left out: everything whose difference a person cannot see — visually
 * hidden text, skip links, separators, stacks, fieldsets, headings,
 * footers — and the gallery's name-distribution data, which is an
 * argument about vocabulary, not something you can look at.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/* ── 1 · a list of actions is not a choice you keep ────────────────── */

const ACTION_IDS = ["duplicate", "rename", "star"] as const;
type ActionId = (typeof ACTION_IDS)[number];

const ACTION_LABELS: Record<ActionId, string> = {
  duplicate: "Duplicate",
  rename: "Rename",
  star: "Add star",
};

const NAMES = [
  "Q3 report.pdf",
  "Q3 report (final).pdf",
  "Q3 report (final v2).pdf",
];

function FileRow({
  name,
  starred = false,
  faint = false,
}: {
  name: string;
  starred?: boolean;
  faint?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2",
        faint && "text-muted-foreground",
      )}
    >
      <FileText aria-hidden className="text-muted-foreground size-4" />
      <span className="text-ui-sm truncate">{name}</span>
      {starred && (
        <Star
          aria-hidden
          className="text-foreground ml-auto size-3.5 fill-current"
        />
      )}
    </div>
  );
}

function ActionsPair({ after }: Side) {
  const [nameIndex, setNameIndex] = useState(0);
  const [copies, setCopies] = useState(0);
  const [starred, setStarred] = useState(false);
  const [held, setHeld] = useState("");

  function run(id: ActionId) {
    if (id === "duplicate") setCopies((c) => Math.min(c + 1, 3));
    if (id === "rename") setNameIndex((i) => (i + 1) % NAMES.length);
    if (id === "star") setStarred((s) => !s);
  }

  const name = NAMES[nameIndex];
  const stem = name.replace(".pdf", "");

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-ui">Documents</p>
        {after ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="h-9">
                Actions
                <ChevronDown aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ACTION_IDS.map((id) => (
                <DropdownMenuItem
                  key={id}
                  onSelect={() => {
                    run(id);
                  }}
                >
                  {id === "star" && starred ? "Remove star" : ACTION_LABELS[id]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Select
            value={held}
            onValueChange={(v) => {
              setHeld(v);
              run(v as ActionId);
            }}
          >
            <SelectTrigger className="h-9 w-36" aria-label="Actions">
              <SelectValue placeholder="Actions…" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {ACTION_LABELS[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <FileRow name={name} starred={starred} />
        {Array.from({ length: copies }, (_, i) => (
          <FileRow key={i} name={`${stem} copy ${String(i + 1)}.pdf`} faint />
        ))}
      </div>
    </div>
  );
}

/* ── 2 · a long list you can type into ─────────────────────────────── */

const COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Bulgaria",
  "Canada",
  "Chile",
  "Colombia",
  "Croatia",
  "Czechia",
  "Denmark",
  "Egypt",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Kenya",
  "Latvia",
  "Lithuania",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Romania",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Ukraine",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Vietnam",
];

function CountryPair({ after }: Side) {
  const [country, setCountry] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="text-ui-sm mb-2" id={`country-label-${after ? "a" : "b"}`}>
        Where should we ship it?
      </p>

      {after ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              aria-labelledby="country-label-a"
              className="h-9 w-full justify-between font-normal"
            >
              <span className={country ? "" : "text-muted-foreground"}>
                {country || "Type a country"}
              </span>
              <ChevronDown aria-hidden className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <Command>
              <CommandInput placeholder="Type a country" />
              <CommandList>
                <CommandEmpty>No country by that name.</CommandEmpty>
                {COUNTRIES.map((c) => (
                  <CommandItem
                    key={c}
                    value={c}
                    onSelect={() => {
                      setCountry(c);
                      setOpen(false);
                    }}
                  >
                    {c}
                    {country === c && (
                      <Check aria-hidden className="ml-auto size-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger aria-labelledby="country-label-b" className="h-9 w-full">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <p className="text-caption text-muted-foreground mt-2">
        {country
          ? `Standard delivery to ${country}, 3–5 days.`
          : "Delivery time appears once you pick."}
      </p>
    </div>
  );
}

/* ── 3 · three choices, all of them in sight ───────────────────────── */

const VIEW_IDS = ["list", "board", "calendar"] as const;
type ViewId = (typeof VIEW_IDS)[number];

const VIEW_LABELS: Record<ViewId, string> = {
  list: "List",
  board: "Board",
  calendar: "Calendar",
};

const TASKS = [
  "Rewrite the empty states",
  "Ship the invoice filter",
  "Fix the upload meter",
  "Audit the menus",
];

function ViewCanvas({ view }: { view: ViewId }) {
  if (view === "board") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {["To do", "Doing", "Done"].map((col, i) => (
          <div key={col} className="bg-secondary rounded-lg p-2">
            <p className="text-micro text-muted-foreground uppercase">{col}</p>
            <div className="mt-2 space-y-1.5">
              {Array.from({ length: i === 1 ? 1 : 2 }, (_, k) => (
                <div key={k} className="bg-card h-8 rounded-md border" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === "calendar") {
    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 21 }, (_, i) => (
          <div
            key={i}
            className="bg-secondary grid aspect-square place-items-center rounded-md"
          >
            {(i === 4 || i === 11 || i === 17) && (
              <span className="bg-foreground size-1.5 rounded-full" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul>
      {TASKS.map((t) => (
        <li
          key={t}
          className="flex items-center gap-2.5 border-b py-2 last:border-b-0"
        >
          <span className="size-3.5 rounded-full border" />
          <span className="text-ui-sm truncate">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function ViewPair({ after }: Side) {
  const [view, setView] = useState<ViewId>("list");

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-ui">Sprint 24</p>
        {after ? (
          <div className="bg-secondary inline-flex rounded-lg p-0.5">
            {VIEW_IDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => {
                  setView(id);
                }}
                className={cn(
                  "text-ui-sm duration-fast ease-out-quart h-9 rounded-md px-3 transition-colors",
                  view === id
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {VIEW_LABELS[id]}
              </button>
            ))}
          </div>
        ) : (
          <Select
            value={view}
            onValueChange={(v) => {
              setView(v as ViewId);
            }}
          >
            <SelectTrigger className="h-9 w-32" aria-label="View">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIEW_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {VIEW_LABELS[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="mt-3">
        <ViewCanvas view={view} />
      </div>
    </div>
  );
}

/* ── 4 · how many, without a keyboard ──────────────────────────────── */

const PRICE = 420;

function QuantityPair({ after }: Side) {
  const [typed, setTyped] = useState("1");
  const [qty, setQty] = useState(1);

  const parsed = Number(typed);
  const total = after ? qty * PRICE : parsed * PRICE;

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-ui">Standing desk</p>
          <p className="text-caption text-muted-foreground">
            Oak, 160 × 80 · ${PRICE} each
          </p>
        </div>

        {after ? (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="One fewer"
              disabled={qty <= 1}
              onClick={() => {
                setQty((q) => Math.max(1, q - 1));
              }}
            >
              <Minus aria-hidden />
            </Button>
            <span className="text-ui w-8 text-center tabular-nums">
              <NumberFlow value={qty} />
            </span>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="One more"
              disabled={qty >= 10}
              onClick={() => {
                setQty((q) => Math.min(10, q + 1));
              }}
            >
              <Plus aria-hidden />
            </Button>
          </div>
        ) : (
          <div>
            <Label htmlFor="qty-typed" className="sr-only">
              Quantity
            </Label>
            <Input
              id="qty-typed"
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
              }}
              className="h-9 w-20 text-center"
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t pt-3">
        <span className="text-ui-sm text-muted-foreground">Total</span>
        <span className="text-ui tabular-nums">
          {after ? (
            <NumberFlow
              value={total}
              format={{
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }}
            />
          ) : Number.isFinite(total) ? (
            `$${String(total)}`
          ) : (
            "$NaN"
          )}
        </span>
      </div>
    </div>
  );
}

/* ── 5 · a bubble you can actually reach ───────────────────────────── */

function PromoBody({
  onApply,
  onCopy,
  copied,
}: {
  onApply: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <>
      <div>
        <p className="text-ui-sm">SAVE20</p>
        <p className="text-caption mt-0.5 opacity-80">
          20% off the first year. Ends on Friday.
        </p>
      </div>
      <div className="flex gap-1.5">
        <Button size="lg" className="h-9" onClick={onApply}>
          Apply code
        </Button>
        <Button variant="secondary" size="lg" className="h-9" onClick={onCopy}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </>
  );
}

function PromoPair({ after }: Side) {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const applied = code.trim().toUpperCase() === "SAVE20";
  const total = applied ? 96 : 120;

  const body = (
    <PromoBody
      copied={copied}
      onApply={() => {
        setCode("SAVE20");
        setOpen(false);
      }}
      onCopy={() => {
        setCopied(true);
      }}
    />
  );

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label
            htmlFor={`promo-${after ? "a" : "b"}`}
            className="text-ui-sm"
          >
            Promo code
          </Label>
          <Input
            id={`promo-${after ? "a" : "b"}`}
            value={code}
            placeholder="Enter a code"
            onChange={(e) => {
              setCode(e.target.value);
            }}
            className="mt-1.5 h-9"
          />
        </div>

        {after ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="About promo codes"
              >
                <Info aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              {body}
            </PopoverContent>
          </Popover>
        ) : (
          <TooltipProvider delayDuration={0}>
            <Tooltip disableHoverableContent>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-lg"
                  aria-label="About promo codes"
                >
                  <Info aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="end"
                className="pointer-events-none w-64 flex-col items-stretch gap-2.5 p-2.5 text-left"
              >
                {body}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-ui-sm text-muted-foreground">
          Team plan, yearly
          {applied && (
            <Badge variant="secondary" className="ml-2">
              20% off
            </Badge>
          )}
        </span>
        <span className="text-ui tabular-nums">
          <NumberFlow
            value={total}
            format={{
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }}
          />
        </span>
      </div>
    </div>
  );
}

/* ── 6 · the complaint stays next to the field ─────────────────────── */

function PaymentPair({ after }: Side) {
  const [email, setEmail] = useState("andrew@");
  const [card, setCard] = useState("4242 4242");
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);

  const emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const cardBad = card.replace(/\s/g, "").length !== 16;
  const bad = emailBad || cardBad;
  const show = after && tried;

  function submit() {
    setTried(true);
    if (bad) {
      setSent(false);
      if (!after) toast.error("Check your details and try again.");
      return;
    }
    setSent(true);
    if (!after) toast.success("Payment sent.");
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      {show && bad && (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>We could not take the payment</AlertTitle>
          <AlertDescription>
            {emailBad && cardBad
              ? "Two things below need fixing."
              : "One thing below needs fixing."}
          </AlertDescription>
        </Alert>
      )}
      {show && !bad && sent && (
        <Alert className="mb-3">
          <Check aria-hidden />
          <AlertTitle>Payment sent</AlertTitle>
        </Alert>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor={`email-${after ? "a" : "b"}`} className="text-ui-sm">
            Email
          </Label>
          <Input
            id={`email-${after ? "a" : "b"}`}
            value={email}
            aria-invalid={show && emailBad}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            className="mt-1.5 h-9"
          />
          {show && emailBad && (
            <p className="text-caption text-destructive mt-1.5">
              This address is missing the part after the @.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor={`card-${after ? "a" : "b"}`} className="text-ui-sm">
            Card number
          </Label>
          <Input
            id={`card-${after ? "a" : "b"}`}
            value={card}
            inputMode="numeric"
            aria-invalid={show && cardBad}
            onChange={(e) => {
              setCard(e.target.value);
            }}
            className="mt-1.5 h-9"
          />
          {show && cardBad && (
            <p className="text-caption text-destructive mt-1.5">
              A card number has 16 digits. This one has{" "}
              {card.replace(/\s/g, "").length}.
            </p>
          )}
        </div>
      </div>

      <Button size="lg" className="mt-4 h-9 w-full" onClick={submit}>
        Pay $96
      </Button>
    </div>
  );
}

/* ── 7 · the page is already the right shape ───────────────────────── */

const STATS: [string, string][] = [
  ["Open tickets", "12"],
  ["Replied today", "34"],
  ["First response", "4m"],
];

function ProfileBlock({ loading }: { loading: boolean }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-3">
        {loading ? (
          <Skeleton className="size-10 rounded-full" />
        ) : (
          <div className="bg-secondary text-ui-sm grid size-10 place-items-center rounded-full">
            AR
          </div>
        )}
        <div className="space-y-1">
          <div className="flex h-6 items-center">
            {loading ? (
              <Skeleton className="h-3.5 w-28" />
            ) : (
              <p className="text-ui">Ana Ruiz</p>
            )}
          </div>
          <div className="flex h-5 items-center">
            {loading ? (
              <Skeleton className="h-3 w-40" />
            ) : (
              <p className="text-caption text-muted-foreground">
                Support lead · Berlin
              </p>
            )}
          </div>
        </div>
      </div>

      <dl className="mt-4 space-y-2">
        {STATS.map(([k, v]) => (
          <div key={k} className="flex h-5 items-center justify-between">
            <dt className="text-caption text-muted-foreground">{k}</dt>
            {loading ? (
              <Skeleton className="h-3 w-8" />
            ) : (
              <dd className="text-caption tabular-nums">{v}</dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

function LoadPair({ after }: Side) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function load() {
    if (timer.current) clearTimeout(timer.current);
    setState("loading");
    timer.current = setTimeout(() => {
      setState("done");
    }, 1600);
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <Button
        size="lg"
        variant="outline"
        className="h-9"
        onClick={load}
        disabled={state === "loading"}
      >
        {state === "done" ? "Open again" : "Open profile"}
      </Button>

      {state !== "idle" && (
        <div className="mt-3">
          {state === "loading" ? (
            after ? (
              <ProfileBlock loading />
            ) : (
              <div className="grid h-16 place-items-center rounded-xl border">
                <Spinner className="text-muted-foreground" />
              </div>
            )
          ) : (
            <ProfileBlock loading={false} />
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-caption text-muted-foreground">
          Recent activity
        </span>
        <Badge variant="secondary">3 new</Badge>
      </div>
    </div>
  );
}

/* ── 8 · how far along, not just "busy" ────────────────────────────── */

const FILE_MB = 8.4;

function UploadPair({ after }: Side) {
  const [pct, setPct] = useState(0);
  const [running, setRunning] = useState(false);
  const value = useRef(0);
  const id = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (id.current) clearInterval(id.current);
    },
    [],
  );

  function start() {
    if (id.current) clearInterval(id.current);
    value.current = 0;
    setPct(0);
    setRunning(true);
    id.current = setInterval(() => {
      value.current = Math.min(100, value.current + 2);
      setPct(value.current);
      if (value.current >= 100) {
        if (id.current) clearInterval(id.current);
        setRunning(false);
      }
    }, 110);
  }

  const done = pct >= 100 && !running;

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <FileText aria-hidden className="text-muted-foreground size-4" />
          <span className="text-ui-sm truncate">site-audit.mov</span>
        </div>
        <Button size="lg" className="h-9" onClick={start} disabled={running}>
          {done ? "Upload again" : "Upload"}
        </Button>
      </div>

      <div className="mt-3 min-h-14 rounded-lg border px-3 py-2.5">
        {!running && !done && (
          <p className="text-caption text-muted-foreground">
            {FILE_MB} MB, ready to send.
          </p>
        )}

        {running &&
          (after ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-caption text-muted-foreground tabular-nums">
                  {(FILE_MB * (pct / 100)).toFixed(1)} MB of {FILE_MB} MB
                </span>
                <span className="text-ui-sm tabular-nums">
                  <NumberFlow value={pct / 100} format={{ style: "percent" }} />
                </span>
              </div>
              <Progress value={pct} className="mt-2.5" />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Spinner className="text-muted-foreground" />
              <span className="text-caption text-muted-foreground">
                Uploading…
              </span>
            </div>
          ))}

        {done && (
          <div className="flex items-center gap-2">
            <Check aria-hidden className="text-positive size-4" />
            <span className="text-caption">Uploaded · {FILE_MB} MB</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 9 · nothing to show, and a way out ────────────────────────────── */

type Invoice = {
  id: string;
  client: string;
  status: "Paid" | "Overdue";
  amount: number;
};

const INVOICES: Invoice[] = [
  { id: "INV-108", client: "Acme", status: "Paid", amount: 2400 },
  { id: "INV-109", client: "Northwind", status: "Overdue", amount: 780 },
  { id: "INV-110", client: "Acme", status: "Paid", amount: 1150 },
  { id: "INV-111", client: "Globex", status: "Paid", amount: 3320 },
  { id: "INV-112", client: "Northwind", status: "Paid", amount: 640 },
  { id: "INV-113", client: "Globex", status: "Paid", amount: 990 },
];

const STATUSES = ["All", "Paid", "Overdue"] as const;
const CLIENTS = ["All", "Acme", "Northwind", "Globex"] as const;

function Chip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg border px-3 transition-colors",
        on
          ? "bg-feature text-feature-foreground border-transparent"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function InvoicesPair({ after }: Side) {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Overdue");
  const [client, setClient] = useState<(typeof CLIENTS)[number]>("Globex");

  const rows = INVOICES.filter(
    (r) =>
      (status === "All" || r.status === status) &&
      (client === "All" || r.client === client),
  );

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Chip
            key={s}
            label={s}
            on={status === s}
            onClick={() => {
              setStatus(s);
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {CLIENTS.map((c) => (
          <Chip
            key={c}
            label={c}
            on={client === c}
            onClick={() => {
              setClient(c);
            }}
          />
        ))}
      </div>

      <div className="mt-3">
        {rows.length > 0 ? (
          <ul>
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0"
              >
                <span className="text-ui-sm">{r.client}</span>
                <span className="text-caption text-muted-foreground ml-auto">
                  {r.id}
                </span>
                <span className="text-ui-sm tabular-nums">
                  ${r.amount.toLocaleString("en-US")}
                </span>
              </li>
            ))}
          </ul>
        ) : after ? (
          <div className="grid place-items-center px-4 py-8 text-center">
            <div className="bg-secondary grid size-10 place-items-center rounded-full">
              <SearchX aria-hidden className="text-muted-foreground size-4" />
            </div>
            <p className="text-ui mt-3">
              No {status.toLowerCase()} invoices for {client}
            </p>
            <p className="text-caption text-muted-foreground mt-1 max-w-xs">
              {client === "All"
                ? "Nothing matches these filters."
                : `${client} has paid everything so far.`}{" "}
              There are {INVOICES.length} invoices once you drop the filters.
            </p>
            <Button
              size="lg"
              className="mt-4 h-9"
              onClick={() => {
                setStatus("All");
                setClient("All");
              }}
            >
              Show all invoices
            </Button>
          </div>
        ) : (
          <p className="text-caption text-muted-foreground py-3">No results.</p>
        )}
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function TheComponentGalleryDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Things you can do are not choices you keep. If the box still shows the last thing you did, and doing it a second time does nothing, it is the wrong control."
        before={<ActionsPair after={false} />}
        after={<ActionsPair after />}
      />
      <BeforeAfter
        principle="Finding your country should take three letters. Nobody wants to scroll all the way down to P."
        before={<CountryPair after={false} />}
        after={<CountryPair after />}
      />
      <BeforeAfter
        principle="When there are only three choices, show all three. Hiding them means opening something just to find out what is in there."
        before={<ViewPair after={false} />}
        after={<ViewPair after />}
      />
      <BeforeAfter
        principle="Saying how many should take one tap. And it should not be possible to end up ordering minus three desks."
        before={<QuantityPair after={false} />}
        after={<QuantityPair after />}
      />
      <BeforeAfter
        principle="If a little bubble has something in it you need to press, it has to stay put. The ones that vanish as you move towards them are a tease."
        before={<PromoPair after={false} />}
        after={<PromoPair after />}
      />
      <BeforeAfter
        principle="A complaint about what you typed belongs next to what you typed. If it slides past in the corner and disappears, you are left hunting."
        before={<PaymentPair after={false} />}
        after={<PaymentPair after />}
      />
      <BeforeAfter
        principle="While it loads, the page should already be the shape it will end up. Otherwise everything jumps the moment it arrives."
        before={<LoadPair after={false} />}
        after={<LoadPair after />}
      />
      <BeforeAfter
        principle="When something takes a while, show how far along it is. A spinning circle never tells you whether to wait or go and make tea."
        before={<UploadPair after={false} />}
        after={<UploadPair after />}
      />
      <BeforeAfter
        principle="When there is nothing to show, say why and offer a way out. An empty space just looks broken."
        before={<InvoicesPair after={false} />}
        after={<InvoicesPair after />}
      />
    </div>
  );
}
