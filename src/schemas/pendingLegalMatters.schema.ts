import type { FormSectionSchema } from '@/models/FormSchema'

export const pendingLegalMattersSchema: FormSectionSchema = {
  sectionKey: 'pendingLegalMatters',
  title: 'Pending Legal Matters',
  description: 'Active lawsuits, claims, disputes, or other legal matters an executor should be aware of',
  isArray: true,
  arrayItemLabel: (index, item) => {
    const desc = item.description || ''
    const type = item.matterType || ''
    if (desc) return desc
    return type || `Legal Matter ${index + 1}`
  },
  pdfGroup: 'Documents & Storage',
  fields: [
    {
      name: 'matterType',
      label: 'Type',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select type', value: '' },
        { label: 'Lawsuit (Plaintiff)', value: 'Lawsuit (Plaintiff)' },
        { label: 'Lawsuit (Defendant)', value: 'Lawsuit (Defendant)' },
        { label: 'Insurance Claim', value: 'Insurance Claim' },
        { label: 'Workers\' Compensation', value: 'Workers\' Compensation' },
        { label: 'Property Dispute', value: 'Property Dispute' },
        { label: 'Contract Dispute', value: 'Contract Dispute' },
        { label: 'Tax Dispute / Audit', value: 'Tax Dispute / Audit' },
        { label: 'Bankruptcy', value: 'Bankruptcy' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      placeholder: 'Brief description of the matter',
      colSpan: 1,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select status', value: '' },
        { label: 'Active', value: 'Active' },
        { label: 'Pending', value: 'Pending' },
        { label: 'On Appeal', value: 'On Appeal' },
        { label: 'Settled / Resolved', value: 'Settled / Resolved' },
      ],
    },
    {
      name: 'attorney',
      label: 'Attorney Handling',
      type: 'text',
      placeholder: 'Attorney or law firm name',
      colSpan: 1,
    },
    {
      name: 'attorneyPhone',
      label: 'Attorney Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
    },
    {
      name: 'caseNumber',
      label: 'Case / Claim Number',
      type: 'text',
      placeholder: 'Case #',
      colSpan: 1,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Key details, deadlines, document locations, etc.',
      colSpan: 2,
      fullWidth: true,
      rows: 3,
    },
  ],
}
