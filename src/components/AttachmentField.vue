<script setup lang="ts">
/**
 * Attachment field renderer (Story 1.7).
 *
 * Pluggable from FieldRenderer when `field.type === 'attachment'`.
 *
 * - Single mode (`field.multiple !== true`): modelValue is `string |
 *   undefined`, holding one attachmentId. Selecting a file replaces any
 *   existing attachment (the prior one is removed from the store).
 * - Multi mode: modelValue is `string[]`, appending on each new selection.
 *
 * The component owns ZERO vault data — only the field's id references.
 * The actual blob CRUD goes through `AttachmentStore`, which writes
 * straight to Dexie without passing through any JSON serialization path.
 */
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import { AttachmentStore } from '@/services/AttachmentStore'
import { useStorageQuota } from '@/composables/useStorageQuota'
import type { FormFieldSchema } from '@/models/FormSchema'
import type { AttachmentMetadata } from '@/models/AttachmentRecord'

interface Props {
  modelValue: string | string[] | undefined
  field: FormFieldSchema
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[] | undefined): void
}>()

const DEFAULT_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]
const DEFAULT_MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB — matches inline export cap.
const DEFAULT_MAX_ATTACHMENTS = 10 // Per-record cap (Story 1.7b — kitchen-sink guardrail).

const store = new AttachmentStore()
const quota = useStorageQuota()

const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref<string>('')
const isUploading = ref(false)
const metadataList = ref<AttachmentMetadata[]>([])
// Map of attachmentId → blob URL for thumbnail / open. Object URLs must
// be revoked when the entry is removed AND when the component unmounts.
// Use shallowRef so Vue's reactivity doesn't deeply wrap the URL strings.
const objectUrls = shallowRef<Map<string, string>>(new Map())

const acceptAttribute = computed(() =>
  (props.field.acceptMimeTypes ?? DEFAULT_MIME_TYPES).join(','),
)
const maxSize = computed(() => props.field.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES)
const maxAttachments = computed(() => props.field.maxAttachments ?? DEFAULT_MAX_ATTACHMENTS)
const isMultiple = computed(() => props.field.multiple === true)

const idsAsArray = computed<string[]>(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue
  if (typeof props.modelValue === 'string' && props.modelValue.length > 0) {
    return [props.modelValue]
  }
  return []
})

async function refreshMetadata(): Promise<void> {
  metadataList.value = await store.getMeta(idsAsArray.value)
}

watch(
  () => idsAsArray.value.join(','),
  () => {
    void refreshMetadata()
  },
  { immediate: true },
)

function openPicker(): void {
  errorMessage.value = ''
  fileInput.value?.click()
}

async function onFilesSelected(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const files = target.files ? Array.from(target.files) : []
  // Always reset the input so re-selecting the same file fires `change`.
  target.value = ''
  if (files.length === 0) return

  if (quota.state.value === 'full') {
    errorMessage.value =
      "Storage is full. Free up space or export a backup before adding attachments."
    return
  }
  if (quota.state.value === 'warning') {
    // AC4: at the 'warning' threshold (≥80% usage), allow upload but
    // emit a console.warn so the existing banner serves as the user
    // signal. (Story 1.7 review finding P6.)
    console.warn('AttachmentField: storage quota warning — upload allowed but space is tight')
  }

  isUploading.value = true
  // Accumulate per-file errors so a 5-file batch with 3 rejections
  // surfaces all 3 reasons, not just the last one (P9).
  const errors: string[] = []
  try {
    const allowed = props.field.acceptMimeTypes ?? DEFAULT_MIME_TYPES
    const cap = maxAttachments.value
    // Single-mode replace: when the field already has its one allowed
    // attachment and the user picks a new file, the existing blob is
    // removed and replaced. Bypass the per-record cap check because
    // the net count stays at 1. Story 1.7c review finding.
    const isSingleModeReplace = !isMultiple.value && idsAsArray.value.length > 0
    const remaining = isSingleModeReplace ? 1 : Math.max(0, cap - idsAsArray.value.length)
    if (remaining === 0) {
      errorMessage.value = `You can attach up to ${cap} files here. Remove one before adding another.`
      return
    }
    if (files.length > remaining) {
      errors.push(
        `Only ${remaining} more file${remaining === 1 ? '' : 's'} will fit — limit is ${cap} per record. The first ${remaining} will be added; the rest are skipped.`,
      )
    }
    const filesToProcess = files.slice(0, remaining)
    const newIds: string[] = []
    for (const file of filesToProcess) {
      // MIME validation after read — the `accept` attribute is advisory;
      // a user can drag .exe and the browser will let it through (P7).
      if (!allowed.includes(file.type)) {
        errors.push(`${file.name}: type ${file.type || 'unknown'} is not allowed.`)
        continue
      }
      if (file.size > maxSize.value) {
        errors.push(`${file.name} is too big. The limit is ${humanSize(maxSize.value)} per file.`)
        continue
      }
      try {
        const meta = await store.add(file, maxSize.value)
        newIds.push(meta.id)
      } catch (err) {
        errors.push(
          err instanceof Error ? `${file.name}: ${err.message}` : `${file.name}: save failed.`,
        )
      }
    }
    if (errors.length > 0) {
      errorMessage.value = errors.join('\n')
    } else {
      errorMessage.value = ''
    }
    if (newIds.length === 0) return

    if (isMultiple.value) {
      const next = [...idsAsArray.value, ...newIds]
      emit('update:modelValue', next)
    } else {
      // Single mode: emit the new id FIRST so the vault always points at
      // a valid blob, THEN remove the prior best-effort. Avoids the
      // window where a failed `store.remove` strands a vault reference
      // pointing at a blob that's been deleted (P8).
      const priorId = idsAsArray.value[0]
      emit('update:modelValue', newIds[0])
      if (priorId) {
        revokeUrl(priorId)
        await store.remove(priorId).catch(err => {
          console.error('AttachmentField: prior blob removal failed (non-fatal):', err)
        })
      }
    }
  } finally {
    isUploading.value = false
  }
}

async function removeOne(id: string): Promise<void> {
  revokeUrl(id)
  await store.remove(id).catch(() => undefined)
  if (isMultiple.value) {
    const next = idsAsArray.value.filter(x => x !== id)
    emit('update:modelValue', next.length > 0 ? next : [])
  } else {
    emit('update:modelValue', undefined)
  }
}

// Whitelist of MIME types that are safe to render directly in a tab.
// PDFs and images can't execute scripts. HTML / SVG / scripts as
// `text/html` blob URLs could run inline scripts, so for any other
// MIME we force download instead of `window.open` (P17).
const OPEN_INLINE_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

async function openAttachment(id: string): Promise<void> {
  const meta = metadataList.value.find(m => m.id === id)
  const url = await ensureUrl(id)
  if (!url) return
  if (meta && OPEN_INLINE_MIME.has(meta.mimeType)) {
    window.open(url, '_blank', 'noopener,noreferrer')
  } else {
    // Force download via a synthetic anchor — never render unknown MIME
    // types in a tab (XSS risk on spoofed `text/html`).
    const a = document.createElement('a')
    a.href = url
    a.download = meta?.filename ?? 'attachment'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}

// Mount-lifecycle flag — async ensureUrl handlers check this before
// allocating a Blob URL the component will never get a chance to revoke
// on unmount (P11).
let isUnmounted = false

async function ensureUrl(id: string): Promise<string | null> {
  const existing = objectUrls.value.get(id)
  if (existing) return existing
  const full = await store.get(id)
  if (!full) return null
  if (isUnmounted) {
    // The component unmounted while we awaited Dexie. Don't allocate a
    // URL we can't track + revoke.
    return null
  }
  // Race-safety check: another ensureUrl call may have populated the
  // same id while we awaited `store.get`. If so, revoke the URL we
  // just allocated and return the existing one — prevents URL leaks
  // from concurrent calls each cloning the map from the same starting
  // state (Story 1.7c review finding).
  const concurrentlyResolved = objectUrls.value.get(id)
  if (concurrentlyResolved) {
    return concurrentlyResolved
  }
  // Cast: `Uint8Array<ArrayBufferLike>` can include SharedArrayBuffer in
  // strict TS, but our blobs are always ArrayBuffer-backed. The Blob
  // constructor accepts any BufferSource at runtime.
  const blob = new Blob([full.blob as BlobPart], { type: full.mimeType })
  const url = URL.createObjectURL(blob)
  // Mutate the underlying Map in place — `objectUrls` is `shallowRef`,
  // so reactivity doesn't track Map mutations, but the only consumers
  // here are imperative (revokeUrl, openAttachment) so reactivity isn't
  // needed. The previous clone-and-assign pattern caused two concurrent
  // calls to overwrite each other's entries.
  objectUrls.value.set(id, url)
  return url
}

function revokeUrl(id: string): void {
  const url = objectUrls.value.get(id)
  if (url) {
    URL.revokeObjectURL(url)
    objectUrls.value.delete(id)
  }
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

// Pre-resolve thumbnail URLs for image attachments as metadata loads, so
// the template can render them synchronously. Diff-based: revoke URLs
// for ids that left the list AND skip ensure-URL on ids we already have
// (P10 — the previous version rebuilt the map from scratch + re-issued
// `ensureUrl` for every image even when already cached, causing leaks).
const thumbnailUrlMap = shallowRef<Map<string, string>>(new Map())
let thumbnailWatchToken = 0
watch(
  () => metadataList.value,
  async list => {
    const myToken = ++thumbnailWatchToken
    const imageIds = list.filter(m => isImage(m.mimeType)).map(m => m.id)
    const imageIdSet = new Set(imageIds)

    // Revoke URLs for ids that are no longer in the list.
    const next = new Map<string, string>(thumbnailUrlMap.value)
    for (const [oldId, oldUrl] of thumbnailUrlMap.value.entries()) {
      if (!imageIdSet.has(oldId)) {
        URL.revokeObjectURL(oldUrl)
        next.delete(oldId)
        // Also drop from the shared objectUrls cache so a future
        // ensureUrl re-fetches fresh bytes (avoids stale-data display).
        if (objectUrls.value.has(oldId)) {
          const updatedShared = new Map(objectUrls.value)
          updatedShared.delete(oldId)
          objectUrls.value = updatedShared
        }
      }
    }

    // Allocate URLs only for image ids we don't have yet.
    for (const id of imageIds) {
      if (next.has(id)) continue
      const url = await ensureUrl(id)
      if (myToken !== thumbnailWatchToken) {
        // Props changed again while we awaited — abandon this batch so
        // we don't clobber the newer watch handler's result.
        return
      }
      if (url) next.set(id, url)
    }

    if (myToken === thumbnailWatchToken) {
      thumbnailUrlMap.value = next
    }
  },
  { immediate: true, flush: 'post' },
)

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function humanType(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.startsWith('image/')) {
    const sub = mimeType.slice('image/'.length).toUpperCase()
    return `${sub} image`
  }
  return mimeType
}

onUnmounted(() => {
  isUnmounted = true
  for (const url of objectUrls.value.values()) {
    URL.revokeObjectURL(url)
  }
  for (const url of thumbnailUrlMap.value.values()) {
    URL.revokeObjectURL(url)
  }
  objectUrls.value = new Map()
  thumbnailUrlMap.value = new Map()
})
</script>

<template>
  <div :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`">
    <label class="block text-body-sm font-medium text-text-secondary dark:text-gray-300 mb-2">
      {{ field.label }}
      <span
        v-if="field.required"
        class="text-status-error"
      >*</span>
    </label>

    <div class="space-y-3">
      <ul
        v-if="metadataList.length > 0"
        class="space-y-2"
      >
        <li
          v-for="meta in metadataList"
          :key="meta.id"
          class="flex items-center gap-3 rounded-md border border-border dark:border-gray-700 bg-surface-ivory dark:bg-gray-800 p-3"
        >
          <img
            v-if="thumbnailUrlMap.get(meta.id)"
            :src="thumbnailUrlMap.get(meta.id)"
            :alt="meta.filename"
            class="h-12 w-12 object-cover rounded"
          >
          <div
            v-else
            class="h-12 w-12 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono text-text-secondary dark:text-gray-400"
          >
            {{ humanType(meta.mimeType).slice(0, 4) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm text-text-primary dark:text-gray-100 truncate">
              {{ meta.filename }}
            </div>
            <div class="text-xs text-text-secondary dark:text-gray-400">
              {{ humanType(meta.mimeType) }} · {{ humanSize(meta.sizeBytes) }}
            </div>
          </div>
          <button
            type="button"
            class="text-xs text-accent-700 dark:text-accent-700 hover:underline focus-visible:outline-none focus-visible:shadow-focus"
            @click="openAttachment(meta.id)"
          >
            Open
          </button>
          <button
            type="button"
            class="text-xs text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-100 focus-visible:outline-none focus-visible:shadow-focus"
            @click="removeOne(meta.id)"
          >
            Remove
          </button>
        </li>
      </ul>

      <div>
        <button
          type="button"
          class="px-4 py-2 text-sm rounded-md border border-border dark:border-gray-700 text-text-primary dark:text-gray-100 hover:bg-surface-ivory dark:hover:bg-gray-800 disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          :disabled="isUploading"
          @click="openPicker"
        >
          {{ metadataList.length > 0 && !isMultiple ? 'Replace file' : 'Add a file' }}
        </button>
        <p class="mt-2 text-xs text-text-secondary dark:text-gray-400">
          Up to {{ humanSize(maxSize) }} per file. Allowed types: {{ acceptAttribute }}.
        </p>
      </div>

      <p
        v-if="errorMessage"
        class="text-sm text-status-error"
        role="status"
        aria-live="polite"
      >
        {{ errorMessage }}
      </p>
    </div>

    <input
      ref="fileInput"
      type="file"
      :accept="acceptAttribute"
      :multiple="isMultiple"
      class="hidden"
      @change="onFilesSelected"
    >
  </div>
</template>
