"use client";

import { useId, useState } from "react";
import {
  CalendarDaysIcon,
  CheckIcon,
  DownloadIcon,
  ImageIcon,
  LayoutGridIcon,
  ListIcon,
  MinusIcon,
  Volume2Icon,
  XIcon,
} from "lucide-react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* ==================================================================== *
 * designsystems.surf — the seven Blueprints, shown rather than listed.
 *
 * Checkbox, Chip, Radio button, Segmented control, Slider, Switch and
 * Tabs. Each Blueprint closes on a Best-practice paragraph; the rules a
 * person can actually see are the ones built here, as switches.
 * ==================================================================== */

/* ── shared pieces ─────────────────────────────────────────────────── */

/** Tri-state box. The repo Checkbox draws a tick for Mixed too. */
function TriBox({
  state,
  onClick,
  label,
}: {
  state: "off" | "on" | "mixed";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "mixed" ? "mixed" : state === "on"}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "border-input duration-fast ease-out-quart relative grid size-4 shrink-0 place-items-center rounded-sm border transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        state !== "off" && "bg-primary border-primary text-primary-foreground",
      )}
    >
      {state === "on" && <CheckIcon className="size-3.5" aria-hidden />}
      {state === "mixed" && <MinusIcon className="size-3.5" aria-hidden />}
    </button>
  );
}

const CHIP =
  "text-ui-sm duration-fast ease-out-quart inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface SegItem {
  label: string;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

function Seg({
  items,
  value,
  onChange,
  className,
}: {
  items: SegItem[];
  value: number;
  onChange: (n: number) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn("bg-secondary flex gap-0.5 rounded-xl p-1", className)}
    >
      {items.map((it, i) => (
        <button
          key={it.label}
          type="button"
          role="radio"
          aria-checked={i === value}
          aria-label={it.iconOnly ? it.label : undefined}
          onClick={() => onChange(i)}
          className={cn(
            "text-ui-sm duration-fast ease-out-quart flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            i === value
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {it.icon && (
            <span aria-hidden className="grid shrink-0 place-items-center">
              {it.icon}
            </span>
          )}
          {!it.iconOnly && <span className="truncate">{it.label}</span>}
        </button>
      ))}
    </div>
  );
}

function MiniRadio({
  id,
  checked,
  onSelect,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5">
      <button
        id={id}
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={onSelect}
        className="border-input hover:border-border-strong duration-fast ease-out-quart relative grid size-4 shrink-0 place-items-center rounded-full border transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {checked && (
          <span className="bg-primary size-2 rounded-full" aria-hidden />
        )}
      </button>
      <label
        htmlFor={id}
        className="text-ui-sm flex min-h-9 cursor-pointer items-center"
      >
        {label}
      </label>
      {description && (
        <p className="text-caption text-muted-foreground col-start-2 -mt-2 pb-2">
          {description}
        </p>
      )}
    </div>
  );
}

/** One range input. `plain` is the thin, unlabelled version. */
function Range({
  id,
  value,
  onChange,
  onCommit,
  label,
  min = 0,
  max = 100,
  step = 1,
  plain,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  onCommit?: (n: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  plain?: boolean;
}) {
  const f = (value - min) / (max - min);
  const size = plain ? 10 : 16;
  return (
    <div className="relative flex h-9 w-full items-center">
      <div
        className={cn(
          "bg-secondary w-full rounded-full",
          plain ? "h-0.5" : "h-1.5",
        )}
      >
        {!plain && (
          <div
            className="bg-primary h-full rounded-full"
            style={{ width: `${f * 100}%` }}
          />
        )}
      </div>
      <span
        aria-hidden
        className={cn(
          "bg-card pointer-events-none absolute -translate-x-1/2 rounded-full border",
          plain ? "size-2.5" : "border-border-strong size-4 shadow-xs",
        )}
        style={{ left: `calc(${f} * (100% - ${size}px) + ${size / 2}px)` }}
      />
      <input
        id={id}
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={() => onCommit?.(value)}
        onKeyUp={() => onCommit?.(value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

/* ── 1. Checkbox — the words are part of the target ────────────────── */

const MAIL = ["Release notes", "Security alerts", "Billing receipts"];

function MailPrefs({ wholeRow }: { wholeRow: boolean }) {
  const base = useId();
  const [on, setOn] = useState<string[]>(["Security alerts"]);
  const toggle = (l: string) =>
    setOn((v) => (v.includes(l) ? v.filter((x) => x !== l) : [...v, l]));

  if (!wholeRow) {
    return (
      <div className="max-w-xs space-y-3">
        <p className="text-caption text-muted-foreground">Email me about</p>
        {MAIL.map((l) => (
          <div key={l} className="flex items-center gap-2.5">
            <Checkbox
              checked={on.includes(l)}
              onCheckedChange={() => toggle(l)}
              aria-label={l}
            />
            <span className="text-ui-sm">{l}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xs">
      <p className="text-caption text-muted-foreground mb-1.5">Email me about</p>
      {MAIL.map((l, i) => (
        <label
          key={l}
          htmlFor={`${base}-${i}`}
          className="text-ui-sm duration-fast ease-out-quart hover:bg-secondary flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 transition-colors"
        >
          <Checkbox
            id={`${base}-${i}`}
            checked={on.includes(l)}
            onCheckedChange={() => toggle(l)}
          />
          {l}
        </label>
      ))}
    </div>
  );
}

/* ── 2. Checkbox — the partial selection has its own mark ──────────── */

const ROWS = ["Invoice 4471", "Invoice 4472", "Invoice 4473", "Invoice 4474"];

function SelectAll({ mixed }: { mixed: boolean }) {
  const [sel, setSel] = useState<string[]>(["Invoice 4472"]);
  const all = sel.length === ROWS.length;
  const some = sel.length > 0 && !all;
  const parent: "off" | "on" | "mixed" = all
    ? "on"
    : some && mixed
      ? "mixed"
      : "off";

  return (
    <div className="bg-card max-w-sm overflow-hidden rounded-xl border">
      <div className="bg-secondary flex h-11 items-center gap-2.5 px-3">
        <TriBox
          state={parent}
          label="Select all invoices"
          onClick={() => setSel(all ? [] : [...ROWS])}
        />
        <span className="text-ui-sm">Select all</span>
        <span className="text-caption text-muted-foreground ml-auto tabular-nums">
          {sel.length} of {ROWS.length}
        </span>
      </div>
      <ul className="divide-y">
        {ROWS.map((r) => (
          <li key={r} className="flex h-11 items-center gap-2.5 px-3">
            <TriBox
              state={sel.includes(r) ? "on" : "off"}
              label={r}
              onClick={() =>
                setSel((v) =>
                  v.includes(r) ? v.filter((x) => x !== r) : [...v, r],
                )
              }
            />
            <span className="text-ui-sm">{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 3. Checkbox — the list lines up ───────────────────────────────── */

const DIET = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
  "Low sodium",
];

function DietFilters({ stacked }: { stacked: boolean }) {
  const base = useId();
  const [on, setOn] = useState<string[]>(["Vegan"]);
  const toggle = (l: string) =>
    setOn((v) => (v.includes(l) ? v.filter((x) => x !== l) : [...v, l]));

  return (
    <div>
      <p className="text-caption text-muted-foreground mb-2">Dietary needs</p>
      <div
        className={cn(
          stacked ? "max-w-xs" : "flex max-w-md flex-wrap gap-x-5 gap-y-2",
        )}
      >
        {DIET.map((l, i) => (
          <label
            key={l}
            htmlFor={`${base}-${i}`}
            className={cn(
              "text-ui-sm flex cursor-pointer items-center gap-2.5",
              stacked && "h-9",
            )}
          >
            <Checkbox
              id={`${base}-${i}`}
              checked={on.includes(l)}
              onCheckedChange={() => toggle(l)}
            />
            {l}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── 4. Checkbox — the error says what to do ───────────────────────── */

function Terms({ explains }: { explains: boolean }) {
  const id = useId();
  const [ok, setOk] = useState(false);
  const [tried, setTried] = useState(false);
  const bad = tried && !ok;

  return (
    <div className="max-w-sm space-y-3">
      <label
        htmlFor={id}
        className={cn(
          "text-ui-sm flex min-h-9 cursor-pointer items-center gap-2.5",
          bad && !explains && "text-destructive",
        )}
      >
        <Checkbox
          id={id}
          checked={ok}
          onCheckedChange={(v) => setOk(v === true)}
          aria-invalid={bad && explains ? true : undefined}
        />
        I accept the terms of service
      </label>
      {bad && explains && (
        <p className="text-caption text-destructive">
          Tick this box to continue — we cannot open the account without it.
        </p>
      )}
      <Button variant="outline" className="h-9" onClick={() => setTried(true)}>
        Create account
      </Button>
      {tried && ok && (
        <p className="text-caption text-positive">Account created.</p>
      )}
    </div>
  );
}

/* ── 5. Chip — you can see which filters are on ────────────────────── */

const SHOP = ["Under €50", "Free shipping", "In stock", "4+ stars"];

function ShopChips({ loud }: { loud: boolean }) {
  const [on, setOn] = useState<string[]>(["Free shipping", "In stock"]);
  const toggle = (l: string) =>
    setOn((v) => (v.includes(l) ? v.filter((x) => x !== l) : [...v, l]));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SHOP.map((l) => {
          const sel = on.includes(l);
          return (
            <button
              key={l}
              type="button"
              aria-pressed={sel}
              onClick={() => toggle(l)}
              className={cn(
                CHIP,
                loud && sel && "bg-secondary border-border-strong",
                loud && !sel && "hover:bg-secondary/60",
                !loud && sel && "bg-secondary/25",
              )}
            >
              {loud && sel && <CheckIcon className="size-3.5" aria-hidden />}
              {l}
            </button>
          );
        })}
      </div>
      <p className="text-caption text-muted-foreground tabular-nums">
        {128 - on.length * 27} products
      </p>
    </div>
  );
}

/* ── 6. Chip — drop one without clearing them all ──────────────────── */

const APPLIED = ["Remote", "Full-time", "Design", "Berlin"];

function AppliedFilters({ removable }: { removable: boolean }) {
  const [tags, setTags] = useState(APPLIED);

  return (
    <div className="space-y-3">
      <div className="flex min-h-9 flex-wrap items-center gap-2">
        {tags.map((t) =>
          removable ? (
            <span key={t} className={cn(CHIP, "bg-secondary gap-1 pr-1.5")}>
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => setTags((v) => v.filter((x) => x !== t))}
                className="duration-fast ease-out-quart text-muted-foreground hover:text-foreground hover:bg-card grid size-6 place-items-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <XIcon className="size-3.5" aria-hidden />
              </button>
            </span>
          ) : (
            <span key={t} className={cn(CHIP, "bg-secondary")}>
              {t}
            </span>
          ),
        )}
        {tags.length === 0 && (
          <span className="text-caption text-muted-foreground">
            No filters left.
          </span>
        )}
      </div>
      <Button
        variant="outline"
        className="h-9"
        onClick={() => setTags(tags.length ? [] : APPLIED)}
      >
        {tags.length ? "Clear all" : "Put them back"}
      </Button>
    </div>
  );
}

/* ── 7. Chip — six options do not fit in a segmented control ───────── */

const PLACES = [
  "All",
  "Beaches",
  "Cafés",
  "Shops",
  "Cultural sites",
  "Gas stations",
];

function PlacePicker({ asChips }: { asChips: boolean }) {
  const [i, setI] = useState(0);

  return (
    <div className="max-w-sm space-y-3">
      {asChips ? (
        <div className="flex flex-wrap gap-2">
          {PLACES.map((p, n) => (
            <button
              key={p}
              type="button"
              aria-pressed={i === n}
              onClick={() => setI(n)}
              className={cn(
                CHIP,
                i === n
                  ? "bg-secondary border-border-strong"
                  : "hover:bg-secondary/60",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      ) : (
        <Seg
          items={PLACES.map((label) => ({ label }))}
          value={i}
          onChange={setI}
        />
      )}
      <p className="text-caption text-muted-foreground">
        Showing {PLACES[i].toLowerCase()} near you.
      </p>
    </div>
  );
}

/* ── 8. Radio — the question is written down, the answers stack ────── */

const DELIVERY = ["Standard", "Express", "Collect in store"];

function DeliveryChoice({ grouped }: { grouped: boolean }) {
  const base = useId();
  const [i, setI] = useState(0);

  if (!grouped) {
    return (
      <div className="flex max-w-md flex-wrap gap-x-5">
        {DELIVERY.map((d, n) => (
          <MiniRadio
            key={d}
            id={`${base}-${n}`}
            checked={i === n}
            onSelect={() => setI(n)}
            label={d}
          />
        ))}
      </div>
    );
  }

  return (
    <fieldset className="max-w-xs">
      <legend className="text-caption text-muted-foreground mb-1.5">
        Delivery method
      </legend>
      <div role="radiogroup" aria-label="Delivery method">
        {DELIVERY.map((d, n) => (
          <MiniRadio
            key={d}
            id={`${base}-${n}`}
            checked={i === n}
            onSelect={() => setI(n)}
            label={d}
          />
        ))}
      </div>
    </fieldset>
  );
}

/* ── 9. Radio — each option says what it means ─────────────────────── */

const PERIOD_CHOICES = [
  {
    short: "Rolling",
    label: "Rolling window",
    description: "The last 30 days, counted back from today.",
  },
  {
    short: "Calendar",
    label: "Calendar month",
    description: "Resets on the 1st, whatever today’s date is.",
  },
];

function ReportPeriod({ described }: { described: boolean }) {
  const base = useId();
  const [i, setI] = useState(0);

  return (
    <fieldset className="max-w-sm">
      <legend className="text-caption text-muted-foreground mb-1.5">
        Report period
      </legend>
      <div role="radiogroup" aria-label="Report period">
        {PERIOD_CHOICES.map((r, n) => (
          <MiniRadio
            key={r.label}
            id={`${base}-${n}`}
            checked={i === n}
            onSelect={() => setI(n)}
            label={described ? r.label : r.short}
            description={described ? r.description : undefined}
          />
        ))}
      </div>
    </fieldset>
  );
}

/* ── 10. Segmented control — the icons get their words back ────────── */

const VIEWS: SegItem[] = [
  { label: "List", icon: <ListIcon className="size-4" /> },
  { label: "Grid", icon: <LayoutGridIcon className="size-4" /> },
  { label: "Calendar", icon: <CalendarDaysIcon className="size-4" /> },
];

function ViewPicker({ labelled }: { labelled: boolean }) {
  const [i, setI] = useState(0);

  return (
    <div className="max-w-xs space-y-3">
      <Seg
        items={VIEWS.map((v) => ({ ...v, iconOnly: !labelled }))}
        value={i}
        onChange={setI}
      />
      <p className="text-caption text-muted-foreground">
        {VIEWS[i].label} view.
      </p>
    </div>
  );
}

/* ── 11. Segmented control — the three options match ───────────────── */

const PERIODS = ["Day", "Week", "Month"];

function PeriodPicker({ uniform }: { uniform: boolean }) {
  const [i, setI] = useState(1);

  if (uniform) {
    return (
      <div className="max-w-xs">
        <Seg
          items={PERIODS.map((label) => ({ label }))}
          value={i}
          onChange={setI}
        />
      </div>
    );
  }

  return (
    <div className="bg-secondary flex max-w-xs gap-0.5 rounded-xl p-1">
      <button
        type="button"
        onClick={() => setI(0)}
        aria-pressed={i === 0}
        className={cn(
          "text-ui-sm flex h-9 items-center rounded-lg px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          i === 0 ? "bg-card shadow-xs" : "text-muted-foreground",
        )}
      >
        Day
      </button>
      <button
        type="button"
        onClick={() => setI(1)}
        aria-label="Week"
        aria-pressed={i === 1}
        className={cn(
          "grid size-9 place-items-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          i === 1 ? "bg-card shadow-xs" : "text-muted-foreground",
        )}
      >
        <CalendarDaysIcon className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setI(2)}
        aria-pressed={i === 2}
        className={cn(
          "text-ui-sm flex h-9 flex-1 items-center gap-1.5 rounded-lg px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          i === 2 ? "bg-card shadow-xs" : "text-muted-foreground",
        )}
      >
        <span className="bg-muted grid size-5 shrink-0 place-items-center rounded">
          <ImageIcon className="size-3" aria-hidden />
        </span>
        Monthly
      </button>
    </div>
  );
}

/* ── 12. Slider — you can see the number you are setting ───────────── */

function PriceFilter({ labelled }: { labelled: boolean }) {
  const id = useId();
  const [v, setV] = useState(60);

  return (
    <div className="max-w-sm space-y-1.5">
      {labelled && (
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-ui-sm">
            Max price
          </label>
          <span className="text-ui-sm tabular-nums">€{v}</span>
        </div>
      )}
      <Range
        id={id}
        value={v}
        onChange={setV}
        label="Max price"
        min={10}
        max={200}
        step={5}
        plain={!labelled}
      />
      {labelled && (
        <div className="text-caption text-muted-foreground flex justify-between tabular-nums">
          <span>€10</span>
          <span>€200</span>
        </div>
      )}
    </div>
  );
}

/* ── 13. Slider — the sound follows your finger ────────────────────── */

const BAR_HEIGHTS = [42, 68, 55, 90, 74, 48, 82, 60, 96, 52, 78, 64, 88, 46, 70, 58];

function VolumeSlider({ live }: { live: boolean }) {
  const id = useId();
  const [v, setV] = useState(40);
  const [settled, setSettled] = useState(40);
  const shown = live ? v : settled;

  return (
    <div className="max-w-sm space-y-3">
      <div className="flex items-center gap-2.5">
        <Volume2Icon className="text-muted-foreground size-4" aria-hidden />
        <Range
          id={id}
          value={v}
          onChange={setV}
          onCommit={setSettled}
          label="Volume"
        />
        <span className="text-ui-sm w-10 shrink-0 text-right tabular-nums">
          {shown}%
        </span>
      </div>
      <div className="flex h-8 items-end gap-1" aria-hidden>
        {BAR_HEIGHTS.map((h, i) => (
          <span
            key={h + i}
            className={cn(
              "duration-fast ease-out-quart flex-1 rounded-sm transition-colors",
              (i + 1) / BAR_HEIGHTS.length <= shown / 100
                ? "bg-primary"
                : "bg-secondary",
            )}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── 14. Switch — it takes effect when you flip it ─────────────────── */

const TASKS = [
  { name: "Rewrite onboarding copy", who: "Mara" },
  { name: "Ship the export endpoint", who: "Ivo" },
  { name: "Audit the empty states", who: "Lena" },
];

function DensitySetting({ instant }: { instant: boolean }) {
  const id = useId();
  const [on, setOn] = useState(false);
  const [applied, setApplied] = useState(false);
  const compact = instant ? on : applied;
  const dirty = !instant && on !== applied;

  return (
    <div className="max-w-sm space-y-3">
      <div className="flex items-center gap-2.5">
        <Switch id={id} checked={on} onCheckedChange={setOn} />
        <label htmlFor={id} className="text-ui-sm flex min-h-9 items-center">
          Compact rows
        </label>
        {!instant && (
          <Button
            variant="outline"
            className="ml-auto h-9"
            disabled={!dirty}
            onClick={() => setApplied(on)}
          >
            Save
          </Button>
        )}
      </div>
      <ul className="bg-card divide-y overflow-hidden rounded-xl border">
        {TASKS.map((t) => (
          <li
            key={t.name}
            className={cn(
              "duration-base ease-out-quart flex items-center px-3 transition-[color,background-color,border-color,box-shadow,opacity,transform]",
              compact ? "h-9" : "h-14",
            )}
          >
            <span className="text-ui-sm truncate">{t.name}</span>
            <span className="text-caption text-muted-foreground ml-auto shrink-0">
              {t.who}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 15. Switch — one-off jobs are buttons ─────────────────────────── */

function BillingRows({ asButton }: { asButton: boolean }) {
  const renewId = useId();
  const dlId = useId();
  const [renew, setRenew] = useState(true);
  const [pulled, setPulled] = useState(false);

  return (
    <div className="bg-card max-w-sm divide-y overflow-hidden rounded-xl border">
      <div className="flex min-h-14 items-center gap-3 px-3">
        <label htmlFor={renewId} className="text-ui-sm flex-1">
          Auto-renew
        </label>
        <Switch id={renewId} checked={renew} onCheckedChange={setRenew} />
      </div>
      <div className="flex min-h-14 items-center gap-3 px-3 py-2">
        <div className="flex-1">
          <label
            htmlFor={asButton ? undefined : dlId}
            className="text-ui-sm block"
          >
            September invoice
          </label>
          {pulled && (
            <p className="text-caption text-muted-foreground">
              {asButton
                ? "Saved to Downloads."
                : "Still switched on. Nothing more happens."}
            </p>
          )}
        </div>
        {asButton ? (
          <Button
            variant="outline"
            className="h-9"
            onClick={() => setPulled(true)}
          >
            <DownloadIcon aria-hidden /> Download
          </Button>
        ) : (
          <Switch
            id={dlId}
            checked={pulled}
            onCheckedChange={(v) => setPulled(v === true)}
          />
        )}
      </div>
    </div>
  );
}

/* ── 16. Tabs — one is open, and you can see which ─────────────────── */

const PRODUCT = [
  { label: "Description", body: "A 34mm titanium case on a woven strap." },
  { label: "Specifications", body: "48h battery, 50m water resistance, 32g." },
  { label: "Reviews", body: "412 reviews, averaging 4.6 out of 5." },
];

function ProductTabs({ settled }: { settled: boolean }) {
  const [i, setI] = useState(settled ? 0 : -1);

  return (
    <div className="max-w-md space-y-3">
      <div
        role="tablist"
        aria-label="Product details"
        className={cn(
          "flex gap-1",
          settled && "bg-secondary w-fit rounded-xl p-1",
        )}
      >
        {PRODUCT.map((t, n) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={i === n}
            onClick={() => setI(n)}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart flex h-9 items-center rounded-lg px-3 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              settled && i === n && "bg-card text-foreground shadow-xs",
              settled && i !== n && "text-muted-foreground hover:text-foreground",
              !settled && i === n && "text-foreground",
              !settled && i !== n && "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-card flex min-h-20 items-center rounded-xl border px-4">
        <p className="text-ui-sm text-muted-foreground">
          {i >= 0 ? PRODUCT[i].body : ""}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function DesignSystemsSurfDemo() {
  return (
    <div>
      <BeforeAfter
        principle="You can press the words now, not just the tiny box."
        before={<MailPrefs wholeRow={false} />}
        after={<MailPrefs wholeRow />}
      />

      <BeforeAfter
        principle="Tick one row — the box at the top shows a dash, so you can see only some are picked."
        before={<SelectAll mixed={false} />}
        after={<SelectAll mixed />}
      />

      <BeforeAfter
        principle="The boxes line up, so your eye runs straight down the list."
        before={<DietFilters stacked={false} />}
        after={<DietFilters stacked />}
      />

      <BeforeAfter
        principle="Press Create account — it tells you what to fix instead of just turning red."
        before={<Terms explains={false} />}
        after={<Terms explains />}
      />

      <BeforeAfter
        principle="You can see at a glance which filters are on."
        before={<ShopChips loud={false} />}
        after={<ShopChips loud />}
      />

      <BeforeAfter
        principle="You can drop one filter without clearing the lot."
        before={<AppliedFilters removable={false} />}
        after={<AppliedFilters removable />}
      />

      <BeforeAfter
        principle="Six choices, and you can finally read all six."
        before={<PlacePicker asChips={false} />}
        after={<PlacePicker asChips />}
      />

      <BeforeAfter
        principle="You can tell what the question is, and which answer goes with which dot."
        before={<DeliveryChoice grouped={false} />}
        after={<DeliveryChoice grouped />}
      />

      <BeforeAfter
        principle="Each option says what it actually does."
        before={<ReportPeriod described={false} />}
        after={<ReportPeriod described />}
      />

      <BeforeAfter
        principle="You know what each button does without pressing it to find out."
        before={<ViewPicker labelled={false} />}
        after={<ViewPicker labelled />}
      />

      <BeforeAfter
        principle="The three options look like they belong to each other."
        before={<PeriodPicker uniform={false} />}
        after={<PeriodPicker uniform />}
      />

      <BeforeAfter
        principle="Drag it — you can see the price you are setting."
        before={<PriceFilter labelled={false} />}
        after={<PriceFilter labelled />}
      />

      <BeforeAfter
        principle="Drag slowly: the sound keeps up with your finger instead of waiting for you to let go."
        before={<VolumeSlider live={false} />}
        after={<VolumeSlider live />}
      />

      <BeforeAfter
        principle="Flip it and the rows change straight away."
        before={<DensitySetting instant={false} />}
        after={<DensitySetting instant />}
      />

      <BeforeAfter
        principle="Downloading happens once, so it is a button — nothing is left switched on."
        before={<BillingRows asButton={false} />}
        after={<BillingRows asButton />}
      />

      <BeforeAfter
        principle="There is already something to read, and you can see which tab you are on."
        before={<ProductTabs settled={false} />}
        after={<ProductTabs settled />}
      />
    </div>
  );
}
