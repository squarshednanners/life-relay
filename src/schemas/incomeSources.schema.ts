import type { FormSectionSchema } from '@/models/FormSchema'

export const incomeSourcesSchema: FormSectionSchema = {
  sectionKey: 'incomeSources',
  title: 'Income Sources',
  description: 'Pensions, social security, railroad retirement, and other income sources',
  isArray: true,
  arrayItemLabel: (index, item) => item.source || `Income Source ${index + 1}`,
  pdfGroup: 'Finances',
  fields: [
    {
      name: 'source',
      label: 'Source',
      type: 'text',
      placeholder: 'Social Security, Pension, Railroad Retirement, etc.',
      colSpan: 1,
    },
    {
      name: 'amount',
      label: 'Monthly Amount',
      type: 'currency',
      placeholder: '$0.00',
      colSpan: 1,
    },
    {
      name: 'accountNumber',
      label: 'Account Number',
      type: 'text',
      placeholder: 'Account or claim number',
      colSpan: 1,
    },
    {
      name: 'contactInfo',
      label: 'Contact Information',
      type: 'textarea',
      placeholder: 'Contact details for this income source',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
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

