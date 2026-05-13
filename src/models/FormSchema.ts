/**
 * Form Schema Framework
 * 
 * This framework allows declarative form definitions that can be used
 * for both UI rendering and PDF generation, reducing duplication.
 */

export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'tel'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'currency'
  | 'password'
  | 'array' // For nested arrays (e.g., multiSigConfig.keys[])
  | 'custom' // For special components like BeneficiarySelector

export type VisibilityCondition = {
  field: string // Field name to check (supports nested paths like "singleKey.keyType")
  operator: 'equals' | 'notEquals' | 'contains' | 'isEmpty' | 'isNotEmpty'
  value?: any // Value to compare against
  and?: VisibilityCondition[] // Additional conditions that must all be true (AND logic)
}

/**
 * Bespoke PDF / UI views that declare schema-field membership via `pdfViews`
 * metadata on field and section schemas. Each named view has a thin renderer
 * (PDF generator or Vue component) driven by these tags — adding a field to
 * a schema with the appropriate tag automatically propagates to the view.
 *
 * - emergencySheet: one-page emergency information sheet (PDF)
 * - walletCard: credit-card-sized wallet card (PDF)
 * - attorneyPrep: attorney prep packet (PDF)
 * - runbookPdf: household runbook PDF
 * - runbookQuickContacts: "Key People to Contact" section on the For My Family view
 *
 * Note: the full vault PDF (`generator.ts` via `schemaToPdf.ts`) is already
 * fully schema-driven and does NOT use this view system — every visible field
 * appears unless `pdfSkipIfEmpty` filters it.
 */
export type PdfViewName =
  | 'emergencySheet'
  | 'walletCard'
  | 'attorneyPrep'
  | 'runbookPdf'
  | 'runbookQuickContacts'

export interface PdfFieldViewMembership {
  /** Field is included in the view. Required to participate. */
  include: boolean
  /** Lower number = renders earlier within its section. Default: declaration order. */
  priority?: number
  /** Logical sub-section within the view (e.g., 'criticalContacts' on the runbook). */
  section?: string
  /** Override label for this view (defaults to `pdfLabel` then `label`). */
  label?: string
  /**
   * Custom value formatter for this view (defaults to `pdfFormat` then String()).
   * Receives the field's raw value plus the containing item and the full
   * DeathboxData context, enabling cross-section resolves (e.g.,
   * `personId → person.name` lookup against `data.people`).
   */
  format?: (
    value: any,
    item: Record<string, unknown>,
    fullData: any,
  ) => string
}

export interface PdfSectionViewMembership {
  /** Section participates in the view (default: implied true if any field is tagged). */
  include?: boolean
  /** Section label override for this view in the printed/rendered output
   *  (defaults to schema `title`). E.g., "PERSONAL INFORMATION" for the
   *  emergency sheet header. */
  sectionLabel?: string
  /** Section label override for the picker UI specifically (e.g., the
   *  EmergencySheetModal section toggle). When the print label is ALL-CAPS
   *  but the UI should be mixed case. Defaults to schema `title`. */
  pickerLabel?: string
  /** Field name on array items used as a sort key (e.g., 'role' for importantContacts). */
  itemSortKey?: string
  /** Explicit priority list of `itemSortKey` values (e.g., ['Executor', 'Attorney', ...]).
   *  Items with values outside the list sort after, in natural order. */
  itemSortPriority?: string[]
  /** Maximum number of items to render in this view (e.g., wallet card has space for 3). */
  itemLimit?: number
  /**
   * Override the per-item heading rendered above its fields in this view.
   * Receives the raw item plus the full DeathboxData for cross-section lookups
   * (e.g., `personId → person.name`). Defaults to `arrayItemLabel` if defined,
   * else undefined (no heading). Empty string suppresses the heading.
   */
  itemLabel?: (item: Record<string, unknown>, fullData: any) => string
}

export interface FormFieldSchema {
  // Field identification
  // Note: name, label, and type are optional when sectionDivider is used
  name?: string // Property name in the data model
  label?: string // Display label
  type?: FieldType // Field type (not required for section dividers)
  
  // Field configuration
  placeholder?: string
  required?: boolean
  rows?: number // For textarea
  options?: Array<{ label: string; value: string | number }> // For select/radio
  
  // Layout
  colSpan?: 1 | 2 // How many columns this field spans (1 or 2 in a 2-column grid)
  fullWidth?: boolean // If true, spans full width regardless of grid
  
  // Conditional visibility
  visible?: VisibilityCondition | VisibilityCondition[] // Show/hide based on other fields
  
  // Typographic Inversion (Story 1.6)
  //
  // 'prose' — value renders in Inter at body-md (16px / 16pt) regular weight.
  //           This hint affects PDF rendering only — the screen FieldRenderer
  //           uses uniform prose typography on every input (consistent editing
  //           surface).
  // 'mono'  — value renders in JetBrains Mono at mono-md (16px / 16pt) regular
  //           in the PDF.
  //
  // Default resolution (see `resolveFieldDisplayAs`):
  //   - 'mono' for `password` type only (structured scan target).
  //   - 'prose' for every other type, including `tel` (phone numbers read
  //     fine in proportional font).
  // Schema authors should override `text` fields that hold structured data
  // (crypto addresses, BIP-39 phrases, fingerprints, IBAN/SWIFT, IPFS hashes,
  // tax IDs, API keys, recovery codes) to 'mono' so the eye can compare
  // character by character on the printed runbook.
  displayAs?: 'prose' | 'mono'

  // PDF generation (full vault PDF via schemaToPdf.ts)
  pdfLabel?: string // Optional different label for PDF
  pdfFormat?: (value: any) => string // Custom formatter for PDF
  pdfSkipIfEmpty?: boolean // Skip in PDF if empty

  // Bespoke PDF / UI views (emergency sheet, wallet card, runbook, etc.)
  // See PdfViewName + PdfFieldViewMembership for the contract. Adding a field
  // here with `include: true` automatically propagates it to that view's
  // thin renderer — no PDF code change needed.
  pdfViews?: Partial<Record<PdfViewName, PdfFieldViewMembership>>
  
  // Manual entry (for sensitive fields like passwords, PINs, seed phrases)
  manualEntry?: boolean // If true, allows user to mark field for manual entry in PDF
  manualEntryFieldName?: string // Name of the boolean field that stores manual entry flag (defaults to `${name}ManualEntry`)
  
  // Nested array (for arrays within objects, e.g., multiSigConfig.keys[])
  arraySchema?: FormSectionSchema // Schema for array items (only used when type is 'array')
  arrayAllowAdd?: boolean // Whether to show the "Add" button for array fields (default: true)
  arrayAllowRemove?: boolean // Whether to show the "Remove" button for array fields (default: true)
  
  // Custom component (for special cases)
  component?: string // e.g., 'BeneficiarySelector', 'TrustSelector'
  componentProps?: Record<string, any> // Props to pass to custom component
  
  // Validation
  validation?: {
    pattern?: string // Regex pattern
    min?: number
    max?: number
    message?: string // Custom error message
  }
  
  // Field dependencies (auto-populate from another field)
  dependsOn?: {
    field: string // Source field name
    transform?: (value: any) => any // Optional transform function
  }

  // Dynamic options from store data
  optionsFrom?: {
    source: string // Data path in store (e.g., 'people', 'beneficiaries')
    labelField: string // Field to use as option label (e.g., 'name')
    valueField: string // Field to use as option value (e.g., 'id')
    filter?: (item: any) => boolean // Optional filter function
  }

  // Help text
  helpText?: string
  
  // Section divider (for visual grouping in forms)
  sectionDivider?: {
    label?: string // Optional label for the section
    showBorder?: boolean // Show border above this field (default: true)
    collapsible?: boolean // If true, fields after this divider can be collapsed (until next divider or end of schema)
    defaultExpanded?: boolean // Whether the collapsible section is expanded by default (default: true)
  }
  
  // Expandable section (collapsible group of fields)
  // If set, this field and subsequent fields with the same expandableSectionId are grouped
  expandableSectionId?: string // ID to group fields into an expandable section
  expandableSectionLabel?: string // Label for the expandable section (only needed on first field of group)
  expandableSectionDefaultExpanded?: boolean // Whether section is expanded by default
}

export interface FormSectionSchema {
  // Section identification
  sectionKey: string // Key in the data model (e.g., 'financialAccounts')
  title: string
  description?: string
  
  // Array vs single object
  isArray?: boolean // If true, allows adding/removing multiple items
  arrayItemLabel?: (index: number, item: any) => string // Label for array items
  initializeItem?: () => any // Custom function to initialize new array items (for ID generation, etc.)
  
  // Fields
  fields: FormFieldSchema[]
  
  // Grouping (for full vault PDF)
  pdfGroup?: string // Which PDF group this section belongs to

  // Per-view section-level metadata for bespoke PDF / UI views.
  // See PdfViewName + PdfSectionViewMembership for the contract.
  pdfViews?: Partial<Record<PdfViewName, PdfSectionViewMembership>>

  // Conditional section visibility
  visible?: VisibilityCondition | VisibilityCondition[]
}

export interface FormSchema {
  sections: FormSectionSchema[]
}

/**
 * Helper function to evaluate visibility conditions
 */
function getNestedValue(data: any, path: string): any {
  const parts = path.split('.')
  let value = data
  for (const part of parts) {
    if (value == null) return undefined
    value = value[part]
  }
  return value
}

export function evaluateVisibility(
  condition: VisibilityCondition | VisibilityCondition[] | undefined,
  data: any
): boolean {
  if (!condition) return true
  
  const conditions = Array.isArray(condition) ? condition : [condition]
  
  return conditions.every(cond => {
    // Support nested paths
    const fieldValue = getNestedValue(data, cond.field)
    
    // Handle 'and' conditions
    if (cond.and && Array.isArray(cond.and)) {
      const andResult = cond.and.every(andCond => {
        const andFieldValue = getNestedValue(data, andCond.field)
        switch (andCond.operator) {
          case 'equals':
            return andFieldValue === andCond.value
          case 'notEquals':
            return andFieldValue !== andCond.value
          case 'contains':
            return String(andFieldValue || '').includes(String(andCond.value || ''))
          case 'isEmpty':
            return !andFieldValue || (Array.isArray(andFieldValue) && andFieldValue.length === 0)
          case 'isNotEmpty':
            return andFieldValue && (!Array.isArray(andFieldValue) || andFieldValue.length > 0)
          default:
            return true
        }
      })
      if (!andResult) return false
    }
    
    switch (cond.operator) {
      case 'equals':
        return fieldValue === cond.value
      case 'notEquals':
        return fieldValue !== cond.value
      case 'contains':
        return String(fieldValue || '').includes(String(cond.value || ''))
      case 'isEmpty':
        return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)
      case 'isNotEmpty':
        return fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0)
      default:
        return true
    }
  })
}

/**
 * Get visible fields for a given data object
 */
export function getVisibleFields(
  fields: FormFieldSchema[],
  data: any
): FormFieldSchema[] {
  return fields.filter(field => evaluateVisibility(field.visible, data))
}

/**
 * Resolve the effective display mode for a field's value (Story 1.6 —
 * Typographic Inversion).
 *
 *   prose — Inter body-md, regular weight. Free-form text, descriptions,
 *           addresses, option labels, names, phone numbers, emails.
 *   mono  — JetBrains Mono mono-md, regular weight. Structured data the
 *           eye needs to compare character-by-character (wallet addresses,
 *           account numbers, recovery codes, BIP-39 phrases, fingerprints).
 *
 * Schema's `displayAs` wins; otherwise type-based defaults: `password`
 * defaults to mono (passwords are character-by-character scan targets);
 * everything else defaults to prose. Schema authors opt-in to mono for
 * structured `text` fields (crypto addresses, account numbers, etc.).
 *
 * If a schema author typos `displayAs` to anything other than 'prose' or
 * 'mono', the resolver normalizes to prose and (in dev mode) emits a
 * console warning so the typo surfaces during schema review rather than
 * silently falling through.
 */
export function resolveFieldDisplayAs(field: FormFieldSchema): 'prose' | 'mono' {
  const raw = field.displayAs
  if (raw === 'prose' || raw === 'mono') return raw
  if (raw !== undefined) {
    // Typo guard. TypeScript's union narrows this case to never at compile
    // time, but raw JSON imports / dynamic schema authoring would slip a
    // bad value through. Warn loudly so it gets fixed.
    // eslint-disable-next-line no-console
    console.warn(
      `resolveFieldDisplayAs: unexpected displayAs="${String(raw)}" on field "${field.name ?? 'unnamed'}" — falling back to 'prose'. Valid values: 'prose' | 'mono'.`,
    )
  }
  if (field.type === 'password') return 'mono'
  return 'prose'
}

