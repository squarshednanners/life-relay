import type { FormSectionSchema } from '@/models/FormSchema'

export const vehiclesSchema: FormSectionSchema = {
  sectionKey: 'vehicles',
  title: 'Vehicles',
  description: 'Cars, trucks, boats, motorcycles, and other vehicles',
  isArray: true,
  arrayItemLabel: (_, item) => {
    const parts = [item?.year, item?.make, item?.model].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : 'Vehicle'
  },
  pdfGroup: 'Property & Household',
  fields: [
    {
      name: 'make',
      label: 'Make',
      type: 'text',
      placeholder: 'Toyota, Ford, etc.',
      colSpan: 1,
    },
    {
      name: 'model',
      label: 'Model',
      type: 'text',
      placeholder: 'Camry, F-150, etc.',
      colSpan: 1,
    },
    {
      name: 'year',
      label: 'Year',
      type: 'text',
      placeholder: '2020',
      colSpan: 1,
    },
    {
      name: 'vin',
      label: 'VIN',
      type: 'text',
      placeholder: 'Vehicle Identification Number',
      colSpan: 1,
    },
    {
      name: 'licensePlate',
      label: 'License Plate',
      type: 'text',
      placeholder: 'License Plate Number',
      colSpan: 1,
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      placeholder: 'Where vehicle is stored',
      colSpan: 1,
    },
    {
      name: 'keyLocation',
      label: 'Key / Fob Location',
      type: 'text',
      placeholder: 'e.g. Hook by garage door, spare in home safe',
      colSpan: 2,
      fullWidth: true,
      helpText: 'Where are the keys, fobs, and any spare keys?',
    },

    // ===== Title & Registration =====
    {
      sectionDivider: {
        label: 'Title & Registration',
        collapsible: true,
      },
    },
    {
      name: 'titleLocation',
      label: 'Title Location',
      type: 'text',
      placeholder: 'Where the title is stored',
      colSpan: 1,
    },
    {
      name: 'titleNumber',
      label: 'Title Number',
      type: 'text',
      placeholder: 'Title number',
      colSpan: 1,
    },
    {
      name: 'registrationLocation',
      label: 'Registration Location',
      type: 'text',
      placeholder: 'Where registration is stored',
      colSpan: 1,
    },
    {
      name: 'registrationNumber',
      label: 'Registration Number',
      type: 'text',
      placeholder: 'Registration number',
      colSpan: 1,
    },

    // ===== Loan / Lien =====
    {
      sectionDivider: {
        label: 'Loan / Lien',
        collapsible: true,
        defaultExpanded: false,
      },
    },
    {
      name: 'lienholder',
      label: 'Lienholder',
      type: 'text',
      placeholder: 'Lender holding the loan (if any)',
      colSpan: 1,
    },
    {
      name: 'lienholderPhone',
      label: 'Lienholder Phone',
      type: 'tel',
      placeholder: '(800) 555-0100',
      colSpan: 1,
      helpText: 'Needed to get a payoff quote or release the lien',
    },
    {
      name: 'loanAccountNumber',
      label: 'Loan Account Number',
      type: 'text',
      placeholder: 'Loan account #',
      colSpan: 2,
      fullWidth: true,
    },

    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Insurance reference, mechanical issues, scheduled maintenance, anything else useful',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}

