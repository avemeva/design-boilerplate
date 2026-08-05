import type { ReactNode } from "react";

export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    // Content sits on a white panel, never on the canvas.
    // DESIGN.md → Colors.
    <section id={id} className="scroll-mt-24 py-5">
      <h2 className="text-title">{title}</h2>
      <p className="text-muted-foreground mt-1.5 max-w-prose-comfortable text-sm text-pretty">
        {description}
      </p>
      <div className="bg-card shadow-card mt-4 rounded-xl p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 py-3.5 sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-6">
      <code className="text-muted-foreground font-mono text-xs">{label}</code>
      <div>{children}</div>
    </div>
  );
}
