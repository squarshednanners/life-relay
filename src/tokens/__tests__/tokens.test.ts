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

  it('aligns numerically with the screen typography scale where the roles overlap', () => {
    // The screen scale stores [size, lineHeight] tuples in px. PDF tokens are
    // pt numbers. PDFs render text at the same numeric size as the screen.
    const screenBodyMdPx = parseFloat(typography.scale['body-md'][0]);
    expect(pdfTypeScale.bodyMd).toBe(screenBodyMdPx);
    const screenHeadingMdPx = parseFloat(typography.scale['heading-md'][0]);
    expect(pdfTypeScale.headingMd).toBe(screenHeadingMdPx);
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
