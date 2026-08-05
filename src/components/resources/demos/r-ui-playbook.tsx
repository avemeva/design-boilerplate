"use client";

import {
  Bold,
  Check,
  ChevronDown,
  Code,
  Copy,
  Image as ImageIcon,
  Italic,
  Link2,
  Loader2,
  MessageSquare,
  Minus,
  MoreHorizontal,
  SlidersHorizontal,
  Trash2,
  Undo2,
  User,
} from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * uiplaybook.dev — nine component pages (button, tooltip, popover,
 * textfield, checkbox, select, notification, avatar, motion), roughly
 * 118 documented rules between them.
 *
 * The ones a person can actually SEE going from wrong to right are
 * rebuilt here as switches. Everything that only exists in the markup —
 * portals, compound-component APIs, aria plumbing, focus traps, the
 * global dispatch store, prefers-reduced-motion — was left on the site.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

type Controls = { stop: () => void; pause: () => void; play: () => void };

function Readout({ children }: { children: ReactNode }) {
  return (
    <p className="text-caption text-muted-foreground mt-3 tabular-nums">
      {children}
    </p>
  );
}

/** The little square. `mixed` is the partly-selected parent. */
function Tick({ state }: { state: boolean | "mixed" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "duration-fast ease-out-quart flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
        state === false
          ? "border-input"
          : "bg-primary border-primary text-primary-foreground",
      )}
    >
      {state === "mixed" ? (
        <Minus className="size-3" />
      ) : state ? (
        <Check className="size-3" />
      ) : null}
    </span>
  );
}

/** The card a notification is drawn on. Shared by the three toast pairs. */
function NoteCard({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  return (
    <div
      className={cn(
        "bg-card shadow-floating flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── 1 · one button is the button ─────────────────────────────────── */

function HierarchyPair({ after }: Side) {
  const [pressed, setPressed] = useState<string | null>(null);

  return (
    <div>
      <div className="bg-secondary rounded-xl border p-4">
        <p className="text-ui">Delete &ldquo;Onboarding revamp&rdquo;?</p>
        <p className="text-caption text-muted-foreground mt-1">
          Its 14 tasks and everything written on them go too.
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {after ? (
            <>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setPressed("Cancel")}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setPressed("Archive")}
              >
                Archive
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={() => setPressed("Delete project")}
              >
                Delete project
              </Button>
            </>
          ) : (
            ["Cancel", "Archive", "Delete project"].map((a) => (
              <Button key={a} size="lg" onClick={() => setPressed(a)}>
                {a}
              </Button>
            ))
          )}
        </div>
      </div>
      <Readout>
        {pressed ? `You pressed ${pressed}.` : "Press one without reading all three."}
      </Readout>
    </div>
  );
}

/* ── 2 · a button that works without changing size ────────────────── */

function LoadingPair({ after }: Side) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function save() {
    if (busy) return;
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setBusy(false);
      setSaved((n) => n + 1);
    }, 1500);
  }

  return (
    <div>
      <div className="bg-secondary rounded-xl border p-4">
        <p className="text-ui-sm">Billing address</p>
        <p className="text-caption text-muted-foreground mt-1">
          12 Rävala pst, Tallinn
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button size="lg" variant="ghost">
            Discard
          </Button>
          {after ? (
            <Button size="lg" className="min-w-32" onClick={save}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Saving
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          ) : (
            <Button size="lg" onClick={save}>
              {busy ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                "Save changes"
              )}
            </Button>
          )}
        </div>
      </div>
      <Readout>
        {busy
          ? "Saving…"
          : saved > 0
            ? `Saved ${saved} time${saved > 1 ? "s" : ""}. Watch Discard while it saves.`
            : "Press Save changes and watch Discard."}
      </Readout>
    </div>
  );
}

/* ── 3 · labels that wait a beat ──────────────────────────────────── */

const TOOLS = [
  { id: "bold", label: "Bold", Icon: Bold },
  { id: "italic", label: "Italic", Icon: Italic },
  { id: "link", label: "Add link", Icon: Link2 },
  { id: "image", label: "Insert image", Icon: ImageIcon },
  { id: "code", label: "Code block", Icon: Code },
] as const;

function TooltipDelayPair({ after }: Side) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const warm = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function enter(id: string) {
    clear();
    if (!after || warm.current) {
      setOpenId(id);
      setShown((n) => n + 1);
      return;
    }
    timer.current = setTimeout(() => {
      warm.current = true;
      setOpenId(id);
      setShown((n) => n + 1);
    }, 400);
  }

  return (
    <div>
      <div
        className="bg-secondary rounded-xl border px-3 pt-12 pb-3"
        onPointerLeave={() => {
          clear();
          warm.current = false;
          setOpenId(null);
        }}
      >
        <div className="flex gap-1">
          {TOOLS.map(({ id, label, Icon }) => (
            <div key={id} className="relative">
              <button
                type="button"
                aria-label={label}
                className="text-muted-foreground hover:bg-card hover:text-foreground focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:ring-3 focus-visible:outline-none"
                onPointerEnter={() => enter(id)}
                onPointerLeave={() => {
                  clear();
                  setOpenId(null);
                }}
              >
                <Icon className="size-4" aria-hidden />
              </button>
              <AnimatePresence>
                {openId === id && (
                  <motion.span
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: duration.fast, ease: ease.outQuart }}
                    className="bg-foreground text-background text-caption pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md px-2 py-1 whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
      <Readout>Sweep across the row · labels popped up {shown} times</Readout>
    </div>
  );
}

/* ── 4 · a dead button that says why ──────────────────────────────── */

function DisabledReasonPair({ after }: Side) {
  const [title, setTitle] = useState("");
  const [hover, setHover] = useState(false);
  const [published, setPublished] = useState(false);
  const ready = title.trim().length > 0;

  return (
    <div>
      <div className="bg-secondary space-y-3 rounded-xl border p-4">
        <div className="space-y-2">
          <Label htmlFor={`uip-title-${after}`}>Post title</Label>
          <Input
            id={`uip-title-${after}`}
            className="h-9"
            placeholder="How we cut our build in half"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setPublished(false);
            }}
          />
        </div>
        <div className="flex justify-end">
          {after ? (
            <span
              className="relative"
              onPointerEnter={() => setHover(true)}
              onPointerLeave={() => setHover(false)}
            >
              <AnimatePresence>
                {hover && !ready && (
                  <motion.span
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: duration.fast, ease: ease.outQuart }}
                    className="bg-foreground text-background text-caption pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md px-2 py-1 whitespace-nowrap"
                  >
                    Give the post a title first
                  </motion.span>
                )}
              </AnimatePresence>
              <Button
                size="lg"
                aria-disabled={!ready}
                className={cn(!ready && "opacity-50")}
                onClick={() => ready && setPublished(true)}
              >
                Publish
              </Button>
            </span>
          ) : (
            <Button
              size="lg"
              disabled={!ready}
              onClick={() => setPublished(true)}
            >
              Publish
            </Button>
          )}
        </div>
      </div>
      <Readout>
        {published
          ? "Published."
          : "Hover Publish while the title is empty."}
      </Readout>
    </div>
  );
}

/* ── 5 · a menu the box cannot cut in half ────────────────────────── */

const FILES = [
  "Q3 report.pdf",
  "Brand palette.fig",
  "Invoice 1042.pdf",
  "Contract — Acme.docx",
  "Release notes.md",
];

const MENU_ITEMS = ["Rename", "Duplicate", "Move to trash"];

function ClipPair({ after }: Side) {
  const [open, setOpen] = useState<number | null>(null);
  const [top, setTop] = useState(0);
  const [done, setDone] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  function toggle(i: number, e: MouseEvent<HTMLButtonElement>) {
    if (open === i) {
      setOpen(null);
      return;
    }
    const w = wrap.current?.getBoundingClientRect();
    const b = e.currentTarget.getBoundingClientRect();
    if (w) {
      const below = b.bottom - w.top + 6;
      const flip = below + 124 > w.height;
      setTop(flip ? b.top - w.top - 130 : below);
    }
    setOpen(i);
    setDone(null);
  }

  const menu = (
    <div className="bg-card shadow-floating w-44 rounded-xl border p-1">
      {MENU_ITEMS.map((m) => (
        <button
          key={m}
          type="button"
          className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center rounded-lg px-2.5 text-left transition-colors"
          onClick={() => {
            setDone(m);
            setOpen(null);
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="relative" ref={wrap}>
        <div className="bg-secondary h-40 overflow-y-auto rounded-xl border">
          {FILES.map((f, i) => (
            <div
              key={f}
              className="relative flex h-11 items-center justify-between gap-2 border-b px-3 last:border-b-0"
            >
              <span className="text-ui-sm truncate">{f}</span>
              <Button
                size="icon-lg"
                variant="ghost"
                aria-label={`Actions for ${f}`}
                onClick={(e) => toggle(i, e)}
              >
                <MoreHorizontal aria-hidden />
              </Button>
              {!after && open === i && (
                <div className="absolute top-full right-2 z-20">{menu}</div>
              )}
            </div>
          ))}
        </div>
        {after && open !== null && (
          <div className="absolute right-2 z-20" style={{ top }}>
            {menu}
          </div>
        )}
      </div>
      <Readout>
        {done
          ? `${done} — picked.`
          : "Open the actions on the bottom row of the list."}
      </Readout>
    </div>
  );
}

/* ── 6 · something you can actually reach ─────────────────────────── */

function ReachPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [lost, setLost] = useState(0);
  const [sent, setSent] = useState(0);

  const card = (
    <div className="bg-card shadow-floating w-56 rounded-xl border p-3">
      <p className="text-ui-sm">Priya Raman</p>
      <p className="text-caption text-muted-foreground mt-0.5">
        Design engineer · Tallinn
      </p>
      <Button
        size="lg"
        variant="secondary"
        className="mt-3 w-full"
        onClick={() => {
          setSent((n) => n + 1);
          setOpen(false);
        }}
      >
        <MessageSquare aria-hidden />
        Message
      </Button>
    </div>
  );

  return (
    <div>
      <div className="bg-secondary relative rounded-xl border p-4 pb-24">
        <div className="relative inline-block">
          {after ? (
            <Button
              size="lg"
              variant="outline"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              Priya Raman
              <ChevronDown aria-hidden />
            </Button>
          ) : (
            <button
              type="button"
              className="text-ui-sm bg-card flex h-9 items-center rounded-lg border px-3"
              onPointerEnter={() => setOpen(true)}
              onPointerLeave={() => {
                setOpen(false);
                setLost((n) => n + 1);
              }}
            >
              Priya Raman
            </button>
          )}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: duration.base, ease: ease.outQuart }}
                tabIndex={-1}
                ref={
                  after
                    ? (el) => {
                        el?.focus({ preventScroll: true });
                      }
                    : undefined
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                }}
                className={cn(
                  "absolute left-0 z-20 outline-none",
                  after ? "top-full mt-2" : "top-full mt-4",
                )}
              >
                {card}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {after && open && (
          <button
            type="button"
            aria-label="Close the card"
            className="absolute inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
        )}
      </div>
      <Readout>
        {sent > 0
          ? `Message opened ${sent}×.`
          : after
            ? "Click the name, then click Message. Escape closes it."
            : `Hover the name, then try to reach Message · card ran away ${lost}×`}
      </Readout>
    </div>
  );
}

/* ── 7 · boxes that still know what they are ──────────────────────── */

const SIGNUP = [
  { key: "name", label: "Full name", hint: "Ada Lovelace", fill: "Ada Lovelace" },
  {
    key: "email",
    label: "Work email",
    hint: "ada@company.com",
    fill: "ada@lovelace.co",
  },
  { key: "company", label: "Company", hint: "Lovelace & Co", fill: "Lovelace & Co" },
] as const;

function LabelPair({ after }: Side) {
  const [v, setV] = useState<Record<string, string>>({});

  return (
    <div>
      <div className="bg-secondary space-y-3 rounded-xl border p-4">
        {SIGNUP.map((f) => (
          <div key={f.key} className="space-y-2">
            {after && (
              <Label htmlFor={`uip-su-${after}-${f.key}`}>{f.label}</Label>
            )}
            <Input
              id={`uip-su-${after}-${f.key}`}
              className="h-9"
              aria-label={after ? undefined : f.label}
              placeholder={after ? f.hint : f.label}
              value={v[f.key] ?? ""}
              onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <Button
          size="lg"
          variant="secondary"
          onClick={() =>
            setV(Object.fromEntries(SIGNUP.map((f) => [f.key, f.fill])))
          }
        >
          Fill it in for me
        </Button>
      </div>
      <Readout>Fill it in, then say what the third box is.</Readout>
    </div>
  );
}

/* ── 8 · a hint that shows you the answer ─────────────────────────── */

const CARD_FIELDS = [
  { key: "num", label: "Card number", vague: "Your card number", real: "4242 4242 4242 4242" },
  { key: "exp", label: "Expiry", vague: "Expiry date", real: "09 / 27" },
  { key: "cvc", label: "Security code", vague: "Security code", real: "123" },
] as const;

function PlaceholderPair({ after }: Side) {
  const [v, setV] = useState<Record<string, string>>({});

  return (
    <div>
      <div className="bg-secondary grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        {CARD_FIELDS.map((f, i) => (
          <div key={f.key} className={cn("space-y-2", i === 0 && "sm:col-span-2")}>
            <Label htmlFor={`uip-card-${after}-${f.key}`}>{f.label}</Label>
            <Input
              id={`uip-card-${after}-${f.key}`}
              className="h-9"
              inputMode="numeric"
              placeholder={after ? f.real : f.vague}
              value={v[f.key] ?? ""}
              onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <Readout>Type the expiry without being told the format.</Readout>
    </div>
  );
}

/* ── 9 · one message, once you have stopped typing ────────────────── */

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function ValidationPair({ after }: Side) {
  const [value, setValue] = useState("joe.doe@gmai");
  const [left, setLeft] = useState(false);
  const bad = !EMAIL.test(value);
  const showError = after ? left && bad : bad;

  return (
    <div>
      <div className="bg-secondary space-y-2 rounded-xl border p-4">
        <Label htmlFor={`uip-mail-${after}`}>Work email</Label>
        <Input
          id={`uip-mail-${after}`}
          type="email"
          className="h-9"
          placeholder="joe.doe@gmail.com"
          value={value}
          aria-invalid={showError}
          aria-describedby={
            showError ? `uip-err-${after}` : `uip-hint-${after}`
          }
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setLeft(true)}
        />
        {after ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={showError ? "err" : "hint"}
              id={showError ? `uip-err-${after}` : `uip-hint-${after}`}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className={cn(
                "text-caption",
                showError ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {showError
                ? "Add the rest of the address, like gmail.com."
                : "We only use this for receipts."}
            </motion.p>
          </AnimatePresence>
        ) : (
          <>
            <p id={`uip-hint-${after}`} className="text-caption text-muted-foreground">
              We only use this for receipts.
            </p>
            {showError && (
              <p id={`uip-err-${after}`} className="text-caption text-destructive">
                Add the rest of the address, like gmail.com.
              </p>
            )}
          </>
        )}
      </div>
      <Readout>Finish typing the address, then click away.</Readout>
    </div>
  );
}

/* ── 10 · locked, but still readable ──────────────────────────────── */

const API_KEY = "sk_live_9f2c8ad41b6e77";

function LockedPair({ after }: Side) {
  const [copied, setCopied] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  function copy() {
    field.current?.select();
    navigator.clipboard?.writeText(API_KEY).catch(() => {});
    setCopied(true);
  }

  return (
    <div>
      <div className="bg-secondary space-y-2 rounded-xl border p-4">
        <Label htmlFor={`uip-key-${after}`}>Live API key</Label>
        <div className="flex gap-2">
          <Input
            ref={field}
            id={`uip-key-${after}`}
            className="h-9 font-mono"
            value={API_KEY}
            readOnly={after}
            disabled={!after}
            onChange={() => {}}
          />
          <Button
            size="lg"
            variant="secondary"
            disabled={!after}
            onClick={copy}
          >
            <Copy aria-hidden />
            Copy
          </Button>
        </div>
        <p className="text-caption text-muted-foreground">
          Issued 4 March. Rotate it from the console.
        </p>
      </div>
      <Readout>
        {copied ? "Copied to your clipboard." : "Try to select the key with your mouse."}
      </Readout>
    </div>
  );
}

/* ── 11 · the whole row is the target ─────────────────────────────── */

const PREFS = [
  "Weekly summary email",
  "Mention notifications",
  "Product announcements",
];

function HitAreaPair({ after }: Side) {
  const [on, setOn] = useState<string[]>([PREFS[0]]);
  const [missed, setMissed] = useState(0);

  const toggle = (p: string) =>
    setOn((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  return (
    <div>
      <div className="bg-secondary rounded-xl border p-3">
        {PREFS.map((p) =>
          after ? (
            <button
              key={p}
              type="button"
              role="checkbox"
              aria-checked={on.includes(p)}
              onClick={() => toggle(p)}
              className="hover:bg-card flex h-9 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors"
            >
              <Tick state={on.includes(p)} />
              <span className="text-ui-sm">{p}</span>
            </button>
          ) : (
            <div
              key={p}
              className="flex h-9 w-full items-center gap-3 px-2"
              onClick={() => setMissed((n) => n + 1)}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={on.includes(p)}
                aria-label={p}
                className="flex size-4 items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(p);
                }}
              >
                <Tick state={on.includes(p)} />
              </button>
              <span className="text-ui-sm">{p}</span>
            </div>
          ),
        )}
      </div>
      <Readout>
        {after
          ? `${on.length} on · every click on a row landed`
          : `${on.length} on · ${missed} click${missed === 1 ? "" : "s"} hit nothing`}
      </Readout>
    </div>
  );
}

/* ── 12 · a "select all" that tells the truth ─────────────────────── */

const INGREDIENTS = ["Tomato", "Lettuce", "Cucumber"];

function MixedPair({ after }: Side) {
  const [on, setOn] = useState<string[]>(["Tomato"]);
  const all = on.length === INGREDIENTS.length;
  const some = on.length > 0 && !all;
  const parentState: boolean | "mixed" = after ? (all ? true : some ? "mixed" : false) : all;

  return (
    <div>
      <div className="bg-secondary rounded-xl border p-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={after && some ? "mixed" : all}
          onClick={() => setOn(all ? [] : [...INGREDIENTS])}
          className="hover:bg-card flex h-9 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors"
        >
          <Tick state={parentState} />
          <span className="text-ui-sm">All ingredients</span>
        </button>
        <div className="mt-1 space-y-0.5 border-l pl-4">
          {INGREDIENTS.map((it) => (
            <button
              key={it}
              type="button"
              role="checkbox"
              aria-checked={on.includes(it)}
              onClick={() =>
                setOn((s) =>
                  s.includes(it) ? s.filter((x) => x !== it) : [...s, it],
                )
              }
              className="hover:bg-card flex h-9 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors"
            >
              <Tick state={on.includes(it)} />
              <span className="text-ui-sm">{it}</span>
            </button>
          ))}
        </div>
      </div>
      <Readout>
        {on.length} of {INGREDIENTS.length} chosen — look at the top box.
      </Readout>
    </div>
  );
}

/* ── 13 · nothing happens until you say so ────────────────────────── */

const ACCOUNT = [
  "Sign me out of every other device",
  "Make my profile private",
  "Stop indexing my posts",
];

function StagedPair({ after }: Side) {
  const [applied, setApplied] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);
  const [log, setLog] = useState<string | null>(null);
  const shown = after ? draft : applied;
  const dirty =
    after &&
    (draft.length !== applied.length ||
      draft.some((d) => !applied.includes(d)));

  function toggle(p: string) {
    const next = shown.includes(p) ? shown.filter((x) => x !== p) : [...shown, p];
    if (after) {
      setDraft(next);
      return;
    }
    setApplied(next);
    setLog(
      shown.includes(p) ? `Undone: ${p.toLowerCase()}` : `Done: ${p.toLowerCase()}`,
    );
  }

  return (
    <div>
      <div className="bg-secondary rounded-xl border p-3">
        {ACCOUNT.map((p) => (
          <button
            key={p}
            type="button"
            role="checkbox"
            aria-checked={shown.includes(p)}
            onClick={() => toggle(p)}
            className="hover:bg-card flex h-9 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors"
          >
            <Tick state={shown.includes(p)} />
            <span className="text-ui-sm">{p}</span>
          </button>
        ))}
        <AnimatePresence initial={false}>
          {dirty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: duration.base, ease: ease.outQuart }}
              className="overflow-hidden"
            >
              <div className="mt-2 flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => {
                    setDraft(applied);
                    setLog(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={() => {
                    setApplied(draft);
                    setLog("Settings saved.");
                  }}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Readout>
        {log ?? (after ? "Tick one. Nothing has happened yet." : "Tick one.")}
      </Readout>
    </div>
  );
}

/* ── 14 · two answers, both on screen ─────────────────────────────── */

const VISIBILITY = [
  { id: "public", label: "Public", note: "Anyone can read it" },
  { id: "private", label: "Private", note: "Only your team" },
] as const;

function TwoOptionsPair({ after }: Side) {
  const [value, setValue] = useState<string>("public");
  const [open, setOpen] = useState(false);
  const [clicks, setClicks] = useState(0);
  const current = VISIBILITY.find((v) => v.id === value);

  return (
    <div>
      <div className="bg-secondary rounded-xl border p-4">
        <p className="text-ui-sm mb-3">Who can see this repository?</p>
        {after ? (
          <div role="radiogroup" aria-label="Repository visibility" className="space-y-1">
            {VISIBILITY.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={value === v.id}
                onClick={() => {
                  setValue(v.id);
                  setClicks((n) => n + 1);
                }}
                className="hover:bg-card flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors"
              >
                <span
                  aria-hidden
                  className={cn(
                    "duration-fast ease-out-quart flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                    value === v.id ? "border-primary" : "border-input",
                  )}
                >
                  {value === v.id && (
                    <span className="bg-primary size-2 rounded-full" />
                  )}
                </span>
                <span className="text-ui-sm">{v.label}</span>
                <span className="text-caption text-muted-foreground">
                  {v.note}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="relative w-56">
            <button
              type="button"
              aria-expanded={open}
              className="text-ui-sm bg-card flex h-9 w-full items-center justify-between rounded-lg border px-3"
              onClick={() => {
                setOpen((o) => !o);
                setClicks((n) => n + 1);
              }}
            >
              {current?.label}
              <ChevronDown className="size-4" aria-hidden />
            </button>
            {open && (
              <div className="bg-card shadow-floating absolute top-full left-0 z-20 mt-1 w-full rounded-xl border p-1">
                {VISIBILITY.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center rounded-lg px-2.5 text-left transition-colors"
                    onClick={() => {
                      setValue(v.id);
                      setOpen(false);
                      setClicks((n) => n + 1);
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Readout>
        Now make it private · {clicks} click{clicks === 1 ? "" : "s"} so far
      </Readout>
    </div>
  );
}

/* ── 15 · a long list that opens where you are ────────────────────── */

const ZONES = [
  "Africa/Lagos",
  "America/Bogota",
  "America/Los Angeles",
  "America/New York",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Tallinn",
];

function SelectDefaultPair({ after }: Side) {
  const [value, setValue] = useState<string | null>(after ? "Europe/Tallinn" : null);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="bg-secondary rounded-xl border p-4 pb-44">
        <Label className="mb-2" htmlFor={`uip-tz-${after}`}>
          Time zone
        </Label>
        <div className="relative w-64">
          <button
            id={`uip-tz-${after}`}
            type="button"
            aria-expanded={open}
            className="text-ui-sm bg-card flex h-9 w-full items-center justify-between rounded-lg border px-3"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={cn(!value && "text-muted-foreground")}>
              {value ?? "Select a time zone"}
            </span>
            <ChevronDown className="size-4" aria-hidden />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                className="bg-card shadow-floating absolute top-full left-0 z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border p-1"
                ref={(el) => {
                  if (el && after && value) {
                    const i = ZONES.indexOf(value);
                    el.scrollTop = Math.max(0, i * 36 - 72);
                  }
                }}
              >
                {ZONES.map((z) => (
                  <button
                    key={z}
                    type="button"
                    className={cn(
                      "text-ui-sm flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left transition-colors",
                      after && value === z
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-secondary",
                    )}
                    onClick={() => {
                      setValue(z);
                      setOpen(false);
                    }}
                  >
                    {z}
                    {after && value === z && (
                      <Check className="size-4" aria-hidden />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Readout>Open it and find the zone you are already in.</Readout>
    </div>
  );
}

/* ── 16 · a message that waits while you read it ──────────────────── */

function ToastPausePair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [undone, setUndone] = useState(0);
  const [missed, setMissed] = useState(0);
  const p = useMotionValue(1);
  const anim = useRef<Controls | null>(null);

  function show() {
    anim.current?.stop();
    p.set(1);
    setOpen(true);
    anim.current = animate(p, 0, {
      duration: after ? 10 : 2.4,
      ease: "linear",
      onComplete: () => {
        setOpen(false);
        setMissed((n) => n + 1);
      },
    }) as unknown as Controls;
  }

  return (
    <div>
      <div className="bg-secondary relative h-40 rounded-xl border p-4">
        <Button size="lg" variant="secondary" onClick={show}>
          <Trash2 aria-hidden />
          Delete draft
        </Button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: duration.slow, ease: ease.outQuart }}
              className="absolute right-4 bottom-4 left-4"
              onPointerEnter={() => after && anim.current?.pause()}
              onPointerLeave={() => after && anim.current?.play()}
            >
              <NoteCard>
                <span className="text-ui-sm flex-1">Draft deleted</span>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    anim.current?.stop();
                    setOpen(false);
                    setUndone((n) => n + 1);
                  }}
                >
                  <Undo2 aria-hidden />
                  Undo
                </Button>
                <motion.span
                  aria-hidden
                  style={{ scaleX: p }}
                  className="bg-foreground absolute bottom-0 left-0 h-0.5 w-full origin-left"
                />
              </NoteCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Readout>
        Undone {undone}× · escaped before you reached it {missed}×
      </Readout>
    </div>
  );
}

/* ── 17 · a neat pile, not a wall ─────────────────────────────────── */

type Note = { id: number; text: string };

const SYNCED = [
  "Q3 report.pdf",
  "Brand palette.fig",
  "Invoice 1042.pdf",
  "Contract.docx",
  "Release notes.md",
  "Team photo.png",
];

function ToastStackPair({ after }: Side) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [expanded, setExpanded] = useState(false);
  const seq = useRef(0);

  function burst() {
    SYNCED.forEach((f, i) => {
      setTimeout(() => {
        const id = ++seq.current;
        setNotes((n) => [...n, { id, text: `${f} synced` }]);
        setTimeout(
          () => setNotes((n) => n.filter((x) => x.id !== id)),
          5000,
        );
      }, i * 260);
    });
  }

  const visible = after ? notes.slice(-3) : notes;

  return (
    <div>
      <div className="bg-secondary relative h-56 overflow-hidden rounded-xl border p-4">
        <Button size="lg" variant="secondary" onClick={burst}>
          Sync 6 files
        </Button>

        {after ? (
          <div
            className="absolute right-4 bottom-4 left-4"
            onPointerEnter={() => setExpanded(true)}
            onPointerLeave={() => setExpanded(false)}
          >
            <AnimatePresence initial={false}>
              {visible.map((n, i) => {
                const depth = visible.length - 1 - i;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{
                      opacity: 1,
                      y: expanded ? -depth * 56 : -depth * 10,
                      scale: expanded ? 1 : 1 - depth * 0.04,
                    }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: duration.slow, ease: ease.outQuart }}
                    style={{ zIndex: i }}
                    className="absolute right-0 bottom-0 left-0"
                  >
                    <NoteCard>
                      <Check className="text-positive size-4 shrink-0" aria-hidden />
                      <span className="text-ui-sm truncate">{n.text}</span>
                    </NoteCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="absolute right-4 bottom-4 left-4 space-y-2">
            <AnimatePresence initial={false}>
              {visible.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.base, ease: ease.outQuart }}
                >
                  <NoteCard>
                    <Check className="text-positive size-4 shrink-0" aria-hidden />
                    <span className="text-ui-sm truncate">{n.text}</span>
                  </NoteCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <Readout>
        {notes.length} on screen{after ? " · hover the pile to spread it out" : ""}
      </Readout>
    </div>
  );
}

/* ── 18 · readable in one glance ──────────────────────────────────── */

function WordingPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 4000);
  }

  return (
    <div>
      <div className="bg-secondary relative h-36 rounded-xl border p-4">
        <Button size="lg" variant="secondary" onClick={show}>
          Remove Jamie Chen
        </Button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: duration.slow, ease: ease.outQuart }}
              className="absolute right-4 bottom-4 left-4"
            >
              <NoteCard>
                {after ? (
                  <>
                    <span className="text-ui-sm flex-1">Member removed</span>
                    <Button size="lg" variant="secondary">
                      <Undo2 aria-hidden />
                      Undo
                    </Button>
                  </>
                ) : (
                  <span className="text-ui-sm">
                    The user Jamie Chen has been successfully removed from your
                    organisation and will no longer be able to sign in.
                  </span>
                )}
              </NoteCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Readout>Press it and read the whole message before it goes.</Readout>
    </div>
  );
}

/* ── 19 · people you can tell apart ───────────────────────────────── */

const CREW = [
  "Priya Raman",
  "Tomas Bauer",
  "Ada Sokolova",
  "Kwame Mensah",
  "Lena Fischer",
  "Marco Rossi",
];

const TONES = [
  "bg-secondary text-foreground border",
  "bg-accent text-accent-foreground",
  "bg-feature text-feature-foreground",
];

function AvatarPair({ after }: Side) {
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState(0);
  const target = "Priya Raman";

  return (
    <div>
      <div className="bg-secondary rounded-xl border p-4">
        <p className="text-caption text-muted-foreground mb-3">
          Viewing this document
        </p>
        <div className="flex">
          {CREW.map((name, i) => {
            const initials = name
              .split(" ")
              .map((w) => w[0])
              .join("");
            return (
              <button
                key={name}
                type="button"
                aria-label={name}
                onClick={() => {
                  setPicked(name);
                  if (name !== target) setWrong((n) => n + 1);
                }}
                className={cn(
                  "text-micro ring-card focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-full ring-2 transition-transform hover:-translate-y-0.5",
                  i > 0 && "-ml-2",
                  after
                    ? TONES[i % TONES.length]
                    : "bg-muted text-muted-foreground border",
                )}
              >
                {after ? (
                  initials
                ) : (
                  <User className="size-4" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <Readout>
        Click Priya Raman ·{" "}
        {picked
          ? picked === target
            ? `found her after ${wrong} wrong pick${wrong === 1 ? "" : "s"}`
            : `that was ${picked}`
          : "no photos, so who is who?"}
      </Readout>
    </div>
  );
}

/* ── 20 · things leave the way they arrived ───────────────────────── */

const FILTERS = ["Open", "Assigned to me", "Has a due date"];

function ExitPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState<string[]>([]);

  return (
    <div>
      <div className="bg-secondary h-56 rounded-xl border p-4">
        <Button
          size="lg"
          variant="outline"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <SlidersHorizontal aria-hidden />
          Filters
        </Button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                after
                  ? { opacity: 0, y: -6, scale: 0.98 }
                  : undefined
              }
              transition={{ duration: duration.base, ease: ease.outQuart }}
              className="bg-card shadow-floating mt-2 w-64 origin-top rounded-xl border p-1"
            >
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="checkbox"
                  aria-checked={on.includes(f)}
                  onClick={() =>
                    setOn((s) =>
                      s.includes(f) ? s.filter((x) => x !== f) : [...s, f],
                    )
                  }
                  className="hover:bg-secondary flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors"
                >
                  <Tick state={on.includes(f)} />
                  <span className="text-ui-sm">{f}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Readout>Open it, then close it again. Watch how it goes.</Readout>
    </div>
  );
}

/* ── 21 · small things fast, big things a little slower ───────────── */

const RANGES = ["7 days", "30 days", "This quarter"];

function TempoPair({ after }: Side) {
  const [range, setRange] = useState(RANGES[0]);
  const [open, setOpen] = useState(false);

  const small = after
    ? { duration: duration.instant, ease: ease.outQuart }
    : { duration: 0.85, ease: ease.outQuart };
  const big = after
    ? { duration: duration.slow, ease: ease.outQuart }
    : { duration: 0.95, ease: ease.outQuart };

  return (
    <div>
      <div className="bg-secondary rounded-xl border p-4">
        <div className="bg-card inline-flex rounded-full border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className="text-ui-sm relative h-9 rounded-full px-4"
            >
              {range === r && (
                <motion.span
                  layoutId={`uip-tempo-${after}`}
                  transition={small}
                  className="bg-secondary absolute inset-0 rounded-full"
                />
              )}
              <span
                className={cn(
                  "relative",
                  range === r ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {r}
              </span>
            </button>
          ))}
        </div>

        <Button
          size="lg"
          variant="ghost"
          className="mt-3 flex"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown
            className={cn("transition-transform", open && "rotate-180")}
            aria-hidden
          />
          Breakdown
        </Button>

        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={big}
          className="overflow-hidden"
        >
          <div className="bg-card mt-2 space-y-2 rounded-xl border p-3">
            {["Direct", "Search", "Referral"].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <span className="text-caption text-muted-foreground w-16">
                  {s}
                </span>
                <span className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
                  <span
                    className="bg-foreground block h-full rounded-full"
                    style={{ width: `${62 - i * 18}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <Readout>Tap between the three ranges, then open the breakdown.</Readout>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function UiPlaybookDemo() {
  return (
    <div>
      <BeforeAfter
        principle="One button on a screen should look like the one to press. When they all look the same you have to read every one before you can move."
        before={<HierarchyPair after={false} />}
        after={<HierarchyPair after />}
      />
      <BeforeAfter
        principle="A button should stay the same size while it is working. If it shrinks, the things beside it slide out from under your finger."
        before={<LoadingPair after={false} />}
        after={<LoadingPair after />}
      />
      <BeforeAfter
        principle="Little labels should wait a beat before they appear. Otherwise sliding your mouse across a row of buttons sets off a flicker of black boxes."
        before={<TooltipDelayPair after={false} />}
        after={<TooltipDelayPair after />}
      />
      <BeforeAfter
        principle="A button that is switched off should say why when you point at it. Otherwise you sit there clicking a dead thing, guessing what it wants."
        before={<DisabledReasonPair after={false} />}
        after={<DisabledReasonPair after />}
      />
      <BeforeAfter
        principle="A menu should never be sliced off by the box it opened inside. If you can only see half the choices, the other half may as well not exist."
        before={<ClipPair after={false} />}
        after={<ClipPair after />}
      />
      <BeforeAfter
        principle="If there is something to click inside a little panel, the panel must not disappear while you are moving towards it."
        before={<ReachPair after={false} />}
        after={<ReachPair after />}
      />
      <BeforeAfter
        principle="A box should still tell you what it is after you have filled it in. Grey hint text vanishes the moment you type, and then you are guessing."
        before={<LabelPair after={false} />}
        after={<LabelPair after />}
      />
      <BeforeAfter
        principle="The hint inside an empty box should show an example, not repeat its name. Seeing the shape of the answer tells you how to type yours."
        before={<PlaceholderPair after={false} />}
        after={<PlaceholderPair after />}
      />
      <BeforeAfter
        principle="Do not tell someone they are wrong while they are still typing. Wait until they stop, then say one thing, where they were already looking."
        before={<ValidationPair after={false} />}
        after={<ValidationPair after />}
      />
      <BeforeAfter
        principle="Something you can no longer change should still be readable and copyable. Greying it out until you cannot even select the text helps nobody."
        before={<LockedPair after={false} />}
        after={<LockedPair after />}
      />
      <BeforeAfter
        principle="Clicking the words next to a tick box should tick it. Aiming at a tiny square is work nobody signed up for."
        before={<HitAreaPair after={false} />}
        after={<HitAreaPair after />}
      />
      <BeforeAfter
        principle="A &ldquo;select all&rdquo; box should tell the truth when only some are picked. Empty means none, and that is a lie when one of three is ticked."
        before={<MixedPair after={false} />}
        after={<MixedPair after />}
      />
      <BeforeAfter
        principle="Ticking a box should not change anything until you say so. Otherwise a slip of the mouse has already done it to you."
        before={<StagedPair after={false} />}
        after={<StagedPair after />}
      />
      <BeforeAfter
        principle="When there are only two answers, show both. Opening a menu to choose between one and the other is three moves for something that takes one."
        before={<TwoOptionsPair after={false} />}
        after={<TwoOptionsPair after />}
      />
      <BeforeAfter
        principle="A long list should open where you already are, with your current choice picked out. Starting at the top means hunting for something you chose ages ago."
        before={<SelectDefaultPair after={false} />}
        after={<SelectDefaultPair after />}
      />
      <BeforeAfter
        principle="A message with a button in it should wait while you are reading. If it slides away as you reach for Undo, it might as well never have appeared."
        before={<ToastPausePair after={false} />}
        after={<ToastPausePair after />}
      />
      <BeforeAfter
        principle="Six messages at once bury the screen. Keep the last few in a neat pile, newest on top, and let people spread them out if they want."
        before={<ToastStackPair after={false} />}
        after={<ToastStackPair after />}
      />
      <BeforeAfter
        principle="A message should be readable in one glance. A whole sentence is gone before you have finished reading it."
        before={<WordingPair after={false} />}
        after={<WordingPair after />}
      />
      <BeforeAfter
        principle="People without a photo should still be told apart. A row of identical grey heads makes a team look like nobody."
        before={<AvatarPair after={false} />}
        after={<AvatarPair after />}
      />
      <BeforeAfter
        principle="Things should leave the way they arrived. When something blinks out of existence you lose track of where it went."
        before={<ExitPair after={false} />}
        after={<ExitPair after />}
      />
      <BeforeAfter
        principle="Small things should happen almost at once, big things a little slower. When a tap takes most of a second, the whole app feels like it is wading through mud."
        before={<TempoPair after={false} />}
        after={<TempoPair after />}
      />
    </div>
  );
}
