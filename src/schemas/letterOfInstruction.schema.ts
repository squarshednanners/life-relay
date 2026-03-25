import type { FormSectionSchema } from '@/models/FormSchema'

export const letterOfInstructionSchema: FormSectionSchema = {
  sectionKey: 'letterOfInstruction',
  title: 'Letter of Instruction',
  description: 'Personal letter with instructions for family members (not legally binding)',
  isArray: false,
  pdfGroup: 'Final Wishes',
  fields: [
    {
      name: 'content',
      label: 'Letter Content',
      type: 'textarea',
      placeholder: 'Write your letter of instruction here...',
      colSpan: 2,
      fullWidth: true,
      rows: 10,
    },
    {
      name: 'recipients',
      label: 'Recipients',
      type: 'text',
      placeholder: 'Who should receive this letter',
      colSpan: 2,
      fullWidth: true,
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

