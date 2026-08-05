"use client";

import {
  Bold,
  Check,
  ChevronDown,
  Code2,
  Copy,
  GripHorizontal,
  ImageIcon,
  Italic,
  Link2,
  MessageSquare,
  Minus,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { type ReactNode, useRef, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * mui/base-ui — the primitives, shown rather than listed.
 *
 * Base UI ships 38 components. Most of what makes them worth the
 * dependency is behaviour you only notice when it is missing: a code
 * field that takes a paste, a menu that opens on the thing you already
 * picked, two slider handles that refuse to swap places. Each switch
 * below flips one of those between the version most products ship and
 * the version the library gets right.
 * ------------------------------------------------------------------ */

const CTRL =
  "text-ui-sm ring-ring/50 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 whitespace-nowrap select-none outline-none focus-visible:ring-3";
const PRIMARY = cn(CTRL, "bg-primary text-primary-foreground");
const QUIET = cn(CTRL, "bg-secondary text-foreground border");
const FIELD =
  "text-ui bg-card ring-ring/50 h-9 rounded-lg border px-3 outline-none focus-visible:ring-3";

/* ------------------------------------------------------------------ *
 * 1 — the verification code field
 * ------------------------------------------------------------------ */

const OTP_CODE = "428193";
const OTP_LEN = 6;
const OTP_BOX =
  "text-ui bg-card ring-ring/50 size-11 rounded-lg border text-center tabular-nums outline-none focus-visible:ring-3";

function CodeMessage() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="bg-secondary mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
      <MessageSquare
        className="text-muted-foreground size-4 shrink-0"
        aria-hidden="true"
      />
      <p className="text-caption text-muted-foreground">
        Your code is{" "}
        <span className="text-foreground font-mono tracking-wider">
          {OTP_CODE}
        </span>
      </p>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard
            ?.writeText(OTP_CODE)
            .then(() => setCopied(true))
            .catch(() => undefined);
        }}
        className={cn(QUIET, "ml-auto")}
      >
        {copied ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function CodeStatus({ done }: { done: boolean }) {
  return done ? (
    <p className="text-caption text-positive mt-3 flex items-center gap-1.5">
      <Check className="size-3.5" aria-hidden="true" />
      Code accepted
    </p>
  ) : (
    <p className="text-caption text-muted-foreground mt-3">
      Enter the 6 digits we sent you.
    </p>
  );
}

function CodeBefore() {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));

  return (
    <div>
      <CodeMessage />
      <div className="flex flex-wrap gap-2">
        {digits.map((d, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length slots
            key={i}
            value={d}
            maxLength={1}
            inputMode="numeric"
            aria-label={`Digit ${i + 1} of ${OTP_LEN}`}
            onChange={(e) =>
              setDigits((prev) =>
                prev.map((v, j) => (j === i ? e.target.value.slice(-1) : v)),
              )
            }
            className={OTP_BOX}
          />
        ))}
      </div>
      <CodeStatus done={digits.every(Boolean)} />
    </div>
  );
}

function CodeAfter() {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (i: number) =>
    boxes.current[Math.max(0, Math.min(OTP_LEN - 1, i))]?.focus();
  const setAt = (i: number, ch: string) =>
    setDigits((prev) => prev.map((v, j) => (j === i ? ch : v)));

  return (
    <div>
      <CodeMessage />
      <div className="flex flex-wrap gap-2">
        {digits.map((d, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length slots
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`Digit ${i + 1} of ${OTP_LEN}`}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              const ch = e.target.value.replace(/\D/g, "").slice(-1);
              if (!ch) return;
              setAt(i, ch);
              focusAt(i + 1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace") {
                e.preventDefault();
                if (digits[i]) {
                  setAt(i, "");
                } else {
                  setAt(i - 1, "");
                  focusAt(i - 1);
                }
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                focusAt(i - 1);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                focusAt(i + 1);
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, OTP_LEN);
              if (!text) return;
              setDigits(
                Array.from({ length: OTP_LEN }, (_, j) => text[j] ?? ""),
              );
              focusAt(text.length);
            }}
            className={cn(
              OTP_BOX,
              "duration-fast ease-out-quart transition-colors",
              d && "border-strong",
            )}
          />
        ))}
      </div>
      <CodeStatus done={digits.every(Boolean)} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2 — the number field
 * ------------------------------------------------------------------ */

const SEAT_MIN = 1;
const SEAT_MAX = 99;
const clampSeats = (n: number) =>
  Math.min(SEAT_MAX, Math.max(SEAT_MIN, Math.round(n)));

function SeatTotal({ seats }: { seats: number | null }) {
  return (
    <p className="text-caption text-muted-foreground mt-3 tabular-nums">
      {seats === null ? "—" : `${seats} × $9 = $${seats * 9} a month`}
    </p>
  );
}

function SeatsBefore() {
  const [text, setText] = useState("12");
  const n = Number(text);
  const valid = text.trim() !== "" && Number.isFinite(n) && n >= 1;

  return (
    <div>
      <div className="flex items-center gap-3">
        <label htmlFor="bui-seats-b" className="text-ui-sm text-foreground">
          Seats
        </label>
        <input
          id="bui-seats-b"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={cn(FIELD, "w-28")}
        />
      </div>
      <SeatTotal seats={valid ? Math.round(n) : null} />
    </div>
  );
}

function SeatsAfter() {
  const [seats, setSeats] = useState(12);
  const [scrubbing, setScrubbing] = useState(false);
  const anchor = useRef(0);

  const stepFor = (e: { shiftKey: boolean }) => (e.shiftKey ? 10 : 1);
  const nudge = (d: number) => setSeats((v) => clampSeats(v + d));

  return (
    <div>
      <div className="flex items-center gap-3">
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: the label is the scrub area */}
        <label
          htmlFor="bui-seats-a"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            anchor.current = e.clientX;
            setScrubbing(true);
          }}
          onPointerMove={(e) => {
            if (!scrubbing) return;
            const dx = e.clientX - anchor.current;
            if (Math.abs(dx) < 6) return;
            anchor.current = e.clientX;
            nudge(Math.sign(dx) * stepFor(e));
          }}
          onPointerUp={() => setScrubbing(false)}
          onPointerCancel={() => setScrubbing(false)}
          className={cn(
            "text-ui-sm duration-fast ease-out-quart cursor-ew-resize transition-colors select-none",
            scrubbing ? "text-accent-foreground" : "text-foreground",
          )}
        >
          Seats
        </label>
        <div
          className={cn(
            "bg-card duration-fast ease-out-quart flex h-9 items-center overflow-hidden rounded-lg border transition-colors",
            scrubbing && "border-strong",
          )}
        >
          <button
            type="button"
            aria-label="One seat fewer"
            onClick={(e) => nudge(-stepFor(e))}
            className="hover:bg-secondary text-muted-foreground hover:text-foreground grid size-9 shrink-0 place-items-center transition-colors"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <input
            id="bui-seats-a"
            inputMode="numeric"
            value={seats}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, ""));
              if (Number.isFinite(n) && n > 0) setSeats(clampSeats(n));
            }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
              e.preventDefault();
              nudge((e.key === "ArrowUp" ? 1 : -1) * stepFor(e));
            }}
            className="text-ui w-14 border-x bg-transparent text-center tabular-nums outline-none"
          />
          <button
            type="button"
            aria-label="One seat more"
            onClick={(e) => nudge(stepFor(e))}
            className="hover:bg-secondary text-muted-foreground hover:text-foreground grid size-9 shrink-0 place-items-center transition-colors"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <SeatTotal seats={seats} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3 — picking people out of a long list
 * ------------------------------------------------------------------ */

const PEOPLE = [
  "Ana Cruz",
  "Ben Ito",
  "Chidi Okafor",
  "Dana Levin",
  "Elias Roth",
  "Farah Nasser",
  "Greta Lind",
  "Hugo Marsh",
  "Ines Vogel",
  "Jonas Pike",
  "Kira Sandoval",
  "Lars Bergman",
] as const;

function InviteFooter({ picked }: { picked: string[] }) {
  return (
    <p className="text-caption text-muted-foreground mt-3">
      {picked.length === 0
        ? "Nobody invited yet."
        : `Inviting ${picked.length} ${picked.length === 1 ? "person" : "people"}.`}
    </p>
  );
}

function InviteBefore() {
  const [picked, setPicked] = useState<string[]>(["Ben Ito"]);

  return (
    <div>
      <label
        htmlFor="bui-people-b"
        className="text-ui-sm text-foreground block"
      >
        Invite people
      </label>
      <select
        id="bui-people-b"
        multiple
        size={5}
        value={picked}
        onChange={(e) =>
          setPicked(Array.from(e.target.selectedOptions, (o) => o.value))
        }
        className="text-ui bg-card ring-ring/50 mt-2 w-full max-w-80 rounded-lg border p-1 outline-none focus-visible:ring-3"
      >
        {PEOPLE.map((p) => (
          <option key={p} value={p} className="px-2 py-1">
            {p}
          </option>
        ))}
      </select>
      <p className="text-caption text-muted-foreground mt-2">
        Hold ⌘ or Ctrl to pick more than one.
      </p>
      <InviteFooter picked={picked} />
    </div>
  );
}

function InviteAfter() {
  const [picked, setPicked] = useState<string[]>(["Ben Ito"]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const matches = PEOPLE.filter(
    (p) =>
      !picked.includes(p) && p.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const add = (name: string) => {
    setPicked((prev) => [...prev, name]);
    setQuery("");
    setActive(0);
    input.current?.focus();
  };

  return (
    <div>
      <label
        htmlFor="bui-people-a"
        className="text-ui-sm text-foreground block"
      >
        Invite people
      </label>

      <div className="relative mt-2 max-w-80">
        <div
          className={cn(
            "bg-card ring-ring/50 flex flex-wrap items-center gap-1.5 rounded-lg border p-1.5 transition-shadow",
            open && "ring-3",
          )}
        >
          {picked.map((name) => (
            <button
              key={name}
              type="button"
              aria-label={`Remove ${name}`}
              onClick={() => setPicked((prev) => prev.filter((p) => p !== name))}
              className="text-ui-sm bg-secondary hover:bg-muted text-foreground inline-flex h-9 items-center gap-1.5 rounded-full pr-2.5 pl-3 transition-colors"
            >
              {name}
              <X className="size-3.5 opacity-60" aria-hidden="true" />
            </button>
          ))}

          <div className="flex min-w-32 flex-1 items-center gap-1.5 px-1.5">
            <Search
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            <input
              id="bui-people-a"
              ref={input}
              value={query}
              placeholder={picked.length ? "Add another" : "Search by name"}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setOpen(true);
                  setActive((i) => {
                    const n = matches.length;
                    if (n === 0) return 0;
                    return (
                      (i + (e.key === "ArrowDown" ? 1 : -1) + n) % n
                    );
                  });
                } else if (e.key === "Enter" && matches[active]) {
                  e.preventDefault();
                  add(matches[active]);
                } else if (e.key === "Backspace" && query === "") {
                  setPicked((prev) => prev.slice(0, -1));
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              className="text-ui h-9 w-full bg-transparent outline-none"
            />
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className="bg-popover shadow-floating absolute inset-x-0 top-full z-20 mt-1.5 max-h-44 overflow-auto rounded-xl p-1"
            >
              {matches.length === 0 ? (
                <li className="text-caption text-muted-foreground px-3 py-2">
                  Nobody by that name.
                </li>
              ) : (
                matches.map((p, i) => (
                  <li key={p}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => add(p)}
                      className={cn(
                        "text-ui flex h-9 w-full items-center rounded-lg px-3 text-left transition-colors",
                        i === active
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground",
                      )}
                    >
                      {p}
                    </button>
                  </li>
                ))
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <InviteFooter picked={picked} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 4 — the select that opens where your choice already is
 * ------------------------------------------------------------------ */

const SORTS = [
  "Newest first",
  "Oldest first",
  "Most viewed",
  "Least viewed",
  "A to Z",
  "Z to A",
  "Recently edited",
] as const;

const ITEM_H = 36;

function SortTrigger({
  value,
  onClick,
  open,
}: {
  value: string;
  onClick: () => void;
  open: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={cn(
        CTRL,
        "bg-card w-56 justify-between border px-3 font-normal",
      )}
    >
      <span className="text-ui">{value}</span>
      <ChevronDown
        className="text-muted-foreground size-4 shrink-0"
        aria-hidden="true"
      />
    </button>
  );
}

function SortItem({
  label,
  selected,
  onSelect,
  highlighted,
  onHover,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  highlighted?: boolean;
  onHover?: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onMouseEnter={onHover}
      onClick={onSelect}
      style={{ height: ITEM_H }}
      className={cn(
        "text-ui flex w-full items-center justify-between gap-2 rounded-lg px-3 text-left transition-colors",
        highlighted ? "bg-accent text-accent-foreground" : "text-foreground",
      )}
    >
      {label}
      {selected && <Check className="size-4 shrink-0" aria-hidden="true" />}
    </button>
  );
}

function SortBefore() {
  const [value, setValue] = useState<string>(SORTS[4]);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-72 items-center justify-center">
      <div className="relative">
        <SortTrigger value={value} open={open} onClick={() => setOpen((o) => !o)} />
        {open && (
          <>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: click-away layer */}
            <div
              aria-hidden="true"
              className="fixed inset-0 z-30"
              onPointerDown={() => setOpen(false)}
            />
            <div
              // biome-ignore lint/a11y/useSemanticElements: styled listbox
              role="listbox"
              className="bg-popover shadow-floating absolute inset-x-0 top-full z-40 mt-1.5 rounded-xl p-1"
            >
              {SORTS.map((s) => (
                <SortItem
                  key={s}
                  label={s}
                  selected={s === value}
                  onSelect={() => {
                    setValue(s);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SortAfter() {
  const [value, setValue] = useState<string>(SORTS[4]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(4);
  const index = SORTS.indexOf(value as (typeof SORTS)[number]);

  const commit = (i: number) => {
    setValue(SORTS[i]);
    setActive(i);
    setOpen(false);
  };

  return (
    <div className="flex h-72 items-center justify-center">
      <div className="relative">
        <SortTrigger
          value={value}
          open={open}
          onClick={() => {
            setActive(index);
            setOpen((o) => !o);
          }}
        />
        {open && (
          // biome-ignore lint/a11y/noStaticElementInteractions: click-away layer
          <div
            aria-hidden="true"
            className="fixed inset-0 z-30"
            onPointerDown={() => setOpen(false)}
          />
        )}

        <AnimatePresence>
          {open && (
              <motion.div
                key="sort-menu"
                // biome-ignore lint/a11y/useSemanticElements: styled listbox
                role="listbox"
                tabIndex={-1}
                ref={(el) => {
                  el?.focus();
                }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive(
                      (i) =>
                        (i + (e.key === "ArrowDown" ? 1 : -1) + SORTS.length) %
                        SORTS.length,
                    );
                  } else if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    commit(active);
                  } else if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
                style={{ top: -(index * ITEM_H + 4) }}
                className="bg-popover shadow-floating absolute inset-x-0 z-40 rounded-xl p-1 outline-none"
              >
                {SORTS.map((s, i) => (
                  <SortItem
                    key={s}
                    label={s}
                    selected={s === value}
                    highlighted={i === active}
                    onHover={() => setActive(i)}
                    onSelect={() => commit(i)}
                  />
                ))}
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 5 — the price range
 * ------------------------------------------------------------------ */

const P_MIN = 0;
const P_MAX = 1000;
const P_STEP = 20;
const P_GAP = 100;

function priceCount(low: number, high: number) {
  if (high - low < P_GAP) return 0;
  return Math.max(1, Math.round((high - low) / 40));
}

function PriceReadout({ low, high }: { low: number; high: number }) {
  const broken = high <= low;
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
      <p className="text-ui tabular-nums">
        ${low} – ${high}
      </p>
      <p
        className={cn(
          "text-caption tabular-nums",
          broken ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {broken ? "No stays match" : `${priceCount(low, high)} stays`}
      </p>
    </div>
  );
}

function PriceBefore() {
  const [low, setLow] = useState(200);
  const [high, setHigh] = useState(700);

  return (
    <div className="max-w-80">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label
            htmlFor="bui-low-b"
            className="text-ui-sm text-muted-foreground w-10"
          >
            Min
          </label>
          <input
            id="bui-low-b"
            type="range"
            min={P_MIN}
            max={P_MAX}
            step={P_STEP}
            value={low}
            onChange={(e) => setLow(Number(e.target.value))}
            className="accent-foreground h-9 w-full"
          />
        </div>
        <div className="flex items-center gap-3">
          <label
            htmlFor="bui-high-b"
            className="text-ui-sm text-muted-foreground w-10"
          >
            Max
          </label>
          <input
            id="bui-high-b"
            type="range"
            min={P_MIN}
            max={P_MAX}
            step={P_STEP}
            value={high}
            onChange={(e) => setHigh(Number(e.target.value))}
            className="accent-foreground h-9 w-full"
          />
        </div>
      </div>
      <PriceReadout low={low} high={high} />
    </div>
  );
}

function PriceAfter() {
  const [low, setLow] = useState(200);
  const [high, setHigh] = useState(700);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef<"low" | "high" | null>(null);

  const pct = (v: number) => ((v - P_MIN) / (P_MAX - P_MIN)) * 100;

  const valueAt = (clientX: number) => {
    const el = track.current;
    if (!el) return P_MIN;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return (
      Math.round((P_MIN + ratio * (P_MAX - P_MIN)) / P_STEP) * P_STEP
    );
  };

  const apply = (which: "low" | "high", raw: number) => {
    if (which === "low") setLow(Math.min(raw, high - P_GAP));
    else setHigh(Math.max(raw, low + P_GAP));
  };

  const nudge = (which: "low" | "high", dir: number, big: boolean) => {
    const delta = dir * P_STEP * (big ? 5 : 1);
    apply(which, (which === "low" ? low : high) + delta);
  };

  const thumb = (which: "low" | "high") => {
    const v = which === "low" ? low : high;
    return (
      <div
        // biome-ignore lint/a11y/useSemanticElements: styled range thumb
        role="slider"
        tabIndex={0}
        aria-label={which === "low" ? "Lowest price" : "Highest price"}
        aria-valuemin={P_MIN}
        aria-valuemax={P_MAX}
        aria-valuenow={v}
        aria-valuetext={`$${v}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            nudge(which, -1, e.shiftKey);
          } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            nudge(which, 1, e.shiftKey);
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = which;
        }}
        onPointerMove={(e) => {
          if (dragging.current !== which) return;
          apply(which, valueAt(e.clientX));
        }}
        onPointerUp={() => {
          dragging.current = null;
        }}
        style={{ left: `${pct(v)}%` }}
        className="bg-card ring-ring/50 absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border shadow-xs outline-none active:cursor-grabbing focus-visible:ring-3"
      />
    );
  };

  return (
    <div className="max-w-80">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: track jumps the nearest handle */}
      <div
        ref={track}
        onPointerDown={(e) => {
          const raw = valueAt(e.clientX);
          const which =
            Math.abs(raw - low) <= Math.abs(raw - high) ? "low" : "high";
          apply(which, raw);
        }}
        className="relative flex h-9 items-center"
      >
        <div className="bg-secondary h-1.5 w-full rounded-full" />
        <div
          className="bg-foreground absolute h-1.5 rounded-full"
          style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }}
        />
        {thumb("low")}
        {thumb("high")}
      </div>
      <PriceReadout low={low} high={high} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 6 — the accordion
 * ------------------------------------------------------------------ */

const FAQ = [
  {
    q: "When am I charged?",
    a: "On the first of each month, for the seats you had on the last day of the previous one.",
  },
  {
    q: "Can I change plan later?",
    a: "Any time. Moving up takes effect immediately; moving down at the end of the current month.",
  },
  {
    q: "What happens to my data if I leave?",
    a: "It stays available for 30 days, then it is deleted. You can export everything as a single archive before that.",
  },
] as const;

function FaqRow({
  q,
  open,
  onToggle,
}: {
  q: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="text-ui ring-ring/50 flex h-11 w-full items-center justify-between gap-3 rounded-lg text-left outline-none focus-visible:ring-3"
    >
      {q}
      <ChevronDown
        className={cn(
          "text-muted-foreground duration-base ease-out-quart size-4 shrink-0 transition-transform",
          open && "rotate-180",
        )}
        aria-hidden="true"
      />
    </button>
  );
}

function FaqBefore() {
  const [open, setOpen] = useState<number | null>(1);

  return (
    <div className="max-w-lg">
      {FAQ.map((f, i) => (
        <div key={f.q} className="border-b last:border-b-0">
          <FaqRow
            q={f.q}
            open={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
          {open === i && (
            <p className="text-caption text-muted-foreground pb-3">{f.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FaqAfter() {
  const [open, setOpen] = useState<number | null>(1);

  return (
    <div className="max-w-lg">
      {FAQ.map((f, i) => (
        <div key={f.q} className="border-b last:border-b-0">
          <FaqRow
            q={f.q}
            open={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: duration.base, ease: ease.outQuart }}
                className="overflow-hidden"
              >
                <p className="text-caption text-muted-foreground pb-3">{f.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 7 — notifications
 * ------------------------------------------------------------------ */

type Note = { id: number; title: string; body: string };

const NOTE_LIFE = 4000;
const NOTE_H = 64;

function noteFor(n: number): Note {
  return {
    id: n,
    title: `Invoice #${1040 + n} sent`,
    body: "Ana Cruz will get it in a moment.",
  };
}

function NoteCard({ note }: { note: Note }) {
  return (
    <div className="bg-popover shadow-floating h-16 w-full rounded-xl px-4 py-2.5">
      <p className="text-ui-sm truncate">{note.title}</p>
      <p className="text-caption text-muted-foreground truncate">{note.body}</p>
    </div>
  );
}

function NotesBefore() {
  const [notes, setNotes] = useState<Note[]>([]);
  const seq = useRef(0);

  const send = () => {
    seq.current += 1;
    const note = noteFor(seq.current);
    setNotes((prev) => [...prev, note]);
    setTimeout(
      () => setNotes((prev) => prev.filter((n) => n.id !== note.id)),
      NOTE_LIFE,
    );
  };

  return (
    <div className="bg-secondary relative h-64 overflow-hidden rounded-xl border p-4">
      <button type="button" onClick={send} className={PRIMARY}>
        <Send className="size-4" aria-hidden="true" />
        Send invoice
      </button>
      <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2">
        {notes.slice(-3).map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </div>
    </div>
  );
}

function NotesAfter() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [expanded, setExpanded] = useState(false);
  const seq = useRef(0);
  const timers = useRef(
    new Map<number, { handle: ReturnType<typeof setTimeout>; left: number; startedAt: number }>(),
  );

  const drop = (id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t.handle);
    timers.current.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const schedule = (id: number, ms: number) => {
    const handle = setTimeout(() => drop(id), ms);
    timers.current.set(id, { handle, left: ms, startedAt: Date.now() });
  };

  const send = () => {
    seq.current += 1;
    const note = noteFor(seq.current);
    setNotes((prev) => [...prev.slice(-4), note]);
    schedule(note.id, NOTE_LIFE);
  };

  const hold = () => {
    setExpanded(true);
    for (const [id, t] of timers.current) {
      clearTimeout(t.handle);
      timers.current.set(id, {
        ...t,
        left: Math.max(600, t.left - (Date.now() - t.startedAt)),
      });
    }
  };

  const release = () => {
    setExpanded(false);
    for (const [id, t] of timers.current) schedule(id, t.left);
  };

  const stack = notes.slice(-3);

  return (
    <div className="bg-secondary relative h-64 overflow-hidden rounded-xl border p-4">
      <button type="button" onClick={send} className={PRIMARY}>
        <Send className="size-4" aria-hidden="true" />
        Send invoice
      </button>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: hovering the stack holds it */}
      <div
        onPointerEnter={hold}
        onPointerLeave={release}
        className={cn(
          "absolute inset-x-4 bottom-4",
          expanded ? "h-52" : "h-16",
        )}
      >
        <AnimatePresence>
          {stack.map((n, i) => {
            const depth = stack.length - 1 - i;
            return (
              <motion.div
                key={n.id}
                drag={depth === 0 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.05, right: 0.9 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 90 || info.velocity.x > 600) drop(n.id);
                }}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{
                  opacity: depth > 2 ? 0 : 1,
                  y: expanded ? -depth * (NOTE_H + 8) : -depth * 10,
                  scale: expanded ? 1 : 1 - depth * 0.05,
                }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={spring.smooth}
                style={{ zIndex: 10 - depth }}
                className="absolute inset-x-0 bottom-0 cursor-grab active:cursor-grabbing"
              >
                <NoteCard note={n} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 8 — the sheet
 * ------------------------------------------------------------------ */

const SHEET_ROWS = ["Entire place", "Free cancellation", "Instant book"];

function SheetBody({ onDone }: { onDone: () => void }) {
  return (
    <div className="px-5 pb-5">
      <p className="text-ui mb-3">Filters</p>
      <ul className="mb-4 space-y-1">
        {SHEET_ROWS.map((r) => (
          <li key={r} className="text-caption text-muted-foreground">
            {r}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onDone} className={cn(PRIMARY, "w-full")}>
        Show 42 stays
      </button>
    </div>
  );
}

function SheetBefore() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-secondary relative h-72 overflow-hidden rounded-xl border">
      <div className="grid h-full place-items-center">
        <button type="button" onClick={() => setOpen(true)} className={QUIET}>
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="bg-foreground absolute inset-0"
          />
        )}
        {open && (
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="bg-card absolute inset-x-0 bottom-0 rounded-t-2xl pt-5"
          >
            <SheetBody onDone={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SheetAfter() {
  const [open, setOpen] = useState(false);
  const y = useMotionValue(0);
  const dim = useTransform(y, [0, 220], [0.25, 0]);

  return (
    <div className="bg-secondary relative h-72 overflow-hidden rounded-xl border">
      <div className="grid h-full place-items-center">
        <button
          type="button"
          onClick={() => {
            y.set(0);
            setOpen(true);
          }}
          className={QUIET}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            style={{ opacity: dim }}
            className="bg-foreground absolute inset-0"
          />
        )}
        {open && (
          <motion.div
            key="sheet"
            drag="y"
            style={{ y }}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.9 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 70 || info.velocity.y > 500) setOpen(false);
            }}
            initial={{ y: 260 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={spring.smooth}
            className="bg-card absolute inset-x-0 bottom-0 touch-none rounded-t-2xl pt-2"
          >
            <div className="grid h-7 cursor-grab place-items-center active:cursor-grabbing">
              <GripHorizontal
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
            </div>
            <SheetBody onDone={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 9 — the toolbar's labels
 * ------------------------------------------------------------------ */

const TOOLS = [
  { id: "bold", label: "Bold", Icon: Bold },
  { id: "italic", label: "Italic", Icon: Italic },
  { id: "link", label: "Add link", Icon: Link2 },
  { id: "image", label: "Insert image", Icon: ImageIcon },
  { id: "code", label: "Code block", Icon: Code2 },
] as const;

function ToolButton({
  label,
  Icon,
  hint,
  ...handlers
}: {
  label: string;
  Icon: (typeof TOOLS)[number]["Icon"];
  hint: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        className="text-muted-foreground hover:bg-secondary hover:text-foreground ring-ring/50 grid size-9 place-items-center rounded-lg outline-none transition-colors focus-visible:ring-3"
        {...handlers}
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {hint && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="bg-feature text-feature-foreground text-caption shadow-floating pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg px-2 py-1 whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarShell({ children }: { children: ReactNode }) {
  return (
    <div className="pt-10">
      <div className="bg-card inline-flex items-center gap-1 rounded-xl border p-1">
        {children}
      </div>
      <p className="text-caption text-muted-foreground mt-3">
        Sweep the pointer across all five.
      </p>
    </div>
  );
}

function TooltipsBefore() {
  const [hint, setHint] = useState<string | null>(null);

  return (
    <ToolbarShell>
      {TOOLS.map((t) => (
        <ToolButton
          key={t.id}
          label={t.label}
          Icon={t.Icon}
          hint={hint === t.id}
          onPointerEnter={() => setHint(t.id)}
          onPointerLeave={() => setHint(null)}
        />
      ))}
    </ToolbarShell>
  );
}

function TooltipsAfter() {
  const [hint, setHint] = useState<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warm = useRef(false);

  const enter = (id: string) => {
    if (groupTimer.current) clearTimeout(groupTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
    if (warm.current) {
      setHint(id);
      return;
    }
    openTimer.current = setTimeout(() => {
      warm.current = true;
      setHint(id);
    }, 450);
  };

  const leave = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    setHint(null);
    if (groupTimer.current) clearTimeout(groupTimer.current);
    groupTimer.current = setTimeout(() => {
      warm.current = false;
    }, 400);
  };

  return (
    <ToolbarShell>
      {TOOLS.map((t) => (
        <ToolButton
          key={t.id}
          label={t.label}
          Icon={t.Icon}
          hint={hint === t.id}
          onPointerEnter={() => enter(t.id)}
          onPointerLeave={leave}
        />
      ))}
    </ToolbarShell>
  );
}

/* ------------------------------------------------------------------ *
 * The page
 * ------------------------------------------------------------------ */

export function MuiBaseUiDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Type the code straight through, or paste the whole thing at once."
        before={<CodeBefore />}
        after={<CodeAfter />}
      />

      <BeforeAfter
        principle="Drag the word Seats sideways instead of retyping the number. Hold Shift for tens."
        before={<SeatsBefore />}
        after={<SeatsAfter />}
      />

      <BeforeAfter
        principle="Type a name instead of hunting the list, and press Backspace to take someone off."
        before={<InviteBefore />}
        after={<InviteAfter />}
      />

      <BeforeAfter
        principle="The list opens right where your current choice already is."
        before={<SortBefore />}
        after={<SortAfter />}
      />

      <BeforeAfter
        principle="The handles cannot cross each other, and the bar itself is draggable."
        before={<PriceBefore />}
        after={<PriceAfter />}
      />

      <BeforeAfter
        principle="TODO: plain-language principle."
        before={<FaqBefore />}
        after={<FaqAfter />}
      />

      <BeforeAfter
        principle="Hover the stack and it waits for you. Flick one sideways to clear it."
        before={<NotesBefore />}
        after={<NotesAfter />}
      />

      <BeforeAfter
        principle="Flick the sheet down to close it."
        before={<SheetBefore />}
        after={<SheetAfter />}
      />

      <BeforeAfter
        principle="Labels stop flashing at you as you pass over the toolbar."
        before={<TooltipsBefore />}
        after={<TooltipsAfter />}
      />
    </div>
  );
}
