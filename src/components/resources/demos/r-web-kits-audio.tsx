"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * @web-kits/audio — a sound is JSON, not a file.
 * The package is not installed here, so this is the smallest honest
 * version of its Layer schema { source, envelope, gain } wired to the
 * Web Audio API by hand. Same shape, ~20 lines of synthesis.
 * ------------------------------------------------------------------ */

type Wave = "sine" | "triangle" | "square" | "sawtooth";
type Layer = {
  source: { type: Wave; frequency: number };
  envelope: { attack: number; decay: number };
  gain: number;
};

const SOUNDS: Record<string, Layer> = {
  click: { source: { type: "triangle", frequency: 660 }, envelope: { attack: 0.002, decay: 0.06 }, gain: 0.1 },
  success: { source: { type: "sine", frequency: 880 }, envelope: { attack: 0.004, decay: 0.28 }, gain: 0.12 },
  error: { source: { type: "square", frequency: 180 }, envelope: { attack: 0.001, decay: 0.2 }, gain: 0.06 },
};

const WAVES: Wave[] = ["sine", "triangle", "square", "sawtooth"];

export function WebKitsAudioDemo() {
  const ctx = useRef<AudioContext | null>(null);
  const [name, setName] = useState<keyof typeof SOUNDS>("click");
  const [wave, setWave] = useState<Wave>("triangle");
  const [ready, setReady] = useState(false);
  const [pulse, setPulse] = useState(0);

  const def: Layer = { ...SOUNDS[name], source: { ...SOUNDS[name].source, type: wave } };

  function play(sound: Layer) {
    // ensureReady(): the context only leaves "suspended" inside a gesture.
    const ac = (ctx.current ??= new AudioContext());
    void ac.resume();
    setReady(true);
    setPulse((p) => p + 1);
    const t = ac.currentTime;
    const end = t + sound.envelope.attack + sound.envelope.decay;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = sound.source.type;
    osc.frequency.setValueAtTime(sound.source.frequency, t);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(sound.gain, t + sound.envelope.attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(amp).connect(ac.destination);
    osc.start(t);
    osc.stop(end + 0.02);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(SOUNDS) as (keyof typeof SOUNDS)[]).map((k) => (
          <Button
            key={k}
            size="lg"
            variant={k === name ? "default" : "outline"}
            className="capitalize"
            onClick={() => {
              setName(k);
              play({ ...SOUNDS[k], source: { ...SOUNDS[k].source, type: wave } });
            }}
          >
            {k}
          </Button>
        ))}
        <motion.span
          key={pulse}
          initial={{ opacity: pulse === 0 ? 0.4 : 1, scale: 1 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: duration.slow, ease: ease.outQuart }}
          className="text-micro text-muted-foreground rounded-md border px-2 py-1 font-mono uppercase"
        >
          {ready ? "running" : "suspended"}
        </motion.span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {WAVES.map((w) => (
          <button
            key={w}
            type="button"
            aria-pressed={wave === w}
            onClick={() => {
              setWave(w);
              play({ ...SOUNDS[name], source: { ...SOUNDS[name].source, type: w } });
            }}
            className={cn(
              "text-ui-sm duration-fast ease-out-quart h-8 rounded-lg px-3 transition-colors",
              wave === w ? "bg-feature text-feature-foreground" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {w}
          </button>
        ))}
      </div>

      <pre className="bg-secondary text-caption overflow-x-auto rounded-lg p-3 font-mono">
        {JSON.stringify(def, null, 2)}
      </pre>

      <p className="text-caption text-muted-foreground">
        The buttons above do not load an asset — they pass that object to an
        oscillator and a gain envelope. Three UI sounds cost zero network
        requests. The badge starts at{" "}
        <code className="font-mono text-[0.9em]">suspended</code>: browsers
        refuse to start an AudioContext outside a real gesture, so the first
        press is always what unlocks playback.
      </p>
    </div>
  );
}
