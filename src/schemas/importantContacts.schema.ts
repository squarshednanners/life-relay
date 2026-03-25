import type { FormSectionSchema } from '@/models/FormSchema'

export const importantContactsSchema: FormSectionSchema = {
  sectionKey: 'importantContacts',
  title: 'Important Contacts',
  description: 'Key contacts such as attorneys, accountants, financial advisors, executors, and other important people',
  isArray: true,
  arrayItemLabel: (index, item) => {
    const name = item.name || `Contact ${index + 1}`
    const role = item.role && item.role !== '' ? ` (${item.role})` : ''
    return `${name}${role}`
  },
  pdfGroup: 'People & Contacts',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Contact name',
      colSpan: 1,
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select role', value: '' },
        { label: 'Attorney', value: 'Attorney' },
        { label: 'Accountant / CPA', value: 'Accountant / CPA' },
        { label: 'Financial Advisor', value: 'Financial Advisor' },
        { label: 'Insurance Agent', value: 'Insurance Agent' },
        { label: 'Executor', value: 'Executor' },
        { label: 'Trustee', value: 'Trustee' },
        { label: 'Doctor', value: 'Doctor' },
        { label: 'Clergy', value: 'Clergy' },
        { label: 'Employer HR', value: 'Employer HR' },
        { label: 'Family', value: 'Family' },
        { label: 'Friend', value: 'Friend' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'organization',
      label: 'Organization / Firm',
      type: 'text',
      placeholder: 'Company or firm name',
      colSpan: 1,
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'email@example.com',
      colSpan: 1,
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Address',
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
