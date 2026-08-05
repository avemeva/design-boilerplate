"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * OKLCH.fyi — build a ramp and see the contrast, live.
 *
 * The point of the resource is that perceptual lightness is the first
 * channel, so stepping L evenly produces evenly-spaced swatches at any
 * hue. Drag the hue and watch that hold.
 * ------------------------------------------------------------------ */

function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const enc = (x: number) => {
    const c = Math.max(0, Math.min(1, x));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  };
  return [
    enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: [number, number, number], b: [number, number, number]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const hex = (c: [number, number, number]) =>
  "#" + c.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");

const STEPS = [0.32, 0.4, 0.48, 0.55, 0.62];

export function OklchDemo() {
  const [hue, setHue] = useState(279);
  const [chroma, setChroma] = useState(0.1);

  const ramp = useMemo(
    () =>
      STEPS.map((L) => {
        const rgb = oklchToRgb(L, chroma, hue);
        return {
          L,
          rgb,
          hex: hex(rgb),
          onWhite: contrast(rgb, [1, 1, 1]),
        };
      }),
    [hue, chroma],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-caption text-muted-foreground flex justify-between">
            <span>Hue</span>
            <span className="tabular-nums">{hue}°</span>
          </span>
          <input
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="accent-accent-solid w-full"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-caption text-muted-foreground flex justify-between">
            <span>Chroma</span>
            <span className="tabular-nums">{chroma.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={0.25}
            step={0.01}
            value={chroma}
            onChange={(e) => setChroma(Number(e.target.value))}
            className="accent-accent-solid w-full"
          />
        </label>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {ramp.map((s) => (
          <div key={s.L} className="space-y-1.5">
            <div
              className="h-16 rounded-lg border"
              style={{ background: s.hex }}
            />
            <code className="text-muted-foreground block font-mono text-meta">
              L {s.L}
            </code>
            <code
              className={cn(
                "block font-mono text-meta tabular-nums",
                s.onWhite >= 3 ? "text-positive" : "text-destructive",
              )}
            >
              {s.onWhite.toFixed(1)}:1
            </code>
          </div>
        ))}
      </div>

      <p className="text-caption text-muted-foreground">
        Sweep the hue. The swatches keep their apparent brightness because
        lightness is a separate channel — do the same thing in HSL and yellow
        blows out while blue goes black. The contrast figures are computed
        against white; this is exactly the check that caught{" "}
        <code className="font-mono text-[0.9em]">--chart-1</code> at 1.48:1 in
        this repo. The ramp shown is the one now shipping in{" "}
        <code className="font-mono text-[0.9em]">globals.css</code>.
      </p>
    </div>
  );
}
