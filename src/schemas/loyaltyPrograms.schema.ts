import type { FormSectionSchema } from '@/models/FormSchema'

export const loyaltyProgramsSchema: FormSectionSchema = {
  sectionKey: 'loyaltyPrograms',
  title: 'Loyalty & Rewards Programs',
  description: 'Airline miles, hotel points, credit card rewards, and other loyalty programs that may have transferable value',
  isArray: true,
  arrayItemLabel: (index, item) => {
    const program = item.programName || ''
    const type = item.programType || ''
    if (program && type) return `${program} (${type})`
    return program || type || `Program ${index + 1}`
  },
  pdfGroup: 'Finances',
  fields: [
    {
      name: 'programType',
      label: 'Program Type',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select type', value: '' },
        { label: 'Airline Miles', value: 'Airline Miles' },
        { label: 'Hotel Points', value: 'Hotel Points' },
        { label: 'Credit Card Rewards', value: 'Credit Card Rewards' },
        { label: 'Cashback', value: 'Cashback' },
        { label: 'Retail Rewards', value: 'Retail Rewards' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'programName',
      label: 'Program Name',
      type: 'text',
      placeholder: 'e.g. Delta SkyMiles, Marriott Bonvoy',
      colSpan: 1,
    },
    {
      name: 'memberNumber',
      label: 'Member / Account Number',
      type: 'text',
      placeholder: 'Membership #',
      colSpan: 1,
    },
    {
      name: 'approximateValue',
      label: 'Approximate Balance / Value',
      type: 'text',
      placeholder: 'e.g. 125,000 miles, $450 cashback',
      colSpan: 1,
    },
    {
      name: 'loginEmail',
      label: 'Login Email',
      type: 'email',
      placeholder: 'email@example.com',
      colSpan: 1,
    },
    {
      name: 'transferable',
      label: 'Points/miles are transferable to another person',
      type: 'checkbox',
      colSpan: 1,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Transfer instructions, expiration details, etc.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}
