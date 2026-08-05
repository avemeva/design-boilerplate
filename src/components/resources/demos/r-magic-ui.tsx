"use client";

import type { MotionValue } from "motion/react";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Cloud,
  CreditCard,
  Database,
  FileText,
  Folder,
  FolderOpen,
  Layers,
  Mail,
  MessageSquare,
  Minus,
  Moon,
  Music,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * magicui.design — the registry, shown rather than listed.
 *
 * Its llms.txt lists 77 components. Each switch below flips one piece
 * of interface between the version a normal product ships and the
 * version with one of those components on it. Nothing is installed:
 * the registry writes @keyframes and animate-* vars into globals.css,
 * so every effect here is the smallest honest re-implementation with
 * motion alone, in this file's own tokens.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const CTRL =
  "text-ui-sm ring-ring/50 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 whitespace-nowrap select-none outline-none focus-visible:ring-3";
const QUIET = cn(CTRL, "bg-secondary text-foreground");
const SOLID = cn(CTRL, "bg-primary text-primary-foreground");
const ICON = cn(CTRL, "w-9 px-0");

const INFINITE = Number.POSITIVE_INFINITY;

/* ------------------------------------------------------------------ *
 * 1 — the reviews that keep coming
 * ------------------------------------------------------------------ */

const REVIEWS = [
  { text: "Shipped the whole launch page before lunch.", who: "Ines · design lead" },
  { text: "The one library I did not have to fight.", who: "Tomas · founder" },
  { text: "Copy, paste, done. It is my code afterwards.", who: "Ada · engineer" },
  { text: "Our marketing site finally looks alive.", who: "Ruth · head of growth" },
];

function ReviewCard({ text, who }: { text: string; who: string }) {
  return (
    <figure className="bg-secondary rounded-lg p-3">
      <p className="text-ui-sm">{text}</p>
      <figcaption className="text-caption text-muted-foreground mt-1.5">
        {who}
      </figcaption>
    </figure>
  );
}

function MarqueePair({ after }: Side) {
  const y = useMotionValue(0);
  const held = useRef(false);

  useAnimationFrame((_, delta) => {
    if (!after || held.current) return;
    let next = y.get() - (delta / 1000) * (50 / 22);
    if (next <= -50) next += 50;
    y.set(next);
  });

  const shift = useMotionTemplate`${y}%`;

  if (!after) {
    return (
      <div className="h-56 overflow-hidden">
        <div className="flex flex-col gap-2">
          {REVIEWS.map((r) => (
            <ReviewCard key={r.who} {...r} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="mask-y-from-85% h-56 overflow-hidden"
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
    >
      <motion.div style={{ y: shift }} className="flex flex-col">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex flex-col gap-2 pb-2"
          >
            {REVIEWS.map((r) => (
              <ReviewCard key={r.who} {...r} />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2 — numbers that climb
 * ------------------------------------------------------------------ */

const STATS = [
  { label: "Installs this week", base: 12480, step: 317 },
  { label: "Components", base: 77, step: 1 },
  { label: "Stars", base: 18400, step: 129 },
];

function Ticker({ value, climb }: { value: number; climb: boolean }) {
  const target = useMotionValue(climb ? 0 : value);
  const eased = useSpring(target, { stiffness: 55, damping: 20, mass: 1 });
  const text = useTransform(eased, (v) => Math.round(v).toLocaleString("en-US"));

  useEffect(() => {
    target.set(value);
  }, [target, value]);

  if (!climb) {
    return (
      <span className="text-title tabular-nums">
        {value.toLocaleString("en-US")}
      </span>
    );
  }

  return (
    <span className="text-title tabular-nums">
      <span className="sr-only">{value.toLocaleString("en-US")}</span>
      <motion.span aria-hidden="true">{text}</motion.span>
    </span>
  );
}

function TickerPair({ after }: Side) {
  const [bumps, setBumps] = useState(0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="text-micro text-muted-foreground uppercase">
              {s.label}
            </p>
            <div className="mt-1">
              <Ticker value={s.base + bumps * s.step} climb={after} />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setBumps((b) => b + 1)}
        className={cn(QUIET, "mt-4")}
      >
        Refresh the figures
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3 — alerts that arrive
 * ------------------------------------------------------------------ */

const ALERTS = [
  { Icon: CreditCard, title: "Payment received", meta: "$240.00 from Kestrel" },
  { Icon: UserPlus, title: "New teammate", meta: "Ada joined the workspace" },
  { Icon: MessageSquare, title: "Comment on Launch", meta: "Ruth mentioned you" },
  { Icon: Mail, title: "Invoice sent", meta: "Northwind · March" },
  { Icon: Bell, title: "Deploy finished", meta: "main · 42 seconds" },
];

function AlertRow({ index }: { index: number }) {
  const { Icon, title, meta } = ALERTS[index % ALERTS.length];
  return (
    <div className="bg-secondary flex items-center gap-3 rounded-lg p-3">
      <span className="bg-card grid size-9 shrink-0 place-items-center rounded-lg border">
        <Icon className="text-muted-foreground size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="text-ui-sm block truncate">{title}</span>
        <span className="text-caption text-muted-foreground block truncate">
          {meta}
        </span>
      </span>
    </div>
  );
}

function AlertsPair({ after }: Side) {
  const [items, setItems] = useState(() => [2, 1, 0]);
  const next = useRef(3);

  const push = () => {
    const id = next.current;
    next.current += 1;
    setItems((prev) => [id, ...prev].slice(0, 4));
  };

  return (
    <div>
      {after ? (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((id) => (
              <motion.li
                key={id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={spring.smooth}
              >
                <AlertRow index={id} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <ul className="space-y-2">
          {items.map((id) => (
            <li key={id}>
              <AlertRow index={id} />
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={push} className={cn(QUIET, "mt-3")}>
        Send an alert
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 4 — the card that shows it is still working
 * ------------------------------------------------------------------ */

function BeamCard({ after }: Side) {
  return (
    <div className="relative overflow-hidden rounded-xl border p-4">
      {after && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <motion.rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            rx={14}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            className="stroke-accent-solid"
            initial={{ pathLength: 0.16, pathSpacing: 0.84, pathOffset: 0 }}
            animate={{ pathLength: 0.16, pathSpacing: 0.84, pathOffset: 1 }}
            transition={{ duration: 4.5, repeat: INFINITE, ease: "linear" }}
          />
        </svg>
      )}

      <p className="text-ui">Drafting the quarterly report</p>
      <p className="text-caption text-muted-foreground mt-1">
        Reading 48 documents. This usually takes a minute.
      </p>
    </div>
  );
}

function BorderBeamPair({ after }: Side) {
  return (
    <div className="space-y-2">
      <BeamCard after={after} />
      <div className="rounded-xl border p-4">
        <p className="text-ui">Last month&rsquo;s report</p>
        <p className="text-caption text-muted-foreground mt-1">
          Finished on 2 April · 18 pages
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 5 — the dock that leans toward you
 * ------------------------------------------------------------------ */

const DOCK = [
  { id: "files", label: "Files", Icon: Folder },
  { id: "mail", label: "Mail", Icon: Mail },
  { id: "calendar", label: "Calendar", Icon: Calendar },
  { id: "music", label: "Music", Icon: Music },
  { id: "search", label: "Search", Icon: Search },
  { id: "settings", label: "Settings", Icon: Settings },
];

function DockButton({
  label,
  Icon,
  pointerX,
  magnify,
  onPress,
  open,
}: {
  label: string;
  Icon: typeof Folder;
  pointerX: MotionValue<number>;
  magnify: boolean;
  onPress: () => void;
  open: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(pointerX, (x) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return 999;
    return x - (box.left + box.width / 2);
  });
  const raw = useTransform(distance, [-120, 0, 120], [44, 76, 44]);
  const size = useSpring(raw, { stiffness: 320, damping: 26, mass: 0.6 });

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={open}
      onClick={onPress}
      style={magnify ? { width: size, height: size } : undefined}
      className={cn(
        "bg-card ring-ring/50 grid size-11 shrink-0 place-items-center rounded-xl border outline-none focus-visible:ring-3",
        open && "border-border-strong",
      )}
    >
      <Icon className="text-muted-foreground size-5" aria-hidden="true" />
    </motion.button>
  );
}

function DockPair({ after }: Side) {
  const pointerX = useMotionValue(INFINITE);
  const [open, setOpen] = useState("files");

  return (
    <div>
      <p className="text-ui-sm text-muted-foreground mb-3">{open} is open</p>
      <div
        onPointerMove={(e) => pointerX.set(e.clientX)}
        onPointerLeave={() => pointerX.set(INFINITE)}
        className="bg-secondary mx-auto flex h-24 w-max items-end gap-2 rounded-2xl border p-2"
      >
        {DOCK.map((d) => (
          <DockButton
            key={d.id}
            label={d.label}
            Icon={d.Icon}
            pointerX={pointerX}
            magnify={after}
            open={open === d.label}
            onPress={() => setOpen(d.label)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 6 — how much is left
 * ------------------------------------------------------------------ */

function GaugePair({ after }: Side) {
  const [pct, setPct] = useState(62);
  const step = (n: number) => setPct((p) => Math.min(100, Math.max(0, p + n)));

  return (
    <div className="flex flex-wrap items-center justify-between gap-6">
      {after ? (
        <div className="relative grid size-32 place-items-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute size-32 -rotate-90"
          >
            <circle
              cx="50"
              cy="50"
              r="43"
              fill="none"
              strokeWidth={8}
              className="stroke-secondary"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="43"
              fill="none"
              strokeWidth={8}
              strokeLinecap="round"
              className="stroke-accent-solid"
              initial={false}
              animate={{ pathLength: pct / 100 }}
              transition={spring.smooth}
            />
          </svg>
          <span className="text-title relative tabular-nums">{pct}%</span>
        </div>
      ) : (
        <div className="min-w-56 flex-1">
          <p className="text-title tabular-nums">{pct}%</p>
          <div className="bg-secondary mt-2 h-2 overflow-hidden rounded-full">
            <div
              className="bg-accent-solid h-2 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div>
        <p className="text-micro text-muted-foreground uppercase">
          Photos backed up
        </p>
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            aria-label="Back up ten percent less"
            onClick={() => step(-12)}
            className={ICON}
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Back up ten percent more"
            onClick={() => step(12)}
            className={ICON}
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 7 — which way the data is going
 * ------------------------------------------------------------------ */

const SOURCES = [
  { id: "pay", label: "Payments", Icon: CreditCard },
  { id: "mail", label: "Inbox", Icon: Mail },
  { id: "store", label: "Storage", Icon: Database },
];

const BEAMS = [
  "M 110 28 C 160 28, 160 88, 210 88",
  "M 110 88 L 210 88",
  "M 110 148 C 160 148, 160 88, 210 88",
];

function BeamNode({
  label,
  Icon,
}: {
  label: string;
  Icon: typeof Mail;
}) {
  return (
    <span className="bg-card flex items-center gap-2 rounded-lg border px-2.5 py-2">
      <Icon className="text-muted-foreground size-4" aria-hidden="true" />
      <span className="text-caption">{label}</span>
    </span>
  );
}

function AnimatedBeamPair({ after }: Side) {
  return (
    <div className="bg-secondary relative h-44 rounded-xl">
      <svg
        aria-hidden="true"
        viewBox="0 0 320 176"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        {BEAMS.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="stroke-border-strong"
          />
        ))}
        {after &&
          BEAMS.map((d, i) => (
            <motion.path
              key={`beam-${d}`}
              d={d}
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-accent-solid"
              initial={{ pathLength: 0.2, pathSpacing: 0.8, pathOffset: 0 }}
              animate={{ pathLength: 0.2, pathSpacing: 0.8, pathOffset: 1 }}
              transition={{
                duration: 2.4,
                repeat: INFINITE,
                ease: "linear",
                delay: i * 0.5,
              }}
            />
          ))}
      </svg>

      {SOURCES.map((s, i) => (
        <div
          key={s.id}
          className="absolute left-3 -translate-y-1/2"
          style={{ top: `${16 + i * 34}%` }}
        >
          <BeamNode label={s.label} Icon={s.Icon} />
        </div>
      ))}

      <div className="absolute top-1/2 right-3 -translate-y-1/2">
        <span className="bg-feature text-feature-foreground flex items-center gap-2 rounded-lg px-2.5 py-2">
          <Sparkles className="size-4" aria-hidden="true" />
          <span className="text-caption">Your app</span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 8 — the pieces that circle the middle
 * ------------------------------------------------------------------ */

const INNER = [Zap, Cloud, Layers];
const OUTER = [Star, MessageSquare, Calendar, Database];

function Ring({
  items,
  spin,
  seconds,
  reverse,
  className,
}: {
  items: (typeof Zap)[];
  spin: boolean;
  seconds: number;
  reverse?: boolean;
  className: string;
}) {
  return (
    <div
      className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed",
        className,
      )}
    >
      {items.map((Icon, i) => {
        const start = (360 / items.length) * i;
        const end = start + (reverse ? -360 : 360);
        return (
          <motion.div
            key={`${seconds}-${i}`}
            className="absolute inset-0"
            initial={{ rotate: start }}
            animate={spin ? { rotate: end } : { rotate: start }}
            transition={
              spin
                ? { duration: seconds, repeat: INFINITE, ease: "linear" }
                : { duration: 0 }
            }
          >
            <motion.span
              className="bg-card absolute top-0 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border"
              initial={{ rotate: -start }}
              animate={spin ? { rotate: -end } : { rotate: -start }}
              transition={
                spin
                  ? { duration: seconds, repeat: INFINITE, ease: "linear" }
                  : { duration: 0 }
              }
            >
              <Icon className="text-muted-foreground size-4" aria-hidden="true" />
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}

function OrbitPair({ after }: Side) {
  return (
    <div className="relative h-64">
      <Ring items={INNER} spin={after} seconds={18} className="size-32" />
      <Ring
        items={OUTER}
        spin={after}
        seconds={28}
        reverse
        className="size-56"
      />
      <span className="bg-feature text-feature-foreground absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 9 — the card that lights up under the pointer
 * ------------------------------------------------------------------ */

const PLANS = [
  { name: "Hobby", price: "Free", note: "Every component, forever." },
  { name: "Pro", price: "$99", note: "Templates and the blocks." },
  { name: "Team", price: "$299", note: "Five seats, one licence." },
];

function SpotlightCard({
  after,
  plan,
}: Side & { plan: (typeof PLANS)[number] }) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const glow = useMotionTemplate`radial-gradient(150px circle at ${x}px ${y}px, var(--accent), transparent 70%)`;

  return (
    <div
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - box.left);
        y.set(e.clientY - box.top);
      }}
      onPointerLeave={() => {
        x.set(-400);
        y.set(-400);
      }}
      className={cn(
        "relative overflow-hidden rounded-xl border p-4",
        !after && "duration-fast ease-out-quart transition-colors hover:bg-secondary",
      )}
    >
      {after && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{ background: glow }}
        />
      )}
      <div className="relative">
        <p className="text-micro text-muted-foreground uppercase">{plan.name}</p>
        <p className="text-title mt-1 tabular-nums">{plan.price}</p>
        <p className="text-caption text-muted-foreground mt-1">{plan.note}</p>
        <button type="button" className={cn(QUIET, "mt-3 w-full")}>
          Choose {plan.name}
        </button>
      </div>
    </div>
  );
}

function MagicCardPair({ after }: Side) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {PLANS.map((p) => (
        <SpotlightCard key={p.name} plan={p} after={after} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 10 — the button that answers where you pressed
 * ------------------------------------------------------------------ */

type Ripple = { id: number; x: number; y: number };

function RipplePair({ after }: Side) {
  const [count, setCount] = useState(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onPointerDown={(e) => {
          if (!after) return;
          const box = e.currentTarget.getBoundingClientRect();
          const id = nextId.current;
          nextId.current += 1;
          setRipples((r) => [
            ...r,
            { id, x: e.clientX - box.left, y: e.clientY - box.top },
          ]);
        }}
        onClick={() => setCount((c) => c + 1)}
        className={cn(SOLID, "relative overflow-hidden px-5")}
      >
        {after &&
          ripples.map((r) => (
            <motion.span
              key={r.id}
              aria-hidden="true"
              className="bg-primary-foreground/30 pointer-events-none absolute size-4 rounded-full"
              style={{ left: r.x, top: r.y, marginLeft: -8, marginTop: -8 }}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 14, opacity: 0 }}
              transition={{ duration: duration.slower, ease: ease.outQuart }}
              onAnimationComplete={() =>
                setRipples((list) => list.filter((item) => item.id !== r.id))
              }
            />
          ))}
        <span className="relative">Add to basket</span>
      </button>

      <p className="text-ui-sm text-muted-foreground tabular-nums">
        {count} in the basket
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 11 — finishing feels like finishing
 * ------------------------------------------------------------------ */

const TONES = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

type Piece = { id: number; x: number; y: number; spin: number; tone: string };

function ConfettiPair({ after }: Side) {
  const [done, setDone] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const nextId = useRef(0);

  const finish = () => {
    setDone(true);
    if (!after) return;
    const burst = Array.from({ length: 22 }, (_, i) => {
      const angle = (-90 + (Math.random() * 140 - 70)) * (Math.PI / 180);
      const reach = 70 + Math.random() * 110;
      const id = nextId.current;
      nextId.current += 1;
      return {
        id,
        x: Math.cos(angle) * reach,
        y: Math.sin(angle) * reach,
        spin: Math.random() * 540 - 270,
        tone: TONES[i % TONES.length],
      };
    });
    setPieces(burst);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-1/2">
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              aria-hidden="true"
              className={cn("absolute size-2 rounded-xs", p.tone)}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{ x: p.x, y: p.y + 60, rotate: p.spin, opacity: 0 }}
              transition={{ duration: 1, ease: ease.outQuart }}
              onAnimationComplete={() =>
                setPieces((list) => list.filter((item) => item.id !== p.id))
              }
            />
          ))}
        </span>

        <button
          type="button"
          onClick={() => (done ? setDone(false) : finish())}
          className={done ? QUIET : SOLID}
        >
          {done ? (
            <>
              <Check className="text-positive size-4" aria-hidden="true" />
              Done — start over
            </>
          ) : (
            "Finish the checklist"
          )}
        </button>
      </div>

      <p className="text-ui-sm text-muted-foreground">
        Last item: hand over the launch page
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 12 — the video opens out of the picture
 * ------------------------------------------------------------------ */

function Frame({ label }: { label: string }) {
  return (
    <span className="bg-chart-2 flex size-full items-end rounded-lg p-3">
      <span className="text-caption text-primary-foreground">{label}</span>
    </span>
  );
}

function VideoDialogPair({ after }: Side) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-secondary relative h-64 overflow-hidden rounded-xl p-4">
      <div className="flex h-full items-center gap-4">
        <button
          type="button"
          aria-label="Play the two minute tour"
          onClick={() => setOpen(true)}
          className="ring-ring/50 relative h-28 w-44 shrink-0 rounded-lg outline-none focus-visible:ring-3"
        >
          {after ? (
            <motion.span layoutId="mu-video" className="absolute inset-0 block">
              <Frame label="Two minute tour" />
            </motion.span>
          ) : (
            <span className="absolute inset-0 block">
              <Frame label="Two minute tour" />
            </span>
          )}
          <span className="bg-card absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full">
            <Play className="size-4" aria-hidden="true" />
          </span>
        </button>

        <div className="min-w-0">
          <p className="text-ui">See it in two minutes</p>
          <p className="text-caption text-muted-foreground mt-1">
            Building a launch page from an empty file.
          </p>
        </div>
      </div>

      {after ? (
        <AnimatePresence>
          {open && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.base, ease: ease.outQuart }}
            >
              <button
                type="button"
                aria-label="Close the video"
                onClick={() => setOpen(false)}
                className="bg-foreground/60 absolute inset-0 cursor-default"
              />
              <motion.div
                layoutId="mu-video"
                className="absolute inset-4"
                transition={spring.smooth}
              >
                <Frame label="Playing · 0:04 / 2:11" />
              </motion.div>
              <button
                type="button"
                aria-label="Close the video"
                onClick={() => setOpen(false)}
                className={cn(ICON, "bg-card absolute top-6 right-6")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        open && (
          <div className="absolute inset-0">
            <button
              type="button"
              aria-label="Close the video"
              onClick={() => setOpen(false)}
              className="bg-foreground/60 absolute inset-0 cursor-default"
            />
            <div className="absolute inset-4">
              <Frame label="Playing · 0:04 / 2:11" />
            </div>
            <button
              type="button"
              aria-label="Close the video"
              onClick={() => setOpen(false)}
              className={cn(ICON, "bg-card absolute top-6 right-6")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 13 — a closer look without leaving the page
 * ------------------------------------------------------------------ */

const SEAT_ROWS = ["A", "B", "C", "D", "E", "F"];
const SEAT_COLS = Array.from({ length: 14 }, (_, i) => i);

function SeatMap() {
  return (
    <div className="space-y-2">
      <div className="bg-border-strong mx-auto h-1.5 w-2/3 rounded-full" />
      <p className="text-micro text-muted-foreground text-center uppercase">
        Screen
      </p>
      <div className="space-y-1.5">
        {SEAT_ROWS.map((row, r) => (
          <div key={row} className="flex items-center justify-center gap-1.5">
            <span className="text-micro text-muted-foreground w-3">{row}</span>
            {SEAT_COLS.map((c) => {
              const taken = (r * 7 + c * 3) % 5 === 0;
              return (
                <span
                  key={c}
                  className={cn(
                    "size-3 rounded-xs",
                    taken ? "bg-border-strong" : "bg-accent",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function LensPair({ after }: Side) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [inside, setInside] = useState(false);

  /* The clip is applied before the 2x transform, so 30px of local
   * radius is the 60px lens the visitor actually sees. */
  const clip = useMotionTemplate`circle(30px at ${x}px ${y}px)`;
  const origin = useMotionTemplate`${x}px ${y}px`;

  return (
    <div>
      <div
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - box.left);
          y.set(e.clientY - box.top);
        }}
        onPointerEnter={() => setInside(true)}
        onPointerLeave={() => setInside(false)}
        className="bg-secondary relative overflow-hidden rounded-xl p-4"
      >
        <SeatMap />

        {after && (
          <>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 p-4"
              style={{ clipPath: clip, transformOrigin: origin, scale: 2 }}
              animate={{ opacity: inside ? 1 : 0 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
            >
              <div className="bg-secondary absolute inset-0" />
              <div className="relative">
                <SeatMap />
              </div>
            </motion.div>
            <motion.span
              aria-hidden="true"
              className="border-border-strong pointer-events-none absolute top-0 left-0 size-30 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{ x, y }}
              animate={{ opacity: inside ? 1 : 0 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
            />
          </>
        )}
      </div>

      <p className="text-caption text-muted-foreground mt-2">
        Grey seats are taken.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 14 — fold away what you are not working on
 * ------------------------------------------------------------------ */

const TREE = [
  { folder: "app", files: ["layout.tsx", "page.tsx", "globals.css"] },
  { folder: "components", files: ["dock.tsx", "marquee.tsx", "ticker.tsx"] },
  { folder: "lib", files: ["utils.ts"] },
];

const FLAT = TREE.flatMap((t) => t.files.map((f) => `${t.folder}/${f}`));

function FileRow({
  name,
  active,
  onSelect,
  indent,
}: {
  name: string;
  active: boolean;
  onSelect: () => void;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "text-ui-sm flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left",
        indent && "pl-7",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary",
      )}
    >
      <FileText className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{name}</span>
    </button>
  );
}

function FileTreePair({ after }: Side) {
  const [open, setOpen] = useState<string[]>(["components"]);
  const [file, setFile] = useState("components/marquee.tsx");

  const toggle = (folder: string) =>
    setOpen((list) =>
      list.includes(folder)
        ? list.filter((f) => f !== folder)
        : [...list, folder],
    );

  if (!after) {
    return (
      <div className="space-y-0.5">
        {FLAT.map((path) => (
          <FileRow
            key={path}
            name={path}
            active={file === path}
            onSelect={() => setFile(path)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {TREE.map((node) => {
        const isOpen = open.includes(node.folder);
        return (
          <div key={node.folder}>
            <button
              type="button"
              onClick={() => toggle(node.folder)}
              aria-expanded={isOpen}
              className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left"
            >
              <motion.span
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                className="grid place-items-center"
              >
                <ChevronRight
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
              </motion.span>
              {isOpen ? (
                <FolderOpen
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
              ) : (
                <Folder
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
              )}
              {node.folder}
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: duration.base, ease: ease.outQuart }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pt-0.5">
                    {node.files.map((f) => {
                      const path = `${node.folder}/${f}`;
                      return (
                        <FileRow
                          key={path}
                          name={f}
                          indent
                          active={file === path}
                          onSelect={() => setFile(path)}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 15 — you can tell there is more below
 * ------------------------------------------------------------------ */

const NOTES = [
  { v: "1.9", note: "Dock now magnifies on touch as well as pointer." },
  { v: "1.8", note: "Marquee holds still while you are reading it." },
  { v: "1.7", note: "Number ticker respects reduced motion." },
  { v: "1.6", note: "Border beam runs at a steadier speed." },
  { v: "1.5", note: "Orbiting circles keep their labels upright." },
  { v: "1.4", note: "Lens follows a finger, not just a mouse." },
];

function ProgressiveBlurPair({ after }: Side) {
  const [atEnd, setAtEnd] = useState(false);

  return (
    <div className="relative">
      <div
        onScroll={(e) => {
          const el = e.currentTarget;
          setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
        }}
        className="bg-secondary h-48 overflow-y-auto rounded-xl p-4"
      >
        <div className="space-y-3">
          {NOTES.map((n) => (
            <div key={n.v}>
              <p className="text-micro text-muted-foreground uppercase">
                Version {n.v}
              </p>
              <p className="text-ui-sm mt-0.5">{n.note}</p>
            </div>
          ))}
        </div>
      </div>

      {after && (
        <motion.div
          aria-hidden="true"
          className="from-secondary pointer-events-none absolute inset-x-0 bottom-0 h-14 rounded-b-xl bg-linear-to-t to-transparent backdrop-blur-xs"
          animate={{ opacity: atEnd ? 0 : 1 }}
          transition={{ duration: duration.base, ease: ease.outQuart }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 16 — the new look spreads out from the button
 * ------------------------------------------------------------------ */

function ThemePreview({ dark }: { dark: boolean }) {
  return (
    <div
      className={cn(
        "size-full p-4",
        dark ? "bg-feature text-feature-foreground" : "bg-secondary text-foreground",
      )}
    >
      <p className="text-ui">Reading list</p>
      <p
        className={cn(
          "text-caption mt-1",
          dark ? "text-feature-foreground/70" : "text-muted-foreground",
        )}
      >
        Four saved articles, none of them finished.
      </p>
      <div className="mt-4 space-y-2">
        {["Designing for the second thousandth use", "Motion that nobody notices"].map(
          (title) => (
            <div
              key={title}
              className={cn(
                "text-ui-sm rounded-lg border px-3 py-2",
                dark ? "border-feature-line" : "bg-card",
              )}
            >
              {title}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function ThemeTogglerPair({ after }: Side) {
  const [dark, setDark] = useState(false);
  const [wipe, setWipe] = useState<{ x: number; y: number; r: number } | null>(
    null,
  );
  const box = useRef<HTMLDivElement>(null);

  const flip = (e: MouseEvent<HTMLButtonElement>) => {
    const outer = box.current?.getBoundingClientRect();
    if (!after || !outer) {
      setDark((d) => !d);
      return;
    }
    const b = e.currentTarget.getBoundingClientRect();
    const cx = b.left + b.width / 2 - outer.left;
    const cy = b.top + b.height / 2 - outer.top;
    const r = Math.hypot(
      Math.max(cx, outer.width - cx),
      Math.max(cy, outer.height - cy),
    );
    setWipe({ x: cx, y: cy, r });
    setDark((d) => !d);
  };

  const settled = wipe ? !dark : dark;

  return (
    <div
      ref={box}
      className="relative h-48 overflow-hidden rounded-xl border"
    >
      <ThemePreview dark={settled} />

      {wipe && (
        <motion.div
          className="absolute inset-0"
          initial={{ clipPath: `circle(0px at ${wipe.x}px ${wipe.y}px)` }}
          animate={{ clipPath: `circle(${wipe.r}px at ${wipe.x}px ${wipe.y}px)` }}
          transition={{ duration: duration.slow, ease: ease.outQuart }}
          onAnimationComplete={() => setWipe(null)}
        >
          <ThemePreview dark={dark} />
        </motion.div>
      )}

      <button
        type="button"
        aria-label={dark ? "Switch to the light look" : "Switch to the dark look"}
        onClick={flip}
        className={cn(ICON, "bg-card text-foreground absolute top-3 right-3")}
      >
        {dark ? (
          <Sun className="size-4" aria-hidden="true" />
        ) : (
          <Moon className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function MagicUiDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The reviews keep coming, and they hold still when you point at one."
        before={<MarqueePair after={false} />}
        after={<MarqueePair after />}
      />
      <BeforeAfter
        principle="You can watch the numbers climb, so you notice they moved."
        before={<TickerPair after={false} />}
        after={<TickerPair after />}
      />
      <BeforeAfter
        principle="A new alert slides in at the top instead of the list jumping."
        before={<AlertsPair after={false} />}
        after={<AlertsPair after />}
      />
      <BeforeAfter
        principle="You can tell which one is still being worked on."
        before={<BorderBeamPair after={false} />}
        after={<BorderBeamPair after />}
      />
      <BeforeAfter
        principle="The icons come out to meet your pointer, so the small ones are easy to hit."
        before={<DockPair after={false} />}
        after={<DockPair after />}
      />
      <BeforeAfter
        principle="You can see how much is left in one look."
        before={<GaugePair after={false} />}
        after={<GaugePair after />}
      />
      <BeforeAfter
        principle="You can see which way things are actually moving."
        before={<AnimatedBeamPair after={false} />}
        after={<AnimatedBeamPair after />}
      />
      <BeforeAfter
        principle="TODO: plain-language principle."
        before={<OrbitPair after={false} />}
        after={<OrbitPair after />}
      />
      <BeforeAfter
        principle="The card lights up right where your pointer is."
        before={<MagicCardPair after={false} />}
        after={<MagicCardPair after />}
      />
      <BeforeAfter
        principle="The button answers exactly where you pressed it."
        before={<RipplePair after={false} />}
        after={<RipplePair after />}
      />
      <BeforeAfter
        principle="Finishing something feels like finishing something."
        before={<ConfettiPair after={false} />}
        after={<ConfettiPair after />}
      />
      <BeforeAfter
        principle="The video opens out of the picture you pressed."
        before={<VideoDialogPair after={false} />}
        after={<VideoDialogPair after />}
      />
      <BeforeAfter
        principle="You can get a closer look without leaving the page."
        before={<LensPair after={false} />}
        after={<LensPair after />}
      />
      <BeforeAfter
        principle="You can fold away the parts you are not working on."
        before={<FileTreePair after={false} />}
        after={<FileTreePair after />}
      />
      <BeforeAfter
        principle="You can tell there is more below."
        before={<ProgressiveBlurPair after={false} />}
        after={<ProgressiveBlurPair after />}
      />
      <BeforeAfter
        principle="The new look spreads out from the button you pressed."
        before={<ThemeTogglerPair after={false} />}
        after={<ThemeTogglerPair after />}
      />
    </div>
  );
}
