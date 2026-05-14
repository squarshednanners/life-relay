import { describe, it, expect } from 'vitest';
import {
  tokens,
  color,
  typography,
  radius,
  witnessLine,
  motion,
  shadow,
  icon,
  breakpoint,
  pdfPage,
  pdfTypeScale,
  pdfFont,
  pdfSpacing,
  hslStringToRgb,
  hexStringToRgb,
  pdfRgb,
} from '../index';

describe('design tokens — categorical coverage', () => {
  it('exports color category covering UX Step 8 spec', () => {
    expect(color.accent['700']).toBe('hsl(25, 35%, 40%)');
    expect(color.surface.ivory).toBeDefined();
    expect(color.text.primary).toBeDefined();
    expect(color.border.DEFAULT).toBeDefined();
    expect(color.status.success).toBeDefined();
    expect(color.status.error).toBeDefined();
    expect(color.emo.matters).toBe(color.accent['700']);
    // Back-compat: existing teal palette preserved.
    expect(color.primary['700']).toBe('#0f766e');
  });

  it('accent ramp covers the full 50→900 spec at the documented hue (25°)', () => {
    // Story 1.1 review caught that only `700` was asserted; other steps could
    // drift silently. Pin every step in the documented Deep Warm Umber ramp.
    const expected: Record<string, string> = {
      '50': 'hsl(25, 30%, 96%)',
      '100': 'hsl(25, 35%, 92%)',
      '500': 'hsl(25, 28%, 60%)',
      '600': 'hsl(25, 32%, 50%)',
      '700': 'hsl(25, 35%, 40%)',
      '800': 'hsl(25, 36%, 30%)',
      '900': 'hsl(25, 38%, 22%)',
    };
    for (const [step, value] of Object.entries(expected)) {
      expect(color.accent[step as keyof typeof color.accent]).toBe(value);
    }
  });

  it('accent ramp keys use 2-digit zero-padding consistent with `primary` palette', () => {
    // Story 1.1 review caught that `accent['050']` (3-digit) would generate
    // `accent-050` Tailwind class; consumers writing `bg-accent-50` would
    // silently get no styling. Pin the convention: 2-digit (`50`, `100`, ...).
    expect(color.accent).toHaveProperty('50');
    expect(color.accent).not.toHaveProperty('050');
  });

  it('emo aliases are shared references (not duplicate literals)', () => {
    // Refactoring `accent-700` or `surface-ivory` should propagate to
    // `emo.matters` / `emo.rest`. The fix in Story 1.1 review uses shared
    // constants so reference equality holds even with `as const`.
    expect(color.emo.matters).toBe(color.accent['700']);
    expect(color.emo.rest).toBe(color.surface.ivory);
  });

  it('exports typography category', () => {
    expect(typography.family.heading).toContain('Source Serif 4');
    expect(typography.family.body).toContain('Inter');
    expect(typography.family.mono).toContain('JetBrains Mono');
    expect(typography.scale['body-md']).toEqual(['16px', '1.6']);
  });

  it('exports radius without `lg` (sharp-but-soft)', () => {
    expect(radius.sm).toBe('4px');
    expect(radius.md).toBe('6px');
    expect(radius.full).toBe('9999px');
    expect((radius as Record<string, string>).lg).toBeUndefined();
  });

  it('exports witnessLine as 3px accent-700', () => {
    expect(witnessLine.width).toBe('3px');
    expect(witnessLine.widthPt).toBe(3);
    expect(witnessLine.color).toBe(color.accent['700']);
  });

  it('exports motion with 200ms default', () => {
    expect(motion.fast).toBe('100ms');
    expect(motion.DEFAULT).toBe('200ms');
    expect(motion.slow).toBe('300ms');
  });

  it('exports shadow tokens', () => {
    expect(shadow.focus).toContain('hsl(25, 35%, 40%, 0.4)');
    expect(shadow.hover).toBeDefined();
    expect(shadow.modal).toBeDefined();
  });

  it('exports icon size scale + 1.5px stroke', () => {
    expect(icon.size).toEqual({ sm: 16, md: 20, lg: 24 });
    expect(icon.strokeWidth).toBe(1.5);
  });

  it('exports breakpoints', () => {
    expect(breakpoint.sm).toBe('640px');
    expect(breakpoint.lg).toBe('1024px');
  });

  it('exposes a unified `tokens` object', () => {
    expect(tokens.color).toBe(color);
    expect(tokens.typography).toBe(typography);
    expect(tokens.witnessLine).toBe(witnessLine);
    expect(tokens.pdfPage).toBe(pdfPage);
    expect(tokens.pdfTypeScale).toBe(pdfTypeScale);
    expect(tokens.pdfFont).toBe(pdfFont);
    expect(tokens.pdfSpacing).toBe(pdfSpacing);
  });
});

describe('design tokens — PDF geometry (Story 1.2)', () => {
  it('exports US Letter page dimensions in points', () => {
    expect(pdfPage.widthPt).toBe(612);
    expect(pdfPage.heightPt).toBe(792);
  });

  it('exports per-generator margins matching current generator constants', () => {
    expect(pdfPage.marginGenerator).toBe(54);
    expect(pdfPage.marginEmergencySheet).toBe(36);
    expect(pdfPage.marginAttorneyPrep).toBe(50);
    expect(pdfPage.marginRunbook).toBe(54);
  });

  it('all page tokens are positive integers (pdf-lib expects pt numbers)', () => {
    for (const value of Object.values(pdfPage)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe('design tokens — PDF type scale (Story 1.2)', () => {
  it('mirrors UX type-scale tokens at PDF point values', () => {
    // Per UX Step 8: display-xl 48 / display-lg 36 / heading-xl 28 / heading-lg 22
    // heading-md 18 / body-md 16 / body-sm 14 / label 14 / caption 13 / mono-md 16 / mono-sm 14
    expect(pdfTypeScale.displayXl).toBe(48);
    expect(pdfTypeScale.displayLg).toBe(36);
    expect(pdfTypeScale.headingXl).toBe(28);
    expect(pdfTypeScale.headingLg).toBe(22);
    expect(pdfTypeScale.headingMd).toBe(18);
    expect(pdfTypeScale.bodyLg).toBe(18);
    expect(pdfTypeScale.bodyMd).toBe(16);
    expect(pdfTypeScale.bodySm).toBe(14);
    expect(pdfTypeScale.label).toBe(14);
    expect(pdfTypeScale.caption).toBe(13);
    expect(pdfTypeScale.monoMd).toBe(16);
    expect(pdfTypeScale.monoSm).toBe(14);
  });

  it('exposes a title-page size step for the full-vault PDF brand heading', () => {
    // generator.ts brand text is 42pt — declared as its own token to keep
    // the value findable.
    expect(pdfTypeScale.titlePage).toBe(42);
  });

  it('all scale tokens are positive numbers', () => {
    for (const value of Object.values(pdfTypeScale)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });

  it('aligns numerically with the screen typography scale across every overlapping role', () => {
    // Story 1.1 review caught that only body-md and heading-md were asserted;
    // every overlapping role can drift independently. Pin the full set so a
    // mistyped screen px or PDF pt fails this test immediately.
    const overlap: Array<[keyof typeof pdfTypeScale, keyof typeof typography.scale]> = [
      ['displayXl', 'display-xl'],
      ['displayLg', 'display-lg'],
      ['headingXl', 'heading-xl'],
      ['headingLg', 'heading-lg'],
      ['headingMd', 'heading-md'],
      ['bodyLg', 'body-lg'],
      ['bodyMd', 'body-md'],
      ['bodySm', 'body-sm'],
      ['label', 'label'],
      ['caption', 'caption'],
      ['monoMd', 'mono-md'],
      ['monoSm', 'mono-sm'],
    ];
    for (const [pdfKey, screenKey] of overlap) {
      const screenPx = parseFloat(typography.scale[screenKey][0]);
      expect(pdfTypeScale[pdfKey]).toBe(screenPx);
    }
  });
});

describe('design tokens — PDF font roles (Story 1.2)', () => {
  it('exports the 6 role identifiers required by Story 1.2 AC2', () => {
    expect(pdfFont.headingRegular).toBe('source-serif-4-regular');
    expect(pdfFont.headingMedium).toBe('source-serif-4-medium');
    expect(pdfFont.headingItalic).toBe('source-serif-4-italic');
    expect(pdfFont.bodyRegular).toBe('inter-regular');
    expect(pdfFont.bodyMedium).toBe('inter-medium');
    expect(pdfFont.monoRegular).toBe('jetbrains-mono-regular');
  });

  it('role identifiers are unique', () => {
    const ids = Object.values(pdfFont);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('design tokens — PDF spacing (Story 1.2)', () => {
  it('exports Witness Line padding-left in PDF points (matches screen space-6)', () => {
    // Screen: tokens.spacing.witnessLinePaddingLeft = '1.5rem' (24px).
    // PDF: numeric 24 (pt).
    expect(pdfSpacing.witnessLinePaddingLeftPt).toBe(24);
  });
});

describe('design tokens — pdf-lib helpers', () => {
  it('hslStringToRgb parses canonical HSL form', () => {
    const [r, g, b] = hslStringToRgb('hsl(0, 100%, 50%)');
    expect(r).toBeCloseTo(1, 5);
    expect(g).toBeCloseTo(0, 5);
    expect(b).toBeCloseTo(0, 5);
  });

  it('hslStringToRgb parses zero-saturation (gray)', () => {
    const [r, g, b] = hslStringToRgb('hsl(0, 0%, 50%)');
    expect(r).toBeCloseTo(0.5, 5);
    expect(g).toBeCloseTo(0.5, 5);
    expect(b).toBeCloseTo(0.5, 5);
  });

  it('hslStringToRgb parses Deep Warm Umber accent-700', () => {
    const [r, g, b] = hslStringToRgb(color.accent['700']);
    // hsl(25, 35%, 40%) — sanity check it's in a warm-brown range
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });

  it('hslStringToRgb throws on malformed input', () => {
    expect(() => hslStringToRgb('not-an-hsl-string')).toThrow();
  });

  it('hslStringToRgb clamps out-of-range saturation and lightness to [0, 1]', () => {
    // Story 1.1 review: a token typo like `hsl(25, 150%, 40%)` would otherwise
    // produce RGB outside [0, 1] and pdf-lib's `rgb()` throws at runtime.
    // Clamping keeps token authoring forgiving.
    const [r, g, b] = hslStringToRgb('hsl(25, 150%, 40%)');
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
    expect(g).toBeGreaterThanOrEqual(0);
    expect(g).toBeLessThanOrEqual(1);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThanOrEqual(1);

    const [r2, g2, b2] = hslStringToRgb('hsl(25, 50%, 200%)');
    expect(r2).toBeGreaterThanOrEqual(0)
    expect(r2).toBeLessThanOrEqual(1)
    expect(g2).toBeGreaterThanOrEqual(0)
    expect(g2).toBeLessThanOrEqual(1)
    expect(b2).toBeGreaterThanOrEqual(0)
    expect(b2).toBeLessThanOrEqual(1)
  });

  it('hexStringToRgb parses 6-digit hex', () => {
    const [r, g, b] = hexStringToRgb('#0f766e');
    expect(r).toBeCloseTo(0x0f / 255, 5);
    expect(g).toBeCloseTo(0x76 / 255, 5);
    expect(b).toBeCloseTo(0x6e / 255, 5);
  });

  it('hexStringToRgb parses 3-digit hex shorthand', () => {
    const [r, g, b] = hexStringToRgb('#f00');
    expect(r).toBeCloseTo(1, 5);
    expect(g).toBeCloseTo(0, 5);
    expect(b).toBeCloseTo(0, 5);
  });

  it('hexStringToRgb throws on malformed input', () => {
    expect(() => hexStringToRgb('#zzz')).toThrow();
  });

  it('pdfRgb routes hex tokens correctly', () => {
    const [r, g, b] = pdfRgb(color.primary['700']);
    expect(r).toBeCloseTo(0x0f / 255, 5);
    expect(g).toBeCloseTo(0x76 / 255, 5);
    expect(b).toBeCloseTo(0x6e / 255, 5);
  });

  it('pdfRgb routes HSL tokens correctly', () => {
    const [r, g, b] = pdfRgb(color.accent['700']);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });
});
