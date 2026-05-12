/**
 * Life Relay Design Tokens — single source of truth shared by Tailwind CSS and
 * pdf-lib renderers. No hex literals or magic numbers should appear in
 * component code or the Tailwind config — all values flow from this file.
 *
 * Aligned with UX Design Specification Step 8 (Visual Foundation, 2026-04-30).
 *
 * Back-compat note: the `primary` (teal) palette is preserved for the existing
 * free-tier product. New surfaces use `accent` (Deep Warm Umber) per UX Step 8.
 * A future story (Epic 1) will migrate `primary` references → `accent` and
 * retire the teal palette.
 */

// ============================================================================
// COLOR
// ============================================================================
//
// Each color is an HSL string. Tailwind consumes these directly; pdf-lib code
// converts via the `pdfRgb()` helper at the bottom of this file.

export const color = {
  // Brand accent — Deep Warm Umber (UX Step 8). Color of old legal paper,
  // notary stamps, archival folders. Provisional pending five-conversation
  // user research validation.
  accent: {
    '050': 'hsl(25, 30%, 96%)',
    '100': 'hsl(25, 35%, 92%)',
    '500': 'hsl(25, 28%, 60%)',
    '600': 'hsl(25, 32%, 50%)',
    '700': 'hsl(25, 35%, 40%)', // primary brand accent (default)
    '800': 'hsl(25, 36%, 30%)',
    '900': 'hsl(25, 38%, 22%)',
  },

  // Neutral surface — warm grays with slight umber undertone.
  surface: {
    ivory: 'hsl(40, 25%, 98%)',
    bone: 'hsl(35, 18%, 95%)',
    stone: 'hsl(30, 12%, 88%)',
  },

  // Text colors (warm dark; not pure black).
  text: {
    primary: 'hsl(25, 18%, 18%)',
    secondary: 'hsl(25, 12%, 38%)',
    tertiary: 'hsl(25, 8%, 55%)',
    muted: 'hsl(25, 6%, 70%)',
  },

  // Borders.
  border: {
    DEFAULT: 'hsl(25, 12%, 82%)',
    subtle: 'hsl(25, 10%, 90%)',
  },

  // Functional status colors — muted, never alarm-bright.
  status: {
    success: 'hsl(95, 22%, 45%)',
    successBg: 'hsl(95, 30%, 94%)',
    warning: 'hsl(35, 50%, 50%)',
    warningBg: 'hsl(35, 50%, 94%)',
    error: 'hsl(15, 45%, 50%)', // soft terracotta — never alarm-red
    errorBg: 'hsl(15, 45%, 94%)',
  },

  // Emotional semantic layer — distinct from functional status. Carries
  // relational meaning ("this matters" / "you're at rest" / "decision pending")
  // rather than system state.
  emo: {
    matters: 'hsl(25, 35%, 40%)', // same as accent-700
    rest: 'hsl(40, 25%, 98%)', // same as surface-ivory
    pending: 'hsl(35, 30%, 85%)',
  },

  // Back-compat: existing free-tier product uses `primary-*` (teal). Preserved
  // unchanged so existing UI continues to render identically. Future migration
  // story moves usages to `accent`.
  primary: {
    '50': '#f0fdfa',
    '100': '#ccfbf1',
    '200': '#99f6e4',
    '300': '#5eead4',
    '400': '#2dd4bf',
    '500': '#14b8a6',
    '600': '#0d9488',
    '700': '#0f766e',
    '800': '#115e59',
    '900': '#134e4a',
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  family: {
    // Heading — archival, structured, confident.
    heading:
      '"Source Serif 4", "Source Serif Pro", Georgia, "Times New Roman", serif',
    // Body / UI.
    body: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    // Vault data values (BIP-39 words, account numbers, fingerprints).
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },

  // Modular type scale (~1.25 ratio). Tuple = [size, lineHeight].
  scale: {
    'display-xl': ['48px', '1.15'],
    'display-lg': ['36px', '1.2'],
    'heading-xl': ['28px', '1.3'],
    'heading-lg': ['22px', '1.35'],
    'heading-md': ['18px', '1.4'],
    'body-lg': ['18px', '1.65'],
    'body-md': ['16px', '1.6'],
    'body-sm': ['14px', '1.55'],
    label: ['14px', '1.45'],
    caption: ['13px', '1.45'],
    'mono-md': ['16px', '1.5'],
    'mono-sm': ['14px', '1.5'],
  },

  weight: {
    regular: '400',
    medium: '500',
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================
//
// Tailwind's default 4px-base scale is preserved. Witness Line padding-left is
// fixed at `space-6` (24px) per UX Step 8.

export const spacing = {
  witnessLinePaddingLeft: '1.5rem', // space-6 (24px); locked
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================
//
// Tight — sharp-but-soft. No pillowy `lg` radius (saccharine).

export const radius = {
  sm: '4px',
  md: '6px',
  full: '9999px',
} as const;

// ============================================================================
// WITNESS LINE
// ============================================================================
//
// The structural visual signature. 3px accent-700 left border on every
// section that contains user-recorded data. Renders identically in Tailwind
// and pdf-lib.

export const witnessLine = {
  width: '3px',
  widthPt: 3, // pdf-lib points
  color: color.accent['700'],
} as const;

// ============================================================================
// MOTION
// ============================================================================
//
// 200ms ease-out is the default. `prefers-reduced-motion` collapses durations
// to 0ms or crossfade-only at the component layer. Provisional pending
// grief-mode validation (UX Step 6 pressure-test).

export const motion = {
  fast: '100ms',
  DEFAULT: '200ms',
  slow: '300ms',
  easing: 'ease-out',
} as const;

// ============================================================================
// SHADOW
// ============================================================================
//
// Sparingly used — for interactive states only, not visual hierarchy.

export const shadow = {
  focus: `0 0 0 3px hsl(25, 35%, 40%, 0.4)`, // accent-tinted 3px ring
  hover: `0 1px 2px hsl(25, 18%, 18%, 0.06), 0 2px 4px hsl(25, 18%, 18%, 0.04)`,
  modal: `0 8px 24px hsl(25, 18%, 18%, 0.10)`,
} as const;

// ============================================================================
// ICON
// ============================================================================
//
// Lucide-vue-next, 1.5px stroke (Lucide default), single weight, no fills.

export const icon = {
  size: {
    sm: 16,
    md: 20,
    lg: 24,
  },
  strokeWidth: 1.5,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================
//
// Phone-first. Tailwind defaults preserved.

export const breakpoint = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

// ============================================================================
// PDF
// ============================================================================
//
// PDF generators use neutral grays + an existing teal brand color. Tokens
// preserve the legacy palette so the visual output is byte-identical to the
// pre-token-bridge version. Future story can migrate the brand color to the
// new Deep Warm Umber accent if Brad decides the PDFs should rebrand.
//
// All values exposed as 0-1 RGB tuples (pdf-lib's `rgb()` arg shape) so PDF
// code never calls `pdfRgb()` for pure-PDF colors.

export const pdfColor = {
  // Brand
  brandTeal: [0.06, 0.46, 0.43] as RgbTuple, // existing brand teal #0F756E

  // Status / accent
  emergencyRed: [0.8, 0.15, 0.15] as RgbTuple,
  amber: [0.71, 0.42, 0.04] as RgbTuple,
  amberText: [0.5, 0.4, 0.1] as RgbTuple,
  amberBorder: [0.85, 0.7, 0.3] as RgbTuple,

  // Pure black & white
  black: [0, 0, 0] as RgbTuple,
  white: [1, 1, 1] as RgbTuple,

  // Text emphasis levels (neutral grays)
  textHeavy: [0.1, 0.1, 0.1] as RgbTuple,
  textDark: [0.15, 0.15, 0.15] as RgbTuple,
  textMedium: [0.2, 0.2, 0.2] as RgbTuple,
  textChecklist: [0.3, 0.3, 0.3] as RgbTuple,
  textBrandDate: [0.35, 0.35, 0.35] as RgbTuple,
  textLabel: [0.4, 0.4, 0.4] as RgbTuple,
  textGray: [0.45, 0.45, 0.45] as RgbTuple,
  textMuted: [0.5, 0.5, 0.5] as RgbTuple,

  // Section header text (slightly purple-tinted)
  sectionHeaderText: [0.2, 0.2, 0.3] as RgbTuple,

  // Backgrounds
  bgSectionHeader: [0.93, 0.93, 0.95] as RgbTuple, // attorney prep section header
  bgSectionTitle: [0.93, 0.93, 0.93] as RgbTuple,  // emergency sheet section title
  bgDisclaimerCream: [1, 0.97, 0.9] as RgbTuple,
  bgRunbookIntro: [0.95, 0.99, 0.98] as RgbTuple,
  bgRunbookCircle: [0.93, 0.99, 0.97] as RgbTuple,

  // Borders / dividers
  dividerLight: [0.85, 0.85, 0.85] as RgbTuple,
  dividerMedium: [0.7, 0.7, 0.7] as RgbTuple,
  ruleColor: [0.82, 0.82, 0.82] as RgbTuple,
} as const;

/**
 * PDF-specific small-text + layout scale.
 *
 * These sizes are smaller than the UX-spec scale (which starts at 13pt) and
 * exist because PDFs need denser typography for footers, inline labels,
 * checklists, and other secondary content where a 14pt minimum would waste
 * paper. The UX scale (`pdfTypeScale`) is the source of truth for body-text
 * and heading-level content; this scale is the source of truth for everything
 * smaller plus layout primitives (line heights, stroke widths).
 */
export const pdfSize = {
  // Small text (below UX scale)
  body: 9,
  bodySmall: 8,
  bodyTiny: 7,
  label: 8,
  labelSmall: 7,
  caption: 7,
  pageNumber: 7,

  // Inter-tier headings (between bodyMd 16 and headingMd 18, or item-level)
  itemHeading: 10,
  itemHeadingPlus: 11,
  inlineCallout: 12,
  sectionTitle: 9,
  sectionTitleAttorneyPrep: 10,

  // Layout sizes
  lineHeight: 13,

  // Stroke widths
  thinRule: 0.5,
  borderWidth: 1,
} as const;

// ============================================================================
// PDF PAGE GEOMETRY (Story 1.2)
// ============================================================================
//
// US Letter dimensions in pdf-lib points (72pt = 1 inch). Per-generator margins
// preserve the visual layout of the existing 5 generators while keeping every
// coordinate origin in the token module.

export const pdfPage = {
  widthPt: 612, // 8.5 in
  heightPt: 792, // 11 in
  // Margins picked to match each generator's pre-tokenization layout:
  marginGenerator: 54, // full vault PDF — 0.75 in
  marginEmergencySheet: 36, // emergency sheet — 0.5 in (denser one-page layout)
  marginAttorneyPrep: 50, // attorney prep packet
  marginRunbook: 54, // runbook ("For My Family")
} as const;

// ============================================================================
// PDF TYPE SCALE (Story 1.2)
// ============================================================================
//
// Numeric pt values aligned with the UX type scale (UX Step 8). Screen scale
// stores [size, lineHeight] tuples in px; PDF scale stores raw pt numbers
// since pdf-lib's `drawText({ size })` expects a number. Sizes are numerically
// equal across surfaces (16px on screen = 16pt in print) so visual continuity
// holds.
//
// `titlePage` is an extra step beyond the UX scale for the full vault PDF's
// brand heading. Marketing-style display sizes are intentionally above the
// core scale.

export const pdfTypeScale = {
  displayXl: 48,
  displayLg: 36,
  titlePage: 42, // full vault PDF brand heading
  headingXl: 28,
  headingLg: 22,
  headingMd: 18,
  bodyLg: 18,
  bodyMd: 16,
  bodySm: 14,
  label: 14,
  caption: 13,
  monoMd: 16,
  monoSm: 14,
} as const;

// ============================================================================
// PDF FONT ROLES (Story 1.2)
// ============================================================================
//
// Role identifiers consumed by `src/pdf/fonts.ts`. Generators reference roles
// (`pdfFont.headingMedium`), never filenames. The loader maps each role to a
// static-instance TTF subset under `public/fonts/`.
//
// Locked decisions (architecture.md §Design-Token-Bridge, UX §Typeface-Pairing):
// - Source Serif 4 — Regular 400, Medium 500, Italic 400 (headings)
// - Inter           — Regular 400, Medium 500 (body / UI)
// - JetBrains Mono  — Regular 400 (vault-data values)

export const pdfFont = {
  headingRegular: 'source-serif-4-regular',
  headingMedium: 'source-serif-4-medium',
  headingItalic: 'source-serif-4-italic',
  bodyRegular: 'inter-regular',
  bodyMedium: 'inter-medium',
  monoRegular: 'jetbrains-mono-regular',
} as const;

// ============================================================================
// PDF SPACING (Story 1.2)
// ============================================================================
//
// Numeric pt values for PDF coordinate-space. `witnessLinePaddingLeftPt`
// mirrors the screen `spacing.witnessLinePaddingLeft` ('1.5rem' = 24px) so the
// Witness Line content offset is identical across surfaces.

export const pdfSpacing = {
  witnessLinePaddingLeftPt: 24, // pdf-lib pt; matches screen space-6
} as const;

// ============================================================================
// UNIFIED EXPORT
// ============================================================================

export const tokens = {
  color,
  typography,
  spacing,
  radius,
  witnessLine,
  motion,
  shadow,
  icon,
  breakpoint,
  pdfColor,
  pdfSize,
  pdfPage,
  pdfTypeScale,
  pdfFont,
  pdfSpacing,
} as const;

export type Tokens = typeof tokens;

// ============================================================================
// pdf-lib HELPER
// ============================================================================
//
// pdf-lib's `rgb()` takes three 0-1 floats. Convert HSL strings to RGB tuples
// at draw time. Used by `src/pdf/*.ts` consumers.

export type RgbTuple = readonly [number, number, number];

/**
 * Parse an HSL string of the form `hsl(H, S%, L%)` or
 * `hsl(H, S%, L%, A)` and return RGB as a 0-1 tuple. Alpha is ignored — pdf-lib
 * handles opacity separately.
 *
 * Throws on malformed input rather than silently returning black.
 */
export function hslStringToRgb(hsl: string): RgbTuple {
  const match = hsl.match(
    /hsla?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%/i,
  );
  if (!match) {
    throw new Error(`tokens: cannot parse HSL string "${hsl}"`);
  }
  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hh < 1) {
    r1 = c;
    g1 = x;
  } else if (hh < 2) {
    r1 = x;
    g1 = c;
  } else if (hh < 3) {
    g1 = c;
    b1 = x;
  } else if (hh < 4) {
    g1 = x;
    b1 = c;
  } else if (hh < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;
  return [r1 + m, g1 + m, b1 + m] as const;
}

/**
 * Parse a hex color string (`#rrggbb` or `#rgb`) to a 0-1 RGB tuple.
 * Used for the back-compat `primary` palette and any other hex tokens.
 */
export function hexStringToRgb(hex: string): RgbTuple {
  const cleaned = hex.replace(/^#/, '');
  let normalized = cleaned;
  if (cleaned.length === 3) {
    normalized = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (normalized.length !== 6 || /[^0-9a-f]/i.test(normalized)) {
    throw new Error(`tokens: cannot parse hex string "${hex}"`);
  }
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return [r, g, b] as const;
}

/**
 * Convert any token color string (HSL or hex) to a pdf-lib RGB tuple.
 * Single entrypoint for PDF code paths.
 */
export function pdfRgb(tokenColor: string): RgbTuple {
  if (tokenColor.startsWith('#')) {
    return hexStringToRgb(tokenColor);
  }
  return hslStringToRgb(tokenColor);
}
