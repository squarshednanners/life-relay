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
