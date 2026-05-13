# Tier 1 UI Primitives

This directory contains the **Tier 1 UI primitive wrappers** for Life Relay. Every Dialog, Popover, Tabs, and Tooltip in the app is composed from these wrappers — not from `reka-ui` directly.

## The contract

1. **Wrappers are the only place `reka-ui` may be imported.** ESLint's `no-restricted-imports` rule blocks `reka-ui` everywhere else. The wrapper override in `.eslintrc.cjs` re-allows it inside `src/components/ui/**`.

2. **Wrappers carry copy via props/slots — never hardcoded strings.** ESLint's `vue/no-bare-strings-in-template` rule (scoped to this directory) fails the build if a wrapper template contains a bare English string. Consumers pass Companion Voice copy from their own context.

3. **Each wrapper carries a `// Grief-Mode Audit:` comment block at the top of `<script setup>`.** The block addresses four facets:
   - Focus management under cognitive load
   - Surprise-reduction
   - Destructive-action timing
   - Reduced-motion behavior

   These comments are reviewed at PR time. They are the load-bearing documentation of the grief-mode behavior contract per the project's architecture (see `_bmad-output/planning-artifacts/architecture.md` § Per-Primitive Grief-Mode Audit Blocks).

4. **All styling resolves from tokens.** Wrappers use Tailwind classes that read CSS variables defined by `src/tokens/index.ts` (via `tailwind.config.ts`). Zero hex literals, zero `rgb(...)` calls, zero magic numbers.

5. **Single-file per primitive.** One `.vue` SFC wraps the entire compound component family. Consumers get a single import like `import UiDialog from '@/components/ui/UiDialog.vue'`.

## When you need a new primitive

If you find yourself reaching for `reka-ui` outside `src/components/ui/`, stop. Either:
- The primitive you need already has a wrapper here — use it.
- The primitive needs a wrapper — add one to this directory (with its Grief-Mode Audit block).
- The primitive is in the "build directly" list (Combobox, Toast, ToggleGroup, DatePicker, Command — see UX spec § Design System Choice) — Story 1.4 owns those; talk to Brad before adding.
