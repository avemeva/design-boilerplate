#!/usr/bin/env python3
"""Taste check — does this project still feel like `design-reference/`?

Two passes, both mechanical, both derived from DESIGN.md.

  python3 scripts/taste-check.py --code
  python3 scripts/taste-check.py --image shot.png
  python3 scripts/taste-check.py --calibrate      # run it on the reference

The `--calibrate` run is the important one: it points the image checks
at `design-reference/*.png`. If the checker fails the images it was
derived from, the checker is wrong, not the project.

Exit code is the number of failures, so it drops into CI.
"""

from __future__ import annotations

import argparse
import math
import pathlib
import re
import sys
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

# ── thresholds, straight out of DESIGN.md ────────────────────────────
BORDER_CONTRAST = (1.05, 1.35)   # move 2: barely visible
SURFACE_STEPS = (2, 4)           # move 1: three surfaces, so 2-3 steps
MAX_SATURATED_SHARE = 0.04       # move 3: colour belongs to content
MIN_CONTROL_RATIO = 2.4          # move 5: rows ~2.7x their font size


# ── colour helpers ───────────────────────────────────────────────────
def _lin(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(rgb) -> float:
    r, g, b = (_lin(v / 255) for v in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def saturation(rgb) -> float:
    r, g, b = (v / 255 for v in rgb[:3])
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == 0:
        return 0.0
    return (mx - mn) / mx


class Report:
    def __init__(self, title: str):
        self.title = title
        self.rows: list[tuple[str, bool, str]] = []

    def check(self, name: str, ok: bool, detail: str) -> None:
        self.rows.append((name, ok, detail))

    def skip(self, reason: str) -> None:
        self.rows.append((f"skipped — {reason}", None, ""))

    def failures(self) -> int:
        return sum(1 for _, ok, _ in self.rows if ok is False)

    def print(self) -> None:
        print(f"\n\033[1m{self.title}\033[0m")
        for name, ok, detail in self.rows:
            if ok is None:
                mark = "\033[33mskip \033[0m"
            else:
                mark = "\033[32m  ok \033[0m" if ok else "\033[31mFAIL \033[0m"
            print(f"  {mark} {name:38s} {detail}")


# ── pass 1: the code ─────────────────────────────────────────────────
RAW_RAMP = re.compile(
    r"\b(?:bg|text|border|ring|from|to|via|fill|stroke)-"
    r"(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|"
    r"emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b"
)
HEX = re.compile(
    # Real hex lengths only. `#4021` in copy is an invoice number.
    # Canvas code composes rgba() from variables; that is fine.
    # A literal channel value is not.
    # `rgba(0,0,0,0)` is the iOS tap-highlight reset the guidelines
    # require; it has no token form.
    # 6 or 8 digits is always a colour. A 3-digit one only counts if it
    # contains a letter — "#482" is a PR number, "#fff" is white.
    r"#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#(?=[0-9a-fA-F]{3}\b)[0-9a-fA-F]*[a-fA-F][0-9a-fA-F]*\b"
    r"|\brgba?\((?!\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\))\s*\d"
)
SCALE_ARB = re.compile(
    # em-relative inline code (text-[0.9em]) is legitimate; it scales
    # with its parent rather than opting out of the scale.
    r"\b(?:p|px|py|m|mx|my|gap|w|h|size|text|rounded)-\[(?![\d.]+(?:em|%)\])[^\]]+\]"
)
SHORT_CONTROL = re.compile(
    # control-shaped: a height paired with horizontal padding
    r"\bh-[1-7]\b(?![\d.])(?=[^\"]*\bpx-\d)"
)
TRANSITION_ALL = re.compile(r"\btransition-all\b")
BORDER_2 = re.compile(r"\bborder-2\b")


def code_pass() -> Report:
    r = Report("Code — DESIGN.md conformance")
    files = [
        f for f in SRC.rglob("*.tsx")
        # ui/ is vendored shadcn source, checked separately by biome.
        # layout.tsx carries `themeColor`, which the metadata spec
        # requires as a literal hex — it has no token form.
        if "components/ui/" not in str(f) and f.name != "layout.tsx"
    ]
    # A demo may deliberately render a violation as its counter-example.
    # An explicit `taste-check-ignore` comment on the line above opts out.
    def strip_ignored(src: str) -> str:
        # Drop block comments first: a rule quoted in a comment is
        # documentation, not a violation.
        src = re.sub(r"/\*[\s\S]*?\*/", "", src)
        out, armed = [], False
        for line in src.splitlines():
            stripped = line.strip()
            if "taste-check-ignore" in stripped:
                armed = True
                continue
            if armed:
                # Skip continuation comment lines, then the next real line.
                if stripped.startswith("//"):
                    continue
                armed = False
                continue
            out.append(line)
        return "\n".join(out)

    blob = "\n".join(strip_ignored(f.read_text()) for f in files)

    def hits(rx):
        return rx.findall(blob)

    raw = hits(RAW_RAMP)
    r.check("move 3 · no raw tailwind ramps", not raw,
            f"{len(raw)} found" + (f" e.g. {raw[0]}" if raw else ""))

    hexes = [h for h in hits(HEX) if not h.startswith("rgb(9 9 11")]
    r.check("move 3 · no colour literals", not hexes,
            f"{len(hexes)} found" + (f" e.g. {hexes[0]}" if hexes else ""))

    arb = hits(SCALE_ARB)
    r.check("no off-scale values", not arb,
            f"{len(arb)} found" + (f" e.g. {arb[0]}" if arb else ""))

    short = hits(SHORT_CONTROL)
    r.check("move 5 · controls >= h-8 (32px)", not short,
            f"{len(short)} controls shorter than 32px")

    ta = hits(TRANSITION_ALL)
    r.check("move 10 · no transition-all", not ta, f"{len(ta)} found")

    b2 = hits(BORDER_2)
    r.check("move 2 · no 2px borders", not b2, f"{len(b2)} found")

    # Found by cropping the reference, not by reasoning: status/metadata
    # pills are fully rounded, not 6px boxes.
    boxy = re.findall(r'text-micro[^"]*uppercase[^"]*rounded-(?:sm|md)\b'
                      r'|rounded-(?:sm|md)[^"]*text-micro[^"]*uppercase', blob)
    r.check("pills are fully rounded", not boxy,
            f"{len(boxy)} boxy uppercase pills")

    # move 8: lucide defaults to 2px. Turning it down to 1.5 everywhere
    # was a mistake that made the icons look thin and generic.
    thin = re.findall(r'stroke-\[1\.?2?5?\]', blob)
    r.check("move 8 · icons at the 2px default", not thin,
            f"{len(thin)} thinned strokes")

    # move 9: the accent marks state — an active row, a playhead, a
    # selected pin. What it must never do is FILL AN ACTION. The tell is
    # the accent paired with inverse text, which is a button.
    #
    # A blanket ban on `bg-accent-solid` was tried and was wrong: it
    # flagged five legitimate state indicators and nothing else.
    accent_button = re.findall(
        r'bg-accent-solid[^"]*\btext-(?:primary-foreground|background)\b'
        r'|text-(?:primary-foreground|background)[^"]*\bbg-accent-solid\b',
        blob,
    )
    r.check("move 9 · accent never fills an action", not accent_button,
            f"{len(accent_button)} accent-filled action(s)")


    return r


# ── pass 2: the tokens ───────────────────────────────────────────────
def oklch_to_rgb(L: float, C: float, H: float):
    h = math.radians(H)
    a, b = C * math.cos(h), C * math.sin(h)
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

    def enc(x):
        x = max(0.0, min(1.0, x))
        return (12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055) * 255

    return (
        enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    )


def token_pass() -> Report:
    r = Report("Tokens — globals.css against the measured reference")
    css = (SRC / "app" / "globals.css").read_text()
    block = re.search(r":root \{(.*?)\n\}", css, re.S).group(1)

    def tok(name):
        m = re.search(rf"--{name}: oklch\(([\d.]+) ([\d.]+) ([\d.]+)", block)
        return oklch_to_rgb(*(float(m.group(i)) for i in (1, 2, 3))) if m else None

    bg, sec, card, border = (tok(k) for k in ("background", "secondary", "card", "border"))

    r.check("move 1 · page is not white", luminance(bg) < 0.93,
            f"canvas luminance {luminance(bg):.3f}")

    ladder = [luminance(x) for x in (bg, sec, card)]
    ascending = ladder[0] < ladder[1] <= ladder[2]
    r.check("move 1 · three surfaces, ascending", ascending,
            " -> ".join(f"{v:.3f}" for v in ladder))

    cb = contrast(border, card)
    r.check("move 2 · border barely visible",
            BORDER_CONTRAST[0] <= cb <= BORDER_CONTRAST[1],
            f"{cb:.2f}:1 (want {BORDER_CONTRAST[0]}-{BORDER_CONTRAST[1]})")

    for name, floor in (("muted-foreground", 4.5), ("foreground", 4.5)):
        c = contrast(tok(name), card)
        r.check(f"legibility · {name} on card", c >= floor, f"{c:.2f}:1")

    return r


# ── pass 3: a rendered screenshot ────────────────────────────────────
# Not screenshots of a running UI — a comparison poster of nine sidebar
# strips on black. Surface-area and edge-contrast checks are meaningless
# on a composition like that, so it is skipped rather than fudged.
NOT_A_UI_SHOT = {"05-sidebar-variants-dark.png"}


def image_pass(path: pathlib.Path) -> Report:
    from PIL import Image

    r = Report(f"Image — {path.name}")
    if path.name in NOT_A_UI_SHOT:
        r.skip("comparison poster, not a UI screenshot")
        return r
    im = Image.open(path).convert("RGB")
    im.thumbnail((1200, 1200))
    px = list(im.getdata())
    total = len(px)

    counts = Counter(px)
    W, H = im.size
    dark = luminance(counts.most_common(1)[0][0]) < 0.5

    # move 1: the PAGE is the outer ring, not the dominant colour. In a
    # content-heavy screenshot the commonest pixel is the content pane,
    # which is legitimately white — checking that was the bug.
    ring = []
    for x in range(0, W, 3):
        ring += [im.getpixel((x, 1)), im.getpixel((x, H - 2))]
    for y in range(0, H, 3):
        ring += [im.getpixel((1, y)), im.getpixel((W - 2, y))]
    page = Counter(ring).most_common(1)[0][0]
    r.check("move 1 · page is not pure white",
            luminance(page) < 0.94 or dark,
            f"page edge {'#%02x%02x%02x' % page}")

    # move 1: distinct surfaces carrying real area. Dark themes ladder
    # downward, so the band has to follow the theme.
    lo, hi = (0.0, 0.35) if dark else (0.7, 1.01)
    surfaces = [
        c for c, n in counts.most_common(40)
        if n / total > 0.02 and lo <= luminance(c) <= hi and saturation(c) < 0.10
    ]
    merged: list[tuple] = []
    for c in surfaces:
        if all(abs(luminance(c) - luminance(m)) > 0.008 for m in merged):
            merged.append(c)
    r.check("move 1 · 2-4 neutral surface steps",
            SURFACE_STEPS[0] <= len(merged) <= SURFACE_STEPS[1] + 1,
            f"{len(merged)}: " + " ".join("#%02x%02x%02x" % m for m in merged[:5]))

    # move 3: saturated pixels belong to content, so there should be few
    sat_share = sum(n for c, n in counts.items() if saturation(c) > 0.35) / total
    r.check("move 3 · chrome is not saturated",
            sat_share <= MAX_SATURATED_SHARE,
            f"{sat_share*100:.2f}% of pixels (max {MAX_SATURATED_SHARE*100:.0f}%)")

    # move 2: surface-to-surface edges must stay soft. Both sides have to
    # be surfaces — sampling any neutral transition picked up glyph
    # antialiasing and reported text edges as borders, which is what
    # made this fail against its own reference.
    surface_lo = 0.12 if dark else 0.80
    edges = []
    for frac in (0.25, 0.5, 0.75):
        y = int(H * frac)
        prev = None
        for x in range(int(W * 0.02), int(W * 0.98)):
            c = im.getpixel((x, y))
            if (
                prev
                and saturation(c) < 0.1 and saturation(prev) < 0.1
                and luminance(c) > surface_lo and luminance(prev) > surface_lo
            ):
                ratio = contrast(c, prev)
                if 1.01 < ratio < 3:
                    edges.append(ratio)
            prev = c
    if edges:
        edges.sort()
        p90 = edges[int(len(edges) * 0.9)]
        r.check("move 2 · neutral edges stay soft", p90 <= BORDER_CONTRAST[1] + 0.15,
                f"90th pct edge {p90:.2f}:1 over {len(edges)} edges")
    else:
        r.check("move 2 · neutral edges stay soft", True, "no edges sampled")

    return r


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", action="store_true")
    ap.add_argument("--image", type=pathlib.Path)
    ap.add_argument("--calibrate", action="store_true",
                    help="run image checks against design-reference/")
    a = ap.parse_args()

    reports = []
    if a.calibrate:
        for f in sorted((ROOT / "design-reference").glob("*.png")):
            reports.append(image_pass(f))
    elif a.image:
        reports.append(image_pass(a.image))
    else:
        reports.append(code_pass())
        reports.append(token_pass())

    fails = 0
    for rep in reports:
        rep.print()
        fails += rep.failures()

    colour = "\033[31m" if fails else "\033[32m"
    print("\n" + colour + str(fails) + " failure(s)\033[0m")
    return fails


if __name__ == "__main__":
    sys.exit(main())
