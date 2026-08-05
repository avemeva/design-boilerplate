"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * The Proportional Web — Oskar Wickström's stylesheet for prose, an
 * attempt at Bringhurst's *Elements of Typographic Style* in a browser.
 *
 * The stylesheet is not installed here: it ships global element
 * selectors, its own index.js, and 170kB of bundled Alegreya + Courier
 * Prime, and its author says outright it is not for dynamic web apps.
 * So its decisions are rebuilt on this project's own face and tokens,
 * one switch each, using the same specimens the document itself uses —
 * the Bringhurst epigraph, the obelisk table, the MIT licence, the
 * islands of Lombok and Bali.
 *
 * Left out because a visitor could not see them: old-style numerals
 * (this face has none, so nothing would move), rem-based sizing, the
 * root dropping to 14px under 480px, print page breaks, the single
 * typeface argument, the table of contents, and the Pandoc build.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/** The prose column. One measure for the whole document. */
function Column({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("text-body", className)} style={{ maxWidth: "66ch", ...style }}>
      {children}
    </div>
  );
}

/**
 * Capitals cut down to the height of the small letters.
 *
 * Done by hand rather than with `font-variant`, because this face has
 * no small-caps cut and browser synthesis is not something to bet a
 * before/after on.
 */
function SmallCaps({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      className={cn("uppercase", className)}
      style={{ fontSize: "0.82em", letterSpacing: "0.075em" }}
    >
      {children}
    </span>
  );
}

/** U+2767, the rotated floral heart the document uses as its ornament. */
function Floret({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span aria-hidden="true" className={className} style={style}>
      ❧
    </span>
  );
}

/* ── 1. The measure ────────────────────────────────────────────────── */

const MEASURE = [
  "Typography is the craft of endowing human language with a durable visual form. The first decision in that craft is not which typeface to use but how wide to make the column, because the width of the column decides how much work the eye does on every single line.",
  "When a line runs the whole width of a screen the eye travels a long way to the right and then has to find its way back to a left edge it can no longer see. It lands a line too high or a line too low, and you read the same sentence twice without ever working out why.",
  "Around sixty-six characters is where the return sweep stops being work. You stop noticing the mechanics of reading, which is the entire point of setting a page carefully in the first place.",
];

function MeasurePair({ after }: Side) {
  return (
    <div className="text-body space-y-4" style={after ? { maxWidth: "66ch" } : undefined}>
      {MEASURE.map((p) => (
        <p key={p.slice(0, 16)}>{p}</p>
      ))}
    </div>
  );
}

/* ── 2. Indented paragraphs ────────────────────────────────────────── */

const INDENT = [
  "Each successive paragraph is indented by the width of three zeros. The paragraph following this one leads with exactly such an indent, and the one after that does too.",
  "The small step at the start of the line is enough to mark the break. Because no blank line has been punched into the column, the text stays one continuous body and the page holds an even grey colour instead of breaking into slabs.",
  "Print has done it this way for at least half a millennium. The web settled on the blank line instead, largely because it is easier to type, and the indent has been sitting there unused ever since.",
];

function IndentPair({ after }: Side) {
  return (
    <Column className={after ? undefined : "space-y-4"}>
      {INDENT.map((p, i) => (
        <p key={p.slice(0, 16)} style={after && i > 0 ? { textIndent: "3ch" } : undefined}>
          {p}
        </p>
      ))}
    </Column>
  );
}

/* ── 3. Justification that needs hyphenation ───────────────────────── */

const JUSTIFIED =
  "Justified text has a reputation for producing extraordinarily uncomfortable rivers of whitespace, running straight down the middle of an otherwise unremarkable paragraph. The remedy is unglamorous: allow the longer words to break across the line ending, and the spacing settles down immediately.";

function HyphenPair({ after }: Side) {
  return (
    <p
      lang="en"
      className="text-body"
      style={{
        maxWidth: "38ch",
        textAlign: "justify",
        hyphens: after ? "auto" : "none",
        WebkitHyphens: after ? "auto" : "none",
      }}
    >
      {JUSTIFIED}
    </p>
  );
}

/* ── 4. One ruling for the whole page ──────────────────────────────── */

const RULED_BG =
  "repeating-linear-gradient(to bottom, transparent 0, transparent 23px, var(--border) 23px, var(--border) 24px)";

const RHYTHM = [
  "Every size on the page is derived from one root size, and every vertical gap is a whole number of lines. Headings, quotations and figures all take their spacing from the same unit.",
  "The result is that the ruling below never has to be drawn. You feel it as evenness: the text keeps its footing down the whole column instead of sliding a little further out of step with every element it passes.",
];

function RhythmPair({ after }: Side) {
  const line = after ? "24px" : 1.65;
  return (
    <div
      className="text-body"
      style={{ maxWidth: "58ch", backgroundImage: RULED_BG }}
    >
      <h3
        style={{
          fontSize: "1.25rem",
          lineHeight: after ? "24px" : 1.3,
          marginBottom: after ? "24px" : "14px",
        }}
      >
        A sizing system built on one unit
      </h3>
      {RHYTHM.map((p, i) => (
        <p
          key={p.slice(0, 16)}
          style={{
            lineHeight: line,
            marginTop: i === 0 ? 0 : after ? 0 : "13px",
            textIndent: after && i > 0 ? "3ch" : 0,
          }}
        >
          {p}
        </p>
      ))}
      <p
        style={{
          lineHeight: line,
          marginTop: after ? "24px" : "19px",
          marginLeft: "3ch",
          marginRight: "3ch",
        }}
      >
        “Everything on the page is aligned to multiples of the line height, and
        the page is quieter for it.”
      </p>
    </div>
  );
}

/* ── 5. Headings ───────────────────────────────────────────────────── */

const LEVELS = [
  {
    n: "1",
    t: "On the theory of war",
    p: "War is nothing but a duel on an extensive scale, and the theory of it has to begin somewhere less exciting than the battlefield.",
  },
  {
    n: "1.2",
    t: "Art or science of war",
    p: "The argument has been settled and unsettled several times over, which is usually a sign that the question was put badly.",
  },
  {
    n: "1.2.1",
    t: "Usage still unsettled",
    p: "Common usage, meanwhile, carries on cheerfully ignoring the distinction, as common usage tends to.",
  },
];

function HeadingPair({ after }: Side) {
  if (!after) {
    return (
      <Column className="space-y-3">
        <h3 className="text-title">
          {LEVELS[0].n} {LEVELS[0].t}
        </h3>
        <p>{LEVELS[0].p}</p>
        <h4 className="text-ui font-semibold">
          {LEVELS[1].n} {LEVELS[1].t}
        </h4>
        <p>{LEVELS[1].p}</p>
        <h5 className="text-ui-sm font-semibold">
          {LEVELS[2].n} {LEVELS[2].t}
        </h5>
        <p>{LEVELS[2].p}</p>
      </Column>
    );
  }

  return (
    <Column>
      <h3
        className="border-border-strong border-b pb-2 uppercase"
        style={{ fontWeight: 400, letterSpacing: "0.15em" }}
      >
        <span style={{ fontSize: "0.85em", letterSpacing: 0 }}>{LEVELS[0].n}</span>{" "}
        {LEVELS[0].t}
      </h3>
      <p className="mt-4">{LEVELS[0].p}</p>

      <h4
        className="mt-8 uppercase"
        style={{ fontWeight: 400, fontSize: "0.92em", letterSpacing: "0.125em" }}
      >
        <span style={{ fontSize: "0.9em", letterSpacing: 0 }}>{LEVELS[1].n}</span>{" "}
        {LEVELS[1].t}
      </h4>
      <p className="mt-4">{LEVELS[1].p}</p>

      <h5 className="mt-8 italic" style={{ fontWeight: 400 }}>
        <span className="not-italic">{LEVELS[2].n}</span> {LEVELS[2].t}
      </h5>
      <p className="mt-4">{LEVELS[2].p}</p>
    </Column>
  );
}

/* ── 6. Initials and proper names ──────────────────────────────────── */

function Caps({ after, children }: Side & { children: string }) {
  return after ? <SmallCaps>{children}</SmallCaps> : <span>{children}</span>;
}

function SmallCapsPair({ after }: Side) {
  return (
    <Column className="space-y-4">
      <p>
        On the islands of <Caps after={after}>LOMBOK</Caps>,{" "}
        <Caps after={after}>BALI</Caps>, <Caps after={after}>FLORES</Caps>,{" "}
        <Caps after={after}>TIMOR</Caps> and <Caps after={after}>SULAWESI</Caps>{" "}
        the same textiles are woven today that were woven a thousand years ago,
        and the names of those islands appear on every page of the chapter.
      </p>
      <p>
        This page was written in <Caps after={after}>HTML</Caps>, squeezed by{" "}
        <Caps after={after}>HTML-MINIFIER</Caps>, bundled with{" "}
        <Caps after={after}>ESBUILD</Caps> and checked against the{" "}
        <Caps after={after}>W3C</Caps> validator. The{" "}
        <Caps after={after}>CSS</Caps> comes to ten kilobytes; the fonts,
        regrettably, come to a hundred and seventy.
      </p>
    </Column>
  );
}

/* ── 7. Quotations ─────────────────────────────────────────────────── */

const QUOTE =
  "Typography is the craft of endowing human language with a durable visual form.";

function QuotePair({ after }: Side) {
  if (!after) {
    return (
      <Column>
        <blockquote className="border-border-strong text-muted-foreground border-l-2 pl-4 italic">
          <p>{QUOTE}</p>
          <p className="text-caption mt-2 not-italic">— Robert Bringhurst</p>
        </blockquote>
      </Column>
    );
  }
  return (
    <Column>
      <blockquote style={{ marginLeft: "3ch", marginRight: "3ch" }}>
        <p>
          {"“"}
          {QUOTE}
          {"”"}
        </p>
        <footer className="mt-4">
          <p>
            <SmallCaps>Robert Bringhurst</SmallCaps>
          </p>
          <p className="italic">The Elements of Typographic Style</p>
          <p>2nd edition, 2002</p>
        </footer>
      </blockquote>
    </Column>
  );
}

/* ── 8. The break between two parts ────────────────────────────────── */

function BreakPair({ after }: Side) {
  return (
    <Column>
      <p>
        There is no clear guidance in Bringhurst on how to mark a break in the
        middle of a text, which makes it one of the few places where a little
        ornament can be justified.
      </p>

      {after ? (
        <div className="relative my-6 h-6">
          <div className="absolute inset-x-0 top-1/2 border-t" />
          <Floret
            className="text-muted-foreground bg-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 leading-none"
            style={{ fontSize: "1.5rem" }}
          />
        </div>
      ) : (
        <hr className="my-6 border-t" />
      )}

      <p>
        The mark used here is a rotated floral heart, and the pause it asks for
        is about the right size: enough to notice, not enough to feel like the
        end of the chapter.
      </p>
    </Column>
  );
}

/* ── 9. Side notes ─────────────────────────────────────────────────── */

const ASIDE_NOTE =
  "The stylesheet ships a few lines of script for exactly this: each note is pinned to the paragraph above it, so it never drifts away from what it is talking about.";

function AsidePair({ after }: Side) {
  const p1 =
    "Bringhurst's book is full of side notes, and a side note is not the same thing as an interruption. It is a remark made quietly, off to one side, by someone who does not want to stop the sentence you are in the middle of.";
  const p2 =
    "Put it in the margin and the argument runs on unbroken. Narrow the window far enough and it folds back into the column, because a margin you cannot see is no use to anybody.";

  if (!after) {
    return (
      <Column>
        <p>{p1}</p>
        <div className="bg-secondary text-caption text-muted-foreground my-4 rounded-lg border p-3">
          {ASIDE_NOTE}
        </div>
        <p>{p2}</p>
      </Column>
    );
  }

  return (
    <div className="text-body grid gap-x-8 sm:grid-cols-[minmax(0,66ch)_11rem]">
      <p className="sm:col-start-1 sm:row-start-1">{p1}</p>
      {/* On sm+ the note is taken out of flow, so the margin it sits in
          costs the prose column nothing — the next paragraph follows
          the previous one immediately, which is the whole point. */}
      <div className="relative sm:col-start-2 sm:row-start-1">
        <aside className="text-caption text-muted-foreground my-4 sm:absolute sm:top-0 sm:left-0 sm:my-0 sm:w-44">
          <Floret className="mr-1 sm:hidden" />
          {ASIDE_NOTE}
        </aside>
      </div>
      <p className="sm:col-start-1 sm:row-start-2" style={{ textIndent: "3ch" }}>
        {p2}
      </p>
    </div>
  );
}

/* ── 10. Tables ────────────────────────────────────────────────────── */

const MONUMENTS = [
  {
    name: "Boboli Obelisk",
    dim: "1.41m × 1.41m × 4.87m",
    pos: "43°45′50.78″N 11°15′3.34″E",
  },
  {
    name: "Pyramid of Khafre",
    dim: "215.25m × 215.25m × 136.4m",
    pos: "29°58′34″N 31°07′51″E",
  },
  {
    name: "Cleopatra's Needle",
    dim: "2.44m × 2.44m × 20.88m",
    pos: "51°30′30″N 0°07′13″W",
  },
];

const COLS = ["Name", "Dimensions", "Position"] as const;

function TablePair({ after }: Side) {
  if (!after) {
    return (
      <table className="text-ui-sm w-full border-collapse border">
        <thead>
          <tr className="bg-secondary">
            {COLS.map((c) => (
              <th key={c} className="border px-3 py-2 text-center font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MONUMENTS.map((m, i) => (
            <tr key={m.name} className={cn(i % 2 === 1 && "bg-secondary")}>
              <td className="border px-3 py-2">{m.name}</td>
              <td className="border px-3 py-2">{m.dim}</td>
              <td className="border px-3 py-2">{m.pos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="text-body w-full border-collapse" style={{ maxWidth: "66ch" }}>
      <thead>
        <tr>
          {COLS.map((c) => (
            <th
              key={c}
              className="border-border-strong border-b px-1 py-2 text-left align-top"
              style={{ fontWeight: 500 }}
            >
              <SmallCaps>{c}</SmallCaps>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {MONUMENTS.map((m) => (
          <tr key={m.name}>
            <td className="px-1 py-2 align-top">{m.name}</td>
            <td className="px-1 py-2 align-top tabular-nums">{m.dim}</td>
            <td className="px-1 py-2 align-top tabular-nums">{m.pos}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── 11. Nested lists ──────────────────────────────────────────────── */

type Node = { label: string; children?: Node[] };

const OUTLINE: Node[] = [
  { label: "Goals" },
  {
    label: "Motivations",
    children: [
      { label: "Intrinsic", children: [{ label: "Curiosity" }, { label: "Mastery" }] },
      { label: "Extrinsic" },
    ],
  },
  { label: "Second-order effects" },
];

function Outline({ nodes, prefix, after }: { nodes: Node[]; prefix: string; after: boolean }) {
  return (
    <ol className={cn("space-y-1", prefix && "mt-1")} style={{ paddingLeft: prefix ? "2ch" : 0 }}>
      {nodes.map((n, i) => {
        const number = after ? `${prefix}${i + 1}.` : `${i + 1}.`;
        return (
          <li key={n.label}>
            <span
              className="text-muted-foreground mr-2 tabular-nums"
              style={{ fontSize: "0.875em", fontWeight: 500 }}
            >
              {number}
            </span>
            {n.label}
            {n.children && (
              <Outline nodes={n.children} prefix={`${prefix}${i + 1}.`} after={after} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ListPair({ after }: Side) {
  return (
    <Column>
      <Outline nodes={OUTLINE} prefix="" after={after} />
    </Column>
  );
}

/* ── 12. Things you can open ───────────────────────────────────────── */

const LICENCE =
  "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense and sell copies of it.";

function DetailsPair({ after }: Side) {
  const [open, setOpen] = useState(false);

  if (!after) {
    return (
      <Column>
        <div className="bg-secondary rounded-lg border p-3">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="text-ui-sm flex h-9 w-full items-center gap-2 text-left"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "duration-fast ease-out-quart size-4 transition-transform",
                open && "rotate-90",
              )}
            />
            License
          </button>
          {open && <p className="text-caption text-muted-foreground mt-2">{LICENCE}</p>}
        </div>
      </Column>
    );
  }

  return (
    <Column>
      <div className="border-y py-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex h-9 w-full items-center text-left italic"
        >
          <span
            aria-hidden="true"
            className={cn(
              "duration-fast ease-out-quart mr-2 inline-block not-italic transition-transform",
              open && "rotate-90",
            )}
          >
            »
          </span>
          License
        </button>
        {open && <p className="mt-3">{LICENCE}</p>}
      </div>
    </Column>
  );
}

/* ── 13. Where the colour goes ─────────────────────────────────────── */

const BYTES = [
  { label: "Stylesheet", kb: 10 },
  { label: "Script", kb: 1 },
  { label: "Markup", kb: 28 },
  { label: "Fonts", kb: 170 },
  { label: "Images", kb: 240 },
];

function ColorPair({ after }: Side) {
  const ink = after ? "text-foreground" : "text-accent-solid";
  return (
    <Column className="space-y-4">
      <h3 className={cn("uppercase", ink)} style={{ fontWeight: 400, letterSpacing: "0.15em" }}>
        On colour
      </h3>
      <p>
        This design is almost entirely black on white. That is partly taste, and
        partly arithmetic: colour only points at something{" "}
        <em className={cn("italic", ink)}>if there is nothing else competing with it</em>.
        Spend it on the heading, the links and the emphasis, and there is none
        left over for the one place it would have earned its keep.
      </p>
      <p style={{ textIndent: "3ch" }}>
        Weights are worth watching for the same reason — see{" "}
        <span className={cn("underline underline-offset-2", ink)}>the sizing table</span>{" "}
        and{" "}
        <span className={cn("underline underline-offset-2", ink)}>the note on fonts</span>{" "}
        — because the stylesheet is ten kilobytes and everything else is not.
      </p>

      <figure className="mt-6">
        <div className="flex h-28 items-end gap-3" aria-hidden="true">
          {BYTES.map((b) => (
            <div
              key={b.label}
              className="bg-accent-solid flex-1 rounded-t-sm"
              style={{ height: `${Math.max((b.kb / 240) * 100, 2)}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-3 border-t pt-2">
          {BYTES.map((b) => (
            <div key={b.label} className="text-caption text-muted-foreground flex-1 text-center">
              {b.label}
              <span className="text-foreground ml-1 tabular-nums">{b.kb}kB</span>
            </div>
          ))}
        </div>
        <figcaption className="text-caption text-muted-foreground mt-3">
          Bytes sent before the reader sees a page.
        </figcaption>
      </figure>
    </Column>
  );
}

/* ── The document ──────────────────────────────────────────────────── */

export function TheProportionalWebDemo() {
  return (
    <div>
      <BeforeAfter
        principle="A line of text should be short enough that your eye finds the start of the next one on its own. When lines run the full width of the screen you keep losing your place and reading the same sentence twice."
        before={<MeasurePair after={false} />}
        after={<MeasurePair after />}
      />
      <BeforeAfter
        principle="You should be able to see where one paragraph ends without a gap being punched into the page. A small step at the start of the line says the same thing, and the text stays one solid block."
        before={<IndentPair after={false} />}
        after={<IndentPair after />}
      />
      <BeforeAfter
        principle="Both edges of a column can line up straight without leaving big holes between the words. The trick is letting a long word break across two lines instead of shoving it down whole."
        before={<HyphenPair after={false} />}
        after={<HyphenPair after />}
      />
      <BeforeAfter
        principle="Every line on a page should sit on the same invisible ruling, like a sheet of lined paper. When the heading and the quotation each bring their own spacing, the lines slide out of step and the page feels untidy without you knowing why."
        before={<RhythmPair after={false} />}
        after={<RhythmPair after />}
      />
      <BeforeAfter
        principle="A heading only has to look different from the text, not louder than it. Making each level bigger and blacker turns a quiet page into a shouting match."
        before={<HeadingPair after={false} />}
        after={<HeadingPair after />}
      />
      <BeforeAfter
        principle="Initials like HTML, and names you repeat on every page, shout in the middle of a sentence because capitals stand taller than everything around them. Cut them down to the height of the small letters and they sit in the line instead of jumping out of it."
        before={<SmallCapsPair after={false} />}
        after={<SmallCapsPair after />}
      />
      <BeforeAfter
        principle="A quotation should look like someone speaking, and you should be able to see who said it, where it came from and when. A grey bar down the side tells you none of that."
        before={<QuotePair after={false} />}
        after={<QuotePair after />}
      />
      <BeforeAfter
        principle="A break between two parts of a text is a pause, not a wall. A line straight across the page is heavier than the pause deserves."
        before={<BreakPair after={false} />}
        after={<BreakPair after />}
      />
      <BeforeAfter
        principle="A remark off to the side should not have to cut the page in half. Move it out into the margin and you can carry on reading without stepping over it."
        before={<AsidePair after={false} />}
        after={<AsidePair after />}
      />
      <BeforeAfter
        principle="A table is easier to read with less drawn on it. Boxes around every cell make you look at the grid instead of the numbers."
        before={<TablePair after={false} />}
        after={<TablePair after />}
      />
      <BeforeAfter
        principle="In a list inside a list you should be able to tell how deep you are without counting the indents. Numbering that carries the parent along tells you where you are at a glance."
        before={<ListPair after={false} />}
        after={<ListPair after />}
      />
      <BeforeAfter
        principle="Something you can open is still part of the page. Putting it in a grey box makes it look like a thing that got attached to the page afterwards."
        before={<DetailsPair after={false} />}
        after={<DetailsPair after />}
      />
      <BeforeAfter
        principle="Keep the writing black and save the colour for the one thing that actually needs pointing at. Colour the heading, the emphasis and the links as well, and by the time you reach the chart there is nothing left to make it stand out."
        before={<ColorPair after={false} />}
        after={<ColorPair after />}
      />
    </div>
  );
}
