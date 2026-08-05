"use client";

import {
  AtSign,
  Bell,
  Bold,
  Check,
  Italic,
  Link2,
  Mail,
  Minus,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * soundcn — 813 sounds across 21 broad groups, installed one at a time
 * as an inline base64 mp3 next to a shared sound-engine.ts.
 *
 * The registry is not installed here, so the engine below is that file
 * reproduced honestly — one lazily created AudioContext, a buffer cache
 * keyed by name, source -> gain -> destination, volume and playbackRate
 * per call, a stop handle back — with `decodeAudioData(base64)` swapped
 * for a buffer synthesized on the fly. Nothing is downloaded, nothing
 * is bundled, and every cue name below is a real name from the
 * registry so the shapes match what you would actually install.
 *
 * Sound is invisible, and a switch you cannot see is a switch that
 * fails. So every press also lands in a small meter: bar width is how
 * long the sound runs, bar height is how loud it is, and how high the
 * bar floats is its pitch. Turn the volume off and the page still
 * works.
 * ------------------------------------------------------------------ */

type Cue = {
  /** Starting frequency in Hz. */
  hz: number;
  /** Length in seconds — these match the registry's own durations. */
  len: number;
  /** 0..1, how much of the body is noise rather than tone. */
  noise?: number;
  /** Frequency multiplier reached by the end. Above 1 rises. */
  sweep?: number;
  /** A partial added this far above the fundamental. */
  ratio?: number;
  /** Extra notes as [start fraction, frequency multiplier]. */
  notes?: readonly (readonly [number, number])[];
  /** Squarer body — reads as 8-bit. */
  chip?: boolean;
};

const CUES = {
  "click-soft": { hz: 1700, len: 0.05, noise: 0.7 },
  "tick-002": { hz: 2600, len: 0.035, noise: 0.85 },
  "hover-tick": { hz: 2000, len: 0.09, noise: 0.6 },
  "select-001": { hz: 900, len: 0.06, noise: 0.3 },
  "select-003": { hz: 560, len: 0.5, noise: 0.08, ratio: 1.5 },
  "tone-1": { hz: 700, len: 0.16, noise: 0 },
  "pluck-001": { hz: 440, len: 0.18, noise: 0.04, ratio: 2 },
  "confirmation-001": {
    hz: 660,
    len: 0.29,
    noise: 0,
    notes: [
      [0, 1],
      [0.45, 1.5],
    ],
  },
  "success-chime": {
    hz: 620,
    len: 0.49,
    noise: 0,
    notes: [
      [0, 1],
      [0.3, 1.25],
      [0.6, 1.5],
    ],
  },
  "error-buzz": { hz: 190, len: 0.22, noise: 0.3, sweep: 0.6 },
  "notification-pop": { hz: 880, len: 0.18, noise: 0, sweep: 1.5 },
  "switch-on": { hz: 420, len: 0.13, noise: 0.25, sweep: 1.7 },
  "switch-off": { hz: 420, len: 0.13, noise: 0.25, sweep: 0.6 },
  "jingles-nes-00": {
    hz: 523,
    len: 1.4,
    noise: 0,
    chip: true,
    notes: [
      [0, 1],
      [0.12, 1.26],
      [0.24, 1.5],
      [0.36, 2],
      [0.5, 1.5],
      [0.62, 2],
    ],
  },
} satisfies Record<string, Cue>;

type CueName = keyof typeof CUES;

/* ── the engine (soundcn/lib/sound-engine.ts, synthesized) ────────── */

let audioContext: AudioContext | null = null;
const bufferCache = new Map<string, AudioBuffer>();

function bake(ctx: AudioContext, cue: Cue): AudioBuffer {
  const total = Math.ceil(ctx.sampleRate * cue.len);
  const buffer = ctx.createBuffer(1, total, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const notes = cue.notes ?? ([[0, 1]] as const);
  const noise = cue.noise ?? 0;

  for (const [start, mult] of notes) {
    const from = Math.floor(start * cue.len * ctx.sampleRate);
    const span = cue.len - start * cue.len;
    let phase = 0;
    for (let i = from; i < total; i++) {
      const t = (i - from) / ctx.sampleRate;
      const p = t / span;
      const freq = cue.hz * mult * (1 + ((cue.sweep ?? 1) - 1) * p);
      phase += (2 * Math.PI * freq) / ctx.sampleRate;
      let tone = Math.sin(phase);
      if (cue.chip) tone = Math.tanh(tone * 3) * 0.7;
      if (cue.ratio) tone += 0.5 * Math.sin(phase * cue.ratio);
      const env = Math.exp(-t / (span / 4.5)) * Math.min(1, t * 500);
      const hiss = Math.random() * 2 - 1;
      data[i] +=
        (((1 - noise) * tone * 0.45 + noise * hiss * 0.5) * env) / notes.length;
    }
  }
  return buffer;
}

function playCue(
  name: CueName,
  options: { volume?: number; playbackRate?: number } = {},
) {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  const ctx = (audioContext ??= new AudioContext());
  if (ctx.state === "suspended") void ctx.resume();

  let buffer = bufferCache.get(name);
  if (!buffer) {
    buffer = bake(ctx, CUES[name]);
    bufferCache.set(name, buffer);
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = options.playbackRate ?? 1;
  gain.gain.value = options.volume ?? 1;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);

  return {
    stop: () => {
      try {
        source.stop();
      } catch {
        /* already finished */
      }
    },
  };
}

/* ── the visible half ─────────────────────────────────────────────── */

type Tone = "neutral" | "good" | "bad" | "quiet";

type Voice = {
  id: number;
  label: string;
  ms: number;
  volume: number;
  rate: number;
  tone: Tone;
  silent: boolean;
};

const TONE_FILL: Record<Tone, string> = {
  neutral: "bg-primary",
  good: "bg-positive",
  bad: "bg-destructive",
  quiet: "bg-muted-foreground",
};

type FireArgs = {
  cue: CueName;
  volume?: number;
  rate?: number;
  tone?: Tone;
  /** Register the press in the meter, but play nothing. */
  silent?: boolean;
  /** Cut whatever is already running, the way `interrupt` does. */
  interrupt?: boolean;
};

function useVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const nextId = useRef(0);
  const active = useRef<
    { id: number; stop: (() => void) | null; timer: number }[]
  >([]);

  const clear = useCallback(() => {
    for (const a of active.current) {
      a.stop?.();
      window.clearTimeout(a.timer);
    }
    active.current = [];
    setVoices([]);
  }, []);

  const fire = useCallback(
    ({ cue, volume = 0.6, rate = 1, tone = "neutral", silent, interrupt }: FireArgs) => {
      if (interrupt) clear();

      const id = ++nextId.current;
      const ms = Math.max(140, (CUES[cue].len / rate) * 1000);
      const handle =
        silent || volume === 0 ? null : playCue(cue, { volume, playbackRate: rate });
      const timer = window.setTimeout(() => {
        active.current = active.current.filter((a) => a.id !== id);
        setVoices((list) => list.filter((v) => v.id !== id));
      }, ms);

      active.current = [...active.current, { id, stop: handle?.stop ?? null, timer }];
      setVoices((list) =>
        [...list, { id, label: cue, ms, volume, rate, tone, silent: !!silent }].slice(-9),
      );
    },
    [clear],
  );

  return { voices, fire, clear };
}

function VoiceBar({ voice }: { voice: Voice }) {
  const width = Math.round(Math.min(120, 20 + voice.ms * 0.08));
  const height = Math.round(8 + voice.volume * 26);
  const lift = Math.max(-20, Math.min(20, Math.round((voice.rate - 1) * 42)));

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.5 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, transition: { duration: duration.instant } }}
      transition={{ duration: duration.instant, ease: ease.outQuart }}
      style={{ width, height, marginBottom: lift }}
      className="relative shrink-0 origin-bottom overflow-hidden rounded-sm"
    >
      {voice.silent ? (
        <div className="border-border-strong absolute inset-0 rounded-sm border border-dashed" />
      ) : (
        <>
          <div className="bg-border absolute inset-0 rounded-sm" />
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: voice.ms / 1000, ease: "linear" }}
            style={{ originX: 0 }}
            className={cn("absolute inset-0 rounded-sm", TONE_FILL[voice.tone])}
          />
        </>
      )}
    </motion.div>
  );
}

/**
 * What is coming out of the speakers, drawn.
 *
 * Width is length, height is loudness, height off the floor is pitch.
 * A dashed outline is a press that made no sound at all.
 */
function Meter({ voices, hint }: { voices: Voice[]; hint: string }) {
  const last = voices[voices.length - 1];
  const audible = voices.filter((v) => !v.silent).length;
  const readout = !last
    ? "silent"
    : audible === 0
      ? `${last.label} · no sound`
      : `${last.label} · ${audible} playing`;
  return (
    <div className="bg-secondary mt-4 rounded-lg border p-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-micro text-muted-foreground uppercase">{hint}</span>
        <span className="text-micro text-muted-foreground truncate font-mono tabular-nums">
          {readout}
        </span>
      </div>
      <div className="mt-2 flex h-20 items-end gap-1 overflow-hidden pb-6">
        <AnimatePresence initial={false}>
          {voices.map((v) => (
            <VoiceBar key={v.id} voice={v} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

type Side = { after: boolean };

/** Shared chrome for the little bits of product each pair sits in. */
function Row({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>
  );
}

/* ── 1. nothing comes back ────────────────────────────────────────── */

const MARKS = [
  { id: "bold", label: "Bold", Icon: Bold },
  { id: "italic", label: "Italic", Icon: Italic },
  { id: "link", label: "Link", Icon: Link2 },
] as const;

function SilencePair({ after }: Side) {
  const { voices, fire } = useVoices();
  const [marks, setMarks] = useState<string[]>([]);

  const toggle = (id: string) => {
    setMarks((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
    fire({ cue: "click-soft", volume: 0.5, silent: !after });
  };

  return (
    <div>
      <Row>
        <div className="bg-secondary flex gap-0.5 rounded-lg p-0.5">
          {MARKS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              aria-label={label}
              aria-pressed={marks.includes(id)}
              className={cn(
                "duration-fast ease-out-quart flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                marks.includes(id)
                  ? "bg-card text-foreground border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          ))}
        </div>
        <Button
          size="lg"
          className="ml-auto"
          onClick={() => fire({ cue: "confirmation-001", volume: 0.5, silent: !after })}
        >
          Save draft
        </Button>
      </Row>
      <Meter voices={voices} hint="Editor toolbar" />
    </div>
  );
}

/* ── 2. one beep for everything ───────────────────────────────────── */

function MeaningPair({ after }: Side) {
  const { voices, fire } = useVoices();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-ui">Invoice #4471</p>
          <p className="text-caption text-muted-foreground">Northwind Ltd · £2,480</p>
        </div>
        <Row>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              fire(
                after
                  ? { cue: "success-chime", volume: 0.5, tone: "good" }
                  : { cue: "tone-1", volume: 0.5 },
              );
              toast.success("Invoice approved");
            }}
          >
            <Check aria-hidden="true" />
            Approve
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              fire(
                after
                  ? { cue: "error-buzz", volume: 0.55, tone: "bad" }
                  : { cue: "tone-1", volume: 0.5 },
              );
              toast.error("Could not reject — approval already sent");
            }}
          >
            <Trash2 aria-hidden="true" />
            Reject
          </Button>
        </Row>
      </div>
      <Meter voices={voices} hint="Approve, then reject" />
    </div>
  );
}

/* ── 3. the wrong thing out of the catalogue ──────────────────────── */

const CHORES = ["Book the venue", "Send the invites", "Order the cake"];

function FitPair({ after }: Side) {
  const { voices, fire } = useVoices();
  const [done, setDone] = useState<string[]>([]);

  return (
    <div>
      <ul className="divide-y">
        {CHORES.map((chore) => {
          const isDone = done.includes(chore);
          return (
            <li key={chore}>
              <button
                type="button"
                onClick={() => {
                  setDone((d) => (isDone ? d.filter((x) => x !== chore) : [...d, chore]));
                  fire(
                    after
                      ? { cue: "tick-002", volume: 0.45 }
                      : { cue: "jingles-nes-00", volume: 0.4 },
                  );
                }}
                aria-pressed={isDone}
                className="hover:bg-secondary duration-fast ease-out-quart flex h-11 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors"
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border",
                    isDone && "bg-primary border-primary text-primary-foreground",
                  )}
                >
                  {isDone && <Check className="size-3.5" aria-hidden="true" />}
                </span>
                <span
                  className={cn(
                    "text-ui-sm",
                    isDone && "text-muted-foreground line-through",
                  )}
                >
                  {chore}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Meter voices={voices} hint="Tick all three, quickly" />
    </div>
  );
}

/* ── 4. presses piling up on top of each other ────────────────────── */

function InterruptPair({ after }: Side) {
  const { voices, fire } = useVoices();
  const [seat, setSeat] = useState(1);

  const move = (delta: number) => {
    setSeat((s) => Math.min(24, Math.max(1, s + delta)));
    fire({ cue: "select-003", volume: 0.4, interrupt: after });
  };

  return (
    <div>
      <Row className="justify-between">
        <div>
          <p className="text-ui">Seats</p>
          <p className="text-caption text-muted-foreground">Hold nothing back — mash it</p>
        </div>
        <div className="bg-secondary flex items-center gap-1 rounded-lg p-1">
          <Button
            size="icon-lg"
            variant="ghost"
            aria-label="One fewer seat"
            onClick={() => move(-1)}
          >
            <Minus aria-hidden="true" />
          </Button>
          <span className="text-ui w-10 text-center tabular-nums">{seat}</span>
          <Button
            size="icon-lg"
            variant="ghost"
            aria-label="One more seat"
            onClick={() => move(1)}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </Row>
      <Meter voices={voices} hint="How many are going at once" />
    </div>
  );
}

/* ── 5. a sound on every hover ────────────────────────────────────── */

const MAILS = [
  { from: "Priya Raman", subject: "Re: Thursday walkthrough" },
  { from: "Ops", subject: "Two invoices need a signature" },
  { from: "Tom Whitfield", subject: "Photos from the site visit" },
  { from: "Billing", subject: "Your receipt for August" },
];

function HoverPair({ after }: Side) {
  const { voices, fire } = useVoices();
  const [open, setOpen] = useState(MAILS[0].subject);

  return (
    <div>
      <ul className="divide-y">
        {MAILS.map((mail) => (
          <li key={mail.subject}>
            <button
              type="button"
              onMouseEnter={() => {
                if (!after) fire({ cue: "hover-tick", volume: 0.45 });
              }}
              onClick={() => {
                setOpen(mail.subject);
                if (after) fire({ cue: "select-001", volume: 0.45 });
              }}
              aria-pressed={open === mail.subject}
              className={cn(
                "duration-fast ease-out-quart flex h-12 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors",
                open === mail.subject ? "bg-secondary" : "hover:bg-secondary",
              )}
            >
              <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              <span className="text-ui-sm min-w-0 flex-1 truncate">{mail.subject}</span>
              <span className="text-caption text-muted-foreground shrink-0">
                {mail.from}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Meter voices={voices} hint="Sweep the pointer down the list" />
    </div>
  );
}

/* ── 6. everything at the same volume ─────────────────────────────── */

function MixPair({ after }: Side) {
  const { voices, fire } = useVoices();
  const [query, setQuery] = useState("");

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fire({ cue: "confirmation-001", volume: 0.6, tone: "good" });
          toast.success(query ? `Searching for “${query}”` : "Showing everything");
        }}
      >
        <Label htmlFor="soundcn-search" className="text-caption text-muted-foreground">
          Search orders
        </Label>
        <Row className="mt-1.5 flex-nowrap">
          <div className="relative min-w-0 flex-1">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              id="soundcn-search"
              value={query}
              placeholder="Type a customer name"
              className="h-9 pl-9"
              onChange={(e) => {
                setQuery(e.target.value);
                fire({
                  cue: "tick-002",
                  volume: after ? 0.12 : 0.6,
                  tone: after ? "quiet" : "neutral",
                });
              }}
            />
          </div>
          <Button size="lg" type="submit">
            Search
          </Button>
        </Row>
      </form>
      <Meter voices={voices} hint="Type a few letters, then search" />
    </div>
  );
}

/* ── 7. the same note whichever way you go ────────────────────────── */

function PitchPair({ after }: Side) {
  const { voices, fire } = useVoices();
  const [rating, setRating] = useState(3);

  const set = (next: number) => {
    setRating(next);
    fire({
      cue: "pluck-001",
      volume: 0.5,
      rate: after ? 0.8 + next * 0.14 : 1,
    });
  };

  return (
    <div>
      <p className="text-ui">How was the delivery?</p>
      <Row className="mt-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => set(n)}
            aria-label={`${n} out of 5`}
            aria-pressed={rating === n}
            className={cn(
              "duration-fast ease-out-quart flex h-11 w-11 items-center justify-center rounded-lg border transition-colors",
              n <= rating
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Star
              className={cn("size-5", n <= rating && "fill-current")}
              aria-hidden="true"
            />
          </button>
        ))}
        <span className="text-caption text-muted-foreground ml-1 tabular-nums">
          {rating} of 5
        </span>
      </Row>
      <Meter voices={voices} hint="Go up the stars, then back down" />
    </div>
  );
}

/* ── 8. a mute that half works ────────────────────────────────────── */

const ALERTS = [
  { id: "message", label: "Message", Icon: Mail, cue: "notification-pop" },
  { id: "mention", label: "Mention", Icon: AtSign, cue: "select-001" },
  { id: "alert", label: "Alert", Icon: Bell, cue: "error-buzz" },
] as const;

function MutePair({ after }: Side) {
  const { voices, fire } = useVoices();
  const [sound, setSound] = useState(false);
  const [log, setLog] = useState<{ id: number; label: string }[]>([]);
  const nextId = useRef(0);

  return (
    <div>
      <Row className="justify-between">
        <Label
          htmlFor={`soundcn-mute-${after}`}
          className="flex h-9 cursor-pointer items-center gap-2.5"
        >
          <Switch
            id={`soundcn-mute-${after}`}
            checked={sound}
            onCheckedChange={(v) => {
              setSound(v);
              if (v) fire({ cue: "switch-on", volume: 0.4 });
            }}
          />
          <span className="text-ui-sm">Notification sounds</span>
        </Label>
        <Row>
          {ALERTS.map(({ id, label, Icon, cue }) => (
            <Button
              key={id}
              size="lg"
              variant="outline"
              onClick={() => {
                setLog((l) => [{ id: ++nextId.current, label }, ...l].slice(0, 3));
                // Before: the switch covers the gentle ones and forgets the
                // loud one. After: one setting, every cue asks it first.
                const escapes = !after && id === "alert";
                fire({
                  cue,
                  volume: 0.5,
                  tone: id === "alert" ? "bad" : "neutral",
                  silent: !sound && !escapes,
                });
              }}
            >
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </Row>
      </Row>

      <ul className="mt-3 min-h-16 space-y-1">
        <AnimatePresence initial={false}>
          {log.map((entry) => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className="bg-secondary text-caption flex h-8 items-center gap-2 rounded-md px-2.5"
            >
              <span className="bg-muted-foreground size-1.5 rounded-full" aria-hidden="true" />
              {entry.label} arrived
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <Meter voices={voices} hint="Leave the switch off, then press all three" />
    </div>
  );
}

/* ── 9. the sound was the only confirmation ───────────────────────── */

function VisiblePair({ after }: Side) {
  const { voices, fire } = useVoices();
  const [copied, setCopied] = useState(false);
  const revert = useRef<number | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ui">Invite link</p>
          <p className="text-caption text-muted-foreground truncate font-mono">
            share.example.com/j/8FQ2-KD
          </p>
        </div>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            fire({ cue: "success-chime", volume: 0.5, tone: after ? "good" : "neutral" });
            if (!after) return;
            setCopied(true);
            toast.success("Link copied");
            if (revert.current) window.clearTimeout(revert.current);
            revert.current = window.setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <Meter voices={voices} hint="Now imagine the speakers are off" />
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function SoundcnDemo() {
  return (
    <div>
      <BeforeAfter
        principle="A press should come back to you. When the thing you pressed answers with nothing at all, you end up watching the screen to be sure it heard you."
        before={<SilencePair after={false} />}
        after={<SilencePair after />}
      />
      <BeforeAfter
        principle="Two different outcomes should not arrive as the same noise. If approving and failing sound identical, the sound has told you nothing."
        before={<MeaningPair after={false} />}
        after={<MeaningPair after />}
      />
      <BeforeAfter
        principle="The sound has to suit the size of what happened. A fanfare for ticking off a chore is charming once, and it is still going when you tick the next one."
        before={<FitPair after={false} />}
        after={<FitPair after />}
      />
      <BeforeAfter
        principle="People press things fast. If every press piles a fresh sound on top of the last one, five quick presses arrive as one smear instead of five."
        before={<InterruptPair after={false} />}
        after={<InterruptPair after />}
      />
      <BeforeAfter
        principle="Sound belongs on things you chose to do, not on the pointer drifting across the screen. A list that chirps at you as you pass over it is noise nobody asked for."
        before={<HoverPair after={false} />}
        after={<HoverPair after />}
      />
      <BeforeAfter
        principle="Not everything deserves the same loudness. The small constant sounds should sit underneath, so the one that means something still stands out."
        before={<MixPair after={false} />}
        after={<MixPair after />}
      />
      <BeforeAfter
        principle="A sound can carry the value itself, not just the fact that something moved. Let it rise as the number rises and you know which way you went without looking."
        before={<PitchPair after={false} />}
        after={<PitchPair after />}
      />
      <BeforeAfter
        principle="If someone turns the sound off, that has to hold for everything. One loud exception undoes the setting, and they mute the whole app instead."
        before={<MutePair after={false} />}
        after={<MutePair after />}
      />
      <BeforeAfter
        principle="Sound is a second layer over something you can already see. When the chime is the only confirmation, everyone with their speakers off is left guessing."
        before={<VisiblePair after={false} />}
        after={<VisiblePair after />}
      />
    </div>
  );
}
