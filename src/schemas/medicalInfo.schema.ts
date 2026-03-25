import type { FormSectionSchema } from '@/models/FormSchema'

export const medicalInfoSchema: FormSectionSchema = {
  sectionKey: 'medicalInfo',
  title: 'Medical Information',
  description: 'Medical history, medications, and advance directives for each person',
  isArray: true,
  arrayItemLabel: (index) => `Medical Info ${index + 1}`, // Will be enhanced with person name in view
  pdfGroup: 'Insurance, Medical & Benefits',
  fields: [
    {
      name: 'personId',
      label: 'Person',
      type: 'custom', // Will need a PersonSelector component
      component: 'PersonSelector',
      colSpan: 1,
    },
    {
      name: 'primaryPhysician',
      label: 'Primary Physician',
      type: 'text',
      placeholder: 'Dr. John Smith',
      colSpan: 1,
    },
    {
      name: 'physicianPhone',
      label: 'Physician Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
    },
    {
      name: 'allergies',
      label: 'Allergies',
      type: 'textarea',
      placeholder: 'List any known allergies',
      colSpan: 2,
      fullWidth: true,
      rows: 3,
    },
    {
      name: 'medications',
      label: 'Current Medications',
      type: 'textarea',
      placeholder: 'List current medications and dosages',
      colSpan: 2,
      fullWidth: true,
      rows: 4,
    },
    {
      name: 'medicalConditions',
      label: 'Medical Conditions',
      type: 'textarea',
      placeholder: 'List any chronic or significant medical conditions',
      colSpan: 2,
      fullWidth: true,
      rows: 4,
    },
    {
      name: 'advanceDirective',
      label: 'Advance Directive Location',
      type: 'text',
      placeholder: 'Location of advance directive document',
      colSpan: 1,
    },
    {
      name: 'organDonor',
      label: 'Organ Donor',
      type: 'checkbox',
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

