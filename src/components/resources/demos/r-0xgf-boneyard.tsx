"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefCallback,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Circle } from "lucide-react";

import { BeforeAfter, Sunken } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Seven before/after switches, built on a real re-implementation of the
 * library rather than a picture of one.
 *
 * `snapshotBones` reads live layout off the DOM: a box element gives its
 * border box, a text element gives one rect per wrapped line via a
 * Range — so a paragraph that breaks into three lines produces three
 * bones. The bone layer is painted over the very node it was measured
 * from, which is what makes "nothing moves" and "it settles in place"
 * true rather than staged.
 *
 * Every "before" is a real failure mode of the tool, produced by the
 * same engine: a placeholder hand-placed once, bones captured and never
 * re-captured (no `--watch`), bones captured at one viewport and reused
 * at another (`--breakpoints`), bones captured while the data was still
 * missing (no `fixture`), a fill carried over from the light theme
 * (`darkColor`), a hard swap (`transition`), and one pulse for the whole
 * card (`stagger`).
 */

/* ── engine ───────────────────────────────────────────────────────── */

type Bone = { x: number; y: number; w: number; h: number; r: number };
type Snapshot = { w: number; h: number; bones: Bone[] };

const EMPTY: Snapshot = { w: 0, h: 0, bones: [] };

/** Real layout off a real subtree. One rect per box, one per text line. */
function snapshotBones(root: HTMLElement): Snapshot {
  const base = root.getBoundingClientRect();
  const bones: Bone[] = [];
  const nodes = root.querySelectorAll<HTMLElement>(
    "[data-bone],[data-bone-text]",
  );

  for (const el of nodes) {
    const isText = el.hasAttribute("data-bone-text");
    let rects: DOMRect[];

    if (isText) {
      const range = document.createRange();
      range.selectNodeContents(el);
      rects = [...range.getClientRects()];
    } else {
      rects = [el.getBoundingClientRect()];
    }

    const radius = isText
      ? 4
      : parseFloat(getComputedStyle(el).borderTopLeftRadius) || 4;

    for (const r of rects) {
      if (r.width < 1 || r.height < 1) continue;
      bones.push({
        x: Math.round(r.left - base.left),
        y: Math.round(r.top - base.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
        r: Math.round(Math.min(radius, r.height / 2)),
      });
    }
  }

  return { w: Math.round(base.width), h: Math.round(base.height), bones };
}

/** Tuned against a white card, then carried into the dark theme as is. */
const FILL_LIGHT_ONLY = "bg-border dark:bg-secondary";
/** A peer value per theme, which is the point of the second prop. */
const FILL = "bg-border dark:bg-border-strong";

function BoneLayer({
  snap,
  fill = FILL,
  stagger = 0,
}: {
  snap: Snapshot;
  fill?: string;
  stagger?: number;
}) {
  return (
    <div role="status" aria-label="Loading" className="absolute inset-0">
      {snap.bones.map((b, i) => (
        <span
          key={`${i}-${b.x}-${b.y}-${b.w}`}
          aria-hidden="true"
          className={cn("absolute animate-pulse", fill)}
          style={{
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            borderRadius: b.r,
            animationDelay: stagger ? `${i * stagger}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Children stay mounted but hidden, so the bone layer sits exactly on
 * the box it was measured from and the swap needs no reflow.
 */
function Skeleton({
  loading,
  snap,
  measureRef,
  fill,
  stagger,
  transition = 0,
  children,
}: {
  loading: boolean;
  snap: Snapshot;
  measureRef: RefCallback<HTMLDivElement>;
  fill?: string;
  stagger?: number;
  transition?: number;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div
        ref={measureRef}
        style={{ visibility: loading ? "hidden" : "visible" }}
      >
        {children}
      </div>
      <AnimatePresence initial={false}>
        {loading && (
          <motion.div
            key="bones"
            className="absolute inset-0"
            exit={{ opacity: 0 }}
            transition={{ duration: transition / 1000, ease: ease.outQuart }}
          >
            <BoneLayer snap={snap} fill={fill} stagger={stagger} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Measures during commit, when layout is readable — a ref callback, not
 * an effect.
 *
 * `live: false` is the tool without `--watch`: measured once, kept
 * forever. `captureWidth` is the viewport pass — the node is widened to
 * the capture width, layout is read, and it is put straight back, which
 * is what the headless browser does with a real window.
 */
function useBones({
  live = true,
  captureWidth,
}: { live?: boolean; captureWidth?: number } = {}) {
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const captured = useRef(false);

  const ref = useCallback<RefCallback<HTMLDivElement>>(
    (node) => {
      if (!node) return;
      const read = () => {
        if (!live && captured.current) return;
        captured.current = true;
        if (captureWidth) {
          const prev = node.style.width;
          node.style.width = `${captureWidth}px`;
          const shot = snapshotBones(node);
          node.style.width = prev;
          setSnap(shot);
          return;
        }
        setSnap(snapshotBones(node));
      };
      read();
      const ro = new ResizeObserver(read);
      ro.observe(node);
      return () => ro.disconnect();
    },
    [live, captureWidth],
  );

  return { ref, snap };
}

/* ── the card every bone is measured from ─────────────────────────── */

type Side = "before" | "after";

function PostCard({
  blank = false,
  note = false,
}: {
  /** Captured with the query still in flight. */
  blank?: boolean;
  note?: boolean;
}) {
  const [approved, setApproved] = useState(false);
  const t = (s: string) => (blank ? " " : s);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <span
          data-bone
          aria-hidden="true"
          className="bg-feature text-feature-foreground text-micro grid size-10 shrink-0 place-items-center rounded-full"
        >
          MO
        </span>
        <div className="min-w-0">
          <p data-bone-text className="text-ui">
            {t("Marta Okonkwo")}
          </p>
          <p data-bone-text className="text-caption text-muted-foreground">
            {t("4 minutes ago")}
          </p>
        </div>
        <span
          data-bone
          className="bg-secondary text-micro text-muted-foreground ml-auto shrink-0 rounded-full px-2.5 py-1 uppercase"
        >
          {t("Invoice")}
        </span>
      </div>

      <p data-bone-text className="text-ui-sm mt-3">
        {t(
          "Invoice 4471 clears the threshold, so a second signature is only needed above ten thousand.",
        )}
      </p>

      {note && (
        <p data-bone-text className="text-ui-sm text-muted-foreground mt-2">
          {t("Rosa put herself down as the second reviewer this morning.")}
        </p>
      )}

      <button
        type="button"
        data-bone
        onClick={() => setApproved((v) => !v)}
        aria-pressed={approved}
        className="text-ui-sm bg-secondary hover:bg-muted duration-fast ease-out-quart focus-visible:border-ring mt-3 inline-flex h-9 items-center gap-2 rounded-lg border px-3 transition-colors outline-none"
      >
        {approved ? (
          <Check aria-hidden="true" className="text-positive size-4" />
        ) : (
          <Circle aria-hidden="true" className="text-muted-foreground size-4" />
        )}
        Approve
      </button>
    </div>
  );
}

/** The placeholder a normal product hand-places once and forgets. */
function HandPlaced() {
  return (
    <div className="space-y-2.5 p-4" role="status" aria-label="Loading">
      <div className="bg-border h-4 w-2/5 animate-pulse rounded-md" />
      <div className="bg-border h-4 w-full animate-pulse rounded-md" />
      <div className="bg-border h-4 w-3/4 animate-pulse rounded-md" />
    </div>
  );
}

/* ── shared shell ─────────────────────────────────────────────────── */

function Tray({ children, width }: { children: ReactNode; width?: number }) {
  return (
    <Sunken>
      <div
        className="bg-card overflow-hidden rounded-xl border"
        style={{ width: width ?? 380, maxWidth: "100%" }}
      >
        {children}
      </div>
    </Sunken>
  );
}

function Replies() {
  return (
    <p className="text-caption text-muted-foreground border-t px-4 py-3">
      3 replies
    </p>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {children}
    </div>
  );
}

function LoadingSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="text-caption text-muted-foreground">
        Still loading
      </label>
    </div>
  );
}

function useLoad(ms = 1600) {
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);
  const load = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setLoading(true);
    timer.current = window.setTimeout(() => setLoading(false), ms);
  }, [ms]);
  return { loading, load };
}

/* ── 1. hand-placed versus measured ───────────────────────────────── */

function Shape({ side }: { side: Side }) {
  const { ref, snap } = useBones();
  const { loading, load } = useLoad();

  return (
    <div>
      <Tray>
        {side === "before" ? (
          loading ? (
            <HandPlaced />
          ) : (
            <PostCard />
          )
        ) : (
          <Skeleton loading={loading} snap={snap} measureRef={ref}>
            <PostCard />
          </Skeleton>
        )}
        <Replies />
      </Tray>
      <Row>
        <Button size="lg" onClick={load}>
          Load the post
        </Button>
      </Row>
    </div>
  );
}

/* ── 2. one width versus the width you are on ─────────────────────── */

function Width({ side }: { side: Side }) {
  const { ref, snap } = useBones(
    side === "after" ? {} : { live: false, captureWidth: 300 },
  );
  const [width, setWidth] = useState(460);
  const [loading, setLoading] = useState(true);
  const id = useId();

  return (
    <div>
      <Tray width={width}>
        <Skeleton loading={loading} snap={snap} measureRef={ref}>
          <PostCard />
        </Skeleton>
      </Tray>
      <Row>
        <label htmlFor={id} className="text-caption text-muted-foreground">
          Window
        </label>
        <input
          id={id}
          type="range"
          min={280}
          max={520}
          step={4}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="accent-primary h-9 w-44"
        />
        <LoadingSwitch checked={loading} onChange={setLoading} />
      </Row>
    </div>
  );
}

/* ── 3. captured once versus kept in step ─────────────────────────── */

function Edit({ side }: { side: Side }) {
  const { ref, snap } = useBones(side === "after" ? {} : { live: false });
  const [note, setNote] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div>
      <Tray>
        <Skeleton loading={loading} snap={snap} measureRef={ref}>
          <PostCard note={note} />
        </Skeleton>
      </Tray>
      <Row>
        <Button variant="outline" size="lg" onClick={() => setNote((v) => !v)}>
          {note ? "Take the second line off" : "Add a second line to the card"}
        </Button>
        <LoadingSwitch checked={loading} onChange={setLoading} />
      </Row>
    </div>
  );
}

/* ── 4. captured with no data versus with stand-in content ────────── */

function Content({ side }: { side: Side }) {
  const { ref, snap } = useBones();
  const [loading, setLoading] = useState(true);
  const blank = side === "before" && loading;

  return (
    <div>
      <Tray>
        <Skeleton loading={loading} snap={snap} measureRef={ref}>
          <PostCard blank={blank} />
        </Skeleton>
      </Tray>
      <Row>
        <LoadingSwitch checked={loading} onChange={setLoading} />
      </Row>
    </div>
  );
}

/* ── 5. one fill for both themes versus a peer for each ───────────── */

function Night({ side }: { side: Side }) {
  const { ref, snap } = useBones();
  const [loading, setLoading] = useState(true);

  return (
    <div className="dark bg-background rounded-2xl p-4">
      <Tray>
        <Skeleton
          loading={loading}
          snap={snap}
          measureRef={ref}
          fill={side === "after" ? FILL : FILL_LIGHT_ONLY}
        >
          <PostCard />
        </Skeleton>
      </Tray>
      <Row>
        <LoadingSwitch checked={loading} onChange={setLoading} />
      </Row>
    </div>
  );
}

/* ── 6. hard swap versus cross-fade ───────────────────────────────── */

function Swap({ side }: { side: Side }) {
  const { ref, snap } = useBones();
  const { loading, load } = useLoad(1200);

  return (
    <div>
      <Tray>
        <Skeleton
          loading={loading}
          snap={snap}
          measureRef={ref}
          transition={side === "after" ? 300 : 0}
        >
          <PostCard />
        </Skeleton>
      </Tray>
      <Row>
        <Button size="lg" onClick={load}>
          Load the post
        </Button>
      </Row>
    </div>
  );
}

/* ── 7. one pulse for the whole card versus a ripple ──────────────── */

function Rhythm({ side }: { side: Side }) {
  const { ref, snap } = useBones();
  const [loading, setLoading] = useState(true);

  return (
    <div>
      <Tray>
        <Skeleton
          loading={loading}
          snap={snap}
          measureRef={ref}
          stagger={side === "after" ? 90 : 0}
        >
          <PostCard note />
        </Skeleton>
      </Tray>
      <Row>
        <LoadingSwitch checked={loading} onChange={setLoading} />
      </Row>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export function BoneyardDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Nothing moves when the post arrives."
        before={<Shape key="before" side="before" />}
        after={<Shape key="after" side="after" />}
      />
      <BeforeAfter
        principle="It fits the window you are actually on."
        before={<Width key="before" side="before" />}
        after={<Width key="after" side="after" />}
      />
      <BeforeAfter
        principle="It keeps up when the card changes."
        before={<Edit key="before" side="before" />}
        after={<Edit key="after" side="after" />}
      />
      <BeforeAfter
        principle="The grey lines are the size of the words that are coming."
        before={<Content key="before" side="before" />}
        after={<Content key="after" side="after" />}
      />
      <BeforeAfter
        principle="You can still see it at night."
        before={<Night key="before" side="before" />}
        after={<Night key="after" side="after" />}
      />
      <BeforeAfter
        principle="The post settles in instead of snapping."
        before={<Swap key="before" side="before" />}
        after={<Swap key="after" side="after" />}
      />
      <BeforeAfter
        principle="It ripples down the card instead of blinking all at once."
        before={<Rhythm key="before" side="before" />}
        after={<Rhythm key="after" side="after" />}
      />
    </div>
  );
}
