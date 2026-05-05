/**
 * Schema-driven thin-renderer helper for bespoke PDF / UI views.
 *
 * The 4 bespoke PDF generators (emergencySheet, walletCard, attorneyPrep,
 * runbookPdf) and 2 UI components (EmergencySheetModal, Runbook Quick
 * Contacts) used to hardcode field names and labels in code. This module
 * inverts the dependency: schemas declare which fields belong in which
 * views via `pdfViews` metadata, and this helper resolves those tags into
 * a render-ready data structure.
 *
 * Schema-as-truth: adding a new field to a schema with the appropriate
 * `pdfViews` tag automatically propagates to the named view with no code
 * change in the renderer.
 */

import { schemaRegistry } from '@/schemas';
import type { DeathboxData } from '@/models/DeathboxData';
import {
  getVisibleFields,
  type FormSectionSchema,
  type FormFieldSchema,
  type PdfViewName,
} from '@/models/FormSchema';

// ============================================================================
// PUBLIC RESULT TYPES
// ============================================================================

/**
 * One field rendered in the view, with its label and resolved value.
 * Renderers iterate this and draw — they never look up field names directly.
 */
export interface CollectedField {
  fieldName: string;
  label: string;
  value: string | undefined;
  /** True when the field is marked `manualEntry` and the user opted to
   *  leave a blank line for handwriting in the PDF. */
  manualEntryBlank: boolean;
  /** Optional sub-section name within the view (e.g., 'criticalContacts'). */
  section?: string;
  /** Sort priority — lower renders earlier. */
  priority: number;
  /** Original field schema, available for renderers that need extra metadata. */
  schema: FormFieldSchema;
}

/**
 * One item from a section. Singleton sections (e.g., taxInfo) yield one item
 * with `itemId` undefined; array sections (e.g., people, importantContacts)
 * yield one item per array entry.
 */
export interface CollectedItem {
  itemId?: string;
  /** Raw item data (the array element or the section object). */
  data: Record<string, unknown>;
  fields: CollectedField[];
  /** Resolved item label for renderers (e.g., person name + role). */
  itemLabel?: string;
}

/**
 * One section in the view, ready for rendering.
 */
export interface CollectedSection {
  sectionKey: string;
  sectionLabel: string;
  items: CollectedItem[];
}

// ============================================================================
// MAIN HELPER
// ============================================================================

/**
 * Collect all fields tagged for the named view, resolved against `data`.
 * Returns sections in schema-declaration order; items within array sections
 * sorted per `pdfViews[view].itemSortPriority` then `itemSortKey` then natural
 * order; fields within items sorted by `pdfViews[view].priority` then
 * declaration order.
 *
 * @param viewName - Name of the bespoke view to collect fields for
 * @param data - The user's vault data
 * @param schemas - Optional schema list (defaults to schemaRegistry values)
 */
export function collectFieldsByPdfView(
  viewName: PdfViewName,
  data: DeathboxData,
  schemas?: FormSectionSchema[],
): CollectedSection[] {
  const allSchemas = schemas ?? Object.values(schemaRegistry);

  return allSchemas
    .map((sectionSchema) =>
      collectSectionForView(sectionSchema, viewName, data),
    )
    .filter((section): section is CollectedSection => section !== null);
}

/**
 * Collect a single section's contribution to the named view, or null if the
 * section has no participating fields / items.
 */
function collectSectionForView(
  sectionSchema: FormSectionSchema,
  viewName: PdfViewName,
  data: DeathboxData,
): CollectedSection | null {
  const sectionViewMeta = sectionSchema.pdfViews?.[viewName];
  const fieldsTaggedForView = sectionSchema.fields.filter((field) => {
    const fieldViewMeta = field.pdfViews?.[viewName];
    return fieldViewMeta?.include === true;
  });

  // If section explicitly opts out, or has no tagged fields, skip.
  if (sectionViewMeta?.include === false) return null;
  if (fieldsTaggedForView.length === 0 && sectionViewMeta?.include !== true) {
    return null;
  }

  // Resolve section data from DeathboxData.
  const rawSectionValue = readSectionValue(sectionSchema.sectionKey, data);
  if (rawSectionValue == null) return null;

  // Resolve section label (view-scoped override or schema title).
  const sectionLabel =
    sectionViewMeta?.sectionLabel ?? sectionSchema.title;

  // Build items: array section yields N; singleton yields 1 (or 0 if empty).
  const rawItems = collectRawItems(sectionSchema, rawSectionValue);
  const items: CollectedItem[] = rawItems
    .map((rawItem) =>
      buildCollectedItem(
        rawItem,
        fieldsTaggedForView,
        sectionSchema,
        viewName,
        data,
      ),
    )
    .filter((item): item is CollectedItem => item !== null);

  if (items.length === 0) return null;

  // Sort + limit items per section view metadata.
  const sortedItems = sortItems(items, sectionViewMeta);
  const limited = sectionViewMeta?.itemLimit
    ? sortedItems.slice(0, sectionViewMeta.itemLimit)
    : sortedItems;

  return {
    sectionKey: sectionSchema.sectionKey,
    sectionLabel,
    items: limited,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve a section's raw value from DeathboxData, supporting nested keys
 * like `lifeInsurance.policies` (array) or `letterOfInstruction` (object).
 */
function readSectionValue(
  sectionKey: string,
  data: DeathboxData,
): unknown {
  const parts = sectionKey.split('.');
  let value: unknown = data;
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/**
 * Yield raw item objects for a section value: one per array element, or a
 * single object for non-array sections.
 */
function collectRawItems(
  sectionSchema: FormSectionSchema,
  rawSectionValue: unknown,
): Record<string, unknown>[] {
  if (sectionSchema.isArray) {
    if (!Array.isArray(rawSectionValue)) return [];
    return rawSectionValue.filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null,
    );
  }
  if (typeof rawSectionValue === 'object' && rawSectionValue !== null) {
    return [rawSectionValue as Record<string, unknown>];
  }
  return [];
}

/**
 * Build a CollectedItem for a single section item, applying field-level view
 * tags, visibility conditions, manualEntry behavior, and PDF formatters.
 * Returns null if the item has no resolvable fields (e.g., all empty + skip).
 */
function buildCollectedItem(
  rawItem: Record<string, unknown>,
  fieldsTaggedForView: FormFieldSchema[],
  sectionSchema: FormSectionSchema,
  viewName: PdfViewName,
  fullData: DeathboxData,
): CollectedItem | null {
  // Apply visibility conditions, evaluated against the item context.
  // For singletons we evaluate against the full data; for array items, against
  // the item itself (matching the form-rendering model).
  const visibilityContext = sectionSchema.isArray ? rawItem : fullData;
  const visibleFields = getVisibleFields(fieldsTaggedForView, visibilityContext);

  const fields: CollectedField[] = [];
  let renderIndex = 0;
  for (const fieldSchema of visibleFields) {
    const fieldViewMeta = fieldSchema.pdfViews?.[viewName];
    if (!fieldViewMeta || fieldViewMeta.include !== true) continue;
    if (!fieldSchema.name) continue;

    const rawValue = rawItem[fieldSchema.name];
    const manualEntryBlank = isManualEntryBlank(fieldSchema, rawItem);

    let formattedValue: string | undefined;
    if (manualEntryBlank) {
      formattedValue = undefined;
    } else if (rawValue == null || rawValue === '') {
      formattedValue = undefined;
    } else if (fieldViewMeta.format) {
      // View-scoped formatter receives full data context for cross-section resolves.
      formattedValue = fieldViewMeta.format(rawValue, rawItem, fullData);
    } else if (fieldSchema.pdfFormat) {
      formattedValue = fieldSchema.pdfFormat(rawValue);
    } else {
      formattedValue = defaultFormat(rawValue);
    }

    // Normalize empty-string formatter output to undefined so pdfSkipIfEmpty
    // treats "format returned nothing meaningful" the same as raw-empty.
    if (formattedValue === '') {
      formattedValue = undefined;
    }

    if (
      formattedValue === undefined &&
      !manualEntryBlank &&
      fieldSchema.pdfSkipIfEmpty
    ) {
      continue;
    }

    fields.push({
      fieldName: fieldSchema.name,
      label: fieldViewMeta.label ?? fieldSchema.pdfLabel ?? fieldSchema.label ?? fieldSchema.name,
      value: formattedValue,
      manualEntryBlank,
      section: fieldViewMeta.section,
      priority: fieldViewMeta.priority ?? renderIndex,
      schema: fieldSchema,
    });
    renderIndex += 1;
  }

  if (fields.length === 0) return null;

  // Stable sort by (priority asc, declaration order).
  const sorted = [...fields].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return 0;
  });

  // Per-view item label override takes precedence over arrayItemLabel.
  const sectionViewMeta = sectionSchema.pdfViews?.[viewName];
  const itemLabel = sectionViewMeta?.itemLabel
    ? safeCall(() => sectionViewMeta.itemLabel!(rawItem, fullData))
    : resolveItemLabel(sectionSchema, rawItem);

  return {
    itemId: typeof rawItem.id === 'string' ? rawItem.id : undefined,
    data: rawItem,
    fields: sorted,
    itemLabel,
  };
}

function safeCall<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

/**
 * Resolve the per-item label using the section schema's `arrayItemLabel`
 * function when defined, otherwise undefined.
 */
function resolveItemLabel(
  sectionSchema: FormSectionSchema,
  rawItem: Record<string, unknown>,
): string | undefined {
  if (!sectionSchema.isArray || !sectionSchema.arrayItemLabel) return undefined;
  try {
    return sectionSchema.arrayItemLabel(0, rawItem);
  } catch {
    return undefined;
  }
}

/**
 * Determine whether a field's `manualEntry` flag was set on this item,
 * meaning the value should appear as a blank line in the PDF for the user
 * to fill in by hand.
 */
function isManualEntryBlank(
  fieldSchema: FormFieldSchema,
  rawItem: Record<string, unknown>,
): boolean {
  if (!fieldSchema.manualEntry || !fieldSchema.name) return false;
  const flagName =
    fieldSchema.manualEntryFieldName ?? `${fieldSchema.name}ManualEntry`;
  return rawItem[flagName] === true;
}

/**
 * Default value formatter used when neither the view nor the schema field
 * supplies one. Coerces to string and trims; arrays joined with comma.
 */
function defaultFormat(value: unknown): string {
  if (Array.isArray(value)) return value.map(defaultFormat).join(', ');
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Sort items per the section's view metadata: explicit priority list first
 * (matched by `itemSortKey`), then by `itemSortKey` natural order, then by
 * input order. Items not matching the priority list sort after.
 */
function sortItems(
  items: CollectedItem[],
  sectionViewMeta: import('@/models/FormSchema').PdfSectionViewMembership | undefined,
): CollectedItem[] {
  if (!sectionViewMeta?.itemSortKey && !sectionViewMeta?.itemSortPriority) {
    return items;
  }

  const sortKey = sectionViewMeta?.itemSortKey;
  const priority = sectionViewMeta?.itemSortPriority ?? [];

  return [...items].sort((a, b) => {
    if (!sortKey) return 0;
    const aValue = String(a.data[sortKey] ?? '');
    const bValue = String(b.data[sortKey] ?? '');

    const aPriorityIndex = priority.indexOf(aValue);
    const bPriorityIndex = priority.indexOf(bValue);

    // Both have priority — sort by priority list.
    if (aPriorityIndex !== -1 && bPriorityIndex !== -1) {
      return aPriorityIndex - bPriorityIndex;
    }
    // One has priority — that one wins.
    if (aPriorityIndex !== -1) return -1;
    if (bPriorityIndex !== -1) return 1;
    // Neither has priority — natural string order.
    return aValue.localeCompare(bValue);
  });
}
