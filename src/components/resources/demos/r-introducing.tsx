"use client";

import NumberFlow from "@number-flow/react";
import {
  Bell,
  Check,
  FileText,
  Inbox,
  Mail,
  MailOpen,
  Minus,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Fragment,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * vercel-labs/agent-skills → react-best-practices.
 *
 * 70 rules across 8 prefixed categories (async, bundle, server, client,
 * rerender, rendering, js, advanced). Most of them a person can only
 * see in a bundle analyser or a flame chart. Eleven of them a person
 * can feel with their hands, and those are the ones rebuilt here — both
 * sides real, both sides operable, the bug on the left genuinely
 * present rather than mimed.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/* ══ 1 · a search box that keeps up ═════════════════════════════════ *
 * rerender-use-deferred-value                                          */

const FIRST = [
  "Ada", "Bruno", "Cora", "Dario", "Elif", "Fabian", "Greta", "Hugo",
  "Ines", "Jonas", "Kira", "Lars", "Mira", "Noor", "Otto", "Pia",
  "Quentin", "Rosa", "Sven", "Tilda", "Uma", "Vera", "Wim", "Xenia",
] as const;

const LAST = [
  "Almeida", "Berg", "Costa", "Dahl", "Eriksen", "Farkas", "Grimaldi",
  "Haas", "Iversen", "Jansen", "Kovacs", "Lindqvist", "Moreau", "Nagy",
  "Olsen", "Petrov", "Quintana", "Rossi", "Sandoval", "Tomasi", "Ubeda",
  "Varga", "Weiss",
] as const;

const TEAMS = ["Design", "Platform", "Growth", "Billing", "Support"] as const;

const ROLES = [
  "keeps the component library honest",
  "runs the release train on Thursdays",
  "owns onboarding end to end",
  "writes the migration guides",
  "answers the hardest support tickets",
  "measures what the redesign changed",
] as const;

type Person = {
  id: number;
  name: string;
  team: string;
  role: string;
  text: string;
};

const HEADCOUNT = 40000;

const PEOPLE: Person[] = Array.from({ length: HEADCOUNT }, (_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
  const team = TEAMS[(i * 5) % TEAMS.length];
  const role = ROLES[(i * 11) % ROLES.length];
  return {
    id: i,
    name,
    team,
    role,
    text: `${name} ${team} ${role}`.toLowerCase(),
  };
});

/** Plain Levenshtein. Real work, not a fake stall. */
function distance(a: string, b: string) {
  const prev = new Array<number>(b.length + 1);
  const cur = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

const ROW_LIMIT = 300;

/** Every word of every record gets scored against what you typed. */
function fuzzy(raw: string) {
  const q = raw.trim().toLowerCase();
  if (!q) return PEOPLE.slice(0, ROW_LIMIT);
  const hits: { person: Person; score: number }[] = [];
  for (const person of PEOPLE) {
    let score = 9;
    for (const word of person.text.split(" ")) {
      const d = distance(q, word);
      if (d < score) score = d;
      if (score === 0) break;
    }
    if (score <= 2) hits.push({ person, score });
  }
  hits.sort((x, y) => x.score - y.score || x.person.id - y.person.id);
  return hits.slice(0, ROW_LIMIT).map((h) => h.person);
}

function PersonRow({ person }: { person: Person }) {
  return (
    <div className="flex items-center gap-3 border-t px-2.5 py-2 first:border-t-0">
      <span className="text-ui-sm w-32 shrink-0 truncate">{person.name}</span>
      <span className="text-micro text-muted-foreground bg-card shrink-0 rounded-full px-2 py-0.5 uppercase">
        {person.team}
      </span>
      <span className="text-caption text-muted-foreground truncate">
        {person.role}
      </span>
    </div>
  );
}

function SearchPair({ after }: Side) {
  const id = useId();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const key = after ? deferred : query;
  const results = useMemo(() => fuzzy(key), [key]);
  const catching = after && key !== query;

  return (
    <div>
      <Label htmlFor={id} className="text-ui-sm mb-2">
        Find a teammate
      </Label>
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          id={id}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a name — try “rosa”"
          className="h-9 pl-9"
        />
      </div>
      <div className="bg-secondary mt-3 h-56 overflow-y-auto rounded-lg border">
        <div
          className={cn(
            "duration-fast ease-out-quart transition-opacity",
            catching && "opacity-50",
          )}
        >
          {results.map((person) => (
            <PersonRow key={person.id} person={person} />
          ))}
          {results.length === 0 && (
            <p className="text-caption text-muted-foreground p-3">
              Nobody by that name.
            </p>
          )}
        </div>
      </div>
      <p className="text-caption text-muted-foreground mt-2 tabular-nums">
        {results.length} of 40,000 people
      </p>
    </div>
  );
}

/* ══ 2 · a light that stays under your finger ════════════════════════ *
 * rerender-use-ref-transient-values                                    */

const COLS = 80;
const ROWS = 24;

const TILES = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = col / (COLS - 1);
  const y = row / (ROWS - 1);
  /** Vertical falloff is fixed — the light only travels sideways. */
  const fade = Math.max(0.05, 1 - Math.abs(y - 0.5) * 1.9);
  return { i, x, fade };
});

const SPREAD = 4.5;
const FLOOR = 0.05;

function TrackPair({ after }: Side) {
  const [x, setX] = useState(50);
  const dragging = useRef(false);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  function move(next: number) {
    const clamped = Math.min(100, Math.max(0, next));
    if (after) {
      if (handleRef.current) handleRef.current.style.left = `${clamped}%`;
      fieldRef.current?.style.setProperty("--hx", String(clamped / 100));
    } else {
      setX(clamped);
    }
  }

  function fromEvent(clientX: number) {
    const rail = railRef.current;
    if (!rail) return;
    const box = rail.getBoundingClientRect();
    move(((clientX - box.left) / box.width) * 100);
  }

  /** Rendered once and never again on the `after` side. */
  const staticTiles = useMemo(
    () =>
      TILES.map((t) => (
        <span
          key={t.i}
          className="bg-primary aspect-square rounded-full"
          style={
            {
              "--tx": t.x,
              "--fade": t.fade,
              opacity: `max(${FLOOR}, var(--fade) * (1 - ${SPREAD} * max(var(--tx) - var(--hx), var(--hx) - var(--tx))))`,
            } as CSSProperties
          }
        />
      )),
    [],
  );

  return (
    <div>
      <div
        ref={railRef}
        className="bg-secondary relative h-9 cursor-ew-resize touch-none rounded-lg"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromEvent(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) fromEvent(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        <div
          ref={handleRef}
          className="bg-card pointer-events-none absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-xs"
          style={{ left: after ? "50%" : `${x}%` }}
        />
      </div>

      <div
        ref={fieldRef}
        aria-hidden="true"
        className="mt-3 grid grid-cols-[repeat(80,minmax(0,1fr))] gap-px overflow-hidden rounded-lg select-none"
        style={{ "--hx": after ? 0.5 : x / 100 } as CSSProperties}
      >
        {after
          ? staticTiles
          : TILES.map((t) => (
              <span
                key={t.i}
                className="bg-primary aspect-square rounded-full"
                style={{
                  opacity: Math.max(
                    FLOOR,
                    t.fade * (1 - SPREAD * Math.abs(t.x - x / 100)),
                  ),
                }}
              />
            ))}
      </div>

      <p className="text-caption text-muted-foreground mt-3">
        Drag the knob across.
      </p>
    </div>
  );
}

/* ══ 3 · a box that keeps what you type ═════════════════════════════ *
 * rerender-no-inline-components                                        */

const NOTE_LIMIT = 140;

function NoteField({
  id,
  onType,
}: {
  id: string;
  onType: (length: number) => void;
}) {
  return (
    <input
      id={id}
      defaultValue=""
      onChange={(e) => onType(e.target.value.length)}
      maxLength={NOTE_LIMIT}
      placeholder="Ask them to bring the projector"
      className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
    />
  );
}

function NotePair({ after }: Side) {
  const id = useId();
  const [used, setUsed] = useState(0);

  /**
   * Declared inside the component so it can reach `setUsed` without a
   * prop — which is exactly why every keystroke throws the box away.
   */
  const InlineField = () => (
    <input
      id={id}
      defaultValue=""
      onChange={(e) => setUsed(e.target.value.length)}
      maxLength={NOTE_LIMIT}
      placeholder="Ask them to bring the projector"
      className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
    />
  );

  return (
    <div>
      <Label htmlFor={id} className="text-ui-sm mb-2">
        Note for the team
      </Label>
      {after ? <NoteField id={id} onType={setUsed} /> : <InlineField />}
      <p className="text-caption text-muted-foreground mt-2 tabular-nums">
        {used} / {NOTE_LIMIT}
      </p>
    </div>
  );
}

/* ══ 4 · a stepper you can hold down ════════════════════════════════ *
 * rerender-functional-setstate                                         */

function HoldPair({ after }: Side) {
  const [n, setN] = useState(1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function bump() {
    if (after) setN((v) => Math.min(99, v + 1));
    else setN(Math.min(99, n + 1));
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  useEffect(() => stop, []);

  return (
    <div className="flex items-center gap-4">
      <div className="bg-secondary flex items-center gap-1 rounded-lg p-1">
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="One fewer"
          onClick={() => setN((v) => Math.max(1, v - 1))}
        >
          <Minus />
        </Button>
        <span className="text-ui w-10 text-center tabular-nums">
          <NumberFlow value={n} />
        </span>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="One more"
          onPointerDown={() => {
            bump();
            stop();
            timer.current = setInterval(bump, 110);
          }}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              bump();
            }
          }}
        >
          <Plus />
        </Button>
      </div>
      <p className="text-caption text-muted-foreground">
        Press and hold the plus.
      </p>
    </div>
  );
}

/* ══ 5 · a total that is already right ══════════════════════════════ *
 * rerender-derived-state-no-effect                                     */

const LINES = [
  { id: "seat", name: "Extra seat", price: 12 },
  { id: "storage", name: "Storage, 100 GB", price: 5 },
  { id: "support", name: "Priority support", price: 24 },
] as const;

const START: Record<string, number> = { seat: 2, storage: 1, support: 1 };

function sumOf(q: Record<string, number>) {
  return LINES.reduce((acc, line) => acc + line.price * (q[line.id] ?? 0), 0);
}

function TotalPair({ after }: Side) {
  const [qty, setQty] = useState<Record<string, number>>(START);
  const [kept, setKept] = useState(() => sumOf(START));

  /** One is computed from what is on screen. One is remembered. */
  const total = after ? sumOf(qty) : kept;

  function change(id: string, delta: number) {
    setQty({ ...qty, [id]: Math.max(0, (qty[id] ?? 0) + delta) });
    if (!after) setKept(sumOf(qty));
  }

  return (
    <div>
      <div className="divide-y">
        {LINES.map((line) => (
          <div key={line.id} className="flex items-center gap-3 py-2.5">
            <span className="text-ui-sm">{line.name}</span>
            <span className="text-caption text-muted-foreground tabular-nums">
              ${line.price} each
            </span>
            <div className="bg-secondary ml-auto flex items-center gap-0.5 rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`One fewer ${line.name}`}
                onClick={() => change(line.id, -1)}
              >
                <Minus />
              </Button>
              <span className="text-ui-sm w-6 text-center tabular-nums">
                {qty[line.id]}
              </span>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`One more ${line.name}`}
                onClick={() => change(line.id, 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t pt-3">
        <span className="text-ui">Total each month</span>
        <span className="text-ui tabular-nums">
          <NumberFlow
            value={total}
            locales="en-US"
            format={{ style: "currency", currency: "USD" }}
          />
        </span>
      </div>
    </div>
  );
}

/* ══ 6 · no stray zero ══════════════════════════════════════════════ *
 * rendering-conditional-render                                         */

const FOLDERS = [
  { id: "inbox", name: "Inbox", icon: Inbox },
  { id: "drafts", name: "Drafts", icon: PenLine },
  { id: "spam", name: "Spam", icon: Trash2 },
] as const;

function ZeroPair({ after }: Side) {
  const [counts, setCounts] = useState<Record<string, number>>({
    inbox: 2,
    drafts: 1,
    spam: 1,
  });

  return (
    <div>
      <div className="bg-secondary rounded-lg border p-1">
        {FOLDERS.map((folder) => {
          const count = counts[folder.id] ?? 0;
          const badge = (
            <span className="bg-secondary text-micro text-muted-foreground rounded-full px-1.5 py-0.5 tabular-nums">
              {count}
            </span>
          );
          return (
            <div
              key={folder.id}
              className="flex h-10 items-center gap-2.5 rounded-md px-2.5"
            >
              <folder.icon
                className="text-muted-foreground size-4.5"
                aria-hidden="true"
              />
              <span className="text-ui-sm">{folder.name}</span>
              <span className="text-caption text-muted-foreground ml-1">
                {after ? (count > 0 ? badge : null) : count && badge}
              </span>
              <Button
                variant="ghost"
                size="icon-lg"
                className="ml-auto"
                aria-label={`Read one message in ${folder.name}`}
                disabled={count === 0}
                onClick={() =>
                  setCounts((c) => ({
                    ...c,
                    [folder.id]: Math.max(0, (c[folder.id] ?? 0) - 1),
                  }))
                }
              >
                <MailOpen />
              </Button>
            </div>
          );
        })}
      </div>
      <Button
        variant="secondary"
        size="lg"
        className="mt-3"
        onClick={() =>
          setCounts((c) => ({ ...c, inbox: Math.min(9, (c.inbox ?? 0) + 1) }))
        }
      >
        <Mail aria-hidden="true" />
        New message
      </Button>
    </div>
  );
}

/* ══ 7 · putting the order back ═════════════════════════════════════ *
 * js-tosorted-immutable                                                */

type FileRow = { name: string; kb: number; place: number };

const FILE_ROWS: FileRow[] = [
  { name: "Kickoff notes.md", kb: 12, place: 1 },
  { name: "Budget.xlsx", kb: 240, place: 2 },
  { name: "Logo marks.svg", kb: 68, place: 3 },
  { name: "Contract.pdf", kb: 1180, place: 4 },
  { name: "Angles.psd", kb: 8420, place: 5 },
  { name: "Zoning map.png", kb: 512, place: 6 },
];

const SORTS = [
  { id: "added", label: "Order added" },
  { id: "name", label: "Name" },
  { id: "size", label: "Size" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

function SortPair({ after }: Side) {
  const [rows] = useState(() => FILE_ROWS.map((r) => ({ ...r })));
  const [sort, setSort] = useState<SortId>("added");

  const compare =
    sort === "name"
      ? (a: FileRow, b: FileRow) => a.name.localeCompare(b.name)
      : (a: FileRow, b: FileRow) => a.kb - b.kb;

  let shown: FileRow[];
  if (sort === "added") shown = rows;
  else if (after) shown = rows.toSorted(compare);
  else shown = rows.sort(compare);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {SORTS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSort(option.id)}
            aria-pressed={sort === option.id}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart h-9 rounded-lg px-3 transition-colors",
              sort === option.id
                ? "bg-feature text-feature-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="bg-secondary mt-3 rounded-lg border">
        {shown.map((row) => (
          <div
            key={row.name}
            className="flex h-10 items-center gap-3 border-t px-3 first:border-t-0"
          >
            <span className="text-micro text-muted-foreground w-5 tabular-nums">
              {row.place}
            </span>
            <FileText
              className="text-muted-foreground size-4.5"
              aria-hidden="true"
            />
            <span className="text-ui-sm">{row.name}</span>
            <span className="text-caption text-muted-foreground ml-auto tabular-nums">
              {row.kb} KB
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ 8 · everything at once ═════════════════════════════════════════ *
 * async-parallel                                                       */

const REQUESTS = [
  { id: "profile", label: "Your profile", ms: 520 },
  { id: "orders", label: "Recent orders", ms: 380 },
  { id: "messages", label: "Messages", ms: 440 },
] as const;

const SPAN = REQUESTS.reduce((a, r) => a + r.ms, 0);

function LoadPair({ after }: Side) {
  const [run, setRun] = useState(0);
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(0);
  const [done, setDone] = useState<Record<string, number>>({});
  const raf = useRef<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  function start() {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    if (raf.current) cancelAnimationFrame(raf.current);

    setRun((v) => v + 1);
    setBusy(true);
    setClock(0);
    setDone({});

    const t0 = performance.now();
    const tick = () => {
      setClock(performance.now() - t0);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    let offset = 0;
    let last = 0;
    for (const request of REQUESTS) {
      const begin = after ? 0 : offset;
      offset += request.ms;
      const end = begin + request.ms;
      last = Math.max(last, end);
      timers.current.push(
        setTimeout(() => {
          setDone((d) => ({ ...d, [request.id]: Math.round(end) }));
        }, end),
      );
    }
    timers.current.push(
      setTimeout(() => {
        if (raf.current) cancelAnimationFrame(raf.current);
        raf.current = null;
        setClock(last);
        setBusy(false);
      }, last + 20),
    );
  }

  let offset = 0;

  return (
    <div>
      <div className="flex items-center gap-3">
        <Button size="lg" onClick={start} disabled={busy}>
          {busy ? "Loading" : run ? "Load again" : "Load"}
        </Button>
        <span className="text-ui text-muted-foreground ml-auto tabular-nums">
          {(clock / 1000).toFixed(2)}s
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {REQUESTS.map((request) => {
          const begin = after ? 0 : offset;
          offset += request.ms;
          const finished = done[request.id];
          return (
            <div
              key={request.id}
              className="grid grid-cols-[8rem_minmax(0,1fr)_2.5rem] items-center gap-3"
            >
              <span className="text-ui-sm truncate">{request.label}</span>
              <div className="bg-secondary relative h-2.5 rounded-full">
                <motion.div
                  key={run}
                  className="bg-feature absolute inset-y-0 rounded-full"
                  style={{ left: `${(begin / SPAN) * 100}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: run ? `${(request.ms / SPAN) * 100}%` : 0 }}
                  transition={{
                    duration: request.ms / 1000,
                    delay: begin / 1000,
                    ease: "linear",
                  }}
                />
              </div>
              <span className="text-caption text-muted-foreground tabular-nums">
                {finished ? `${(finished / 1000).toFixed(2)}s` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══ 9 · the page is there straight away ════════════════════════════ *
 * async-suspense-boundaries                                            */

const PANELS: {
  id: string;
  label: string;
  value: number;
  ms: number;
  money?: boolean;
}[] = [
  { id: "visitors", label: "Visitors", value: 12480, ms: 500 },
  { id: "signups", label: "Signups", value: 318, ms: 950 },
  { id: "revenue", label: "Revenue", value: 9240, ms: 1500, money: true },
];

function ShellPair({ after }: Side) {
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  function load() {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    setReady({});
    setOpen(true);
    for (const panel of PANELS) {
      timers.current.push(
        setTimeout(() => {
          setReady((r) => ({ ...r, [panel.id]: true }));
        }, panel.ms),
      );
    }
  }

  const all = PANELS.every((p) => ready[p.id]);
  const showShell = open && (after || all);

  return (
    <div>
      <Button size="lg" onClick={load}>
        <RotateCcw aria-hidden="true" />
        {open ? "Open again" : "Open the dashboard"}
      </Button>

      <div className="bg-secondary mt-4 h-44 rounded-lg border">
        {!open && (
          <p className="text-caption text-muted-foreground flex h-full items-center justify-center">
            Nothing open yet.
          </p>
        )}
        {open && !showShell && (
          <div className="flex h-full items-center justify-center">
            <Spinner className="text-muted-foreground size-5" />
          </div>
        )}
        {showShell && (
          <div className="flex h-full flex-col p-3">
            <div className="flex items-center gap-2 border-b pb-2.5">
              <Bell
                className="text-muted-foreground size-4.5"
                aria-hidden="true"
              />
              <span className="text-ui">This week</span>
              <span className="text-caption text-muted-foreground ml-auto">
                Acme workspace
              </span>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-3 pt-3">
              {PANELS.map((panel) => (
                <div key={panel.id} className="flex flex-col justify-center">
                  <span className="text-micro text-muted-foreground uppercase">
                    {panel.label}
                  </span>
                  <div className="mt-1.5 h-8">
                    {ready[panel.id] ? (
                      <span className="text-ui tabular-nums">
                        <NumberFlow
                          value={panel.value}
                          locales="en-US"
                          format={
                            panel.money
                              ? {
                                  style: "currency",
                                  currency: "USD",
                                  maximumFractionDigits: 0,
                                }
                              : undefined
                          }
                        />
                      </span>
                    ) : (
                      <Skeleton className="h-5 w-16" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ 10 · ready before you press it ═════════════════════════════════ *
 * bundle-preload                                                       */

function PreloadPair({ after }: Side) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function fetchIt() {
    if (ready || timer.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      setReady(true);
    }, 800);
  }

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setOpen(false);
    setReady(false);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button
          size="lg"
          onPointerEnter={after ? fetchIt : undefined}
          onFocus={after ? fetchIt : undefined}
          onClick={() => {
            fetchIt();
            setOpen(true);
          }}
        >
          <PenLine aria-hidden="true" />
          Write a reply
        </Button>
        <Button variant="ghost" size="lg" onClick={reset}>
          Reset
        </Button>
      </div>

      <div className="bg-secondary mt-4 h-36 rounded-lg border">
        {!open && (
          <p className="text-caption text-muted-foreground flex h-full items-center justify-center">
            Nothing open yet.
          </p>
        )}
        {open && !ready && (
          <div className="flex h-full items-center justify-center">
            <Spinner className="text-muted-foreground size-5" />
          </div>
        )}
        {open && ready && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="flex h-full flex-col p-3"
          >
            <div className="flex items-center gap-2 border-b pb-2">
              {["B", "I", "U"].map((mark) => (
                <span
                  key={mark}
                  className="text-caption text-muted-foreground bg-secondary flex size-7 items-center justify-center rounded-md"
                  aria-hidden="true"
                >
                  {mark}
                </span>
              ))}
              <Button size="sm" variant="ghost" className="ml-auto h-9">
                <Send aria-hidden="true" />
                Send
              </Button>
            </div>
            <textarea
              defaultValue="Thanks — Thursday works for us."
              aria-label="Reply"
              className="text-ui-sm mt-2 flex-1 resize-none bg-transparent outline-none"
            />
          </motion.div>
        )}
      </div>

      <p className="text-caption text-muted-foreground mt-3">
        Rest on the button for a second, then press it.
      </p>
    </div>
  );
}

/* ══ 11 · it only says saved when you saved ═════════════════════════ *
 * rerender-move-effect-to-event                                        */

function SavePair({ after }: Side) {
  const id = useId();
  const [compact, setCompact] = useState(false);
  const [asked, setAsked] = useState(false);

  /**
   * The old shape: the press is stored as state and the actual work
   * happens in an effect — so anything else in the deps re-runs it.
   */
  useEffect(() => {
    if (!after && asked) toast.success("Draft saved");
  }, [after, asked, compact]);

  function save() {
    if (after) toast.success("Draft saved");
    else setAsked(true);
  }

  return (
    <div>
      <div className="bg-secondary divide-y rounded-lg border">
        {["Kickoff notes", "Quarterly plan", "Hiring loop"].map((title) => (
          <div
            key={title}
            className={cn(
              "flex items-center gap-2.5 px-2.5",
              compact ? "h-8" : "h-11",
            )}
          >
            <FileText
              className="text-muted-foreground size-4.5"
              aria-hidden="true"
            />
            <span className="text-ui-sm">{title}</span>
            <Check
              className="text-positive ml-auto size-4"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex h-9 items-center gap-3">
        <Switch id={id} checked={compact} onCheckedChange={setCompact} />
        <Label htmlFor={id} className="text-ui-sm">
          Compact rows
        </Label>
        <Button size="lg" className="ml-auto" onClick={save}>
          Save draft
        </Button>
      </div>
    </div>
  );
}

/* ══ page ═══════════════════════════════════════════════════════════ */

/**
 * Both sides are the same component in the same slot, so React would
 * hand the old state to the new side on every flip — you would arrive
 * at the fixed version carrying the broken version's mess. The keys
 * force a clean mount each way.
 */
function Pair({
  principle,
  render,
}: {
  principle: string;
  render: (props: Side) => ReactNode;
}) {
  return (
    <BeforeAfter
      principle={principle}
      before={<Fragment key="before">{render({ after: false })}</Fragment>}
      after={<Fragment key="after">{render({ after: true })}</Fragment>}
    />
  );
}

export function IntroducingDemo() {
  return (
    <div>
      <Pair
        principle="The letters keep up with your typing."
        render={(p) => <SearchPair {...p} />}
      />
      <Pair
        principle="The light stays under your finger instead of trailing behind it."
        render={(p) => <TrackPair {...p} />}
      />
      <Pair
        principle="What you type stays in the box."
        render={(p) => <NotePair {...p} />}
      />
      <Pair
        principle="Hold it down and it keeps counting."
        render={(p) => <HoldPair {...p} />}
      />
      <Pair
        principle="The total is right immediately, not one press behind."
        render={(p) => <TotalPair {...p} />}
      />
      <Pair
        principle="No stray 0 turns up once you have read everything."
        render={(p) => <ZeroPair {...p} />}
      />
      <Pair
        principle="Going back to the order you added things actually goes back."
        render={(p) => <SortPair {...p} />}
      />
      <Pair
        principle="Everything arrives together instead of queueing up."
        render={(p) => <LoadPair {...p} />}
      />
      <Pair
        principle="The page is there straight away and fills itself in."
        render={(p) => <ShellPair {...p} />}
      />
      <Pair
        principle="It is already open by the time you press it."
        render={(p) => <PreloadPair {...p} />}
      />
      <Pair
        principle="It only says saved when you actually saved something."
        render={(p) => <SavePair {...p} />}
      />
    </div>
  );
}
