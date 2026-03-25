/**
 * PDF Generator Helper for Schema-Based Forms
 * 
 * This utility converts form schemas to PDF output, reducing duplication
 * between form definitions and PDF generation.
 */

import type { FormSectionSchema, FormFieldSchema } from '@/models/FormSchema'
import { getVisibleFields, evaluateVisibility } from '@/models/FormSchema'
import type { DeathboxData } from '@/models/DeathboxData'

/**
 * Get manual entry field name for a given field
 */
function getManualEntryFieldName(field: FormFieldSchema): string {
  return field.manualEntryFieldName || `${field.name}ManualEntry`
}

/**
 * Format beneficiary assignments for PDF display
 */
function formatBeneficiaries(
  assignments: any[],
  data: DeathboxData
): string {
  if (!assignments || assignments.length === 0) {
    return ''
  }

  const beneficiaryNames: string[] = []
  assignments.forEach((assignment) => {
    // Use assignment percentage if set, otherwise fall back to beneficiary's default percentage
    let percentage = assignment.percentage
    if (percentage === undefined || percentage === null || percentage === 0) {
      if (assignment.beneficiaryId) {
        const beneficiary = data.beneficiaries?.find((b: any) => b.id === assignment.beneficiaryId)
        if (beneficiary && beneficiary.percentage) {
          percentage = beneficiary.percentage
        }
      }
    }

    if (assignment.beneficiaryId) {
      const beneficiary = data.beneficiaries?.find((b: any) => b.id === assignment.beneficiaryId)
      if (beneficiary) {
        beneficiaryNames.push(
          `${beneficiary.name || 'Unnamed'}${percentage ? ` (${percentage}%)` : ''}`
        )
      }
    } else if (assignment.customName) {
      beneficiaryNames.push(
        `${assignment.customName}${percentage ? ` (${percentage}%)` : ''}`
      )
    }
  })

  return beneficiaryNames.join(', ')
}

/**
 * Format person name from personId
 */
function formatPersonName(personId: string, data: DeathboxData): string {
  if (!personId) return 'Unknown Person'
  const person = data.people?.find((p: any) => p.id === personId)
  return person?.name || 'Unknown Person'
}

/**
 * Add a section to PDF based on schema
 */
export function addSchemaSectionToPDF(
  schema: FormSectionSchema,
  data: any | any[],
  fullData: DeathboxData, // Full data context for lookups (beneficiaries, people, etc.)
  addTitle: (text: string) => void,
  addSectionHeader: (text: string) => void,
  addField: (label: string, value: string | undefined, indent?: number, isTextarea?: boolean) => void,
  ensureSpace: (height: number) => void
) {
  // Check if section should be visible
  if (!evaluateVisibility(schema.visible, data)) {
    return
  }

  const items = schema.isArray ? (data as any[]) : [data]
  
  if (!items || items.length === 0) {
    return
  }

  // Add section title (only once, not for each item)
  addTitle(schema.title)

  items.forEach((item, index) => {
    if (schema.isArray && index > 0) {
      ensureSpace(20) // Space between array items
    }

    // Add section header for array items using arrayItemLabel
    if (schema.isArray && schema.arrayItemLabel) {
      const headerText = schema.arrayItemLabel(index, item)
      addSectionHeader(headerText)
    }

    const visibleFields = getVisibleFields(schema.fields, item)

    visibleFields.forEach(field => {
      // Skip section dividers in PDF
      if (field.sectionDivider) {
        return
      }

      // Skip fields without names (shouldn't happen for non-section-divider fields, but safety check)
      if (!field.name) {
        return
      }

      // Handle fields with dot notation (nested properties like multiSigConfig.requiredSignatures or multiSigConfig.keys)
      let value: any
      if (field.name.includes('.')) {
        const parts = field.name.split('.')
        let nestedValue = item
        for (const part of parts) {
          nestedValue = nestedValue?.[part]
          if (nestedValue === undefined || nestedValue === null) {
            break
          }
        }
        value = nestedValue
      } else {
        value = item[field.name]
      }
      
      // Skip empty fields if configured
      if (field.pdfSkipIfEmpty && (!value || value === '')) {
        return
      }

      // Handle custom components
      if (field.component === 'BeneficiarySelector') {
        if (value && Array.isArray(value) && value.length > 0) {
          const formatted = formatBeneficiaries(value, fullData)
          if (formatted) {
            addField(field.pdfLabel || field.label || '', formatted)
          }
        }
        return
      }

      if (field.component === 'PersonSelector') {
        if (value) {
          const personName = formatPersonName(value, fullData)
          addField(field.pdfLabel || field.label || '', personName)
        }
        return
      }

      // Handle array type fields (nested arrays)
      // Note: value is already extracted above (handles both dot notation and regular fields)
      if (field.type === 'array' && field.arraySchema) {
        // Value should already be correctly extracted above (either from dot notation or direct access)
        const arrayValue = value
        
        if (arrayValue && Array.isArray(arrayValue) && arrayValue.length > 0) {
          // Add a section header for the nested array field
          const arrayLabel = field.pdfLabel || field.label || ''
          if (arrayLabel) {
            addSectionHeader(arrayLabel)
          }
          ensureSpace(10)
          
          // Recursively add nested array section
          // For nested arrays, we'll skip the title and just use section headers for items
          const nestedItems = arrayValue as any[]
          nestedItems.forEach((nestedItem, nestedIndex) => {
            if (nestedIndex > 0) {
              ensureSpace(20) // Space between nested array items
            }

            // Add section header for nested array item using arrayItemLabel if available
            if (field.arraySchema?.arrayItemLabel) {
              const nestedHeaderText = field.arraySchema.arrayItemLabel(nestedIndex, nestedItem)
              addSectionHeader(nestedHeaderText)
            }

            // Process fields in nested item
            const nestedVisibleFields = getVisibleFields(field.arraySchema?.fields || [], nestedItem)
            
            nestedVisibleFields.forEach(nestedField => {
              // Skip section dividers
              if (nestedField.sectionDivider) {
                return
              }

              // Skip fields without names
              if (!nestedField.name) {
                return
              }

              // Handle nested array fields (arrays within arrays)
              if (nestedField.type === 'array' && nestedField.arraySchema) {
                const nestedArrayValue = nestedItem[nestedField.name]
                if (nestedArrayValue && Array.isArray(nestedArrayValue) && nestedArrayValue.length > 0) {
                  // Add a section header for the nested array field
                  const nestedArrayLabel = nestedField.pdfLabel || nestedField.label || ''
                  if (nestedArrayLabel) {
                    addSectionHeader(nestedArrayLabel)
                  }
                  ensureSpace(10)
                  
                  // Process each item in the nested array
                  nestedArrayValue.forEach((nestedArrayItem, nestedArrayIndex) => {
                    if (nestedArrayIndex > 0) {
                      ensureSpace(20)
                    }

                    // Add section header for nested array item
                    if (nestedField.arraySchema?.arrayItemLabel) {
                      const nestedArrayHeaderText = nestedField.arraySchema.arrayItemLabel(nestedArrayIndex, nestedArrayItem)
                      addSectionHeader(nestedArrayHeaderText)
                    }

                    // Process fields in the nested array item
                    const nestedArrayVisibleFields = getVisibleFields(nestedField.arraySchema?.fields || [], nestedArrayItem)
                    
                    nestedArrayVisibleFields.forEach(deepNestedField => {
                      if (deepNestedField.sectionDivider) {
                        return
                      }

                      // Skip fields without names
                      if (!deepNestedField.name) {
                        return
                      }

                      const deepNestedValue = nestedArrayItem[deepNestedField.name]
                      
                      if (deepNestedField.pdfSkipIfEmpty && (!deepNestedValue || deepNestedValue === '')) {
                        return
                      }

                      const deepNestedManualEntryFieldName = getManualEntryFieldName(deepNestedField)
                      const deepNestedHasManualEntryCapability = deepNestedField.manualEntry === true
                      
                      // Check if manual entry checkbox is checked for deeply nested field
                      const deepNestedManualEntryCheckboxValue = nestedArrayItem[deepNestedManualEntryFieldName]
                      const deepNestedIsManualEntry = deepNestedHasManualEntryCapability && (deepNestedManualEntryCheckboxValue === true || deepNestedManualEntryCheckboxValue === 'true')
                      
                      const deepNestedIsEmpty = deepNestedValue === null || deepNestedValue === undefined || deepNestedValue === ''
                      
                      if (deepNestedIsEmpty && deepNestedHasManualEntryCapability && !deepNestedIsManualEntry) {
                        return
                      }

                      let deepNestedDisplayValue: string | undefined
                      
                      // If manual entry checkbox is checked, always show blank line (even if field has a value)
                      if (deepNestedIsManualEntry) {
                        deepNestedDisplayValue = '___________________________ (write manually)'
                      } else if (deepNestedField.pdfFormat) {
                        deepNestedDisplayValue = deepNestedField.pdfFormat(deepNestedValue)
                      } else if (deepNestedIsEmpty) {
                        return
                      } else if (deepNestedField.type === 'checkbox') {
                        deepNestedDisplayValue = deepNestedValue ? 'Yes' : 'No'
                      } else if (deepNestedField.type === 'number') {
                        if (deepNestedValue !== null && deepNestedValue !== undefined) {
                          deepNestedDisplayValue = String(deepNestedValue)
                        }
                      } else if (deepNestedField.type === 'password' && deepNestedValue) {
                        deepNestedDisplayValue = String(deepNestedValue)
                      } else if (deepNestedField.type === 'date' && deepNestedValue) {
                        try {
                          const date = new Date(deepNestedValue)
                          deepNestedDisplayValue = date.toLocaleDateString()
                        } catch {
                          deepNestedDisplayValue = String(deepNestedValue)
                        }
                      } else if (deepNestedField.type === 'select' && deepNestedValue) {
                        const option = deepNestedField.options?.find(opt => opt.value === deepNestedValue)
                        deepNestedDisplayValue = option ? option.label : String(deepNestedValue)
                      } else {
                        deepNestedDisplayValue = String(deepNestedValue)
                      }

                      if (!deepNestedDisplayValue || deepNestedDisplayValue.trim() === '') {
                        return
                      }

                      const deepNestedLabel = deepNestedField.pdfLabel || deepNestedField.label || ''
                      const deepNestedIsTextarea = deepNestedField.type === 'textarea'
                      // Use more indent for deeper nesting
                      addField(deepNestedLabel, deepNestedDisplayValue, 40, deepNestedIsTextarea)
                    })

                    ensureSpace(15)
                  })
                }
                return
              }

              const nestedValue = nestedItem[nestedField.name]
              
              // Skip empty fields if configured
              if (nestedField.pdfSkipIfEmpty && (!nestedValue || nestedValue === '')) {
                return
              }

              // Handle nested field (similar logic to main field handling)
              const nestedManualEntryFieldName = getManualEntryFieldName(nestedField)
              const nestedHasManualEntryCapability = nestedField.manualEntry === true
              
              // Check if manual entry checkbox is checked for nested field
              const nestedManualEntryCheckboxValue = nestedItem[nestedManualEntryFieldName]
              const nestedIsManualEntry = nestedHasManualEntryCapability && (nestedManualEntryCheckboxValue === true || nestedManualEntryCheckboxValue === 'true')
              
              const nestedIsEmpty = nestedValue === null || nestedValue === undefined || nestedValue === ''
              
              if (nestedIsEmpty && nestedHasManualEntryCapability && !nestedIsManualEntry) {
                return
              }

              let nestedDisplayValue: string | undefined
              
              // If manual entry checkbox is checked, always show blank line (even if field has a value)
              if (nestedIsManualEntry) {
                nestedDisplayValue = '___________________________ (write manually)'
              } else if (nestedField.pdfFormat) {
                nestedDisplayValue = nestedField.pdfFormat(nestedValue)
              } else if (nestedIsEmpty) {
                return
              } else if (nestedField.type === 'checkbox') {
                nestedDisplayValue = nestedValue ? 'Yes' : 'No'
              } else if (nestedField.type === 'number') {
                if (nestedValue !== null && nestedValue !== undefined) {
                  nestedDisplayValue = String(nestedValue)
                }
              } else if (nestedField.type === 'password' && nestedValue) {
                nestedDisplayValue = String(nestedValue)
              } else if (nestedField.type === 'date' && nestedValue) {
                try {
                  const date = new Date(nestedValue)
                  nestedDisplayValue = date.toLocaleDateString()
                } catch {
                  nestedDisplayValue = String(nestedValue)
                }
              } else if (nestedField.type === 'select' && nestedValue) {
                const option = nestedField.options?.find(opt => opt.value === nestedValue)
                nestedDisplayValue = option ? option.label : String(nestedValue)
              } else {
                nestedDisplayValue = String(nestedValue)
              }

              if (!nestedDisplayValue || nestedDisplayValue.trim() === '') {
                return
              }

              const nestedLabel = nestedField.pdfLabel || nestedField.label || ''
              const nestedIsTextarea = nestedField.type === 'textarea'
              // Use indent to show nesting visually
              addField(nestedLabel, nestedDisplayValue, 20, nestedIsTextarea)
            })

            ensureSpace(15)
          })
        }
        return
      }

      // For non-array fields, value is already extracted above (including dot notation handling)
      let actualValue = value

      // Check for manual entry flag
      const manualEntryFieldName = getManualEntryFieldName(field)
      const hasManualEntryCapability = field.manualEntry === true
      
      // Check if manual entry checkbox is checked
      // The checkbox value is stored in item[manualEntryFieldName]
      // Try multiple ways the value might be stored (boolean, string, truthy)
      const manualEntryCheckboxValue = item[manualEntryFieldName]
      const isManualEntry = hasManualEntryCapability && (
        manualEntryCheckboxValue === true || 
        manualEntryCheckboxValue === 'true' ||
        manualEntryCheckboxValue === 1 ||
        manualEntryCheckboxValue === '1'
      )
      
      // If field has manual entry capability, show it only if checkbox is checked OR there's a value
      const isEmpty = actualValue === null || actualValue === undefined || actualValue === ''
      
      // If manual entry checkbox is checked, we want to show the field regardless of value
      // If checkbox is NOT checked and field is empty, skip it
      if (isEmpty && hasManualEntryCapability && !isManualEntry) {
        // Field has manual entry capability but checkbox is not checked and field is empty - skip it
        return
      }

      // Format value (use actualValue for dot notation fields)
      let displayValue: string | undefined
      
      // IMPORTANT: If manual entry checkbox is checked, always show blank line (even if field has a value)
      // This must be checked FIRST, before any other formatting
      if (isManualEntry) {
        displayValue = '___________________________ (write manually)'
      } else if (field.pdfFormat) {
        displayValue = field.pdfFormat(actualValue)
      } else if (isEmpty) {
        // Skip empty fields - don't add them to PDF (unless manual entry is checked, which we handled above)
        return
      } else if (field.type === 'checkbox') {
        displayValue = actualValue ? 'Yes' : 'No'
      } else if (field.type === 'currency' && typeof actualValue === 'string') {
        displayValue = actualValue // Already formatted
      } else if (field.type === 'number') {
        // Handle number type fields
        if (actualValue !== null && actualValue !== undefined) {
          displayValue = String(actualValue)
        }
      } else if (field.type === 'password' && actualValue) {
        // For password fields without manual entry checkbox checked, show the actual value
        displayValue = String(actualValue)
      } else if (field.type === 'date' && actualValue) {
        // Format dates nicely
        try {
          const date = new Date(actualValue)
          displayValue = date.toLocaleDateString()
        } catch {
          displayValue = String(actualValue)
        }
      } else if (field.type === 'select' && actualValue) {
        // For select fields, show the label if available
        const option = field.options?.find(opt => opt.value === actualValue)
        displayValue = option ? option.label : String(actualValue)
      } else {
        displayValue = String(actualValue)
      }

      // Skip if displayValue is still empty or undefined
      if (!displayValue || displayValue.trim() === '') {
        return
      }

      const label = field.pdfLabel || field.label || ''
      // Pass isTextarea flag for textarea fields to preserve line breaks
      const isTextarea = field.type === 'textarea'
      addField(label, displayValue, 0, isTextarea)
    })

    // Add spacing after each item
    if (schema.isArray) {
      ensureSpace(15)
    }
  })
}

/**
 * Get all sections for a PDF group
 */
export function getSectionsForGroup(
  schemas: FormSectionSchema[],
  groupName: string
): FormSectionSchema[] {
  return schemas.filter(schema => schema.pdfGroup === groupName)
}

