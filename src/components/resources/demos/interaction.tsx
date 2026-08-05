"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Orb } from "@/components/app/orb";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Web Interface Guidelines — four of its rules, wired up so you can
 * feel the difference rather than read it.
 * ------------------------------------------------------------------ */

export function GuidelinesDemo() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2.5">
        <p className="text-caption text-muted-foreground">
          <strong className="text-foreground">Right.</strong> Click the word
          “Email” — the field focuses. Press Enter in it — the form submits.
          The button disables while in flight, and the error lands on the field.
        </p>
        <form
          className="bg-card space-y-2 rounded-lg border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("email");
            setBusy(true);
            setError(false);
            setTimeout(() => {
              setBusy(false);
              if (String(value).includes("@")) setSent(true);
              else setError(true);
            }, 700);
          }}
        >
          <label htmlFor="wig-email" className="text-ui block">
            Email
          </label>
          <input
            id="wig-email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@example.com"
            aria-invalid={error}
            aria-describedby={error ? "wig-err" : undefined}
            className={cn(
              "text-ui focus-visible:border-ring h-9 w-full rounded-lg border px-3 outline-none",
              error && "border-destructive",
            )}
          />
          {error && (
            <p id="wig-err" className="text-caption text-destructive">
              That does not look like an email address.
            </p>
          )}
          <Button type="submit" disabled={busy} className="h-9 w-full">
            {busy ? "Sending…" : sent ? "Sent" : "Submit"}
          </Button>
        </form>
      </div>

      <div className="space-y-2.5">
        <p className="text-caption text-muted-foreground">
          <strong className="text-foreground">Wrong.</strong> The label is inert
          text, Enter does nothing, and the only feedback is a toast that fires
          on the other side of the screen.
        </p>
        <div className="bg-card space-y-2 rounded-lg border p-3">
          <span className="text-ui block">Email</span>
          <input
            type="text"
            placeholder="you@example.com"
            className="text-ui focus-visible:border-ring h-9 w-full rounded-lg border px-3 outline-none"
          />
          <Button
            variant="outline"
            className="h-9 w-full"
            onClick={() => toast("Submitted")}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Laws of UX — Fitts's law. The rule the reference sidebar follows:
 * no dead areas between rows; grow the padding, not the margin.
 * ------------------------------------------------------------------ */

export function FittsDemo() {
  const [hits, setHits] = useState({ good: 0, bad: 0 });
  const items = ["Dashboard", "Tasks", "Customers", "Projects"];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-caption text-muted-foreground mb-2">
          <strong className="text-foreground">Padding on the row.</strong> The
          hit area is continuous — you cannot miss between items.
        </p>
        <div
          className="bg-card overflow-hidden rounded-lg border"
          onClick={() => setHits((h) => ({ ...h, good: h.good + 1 }))}
        >
          {items.map((label) => (
            <button
              key={label}
              type="button"
              className="text-ui hover:bg-secondary flex h-10 w-full items-center px-3 text-left transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-caption text-muted-foreground mb-2">
          <strong className="text-foreground">Margin between rows.</strong> The
          gaps are dead — move slowly and you will feel them.
        </p>
        <div
          className="bg-card space-y-2 rounded-lg border p-2"
          onClick={() => setHits((h) => ({ ...h, bad: h.bad + 1 }))}
        >
          {items.map((label) => (
            <button
              key={label}
              type="button"
              // taste-check-ignore: this control is deliberately too
              // short — it is the counter-example.
              className="text-ui hover:bg-secondary flex h-7 w-full items-center rounded-md px-3 text-left transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-caption text-muted-foreground sm:col-span-2">
        Clicks landing anywhere in the container — left{" "}
        <span className="text-foreground tabular-nums">{hits.good}</span>, right{" "}
        <span className="text-foreground tabular-nums">{hits.bad}</span>. The
        right one is where the misses go.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Design Spells / Details That Make Interfaces Feel Better —
 * feedback belongs on the trigger, not in a toast.
 * ------------------------------------------------------------------ */

export function InlineFeedbackDemo() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-caption text-muted-foreground mb-2">
          <strong className="text-foreground">On the trigger.</strong> Your eye
          is already here.
        </p>
        <div className="bg-card flex items-center gap-2 rounded-lg border p-1.5 pl-3">
          <code className="flex-1 font-mono text-xs">npm i motion</code>
          <Button
            variant="ghost"
            size="icon"
            aria-label={copied ? "Copied" : "Copy"}
            onClick={() => {
              navigator.clipboard.writeText("npm i motion");
              setCopied(true);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => setCopied(false), 1600);
            }}
          >
            {copied ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <div>
        <p className="text-caption text-muted-foreground mb-2">
          <strong className="text-foreground">In a toast.</strong> Attention has
          to travel to find it.
        </p>
        <div className="bg-card flex items-center gap-2 rounded-lg border p-1.5 pl-3">
          <code className="flex-1 font-mono text-xs">npm i motion</code>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Copy"
            onClick={() => {
              navigator.clipboard.writeText("npm i motion");
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sonner — what a toast IS for: something that happened away from the
 * user's attention.
 * ------------------------------------------------------------------ */

export function SonnerDemo() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="h-9"
          onClick={() =>
            toast.success("Invoice #INV-S0081 was paid", {
              description: "€9,999.00 from Ethan Ross",
            })
          }
        >
          Background event
        </Button>
        <Button
          variant="outline"
          className="h-9"
          onClick={() =>
            toast("Row deleted", {
              action: { label: "Undo", onClick: () => toast("Restored") },
            })
          }
        >
          Destructive + undo
        </Button>
        <Button
          variant="outline"
          className="h-9"
          onClick={() => {
            const id = toast.loading("Exporting…");
            setTimeout(() => toast.success("Export ready", { id }), 1500);
          }}
        >
          Promise, resolved in place
        </Button>
      </div>
      <p className="text-caption text-muted-foreground">
        All three are things happening <em>away</em> from where the user is
        looking. Undo instead of a confirm dialog is the pattern worth stealing:
        it protects the rare mistake without interrupting everyone else.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * cmdk — the command palette, keyboard-first.
 * ------------------------------------------------------------------ */

const COMMANDS = [
  { group: "Navigate", items: ["Dashboard", "Invoices", "Customers"] },
  { group: "Create", items: ["New invoice", "New customer"] },
  { group: "Theme", items: ["Toggle dark mode"] },
];

export function CommandDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <div className="bg-card overflow-hidden rounded-xl border">
        <Command className="bg-transparent">
          <CommandInput placeholder="Type to filter…" value={value} onValueChange={setValue} />
          <CommandList className="max-h-56">
            <CommandEmpty>No results.</CommandEmpty>
            {COMMANDS.map(({ group, items }) => (
              <CommandGroup key={group} heading={group}>
                {items.map((i) => (
                  <CommandItem key={i} onSelect={() => toast(i)}>
                    {i}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </div>
      <p className="text-caption text-muted-foreground">
        Arrow keys move, <Kbd>Enter</Kbd> selects — cmdk supplies the matching
        and roving focus. Everything visible here is shadcn’s{" "}
        <code className="font-mono text-[0.9em]">command</code>, which is cmdk
        with this project’s tokens applied.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Hashvatar — deterministic identity from a string, no storage.
 * ------------------------------------------------------------------ */

export function HashvatarDemo() {
  const [seed, setSeed] = useState("kentucky-llc");
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Orb seed={seed} size="lg" />
        <Orb seed={seed + "-2"} size="lg" />
        <Orb seed={seed + "-3"} size="lg" />
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          aria-label="Avatar seed"
          spellCheck={false}
          className="text-ui focus-visible:border-ring bg-card h-9 flex-1 rounded-lg border px-3 outline-none"
        />
      </div>
      <p className="text-caption text-muted-foreground">
        Type — the orbs change and stay stable for that string. Hash the
        seed, derive a hue, pick a near neighbour for the gradient so the
        set reads as one family. This is the workspace mark in the rail
        on the left.
      </p>
    </div>
  );
}
