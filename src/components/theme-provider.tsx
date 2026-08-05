"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Suppresses transitions for one frame during the swap. Without
      // it every transitioning property fires at once and the theme
      // change looks like a glitch.
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
