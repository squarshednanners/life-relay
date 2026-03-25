import type { FormSectionSchema } from '@/models/FormSchema'

export const creditCardsSchema: FormSectionSchema = {
  sectionKey: 'creditCards',
  title: 'Credit Cards',
  description: 'Credit card accounts and information',
  isArray: true,
  arrayItemLabel: (index, item) => item.cardName || `Credit Card ${index + 1}`,
  pdfGroup: 'Finances',
  fields: [
    {
      name: 'cardName',
      label: 'Card Name',
      type: 'text',
      placeholder: 'Card name or nickname',
      colSpan: 1,
    },
    {
      name: 'issuer',
      label: 'Issuer',
      type: 'text',
      placeholder: 'Bank or credit card company',
      colSpan: 1,
    },
    {
      name: 'cardNumber',
      label: 'Card Number',
      type: 'text',
      placeholder: 'Last 4 digits or full number',
      colSpan: 1,
    },
    {
      name: 'expirationDate',
      label: 'Expiration Date',
      type: 'text',
      placeholder: 'MM/YY',
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

