import type { FormSectionSchema } from '@/models/FormSchema'

export const petCareSchema: FormSectionSchema = {
  sectionKey: 'petCare',
  title: 'Pet Care',
  description: 'Information about pets and their care instructions',
  isArray: false,
  pdfGroup: 'Final Wishes',
  fields: [
    {
      sectionDivider: {
        label: 'Veterinarian Information',
      },
    },
    {
      name: 'veterinarian',
      label: 'Veterinarian',
      type: 'text',
      placeholder: 'Veterinarian name or clinic',
      colSpan: 1,
    },
    {
      name: 'vetContact',
      label: 'Veterinarian Contact',
      type: 'text',
      placeholder: 'Phone, address, etc.',
      colSpan: 1,
    },
    {
      name: 'petInsurance',
      label: 'Pet Insurance',
      type: 'text',
      placeholder: 'Pet insurance information',
      colSpan: 2,
      fullWidth: true,
    },
    {
      sectionDivider: {
        label: 'Care Instructions',
      },
    },
    {
      name: 'feedingInstructions',
      label: 'Feeding Instructions',
      type: 'textarea',
      placeholder: 'Feeding schedule and instructions',
      colSpan: 2,
      fullWidth: true,
      rows: 3,
    },
    {
      name: 'medicalNeeds',
      label: 'Medical Needs',
      type: 'textarea',
      placeholder: 'Medical needs and medications',
      colSpan: 2,
      fullWidth: true,
      rows: 3,
    },
    {
      name: 'emergencyContacts',
      label: 'Emergency Contacts',
      type: 'textarea',
      placeholder: 'Emergency contacts for pet care',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
    {
      name: 'rehomingInstructions',
      label: 'Rehoming Instructions',
      type: 'textarea',
      placeholder: 'Instructions for rehoming if needed',
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
    // Note: Pets array will need special handling - it's nested
  ],
}

