import type { FormSectionSchema } from '@/models/FormSchema'

export const otherInsuranceSchema: FormSectionSchema = {
  sectionKey: 'otherInsurance',
  title: 'Other Insurance',
  description: 'Homeowner\'s, auto, umbrella, long-term care, disability, and other insurance policies',
  isArray: true,
  arrayItemLabel: (index, item) => {
    const type = item.policyType || ''
    const provider = item.provider || ''
    if (type && provider) return `${type} - ${provider}`
    return type || provider || `Policy ${index + 1}`
  },
  pdfGroup: 'Insurance, Medical & Benefits',
  fields: [
    {
      name: 'policyType',
      label: 'Policy Type',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select policy type', value: '' },
        { label: 'Homeowner\'s Insurance', value: 'Homeowner\'s Insurance' },
        { label: 'Renter\'s Insurance', value: 'Renter\'s Insurance' },
        { label: 'Auto Insurance', value: 'Auto Insurance' },
        { label: 'Umbrella Insurance', value: 'Umbrella Insurance' },
        { label: 'Long-Term Care Insurance', value: 'Long-Term Care Insurance' },
        { label: 'Disability Insurance', value: 'Disability Insurance' },
        { label: 'Flood Insurance', value: 'Flood Insurance' },
        { label: 'Earthquake Insurance', value: 'Earthquake Insurance' },
        { label: 'Dental Insurance', value: 'Dental Insurance' },
        { label: 'Vision Insurance', value: 'Vision Insurance' },
        { label: 'Pet Insurance', value: 'Pet Insurance' },
        { label: 'Travel Insurance', value: 'Travel Insurance' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'provider',
      label: 'Provider / Company',
      type: 'text',
      placeholder: 'Insurance company name',
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
      name: 'agentName',
      label: 'Agent Name',
      type: 'text',
      placeholder: 'Insurance agent',
      colSpan: 1,
    },
    {
      name: 'agentPhone',
      label: 'Agent Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
    },
    {
      name: 'premium',
      label: 'Premium',
      type: 'currency',
      placeholder: '0.00',
      colSpan: 1,
    },
    {
      name: 'billingFrequency',
      label: 'Billing Frequency',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select frequency', value: '' },
        { label: 'Monthly', value: 'Monthly' },
        { label: 'Quarterly', value: 'Quarterly' },
        { label: 'Semi-Annually', value: 'Semi-Annually' },
        { label: 'Annually', value: 'Annually' },
      ],
    },
    {
      name: 'coverageAmount',
      label: 'Coverage Amount',
      type: 'currency',
      placeholder: '0.00',
      colSpan: 1,
    },
    {
      name: 'deductible',
      label: 'Deductible',
      type: 'currency',
      placeholder: '0.00',
      colSpan: 1,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes, claims contact info, etc.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}
