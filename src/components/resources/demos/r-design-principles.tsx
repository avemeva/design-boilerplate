"use client";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, CircleHelp, Menu, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * principles.design — shown the way a designer posts their work.
 *
 * The library holds 236 example sets (1,661 principles by 200 creators)
 * plus five essays. Enumerated, the material this page was built from
 * comes to 93 discrete statements: the nine visual principles of
 * design, GOV.UK's 10, NHS's 9, Monzo's 6, OVO's 6, Adam Silver's 4,
 * Clearleft's 5, Fisher-Price's 5, Calm Technology's 8, road design's
 * 10, seven stop signals, five failure modes, six rule/principle
 * distinctions and three findings on set size.
 *
 * Most of them are about how a team decides, which nobody can see. The
 * ones a person can *feel* are here, each as one switch: the old
 * version, the new one, same content, same spot.
 */

/* ── small shared pieces ──────────────────────────────────────────── */

function Row({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-3", className)} {...props} />;
}

const PLANS = [
  { id: "solo", name: "Solo", detail: "1 seat · 5 GB" },
  { id: "team", name: "Team", detail: "10 seats · 100 GB" },
  { id: "scale", name: "Scale", detail: "Unlimited seats · 1 TB" },
] as const;

const NEWS = [
  {
    title: "Shared folders",
    body: "Everyone on your plan can now open the same folder.",
  },
  {
    title: "Faster search",
    body: "Results appear as you type, even on large accounts.",
  },
  {
    title: "Weekly summary",
    body: "A short email on Mondays with what changed.",
  },
] as const;

const SECTIONS = [
  { id: "overview", label: "Overview", body: "Everything is running normally. No action needed." },
  { id: "usage", label: "Usage", body: "9.2 GB of your 10 GB is in use this month." },
  { id: "billing", label: "Billing", body: "Your next payment of £24.00 is due on 12 September." },
  { id: "team", label: "Team", body: "Four people have access. Two joined this month." },
] as const;

/* ── 1. the thing to press ────────────────────────────────────────── */

function StorageCard({ flat }: { flat: boolean }) {
  return (
    <div className="max-w-md">
      <p className={cn(flat ? "text-ui-sm text-muted-foreground" : "text-ui")}>
        Storage almost full
      </p>
      <p
        className={cn(
          "mt-1",
          flat ? "text-ui-sm text-muted-foreground" : "text-caption text-muted-foreground",
        )}
      >
        9.2 GB of 10 GB used
      </p>
      <div className="bg-secondary mt-3 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", flat ? "bg-border" : "bg-primary")}
          style={{ width: "92%" }}
        />
      </div>
      <Row className={cn("mt-4", flat && "gap-4")}>
        {flat ? (
          <>
            <Button
              variant="ghost"
              size="lg"
              className="text-muted-foreground px-0"
              onClick={() => toast("Upgrade started")}
            >
              Upgrade plan
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-muted-foreground px-0"
              onClick={() => toast("Opening your files")}
            >
              Manage files
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" onClick={() => toast("Upgrade started")}>
              Upgrade plan
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => toast("Opening your files")}
            >
              Manage files
            </Button>
          </>
        )}
      </Row>
    </div>
  );
}

/* ── 2. finding the total ─────────────────────────────────────────── */

const BILL_LINES = [
  { label: "Standing charge", value: 18.4 },
  { label: "Electricity · 412 kWh", value: 74.16 },
  { label: "Gas · 88 kWh", value: 33.84 },
] as const;

function Bill({ flat }: { flat: boolean }) {
  const [paperless, setPaperless] = useState(true);
  const total =
    BILL_LINES.reduce((a, l) => a + l.value, 0) - (paperless ? 4.5 : 0);

  return (
    <div className="max-w-md">
      <div className={cn(flat ? "space-y-1" : "space-y-1.5")}>
        {BILL_LINES.map((l) => (
          <Row key={l.label} className="justify-between">
            <span className={flat ? "text-ui" : "text-caption text-muted-foreground"}>
              {l.label}
            </span>
            <span
              className={cn(
                "tabular-nums",
                flat ? "text-ui" : "text-caption text-muted-foreground",
              )}
            >
              £{l.value.toFixed(2)}
            </span>
          </Row>
        ))}
        {paperless && (
          <Row className="justify-between">
            <span className={flat ? "text-ui" : "text-caption text-muted-foreground"}>
              Paperless discount
            </span>
            <span
              className={cn(
                "tabular-nums",
                flat ? "text-ui" : "text-caption text-muted-foreground",
              )}
            >
              −£4.50
            </span>
          </Row>
        )}

        {flat ? (
          <Row className="justify-between">
            <span className="text-ui">Total</span>
            <span className="text-ui tabular-nums">£{total.toFixed(2)}</span>
          </Row>
        ) : (
          <div className="mt-4 border-t pt-3">
            <p className="text-micro text-muted-foreground uppercase">Total due</p>
            <Row className="mt-1 justify-between">
              <span className="text-ui font-semibold">12 September</span>
              <NumberFlow
                value={total}
                format={{ style: "currency", currency: "GBP" }}
                className="text-ui font-semibold"
                data-numeric
              />
            </Row>
          </div>
        )}
      </div>

      <Row className="mt-5">
        <Switch
          id={`paperless-${flat ? "b" : "a"}`}
          checked={paperless}
          onCheckedChange={setPaperless}
        />
        <Label htmlFor={`paperless-${flat ? "b" : "a"}`} className="text-ui-sm">
          Paperless billing
        </Label>
      </Row>
    </div>
  );
}

/* ── 3. running your eye down a column ────────────────────────────── */

const SPEEDS = [
  { id: "standard", label: "Standard", arrives: "Thu 10 September" },
  { id: "express", label: "Express", arrives: "Tue 8 September" },
  { id: "nextday", label: "Next day", arrives: "Sat 6 September" },
] as const;

function OrderDetails({ ragged }: { ragged: boolean }) {
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]["id"]>("standard");
  const chosen = SPEEDS.find((s) => s.id === speed) ?? SPEEDS[0];

  const fields = [
    ["Order", "4471-C"],
    ["Placed", "2 September"],
    ["Ships to", "14 Bell Street, Bristol"],
    ["Delivery", chosen.label],
    ["Arrives", chosen.arrives],
  ] as const;

  return (
    <div className="max-w-md">
      {ragged ? (
        <div className="space-y-2">
          {fields.map(([k, v], i) => (
            <p
              key={k}
              className={cn(
                "text-ui-sm",
                i === 1 && "pl-4",
                i === 3 && "pl-8",
                i === 4 && "text-center",
              )}
            >
              <span className="text-muted-foreground">{k}: </span>
              {v}
            </p>
          ))}
        </div>
      ) : (
        <dl className="grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-2">
          {fields.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-caption text-muted-foreground">{k}</dt>
              <dd className="text-ui-sm">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <Row className="mt-5 flex-wrap gap-2">
        {SPEEDS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={speed === s.id}
            onClick={() => setSpeed(s.id)}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg px-3 transition-colors",
              speed === s.id
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </Row>
    </div>
  );
}

/* ── 4. which setting belongs to which heading ────────────────────── */

const SETTING_GROUPS = [
  {
    heading: "Notifications",
    rows: ["Email me about replies", "Email me a weekly summary"],
  },
  {
    heading: "Privacy",
    rows: ["Show my profile in search", "Let people see when I am online"],
  },
  { heading: "Account", rows: ["Keep me signed in on this device"] },
] as const;

function Settings({ evenly }: { evenly: boolean }) {
  const [on, setOn] = useState<Record<string, boolean>>({
    "Email me about replies": true,
    "Show my profile in search": true,
  });

  return (
    <div className={cn("max-w-md", evenly && "space-y-3")}>
      {SETTING_GROUPS.map((g, gi) => (
        <div
          key={g.heading}
          className={cn(!evenly && gi > 0 && "mt-7 border-t pt-6")}
        >
          <p
            className={cn(
              evenly
                ? "text-ui-sm"
                : "text-micro text-muted-foreground mb-3 uppercase",
            )}
          >
            {g.heading}
          </p>
          <div className={cn(evenly ? "space-y-3 pt-3" : "space-y-3")}>
            {g.rows.map((r) => {
              const id = `${evenly ? "e" : "g"}-${r}`;
              return (
                <Row key={r}>
                  <Switch
                    id={id}
                    checked={!!on[r]}
                    onCheckedChange={(v) => setOn((s) => ({ ...s, [r]: v }))}
                  />
                  <Label htmlFor={id} className="text-ui-sm font-normal">
                    {r}
                  </Label>
                </Row>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 5. one button, learned once ──────────────────────────────────── */

const DOCS = [
  { name: "Q3 forecast", kind: "sheet" },
  { name: "Brand review", kind: "slide" },
  { name: "Supplier contract", kind: "doc" },
  { name: "Headcount", kind: "sheet" },
  { name: "Launch plan", kind: "doc" },
] as const;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "doc", label: "Documents" },
  { id: "sheet", label: "Sheets" },
  { id: "slide", label: "Slides" },
] as const;

function DocFilter({ mixed }: { mixed: boolean }) {
  const [f, setF] = useState<string>("all");
  const shown = DOCS.filter((d) => f === "all" || d.kind === f);

  const oddStyles = [
    "rounded-full border px-4 text-micro uppercase",
    "bg-secondary rounded-sm px-2 text-caption",
    "border-border-strong rounded-xl border px-5 text-ui",
    "px-1 text-ui-sm underline underline-offset-4",
  ];

  return (
    <div className="max-w-md">
      <Row className="flex-wrap gap-2">
        {FILTERS.map((o, i) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={f === o.id}
            onClick={() => setF(o.id)}
            className={cn(
              "duration-fast ease-out-quart h-9 transition-colors",
              mixed
                ? cn(
                    oddStyles[i],
                    f === o.id
                      ? i === 0
                        ? "bg-primary text-primary-foreground"
                        : i === 1
                          ? "border-border-strong border font-semibold"
                          : i === 2
                            ? "font-semibold underline"
                            : "text-foreground no-underline"
                      : "text-muted-foreground",
                  )
                : cn(
                    "text-ui-sm rounded-lg px-3",
                    f === o.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  ),
            )}
          >
            {o.label}
          </button>
        ))}
      </Row>

      <ul className="mt-4">
        {shown.map((d) => (
          <li key={d.name} className="text-ui-sm border-t py-2.5 first:border-t-0">
            {d.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 6. pressing anywhere on the row ──────────────────────────────── */

function PlanPicker({ tiny }: { tiny: boolean }) {
  const [picked, setPicked] = useState<string>("team");

  if (tiny) {
    return (
      <div className="max-w-md space-y-1">
        {PLANS.map((p) => (
          <div key={p.id} className="flex items-start gap-2 py-0.5">
            <input
              type="radio"
              name="plan-tiny"
              className="accent-accent-solid mt-1 size-3"
              checked={picked === p.id}
              onChange={() => setPicked(p.id)}
              aria-label={p.name}
            />
            <span className="text-ui-sm">
              {p.name}
              <span className="text-muted-foreground"> — {p.detail}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-1">
      {PLANS.map((p) => (
        <label
          key={p.id}
          htmlFor={`plan-${p.id}`}
          className={cn(
            "duration-fast ease-out-quart flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 transition-colors",
            picked === p.id ? "bg-accent" : "hover:bg-secondary",
          )}
        >
          <input
            id={`plan-${p.id}`}
            type="radio"
            name="plan-roomy"
            className="accent-accent-solid size-4"
            checked={picked === p.id}
            onChange={() => setPicked(p.id)}
          />
          <span
            className={cn(
              "text-ui-sm",
              picked === p.id && "text-accent-foreground",
            )}
          >
            {p.name}
            <span
              className={cn(
                picked === p.id ? "opacity-80" : "text-muted-foreground",
              )}
            >
              {" "}
              — {p.detail}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

/* ── 7. an error you can act on ───────────────────────────────────── */

function ExpiryForm({ jargon }: { jargon: boolean }) {
  const [value, setValue] = useState("01/20");
  const [failed, setFailed] = useState(false);
  const id = jargon ? "exp-j" : "exp-p";

  const check = () => setFailed(!/^(0[1-9]|1[0-2])\/(2[6-9]|3\d)$/.test(value));

  return (
    <div className="max-w-sm">
      <Label htmlFor={id} className="text-ui-sm mb-1.5">
        Card expiry
      </Label>
      <Input
        id={id}
        className="h-9"
        value={value}
        placeholder="MM/YY"
        aria-invalid={failed}
        aria-describedby={failed ? `${id}-err` : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          setFailed(false);
        }}
      />
      {failed && (
        <p id={`${id}-err`} className="text-caption text-destructive mt-2">
          {jargon
            ? "Error 422 — validation failed on field card_expiry (E_INVALID_RANGE). Reference 7f3a91."
            : "That date has already passed. Use the date printed on the front of your card, like 04/29."}
        </p>
      )}
      <Button size="lg" className="mt-3" onClick={check}>
        Save card
      </Button>
    </div>
  );
}

/* ── 8. seeing where you can go ───────────────────────────────────── */

function SectionNav({ hidden }: { hidden: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("overview");
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <div className="max-w-md">
      {hidden ? (
        <div className="relative">
          <Button
            variant="secondary"
            size="icon-lg"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <Menu aria-hidden="true" />
          </Button>
          <AnimatePresence>
            {open && (
              <motion.ul
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                className="bg-popover shadow-floating absolute top-11 left-0 z-10 w-48 rounded-xl p-1"
              >
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="text-ui-sm hover:bg-secondary h-9 w-full rounded-lg px-3 text-left"
                      onClick={() => {
                        setActive(s.id);
                        setOpen(false);
                      }}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <Row className="flex-wrap gap-1.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={active === s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg px-3 transition-colors",
                active === s.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </Row>
      )}

      <div className="bg-secondary mt-4 rounded-xl p-4">
        <p className="text-ui">{section.label}</p>
        <p className="text-caption text-muted-foreground mt-1">{section.body}</p>
      </div>
    </div>
  );
}

/* ── 9. the hint already on the page ──────────────────────────────── */

function SecurityCode({ hiddenHint }: { hiddenHint: boolean }) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="max-w-sm">
      <Row className="mb-1.5 gap-1.5">
        <Label htmlFor={hiddenHint ? "cvc-h" : "cvc-v"} className="text-ui-sm">
          Security code
        </Label>
        {hiddenHint && (
          <span className="relative inline-flex">
            <button
              type="button"
              aria-label="What is the security code?"
              className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center"
              onMouseEnter={() => setShow(true)}
              onMouseLeave={() => setShow(false)}
              onFocus={() => setShow(true)}
              onBlur={() => setShow(false)}
            >
              <CircleHelp className="size-4" aria-hidden="true" />
            </button>
            <AnimatePresence>
              {show && (
                <motion.span
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.fast, ease: ease.outQuart }}
                  className="bg-popover text-caption shadow-floating absolute bottom-10 left-0 z-10 w-56 rounded-lg p-2.5"
                >
                  The 3 digits on the back of your card.
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        )}
      </Row>
      {!hiddenHint && (
        <p id="cvc-hint" className="text-caption text-muted-foreground mb-2">
          The 3 digits on the back of your card.
        </p>
      )}
      <Input
        id={hiddenHint ? "cvc-h" : "cvc-v"}
        className="h-9"
        inputMode="numeric"
        maxLength={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={hiddenHint ? undefined : "cvc-hint"}
      />
    </div>
  );
}

/* ── 10. a menu that waits for you ────────────────────────────────── */

const ACCOUNT_ITEMS = ["Profile", "Preferences", "Billing", "Sign out"] as const;

function AccountMenu({ onHover }: { onHover: boolean }) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeSoon = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 220);
  };
  const keep = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <div className="max-w-md">
      <div className="relative inline-block">
        <Button
          variant="secondary"
          size="lg"
          aria-expanded={open}
          onMouseEnter={onHover ? () => setOpen(true) : undefined}
          onMouseLeave={onHover ? closeSoon : undefined}
          onClick={onHover ? undefined : () => setOpen((o) => !o)}
        >
          Account
          <ChevronDown aria-hidden="true" />
        </Button>
        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              onMouseEnter={onHover ? keep : undefined}
              onMouseLeave={onHover ? closeSoon : undefined}
              className="bg-popover shadow-floating absolute top-12 left-0 z-10 w-44 rounded-xl p-1"
            >
              {ACCOUNT_ITEMS.map((it) => (
                <li key={it}>
                  <button
                    type="button"
                    className="text-ui-sm hover:bg-secondary h-9 w-full rounded-lg px-3 text-left"
                    onClick={() => {
                      setChosen(it);
                      setOpen(false);
                    }}
                  >
                    {it}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        {chosen ? `You chose ${chosen}.` : "Nothing chosen yet."}
      </p>
    </div>
  );
}

/* ── 11. reading something that stays still ───────────────────────── */

function WhatsNew({ moving }: { moving: boolean }) {
  if (moving) {
    return (
      <div className="max-w-md overflow-hidden">
        <motion.div
          className="flex w-full"
          animate={{ x: ["0%", "0%", "-100%", "-100%", "-200%", "-200%", "0%"] }}
          transition={{
            duration: 10.5,
            times: [0, 0.28, 0.33, 0.61, 0.66, 0.94, 1],
            ease: ease.inOutCubic,
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          {NEWS.map((n) => (
            <div key={n.title} className="w-full shrink-0 pr-4">
              <p className="text-ui">{n.title}</p>
              <p className="text-caption text-muted-foreground mt-1">{n.body}</p>
              <Button
                variant="secondary"
                size="lg"
                className="mt-3"
                onClick={() => toast(`Opening “${n.title}”`)}
              >
                Read more
              </Button>
            </div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      {NEWS.map((n) => (
        <div key={n.title} className="border-t py-4 first:border-t-0 first:pt-0">
          <p className="text-ui">{n.title}</p>
          <p className="text-caption text-muted-foreground mt-1">{n.body}</p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-3"
            onClick={() => toast(`Opening “${n.title}”`)}
          >
            Read more
          </Button>
        </div>
      ))}
    </div>
  );
}

/* ── 12. saving without being stopped ─────────────────────────────── */

function NoteEditor({ blocking }: { blocking: boolean }) {
  const [text, setText] = useState("Call the supplier back about the pallet sizes.");
  const [dialog, setDialog] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = () => {
    if (blocking) {
      setDialog(true);
      return;
    }
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="max-w-md">
      <Label htmlFor={blocking ? "note-b" : "note-q"} className="text-ui-sm mb-1.5">
        Note
      </Label>
      <Textarea
        id={blocking ? "note-b" : "note-q"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />
      <Row className="mt-3">
        <Button size="lg" onClick={save}>
          Save
        </Button>
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className="text-caption text-positive"
            >
              Saved
            </motion.span>
          )}
        </AnimatePresence>
      </Row>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saved</DialogTitle>
            <DialogDescription>
              Your changes have been saved successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="lg">OK</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── 13. losing the connection ────────────────────────────────────── */

function BalanceTile({ wipes }: { wipes: boolean }) {
  const [online, setOnline] = useState(true);

  return (
    <div className="max-w-md">
      <div className="bg-secondary min-h-32 rounded-xl p-4">
        {wipes && !online ? (
          <div className="flex min-h-24 flex-col items-start justify-center">
            <p className="text-ui-sm text-muted-foreground">
              Couldn’t load your account.
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-3"
              onClick={() => setOnline(true)}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <p className="text-micro text-muted-foreground uppercase">Balance</p>
            <p className="text-ui mt-1 font-semibold tabular-nums">£1,284.20</p>
            <p className="text-caption text-muted-foreground mt-3">
              3 payments due this week
            </p>
            {!online && (
              <Row className="mt-3">
                <span className="text-caption text-muted-foreground">
                  Showing your last update, 11:40
                </span>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-caption px-2"
                  onClick={() => setOnline(true)}
                >
                  Retry
                </Button>
              </Row>
            )}
          </>
        )}
      </div>

      <Row className="mt-4">
        <Switch
          id={wipes ? "net-b" : "net-a"}
          checked={online}
          onCheckedChange={setOnline}
        />
        <Label htmlFor={wipes ? "net-b" : "net-a"} className="text-ui-sm font-normal">
          Connected
        </Label>
      </Row>
    </div>
  );
}

/* ── 14. how much you have to fill in ─────────────────────────────── */

const LONG_FIELDS = [
  "First name",
  "Last name",
  "Email",
  "Phone",
  "Company",
  "Job title",
  "How did you hear about us?",
] as const;

function Signup({ long }: { long: boolean }) {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <form
      className="max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        toast("Account created");
      }}
    >
      {long ? (
        <div className="space-y-3">
          {LONG_FIELDS.map((f) => (
            <div key={f}>
              <Label htmlFor={`f-${f}`} className="text-ui-sm mb-1.5">
                {f}
              </Label>
              <Input
                id={`f-${f}`}
                className="h-9"
                value={values[f] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <Label htmlFor="f-short" className="text-ui-sm mb-1.5">
            Email
          </Label>
          <Input
            id="f-short"
            type="email"
            className="h-9"
            value={values.short ?? ""}
            onChange={(e) =>
              setValues((v) => ({ ...v, short: e.target.value }))
            }
          />
          <p className="text-caption text-muted-foreground mt-2">
            You can add the rest whenever you like.
          </p>
        </div>
      )}
      <Button type="submit" size="lg" className="mt-4">
        Create account
      </Button>
    </form>
  );
}

/* ── 15. nothing ticked for you ───────────────────────────────────── */

function OptIn({ tricky }: { tricky: boolean }) {
  const [checked, setChecked] = useState(tricky);
  const [done, setDone] = useState<string | null>(null);

  return (
    <div className="max-w-sm">
      <Row className="items-start gap-2.5">
        <Checkbox
          id={tricky ? "opt-t" : "opt-h"}
          checked={checked}
          onCheckedChange={(v) => setChecked(v === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor={tricky ? "opt-t" : "opt-h"}
          className={cn(
            "font-normal",
            tricky ? "text-caption text-muted-foreground" : "text-ui-sm",
          )}
        >
          {tricky
            ? "Yes, I would like to keep receiving offers, updates and news from us and selected partners by email, post and phone."
            : "Email me product updates"}
        </Label>
      </Row>

      {tricky ? (
        <div className="mt-4">
          <Button
            size="lg"
            className="w-full"
            onClick={() =>
              setDone(checked ? "signed up, and offers are on" : "signed up")
            }
          >
            Continue
          </Button>
          <button
            type="button"
            className="text-micro text-muted-foreground mx-auto mt-2 block h-9 uppercase"
            onClick={() => setDone("signed up")}
          >
            No thanks
          </button>
        </div>
      ) : (
        <Button
          size="lg"
          className="mt-4"
          onClick={() =>
            setDone(checked ? "signed up, and updates are on" : "signed up")
          }
        >
          Continue
        </Button>
      )}

      {done && (
        <p className="text-caption text-muted-foreground mt-3">You are {done}.</p>
      )}
    </div>
  );
}

/* ── 16. changing your mind ───────────────────────────────────────── */

const FILES = [
  "invoice-2026-04.pdf",
  "supplier-terms.pdf",
  "delivery-note-118.pdf",
] as const;

function FileList({ confirms }: { confirms: boolean }) {
  const [files, setFiles] = useState<string[]>([...FILES]);
  const [pending, setPending] = useState<string | null>(null);

  const remove = (name: string) => {
    const at = files.indexOf(name);
    setFiles((f) => f.filter((x) => x !== name));
    if (!confirms) {
      toast(`${name} deleted`, {
        action: {
          label: "Undo",
          onClick: () =>
            setFiles((f) => {
              if (f.includes(name)) return f;
              const next = [...f];
              next.splice(at, 0, name);
              return next;
            }),
        },
      });
    }
  };

  return (
    <div className="max-w-md">
      {files.length === 0 ? (
        <p className="text-ui-sm text-muted-foreground py-4">
          Everything here is deleted.
        </p>
      ) : (
        <ul>
          {files.map((f) => (
            <li
              key={f}
              className="flex min-h-12 items-center justify-between gap-3 border-t first:border-t-0"
            >
              <span className="text-ui-sm">{f}</span>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`Delete ${f}`}
                onClick={() => (confirms ? setPending(f) : remove(f))}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pending}?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Are you sure you want to delete this file?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="lg">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                if (pending) remove(pending);
                setPending(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function DesignPrinciplesDemo() {
  return (
    <div>
      <BeforeAfter
        principle="You can tell what to press without reading everything."
        before={<StorageCard flat />}
        after={<StorageCard flat={false} />}
      />

      <BeforeAfter
        principle="The total stops hiding among the other numbers."
        before={<Bill flat />}
        after={<Bill flat={false} />}
      />

      <BeforeAfter
        principle="Your eye can run straight down the list."
        before={<OrderDetails ragged />}
        after={<OrderDetails ragged={false} />}
      />

      <BeforeAfter
        principle="You can see which setting belongs to which heading."
        before={<Settings evenly />}
        after={<Settings evenly={false} />}
      />

      <BeforeAfter
        principle="Once you have learned one button, you know them all."
        before={<DocFilter mixed />}
        after={<DocFilter mixed={false} />}
      />

      <BeforeAfter
        principle="Now you can press anywhere on the row."
        before={<PlanPicker tiny />}
        after={<PlanPicker tiny={false} />}
      />

      <BeforeAfter
        principle="The message tells you what to fix."
        before={<ExpiryForm jargon />}
        after={<ExpiryForm jargon={false} />}
      />

      <BeforeAfter
        principle="You can see where you can go without opening anything."
        before={<SectionNav hidden />}
        after={<SectionNav hidden={false} />}
      />

      <BeforeAfter
        principle="What you need to know is already on the page."
        before={<SecurityCode hiddenHint />}
        after={<SecurityCode hiddenHint={false} />}
      />

      <BeforeAfter
        principle="The menu waits for you instead of vanishing."
        before={<AccountMenu onHover />}
        after={<AccountMenu onHover={false} />}
      />

      <BeforeAfter
        principle="It stops moving while you are reading it."
        before={<WhatsNew moving />}
        after={<WhatsNew moving={false} />}
      />

      <BeforeAfter
        principle="Saving no longer stops what you were doing."
        before={<NoteEditor blocking />}
        after={<NoteEditor blocking={false} />}
      />

      <BeforeAfter
        principle="Losing the connection no longer wipes the screen."
        before={<BalanceTile wipes />}
        after={<BalanceTile wipes={false} />}
      />

      <BeforeAfter
        principle="You are done in one step instead of seven."
        before={<Signup long />}
        after={<Signup long={false} />}
      />

      <BeforeAfter
        principle="Nothing is ticked for you."
        before={<OptIn tricky />}
        after={<OptIn tricky={false} />}
      />

      <BeforeAfter
        principle="You can change your mind instead of being asked twice."
        before={<FileList confirms />}
        after={<FileList confirms={false} />}
      />
    </div>
  );
}
