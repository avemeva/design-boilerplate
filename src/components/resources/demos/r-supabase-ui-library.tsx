"use client";

import NumberFlow from "@number-flow/react";
import {
  Check,
  FileText,
  Image as ImageIcon,
  Loader2,
  MousePointer2,
  RotateCcw,
  Send,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";

import { BeforeAfter } from "@/components/surface";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Supabase UI Library — https://supabase.com/ui
 *
 * Thirteen registry blocks (client, current-user-avatar, dropzone,
 * infinite-query-hook, password-based-auth, realtime-avatar-stack,
 * realtime-chat, realtime-cursor, realtime-flow, realtime-monaco,
 * social-auth, tanstack-db, platform-kit). Read from the registry JSON
 * rather than the docs, the interesting part is not the Supabase
 * wiring — it is the ~38 small decisions inside those blocks about
 * what happens when something goes wrong or arrives late.
 *
 * Every one of those a person can *see* is a switch below. The
 * transport is stubbed, because the behaviour, not the channel, is the
 * part worth keeping.
 *
 * Left out: everything invisible from the outside — the publishable-key
 * env vars, the per-framework registry split, the typed Database
 * generics in use-infinite-query, y-supabase document merging, Monaco
 * model wiring, and the platform kit.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

const CONTROL =
  "text-ui-sm inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 transition-colors disabled:pointer-events-none disabled:opacity-50";
const SOLID = `${CONTROL} bg-foreground text-background hover:opacity-90`;
const QUIET = `${CONTROL} bg-secondary text-foreground hover:bg-muted`;
const GHOST = `${CONTROL} text-muted-foreground hover:text-foreground`;

/* ── 1 · dropzone: which file is the problem ──────────────────────── */

type Drop = { name: string; size: string; mb: number; image?: boolean };

const DROP_BATCH: Drop[] = [
  { name: "cover-art.png", size: "2.4 MB", mb: 2.4, image: true },
  { name: "walkthrough.mp4", size: "14.2 MB", mb: 14.2 },
  { name: "release-notes.pdf", size: "0.8 MB", mb: 0.8 },
];
const MAX_MB = 10;

function DropzonePair({ after }: Side) {
  const [files, setFiles] = useState<Drop[]>([]);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);

  const oversized = files.filter((f) => f.mb > MAX_MB);

  const reset = () => {
    setFiles([]);
    setFailed(false);
    setDone(false);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className={cn(
          "duration-base ease-out-quart rounded-xl border border-dashed p-4 transition-colors",
          after &&
            oversized.length > 0 &&
            "border-destructive/40 bg-destructive/5",
          !after && failed && "border-destructive/40",
        )}
      >
        {done ? (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <span className="bg-secondary text-positive grid size-9 place-items-center rounded-full">
              <Check aria-hidden className="size-4" strokeWidth={2.5} />
            </span>
            <p className="text-ui">Uploaded {files.length} files</p>
            <button type="button" className={GHOST} onClick={reset}>
              Start over
            </button>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <Upload aria-hidden className="text-muted-foreground size-5" />
            <p className="text-ui">Upload files</p>
            <p className="text-caption text-muted-foreground">
              {after
                ? "Up to 4 files, 10 MB each"
                : "Drag and drop, or pick them from your computer"}
            </p>
            <button
              type="button"
              className={QUIET}
              onClick={() => {
                setFiles(DROP_BATCH);
              }}
            >
              Select files
            </button>
          </div>
        ) : (
          <>
            <ul>
              {files.map((f) => {
                const over = f.mb > MAX_MB;
                return (
                  <li
                    key={f.name}
                    className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
                  >
                    <span className="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-md border">
                      {f.image ? (
                        <ImageIcon aria-hidden className="size-4" />
                      ) : (
                        <FileText aria-hidden className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-ui-sm block truncate">
                        {f.name}
                      </span>
                      {after && (
                        <span
                          className={cn(
                            "text-caption block",
                            over ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {over
                            ? `Bigger than 10 MB — this one is ${f.size}`
                            : f.size}
                        </span>
                      )}
                    </span>
                    {after && (
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        onClick={() => {
                          setFiles(files.filter((x) => x.name !== f.name));
                        }}
                        className="text-muted-foreground hover:bg-secondary hover:text-foreground grid size-9 shrink-0 place-items-center rounded-md transition-colors"
                      >
                        <X aria-hidden className="size-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {!after && failed && (
              <p className="text-caption text-destructive mt-3">
                Upload failed. One or more files could not be uploaded.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {after ? (
                <button
                  type="button"
                  className={SOLID}
                  disabled={oversized.length > 0}
                  onClick={() => {
                    setDone(true);
                  }}
                >
                  {oversized.length > 0
                    ? `Remove ${String(oversized.length)} file${oversized.length > 1 ? "s" : ""} to continue`
                    : `Upload ${String(files.length)} file${files.length > 1 ? "s" : ""}`}
                </button>
              ) : (
                <button
                  type="button"
                  className={SOLID}
                  onClick={() => {
                    setFailed(true);
                  }}
                >
                  Upload files
                </button>
              )}
              <button type="button" className={GHOST} onClick={reset}>
                Clear
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 2 · dropzone: only what broke tries again ────────────────────── */

const QUEUE = [
  "cover-art.png",
  "brief.docx",
  "walkthrough.mp4",
  "release-notes.pdf",
];
const FLAKY = "walkthrough.mp4";

type UpState = "queued" | "sending" | "ok" | "fail";

const freshQueue = () =>
  Object.fromEntries(QUEUE.map((n) => [n, "queued"])) as Record<string, UpState>;

function RetryPair({ after }: Side) {
  const [status, setStatus] = useState<Record<string, UpState>>(freshQueue);
  const [sent, setSent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const failing = QUEUE.filter((n) => status[n] === "fail");
  const uploaded = QUEUE.filter((n) => status[n] === "ok");
  const allDone = uploaded.length === QUEUE.length;

  const run = () => {
    if (busy || allDone) return;
    const targets = after ? QUEUE.filter((n) => status[n] !== "ok") : QUEUE;
    const nextAttempt = attempt + 1;

    setAttempt(nextAttempt);
    setBusy(true);
    setSent((n) => n + targets.length);
    setStatus(() => {
      const next = freshQueue();
      for (const n of QUEUE) {
        next[n] = targets.includes(n)
          ? "sending"
          : after && status[n] === "ok"
            ? "ok"
            : "queued";
      }
      return next;
    });

    setTimeout(
      () => {
        const breaks = targets.includes(FLAKY) && nextAttempt === 1;
        setStatus((s) => {
          const next = { ...s };
          for (const n of targets) next[n] = "ok";
          if (breaks) {
            next[FLAKY] = "fail";
            /* The naive version forgets what already went up. */
            if (!after) {
              for (const n of QUEUE) if (n !== FLAKY) next[n] = "queued";
            }
          }
          return next;
        });
        setBusy(false);
      },
      260 + targets.length * 220,
    );
  };

  const remaining = after ? QUEUE.length - uploaded.length : QUEUE.length;
  const label = busy
    ? "Uploading…"
    : allDone
      ? "All uploaded"
      : after && failing.length > 0
        ? `Retry ${String(failing.length)} file`
        : `Upload ${String(remaining)} files`;

  return (
    <div className="mx-auto w-full max-w-md">
      <ul className="rounded-xl border">
        {QUEUE.map((name) => {
          const s = status[name];
          return (
            <li
              key={name}
              className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
            >
              <span className="bg-secondary text-muted-foreground grid size-8 shrink-0 place-items-center rounded-md border">
                <FileText aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-ui-sm block truncate">{name}</span>
                <span
                  className={cn(
                    "text-caption block",
                    s === "ok"
                      ? "text-positive"
                      : s === "fail"
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  {s === "sending"
                    ? "Uploading…"
                    : s === "ok"
                      ? "Uploaded"
                      : s === "fail"
                        ? "Failed — the connection dropped"
                        : "Waiting"}
                </span>
              </span>
              <span className="grid size-5 shrink-0 place-items-center">
                {s === "sending" && (
                  <Loader2
                    aria-hidden
                    className="text-muted-foreground size-4 animate-spin"
                  />
                )}
                {s === "ok" && (
                  <Check
                    aria-hidden
                    className="text-positive size-4"
                    strokeWidth={2.5}
                  />
                )}
                {s === "fail" && (
                  <X aria-hidden className="text-destructive size-4" />
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {!after && failing.length > 0 && (
        <p className="text-caption text-destructive mt-3">
          Upload failed. Please try again.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={SOLID}
          disabled={busy || allDone}
          onClick={run}
        >
          {label}
        </button>
        <button
          type="button"
          className={GHOST}
          onClick={() => {
            setStatus(freshQueue());
            setSent(0);
            setAttempt(0);
            setBusy(false);
          }}
        >
          Start over
        </button>
        <span className="text-caption text-muted-foreground ml-auto tabular-nums">
          <NumberFlow value={sent} /> files sent over the wire
        </span>
      </div>
    </div>
  );
}

/* ── 3 · realtime cursor: a pointer that glides ───────────────────── */

const START = { x: 150, y: 92 };
const SAMPLE_MS = 80;

function PeerCursor({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-start">
      <MousePointer2
        aria-hidden
        className="text-foreground fill-foreground size-5"
      />
      <span className="text-micro bg-foreground text-background mt-0.5 ml-3 rounded-full px-2 py-0.5 uppercase">
        {name}
      </span>
    </div>
  );
}

function CursorPair({ after }: Side) {
  const [peer, setPeer] = useState(START);
  const [live, setLive] = useState(false);
  const latest = useRef(START);
  const lastSend = useRef(0);
  const trailing = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* The library's useThrottleCallback: leading edge, plus one trailing
     timeout carrying the newest arguments. The naive version keeps the
     leading edge only, so the last move of a gesture is thrown away. */
  const broadcast = () => {
    const now = Date.now();
    const left = SAMPLE_MS - (now - lastSend.current);

    if (left <= 0) {
      if (trailing.current) {
        clearTimeout(trailing.current);
        trailing.current = null;
      }
      lastSend.current = now;
      setPeer({ ...latest.current });
    } else if (after && !trailing.current) {
      trailing.current = setTimeout(() => {
        lastSend.current = Date.now();
        trailing.current = null;
        setPeer({ ...latest.current });
      }, left);
    }
  };

  return (
    <div
      onPointerMove={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        latest.current = { x: e.clientX - b.left, y: e.clientY - b.top };
        setLive(true);
        broadcast();
      }}
      onPointerLeave={() => {
        setLive(false);
      }}
      className="bg-secondary relative h-56 overflow-hidden rounded-xl border"
    >
      <div className="pointer-events-none absolute inset-0 p-5 select-none">
        <div className="bg-foreground/10 h-2.5 w-32 rounded-full" />
        <div className="bg-foreground/5 mt-3 h-2 w-full rounded-full" />
        <div className="bg-foreground/5 mt-2 h-2 w-4/5 rounded-full" />
        <div className="bg-foreground/5 mt-2 h-2 w-11/12 rounded-full" />
        <div className="bg-card mt-4 h-16 w-40 rounded-lg border" />
      </div>

      {after ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0"
          animate={{ x: peer.x, y: peer.y, opacity: live ? 1 : 0.45 }}
          transition={spring.snappy}
        >
          <PeerCursor name="Priya" />
        </motion.div>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0"
          style={{
            transform: `translate(${String(peer.x)}px, ${String(peer.y)}px)`,
            opacity: live ? 1 : 0.45,
          }}
        >
          <PeerCursor name="Priya" />
        </div>
      )}
    </div>
  );
}

/* ── 4 · presence: who is actually in the room ────────────────────── */

type Peer = { id: string; name: string; x: number; y: number };

const ROOM: Peer[] = [
  { id: "priya", name: "Priya", x: 48, y: 40 },
  { id: "marco", name: "Marco", x: 196, y: 112 },
];

function PresencePair({ after }: Side) {
  const [present, setPresent] = useState(ROOM);
  /* What this browser has actually been told about. */
  const [drawn, setDrawn] = useState<Peer[]>(ROOM);

  const priyaHere = present.some((u) => u.id === "priya");

  const rejoin = () => {
    setPresent(ROOM);
    setDrawn(after ? ROOM : []);
  };

  const nudge = () => {
    const priya = present.find((u) => u.id === "priya");
    if (!priya) return;
    const moved: Peer = {
      ...priya,
      x: priya.x > 150 ? 48 : priya.x + 84,
      y: priya.y > 100 ? 40 : priya.y + 52,
    };
    setPresent((p) => p.map((u) => (u.id === "priya" ? moved : u)));
    setDrawn((d) =>
      d.some((u) => u.id === "priya")
        ? d.map((u) => (u.id === "priya" ? moved : u))
        : [...d, moved],
    );
  };

  const toggle = () => {
    if (priyaHere) {
      setPresent((p) => p.filter((u) => u.id !== "priya"));
      /* The naive version never hears the leave event. */
      if (after) setDrawn((d) => d.filter((u) => u.id !== "priya"));
    } else {
      const back = ROOM.filter((u) => u.id === "priya");
      setPresent((p) => [...back, ...p]);
      setDrawn((d) => (after ? [...back, ...d] : d));
    }
  };

  return (
    <div>
      <div className="bg-secondary relative h-52 overflow-hidden rounded-xl border">
        <div className="pointer-events-none absolute inset-0 p-5 select-none">
          <div className="bg-foreground/10 h-2.5 w-24 rounded-full" />
          <div className="bg-foreground/5 mt-3 h-2 w-3/4 rounded-full" />
          <div className="bg-foreground/5 mt-2 h-2 w-2/3 rounded-full" />
        </div>
        <AnimatePresence>
          {drawn.map((u) => (
            <motion.div
              key={u.id}
              aria-hidden
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, x: u.x, y: u.y }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={spring.snappy}
              className="pointer-events-none absolute top-0 left-0"
            >
              <PeerCursor name={u.name} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={QUIET} onClick={rejoin}>
          <RotateCcw aria-hidden className="size-4" />
          Walk in again
        </button>
        <button
          type="button"
          className={QUIET}
          disabled={!priyaHere}
          onClick={nudge}
        >
          Priya moves
        </button>
        <button type="button" className={QUIET} onClick={toggle}>
          {priyaHere ? "Priya leaves" : "Priya comes back"}
        </button>
      </div>
    </div>
  );
}

/* ── 5 & 6 · the chat thread ──────────────────────────────────────── */

type Msg = {
  id: number;
  who: string;
  text: string;
  at: string;
  pending?: boolean;
};

const THREAD: Msg[] = [
  { id: 1, who: "Priya", text: "pushed the new upload flow", at: "09:41" },
  {
    id: 2,
    who: "Priya",
    text: "the size limit is on the panel now",
    at: "09:41",
  },
  { id: 3, who: "Priya", text: "have a look when you get a sec", at: "09:42" },
  { id: 4, who: "You", text: "looking now", at: "09:44" },
  {
    id: 5,
    who: "Marco",
    text: "the failed file keeps its place, nice",
    at: "09:45",
  },
  { id: 6, who: "Marco", text: "and retry only sends that one?", at: "09:45" },
];

const REPLIES = [
  "yep, only the broken one",
  "the rest stay ticked",
  "shipping it today",
  "one more pass on the empty state",
];

function ChatBubble({ m, header }: { m: Msg; header: boolean }) {
  const own = m.who === "You";
  return (
    <div className={cn("mt-2 flex", own ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex w-fit max-w-xs flex-col gap-1",
          own && "items-end",
        )}
      >
        {header && (
          <div
            className={cn(
              "text-caption flex items-center gap-2 px-3",
              own && "flex-row-reverse",
            )}
          >
            <span className="text-foreground">{m.who}</span>
            <span className="text-muted-foreground tabular-nums">{m.at}</span>
          </div>
        )}
        <div
          className={cn(
            "text-ui-sm w-fit rounded-xl px-3 py-2 transition-opacity",
            own ? "bg-feature text-feature-foreground" : "bg-card border",
            m.pending && "opacity-50",
          )}
        >
          {m.text}
        </div>
      </div>
    </div>
  );
}

function EchoPair({ after }: Side) {
  const [msgs, setMsgs] = useState<Msg[]>(THREAD.slice(0, 3));
  const [draft, setDraft] = useState("");
  const seq = useRef(100);
  const id = after ? "after" : "before";

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    seq.current += 1;
    const key = seq.current;
    const msg: Msg = { id: key, who: "You", text, at: "09:46" };

    if (after) {
      /* Local echo first — the round trip only confirms it. */
      setMsgs((m) => [...m, { ...msg, pending: true }]);
      setTimeout(() => {
        setMsgs((m) =>
          m.map((x) => (x.id === key ? { ...x, pending: false } : x)),
        );
      }, 900);
    } else {
      setTimeout(() => {
        setMsgs((m) => [...m, msg]);
      }, 900);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="bg-secondary h-52 space-y-1 overflow-y-auto rounded-xl border p-3">
        {msgs.map((m) => (
          <ChatBubble key={m.id} m={m} header />
        ))}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <Label htmlFor={`echo-${id}`} className="sr-only">
          Message
        </Label>
        <Input
          id={`echo-${id}`}
          value={draft}
          placeholder={REPLIES[0]}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          className="h-9 rounded-full"
        />
        <button
          type="submit"
          aria-label="Send message"
          className={cn(SOLID, "aspect-square px-0")}
        >
          <Send aria-hidden className="size-4" />
        </button>
      </form>
    </div>
  );
}

function GroupingPair({ after }: Side) {
  const [msgs, setMsgs] = useState<Msg[]>(THREAD);
  const next = useRef(0);

  const reply = () => {
    const text = REPLIES[next.current % REPLIES.length];
    next.current += 1;
    setMsgs((m) => [
      ...m,
      { id: 200 + next.current, who: "You", text, at: "09:46" },
    ]);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="bg-secondary h-64 space-y-1 overflow-y-auto rounded-xl border p-3">
        {msgs.map((m, i) => {
          const prev = i > 0 ? msgs[i - 1] : null;
          const header = after ? !prev || prev.who !== m.who : true;
          return <ChatBubble key={m.id} m={m} header={header} />;
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={QUIET} onClick={reply}>
          Add a reply
        </button>
        <button
          type="button"
          className={GHOST}
          onClick={() => {
            setMsgs(THREAD);
            next.current = 0;
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* ── 7 · avatar stack: a few faces and a number ───────────────────── */

const CREW = [
  "Priya Raman",
  "Marco Silva",
  "Ana Kowalski",
  "Tom Beckett",
  "Yuki Mori",
  "Sam Odell",
  "Nia Bakare",
  "Leo Fontaine",
  "Ines Duarte",
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function AvatarFace({ name }: { name: string }) {
  return (
    <span className="text-caption bg-secondary ring-card text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full border ring-2">
      {initials(name)}
    </span>
  );
}

function AvatarStackPair({ after }: Side) {
  const [crew, setCrew] = useState(CREW.slice(0, 9));
  const shown = crew.slice(0, 3);
  const hidden = crew.slice(3);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="bg-card flex h-16 items-center gap-3 overflow-hidden rounded-xl border px-4">
        <span className="text-ui-sm text-muted-foreground shrink-0">
          In this file
        </span>
        {after ? (
          <TooltipProvider>
            <div className="flex -space-x-2">
              {shown.map((name) => (
                <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={name}
                      className="duration-fast ease-out-quart rounded-full transition-transform hover:z-10 hover:-translate-y-0.5"
                    >
                      <AvatarFace name={name} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{name}</TooltipContent>
                </Tooltip>
              ))}
              {hidden.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${String(hidden.length)} more people`}
                      className="rounded-full"
                    >
                      <span className="text-caption bg-secondary ring-card text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full border tabular-nums ring-2">
                        +{hidden.length}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="flex flex-col gap-0.5">
                      {hidden.map((name) => (
                        <span key={name}>{name}</span>
                      ))}
                    </span>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        ) : (
          <div className="flex -space-x-5">
            {crew.map((name) => (
              <AvatarFace key={name} name={name} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={QUIET}
          disabled={crew.length >= CREW.length}
          onClick={() => {
            setCrew(CREW.slice(0, crew.length + 1));
          }}
        >
          Someone joins
        </button>
        <button
          type="button"
          className={QUIET}
          disabled={crew.length <= 1}
          onClick={() => {
            setCrew(CREW.slice(0, crew.length - 1));
          }}
        >
          Someone leaves
        </button>
      </div>
    </div>
  );
}

/* ── 8 & 9 · the paged list ───────────────────────────────────────── */

type Issue = { id: string; title: string; open: boolean };

const ISSUES: Issue[] = [
  { id: "PLT-118", title: "Dropzone states the wrong limit", open: true },
  { id: "PLT-117", title: "Retry re-sends everything", open: true },
  { id: "PLT-115", title: "Cursor jumps between samples", open: false },
  { id: "PLT-114", title: "Ghost cursor after a peer leaves", open: false },
  { id: "PLT-112", title: "Send waits for the round trip", open: true },
  { id: "PLT-110", title: "Name repeats on every bubble", open: true },
  { id: "PLT-109", title: "Avatar row overflows past nine", open: false },
  { id: "PLT-108", title: "Filter change keeps the old rows", open: true },
  { id: "PLT-106", title: "Load more never stops", open: false },
  { id: "PLT-104", title: "Board editable before it syncs", open: true },
  { id: "PLT-102", title: "Sign in fires on every press", open: true },
  { id: "PLT-101", title: "Reset email confirms the address", open: false },
];

const PAGE = 4;
type Filter = "all" | "open" | "closed";

const poolFor = (f: Filter) =>
  f === "all" ? ISSUES : ISSUES.filter((i) => (f === "open" ? i.open : !i.open));

function IssueRow({ issue }: { issue: Issue }) {
  return (
    <li className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0">
      <span className="text-caption text-muted-foreground w-16 shrink-0 tabular-nums">
        {issue.id}
      </span>
      <span className="text-ui-sm min-w-0 flex-1 truncate">{issue.title}</span>
      <span
        className={cn(
          "text-micro bg-secondary shrink-0 rounded-full px-2.5 py-1 uppercase",
          issue.open ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {issue.open ? "Open" : "Closed"}
      </span>
    </li>
  );
}

function FilterPair({ after }: Side) {
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<Issue[]>(ISSUES.slice(0, PAGE));

  const pool = poolFor(filter);

  const pick = (f: Filter) => {
    setFilter(f);
    if (after) {
      setRows(poolFor(f).slice(0, PAGE));
    } else {
      /* Same store, new query — the old page never leaves. */
      setRows((r) => [...r, ...poolFor(f).slice(0, PAGE)]);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            ["all", "All"],
            ["open", "Open"],
            ["closed", "Closed"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => {
              pick(id);
            }}
            className={cn(
              CONTROL,
              filter === id
                ? "bg-feature text-feature-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <span className="tabular-nums opacity-60">
              {poolFor(id).length}
            </span>
          </button>
        ))}
        <span className="text-caption text-muted-foreground ml-auto tabular-nums">
          Showing {rows.length} of {pool.length}
        </span>
      </div>

      <ul className="mt-3 max-h-72 overflow-y-auto rounded-xl border">
        {rows.map((issue, i) => (
          <IssueRow key={`${issue.id}-${String(i)}`} issue={issue} />
        ))}
      </ul>

      {rows.length < pool.length && (
        <button
          type="button"
          className={cn(QUIET, "mt-3 w-full")}
          onClick={() => {
            setRows((r) => [...r, ...pool.slice(r.length, r.length + PAGE)]);
          }}
        >
          Load more
        </button>
      )}
    </div>
  );
}

function EndOfListPair({ after }: Side) {
  const [rows, setRows] = useState<Issue[]>(ISSUES.slice(0, PAGE));
  const [busy, setBusy] = useState(false);

  const atEnd = rows.length >= ISSUES.length;

  const more = () => {
    if (after && (busy || atEnd)) return;
    setBusy(true);
    /* The naive version reads the offset at press time, so two quick
       presses ask the server for the very same page twice. */
    const from = rows.length;
    setTimeout(() => {
      setRows((r) => {
        if (after) return [...r, ...ISSUES.slice(r.length, r.length + PAGE)];
        const slice = ISSUES.slice(from, from + PAGE);
        return [...r, ...(slice.length > 0 ? slice : ISSUES.slice(-PAGE))];
      });
      setBusy(false);
    }, 420);
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <ul className="max-h-72 overflow-y-auto rounded-xl border">
        {rows.map((issue, i) => (
          <IssueRow key={`${issue.id}-${String(i)}`} issue={issue} />
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {after && atEnd ? (
          <p className="text-caption text-muted-foreground flex h-9 items-center tabular-nums">
            That is all {ISSUES.length} of them
          </p>
        ) : (
          <button type="button" className={QUIET} onClick={more}>
            {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
            Load more
          </button>
        )}
        <button
          type="button"
          className={GHOST}
          onClick={() => {
            setRows(ISSUES.slice(0, PAGE));
            setBusy(false);
          }}
        >
          Reset
        </button>
        <span className="text-caption text-muted-foreground ml-auto tabular-nums">
          <NumberFlow value={rows.length} /> rows
        </span>
      </div>
    </div>
  );
}

/* ── 10 · the shared board: wait until it is really there ─────────── */

type Node = { id: string; label: string; x: number; y: number };

const SAVED: Node[] = [
  { id: "a", label: "Draft", x: 24, y: 24 },
  { id: "b", label: "Review", x: 140, y: 92 },
  { id: "c", label: "Ship", x: 256, y: 32 },
];
const GUESSED: Node[] = [
  { id: "a", label: "Draft", x: 20, y: 96 },
  { id: "b", label: "Review", x: 144, y: 24 },
  { id: "c", label: "Ship", x: 248, y: 104 },
];

function BoardPair({ after }: Side) {
  const [nodes, setNodes] = useState<Node[]>(SAVED);
  const [syncing, setSyncing] = useState(false);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const locked = after && syncing;

  const reload = () => {
    setSyncing(true);
    /* Before: the board is handed over immediately, at guessed
       positions, and overwritten when the real state lands. */
    setNodes(after ? [] : GUESSED);
    setTimeout(() => {
      setNodes(SAVED);
      setSyncing(false);
    }, 2400);
  };

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, n: Node) => {
    if (locked) return;
    const box = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!box) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      id: n.id,
      dx: e.clientX - box.left - n.x,
      dy: e.clientY - box.top - n.y,
    };
  };

  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const box = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!box) return;
    const x = Math.max(0, Math.min(box.width - 96, e.clientX - box.left - d.dx));
    const y = Math.max(0, Math.min(box.height - 40, e.clientY - box.top - d.dy));
    setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x, y } : n)));
  };

  return (
    <div>
      <div className="bg-secondary relative h-56 touch-none overflow-hidden rounded-xl border">
        {nodes.map((n) => (
          <button
            key={n.id}
            type="button"
            onPointerDown={(e) => {
              onDown(e, n);
            }}
            onPointerMove={onMove}
            onPointerUp={() => {
              drag.current = null;
            }}
            className={cn(
              "text-ui-sm bg-card absolute top-0 left-0 flex h-10 w-24 items-center justify-center rounded-lg border",
              locked
                ? "cursor-default opacity-50"
                : "cursor-grab active:cursor-grabbing",
            )}
            style={{
              transform: `translate(${String(n.x)}px, ${String(n.y)}px)`,
            }}
          >
            {n.label}
          </button>
        ))}

        {locked && (
          <div className="bg-secondary/80 absolute inset-0 grid place-items-center">
            <span className="text-caption text-muted-foreground flex items-center gap-2">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Getting the board…
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={QUIET} onClick={reload}>
          <RotateCcw aria-hidden className="size-4" />
          Open the board
        </button>
      </div>
    </div>
  );
}

/* ── 11 · sign in: one press is one attempt ───────────────────────── */

function SignInPair({ after }: Side) {
  const [password, setPassword] = useState("hunter2hunter2");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = after ? "after" : "before";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (after && busy) return;
    setError(null);
    setBusy(true);
    setLog((l) => [...l, "POST /auth/v1/token?grant_type=password"]);
    setTimeout(() => {
      setBusy(false);
      setError("That password does not match this email.");
    }, 1400);
  };

  return (
    <div className="mx-auto grid w-full max-w-lg gap-4 sm:grid-cols-2">
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`email-${id}`} className="text-ui-sm">
            Email
          </Label>
          <Input
            id={`email-${id}`}
            type="email"
            defaultValue="priya@acme.co"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center">
            <Label htmlFor={`pw-${id}`} className="text-ui-sm">
              Password
            </Label>
            {after && (
              <span className="text-caption text-muted-foreground ml-auto underline underline-offset-4">
                Forgot your password?
              </span>
            )}
          </div>
          <Input
            id={`pw-${id}`}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            aria-invalid={Boolean(after && error)}
            className="h-9"
          />
          {after && error !== null && (
            <p className="text-caption text-destructive">{error}</p>
          )}
        </div>

        {!after && error !== null && (
          <p className="text-caption text-destructive">{error}</p>
        )}

        <button
          type="submit"
          className={cn(SOLID, "w-full")}
          disabled={after && busy}
        >
          {after && busy && (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          )}
          {after && busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="bg-secondary rounded-xl border p-3">
        <p className="text-micro text-muted-foreground uppercase">
          Sent to the server
        </p>
        {log.length === 0 ? (
          <p className="text-caption text-muted-foreground mt-2">Nothing yet</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {log.map((line, i) => (
              <li
                key={`${line}-${String(i)}`}
                className="text-caption text-muted-foreground truncate font-mono"
              >
                {line}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className={cn(GHOST, "mt-2 px-0")}
          onClick={() => {
            setLog([]);
            setError(null);
            setBusy(false);
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function SupabaseUiLibraryDemo() {
  return (
    <div>
      <BeforeAfter
        principle="When a file will not go up, the app should point at that one file and say why. Being told that something failed leaves you guessing which."
        before={<DropzonePair after={false} />}
        after={<DropzonePair after />}
      />
      <BeforeAfter
        principle="If four files went up and one did not, pressing again should only send the one that broke. Nobody wants to upload the same thing twice."
        before={<RetryPair after={false} />}
        after={<RetryPair after />}
      />
      <BeforeAfter
        principle="Someone else's pointer should glide across the page and stop exactly where they stopped. If it hops from spot to spot it stops looking like a person."
        before={<CursorPair after={false} />}
        after={<CursorPair after />}
      />
      <BeforeAfter
        principle="Walk into a shared room and you should see who is already in it. And when someone goes, they should take their pointer with them."
        before={<PresencePair after={false} />}
        after={<PresencePair after />}
      />
      <BeforeAfter
        principle="Your own message should be on screen the moment you press send. Waiting for the reply first makes it feel like nothing heard you."
        before={<EchoPair after={false} />}
        after={<EchoPair after />}
      />
      <BeforeAfter
        principle="When one person says three things in a row, write their name once. Repeating it turns a conversation into a list of records."
        before={<GroupingPair after={false} />}
        after={<GroupingPair after />}
      />
      <BeforeAfter
        principle="When more people turn up than there is room for, show a few faces and say how many more. Squeezing them all in tells you nothing."
        before={<AvatarStackPair after={false} />}
        after={<AvatarStackPair after />}
      />
      <BeforeAfter
        principle="Change what you are looking at and the old rows should go. Otherwise you are reading two lists at once and the count is a lie."
        before={<FilterPair after={false} />}
        after={<FilterPair after />}
      />
      <BeforeAfter
        principle="A list should say when you have reached the end, and one press should load one page. Pressing twice in a hurry ought not to double the rows."
        before={<EndOfListPair after={false} />}
        after={<EndOfListPair after />}
      />
      <BeforeAfter
        principle="Do not hand someone a board to rearrange before the real board has arrived. Everything they move gets thrown away when it lands."
        before={<BoardPair after={false} />}
        after={<BoardPair after />}
      />
      <BeforeAfter
        principle="The moment you press a button it should show that it heard you. Otherwise you press it four more times, and it happens four more times."
        before={<SignInPair after={false} />}
        after={<SignInPair after />}
      />
    </div>
  );
}
