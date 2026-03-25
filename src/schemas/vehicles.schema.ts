import type { FormSectionSchema } from '@/models/FormSchema'

export const vehiclesSchema: FormSectionSchema = {
  sectionKey: 'vehicles',
  title: 'Vehicles',
  description: 'Cars, trucks, boats, motorcycles, and other vehicles',
  isArray: true,
  arrayItemLabel: (index) => `Vehicle ${index + 1}`,
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
      sectionDivider: {
        label: 'Title & Registration',
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
      name: 'lienholder',
      label: 'Lienholder',
      type: 'text',
      placeholder: 'Lienholder (if any)',
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

