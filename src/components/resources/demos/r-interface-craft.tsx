"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowUpDown,
  Bell,
  Bookmark,
  Check,
  Circle,
  Delete,
  Minus,
  Pin,
  Plus,
  Share2,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { Switch } from "@/components/ui/switch";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Interface Craft — Josh Puckett's library.
 *
 * Built from the three pieces he opens to everyone: the walkthrough
 * "Refining a Task App Interface" (six critique notes, eight refinement
 * steps) and the article "Conceptual Range" (four sections, five ways
 * to widen a search). Each idea a person can *see* is a switch here.
 *
 * Left out: the five idea-widening prompts (invert the problem, blend
 * domains, arbitrary range…), because they happen in a designer's head
 * before any pixels exist, and the video, which has no interface in it.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

/* ── 1 · you should not have to choose ────────────────────────────── */

const PHOTO_TONES = [
  "bg-foreground/25",
  "bg-foreground/10",
  "bg-foreground/20",
  "bg-foreground/5",
  "bg-foreground/15",
  "bg-foreground/25",
  "bg-foreground/10",
  "bg-foreground/20",
];

function BackupPair({ after }: Side) {
  const [picked, setPicked] = useState<number[]>([1, 4]);
  const [auto, setAuto] = useState(true);

  if (after) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="backup-auto" className="text-ui">
            Back up photos
          </label>
          <Switch id="backup-auto" checked={auto} onCheckedChange={setAuto} />
        </div>
        <p className="text-caption text-muted-foreground mt-1">
          {auto ? (
            <>
              <NumberFlow value={PHOTO_TONES.length} /> photos safe, and every
              new one from now on.
            </>
          ) : (
            "Paused. New photos are staying on this phone."
          )}
        </p>

        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {PHOTO_TONES.map((tone, i) => (
            <div
              key={tone + String(i)}
              className={cn(
                "relative aspect-square rounded-md",
                tone,
                !auto && "opacity-40",
              )}
            >
              {auto && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...spring.snappy, delay: i * 0.03 }}
                  className="bg-foreground text-background absolute right-1 bottom-1 grid size-4 place-items-center rounded-full"
                >
                  <Check aria-hidden className="size-2.5" strokeWidth={2.5} />
                </motion.span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="text-ui">Back up photos</p>
      <p className="text-caption text-muted-foreground mt-1">
        Choose the ones you want kept safe.
      </p>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {PHOTO_TONES.map((tone, i) => {
          const on = picked.includes(i);
          return (
            <button
              key={tone + String(i)}
              type="button"
              aria-pressed={on}
              aria-label={`Photo ${String(i + 1)}`}
              onClick={() =>
                setPicked((p) =>
                  p.includes(i) ? p.filter((n) => n !== i) : [...p, i],
                )
              }
              className={cn(
                "duration-fast ease-out-quart relative aspect-square rounded-md transition",
                tone,
                on
                  ? "ring-foreground ring-2"
                  : "opacity-60",
              )}
            >
              {on && (
                <span className="bg-foreground text-background absolute right-1 bottom-1 grid size-4 place-items-center rounded-full">
                  <Check aria-hidden className="size-2.5" strokeWidth={2.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-caption text-muted-foreground tabular-nums">
          <NumberFlow value={picked.length} /> of {PHOTO_TONES.length} chosen
        </p>
        <button
          type="button"
          disabled={picked.length === 0}
          className="bg-feature text-feature-foreground text-ui-sm h-9 rounded-lg px-3.5 disabled:opacity-40"
        >
          Back up
        </button>
      </div>
    </div>
  );
}

/* ── 2 · a keypad is not the only answer ──────────────────────────── */

const BILL = 24;
const PRESETS = [15, 18, 20];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"];

function money(n: number) {
  return n.toFixed(2);
}

function TipPair({ after }: Side) {
  const [digits, setDigits] = useState("480");
  const [preset, setPreset] = useState(1);
  const [custom, setCustom] = useState(5);

  if (after) {
    const value = preset === -1 ? custom : (BILL * PRESETS[preset]) / 100;
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-ui">Add a tip</p>
          <p className="text-caption text-muted-foreground tabular-nums">
            Bill ${money(BILL)}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {PRESETS.map((pct, i) => (
            <button
              key={pct}
              type="button"
              aria-pressed={preset === i}
              onClick={() => setPreset(i)}
              className={cn(
                "duration-fast ease-out-quart h-16 rounded-lg border transition-colors",
                preset === i
                  ? "bg-feature text-feature-foreground border-transparent"
                  : "bg-card text-foreground hover:bg-secondary",
              )}
            >
              <span className="text-ui block tabular-nums">{pct}%</span>
              <span className="text-caption mt-0.5 block tabular-nums opacity-60">
                ${money((BILL * pct) / 100)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={preset === -1}
            onClick={() => setPreset(-1)}
            className={cn(
              "duration-fast ease-out-quart h-9 flex-1 rounded-lg border transition-colors",
              preset === -1
                ? "bg-feature text-feature-foreground border-transparent"
                : "bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            <span className="text-ui-sm">Something else</span>
          </button>
          {preset === -1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Less tip"
                onClick={() => setCustom((v) => Math.max(0, v - 0.5))}
                className="text-muted-foreground hover:bg-secondary grid size-9 place-items-center rounded-lg border"
              >
                <Minus aria-hidden className="size-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="More tip"
                onClick={() => setCustom((v) => v + 0.5)}
                className="text-muted-foreground hover:bg-secondary grid size-9 place-items-center rounded-lg border"
              >
                <Plus aria-hidden className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        <p className="text-caption text-muted-foreground mt-3 tabular-nums">
          Total ${money(BILL + value)}
        </p>
      </div>
    );
  }

  const typed = Number(digits || "0") / 100;
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-ui">Add a tip</p>
        <p className="text-caption text-muted-foreground tabular-nums">
          Bill ${money(BILL)}
        </p>
      </div>

      <div className="bg-secondary mt-3 rounded-lg px-3 py-3 text-right tabular-nums">
        <span className="text-ui text-muted-foreground">$</span>
        <span className="text-ui">{money(typed)}</span>
      </div>

      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {KEYS.map((k) =>
          k === "back" ? (
            <button
              key={k}
              type="button"
              aria-label="Delete last digit"
              onClick={() => setDigits((d) => d.slice(0, -1))}
              className="text-muted-foreground hover:bg-secondary grid h-11 place-items-center rounded-lg"
            >
              <Delete aria-hidden className="size-4" strokeWidth={1.5} />
            </button>
          ) : (
            <button
              key={k}
              type="button"
              onClick={() => {
                setDigits((d) => (d + k).replace(/^0+/, "").slice(0, 5));
              }}
              className="text-ui hover:bg-secondary h-11 rounded-lg tabular-nums"
            >
              {k}
            </button>
          ),
        )}
      </div>

      <p className="text-caption text-muted-foreground mt-3 tabular-nums">
        Total ${money(BILL + typed)}
      </p>
    </div>
  );
}

/* ── 3 · the toolbar ──────────────────────────────────────────────── */

const SEED = ["Draft the Q3 brief", "Reply to Adam", "Book the studio"];

function ToolbarPair({ after }: Side) {
  const [tasks, setTasks] = useState(SEED);
  const add = () => {
    setTasks((t) => [...t, `New task ${String(t.length + 1)}`]);
  };

  return (
    <div className="mx-auto w-full max-w-xs">
      <ul className="mb-3">
        {tasks.map((t) => (
          <li key={t} className="flex items-center gap-2.5 py-1.5">
            <Circle
              aria-hidden
              className="text-muted-foreground size-4 shrink-0"
              strokeWidth={1.5}
            />
            <span className="text-ui-sm truncate">{t}</span>
          </li>
        ))}
      </ul>

      {after ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Filter tasks"
            className="text-muted-foreground hover:bg-secondary grid size-9 place-items-center rounded-lg"
          >
            <SlidersHorizontal
              aria-hidden
              className="size-4"
              strokeWidth={1.5}
            />
          </button>
          <button
            type="button"
            aria-label="Sort tasks"
            className="text-muted-foreground hover:bg-secondary grid size-9 place-items-center rounded-lg"
          >
            <ArrowUpDown aria-hidden className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={add}
            className="bg-feature text-feature-foreground text-ui-sm ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg pr-3.5 pl-3"
          >
            <Plus aria-hidden className="size-4" strokeWidth={1.5} />
            New task
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <button
            type="button"
            onClick={add}
            className="text-ui-sm hover:bg-secondary inline-flex h-9 items-center gap-1.5 rounded-md border px-3"
          >
            <Plus aria-hidden className="size-4" strokeWidth={3} />
            New task
          </button>
          <button
            type="button"
            aria-label="Filter tasks"
            className="text-muted-foreground hover:bg-secondary grid size-9 place-items-center rounded-md"
          >
            <SlidersHorizontal
              aria-hidden
              className="size-4"
              strokeWidth={2.5}
            />
          </button>
          <button
            type="button"
            aria-label="Sort tasks"
            className="text-muted-foreground hover:bg-secondary grid size-9 place-items-center rounded-md"
          >
            <ArrowUpDown aria-hidden className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 4 · one edge instead of four ─────────────────────────────────── */

const PLAN = ["Draft the Q3 brief", "Reply to Adam", "Book the studio"];
const LATER = ["Plan the week", "Write it down"];

function AlignRow({
  task,
  after,
  indent,
  done,
  onToggle,
}: {
  task: string;
  after: boolean;
  indent?: boolean;
  done: boolean;
  onToggle: () => void;
}) {
  const Mark = done ? Check : Circle;
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={onToggle}
      className={cn(
        "hover:bg-secondary h-9 w-full rounded-md text-left",
        after
          ? "grid grid-cols-[1.5rem_1fr] items-center"
          : cn("flex items-center gap-2.5", indent ? "pl-9" : "pl-1"),
      )}
    >
      <span className="grid place-items-center">
        <Mark
          aria-hidden
          className="text-muted-foreground size-4"
          strokeWidth={1.5}
        />
      </span>
      <span
        className={cn(
          "text-ui-sm truncate",
          !after && !indent && "pl-1.5",
          done && "line-through opacity-50",
        )}
      >
        {task}
      </span>
    </button>
  );
}

function AlignPair({ after }: Side) {
  const [done, setDone] = useState<string[]>([]);
  const toggle = (t: string) => {
    setDone((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]));
  };

  if (after) {
    return (
      <div className="mx-auto w-full max-w-xs">
        <p className="text-micro text-muted-foreground pl-6 uppercase">Today</p>
        <ul className="mt-1">
          {PLAN.map((t) => (
            <li key={t}>
              <AlignRow
                task={t}
                after
                done={done.includes(t)}
                onToggle={() => {
                  toggle(t);
                }}
              />
            </li>
          ))}
        </ul>
        <p className="text-micro text-muted-foreground mt-5 pl-6 uppercase">
          Later
        </p>
        <ul className="mt-1">
          {LATER.map((t) => (
            <li key={t}>
              <AlignRow
                task={t}
                after
                done={done.includes(t)}
                onToggle={() => {
                  toggle(t);
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xs">
      <p className="text-micro text-muted-foreground pl-7 uppercase">Today</p>
      <div className="mt-2 rounded-lg border p-2">
        <ul>
          {PLAN.map((t) => (
            <li key={t}>
              <AlignRow
                task={t}
                after={false}
                done={done.includes(t)}
                onToggle={() => {
                  toggle(t);
                }}
              />
            </li>
          ))}
        </ul>
      </div>
      <p className="text-micro text-muted-foreground mt-4 pl-3 uppercase">
        Later
      </p>
      <ul className="mt-1">
        {LATER.map((t) => (
          <li key={t}>
            <AlignRow
              task={t}
              after={false}
              indent
              done={done.includes(t)}
              onToggle={() => {
                toggle(t);
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 5 · labels that stop pretending to be your words ─────────────── */

const NOTES: readonly (readonly [string, string])[] = [
  ["Call the printer back", "Work"],
  ["Adam's birthday is Friday", "Family"],
  ["Try the shop on Kralja", "Errands"],
  ["Move the standup to 10", "Work"],
];
const CATS = ["Work", "Family", "Errands"];

function LabelPair({ after }: Side) {
  const [filter, setFilter] = useState<string | null>(null);
  const shown = filter ? NOTES.filter(([, c]) => c === filter) : NOTES;

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => {
              setFilter((f) => (f === c ? null : c));
            }}
            className={cn(
              "duration-fast ease-out-quart h-9 rounded-lg px-3 transition-colors",
              filter === c
                ? "bg-feature text-feature-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="text-ui-sm">{c}</span>
          </button>
        ))}
      </div>

      <ul>
        {shown.map(([note, cat]) => (
          <li key={note} className="flex items-center gap-3 py-2">
            <span className="text-ui-sm flex-1 truncate">{note}</span>
            {after ? (
              <span className="text-micro text-muted-foreground bg-secondary shrink-0 rounded-full px-2 py-0.5 uppercase">
                {cat}
              </span>
            ) : (
              <span className="text-caption text-accent-foreground shrink-0">
                {cat}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 6 · one weight, one colour ───────────────────────────────────── */

const ACTIONS = [
  { id: "star", label: "Star", Icon: Star, weight: 1, tone: "text-foreground" },
  {
    id: "bookmark",
    label: "Bookmark",
    Icon: Bookmark,
    weight: 2.5,
    tone: "text-accent-foreground",
  },
  { id: "pin", label: "Pin", Icon: Pin, weight: 1.5, tone: "text-positive" },
  {
    id: "share",
    label: "Share",
    Icon: Share2,
    weight: 3,
    tone: "text-destructive",
  },
  {
    id: "notify",
    label: "Notify me",
    Icon: Bell,
    weight: 2,
    tone: "text-muted-foreground",
  },
  {
    id: "delete",
    label: "Move to trash",
    Icon: Trash2,
    weight: 2.5,
    tone: "text-foreground",
  },
] as const;

function IconPair({ after }: Side) {
  const [on, setOn] = useState<string[]>(["pin"]);

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="text-ui-sm">Q3 brief</p>
      <p className="text-caption text-muted-foreground mt-0.5">
        Edited 12 minutes ago
      </p>
      <div className="mt-3 flex items-center gap-1">
        {ACTIONS.map(({ id, label, Icon, weight, tone }) => {
          const active = on.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={active}
              onClick={() => {
                setOn((v) =>
                  v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
                );
              }}
              className={cn(
                "hover:bg-secondary grid size-9 place-items-center rounded-lg",
                active && "bg-secondary",
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  "size-4",
                  after
                    ? active
                      ? "text-foreground"
                      : "text-muted-foreground"
                    : tone,
                )}
                strokeWidth={after ? 1.5 : weight}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── 7 · space does the separating ────────────────────────────────── */

const AGENDA: readonly (readonly [string, string])[] = [
  ["09:00", "Standup"],
  ["11:30", "Studio walkthrough"],
  ["15:00", "Review with Adam"],
];
const REST: readonly (readonly [string, string])[] = [
  ["Thu", "Send the brief"],
  ["Fri", "Adam's birthday"],
];

function DividerPair({ after }: Side) {
  const [checked, setChecked] = useState<string[]>([]);
  const toggle = (k: string) => {
    setChecked((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));
  };

  const list = (
    rows: readonly (readonly [string, string])[],
    ruled: boolean,
  ) => (
    <ul>
      {rows.map(([lead, text], i) => {
        const k = lead + text;
        return (
          <li key={k}>
            <button
              type="button"
              aria-pressed={checked.includes(k)}
              onClick={() => {
                toggle(k);
              }}
              className={cn(
                "hover:bg-secondary flex h-9 w-full items-center gap-3 px-1 text-left",
                ruled && i > 0 ? "border-t" : "rounded-md",
              )}
            >
              <span className="text-caption text-muted-foreground w-10 shrink-0 tabular-nums">
                {lead}
              </span>
              <span
                className={cn(
                  "text-ui-sm flex-1 truncate",
                  checked.includes(k) && "line-through opacity-50",
                )}
              >
                {text}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="mx-auto w-full max-w-xs">
      <p className="text-micro text-muted-foreground uppercase">Today</p>
      <div className="mt-1">{list(AGENDA, !after)}</div>
      <div className={after ? "mt-8" : "mt-3 border-t pt-3"}>
        <p className="text-micro text-muted-foreground uppercase">
          Rest of the week
        </p>
      </div>
      <div className="mt-1">{list(REST, false)}</div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function InterfaceCraftDemo() {
  return (
    <div>
      <BeforeAfter
        principle="You do not have to pick anything. It just happens."
        before={<BackupPair after={false} />}
        after={<BackupPair after />}
      />
      <BeforeAfter
        principle="You can see what the tip costs before you choose it."
        before={<TipPair after={false} />}
        after={<TipPair after />}
      />
      <BeforeAfter
        principle="The button you came for is on the side your thumb is on."
        before={<ToolbarPair after={false} />}
        after={<ToolbarPair after />}
      />
      <BeforeAfter
        principle="Everything hangs off one edge instead of four."
        before={<AlignPair after={false} />}
        after={<AlignPair after />}
      />
      <BeforeAfter
        principle="The labels stop reading like part of what you wrote."
        before={<LabelPair after={false} />}
        after={<LabelPair after />}
      />
      <BeforeAfter
        principle="Nothing in the row is trying to be the loudest."
        before={<IconPair after={false} />}
        after={<IconPair after />}
      />
      <BeforeAfter
        principle="You can still tell the two groups apart, without all the lines."
        before={<DividerPair after={false} />}
        after={<DividerPair after />}
      />
    </div>
  );
}
