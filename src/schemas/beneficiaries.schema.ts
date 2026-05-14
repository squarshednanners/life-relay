import type { FormSectionSchema } from '@/models/FormSchema'

export const beneficiariesSchema: FormSectionSchema = {
  sectionKey: 'beneficiaries',
  title: 'Beneficiaries',
  description: 'Manage your beneficiaries. Assign them as primary or secondary and specify the percentage they receive.',
  isArray: true,
  arrayItemLabel: (index, item) => item.name || `Beneficiary ${index + 1}`,
  initializeItem: () => ({
    id: `beneficiary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    relationship: '',
    type: 'primary',
    percentage: 0,
    phone: '',
    email: '',
    address: '',
    notes: '',
  }),
  pdfGroup: 'People & Contacts',
  pdfViews: {
    walletCard: {
      // Used by the renderer as a fallback source when fewer than 4 important
      // contacts are tagged. Each beneficiary appears as a row labelled
      // 'Beneficiary' with name + phone.
      itemLabel: () => 'Beneficiary',
    },
    attorneyPrep: {
      sectionLabel: 'Beneficiaries',
      itemLabel: (item) => {
        const name = String(item.name ?? '')
        const type = String(item.type ?? '')
        return [name, type ? `(${type})` : ''].filter(Boolean).join(' ')
      },
    },
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Beneficiary Name',
      colSpan: 1,
      pdfViews: { walletCard: { include: true, priority: 10 } },
    },
    {
      name: 'relationship',
      label: 'Relationship',
      type: 'text',
      placeholder: 'Spouse, Child, etc.',
      colSpan: 1,
      pdfViews: {
        attorneyPrep: { include: true, priority: 10, label: 'Relationship' },
      },
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
      ],
    },
    {
      name: 'percentage',
      label: 'Percentage (%)',
      type: 'number',
      placeholder: '0-100',
      colSpan: 1,
      validation: {
        min: 0,
        max: 100,
      },
      pdfSkipIfEmpty: true,
      pdfViews: {
        attorneyPrep: {
          include: true,
          priority: 30,
          label: 'Percentage',
          format: (value) => (value ? `${value}%` : ''),
        },
      },
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
      pdfViews: { walletCard: { include: true, priority: 20 } },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'email@example.com',
      colSpan: 1,
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Address',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
      pdfViews: {
        attorneyPrep: { include: true, priority: 20, label: 'Address' },
      },
    },
    {
      name: 'documentFiles',
      label: 'Beneficiary documents (designation forms, signed acknowledgments)',
      type: 'attachment',
      multiple: true,
      fullWidth: true,
      pdfSkipIfEmpty: true,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
      pdfSkipIfEmpty: true,
      pdfViews: {
        attorneyPrep: { include: true, priority: 40, label: 'Notes' },
      },
    },
  ],
}

