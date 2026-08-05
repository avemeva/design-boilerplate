"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * cult-ui / Onboarding — one 885-line components/ui/onboarding.tsx.
 *
 * Not installed here. Every switch below is that file's behaviour
 * rebuilt inline and retokenized: handleNext exhausting stepValue
 * before currentStep, handleBack restoring maxStepValue, the
 * canGoNext(step, stepValue) predicate, canGoBack, the dots/pills
 * StepIndicator states, ChoiceGroup's label-wrapped sr-only radio in
 * both grid and vertical orientation, FeatureCarousel's roving tabindex
 * and arrow keys, TipsList, and Navigation's completeLabel branch.
 * ------------------------------------------------------------------ */

const FEATURES = [
  {
    title: "One board for everything",
    body: "Projects, drafts and reviews all sit in the same place.",
  },
  {
    title: "Search finds people too",
    body: "Type a name and everything they touched comes up.",
  },
  {
    title: "Nothing to file",
    body: "Work sorts itself as you go. No folders to keep tidy.",
  },
] as const;

const LAST = FEATURES.length - 1;

const ROLES = ["Design", "Engineering", "Research"] as const;

const TIPS = [
  { key: "⌘K", text: "Search anything from anywhere" },
  { key: "P", text: "Pin a project to keep it on top" },
  { key: "I", text: "Invite a teammate from the top bar" },
] as const;

const STEPS = [
  { title: "Welcome", body: "A quick look at what changed." },
  { title: "Your role", body: "So the board opens on the right view." },
  { title: "Your team", body: "We'll suggest people to follow." },
  { title: "You're set", body: "Three things worth knowing." },
] as const;

/* ── shared shell ─────────────────────────────────────────────────── */

function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background rounded-xl p-4 sm:p-6">
      <div className="bg-card mx-auto max-w-md rounded-xl border p-5">
        {children}
      </div>
    </div>
  );
}

function Footer({
  canBack,
  onBack,
  canNext,
  onNext,
  nextLabel = "Next",
}: {
  canBack: boolean;
  onBack: () => void;
  canNext: boolean;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-5 flex gap-2 border-t pt-4">
      <Button
        variant="outline"
        size="lg"
        className="flex-1"
        disabled={!canBack}
        onClick={onBack}
      >
        Back
      </Button>
      <Button size="lg" className="flex-1" disabled={!canNext} onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
}

/** StepIndicator, pills variant: completed is inked, current is wide. */
function Pills({ step, total }: { step: number; total: number }) {
  return (
    <div
      role="progressbar"
      aria-label={`Step ${step} of ${total}`}
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      className="flex items-center gap-1.5"
    >
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const state = n === step ? "active" : n < step ? "completed" : "inactive";
        return (
          <span
            key={n}
            data-state={state}
            aria-current={n === step ? "step" : undefined}
            className={cn(
              "duration-base ease-out-quart h-1 rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform]",
              state === "active" && "bg-accent-solid w-8",
              state === "completed" && "bg-foreground w-4",
              state === "inactive" && "bg-border-strong w-4",
            )}
          />
        );
      })}
    </div>
  );
}

/** The version most products ship: current is dark, everything else grey. */
function Dots({ step, total }: { step: number; total: number }) {
  return (
    <div
      role="progressbar"
      aria-label={`Step ${step} of ${total}`}
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      className="flex items-center gap-1.5"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i + 1}
          className={cn(
            "size-2 rounded-full",
            i + 1 === step ? "bg-foreground" : "bg-border-strong",
          )}
        />
      ))}
    </div>
  );
}

/** FeatureCarousel: roving tabindex, arrow keys, one visible item. */
function Tour({
  index,
  onIndex,
}: {
  index: number;
  onIndex: (i: number) => void;
}) {
  return (
    <div>
      <div className="min-h-16">
        <p className="text-ui text-foreground">{FEATURES[index].title}</p>
        <p className="text-caption text-muted-foreground mt-1">
          {FEATURES[index].body}
        </p>
      </div>
      <div role="tablist" aria-label="Features" className="mt-2 flex gap-1.5">
        {FEATURES.map((f, i) => (
          <button
            key={f.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={f.title}
            tabIndex={i === index ? 0 : -1}
            onClick={() => onIndex(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                onIndex(Math.min(index + 1, LAST));
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                onIndex(Math.max(index - 1, 0));
              }
            }}
            className="focus-visible:ring-ring/50 flex h-9 w-10 items-center rounded-md outline-none focus-visible:ring-3"
          >
            <span
              aria-hidden
              className={cn(
                "duration-fast ease-out-quart block h-1 w-full rounded-full transition-colors",
                i === index ? "bg-foreground" : "bg-border-strong",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** TipsList. */
function Tips() {
  return (
    <ol aria-label="Tips" className="divide-y">
      {TIPS.map((t) => (
        <li key={t.key} className="flex items-center gap-3 py-2.5 first:pt-0">
          <Kbd className="shrink-0">{t.key}</Kbd>
          <span className="text-caption text-muted-foreground">{t.text}</span>
        </li>
      ))}
    </ol>
  );
}

/** ChoiceGroup.Item, the shipped-normal reach: only the circle answers. */
function TinyChoiceRow({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-t px-3 py-3 first:border-t-0">
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={label}
        onClick={onSelect}
        className={cn(
          "size-5 shrink-0 rounded-full border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          selected ? "border-accent-solid bg-accent-solid" : "border-border-strong",
        )}
      >
        {selected && (
          <Check aria-hidden className="mx-auto size-3 text-primary-foreground" />
        )}
      </button>
      <span className="text-ui-sm text-foreground">{label}</span>
    </div>
  );
}

/** ChoiceGroup.Item: a label around an sr-only radio — the row answers. */
function WideChoiceRow({
  name,
  label,
  selected,
  onSelect,
}: {
  name: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      data-state={selected ? "selected" : "unselected"}
      className={cn(
        "duration-fast ease-out-quart flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors",
        "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        selected
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-secondary",
      )}
    >
      <input
        type="radio"
        name={name}
        value={label}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-accent-solid bg-accent-solid" : "border-border-strong",
        )}
      >
        {selected && <Check className="size-3 text-primary-foreground" />}
      </span>
      <span className="text-ui-sm">{label}</span>
    </label>
  );
}

/* ── 1 · Next walks the tour before it leaves ─────────────────────── */

function WalkPair({ after }: { after: boolean }) {
  const [step, setStep] = useState(1);
  const [sub, setSub] = useState(0);

  const next = () => {
    if (after && step === 1 && sub < LAST) setSub(sub + 1);
    else if (step === 1) setStep(2);
  };
  const back = () => {
    if (step === 2) setStep(1);
    else if (sub > 0) setSub(sub - 1);
  };

  return (
    <Stage>
      <Pills step={step} total={2} />
      <div className="mt-4">
        {step === 1 ? (
          <Tour index={sub} onIndex={setSub} />
        ) : (
          <div className="min-h-16">
            <p className="text-ui text-foreground">That's the tour</p>
            <p className="text-caption text-muted-foreground mt-1">
              You saw {sub + 1} of {FEATURES.length}.
            </p>
          </div>
        )}
      </div>
      <Footer
        canBack={step > 1 || sub > 0}
        onBack={back}
        canNext={step === 1}
        onNext={next}
        nextLabel="Next"
      />
    </Stage>
  );
}

/* ── 2 · Back lands where you left off ────────────────────────────── */

function ReturnPair({ after }: { after: boolean }) {
  const [step, setStep] = useState(2);
  const [sub, setSub] = useState(LAST);
  const [role, setRole] = useState<string | null>("Design");

  const next = () => {
    if (step === 1 && sub < LAST) setSub(sub + 1);
    else if (step === 1) setStep(2);
  };
  const back = () => {
    if (step === 2) {
      setStep(1);
      setSub(after ? LAST : 0);
    } else if (sub > 0) setSub(sub - 1);
  };

  return (
    <Stage>
      <Pills step={step} total={2} />
      <div className="mt-4">
        {step === 1 ? (
          <Tour index={sub} onIndex={setSub} />
        ) : (
          <div className="min-h-16">
            <p className="text-ui text-foreground">Your role</p>
            <div role="radiogroup" aria-label="Your role" className="mt-2 grid gap-1.5 sm:grid-cols-3">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "text-ui-sm h-9 rounded-lg px-3 transition-colors",
                    role === r
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer
        canBack={step > 1 || sub > 0}
        onBack={back}
        canNext={step === 1}
        onNext={next}
      />
    </Stage>
  );
}

/* ── 3 · the button waits instead of scolding ─────────────────────── */

function GatePair({ after }: { after: boolean }) {
  const [role, setRole] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [scolded, setScolded] = useState(false);

  const next = () => {
    if (role) {
      setDone(true);
      setScolded(false);
    } else setScolded(true);
  };

  return (
    <Stage>
      <Pills step={done ? 3 : 2} total={3} />
      <div className="mt-4 min-h-24">
        {done ? (
          <div>
            <p className="text-ui text-foreground">Opening the {role} board</p>
            <p className="text-caption text-muted-foreground mt-1">
              You can change this later in settings.
            </p>
          </div>
        ) : (
          <>
            <p className="text-ui text-foreground">What do you work on?</p>
            <div
              role="radiogroup"
              aria-label="What do you work on?"
              className="mt-3 grid gap-1.5 sm:grid-cols-3"
            >
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  onClick={() => {
                    setRole(r);
                    setScolded(false);
                  }}
                  className={cn(
                    "text-ui-sm h-11 rounded-lg border px-3 transition-colors",
                    role === r
                      ? "border-accent-solid bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            {!after && scolded && (
              <p role="alert" className="text-caption text-destructive mt-2">
                Please choose one before continuing.
              </p>
            )}
          </>
        )}
      </div>
      <Footer
        canBack={done}
        onBack={() => setDone(false)}
        canNext={after ? role !== null && !done : !done}
        onNext={next}
      />
    </Stage>
  );
}

/* ── 4 · the whole row answers ────────────────────────────────────── */

function ReachPair({ after }: { after: boolean }) {
  const [role, setRole] = useState<string | null>(null);

  return (
    <Stage>
      <p className="text-ui text-foreground">What do you work on?</p>
      <div
        role="radiogroup"
        aria-label="What do you work on?"
        className={cn("mt-3", after ? "space-y-1" : "rounded-lg border")}
      >
        {ROLES.map((r) =>
          after ? (
            <WideChoiceRow
              key={r}
              name="reach-role"
              label={r}
              selected={role === r}
              onSelect={() => setRole(r)}
            />
          ) : (
            <TinyChoiceRow
              key={r}
              label={r}
              selected={role === r}
              onSelect={() => setRole(r)}
            />
          ),
        )}
      </div>
    </Stage>
  );
}

/* ── 5 · progress you can read ────────────────────────────────────── */

function ProgressPair({ after }: { after: boolean }) {
  const [step, setStep] = useState(1);
  const total = STEPS.length;

  return (
    <Stage>
      {after ? <Pills step={step} total={total} /> : <Dots step={step} total={total} />}
      <div className="mt-4 min-h-16">
        <p className="text-ui text-foreground">{STEPS[step - 1].title}</p>
        <p className="text-caption text-muted-foreground mt-1">
          {STEPS[step - 1].body}
        </p>
      </div>
      <Footer
        canBack={step > 1}
        onBack={() => setStep(step - 1)}
        canNext={step < total}
        onNext={() => setStep(step + 1)}
      />
    </Stage>
  );
}

/* ── 6 · the buttons stay put ─────────────────────────────────────── */

function SteadyPair({ after }: { after: boolean }) {
  const [step, setStep] = useState(1);
  const [sub, setSub] = useState(0);
  const [role, setRole] = useState<string | null>("Design");

  const next = () => {
    if (step === 1 && sub < LAST) setSub(sub + 1);
    else if (step < 3) setStep(step + 1);
  };
  const back = () => {
    if (step === 1) setSub(Math.max(0, sub - 1));
    else if (step === 2) {
      setStep(1);
      setSub(LAST);
    } else setStep(step - 1);
  };

  return (
    <Stage>
      <Pills step={step} total={3} />
      <div className={cn("mt-4", after && "h-48 overflow-hidden")}>
        {step === 1 && <Tour index={sub} onIndex={setSub} />}
        {step === 2 && (
          <div>
            <p className="text-ui text-foreground">What do you work on?</p>
            <div role="radiogroup" aria-label="What do you work on?" className="mt-2 space-y-1">
              {ROLES.map((r) => (
                <WideChoiceRow
                  key={r}
                  name="steady-role"
                  label={r}
                  selected={role === r}
                  onSelect={() => setRole(r)}
                />
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <p className="text-ui text-foreground">Worth knowing</p>
            <div className="mt-2">
              <Tips />
            </div>
          </div>
        )}
      </div>
      <Footer
        canBack={step > 1 || sub > 0}
        onBack={back}
        canNext={step < 3}
        onNext={next}
      />
    </Stage>
  );
}

/* ── 7 · the last button says what it does ────────────────────────── */

function FinishPair({ after }: { after: boolean }) {
  const [done, setDone] = useState(false);
  const [spent, setSpent] = useState(false);

  return (
    <Stage>
      <Pills step={3} total={3} />
      <div className="mt-4 h-48 overflow-hidden">
        {after && done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="flex h-full flex-col items-center justify-center gap-2 text-center"
          >
            <span className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
              <Check aria-hidden className="size-4" />
            </span>
            <p className="text-ui text-foreground">Your board is ready</p>
            <button
              type="button"
              onClick={() => setDone(false)}
              className="text-caption text-muted-foreground hover:text-foreground h-9 underline underline-offset-4"
            >
              Run it again
            </button>
          </motion.div>
        ) : (
          <div>
            <p className="text-ui text-foreground">Worth knowing</p>
            <div className="mt-2">
              <Tips />
            </div>
          </div>
        )}
      </div>
      <div className="mt-5 flex gap-2 border-t pt-4">
        <Button variant="outline" size="lg" className="flex-1" disabled>
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={after ? done : spent}
          onClick={() => (after ? setDone(true) : setSpent(true))}
        >
          {after ? "Start creating" : "Next"}
        </Button>
      </div>
    </Stage>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export function OnboardingDemo() {
  return (
    <div>
      <BeforeAfter
        principle="Next takes you through the tour instead of skipping past it."
        before={<WalkPair after={false} />}
        after={<WalkPair after />}
      />
      <BeforeAfter
        principle="Back drops you where you left off, not back at the beginning."
        before={<ReturnPair after={false} />}
        after={<ReturnPair after />}
      />
      <BeforeAfter
        principle="The button waits for you instead of telling you off afterwards."
        before={<GatePair after={false} />}
        after={<GatePair after />}
      />
      <BeforeAfter
        principle="You can press anywhere on the row, not just the little circle."
        before={<ReachPair after={false} />}
        after={<ReachPair after />}
      />
      <BeforeAfter
        principle="You can see how much is behind you, not just where you are."
        before={<ProgressPair after={false} />}
        after={<ProgressPair after />}
      />
      <BeforeAfter
        principle="The buttons stay put instead of jumping as you move through."
        before={<SteadyPair after={false} />}
        after={<SteadyPair after />}
      />
      <BeforeAfter
        principle="The last button says what it does, and shows you it worked."
        before={<FinishPair after={false} />}
        after={<FinishPair after />}
      />
    </div>
  );
}
