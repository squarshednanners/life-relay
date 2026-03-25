import type { FormSectionSchema } from '@/models/FormSchema'

export const healthInsuranceSchema: FormSectionSchema = {
  sectionKey: 'healthInsurance',
  title: 'Health Insurance',
  description: 'Health insurance provider and policy information',
  isArray: false,
  pdfGroup: 'Insurance, Medical & Benefits',
  fields: [
    {
      name: 'provider',
      label: 'Provider',
      type: 'text',
      placeholder: 'Insurance Provider',
      colSpan: 1,
    },
    {
      name: 'policyNumber',
      label: 'Policy Number',
      type: 'text',
      placeholder: 'Policy #',
      colSpan: 1,
    },
    {
      name: 'groupNumber',
      label: 'Group Number',
      type: 'text',
      placeholder: 'Group #',
      colSpan: 1,
    },
    {
      name: 'contactPhone',
      label: 'Contact Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}

