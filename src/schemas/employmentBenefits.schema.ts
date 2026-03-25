import type { FormSectionSchema } from '@/models/FormSchema'

export const employmentBenefitsSchema: FormSectionSchema = {
  sectionKey: 'employmentBenefits',
  title: 'Employment Benefits',
  description: 'Employee benefits, insurance, and employer information for each person',
  isArray: true,
  arrayItemLabel: (index) => `Employment ${index + 1}`, // Will be enhanced with person name in view
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
      name: 'employer',
      label: 'Employer',
      type: 'text',
      placeholder: 'Company Name',
      colSpan: 1,
    },
    {
      name: 'employeeId',
      label: 'Employee ID',
      type: 'text',
      placeholder: 'Employee ID Number',
      colSpan: 1,
    },
    {
      name: 'benefits',
      label: 'Benefits',
      type: 'textarea',
      placeholder: 'List employee benefits (health insurance, life insurance, 401k, etc.)',
      colSpan: 2,
      fullWidth: true,
      rows: 4,
    },
    {
      name: 'contactInfo',
      label: 'Contact Information',
      type: 'textarea',
      placeholder: 'HR contact information',
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
      rows: 3,
    },
  ],
}

