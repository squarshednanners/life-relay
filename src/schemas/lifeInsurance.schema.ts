import type { FormSectionSchema } from '@/models/FormSchema'

export const lifeInsuranceSchema: FormSectionSchema = {
  sectionKey: 'lifeInsurance',
  title: 'Life Insurance',
  description: 'Life insurance policies and beneficiaries',
  isArray: false, // This is a wrapper object with policies array
  pdfGroup: 'Insurance, Medical & Benefits',
  fields: [
    // Note: This schema represents the policies array, not the wrapper
    // The view will handle the nested structure
  ],
}

// Schema for individual policies (used in a nested way)
export const lifeInsurancePolicySchema: FormSectionSchema = {
  sectionKey: 'policies',
  title: 'Life Insurance Policy',
  description: '',
  isArray: true,
  arrayItemLabel: (index) => `Policy ${index + 1}`,
  pdfGroup: 'Insurance, Medical & Benefits',
  fields: [
    {
      name: 'company',
      label: 'Company',
      type: 'text',
      placeholder: 'Insurance Company',
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
      name: 'beneficiaries',
      label: 'Beneficiaries',
      type: 'custom',
      component: 'BeneficiarySelector',
      componentProps: {
        allowMultiple: true,
      },
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'currency',
      placeholder: '$0.00',
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

