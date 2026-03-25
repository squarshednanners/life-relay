import type { FormSectionSchema } from '@/models/FormSchema'

export const digitalAssetsSchema: FormSectionSchema = {
  sectionKey: 'digitalAssets',
  title: 'Digital Assets',
  description: 'Online accounts, social media, and digital services (non-crypto)',
  isArray: true,
  arrayItemLabel: (index, item) => item.platform || `Digital Asset ${index + 1}`,
  pdfGroup: 'Digital & Crypto Assets',
  fields: [
    {
      name: 'platform',
      label: 'Platform',
      type: 'text',
      placeholder: 'Facebook, Twitter, Gmail, etc.',
      colSpan: 1,
    },
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Username',
      colSpan: 1,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'email@example.com',
      colSpan: 1,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Account password',
      colSpan: 1,
      manualEntry: true,
    },
    {
      name: 'passwordHint',
      label: 'Password Hint',
      type: 'text',
      placeholder: 'Password hint or location',
      colSpan: 1,
    },
    {
      name: 'recoveryEmail',
      label: 'Recovery Email',
      type: 'email',
      placeholder: 'Recovery email address',
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

