"use client";

import { FileText, Minus, Plus, RotateCw, X } from "lucide-react";
import {
  animate,
  AnimatePresence,
  motion,
  MotionConfig,
  type Transition,
  useIsPresent,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * calligraph@1.4.1 — "Fluid text transitions powered by Motion".
 *
 * The package is not a dependency here, so the component is ported from
 * its published `dist/index.js` below: the grapheme segmenter, the LCS
 * reconciler, the right-aligned digit reconciler and all three
 * renderers. Every switch on this page drives that port.
 *
 * The `before` side of each switch is the same port with exactly one
 * thing turned off — the version you get if you write the obvious code.
 * ------------------------------------------------------------------ */

type Split = "grapheme" | "codepoint";
type Align = "right" | "left";

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/** `grapheme` keeps 👨‍👩‍👧‍👦 whole; `codepoint` is the naive split. */
const cut = (s: string, split: Split): string[] =>
  split === "grapheme" && segmenter
    ? Array.from(segmenter.segment(s), (seg) => seg.segment)
    : Array.from(s);

const isDigit = (c: string) => c >= "0" && c <= "9";
const mod = (n: number, m: number) => ((n % m) + m) % m;

const DIGIT_DISTANCE = 8;

type Preset = "default" | "smooth" | "snappy" | "bouncy";

const animations: Record<Preset, Transition> = {
  default: { duration: 0.38, ease: [0.19, 1, 0.22, 1] },
  smooth: { type: "spring", duration: 0.4, bounce: 0 },
  snappy: { type: "spring", duration: 0.35, bounce: 0.15 },
  bouncy: { type: "spring", duration: 0.5, bounce: 0.3 },
};

/** Longest common subsequence — which characters survive the change. */
function computeLCS(oldSegs: string[], newSegs: string[]): [number, number][] {
  const m = oldSegs.length;
  const n = newSegs.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      if (i === 0 || j === 0) dp[i][j] = 0;
      else if (oldSegs[i - 1] === newSegs[j - 1])
        dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const pairs: [number, number][] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (oldSegs[i - 1] === newSegs[j - 1]) {
      pairs.push([i - 1, j - 1]);
      i--;
      j--;
    } else if (
      dp[i - 1][j] > dp[i][j - 1] ||
      (dp[i - 1][j] === dp[i][j - 1] && i >= j)
    ) {
      i--;
    } else {
      j--;
    }
  }
  pairs.reverse();
  return pairs;
}

function reconcileTextKeys(
  prevText: string,
  newText: string,
  prevKeys: string[],
  nextId: number,
  split: Split,
) {
  const prevSegs = cut(prevText, split);
  const newSegs = cut(newText, split);
  const matches = computeLCS(prevSegs, newSegs);
  const newKeys: string[] = new Array(newSegs.length).fill("");
  for (const [oldIdx, newIdx] of matches) newKeys[newIdx] = prevKeys[oldIdx];
  let id = nextId;
  let newCount = 0;
  for (let k = 0; k < newKeys.length; k++) {
    if (!newKeys[k]) {
      newKeys[k] = `c${id++}`;
      newCount++;
    }
  }
  const keptCount = newSegs.length - newCount;
  const removedCount = prevSegs.length - keptCount;
  const maxLen = Math.max(newSegs.length, prevSegs.length);
  return {
    keys: newKeys,
    changeRatio: maxLen > 0 ? (newCount + removedCount) / maxLen : 1,
    nextId: id,
  };
}

const toNum = (s: string) => parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;

const firstDigitIndex = (arr: string[]) => {
  const idx = arr.findIndex((c) => isDigit(c));
  return idx === -1 ? arr.length : idx;
};

/**
 * Right-aligned key reconciler: both digit bodies are left-padded before
 * they are compared, so the ones column stays the ones column and only
 * the digits that really changed take a new key.
 *
 * `align: "left"` is the obvious version — compare index 0 with index 0 —
 * which re-keys the whole number the moment it grows a digit.
 */
function reconcileDigitKeys(
  prevText: string,
  newText: string,
  prevKeys: number[],
  nextId: number,
  align: Align,
) {
  const direction = Math.sign(toNum(newText) - toNum(prevText));
  const oldChars = cut(prevText, "grapheme");
  const newChars = cut(newText, "grapheme");
  let id = nextId;

  if (align === "left") {
    const keys = newChars.map((c, i) =>
      i < oldChars.length && c === oldChars[i] ? prevKeys[i] : id++,
    );
    return { keys, direction, nextId: id };
  }

  const newPrefixLen = firstDigitIndex(newChars);
  const oldPrefixLen = firstDigitIndex(oldChars);
  const minPrefix = Math.min(newPrefixLen, oldPrefixLen);
  const newKeys: number[] = new Array(newChars.length);
  for (let i = 0; i < newPrefixLen; i++) {
    newKeys[i] =
      i < minPrefix && newChars[i] === oldChars[i] ? prevKeys[i] : id++;
  }
  const oldBody = oldChars.slice(oldPrefixLen);
  const newBody = newChars.slice(newPrefixLen);
  const oldBodyKeys = prevKeys.slice(oldPrefixLen);
  const maxBodyLen = Math.max(oldBody.length, newBody.length);
  const padOld: string[] = [
    ...Array(Math.max(0, maxBodyLen - oldBody.length)).fill(""),
    ...oldBody,
  ];
  const padNew: string[] = [
    ...Array(Math.max(0, maxBodyLen - newBody.length)).fill(""),
    ...newBody,
  ];
  const padKeys: number[] = [
    ...Array(Math.max(0, maxBodyLen - oldBodyKeys.length)).fill(-1),
    ...oldBodyKeys,
  ];
  const bodyOffset = maxBodyLen - newBody.length;
  for (let i = 0; i < newBody.length; i++) {
    const pi = bodyOffset + i;
    newKeys[newPrefixLen + i] =
      padNew[pi] === padOld[pi] && padKeys[pi] >= 0 ? padKeys[pi] : id++;
  }
  return { keys: newKeys, direction, nextId: id };
}

type RendererCommon = {
  text: string;
  Component: React.ElementType;
  transition: Transition;
  stagger: number;
  animateInitial: boolean;
  className?: string;
};

function TextRenderer({
  text,
  Component,
  transition,
  stagger,
  animateInitial,
  className,
  driftX,
  driftY,
  trend,
  blur,
  scaleFrom,
  presence,
  split,
}: RendererCommon & {
  driftX: number;
  driftY: number;
  trend: number;
  blur: number;
  scaleFrom: number;
  presence: "popLayout" | "sync";
  split: Split;
}) {
  const graphemes = cut(text, split);
  const [nextId, setNextId] = useState(graphemes.length);
  const [prevText, setPrevText] = useState(text);
  const [charKeys, setCharKeys] = useState<string[]>(() =>
    graphemes.map((_, i) => `c${i}`),
  );
  const [changeRatio, setChangeRatio] = useState(0);

  // Derived state during render — the package's own pattern, and the only
  // one React allows for "recompute because a prop changed".
  if (text !== prevText) {
    const result = reconcileTextKeys(
      prevText,
      text,
      charKeys,
      nextId,
      split,
    );
    setNextId(result.nextId);
    setPrevText(text);
    setCharKeys(result.keys);
    setChangeRatio(result.changeRatio);
  }

  return (
    <MotionConfig transition={transition}>
      <Component
        aria-label={text}
        className={className}
        style={{ display: "inline-flex" }}
      >
        <AnimatePresence mode={presence} initial={animateInitial}>
          {graphemes.map((char, i) => {
            const key = charKeys[i] ?? `c${i}`;
            const progress =
              graphemes.length <= 1 ? 0 : i / (graphemes.length - 1);
            const offsetX = (progress - 0.5) * driftX * changeRatio;
            const offsetY = (progress - 0.5) * driftY * changeRatio;
            const trendY = trend * 8 * changeRatio;
            return (
              <motion.span
                key={key}
                aria-hidden="true"
                layout="position"
                initial={{
                  opacity: 0,
                  x: offsetX,
                  y: offsetY + trendY,
                  filter: `blur(${blur}px)`,
                  scale: scaleFrom,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  filter: "blur(0px)",
                  scale: 1,
                  transition: { delay: i * stagger },
                }}
                exit={{
                  opacity: 0,
                  x: offsetX,
                  y: offsetY - trendY,
                  filter: `blur(${blur}px)`,
                  scale: scaleFrom,
                }}
                style={{ display: "inline-block", whiteSpace: "pre" }}
              >
                {char}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </Component>
    </MotionConfig>
  );
}

function NumberRenderer({
  text,
  Component,
  transition,
  stagger,
  animateInitial,
  className,
  align,
}: RendererCommon & { align: Align }) {
  const chars = cut(text, "grapheme");
  const [nextId, setNextId] = useState(chars.length);
  const [prevText, setPrevText] = useState(text);
  const [digitKeys, setDigitKeys] = useState<number[]>(() =>
    chars.map((_, i) => i),
  );
  const [dir, setDir] = useState(1);

  if (text !== prevText) {
    const result = reconcileDigitKeys(
      prevText,
      text,
      digitKeys,
      nextId,
      align,
    );
    setNextId(result.nextId);
    setDir(result.direction);
    setDigitKeys(result.keys);
    setPrevText(text);
  }

  const prefixLen = firstDigitIndex(chars);

  return (
    <MotionConfig transition={transition}>
      <Component
        aria-label={text}
        className={className}
        style={{ display: "inline-flex", position: "relative" }}
      >
        <AnimatePresence mode="popLayout" initial={animateInitial}>
          {chars.map((char, i) => {
            const isPrefix = i < prefixLen;
            const outerKey = isPrefix
              ? `pre-${i}`
              : align === "right"
                ? `col-${chars.length - 1 - i}`
                : `col-${i}`;
            const delay = i * stagger;
            return (
              <motion.span
                key={outerKey}
                layout="position"
                initial={isPrefix ? false : { opacity: 0 }}
                animate={isPrefix ? undefined : { opacity: 1 }}
                exit={isPrefix ? undefined : { opacity: 0 }}
                style={{ display: "inline-block", position: "relative" }}
              >
                {isPrefix ? (
                  <span style={{ display: "inline-block", whiteSpace: "pre" }}>
                    {char}
                  </span>
                ) : (
                  <AnimatePresence
                    mode="popLayout"
                    initial={animateInitial}
                    propagate
                  >
                    <motion.span
                      key={digitKeys[i]}
                      aria-hidden="true"
                      initial={{
                        y: isDigit(char)
                          ? dir > 0
                            ? DIGIT_DISTANCE
                            : -DIGIT_DISTANCE
                          : 0,
                        filter: "blur(2px)",
                        scale: 0.5,
                        opacity: 0,
                      }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        filter: "blur(0px)",
                        scale: 1,
                        transition: { delay },
                      }}
                      exit={{
                        y: isDigit(char)
                          ? dir > 0
                            ? -DIGIT_DISTANCE
                            : DIGIT_DISTANCE
                          : 0,
                        opacity: 0,
                        filter: "blur(2px)",
                        scale: 0.5,
                        transition: { delay },
                      }}
                      style={{ display: "inline-block", whiteSpace: "pre" }}
                    >
                      {char}
                    </motion.span>
                  </AnimatePresence>
                )}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </Component>
    </MotionConfig>
  );
}

/** One digit's y offset, in percent, given the column's current value. */
function slotOffset(n: number, c: number) {
  let offset = mod(n - c, 10);
  if (offset > 5) offset -= 10;
  const clamped = Math.max(-1, Math.min(1, offset));
  return -clamped * 100;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const FADE_HEIGHT = "0.25em";
const FADE_MASK = `linear-gradient(to bottom, transparent 0%, black ${FADE_HEIGHT}, black calc(100% - ${FADE_HEIGHT}), transparent 100%)`;

function DigitNum({
  n,
  current,
}: {
  n: number;
  current: ReturnType<typeof useMotionValue<number>>;
}) {
  const y = useTransform(current, (c: number) => `${slotOffset(n, c)}%`);
  return (
    <motion.span
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        x: "-50%",
        display: "inline-block",
        whiteSpace: "pre",
        y,
      }}
    >
      {n}
    </motion.span>
  );
}

function SlotColumn({
  digit,
  direction,
  transition,
  delay,
  animateIn,
}: {
  digit: number;
  direction: number;
  transition: Transition;
  delay: number;
  animateIn: boolean;
}) {
  const isPresent = useIsPresent();
  const spinIn = Math.max(digit, 1);
  const startValue = animateIn ? digit - spinIn * (direction || 1) : digit;
  const current = useMotionValue(startValue);
  const [cumulative, setCumulative] = useState(digit);
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isInitial, setIsInitial] = useState(true);

  if (digit !== prevDigit) {
    const old = prevDigit;
    let diff: number;
    if (direction > 0) diff = digit >= old ? digit - old : 10 - old + digit;
    else if (direction < 0)
      diff = old >= digit ? -(old - digit) : -(10 - digit + old);
    else diff = digit - old;
    setCumulative((c) => c + diff);
    setPrevDigit(digit);
  }

  // No dependency array, exactly as published: every render re-targets the
  // spring, which is how an interrupted roll retargets instead of
  // restarting. It calls `animate`, never setState.
  useEffect(() => {
    if (!isPresent) {
      const spinOut = Math.max(digit, 1);
      animate(current, cumulative + spinOut * (direction || 1), {
        ...transition,
      });
      return;
    }
    if (isInitial) {
      setIsInitial(false);
      if (!animateIn) return;
    }
    animate(current, cumulative, { ...transition, delay });
  });

  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        verticalAlign: "top",
      }}
    >
      <span
        style={{
          visibility: "hidden",
          whiteSpace: "pre",
          display: "inline-block",
        }}
      >
        0
      </span>
      {DIGITS.map((n) => (
        <DigitNum key={n} n={n} current={current} />
      ))}
    </span>
  );
}

function SlotsRenderer({
  text,
  Component,
  transition,
  stagger,
  animateInitial,
  className,
  mask,
  align,
  lockDirection,
}: RendererCommon & {
  mask: boolean;
  align: Align;
  lockDirection: number | null;
}) {
  const chars = cut(text, "grapheme");
  const [nextId, setNextId] = useState(chars.length);
  const [prevText, setPrevText] = useState(text);
  const [digitKeys, setDigitKeys] = useState<number[]>(() =>
    chars.map((_, i) => i),
  );
  const [dir, setDir] = useState(1);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  if (text !== prevText) {
    const result = reconcileDigitKeys(
      prevText,
      text,
      digitKeys,
      nextId,
      align,
    );
    setNextId(result.nextId);
    setDir(result.direction);
    setDigitKeys(result.keys);
    setPrevText(text);
  }

  const effectiveDir = lockDirection ?? dir;
  const prefixLen = firstDigitIndex(chars);
  const digitCount = chars.filter((c) => isDigit(c)).length;
  let digitIndex = 0;

  return (
    <MotionConfig transition={transition}>
      <Component
        aria-label={text}
        className={className}
        style={{ display: "inline-flex", position: "relative" }}
      >
        <span
          style={{
            display: "inline-flex",
            paddingTop: FADE_HEIGHT,
            paddingBottom: FADE_HEIGHT,
            marginTop: `calc(-1 * ${FADE_HEIGHT})`,
            marginBottom: `calc(-1 * ${FADE_HEIGHT})`,
            maskImage: mask ? FADE_MASK : undefined,
            WebkitMaskImage: mask ? FADE_MASK : undefined,
          }}
        >
          <AnimatePresence mode="popLayout" initial={animateInitial}>
            {chars.map((char, i) => {
              const isPrefix = i < prefixLen;
              const outerKey = isPrefix
                ? `pre-${i}`
                : align === "right"
                  ? `col-${chars.length - 1 - i}`
                  : `col-${i}`;
              if (isPrefix || !isDigit(char)) {
                return (
                  <motion.span
                    key={outerKey}
                    layout="position"
                    initial={false}
                    exit={isPrefix ? undefined : { opacity: 0 }}
                    style={{ display: "inline-block", whiteSpace: "pre" }}
                  >
                    {char}
                  </motion.span>
                );
              }
              const delay = (digitCount - 1 - digitIndex) * stagger;
              digitIndex++;
              return (
                <motion.span
                  key={outerKey}
                  layout="position"
                  initial={false}
                  exit={{ opacity: 0 }}
                  style={{ display: "inline-block" }}
                >
                  <SlotColumn
                    digit={Number(char)}
                    direction={effectiveDir}
                    transition={transition}
                    delay={delay}
                    animateIn={mountedRef.current || animateInitial}
                  />
                </motion.span>
              );
            })}
          </AnimatePresence>
        </span>
      </Component>
    </MotionConfig>
  );
}

function AutoSizeWrapper({
  children,
  transition,
}: {
  children: React.ReactNode;
  transition: Transition;
}) {
  const [element, setElement] = useState<HTMLSpanElement | null>(null);
  const [width, setWidth] = useState(0);
  const ref = useCallback((node: HTMLSpanElement | null) => {
    setElement(node);
  }, []);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.ceil(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return (
    <motion.span
      animate={{ width: width > 0 ? width : "auto" }}
      transition={transition}
      style={{ display: "inline-flex" }}
    >
      <span ref={ref} style={{ display: "inline-flex" }}>
        {children}
      </span>
    </motion.span>
  );
}

type CalligraphProps = {
  children: string;
  variant?: "text" | "number" | "slots";
  animation?: Preset;
  as?: React.ElementType;
  drift?: { x?: number; y?: number };
  trend?: 1 | -1 | 0;
  stagger?: number;
  initial?: boolean;
  autoSize?: boolean;
  className?: string;
  /* Switches this page adds so each "before" can turn one thing off. */
  split?: Split;
  align?: Align;
  blur?: number;
  scaleFrom?: number;
  mask?: boolean;
  presence?: "popLayout" | "sync";
  lockDirection?: number | null;
};

function Calligraph({
  children,
  variant = "text",
  animation,
  as: Component = "span",
  drift: { x: driftX = 15, y: driftY = 0 } = {},
  trend = 0,
  stagger = 0.02,
  initial: animateInitial = false,
  autoSize = true,
  className,
  split = "grapheme",
  align = "right",
  blur = 4,
  scaleFrom = 0.85,
  mask = true,
  presence = "popLayout",
  lockDirection = null,
}: CalligraphProps) {
  const transition =
    animations[animation ?? (variant === "number" ? "snappy" : "default")];

  const common: RendererCommon = {
    text: String(children ?? ""),
    Component,
    transition,
    stagger,
    animateInitial,
    className,
  };

  let content: React.ReactNode;
  if (variant === "number") {
    content = <NumberRenderer {...common} align={align} />;
  } else if (variant === "slots") {
    content = (
      <SlotsRenderer
        {...common}
        mask={mask}
        align={align}
        lockDirection={lockDirection}
      />
    );
  } else {
    content = (
      <TextRenderer
        {...common}
        driftX={driftX}
        driftY={driftY}
        trend={trend}
        blur={blur}
        scaleFrom={scaleFrom}
        presence={presence}
        split={split}
      />
    );
  }

  if (autoSize) {
    return <AutoSizeWrapper transition={transition}>{content}</AutoSizeWrapper>;
  }
  return content;
}

/* ------------------------------------------------------------------ *
 * shared bits of interface
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const CTRL =
  "text-ui-sm ring-ring/50 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 whitespace-nowrap select-none outline-none focus-visible:ring-3";
const PRIMARY = cn(CTRL, "bg-primary text-primary-foreground");
const QUIET = cn(CTRL, "bg-secondary text-foreground");
const CHIP = cn(
  CTRL,
  "duration-fast ease-out-quart border transition-colors",
);
const ICON =
  "text-foreground ring-ring/50 grid size-9 place-items-center rounded-md outline-none focus-visible:ring-3";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ------------------------------------------------------------------ *
 * 1 — a status that changes while you are watching it
 * ------------------------------------------------------------------ */

const UPLOAD = ["Uploading", "Almost there", "Upload complete"] as const;

function UploadPair({ after }: Side) {
  const [i, setI] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const label = cancelled ? "Upload cancelled" : UPLOAD[i];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="bg-secondary grid size-10 shrink-0 place-items-center rounded-lg">
          <FileText className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-title">
            {after ? (
              <Calligraph variant="text" trend={1}>
                {label}
              </Calligraph>
            ) : (
              label
            )}
          </p>
          <p className="text-caption text-muted-foreground">
            quarterly-report.pdf · 4.2 MB
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={QUIET}
          onClick={() => setCancelled(true)}
        >
          Cancel
        </button>
        <button
          type="button"
          className={PRIMARY}
          onClick={() => {
            setCancelled(false);
            setI((v) => (v + 1) % UPLOAD.length);
          }}
        >
          Next status
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2 — a total that changes
 * ------------------------------------------------------------------ */

const UNIT = 620;

function CartPair({ after }: Side) {
  const [qty, setQty] = useState(2);
  const total = money(UNIT * qty);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-ui">Standing desk, walnut</p>
          <p className="text-caption text-muted-foreground">
            {money(UNIT)} each
          </p>
        </div>
        <div className="bg-secondary flex items-center gap-1 rounded-lg p-1">
          <button
            type="button"
            aria-label="One fewer"
            className={ICON}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="text-ui w-8 text-center tabular-nums">{qty}</span>
          <button
            type="button"
            aria-label="One more"
            className={ICON}
            onClick={() => setQty((q) => Math.min(9, q + 1))}
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t pt-4">
        <span className="text-ui text-muted-foreground">Total</span>
        <span className="text-title">
          <Calligraph variant={after ? "number" : "text"}>{total}</Calligraph>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3 — a number where only part of it changed
 * ------------------------------------------------------------------ */

const AMOUNTS = [240, 1240, 11240];

function TransferPair({ after }: Side) {
  const [amount, setAmount] = useState(240);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-caption text-muted-foreground">Send to Anna Reyes</p>
        <p className="text-title mt-1">
          <Calligraph variant="slots" align={after ? "right" : "left"}>
            {money(amount)}
          </Calligraph>
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={amount === a}
            onClick={() => setAmount(a)}
            className={cn(
              CHIP,
              amount === a
                ? "bg-feature text-feature-foreground border-transparent"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {money(a)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 4 — up and down
 * ------------------------------------------------------------------ */

function ThermostatPair({ after }: Side) {
  const [temp, setTemp] = useState(21);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-caption text-muted-foreground">Living room</p>
        <p className="text-title mt-1">
          <Calligraph variant="slots" lockDirection={after ? null : 1}>
            {`${temp}°`}
          </Calligraph>
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Cooler"
          className={cn(QUIET, "size-9 px-0")}
          onClick={() => setTemp((t) => Math.max(5, t - 1))}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Warmer"
          className={cn(QUIET, "size-9 px-0")}
          onClick={() => setTemp((t) => Math.min(30, t + 1))}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 5 — text with an emoji in it
 * ------------------------------------------------------------------ */

const PLANS = [
  "👨‍👩‍👧‍👦 Family plan",
  "🏳️‍🌈 Pride edition",
  "🇮🇪 Dublin office",
] as const;

function EmojiPair({ after }: Side) {
  const [i, setI] = useState(0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-title">
          <Calligraph variant="text" split={after ? "grapheme" : "codepoint"}>
            {PLANS[i]}
          </Calligraph>
        </p>
        <p className="text-caption text-muted-foreground mt-1">
          Renews 4 March · 4 seats
        </p>
      </div>
      <button
        type="button"
        className={PRIMARY}
        onClick={() => setI((v) => (v + 1) % PLANS.length)}
      >
        Switch plan
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 6 — the thing sitting next to changing text
 * ------------------------------------------------------------------ */

const FILTERS = [
  { id: "all", chip: "All", label: "12 files" },
  { id: "shared", chip: "Shared", label: "3 shared files" },
  { id: "starred", chip: "Starred", label: "1 starred file" },
] as const;

function FilterPair({ after }: Side) {
  const [id, setId] = useState<string>("all");
  const active = FILTERS.find((f) => f.id === id) ?? FILTERS[0];

  return (
    <div className="space-y-4">
      <div className="text-title flex flex-wrap items-center gap-2">
        <span>Showing</span>
        <Calligraph variant="text" autoSize={after}>
          {active.label}
        </Calligraph>
        <button type="button" className={QUIET} onClick={() => setId("all")}>
          <X className="size-4" aria-hidden="true" />
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={id === f.id}
            onClick={() => setId(f.id)}
            className={cn(
              CHIP,
              id === f.id
                ? "bg-feature text-feature-foreground border-transparent"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.chip}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 7 — the letters that stay
 * ------------------------------------------------------------------ */

const CONNECTION = ["Connected", "Reconnecting", "Offline"] as const;

function ConnectionPair({ after }: Side) {
  const [i, setI] = useState(0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            i === 0
              ? "bg-positive"
              : i === 1
                ? "bg-muted-foreground"
                : "bg-destructive",
          )}
        />
        <div>
          <p className="text-title">
            <Calligraph variant="text" presence={after ? "popLayout" : "sync"}>
              {CONNECTION[i]}
            </Calligraph>
          </p>
          <p className="text-caption text-muted-foreground">
            Studio link · checked just now
          </p>
        </div>
      </div>
      <button
        type="button"
        className={PRIMARY}
        onClick={() => setI((v) => (v + 1) % CONNECTION.length)}
      >
        Check again
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 8 — one movement, not twenty
 * ------------------------------------------------------------------ */

const SAVE = [
  "Saving your changes",
  "All changes saved",
  "Draft restored",
] as const;

function SavePair({ after }: Side) {
  const [i, setI] = useState(0);

  return (
    <div className="space-y-4">
      <p className="text-title">
        <Calligraph
          variant="text"
          blur={after ? 4 : 0}
          scaleFrom={after ? 0.85 : 1}
          stagger={after ? 0.02 : 0.09}
        >
          {SAVE[i]}
        </Calligraph>
      </p>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        <button
          type="button"
          className={PRIMARY}
          onClick={() => setI((v) => (v + 1) % SAVE.length)}
        >
          Save now
        </button>
        <button type="button" className={QUIET} onClick={() => setI(2)}>
          Restore draft
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 9 — the first moment you see the page
 * ------------------------------------------------------------------ */

function DashboardPair({ after }: Side) {
  const [mount, setMount] = useState(0);
  const [tick, setTick] = useState(0);

  const stats = [
    { label: "Revenue", value: money(12480 + tick * 137) },
    { label: "Sessions", value: (1204 + tick * 13).toLocaleString("en-US") },
    { label: "Active now", value: String(37 + tick) },
  ];

  return (
    <div className="space-y-4">
      <div key={mount} className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-caption text-muted-foreground">{s.label}</p>
            <p className="text-title mt-1">
              <Calligraph variant="text" initial={!after}>
                {s.value}
              </Calligraph>
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        <button
          type="button"
          className={PRIMARY}
          onClick={() => setMount((v) => v + 1)}
        >
          <RotateCw className="size-4" aria-hidden="true" />
          Reload
        </button>
        <button
          type="button"
          className={QUIET}
          onClick={() => setTick((v) => v + 1)}
        >
          New numbers
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 10 — the digits you are not meant to see
 * ------------------------------------------------------------------ */

function ListenersPair({ after }: Side) {
  const [n, setN] = useState(1284);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-caption text-muted-foreground">Live listeners</p>
        <p className="text-title">
          <Calligraph variant="slots" mask={after}>
            {n.toLocaleString("en-US")}
          </Calligraph>
        </p>
        <p className="text-caption text-muted-foreground">Peak 1,902 today</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Fewer listeners"
          className={cn(QUIET, "size-9 px-0")}
          onClick={() => setN((v) => Math.max(0, v - 37))}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="More listeners"
          className={cn(QUIET, "size-9 px-0")}
          onClick={() => setN((v) => v + 37)}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * the page
 * ------------------------------------------------------------------ */

export function CalligraphDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The status changes without the words blinking out."
        before={<UploadPair after={false} />}
        after={<UploadPair after />}
      />
      <BeforeAfter
        principle="The total counts to the new price instead of shuffling its digits sideways."
        before={<CartPair after={false} />}
        after={<CartPair after />}
      />
      <BeforeAfter
        principle="Only the part of the amount that actually changed moves."
        before={<TransferPair after={false} />}
        after={<TransferPair after />}
      />
      <BeforeAfter
        principle="Turn it down and the number rolls down."
        before={<ThermostatPair after={false} />}
        after={<ThermostatPair after />}
      />
      <BeforeAfter
        principle="The emoji stays in one piece."
        before={<EmojiPair after={false} />}
        after={<EmojiPair after />}
      />
      <BeforeAfter
        principle="The button next to the text stops jumping."
        before={<FilterPair after={false} />}
        after={<FilterPair after />}
      />
      <BeforeAfter
        principle="The letters that stay are not shoved aside first."
        before={<ConnectionPair after={false} />}
        after={<ConnectionPair after />}
      />
      <BeforeAfter
        principle="The line changes in one movement, not one letter at a time."
        before={<SavePair after={false} />}
        after={<SavePair after />}
      />
      <BeforeAfter
        principle="Press Reload: the numbers are simply there, instead of spelling themselves out first."
        before={<DashboardPair after={false} />}
        after={<DashboardPair after />}
      />
      <BeforeAfter
        principle="You only ever see the number you are meant to see."
        before={<ListenersPair after={false} />}
        after={<ListenersPair after />}
      />
    </div>
  );
}
