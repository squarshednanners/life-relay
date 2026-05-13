# UI Primitives (`src/components/ui/`)

This directory holds **wrappers for primitives that need a Grief-Mode Audit** and **primitives we built ourselves** because no library ships them at the quality we need.

## What lives here

| File | Source | Why a wrapper |
|---|---|---|
| `UiDialog.vue` | wraps `reka-ui` Dialog | Carries Grief-Mode Audit; collapses compound API into one import |
| `UiPopover.vue` | wraps `reka-ui` Popover | Same |
| `UiTabs.vue` | wraps `reka-ui` Tabs | Same; adds an items-array prop for the common case |
| `UiTooltip.vue` | wraps `reka-ui` Tooltip | Same |
| `UiCommand.vue` | custom (vanilla Vue + `fuse.js`) | `reka-ui` has no command-palette primitive |

## Convention (not enforced by lint as of Story 1.4)

The Story 1.3 ESLint ban on direct `reka-ui` imports outside this directory was **removed in Story 1.4** (see story file `1-4-build-non-radix-tier1-primitives.md` for rationale). The wrapper layer is now a **convention**, not a CI gate.

**When to add a wrapper here:**
- You need a `// Grief-Mode Audit:` block co-located with the primitive (focus management, surprise-reduction, destructive-action timing, reduced-motion behavior)
- You want to normalize the compound API into one import for consumers
- You want to enforce token-bound styling at one place per primitive

**When to skip the wrapper and use `reka-ui` directly:**
- The primitive is a one-off that doesn't need an audit (e.g., `Separator`, `VisuallyHidden`)
- The compound API is the right consumer surface and a wrapper would just re-export it
- You're prototyping; you can wrap later when the usage pattern stabilizes

## Discipline checklist for new primitive use

Even without the import ban, every primitive use should still pass:

1. **Token-bound styling** — colors, spacing, radii, shadows resolve from `src/tokens/index.ts` via Tailwind classes. No hex literals. No magic numbers in style bindings. (Enforced by the token-only AST scan from architecture.md § Token-Only CI Gate.)
2. **Companion Voice copy** — user-facing strings carry the project's voice. Wrappers here enforce this via `vue/no-bare-strings-in-template`. Feature views are governed by the planned Companion Voice ESLint rule (PR-7g territory; not yet shipped).
3. **Grief-Mode Audit** — if the primitive can trap focus, dismiss content, run destructive flows, or animate, document the audit in a comment block (here, in the consuming view, or in a co-located doc). See `docs/grief-mode-audit.md` for the checklist.
4. **Reduced-motion respect** — `motion-safe:` Tailwind qualifiers on transition classes.

## When you need a new primitive

- **`reka-ui` ships it** → Use it directly OR wrap it here. Both are fine.
- **`reka-ui` doesn't ship it** → Build vanilla. Either here (if it'll be reused) or co-located with its consumer (if it's a one-off).
- **You're not sure** → Search `reka-ui`'s exports (`node_modules/reka-ui/dist/index.d.ts`). As of Story 1.4 it includes Accordion, AlertDialog, AspectRatio, Autocomplete, Avatar, Calendar, Checkbox, Collapsible, Combobox, ContextMenu, DateField, DatePicker, DropdownMenu, Editable, HoverCard, Listbox, Menu, Menubar, MonthPicker, NavigationMenu, NumberField, Pagination, PinInput, Popover, Progress, RadioGroup, RangeCalendar, ScrollArea, Select, Separator, Slider, Splitter, Stepper, Switch, Tabs, TagsInput, TimeField, Toast, Toggle, ToggleGroup, Toolbar, Tooltip, Tree, YearPicker, and more.
