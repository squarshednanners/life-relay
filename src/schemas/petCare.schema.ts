import type { FormSectionSchema } from '@/models/FormSchema'

// Per-pet schema (used as nested array inside petCare)
const petItemSchema: FormSectionSchema = {
  sectionKey: 'pet',
  title: 'Pet',
  isArray: true,
  arrayItemLabel: (_, item) => item?.name || 'Pet',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: "Pet's name",
      colSpan: 1,
    },
    {
      name: 'species',
      label: 'Species / Breed',
      type: 'text',
      placeholder: 'e.g. Golden Retriever, DSH cat, Macaw',
      colSpan: 1,
    },
    {
      name: 'birthYear',
      label: 'Birth Year (approx)',
      type: 'text',
      placeholder: 'e.g. 2018',
      colSpan: 1,
    },
    {
      name: 'microchipNumber',
      label: 'Microchip Number',
      type: 'text',
      placeholder: 'Microchip ID',
      colSpan: 1,
      helpText: 'Critical if the pet escapes or needs to be claimed',
    },
    {
      name: 'photoLocation',
      label: 'Photo Location',
      type: 'text',
      placeholder: 'e.g. Recent photos in iCloud "Pets" album',
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'feedingDetails',
      label: 'Feeding',
      type: 'textarea',
      placeholder: 'e.g. 1 cup Brand X kibble morning + evening. No table scraps. Treats limited to training only.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
    {
      name: 'medications',
      label: 'Medications & Dosage',
      type: 'textarea',
      placeholder: 'e.g. Apoquel 16mg daily for allergies. Heartworm preventative monthly (1st of month). Meds stored in kitchen cabinet above fridge.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
    {
      name: 'behaviorNotes',
      label: 'Temperament & Behavior',
      type: 'textarea',
      placeholder: 'e.g. Friendly with kids, anxious around men with hats. Doesn\'t do well with other dogs at the dog park.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}

export const petCareSchema: FormSectionSchema = {
  sectionKey: 'petCare',
  title: 'Pet Care',
  description: 'Information a temporary caretaker or executor would need to care for or rehome your pets',
  isArray: false,
  pdfGroup: 'Final Wishes',
  fields: [
    // ===== Per-Pet Info =====
    {
      name: 'pets',
      label: 'Pets',
      type: 'array',
      arraySchema: petItemSchema,
      colSpan: 2,
      fullWidth: true,
    },

    // ===== Veterinarian & Insurance =====
    {
      sectionDivider: {
        label: 'Veterinarian & Insurance',
        collapsible: true,
      },
    },
    {
      name: 'veterinarian',
      label: 'Veterinarian',
      type: 'text',
      placeholder: 'Vet name or clinic',
      colSpan: 1,
    },
    {
      name: 'vetContact',
      label: 'Veterinarian Contact',
      type: 'text',
      placeholder: 'Phone, address',
      colSpan: 1,
    },
    {
      name: 'emergencyVet',
      label: '24-Hour Emergency Vet',
      type: 'text',
      placeholder: 'Name and phone of after-hours emergency clinic',
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'petInsurance',
      label: 'Pet Insurance',
      type: 'text',
      placeholder: 'Provider, policy number, contact phone',
      colSpan: 2,
      fullWidth: true,
    },

    // ===== Care & Rehoming =====
    {
      sectionDivider: {
        label: 'Care & Rehoming',
        collapsible: true,
      },
    },
    {
      name: 'temporaryCaregiver',
      label: 'Temporary Caregiver',
      type: 'text',
      placeholder: 'Name and contact of someone who can take pets immediately',
      colSpan: 2,
      fullWidth: true,
      helpText: 'Who picks up the pets in the first 24-48 hours?',
    },
    {
      name: 'permanentCaregiver',
      label: 'Preferred Permanent Caregiver',
      type: 'text',
      placeholder: 'Name and contact of person you\'d like to take the pets long-term',
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'rehomingPreference',
      label: 'Rehoming Preference',
      type: 'textarea',
      placeholder: 'e.g. If permanent caregiver can\'t take them, contact Example Breed Rescue at (555) 555-0180. Do NOT surrender to county shelter. Keep siblings together if possible.',
      colSpan: 2,
      fullWidth: true,
      rows: 3,
      helpText: 'Specific rescue org, breed-specific rescue, or absolute "do not" preferences',
    },

    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Anything else useful — pet\'s favorite toys, hiding spots, special routines',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}
