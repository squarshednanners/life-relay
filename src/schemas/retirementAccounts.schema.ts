import type { FormSectionSchema } from '@/models/FormSchema'

export const retirementAccountsSchema: FormSectionSchema = {
  sectionKey: 'retirementAccounts',
  title: 'Investment/Retirement Accounts',
  description: '401k, IRA, pension, brokerage accounts, and other investment accounts',
  isArray: true,
  arrayItemLabel: (index) => `Account ${index + 1}`,
  pdfGroup: 'Finances',
  pdfViews: {
    attorneyPrep: {
      sectionLabel: 'Retirement & Investment Accounts',
      itemLabel: (item) => {
        const inst = String(item.institution ?? '')
        const type = String(item.type ?? '')
        return [inst, type].filter(Boolean).join(' — ') || 'Account'
      },
    },
  },
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
      pdfViews: {
        attorneyPrep: { include: true, priority: 10, label: 'Account #' },
      },
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
      pdfSkipIfEmpty: true,
      pdfViews: {
        attorneyPrep: {
          include: true,
          priority: 30,
          label: 'Beneficiaries',
          format: (value) => {
            if (!Array.isArray(value)) return ''
            return value
              .map((b) => String((b as Record<string, unknown>).customName ?? '') || 'Designated')
              .join(', ')
          },
        },
      },
    },
    {
      name: 'balance',
      label: 'Balance',
      type: 'currency',
      placeholder: '$0.00',
      colSpan: 1,
      pdfViews: {
        attorneyPrep: { include: true, priority: 20, label: 'Balance' },
      },
    },
    {
      name: 'documentFiles',
      label: 'Account documents (recent statement, plan summary)',
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
    },
  ],
}

