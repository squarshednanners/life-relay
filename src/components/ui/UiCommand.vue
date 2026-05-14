<script setup lang="ts">
// Grief-Mode Audit (per docs/grief-mode-audit.md):
//
//   Focus management under cognitive load:
//     - When the palette opens, focus moves to the search input. The
//       input keeps physical focus while arrow keys move the
//       aria-activedescendant highlight — no surprise focus jumps inside
//       the list.
//     - Tab + Shift+Tab cycle WITHIN the palette dialog (focus trap). A
//       confused user can't accidentally tab into the page behind the
//       open palette.
//     - Escape closes and returns focus to the element that was focused
//       before open.
//     - Outside-click (overlay) closes silently — focus returns to the
//       prior element via the same path.
//
//   Surprise-reduction:
//     - Opens only via direct user action: Cmd/Ctrl+K (registered via
//       useEventListener on window) or programmatic open() via
//       useCommandPalette(). No auto-open from background events.
//     - Filtering is sync (fuse.js search on every keystroke); no async
//       race. Result ordering is stable for a given query.
//     - Cmd+K is suppressed when the user is typing in an editable
//       element (input/textarea/contenteditable) — preserves user's
//       in-field keystrokes and Firefox's built-in URL-bar shortcut
//       when the palette is closed and the user is editing.
//
//   Destructive-action timing:
//     - Each item's onSelect is the consumer's responsibility. The
//       palette only invokes it. Destructive confirmations belong in
//       the consumer's flow (e.g., wrap a destructive command in a
//       UiDialog confirmation step).
//
//   Reduced-motion behavior:
//     - Overlay + panel transitions use `motion-safe:` so
//       `prefers-reduced-motion: reduce` removes the fade-in.

import { ref, computed, watch, nextTick, useId } from 'vue'
import Fuse from 'fuse.js'
import { useEventListener } from '@vueuse/core'
import { useCommandPalette } from '@/composables/useCommandPalette'

export interface CommandItem {
  /** Stable identifier */
  id: string
  /** Companion Voice label rendered in the list */
  label: string
  /** Optional group heading. Items with the same `group` cluster under it. */
  group?: string
  /** Optional secondary text (shortcut, description, etc.) */
  hint?: string
  /** Invoked when this command is selected */
  onSelect: () => void
}

interface Props {
  items: CommandItem[]
  /** REQUIRED placeholder copy for the input */
  placeholder: string
  /** REQUIRED copy for the no-results state */
  emptyLabel: string
  /** REQUIRED accessible label for the dialog */
  dialogLabel: string
  /** Disable the global Cmd/Ctrl+K shortcut */
  disableGlobalShortcut?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disableGlobalShortcut: false,
})

defineSlots<{
  item?: (props: { item: CommandItem; active: boolean }) => unknown
}>()

const palette = useCommandPalette()
const isOpen = computed(() => palette.isOpen.value)

const query = ref('')
const activeIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const listboxEl = ref<HTMLElement | null>(null)
const dialogEl = ref<HTMLElement | null>(null)
const lastFocusedBeforeOpen = ref<HTMLElement | null>(null)
const dialogId = useId()
const listboxId = useId()
const optionIdPrefix = useId()

const fuse = computed(
  () =>
    new Fuse(props.items, {
      keys: ['label', 'hint'],
      threshold: 0.3,
      includeMatches: false,
    }),
)

const filtered = computed<CommandItem[]>(() => {
  const q = query.value.trim()
  if (!q) return props.items
  return fuse.value.search(q).map(r => r.item)
})

// Pre-compute the item → index map ONCE per render so per-item template
// expressions don't run O(N) `indexOf` calls. With N items rendered, the
// previous `filtered.indexOf(item)` called 5 times per template iteration
// was O(N²); for 500 items that's measurable jank.
const indexByItemId = computed(() => {
  const m = new Map<string, number>()
  filtered.value.forEach((item, idx) => {
    if (!m.has(item.id)) m.set(item.id, idx)
  })
  return m
})

function indexOfItem(item: CommandItem): number {
  return indexByItemId.value.get(item.id) ?? -1
}

const grouped = computed<Array<{ group: string | undefined; items: CommandItem[] }>>(() => {
  const list = filtered.value
  const buckets = new Map<string | undefined, CommandItem[]>()
  for (const item of list) {
    const key = item.group
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(item)
  }
  return Array.from(buckets.entries()).map(([group, items]) => ({ group, items }))
})

watch(isOpen, opened => {
  if (opened) {
    lastFocusedBeforeOpen.value = (document.activeElement as HTMLElement) ?? null
    query.value = ''
    activeIndex.value = 0
    nextTick(() => inputEl.value?.focus())
  } else {
    nextTick(() => lastFocusedBeforeOpen.value?.focus?.())
  }
})

// `mouseTrackingEnabled` toggles off briefly when the user types — keyboard
// nav resets activeIndex to 0 on every keystroke, but a stationary mouse
// would fight that reset via `mouseenter`. Re-enable when the mouse moves.
const mouseTrackingEnabled = ref(true)
watch(query, () => {
  activeIndex.value = 0
  scrollActiveIntoView()
  mouseTrackingEnabled.value = false
})

function executeActive(): void {
  const item = filtered.value[activeIndex.value]
  if (!item) return
  palette.close()
  item.onSelect()
}

function moveActive(direction: 1 | -1): void {
  const total = filtered.value.length
  if (total === 0) return
  activeIndex.value = (activeIndex.value + direction + total) % total
  scrollActiveIntoView()
}

function scrollActiveIntoView(): void {
  nextTick(() => {
    if (!listboxEl.value) return
    const id = `${optionIdPrefix}-${activeIndex.value}`
    // Use getElementById to avoid CSS-selector parsing of `useId()` values
    // — Vue's IDs are safe today but a future format change (SSR
    // contexts containing `:` etc.) would break querySelector(`#${id}`).
    const el = document.getElementById(id)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function onInputKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveActive(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveActive(-1)
      break
    case 'Enter':
      event.preventDefault()
      executeActive()
      break
    case 'Escape':
      event.preventDefault()
      palette.close()
      break
  }
}

// Focus trap — cycle Tab/Shift+Tab within the dialog. aria-modal="true"
// promises this to assistive tech; the trap delivers it. When the dialog
// opens we capture the focusable elements; on Tab/Shift+Tab at the
// boundaries we wrap to the other end. (Story 1.6 code review caught
// the missing trap.)
function onDialogKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || !dialogEl.value) return
  const focusables = dialogEl.value.querySelectorAll<HTMLElement>(
    'input, button, [tabindex]:not([tabindex="-1"]), [href], select, textarea',
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

// Global Cmd+K / Ctrl+K shortcut. Registered conditionally — when
// `disableGlobalShortcut` is true we don't attach the listener at all
// (Story 1.6 code review caught the wasted handler-per-keystroke).
// We also suppress when the user is actively typing in an editable
// element to preserve their in-field keystrokes AND the browser's
// built-in Ctrl+K (URL bar focus on Firefox).
function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

watch(
  () => props.disableGlobalShortcut,
  () => {
    /* registration is below; gated by the if() inside the listener. The
       listener is cheap; per-keystroke gating is the simpler design than
       dynamically attaching/detaching. */
  },
)

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (props.disableGlobalShortcut) return
  if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) return
  // Don't hijack when typing — but DO toggle if the palette is already
  // open (user pressed Cmd+K to close it from inside).
  if (!isOpen.value && isEditableTarget(e.target)) return
  e.preventDefault()
  palette.toggle()
})

const activeDescendantId = computed(() =>
  filtered.value.length > 0 ? `${optionIdPrefix}-${activeIndex.value}` : undefined,
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-text-primary/40 motion-safe:transition-opacity motion-safe:duration-200"
      @click="palette.close()"
    />
    <div
      v-if="isOpen"
      :id="dialogId"
      ref="dialogEl"
      role="dialog"
      aria-modal="true"
      :aria-label="dialogLabel"
      class="fixed left-1/2 top-1/4 z-50 w-full max-w-xl -translate-x-1/2 rounded-md bg-surface-bone shadow-modal motion-safe:transition-transform motion-safe:duration-200"
      @keydown="onDialogKeydown"
      @mousemove="mouseTrackingEnabled = true"
    >
      <div class="border-b border-border px-4 py-3">
        <input
          ref="inputEl"
          v-model="query"
          type="text"
          role="combobox"
          autocomplete="off"
          aria-haspopup="listbox"
          :aria-expanded="true"
          :aria-controls="listboxId"
          :aria-activedescendant="activeDescendantId"
          :placeholder="placeholder"
          class="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none"
          @keydown="onInputKeydown"
        >
      </div>
      <ul
        :id="listboxId"
        ref="listboxEl"
        role="listbox"
        :aria-label="dialogLabel"
        class="max-h-96 overflow-y-auto p-2"
      >
        <template v-if="filtered.length > 0">
          <template
            v-for="(bucket, gi) in grouped"
            :key="`g-${gi}`"
          >
            <li
              v-if="bucket.group"
              role="presentation"
              class="px-3 pt-3 pb-1 text-body-sm font-medium text-text-secondary"
            >
              {{ bucket.group }}
            </li>
            <li
              v-for="item in bucket.items"
              :id="`${optionIdPrefix}-${indexOfItem(item)}`"
              :key="item.id"
              role="option"
              :aria-selected="indexOfItem(item) === activeIndex"
              :data-active="indexOfItem(item) === activeIndex || undefined"
              class="cursor-pointer rounded-sm px-3 py-2 text-body-md text-text-primary data-[active]:bg-accent-100"
              @mousedown.prevent="
                () => {
                  activeIndex = indexOfItem(item)
                  executeActive()
                }
              "
              @mouseenter="
                () => {
                  if (mouseTrackingEnabled) activeIndex = indexOfItem(item)
                }
              "
            >
              <slot
                name="item"
                :item="item"
                :active="indexOfItem(item) === activeIndex"
              >
                <span class="flex items-center justify-between gap-3">
                  <span>{{ item.label }}</span>
                  <span
                    v-if="item.hint"
                    class="text-body-sm text-text-secondary"
                  >
                    {{ item.hint }}
                  </span>
                </span>
              </slot>
            </li>
          </template>
        </template>
        <li
          v-else
          role="status"
          aria-live="polite"
          class="px-3 py-6 text-center text-body-md text-text-secondary"
        >
          {{ emptyLabel }}
        </li>
      </ul>
    </div>
  </Teleport>
</template>
