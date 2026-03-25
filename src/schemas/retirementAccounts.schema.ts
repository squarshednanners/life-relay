import type { FormSectionSchema } from '@/models/FormSchema'

export const retirementAccountsSchema: FormSectionSchema = {
  sectionKey: 'retirementAccounts',
  title: 'Investment/Retirement Accounts',
  description: '401k, IRA, pension, brokerage accounts, and other investment accounts',
  isArray: true,
  arrayItemLabel: (index) => `Account ${index + 1}`,
  pdfGroup: 'Finances',
  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'text',
      placeholder: '401k, IRA, Brokerage, Pension, etc.',
      colSpan: 1,
    },
    {
      name: 'institution',
      label: 'Institution',
      type: 'text',
      placeholder: 'Institution Name',
      colSpan: 1,
    },
    {
      name: 'accountName',
      label: 'Account Name',
      type: 'text',
      placeholder: 'Account name or trust name (optional)',
      colSpan: 1,
    },
    {
      name: 'accountNumber',
      label: 'Account Number',
      type: 'text',
      placeholder: 'Account #',
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
      name: 'balance',
      label: 'Balance',
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

