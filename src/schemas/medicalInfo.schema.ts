import type { FormSectionSchema } from '@/models/FormSchema'

export const medicalInfoSchema: FormSectionSchema = {
  sectionKey: 'medicalInfo',
  title: 'Medical Information',
  description: 'Medical history, medications, and advance directives for each person',
  isArray: true,
  arrayItemLabel: (index) => `Medical Info ${index + 1}`, // Will be enhanced with person name in view
  pdfGroup: 'Insurance, Medical & Benefits',
  pdfViews: {
    emergencySheet: {
      sectionLabel: 'MEDICAL INFORMATION',
      itemLabel: (item, fullData) => {
        const personId = String(item.personId ?? '')
        if (!personId) return ''
        const people = (fullData as { people?: Array<{ id: string; name?: string }> }).people ?? []
        const person = people.find((p) => p.id === personId)
        return person?.name ?? ''
      },
    },
    walletCard: {
      // Renderer filters to the medical record matching people[0].id; this
      // section just declares which fields are walletCard-visible.
    },
  },
  fields: [
    {
      name: 'personId',
      label: 'Person',
      type: 'custom', // Will need a PersonSelector component
      component: 'PersonSelector',
      colSpan: 1,
      // personId is rendered as the item heading via emergencySheet itemLabel
      // override above (resolves personId → person.name); not as a field.
    },
    {
      name: 'primaryPhysician',
      label: 'Primary Physician',
      type: 'text',
      placeholder: 'Dr. John Smith',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 10, label: 'Physician' },
      },
    },
    {
      name: 'physicianPhone',
      label: 'Physician Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
      pdfViews: {
        emergencySheet: { include: true, priority: 20, label: 'Dr. Phone' },
      },
    },
    {
      name: 'allergies',
      label: 'Allergies',
      type: 'textarea',
      placeholder: 'List any known allergies',
      colSpan: 2,
      fullWidth: true,
      rows: 3,
      pdfViews: {
        emergencySheet: { include: true, priority: 30 },
        walletCard: { include: true, priority: 20, label: 'Allergies' },
      },
    },
    {
      name: 'medications',
      label: 'Current Medications',
      type: 'textarea',
      placeholder: 'List current medications and dosages',
      colSpan: 2,
      fullWidth: true,
      rows: 4,
      pdfViews: {
        emergencySheet: { include: true, priority: 40, label: 'Medications' },
      },
    },
    {
      name: 'medicalConditions',
      label: 'Medical Conditions',
      type: 'textarea',
      placeholder: 'List any chronic or significant medical conditions',
      colSpan: 2,
      fullWidth: true,
      rows: 4,
      pdfViews: {
        emergencySheet: { include: true, priority: 50, label: 'Conditions' },
      },
    },
    {
      name: 'advanceDirective',
      label: 'Advance Directive Location',
      type: 'text',
      placeholder: 'Location of advance directive document',
      colSpan: 1,
      pdfViews: {
        emergencySheet: {
          include: true,
          priority: 70,
          label: 'Advance Directive',
        },
      },
    },
    {
      name: 'organDonor',
      label: 'Organ Donor',
      type: 'checkbox',
      colSpan: 1,
      pdfSkipIfEmpty: true,
      pdfViews: {
        emergencySheet: {
          include: true,
          priority: 60,
          label: 'Organ Donor',
          format: (value) => (value === true ? 'Yes' : ''),
        },
      },
    },
    {
      name: 'documentFiles',
      label: 'Medical documents (advance directive, DNR, healthcare proxy, medical history)',
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
      pdfSkipIfEmpty: true,
      pdfViews: {
        // Wallet card extracts blood-type from the free-text notes via regex.
        // Returns empty when no match — pdfSkipIfEmpty + the helper's empty-
        // string normalization filters it out.
        walletCard: {
          include: true,
          priority: 10,
          label: 'Blood',
          format: (value) => {
            const m = String(value ?? '').match(
              /blood\s*type\s*:?\s*([ABO]B?[+-]?)/i,
            )
            return m?.[1] ?? ''
          },
        },
      },
    },
  ],
}

