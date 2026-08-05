"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * torph.lochie.me — `<TextMorph>` v0.1.0 by Lochie Axon.
 *
 * The package is not installed here, so its matching pipeline is
 * rebuilt from the published source: Intl.Segmenter graphemes, a
 * longest-common-subsequence match over *words*, a second character
 * pass inside any word at least 40% similar to one that left, stable
 * ids carried onto the survivors, departing text lifted out of the
 * flow, and the box animating its own width.
 *
 * Every switch below turns exactly one of those stages off, so what
 * the visitor sees on "Before" is a real implementation missing one
 * real idea — not a strawman.
 * ------------------------------------------------------------------ */

type Seg = { id: string; s: string };
type Mode = { words: boolean; letters: boolean; graphemes: boolean };
type Side = { after: boolean };

const NBSP = "\u00A0";

/** Torph reserves ids so a survivor and a newcomer never collide. */
function makeTake() {
  const used = new Set<string>();
  return (base: string) => {
    if (!used.has(base)) {
      used.add(base);
      return base;
    }
    let n = 1;
    while (used.has(`${base}~${n}`)) n += 1;
    const id = `${base}~${n}`;
    used.add(id);
    return id;
  };
}

/**
 * One visible character. `Intl.Segmenter` keeps a flag, a family emoji
 * and an accented letter in one piece; the code-point fallback is what
 * a hand-rolled `Array.from(text)` gives you, and it does not.
 */
function units(text: string, graphemes: boolean): string[] {
  if (graphemes && typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(seg.segment(text), (p) => p.segment);
  }
  return Array.from(text);
}

/** Longest common subsequence, returned as matched index pairs. */
function lcsPairs(a: string[], b: string[]): [number[], number[]] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] =
        a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ai: number[] = [];
  const bi: number[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ai.push(i);
      bi.push(j);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return [ai, bi];
}

/** Torph's threshold: below 0.4 the two words are not the same word. */
const SIMILAR_ENOUGH = 0.4;

function similarity(a: string, b: string): number {
  const ua = Array.from(a);
  const ub = Array.from(b);
  if (ua.length === 0 || ub.length === 0) return 0;
  const [matched] = lcsPairs(ua, ub);
  return matched.length / Math.max(ua.length, ub.length);
}

function groupWords(segs: Seg[]): { word: string; segs: Seg[] }[] {
  const out: { word: string; segs: Seg[] }[] = [];
  let cur: Seg[] = [];
  for (const seg of segs) {
    if (seg.s === NBSP) {
      if (cur.length > 0) {
        out.push({ word: cur.map((c) => c.s).join(""), segs: cur });
        cur = [];
      }
    } else {
      cur.push(seg);
    }
  }
  if (cur.length > 0) out.push({ word: cur.map((c) => c.s).join(""), segs: cur });
  return out;
}

function fresh(text: string, mode: Mode, take: (b: string) => string): Seg[] {
  return units(text, mode.graphemes).map((u, i) => ({
    id: take(`${u}-${i}`),
    s: u === " " ? NBSP : u,
  }));
}

/**
 * Match a new string against the segments already on screen.
 *
 * `mode.words` off falls back to the naive scheme — every character
 * keyed by glyph and how many of that glyph came before it — which is
 * what most hand-written morphs do and why their letters swap places
 * across the whole line.
 */
function diff(prev: Seg[] | null, text: string, mode: Mode): Seg[] {
  if (!mode.words) {
    const seen = new Map<string, number>();
    return units(text, mode.graphemes).map((u) => {
      const n = (seen.get(u) ?? 0) + 1;
      seen.set(u, n);
      return { id: `${u}#${n}`, s: u === " " ? NBSP : u };
    });
  }

  const take = makeTake();
  if (!prev || prev.length === 0) return fresh(text, mode, take);

  const oldWords = groupWords(prev);
  const newWords = text.split(" ");

  const [oa, ob] = lcsPairs(
    oldWords.map((w) => w.word),
    newWords,
  );
  const exact = new Map<number, number>();
  for (let k = 0; k < ob.length; k += 1) exact.set(ob[k], oa[k]);
  const spoken = new Set(oa);

  // Second pass: a word that only partly changed keeps its letters.
  const near = new Map<number, number>();
  if (mode.letters) {
    const claimed = new Set<number>();
    for (let j = 0; j < newWords.length; j += 1) {
      if (exact.has(j)) continue;
      let best = -1;
      let score = SIMILAR_ENOUGH;
      for (let o = 0; o < oldWords.length; o += 1) {
        if (spoken.has(o) || claimed.has(o)) continue;
        const s = similarity(oldWords[o].word, newWords[j]);
        if (s > score) {
          score = s;
          best = o;
        }
      }
      if (best >= 0) {
        near.set(j, best);
        claimed.add(best);
      }
    }
  }

  // Reserve every id that is about to be reused, so newcomers cannot
  // accidentally land on one and steal a survivor's identity.
  for (const o of exact.values()) for (const s of oldWords[o].segs) take(s.id);
  for (const o of near.values()) for (const s of oldWords[o].segs) take(s.id);

  const out: Seg[] = [];
  let pos = 0;
  for (let j = 0; j < newWords.length; j += 1) {
    if (j > 0) {
      out.push({ id: take(`gap-${pos}`), s: NBSP });
      pos += 1;
    }
    const word = newWords[j];
    const hit = exact.get(j);
    const soft = near.get(j);

    if (hit !== undefined) {
      out.push(...oldWords[hit].segs);
    } else if (soft !== undefined) {
      const oldUnits = oldWords[soft].segs;
      const newUnits = units(word, mode.graphemes);
      const [ca, cb] = lcsPairs(
        oldUnits.map((s) => s.s),
        newUnits,
      );
      const reuse = new Map<number, Seg>();
      for (let k = 0; k < cb.length; k += 1) reuse.set(cb[k], oldUnits[ca[k]]);
      newUnits.forEach((u, k) => {
        const keep = reuse.get(k);
        out.push(keep ? { id: keep.id, s: u } : { id: take(`${u}-${pos + k}`), s: u });
      });
    } else {
      units(word, mode.graphemes).forEach((u, k) => {
        out.push({ id: take(`${u}-${pos + k}`), s: u });
      });
    }
    pos += word.length;
  }
  return out;
}

/* ── the line itself ──────────────────────────────────────────────── */

const MOVE = { duration: duration.slow, ease: ease.outExpo } as const;

function MorphLine({
  text,
  mode,
  pop = true,
  quickExit = true,
  box = true,
  className,
}: {
  text: string;
  mode: Mode;
  /** Departing characters leave the flow immediately. */
  pop?: boolean;
  /** Torph shrinks and fades exits fast, so they never linger. */
  quickExit?: boolean;
  /** The wrapper animates its own size instead of snapping. */
  box?: boolean;
  className?: string;
}) {
  // Derived during render, not in an effect: the segments for this
  // string depend on the segments that are still on screen.
  const [held, setHeld] = useState<{ text: string; segs: Seg[] }>(() => ({
    text,
    segs: diff(null, text, mode),
  }));
  let segs = held.segs;
  if (held.text !== text) {
    segs = diff(held.segs, text, mode);
    setHeld({ text, segs });
  }

  return (
    <motion.span
      aria-hidden
      layout={box}
      transition={MOVE}
      className={cn("inline-flex whitespace-pre", className)}
    >
      <AnimatePresence initial={false} mode={pop ? "popLayout" : "sync"}>
        {segs.map((seg) => (
          <motion.span
            key={seg.id}
            layout
            className="inline-block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={
              quickExit
                ? {
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: duration.instant, ease: "linear" },
                  }
                : {
                    opacity: 0,
                    transition: { duration: duration.slow, ease: "linear" },
                  }
            }
            transition={{
              layout: MOVE,
              scale: MOVE,
              opacity: {
                duration: duration.fast,
                delay: duration.instant,
                ease: "linear",
              },
            }}
          >
            {seg.s}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.span>
  );
}

/** What a label change looks like when nothing is matched at all. */
function Crossfade({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span
      aria-hidden
      layout
      transition={MOVE}
      className="inline-flex whitespace-pre"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={text}
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.base, ease: ease.outQuart }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

function Stage({
  text,
  label,
  onNext,
  children,
}: {
  text: string;
  label: string;
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex min-h-10 items-center">{children}</div>
      <Button variant="secondary" size="lg" onClick={onNext}>
        {label}
      </Button>
      <span aria-live="polite" className="sr-only">
        {text}
      </span>
    </div>
  );
}

const FULL: Mode = { words: true, letters: true, graphemes: true };
const NO_WORDS: Mode = { words: false, letters: false, graphemes: true };
const NO_LETTERS: Mode = { words: true, letters: false, graphemes: true };
const NO_GRAPHEMES: Mode = { words: true, letters: true, graphemes: false };

/* ── 1 · the parts that did not change stay on screen ─────────────── */

const UPLOAD = [
  "Uploading 4 of 12",
  "Uploading 9 of 12",
  "Scanning 12 of 12",
  "Uploaded 12 files",
];

function StayPair({ after }: Side) {
  const [i, setI] = useState(0);
  const text = UPLOAD[i];
  return (
    <Stage text={text} label="Next" onNext={() => setI((v) => (v + 1) % UPLOAD.length)}>
      {after ? (
        <MorphLine text={text} mode={FULL} className="text-title" />
      ) : (
        <Crossfade text={text} className="text-title" />
      )}
    </Stage>
  );
}

/* ── 2 · a word is a word, not a bag of letters ───────────────────── */

const SIGNERS = ["Dana Whitfield signed", "Marcus Chen signed"];

function WordPair({ after }: Side) {
  const [i, setI] = useState(0);
  const text = SIGNERS[i];
  return (
    <Stage
      text={text}
      label="Change signer"
      onNext={() => setI((v) => (v + 1) % SIGNERS.length)}
    >
      <MorphLine
        text={text}
        mode={after ? FULL : NO_WORDS}
        className="text-title"
      />
    </Stage>
  );
}

/* ── 3 · shared letters inside a word that only partly changed ────── */

const PAYMENT = ["Processing payment", "Processed payment"];

function LetterPair({ after }: Side) {
  const [i, setI] = useState(0);
  const text = PAYMENT[i];
  return (
    <Stage
      text={text}
      label="Advance"
      onNext={() => setI((v) => (v + 1) % PAYMENT.length)}
    >
      <MorphLine
        text={text}
        mode={after ? FULL : NO_LETTERS}
        className="text-title"
      />
    </Stage>
  );
}

/* ── 4 · one emoji is one thing ───────────────────────────────────── */

const CAFE = "Cafe\u0301 Lumen";
const FAMILY = "\u{1F469}\u200D\u{1F467}";
const TABLE = [`${CAFE} \u00B7 ${FAMILY} \u00B7 \u{1F1E9}\u{1F1EA}`, `${CAFE} \u00B7 ${FAMILY} \u00B7 \u{1F1EB}\u{1F1F7}`];

function GraphemePair({ after }: Side) {
  const [i, setI] = useState(0);
  const text = TABLE[i];
  return (
    <Stage
      text={i === 0 ? "Cafe Lumen, Germany" : "Cafe Lumen, France"}
      label="Move booking"
      onNext={() => setI((v) => (v + 1) % TABLE.length)}
    >
      <MorphLine
        text={text}
        mode={after ? FULL : NO_GRAPHEMES}
        className="text-title"
      />
    </Stage>
  );
}

/* ── 5 · text on its way out gets out of the way ──────────────────── */

const DRAFT = ["Draft saved to Q3 planning", "Published"];

function ExitPair({ after }: Side) {
  const [i, setI] = useState(0);
  const text = DRAFT[i];
  return (
    <Stage
      text={text}
      label={i === 0 ? "Publish" : "Back to draft"}
      onNext={() => setI((v) => (v + 1) % DRAFT.length)}
    >
      <MorphLine
        text={text}
        mode={FULL}
        pop={after}
        quickExit={after}
        className="text-title"
      />
    </Stage>
  );
}

/* ── 6 · the box moves with the words ─────────────────────────────── */

const SYNC = ["Connecting", "Syncing 1,204 records", "Up to date"];

function BoxPair({ after }: Side) {
  const [i, setI] = useState(0);
  const text = SYNC[i];
  const next = () => setI((v) => (v + 1) % SYNC.length);
  // The button you press is the thing that gets shoved, which is the
  // whole complaint: press Next twice and watch where it goes.
  return (
    <div className="flex min-h-10 items-center gap-2">
      <motion.span
        layout={after}
        transition={MOVE}
        className="bg-secondary inline-flex h-9 shrink-0 items-center rounded-lg border px-3"
      >
        <MorphLine text={text} mode={FULL} box={after} className="text-ui" />
      </motion.span>
      <motion.span layout={after} transition={MOVE} className="inline-flex">
        <Button variant="secondary" size="lg" onClick={next}>
          Next
        </Button>
      </motion.span>
      <span aria-live="polite" className="sr-only">
        {text}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function TorphDemo() {
  return (
    <div>
      <BeforeAfter
        principle="When a status line changes, the words that stayed the same should stay on screen. Blinking the whole thing makes you read it again from the start."
        before={<StayPair after={false} />}
        after={<StayPair after />}
      />
      <BeforeAfter
        principle="Letters belong to their word. If they are allowed to fly off and join a different one, the line looks like it is being shuffled rather than edited."
        before={<WordPair after={false} />}
        after={<WordPair after />}
      />
      <BeforeAfter
        principle="Two words can be almost the same word. Only the part that actually changed should be re-drawn — the rest should hold still."
        before={<LetterPair after={false} />}
        after={<LetterPair after />}
      />
      <BeforeAfter
        principle="An emoji or an accented letter is one character, even though the computer stores it as several. Cut it apart and you get two flags where there was one, or an accent floating on its own."
        before={<GraphemePair after={false} />}
        after={<GraphemePair after />}
      />
      <BeforeAfter
        principle="Text that is leaving should get out of the way at once. If it holds its place while it fades, everything behind it waits, then lurches."
        before={<ExitPair after={false} />}
        after={<ExitPair after />}
      />
      <BeforeAfter
        principle="The box around the words should grow and shrink with them. If it snaps, whatever sits next to it jumps out from under your cursor."
        before={<BoxPair after={false} />}
        after={<BoxPair after />}
      />
    </div>
  );
}
