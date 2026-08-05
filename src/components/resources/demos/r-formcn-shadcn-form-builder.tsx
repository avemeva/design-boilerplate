"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronsUpDown,
  CircleAlert,
  Eye,
  EyeOff,
  FileText,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Formcn — the shadcn form builder.
 *
 * Its palette is 16 field types (Input, Textarea, Password, OTP,
 * Checkbox, Switch, Date Picker, Tag Input, Select, Combobox, Multi
 * select, Toggle, Radio, Slider, Rating, File upload) plus 3 display
 * elements (Text, Social buttons, Separator), each with label / name /
 * placeholder / description / options / required / width attributes,
 * type-specific constraints (stars, max size, max files, accept, date
 * mode, min-max-step), a responsive grid, multi-step with a stepper,
 * and zod validation.
 *
 * The ones a person filling the form can actually *see* are rebuilt
 * here as a switch. The code export, the registry CLI, the AI
 * scaffolder and the template gallery were left where they were.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ── 1 · the form tells you which answer is wrong ─────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ValidationPair({ after }: Side) {
  const [email, setEmail] = useState("ada@");
  const [password, setPassword] = useState("hunter2");
  const [terms, setTerms] = useState(false);
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const errors = {
    email: !email.trim()
      ? "Enter your work email."
      : !EMAIL_RE.test(email)
        ? "This needs an @ and a domain, like ada@company.com."
        : null,
    password:
      password.length < 8 ? "Passwords need at least 8 characters." : null,
    terms: terms ? null : "Tick the box to carry on.",
  };
  const bad = Boolean(errors.email || errors.password || errors.terms);

  return (
    <form
      className="max-w-sm space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!bad) {
          setTried(false);
          setDone(true);
          return;
        }
        setDone(false);
        setTried(true);
        if (after) {
          if (errors.email) emailRef.current?.focus();
          else if (errors.password) passwordRef.current?.focus();
        }
      }}
    >
      <AnimatePresence initial={false}>
        {!after && tried && bad && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="text-caption text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg px-3 py-2"
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
            Something is wrong. Please check the form and try again.
          </motion.p>
        )}
      </AnimatePresence>

      <Field label="Work email" htmlFor="v-email">
        <Input
          id="v-email"
          ref={emailRef}
          className="h-9"
          value={email}
          aria-invalid={after && tried && Boolean(errors.email)}
          onChange={(e) => {
            setEmail(e.target.value);
            setDone(false);
          }}
        />
        {after && tried && errors.email && (
          <p className="text-caption text-destructive flex items-center gap-1.5">
            <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {errors.email}
          </p>
        )}
      </Field>

      <Field label="Password" htmlFor="v-password">
        <Input
          id="v-password"
          ref={passwordRef}
          type="password"
          className="h-9"
          value={password}
          aria-invalid={after && tried && Boolean(errors.password)}
          onChange={(e) => {
            setPassword(e.target.value);
            setDone(false);
          }}
        />
        {after && tried && errors.password && (
          <p className="text-caption text-destructive flex items-center gap-1.5">
            <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {errors.password}
          </p>
        )}
      </Field>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="v-terms"
            checked={terms}
            aria-invalid={after && tried && Boolean(errors.terms)}
            onCheckedChange={(c) => {
              setTerms(c === true);
              setDone(false);
            }}
          />
          <Label htmlFor="v-terms" className="text-muted-foreground">
            I accept the terms
          </Label>
        </div>
        {after && tried && errors.terms && (
          <p className="text-caption text-destructive flex items-center gap-1.5">
            <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {errors.terms}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg">
          Create account
        </Button>
        {done && (
          <p className="text-caption text-positive">Account created.</p>
        )}
      </div>
    </form>
  );
}

/* ── 2 · skills become chips ──────────────────────────────────────── */

function TagPair({ after }: Side) {
  const [raw, setRaw] = useState("react, typescript, motion");
  const [tags, setTags] = useState(["react", "typescript", "motion"]);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const value = draft.trim().replace(/,+$/, "").trim();
    if (value && !tags.includes(value)) setTags((t) => [...t, value]);
    setDraft("");
  };

  if (!after) {
    return (
      <div className="max-w-sm">
        <Field
          label="Skills"
          htmlFor="t-before"
          hint="Separate each one with a comma."
        >
          <Input
            id="t-before"
            className="h-9"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </Field>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <Field label="Skills" htmlFor="t-after" hint="Press Enter after each one.">
        <div
          className="focus-within:border-ring focus-within:ring-ring/50 border-input flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border p-1 transition-colors focus-within:ring-3"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) inputRef.current?.focus();
          }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {tags.map((tag) => (
              <motion.span
                key={tag}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                className="bg-secondary text-secondary-foreground text-caption flex h-7 items-center gap-1 rounded-full py-0 pr-1 pl-2.5"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => setTags((t) => t.filter((x) => x !== tag))}
                  className="hover:bg-background focus-visible:ring-ring/50 grid size-5 place-items-center rounded-full outline-none transition-colors focus-visible:ring-3"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          <input
            id="t-after"
            ref={inputRef}
            value={draft}
            placeholder={tags.length ? "" : "react"}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={add}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add();
              }
              if (e.key === "Backspace" && !draft) setTags((t) => t.slice(0, -1));
            }}
            className="text-ui-sm placeholder:text-muted-foreground h-8 min-w-24 flex-1 bg-transparent px-1.5.5 outline-none"
          />
        </div>
      </Field>
    </div>
  );
}

/* ── 3 · a list you can type into ─────────────────────────────────── */

const COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "India",
  "Ireland",
  "Italy",
  "Japan",
  "Kenya",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Poland",
  "Portugal",
  "Singapore",
  "South Africa",
  "Spain",
  "Sweden",
  "Switzerland",
  "United Kingdom",
  "United States",
];

function CountryPair({ after }: Side) {
  const [value, setValue] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const matches = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!after) {
    return (
      <div className="max-w-sm">
        <Field label="Country" htmlFor="c-before">
          <Select
            value={value ?? undefined}
            onValueChange={(v) => setValue(v)}
          >
            <SelectTrigger id="c-before" className="h-9 w-full">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <div className="space-y-1.5">
        <Label htmlFor="c-after">Country</Label>
        <div className="relative">
          <button
            id="c-after"
            type="button"
            aria-expanded={open}
            onClick={() => {
              setOpen((o) => !o);
              setQuery("");
            }}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 text-ui-sm flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-2.5 text-left outline-none transition-colors focus-visible:ring-3"
          >
            <span className={value ? "" : "text-muted-foreground"}>
              {value ?? "Select a country"}
            </span>
            <ChevronsUpDown
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: duration.fast, ease: ease.outQuart }}
                className="bg-popover shadow-floating absolute inset-x-0 top-full z-20 mt-1.5 origin-top rounded-xl"
              >
                <div className="flex items-center gap-2 border-b px-3">
                  <Search
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <input
                    ref={(el) => el?.focus()}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setOpen(false);
                      if (e.key === "Enter" && matches[0]) {
                        e.preventDefault();
                        setValue(matches[0]);
                        setOpen(false);
                      }
                    }}
                    placeholder="Search countries"
                    aria-label="Search countries"
                    className="text-ui-sm placeholder:text-muted-foreground h-10 w-full bg-transparent outline-none"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto p-1">
                  {matches.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setValue(c);
                        setOpen(false);
                      }}
                      className="text-ui-sm hover:bg-secondary focus-visible:bg-secondary flex h-9 w-full items-center justify-between rounded-md px-2.5 text-left outline-none transition-colors"
                    >
                      {c}
                      {value === c && (
                        <Check className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                  {matches.length === 0 && (
                    <p className="text-caption text-muted-foreground px-2.5 py-3">
                      Nothing matches “{query}”.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── 4 · the code lands in its own boxes ──────────────────────────── */

const SLOTS = ["one", "two", "three", "four", "five", "six"];

function OtpPair({ after }: Side) {
  const [single, setSingle] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const filled = after ? digits.every(Boolean) : single.length === 6;

  return (
    <div className="max-w-sm space-y-3">
      {!after ? (
        <Field
          label="Verification code"
          htmlFor="o-before"
          hint="We sent a code to ada@company.com."
        >
          <Input
            id="o-before"
            className="h-9"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={single}
            onChange={(e) =>
              setSingle(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
        </Field>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="o-after-0">Verification code</Label>
          <div className="flex gap-2" role="group" aria-label="Verification code">
            {SLOTS.map((slot, i) => (
              <input
                key={slot}
                id={`o-after-${i}`}
                value={digits[i]}
                ref={(el) => {
                  boxes.current[i] = el;
                }}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Digit ${i + 1} of 6`}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(-1);
                  setDigits((prev) => prev.map((x, j) => (j === i ? v : x)));
                  if (v && i < 5) boxes.current[i + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) {
                    e.preventDefault();
                    setDigits((prev) =>
                      prev.map((x, j) => (j === i - 1 ? "" : x)),
                    );
                    boxes.current[i - 1]?.focus();
                  }
                  if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
                  if (e.key === "ArrowRight" && i < 5)
                    boxes.current[i + 1]?.focus();
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = e.clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(0, 6);
                  if (!text) return;
                  setDigits((prev) =>
                    prev.map((x, j) => (j < text.length ? text[j] : x)),
                  );
                  boxes.current[Math.min(text.length, 5)]?.focus();
                }}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 text-ui size-9 rounded-lg border text-center tabular-nums outline-none transition-colors focus-visible:ring-3"
              />
            ))}
          </div>
          <p className="text-caption text-muted-foreground">
            We sent a code to ada@company.com.
          </p>
        </div>
      )}

      {filled && <p className="text-caption text-positive">Code accepted.</p>}
    </div>
  );
}

/* ── 5 · look at what you typed ───────────────────────────────────── */

function PasswordPair({ after }: Side) {
  const [value, setValue] = useState("correct horse b");
  const [shown, setShown] = useState(false);

  return (
    <div className="max-w-sm">
      <Field
        label="Choose a password"
        htmlFor="p-field"
        hint="At least 8 characters."
      >
        {after ? (
          <InputGroup className="h-9">
            <InputGroupInput
              id="p-field"
              type={shown ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                aria-label={shown ? "Hide password" : "Show password"}
                aria-pressed={shown}
                onClick={() => setShown((s) => !s)}
              >
                {shown ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        ) : (
          <Input
            id="p-field"
            type="password"
            className="h-9"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
      </Field>
    </div>
  );
}

/* ── 6 · tap the stars ────────────────────────────────────────────── */

const SCORES = ["Terrible", "Poor", "Fine", "Good", "Excellent"];

function RatingPair({ after }: Side) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  if (!after) {
    return (
      <div className="max-w-sm">
        <Field label="How was the delivery?" htmlFor="r-before">
          <Select
            value={value ? String(value) : undefined}
            onValueChange={(v) => setValue(Number(v))}
          >
            <SelectTrigger id="r-before" className="h-9 w-full">
              <SelectValue placeholder="Pick a score" />
            </SelectTrigger>
            <SelectContent>
              {SCORES.map((s, i) => (
                <SelectItem key={s} value={String(i + 1)}>
                  {i + 1} — {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-1.5">
      <p className="text-ui-sm font-medium">How was the delivery?</p>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center"
          onPointerLeave={() => setHover(0)}
          role="group"
          aria-label="How was the delivery?"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} out of 5 — ${SCORES[n - 1]}`}
              aria-pressed={value === n}
              onPointerEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => setValue(n)}
              className="focus-visible:ring-ring/50 grid size-9 place-items-center rounded-md outline-none focus-visible:ring-3"
            >
              <motion.span
                animate={{ scale: n <= shown ? 1 : 0.92 }}
                transition={{ duration: duration.instant, ease: ease.outQuart }}
              >
                <Star
                  className={cn(
                    "size-5 transition-colors",
                    n <= shown
                      ? "fill-foreground text-foreground"
                      : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
              </motion.span>
            </button>
          ))}
        </div>
        <span className="text-caption text-muted-foreground">
          {shown ? SCORES[shown - 1] : "Not rated yet"}
        </span>
      </div>
    </div>
  );
}

/* ── 7 · a number that cannot go silly ────────────────────────────── */

const MIN = 10;
const MAX = 200;
const STEP = 5;

function BudgetPair({ after }: Side) {
  const [text, setText] = useState("60");
  const [value, setValue] = useState(60);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const amount = after ? value : Number(text.replace(/[^\d.-]/g, "")) || 0;
  const pct = ((value - MIN) / (MAX - MIN)) * 100;

  const setFromX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = MIN + p * (MAX - MIN);
    setValue(Math.min(MAX, Math.max(MIN, Math.round(raw / STEP) * STEP)));
  };

  return (
    <div className="max-w-sm space-y-4">
      {!after ? (
        <Field
          label="Monthly budget"
          htmlFor="b-before"
          hint="Between 10 and 200."
        >
          <Input
            id="b-before"
            className="h-9 w-32 tabular-nums"
            inputMode="numeric"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
      ) : (
        <div className="space-y-1.5">
          <p className="text-ui-sm font-medium">Monthly budget</p>
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="Monthly budget"
            aria-valuemin={MIN}
            aria-valuemax={MAX}
            aria-valuenow={value}
            aria-valuetext={`${value} dollars a month`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              dragging.current = true;
              setFromX(e.clientX);
            }}
            onPointerMove={(e) => {
              if (dragging.current) setFromX(e.clientX);
            }}
            onPointerUp={(e) => {
              dragging.current = false;
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                setValue((v) => Math.min(MAX, v + STEP));
              }
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                setValue((v) => Math.max(MIN, v - STEP));
              }
            }}
            className="focus-visible:ring-ring/50 relative flex h-9 w-full touch-none items-center rounded-lg outline-none select-none focus-visible:ring-3"
          >
            <div className="bg-secondary h-1.5 w-full rounded-full">
              <div
                className="bg-foreground h-1.5 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div
              className="bg-foreground border-card absolute size-4 rounded-full border"
              style={{ left: `calc(${pct}% - 8px)` }}
            />
          </div>
          <div className="text-caption text-muted-foreground flex justify-between tabular-nums">
            <span>$10</span>
            <span>$200</span>
          </div>
        </div>
      )}

      <p className="text-ui text-muted-foreground">
        You pay{" "}
        <span className="text-foreground tabular-nums">
          <NumberFlow
            value={amount}
            format={{
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }}
          />
        </span>{" "}
        a month.
      </p>
    </div>
  );
}

/* ── 8 · you can see what you attached ────────────────────────────── */

type Picked = { name: string; size: number };

const SEED: Picked[] = [
  { name: "brief.pdf", size: 284_112 },
  { name: "moodboard.png", size: 1_942_388 },
];

function kb(bytes: number) {
  return bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

function UploadPair({ after }: Side) {
  const [files, setFiles] = useState<Picked[]>(SEED);
  const [over, setOver] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const take = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({ name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...next].slice(0, 3));
  };

  if (!after) {
    return (
      <div className="max-w-sm">
        <Field label="Attachments" htmlFor="u-before">
          <Input id="u-before" type="file" multiple className="h-9 py-1.5" />
        </Field>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-3">
      <p className="text-ui-sm font-medium">Attachments</p>
      <button
        type="button"
        onClick={() => picker.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={cn(
          "border-input hover:bg-secondary focus-visible:ring-ring/50 w-full rounded-xl border border-dashed p-5 text-center outline-none transition-colors focus-visible:ring-3",
          over && "border-ring bg-secondary",
        )}
      >
        <Upload
          className="text-muted-foreground mx-auto size-5"
          aria-hidden="true"
        />
        <span className="text-ui-sm mt-2 block">
          Drop files here, or click to browse
        </span>
        <span className="text-caption text-muted-foreground mt-0.5 block">
          PDF or PNG · up to 3 files · 5 MB each
        </span>
      </button>
      <input
        ref={picker}
        type="file"
        multiple
        className="sr-only"
        aria-label="Attach files"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />

      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {files.map((f) => (
            <motion.li
              key={f.name}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: duration.fast, ease: ease.outQuart }}
              className="bg-secondary flex items-center gap-2.5 rounded-lg py-1 pr-1 pl-2.5"
            >
              <FileText
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden="true"
              />
              <span className="text-ui-sm flex-1 truncate">{f.name}</span>
              <span className="text-caption text-muted-foreground tabular-nums">
                {kb(f.size)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() =>
                  setFiles((prev) => prev.filter((x) => x.name !== f.name))
                }
                className="text-muted-foreground hover:text-foreground hover:bg-card focus-visible:ring-ring/50 grid size-7 shrink-0 place-items-center rounded-md outline-none transition-colors focus-visible:ring-3"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {files.length >= 3 && (
        <p className="text-caption text-muted-foreground">
          That is the three files. Remove one to add another.
        </p>
      )}
    </div>
  );
}

/* ── 9 · short answers stop hogging a line ────────────────────────── */

const ADDRESS = [
  { id: "street", label: "Street", span: "md:col-span-6", ph: "12 Bank Street" },
  { id: "city", label: "City", span: "md:col-span-3", ph: "Edinburgh" },
  { id: "region", label: "Region", span: "md:col-span-3", ph: "Midlothian" },
  { id: "postcode", label: "Postcode", span: "md:col-span-2", ph: "EH1 2AB" },
  { id: "country", label: "Country", span: "md:col-span-4", ph: "Scotland" },
];

function GridPair({ after }: Side) {
  return (
    <div className="grid max-w-lg grid-cols-1 gap-3 md:grid-cols-6">
      {ADDRESS.map((f) => (
        <Field
          key={f.id}
          label={f.label}
          htmlFor={`g-${f.id}`}
          className={after ? f.span : "md:col-span-6"}
        >
          <Input
            id={`g-${f.id}`}
            className="h-9"
            placeholder={f.ph}
            defaultValue={f.ph}
          />
        </Field>
      ))}
    </div>
  );
}

/* ── 10 · three short pages, not one long one ─────────────────────── */

type WField = {
  name: string;
  label: string;
  kind?: "textarea" | "select";
  ph?: string;
  options?: string[];
};

const WIZARD: { title: string; fields: WField[] }[] = [
  {
    title: "You",
    fields: [
      { name: "name", label: "Full name", ph: "Ada Lovelace" },
      { name: "email", label: "Work email", ph: "ada@company.com" },
      { name: "phone", label: "Phone", ph: "+44 7700 900000" },
    ],
  },
  {
    title: "Company",
    fields: [
      { name: "company", label: "Company", ph: "Analytical Engines" },
      {
        name: "size",
        label: "Team size",
        kind: "select",
        options: ["Just me", "2–10", "11–50", "51 or more"],
      },
      { name: "role", label: "Your role", ph: "Head of design" },
    ],
  },
  {
    title: "Project",
    fields: [
      { name: "project", label: "Project name", ph: "Difference Engine" },
      { name: "start", label: "Start date", ph: "March 2026" },
      {
        name: "notes",
        label: "Anything we should know",
        kind: "textarea",
        ph: "Tell us about it",
      },
    ],
  },
];

function WizardField({
  field,
  value,
  onChange,
}: {
  field: WField;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  const id = `w-${field.name}`;
  return (
    <Field label={field.label} htmlFor={id}>
      {field.kind === "textarea" ? (
        <Textarea
          id={id}
          placeholder={field.ph}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.kind === "select" ? (
        <Select value={value ?? undefined} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-9 w-full">
            <SelectValue placeholder="Choose one" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          className="h-9"
          placeholder={field.ph}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

function StepsPair({ after }: Side) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const set = (name: string) => (v: string) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  if (!after) {
    return (
      <div className="max-w-sm">
        <div className="max-h-72 space-y-4 overflow-y-auto pr-2">
          {WIZARD.flatMap((s) => s.fields).map((f) => (
            <WizardField
              key={f.name}
              field={f}
              value={values[f.name]}
              onChange={set(f.name)}
            />
          ))}
          <Button
            type="button"
            size="lg"
            onClick={() => setDone(true)}
            className="w-full"
          >
            Create project
          </Button>
          {done && (
            <p className="text-caption text-positive">Project created.</p>
          )}
        </div>
      </div>
    );
  }

  const current = WIZARD[step];
  const last = step === WIZARD.length - 1;

  return (
    <div className="max-w-sm space-y-4">
      <ol className="flex items-center gap-2">
        {WIZARD.map((s, i) => (
          <li key={s.title} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "text-micro grid size-6 shrink-0 place-items-center rounded-full tabular-nums transition-colors",
                i < step
                  ? "bg-foreground text-background"
                  : i === step
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-caption truncate",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.title}
            </span>
            {i < WIZARD.length - 1 && <span className="bg-border h-px flex-1" />}
          </li>
        ))}
      </ol>

      <p className="text-caption text-muted-foreground">
        Step {step + 1} of {WIZARD.length}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.title}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: duration.fast, ease: ease.outQuart }}
          className="space-y-4"
        >
          {current.fields.map((f) => (
            <WizardField
              key={f.name}
              field={f}
              value={values[f.name]}
              onChange={set(f.name)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={() => {
            if (last) setDone(true);
            else setStep((s) => s + 1);
          }}
        >
          {last ? "Create project" : "Next"}
          {!last && <ArrowRight aria-hidden="true" />}
        </Button>
        {done && last && (
          <p className="text-caption text-positive">Project created.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function FormcnShadcnFormBuilderDemo() {
  return (
    <div>
      <BeforeAfter
        principle="It points at the answer that is wrong instead of making you hunt for it."
        before={<ValidationPair after={false} />}
        after={<ValidationPair after />}
      />
      <BeforeAfter
        principle="Each skill becomes its own chip, so you can drop one without retyping the rest."
        before={<TagPair after={false} />}
        after={<TagPair after />}
      />
      <BeforeAfter
        principle="Type two letters instead of scrolling past thirty countries."
        before={<CountryPair after={false} />}
        after={<CountryPair after />}
      />
      <BeforeAfter
        principle="It moves along on its own, and pasting the whole code just works."
        before={<OtpPair after={false} />}
        after={<OtpPair after />}
      />
      <BeforeAfter
        principle="You can look at what you typed before you commit to it."
        before={<PasswordPair after={false} />}
        after={<PasswordPair after />}
      />
      <BeforeAfter
        principle="TODO: plain-language principle."
        before={<RatingPair after={false} />}
        after={<RatingPair after />}
      />
      <BeforeAfter
        principle="Drag to the amount you want. You cannot land on one that makes no sense."
        before={<BudgetPair after={false} />}
        after={<BudgetPair after />}
      />
      <BeforeAfter
        principle="You can see what you attached, and take one back out."
        before={<UploadPair after={false} />}
        after={<UploadPair after />}
      />
      <BeforeAfter
        principle="Short answers stop taking up a whole line each."
        before={<GridPair after={false} />}
        after={<GridPair after />}
      />
      <BeforeAfter
        principle="Three short pages instead of one long scroll."
        before={<StepsPair after={false} />}
        after={<StepsPair after />}
      />
    </div>
  );
}
