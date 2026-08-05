/**
 * Motion tokens.
 *
 * These mirror the CSS custom properties in `globals.css` one-for-one.
 * Use these when animating with `motion/react`; use the Tailwind
 * utilities (`duration-fast`, `ease-out-quart`) when a CSS transition
 * will do.
 *
 * Rules that matter more than the numbers:
 *
 * 1. Anything the user triggers directly resolves in <= 200ms.
 * 2. Entrances use ease-out. Exits use ease-in or are instant.
 * 3. Scale animations start near their target (0.96 -> 1), never 0 -> 1.
 * 4. High-frequency, low-novelty actions get no animation at all.
 *
 * See `docs/motion.md` for the reasoning.
 */

/** Seconds — the unit `motion/react` expects. */
export const duration = {
  /** Hover, press, focus. Barely perceptible, but not a jump cut. */
  instant: 0.1,
  /** Toggles, small state flips, tooltip fade. */
  fast: 0.15,
  /** Default for anything interactive: dropdowns, popovers, tabs. */
  base: 0.2,
  /** Dialogs, sheets, large surfaces entering. */
  slow: 0.3,
  /** Full-page or hero transitions. Use sparingly. */
  slower: 0.5,
} as const;

/** Cubic-bezier control points in `motion/react` array form. */
export const ease = {
  outQuad: [0.25, 0.46, 0.45, 0.94],
  outCubic: [0.215, 0.61, 0.355, 1],
  /** The workhorse. Snappy start, soft landing. */
  outQuart: [0.165, 0.84, 0.44, 1],
  /** Very fast start — good for things flying in from off-screen. */
  outExpo: [0.19, 1, 0.22, 1],
  inOutCubic: [0.645, 0.045, 0.355, 1],
  inOutQuart: [0.77, 0, 0.175, 1],
  /** Overshoots ~8%. Playful. Never on something the user does often. */
  spring: [0.34, 1.56, 0.64, 1],
} as const;

/**
 * Physical spring configs. Prefer these over duration-based tweens for
 * anything that follows a gesture or can be interrupted mid-flight —
 * springs retarget gracefully, tweens restart.
 */
export const spring = {
  /** Snappy, almost no overshoot. Menus, popovers. */
  snappy: { type: "spring", stiffness: 550, damping: 45, mass: 1 },
  /** Default surface motion. Dialogs, sheets, cards. */
  smooth: { type: "spring", stiffness: 350, damping: 35, mass: 1 },
  /** Visible bounce. Success states, playful confirmations. */
  bouncy: { type: "spring", stiffness: 400, damping: 22, mass: 1 },
} as const;

/* ------------------------------------------------------------------ *
 * Ready-made variants
 * ------------------------------------------------------------------ */

/** Fade + a short lift. The default entrance for content blocks. */
export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: ease.outQuart },
  },
} as const;

/** Scale from 0.96, not 0. Dialogs, popovers, menus. */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.base, ease: ease.outQuart },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: duration.fast, ease: ease.outQuad },
  },
} as const;

/**
 * Parent for staggered lists. Keep `staggerChildren` small — anything
 * above ~60ms reads as a slow cascade rather than a group arriving.
 */
export const stagger = (staggerChildren = 0.04, delayChildren = 0) =>
  ({
    hidden: {},
    visible: { transition: { staggerChildren, delayChildren } },
  }) as const;

/** Press feedback. 0.97, not 0.8 — buttons are small already. */
export const press = {
  whileTap: { scale: 0.97 },
  transition: spring.snappy,
} as const;
