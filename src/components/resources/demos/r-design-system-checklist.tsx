"use client";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ImageOff,
  MoreHorizontal,
  Pencil,
  Star,
  TriangleAlert,
  Undo2,
  UserPlus,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * designsystemchecklist.com — shown the way a designer posts their work.
 *
 * The source is 232 checkboxes in 42 sections across 4 categories
 * (Foundations 26, Design language 10, Components 168, Maintenance 28 —
 * counted from src/translations/en/*.js in the project's repo).
 *
 * Most of them are governance: release cycles, SLAs, stakeholder maps,
 * contribution rules. Nobody can see those. The ones a person can feel
 * are here, each as one switch — the version most products ship, and
 * the version that passes the checkbox — same content, same spot.
 */

/* ── shared bits ──────────────────────────────────────────────────── */

function Row({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-3", className)} {...props} />;
}

function Pill({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg px-3 transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/* ── 1. reading the amounts ───────────────────────────────────────── */

const RECEIPT = [
  ["Basket", 64.9],
  ["Delivery", 3.99],
  ["Discount", -5],
] as const;

function Receipt({ faint }: { faint: boolean }) {
  const [tip, setTip] = useState(0);
  const total = RECEIPT.reduce((a, [, v]) => a + v, 0) + tip;

  const dim = "text-micro text-muted-foreground/40";

  return (
    <div className="max-w-sm">
      <div className="space-y-1.5">
        {RECEIPT.map(([k, v]) => (
          <Row key={k} className="justify-between">
            <span className={faint ? dim : "text-caption text-muted-foreground"}>
              {k}
            </span>
            <span className={cn("tabular-nums", faint ? dim : "text-ui-sm")}>
              {v < 0 ? "−" : ""}£{Math.abs(v).toFixed(2)}
            </span>
          </Row>
        ))}
        {tip > 0 && (
          <Row className="justify-between">
            <span className={faint ? dim : "text-caption text-muted-foreground"}>
              Tip
            </span>
            <span className={cn("tabular-nums", faint ? dim : "text-ui-sm")}>
              £{tip.toFixed(2)}
            </span>
          </Row>
        )}
      </div>

      <div
        className={cn(
          "mt-3 flex items-center justify-between gap-4",
          !faint && "border-t pt-3",
        )}
      >
        <span className={faint ? dim : "text-ui-sm font-semibold"}>Total</span>
        {faint ? (
          <span className={cn(dim, "tabular-nums")}>£{total.toFixed(2)}</span>
        ) : (
          <NumberFlow
            value={total}
            format={{ style: "currency", currency: "GBP" }}
            className="text-ui-sm font-semibold"
            data-numeric
          />
        )}
      </div>

      <Row className="mt-4 flex-wrap gap-2">
        {[0, 5, 8].map((t) => (
          <Pill key={t} active={tip === t} onClick={() => setTip(t)}>
            {t === 0 ? "No tip" : `£${t}.00 tip`}
          </Pill>
        ))}
      </Row>
    </div>
  );
}

/* ── 2. the length of a line ──────────────────────────────────────── */

const PARAS = [
  "Your parcel leaves our Bristol warehouse the same working day if you order before 3pm, and it is handed to the courier that evening.",
  "If nobody is in, the driver will try a neighbour first, then leave it in the safe place you nominated when you placed the order.",
] as const;

function Policy({ wide }: { wide: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={wide ? "" : "max-w-md"}>
      <p className={cn("text-ui-sm", wide && "leading-tight")}>{PARAS[0]}</p>
      {open && (
        <p className={cn("text-ui-sm mt-3", wide && "leading-tight")}>
          {PARAS[1]}
        </p>
      )}
      <Button
        variant="secondary"
        size="lg"
        className="mt-4"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Show less" : "Read more"}
      </Button>
    </div>
  );
}

/* ── 3. how long a panel takes to arrive ──────────────────────────── */

function DetailsPanel({ sluggish }: { sluggish: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-md">
      <Button size="lg" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? "Hide details" : "Show details"}
      </Button>

      <div className="mt-3 min-h-28">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={
                sluggish
                  ? { duration: 0.9, ease: "linear" }
                  : { duration: duration.base, ease: ease.outQuart }
              }
              className="bg-secondary rounded-xl p-4"
            >
              <p className="text-ui">Order 4471-C</p>
              <p className="text-caption text-muted-foreground mt-1">
                Three items · £63.89 · arriving Thursday
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── 4. a menu that opens on top ──────────────────────────────────── */

const SUPPLIERS = ["Halden Paper", "Vestry Timber", "Corran Glass"] as const;

function SupplierList({ buried }: { buried: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="max-w-md">
      <ul>
        {SUPPLIERS.map((s) => (
          <li
            key={s}
            className="bg-card relative flex min-h-12 items-center justify-between gap-3 border-t first:border-t-0"
          >
            <span className="text-ui-sm">{s}</span>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`More actions for ${s}`}
                aria-expanded={open === s}
                onClick={() => setOpen((o) => (o === s ? null : s))}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
              <AnimatePresence>
                {open === s && (
                  <motion.ul
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: duration.fast,
                      ease: ease.outQuart,
                    }}
                    className={cn(
                      "bg-popover absolute top-10 right-0 w-40 rounded-xl p-1",
                      buried ? "border" : "shadow-floating z-20",
                    )}
                  >
                    {["Rename", "Duplicate", "Archive"].map((a) => (
                      <li key={a}>
                        <button
                          type="button"
                          className="text-ui-sm hover:bg-secondary h-9 w-full rounded-lg px-3 text-left"
                          onClick={() => {
                            setNote(`${a} — ${s}`);
                            setOpen(null);
                          }}
                        >
                          {a}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-caption text-muted-foreground mt-3">
        {note ?? "Open the menu on the first row."}
      </p>
    </div>
  );
}

/* ── 5. faces that fail to load ───────────────────────────────────── */

const TEAM = [
  { name: "Ada Okafor", initials: "AO" },
  { name: "Ben Halloway", initials: "BH" },
  { name: "Cleo Marsh", initials: "CM" },
] as const;

function TeamRow({ raw }: { raw: boolean }) {
  const [invited, setInvited] = useState(false);

  if (raw) {
    return (
      <div className="max-w-md">
        <div className="flex flex-wrap items-center gap-2">
          {TEAM.map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={m.name}
              src="/team-photo-missing.png"
              alt={m.name}
              className="size-8 rounded-full"
            />
          ))}
          {invited && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/team-photo-missing.png"
              alt="Dara Nolan"
              className="size-8 rounded-full"
            />
          )}
          <span className="text-ui-sm text-muted-foreground">+3</span>
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="mt-4"
          onClick={() => setInvited(true)}
          disabled={invited}
        >
          <UserPlus aria-hidden="true" />
          Invite Dara
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <AvatarGroup>
        {TEAM.map((m) => (
          <Avatar key={m.name}>
            <AvatarFallback aria-label={m.name}>{m.initials}</AvatarFallback>
          </Avatar>
        ))}
        {invited && (
          <Avatar>
            <AvatarFallback aria-label="Dara Nolan">DN</AvatarFallback>
          </Avatar>
        )}
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>
      <p className="text-caption text-muted-foreground mt-3">
        {invited
          ? "Ada, Ben, Cleo, Dara and 3 others"
          : "Ada, Ben, Cleo and 3 others"}
      </p>
      <Button
        variant="secondary"
        size="lg"
        className="mt-3"
        onClick={() => setInvited(true)}
        disabled={invited}
      >
        <UserPlus aria-hidden="true" />
        Invite Dara
      </Button>
    </div>
  );
}

/* ── 6. being told the card was declined ──────────────────────────── */

function Decline({ bare }: { bare: boolean }) {
  const [fixed, setFixed] = useState(false);

  if (bare) {
    return (
      <div className="max-w-md">
        <p
          className={cn(
            "text-caption",
            fixed ? "text-muted-foreground" : "text-destructive",
          )}
        >
          {fixed
            ? "Card updated. (ok_card_saved)"
            : "Your card was declined. (err_card_declined)"}
        </p>
        <Row className="mt-4 justify-between">
          <span className="text-ui-sm">Team plan · £24.00 a month</span>
          <Button variant="secondary" size="lg" onClick={() => setFixed(true)}>
            Account
          </Button>
        </Row>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      {fixed ? (
        <Row className="bg-secondary rounded-xl p-4">
          <Check className="text-positive size-4 shrink-0" aria-hidden="true" />
          <p className="text-ui-sm">New card saved. Nothing else to do.</p>
        </Row>
      ) : (
        <div className="bg-secondary flex gap-3 rounded-xl p-4">
          <TriangleAlert
            className="text-destructive mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-ui">Your card was declined</p>
            <p className="text-caption text-muted-foreground mt-1">
              Your bank turned down the £24.00 payment on 2 September. Your team
              keeps working until 9 September.
            </p>
            <Button size="lg" className="mt-3" onClick={() => setFixed(true)}>
              <CreditCard aria-hidden="true" />
              Use a different card
            </Button>
          </div>
        </div>
      )}
      <p className="text-ui-sm mt-4">Team plan · £24.00 a month</p>
    </div>
  );
}

/* ── 7. waiting for a list to appear ──────────────────────────────── */

const MESSAGES = [
  { from: "Halden Paper", sub: "Pallet sizes for the March order" },
  { from: "Cleo Marsh", sub: "Re: warehouse rota" },
  { from: "Vestry Timber", sub: "Invoice 4471 attached" },
] as const;

function Inbox({ blank }: { blank: boolean }) {
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = () => {
    if (timer.current) clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(() => setLoading(false), 1800);
  };

  return (
    <div className="max-w-md">
      <div className="min-h-40">
        {loading ? (
          blank ? (
            <div className="min-h-40" />
          ) : (
            <ul>
              {MESSAGES.map((m) => (
                <li key={m.from} className="border-t py-3.5 first:border-t-0">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="mt-2 h-3 w-52" />
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul>
            {MESSAGES.map((m) => (
              <li key={m.from} className="border-t py-3 first:border-t-0">
                <p className="text-ui-sm">{m.from}</p>
                <p className="text-caption text-muted-foreground mt-1">
                  {m.sub}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        variant="secondary"
        size="lg"
        className="mt-3"
        onClick={reload}
        disabled={loading}
      >
        Refresh inbox
      </Button>
    </div>
  );
}

/* ── 8. knowing how long is left ──────────────────────────────────── */

function Upload({ endless }: { endless: boolean }) {
  const [pct, setPct] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = useRef(0);

  const start = () => {
    if (timer.current) clearInterval(timer.current);
    done.current = 0;
    setPct(0);
    setRunning(true);
    timer.current = setInterval(() => {
      const next = Math.min(100, done.current + 4);
      done.current = next;
      setPct(next);
      if (next >= 100) {
        if (timer.current) clearInterval(timer.current);
        setRunning(false);
      }
    }, 160);
  };

  const secondsLeft = Math.max(1, Math.ceil(((100 - pct) / 4) * 0.16));

  return (
    <div className="max-w-md">
      <div className="bg-secondary min-h-24 rounded-xl p-4">
        {running ? (
          endless ? (
            <Row>
              <Spinner className="size-4" />
              <span className="text-ui-sm text-muted-foreground">
                Uploading…
              </span>
            </Row>
          ) : (
            <div>
              <Row className="justify-between">
                <span className="text-ui-sm">supplier-terms.pdf</span>
                <NumberFlow
                  value={pct / 100}
                  format={{ style: "percent" }}
                  className="text-ui-sm tabular-nums"
                  data-numeric
                />
              </Row>
              <Progress value={pct} className="mt-3" />
              <p className="text-caption text-muted-foreground mt-2">
                About {secondsLeft} second{secondsLeft === 1 ? "" : "s"} left
              </p>
            </div>
          )
        ) : (
          <p className="text-ui-sm text-muted-foreground">
            {pct === 100 ? "supplier-terms.pdf uploaded" : "Nothing uploading"}
          </p>
        )}
      </div>
      <Button size="lg" className="mt-3" onClick={start} disabled={running}>
        Upload file
      </Button>
    </div>
  );
}

/* ── 9. pressing pay ──────────────────────────────────────────────── */

function PayButton({ silent }: { silent: boolean }) {
  const [busy, setBusy] = useState(false);
  const [charges, setCharges] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pay = () => {
    if (silent) {
      setTimeout(() => setCharges((c) => c + 1), 1400);
      return;
    }
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setBusy(false);
      setCharges((c) => c + 1);
    }, 1400);
  };

  return (
    <div className="max-w-md">
      <Row className="justify-between">
        <span className="text-ui-sm">Total to pay</span>
        <span className="text-ui-sm tabular-nums">£63.89</span>
      </Row>

      <Button size="lg" className="mt-4 w-40" onClick={pay} disabled={busy}>
        {busy ? <Spinner className="size-4" /> : "Pay £63.89"}
      </Button>

      <p
        className={cn(
          "text-caption mt-3",
          charges > 1 ? "text-destructive" : "text-muted-foreground",
        )}
        role="status"
      >
        {charges === 0
          ? "Not charged yet."
          : charges === 1
            ? "Charged once."
            : `Charged ${charges} times.`}
      </p>
    </div>
  );
}

/* ── 10. messages you can actually read ───────────────────────────── */

const INVITEES = ["Dara Nolan", "Efe Adeyemi", "Farrah Blake", "Gus Ito"];

function Notifier({ crowded }: { crowded: boolean }) {
  const [notes, setNotes] = useState<{ id: number; who: string }[]>([]);
  const seq = useRef(0);

  const send = () => {
    const id = ++seq.current;
    const who = INVITEES[(id - 1) % INVITEES.length];
    setNotes((n) => (crowded ? [...n, { id, who }] : [{ id, who }, ...n]));
    setTimeout(
      () => setNotes((n) => n.filter((t) => t.id !== id)),
      crowded ? 900 : 6000,
    );
  };

  return (
    <div className="max-w-md">
      <Button size="lg" onClick={send}>
        <UserPlus aria-hidden="true" />
        Send an invite
      </Button>

      {crowded ? (
        <div className="relative mt-4 min-h-28">
          {notes.map((n) => (
            <div
              key={n.id}
              className="bg-secondary text-ui-sm absolute inset-x-0 top-0 rounded-xl p-3"
            >
              Invite sent to {n.who}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 min-h-28 space-y-2">
          <AnimatePresence initial={false}>
            {notes.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                className="bg-secondary flex items-center gap-2 rounded-xl p-3"
              >
                <Check
                  className="text-positive size-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-ui-sm flex-1">
                  Invite sent to {n.who}
                </span>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setNotes((l) => l.filter((t) => t.id !== n.id))}
                >
                  <Undo2 aria-hidden="true" />
                  Undo
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={`Dismiss the message about ${n.who}`}
                  onClick={() => setNotes((l) => l.filter((t) => t.id !== n.id))}
                >
                  <X aria-hidden="true" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ── 11. a label that stays on screen ─────────────────────────────── */

const TOOLS = [
  { id: "star", label: "Add to favourites", Icon: Star },
  { id: "edit", label: "Rename this document", Icon: Pencil },
  { id: "image", label: "Remove the cover image", Icon: ImageOff },
  { id: "bell", label: "Mute notifications for this document", Icon: Bell },
] as const;

function Toolbar({ stuck }: { stuck: boolean }) {
  const [shown, setShown] = useState<string | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (id: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (stuck) {
      setShown(id);
      return;
    }
    timer.current = setTimeout(() => setShown(id), 400);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setShown(null);
  };

  return (
    <div className="max-w-md">
      <div className="bg-secondary overflow-hidden rounded-xl p-2">
        <Row className="justify-end gap-1">
          {TOOLS.map(({ id, label, Icon }) => (
            <div key={id} className="relative">
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={label}
                onMouseEnter={() => show(id)}
                onMouseLeave={hide}
                onFocus={() => show(id)}
                onBlur={hide}
                onClick={() => setPressed(label)}
              >
                <Icon aria-hidden="true" />
              </Button>
              {shown === id && (
                <span
                  className={cn(
                    "bg-popover text-caption shadow-floating pointer-events-none absolute z-10 w-max max-w-56 rounded-lg px-2.5 py-1.5",
                    stuck
                      ? "top-1/2 left-full ml-2 -translate-y-1/2 whitespace-nowrap"
                      : "right-0 bottom-full mb-2",
                  )}
                >
                  {label}
                </span>
              )}
            </div>
          ))}
        </Row>
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        {pressed ? `You chose “${pressed}”.` : "Hover the icons on the right."}
      </p>
    </div>
  );
}

/* ── 12. knowing where you are in a long list ─────────────────────── */

const TOTAL_ITEMS = 214;

function Results({ crude }: { crude: boolean }) {
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(3);
  const pages = Math.ceil(TOTAL_ITEMS / perPage);
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, TOTAL_ITEMS);

  if (crude) {
    return (
      <div className="max-w-md">
        <p className="text-ui-sm">Invoices</p>
        <Row className="mt-3 flex-wrap gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={cn(
                "text-ui-sm h-9 w-9 rounded-lg tabular-nums",
                n === page ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </Row>
        <Row className="mt-4 flex-wrap gap-2">
          {[10, 20, 50].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setPerPage(n);
                setPage(1);
              }}
              className={cn(
                "text-ui-sm h-9 rounded-lg px-2 tabular-nums",
                perPage === n ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </Row>
      </div>
    );
  }

  const near = [page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages);

  return (
    <div className="max-w-md">
      <Row className="justify-between">
        <p className="text-ui-sm">Invoices</p>
        <p className="text-caption text-muted-foreground tabular-nums">
          {first}–{last} of {TOTAL_ITEMS}
        </p>
      </Row>

      <Row className="mt-3 flex-wrap gap-1">
        <Button
          variant="secondary"
          size="icon-lg"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        {page > 2 && (
          <>
            <Pill active={false} onClick={() => setPage(1)}>
              1
            </Pill>
            {page > 3 && (
              <span className="text-muted-foreground px-1" aria-hidden="true">
                …
              </span>
            )}
          </>
        )}
        {near.map((n) => (
          <Pill
            key={n}
            active={n === page}
            aria-current={n === page ? "page" : undefined}
            onClick={() => setPage(n)}
            className="tabular-nums"
          >
            {n}
          </Pill>
        ))}
        {page < pages - 1 && (
          <>
            {page < pages - 2 && (
              <span className="text-muted-foreground px-1" aria-hidden="true">
                …
              </span>
            )}
            <Pill active={false} onClick={() => setPage(pages)}>
              {pages}
            </Pill>
          </>
        )}
        <Button
          variant="secondary"
          size="icon-lg"
          aria-label="Next page"
          disabled={page === pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </Row>

      <Row className="mt-4 flex-wrap gap-2">
        <span className="text-caption text-muted-foreground">Per page</span>
        {[10, 20, 50].map((n) => (
          <Pill
            key={n}
            active={perPage === n}
            onClick={() => {
              setPerPage(n);
              setPage(1);
            }}
            className="tabular-nums"
          >
            {n}
          </Pill>
        ))}
      </Row>
    </div>
  );
}

/* ── 13. seeing where you are in a deep folder ────────────────────── */

const TRAIL = [
  "Home",
  "Purchasing",
  "Suppliers",
  "Halden Paper",
  "2026",
  "Invoice 4471",
] as const;

function Breadcrumbs({ overflowing }: { overflowing: boolean }) {
  const [depth, setDepth] = useState(4);
  const trail = TRAIL.slice(0, depth);
  const collapsed = trail.length > 3;

  return (
    <div className="max-w-xs">
      <nav aria-label="Breadcrumb">
        {overflowing ? (
          <ol className="flex items-center gap-1.5 overflow-hidden">
            {trail.map((t, i) => (
              <li key={t} className="flex shrink-0 items-center gap-1.5">
                <span className="text-caption text-muted-foreground">{t}</span>
                {i < trail.length - 1 && (
                  <ChevronRight
                    className="text-muted-foreground size-3"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        ) : (
          <ol className="flex flex-wrap items-center gap-1.5">
            <li className="flex items-center gap-1.5">
              <span className="text-caption text-muted-foreground">Home</span>
              <ChevronRight
                className="text-muted-foreground size-3"
                aria-hidden="true"
              />
            </li>
            {collapsed ? (
              <li className="flex items-center gap-1.5">
                <span
                  className="text-caption text-muted-foreground"
                  title={trail.slice(1, -1).join(" / ")}
                >
                  …
                </span>
                <ChevronRight
                  className="text-muted-foreground size-3"
                  aria-hidden="true"
                />
              </li>
            ) : (
              trail.slice(1, -1).map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="text-caption text-muted-foreground">
                    {t}
                  </span>
                  <ChevronRight
                    className="text-muted-foreground size-3"
                    aria-hidden="true"
                  />
                </li>
              ))
            )}
            <li>
              <span className="text-ui-sm" aria-current="page">
                {trail[trail.length - 1]}
              </span>
            </li>
          </ol>
        )}
      </nav>

      <Row className="mt-4 flex-wrap gap-2">
        <Button
          variant="secondary"
          size="lg"
          disabled={depth >= TRAIL.length}
          onClick={() => setDepth((d) => Math.min(TRAIL.length, d + 1))}
        >
          Go deeper
        </Button>
        <Button
          variant="ghost"
          size="lg"
          disabled={depth <= 2}
          onClick={() => setDepth((d) => Math.max(2, d - 1))}
        >
          Go back
        </Button>
      </Row>
    </div>
  );
}

/* ── 14. how many are waiting ─────────────────────────────────────── */

function NotificationBell({ loose }: { loose: boolean }) {
  const [count, setCount] = useState(3);

  return (
    <div className="max-w-md">
      <Row className="bg-secondary min-h-12 justify-between rounded-xl px-3">
        {loose ? (
          <Row className="gap-1.5">
            <Bell className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="text-ui-sm">Notifications ({count})</span>
          </Row>
        ) : (
          <Row className="gap-4">
            <span className="relative inline-flex">
              <Bell
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
              {count > 0 && (
                <Badge className="absolute -top-2.5 -right-3 tabular-nums">
                  {count > 99 ? "99+" : count}
                </Badge>
              )}
            </span>
            <span className="text-ui-sm">Notifications</span>
          </Row>
        )}
        <span className="text-caption text-muted-foreground">Settings</span>
      </Row>

      <Row className="mt-4 flex-wrap gap-2">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setCount((c) => c + 1)}
        >
          One more arrives
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setCount((c) => c + 97)}
        >
          97 more arrive
        </Button>
        <Button variant="ghost" size="lg" onClick={() => setCount(0)}>
          Mark all read
        </Button>
      </Row>
    </div>
  );
}

/* ── 15. a box that tells the truth ───────────────────────────────── */

const FILES = [
  "invoice-2026-04.pdf",
  "supplier-terms.pdf",
  "delivery-note-118.pdf",
  "warehouse-rota.pdf",
] as const;

function SelectAll({ lying }: { lying: boolean }) {
  const [picked, setPicked] = useState<string[]>([FILES[0], FILES[2]]);
  const all = picked.length === FILES.length;
  const some = picked.length > 0 && !all;

  const toggleAll = () => setPicked(all ? [] : [...FILES]);

  return (
    <div className="max-w-md">
      <Row className="min-h-12 gap-2.5 border-b">
        {lying ? (
          <Checkbox
            id="dsc-all-lying"
            checked={all}
            onCheckedChange={toggleAll}
          />
        ) : (
          <button
            type="button"
            role="checkbox"
            id="dsc-all-true"
            aria-checked={some ? "mixed" : all}
            aria-label="Select all files"
            onClick={toggleAll}
            className={cn(
              "border-input focus-visible:border-ring focus-visible:ring-ring/50 relative flex size-4 items-center justify-center rounded-sm border transition-colors after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3",
              (all || some) &&
                "border-primary bg-primary text-primary-foreground",
            )}
          >
            {all && <Check className="size-3" aria-hidden="true" />}
            {some && (
              <span
                className="bg-primary-foreground h-0.5 w-2 rounded-full"
                aria-hidden="true"
              />
            )}
          </button>
        )}
        <Label
          htmlFor={lying ? "dsc-all-lying" : "dsc-all-true"}
          className="text-ui-sm font-normal"
        >
          {lying
            ? "Select all"
            : all
              ? "All 4 files selected"
              : some
                ? `${picked.length} of ${FILES.length} files selected`
                : "Select all"}
        </Label>
      </Row>

      <ul className="mt-1">
        {FILES.map((f) => (
          <li key={f}>
            <Row className="min-h-11 gap-2.5">
              <Checkbox
                id={`${lying ? "l" : "t"}-${f}`}
                checked={picked.includes(f)}
                onCheckedChange={(v) =>
                  setPicked((p) =>
                    v === true ? [...p, f] : p.filter((x) => x !== f),
                  )
                }
              />
              <Label
                htmlFor={`${lying ? "l" : "t"}-${f}`}
                className="text-ui-sm font-normal"
              >
                {f}
              </Label>
            </Row>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 16. a field that keeps its label ─────────────────────────────── */

function AmountField({ placeholderOnly }: { placeholderOnly: boolean }) {
  const [value, setValue] = useState("");

  if (placeholderOnly) {
    return (
      <div className="max-w-sm">
        <Input
          className="h-9"
          inputMode="decimal"
          placeholder="Amount"
          aria-label="Amount"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button size="lg" className="mt-4">
          Send payment
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <Label htmlFor="dsc-amount" className="text-ui-sm mb-1.5">
        Amount to send
      </Label>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>£</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id="dsc-amount"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby="dsc-amount-help"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>GBP</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <p
        id="dsc-amount-help"
        className="text-caption text-muted-foreground mt-2"
      >
        Arrives the same day if you send before 3pm.
      </p>
      <Button size="lg" className="mt-4">
        Send payment
      </Button>
    </div>
  );
}

/* ── 17. a calendar that speaks your language ─────────────────────── */

const LOCALES = [
  { id: "en-GB", label: "English (UK)" },
  { id: "de-DE", label: "Deutsch" },
  { id: "en-US", label: "English (US)" },
] as const;

const US_DAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const US_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function DatePicker({ hardcoded }: { hardcoded: boolean }) {
  const [locale, setLocale] = useState<string>("en-GB");
  const [day, setDay] = useState(12);

  const year = 2026;
  const month = 2; /* March */
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = 31;

  const weekStart = hardcoded || locale === "en-US" ? 0 : 1;
  const offset = (firstWeekday - weekStart + 7) % 7;

  const dayNames = hardcoded
    ? [...US_DAYS]
    : Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
          /* 4 January 2026 is a Sunday */
          new Date(2026, 0, 4 + ((weekStart + i) % 7)),
        ),
      );

  const heading = hardcoded
    ? `${US_MONTHS[month]} ${year}`
    : new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(new Date(year, month, 1));

  const chosen = hardcoded
    ? `${month + 1}/${day}/${year}`
    : new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(year, month, day),
      );

  return (
    <div className="max-w-sm">
      <Row className="mb-4 flex-wrap gap-2">
        {LOCALES.map((l) => (
          <Pill
            key={l.id}
            active={locale === l.id}
            onClick={() => setLocale(l.id)}
          >
            {l.label}
          </Pill>
        ))}
      </Row>

      <div className="bg-secondary w-64 rounded-xl p-3">
        <p className="text-ui-sm mb-2 text-center">{heading}</p>
        <div className="text-micro text-muted-foreground mb-1 grid grid-cols-7 gap-0.5 text-center uppercase">
          {dayNames.map((n, i) => (
            <span key={`${n}-${i}`}>{n}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: offset }, (_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === day}
              onClick={() => setDay(d)}
              className={cn(
                "text-caption h-8 rounded-md tabular-nums transition-colors",
                d === day ? "bg-accent text-accent-foreground" : "hover:bg-card",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <p className="text-caption text-muted-foreground mt-3">
        Delivery booked for {chosen}
      </p>
    </div>
  );
}

/* ── 18. a link inside a sentence ─────────────────────────────────── */

function PolicyLine({ chunky }: { chunky: boolean }) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="max-w-sm">
      <p className="text-ui-sm">
        We will collect the parcel from your door within 14 days. Anything
        outside that window is covered by{" "}
        <a
          href="#delivery-and-returns"
          onClick={(e) => {
            e.preventDefault();
            setOpened(true);
          }}
          className={
            chunky
              ? "bg-secondary text-micro text-muted-foreground inline-block rounded px-1.5 py-0.5 align-middle whitespace-nowrap"
              : "decoration-muted-foreground underline underline-offset-2 hover:decoration-current"
          }
        >
          our delivery and returns policy
        </a>
        , which also explains refunds.
      </p>
      <p className="text-caption text-muted-foreground mt-4">
        {opened ? "Opened the returns policy." : "Nothing opened yet."}
      </p>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function DesignSystemChecklistDemo() {
  return (
    <div>
      <BeforeAfter
        principle="You can actually read what you are being charged."
        before={<Receipt faint />}
        after={<Receipt faint={false} />}
      />

      <BeforeAfter
        principle="Your eye stops getting lost on the way to the next line."
        before={<Policy wide />}
        after={<Policy wide={false} />}
      />

      <BeforeAfter
        principle="It keeps up with you instead of making you wait."
        before={<DetailsPanel sluggish />}
        after={<DetailsPanel sluggish={false} />}
      />

      <BeforeAfter
        principle="The menu opens on top of the page, not behind it."
        before={<SupplierList buried />}
        after={<SupplierList buried={false} />}
      />

      <BeforeAfter
        principle="You can still tell who is on the team when a photo will not load."
        before={<TeamRow raw />}
        after={<TeamRow raw={false} />}
      />

      <BeforeAfter
        principle="You are told what went wrong and given a way to fix it."
        before={<Decline bare />}
        after={<Decline bare={false} />}
      />

      <BeforeAfter
        principle="You can see what is coming instead of staring at nothing."
        before={<Inbox blank />}
        after={<Inbox blank={false} />}
      />

      <BeforeAfter
        principle="You can tell how much longer this will take."
        before={<Upload endless />}
        after={<Upload endless={false} />}
      />

      <BeforeAfter
        principle="You can see the payment going through, and you cannot pay twice."
        before={<PayButton silent />}
        after={<PayButton silent={false} />}
      />

      <BeforeAfter
        principle="The messages stay long enough to read, and stack instead of covering each other."
        before={<Notifier crowded />}
        after={<Notifier crowded={false} />}
      />

      <BeforeAfter
        principle="The label stays on screen instead of falling off the edge."
        before={<Toolbar stuck />}
        after={<Toolbar stuck={false} />}
      />

      <BeforeAfter
        principle="You can see where you are and how much is left."
        before={<Results crude />}
        after={<Results crude={false} />}
      />

      <BeforeAfter
        principle="You can see which page you are on, however deep you go."
        before={<Breadcrumbs overflowing />}
        after={<Breadcrumbs overflowing={false} />}
      />

      <BeforeAfter
        principle="The count sits on the bell, and the row stops shifting."
        before={<NotificationBell loose />}
        after={<NotificationBell loose={false} />}
      />

      <BeforeAfter
        principle="The top box stops claiming that nothing is selected."
        before={<SelectAll lying />}
        after={<SelectAll lying={false} />}
      />

      <BeforeAfter
        principle="The label is still there after you start typing."
        before={<AmountField placeholderOnly />}
        after={<AmountField placeholderOnly={false} />}
      />

      <BeforeAfter
        principle="Dates read the way they do where you live."
        before={<DatePicker hardcoded />}
        after={<DatePicker hardcoded={false} />}
      />

      <BeforeAfter
        principle="The link reads as part of the sentence."
        before={<PolicyLine chunky />}
        after={<PolicyLine chunky={false} />}
      />
    </div>
  );
}
