import type { FormSectionSchema } from '@/models/FormSchema'

export const assetDocumentsSchema: FormSectionSchema = {
  sectionKey: 'assetDocuments',
  title: 'Asset Documents',
  description: 'Important documents related to assets',
  isArray: true,
  arrayItemLabel: (index, item) => item.documentType || `Document ${index + 1}`,
  pdfGroup: 'Documents & Storage',
  fields: [
    {
      name: 'documentType',
      label: 'Document Type',
      type: 'text',
      placeholder: 'Title, Deed, Certificate, etc.',
      colSpan: 1,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      placeholder: 'Document description',
      colSpan: 1,
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      placeholder: 'Where the document is stored',
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

