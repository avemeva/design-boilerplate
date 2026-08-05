import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ALL_DEMOS } from "@/components/resources/demos";
import { AppShell } from "@/components/shell/app-shell";
import { Micro } from "@/components/surface";
import { byBucket } from "@/lib/resources";

export default function Home() {
  const objectives = Object.fromEntries(
    Object.entries(ALL_DEMOS).map(([k, v]) => [k, v.objective]),
  );
  const groups = (["installed", "applied", "vendored"] as const).map((id) => ({
    id,
    items: byBucket(id),
  }));
  const reference = byBucket("reference");

  return (
    <AppShell title="Contents">
      <div>
        <p className="text-muted-foreground max-w-prose-comfortable text-pretty">
          Every entry below opens a page where the technique is running, not
          described. The rail on the left is the same list.
        </p>

        <div className="mt-8 space-y-8">
          {groups.map((g) => (
            <section key={g.id}>
              <Micro>{g.id}</Micro>
              <div className="bg-card shadow-card mt-2 divide-y rounded-xl">
                {g.items.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/applied/${r.slug}`}
                    className="hover:bg-secondary duration-fast ease-out-quart block px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <span className="text-ui block">{r.title}</span>
                    <span className="text-caption text-muted-foreground mt-0.5 line-clamp-1 block">
                      {objectives[r.slug]}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section>
            <Micro>reference</Micro>
            <div className="bg-card shadow-card mt-2 divide-y rounded-xl">
              {reference.map((r) => (
                <a
                  key={r.slug}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:bg-secondary duration-fast ease-out-quart flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="text-ui truncate">{r.title}</span>
                  <ArrowUpRight
                    className="text-muted-foreground ml-auto size-4 shrink-0"
                    aria-hidden
                  />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
