import type { FormSectionSchema } from '@/models/FormSchema'

export const lifeInsuranceSchema: FormSectionSchema = {
  sectionKey: 'lifeInsurance',
  title: 'Life Insurance',
  description: 'Life insurance policies, beneficiaries, and the contact info needed to file a claim',
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
  arrayItemLabel: (index, item) => item?.company || `Policy ${index + 1}`,
  pdfGroup: 'Insurance, Medical & Benefits',
  fields: [
    {
      name: 'company',
      label: 'Insurance Company',
      type: 'text',
      placeholder: 'Insurance Company',
      colSpan: 1,
    },
    {
      name: 'policyType',
      label: 'Policy Type',
      type: 'select',
      colSpan: 1,
      options: [
        { label: '', value: '' },
        { label: 'Term', value: 'term' },
        { label: 'Whole Life', value: 'whole' },
        { label: 'Universal Life', value: 'universal' },
        { label: 'Variable Life', value: 'variable' },
        { label: 'Group / Employer-provided', value: 'group' },
        { label: 'Accidental Death', value: 'accidental' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'policyNumber',
      label: 'Policy Number',
      type: 'text',
      placeholder: 'Policy #',
      colSpan: 1,
    },
    {
      name: 'amount',
      label: 'Death Benefit Amount',
      type: 'currency',
      placeholder: '$0.00',
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

    // ===== Filing a Claim =====
    {
      sectionDivider: {
        label: 'Filing a Claim',
        collapsible: true,
      },
    },
    {
      name: 'agentName',
      label: 'Agent / Contact Name',
      type: 'text',
      placeholder: 'Agent or company representative',
      colSpan: 1,
    },
    {
      name: 'agentPhone',
      label: 'Agent / Claims Phone',
      type: 'tel',
      placeholder: '(800) 555-0100',
      colSpan: 1,
    },
    {
      name: 'policyDocumentLocation',
      label: 'Policy Document Location',
      type: 'text',
      placeholder: 'e.g. Home safe, safe deposit box, with attorney',
      colSpan: 2,
      fullWidth: true,
      helpText: 'Beneficiaries will need the policy number and may need the original document',
    },
    {
      name: 'claimProcess',
      label: 'Claim Process / Required Documents',
      type: 'textarea',
      placeholder: 'e.g. Call agent first. Need certified death certificate, beneficiary ID, and policy number. Some employers handle group claims through HR.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },

    // ===== Premium & Status =====
    {
      sectionDivider: {
        label: 'Premium & Status',
        collapsible: true,
        defaultExpanded: false,
      },
    },
    {
      name: 'premiumPaymentInfo',
      label: 'How Premiums Are Paid',
      type: 'text',
      placeholder: 'e.g. Auto-debit from Chase Checking, payroll deduction, employer-paid',
      colSpan: 2,
      fullWidth: true,
      helpText: 'Heirs may need to keep premiums current during probate',
    },
    {
      name: 'termExpiration',
      label: 'Term Expiration Date',
      type: 'text',
      placeholder: 'e.g. 2040',
      colSpan: 1,
      helpText: 'When does the policy lapse if it\'s a term policy?',
    },

    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Riders, exclusions, conversion options, anything else useful',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}
