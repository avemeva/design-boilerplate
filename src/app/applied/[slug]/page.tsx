import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDemo } from "@/components/resources/demos";
import { AppShell } from "@/components/shell/app-shell";
import { bySlug, resources } from "@/lib/resources";

export function generateStaticParams() {
  return resources.filter((r) => getDemo(r.slug)).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/applied/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = bySlug(slug);
  if (!r) return {};
  return { title: r.title, description: getDemo(slug)?.objective ?? r.title };
}

export default async function AppliedPage({
  params,
}: PageProps<"/applied/[slug]">) {
  const { slug } = await params;
  const r = bySlug(slug);
  if (!r) notFound();
  const demo = getDemo(slug);
  if (!demo) notFound();

  return (
    <AppShell title={r.title}>
      {/* No second container. AppShell already sets the measure; a
          nested mx-auto pushed the body 190px right of its own
          heading. */}
      <p className="text-muted-foreground max-w-prose-comfortable text-pretty">
        {demo.objective}
      </p>

      {/* Content never sits on the canvas. DESIGN.md move 1. */}
      <div className="bg-card shadow-card mt-7 rounded-xl p-5 sm:p-7">
        <demo.Component />
      </div>
    </AppShell>
  );
}
