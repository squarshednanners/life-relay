/**
 * Snapshot serializers for the bespoke-PDF golden-fixture tests.
 *
 * `CollectedSection[]` from `collectFieldsByPdfView` carries the raw item
 * data and field schema on every item, which makes snapshots noisy and
 * unstable when unrelated schema metadata changes. These helpers project
 * the collected output down to just the rendered content (section labels,
 * field rows with label + resolved value), which is the actual contract
 * the renderers consume.
 */
import type {
  CollectedSection,
  CollectedItem,
  CollectedField,
} from '../../schemaPdfViews'

export interface SerializedField {
  fieldName: string
  label: string
  value: string | undefined
  manualEntryBlank?: true
  section?: string
}

export interface SerializedItem {
  itemId?: string
  itemLabel?: string
  fields: SerializedField[]
}

export interface SerializedSection {
  sectionKey: string
  sectionLabel: string
  items: SerializedItem[]
}

export function serializeSections(
  sections: CollectedSection[],
): SerializedSection[] {
  return sections.map(serializeSection)
}

function serializeSection(section: CollectedSection): SerializedSection {
  return {
    sectionKey: section.sectionKey,
    sectionLabel: section.sectionLabel,
    items: section.items.map(serializeItem),
  }
}

function serializeItem(item: CollectedItem): SerializedItem {
  const out: SerializedItem = {
    fields: item.fields.map(serializeField),
  }
  if (item.itemId !== undefined) out.itemId = item.itemId
  if (item.itemLabel !== undefined) out.itemLabel = item.itemLabel
  return out
}

function serializeField(field: CollectedField): SerializedField {
  const out: SerializedField = {
    fieldName: field.fieldName,
    label: field.label,
    value: field.value,
  }
  if (field.manualEntryBlank) out.manualEntryBlank = true
  if (field.section !== undefined) out.section = field.section
  return out
}
