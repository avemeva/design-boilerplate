import type { ComponentType } from "react";

import { GENERATED } from "@/components/resources/demos/generated";

import { OklchDemo } from "@/components/resources/demos/color";
import {
  AgentationDemo,
  ReactGrabDemo,
  ReactScanDemo,
  StaticAnalysisDemo,
} from "@/components/resources/demos/tooling";
import {
  CommandDemo,
  FittsDemo,
  HashvatarDemo,
  InlineFeedbackDemo,
  SonnerDemo,
} from "@/components/resources/demos/interaction";
import {
  EasingDemo,
  NumberFlowDemo,
  ProportionDemo,
  ShadowDemo,
  TransitionDemo,
} from "@/components/resources/demos/visual";

/**
 * Live applications of a resource, keyed by slug.
 *
 * The bar for adding one: it has to *work*, and it has to show the
 * technique being applied to this codebase — not a screenshot, not a
 * paraphrase. `applied` points at where the same idea is already load
 * bearing in the project, so the demo is evidence rather than a toy.
 */
export interface Demo {
  /** Two or three plain sentences: what this lets you do. */
  objective: string;
  Component: ComponentType;
}

const OBJ = {
  "react-scan":
    "See which parts of the page re-render. Turn it on and watch the counters below light up.",
  "react-grab":
    "Click any element and get its component, file and styles as text to paste to an agent. Try it on the card below.",
  agentation:
    "Pin a note onto any element on the page and hand it to an agent. The toolbar at the bottom of this window is it, running.",
  biome:
    "Static checks that caught real bugs in this repo. Filter by tool to see what each found.",
  doctor:
    "Static checks that caught real bugs in this repo, including one of this project's own rules being broken.",
} as const;

export const DEMOS: Record<string, Demo> = {
  "laws-of-ux": {
    objective: "Two menus. One you cannot miss, one where the gaps between rows swallow your clicks. The counter shows where they went.",
    Component: FittsDemo,
  },
  "design-spells": {
    objective: "Copy feedback where your eye already is, versus a toast on the other side of the screen. Press both.",
    Component: InlineFeedbackDemo,
  },
  "details-that-make-interfaces-feel-better": {
    objective: "Copy feedback on the button you pressed, versus in a toast. Press both and see which you notice.",
    Component: InlineFeedbackDemo,
  },
  sonner: {
    objective: "The three moments a notification is right: something finished in the background, something was deleted and can be undone, something is still loading. Press each.",
    Component: SonnerDemo,
  },
  k: {
    objective: "The command menu. Type to filter, arrow keys to move, Enter to pick.",
    Component: CommandDemo,
  },
  hashvatar: {
    objective: "Coloured avatars generated from a name, with nothing stored. Type a name and watch them change and stay consistent.",
    Component: HashvatarDemo,
  },
  "easing-graphs": {
    objective: "Six animation curves racing at the same speed, so only the shape differs. Press play.",
    Component: EasingDemo,
  },
  "animations-dev": {
    objective: "Six animation curves racing at the same speed. Press play and pick the one that feels right.",
    Component: EasingDemo,
  },
  "12-principles-of-animation": {
    objective: "The same box appearing three ways at identical speed. The one starting from nothing feels slow. Press replay.",
    Component: ProportionDemo,
  },
  "transitions-dev": {
    objective: "Swapping one label for another so it reads as one thing changing, not two things fading. Press advance.",
    Component: TransitionDemo,
  },
  numberflow: {
    objective: "Numbers that roll to their new value without the layout jumping. Press the buttons.",
    Component: NumberFlowDemo,
  },
  shadowlab: {
    objective: "A card with no shadow, a hairline, and a full shadow. Switch between them on the real page background.",
    Component: ShadowDemo,
  },
  "oklch-fyi": {
    objective: "Build a colour ramp by dragging two sliders. The contrast score under each swatch tells you if text will be readable.",
    Component: OklchDemo,
  },
  "react-scan": { objective: OBJ["react-scan"], Component: ReactScanDemo },
  "react-grab": { objective: OBJ["react-grab"], Component: ReactGrabDemo },
  "aidenybai-react-grab": { objective: OBJ["react-grab"], Component: ReactGrabDemo },
  agentation: { objective: OBJ.agentation, Component: AgentationDemo },
  "agentation-2": { objective: OBJ.agentation, Component: AgentationDemo },
  "biomejs-biome": { objective: OBJ.biome, Component: StaticAnalysisDemo },
  "millionco-react-doctor": { objective: OBJ.doctor, Component: StaticAnalysisDemo },
};

/**
 * Hand-written demos take precedence over the generated ones — they are
 * the reference quality bar and several cover more than one slug.
 */
export const ALL_DEMOS: Record<string, Demo> = { ...GENERATED, ...DEMOS };

export function getDemo(slug: string) {
  return ALL_DEMOS[slug];
}
