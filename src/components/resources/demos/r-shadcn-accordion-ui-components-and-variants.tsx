"use client";

import {
  ChevronDown,
  CreditCard,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Undo2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import type { ComponentType, ReactNode } from "react";

import { BeforeAfter } from "@/components/surface";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Shadcn Studio — Accordion. Sixteen variants of one component.
 *
 * Most of what separates them is invisible from the outside: which
 * icon pack draws the chevron, Base UI versus Radix, the CSS variable
 * that carries the panel height. Seven of the decisions are things a
 * person can actually feel, and those are the ones rebuilt here.
 * ------------------------------------------------------------------ */

type Side = { after: boolean };

function Stage({ children }: { children: ReactNode }) {
  return <div className="bg-background rounded-xl p-3">{children}</div>;
}

function Sheet({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("bg-card rounded-lg border px-4", className)}>
      {children}
    </div>
  );
}

/** The answer. `instant` is the version that simply appears. */
function Panel({
  open,
  instant,
  className,
  children,
  ...rest
}: {
  open: boolean;
  instant?: boolean;
  className?: string;
  children: ReactNode;
} & { id?: string; role?: string; "aria-labelledby"?: string }) {
  const inner = (
    <div className={cn("text-ui-sm text-muted-foreground pr-8 pb-3", className)}>
      {children}
    </div>
  );

  if (instant) {
    return (
      <div {...rest} hidden={!open}>
        {open ? inner : null}
      </div>
    );
  }

  return (
    <div {...rest}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.outQuart }}
            className="overflow-hidden"
          >
            {inner}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Caret({ open, still }: { open: boolean; still?: boolean }) {
  return (
    <ChevronDown
      aria-hidden
      className={cn(
        "text-muted-foreground duration-fast ease-out-quart size-4 shrink-0 transition-transform",
        open && !still && "rotate-180",
      )}
    />
  );
}

/**
 * One row. The whole header is the control, which is the shape every
 * one of the sixteen variants ends up with.
 */
function Row({
  open,
  onToggle,
  instant,
  header,
  className,
  headerClassName,
  panelClassName,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  instant?: boolean;
  header: ReactNode;
  className?: string;
  headerClassName?: string;
  panelClassName?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className={cn("not-last:border-b", className)}>
      <button
        type="button"
        id={`${id}-h`}
        aria-expanded={open}
        aria-controls={`${id}-p`}
        onClick={onToggle}
        className={cn(
          "text-ui duration-fast ease-out-quart flex w-full items-center gap-3 py-3 text-left transition-colors",
          headerClassName,
        )}
      >
        {header}
      </button>
      <Panel
        id={`${id}-p`}
        role="region"
        aria-labelledby={`${id}-h`}
        open={open}
        instant={instant}
        className={panelClassName}
      >
        {children}
      </Panel>
    </div>
  );
}

/* ── 1 · press anywhere on the question ───────────────────────────── */

const FAQ = [
  {
    id: "track",
    q: "How do I track my order?",
    a: "Tracking is emailed the moment your parcel leaves the warehouse, and again if it is rerouted.",
  },
  {
    id: "return",
    q: "What is your return policy?",
    a: "Thirty days from delivery, unworn and in the original packaging. Refunds settle in two working days.",
  },
  {
    id: "human",
    q: "How do I reach a human?",
    a: "Weekdays 09:00–18:00 CET, in the app or by email. Replies usually arrive within a few hours.",
  },
] as const;

function ReachPair({ after }: Side) {
  const [open, setOpen] = useState("track");
  const toggle = (id: string) => setOpen(open === id ? "" : id);

  if (after) {
    return (
      <Stage>
        <Sheet>
          {FAQ.map((row) => (
            <Row
              key={row.id}
              open={open === row.id}
              onToggle={() => toggle(row.id)}
              headerClassName="-mx-2 rounded-lg px-2 hover:bg-secondary"
              header={
                <>
                  <span className="flex-1">{row.q}</span>
                  <Caret open={open === row.id} />
                </>
              }
            >
              {row.a}
            </Row>
          ))}
        </Sheet>
      </Stage>
    );
  }

  return (
    <Stage>
      <Sheet>
        {FAQ.map((row) => {
          const isOpen = open === row.id;
          return (
            <SmallTargetRow
              key={row.id}
              question={row.q}
              open={isOpen}
              onToggle={() => toggle(row.id)}
            >
              {row.a}
            </SmallTargetRow>
          );
        })}
      </Sheet>
    </Stage>
  );
}

function SmallTargetRow({
  question,
  open,
  onToggle,
  children,
}: {
  question: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="not-last:border-b">
      <div className="flex items-center justify-between gap-3 py-3">
        <span className="text-ui">{question}</span>
        <button
          type="button"
          id={`${id}-h`}
          aria-controls={`${id}-p`}
          aria-expanded={open}
          aria-label={`Show the answer to “${question}”`}
          onClick={onToggle}
          className="text-muted-foreground grid size-7 shrink-0 place-items-center rounded-md"
        >
          <Caret open={open} />
        </button>
      </div>
      <Panel
        id={`${id}-p`}
        role="region"
        aria-labelledby={`${id}-h`}
        open={open}
      >
        {children}
      </Panel>
    </div>
  );
}

/* ── 2 · the rest of the page stops jumping ───────────────────────── */

const LINES = [
  {
    id: "retainer",
    label: "Design retainer",
    amount: "€4,200",
    detail: "March, 40 hours at €105. Two review rounds included.",
  },
  {
    id: "illustration",
    label: "Illustration",
    amount: "€1,150",
    detail: "Six spot illustrations for onboarding, source files included.",
  },
  {
    id: "motion",
    label: "Motion",
    amount: "€900",
    detail: "Two loading states and the success animation.",
  },
] as const;

function SmoothPair({ after }: Side) {
  const [open, setOpen] = useState("retainer");

  return (
    <Stage>
      <Sheet>
        {LINES.map((line) => (
          <Row
            key={line.id}
            open={open === line.id}
            instant={!after}
            onToggle={() => setOpen(open === line.id ? "" : line.id)}
            header={
              <>
                <span className="flex-1">{line.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {line.amount}
                </span>
                <Caret open={open === line.id} />
              </>
            }
          >
            {line.detail}
          </Row>
        ))}
      </Sheet>

      <div className="bg-card text-ui mt-1.5 flex h-11 items-center justify-between rounded-lg border px-4">
        <span>Total</span>
        <span className="tabular-nums">€6,250</span>
      </div>
    </Stage>
  );
}

/* ── 3 · the sign says whether it is open ─────────────────────────── */

const SETTINGS = [
  {
    id: "notify",
    label: "Notifications",
    body: "Email for mentions and replies. Push only for direct messages.",
  },
  {
    id: "privacy",
    label: "Privacy",
    body: "Your profile is visible to your workspace only. Search engines are blocked.",
  },
  {
    id: "apps",
    label: "Connected apps",
    body: "Calendar and Drive are connected. Either can be removed without signing out.",
  },
] as const;

function SignPair({ after }: Side) {
  const [open, setOpen] = useState<string[]>(["notify"]);
  const toggle = (id: string) =>
    setOpen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <Stage>
      <Sheet>
        {SETTINGS.map((row) => {
          const isOpen = open.includes(row.id);
          return (
            <Row
              key={row.id}
              open={isOpen}
              onToggle={() => toggle(row.id)}
              header={
                <>
                  <span className="flex-1">{row.label}</span>
                  <Plus
                    aria-hidden
                    className={cn(
                      "text-muted-foreground duration-base ease-out-quart size-4 shrink-0 transition-transform",
                      after && isOpen && "rotate-45",
                    )}
                  />
                </>
              }
            >
              {row.body}
            </Row>
          );
        })}
      </Sheet>
    </Stage>
  );
}

/* ── 4 · which one is open ────────────────────────────────────────── */

const HELP = [
  {
    id: "payments",
    label: "Payments",
    body: "Cards, Apple Pay and bank transfer. A failed payment retries once after 24 hours.",
  },
  {
    id: "refunds",
    label: "Refunds",
    body: "Back on the original card within five working days. Bank transfers take a little longer.",
  },
  {
    id: "account",
    label: "Account",
    body: "Change your email under Settings. Closing an account keeps your invoices for seven years.",
  },
] as const;

function MarkedPair({ after }: Side) {
  const [open, setOpen] = useState("refunds");
  const toggle = (id: string) => setOpen(open === id ? "" : id);

  if (!after) {
    return (
      <Stage>
        <Sheet>
          {HELP.map((row) => (
            <Row
              key={row.id}
              open={open === row.id}
              onToggle={() => toggle(row.id)}
              header={
                <>
                  <span className="flex-1">{row.label}</span>
                  <Caret open={open === row.id} />
                </>
              }
            >
              {row.body}
            </Row>
          ))}
        </Sheet>
      </Stage>
    );
  }

  return (
    <Stage>
      <div className="flex flex-col gap-1.5">
        {HELP.map((row) => {
          const isOpen = open === row.id;
          return (
            <Row
              key={row.id}
              open={isOpen}
              onToggle={() => toggle(row.id)}
              className={cn(
                "bg-card duration-fast ease-out-quart overflow-hidden rounded-lg border transition-colors not-last:border-b",
                isOpen && "border-border-strong",
              )}
              headerClassName={cn("px-4", isOpen && "bg-secondary")}
              panelClassName="px-4 pt-3"
              header={
                <>
                  <span className="flex-1">{row.label}</span>
                  <Caret open={isOpen} />
                </>
              }
            >
              {row.body}
            </Row>
          );
        })}
      </div>
    </Stage>
  );
}

/* ── 5 · the answer you were reading stays open ───────────────────── */

const TERMS = [
  {
    id: "cancel",
    label: "Cancellation",
    body: "Free until 48 hours before departure. After that, half the fare is held as credit for a year.",
  },
  {
    id: "bags",
    label: "Baggage",
    body: "One cabin bag up to 8 kg, plus a small personal item that fits under the seat in front of you.",
  },
  {
    id: "checkin",
    label: "Check-in",
    body: "Opens 24 hours before departure and closes 45 minutes before. At the airport it costs €25.",
  },
] as const;

function StayOpenPair({ after }: Side) {
  const [open, setOpen] = useState<string[]>(["cancel"]);
  const toggle = (id: string) =>
    setOpen((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return after ? [...prev, id] : [id];
    });

  return (
    <Stage>
      <Sheet>
        {TERMS.map((row) => {
          const isOpen = open.includes(row.id);
          return (
            <Row
              key={row.id}
              open={isOpen}
              onToggle={() => toggle(row.id)}
              header={
                <>
                  <span className="flex-1">{row.label}</span>
                  <Caret open={isOpen} />
                </>
              }
            >
              {row.body}
            </Row>
          );
        })}
      </Sheet>
    </Stage>
  );
}

/* ── 6 · rows you can scan ────────────────────────────────────────── */

const TOPICS: {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  group: string;
  body: string;
}[] = [
  {
    id: "parcel",
    icon: Package,
    label: "Where is my parcel?",
    group: "Shipping",
    body: "Enter the order number on the tracking page. The position updates every 30 minutes.",
  },
  {
    id: "return",
    icon: Undo2,
    label: "Send something back",
    group: "Returns",
    body: "Print the label from your order, drop the parcel at any pickup point, keep the receipt.",
  },
  {
    id: "card",
    icon: CreditCard,
    label: "Change the card on file",
    group: "Billing",
    body: "Settings, then Payment. The new card is charged from the next billing date onward.",
  },
];

function ScanPair({ after }: Side) {
  const [open, setOpen] = useState("parcel");

  return (
    <Stage>
      <Sheet>
        {TOPICS.map((row) => {
          const Icon = row.icon;
          const isOpen = open === row.id;
          return (
            <Row
              key={row.id}
              open={isOpen}
              onToggle={() => setOpen(isOpen ? "" : row.id)}
              header={
                after ? (
                  <>
                    <span
                      aria-hidden
                      className="text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full border"
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span>{row.label}</span>
                      <span className="text-caption text-muted-foreground">
                        {row.group}
                      </span>
                    </span>
                    <Caret open={isOpen} />
                  </>
                ) : (
                  <>
                    <span className="flex-1">{row.label}</span>
                    <Caret open={isOpen} />
                  </>
                )
              }
              panelClassName={after ? "pl-12" : undefined}
            >
              {row.body}
            </Row>
          );
        })}
      </Sheet>
    </Stage>
  );
}

/* ── 7 · three short lists instead of one long one ────────────────── */

const GUIDE: {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  items: { id: string; q: string; a: string }[];
}[] = [
  {
    id: "start",
    icon: Sparkles,
    label: "Getting started",
    items: [
      {
        id: "workspace",
        q: "Create a workspace",
        a: "Pick a name and a colour. Everything else can be changed later.",
      },
      {
        id: "invite",
        q: "Invite your team",
        a: "Paste a list of email addresses, or share the join link with your domain.",
      },
      {
        id: "import",
        q: "Import a spreadsheet",
        a: "Drop in a CSV and map the columns once. The mapping is remembered.",
      },
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    label: "Billing",
    items: [
      {
        id: "plan",
        q: "Change your plan",
        a: "Upgrades start immediately, downgrades at the end of the period you paid for.",
      },
      {
        id: "card",
        q: "Update the card on file",
        a: "The new card is charged from the next billing date onward.",
      },
      {
        id: "invoice",
        q: "Download an invoice",
        a: "Every invoice is kept as a PDF under Billing, going back seven years.",
      },
    ],
  },
  {
    id: "account",
    icon: ShieldCheck,
    label: "Account",
    items: [
      {
        id: "password",
        q: "Reset your password",
        a: "The reset link is valid for one hour and can only be used once.",
      },
      {
        id: "2fa",
        q: "Turn on two-factor",
        a: "Use any authenticator app. Ten recovery codes are generated with it.",
      },
      {
        id: "close",
        q: "Close your account",
        a: "Data is deleted after 30 days. Until then, signing back in restores everything.",
      },
    ],
  },
];

const FLAT = GUIDE.flatMap((group) => group.items);

function GroupedPair({ after }: Side) {
  const [open, setOpen] = useState("");
  const [inner, setInner] = useState("");

  if (!after) {
    return (
      <Stage>
        <Sheet>
          {FLAT.map((row) => (
            <Row
              key={row.id}
              open={open === row.id}
              onToggle={() => setOpen(open === row.id ? "" : row.id)}
              header={
                <>
                  <span className="flex-1">{row.q}</span>
                  <Caret open={open === row.id} />
                </>
              }
            >
              {row.a}
            </Row>
          ))}
        </Sheet>
      </Stage>
    );
  }

  return (
    <Stage>
      <Sheet>
        {GUIDE.map((group) => {
          const Icon = group.icon;
          const isOpen = open === group.id;
          return (
            <Row
              key={group.id}
              open={isOpen}
              onToggle={() => setOpen(isOpen ? "" : group.id)}
              panelClassName="pr-0 pl-7"
              header={
                <>
                  <Icon
                    aria-hidden
                    className="text-muted-foreground size-4 shrink-0"
                  />
                  <span className="flex-1">{group.label}</span>
                  <span className="text-caption text-muted-foreground tabular-nums">
                    {group.items.length}
                  </span>
                  <Caret open={isOpen} />
                </>
              }
            >
              <div className="border-l pl-3">
                {group.items.map((row) => (
                  <Row
                    key={row.id}
                    open={inner === row.id}
                    onToggle={() => setInner(inner === row.id ? "" : row.id)}
                    className="not-last:border-b-0"
                    headerClassName="text-ui-sm py-2.5"
                    header={
                      <>
                        <span className="flex-1">{row.q}</span>
                        <Caret open={inner === row.id} />
                      </>
                    }
                  >
                    {row.a}
                  </Row>
                ))}
              </div>
            </Row>
          );
        })}
      </Sheet>
    </Stage>
  );
}

/* ── the page ─────────────────────────────────────────────────────── */

export function ShadcnAccordionUiComponentsAndVariantsDemo() {
  return (
    <div>
      <BeforeAfter
        principle="A question in a list should answer to a press anywhere along the row. Making people aim at a small arrow is work, and the whole row already looks like something you can press."
        before={<ReachPair after={false} />}
        after={<ReachPair after />}
      />
      <BeforeAfter
        principle="Opening an answer should not throw everything below it down the screen. Let the row grow, so the eye can follow where the rest of the page went."
        before={<SmoothPair after={false} />}
        after={<SmoothPair after />}
      />
      <BeforeAfter
        principle="You should be able to tell which rows are open without reading them. The little sign at the end of the row is the cheapest place to say so."
        before={<SignPair after={false} />}
        after={<SignPair after />}
      />
      <BeforeAfter
        principle="When a row is open, it should look open. In a list where every row is identical, the only clue is the text underneath, and that is easy to lose."
        before={<MarkedPair after={false} />}
        after={<MarkedPair after />}
      />
      <BeforeAfter
        principle="Reading one answer should not close another. People compare things — two prices, two policies — and the list should let them hold both."
        before={<StayOpenPair after={false} />}
        after={<StayOpenPair after />}
      />
      <BeforeAfter
        principle="A list you scan works differently from a list you read. A small picture and the section a row belongs to let people jump straight to the right one."
        before={<ScanPair after={false} />}
        after={<ScanPair after />}
      />
      <BeforeAfter
        principle="Nine questions in a single column is a wall. Sorted into three named piles, you only ever open the pile you came for."
        before={<GroupedPair after={false} />}
        after={<GroupedPair after />}
      />
    </div>
  );
}
