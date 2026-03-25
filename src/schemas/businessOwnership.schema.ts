import type { FormSectionSchema } from '@/models/FormSchema'

export const businessOwnershipSchema: FormSectionSchema = {
  sectionKey: 'businessOwnership',
  title: 'Business Ownership',
  description: 'Business interests and ownership information',
  isArray: true,
  arrayItemLabel: (index) => `Business ${index + 1}`,
  pdfGroup: 'Property & Household',
  fields: [
    {
      name: 'businessName',
      label: 'Business Name',
      type: 'text',
      placeholder: 'Business Name',
      colSpan: 1,
    },
    {
      name: 'type',
      label: 'Type',
      type: 'text',
      placeholder: 'LLC, Corporation, Partnership, etc.',
      colSpan: 1,
    },
    {
      name: 'ownershipPercentage',
      label: 'Ownership Percentage',
      type: 'text',
      placeholder: '50%, 100%, etc.',
      colSpan: 1,
    },
    {
      name: 'contactInfo',
      label: 'Contact Information',
      type: 'textarea',
      placeholder: 'Business contact details',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
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

