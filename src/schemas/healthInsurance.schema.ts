import type { FormSectionSchema } from '@/models/FormSchema'

export const healthInsuranceSchema: FormSectionSchema = {
  sectionKey: 'healthInsurance',
  title: 'Health Insurance',
  description: 'Health insurance policies and covered members',
  isArray: true,
  arrayItemLabel: (index, item) => item?.provider || `Policy ${index + 1}`,
  pdfGroup: 'Insurance, Medical & Benefits',
  pdfViews: {
    emergencySheet: { sectionLabel: 'HEALTH INSURANCE' },
  },
  fields: [
    {
      name: 'provider',
      label: 'Provider',
      type: 'text',
      placeholder: 'Insurance Provider',
      colSpan: 1,
      pdfViews: { emergencySheet: { include: true, priority: 10 } },
    },
    {
      name: 'planType',
      label: 'Plan Type',
      type: 'select',
      colSpan: 1,
      pdfViews: { emergencySheet: { include: true, priority: 15 } },
      options: [
        { label: '', value: '' },
        { label: 'PPO', value: 'PPO' },
        { label: 'HMO', value: 'HMO' },
        { label: 'EPO', value: 'EPO' },
        { label: 'POS', value: 'POS' },
        { label: 'HDHP', value: 'HDHP' },
        { label: 'Medicare', value: 'Medicare' },
        { label: 'Medicaid', value: 'Medicaid' },
        { label: 'Dental', value: 'Dental' },
        { label: 'Vision', value: 'Vision' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'policyNumber',
      label: 'Policy Number',
      type: 'text',
      placeholder: 'Policy #',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 20, label: 'Policy #' },
      },
    },
    {
      name: 'groupNumber',
      label: 'Group Number',
      type: 'text',
      placeholder: 'Group #',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 30, label: 'Group #' },
      },
    },
    {
      name: 'contactPhone',
      label: 'Contact Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 40, label: 'Phone' },
      },
    },
    {
      name: 'coveredMembers',
      label: 'Covered Members',
      type: 'text',
      placeholder: 'e.g. John, Jane, Alex, Sam',
      colSpan: 1,
      helpText: 'Names of people covered under this policy',
      pdfSkipIfEmpty: true,
      pdfViews: {
        emergencySheet: { include: true, priority: 50, label: 'Covered' },
      },
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes (deductible, copay, etc.)',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}
