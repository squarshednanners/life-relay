import type { FormSectionSchema } from '@/models/FormSchema'

/**
 * Shared role priority list used by both the runbook PDF and the For My
 * Family view's Quick Contacts section. Single source of truth — adding a
 * role here propagates to both surfaces.
 */
const RUNBOOK_PRIORITY_ROLES = [
  'Executor',
  'Attorney',
  'Trustee',
  'Doctor',
  'Accountant / CPA',
  'Financial Advisor',
]

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
  pdfViews: {
    emergencySheet: {
      sectionLabel: 'KEY CONTACTS',
      pickerLabel: 'Key Contacts',
      itemSortKey: 'role',
      itemSortPriority: [
        'Executor',
        'Attorney',
        'Doctor',
        'Family',
        'Accountant / CPA',
        'Financial Advisor',
        'Insurance Agent',
        'Trustee',
        'Clergy',
      ],
      itemLabel: (item) => {
        const name = String(item.name ?? '')
        const role = String(item.role ?? '')
        return [name, role].filter(Boolean).join(' - ')
      },
    },
    walletCard: {
      itemSortKey: 'role',
      itemSortPriority: ['Executor', 'Attorney', 'Doctor', 'Trustee'],
      itemLimit: 4,
      itemLabel: (item) => String(item.role ?? '') || 'Contact',
    },
    runbookPdf: {
      itemSortKey: 'role',
      // The runbook PDF's Quick Contacts only includes contacts whose role
      // appears in this priority list (renderer-side filter). Sorted in
      // declaration order; up to 8 total.
      itemSortPriority: RUNBOOK_PRIORITY_ROLES,
      itemLimit: 8,
    },
    runbookQuickContacts: {
      // For My Family view's Quick Contacts. Same priority list as
      // runbookPdf; no limit (Vue view shows all matching).
      itemSortKey: 'role',
      itemSortPriority: RUNBOOK_PRIORITY_ROLES,
    },
    attorneyPrep: {
      sectionLabel: 'Executor & Key Contacts',
      itemSortKey: 'role',
      itemSortPriority: [
        'Executor',
        'Attorney',
        'Trustee',
        'Financial Advisor',
        'Accountant / CPA',
        'Insurance Agent',
        'Doctor',
        'Clergy',
      ],
      itemLabel: (item) => {
        const name = String(item.name ?? '')
        const role = String(item.role ?? '')
        return [name, role].filter(Boolean).join(' — ')
      },
    },
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Contact name',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 10 },
        walletCard: { include: true, priority: 10 },
        runbookPdf: { include: true, priority: 10 },
        runbookQuickContacts: { include: true, priority: 10 },
      },
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 20 },
        runbookPdf: { include: true, priority: 20 },
        runbookQuickContacts: { include: true, priority: 20 },
      },
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
      pdfViews: {
        emergencySheet: { include: true, priority: 50, label: 'Org' },
        attorneyPrep: { include: true, priority: 30, label: 'Organization' },
      },
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 30 },
        walletCard: { include: true, priority: 20 },
        runbookPdf: { include: true, priority: 30 },
        runbookQuickContacts: { include: true, priority: 30 },
        attorneyPrep: { include: true, priority: 10, label: 'Phone' },
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'email@example.com',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 40 },
        attorneyPrep: { include: true, priority: 20, label: 'Email' },
      },
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
      pdfSkipIfEmpty: true,
      pdfViews: {
        attorneyPrep: { include: true, priority: 40, label: 'Notes' },
      },
    },
  ],
}
