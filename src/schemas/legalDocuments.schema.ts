import type { FormSectionSchema } from '@/models/FormSchema'

export const legalDocumentsSchema: FormSectionSchema = {
  sectionKey: 'legalDocuments',
  title: 'Legal Documents',
  description: 'Wills, power of attorney, advance directives, and other legal documents with their locations',
  isArray: false,
  pdfGroup: 'Documents & Storage',
  fields: [
    {
      sectionDivider: {
        label: 'Will',
      },
    },
    {
      name: 'willLocation',
      label: 'Will Location',
      type: 'text',
      placeholder: 'Where the will is stored',
      colSpan: 1,
    },
    {
      name: 'willDate',
      label: 'Date Executed',
      type: 'date',
      colSpan: 1,
    },
    {
      sectionDivider: {
        label: 'Power of Attorney',
      },
    },
    {
      name: 'powerOfAttorney',
      label: 'POA Document Location',
      type: 'text',
      placeholder: 'Where the power of attorney document is stored',
      colSpan: 1,
    },
    {
      name: 'poaAgent',
      label: 'POA Agent Name',
      type: 'text',
      placeholder: 'Person designated as power of attorney',
      colSpan: 1,
    },
    {
      sectionDivider: {
        label: 'Advance Directive / Living Will',
      },
    },
    {
      name: 'livingWill',
      label: 'Living Will / Advance Directive Location',
      type: 'text',
      placeholder: 'Where the advance directive is stored',
      colSpan: 2,
      fullWidth: true,
    },
    {
      sectionDivider: {
        label: 'Other Documents',
      },
    },
    {
      name: 'otherDocuments',
      label: 'Other Legal Documents',
      type: 'textarea',
      placeholder: 'Other legal documents and their locations',
      colSpan: 2,
      fullWidth: true,
      rows: 3,
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
