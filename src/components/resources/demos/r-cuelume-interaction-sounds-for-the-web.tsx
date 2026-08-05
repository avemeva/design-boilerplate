"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Delete,
  Send,
  Star,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * cuelume 0.2.2 — turn your sound on.
 *
 * The package is not a dependency here, so the seventeen recipes and the
 * renderer below are ported from its published `dist/`: real Web Audio
 * synthesis, no files. Both sides of every switch make noise — the
 * "before" is the version a normal product ships, the "after" is the one
 * that used the palette properly. All seventeen cues are heard across
 * the six switches.
 *
 * bind() and the data-cuelume-* attributes are not used: which of the
 * two ways you wire a cue up is invisible to whoever is listening, so
 * every cue here is played from the handler that already exists.
 */

/* ── recipes: dist/sounds/recipes.js ──────────────────────────────── */

interface ToneLayer {
  kind: "tone";
  waveform: OscillatorType;
  frequency: number;
  offset?: number;
  attack: number;
  decay: number;
  peak: number;
  detune?: number;
  glideTo?: number;
  glideTime?: number;
}

interface NoiseLayer {
  kind: "noise";
  filterType: BiquadFilterType;
  filterFrequency: number;
  filterQ?: number;
  offset?: number;
  attack: number;
  decay: number;
  peak: number;
}

type Layer = ToneLayer | NoiseLayer;

interface Shimmer {
  delay: number;
  feedback: number;
  wet: number;
  lowpass: number;
}

interface Recipe {
  masterGain: number;
  layers: Layer[];
  shimmer?: Shimmer;
}

const RECIPES = {
  chime: {
    masterGain: 0.5,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 1046.5, attack: 0.006, decay: 0.22, peak: 0.09 },
      { kind: "tone", waveform: "sine", frequency: 1568, offset: 0.09, attack: 0.006, decay: 0.26, peak: 0.08 },
    ],
    shimmer: { delay: 0.12, feedback: 0.25, wet: 0.18, lowpass: 4000 },
  },
  sparkle: {
    masterGain: 0.5,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 1760, offset: 0, attack: 0.003, decay: 0.09, peak: 0.045 },
      { kind: "tone", waveform: "sine", frequency: 2217, offset: 0.045, attack: 0.003, decay: 0.09, peak: 0.04 },
      { kind: "tone", waveform: "sine", frequency: 2637, offset: 0.09, attack: 0.003, decay: 0.1, peak: 0.038 },
      { kind: "tone", waveform: "sine", frequency: 3520, offset: 0.135, attack: 0.003, decay: 0.12, peak: 0.032 },
    ],
    shimmer: { delay: 0.07, feedback: 0.35, wet: 0.22, lowpass: 6000 },
  },
  droplet: {
    masterGain: 0.55,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 1200, glideTo: 550, glideTime: 0.14, attack: 0.004, decay: 0.2, peak: 0.075 },
    ],
    shimmer: { delay: 0.09, feedback: 0.2, wet: 0.15, lowpass: 3000 },
  },
  bloom: {
    masterGain: 0.5,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 528, attack: 0.06, decay: 0.32, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 528, detune: 12, attack: 0.06, decay: 0.34, peak: 0.05 },
    ],
    shimmer: { delay: 0.15, feedback: 0.2, wet: 0.12, lowpass: 2500 },
  },
  whisper: {
    masterGain: 0.48,
    layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 1600, filterQ: 0.7, attack: 0.025, decay: 0.13, peak: 0.04 },
      { kind: "tone", waveform: "sine", frequency: 880, glideTo: 660, glideTime: 0.14, offset: 0.01, attack: 0.012, decay: 0.14, peak: 0.025 },
    ],
  },
  tick: {
    masterGain: 0.4,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 5400, filterQ: 1.8, attack: 0.001, decay: 0.018, peak: 0.14 },
      { kind: "tone", waveform: "sine", frequency: 2600, attack: 0.001, decay: 0.012, peak: 0.018 },
    ],
  },
  press: {
    masterGain: 0.4,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 1700, filterQ: 1.4, attack: 0.001, decay: 0.02, peak: 0.13 },
    ],
  },
  release: {
    masterGain: 0.4,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 4600, filterQ: 1.8, attack: 0.001, decay: 0.016, peak: 0.12 },
      { kind: "tone", waveform: "sine", frequency: 3200, offset: 0.006, attack: 0.001, decay: 0.05, peak: 0.02 },
    ],
  },
  toggle: {
    masterGain: 0.4,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 2200, filterQ: 1.6, attack: 0.001, decay: 0.016, peak: 0.12 },
      { kind: "noise", filterType: "bandpass", filterFrequency: 3800, filterQ: 1.6, offset: 0.024, attack: 0.001, decay: 0.02, peak: 0.1 },
    ],
  },
  success: {
    masterGain: 0.5,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 880, attack: 0.004, decay: 0.09, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 1108.73, offset: 0.06, attack: 0.004, decay: 0.1, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 1318.51, offset: 0.12, attack: 0.004, decay: 0.18, peak: 0.07 },
    ],
    shimmer: { delay: 0.1, feedback: 0.22, wet: 0.16, lowpass: 4500 },
  },
  error: {
    masterGain: 0.42,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 850, filterQ: 1.1, attack: 0.001, decay: 0.035, peak: 0.13 },
      { kind: "tone", waveform: "triangle", frequency: 440, offset: 0.025, attack: 0.004, decay: 0.09, peak: 0.045 },
      { kind: "tone", waveform: "triangle", frequency: 349.23, offset: 0.1, attack: 0.004, decay: 0.14, peak: 0.04 },
    ],
  },
  page: {
    masterGain: 0.38,
    layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 1800, filterQ: 0.7, attack: 0.006, decay: 0.08, peak: 0.11 },
      { kind: "noise", filterType: "bandpass", filterFrequency: 4200, filterQ: 1.2, offset: 0.04, attack: 0.004, decay: 0.065, peak: 0.08 },
      { kind: "tone", waveform: "sine", frequency: 2400, offset: 0.075, attack: 0.002, decay: 0.045, peak: 0.02 },
    ],
  },
  loading: {
    masterGain: 0.42,
    layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 1400, filterQ: 0.6, attack: 0.035, decay: 0.14, peak: 0.035 },
      { kind: "tone", waveform: "sine", frequency: 420, glideTo: 630, glideTime: 0.18, attack: 0.025, decay: 0.18, peak: 0.05 },
    ],
    shimmer: { delay: 0.11, feedback: 0.18, wet: 0.12, lowpass: 2800 },
  },
  ready: {
    masterGain: 0.48,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 3600, filterQ: 1.8, attack: 0.001, decay: 0.02, peak: 0.11 },
      { kind: "tone", waveform: "triangle", frequency: 330, glideTo: 660, glideTime: 0.12, offset: 0.012, attack: 0.004, decay: 0.16, peak: 0.055 },
      { kind: "tone", waveform: "sine", frequency: 990, offset: 0.13, attack: 0.004, decay: 0.22, peak: 0.06 },
    ],
    shimmer: { delay: 0.1, feedback: 0.16, wet: 0.1, lowpass: 4200 },
  },
  pulse: {
    masterGain: 0.42,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 2600, filterQ: 2.4, attack: 0.001, decay: 0.022, peak: 0.08 },
      { kind: "tone", waveform: "triangle", frequency: 620, glideTo: 1240, glideTime: 0.07, attack: 0.002, decay: 0.085, peak: 0.055 },
    ],
  },
  scan: {
    masterGain: 0.4,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 740, attack: 0.002, decay: 0.055, peak: 0.05 },
      { kind: "tone", waveform: "sine", frequency: 1110, offset: 0.045, attack: 0.002, decay: 0.055, peak: 0.045 },
      { kind: "tone", waveform: "sine", frequency: 1665, offset: 0.09, attack: 0.002, decay: 0.07, peak: 0.04 },
    ],
    shimmer: { delay: 0.065, feedback: 0.16, wet: 0.1, lowpass: 4200 },
  },
  arrival: {
    masterGain: 0.44,
    layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 900, filterQ: 0.8, attack: 0.05, decay: 0.24, peak: 0.035 },
      { kind: "tone", waveform: "sine", frequency: 220, glideTo: 440, glideTime: 0.32, attack: 0.04, decay: 0.34, peak: 0.055 },
      { kind: "tone", waveform: "sine", frequency: 659.25, offset: 0.12, attack: 0.045, decay: 0.32, peak: 0.04 },
      { kind: "tone", waveform: "sine", frequency: 987.77, offset: 0.19, attack: 0.045, decay: 0.34, peak: 0.032 },
    ],
    shimmer: { delay: 0.16, feedback: 0.28, wet: 0.18, lowpass: 3200 },
  },
} satisfies Record<string, Recipe>;

type SoundName = keyof typeof RECIPES;

/* ── engine: dist/audio/engine.js ─────────────────────────────────── */

const SOURCE_STOP_PADDING = 0.05;
const CLEANUP_MARGIN = 0.05;
const INAUDIBLE_GAIN = 0.001;
const OUTPUT_GAIN = 4;
const LIMITER = { threshold: -8, knee: 6, ratio: 12, attack: 0.002, release: 0.08 };

let sharedContext: AudioContext | null = null;
let sharedOutput: GainNode | null = null;

const layerStart = (l: Layer) => l.offset ?? 0;
const layerEnd = (l: Layer) => layerStart(l) + l.attack + l.decay;

function sourceEnd(recipe: Recipe) {
  return Math.max(...recipe.layers.map((l) => layerEnd(l) + SOURCE_STOP_PADDING));
}

function shimmerTail(shimmer?: Shimmer) {
  if (!shimmer || shimmer.feedback <= 0) return 0;
  if (shimmer.feedback >= 1) return shimmer.delay;
  return (
    shimmer.delay *
    (1 + Math.ceil(Math.log(INAUDIBLE_GAIN) / Math.log(shimmer.feedback)))
  );
}

function renderTone(
  context: AudioContext,
  destination: AudioNode,
  layer: ToneLayer,
  startTime: number,
) {
  const oscillator = context.createOscillator();
  oscillator.type = layer.waveform;
  oscillator.frequency.setValueAtTime(layer.frequency, startTime);
  if (layer.detune) oscillator.detune.value = layer.detune;
  if (layer.glideTo !== undefined) {
    const glideTime = layer.glideTime ?? layer.attack + layer.decay;
    oscillator.frequency.exponentialRampToValueAtTime(
      layer.glideTo,
      startTime + glideTime,
    );
  }
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + layer.attack + layer.decay,
  );
  oscillator.connect(gain).connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + layer.attack + layer.decay + SOURCE_STOP_PADDING);
}

function renderNoise(
  context: AudioContext,
  destination: AudioNode,
  layer: NoiseLayer,
  startTime: number,
) {
  const duration = layer.attack + layer.decay + SOURCE_STOP_PADDING;
  const length = Math.max(1, Math.floor(duration * context.sampleRate));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = 2 * Math.random() - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = layer.filterType;
  filter.frequency.value = layer.filterFrequency;
  if (layer.filterQ !== undefined) filter.Q.value = layer.filterQ;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + layer.attack + layer.decay,
  );
  source.connect(filter).connect(gain).connect(destination);
  source.start(startTime);
  source.stop(startTime + duration);
}

function attachShimmer(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  shimmer: Shimmer,
) {
  const delay = context.createDelay(1);
  delay.delayTime.value = shimmer.delay;
  const feedbackFilter = context.createBiquadFilter();
  feedbackFilter.type = "lowpass";
  feedbackFilter.frequency.value = shimmer.lowpass;
  const feedbackGain = context.createGain();
  feedbackGain.gain.value = shimmer.feedback;
  const wetGain = context.createGain();
  wetGain.gain.value = shimmer.wet;
  source.connect(delay);
  delay.connect(feedbackFilter);
  feedbackFilter.connect(feedbackGain);
  feedbackGain.connect(delay);
  feedbackFilter.connect(wetGain);
  wetGain.connect(destination);
  return [delay, feedbackFilter, feedbackGain, wetGain];
}

/** The package's output stage: +4x into a limiter, shared by every cue. */
function getOutput(context: AudioContext) {
  if (sharedOutput) return sharedOutput;
  const output = context.createGain();
  output.gain.value = OUTPUT_GAIN;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = LIMITER.threshold;
  limiter.knee.value = LIMITER.knee;
  limiter.ratio.value = LIMITER.ratio;
  limiter.attack.value = LIMITER.attack;
  limiter.release.value = LIMITER.release;
  output.connect(limiter).connect(context.destination);
  sharedOutput = output;
  return output;
}

function renderRecipe(
  context: AudioContext,
  output: AudioNode,
  recipe: Recipe,
  volume: number,
) {
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.value = recipe.masterGain * volume;
  master.connect(output);
  const shimmerNodes = recipe.shimmer
    ? attachShimmer(context, master, output, recipe.shimmer)
    : [];
  for (const layer of recipe.layers) {
    const startTime = now + (layer.offset ?? 0);
    if (layer.kind === "tone") renderTone(context, master, layer, startTime);
    else renderNoise(context, master, layer, startTime);
  }
  const cleanupAfterMs =
    (sourceEnd(recipe) + shimmerTail(recipe.shimmer) + CLEANUP_MARGIN) * 1000;
  setTimeout(() => {
    master.disconnect();
    for (const node of shimmerNodes) node.disconnect();
  }, cleanupAfterMs);
}

function getAudioContext(): AudioContext | null {
  if (sharedContext) return sharedContext;
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    sharedContext = new Ctor();
  } catch {
    return null;
  }
  return sharedContext;
}

/** `play(name, { volume })`, exactly as the package exposes it. */
function play(name: SoundName, options?: { volume?: number }) {
  const context = getAudioContext();
  if (!context) return;
  const volume = Math.min(1, Math.max(0, options?.volume ?? 1));
  if (volume === 0) return;
  const recipe: Recipe = RECIPES[name];
  const output = getOutput(context);
  if (context.state === "running") {
    renderRecipe(context, output, recipe, volume);
    return;
  }
  try {
    void context.resume().then(
      () => {
        if (context.state === "running")
          renderRecipe(context, output, recipe, volume);
      },
      () => {},
    );
  } catch {
    // Some browsers throw synchronously when audio is blocked.
  }
}

/* ── the 150ms global hover guard ─────────────────────────────────── */

const HOVER_GAP_MS = 150;
let lastHoverAt = Number.NEGATIVE_INFINITY;

function hoverCue(name: SoundName, guarded: boolean) {
  if (guarded) {
    const now = performance.now();
    if (now - lastHoverAt < HOVER_GAP_MS) return false;
    lastHoverAt = now;
  }
  play(name);
  return true;
}

/* ── 1 · a key that travels ───────────────────────────────────────── */

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

function Keypad({ twoPart }: { twoPart: boolean }) {
  const [code, setCode] = useState("");

  const keyProps = twoPart
    ? {
        onPointerDown: () => play("press"),
        onPointerUp: () => play("release"),
      }
    : { onPointerDown: () => play("tick") };

  const key =
    "text-ui bg-card hover:bg-secondary duration-fast ease-out-quart h-12 rounded-lg border transition-colors active:translate-y-px";

  return (
    <div className="mx-auto max-w-xs">
      <div className="bg-secondary flex h-12 items-center justify-between gap-2 rounded-lg pr-1 pl-3">
        <span className="text-ui font-mono tracking-widest tabular-nums">
          {code || <span className="text-muted-foreground">••••</span>}
        </span>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Delete last digit"
          onPointerDown={() => play(twoPart ? "whisper" : "tick")}
          onClick={() => setCode((c) => c.slice(0, -1))}
        >
          <Delete aria-hidden />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            {...keyProps}
            onClick={() => setCode((c) => (c + k).slice(0, 8))}
            className={key}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── 2 · one voice per control ────────────────────────────────────── */

function ControlPanel({ distinct }: { distinct: boolean }) {
  const notifyId = useId();
  const [notify, setNotify] = useState(true);
  const [page, setPage] = useState(3);
  const [copied, setCopied] = useState(false);
  const [starred, setStarred] = useState(false);
  const [banner, setBanner] = useState(true);
  const copyTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const cue = (name: SoundName) => play(distinct ? name : "tick");

  return (
    <div className="mx-auto max-w-md space-y-3">
      {banner ? (
        <div className="bg-secondary flex items-center justify-between gap-2 rounded-lg py-1.5 pr-1 pl-3">
          <p className="text-ui-sm text-muted-foreground">
            Draft saved 2 minutes ago
          </p>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Dismiss draft notice"
            onClick={() => {
              cue("droplet");
              setBanner(false);
            }}
          >
            <X aria-hidden />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="lg"
          onClick={() => {
            cue("bloom");
            setBanner(true);
          }}
        >
          Bring the notice back
        </Button>
      )}

      <div className="flex h-9 items-center justify-between gap-3">
        <Label htmlFor={notifyId} className="text-ui-sm">
          Email me about replies
        </Label>
        <Switch
          id={notifyId}
          checked={notify}
          onCheckedChange={(v) => {
            cue("toggle");
            setNotify(v);
          }}
        />
      </div>

      <div className="flex h-9 items-center justify-between gap-3">
        <p className="text-ui-sm text-muted-foreground tabular-nums">
          Page {page} of 12
        </p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => {
              cue("page");
              setPage((p) => Math.max(1, p - 1));
            }}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Next page"
            disabled={page === 12}
            onClick={() => {
              cue("page");
              setPage((p) => Math.min(12, p + 1));
            }}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="lg" onClick={() => cue("pulse")}>
          Publish
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            cue("scan");
            setCopied(true);
            window.clearTimeout(copyTimer.current);
            copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Link copied" : "Copy link"}
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={starred ? "Remove from favourites" : "Add to favourites"}
          aria-pressed={starred}
          onClick={() => {
            cue(starred ? "droplet" : "sparkle");
            setStarred((s) => !s);
          }}
        >
          <Star
            aria-hidden
            className={cn(starred && "fill-foreground text-foreground")}
          />
        </Button>
      </div>
    </div>
  );
}

/* ── 3 · a switch you can hear the direction of ───────────────────── */

const SETTINGS = [
  { label: "Do not disturb", on: false },
  { label: "Autoplay video", on: true },
  { label: "Sync over cellular", on: false },
];

function SettingsList({ directional }: { directional: boolean }) {
  const groupId = useId();
  const [state, setState] = useState(() => SETTINGS.map((s) => s.on));

  return (
    <div className="mx-auto max-w-md divide-y">
      {SETTINGS.map((setting, i) => {
        const id = `${groupId}-${i}`;
        return (
          <div
            key={setting.label}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <Label htmlFor={id} className="text-ui-sm">
              {setting.label}
            </Label>
            <Switch
              id={id}
              checked={state[i]}
              onCheckedChange={(v) => {
                play(directional ? (v ? "ready" : "droplet") : "toggle");
                setState((prev) => prev.map((p, j) => (j === i ? v : p)));
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ── 4 · running the cursor down a menu ───────────────────────────── */

const MENU = [
  "Overview",
  "Activity",
  "Members",
  "Billing",
  "Webhooks",
  "Audit log",
  "Integrations",
  "Danger zone",
];

function NavMenu({ guarded }: { guarded: boolean }) {
  const [active, setActive] = useState(MENU[0]);
  const [lit, setLit] = useState<{ item: string; id: number } | null>(null);

  return (
    <div className="mx-auto max-w-xs">
      <div className="bg-card rounded-xl border p-1">
        {MENU.map((item) => (
          <button
            key={item}
            type="button"
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              if (hoverCue("tick", guarded))
                setLit((prev) => ({ item, id: (prev?.id ?? 0) + 1 }));
            }}
            onClick={() => {
              play("scan");
              setActive(item);
            }}
            aria-pressed={active === item}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart relative flex h-9 w-full items-center rounded-lg px-3 text-left transition-colors",
              active === item
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
            {lit?.item === item && (
              <span
                key={lit.id}
                aria-hidden
                className="bg-foreground/10 pointer-events-none absolute inset-0 rounded-lg"
                style={{ animation: "cue-lit 380ms ease-out forwards" }}
              />
            )}
          </button>
        ))}
      </div>
      <style>{`@keyframes cue-lit{from{opacity:1}to{opacity:0}}`}</style>
    </div>
  );
}

/* ── 5 · hearing a save land ──────────────────────────────────────── */

type SaveState = "idle" | "saving" | "saved" | "failed";

function SaveForm({ narrated }: { narrated: boolean }) {
  const nameId = useId();
  const [name, setName] = useState("Quarterly report");
  const [state, setState] = useState<SaveState>("idle");
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (state === "saving") return;
    play(narrated ? "loading" : "tick");
    setState("saving");
    const willFail = name.trim().length === 0;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setState(willFail ? "failed" : "saved");
      if (narrated) play(willFail ? "error" : "success");
    }, 1600);
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={nameId} className="text-ui-sm">
          Report name
        </Label>
        <Input
          id={nameId}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setState("idle");
          }}
          placeholder="Clear the field to see it fail"
          className="h-9"
        />
      </div>

      <div className="flex h-9 items-center gap-3">
        <Button type="submit" size="lg" disabled={state === "saving"}>
          <Send aria-hidden />
          Save report
        </Button>
        {state === "saving" && (
          <span className="text-caption text-muted-foreground flex items-center gap-2">
            <Spinner className="size-3.5" />
            Saving…
          </span>
        )}
        {state === "saved" && (
          <span className="text-caption text-positive flex items-center gap-1.5">
            <Check aria-hidden className="size-3.5" />
            Saved
          </span>
        )}
        {state === "failed" && (
          <span className="text-caption text-destructive">
            Give it a name first
          </span>
        )}
      </div>
    </form>
  );
}

/* ── 6 · a dozen things landing at once ───────────────────────────── */

const INBOX = [
  "Dana commented on Q3 forecast",
  "Marco approved your expense",
  "Build #4182 finished",
  "Priya mentioned you in Billing",
  "3 new sign-ups today",
  "Invoice 0912 was paid",
  "Lena shared a folder with you",
  "Weekly digest is ready",
  "Sam replied to your thread",
  "Storage is 82% full",
  "Two invites are still pending",
  "Deploy to production succeeded",
];

function Inbox({ batched }: { batched: boolean }) {
  const [arrived, setArrived] = useState(INBOX.length);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );

  const deliver = () => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
    setArrived(0);
    if (batched) play("arrival");
    timers.current = INBOX.map((_, i) =>
      window.setTimeout(() => {
        setArrived(i + 1);
        if (!batched) play("chime");
      }, 90 * (i + 1)),
    );
  };

  return (
    <div className="mx-auto max-w-md space-y-3">
      <Button size="lg" onClick={deliver}>
        Catch up on {INBOX.length} notifications
      </Button>

      <div className="bg-card divide-y rounded-xl border px-3">
        {INBOX.map((line, i) => (
          <p
            key={line}
            className={cn(
              "text-ui-sm duration-base ease-out-quart py-2 transition-[opacity,transform]",
              i < arrived
                ? "text-foreground opacity-100"
                : "translate-y-1 opacity-0",
            )}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function CuelumeInteractionSoundsForTheWebDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The keys go down and spring back, instead of just clicking."
        before={<Keypad twoPart={false} />}
        after={<Keypad twoPart />}
      />

      <BeforeAfter
        principle="Every control used to make the same noise. Now each one sounds like itself."
        before={<ControlPanel distinct={false} />}
        after={<ControlPanel distinct />}
      />

      <BeforeAfter
        principle="You can hear whether you switched it on or off."
        before={<SettingsList directional={false} />}
        after={<SettingsList directional />}
      />

      <BeforeAfter
        principle="Running the cursor down the menu stopped sounding like a machine gun."
        before={<NavMenu guarded={false} />}
        after={<NavMenu guarded />}
      />

      <BeforeAfter
        principle="You can hear it land, even if you looked away while it saved."
        before={<SaveForm narrated={false} />}
        after={<SaveForm narrated />}
      />

      <BeforeAfter
        principle="Twelve notifications used to make twelve noises. Now they make one."
        before={<Inbox batched={false} />}
        after={<Inbox batched />}
      />
    </div>
  );
}
