"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { Bookmark, Copy, Link2, Plus, Share2 } from "lucide-react";
import { useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * fancycomponents.dev — the registry, shown rather than listed.
 *
 * Each switch flips one piece of interface between the plain version
 * and the version with one of the library's effects on it. The registry
 * itself is not installed (its physics items pull matter-js and friends,
 * and shadcn only writes those into package.json), so every effect here
 * is the smallest honest re-implementation with motion alone.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const CTRL =
  "text-ui-sm ring-ring/50 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 whitespace-nowrap select-none outline-none focus-visible:ring-3";
const QUIET = cn(CTRL, "bg-secondary text-foreground");

/* ------------------------------------------------------------------ *
 * 1 — number ticker
 * ------------------------------------------------------------------ */

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function RollingDigit({ digit }: { digit: string }) {
  return (
    <span className="relative inline-block h-8 overflow-hidden leading-8 tabular-nums">
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        animate={{ y: `${-Number(digit) * 10}%` }}
        transition={spring.smooth}
      >
        {DIGITS.map((d) => (
          <span key={d} className="h-8 leading-8">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function Money({ value, roll }: { value: number; roll: boolean }) {
  const text = value.toLocaleString("en-US");

  if (!roll) {
    return <span className="text-title tabular-nums">${text}</span>;
  }

  return (
    <span className="text-title inline-flex leading-8 tabular-nums">
      <span className="sr-only">${text}</span>
      <span aria-hidden="true" className="inline-flex">
        <span className="h-8 leading-8">$</span>
        {text.split("").map((char, i) =>
          char >= "0" && char <= "9" ? (
            <RollingDigit key={i} digit={char} />
          ) : (
            <span key={i} className="h-8 leading-8">
              {char}
            </span>
          ),
        )}
      </span>
    </span>
  );
}

function TickerPair({ after }: Side) {
  const [total, setTotal] = useState(12480);

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-micro text-muted-foreground uppercase">
          Revenue today
        </p>
        <div className="mt-1">
          <Money value={total} roll={after} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setTotal((t) => t + 137 + Math.floor(Math.random() * 900))}
        className={QUIET}
      >
        Record a sale
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2 — rotating word
 * ------------------------------------------------------------------ */

const ROLES = ["designers", "engineers", "tinkerers", "founders"];

function RotatePair({ after }: Side) {
  const [i, setI] = useState(0);
  const word = ROLES[i % ROLES.length];

  return (
    <div>
      <p className="text-title flex flex-wrap items-center gap-x-2">
        <span>Made for</span>
        {after ? (
          <motion.span
            layout
            transition={spring.snappy}
            className="bg-secondary inline-flex overflow-hidden rounded-lg px-2 py-0.5"
          >
            <span className="sr-only">{word}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={word}
                aria-hidden="true"
                className="inline-flex"
                initial="hidden"
                animate="visible"
                exit="gone"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.028 } },
                  gone: { transition: { staggerChildren: 0.018 } },
                }}
              >
                {word.split("").map((char, idx) => (
                  <motion.span
                    key={idx}
                    className="inline-block"
                    variants={{
                      hidden: { y: "110%", opacity: 0 },
                      visible: { y: "0%", opacity: 1 },
                      gone: { y: "-110%", opacity: 0 },
                    }}
                    transition={{
                      duration: duration.base,
                      ease: ease.outQuart,
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        ) : (
          <span className="bg-secondary inline-flex rounded-lg px-2 py-0.5">
            {word}
          </span>
        )}
      </p>

      <button
        type="button"
        onClick={() => setI((n) => n + 1)}
        className={cn(QUIET, "mt-4")}
      >
        Next
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3 — letters that answer the pointer
 * ------------------------------------------------------------------ */

const NAV = ["Work", "Studio", "Journal", "Contact"];

function SwapLabel({ text, lifted }: { text: string; lifted: boolean }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {text.split("").map((char, i) => (
          <span
            key={i}
            className="relative inline-block h-5 overflow-hidden leading-5"
          >
            <span className="invisible">{char}</span>
            <motion.span
              className="absolute inset-x-0 top-0 flex flex-col"
              animate={{ y: lifted ? "-50%" : "0%" }}
              transition={{
                delay: i * 0.022,
                duration: duration.base,
                ease: ease.outQuart,
              }}
            >
              <span className="h-5 leading-5">{char}</span>
              <span className="h-5 leading-5">{char}</span>
            </motion.span>
          </span>
        ))}
      </span>
    </>
  );
}

function LetterSwapPair({ after }: Side) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {NAV.map((item) => (
        <button
          key={item}
          type="button"
          onPointerEnter={() => setActive(item)}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(item)}
          onBlur={() => setActive(null)}
          className={cn(
            CTRL,
            "text-muted-foreground duration-fast ease-out-quart transition-colors hover:text-foreground focus-visible:text-foreground",
          )}
        >
          {after ? (
            <SwapLabel text={item} lifted={active === item} />
          ) : (
            item
          )}
        </button>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ *
 * 4 — underline that fills in
 * ------------------------------------------------------------------ */

function FillLink({ text }: { text: string }) {
  const [on, setOn] = useState(false);

  return (
    <button
      type="button"
      onPointerEnter={() => setOn(true)}
      onPointerLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      className="ring-ring/50 relative inline-block rounded-xs px-0.5 align-baseline outline-none focus-visible:ring-3"
    >
      <motion.span
        aria-hidden="true"
        className="bg-primary absolute inset-x-0 bottom-0 origin-bottom rounded-xs"
        initial={false}
        animate={{ height: on ? "100%" : "2px" }}
        transition={{ duration: duration.base, ease: ease.outQuart }}
      />
      <span
        className={cn(
          "duration-fast ease-out-quart relative transition-colors",
          on ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {text}
      </span>
    </button>
  );
}

function UnderlinePair({ after }: Side) {
  return (
    <p className="text-body text-muted-foreground max-w-prose">
      Everything here is copy and paste. Start with the{" "}
      {after ? (
        <FillLink text="installation guide" />
      ) : (
        <button
          type="button"
          className="text-foreground underline decoration-1 underline-offset-2 hover:text-muted-foreground"
        >
          installation guide
        </button>
      )}
      , then pick an effect from the{" "}
      {after ? (
        <FillLink text="component list" />
      ) : (
        <button
          type="button"
          className="text-foreground underline decoration-1 underline-offset-2 hover:text-muted-foreground"
        >
          component list
        </button>
      )}{" "}
      and drop it straight into a page.
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * 5 — the marker stroke
 * ------------------------------------------------------------------ */

function HighlightPair({ after }: Side) {
  const [on, setOn] = useState(false);

  return (
    <div>
      <p className="text-body max-w-prose">
        We shipped it on a Friday and{" "}
        <span className="relative inline-block px-1">
          <motion.span
            aria-hidden="true"
            className="bg-accent absolute inset-0 origin-left rounded-xs"
            initial={false}
            animate={{ scaleX: on ? 1 : 0 }}
            transition={
              after
                ? { duration: duration.slow, ease: ease.outQuart }
                : { duration: 0 }
            }
          />
          <span className="relative">nobody noticed the change</span>
        </span>{" "}
        until they used it.
      </p>

      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        className={cn(QUIET, "mt-4")}
      >
        {on ? "Clear the marker" : "Mark the line"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 6 — a code that lands letter by letter
 * ------------------------------------------------------------------ */

const POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;

function makeCode() {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += POOL[Math.floor(Math.random() * POOL.length)];
  }
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

function ScramblePair({ after }: Side) {
  const [shown, setShown] = useState("·····-·····");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const generate = () => {
    const target = makeCode();
    if (timer.current) clearInterval(timer.current);

    if (!after) {
      setShown(target);
      return;
    }

    let frame = 0;
    timer.current = setInterval(() => {
      frame += 1;
      const settled = Math.floor(frame / 2);
      setShown(
        target
          .split("")
          .map((char, i) => {
            if (i < settled || char === "-") return char;
            return POOL[Math.floor(Math.random() * POOL.length)];
          })
          .join(""),
      );
      if (settled >= target.length && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
        setShown(target);
      }
    }, 40);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-ui bg-secondary flex h-9 items-center rounded-lg px-3 font-mono tracking-widest tabular-nums">
        {shown}
      </span>
      <button type="button" onClick={generate} className={QUIET}>
        New invite code
      </button>
      <button
        type="button"
        aria-label="Copy invite code"
        className={cn(QUIET, "w-9 px-0")}
      >
        <Copy className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 7 — the answer arrives as it is written
 * ------------------------------------------------------------------ */

const REPLY =
  "Sales are up 14% on last week, mostly from the Berlin store. Two refunds are still open.";

function TypewriterPair({ after }: Side) {
  const [text, setText] = useState(REPLY);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const ask = () => {
    if (timer.current) clearInterval(timer.current);
    if (!after) {
      setText(REPLY);
      return;
    }
    setText("");
    let n = 0;
    timer.current = setInterval(() => {
      n += 1;
      setText(REPLY.slice(0, n));
      if (n >= REPLY.length && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, 22);
  };

  return (
    <div>
      <div className="flex justify-end">
        <p className="text-ui-sm bg-secondary max-w-xs rounded-2xl px-3 py-2">
          How did we do this week?
        </p>
      </div>

      <div className="mt-3 min-h-20">
        <p className="text-ui-sm text-muted-foreground max-w-prose">
          {text}
          {after && text.length > 0 && text.length < REPLY.length && (
            <motion.span
              aria-hidden="true"
              className="bg-foreground ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 rounded-xs"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8 }}
            />
          )}
        </p>
      </div>

      <button type="button" onClick={ask} className={cn(QUIET, "mt-3")}>
        Ask again
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 8 — the row that keeps coming
 * ------------------------------------------------------------------ */

const PARTNERS = [
  "Northwind",
  "Kestrel",
  "Lumen",
  "Fathom",
  "Bellwether",
  "Orchard",
  "Tessellate",
  "Halcyon",
];

function PartnerChip({ name }: { name: string }) {
  return (
    <span className="text-ui-sm text-muted-foreground bg-secondary flex h-10 shrink-0 items-center rounded-lg px-4">
      {name}
    </span>
  );
}

function MarqueePair({ after }: Side) {
  if (!after) {
    return (
      <div className="overflow-hidden">
        <div className="flex gap-2">
          {PARTNERS.map((p) => (
            <PartnerChip key={p} name={p} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mask-x-from-90% overflow-hidden">
      <motion.div
        className="flex w-max gap-2"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 22,
          ease: "linear",
        }}
      >
        {[...PARTNERS, ...PARTNERS].map((p, i) => (
          <PartnerChip key={`${p}-${i}`} name={p} />
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 9 — buttons that pull apart like liquid
 * ------------------------------------------------------------------ */

const ACTIONS = [
  { id: "share", label: "Share", Icon: Share2 },
  { id: "link", label: "Copy link", Icon: Link2 },
  { id: "save", label: "Save", Icon: Bookmark },
];

function GooeyPair({ after }: Side) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative h-32">
      <svg aria-hidden="true" className="absolute size-0">
        <defs>
          <filter id="fancy-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute bottom-0 left-0"
        style={after ? { filter: "url(#fancy-goo)" } : undefined}
      >
        {ACTIONS.map(({ id, label, Icon }, i) => (
          <motion.button
            key={id}
            type="button"
            aria-label={label}
            tabIndex={open ? 0 : -1}
            animate={{
              x: open ? (i + 1) * 66 : 0,
              scale: open ? 1 : 0.6,
              opacity: open ? 1 : 0,
            }}
            transition={{ ...spring.smooth, delay: open ? i * 0.03 : 0 }}
            className="bg-primary text-primary-foreground absolute bottom-0 left-0 grid size-12 place-items-center rounded-full"
          >
            <Icon className="size-4" aria-hidden="true" />
          </motion.button>
        ))}

        <button
          type="button"
          aria-label={open ? "Close actions" : "Open actions"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="bg-primary text-primary-foreground relative grid size-12 place-items-center rounded-full"
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={spring.snappy}
            className="grid place-items-center"
          >
            <Plus className="size-5" aria-hidden="true" />
          </motion.span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 10 — a banner that lights up under the pointer
 * ------------------------------------------------------------------ */

const PIXELS = Array.from({ length: 16 * 6 }, (_, i) => i);

function PixelTrailPair({ after }: Side) {
  return (
    <div className="bg-secondary relative h-36 overflow-hidden rounded-xl">
      {after && (
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-[repeat(16,minmax(0,1fr))] grid-rows-[repeat(6,minmax(0,1fr))]"
        >
          {PIXELS.map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1, transition: { duration: 0 } }}
              transition={{ duration: 0.6, ease: ease.outQuart }}
              className="bg-card"
            />
          ))}
        </div>
      )}

      <div className="pointer-events-none relative flex h-full flex-col justify-end p-5">
        <p className="text-title">Fancy Components</p>
        <p className="text-ui-sm text-muted-foreground">
          Move across the banner
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 11 — the line that follows you
 * ------------------------------------------------------------------ */

function ElasticLinePair({ after }: Side) {
  const box = useRef<HTMLDivElement>(null);
  const cx = useMotionValue(150);
  const cy = useMotionValue(20);
  const sx = useSpring(cx, { stiffness: 320, damping: 20, mass: 1 });
  const sy = useSpring(cy, { stiffness: 260, damping: 11, mass: 1 });
  const d = useTransform(
    [sx, sy],
    ([x, y]: number[]) => `M 0 20 Q ${x} ${y} 300 20`,
  );

  const rest = () => {
    cx.set(150);
    cy.set(20);
  };

  return (
    <div>
      <p className="text-ui-sm text-muted-foreground">Chapter one</p>

      <div
        ref={box}
        onPointerMove={(e) => {
          if (!after) return;
          const r = box.current?.getBoundingClientRect();
          if (!r) return;
          cx.set(((e.clientX - r.left) / r.width) * 300);
          cy.set((((e.clientY - r.top) / r.height) * 40 - 20) * 2 + 20);
        }}
        onPointerLeave={rest}
        className="my-2 h-10 w-full"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 300 40"
          preserveAspectRatio="none"
          className="text-border-strong h-10 w-full"
        >
          {after ? (
            <motion.path
              d={d}
              fill="none"
              className="stroke-current"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <path
              d="M 0 20 Q 150 20 300 20"
              fill="none"
              className="stroke-current"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>

      <p className="text-ui-sm text-muted-foreground">Chapter two</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 12 — a board you can shove around
 * ------------------------------------------------------------------ */

const SHOTS = [
  { id: "a", tone: "bg-chart-1", x: 4, y: 8, tilt: -4 },
  { id: "b", tone: "bg-chart-2", x: 26, y: 24, tilt: 3 },
  { id: "c", tone: "bg-chart-3", x: 48, y: 6, tilt: -2 },
  { id: "d", tone: "bg-chart-4", x: 68, y: 28, tilt: 5 },
];

function DragBoardPair({ after }: Side) {
  const board = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={board}
      className="bg-secondary relative h-48 overflow-hidden rounded-xl"
    >
      {SHOTS.map((shot) => (
        <motion.div
          key={shot.id}
          drag={after}
          dragConstraints={board}
          dragElastic={0.12}
          dragMomentum={after}
          whileDrag={{ scale: 1.06, rotate: 0 }}
          transition={spring.smooth}
          style={{
            left: `${shot.x}%`,
            top: `${shot.y}%`,
            rotate: shot.tilt,
          }}
          className={cn(
            "bg-card absolute w-24 rounded-lg border p-1.5 shadow-xs",
            after ? "cursor-grab touch-none active:cursor-grabbing" : "",
          )}
        >
          <div className={cn("h-14 rounded-md", shot.tone)} />
          <p className="text-micro text-muted-foreground mt-1.5 uppercase">
            Shot {shot.id}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 13 — the picture opens between the words
 * ------------------------------------------------------------------ */

function MediaBetweenPair({ after }: Side) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-24 items-center">
      <p className="text-title flex flex-wrap items-center gap-x-2">
        <span>We build</span>
        <motion.button
          type="button"
          aria-label={open ? "Hide the photo" : "Show the photo"}
          aria-expanded={open}
          onPointerEnter={() => after && setOpen(true)}
          onPointerLeave={() => after && setOpen(false)}
          onFocus={() => after && setOpen(true)}
          onBlur={() => after && setOpen(false)}
          onClick={() => setOpen((o) => !o)}
          animate={{ width: after ? (open ? 96 : 24) : 96 }}
          transition={spring.smooth}
          className="ring-ring/50 bg-chart-3 h-12 shrink-0 overflow-hidden rounded-lg outline-none focus-visible:ring-3"
        />
        <span>quiet interfaces</span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 14 — cards that stack instead of leaving
 * ------------------------------------------------------------------ */

const STEPS = [
  { title: "Pick an effect", note: "Thirty-nine of them, all free." },
  { title: "Paste the command", note: "One line, straight into the terminal." },
  { title: "Install the extras", note: "Physics items bring their own deps." },
  { title: "Ship it", note: "Nothing else to wire up." },
];

function StackingPair({ after }: Side) {
  return (
    <div className="bg-secondary h-56 overflow-y-auto rounded-xl p-3">
      <div className="space-y-3 pb-24">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            style={after ? { top: i * 10 } : undefined}
            className={cn(
              "bg-card rounded-xl border p-4",
              after && "sticky",
            )}
          >
            <p className="text-ui">
              <span className="text-muted-foreground tabular-nums">
                {i + 1}.
              </span>{" "}
              {step.title}
            </p>
            <p className="text-caption text-muted-foreground mt-1">
              {step.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function FancyComponentsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The total rolls up to the new number instead of blinking to it."
        before={<TickerPair after={false} />}
        after={<TickerPair after />}
      />
      <BeforeAfter
        principle="The word changes instead of being swapped behind your back."
        before={<RotatePair after={false} />}
        after={<RotatePair after />}
      />
      <BeforeAfter
        principle="The links answer when you point at them."
        before={<LetterSwapPair after={false} />}
        after={<LetterSwapPair after />}
      />
      <BeforeAfter
        principle="Point at a link and it fills in under you."
        before={<UnderlinePair after={false} />}
        after={<UnderlinePair after />}
      />
      <BeforeAfter
        principle="The marker draws across the line the way you would do it by hand."
        before={<HighlightPair after={false} />}
        after={<HighlightPair after />}
      />
      <BeforeAfter
        principle="You can watch the code being made, so you know it is new."
        before={<ScramblePair after={false} />}
        after={<ScramblePair after />}
      />
      <BeforeAfter
        principle="You can start reading before the whole answer is there."
        before={<TypewriterPair after={false} />}
        after={<TypewriterPair after />}
      />
      <BeforeAfter
        principle="Every name gets its turn instead of the last few falling off the edge."
        before={<MarqueePair after={false} />}
        after={<MarqueePair after />}
      />
      <BeforeAfter
        principle="The buttons pull apart like a drop of liquid."
        before={<GooeyPair after={false} />}
        after={<GooeyPair after />}
      />
      <BeforeAfter
        principle="Move across the banner and it lights up under you."
        before={<PixelTrailPair after={false} />}
        after={<PixelTrailPair after />}
      />
      <BeforeAfter
        principle="Run your pointer along the line and it comes with you, then snaps back."
        before={<ElasticLinePair after={false} />}
        after={<ElasticLinePair after />}
      />
      <BeforeAfter
        principle="You can shove the photos around and lay them out your way."
        before={<DragBoardPair after={false} />}
        after={<DragBoardPair after />}
      />
      <BeforeAfter
        principle="The photo opens up between the words when you point at it."
        before={<MediaBetweenPair after={false} />}
        after={<MediaBetweenPair after />}
      />
      <BeforeAfter
        principle="Each step stays on screen as you scroll to the next one."
        before={<StackingPair after={false} />}
        after={<StackingPair after />}
      />
    </div>
  );
}
