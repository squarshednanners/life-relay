import type { FormSectionSchema } from '@/models/FormSchema'

export const creditCardsSchema: FormSectionSchema = {
  sectionKey: 'creditCards',
  title: 'Credit Cards',
  description: 'Credit card accounts and the contact info needed to cancel or dispute charges',
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
      placeholder: 'Last 4 digits',
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
      name: 'autopaySource',
      label: 'Autopay Source',
      type: 'text',
      placeholder: 'e.g. Chase Checking ****1234',
      colSpan: 2,
      fullWidth: true,
      helpText: 'Which account pays this card automatically (if any)',
    },

    // ===== Cancellation & Disputes =====
    {
      sectionDivider: {
        label: 'Cancellation & Disputes',
        collapsible: true,
      },
    },
    {
      name: 'customerServicePhone',
      label: 'Customer Service Phone',
      type: 'tel',
      placeholder: '(800) 555-0100',
      colSpan: 1,
      helpText: 'Number on the back of the card',
    },
    {
      name: 'accountPin',
      label: 'Account PIN / Verbal Password',
      type: 'password',
      placeholder: 'PIN or security word for phone authentication',
      colSpan: 1,
      manualEntry: true,
      helpText: 'Some issuers require a PIN or verbal password to authorize changes',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Recurring charges on this card, authorized users, rewards programs, anything else useful',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}
