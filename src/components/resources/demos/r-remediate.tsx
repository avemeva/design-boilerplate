"use client";

import NumberFlow from "@number-flow/react";
import {
  Check,
  Crosshair,
  Mail,
  MessageSquare,
  Mic,
  Play,
  Plus,
  Send,
  SquareDashed,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { PointerEvent as RPointerEvent, ReactNode } from "react";
import { useRef, useState, useSyncExternalStore } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Remediate — in-app feedback, before and after.
 *
 * The package is not installed here, so both sides are rebuilt inline.
 * Everything that can be measured is measured live: the pinned
 * element's rect, the dragged crop region, the browser and window
 * chips. The two modes that need a permission prompt — real screen
 * recording, real microphone — are staged, because a demo page should
 * not ask for your screen.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };
type Box = { x: number; y: number; width: number; height: number };

function boxIn(el: HTMLElement, root: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  const rr = root.getBoundingClientRect();
  return { x: r.x - rr.x, y: r.y - rr.y, width: r.width, height: r.height };
}

function Label({ children }: { children: string }) {
  return (
    <p className="text-micro text-muted-foreground mb-2 uppercase">{children}</p>
  );
}

function Chip({
  children,
  onRemove,
}: {
  children: ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span className="text-caption text-muted-foreground bg-secondary inline-flex h-9 items-center gap-1.5 rounded-full pr-1.5 pl-3">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove what you pointed at"
          className="text-muted-foreground hover:text-foreground flex size-6 items-center justify-center rounded-full"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

/** The product being complained about. Pins and crops land on this. */
function AppPanel() {
  return (
    <div className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-ui" data-el="the plan name">
          Team plan
        </span>
        <span
          data-el="the trial badge"
          className="text-micro text-muted-foreground bg-secondary rounded-full px-2.5 py-1 uppercase"
        >
          Trial
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span data-el="the price" className="text-ui tabular-nums">
          $96.00
        </span>
        <span className="text-caption text-muted-foreground">
          a month, 12 seats
        </span>
      </div>
      <div className="flex gap-2">
        <Button className="h-9" data-el="the Upgrade button">
          Upgrade
        </Button>
        <Button
          variant="secondary"
          className="h-9"
          data-el="the Invoices button"
        >
          Invoices
        </Button>
      </div>
    </div>
  );
}

/* ── 1 · point at it ──────────────────────────────────────────────── */

function PointPair({ after }: Side) {
  const root = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [hover, setHover] = useState<Box | null>(null);
  const [pin, setPin] = useState<{ label: string; box: Box } | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4">
      <div className="bg-background rounded-xl p-3">
        <div
          ref={root}
          className={cn("relative", armed && "cursor-crosshair")}
          onPointerMove={(e) => {
            if (!armed || !root.current) return;
            const el = (e.target as HTMLElement).closest<HTMLElement>(
              "[data-el]",
            );
            setHover(el ? boxIn(el, root.current) : null);
          }}
          onPointerLeave={() => setHover(null)}
          onClickCapture={(e) => {
            if (!armed || !root.current) return;
            const el = (e.target as HTMLElement).closest<HTMLElement>(
              "[data-el]",
            );
            if (!el) return;
            e.preventDefault();
            e.stopPropagation();
            setPin({ label: el.dataset.el ?? "", box: boxIn(el, root.current) });
            setArmed(false);
            setHover(null);
          }}
        >
          <AppPanel />

          {pin && (
            <div
              aria-hidden="true"
              className="border-accent-solid pointer-events-none absolute rounded-md border"
              style={{
                transform: `translate(${pin.box.x}px, ${pin.box.y}px)`,
                width: pin.box.width,
                height: pin.box.height,
                top: 0,
                left: 0,
              }}
            >
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring.bouncy}
                className="bg-accent text-accent-foreground border-accent-solid text-micro absolute -top-2.5 -right-2.5 flex size-5 items-center justify-center rounded-full border tabular-nums"
              >
                1
              </motion.span>
            </div>
          )}

          {armed && hover && (
            <motion.div
              aria-hidden="true"
              className="border-accent-solid bg-accent/50 pointer-events-none absolute rounded-md border"
              initial={false}
              animate={{
                x: hover.x,
                y: hover.y,
                width: hover.width,
                height: hover.height,
              }}
              transition={{ duration: duration.instant, ease: ease.outQuart }}
              style={{ top: 0, left: 0 }}
            />
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="pin-note"
          className="text-micro text-muted-foreground mb-2 block uppercase"
        >
          What went wrong
        </label>
        <Textarea
          id="pin-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            after
              ? "Say what's wrong."
              : "Say what's wrong, and where on the page it is."
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {after && (
          <Button
            className="h-9"
            variant={armed ? "secondary" : "outline"}
            onClick={() => {
              setArmed((a) => !a);
              setHover(null);
            }}
          >
            <Crosshair aria-hidden="true" />
            {armed ? "Cancel" : pin ? "Point somewhere else" : "Point at it"}
          </Button>
        )}
        {after && pin ? (
          <Chip onRemove={() => setPin(null)}>Pointing at {pin.label}</Chip>
        ) : (
          <span className="text-caption text-muted-foreground">
            {after
              ? armed
                ? "Now click the part that is wrong."
                : "Nothing pointed at yet."
              : "Whatever you type is all they get."}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── 2 · drag a box around the problem ────────────────────────────── */

function CropPair({ after }: Side) {
  const [drag, setDrag] = useState<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const [shot, setShot] = useState<{ box: Box; width: number } | null>(null);
  const [file, setFile] = useState<string | null>(null);

  const at = (e: RPointerEvent<HTMLDivElement>) => {
    const rr = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rr.x, y: e.clientY - rr.y };
  };

  const live: Box | null = drag && {
    x: Math.min(drag.x0, drag.x1),
    y: Math.min(drag.y0, drag.y1),
    width: Math.abs(drag.x1 - drag.x0),
    height: Math.abs(drag.y1 - drag.y0),
  };

  const scale = shot ? Math.min(1, 260 / shot.box.width) : 1;

  return (
    <div className="space-y-4">
      <div className="bg-background rounded-xl p-3">
        <div
          className={cn(
            "relative touch-none",
            after && "cursor-crosshair select-none",
          )}
          onPointerDown={(e) => {
            if (!after) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            const p = at(e);
            setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
          }}
          onPointerMove={(e) => {
            if (!drag) return;
            const p = at(e);
            setDrag((d) => (d ? { ...d, x1: p.x, y1: p.y } : d));
          }}
          onPointerUp={(e) => {
            if (!live) return;
            if (live.width > 24 && live.height > 24) {
              setShot({ box: live, width: e.currentTarget.offsetWidth });
            }
            setDrag(null);
          }}
        >
          <AppPanel />
          {live && live.width > 4 && (
            <div
              aria-hidden="true"
              className="border-accent-solid bg-accent/40 pointer-events-none absolute rounded-sm border"
              style={{
                transform: `translate(${live.x}px, ${live.y}px)`,
                width: live.width,
                height: live.height,
                top: 0,
                left: 0,
              }}
            />
          )}
        </div>
      </div>

      {after ? (
        <div>
          <Label>Attached</Label>
          {shot ? (
            <div className="flex flex-wrap items-end gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring.smooth}
                className="bg-card overflow-hidden rounded-lg border"
                style={{
                  width: shot.box.width * scale,
                  height: shot.box.height * scale,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: shot.width,
                    transform: `scale(${scale}) translate(${-shot.box.x}px, ${-shot.box.y}px)`,
                    transformOrigin: "top left",
                  }}
                >
                  <AppPanel />
                </div>
              </motion.div>
              <div className="space-y-2">
                <p className="text-caption text-muted-foreground tabular-nums">
                  {Math.round(shot.box.width)} × {Math.round(shot.box.height)}
                </p>
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={() => setShot(null)}
                >
                  <Trash2 aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-caption text-muted-foreground flex items-center gap-2">
              <SquareDashed className="size-4" aria-hidden="true" />
              Drag a box around the part that is wrong.
            </p>
          )}
        </div>
      ) : (
        <div>
          <label
            htmlFor="crop-file"
            className="text-micro text-muted-foreground mb-2 block uppercase"
          >
            Attach a screenshot
          </label>
          <input
            id="crop-file"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
            className="text-caption text-muted-foreground border-input file:text-foreground h-9 w-full rounded-lg border px-2.5 py-1.5 file:mr-3 file:border-0 file:bg-transparent file:font-medium"
          />
          <p className="text-caption text-muted-foreground mt-2">
            {file ?? "Take one yourself, find the file, then come back here."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── 3 · say it out loud ──────────────────────────────────────────── */

const BARS = [0.4, 0.9, 0.55, 1, 0.65, 0.35, 0.8];

function mmss(s: number) {
  return `0:${String(s).padStart(2, "0")}`;
}

function VoicePair({ after }: Side) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [clip, setClip] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef(0);

  const start = () => {
    setClip(null);
    setPlaying(false);
    setSecs(0);
    setRecording(true);
    started.current = Date.now();
    timer.current = setInterval(
      () => setSecs(Math.round((Date.now() - started.current) / 1000)),
      250,
    );
  };

  const stop = () => {
    if (!recording) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRecording(false);
    setClip(Math.max(1, Math.round((Date.now() - started.current) / 1000)));
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="voice-note"
          className="text-micro text-muted-foreground mb-2 block uppercase"
        >
          What went wrong
        </label>
        <Textarea
          id="voice-note"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            after
              ? "Type it, or hold the button and say it."
              : "Type out everything that happened, in order."
          }
        />
        {!after && (
          <p className="text-caption text-muted-foreground mt-2 tabular-nums">
            {text.length} / 500
          </p>
        )}
      </div>

      {after && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={recording ? "secondary" : "outline"}
            className="h-9 touch-none select-none"
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
          >
            <Mic aria-hidden="true" />
            {recording
              ? "Release to stop"
              : clip !== null
                ? "Record again"
                : "Hold to talk"}
          </Button>

          <AnimatePresence mode="popLayout" initial={false}>
            {recording && (
              <motion.div
                key="rec"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                className="flex items-center gap-3"
              >
                <span className="flex h-6 items-center gap-1">
                  {BARS.map((h, i) => (
                    <motion.span
                      key={h}
                      aria-hidden="true"
                      className="bg-accent-solid w-1 rounded-full"
                      style={{ height: 20 }}
                      animate={{ scaleY: [h * 0.3, h, h * 0.45] }}
                      transition={{
                        duration: 0.6,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: i * 0.07,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </span>
                <span className="text-caption text-muted-foreground tabular-nums">
                  {mmss(secs)}
                </span>
              </motion.div>
            )}

            {!recording && clip !== null && (
              <motion.div
                key="clip"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={spring.smooth}
                className="bg-secondary flex h-9 items-center gap-2 rounded-full px-1.5"
              >
                <button
                  type="button"
                  aria-label="Play the voice note"
                  onClick={() => setPlaying(true)}
                  className="bg-card text-foreground flex size-6 items-center justify-center rounded-full border"
                >
                  <Play className="size-3" aria-hidden="true" />
                </button>
                <span className="relative flex h-6 w-24 items-center gap-1 overflow-hidden">
                  {BARS.concat(BARS).map((h, i) => (
                    <span
                      key={`${h}-${i}`}
                      aria-hidden="true"
                      className="bg-border-strong w-1 shrink-0 rounded-full"
                      style={{ height: Math.round(4 + h * 14) }}
                    />
                  ))}
                  {playing && (
                    <motion.span
                      aria-hidden="true"
                      className="bg-accent/70 absolute inset-y-0 left-0 w-full origin-left rounded-sm"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: clip, ease: "linear" }}
                      onAnimationComplete={() => setPlaying(false)}
                    />
                  )}
                </span>
                <span className="text-caption text-muted-foreground tabular-nums">
                  {mmss(clip)}
                </span>
                <button
                  type="button"
                  aria-label="Delete the voice note"
                  onClick={() => {
                    setClip(null);
                    setPlaying(false);
                  }}
                  className="text-muted-foreground hover:text-foreground flex size-6 items-center justify-center rounded-full"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ── 4 · it already knows your browser ────────────────────────────── */

let envCache = "";

function envSnapshot() {
  const ua = navigator.userAgent;
  const name = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const version = ua.match(/(?:Edg|Firefox|Chrome|Version)\/(\d+)/)?.[1] ?? "";
  const os = /Mac/.test(ua)
    ? "macOS"
    : /Windows/.test(ua)
      ? "Windows"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : "Linux";
  const next = [
    version ? `${name} ${version}` : name,
    os,
    `${window.innerWidth} × ${window.innerHeight}`,
    document.documentElement.classList.contains("dark") ? "Dark" : "Light",
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ].join("|");
  if (next !== envCache) envCache = next;
  return envCache;
}

function envSubscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => {
    window.removeEventListener("resize", onChange);
    observer.disconnect();
  };
}

const envServer = () => "";

const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Something else"];
const SYSTEMS = ["macOS", "Windows", "Linux", "iOS", "Android"];

function ContextPair({ after }: Side) {
  const env = useSyncExternalStore(envSubscribe, envSnapshot, envServer);
  const [note, setNote] = useState("");
  const [form, setForm] = useState({
    browser: "",
    os: "",
    size: "",
    page: "",
    when: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      {!after && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ctx-browser"
              className="text-micro text-muted-foreground mb-2 block uppercase"
            >
              Which browser
            </label>
            <select
              id="ctx-browser"
              value={form.browser}
              onChange={(e) => set("browser", e.target.value)}
              className="text-ui-sm border-input bg-card h-9 w-full rounded-lg border px-2.5"
            >
              <option value="">Choose…</option>
              {BROWSERS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ctx-os"
              className="text-micro text-muted-foreground mb-2 block uppercase"
            >
              Which system
            </label>
            <select
              id="ctx-os"
              value={form.os}
              onChange={(e) => set("os", e.target.value)}
              className="text-ui-sm border-input bg-card h-9 w-full rounded-lg border px-2.5"
            >
              <option value="">Choose…</option>
              {SYSTEMS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ctx-size"
              className="text-micro text-muted-foreground mb-2 block uppercase"
            >
              Window size
            </label>
            <Input
              id="ctx-size"
              className="h-9"
              placeholder="e.g. 1440 × 900"
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="ctx-page"
              className="text-micro text-muted-foreground mb-2 block uppercase"
            >
              Which page
            </label>
            <Input
              id="ctx-page"
              className="h-9"
              placeholder="Paste the address"
              value={form.page}
              onChange={(e) => set("page", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="ctx-when"
              className="text-micro text-muted-foreground mb-2 block uppercase"
            >
              When did it happen
            </label>
            <Input
              id="ctx-when"
              className="h-9"
              placeholder="Date and rough time"
              value={form.when}
              onChange={(e) => set("when", e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="ctx-note"
          className="text-micro text-muted-foreground mb-2 block uppercase"
        >
          What went wrong
        </label>
        <Textarea
          id="ctx-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Say what happened."
        />
      </div>

      {after && (
        <div>
          <Label>Already filled in</Label>
          <div className="flex flex-wrap gap-1.5">
            {(env ? env.split("|") : ["…"]).map((v) => (
              <span
                key={v}
                className="text-caption text-muted-foreground bg-secondary rounded-full px-3 py-1 tabular-nums"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 5 · what stays out of the picture ────────────────────────────── */

function AccountRow({
  label,
  value,
  hidden = false,
  bar = "w-32",
}: {
  label: string;
  value: string;
  hidden?: boolean;
  bar?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-caption text-muted-foreground">{label}</span>
      {hidden ? (
        <span className="inline-flex items-center">
          <span
            aria-hidden="true"
            className={cn("bg-foreground h-4 rounded-sm", bar)}
          />
          <span className="sr-only">Hidden</span>
        </span>
      ) : (
        <span className="text-ui-sm tabular-nums">{value}</span>
      )}
    </div>
  );
}

function AccountPanel({ redact = false }: { redact?: boolean }) {
  return (
    <div className="bg-card space-y-2.5 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-ui">Billing</span>
        <span className="text-micro text-muted-foreground bg-secondary rounded-full px-2.5 py-1 uppercase">
          Team
        </span>
      </div>
      <AccountRow label="Email" value="ada@northwind.co" hidden={redact} />
      <AccountRow
        label="Card"
        value="4111 1111 1111 1111"
        hidden={redact}
        bar="w-40"
      />
      <AccountRow label="Next charge" value="$2,480.00" />
    </div>
  );
}

function MaskPair({ after }: Side) {
  const [shown, setShown] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-background rounded-xl p-3">
        <AccountPanel />
      </div>

      <Button
        variant="outline"
        className="h-9"
        onClick={() => setShown((s) => !s)}
      >
        {shown ? "Hide it again" : "Show what gets sent"}
      </Button>

      <AnimatePresence initial={false}>
        {shown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
          >
            <Label>The picture that goes with your report</Label>
            <div className="bg-background rounded-xl p-3">
              <AccountPanel redact={after} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 6 · three problems, three things to fix ──────────────────────── */

const SEED = [
  { id: 1, text: "The Upgrade button does nothing on the plan page", level: 2 },
  { id: 2, text: "It says 12 seats but I only ever added 9", level: 1 },
  { id: 3, text: "The invoice email arrived twice", level: 0 },
];

const LEVELS = ["Whenever", "Soon", "Urgent"];

function ItemsPair({ after }: Side) {
  const [blob, setBlob] = useState(SEED.map((s) => s.text).join("\n"));
  const [items, setItems] = useState(SEED);
  const [draft, setDraft] = useState("");
  const nextId = useRef(SEED.length + 1);

  if (!after) {
    return (
      <div>
        <label
          htmlFor="items-blob"
          className="text-micro text-muted-foreground mb-2 block uppercase"
        >
          What went wrong
        </label>
        <Textarea
          id="items-blob"
          value={blob}
          onChange={(e) => setBlob(e.target.value)}
          className="min-h-32"
        />
        <p className="text-caption text-muted-foreground mt-2">
          One message. They decide what to look at first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>What went wrong</Label>
      <ul className="divide-y border-y">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: duration.base, ease: ease.outQuart }}
              className="flex items-center gap-3 py-2"
            >
              <span className="text-caption text-muted-foreground w-4 shrink-0 tabular-nums">
                {i + 1}
              </span>
              <span className="text-ui-sm min-w-0 flex-1">{item.text}</span>
              <select
                aria-label={`How urgent: ${item.text}`}
                value={item.level}
                onChange={(e) =>
                  setItems((list) =>
                    list.map((it) =>
                      it.id === item.id
                        ? { ...it, level: Number(e.target.value) }
                        : it,
                    ),
                  )
                }
                className="text-caption border-input bg-card text-muted-foreground h-9 shrink-0 rounded-lg border px-2"
              >
                {LEVELS.map((l, li) => (
                  <option key={l} value={li}>
                    {l}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={`Remove: ${item.text}`}
                onClick={() =>
                  setItems((list) => list.filter((it) => it.id !== item.id))
                }
                className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          setItems((list) => [...list, { id: nextId.current++, text, level: 1 }]);
          setDraft("");
        }}
      >
        <label htmlFor="items-add" className="sr-only">
          Add another problem
        </label>
        <Input
          id="items-add"
          className="h-9"
          placeholder="Something else?"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" variant="secondary" className="h-9">
          <Plus aria-hidden="true" />
          Add
        </Button>
      </form>

      <p className="text-caption text-muted-foreground flex items-center gap-1 tabular-nums">
        <NumberFlow value={items.length} /> things to fix, in your order of
        pain.
      </p>
    </div>
  );
}

/* ── 7 · what you get back ────────────────────────────────────────── */

const DESTINATIONS = [
  { icon: Ticket, label: "Filed with the team" },
  { icon: MessageSquare, label: "Posted in their chat" },
  { icon: Mail, label: "Copy emailed to you" },
];

function SendPair({ after }: Side) {
  const [stage, setStage] = useState<"idle" | "sending" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = () => {
    setStage("sending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStage("done"), 900);
  };

  return (
    <div className="space-y-4">
      <div className="bg-background space-y-2 rounded-xl p-3">
        <p className="text-ui-sm">The Upgrade button does nothing.</p>
        <div className="flex flex-wrap gap-1.5">
          {["Screenshot", "Voice note", "Pointing at the Upgrade button"].map(
            (c) => (
              <span
                key={c}
                className="text-caption text-muted-foreground bg-secondary rounded-full px-3 py-1"
              >
                {c}
              </span>
            ),
          )}
        </div>
      </div>

      {stage !== "done" && (
        <Button className="h-9" disabled={stage === "sending"} onClick={send}>
          <Send aria-hidden="true" />
          {stage === "sending" ? "Sending…" : "Send"}
        </Button>
      )}

      {stage === "done" && !after && (
        <div className="space-y-3">
          <p className="text-ui">Thanks for your feedback!</p>
          <Button
            variant="outline"
            className="h-9"
            onClick={() => setStage("idle")}
          >
            Send another
          </Button>
        </div>
      )}

      {stage === "done" && after && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.smooth}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground flex size-6 items-center justify-center rounded-full">
              <Check className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-ui">Your report is FB-2041</span>
          </div>
          <ul className="space-y-2">
            {DESTINATIONS.map((d, i) => (
              <motion.li
                key={d.label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.08 * (i + 1),
                  duration: duration.base,
                  ease: ease.outQuart,
                }}
                className="text-caption text-muted-foreground flex items-center gap-2"
              >
                <d.icon className="size-4" aria-hidden="true" />
                {d.label}
              </motion.li>
            ))}
          </ul>
          <Button
            variant="outline"
            className="h-9"
            onClick={() => setStage("idle")}
          >
            Send another
          </Button>
        </motion.div>
      )}
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function RemediateDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Reporting a problem should not turn into writing directions. If you can see the thing that is wrong, you should be able to put your finger on it."
        before={<PointPair after={false} />}
        after={<PointPair after />}
      />
      <BeforeAfter
        principle="Nobody should have to leave the page to prove what they are looking at. The picture should come from where the problem is."
        before={<CropPair after={false} />}
        after={<CropPair after />}
      />
      <BeforeAfter
        principle="Some problems take a paragraph to type and ten seconds to say. Let people use whichever one is less work for them."
        before={<VoicePair after={false} />}
        after={<VoicePair after />}
      />
      <BeforeAfter
        principle="Which browser, which window, which page — the screen already knows all of it. Asking the person is asking them to do the machine's job."
        before={<ContextPair after={false} />}
        after={<ContextPair after />}
      />
      <BeforeAfter
        principle="A picture of the problem should not also be a picture of your card number. You should be able to see exactly what is about to leave your screen."
        before={<MaskPair after={false} />}
        after={<MaskPair after />}
      />
      <BeforeAfter
        principle="Three problems in one message turn into one problem for whoever reads it. Each thing that is wrong should arrive as its own thing, in the order that hurts you most."
        before={<ItemsPair after={false} />}
        after={<ItemsPair after />}
      />
      <BeforeAfter
        principle="After going to the trouble of describing something carefully, “thanks for your feedback” is where the trail goes cold. A report should come back with something you can chase."
        before={<SendPair after={false} />}
        after={<SendPair after />}
      />
    </div>
  );
}
