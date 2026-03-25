import type { FormSectionSchema } from '@/models/FormSchema'

export const debtsSchema: FormSectionSchema = {
  sectionKey: 'debts',
  title: 'Debts & Loans',
  description: 'Outstanding debts, loans, and credit accounts',
  isArray: true,
  arrayItemLabel: (index) => `Debt ${index + 1}`,
  pdfGroup: 'Finances',
  fields: [
    {
      name: 'creditor',
      label: 'Creditor',
      type: 'text',
      placeholder: 'Creditor Name',
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
      name: 'type',
      label: 'Type',
      type: 'text',
      placeholder: 'Credit Card, Mortgage, etc.',
      colSpan: 1,
    },
    {
      name: 'balance',
      label: 'Balance',
      type: 'currency',
      placeholder: '$0.00',
      colSpan: 1,
    },
    {
      name: 'monthlyPayment',
      label: 'Monthly Payment',
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

