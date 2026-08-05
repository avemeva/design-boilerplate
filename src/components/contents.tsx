"use client";

import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Micro } from "@/components/surface";
import { BUCKETS, type Resource } from "@/lib/resources";

/**
 * Table of contents, grouped by what was actually done with each thing:
 * installed and running, demonstrated on its own page, vendored into
 * skills/, or just a link worth having.
 */
export function Contents({
  resources,
  objectives,
}: {
  resources: Resource[];
  objectives: Record<string, string>;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.use_when ?? "").toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [resources, query]);

  const groups = BUCKETS.map((b) => ({
    ...b,
    items: filtered.filter((r) => r.bucket === b.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="bg-background/90 sticky top-14 z-40 -mx-5 px-5 py-3 backdrop-blur-md">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter — try “motion”, “colour”, “chart”"
            aria-label="Filter contents"
            spellCheck={false}
            className="text-ui bg-card placeholder:text-muted-foreground focus-visible:border-ring h-9 w-full rounded-lg border pr-3 pl-9 outline-none"
          />
        </div>
      </div>

      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.id}>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h2 className="text-title">{g.label}</h2>
              <span className="text-muted-foreground text-caption tabular-nums">
                {g.items.length}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 max-w-prose-comfortable text-sm text-pretty">
              {g.blurb}
            </p>

            <div className="bg-card mt-3 divide-y rounded-xl border">
              {g.items.map((r) => {
                // A reference is a link out; everything else has a page.
                const external = g.id === "reference";
                const rowClass =
                  "hover:bg-secondary duration-fast ease-out-quart grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl";

                const body = (
                  <>
                    <span className="min-w-0">
                      <span className="text-ui block truncate">{r.title}</span>
                      <span className="text-caption text-muted-foreground mt-0.5 line-clamp-1 block">
                        {objectives[r.slug] ?? ""}
                      </span>
                    </span>

                    {external && (
                      <ArrowUpRight
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden
                      />
                    )}
                  </>
                );

                return external ? (
                  <a
                    key={r.slug}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className={rowClass}
                  >
                    {body}
                  </a>
                ) : (
                  <Link
                    key={r.slug}
                    href={`/applied/${r.slug}`}
                    className={rowClass}
                  >
                    {body}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="text-caption text-muted-foreground mt-12">
        <Micro className="mb-1">Not listed</Micro>
        Jobs, people to follow, communities, and essays about what design
        engineering is. Good reading, nothing to apply. They stay in{" "}
        <code className="font-mono text-[0.9em]">
          skills/design-resources/resources.json
        </code>{" "}
        for the agent, off this page for you.
      </p>
    </div>
  );
}
