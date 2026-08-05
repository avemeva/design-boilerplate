import data from "../../skills/design-resources/resources.json";

/**
 * The design-resource catalogue, typed.
 *
 * Single source of truth: `skills/design-resources/resources.json`.
 * The agent queries it with `skills/design-resources/find`; the
 * `/resources` route renders the same file. Edit the JSON, never a
 * copy — both surfaces update together.
 */

export type Format =
  | "read"
  | "watch"
  | "listen"
  | "browse"
  | "use"
  | "build"
  | "learn"
  | "join"
  | "follow"
  | "apply";

export type Kind =
  | "npm"
  | "shadcn-registry"
  | "copy-paste"
  | "tool"
  | "agent-skill"
  | "reference"
  | "dead";

export type Bucket = "installed" | "vendored" | "applied" | "reference" | "hidden";

export interface Resource {
  /** installed = running by default · vendored = in skills/ ·
   *  applied = has a live demo · reference = link only */
  bucket: Bucket;
  applicable: boolean;
  title: string;
  url: string;
  description: string;
  format: Format;
  slug: string;
  status: "external" | "installed" | "vendored";
  source: string;
  added?: string;
  local?: string;
  kind?: Kind;
  install?: string;
  compat?: string;
  use_when?: string;
  gotcha?: string;
  fetch?: string;
  fetch_kind?: string;
  fetch_bytes?: number;
}

export const resources = data as Resource[];

/** Order matters — it runs from "consume" to "commit to". */
export const FORMATS: { id: Format; label: string; blurb: string }[] = [
  { id: "use", label: "Use", blurb: "Tools and utilities you reach for while working" },
  { id: "build", label: "Build", blurb: "Libraries and registries you install into the app" },
  { id: "browse", label: "Browse", blurb: "Galleries to look at before inventing a layout" },
  { id: "read", label: "Read", blurb: "Essays and references on craft" },
  { id: "learn", label: "Learn", blurb: "Courses and structured material" },
  { id: "follow", label: "Follow", blurb: "People whose work is the reference" },
  { id: "watch", label: "Watch", blurb: "Video" },
  { id: "listen", label: "Listen", blurb: "Audio" },
  { id: "join", label: "Join", blurb: "Communities" },
  { id: "apply", label: "Apply", blurb: "Open roles" },
];

export const KIND_LABEL: Record<Kind, string> = {
  npm: "npm package",
  "shadcn-registry": "shadcn registry",
  "copy-paste": "copy-paste",
  tool: "web tool",
  "agent-skill": "agent skill",
  reference: "reference",
  dead: "unavailable",
};

export const BUCKETS: { id: Bucket; label: string; blurb: string }[] = [
  {
    id: "installed",
    label: "Installed",
    blurb:
      "Running by default. These are in package.json and wired into the app or the scripts.",
  },
  {
    id: "applied",
    label: "Applied",
    blurb:
      "A working demonstration of the technique on a page you can click, not a description of it.",
  },
  {
    id: "vendored",
    label: "Vendored",
    blurb: "Copied into skills/ verbatim, so the agent reads the source not a summary.",
  },
  {
    id: "reference",
    label: "Reference",
    blurb:
      "External services and galleries. Nothing to install and nothing to demonstrate — go and look.",
  },
];

export function byBucket(bucket: Bucket) {
  return resources.filter((r) => r.bucket === bucket);
}

export function bySlug(slug: string) {
  return resources.find((r) => r.slug === slug);
}

export function byFormat(format: Format) {
  return resources.filter((r) => r.format === format);
}

/** A compat string that is anything other than a bare "ok" is a warning. */
export function isBlocker(r: Resource) {
  return Boolean(r.compat && !r.compat.startsWith("ok") && r.compat !== "unknown");
}

export function related(r: Resource, limit = 4) {
  return resources
    .filter((o) => o.slug !== r.slug && o.format === r.format)
    .slice(0, limit);
}
