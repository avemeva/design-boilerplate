import Link from "next/link";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The page shell.
 *
 * Deliberately **not** an app rail. The reference is product UI and it
 * uses one because that product has persistent navigation over a small
 * fixed set of destinations. This is a reading surface with ninety
 * entries; a rail here would be transplanting a component instead of
 * applying the language.
 *
 * What carries over is the language itself — canvas showing around a
 * white content surface, hairlines you can barely see, generous air,
 * one quiet top bar rather than two stacked ones.
 */
export function AppShell({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      {/* One bar. Two stacked bars put 112px of chrome above the
          content and make every page feel top-heavy. */}
      <header className="bg-background/85 sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-content items-center gap-5 px-6">
          <Link href="/" className="text-ui font-semibold tracking-tight">
            Quiet Instrument
          </Link>
          <Link
            href="/design-system"
            className="text-ui text-muted-foreground hover:text-foreground duration-fast ease-out-quart transition-colors"
          >
            Design system
          </Link>
          <ThemeToggle className="ml-auto" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-content px-6 pb-24">
        <h1 className="text-display pt-10 pb-8 text-balance">{title}</h1>
        {children}
      </main>
    </div>
  );
}
