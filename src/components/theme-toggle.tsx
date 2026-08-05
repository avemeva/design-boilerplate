"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

/** The value never changes after hydration, so there is nothing to
 *  subscribe to. */
const subscribeNever = () => () => {};

/**
 * Segmented three-way theme control.
 *
 * Renders a fixed-size placeholder before mount so the surrounding
 * layout never shifts — the resolved theme is not knowable during SSR.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  // "Have we hydrated yet?" without setState-in-an-effect, which React
  // 19 rejects. The server snapshot is false, the client snapshot true.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  return (
    <div
      className={cn(
        "bg-muted/60 inline-flex items-center gap-0.5 rounded-full p-0.5",
        className,
      )}
      role="radiogroup"
      aria-label="Color theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "grid size-7 place-items-center rounded-full",
              "duration-fast ease-out-quart transition-colors",
              "text-muted-foreground hover:text-foreground",
              active && "bg-background text-foreground shadow-xs",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
