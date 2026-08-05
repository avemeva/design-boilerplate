"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import {
  Archive,
  Bold,
  Check,
  Code2,
  CornerUpLeft,
  ImageIcon,
  Italic,
  Link2,
  LoaderCircle,
  Minus,
  Plus,
  RotateCw,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * emilkowalski/skills — the whole bundle, shown rather than listed.
 * Each switch flips one piece of interface between the version most
 * products ship and the version the skills argue for.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const CTRL =
  "text-ui-sm ring-ring/50 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 whitespace-nowrap select-none outline-none focus-visible:ring-3";
const PRIMARY = cn(CTRL, "bg-primary text-primary-foreground");
const QUIET = cn(CTRL, "bg-secondary text-foreground");

const EASE_IN: [number, number, number, number] = [0.42, 0, 1, 1];

/* ------------------------------------------------------------------ *
 * 1 — press feedback
 * ------------------------------------------------------------------ */

function PressPair({ after }: Side) {
  const [qty, setQty] = useState(1);
  const [bag, setBag] = useState(0);
  const tap = after ? { scale: 0.97 } : undefined;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="bg-secondary flex items-center gap-1 rounded-lg p-1">
        <motion.button
          type="button"
          aria-label="One fewer"
          whileTap={tap}
          transition={spring.snappy}
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="text-foreground ring-ring/50 grid size-9 place-items-center rounded-md outline-none focus-visible:ring-3"
        >
          <Minus className="size-4" aria-hidden="true" />
        </motion.button>
        <span className="text-ui w-8 text-center tabular-nums">{qty}</span>
        <motion.button
          type="button"
          aria-label="One more"
          whileTap={tap}
          transition={spring.snappy}
          onClick={() => setQty((q) => Math.min(9, q + 1))}
          className="text-foreground ring-ring/50 grid size-9 place-items-center rounded-md outline-none focus-visible:ring-3"
        >
          <Plus className="size-4" aria-hidden="true" />
        </motion.button>
      </div>

      <motion.button
        type="button"
        whileTap={tap}
        transition={spring.snappy}
        onClick={() => setBag((b) => b + qty)}
        className={PRIMARY}
      >
        Add to bag
      </motion.button>

      <motion.button
        type="button"
        whileTap={tap}
        transition={spring.snappy}
        onClick={() => setBag(0)}
        className={QUIET}
      >
        Empty bag
      </motion.button>

      <span className="text-caption text-muted-foreground tabular-nums">
        {bag} in bag
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2 — nothing appears from nothing
 * ------------------------------------------------------------------ */

const SHARE = ["Copy link", "Email a copy", "Post to channel"];

function FromNothingPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="relative h-44">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={QUIET}
        >
          Share
        </button>
        {picked && (
          <span className="text-caption text-muted-foreground">{picked}</span>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: after ? 0.96 : 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: after ? 0.98 : 0 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="bg-card shadow-floating absolute top-12 left-0 w-56 rounded-xl border p-1"
          >
            {SHARE.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setPicked(label);
                  setOpen(false);
                }}
                className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center rounded-lg px-2.5 text-left"
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3 — the curve at the start of the motion
 * ------------------------------------------------------------------ */

const NOTES = [
  "Nadia approved the release",
  "Build 4021 finished",
  "Two comments on Pricing",
];

function EasingPair({ after }: Side) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={QUIET}
      >
        {open ? "Hide notifications" : "Show notifications"}
      </button>

      <div className="bg-secondary mt-3 h-40 overflow-hidden rounded-xl">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-100%" }}
              transition={
                after
                  ? { duration: duration.base, ease: ease.outQuart }
                  : { duration: 0.32, ease: EASE_IN }
              }
              className="bg-card h-full space-y-2 rounded-xl border p-3"
            >
              {NOTES.map((n) => (
                <div
                  key={n}
                  className="text-ui-sm bg-secondary flex h-10 items-center rounded-lg px-3"
                >
                  {n}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 4 — the same wait, felt shorter
 * ------------------------------------------------------------------ */

function SpinnerPair({ after }: Side) {
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    if (timer.current) return;
    setLoading(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setLoading(false);
      setRuns((r) => r + 1);
    }, 1300);
  }, []);

  const rows = [
    ["Visitors", 1240 + runs * 37],
    ["Signups", 86 + runs * 3],
    ["Active now", 12 + (runs % 5)],
  ] as const;

  return (
    <div>
      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className={cn(QUIET, "disabled:opacity-60")}
      >
        <RotateCw className="size-4" aria-hidden="true" />
        Refresh
      </button>

      <div className="bg-secondary mt-3 grid h-36 place-items-center rounded-xl">
        {loading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: after ? 0.55 : 2.4,
              ease: "linear",
            }}
            className="text-muted-foreground"
          >
            <LoaderCircle className="size-6" aria-label="Loading" />
          </motion.span>
        ) : (
          <motion.dl
            key={runs}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              after
                ? { duration: duration.instant }
                : { duration: 0.5, delay: 0.15 }
            }
            className="w-full space-y-2 px-4"
          >
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between">
                <dt className="text-ui-sm text-muted-foreground">{label}</dt>
                <dd className="text-ui tabular-nums">{value}</dd>
              </div>
            ))}
          </motion.dl>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 5 — the thing you open fifty times a day
 * ------------------------------------------------------------------ */

const COMMANDS = ["Open issue", "Switch project", "Copy deploy URL"];

function CommandPalette({ onPick }: { onPick: (label: string) => void }) {
  return (
    <div className="bg-card shadow-floating w-full rounded-xl border p-1">
      <div className="text-muted-foreground flex h-9 items-center gap-2 px-2.5">
        <Search className="size-4" aria-hidden="true" />
        <span className="text-ui-sm">Search commands</span>
      </div>
      {COMMANDS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center rounded-lg px-2.5 text-left"
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function FrequencyPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [opens, setOpens] = useState(0);
  const [last, setLast] = useState<string | null>(null);

  const toggle = () => {
    setOpen((o) => !o);
    setOpens((n) => n + 1);
  };
  const pick = (label: string) => {
    setLast(label);
    setOpen(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={toggle}
          className={QUIET}
        >
          Command menu
        </button>
        <span className="text-caption text-muted-foreground tabular-nums">
          opened {opens} times{last ? ` · ${last}` : ""}
        </span>
      </div>

      <div className="bg-secondary mt-3 h-44 rounded-xl p-3">
        {after ? (
          open && <CommandPalette onPick={pick} />
        ) : (
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: duration.slow, ease: ease.outQuart }}
              >
                <CommandPalette onPick={pick} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 6 — changing your mind halfway
 * ------------------------------------------------------------------ */

function InterruptPair({ after }: Side) {
  const [open, setOpen] = useState(false);
  const [presses, setPresses] = useState(0);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setPresses((p) => p + 1);
        }}
        className={QUIET}
      >
        {open ? "Close details" : "Open details"}
      </button>

      <div className="bg-secondary relative mt-3 h-40 overflow-hidden rounded-xl">
        <div className="text-caption text-muted-foreground absolute inset-0 flex items-center px-4">
          Order #4021
        </div>
        <motion.div
          key={after ? "panel" : presses}
          initial={after ? false : { x: open ? "100%" : "0%" }}
          animate={{ x: open ? "0%" : "100%" }}
          transition={
            after ? spring.smooth : { duration: 0.45, ease: ease.inOutQuart }
          }
          className="bg-card absolute inset-y-0 right-0 w-56 space-y-2 border-l p-3"
        >
          <p className="text-ui-sm">Shipping</p>
          <div className="bg-secondary h-8 rounded-lg" />
          <div className="bg-secondary h-8 rounded-lg" />
          <div className="bg-secondary h-8 w-2/3 rounded-lg" />
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 7 — arriving one after another
 * ------------------------------------------------------------------ */

const BOARDS = ["Roadmap", "Bugs", "Design", "Hiring", "Infra", "Archive"];

function StaggerPair({ after }: Side) {
  const [shown, setShown] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className={QUIET}
      >
        {shown ? "Clear boards" : "Load boards"}
      </button>

      <div className="mt-3 h-36">
        <AnimatePresence>
          {shown && (
            <motion.ul
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: after ? 0.05 : 0 } },
              }}
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {BOARDS.map((b) => (
                <motion.li
                  key={b}
                  variants={{
                    hidden: { opacity: 0, y: 10, scale: 0.98 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        duration: duration.base,
                        ease: ease.outQuart,
                      },
                    },
                  }}
                  className="bg-secondary text-ui-sm flex h-14 items-end rounded-lg p-2.5"
                >
                  {b}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 8 — the first tip waits, the rest keep up
 * ------------------------------------------------------------------ */

const TOOLS = [
  { id: "bold", label: "Bold", Icon: Bold },
  { id: "italic", label: "Italic", Icon: Italic },
  { id: "link", label: "Link", Icon: Link2 },
  { id: "image", label: "Image", Icon: ImageIcon },
  { id: "code", label: "Code", Icon: Code2 },
];

function TooltipPair({ after }: Side) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [instant, setInstant] = useState(false);
  const warm = useRef(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coolTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = (id: string) => {
    if (coolTimer.current) {
      clearTimeout(coolTimer.current);
      coolTimer.current = null;
    }
    if (after && warm.current) {
      setInstant(true);
      setHovered(id);
      return;
    }
    openTimer.current = setTimeout(() => {
      warm.current = true;
      setInstant(false);
      setHovered(id);
    }, 450);
  };

  const leave = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    setHovered(null);
  };

  const leaveBar = () => {
    leave();
    coolTimer.current = setTimeout(() => {
      warm.current = false;
    }, 500);
  };

  return (
    <div className="pt-10">
      <div
        onMouseLeave={leaveBar}
        className="bg-secondary inline-flex items-center gap-1 rounded-lg p-1"
      >
        {TOOLS.map(({ id, label, Icon }) => (
          <div key={id} className="relative">
            <button
              type="button"
              aria-label={label}
              onMouseEnter={() => enter(id)}
              onMouseLeave={leave}
              onFocus={() => setHovered(id)}
              onBlur={leave}
              className="text-foreground hover:bg-card ring-ring/50 grid size-9 place-items-center rounded-md outline-none focus-visible:ring-3"
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
            <AnimatePresence>
              {hovered === id && (
                <motion.span
                  initial={{
                    opacity: instant ? 1 : 0,
                    scale: instant ? 1 : 0.96,
                  }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{
                    duration: instant ? 0 : duration.fast,
                    ease: ease.outQuart,
                  }}
                  className="bg-primary text-primary-foreground text-caption absolute bottom-11 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 9 — following where things went
 * ------------------------------------------------------------------ */

const MAIL = [
  {
    id: "m1",
    from: "Nadia",
    subject: "Design review Thursday",
    unread: true,
    starred: true,
  },
  {
    id: "m2",
    from: "Deploys",
    subject: "Build 4021 is live",
    unread: false,
    starred: false,
  },
  {
    id: "m3",
    from: "Rui",
    subject: "Pricing page copy",
    unread: true,
    starred: false,
  },
  {
    id: "m4",
    from: "Support",
    subject: "Weekly digest",
    unread: false,
    starred: true,
  },
  {
    id: "m5",
    from: "Ivy",
    subject: "Contract signed",
    unread: true,
    starred: false,
  },
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "starred", label: "Starred" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function MailRow({ mail }: { mail: (typeof MAIL)[number] }) {
  return (
    <>
      <span className="text-ui-sm w-16 shrink-0">{mail.from}</span>
      <span className="text-ui-sm text-muted-foreground truncate">
        {mail.subject}
      </span>
      {mail.starred && (
        <Star
          className="text-muted-foreground ml-auto size-3.5 shrink-0"
          aria-hidden="true"
        />
      )}
    </>
  );
}

function LayoutPair({ after }: Side) {
  const [filter, setFilter] = useState<FilterId>("all");
  const shown = MAIL.filter((m) =>
    filter === "all" ? true : filter === "unread" ? m.unread : m.starred,
  );

  return (
    <div>
      <div className="bg-secondary inline-flex rounded-lg p-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "text-ui-sm h-9 rounded-md px-3",
              filter === f.id
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 h-44 space-y-1.5">
        {after ? (
          <AnimatePresence initial={false}>
            {shown.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={spring.smooth}
                className="bg-secondary flex h-10 items-center gap-3 rounded-lg px-3"
              >
                <MailRow mail={m} />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          shown.map((m) => (
            <div
              key={m.id}
              className="bg-secondary flex h-10 items-center gap-3 rounded-lg px-3"
            >
              <MailRow mail={m} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 10 — a flick is enough
 * ------------------------------------------------------------------ */

function FlickPair({ after }: Side) {
  const [gone, setGone] = useState(false);

  const end = (_event: unknown, info: PanInfo) => {
    const far = info.offset.x < -140;
    const fast = after && info.velocity.x < -350;
    if (far || fast) setGone(true);
  };

  return (
    <div className="h-24">
      <AnimatePresence mode="wait">
        {gone ? (
          <motion.div
            key="undo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="flex h-16 items-center gap-3"
          >
            <span className="text-ui-sm text-muted-foreground">Archived</span>
            <button
              type="button"
              onClick={() => setGone(false)}
              className={QUIET}
            >
              <CornerUpLeft className="size-4" aria-hidden="true" />
              Bring it back
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="row"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.95, right: 0.05 }}
            dragSnapToOrigin
            dragTransition={{ bounceStiffness: 500, bounceDamping: 42 }}
            onDragEnd={end}
            exit={{ x: -340, opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="bg-secondary flex h-16 touch-none items-center gap-3 rounded-xl px-4"
          >
            <Archive
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-ui-sm truncate">Weekly digest</p>
              <p className="text-caption text-muted-foreground truncate">
                Drag me to the left
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 11 — pulling past the end
 * ------------------------------------------------------------------ */

function RubberPair({ after }: Side) {
  return (
    <div className="bg-secondary relative h-44 overflow-hidden rounded-xl">
      <div className="text-caption text-muted-foreground absolute inset-x-0 top-3 flex items-center justify-center gap-1.5">
        <RotateCw className="size-3.5" aria-hidden="true" />
        Pull the list down
      </div>
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 64 }}
        dragElastic={after ? 0.55 : 0}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 480, bounceDamping: 40 }}
        className="bg-card absolute inset-x-0 top-0 touch-none space-y-1.5 rounded-xl border p-3"
      >
        {["Nadia", "Deploys", "Rui", "Support"].map((n) => (
          <div
            key={n}
            className="bg-secondary text-ui-sm flex h-9 items-center rounded-lg px-3"
          >
            {n}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 12 — hold to delete, let go to stop
 * ------------------------------------------------------------------ */

function HoldPair({ after }: Side) {
  const [holding, setHolding] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const settle = () => {
    if (!holding) return;
    setHolding(false);
    setDeleted(true);
  };

  if (deleted) {
    return (
      <div className="flex h-16 items-center gap-3">
        <span className="text-ui-sm text-muted-foreground">
          Project deleted
        </span>
        <button
          type="button"
          onClick={() => setDeleted(false)}
          className={QUIET}
        >
          <CornerUpLeft className="size-4" aria-hidden="true" />
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center">
      <button
        type="button"
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        onKeyDown={(e) => {
          if (e.key === " ") {
            e.preventDefault();
            setHolding(true);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " ") setHolding(false);
        }}
        className="text-ui-sm text-destructive ring-ring/50 relative h-9 overflow-hidden rounded-lg border px-3 outline-none select-none focus-visible:ring-3"
      >
        <motion.span
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: holding ? 1 : 0 }}
          transition={
            holding
              ? { duration: 1.4, ease: "linear" }
              : after
                ? { duration: 0.18, ease: ease.outQuart }
                : { duration: 1.4, ease: "linear" }
          }
          onAnimationComplete={settle}
          className="bg-destructive/15 absolute inset-0 origin-left"
        />
        <span className="relative flex items-center gap-1.5">
          <Trash2 className="size-4" aria-hidden="true" />
          Hold to delete
        </span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 13 — leaving the way it arrived
 * ------------------------------------------------------------------ */

function ToastPair({ after }: Side) {
  const [shown, setShown] = useState(false);

  return (
    <div className="bg-secondary relative h-40 overflow-hidden rounded-xl p-4">
      <button type="button" onClick={() => setShown(true)} className={PRIMARY}>
        <Send className="size-4" aria-hidden="true" />
        Send invite
      </button>

      <AnimatePresence>
        {shown && (
          <motion.div
            initial={{ y: "120%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={
              after
                ? { y: "120%", opacity: 0 }
                : { y: -12, opacity: 0, scale: 0.9 }
            }
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="bg-card shadow-floating absolute inset-x-4 bottom-4 flex items-center gap-2.5 rounded-xl border p-3"
          >
            <Check
              className="text-positive size-4 shrink-0"
              aria-hidden="true"
            />
            <p className="text-ui-sm truncate">Invite sent to rui@acme.co</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setShown(false)}
              className="hover:bg-secondary ml-auto grid size-9 shrink-0 place-items-center rounded-md"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function EmilkowalskiSkillsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The buttons give a little when you press them."
        before={<PressPair after={false} />}
        after={<PressPair after />}
      />
      <BeforeAfter
        principle="The menu stops firing out of a dot in the middle."
        before={<FromNothingPair after={false} />}
        after={<FromNothingPair after />}
      />
      <BeforeAfter
        principle="It comes down the moment you press, instead of hesitating first."
        before={<EasingPair after={false} />}
        after={<EasingPair after />}
      />
      <BeforeAfter
        principle="The wait is exactly as long. It feels shorter."
        before={<SpinnerPair after={false} />}
        after={<SpinnerPair after />}
      />
      <BeforeAfter
        principle="The one you open fifty times a day is simply there."
        before={<FrequencyPair after={false} />}
        after={<FrequencyPair after />}
      />
      <BeforeAfter
        principle="Change your mind halfway and it carries on from where it is."
        before={<InterruptPair after={false} />}
        after={<InterruptPair after />}
      />
      <BeforeAfter
        principle="They arrive one after another instead of all landing at once."
        before={<StaggerPair after={false} />}
        after={<StaggerPair after />}
      />
      <BeforeAfter
        principle="Only the first tip makes you wait — the rest keep up with your pointer."
        before={<TooltipPair after={false} />}
        after={<TooltipPair after />}
      />
      <BeforeAfter
        principle="You can see where each one went."
        before={<LayoutPair after={false} />}
        after={<LayoutPair after />}
      />
      <BeforeAfter
        principle="A quick flick is enough — you don't have to drag it all the way."
        before={<FlickPair after={false} />}
        after={<FlickPair after />}
      />
      <BeforeAfter
        principle="It keeps giving when you pull past the end, instead of hitting a wall."
        before={<RubberPair after={false} />}
        after={<RubberPair after />}
      />
      <BeforeAfter
        principle="Let go and it stops right away."
        before={<HoldPair after={false} />}
        after={<HoldPair after />}
      />
      <BeforeAfter
        principle="It leaves the way it came in."
        before={<ToastPair after={false} />}
        after={<ToastPair after />}
      />
    </div>
  );
}
