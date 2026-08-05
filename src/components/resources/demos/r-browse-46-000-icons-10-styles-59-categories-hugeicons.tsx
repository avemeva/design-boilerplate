"use client";

import NumberFlow from "@number-flow/react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Atom,
  Award,
  Badge,
  Bell,
  Bitcoin,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  Clapperboard,
  CloudSun,
  Code,
  CookingPot,
  CreditCard,
  Download,
  Dumbbell,
  Folder,
  Gamepad2,
  GitBranch,
  Globe,
  GraduationCap,
  Hand,
  House,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Link as LinkIcon,
  ListFilter,
  Lock,
  LogIn,
  Map as MapIcon,
  Menu,
  MessageCircle,
  Moon,
  MousePointer,
  Network,
  NotebookPen,
  Orbit,
  Palette,
  Paperclip,
  Pencil,
  Plus,
  Presentation,
  Recycle,
  Rocket,
  Ruler,
  Scale,
  Search,
  Settings,
  Shapes as ShapesIcon,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  Sigma,
  Smartphone,
  Smile,
  Sofa,
  Sparkles,
  Star,
  Stethoscope,
  Trash,
  Trash2,
  TriangleAlert,
  Truck,
  Users,
  Utensils,
  Video,
  Wifi,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { Input } from "@/components/ui/input";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ── the icon engine ───────────────────────────────────────────────────
 *
 * hugeicons.com/icons ships 10 styles across 59 categories, and
 * @hugeicons/react renders them through one component whose icon is a
 * DATA object, not a component. Neither package is installed here, so
 * the glyphs below are re-drawn on the same 24-unit grid and pushed
 * through a renderer with the same shape and the same seven props.
 * Every style you see is real SVG, not a picture of one.
 * ------------------------------------------------------------------- */

type Shape = {
  d?: string;
  rect?: [number, number, number, number, number];
  circle?: [number, number, number];
  /** Secondary shape — what duotone / twotone / bulk treat differently. */
  secondary?: boolean;
  /** An open line: it can never be filled, only stroked. */
  line?: boolean;
};

/** The Hugeicons naming convention: PascalCase, numbered, `Icon` suffix. */
const GLYPHS: Record<string, Shape[]> = {
  Home01Icon: [
    { d: "M3 10.4 12 3.4l9 7V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
    { rect: [9.4, 13.6, 5.2, 7.4, 1.6], secondary: true },
  ],
  Search01Icon: [
    { circle: [10.6, 10.6, 6.6] },
    { d: "M15.6 15.6 20.6 20.6", line: true, secondary: true },
  ],
  UserIcon: [
    { circle: [12, 8, 3.9] },
    { d: "M4.4 20.8c0-3.9 3.4-6.1 7.6-6.1s7.6 2.2 7.6 6.1z", secondary: true },
  ],
  Folder01Icon: [
    {
      d: "M3 7.4a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.6.8l.9 1.2a2 2 0 0 0 1.6.8H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    },
  ],
  Notification01Icon: [
    { d: "M6.4 10.2a5.6 5.6 0 0 1 11.2 0v3.9l1.6 3.1H4.8l1.6-3.1z" },
    { d: "M9.9 20.4a2.3 2.3 0 0 0 4.2 0z", secondary: true },
  ],
  Calendar01Icon: [
    { rect: [3, 5.2, 18, 15.6, 3] },
    { rect: [3, 5.2, 18, 4.6, 3], secondary: true },
  ],
  FavouriteIcon: [
    {
      d: "M12 20.7C12 20.7 3.4 15.3 3.4 9.7A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 8.6 2.7c0 5.6-8.6 11-8.6 11z",
    },
  ],
};

/* The 10 styles the browser actually ships: 5 Rounded, 3 Standard, 2
   Sharp. One of them — Rounded Stroke — is in the free package. */

type Family = "Rounded" | "Standard" | "Sharp";
type Treatment = "Stroke" | "Solid" | "Duotone" | "Twotone" | "Bulk";

const MATRIX: [Family, Treatment[]][] = [
  ["Rounded", ["Stroke", "Solid", "Duotone", "Twotone", "Bulk"]],
  ["Standard", ["Stroke", "Solid", "Duotone"]],
  ["Sharp", ["Stroke", "Solid"]],
];

interface IconObject {
  glyph: string;
  family: Family;
  treatment: Treatment;
}

const STYLES: (IconObject & { id: string; free: boolean })[] = MATRIX.flatMap(
  ([family, treatments]) =>
    treatments.map((treatment) => ({
      id: `${family} ${treatment}`,
      glyph: "Home01Icon",
      family,
      treatment,
      // The free package ships exactly one style. The other nine are paid.
      free: family === "Rounded" && treatment === "Stroke",
    })),
);

/** Shorthands for the two styles most of this page is drawn in. */
const line = (glyph: string): IconObject => ({
  glyph,
  family: "Rounded",
  treatment: "Stroke",
});
const filled = (glyph: string): IconObject => ({
  glyph,
  family: "Rounded",
  treatment: "Solid",
});
const foreign = (glyph: string): IconObject => ({
  glyph,
  family: "Sharp",
  treatment: "Solid",
});

function shapeNode(
  shape: Shape,
  family: Family,
  key: number,
  common: Record<string, unknown>,
) {
  if (shape.circle) {
    const [cx, cy, r] = shape.circle;
    return <circle key={key} cx={cx} cy={cy} r={r} {...common} />;
  }
  if (shape.rect) {
    const [x, y, w, h, r] = shape.rect;
    const rx =
      family === "Sharp" ? 0 : family === "Standard" ? Math.min(r, 1.4) : r;
    return (
      <rect key={key} x={x} y={y} width={w} height={h} rx={rx} {...common} />
    );
  }
  return <path key={key} d={shape.d} {...common} />;
}

/**
 * The `<HugeiconsIcon />` shape, port for port: seven props, and the icon
 * arrives as data rather than as a component.
 */
function HugeIcon({
  icon,
  altIcon,
  showAlt = false,
  size = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  className,
  title,
}: {
  icon: IconObject;
  altIcon?: IconObject;
  showAlt?: boolean;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  title?: string;
}) {
  const active = showAlt && altIcon ? altIcon : icon;
  const { glyph, family, treatment } = active;
  const shapes = GLYPHS[glyph] ?? [];
  const join = family === "Rounded" ? "round" : "miter";
  const cap = family === "Sharp" ? "butt" : "round";
  // Paint is always currentColor; an explicit `color` goes on the <svg>
  // itself, because CSS variables are not parsed inside SVG presentation
  // attributes.
  const paint = "currentColor";
  // Filled silhouettes get their corners rounded by painting a
  // same-colour round-joined stroke *under* the fill. That is what makes
  // Solid Rounded read differently from Solid Sharp at one geometry.
  const pad = family === "Rounded" ? 1.6 : family === "Standard" ? 0.6 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      strokeLinecap={cap}
      strokeLinejoin={join}
      strokeMiterlimit={family === "Standard" ? 2 : 4}
      style={color === "currentColor" ? undefined : { color }}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {shapes.map((shape, i) => {
        const sec = !!shape.secondary;
        let common: Record<string, unknown>;

        if (shape.line || treatment === "Stroke" || treatment === "Twotone") {
          common = {
            fill: "none",
            stroke: paint,
            strokeWidth,
            opacity: treatment === "Twotone" && sec ? 0.4 : 1,
          };
        } else if (treatment === "Duotone") {
          common = {
            fill: paint,
            fillOpacity: sec ? 0 : 0.18,
            stroke: paint,
            strokeWidth,
          };
        } else if (treatment === "Solid") {
          // Secondary shapes knock out of the silhouette in panel colour.
          common = sec
            ? {
                style: { fill: "var(--card)", stroke: "var(--card)" },
                strokeWidth: pad,
              }
            : {
                fill: paint,
                stroke: paint,
                strokeWidth: pad,
                paintOrder: "stroke",
              };
        } else {
          // Bulk: the body drops to a light weight, the detail stays solid.
          common = {
            fill: paint,
            fillOpacity: sec ? 1 : 0.28,
            stroke: paint,
            strokeOpacity: sec ? 1 : 0.28,
            strokeWidth: pad,
            paintOrder: "stroke",
          };
        }

        if (shape.line && (treatment === "Solid" || treatment === "Bulk")) {
          common = { ...common, strokeWidth: Math.max(strokeWidth, 2) };
        }
        return shapeNode(shape, family, i, common);
      })}
    </svg>
  );
}

/* ── 1. one toolbar, two icon packs ────────────────────────────────── */

const TOOLS: { id: string; label: string; glyph: string; Lucide: LucideIcon }[] =
  [
    { id: "home", label: "Overview", glyph: "Home01Icon", Lucide: House },
    { id: "find", label: "Search", glyph: "Search01Icon", Lucide: Search },
    { id: "files", label: "Files", glyph: "Folder01Icon", Lucide: Folder },
    {
      id: "cal",
      label: "Schedule",
      glyph: "Calendar01Icon",
      Lucide: CalendarDays,
    },
    {
      id: "bell",
      label: "Alerts",
      glyph: "Notification01Icon",
      Lucide: Bell,
    },
    {
      id: "me",
      label: "Account",
      glyph: "UserIcon",
      Lucide: CircleUserRound,
    },
  ];

function ToolbarShell({
  children,
}: {
  children: (id: string, press: (id: string) => void) => ReactNode;
}) {
  const [pressed, setPressed] = useState("home");
  return (
    <div className="bg-secondary flex h-14 items-center gap-2 rounded-xl px-3">
      <p className="text-ui mr-auto font-medium">Workspace</p>
      {children(pressed, setPressed)}
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "duration-fast ease-out-quart flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-card text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function MixedToolbar() {
  return (
    <ToolbarShell>
      {(pressed, press) => (
        <>
          {TOOLS.map((t, i) => (
            <ToolButton
              key={t.id}
              label={t.label}
              active={pressed === t.id}
              onClick={() => press(t.id)}
            >
              {i % 2 === 0 ? (
                <HugeIcon icon={foreign(t.glyph)} size={26} strokeWidth={2} />
              ) : (
                <t.Lucide size={19} strokeWidth={1.5} aria-hidden />
              )}
            </ToolButton>
          ))}
        </>
      )}
    </ToolbarShell>
  );
}

function OneFamilyToolbar() {
  return (
    <ToolbarShell>
      {(pressed, press) => (
        <>
          {TOOLS.map((t) => (
            <ToolButton
              key={t.id}
              label={t.label}
              active={pressed === t.id}
              onClick={() => press(t.id)}
            >
              <HugeIcon
                icon={line(t.glyph)}
                altIcon={filled(t.glyph)}
                showAlt={pressed === t.id}
                size={20}
                strokeWidth={1.8}
              />
            </ToolButton>
          ))}
        </>
      )}
    </ToolbarShell>
  );
}

/* ── 2. which row am I on ──────────────────────────────────────────── */

const NAV = [
  { id: "home", label: "Home", glyph: "Home01Icon" },
  { id: "files", label: "Files", glyph: "Folder01Icon" },
  { id: "cal", label: "Schedule", glyph: "Calendar01Icon" },
  { id: "team", label: "Team", glyph: "UserIcon" },
  { id: "alerts", label: "Alerts", glyph: "Notification01Icon" },
];

function Rail({ polished }: { polished: boolean }) {
  const [current, setCurrent] = useState("cal");
  return (
    <div className="bg-secondary w-full max-w-64 rounded-xl p-2">
      {NAV.map((n) => {
        const on = current === n.id;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => setCurrent(n.id)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "duration-fast ease-out-quart flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors",
              polished
                ? on
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                : on
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            <HugeIcon
              icon={line(n.glyph)}
              altIcon={filled(n.glyph)}
              showAlt={polished && on}
              size={18}
              strokeWidth={1.8}
              className={polished && !on ? "opacity-70" : undefined}
            />
            <span className={cn("text-ui", polished && on && "font-medium")}>
              {n.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── 3. icons that shout over the words ────────────────────────────── */

const SETTINGS: { id: string; label: string; value: string; Icon: LucideIcon }[] =
  [
    { id: "n", label: "Notifications", value: "Everything", Icon: Bell },
    { id: "a", label: "Appearance", value: "System", Icon: Palette },
    { id: "l", label: "Language", value: "English", Icon: Globe },
    { id: "b", label: "Billing", value: "Team plan", Icon: CreditCard },
    { id: "p", label: "Privacy", value: "Standard", Icon: Lock },
  ];

function SettingsList({ quiet }: { quiet: boolean }) {
  const [open, setOpen] = useState("n");
  return (
    <div className="w-full">
      {SETTINGS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => setOpen(s.id)}
          className={cn(
            "duration-fast ease-out-quart flex h-12 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors",
            open === s.id ? "bg-secondary" : "hover:bg-secondary/60",
          )}
        >
          <s.Icon
            size={quiet ? 18 : 24}
            strokeWidth={quiet ? 1.75 : 2.75}
            className={quiet ? "text-muted-foreground" : "text-foreground"}
            aria-hidden
          />
          <span className="text-ui flex-1">{s.label}</span>
          <span className="text-caption text-muted-foreground">{s.value}</span>
          <ChevronRight
            size={quiet ? 16 : 20}
            strokeWidth={quiet ? 1.75 : 2.75}
            className={quiet ? "text-muted-foreground" : "text-foreground"}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}

/* ── 4. the save button ────────────────────────────────────────────── */

function SaveRow({ polished }: { polished: boolean }) {
  const [saved, setSaved] = useState(false);
  const count = 1248 + (saved ? 1 : 0);
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => setSaved((v) => !v)}
        aria-pressed={saved}
        className={cn(
          "duration-fast ease-out-quart flex h-9 items-center gap-2 rounded-lg border px-3 transition-colors",
          saved ? "text-foreground" : "text-muted-foreground",
          "hover:bg-secondary",
        )}
      >
        {polished ? (
          <motion.span
            key={saved ? "on" : "off"}
            initial={{ scale: 0.86 }}
            animate={{ scale: 1 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
            className="flex"
          >
            <HugeIcon
              icon={line("FavouriteIcon")}
              altIcon={filled("FavouriteIcon")}
              showAlt={saved}
              size={18}
              strokeWidth={1.8}
            />
          </motion.span>
        ) : (
          <HugeIcon icon={line("FavouriteIcon")} size={18} strokeWidth={1.8} />
        )}
        <span className="text-ui-sm">{saved ? "Saved" : "Save"}</span>
      </button>
      <p className="text-caption text-muted-foreground">
        {polished ? (
          <NumberFlow value={count} />
        ) : (
          <span className="tabular-nums">{count.toLocaleString("en-US")}</span>
        )}{" "}
        people saved this
      </p>
    </div>
  );
}

/* ── 5. picking one of the 10 styles ───────────────────────────────── */

function StyleNames() {
  const [picked, setPicked] = useState("Rounded Stroke");
  return (
    <div>
      <fieldset className="grid gap-0.5 sm:grid-cols-2">
        <legend className="text-ui mb-2 font-medium">Icon style</legend>
        {STYLES.map((s) => (
          <label
            key={s.id}
            htmlFor={`plain-${s.id}`}
            className="hover:bg-secondary flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2"
          >
            <input
              id={`plain-${s.id}`}
              type="radio"
              name="plain-style"
              checked={picked === s.id}
              onChange={() => setPicked(s.id)}
              className="accent-primary size-3.5"
            />
            <span className="text-ui-sm">{s.id}</span>
          </label>
        ))}
      </fieldset>
      <p className="text-caption text-muted-foreground mt-3 border-t pt-3">
        Selected: {picked}
      </p>
    </div>
  );
}

function StylePreviews() {
  const [picked, setPicked] = useState("Rounded Stroke");
  const chosen = STYLES.find((s) => s.id === picked) ?? STYLES[0];
  return (
    <div>
      <p className="text-ui mb-3 font-medium">Icon style</p>
      <div className="grid gap-4">
        {MATRIX.map(([family, treatments]) => (
          <div key={family}>
            <p className="text-micro text-muted-foreground mb-1.5 uppercase">
              {family}
            </p>
            <div className="flex flex-wrap gap-2">
              {treatments.map((treatment) => {
                const s = STYLES.find(
                  (x) => x.id === `${family} ${treatment}`,
                );
                if (!s) return null;
                const on = picked === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPicked(s.id)}
                    aria-pressed={on}
                    className={cn(
                      "duration-fast ease-out-quart relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-xl border transition-colors",
                      on
                        ? "bg-card border-border-strong shadow-xs"
                        : "bg-secondary border-transparent hover:border-border",
                      s.free ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {!s.free && (
                      <Lock
                        size={11}
                        className="text-muted-foreground absolute top-1.5 right-1.5"
                        aria-hidden
                      />
                    )}
                    <HugeIcon
                      icon={s}
                      size={28}
                      strokeWidth={1.5}
                      title={`${s.id} preview`}
                    />
                    <span className="text-micro uppercase">{treatment}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="text-caption text-muted-foreground mt-3 flex items-center gap-2 border-t pt-3">
        <HugeIcon icon={chosen} size={20} strokeWidth={1.5} />
        <span>
          {chosen.id} —{" "}
          {chosen.free ? "in the free package" : "paid package only"}
        </span>
      </div>
    </div>
  );
}

/* ── 6. the 59 categories ──────────────────────────────────────────── */

const CATEGORIES: { name: string; Icon: LucideIcon; count: number }[] = [
  { name: "Add + Remove", Icon: Plus, count: 420 },
  { name: "AI", Icon: Sparkles, count: 1370 },
  { name: "Alert", Icon: TriangleAlert, count: 450 },
  { name: "Animation", Icon: Orbit, count: 350 },
  { name: "Arrows", Icon: ArrowRight, count: 2420 },
  { name: "Award", Icon: Award, count: 390 },
  { name: "Bookmark", Icon: Bookmark, count: 460 },
  { name: "Buildings", Icon: Building2, count: 830 },
  { name: "Business", Icon: Briefcase, count: 4190 },
  { name: "Check", Icon: Check, count: 460 },
  { name: "Clothing", Icon: Shirt, count: 650 },
  { name: "Communications", Icon: MessageCircle, count: 2820 },
  { name: "Crypto", Icon: Bitcoin, count: 750 },
  { name: "Dashboard", Icon: LayoutDashboard, count: 260 },
  { name: "Date + Time", Icon: CalendarDays, count: 1150 },
  { name: "Devices", Icon: Smartphone, count: 2290 },
  { name: "Download + Upload", Icon: Download, count: 240 },
  { name: "E-Commerce", Icon: ShoppingCart, count: 1630 },
  { name: "Editing", Icon: Pencil, count: 5990 },
  { name: "Education", Icon: GraduationCap, count: 1260 },
  { name: "Emojis", Icon: Smile, count: 650 },
  { name: "Energy", Icon: Zap, count: 1150 },
  { name: "Files Folders", Icon: Folder, count: 2150 },
  { name: "Filter + Sorting", Icon: ListFilter, count: 500 },
  { name: "Foods", Icon: Utensils, count: 1450 },
  { name: "Furnitures", Icon: Sofa, count: 880 },
  { name: "Games", Icon: Gamepad2, count: 1750 },
  { name: "Git", Icon: GitBranch, count: 200 },
  { name: "Gym", Icon: Dumbbell, count: 540 },
  { name: "Hands", Icon: Hand, count: 1720 },
  { name: "Hierarchy", Icon: Network, count: 610 },
  { name: "Home", Icon: House, count: 240 },
  { name: "Image + Camera", Icon: Camera, count: 860 },
  { name: "Islamic", Icon: Moon, count: 460 },
  { name: "Kitchen", Icon: CookingPot, count: 480 },
  { name: "Layout", Icon: LayoutGrid, count: 780 },
  { name: "Legal", Icon: Scale, count: 370 },
  { name: "Link + Unlink", Icon: LinkIcon, count: 300 },
  { name: "Login + Logout", Icon: LogIn, count: 180 },
  { name: "Logistics", Icon: Truck, count: 1100 },
  { name: "Logos", Icon: Badge, count: 1930 },
  { name: "Maps", Icon: MapIcon, count: 1230 },
  { name: "Mathematics", Icon: Sigma, count: 1670 },
  { name: "Media", Icon: Clapperboard, count: 1050 },
  { name: "Medical", Icon: Stethoscope, count: 940 },
  { name: "Menu", Icon: Menu, count: 310 },
  { name: "Mouse", Icon: MousePointer, count: 980 },
  { name: "Notes + Tasks", Icon: NotebookPen, count: 360 },
  { name: "Presentation", Icon: Presentation, count: 150 },
  { name: "Programming", Icon: Code, count: 860 },
  { name: "Science + Technology", Icon: Atom, count: 280 },
  { name: "Search", Icon: Search, count: 220 },
  { name: "Security", Icon: ShieldCheck, count: 1120 },
  { name: "Settings", Icon: Settings, count: 480 },
  { name: "Shapes", Icon: ShapesIcon, count: 380 },
  { name: "Space", Icon: Rocket, count: 280 },
  { name: "Users", Icon: Users, count: 900 },
  { name: "Weather", Icon: CloudSun, count: 1230 },
  { name: "Wifi", Icon: Wifi, count: 810 },
];

const TOTAL_ICONS = CATEGORIES.reduce((n, c) => n + c.count, 0);

function BareCategoryGrid() {
  const [picked, setPicked] = useState("Weather");
  return (
    <div>
      <p className="text-ui mb-3 font-medium">Categories</p>
      <div className="flex max-h-72 flex-wrap gap-1 overflow-y-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c.name}
            type="button"
            aria-label={c.name}
            aria-pressed={picked === c.name}
            onClick={() => setPicked(c.name)}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
              picked === c.name
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <c.Icon size={18} strokeWidth={1.75} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}

function LabelledCategoryGrid() {
  const [picked, setPicked] = useState("Weather");
  const current = CATEGORIES.find((c) => c.name === picked) ?? CATEGORIES[0];
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-ui font-medium">Categories</p>
        <p className="text-caption text-muted-foreground">
          59 groups · {TOTAL_ICONS.toLocaleString("en-US")} icons
        </p>
      </div>
      <div className="grid max-h-72 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.name}
            type="button"
            aria-pressed={picked === c.name}
            onClick={() => setPicked(c.name)}
            className={cn(
              "duration-fast ease-out-quart flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors",
              picked === c.name
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <c.Icon
              size={18}
              strokeWidth={1.75}
              className="text-muted-foreground shrink-0"
              aria-hidden
            />
            <span className="text-ui-sm text-foreground flex-1 truncate">
              {c.name}
            </span>
            <span className="text-caption text-muted-foreground tabular-nums">
              {c.count.toLocaleString("en-US")}
            </span>
          </button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground mt-3 flex items-center gap-2 border-t pt-3">
        <current.Icon size={16} strokeWidth={1.75} aria-hidden />
        <span>
          {current.name} — <NumberFlow value={current.count} /> icons
        </span>
      </p>
    </div>
  );
}

/* ── 7. searching for the thing you have another word for ──────────── */

const LIBRARY: { name: string; Icon: LucideIcon; also: string[] }[] = [
  { name: "Delete", Icon: Trash2, also: ["trash", "bin", "remove", "garbage"] },
  { name: "Bin", Icon: Trash, also: ["trash", "delete", "waste"] },
  { name: "Recycle", Icon: Recycle, also: ["trash", "reuse", "loop"] },
  { name: "Cart", Icon: ShoppingCart, also: ["basket", "buy", "shop"] },
  { name: "Image", Icon: ImageIcon, also: ["photo", "picture", "pic"] },
  { name: "Camera", Icon: Camera, also: ["photo", "pic", "shoot"] },
  { name: "Video", Icon: Video, also: ["film", "movie", "record"] },
  { name: "Attachment", Icon: Paperclip, also: ["clip", "file", "attach"] },
  { name: "Favourite", Icon: Star, also: ["star", "like", "fav"] },
  { name: "Bookmark", Icon: Bookmark, also: ["save", "later", "flag"] },
  { name: "Measure", Icon: Ruler, also: ["ruler", "size", "scale"] },
  { name: "Security", Icon: ShieldCheck, also: ["shield", "safe", "protect"] },
];

function IconSearch({ smart }: { smart: boolean }) {
  const [q, setQ] = useState("trash");
  const query = q.trim().toLowerCase();
  const hits = useMemo(
    () =>
      LIBRARY.filter((item) => {
        if (!query) return true;
        if (item.name.toLowerCase().includes(query)) return true;
        return smart && item.also.some((a) => a.includes(query));
      }),
    [query, smart],
  );

  return (
    <div>
      <label htmlFor={smart ? "smart-q" : "plain-q"} className="sr-only">
        Search icons
      </label>
      <div className="relative">
        <Search
          size={16}
          strokeWidth={1.75}
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          id={smart ? "smart-q" : "plain-q"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search icons"
          className="h-9 pl-8"
        />
      </div>

      {hits.length === 0 ? (
        <div className="mt-4 flex h-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed">
          <p className="text-ui-sm">No icons for “{q}”</p>
          <p className="text-caption text-muted-foreground">
            Try a different word.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-1 sm:grid-cols-4">
            {hits.map((item) => (
              <div
                key={item.name}
                className="bg-secondary flex h-20 flex-col items-center justify-center gap-2 rounded-lg"
              >
                <item.Icon
                  size={20}
                  strokeWidth={1.75}
                  className="text-muted-foreground"
                  aria-hidden
                />
                <span className="text-caption">{item.name}</span>
              </div>
            ))}
          </div>
          <p className="text-caption text-muted-foreground mt-3">
            <NumberFlow value={hits.length} /> of {LIBRARY.length} icons
          </p>
        </>
      )}
    </div>
  );
}

/* ── the page ──────────────────────────────────────────────────────── */

export function Browse46000Icons10Styles59CategoriesHugeiconsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The row stops looking like it was built out of spare parts."
        before={<MixedToolbar />}
        after={<OneFamilyToolbar />}
      />

      <BeforeAfter
        principle="You can tell which page you are on without hunting for it."
        before={<Rail polished={false} />}
        after={<Rail polished />}
      />

      <BeforeAfter
        principle="You read the settings now instead of the pictures next to them."
        before={<SettingsList quiet={false} />}
        after={<SettingsList quiet />}
      />

      <BeforeAfter
        principle="The heart looks saved when you save it."
        before={<SaveRow polished={false} />}
        after={<SaveRow polished />}
      />

      <BeforeAfter
        principle="You can see what a style looks like, and whether you have it, before you pick it."
        before={<StyleNames />}
        after={<StylePreviews />}
      />

      <BeforeAfter
        principle="You can read what a group holds instead of guessing from the picture."
        before={<BareCategoryGrid />}
        after={<LabelledCategoryGrid />}
      />

      <BeforeAfter
        principle="Type “trash” and it still finds the bin."
        before={<IconSearch smart={false} />}
        after={<IconSearch smart />}
      />
    </div>
  );
}
