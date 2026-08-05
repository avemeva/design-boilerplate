"use client";

import { Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * mapcn — a shadcn-style registry of React map components on MapLibre.
 *
 * The registry ships one `map` primitive documenting eight parts (Map,
 * Controls, Markers, Popups, Routes, Arcs, GeoJSON, Clusters) plus
 * eight blocks built out of them (analytics-map, choropleth,
 * analytics-card, delivery-tracker, uptime-monitor, heatmap,
 * logistics-network, store-locator).
 *
 * `maplibre-gl` is not a dependency here, so every map below is rebuilt
 * in SVG — but the projection, the arc curve, the hit-area padding, the
 * cluster steps and the control composition are the real ones, read out
 * of `mapcn.dev/r/map.json`.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };
type LngLat = [number, number];

/* ── projection ───────────────────────────────────────────────────── */

/** Web Mercator into a 1×1 world square — the projection MapLibre uses. */
function project(lng: number, lat: number) {
  const r = (Math.max(-84, Math.min(84, lat)) * Math.PI) / 180;
  return {
    x: (lng + 180) / 360,
    y: (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2,
  };
}

const ASPECT = 16 / 9;

type View = { lng: number; lat: number; zoom: number };

function frame(view: View) {
  const w = 1 / 2 ** view.zoom;
  const h = w / ASPECT;
  const c = project(view.lng, view.lat);
  return { x0: c.x - w / 2, y0: c.y - h / 2, w, h };
}

/**
 * `k` scales the drawing units. A world map is happy in the 0–1 square,
 * but a city at zoom 11 makes a viewBox 0.0005 units wide, and Chrome
 * quietly drops hairline `non-scaling-stroke`s at that ratio — so the
 * city maps draw in tile-sized units instead.
 */
function box(view: View, k = 1) {
  const f = frame(view);
  return {
    ...f,
    viewBox: `${f.x0 * k} ${f.y0 * k} ${f.w * k} ${f.h * k}`,
    at(lng: number, lat: number) {
      const p = project(lng, lat);
      return {
        left: `${((p.x - f.x0) / f.w) * 100}%`,
        top: `${((p.y - f.y0) / f.h) * 100}%`,
      };
    },
    /** Fractional position inside the frame, 0–1 on each axis. */
    frac(lng: number, lat: number) {
      const p = project(lng, lat);
      return { fx: (p.x - f.x0) / f.w, fy: (p.y - f.y0) / f.h };
    },
  };
}

function d(pts: { x: number; y: number }[], close = false) {
  return (
    pts
      .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(7)} ${p.y.toFixed(7)}`)
      .join("") + (close ? "Z" : "")
  );
}

/** Tile-sized drawing units for the city maps. */
const K = 4096;

function cityPath(pts: LngLat[], close = false) {
  return d(
    pts.map(([lng, lat]) => {
      const p = project(lng, lat);
      return { x: p.x * K, y: p.y * K };
    }),
    close,
  );
}

function ringPath(r: LngLat[]) {
  return d(
    r.map(([lng, lat]) => project(lng, lat)),
    true,
  );
}

/**
 * The quadratic Bézier `MapArc` draws, including the antimeridian
 * unwrap that makes Tokyo → San Francisco bow across the Pacific
 * rather than the long way round.
 */
function arcPath(from: LngLat, to: LngLat, curvature = 0.24, samples = 48) {
  const [x0, y0] = from;
  const [xTo, y2] = to;
  const raw = xTo - x0;
  const x2 = raw > 180 ? xTo - 360 : raw < -180 ? xTo + 360 : xTo;
  const dx = x2 - x0;
  const dy = y2 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return "";
  const cx = (x0 + x2) / 2 + (-dy / dist) * dist * curvature;
  const cy = (y0 + y2) / 2 + (dx / dist) * dist * curvature;
  const pts = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const u = 1 - t;
    pts.push(
      project(
        u * u * x0 + 2 * u * t * cx + t * t * x2,
        u * u * y0 + 2 * u * t * cy + t * t * y2,
      ),
    );
  }
  return d(pts);
}

function seeded(n: number) {
  let s = n;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/* ── the world, coarsely ──────────────────────────────────────────── */

const REGIONS: { name: string; visits: number; ring: LngLat[] }[] = [
  {
    name: "North America",
    visits: 41200,
    ring: [
      [-168, 65], [-150, 70], [-130, 70], [-110, 72], [-95, 73], [-80, 73],
      [-62, 60], [-52, 47], [-66, 44], [-75, 35], [-81, 25], [-97, 26],
      [-107, 23], [-117, 32], [-125, 48], [-135, 58],
    ],
  },
  {
    name: "South America",
    visits: 9800,
    ring: [
      [-81, 7], [-70, 11], [-60, 10], [-50, 0], [-35, -5], [-38, -14],
      [-48, -25], [-58, -35], [-65, -42], [-70, -52], [-75, -45], [-72, -30],
      [-70, -18], [-81, -5],
    ],
  },
  {
    name: "Africa",
    visits: 6400,
    ring: [
      [-17, 15], [-10, 5], [9, 4], [9, -1], [13, -6], [12, -18], [18, -29],
      [20, -35], [32, -27], [40, -15], [40, -3], [51, 12], [43, 12], [35, 23],
      [32, 31], [10, 37], [-6, 36],
    ],
  },
  {
    name: "Eurasia",
    visits: 58600,
    ring: [
      [-9, 44], [-2, 49], [4, 52], [8, 57], [12, 58], [20, 56], [24, 60],
      [30, 60], [28, 70], [45, 68], [70, 72], [100, 77], [130, 73], [160, 70],
      [170, 66], [160, 60], [143, 53], [135, 45], [122, 40], [121, 30],
      [110, 21], [105, 10], [100, 6], [95, 16], [90, 22], [80, 15], [72, 20],
      [68, 24], [60, 25], [52, 26], [44, 13], [35, 32], [28, 36], [14, 38],
      [8, 44],
    ],
  },
  {
    name: "Oceania",
    visits: 5100,
    ring: [
      [113, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19],
      [153, -25], [150, -37], [141, -38], [131, -32], [115, -34],
    ],
  },
  {
    name: "Greenland",
    visits: 300,
    ring: [
      [-45, 60], [-25, 70], [-20, 76], [-32, 83], [-56, 82], [-60, 75],
      [-52, 66],
    ],
  },
];

const LAND = REGIONS.map((r) => ringPath(r.ring));

const CITIES = [
  { name: "San Francisco", lng: -122.42, lat: 37.77, flights: 1840 },
  { name: "New York", lng: -74.01, lat: 40.71, flights: 3210 },
  { name: "São Paulo", lng: -46.63, lat: -23.55, flights: 940 },
  { name: "London", lng: -0.13, lat: 51.51, flights: 4120 },
  { name: "Lagos", lng: 3.38, lat: 6.52, flights: 610 },
  { name: "Dubai", lng: 55.27, lat: 25.2, flights: 2380 },
  { name: "Singapore", lng: 103.82, lat: 1.35, flights: 1560 },
  { name: "Tokyo", lng: 139.69, lat: 35.69, flights: 2740 },
  { name: "Sydney", lng: 151.21, lat: -33.87, flights: 880 },
];

const HUB = CITIES[3]; // London
const ARCS = CITIES.filter((c) => c !== HUB).map((c) => ({
  id: c.name,
  to: c,
  path: arcPath([HUB.lng, HUB.lat], [c.lng, c.lat]),
}));

const WORLD: View = { lng: 10, lat: 24, zoom: 0 };

/* ── shared chrome ────────────────────────────────────────────────── */

function MapFrame({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-secondary relative aspect-video w-full touch-none overflow-hidden rounded-xl border select-none",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function Land({ blank }: { blank: boolean }) {
  return (
    <g
      className={blank ? "fill-none stroke-border" : "fill-border stroke-border-strong"}
      strokeWidth={blank ? 1 : 0.75}
      vectorEffect="non-scaling-stroke"
    >
      {LAND.map((path) => (
        <path key={path.slice(0, 24)} d={path} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

function ControlGroup({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card divide-border shadow-floating flex flex-col divide-y overflow-hidden rounded-lg border">
      {children}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="hover:bg-secondary duration-fast text-foreground grid size-9 place-items-center transition-colors"
    >
      {children}
    </button>
  );
}

/** Eased viewport moves — the `flyTo` / `zoomTo` the controls call. */
function useFlight(initial: View) {
  const [view, setView] = useState(initial);
  const ref = useRef(initial);
  const raf = useRef<number | null>(null);

  const apply = useCallback((v: View) => {
    ref.current = v;
    setView(v);
  }, []);

  const stop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  const flyTo = useCallback(
    (target: View, ms: number, arc = 0) => {
      stop();
      if (ms <= 0) {
        apply(target);
        return;
      }
      const from = ref.current;
      const t0 = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / ms);
        const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        // The parabolic dip a real flyTo makes: pull back, then settle.
        const dip = Math.sin(Math.PI * t) * arc;
        apply({
          lng: from.lng + (target.lng - from.lng) * e,
          lat: from.lat + (target.lat - from.lat) * e,
          zoom: from.zoom + (target.zoom - from.zoom) * e - dip,
        });
        if (t < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply, stop],
  );

  useEffect(() => stop, [stop]);

  return { view, flyTo, jumpTo: apply, current: ref };
}

/* ── 1 · a blank canvas instead of a street basemap ───────────────── */

const BUSY_LABELS = [
  { t: "Vancouver", lng: -123, lat: 49.3 }, { t: "Chicago", lng: -87.6, lat: 41.9 },
  { t: "Mexico City", lng: -99.1, lat: 19.4 }, { t: "Bogotá", lng: -74.1, lat: 4.7 },
  { t: "Lima", lng: -77, lat: -12 }, { t: "Buenos Aires", lng: -58.4, lat: -34.6 },
  { t: "Dakar", lng: -17.4, lat: 14.7 }, { t: "Madrid", lng: -3.7, lat: 40.4 },
  { t: "Oslo", lng: 10.7, lat: 59.9 }, { t: "Warsaw", lng: 21, lat: 52.2 },
  { t: "Cairo", lng: 31.2, lat: 30 }, { t: "Nairobi", lng: 36.8, lat: -1.3 },
  { t: "Moscow", lng: 37.6, lat: 55.8 }, { t: "Karachi", lng: 67, lat: 24.9 },
  { t: "Delhi", lng: 77.2, lat: 28.6 }, { t: "Jakarta", lng: 106.8, lat: -6.2 },
  { t: "Seoul", lng: 127, lat: 37.6 }, { t: "Perth", lng: 115.9, lat: -32 },
];

const GRATICULE = [
  ...Array.from({ length: 23 }, (_, i) => {
    const x = project(-180 + (i + 1) * 15, 0).x;
    return `M${x.toFixed(5)} 0L${x.toFixed(5)} 1`;
  }),
  ...Array.from({ length: 15 }, (_, i) => {
    const y = project(0, -70 + i * 10).y;
    return `M0 ${y.toFixed(5)}L1 ${y.toFixed(5)}`;
  }),
];

const ROADS = (() => {
  const r = seeded(19);
  const out: string[] = [];
  for (const c of [...CITIES, ...BUSY_LABELS.map((b) => ({ lng: b.lng, lat: b.lat }))]) {
    for (let i = 0; i < 5; i += 1) {
      const a = project(c.lng + (r() - 0.5) * 24, c.lat + (r() - 0.5) * 16);
      const b = project(c.lng + (r() - 0.5) * 24, c.lat + (r() - 0.5) * 16);
      out.push(`M${a.x.toFixed(4)} ${a.y.toFixed(4)}L${b.x.toFixed(4)} ${b.y.toFixed(4)}`);
    }
  }
  return out;
})();

function CanvasPair({ after }: Side) {
  const b = box(WORLD);

  return (
    <MapFrame className={after ? "bg-card" : undefined}>
      <svg viewBox={b.viewBox} className="absolute inset-0 size-full" aria-hidden="true">
        {!after && (
          <g
            className="stroke-border-strong"
            strokeWidth={0.5}
            opacity={0.7}
            vectorEffect="non-scaling-stroke"
          >
            {GRATICULE.map((g) => (
              <path key={g} d={g} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        )}
        <Land blank={after} />
        {!after && (
          <g
            className="stroke-muted-foreground"
            strokeWidth={0.75}
            opacity={0.45}
            vectorEffect="non-scaling-stroke"
          >
            {ROADS.map((r) => (
              <path key={r} d={r} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        )}
        <g
          className="stroke-foreground"
          fill="none"
          strokeWidth={1.75}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        >
          {ARCS.map((a) => (
            <path key={a.id} d={a.path} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>

      {!after &&
        BUSY_LABELS.map((l) => (
          <span
            key={l.t}
            className="text-micro text-muted-foreground absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
            style={b.at(l.lng, l.lat)}
          >
            {l.t}
          </span>
        ))}

      {CITIES.map((c) => (
        <span
          key={c.name}
          className="bg-foreground border-card absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={b.at(c.lng, c.lat)}
          aria-hidden="true"
        />
      ))}

      {after &&
        [HUB, CITIES[7], CITIES[1]].map((c) => (
          <span
            key={c.name}
            className="text-micro text-muted-foreground absolute -translate-x-1/2 whitespace-nowrap"
            style={{ ...b.at(c.lng, c.lat), marginTop: "0.5rem" }}
          >
            {c.name}
          </span>
        ))}

      <p className="text-micro text-muted-foreground bg-card/80 absolute bottom-2 left-2 rounded px-1.5 py-0.5 uppercase">
        {after ? "Outbound routes · London" : "Streets · labels · borders"}
      </p>
    </MapFrame>
  );
}

/* ── 2 · lines you can actually point at ──────────────────────────── */

function ArcHitPair({ after }: Side) {
  const [hover, setHover] = useState<string | null>(null);
  const b = box(WORLD);
  const active = ARCS.find((a) => a.id === hover);

  return (
    <MapFrame className="bg-card">
      <svg viewBox={b.viewBox} className="absolute inset-0 size-full">
        <g aria-hidden="true">
          <Land blank />
        </g>
        <g fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke">
          {ARCS.map((a) => (
            <path
              key={a.id}
              d={a.path}
              className={cn(
                "duration-fast ease-out-quart transition-[stroke,stroke-width]",
                hover === a.id ? "stroke-foreground" : "stroke-border-strong",
              )}
              strokeWidth={hover === a.id ? 3 : 1.75}
              vectorEffect="non-scaling-stroke"
              aria-hidden="true"
            />
          ))}
          {/*
            MapArc adds a second, invisible line whose width is
            max(line-width + 6, 12) purely so the cursor has something
            to find. Before, the only target is the 2px line itself.
          */}
          {ARCS.map((a) => (
            <path
              key={`hit-${a.id}`}
              d={a.path}
              stroke="transparent"
              strokeWidth={after ? 18 : 2}
              pointerEvents="stroke"
              vectorEffect="non-scaling-stroke"
              style={{ cursor: "pointer" }}
              onPointerEnter={() => setHover(a.id)}
              onPointerLeave={() => setHover((h) => (h === a.id ? null : h))}
            >
              <title>{`${HUB.name} to ${a.to.name}`}</title>
            </path>
          ))}
        </g>
      </svg>

      {CITIES.map((c) => (
        <span
          key={c.name}
          className={cn(
            "border-card absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border",
            c === HUB ? "bg-foreground size-3" : "bg-muted-foreground",
          )}
          style={b.at(c.lng, c.lat)}
          aria-hidden="true"
        />
      ))}

      <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center">
        <p
          className={cn(
            "text-caption bg-popover shadow-floating duration-fast ease-out-quart rounded-md border px-2.5 py-1.5 transition-opacity",
            active ? "opacity-100" : "opacity-0",
          )}
          aria-live="polite"
        >
          {active ? (
            <>
              {HUB.name} → {active.to.name}
              <span className="text-muted-foreground ml-2 tabular-nums">
                {active.to.flights.toLocaleString("en-US")} flights
              </span>
            </>
          ) : (
            "—"
          )}
        </p>
      </div>
    </MapFrame>
  );
}

/* ── 3 · clusters instead of a pile of dots ───────────────────────── */

const HUBS = [
  { lng: -74, lat: 40.7, n: 78, s: 9 },
  { lng: -87.6, lat: 41.9, n: 34, s: 7 },
  { lng: -122.4, lat: 37.8, n: 46, s: 8 },
  { lng: -0.13, lat: 51.5, n: 92, s: 6 },
  { lng: 13.4, lat: 52.5, n: 41, s: 6 },
  { lng: 2.35, lat: 48.86, n: 55, s: 5 },
  { lng: 55.3, lat: 25.2, n: 29, s: 8 },
  { lng: 139.7, lat: 35.7, n: 63, s: 7 },
  { lng: 103.8, lat: 1.35, n: 24, s: 6 },
  { lng: 151.2, lat: -33.9, n: 21, s: 7 },
];

const DOTS = (() => {
  const r = seeded(1337);
  const out: { lng: number; lat: number }[] = [];
  for (const h of HUBS) {
    for (let i = 0; i < h.n; i += 1) {
      const a = (r() + r() + r()) / 3 - 0.5;
      const c = (r() + r() + r()) / 3 - 0.5;
      out.push({ lng: h.lng + a * h.s * 2.2, lat: h.lat + c * h.s * 1.4 });
    }
  }
  return out;
})();

const CLUSTER_VIEW: View = { lng: 5, lat: 34, zoom: 0 };

function ClusterPair({ after }: Side) {
  const { view, flyTo, current } = useFlight(CLUSTER_VIEW);
  const b = box(view);

  const visible = useMemo(
    () =>
      DOTS.map((p) => ({ p, ...b.frac(p.lng, p.lat) })).filter(
        (p) => p.fx > -0.05 && p.fx < 1.05 && p.fy > -0.05 && p.fy < 1.05,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view.lng, view.lat, view.zoom],
  );

  // Screen-space clustering, the way MapLibre's `clusterRadius` works:
  // everything within one radius of a seed point collapses into one bubble.
  const clusters = useMemo(() => {
    const R = 0.075; // fraction of the frame's width
    const taken = new Array(visible.length).fill(false);
    const out: { fx: number; fy: number; lng: number; lat: number; n: number }[] = [];
    for (let i = 0; i < visible.length; i += 1) {
      if (taken[i]) continue;
      let fx = 0;
      let fy = 0;
      let lng = 0;
      let lat = 0;
      let n = 0;
      for (let j = i; j < visible.length; j += 1) {
        if (taken[j]) continue;
        const dx = visible[j].fx - visible[i].fx;
        const dy = (visible[j].fy - visible[i].fy) / ASPECT;
        if (dx * dx + dy * dy > R * R) continue;
        taken[j] = true;
        n += 1;
        fx += visible[j].fx;
        fy += visible[j].fy;
        lng += visible[j].p.lng;
        lat += visible[j].p.lat;
      }
      out.push({ fx: fx / n, fy: fy / n, lng: lng / n, lat: lat / n, n });
    }
    return out;
  }, [visible]);

  const zoom = (by: number) =>
    flyTo(
      { ...current.current, zoom: Math.min(4, Math.max(0, Math.round(current.current.zoom) + by)) },
      300,
    );

  return (
    <div className="space-y-2">
      <MapFrame className="bg-card">
        <svg viewBox={b.viewBox} className="absolute inset-0 size-full" aria-hidden="true">
          <Land blank />
        </svg>

        {after
          ? clusters.map((c) =>
              c.n === 1 ? (
                <span
                  key={`${c.fx}-${c.fy}`}
                  className="bg-foreground absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ left: `${c.fx * 100}%`, top: `${c.fy * 100}%` }}
                  aria-hidden="true"
                />
              ) : (
                <button
                  key={`${c.fx}-${c.fy}`}
                  type="button"
                  onClick={() =>
                    flyTo(
                      { lng: c.lng, lat: c.lat, zoom: Math.min(4, current.current.zoom + 1.6) },
                      700,
                      0.4,
                    )
                  }
                  aria-label={`Zoom into ${c.n} stores`}
                  className={cn(
                    "bg-foreground text-background border-card duration-fast ease-out-quart absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border tabular-nums transition-transform hover:scale-110",
                    c.n < 10 ? "size-8" : c.n < 40 ? "size-10" : "size-13",
                  )}
                  style={{ left: `${c.fx * 100}%`, top: `${c.fy * 100}%` }}
                >
                  <span className={c.n < 10 ? "text-micro" : "text-caption"}>{c.n}</span>
                </button>
              ),
            )
          : visible.map(({ p, fx, fy }) => (
              <span
                key={`${p.lng}-${p.lat}`}
                className="bg-foreground/60 absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${fx * 100}%`, top: `${fy * 100}%` }}
                aria-hidden="true"
              />
            ))}

        <div className="absolute top-2 right-2">
          <ControlGroup>
            <ControlButton label="Zoom in" onClick={() => zoom(1)}>
              <Plus className="size-4" aria-hidden="true" />
            </ControlButton>
            <ControlButton label="Zoom out" onClick={() => zoom(-1)}>
              <Minus className="size-4" aria-hidden="true" />
            </ControlButton>
          </ControlGroup>
        </div>
      </MapFrame>
      <p className="text-caption text-muted-foreground tabular-nums">
        {DOTS.length.toLocaleString("en-US")} stores
      </p>
    </div>
  );
}

/* ── 4 · point at a pin, don't hunt through them ──────────────────── */

function PinPair({ after }: Side) {
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const b = box(WORLD);
  const picked = open === null ? null : CITIES[open];

  return (
    <div className="space-y-2">
      <MapFrame className="bg-card">
        <svg viewBox={b.viewBox} className="absolute inset-0 size-full" aria-hidden="true">
          <Land blank />
        </svg>

        {CITIES.map((c, i) => {
          // Popups near an edge anchor to it rather than hanging off the map.
          const { fx } = b.frac(c.lng, c.lat);
          const side =
            fx > 0.74
              ? "right-0 left-auto translate-x-0"
              : fx < 0.26
                ? "left-0 right-auto translate-x-0"
                : "left-1/2 -translate-x-1/2";
          return (
          <div
            key={c.name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={b.at(c.lng, c.lat)}
          >
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover((h) => (h === i ? null : h))}
              aria-label={c.name}
              aria-pressed={open === i}
              className="grid size-9 place-items-center"
            >
              <span
                className={cn(
                  "border-card duration-fast ease-out-quart block rounded-full border transition-transform",
                  open === i ? "bg-foreground size-4" : "bg-foreground/70 size-3",
                  after && hover === i && "scale-125",
                )}
              />
            </button>

            {after && hover === i && open !== i && (
              <span
                className={cn(
                  "bg-foreground text-background pointer-events-none absolute bottom-full mb-1 rounded-md px-2 py-1 whitespace-nowrap shadow-md",
                  side,
                )}
              >
                <span className="text-micro">{c.name}</span>
              </span>
            )}

            {after && open === i && (
              <div
                className={cn(
                  "bg-popover shadow-floating absolute bottom-full z-10 mb-2 w-max rounded-lg border p-3 text-left",
                  side,
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  aria-label={`Close ${c.name}`}
                  className="hover:bg-secondary text-muted-foreground absolute top-1 right-1 grid size-5 place-items-center rounded"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
                <p className="text-ui-sm pr-5">{c.name}</p>
                <p className="text-caption text-muted-foreground tabular-nums">
                  {c.flights.toLocaleString("en-US")} flights a week
                </p>
                <p className="text-micro text-muted-foreground tabular-nums">
                  {c.lat.toFixed(2)}, {c.lng.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          );
        })}
      </MapFrame>

      {!after && (
        <div className="bg-secondary flex min-h-16 items-center rounded-lg border px-3 py-2">
          {picked ? (
            <div>
              <p className="text-ui-sm">{picked.name}</p>
              <p className="text-caption text-muted-foreground tabular-nums">
                {picked.flights.toLocaleString("en-US")} flights a week ·{" "}
                {picked.lat.toFixed(2)}, {picked.lng.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-caption text-muted-foreground">
              Select a marker to see its details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 5 · a way back to north ──────────────────────────────────────── */

const AVENUES = Array.from({ length: 11 }, (_, i) => (i + 1) / 12);
const BLOCKS = Array.from({ length: 9 }, (_, i) => (i + 1) / 10);
const RIVER = "M-0.2 0.66C0.1 0.6 0.3 0.78 0.52 0.74C0.74 0.7 0.86 0.54 1.2 0.6";
const PLACES = [
  { t: "Market St", x: 0.24, y: 0.3 },
  { t: "Harbour Park", x: 0.66, y: 0.26 },
  { t: "Old Town", x: 0.42, y: 0.82 },
];

function CityStreets() {
  return (
    <svg viewBox="0 0 1 1" className="absolute inset-0 size-full" aria-hidden="true">
      <rect x={0} y={0} width={1} height={1} className="fill-secondary" />
      <rect x={0.58} y={0.16} width={0.2} height={0.16} className="fill-border" rx={0.01} />
      <g className="stroke-border-strong" strokeWidth={1} vectorEffect="non-scaling-stroke">
        {AVENUES.map((x) => (
          <path key={`a${x}`} d={`M${x} 0L${x} 1`} vectorEffect="non-scaling-stroke" />
        ))}
        {BLOCKS.map((y) => (
          <path key={`b${y}`} d={`M0 ${y}L1 ${y}`} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <path
        d="M0.02 0.98L0.98 0.12"
        className="stroke-muted-foreground"
        strokeWidth={2.5}
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={RIVER}
        className="stroke-border"
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function CompassPair({ after }: Side) {
  const [bearing, setBearing] = useState(-38);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const last = useRef(0);

  const transform = `rotate(${bearing}deg) scale(${1.55 * scale})`;
  const motion = dragging
    ? undefined
    : "transform 450ms cubic-bezier(0.165, 0.84, 0.44, 1)";

  return (
    <MapFrame
      className="cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        last.current = e.clientX;
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        const dx = e.clientX - last.current;
        last.current = e.clientX;
        setBearing((v) => v + dx * 0.4);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      <div
        className="absolute inset-0 origin-center"
        style={{ transform, transition: motion }}
      >
        <CityStreets />
        {PLACES.map((p) => (
          <span
            key={p.t}
            className="text-micro text-muted-foreground absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          >
            {p.t}
          </span>
        ))}
        <span
          className="bg-foreground border-card absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ left: "44%", top: "48%" }}
          aria-hidden="true"
        />
      </div>

      {after && (
        <div
          className="absolute top-2 right-2 flex flex-col gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ControlGroup>
            <ControlButton label="Zoom in" onClick={() => setScale((s) => Math.min(2.2, s * 1.35))}>
              <Plus className="size-4" aria-hidden="true" />
            </ControlButton>
            <ControlButton label="Zoom out" onClick={() => setScale((s) => Math.max(1, s / 1.35))}>
              <Minus className="size-4" aria-hidden="true" />
            </ControlButton>
          </ControlGroup>
          <ControlGroup>
            <ControlButton label="Reset bearing to north" onClick={() => setBearing(0)}>
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                style={{ transform: `rotate(${bearing}deg)`, transition: motion }}
                aria-hidden="true"
              >
                <path d="M12 3L16.5 13H12Z" className="fill-foreground" />
                <path d="M12 3L7.5 13H12Z" className="fill-muted-foreground" />
                <path d="M12 21L16.5 13H12Z" className="fill-border-strong" />
                <path d="M12 21L7.5 13H12Z" className="fill-border" />
              </svg>
            </ControlButton>
          </ControlGroup>
        </div>
      )}

      <p className="text-micro text-muted-foreground bg-card/80 absolute bottom-2 left-2 rounded px-1.5 py-0.5 tabular-nums uppercase">
        Drag to turn · {Math.round(((bearing % 360) + 360) % 360)}°
      </p>
    </MapFrame>
  );
}

/* ── 6 · a map that answers the cursor ────────────────────────────── */

const MAX_VISITS = Math.max(...REGIONS.map((r) => r.visits));

function RegionPair({ after }: Side) {
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const b = box({ lng: 10, lat: 20, zoom: 0 });
  const shown = hover ?? pinned;

  return (
    <div className="space-y-2">
      <MapFrame className="bg-card">
        <svg viewBox={b.viewBox} className="absolute inset-0 size-full">
          {REGIONS.map((r, i) => {
            const lit = after && (hover === i || pinned === i);
            return (
              <path
                key={r.name}
                d={LAND[i]}
                className={cn(
                  "fill-foreground stroke-card duration-fast ease-out-quart transition-[fill-opacity]",
                  after && "cursor-pointer",
                )}
                fillOpacity={(lit ? 0.55 : 0.14) + (r.visits / MAX_VISITS) * 0.3}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                pointerEvents={after ? "fill" : "none"}
                onPointerEnter={after ? () => setHover(i) : undefined}
                onPointerLeave={
                  after ? () => setHover((h) => (h === i ? null : h)) : undefined
                }
                onClick={after ? () => setPinned(pinned === i ? null : i) : undefined}
              >
                <title>{r.name}</title>
              </path>
            );
          })}
        </svg>

        {after && (
          <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center">
            <p
              className={cn(
                "text-caption bg-popover shadow-floating duration-fast ease-out-quart rounded-md border px-2.5 py-1.5 transition-opacity",
                shown === null ? "opacity-0" : "opacity-100",
              )}
              aria-live="polite"
            >
              {shown === null ? (
                "—"
              ) : (
                <>
                  {REGIONS[shown].name}
                  <span className="text-muted-foreground ml-2 tabular-nums">
                    {REGIONS[shown].visits.toLocaleString("en-US")} visits
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </MapFrame>

      {!after && (
        <ul className="text-caption text-muted-foreground grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {REGIONS.map((r) => (
            <li key={r.name} className="flex justify-between border-b py-1">
              <span>{r.name}</span>
              <span className="tabular-nums">{r.visits.toLocaleString("en-US")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── 7 · a move you can follow ────────────────────────────────────── */

const STOPS = [
  { name: "Depot", lng: -0.02, lat: 51.52, eta: "07:40" },
  { name: "Camden", lng: -0.14, lat: 51.54, eta: "08:15" },
  { name: "Soho", lng: -0.13, lat: 51.513, eta: "09:05" },
  { name: "Southbank", lng: -0.11, lat: 51.505, eta: "10:20" },
  { name: "Canary Wharf", lng: -0.02, lat: 51.505, eta: "11:35" },
  { name: "Greenwich", lng: 0.0, lat: 51.483, eta: "12:10" },
];

const ROUTE = cityPath(STOPS.map((s) => [s.lng, s.lat]));
const START: View = { lng: -0.07, lat: 51.512, zoom: 10.8 };

const CENTRE: LngLat = [-0.07, 51.512];
/** A street grid + the river, so a move across town is something you can watch. */
const CITY_GRID = [
  ...Array.from({ length: 27 }, (_, i) => {
    const lng = CENTRE[0] + (i - 13) * 0.0125;
    return cityPath([
      [lng, CENTRE[1] - 0.11],
      [lng, CENTRE[1] + 0.11],
    ]);
  }),
  ...Array.from({ length: 25 }, (_, i) => {
    const lat = CENTRE[1] + (i - 12) * 0.0078;
    return cityPath([
      [CENTRE[0] - 0.25, lat],
      [CENTRE[0] + 0.25, lat],
    ]);
  }),
];
const CITY_RIVER = cityPath([
  [-0.2, 51.484], [-0.16, 51.487], [-0.13, 51.505], [-0.1, 51.507],
  [-0.075, 51.499], [-0.05, 51.508], [-0.03, 51.502], [-0.005, 51.487],
  [0.02, 51.491], [0.06, 51.5],
]);
const CITY_PARK = cityPath(
  [
    [-0.175, 51.5], [-0.152, 51.5], [-0.152, 51.515], [-0.175, 51.515],
  ],
  true,
);

function FlightPair({ after }: Side) {
  const { view, flyTo } = useFlight(START);
  const [active, setActive] = useState(0);
  const b = box(view, K);

  const go = (i: number) => {
    setActive(i);
    flyTo({ lng: STOPS[i].lng, lat: STOPS[i].lat, zoom: 12.6 }, after ? 900 : 0, after ? 0.5 : 0);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
      <MapFrame className="bg-card">
        <svg viewBox={b.viewBox} className="absolute inset-0 size-full" aria-hidden="true">
          <path d={CITY_PARK} className="fill-border stroke-none" />
          <g className="stroke-border-strong" strokeWidth={1} vectorEffect="non-scaling-stroke">
            {CITY_GRID.map((g) => (
              <path key={g} d={g} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          <path
            d={CITY_RIVER}
            className="stroke-border"
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={ROUTE}
            className="stroke-muted-foreground"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {STOPS.map((s, i) => (
          <span
            key={s.name}
            className={cn(
              "border-card absolute -translate-x-1/2 -translate-y-1/2 rounded-full border",
              i === active ? "bg-foreground size-4" : "bg-muted-foreground size-2.5",
            )}
            style={b.at(s.lng, s.lat)}
            aria-hidden="true"
          />
        ))}
        <p className="text-micro text-muted-foreground bg-card/80 absolute bottom-2 left-2 rounded px-1.5 py-0.5 tabular-nums uppercase">
          {STOPS[active].name} · {STOPS[active].eta}
        </p>
      </MapFrame>

      <ul className="space-y-1">
        {STOPS.map((s, i) => (
          <li key={s.name}>
            <button
              type="button"
              onClick={() => go(i)}
              aria-pressed={i === active}
              className={cn(
                "duration-fast ease-out-quart flex h-9 w-full items-center justify-between rounded-lg px-3 transition-colors",
                i === active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="text-ui-sm">{s.name}</span>
              <span className="text-caption tabular-nums">{s.eta}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export function MapcnBeautifulMapsMadeSimpleDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The routes you came to look at are the loudest thing on the map."
        before={<CanvasPair after={false} />}
        after={<CanvasPair after />}
      />
      <BeforeAfter
        principle="You can point near a line instead of exactly at it."
        before={<ArcHitPair after={false} />}
        after={<ArcHitPair after />}
      />
      <BeforeAfter
        principle="You can tell how many are hiding under each other."
        before={<ClusterPair after={false} />}
        after={<ClusterPair after />}
      />
      <BeforeAfter
        principle="Point at a pin and it says what it is, right there."
        before={<PinPair after={false} />}
        after={<PinPair after />}
      />
      <BeforeAfter
        principle="One press and the map is the right way up again."
        before={<CompassPair after={false} />}
        after={<CompassPair after />}
      />
      <BeforeAfter
        principle="The map tells you what you are pointing at."
        before={<RegionPair after={false} />}
        after={<RegionPair after />}
      />
      <BeforeAfter
        principle="You can see where you went instead of just landing somewhere else."
        before={<FlightPair after={false} />}
        after={<FlightPair after />}
      />
    </div>
  );
}
