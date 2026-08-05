"use client";

import NumberFlow from "@number-flow/react";
import {
  Archive,
  ArrowUp,
  AtSign,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Paperclip,
  Pencil,
  Plus,
  Quote as QuoteIcon,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  ThumbsUp,
  Trash2,
  TriangleAlert,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * assistant-ui — before and after.
 *
 * The source is a documentation index of ~200 pages; 69 of them
 * describe something that renders (13 headless primitives, 33 styled ui
 * components, 23 chat-UX guides). Twenty-two of those describe a change
 * a person can *see* in a chat window, and each one is a switch below:
 * the version a normal product ships, and the version assistant-ui
 * gets you.
 *
 * The package is not installed here, so every side is hand-built — but
 * both sides of every switch are working UI, not a picture of one.
 */

/* ── shared chrome ────────────────────────────────────────────────── */

const FRAME = "rounded-xl border";
const FIELD = "text-ui min-w-0 flex-1 resize-none bg-transparent px-2 outline-none";
const SEND =
  "bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-lg transition-opacity disabled:opacity-40";
const ICON_BTN =
  "text-muted-foreground hover:bg-secondary hover:text-foreground grid size-9 shrink-0 place-items-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-40";
const MONO = "text-caption font-mono break-words whitespace-pre-wrap";

function User({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="bg-secondary text-ui max-w-[85%] rounded-2xl px-3 py-2">{children}</p>
    </div>
  );
}

function Asst({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("text-ui", className)}>{children}</div>;
}

function Caret() {
  return (
    <span
      aria-hidden="true"
      className="bg-foreground ml-0.5 inline-block h-4 w-px animate-pulse align-text-bottom"
    />
  );
}

/** Types a string out, character by character. Only ever started from an event. */
function useTyper(full: string, speed = 3, tick = 20) {
  const [n, setN] = useState(0);
  const [running, setRunning] = useState(false);
  const id = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (id.current) clearInterval(id.current);
    id.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(
    (from = 0) => {
      if (id.current) clearInterval(id.current);
      let k = from;
      setN(from);
      setRunning(true);
      id.current = setInterval(() => {
        k += speed;
        setN(Math.min(k, full.length));
        if (k >= full.length) {
          if (id.current) clearInterval(id.current);
          id.current = null;
          setRunning(false);
        }
      }, tick);
    },
    [full, speed, tick],
  );

  useEffect(
    () => () => {
      if (id.current) clearInterval(id.current);
    },
    [],
  );

  return { n, running, start, stop, setN };
}

/* ── 1. suggested prompts ─────────────────────────────────────────── */

const STARTERS = [
  { title: "Audit my spacing", desc: "Find the scale breaks on a page" },
  { title: "Name these colours", desc: "Turn a palette into roles" },
  { title: "Write an empty state", desc: "Copy that offers a next step" },
];

const STARTER_REPLY =
  "Send me the screen and I will walk it top to bottom, flagging every value that is not on the 4px rhythm.";

function EmptyBefore() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className={cn(FRAME, "flex h-64 flex-col")}>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {sent ? (
          <>
            <User>{sent}</User>
            <Asst>{STARTER_REPLY}</Asst>
          </>
        ) : (
          <div className="grid h-full place-items-center">
            <p className="text-ui-sm text-muted-foreground">No messages yet</p>
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            setSent(text.trim());
            setText("");
          }
        }}
        className="flex items-center gap-1 border-t p-2"
      >
        <label htmlFor="aui-empty-b" className="sr-only">
          Message
        </label>
        <input
          id="aui-empty-b"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send a message"
          className={FIELD}
        />
        <button type="submit" aria-label="Send" className={SEND}>
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

function EmptyAfter() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const send = (v: string) => {
    if (!v.trim()) return;
    setSent(v.trim());
    setText("");
  };
  return (
    <div className={cn(FRAME, "flex h-64 flex-col")}>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {sent ? (
          <>
            <User>{sent}</User>
            <Asst>{STARTER_REPLY}</Asst>
            <div className="flex flex-wrap gap-1.5">
              {["Show me an example", "What counts as a break?"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => send(f)}
                  className="text-caption hover:bg-secondary h-9 rounded-full border px-3 transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col justify-center gap-2">
            <p className="text-ui text-muted-foreground px-0.5">What can I help with?</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {STARTERS.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setText(s.title)}
                  className="hover:bg-secondary rounded-lg border p-2.5 text-left transition-colors"
                >
                  <span className="text-ui-sm block">{s.title}</span>
                  <span className="text-caption text-muted-foreground block">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="flex items-center gap-1 border-t p-2"
      >
        <label htmlFor="aui-empty-a" className="sr-only">
          Message
        </label>
        <input
          id="aui-empty-a"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send a message"
          className={FIELD}
        />
        <button type="submit" aria-label="Send" disabled={!text.trim()} className={SEND}>
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

/* ── 2. stopping a reply ──────────────────────────────────────────── */

const LONG_REPLY =
  "Elevation here is almost flat. The page is grey, panels are white, and a hairline is what separates them — a resting card gets no shadow at all. Shadow is kept for the things that genuinely float above the page: popovers, dropdowns, dialogs and toasts. If you find yourself adding a shadow to explain a boundary, a border and twelve pixels of space will usually do it better.";

function StopBefore() {
  const { n, running, start } = useTyper(LONG_REPLY, 2, 22);
  return (
    <div className={cn(FRAME, "flex h-64 flex-col")}>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <User>Explain the elevation rules.</User>
        <Asst>
          {LONG_REPLY.slice(0, n)}
          {running && <Caret />}
        </Asst>
      </div>
      <div className="flex items-center gap-1 border-t p-2">
        <p className="text-ui text-muted-foreground min-w-0 flex-1 px-2">
          {running ? "Waiting for the reply to finish…" : "Send a message"}
        </p>
        <button
          type="button"
          aria-label="Send"
          onClick={() => start()}
          className={cn(SEND, running && "opacity-40")}
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function StopAfter() {
  const { n, running, start, stop } = useTyper(LONG_REPLY, 2, 22);
  return (
    <div className={cn(FRAME, "flex h-64 flex-col")}>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <User>Explain the elevation rules.</User>
        <Asst>
          {LONG_REPLY.slice(0, n)}
          {running && <Caret />}
        </Asst>
      </div>
      <div className="flex items-center gap-1 border-t p-2">
        <p className="text-ui text-muted-foreground min-w-0 flex-1 px-2">
          {running ? "Stop whenever you have read enough" : "Send a message"}
        </p>
        {running ? (
          <button type="button" aria-label="Stop the reply" onClick={stop} className={SEND}>
            <Square className="size-3" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" aria-label="Send" onClick={() => start()} className={SEND}>
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 3. staying where you are ─────────────────────────────────────── */

const HISTORY = [
  "Border, not shadow — the hairline already separates the card from the canvas.",
  "Popovers, dropdowns, dialogs and toasts. Those genuinely float.",
  "Twelve pixels between sibling cards, twenty-four inside one.",
  "The rail has no border; the surface step alone separates it.",
  "Micro labels are ten pixels, uppercase, with real letter spacing.",
  "Numbers that update in place get tabular figures so rows do not twitch.",
];
const INCOMING = [
  "One more: radii step down when you nest. A 14px card holds an 8px control.",
  "And motion stays under 200ms for anything you triggered yourself.",
  "Saturated colour only enters as content — avatars, marks, status.",
];

function ScrollBefore() {
  const vp = useRef<HTMLDivElement>(null);
  const [msgs, setMsgs] = useState<string[]>(HISTORY);
  const add = () => {
    setMsgs((m) => [...m, INCOMING[(m.length - HISTORY.length) % INCOMING.length]]);
    requestAnimationFrame(() => {
      const el = vp.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };
  return (
    <>
      <div ref={vp} className={cn(FRAME, "h-44 space-y-3 overflow-y-auto p-3")}>
        {msgs.map((m, i) => (
          <Asst key={`${i}-${m.slice(0, 10)}`}>{m}</Asst>
        ))}
      </div>
      <div className="mt-3">
        <Button size="lg" variant="secondary" onClick={add}>
          A new reply arrives
        </Button>
      </div>
    </>
  );
}

function ScrollAfter() {
  const vp = useRef<HTMLDivElement>(null);
  const [msgs, setMsgs] = useState<string[]>(HISTORY);
  const [unread, setUnread] = useState(0);

  const toBottom = () => {
    const el = vp.current;
    if (el) el.scrollTop = el.scrollHeight;
    setUnread(0);
  };

  const add = () => {
    const el = vp.current;
    const pinned = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 12 : true;
    setMsgs((m) => [...m, INCOMING[(m.length - HISTORY.length) % INCOMING.length]]);
    if (pinned) {
      requestAnimationFrame(() => {
        const node = vp.current;
        if (node) node.scrollTop = node.scrollHeight;
      });
    } else {
      setUnread((u) => u + 1);
    }
  };

  return (
    <>
      <div className="relative">
        <div
          ref={vp}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 12) setUnread(0);
          }}
          className={cn(FRAME, "h-44 space-y-3 overflow-y-auto p-3")}
        >
          {msgs.map((m, i) => (
            <Asst key={`${i}-${m.slice(0, 10)}`}>{m}</Asst>
          ))}
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={toBottom}
            className="bg-card text-caption shadow-floating absolute bottom-3 left-1/2 flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full px-3"
          >
            <ChevronDown className="size-3.5" aria-hidden="true" />
            {unread} new below
          </button>
        )}
      </div>
      <div className="mt-3">
        <Button size="lg" variant="secondary" onClick={add}>
          A new reply arrives
        </Button>
      </div>
    </>
  );
}

/* ── 4 & 5. markdown, still and streaming ─────────────────────────── */

const ANSWERS: Record<string, string> = {
  Elevation: `## Elevation
A resting card gets **no shadow** — the hairline is what separates it.

- popover
- dialog
- toast

\`\`\`css
.card { border: 1px solid var(--line); }
\`\`\``,
  Radii: `## Radii
Corners **step down** when you nest them.

- card, 14px
- button inside it, 8px

\`\`\`css
.card > .button { border-radius: 8px; }
\`\`\``,
};

function inline(s: string, key: number): React.ReactNode {
  return (
    <span key={key}>
      {s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((chunk, i) =>
        chunk.startsWith("**") ? (
          <strong key={i} className="font-semibold">
            {chunk.slice(2, -2)}
          </strong>
        ) : chunk.startsWith("`") ? (
          <code key={i} className="bg-secondary rounded px-1 font-mono">
            {chunk.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{chunk}</span>
        ),
      )}
    </span>
  );
}

/** Enough markdown to show the shape. `closeFence` is the streaming fix. */
function md(src: string, closeFence: boolean): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let fence: string[] | null = null;
  src.split("\n").forEach((line, i) => {
    if (line.startsWith("```")) {
      if (fence) {
        out.push(
          <pre
            key={`f${i}`}
            className="bg-secondary text-caption overflow-x-auto rounded-lg p-2 font-mono"
          >
            {fence.join("\n")}
          </pre>,
        );
        fence = null;
      } else {
        fence = [];
      }
      return;
    }
    if (fence) {
      fence.push(line);
      return;
    }
    if (line.startsWith("## ")) {
      out.push(
        <p key={i} className="text-ui font-semibold">
          {line.slice(3)}
        </p>,
      );
      return;
    }
    if (line.startsWith("- ")) {
      out.push(
        <p key={i} className="text-ui-sm flex gap-2 pl-1">
          <span className="text-muted-foreground" aria-hidden="true">
            •
          </span>
          {inline(line.slice(2), i)}
        </p>,
      );
      return;
    }
    if (line.trim()) {
      out.push(
        <p key={i} className="text-ui-sm">
          {inline(line, i)}
        </p>,
      );
    }
  });
  if (fence) {
    const rest: string[] = fence;
    out.push(
      closeFence ? (
        <pre
          key="open"
          className="bg-secondary text-caption overflow-x-auto rounded-lg p-2 font-mono"
        >
          {rest.join("\n")}
        </pre>
      ) : (
        <p key="open" className={cn(MONO, "text-muted-foreground")}>
          {["```", ...rest].join("\n")}
        </p>
      ),
    );
  }
  return out;
}

function MarkdownShell({ rendered }: { rendered: boolean }) {
  const [topic, setTopic] = useState<string>("Elevation");
  const src = ANSWERS[topic];
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {Object.keys(ANSWERS).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={topic === t}
            onClick={() => setTopic(t)}
            className={cn(
              "text-caption h-9 rounded-full border px-3 transition-colors",
              topic === t ? "bg-secondary" : "hover:bg-secondary",
            )}
          >
            Ask about {t.toLowerCase()}
          </button>
        ))}
      </div>
      <div className={cn(FRAME, "space-y-3 p-3")}>
        <User>Tell me about {topic.toLowerCase()}.</User>
        {rendered ? <div className="space-y-1.5">{md(src, true)}</div> : <p className={MONO}>{src}</p>}
      </div>
    </>
  );
}

function StreamMdShell({ safe }: { safe: boolean }) {
  const src = ANSWERS.Elevation;
  const { n, running, start } = useTyper(src, 2, 16);
  return (
    <>
      <div className="mb-3">
        <Button size="lg" variant="secondary" onClick={() => start()} disabled={running}>
          Stream the answer
        </Button>
      </div>
      <div className={cn(FRAME, "min-h-56 space-y-1.5 p-3")}>
        {n === 0 ? (
          <p className="text-ui-sm text-muted-foreground">Press stream.</p>
        ) : (
          md(src.slice(0, n), safe)
        )}
      </div>
    </>
  );
}

/* ── 6. the thinking ──────────────────────────────────────────────── */

const THINKING =
  "The question is about a card that is sitting still, so this is resting elevation rather than floating elevation. Resting means the hairline is already doing the separating. A shadow would be a second signal for the same boundary, which is what makes it look heavy. So the answer is the border, and the shadow token stays reserved for surfaces that genuinely sit above the page.";
const THOUGHT_ANSWER = "Border. Keep the shadow for popovers, dialogs and toasts.";

function useThought() {
  const think = useTyper(THINKING, 6, 16);
  const [phase, setPhase] = useState<"thinking" | "done">("done");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("thinking");
    think.start();
    timer.current = setTimeout(() => setPhase("done"), 1200);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { phase, run, text: THINKING.slice(0, think.n), running: think.running };
}

function ReasoningBefore() {
  const { phase, run, text } = useThought();
  return (
    <>
      <div className={cn(FRAME, "h-56 space-y-3 overflow-y-auto p-3")}>
        <User>Shadow or border on a resting card?</User>
        <p className="text-ui text-muted-foreground">{phase === "done" ? THINKING : text}</p>
        {phase === "done" && <Asst>{THOUGHT_ANSWER}</Asst>}
      </div>
      <div className="mt-3">
        <Button size="lg" variant="secondary" onClick={run}>
          Ask again
        </Button>
      </div>
    </>
  );
}

function ReasoningAfter() {
  const { phase, run, text, running } = useThought();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={cn(FRAME, "h-56 space-y-3 overflow-y-auto p-3")}>
        <User>Shadow or border on a resting card?</User>
        <div className="rounded-lg border">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="text-ui-sm text-muted-foreground flex h-9 w-full items-center gap-2 px-2.5"
          >
            <Brain className="size-3.5" aria-hidden="true" />
            {phase === "thinking" ? "Thinking…" : "Thought for 2s"}
            <ChevronDown
              className={cn(
                "duration-fast ml-auto size-4 transition-transform",
                !open && "-rotate-90",
              )}
              aria-hidden="true"
            />
          </button>
          {open && (
            <p className="text-ui-sm text-muted-foreground border-t p-2.5">
              {phase === "done" ? THINKING : text}
              {running && <Caret />}
            </p>
          )}
        </div>
        {phase === "done" && <Asst>{THOUGHT_ANSWER}</Asst>}
      </div>
      <div className="mt-3">
        <Button size="lg" variant="secondary" onClick={run}>
          Ask again
        </Button>
      </div>
    </>
  );
}

/* ── 7. one tool call ─────────────────────────────────────────────── */

const CALL_JSON = `{"type":"tool-call","toolCallId":"call_8fa2","toolName":"get_weather","args":{"city":"Lisbon","unit":"c"}}
{"type":"tool-result","toolCallId":"call_8fa2","result":{"tempC":19,"condition":"clear","humidity":0.41}}`;

function useRun() {
  const [status, setStatus] = useState<"running" | "done">("done");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = () => {
    if (timer.current) clearTimeout(timer.current);
    setStatus("running");
    timer.current = setTimeout(() => setStatus("done"), 1300);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return { status, run };
}

function ToolCallBefore() {
  const { status, run } = useRun();
  return (
    <>
      <div className={cn(FRAME, "h-52 space-y-3 overflow-y-auto p-3")}>
        <User>What is the weather in Lisbon?</User>
        <p className={cn(MONO, "text-muted-foreground")}>
          {status === "running"
            ? '{"type":"tool-call","toolName":"get_weather","state":"partial-call"}'
            : CALL_JSON}
        </p>
        {status === "done" && <Asst>It is 19° and clear in Lisbon.</Asst>}
      </div>
      <div className="mt-3">
        <Button size="lg" variant="secondary" onClick={run}>
          Ask again
        </Button>
      </div>
    </>
  );
}

function ToolCallAfter() {
  const { status, run } = useRun();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={cn(FRAME, "h-52 space-y-3 overflow-y-auto p-3")}>
        <User>What is the weather in Lisbon?</User>
        <div className="rounded-lg border">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-full items-center gap-2 px-2.5"
          >
            <Wrench className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
            <span className="text-ui-sm">Checked the weather</span>
            <span
              className={cn(
                "text-micro rounded-full px-2 py-0.5 uppercase",
                status === "running"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {status === "running" ? "running" : "done"}
            </span>
            <ChevronDown
              className={cn(
                "duration-fast ml-auto size-4 transition-transform",
                !open && "-rotate-90",
              )}
              aria-hidden="true"
            />
          </button>
          {open && (
            <div className="space-y-1 border-t p-2.5">
              <p className="text-micro text-muted-foreground uppercase">Asked for</p>
              <p className="text-caption">Lisbon, in celsius</p>
              <p className="text-micro text-muted-foreground mt-2 uppercase">Came back</p>
              <p className="text-caption">
                {status === "running" ? "…" : "19°, clear, 41% humidity"}
              </p>
            </div>
          )}
        </div>
        {status === "done" && <Asst>It is 19° and clear in Lisbon.</Asst>}
      </div>
      <div className="mt-3">
        <Button size="lg" variant="secondary" onClick={run}>
          Ask again
        </Button>
      </div>
    </>
  );
}

/* ── 8. a run of tool calls ───────────────────────────────────────── */

const RUN_CALLS = [
  { name: "Opened Button.tsx", detail: "src/components/ui/button.tsx · 68 lines" },
  { name: "Searched for shadow-", detail: "4 matches across 3 files" },
  { name: "Opened Card.tsx", detail: "src/components/ui/card.tsx · 92 lines" },
  { name: "Edited Card.tsx", detail: "+2 −1" },
];
const RUN_ANSWER = "Card had a shadow on its resting state. I swapped it for the hairline.";

function ToolRunBefore() {
  return (
    <div className={cn(FRAME, "h-64 space-y-3 overflow-y-auto p-3")}>
      <User>Why does the card look heavy?</User>
      {RUN_CALLS.map((c) => (
        <div key={c.name} className="rounded-lg border p-2.5">
          <p className="text-ui-sm flex items-center gap-2">
            <Wrench className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
            {c.name}
          </p>
          <p className="text-caption text-muted-foreground mt-1 font-mono">{c.detail}</p>
          <p className="text-caption text-muted-foreground mt-1">done</p>
        </div>
      ))}
      <Asst>{RUN_ANSWER}</Asst>
    </div>
  );
}

function ToolRunAfter() {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(FRAME, "h-64 space-y-3 overflow-y-auto p-3")}>
      <User>Why does the card look heavy?</User>
      <div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="text-ui-sm text-muted-foreground hover:bg-secondary flex h-9 w-full items-center gap-2 rounded-lg px-2 transition-colors"
        >
          <Wrench className="size-3.5 shrink-0" aria-hidden="true" />
          Read 3 files and made 1 edit
          <ChevronDown
            className={cn("duration-fast ml-auto size-4 transition-transform", !open && "-rotate-90")}
            aria-hidden="true"
          />
        </button>
        {open && (
          <ul className="mt-1 space-y-1 pl-4">
            {RUN_CALLS.map((c) => (
              <li key={c.name} className="text-caption text-muted-foreground">
                {c.name} — {c.detail}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Asst>{RUN_ANSWER}</Asst>
    </div>
  );
}

/* ── 9. the result, as something you can read ─────────────────────── */

const CITIES = {
  Lisbon: { temp: 19, hi: 21, lo: 14, rain: 10, week: [19, 21, 20, 17, 18] },
  Oslo: { temp: 4, hi: 6, lo: -1, rain: 60, week: [4, 3, 6, 2, 5] },
  Cairo: { temp: 31, hi: 34, lo: 22, rain: 0, week: [31, 33, 34, 30, 32] },
};
type City = keyof typeof CITIES;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function CityPicker({ city, onPick }: { city: City; onPick: (c: City) => void }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {(Object.keys(CITIES) as City[]).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={city === c}
          onClick={() => onPick(c)}
          className={cn(
            "text-caption h-9 rounded-full border px-3 transition-colors",
            city === c ? "bg-secondary" : "hover:bg-secondary",
          )}
        >
          Weather in {c}
        </button>
      ))}
    </div>
  );
}

function ResultBefore() {
  const [city, setCity] = useState<City>("Lisbon");
  const d = CITIES[city];
  return (
    <>
      <CityPicker city={city} onPick={setCity} />
      <div className={cn(FRAME, "space-y-3 p-3")}>
        <User>Weather in {city}?</User>
        <p className={cn(MONO, "text-muted-foreground")}>
          {JSON.stringify(
            {
              city,
              tempC: d.temp,
              highC: d.hi,
              lowC: d.lo,
              precipitation: d.rain / 100,
              forecast: d.week,
            },
            null,
            2,
          )}
        </p>
      </div>
    </>
  );
}

function ResultAfter() {
  const [city, setCity] = useState<City>("Lisbon");
  const d = CITIES[city];
  const max = Math.max(...d.week);
  const min = Math.min(...d.week);
  return (
    <>
      <CityPicker city={city} onPick={setCity} />
      <div className={cn(FRAME, "space-y-3 p-3")}>
        <User>Weather in {city}?</User>
        <div className="rounded-lg border p-3">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="text-title tabular-nums">
              <NumberFlow value={d.temp} />°
            </p>
            <p className="text-caption text-muted-foreground tabular-nums">
              {city} · high {d.hi}° · low {d.lo}°
            </p>
          </div>
          <div className="mt-3 flex h-16 items-end gap-2">
            {d.week.map((t, i) => (
              <div key={DAYS[i]} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="bg-chart-1 duration-base ease-out-quart w-full rounded-sm transition-[height]"
                  style={{ height: `${16 + ((t - min) / Math.max(1, max - min)) * 32}px` }}
                />
                <span className="text-micro text-muted-foreground uppercase">{DAYS[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-caption text-muted-foreground mt-2 tabular-nums">
            {d.rain}% chance of rain
          </p>
        </div>
      </div>
    </>
  );
}

/* ── 10. asking first ─────────────────────────────────────────────── */

function ApproveBefore() {
  const [done, setDone] = useState(false);
  return (
    <>
      <div className={cn(FRAME, "h-44 space-y-3 p-3")}>
        <User>Tidy up my old drafts.</User>
        {done && (
          <>
            <p className="text-caption text-muted-foreground flex items-center gap-2">
              <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="font-mono">delete_drafts(older_than: 30d)</span>
            </p>
            <Asst>Done — I deleted 12 drafts.</Asst>
          </>
        )}
      </div>
      <div className="mt-3">
        <Button size="lg" variant="secondary" onClick={() => setDone(true)}>
          Send it
        </Button>
      </div>
    </>
  );
}

function ApproveAfter() {
  const [state, setState] = useState<"idle" | "asking" | "done" | "kept">("idle");
  return (
    <>
      <div className={cn(FRAME, "h-44 space-y-3 p-3")}>
        <User>Tidy up my old drafts.</User>
        {state === "asking" && (
          <div className="rounded-lg border p-3">
            <p className="text-ui-sm">Delete 12 drafts older than 30 days?</p>
            <p className="text-caption text-muted-foreground mt-1">This cannot be undone.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="lg" variant="destructive" onClick={() => setState("done")}>
                Delete 12
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setState("kept")}>
                Keep them
              </Button>
            </div>
          </div>
        )}
        {state === "done" && <Asst>Deleted 12 drafts.</Asst>}
        {state === "kept" && <Asst>Left them where they were.</Asst>}
      </div>
      <div className="mt-3">
        <Button size="lg" variant="secondary" onClick={() => setState("asking")}>
          Send it
        </Button>
      </div>
    </>
  );
}

/* ── 11. trying again ─────────────────────────────────────────────── */

const TAKES = [
  "Border. On a grey canvas the hairline already separates the surface.",
  "Border — and keep the shadow token for popovers and dialogs.",
  "Neither, usually. Proximity and twelve pixels group the same items without a box.",
];

function BranchBefore() {
  const [i, setI] = useState(0);
  return (
    <>
      <div className={cn(FRAME, "h-40 space-y-3 p-3")}>
        <User>Shadow or border on a resting card?</User>
        <Asst>{TAKES[i]}</Asst>
      </div>
      <div className="mt-3">
        <Button size="lg" variant="secondary" onClick={() => setI((k) => (k + 1) % TAKES.length)}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </>
  );
}

function BranchAfter() {
  const [seen, setSeen] = useState<string[]>([TAKES[0]]);
  const [i, setI] = useState(0);
  return (
    <>
      <div className={cn(FRAME, "h-40 space-y-3 p-3")}>
        <User>Shadow or border on a resting card?</User>
        <Asst>{seen[i]}</Asst>
        {seen.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous answer"
              disabled={i === 0}
              onClick={() => setI((k) => k - 1)}
              className={ICON_BTN}
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </button>
            <span className="text-caption text-muted-foreground tabular-nums">
              {i + 1} of {seen.length}
            </span>
            <button
              type="button"
              aria-label="Next answer"
              disabled={i === seen.length - 1}
              onClick={() => setI((k) => k + 1)}
              className={ICON_BTN}
            >
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div className="mt-3">
        <Button
          size="lg"
          variant="secondary"
          onClick={() => {
            setSeen((s) => [...s, TAKES[s.length % TAKES.length]]);
            setI(seen.length);
          }}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </>
  );
}

/* ── 12. fixing what you sent ─────────────────────────────────────── */

const ASKED = "How wide shoudl the content column be?";
const WIDTH_REPLY = "1152px for the content column, 640px for prose.";

function EditBefore() {
  const [sent, setSent] = useState<string[]>([ASKED]);
  const [text, setText] = useState("");
  return (
    <div className={cn(FRAME, "flex h-56 flex-col")}>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {sent.map((s, i) => (
          <div key={`${i}-${s.slice(0, 8)}`} className="space-y-3">
            <User>{s}</User>
            <Asst>{WIDTH_REPLY}</Asst>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setSent((s) => [...s, text.trim()]);
          setText("");
        }}
        className="flex items-center gap-1 border-t p-2"
      >
        <label htmlFor="aui-edit-b" className="sr-only">
          Message
        </label>
        <input
          id="aui-edit-b"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type the whole question again"
          className={FIELD}
        />
        <button type="submit" aria-label="Send" className={SEND}>
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

function EditAfter() {
  const [asked, setAsked] = useState(ASKED);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ASKED);
  return (
    <div className={cn(FRAME, "flex h-56 flex-col")}>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {editing ? (
          <div className="rounded-2xl border p-2">
            <label htmlFor="aui-edit-a" className="sr-only">
              Edit your message
            </label>
            <textarea
              id="aui-edit-a"
              value={draft}
              rows={2}
              onChange={(e) => setDraft(e.target.value)}
              className="text-ui w-full resize-none bg-transparent px-1 outline-none"
            />
            <div className="mt-1 flex justify-end gap-2">
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  setDraft(asked);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  setAsked(draft);
                  setEditing(false);
                }}
              >
                Send
              </Button>
            </div>
          </div>
        ) : (
          <div className="group/msg flex items-start justify-end gap-1">
            <button
              type="button"
              aria-label="Edit your message"
              onClick={() => {
                setDraft(asked);
                setEditing(true);
              }}
              className={cn(
                ICON_BTN,
                "opacity-0 group-hover/msg:opacity-100 focus-visible:opacity-100",
              )}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>
            <p className="bg-secondary text-ui max-w-[85%] rounded-2xl px-3 py-2">{asked}</p>
          </div>
        )}
        <Asst>{WIDTH_REPLY}</Asst>
      </div>
      <div className="flex items-center gap-1 border-t p-2">
        <p className="text-ui text-muted-foreground min-w-0 flex-1 px-2">
          Hover your question to fix it
        </p>
        <span className={cn(SEND, "opacity-40")} aria-hidden="true">
          <ArrowUp className="size-4" />
        </span>
      </div>
    </div>
  );
}

/* ── 13. the buttons under a message ──────────────────────────────── */

const ACTION_TEXT = "1152px for the content column, 640px for prose.";

function ActionsBefore() {
  const [hover, setHover] = useState(false);
  return (
    <div className={cn(FRAME, "space-y-3 p-3")}>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <Asst>{ACTION_TEXT}</Asst>
        {hover && (
          <div className="flex items-center gap-0.5 pt-2">
            <button
              type="button"
              aria-label="Copy message"
              onClick={() => navigator.clipboard?.writeText(ACTION_TEXT).catch(() => {})}
              className={ICON_BTN}
            >
              <Copy className="size-3.5" aria-hidden="true" />
            </button>
            <button type="button" aria-label="Try again" className={ICON_BTN}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </button>
            <button type="button" aria-label="Good answer" className={ICON_BTN}>
              <ThumbsUp className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <User>And the gap between cards?</User>
      <Asst>Twelve pixels.</Asst>
    </div>
  );
}

function ActionsAfter() {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = () => {
    navigator.clipboard?.writeText(ACTION_TEXT).catch(() => {});
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div className={cn(FRAME, "space-y-3 p-3")}>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <Asst>{ACTION_TEXT}</Asst>
        <div
          className={cn(
            "duration-fast ease-out-quart flex items-center gap-0.5 pt-2 transition-opacity",
            hover || copied ? "opacity-100" : "opacity-0",
          )}
        >
          <button type="button" aria-label="Copy message" onClick={copy} className={ICON_BTN}>
            {copied ? (
              <Check className="text-positive size-3.5" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
          </button>
          <button type="button" aria-label="Try again" className={ICON_BTN}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Good answer" className={ICON_BTN}>
            <ThumbsUp className="size-3.5" aria-hidden="true" />
          </button>
          {copied && <span className="text-caption text-muted-foreground ml-1">Copied</span>}
        </div>
      </div>
      <User>And the gap between cards?</User>
      <Asst>Twelve pixels.</Asst>
    </div>
  );
}

/* ── 14. what you attached ────────────────────────────────────────── */

const POOL = [
  { name: "spec-v4.pdf", kind: "pdf", size: "182 KB" },
  { name: "flow.png", kind: "img", size: "1.1 MB" },
  { name: "rows.csv", kind: "csv", size: "24 KB" },
  { name: "notes.md", kind: "md", size: "6 KB" },
];

function AttachBefore() {
  const [count, setCount] = useState(2);
  return (
    <div className={cn(FRAME, "p-2")}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Attach a file"
          onClick={() => setCount((c) => Math.min(c + 1, POOL.length))}
          className={ICON_BTN}
        >
          <Paperclip className="size-4" aria-hidden="true" />
        </button>
        <p className="text-ui text-muted-foreground min-w-0 flex-1 px-1">
          {count} file{count === 1 ? "" : "s"} attached
        </p>
        <button type="button" aria-label="Send" className={SEND}>
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function AttachAfter() {
  const [files, setFiles] = useState(POOL.slice(0, 2));
  return (
    <div className={cn(FRAME, "space-y-2 p-2")}>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1 pt-1">
          {files.map((f) => (
            <span key={f.name} className="bg-secondary flex h-9 items-center gap-2 rounded-lg pl-2">
              <span className="bg-card text-micro grid size-6 place-items-center rounded border uppercase">
                {f.kind}
              </span>
              <span className="text-caption">
                {f.name}
                <span className="text-muted-foreground"> · {f.size}</span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles((v) => v.filter((x) => x.name !== f.name))}
                className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-lg transition-colors"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Attach a file"
          onClick={() =>
            setFiles((v) => {
              const next = POOL.find((f) => !v.some((x) => x.name === f.name));
              return next ? [...v, next] : v;
            })
          }
          className={ICON_BTN}
        >
          <Paperclip className="size-4" aria-hidden="true" />
        </button>
        <p className="text-ui text-muted-foreground min-w-0 flex-1 px-1">Send a message</p>
        <button type="button" aria-label="Send" className={SEND}>
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ── 15. quoting one line ─────────────────────────────────────────── */

const QUOTABLE =
  "Group with proximity and a hairline before reaching for a container. Every extra box is a box the eye has to parse, and a page of boxes reads as a form rather than a document.";

function QuoteBefore() {
  const [text, setText] = useState("");
  return (
    <div className={cn(FRAME, "p-3")}>
      <Asst>{QUOTABLE}</Asst>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-3 flex items-center gap-1 rounded-lg border p-2"
      >
        <label htmlFor="aui-quote-b" className="sr-only">
          Message
        </label>
        <input
          id="aui-quote-b"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Select a line above — then retype it in here"
          className={FIELD}
        />
        <button type="submit" aria-label="Send" className={SEND}>
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

function QuoteAfter() {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [quoted, setQuoted] = useState<string | null>(null);
  const [text, setText] = useState("");

  const onUp = () => {
    const sel = window.getSelection();
    const node = box.current;
    if (!sel || sel.isCollapsed || !node) {
      setTip(null);
      return;
    }
    const value = sel.toString().trim();
    if (!value) {
      setTip(null);
      return;
    }
    const r = sel.getRangeAt(0).getBoundingClientRect();
    const b = node.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2 - b.left, y: r.top - b.top, text: value });
  };

  return (
    <div className={cn(FRAME, "p-3")}>
      <div ref={box} className="relative" onMouseUp={onUp}>
        <Asst>{QUOTABLE}</Asst>
        {tip && (
          <div
            style={{ left: tip.x, top: tip.y }}
            className="bg-popover shadow-floating absolute -mt-2 -translate-x-1/2 -translate-y-full rounded-lg p-1"
          >
            <button
              type="button"
              onClick={() => {
                setQuoted(tip.text);
                setTip(null);
                window.getSelection()?.removeAllRanges();
              }}
              className="text-caption hover:bg-secondary flex h-9 items-center gap-1.5 rounded-md px-3 transition-colors"
            >
              <QuoteIcon className="size-3.5" aria-hidden="true" />
              Quote
            </button>
          </div>
        )}
      </div>
      <form onSubmit={(e) => e.preventDefault()} className="mt-3 rounded-lg border p-2">
        {quoted && (
          <div className="bg-secondary mb-2 flex items-start gap-2 rounded-md p-2">
            <span className="border-accent-solid text-caption min-w-0 flex-1 border-l pl-2">
              {quoted}
            </span>
            <button
              type="button"
              aria-label="Drop the quote"
              onClick={() => setQuoted(null)}
              className="text-muted-foreground hover:text-foreground grid size-9 shrink-0 place-items-center rounded-md transition-colors"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <label htmlFor="aui-quote-a" className="sr-only">
            Message
          </label>
          <input
            id="aui-quote-a"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={quoted ? "Ask about the quote" : "Select a line above"}
            className={FIELD}
          />
          <button type="submit" aria-label="Send" className={SEND}>
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── 16. picking a tool ───────────────────────────────────────────── */

const MENTIONABLE = [
  { id: "search_docs", label: "Search the docs" },
  { id: "read_figma", label: "Read a Figma file" },
  { id: "run_tests", label: "Run the test suite" },
  { id: "open_pr", label: "Open a pull request" },
];

function MentionBefore() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className={cn(FRAME, "flex h-52 flex-col")}>
      <div className="flex-1 space-y-3 p-3">
        {sent ? (
          <User>{sent}</User>
        ) : (
          <p className="text-ui-sm text-muted-foreground">
            Ask it to use a tool. You have to know the name.
          </p>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            setSent(text.trim());
            setText("");
          }
        }}
        className="flex items-center gap-1 border-t p-2"
      >
        <label htmlFor="aui-at-b" className="sr-only">
          Message
        </label>
        <input
          id="aui-at-b"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Use @search_docs to find…"
          className={FIELD}
        />
        <button type="submit" aria-label="Send" className={SEND}>
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

function MentionAfter() {
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [sent, setSent] = useState<{ tools: string[]; text: string } | null>(null);

  const at = /(?:^|\s)@(\w*)$/.exec(text);
  const query = at ? at[1].toLowerCase() : null;
  const matches =
    query === null
      ? []
      : MENTIONABLE.filter((m) => m.id.includes(query) || m.label.toLowerCase().includes(query));

  const pick = (id: string) => {
    setPicked((p) => (p.includes(id) ? p : [...p, id]));
    setText((t) => t.replace(/(?:^|\s)@(\w*)$/, "").trimStart());
  };

  return (
    <div className={cn(FRAME, "flex h-52 flex-col")}>
      <div className="flex-1 space-y-3 p-3">
        {sent ? (
          <div className="flex justify-end">
            <p className="bg-secondary text-ui flex max-w-[85%] flex-wrap items-center gap-1.5 rounded-2xl px-3 py-2">
              {sent.tools.map((t) => (
                <span
                  key={t}
                  className="bg-accent text-accent-foreground text-caption rounded-md px-1.5"
                >
                  @{t}
                </span>
              ))}
              {sent.text}
            </p>
          </div>
        ) : (
          <p className="text-ui-sm text-muted-foreground">Type @ in the box below.</p>
        )}
      </div>
      <div className="relative border-t p-2">
        {matches.length > 0 && (
          <div className="bg-popover shadow-floating absolute right-2 bottom-full left-2 mb-1 rounded-lg p-1">
            {matches.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pick(m.id)}
                className="hover:bg-secondary flex h-9 w-full items-center gap-2 rounded-md px-2 text-left transition-colors"
              >
                <AtSign className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
                <span className="text-ui-sm">{m.label}</span>
                <span className="text-caption text-muted-foreground ml-auto truncate font-mono">
                  {m.id}
                </span>
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim() && picked.length === 0) return;
            setSent({ tools: picked, text: text.trim() });
            setText("");
            setPicked([]);
          }}
          className="flex flex-wrap items-center gap-1.5"
        >
          {picked.map((p) => (
            <span
              key={p}
              className="bg-accent text-accent-foreground text-caption flex h-9 items-center gap-1 rounded-lg pl-2"
            >
              @{p}
              <button
                type="button"
                aria-label={`Remove ${p}`}
                onClick={() => setPicked((v) => v.filter((x) => x !== p))}
                className="grid size-9 place-items-center"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <label htmlFor="aui-at-a" className="sr-only">
            Message
          </label>
          <input
            id="aui-at-a"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type @ to pick a tool"
            className={FIELD}
          />
          <button type="submit" aria-label="Send" className={SEND}>
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── 17. where it came from ───────────────────────────────────────── */

const SOURCES = [
  { title: "Elevation and depth", host: "design.internal" },
  { title: "Material 3 — elevation", host: "m3.material.io" },
  { title: "Refactoring UI, ch. 6", host: "refactoringui.com" },
];

function Sup({ n }: { n: number }) {
  return (
    <sup className="text-micro text-muted-foreground bg-secondary ml-0.5 rounded px-1 tabular-nums">
      {n}
    </sup>
  );
}

function SourcesBefore() {
  return (
    <div className={cn(FRAME, "space-y-3 p-3")}>
      <User>Where does the no-shadow rule come from?</User>
      <Asst className="break-words">
        A resting card gets a hairline rather than a shadow
        (https://design.internal/foundations/elevation-and-depth), which matches the Material 3
        guidance on levels (https://m3.material.io/styles/elevation/overview) and the chapter on
        depth in Refactoring UI (https://refactoringui.com/book/chapter-6).
      </Asst>
    </div>
  );
}

function SourcesAfter() {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(FRAME, "space-y-3 p-3")}>
      <User>Where does the no-shadow rule come from?</User>
      <Asst>
        A resting card gets a hairline rather than a shadow
        <Sup n={1} />, which matches the Material 3 guidance on levels
        <Sup n={2} /> and the chapter on depth in Refactoring UI
        <Sup n={3} />.
      </Asst>
      <div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="text-caption text-muted-foreground hover:text-foreground flex h-9 items-center gap-1.5 transition-colors"
        >
          <Link2 className="size-3.5" aria-hidden="true" />
          {SOURCES.length} sources
          <ChevronDown
            className={cn("duration-fast size-3.5 transition-transform", !open && "-rotate-90")}
            aria-hidden="true"
          />
        </button>
        {open && (
          <ul>
            {SOURCES.map((s, i) => (
              <li key={s.host}>
                <button
                  type="button"
                  className="hover:bg-secondary flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors"
                >
                  <span className="text-micro text-muted-foreground bg-secondary grid size-5 shrink-0 place-items-center rounded tabular-nums">
                    {i + 1}
                  </span>
                  <Globe className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
                  <span className="text-caption truncate">{s.title}</span>
                  <span className="text-caption text-muted-foreground truncate">{s.host}</span>
                  <ExternalLink
                    className="text-muted-foreground ml-auto size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── 18. when it fails ────────────────────────────────────────────── */

function ErrorBefore() {
  const [failed, setFailed] = useState(true);
  const [text, setText] = useState("");
  return (
    <div className={cn(FRAME, "flex h-52 flex-col")}>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <User>Summarise the last release.</User>
        {failed && (
          <p className={cn(MONO, "text-destructive")}>
            {
              'Error: {"type":"error","error":{"type":"overloaded_error","status":529}} at ChatCompletion.stream (chunk-4f2a.js:118)'
            }
          </p>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setFailed(false);
          setText("");
        }}
        className="flex items-center gap-1 border-t p-2"
      >
        <label htmlFor="aui-err-b" className="sr-only">
          Message
        </label>
        <input
          id="aui-err-b"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask the whole thing again"
          className={FIELD}
        />
        <button type="submit" aria-label="Send" className={SEND}>
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

function ErrorAfter() {
  const [state, setState] = useState<"failed" | "ok">("failed");
  return (
    <div className={cn(FRAME, "h-52 space-y-3 p-3")}>
      <User>Summarise the last release.</User>
      {state === "failed" ? (
        <div className="border-destructive/30 flex items-start gap-2 rounded-lg border p-3">
          <TriangleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-ui-sm" role="alert">
              The model is busy right now. Nothing was lost.
            </p>
            <div className="mt-2">
              <Button size="lg" variant="secondary" onClick={() => setState("ok")}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Asst>Shipped: the branch picker, resumable streams, and grouped tool calls.</Asst>
          <Button size="lg" variant="ghost" onClick={() => setState("failed")}>
            Make it fail again
          </Button>
        </>
      )}
    </div>
  );
}

/* ── 19. your other conversations ─────────────────────────────────── */

type Chat = { id: number; title: string; plain: string; archived: boolean };
const CHATS: Chat[] = [
  { id: 1, title: "Shadow versus border", plain: "Thread 1", archived: false },
  { id: 2, title: "Naming colour tokens", plain: "Thread 2", archived: false },
  { id: 3, title: "Empty state copy", plain: "Thread 3", archived: false },
  { id: 4, title: "Old spike, abandoned", plain: "Thread 4", archived: true },
];

function ChatsBefore() {
  const [chats, setChats] = useState<Chat[]>(CHATS.filter((c) => !c.archived));
  const [next, setNext] = useState(5);
  return (
    <div className={cn(FRAME, "p-2")}>
      <button
        type="button"
        onClick={() => {
          setChats((c) => [
            ...c,
            { id: next, title: `Chat ${next}`, plain: `Thread ${next}`, archived: false },
          ]);
          setNext((n) => n + 1);
        }}
        className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center gap-2 rounded-lg border px-3 transition-colors"
      >
        <Plus className="size-4" aria-hidden="true" />
        New thread
      </button>
      <ul className="mt-2">
        {chats.map((c) => (
          <li key={c.id}>
            <button type="button" className="text-ui-sm flex h-9 w-full items-center px-2 text-left">
              {c.plain}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChatsAfter() {
  const [chats, setChats] = useState<Chat[]>(CHATS);
  const [active, setActive] = useState(1);
  const [next, setNext] = useState(5);
  const [archivedView, setArchivedView] = useState(false);
  const [query, setQuery] = useState("");
  const visible = chats.filter(
    (c) => c.archived === archivedView && c.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className={cn(FRAME, "p-2")}>
      <button
        type="button"
        onClick={() => {
          setChats((c) => [
            { id: next, title: "New conversation", plain: `Thread ${next}`, archived: false },
            ...c,
          ]);
          setActive(next);
          setNext((n) => n + 1);
          setArchivedView(false);
        }}
        className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center gap-2 rounded-lg border px-3 transition-colors"
      >
        <Plus className="size-4" aria-hidden="true" />
        New chat
      </button>
      <div className="bg-secondary mt-2 flex h-9 items-center gap-2 rounded-lg px-2.5">
        <Search className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
        <label htmlFor="aui-chat-search" className="sr-only">
          Search your conversations
        </label>
        <input
          id="aui-chat-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="text-ui-sm min-w-0 flex-1 bg-transparent outline-none"
        />
      </div>
      <ul className="mt-2 space-y-0.5">
        {visible.length === 0 && (
          <li className="text-caption text-muted-foreground px-2 py-3">
            Nothing {archivedView ? "archived" : "here"} yet.
          </li>
        )}
        {visible.map((c) => (
          <li
            key={c.id}
            className={cn(
              "group/row flex items-center gap-1 rounded-lg pr-1",
              active === c.id && !c.archived && "bg-accent",
            )}
          >
            <button
              type="button"
              onClick={() => setActive(c.id)}
              className={cn(
                "text-ui-sm flex h-9 min-w-0 flex-1 items-center px-2 text-left",
                active === c.id && !c.archived && "text-accent-foreground",
              )}
            >
              <span className="truncate">{c.title}</span>
            </button>
            <button
              type="button"
              aria-label={c.archived ? `Restore ${c.title}` : `Archive ${c.title}`}
              onClick={() =>
                setChats((v) => v.map((x) => (x.id === c.id ? { ...x, archived: !x.archived } : x)))
              }
              className={cn(
                ICON_BTN,
                "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
              )}
            >
              <Archive className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Delete ${c.title}`}
              onClick={() => setChats((v) => v.filter((x) => x.id !== c.id))}
              className={cn(
                ICON_BTN,
                "hover:text-destructive opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
              )}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setArchivedView((v) => !v)}
        className="text-caption text-muted-foreground hover:text-foreground mt-2 flex h-9 items-center px-2 transition-colors"
      >
        {archivedView ? "Back to your chats" : "Archived"}
      </button>
    </div>
  );
}

/* ── 20. a formula ────────────────────────────────────────────────── */

function Frac({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span className="mx-1 inline-flex flex-col items-center align-middle leading-tight">
      <span className="px-1">{top}</span>
      <span className="border-foreground w-full border-t" aria-hidden="true" />
      <span className="px-1">{bottom}</span>
    </span>
  );
}

function MathShell({ rendered }: { rendered: boolean }) {
  const [n, setN] = useState(6);
  const pairs = (n * (n - 1)) / 2;
  const id = rendered ? "aui-n-a" : "aui-n-b";
  return (
    <>
      <div className={cn(FRAME, "space-y-3 p-3")}>
        <User>How many handshakes in a room of {n} people?</User>
        {rendered ? (
          <Asst>
            <span className="inline-flex flex-wrap items-center tabular-nums">
              Everyone shakes hands once, so it is
              <Frac top={`${n} × ${n - 1}`} bottom="2" />= {pairs} handshakes, for{" "}
              <span className="mx-1 italic">n</span> ≥ 2.
            </span>
          </Asst>
        ) : (
          <Asst>
            <span className="font-mono">
              {`Everyone shakes hands once, so it is $\\frac{${n}(${n}-1)}{2} = ${pairs}$ handshakes, for $n \\ge 2$.`}
            </span>
          </Asst>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <label htmlFor={id} className="text-caption text-muted-foreground">
          People in the room
        </label>
        <input
          id={id}
          type="range"
          min={2}
          max={20}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="accent-accent-solid h-9 min-w-0 flex-1"
        />
        <span className="text-caption w-6 tabular-nums">{n}</span>
      </div>
    </>
  );
}

/* ── 21. a code change ────────────────────────────────────────────── */

type Line = { n: number; kind: "same" | "add" | "del"; text: string };
const DIFFS: Record<string, Line[]> = {
  "card.tsx": [
    { n: 11, kind: "same", text: "export function Card({ children }) {" },
    { n: 12, kind: "del", text: '  return <div className="rounded-2xl shadow-lg p-6">' },
    { n: 12, kind: "add", text: '  return <div className="rounded-xl border p-6">' },
    { n: 13, kind: "same", text: "    {children}" },
    { n: 14, kind: "same", text: "  </div>;" },
    { n: 15, kind: "same", text: "}" },
  ],
  "tokens.css": [
    { n: 4, kind: "same", text: ":root {" },
    // taste-check-ignore: these hexes are the diff being displayed
    { n: 5, kind: "del", text: "  --line: #d4d4d8;" },
    // taste-check-ignore: content, not styling
    { n: 5, kind: "add", text: "  --line: #e7e7ea;" },
    { n: 6, kind: "same", text: "}" },
  ],
};

function DiffTabs({ file, onPick }: { file: string; onPick: (f: string) => void }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {Object.keys(DIFFS).map((f) => (
        <button
          key={f}
          type="button"
          aria-pressed={file === f}
          onClick={() => onPick(f)}
          className={cn(
            "text-caption h-9 rounded-full border px-3 font-mono transition-colors",
            file === f ? "bg-secondary" : "hover:bg-secondary",
          )}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

function DiffBefore() {
  const [file, setFile] = useState("card.tsx");
  const lines = DIFFS[file];
  return (
    <>
      <DiffTabs file={file} onPick={setFile} />
      <div className={cn(FRAME, "space-y-3 p-3")}>
        <Asst>Here is the change:</Asst>
        <p className={MONO}>
          {lines
            .map((l) => `${l.kind === "add" ? "+" : l.kind === "del" ? "-" : " "} ${l.text}`)
            .join("\n")}
        </p>
      </div>
    </>
  );
}

function DiffAfter() {
  const [file, setFile] = useState("card.tsx");
  const lines = DIFFS[file];
  const adds = lines.filter((l) => l.kind === "add").length;
  const dels = lines.filter((l) => l.kind === "del").length;
  return (
    <>
      <DiffTabs file={file} onPick={setFile} />
      <div className={cn(FRAME, "space-y-3 p-3")}>
        <Asst>Here is the change:</Asst>
        <div className="overflow-hidden rounded-lg border">
          <div className="bg-secondary flex h-9 items-center gap-2 px-2.5">
            <span className="text-caption font-mono">{file}</span>
            <span className="text-caption text-positive ml-auto tabular-nums">+{adds}</span>
            <span className="text-caption text-destructive tabular-nums">−{dels}</span>
          </div>
          <div className="overflow-x-auto">
            {lines.map((l, i) => (
              <div
                key={`${l.n}-${i}`}
                className={cn(
                  "text-caption flex gap-3 px-2.5 py-0.5 font-mono whitespace-pre",
                  l.kind === "add" && "bg-positive/10",
                  l.kind === "del" && "bg-destructive/10",
                )}
              >
                <span className="text-muted-foreground w-5 shrink-0 text-right tabular-nums">
                  {l.n}
                </span>
                <span
                  className={cn(
                    "w-2 shrink-0",
                    l.kind === "add" && "text-positive",
                    l.kind === "del" && "text-destructive",
                  )}
                  aria-hidden="true"
                >
                  {l.kind === "add" ? "+" : l.kind === "del" ? "−" : " "}
                </span>
                <span>{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 22. surviving a reload ───────────────────────────────────────── */

const RESUME_TEXT =
  "Start with the canvas: take the page off white so every panel has something to sit on. Then turn the borders down until you can barely see them, pull the colour out of the chrome, and give the rows their height back. By that point most of the work is done.";

function ResumeBefore() {
  const { n, running, start, stop, setN } = useTyper(RESUME_TEXT, 2, 22);
  return (
    <>
      <div className={cn(FRAME, "h-48 space-y-3 overflow-y-auto p-3")}>
        <User>How do I start the redesign?</User>
        {n > 0 ? (
          <Asst>
            {RESUME_TEXT.slice(0, n)}
            {running && <Caret />}
          </Asst>
        ) : (
          <p className="text-ui-sm text-muted-foreground">No reply here.</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="lg" variant="secondary" onClick={() => start()} disabled={running}>
          <Sparkles className="size-3.5" aria-hidden="true" />
          Ask
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => {
            stop();
            setN(0);
          }}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reload the page
        </Button>
      </div>
    </>
  );
}

function ResumeAfter() {
  const { n, running, start, stop } = useTyper(RESUME_TEXT, 2, 22);
  const [reloading, setReloading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = () => {
    const at = n;
    stop();
    setReloading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setReloading(false);
      if (at > 0 && at < RESUME_TEXT.length) start(at);
    }, 700);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <>
      <div className={cn(FRAME, "h-48 space-y-3 overflow-y-auto p-3")}>
        <User>How do I start the redesign?</User>
        {reloading ? (
          <p className="text-ui-sm text-muted-foreground">Reconnecting…</p>
        ) : n > 0 ? (
          <Asst>
            {RESUME_TEXT.slice(0, n)}
            {running && <Caret />}
          </Asst>
        ) : (
          <p className="text-ui-sm text-muted-foreground">No reply yet.</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="lg"
          variant="secondary"
          onClick={() => start()}
          disabled={running || reloading}
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          Ask
        </Button>
        <Button size="lg" variant="secondary" onClick={reload} disabled={reloading}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reload the page
        </Button>
      </div>
    </>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function AssistantUiDemo() {
  return (
    <>
      <BeforeAfter
        principle="You get somewhere to start instead of a blank box."
        before={<EmptyBefore />}
        after={<EmptyAfter />}
      />
      <BeforeAfter
        principle="Send it, then stop it. You no longer have to sit through a reply you do not want."
        before={<StopBefore />}
        after={<StopAfter />}
      />
      <BeforeAfter
        principle="Scroll up to read something, then let a reply arrive."
        before={<ScrollBefore />}
        after={<ScrollAfter />}
      />
      <BeforeAfter
        principle="The answer reads like an answer, not like the source code of one."
        before={<MarkdownShell rendered={false} />}
        after={<MarkdownShell rendered />}
      />
      <BeforeAfter
        principle="Press stream. The code stops arriving as gibberish and then rearranging itself."
        before={<StreamMdShell safe={false} />}
        after={<StreamMdShell safe />}
      />
      <BeforeAfter
        principle="The answer stays at the top. The thinking is there if you want it."
        before={<ReasoningBefore />}
        after={<ReasoningAfter />}
      />
      <BeforeAfter
        principle="You can read the answer without stepping over the machinery."
        before={<ToolCallBefore />}
        after={<ToolCallAfter />}
      />
      <BeforeAfter
        principle="The answer is not buried under four boxes you did not ask for."
        before={<ToolRunBefore />}
        after={<ToolRunAfter />}
      />
      <BeforeAfter
        principle="You can read the weather at a glance."
        before={<ResultBefore />}
        after={<ResultAfter />}
      />
      <BeforeAfter
        principle="It asks first, before doing the thing you cannot undo."
        before={<ApproveBefore />}
        after={<ApproveAfter />}
      />
      <BeforeAfter
        principle="Trying again no longer loses the answer you liked."
        before={<BranchBefore />}
        after={<BranchAfter />}
      />
      <BeforeAfter
        principle="Fix the typo in your question without typing the whole thing again."
        before={<EditBefore />}
        after={<EditAfter />}
      />
      <BeforeAfter
        principle="Move the mouse over the first answer. Nothing jumps, and copying says it worked."
        before={<ActionsBefore />}
        after={<ActionsAfter />}
      />
      <BeforeAfter
        principle="You can see what you attached, and take one back off."
        before={<AttachBefore />}
        after={<AttachAfter />}
      />
      <BeforeAfter
        principle="Select a line and ask about just that line."
        before={<QuoteBefore />}
        after={<QuoteAfter />}
      />
      <BeforeAfter
        principle="Type @ and pick from the list instead of remembering the name."
        before={<MentionBefore />}
        after={<MentionAfter />}
      />
      <BeforeAfter
        principle="You can still see where each claim came from, without the links in the way."
        before={<SourcesBefore />}
        after={<SourcesAfter />}
      />
      <BeforeAfter
        principle="When it fails it says so in words, and one press picks up where you were."
        before={<ErrorBefore />}
        after={<ErrorAfter />}
      />
      <BeforeAfter
        principle="You can find the conversation you were in."
        before={<ChatsBefore />}
        after={<ChatsAfter />}
      />
      <BeforeAfter
        principle="The formula looks like a formula."
        before={<MathShell rendered={false} />}
        after={<MathShell rendered />}
      />
      <BeforeAfter
        principle="You can see what actually changed."
        before={<DiffBefore />}
        after={<DiffAfter />}
      />
      <BeforeAfter
        principle="Ask, then reload halfway through. The answer keeps coming."
        before={<ResumeBefore />}
        after={<ResumeAfter />}
      />
    </>
  );
}
