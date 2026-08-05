"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  Reorder,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Command,
  FileText,
  GripVertical,
  History,
  Home,
  Inbox,
  Link2,
  Loader2,
  Minus,
  MousePointer2,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react";

import { BeforeAfter } from "@/components/surface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * nolly-studio/cult-ui — https://github.com/nolly-studio/cult-ui
 *
 * The registry ships 82 components under registry/default/ui. Most are
 * decorative (shader backgrounds, dither images, pixel headings, SVG
 * bands) and a handful are pure chrome (mock browser window, code
 * block). Nine of them are actually about how an interaction *feels*,
 * and those are the ones a person can see the difference in:
 *
 *   sortable-list          Reorder.Group drag instead of nudge buttons
 *   expandable-card        shared layoutId — the card becomes the sheet
 *   family-drawer          useMeasure + animated height between steps
 *   direction-aware-tabs   x: 300 * direction, plus a layoutId bubble
 *   dynamic-island         one blob morphing through size presets
 *   animated-number        useSpring + useTransform over the value
 *   dock                   width from cos(distance) to the pointer
 *   feature-poll           results bars grown from a percentage
 *   loading-carousel       tips on a timer instead of a spinner
 *
 * Retokenized: cult-ui leans on gradients, inset shadows and indigo
 * fills that this system does not have. What survives the translation
 * is the mechanic, not the paint.
 * ------------------------------------------------------------------ */

/* ── 1. sortable-list ──────────────────────────────────────────────── */

type Track = { id: string; title: string; artist: string; len: string };

const TRACKS: Track[] = [
  { id: "t1", title: "Night Ferry", artist: "Halden", len: "4:12" },
  { id: "t2", title: "Low Tide", artist: "Ora Vance", len: "3:38" },
  { id: "t3", title: "Paper Rooms", artist: "Kite Season", len: "5:01" },
  { id: "t4", title: "Second Shift", artist: "Marlow", len: "2:54" },
];

function TrackBody({ track, order }: { track: Track; order: number }) {
  return (
    <>
      <span className="text-caption text-muted-foreground w-4 shrink-0 tabular-nums">
        {order + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ui-sm truncate">{track.title}</p>
        <p className="text-caption text-muted-foreground truncate">
          {track.artist}
        </p>
      </div>
      <span className="text-caption text-muted-foreground shrink-0 tabular-nums">
        {track.len}
      </span>
    </>
  );
}

function ReorderBefore() {
  const [items, setItems] = useState(TRACKS);

  const move = (index: number, delta: number) =>
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <ul className="space-y-1.5">
      {items.map((track, i) => (
        <li
          key={track.id}
          className="bg-card flex items-center gap-3 rounded-lg border px-3 py-2"
        >
          <TrackBody track={track} order={i} />
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label={`Move ${track.title} up`}
              className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
            >
              <ChevronUp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              aria-label={`Move ${track.title} down`}
              className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
            >
              <ChevronDown className="size-4" aria-hidden="true" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReorderAfter() {
  const [items, setItems] = useState(TRACKS);

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={setItems}
      className="space-y-1.5"
    >
      {items.map((track, i) => (
        <Reorder.Item
          key={track.id}
          value={track}
          layout
          transition={spring.smooth}
          whileDrag={{ scale: 1.02, cursor: "grabbing" }}
          className="bg-card flex cursor-grab items-center gap-3 rounded-lg border px-3 py-2 select-none active:cursor-grabbing"
        >
          <GripVertical
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
          <TrackBody track={track} order={i} />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

/* ── 2. expandable-card ────────────────────────────────────────────── */

type Space = {
  id: string;
  name: string;
  meta: string;
  body: string;
  owner: string;
};

const SPACES: Space[] = [
  {
    id: "sp1",
    name: "Design system",
    meta: "12 files",
    body: "Tokens, primitives, and the rules that hold them together. Everything ships from here.",
    owner: "Halden",
  },
  {
    id: "sp2",
    name: "Launch",
    meta: "5 files",
    body: "Store copy, the press kit, and the two screenshots that still need retaking.",
    owner: "Ora",
  },
  {
    id: "sp3",
    name: "Research",
    meta: "31 files",
    body: "Session notes from the last four rounds, tagged by the thing people got stuck on.",
    owner: "Marlow",
  },
];

function SpaceDetail({ space, onClose }: { space: Space; onClose: () => void }) {
  return (
    <>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <motion.p layoutId={`cu-space-name-${space.id}`} className="text-ui">
            {space.name}
          </motion.p>
          <p className="text-caption text-muted-foreground">{space.meta}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${space.name}`}
          className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p className="text-caption text-muted-foreground mt-3">{space.body}</p>
      <div className="mt-4 flex items-center gap-2 border-t pt-3">
        <span className="text-micro text-muted-foreground bg-secondary rounded-full px-2.5 py-1 uppercase">
          {space.owner}
        </span>
        <span className="text-caption text-muted-foreground">
          Last opened this morning
        </span>
      </div>
    </>
  );
}

function ExpandBefore() {
  const [open, setOpen] = useState<Space | null>(null);

  return (
    <div className="min-h-52">
      <div className="grid gap-3 sm:grid-cols-3">
        {SPACES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpen(s)}
            className="bg-card hover:bg-secondary h-24 rounded-xl border p-3 text-left transition-colors"
          >
            <p className="text-ui-sm">{s.name}</p>
            <p className="text-caption text-muted-foreground">{s.meta}</p>
          </button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        Pick a space to read it.
      </p>
      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open?.name}</DialogTitle>
            <DialogDescription>{open?.meta}</DialogDescription>
          </DialogHeader>
          <p className="text-caption text-muted-foreground">{open?.body}</p>
          <div className="flex items-center gap-2 border-t pt-3">
            <span className="text-micro text-muted-foreground bg-secondary rounded-full px-2.5 py-1 uppercase">
              {open?.owner}
            </span>
            <span className="text-caption text-muted-foreground">
              Last opened this morning
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExpandAfter() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = SPACES.find((s) => s.id === openId) ?? null;

  return (
    <div className="relative min-h-52">
      <div className="grid gap-3 sm:grid-cols-3">
        {SPACES.map((s) =>
          openId === s.id ? (
            <div key={s.id} className="h-24 rounded-xl border border-dashed" />
          ) : (
            <motion.button
              key={s.id}
              type="button"
              layoutId={`cu-space-${s.id}`}
              transition={spring.smooth}
              onClick={() => setOpenId(s.id)}
              className="bg-card hover:bg-secondary h-24 rounded-xl border p-3 text-left transition-colors"
            >
              <motion.p
                layoutId={`cu-space-name-${s.id}`}
                className="text-ui-sm"
              >
                {s.name}
              </motion.p>
              <p className="text-caption text-muted-foreground">{s.meta}</p>
            </motion.button>
          ),
        )}
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        Pick a space to read it.
      </p>

      <AnimatePresence>
        {open && (
          <motion.div
            key={open.id}
            layoutId={`cu-space-${open.id}`}
            transition={spring.smooth}
            className="bg-card shadow-floating absolute inset-x-0 top-0 z-10 rounded-xl p-4"
          >
            <SpaceDetail space={open} onClose={() => setOpenId(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 3. family-drawer ──────────────────────────────────────────────── */

const AMOUNTS = [20, 50, 120];

function StepContent({
  step,
  amount,
  onAmount,
  onNext,
  onRestart,
}: {
  step: number;
  amount: number;
  onAmount: (n: number) => void;
  onNext: () => void;
  onRestart: () => void;
}) {
  if (step === 0) {
    return (
      <div>
        <p className="text-ui">Send to Halden</p>
        <p className="text-caption text-muted-foreground mt-1">
          Pick an amount, or type your own.
        </p>
        <div className="mt-3 flex gap-1.5">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onAmount(a)}
              aria-pressed={amount === a}
              className={cn(
                "text-ui-sm h-9 flex-1 rounded-lg border tabular-nums transition-colors",
                amount === a
                  ? "bg-feature text-feature-foreground border-transparent"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              ${a}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label
            htmlFor="cu-drawer-note"
            className="text-micro text-muted-foreground uppercase"
          >
            Note
          </label>
          <input
            id="cu-drawer-note"
            type="text"
            defaultValue="For the ferry ticket"
            className="text-ui bg-card focus-visible:border-ring focus-visible:ring-ring/50 mt-1.5 h-9 w-full rounded-lg border px-3 outline-none focus-visible:ring-3"
          />
        </div>
        <button
          type="button"
          onClick={onNext}
          className="text-ui-sm bg-primary text-primary-foreground hover:bg-primary/80 mt-3 h-9 w-full rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div>
        <p className="text-ui">Check it over</p>
        <dl className="mt-3 space-y-2">
          {[
            ["To", "Halden"],
            ["Amount", `$${amount}.00`],
            ["Arrives", "In a minute or two"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between">
              <dt className="text-caption text-muted-foreground">{k}</dt>
              <dd className="text-ui-sm tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={onNext}
          className="text-ui-sm bg-primary text-primary-foreground hover:bg-primary/80 mt-3 h-9 w-full rounded-lg transition-colors"
        >
          Send ${amount}.00
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="bg-secondary text-positive mx-auto flex size-9 items-center justify-center rounded-full">
        <Check className="size-4" aria-hidden="true" />
      </div>
      <p className="text-ui mt-2">Sent</p>
      <button
        type="button"
        onClick={onRestart}
        className="text-ui-sm text-muted-foreground hover:text-foreground mt-2 h-9 px-3"
      >
        Start again
      </button>
    </div>
  );
}

function useDrawerSteps() {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(50);
  return {
    step,
    amount,
    onAmount: setAmount,
    onNext: () => setStep((s) => Math.min(s + 1, 2)),
    onRestart: () => setStep(0),
  };
}

function DrawerBefore() {
  const s = useDrawerSteps();
  return (
    <div className="mx-auto max-w-sm">
      <div className="bg-secondary rounded-xl border p-4">
        <StepContent {...s} />
      </div>
    </div>
  );
}

function DrawerAfter() {
  const s = useDrawerSteps();
  return (
    <div className="mx-auto max-w-sm">
      <motion.div
        layout
        transition={spring.smooth}
        className="bg-secondary overflow-hidden rounded-xl border p-4"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
          >
            <StepContent {...s} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── 4. direction-aware-tabs ───────────────────────────────────────── */

const TABS = [
  { id: 0, label: "Overview" },
  { id: 1, label: "Activity" },
  { id: 2, label: "Members" },
];

function TabPanel({ id }: { id: number }) {
  if (id === 0) {
    return (
      <div>
        <p className="text-ui-sm">Kite Season</p>
        <p className="text-caption text-muted-foreground mt-1">
          A shared board for the ferry redesign. Three people, one open
          question, and a deadline nobody has moved yet.
        </p>
      </div>
    );
  }
  if (id === 1) {
    return (
      <ul className="space-y-2">
        {[
          ["Ora", "renamed the timetable sheet"],
          ["Halden", "left a note on the map card"],
          ["Marlow", "moved two cards to Done"],
          ["Ora", "added the pricing draft"],
        ].map(([who, what]) => (
          <li key={who + what} className="flex items-baseline gap-2">
            <span className="text-ui-sm">{who}</span>
            <span className="text-caption text-muted-foreground">{what}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="space-y-2">
      {["Halden", "Ora Vance"].map((m) => (
        <li key={m} className="flex items-center gap-2">
          <span className="bg-secondary text-micro flex size-9 items-center justify-center rounded-full uppercase">
            {m.slice(0, 2)}
          </span>
          <span className="text-ui-sm">{m}</span>
        </li>
      ))}
    </ul>
  );
}

function TabsBefore() {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="bg-secondary inline-flex rounded-full p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            aria-pressed={active === t.id}
            className={cn(
              "text-ui-sm h-9 rounded-full px-4",
              active === t.id
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <TabPanel id={active} />
      </div>
    </div>
  );
}

function TabsAfter() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  const select = (id: number) => {
    if (id === active) return;
    setDirection(id > active ? 1 : -1);
    setActive(id);
  };

  return (
    <div>
      <div className="bg-secondary inline-flex rounded-full p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => select(t.id)}
            aria-pressed={active === t.id}
            className={cn(
              "text-ui-sm relative h-9 rounded-full px-4 transition-colors",
              active === t.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active === t.id && (
              <motion.span
                layoutId="cu-tab-pill"
                transition={spring.snappy}
                className="bg-card shadow-xs absolute inset-0 rounded-full"
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>
      <motion.div
        layout
        transition={spring.smooth}
        className="mt-3 overflow-hidden"
      >
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={active}
            custom={direction}
            variants={{
              enter: (d: number) => ({
                x: 120 * d,
                opacity: 0,
                filter: "blur(4px)",
              }),
              center: { x: 0, opacity: 1, filter: "blur(0px)" },
              exit: (d: number) => ({
                x: -120 * d,
                opacity: 0,
                filter: "blur(4px)",
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: duration.base, ease: ease.outQuart }}
          >
            <TabPanel id={active} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── 5. dynamic-island ─────────────────────────────────────────────── */

const STAGES = [
  { id: "queued", icon: Clock, label: "Queued" },
  { id: "build", icon: Loader2, label: "Building — 2 of 3 steps", spin: true },
  { id: "live", icon: Check, label: "Live at kite-season.app" },
] as const;

function useDeployRun() {
  const [stage, setStage] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // The array is mutated, never replaced, so this cleanup still sees
  // whatever the last run scheduled.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    setStage(0);
    timers.current.push(setTimeout(() => setStage(1), 900));
    timers.current.push(setTimeout(() => setStage(2), 2400));
  };

  return { stage, run };
}

function IslandBefore() {
  const { stage, run } = useDeployRun();

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={run}
        className="text-ui-sm bg-primary text-primary-foreground hover:bg-primary/80 h-9 rounded-lg px-4 transition-colors"
      >
        Deploy
      </button>
      <div className="w-full max-w-sm space-y-1.5">
        {STAGES.slice(0, stage + 1).map((s) => (
          <div
            key={s.id}
            className="bg-secondary flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <s.icon
              className={cn(
                "text-muted-foreground size-4 shrink-0",
                "spin" in s && s.spin && "animate-spin",
              )}
              aria-hidden="true"
            />
            <span className="text-caption">{s.label}</span>
          </div>
        ))}
        {stage < 0 && (
          <p className="text-caption text-muted-foreground text-center">
            Nothing running.
          </p>
        )}
      </div>
    </div>
  );
}

function IslandAfter() {
  const { stage, run } = useDeployRun();
  const current = stage >= 0 ? STAGES[stage] : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={run}
        className="text-ui-sm bg-primary text-primary-foreground hover:bg-primary/80 h-9 rounded-lg px-4 transition-colors"
      >
        Deploy
      </button>
      <div className="flex min-h-9 items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {current && (
            <motion.div
              key="island"
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={spring.smooth}
              className="bg-feature text-feature-foreground flex h-9 items-center gap-2 overflow-hidden rounded-full px-3"
            >
              <motion.span layout="position" className="flex shrink-0">
                <current.icon
                  className={cn(
                    "size-4",
                    "spin" in current && current.spin && "animate-spin",
                  )}
                  aria-hidden="true"
                />
              </motion.span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={current.id}
                  initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  transition={{ duration: duration.fast, ease: ease.outQuart }}
                  className="text-caption whitespace-nowrap"
                >
                  {current.label}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        {!current && (
          <p className="text-caption text-muted-foreground">Nothing running.</p>
        )}
      </div>
    </div>
  );
}

/* ── 6. animated-number ────────────────────────────────────────────── */

const SEAT_PRICE = 24;

function RollingAmount({ source }: { source: MotionValue<number> }) {
  const smooth = useSpring(source, { mass: 0.8, stiffness: 75, damping: 15 });
  const text = useTransform(smooth, (v) => v.toFixed(2));
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

function Stepper({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, qty - 1))}
        aria-label="One seat fewer"
        className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="text-ui w-9 text-center tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(24, qty + 1))}
        aria-label="One seat more"
        className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function NumberBefore() {
  const [qty, setQty] = useState(4);

  return (
    <div className="mx-auto max-w-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-ui-sm">Team seats</p>
          <p className="text-caption text-muted-foreground">
            ${SEAT_PRICE}.00 each, monthly
          </p>
        </div>
        <Stepper qty={qty} onChange={setQty} />
      </div>
      <div className="flex flex-wrap items-baseline gap-2 border-t pt-3">
        <span className="text-caption text-muted-foreground">Total</span>
        <span className="text-title">${(qty * SEAT_PRICE).toFixed(2)}</span>
        <span className="text-caption text-muted-foreground">
          renews 1 March
        </span>
      </div>
    </div>
  );
}

function NumberAfter() {
  const [qty, setQty] = useState(4);
  const total = useMotionValue(4 * SEAT_PRICE);

  const change = (n: number) => {
    setQty(n);
    total.set(n * SEAT_PRICE);
  };

  return (
    <div className="mx-auto max-w-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-ui-sm">Team seats</p>
          <p className="text-caption text-muted-foreground">
            ${SEAT_PRICE}.00 each, monthly
          </p>
        </div>
        <Stepper qty={qty} onChange={change} />
      </div>
      <div className="flex items-baseline justify-between border-t pt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-caption text-muted-foreground">Total</span>
          <span className="text-caption text-muted-foreground">
            renews 1 March
          </span>
        </div>
        <span className="text-title">
          $<RollingAmount source={total} />
        </span>
      </div>
    </div>
  );
}

/* ── 7. dock ───────────────────────────────────────────────────────── */

const DOCK_ITEMS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "search", icon: Search, label: "Search" },
  { id: "inbox", icon: Inbox, label: "Inbox" },
  { id: "calendar", icon: Calendar, label: "Calendar" },
  { id: "files", icon: FileText, label: "Files" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function DockBefore() {
  return (
    <div className="flex justify-center">
      <div className="bg-secondary flex items-end gap-1 rounded-2xl border p-2">
        {DOCK_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            className="bg-card text-muted-foreground hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
          >
            <item.icon className="size-4" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function DockTile({
  item,
  pointerX,
}: {
  item: (typeof DOCK_ITEMS)[number];
  pointerX: MotionValue<number>;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(pointerX, (x) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return 999;
    return x - box.x - box.width / 2;
  });

  const target = useTransform(distance, [-120, 0, 120], [36, 64, 36]);
  const size = useSpring(target, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={item.label}
      style={{ width: size, height: size }}
      className="bg-card text-muted-foreground hover:text-foreground flex items-center justify-center rounded-lg border transition-colors"
    >
      <item.icon className="size-4" aria-hidden="true" />
    </motion.button>
  );
}

function DockAfter() {
  const pointerX = useMotionValue(Infinity);

  return (
    <div className="flex justify-center">
      <div
        onPointerMove={(e) => pointerX.set(e.clientX)}
        onPointerLeave={() => pointerX.set(Infinity)}
        className="bg-secondary flex min-h-20 items-end gap-1 rounded-2xl border p-2"
      >
        {DOCK_ITEMS.map((item) => (
          <DockTile key={item.id} item={item} pointerX={pointerX} />
        ))}
      </div>
    </div>
  );
}

/* ── 8. feature-poll ───────────────────────────────────────────────── */

const POLL = [
  { id: "offline", label: "Offline mode", votes: 412 },
  { id: "api", label: "A public API", votes: 287 },
  { id: "themes", label: "Custom themes", votes: 139 },
];

function usePoll() {
  const [picked, setPicked] = useState<string | null>(null);
  const total = POLL.reduce((n, o) => n + o.votes, 0) + (picked ? 1 : 0);
  const share = (o: (typeof POLL)[number]) =>
    Math.round(((o.votes + (picked === o.id ? 1 : 0)) / total) * 100);
  return { picked, setPicked, total, share };
}

function PollBefore() {
  const { picked, setPicked, total, share } = usePoll();

  return (
    <div className="mx-auto max-w-sm">
      <p className="text-ui-sm">What should we build next?</p>
      <ul className="mt-3 space-y-1.5">
        {POLL.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => setPicked(o.id)}
              disabled={picked !== null}
              className={cn(
                "bg-card flex h-9 w-full items-center justify-between rounded-lg border px-3 text-left transition-colors",
                picked === null && "hover:bg-secondary",
                picked === o.id && "border-border-strong",
              )}
            >
              <span className="text-ui-sm">{o.label}</span>
              {picked !== null && (
                <span className="text-caption text-muted-foreground tabular-nums">
                  {share(o)}%
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-caption text-muted-foreground mt-2.5 tabular-nums">
        {picked ? `${total} votes` : "One pick each."}
      </p>
    </div>
  );
}

function PollAfter() {
  const { picked, setPicked, total, share } = usePoll();

  return (
    <div className="mx-auto max-w-sm">
      <p className="text-ui-sm">What should we build next?</p>
      <ul className="mt-3 space-y-1.5">
        {POLL.map((o, i) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => setPicked(o.id)}
              disabled={picked !== null}
              className={cn(
                "bg-card relative flex h-9 w-full items-center justify-between overflow-hidden rounded-lg border px-3 text-left transition-colors",
                picked === null && "hover:bg-secondary",
                picked === o.id && "border-border-strong",
              )}
            >
              {picked !== null && (
                <motion.span
                  aria-hidden="true"
                  initial={{ width: 0 }}
                  animate={{ width: `${share(o)}%` }}
                  transition={{
                    duration: duration.slow,
                    ease: ease.outQuart,
                    delay: i * 0.06,
                  }}
                  className="bg-accent absolute inset-y-0 left-0"
                />
              )}
              <span className="text-ui-sm relative">{o.label}</span>
              {picked !== null && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: duration.base,
                    delay: i * 0.06 + 0.15,
                  }}
                  className="text-caption text-muted-foreground relative tabular-nums"
                >
                  {share(o)}%
                </motion.span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-caption text-muted-foreground mt-2.5 tabular-nums">
        {picked ? `${total} votes` : "One pick each."}
      </p>
    </div>
  );
}

/* ── 9. loading-carousel ───────────────────────────────────────────── */

const TIPS = [
  { icon: Command, text: "Press ⌘K anywhere to jump straight to a file." },
  { icon: MousePointer2, text: "Hold Shift while dragging to copy a card." },
  { icon: History, text: "Every space keeps thirty days of history." },
  { icon: Link2, text: "Paste a link and it unfurls into a preview." },
];

const TIP_MS = 2600;

function LoadingBefore() {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2">
      <Loader2
        className="text-muted-foreground size-5 animate-spin"
        aria-hidden="true"
      />
      <p className="text-caption text-muted-foreground" role="status">
        Loading your workspace…
      </p>
    </div>
  );
}

function LoadingAfter() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % TIPS.length),
      TIP_MS,
    );
    return () => clearInterval(id);
  }, []);

  const tip = TIPS[index];

  return (
    <div className="mx-auto flex min-h-32 max-w-sm flex-col justify-center">
      <div className="bg-secondary overflow-hidden rounded-xl border">
        <div className="flex min-h-20 items-center gap-3 px-4">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 40, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -40, filter: "blur(4px)" }}
              transition={{ duration: duration.slow, ease: ease.outQuart }}
              className="flex items-center gap-3"
            >
              <span className="bg-card flex size-9 shrink-0 items-center justify-center rounded-lg border">
                <tip.icon
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
              </span>
              <p className="text-caption">{tip.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="bg-border h-0.5 w-full">
          <motion.div
            key={index}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: TIP_MS / 1000, ease: "linear" }}
            className="bg-foreground h-full"
          />
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <p className="text-caption text-muted-foreground" role="status">
          Loading your workspace…
        </p>
        <div className="flex gap-1">
          {TIPS.map((t, i) => (
            <span
              key={t.text}
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i === index ? "bg-foreground" : "bg-border-strong",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────── */

export function NollyStudioCultUiDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Drag a track to where you want it, instead of clicking it up one step at a time."
        before={<ReorderBefore />}
        after={<ReorderAfter />}
      />
      <BeforeAfter
        principle="The space you tapped grows into the details, so you can still see where you were."
        before={<ExpandBefore />}
        after={<ExpandAfter />}
      />
      <BeforeAfter
        principle="The panel grows into the next step instead of snapping to a new shape."
        before={<DrawerBefore />}
        after={<DrawerAfter />}
      />
      <BeforeAfter
        principle="Go back a tab and the page comes back from the left, the way you left it."
        before={<TabsBefore />}
        after={<TabsAfter />}
      />
      <BeforeAfter
        principle="One small pill keeps you posted, instead of a pile of notices building up."
        before={<IslandBefore />}
        after={<IslandAfter />}
      />
      <BeforeAfter
        principle="The total counts up to its new price, and nothing next to it shuffles about."
        before={<NumberBefore />}
        after={<NumberAfter />}
      />
      <BeforeAfter
        principle="Whatever is under your pointer grows, so you can see what you are about to press."
        before={<DockBefore />}
        after={<DockAfter />}
      />
      <BeforeAfter
        principle="You can see at a glance which one is winning."
        before={<PollBefore />}
        after={<PollAfter />}
      />
      <BeforeAfter
        principle="The wait tells you something useful instead of just spinning."
        before={<LoadingBefore />}
        after={<LoadingAfter />}
      />
    </div>
  );
}
