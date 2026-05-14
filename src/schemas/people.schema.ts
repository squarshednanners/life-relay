import type { FormSectionSchema } from '@/models/FormSchema'

export const peopleSchema: FormSectionSchema = {
  sectionKey: 'people',
  title: 'People & Personal Information',
  description: 'Manage people in your legacy plan with their personal information (self, spouse, etc.)',
  isArray: true,
  arrayItemLabel: (index, item) => item.name || `Person ${index + 1}`,
  initializeItem: () => ({
    id: `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    dateOfBirth: '',
    socialSecurityNumber: '',
    address: '',
    phone: '',
    email: '',
    notes: '',
  }),
  pdfGroup: 'People & Contacts',
  pdfViews: {
    emergencySheet: {
      sectionLabel: 'PERSONAL INFORMATION',
      pickerLabel: 'Personal Information',
    },
    walletCard: {
      // First person is treated as the vault owner; only their name appears
      // on the wallet card.
      itemLimit: 1,
    },
    attorneyPrep: {
      sectionLabel: 'Personal Information',
      // attorneyPrep uses person.name as the bold item heading
      itemLabel: (item) => String(item.name ?? ''),
    },
  },
  fields: [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Full name',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 10 },
        walletCard: { include: true, priority: 10 },
        // attorneyPrep uses name as the item heading via itemLabel; the field
        // itself is not included as a regular field row.
      },
    },
    {
      name: 'dateOfBirth',
      label: 'Date of Birth',
      type: 'date',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 20, label: 'DOB' },
        attorneyPrep: { include: true, priority: 10, label: 'Date of Birth' },
      },
    },
    {
      name: 'socialSecurityNumber',
      label: 'Social Security Number',
      type: 'password',
      placeholder: 'XXX-XX-XXXX',
      colSpan: 1,
      manualEntry: true,
      pdfViews: {
        attorneyPrep: { include: true, priority: 20, label: 'SSN' },
      },
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Street address, City, State, ZIP',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
      pdfViews: {
        emergencySheet: { include: true, priority: 40 },
        attorneyPrep: { include: true, priority: 50 },
      },
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 30, label: 'Phone' },
        attorneyPrep: { include: true, priority: 30, label: 'Phone' },
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'email@example.com',
      colSpan: 1,
      pdfViews: {
        attorneyPrep: { include: true, priority: 40, label: 'Email' },
      },
    },
    {
      name: 'documentFiles',
      label: 'Identity documents (passport, driver\'s license, birth certificate)',
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

