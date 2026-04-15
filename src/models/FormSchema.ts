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
  
  // PDF generation
  pdfLabel?: string // Optional different label for PDF
  pdfFormat?: (value: any) => string // Custom formatter for PDF
  pdfSkipIfEmpty?: boolean // Skip in PDF if empty
  
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
  
  // Grouping (for PDF)
  pdfGroup?: string // Which PDF group this section belongs to
  
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

