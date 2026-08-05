import type { Metadata } from "next";

import { CopyButton } from "@/components/copy-button";
import { Row, Section } from "@/components/design-system/section";
import {
  MotionLab,
  ScaleComparison,
} from "@/components/design-system/motion-lab";
import { AppShell } from "@/components/shell/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export const metadata: Metadata = {
  title: "Design system",
  description:
    "Every token in this project, rendered. The reference an agent reads before writing UI.",
};

const SURFACE_TOKENS = [
  "background",
  "foreground",
  "card",
  "popover",
  "primary",
  "secondary",
  "muted",
  "accent",
  "destructive",
  "border",
];

const TYPE_SCALE = [
  { cls: "text-display-lg", label: "text-display-lg", sample: "Display" },
  { cls: "text-display", label: "text-display", sample: "Display small" },
  { cls: "text-title", label: "text-title", sample: "Section title" },
  { cls: "text-lg font-medium", label: "text-lg", sample: "Lead paragraph" },
  { cls: "text-base", label: "text-base", sample: "Body copy" },
  { cls: "text-sm", label: "text-sm", sample: "Secondary copy" },
  {
    cls: "text-micro uppercase text-muted-foreground",
    label: "text-micro",
    sample: "Eyebrow",
  },
];

const SPACING = [1, 2, 3, 4, 6, 8, 12, 16, 24];
const RADII = ["sm", "md", "lg", "xl", "2xl", "3xl"];

export default function DesignSystemPage() {
  return (
    <AppShell title="Design system">
      <main className="mx-auto w-full max-w-content px-5 pb-16">
        <div className="pt-8 pb-2">
          <p className="text-muted-foreground mt-4 max-w-prose-comfortable text-pretty">
            Every token this project defines, rendered at its real value. Read
            this page — or the source behind it — before adding UI. If something
            you need is not here, add it to{" "}
            <code className="font-mono text-[0.85em]">
              src/app/globals.css
            </code>{" "}
            as a token first, then use it.
          </p>
        </div>

        <Section
          id="color"
          title="Color"
          description="Semantic tokens only. Never write a raw color in a component — retheming the product means editing these values in one place, and hardcoded colors silently opt out of dark mode."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {SURFACE_TOKENS.map((token) => (
              <div key={token} className="space-y-2">
                <div
                  className="h-16 rounded-lg border"
                  style={{ background: `var(--${token})` }}
                />
                <code className="text-muted-foreground block font-mono text-xs">
                  {token}
                </code>
              </div>
            ))}
          </div>

          <Alert className="mt-8">
            <AlertTitle>Colors are OKLCH</AlertTitle>
            <AlertDescription>
              Perceptual lightness is the first channel, so two tokens with the
              same L read as equally bright regardless of hue — which is what
              makes a palette feel coherent. Generate new ramps with{" "}
              <a
                href="https://oklch.fyi/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                oklch.fyi
              </a>
              .
            </AlertDescription>
          </Alert>
        </Section>

        <Section
          id="typography"
          title="Typography"
          description="Display sizes are fluid via clamp() — they shrink on narrow viewports without a media query. Body sizes are fixed, because body copy that scales with the viewport is harder to read, not easier."
        >
          <div className="divide-y">
            {TYPE_SCALE.map(({ cls, label, sample }) => (
              <Row key={label} label={label}>
                <span className={cls}>{sample}</span>
              </Row>
            ))}
          </div>
        </Section>

        <Section
          id="spacing"
          title="Spacing"
          description="Tailwind's 4px scale. Pick from it; do not reach for arbitrary values. Consistent rhythm is most of what makes an interface look designed rather than assembled."
        >
          <div className="flex flex-wrap items-end gap-4">
            {SPACING.map((step) => (
              <div key={step} className="space-y-2 text-center">
                <div
                  className="bg-primary/80 rounded-xs"
                  style={{
                    width: `calc(var(--spacing) * ${step})`,
                    height: `calc(var(--spacing) * ${step})`,
                  }}
                />
                <code className="text-muted-foreground block font-mono text-meta">
                  {step}
                </code>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="radius"
          title="Radius"
          description="All radii derive from a single --radius token, so changing the product's roundness is a one-line edit. Nested corners should step down: an inner element inside a rounded-xl card gets rounded-lg, not the same value."
        >
          <div className="flex flex-wrap gap-4">
            {RADII.map((r) => (
              <div key={r} className="space-y-2 text-center">
                <div
                  className="bg-muted size-20 border"
                  style={{ borderRadius: `var(--radius-${r})` }}
                />
                <code className="text-muted-foreground block font-mono text-xs">
                  {r}
                </code>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="motion"
          title="Motion — easing"
          description="Everything the user triggers uses an ease-out curve. It starts at full speed, so the interface feels like it responded the instant the input landed. Linear is for loops only."
        >
          <MotionLab />
        </Section>

        <Section
          id="scale"
          title="Motion — proportionality"
          description="Animation values should be proportional to the trigger. A dialog scaling from 0 reads as slow at the same duration as one scaling from 0.96, because it has further to travel."
        >
          <ScaleComparison />
        </Section>

        <Section
          id="components"
          title="Components"
          description="shadcn/ui primitives, owned in src/components/ui. They are source, not a dependency — edit them to fit the product rather than wrapping them in overrides."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  One primary action per view. Everything else is secondary,
                  ghost, or a link.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form controls</CardTitle>
                <CardDescription>
                  Labels are wired to inputs, so clicking the label focuses the
                  field.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="space-y-2">
                  <Label htmlFor="ds-email">Email</Label>
                  <Input
                    id="ds-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </form>
                <div className="flex items-center gap-2.5">
                  <Switch id="ds-switch" defaultChecked />
                  <Label htmlFor="ds-switch">Takes effect immediately</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>
                  Skeletons match the shape of what is loading, not a generic
                  grey box.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inline feedback</CardTitle>
                <CardDescription>
                  Confirmation appears on the control that was pressed — not in
                  a toast on the other side of the screen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 rounded-lg border p-1 pl-3">
                  <code className="flex-1 font-mono text-xs">
                    npx create-next-app
                  </code>
                  <CopyButton value="npx create-next-app" />
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>
      </main>
    </AppShell>
  );
}
