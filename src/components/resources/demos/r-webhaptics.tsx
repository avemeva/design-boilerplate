"use client";

import { motion } from "motion/react";
import { useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

/* web-haptics is not installed here, so this is the smallest honest
 * reimplementation of its two real functions: the 20ms PWM that fakes
 * intensity on a motor that only knows on/off, and the flattening of
 * {delay,duration,intensity} pulses into one navigator.vibrate array.
 * Pattern values are defaultPatterns from web-haptics 0.0.6. */

type Pulse = { delay?: number; duration: number; intensity: number };

const PRESETS = {
  selection: [{ duration: 8, intensity: 0.3 }],
  light: [{ duration: 15, intensity: 0.4 }],
  medium: [{ duration: 25, intensity: 0.7 }],
  heavy: [{ duration: 35, intensity: 1 }],
  success: [{ duration: 30, intensity: 0.5 }, { delay: 60, duration: 40, intensity: 1 }],
  warning: [{ duration: 40, intensity: 0.8 }, { delay: 100, duration: 40, intensity: 0.6 }],
  error: [
    { duration: 40, intensity: 0.9 },
    { delay: 40, duration: 40, intensity: 0.9 },
    { delay: 40, duration: 40, intensity: 0.9 },
  ],
} satisfies Record<string, Pulse[]>;

const NAMES = Object.keys(PRESETS) as (keyof typeof PRESETS)[];
const FRAME = 20;

function pwm(duration: number, intensity: number) {
  if (intensity >= 1) return [duration];
  const on = Math.max(1, Math.round(FRAME * intensity));
  const out: number[] = [];
  let rest = duration;
  for (; rest >= FRAME; rest -= FRAME) out.push(on, FRAME - on);
  if (rest > 0) {
    const a = Math.max(1, Math.round(rest * intensity));
    out.push(a);
    if (rest - a > 0) out.push(rest - a);
  }
  return out;
}

function flatten(pulses: Pulse[]) {
  const out: number[] = [];
  for (const p of pulses) {
    const delay = p.delay ?? 0;
    if (delay > 0) {
      if (out.length > 0 && out.length % 2 === 0) out[out.length - 1] += delay;
      else out.push(...(out.length === 0 ? [0, delay] : [delay]));
    }
    out.push(...pwm(p.duration, p.intensity));
  }
  return out;
}

export function WebhapticsDemo() {
  const [preset, setPreset] = useState<keyof typeof PRESETS>("success");
  const [play, setPlay] = useState(0);
  const switchRef = useRef<HTMLInputElement>(null);
  const supported = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function",
    () => false,
  );

  const steps = flatten(PRESETS[preset]);
  const total = steps.reduce((a, b) => a + b, 0);
  const onMs = steps.reduce((a, b, i) => (i % 2 === 0 ? a + b : a), 0);

  function fire(name: keyof typeof PRESETS) {
    setPreset(name);
    setPlay((n) => n + 1);
    if (supported) navigator.vibrate(flatten(PRESETS[name]));
    // iOS has no Vibration API; the library falls back to clicking a
    // hidden switch control, which Safari renders with a real tick.
    else switchRef.current?.click();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {NAMES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => fire(n)}
            aria-pressed={preset === n}
            className={cn(
              "text-ui h-9 rounded-lg px-3 transition-colors",
              preset === n
                ? "bg-feature text-feature-foreground"
                : "text-muted-foreground hover:bg-secondary border",
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <div
        className="bg-secondary relative flex h-16 overflow-hidden rounded-lg"
        aria-hidden="true"
      >
        {steps.map((ms, i) => (
          <div
            key={`${preset}-${i}`}
            style={{ width: `${(ms / total) * 100}%` }}
            className={cn("h-full", i % 2 === 0 && "bg-feature")}
          />
        ))}
        <motion.div
          key={play}
          initial={{ left: "0%" }}
          animate={{ left: "100%" }}
          transition={{ duration: total / 1000, ease: "linear" }}
          className="bg-accent-solid absolute inset-y-0 w-0.5"
        />
      </div>

      <p className="text-caption text-muted-foreground tabular-nums">
        <code className="text-foreground font-mono text-xs">
          navigator.vibrate([{steps.join(", ")}])
        </code>{" "}
        — {total}ms long, {onMs}ms of it with the motor actually on.
      </p>

      <label htmlFor="haptic-switch" className="sr-only">
        Haptic fallback switch
      </label>
      <input id="haptic-switch" ref={switchRef} type="checkbox" tabIndex={-1} className="sr-only" />

      <p className="text-caption text-muted-foreground">
        The Vibration API has no intensity — the motor is on or off. Intensity
        is faked by pulse-width: each pulse is chopped into 20ms frames and the
        motor runs for round(20 × intensity) of every frame.{" "}
        <strong className="text-foreground">selection</strong> at 0.3 is 2ms on,
        6ms off; <strong className="text-foreground">heavy</strong> at 1.0 skips
        the chopping and sends one solid 35ms pulse. The dark bands above are
        that array, drawn to scale.{" "}
        {supported
          ? "This device exposes navigator.vibrate, so the buttons above are also felt."
          : "This device has no navigator.vibrate, so the pattern is drawn, not felt."}
      </p>
    </div>
  );
}
