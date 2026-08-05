"use client";

import { Check, Headset, MessageCircle, X } from "lucide-react";
import { useCallback, useState } from "react";

import { BeforeAfter } from "@/components/surface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * millionco/isolet — packaging a component as an embeddable widget.
 *
 * Built from the README (fetched): createIsolet's mount/update/unmount
 * lifecycle, the three isolation modes (shadow-dom / scoped / none),
 * shadowMode, hostAttributes, zIndex, the css + styles options, the
 * cleanup function a mount may return, the build's data-URI inlining of
 * fonts, images and .css imports, the CLI (init / build / --watch /
 * --minify), the config fields, multi-widget configs, the IIFE script
 * tag global, the framework adapters, and the Vite plugins.
 *
 * isolet-js is not a dependency here, so the shadow roots below are
 * hand-rolled: attachShadow, plus shipping the widget's CSS inside the
 * widget instead of leaning on the page's stylesheet.
 *
 * Left out: everything with no picture — CLI flags, output formats,
 * config fields, adapters, open vs closed shadowMode, the Vite plugins.
 * A person cannot see a build flag.
 * ------------------------------------------------------------------ */

/* ── the widget's own stylesheet, shipped with the widget ─────────── */

const SIGNUP_CSS = `
.wgt{display:grid;gap:.5rem;justify-items:stretch;padding:1rem;text-align:left;
font-family:system-ui,sans-serif;color:var(--foreground);background:var(--card);
border:1px solid var(--border);border-radius:var(--radius-lg)}
.wgt h3{margin:0;font-family:inherit;font-size:.9375rem;font-weight:500;line-height:1.4;
letter-spacing:-0.004em;text-transform:none}
.wgt p{margin:0;font-family:inherit;font-size:.8125rem;line-height:1.45;letter-spacing:normal;
color:var(--muted-foreground)}
.wgt form{display:flex;gap:.5rem;margin:.25rem 0 0}
.wgt input{flex:1;min-width:0;height:2.25rem;padding:0 .625rem;font-family:inherit;
font-size:.8125rem;color:var(--foreground);background:var(--card);
border:1px solid var(--border);border-radius:var(--radius-md)}
.wgt button{height:2.25rem;width:auto;margin:0;padding:0 .875rem;font-family:inherit;
font-size:.8125rem;font-weight:500;letter-spacing:normal;text-transform:none;
color:var(--feature-foreground);background:var(--feature);border:0;
border-radius:var(--radius-md);cursor:pointer}
`;

/* ── the host page's stylesheet, written for the host page ────────── */

const HOST_TYPE_CSS = `
.host-type.host-type *{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.host-type.host-type h3{margin:0;font-size:.6875rem;font-weight:600;text-transform:uppercase;
letter-spacing:.26em}
.host-type.host-type p{margin:0;font-size:.6875rem;line-height:2.2;letter-spacing:.04em}
.host-type.host-type input{padding:0;background:transparent;border:0;
border-bottom:1px solid var(--border);border-radius:0}
.host-type.host-type button{height:2.5rem;padding:0 .75rem;font-size:.625rem;
text-transform:uppercase;letter-spacing:.2em;color:var(--muted-foreground);
background:transparent;border:1px solid var(--border);border-radius:0}
.host-type.host-type form{display:block}
.host-type.host-type form button{width:100%;margin-top:.5rem}
`;

function mountSignup(root: HTMLElement | ShadowRoot) {
  const style = document.createElement("style");
  style.textContent = SIGNUP_CSS;

  const card = document.createElement("div");
  card.className = "wgt";

  const title = document.createElement("h3");
  title.textContent = "Weekly digest";
  const note = document.createElement("p");
  note.textContent = "One email on Thursdays. Leave whenever you like.";

  const form = document.createElement("form");
  const input = document.createElement("input");
  input.type = "email";
  input.placeholder = "you@example.com";
  input.setAttribute("aria-label", "Email address");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Subscribe";
  form.append(input, submit);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit.textContent = "Subscribed";
    input.value = "";
  });

  card.append(title, note, form);
  root.append(style, card);
  return () => {
    style.remove();
    card.remove();
  };
}

function SignupSlot({ isolated }: { isolated: boolean }) {
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const root = isolated
        ? (node.shadowRoot ?? node.attachShadow({ mode: "open" }))
        : node;
      return mountSignup(root);
    },
    [isolated],
  );

  /* A div that has been given a shadow root stops rendering its light
   * DOM children, so the two sides must never share a node. */
  return <div key={isolated ? "shadow" : "page"} ref={ref} />;
}

function TypePair({ isolated }: { isolated: boolean }) {
  return (
    <div className="host-type bg-secondary mx-auto w-full max-w-md rounded-xl border p-4">
      <style>{HOST_TYPE_CSS}</style>
      <div className="flex items-center justify-between gap-3">
        <span className="text-ui-sm">Fernwood Cycles</span>
        <button type="button">Shop all</button>
      </div>
      <p className="mt-2">Hand-built frames. Portland, since 1994.</p>
      <div className="mt-3">
        <SignupSlot isolated={isolated} />
      </div>
    </div>
  );
}

/* ── 2 · the widget's CSS landing on the page around it ───────────── */

const PROMO_RULES: readonly (readonly [string, string])[] = [
  [
    ".promo",
    "display:grid;gap:.5rem;justify-items:start;padding:1rem;color:var(--foreground);" +
      "background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);" +
      "font-family:system-ui,sans-serif",
  ],
  [
    "h3",
    "margin:0;font-family:Georgia,'Times New Roman',serif;font-size:1.25rem;font-style:italic;" +
      "font-weight:400;line-height:1.2;letter-spacing:normal",
  ],
  [
    "p",
    "margin:0;font-family:system-ui,sans-serif;font-size:.8125rem;line-height:1.45;" +
      "color:var(--muted-foreground)",
  ],
  [
    "button",
    "height:2.25rem;padding:0 1.125rem;font-family:system-ui,sans-serif;font-size:.8125rem;" +
      "font-weight:500;color:var(--feature-foreground);background:var(--feature);border:0;" +
      "border-radius:999px;cursor:pointer",
  ],
];

const promoCss = (prefix: string) =>
  PROMO_RULES.map(
    ([sel, body]) => `${prefix ? `${prefix} ` : ""}${sel}{${body}}`,
  ).join("\n");

function mountPromo(root: HTMLElement | ShadowRoot, css: string | null) {
  const nodes: Element[] = [];
  if (css) {
    const style = document.createElement("style");
    style.textContent = css;
    nodes.push(style);
  }

  const card = document.createElement("div");
  card.className = "promo";
  const title = document.createElement("h3");
  title.textContent = "15% off your first ride kit";
  const note = document.createElement("p");
  note.textContent = "The code drops into your basket on its own.";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Copy code";
  btn.addEventListener("click", () => {
    btn.textContent = "Copied — FERN15";
  });
  card.append(title, note, btn);
  nodes.push(card);

  root.append(...nodes);
  return () => {
    for (const n of nodes) n.remove();
  };
}

function PromoSlot({ isolated }: { isolated: boolean }) {
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      if (isolated) {
        const shadow = node.shadowRoot ?? node.attachShadow({ mode: "open" });
        return mountPromo(shadow, promoCss(""));
      }
      return mountPromo(node, null);
    },
    [isolated],
  );

  return <div key={isolated ? "shadow" : "page"} ref={ref} />;
}

function LeakPair({ isolated }: { isolated: boolean }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="host-leak bg-secondary mx-auto w-full max-w-md rounded-xl border p-4">
      {!isolated && <style>{promoCss(".host-leak.host-leak")}</style>}

      <h3 className="text-ui">Trail Days 2026</h3>
      <p className="text-caption text-muted-foreground mt-1">
        Two days of guided rides out of Hood River. Bring a bike.
      </p>
      <button
        type="button"
        onClick={() => setSaved((v) => !v)}
        aria-pressed={saved}
        className="text-ui-sm bg-card mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border px-3"
      >
        {saved && <Check className="size-3.5" aria-hidden="true" />}
        {saved ? "Saved" : "Save for later"}
      </button>

      <div className="mt-4">
        <PromoSlot isolated={isolated} />
      </div>
    </div>
  );
}

/* ── 3 · the pictures the widget brings with it ───────────────────── */

const dataUri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const MARK_SRC = dataUri(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    '<rect width="24" height="24" rx="7" fill="oklch(0.62 0 0)"/>' +
    '<path d="M6.5 16.5 12 6.75l5.5 9.75z" fill="oklch(0.97 0 0)"/></svg>',
);

const PACK_SRC = dataUri(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<rect width="64" height="64" rx="12" fill="oklch(0.87 0 0)"/>' +
    '<path d="M20 46V28a12 12 0 0 1 24 0v18z" fill="oklch(0.6 0 0)"/>' +
    '<rect x="27" y="34" width="10" height="5" rx="2.5" fill="oklch(0.93 0 0)"/></svg>',
);

function AssetPair({ inlined }: { inlined: boolean }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-secondary mx-auto w-full max-w-md rounded-xl border p-4">
      <div className="text-caption text-muted-foreground flex items-center justify-between gap-3">
        <span>Fernwood Cycles</span>
        <span>Basket · 2</span>
      </div>

      <div className="bg-card mt-3 flex items-center gap-3 rounded-xl border p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={inlined ? PACK_SRC : "/widget-assets/trail-pack.png"}
          alt="Trail Pack 30L"
          width={56}
          height={56}
          className="bg-secondary text-micro size-14 shrink-0 overflow-hidden rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={inlined ? MARK_SRC : "/widget-assets/fernwood-mark.svg"}
              alt="Fernwood"
              width={14}
              height={14}
              className="size-3.5 shrink-0 rounded-xs"
            />
            <span className="text-micro text-muted-foreground uppercase">
              Picked for you
            </span>
          </div>
          <p className="text-ui-sm mt-0.5 truncate">Trail Pack 30L · $128</p>
        </div>
        <Button
          size="lg"
          variant={saved ? "secondary" : "default"}
          onClick={() => setSaved((v) => !v)}
        >
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
}

/* ── 4 · changing something outside the widget ────────────────────── */

const STORES = {
  portland: { label: "Portland", address: "1104 SE Belmont", fee: "$40" },
  seattle: { label: "Seattle", address: "22 Ballard Ave NW", fee: "$45" },
} as const;

type StoreId = keyof typeof STORES;

const SLOTS = ["Thu 10:00", "Thu 14:30", "Fri 09:15"];

function FittingWidget({ store }: { store: StoreId }) {
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [booked, setBooked] = useState(false);
  const shop = STORES[store];

  return (
    <div className="bg-card rounded-xl border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-ui-sm">Book a bike fitting</p>
        <span className="text-caption text-muted-foreground">
          {shop.address} · {shop.fee}
        </span>
      </div>

      {booked ? (
        <p className="text-caption text-positive mt-3">
          Booked for {slot} in {shop.label}. See you then, {name || "friend"}.
        </p>
      ) : slot === null ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className="text-ui-sm bg-secondary text-muted-foreground hover:text-foreground h-9 rounded-lg px-3 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <label
            htmlFor={`fitting-name-${store}`}
            className="text-caption text-muted-foreground"
          >
            {slot} — who is it for?
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id={`fitting-name-${store}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="text-ui-sm bg-card focus-visible:border-ring focus-visible:ring-ring/50 h-9 min-w-0 flex-1 rounded-lg border px-2.5 outline-none focus-visible:ring-3"
            />
            <Button size="lg" onClick={() => setBooked(true)}>
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FittingPair({ keepsState }: { keepsState: boolean }) {
  const [store, setStore] = useState<StoreId>("portland");

  return (
    <div className="bg-secondary mx-auto w-full max-w-md rounded-xl border p-4">
      <p className="text-caption text-muted-foreground">Choose a shop</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {(Object.keys(STORES) as StoreId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setStore(id)}
            aria-pressed={store === id}
            className={cn(
              "text-ui-sm h-9 rounded-lg px-3 transition-colors",
              store === id
                ? "bg-feature text-feature-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border",
            )}
          >
            {STORES[id].label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {keepsState ? (
          <FittingWidget store={store} />
        ) : (
          <FittingWidget key={store} store={store} />
        )}
      </div>
    </div>
  );
}

/* ── 5 · closing the widget ───────────────────────────────────────── */

function ChatPair({ cleansUp }: { cleansUp: boolean }) {
  const [open, setOpen] = useState(false);
  const [dimmed, setDimmed] = useState(false);
  const [cart, setCart] = useState(2);

  const close = () => {
    setOpen(false);
    if (cleansUp) setDimmed(false);
  };

  return (
    <div className="bg-secondary relative mx-auto min-h-64 w-full max-w-md overflow-hidden rounded-xl border">
      <div className="p-4">
        <div className="text-caption text-muted-foreground flex items-center justify-between gap-3">
          <span>Fernwood Cycles</span>
          <span className="tabular-nums">Basket · {cart}</span>
        </div>
        <p className="text-ui mt-3">Trail Pack 30L</p>
        <p className="text-caption text-muted-foreground mt-1">
          Waterproof roll-top. Fits a helmet and a laptop.
        </p>
        <Button size="lg" className="mt-3" onClick={() => setCart((c) => c + 1)}>
          Add to basket
        </Button>
      </div>

      {dimmed && <div className="bg-foreground/40 absolute inset-0 z-10" />}

      {open && (
        <div className="bg-card shadow-floating absolute right-3 bottom-16 left-3 z-20 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-ui-sm">Ask us anything</p>
            <button
              type="button"
              aria-label="Close chat"
              onClick={close}
              className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-lg"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-caption text-muted-foreground mt-1">
            Ana usually replies in a couple of minutes.
          </p>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
            setDimmed(true);
          }
        }}
        className="bg-feature text-feature-foreground absolute right-3 bottom-3 z-20 grid size-11 place-items-center rounded-full"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ── 6 · the widget's panel against the page's own furniture ──────── */

const HELP_ITEMS = [
  "Track my order",
  "Start a return",
  "Change delivery day",
  "Talk to a human",
];

function HelpPair({ lifted }: { lifted: boolean }) {
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="bg-secondary relative mx-auto min-h-72 w-full max-w-md overflow-hidden rounded-xl border">
      <div className="bg-card absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b px-4">
        <span className="text-ui-sm">Fernwood Cycles</span>
        <span className="text-caption text-muted-foreground">Basket · 2</span>
      </div>

      <div className="px-4 pt-20 pb-4">
        <p className="text-ui">Trail Pack 30L</p>
        <p className="text-caption text-muted-foreground mt-1">
          $128 · free shipping · ships Tuesday
        </p>
        {picked && (
          <p className="text-caption text-positive mt-3">{picked} — on it.</p>
        )}
      </div>

      <div className={cn("absolute right-3 bottom-3", lifted ? "z-30" : "z-10")}>
        {open && (
          <div className="bg-card shadow-floating absolute right-0 bottom-16 w-56 rounded-xl border p-1.5">
            <p className="text-micro text-muted-foreground px-2 py-1.5 uppercase">
              Help &amp; orders
            </p>
            {HELP_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setPicked(item);
                  setOpen(false);
                }}
                className="text-ui-sm hover:bg-secondary flex h-9 w-full items-center rounded-lg px-2 text-left"
              >
                {item}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          aria-label={open ? "Close help" : "Open help"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="bg-feature text-feature-foreground grid size-11 place-items-center rounded-full"
        >
          <Headset className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function MillioncoIsoletDemo() {
  return (
    <div>
      <BeforeAfter
        principle="The signup box looks the way it should, on anyone's site."
        before={<TypePair isolated={false} />}
        after={<TypePair isolated />}
      />

      <BeforeAfter
        principle="The site it sits on keeps looking like itself."
        before={<LeakPair isolated={false} />}
        after={<LeakPair isolated />}
      />

      <BeforeAfter
        principle="The pictures turn up on other people's pages too."
        before={<AssetPair inlined={false} />}
        after={<AssetPair inlined />}
      />

      <BeforeAfter
        principle="Switching shop keeps what you already filled in."
        before={<FittingPair keepsState={false} />}
        after={<FittingPair keepsState />}
      />

      <BeforeAfter
        principle="Closing the chat gives you the page back."
        before={<ChatPair cleansUp={false} />}
        after={<ChatPair cleansUp />}
      />

      <BeforeAfter
        principle="The help menu opens in front of the page, not behind it."
        before={<HelpPair lifted={false} />}
        after={<HelpPair lifted />}
      />
    </div>
  );
}
