/**
 * Example: Financial Accounts Form Schema
 * 
 * This demonstrates how to define a form schema that can be used
 * for both UI rendering and PDF generation.
 */

import type { FormSectionSchema } from '@/models/FormSchema'

export const financialAccountsSchema: FormSectionSchema = {
  sectionKey: 'financialAccounts',
  title: 'Financial Accounts',
  description: 'Bank accounts, investment accounts, and other financial institutions',
  isArray: true,
  arrayItemLabel: (index) => `Account ${index + 1}`,
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
      // Conditional placeholder based on accountCategory
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

