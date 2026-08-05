"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";
import { Area, AreaChart, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const SERIES = [
  { t: "Mon", v: 186 },
  { t: "Tue", v: 305 },
  { t: "Wed", v: 237 },
  { t: "Thu", v: 273 },
  { t: "Fri", v: 209 },
  { t: "Sat", v: 314 },
  { t: "Sun", v: 289 },
];

const config = {
  // Live data is state, so it takes the accent. DESIGN.md → Colors.
  v: { label: "Sessions", color: "var(--accent-solid)" },
} satisfies ChartConfig;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-micro text-muted-foreground uppercase">{label}</p>
      <NumberFlow
        value={value}
        // Tabular figures are already global for [data-numeric]; the
        // attribute is what opts this in.
        data-numeric
        className="text-display mt-1.5 block"
      />
    </div>
  );
}

export function LiveStats() {
  const [sessions, setSessions] = useState(1813);
  const [latency, setLatency] = useState(42);

  useEffect(() => {
    const id = setInterval(() => {
      setSessions((n) => n + Math.floor(Math.random() * 12) - 4);
      setLatency(() => 34 + Math.floor(Math.random() * 18));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="bg-card grid gap-8 rounded-xl border p-5 sm:grid-cols-[auto_1fr] sm:gap-12 sm:p-6">
      <div className="flex gap-10 sm:flex-col sm:gap-8">
        <Stat label="Sessions" value={sessions} />
        <Stat label="p50 latency" value={latency} />
      </div>

      {/* ChartContainer collapses to zero without a resolvable height. */}
      <ChartContainer config={config} className="h-40 w-full">
        {/* Recharts drops an edge tick when its label would overflow the
            plot box, and the area fill runs to the exact edge. Both need
            real horizontal margin — 0 silently clips "Mon". */}
        <AreaChart
          data={SERIES}
          margin={{ left: 16, right: 16, top: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fill-v" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-v)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-v)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="v"
            type="monotone"
            stroke="var(--color-v)"
            strokeWidth={2}
            fill="url(#fill-v)"
            // Entrances only; re-render should not replay the draw.
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </section>
  );
}
