import type { FormSectionSchema } from '@/models/FormSchema'

export const financialAccountsSchema: FormSectionSchema = {
  sectionKey: 'financialAccounts',
  title: 'Financial Accounts',
  description: 'Bank accounts, investment accounts, and beneficiary designations',
  isArray: true,
  arrayItemLabel: (index, item) => item.accountName || item.institution || `Account ${index + 1}`,
  pdfGroup: 'Finances',
  fields: [
    {
      name: 'institution',
      label: 'Institution',
      type: 'text',
      placeholder: 'Bank Name',
      colSpan: 1,
    },
    {
      name: 'accountType',
      label: 'Account Type',
      type: 'text',
      placeholder: 'Checking, Savings, etc.',
      colSpan: 1,
    },
    {
      name: 'accountCategory',
      label: 'Account Owner',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select owner', value: '' },
        { label: 'Personal', value: 'personal' },
        { label: 'Business', value: 'business' },
        { label: 'Joint', value: 'joint' },
        { label: 'Trust', value: 'trust' },
      ],
    },
    {
      name: 'accountName',
      label: 'Account Name',
      type: 'text',
      colSpan: 1,
      placeholder: 'Account name (optional)',
      visible: {
        field: 'accountCategory',
        operator: 'isNotEmpty',
      },
    },
    {
      name: 'accountNumber',
      label: 'Account Number',
      type: 'text',
      placeholder: 'Account #',
      colSpan: 1,
    },
    {
      name: 'routingNumber',
      label: 'Routing Number',
      type: 'text',
      placeholder: 'Routing #',
      colSpan: 1,
    },
    {
      name: 'contactPhone',
      label: 'Branch / Contact Phone',
      type: 'tel',
      placeholder: '(800) 555-0100',
      colSpan: 1,
    },

    // ===== Beneficiary & Transfer on Death =====
    {
      sectionDivider: {
        label: 'Beneficiary / Transfer on Death',
        collapsible: true,
      },
    },
    {
      name: 'transferType',
      label: 'On Death, Account Transfers Via',
      type: 'select',
      colSpan: 1,
      options: [
        { label: '', value: '' },
        { label: 'POD (Payable on Death) — direct to beneficiary', value: 'pod' },
        { label: 'TOD (Transfer on Death) — direct to beneficiary', value: 'tod' },
        { label: 'Joint with rights of survivorship', value: 'jtwros' },
        { label: 'Held in trust', value: 'trust' },
        { label: 'Passes through estate / probate', value: 'estate' },
        { label: 'Not designated', value: 'none' },
      ],
      helpText: 'How does this account pass to your heirs? POD/TOD avoid probate.',
    },
    {
      name: 'beneficiaries',
      label: 'Beneficiaries',
      type: 'custom',
      component: 'BeneficiarySelector',
      componentProps: { allowMultiple: true },
      colSpan: 2,
      fullWidth: true,
      visible: {
        field: 'transferType',
        operator: 'isNotEmpty',
        and: [{ field: 'transferType', operator: 'notEquals', value: 'none' }],
      },
    },

    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Recurring deposits/withdrawals, linked accounts, special terms, anything else useful',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}
