import type { Config } from 'tailwindcss';
import { tokens } from './src/tokens';

const { color, typography, radius, witnessLine, breakpoint, shadow } = tokens;

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: breakpoint.sm,
      md: breakpoint.md,
      lg: breakpoint.lg,
      xl: breakpoint.xl,
    },
    extend: {
      colors: {
        primary: color.primary,
        accent: color.accent,
        surface: color.surface,
        text: color.text,
        border: color.border,
        status: {
          success: color.status.success,
          'success-bg': color.status.successBg,
          warning: color.status.warning,
          'warning-bg': color.status.warningBg,
          error: color.status.error,
          'error-bg': color.status.errorBg,
        },
        emo: {
          matters: color.emo.matters,
          rest: color.emo.rest,
          pending: color.emo.pending,
        },
      },
      fontFamily: {
        heading: typography.family.heading
          .split(',')
          .map((f) => f.trim().replace(/^"|"$/g, '')),
        body: typography.family.body
          .split(',')
          .map((f) => f.trim().replace(/^"|"$/g, '')),
        mono: typography.family.mono
          .split(',')
          .map((f) => f.trim().replace(/^"|"$/g, '')),
      },
      fontSize: typography.scale,
      borderRadius: {
        sm: radius.sm,
        md: radius.md,
        full: radius.full,
      },
      borderWidth: {
        witness: witnessLine.width,
      },
      boxShadow: {
        focus: shadow.focus,
        hover: shadow.hover,
        modal: shadow.modal,
      },
    },
  },
  plugins: [],
};

export default config;
