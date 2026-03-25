import type { FormSectionSchema } from '@/models/FormSchema'

export const utilitiesSchema: FormSectionSchema = {
  sectionKey: 'utilities',
  title: 'Utilities & Subscriptions',
  description: 'Utility accounts, subscriptions, memberships, and recurring services that may need to be cancelled or transferred',
  isArray: true,
  arrayItemLabel: (index, item) => {
    const service = item.service || ''
    const provider = item.provider || ''
    if (service && provider) return `${service} - ${provider}`
    return service || provider || `Service ${index + 1}`
  },
  pdfGroup: 'Property & Household',
  fields: [
    {
      name: 'service',
      label: 'Service',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select service type', value: '' },
        { label: 'Electric', value: 'Electric' },
        { label: 'Gas', value: 'Gas' },
        { label: 'Water / Sewer', value: 'Water / Sewer' },
        { label: 'Trash / Recycling', value: 'Trash / Recycling' },
        { label: 'Internet', value: 'Internet' },
        { label: 'Phone / Mobile', value: 'Phone / Mobile' },
        { label: 'Cable / Satellite TV', value: 'Cable / Satellite TV' },
        { label: 'Streaming Service', value: 'Streaming Service' },
        { label: 'Software Subscription', value: 'Software Subscription' },
        { label: 'Gym / Fitness', value: 'Gym / Fitness' },
        { label: 'Club / Membership', value: 'Club / Membership' },
        { label: 'Lawn Care / Landscaping', value: 'Lawn Care / Landscaping' },
        { label: 'Pest Control', value: 'Pest Control' },
        { label: 'Pool Maintenance', value: 'Pool Maintenance' },
        { label: 'Cleaning Service', value: 'Cleaning Service' },
        { label: 'HVAC Maintenance', value: 'HVAC Maintenance' },
        { label: 'Security / Alarm', value: 'Security / Alarm' },
        { label: 'HOA', value: 'HOA' },
        { label: 'Storage Unit', value: 'Storage Unit' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'provider',
      label: 'Provider',
      type: 'text',
      placeholder: 'Provider or company name',
      colSpan: 1,
    },
    {
      name: 'accountNumber',
      label: 'Account Number',
      type: 'text',
      placeholder: 'Account #',
      colSpan: 1,
    },
    {
      name: 'contactPhone',
      label: 'Contact Phone',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
    },
    {
      name: 'monthlyCost',
      label: 'Monthly Cost',
      type: 'currency',
      placeholder: '0.00',
      colSpan: 1,
    },
    {
      name: 'billingFrequency',
      label: 'Billing Frequency',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select frequency', value: '' },
        { label: 'Monthly', value: 'Monthly' },
        { label: 'Quarterly', value: 'Quarterly' },
        { label: 'Annually', value: 'Annually' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Cancellation instructions, login info, etc.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}
