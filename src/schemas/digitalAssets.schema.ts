import type { FormSectionSchema } from '@/models/FormSchema'

export const digitalAssetsSchema: FormSectionSchema = {
  sectionKey: 'digitalAssets',
  title: 'Digital Assets',
  description: 'Online accounts, cloud services, social media, and digital identity (non-crypto)',
  isArray: true,
  arrayItemLabel: (index, item) => item.platform || `Digital Asset ${index + 1}`,
  pdfGroup: 'Digital & Crypto Assets',
  fields: [
    {
      name: 'platform',
      label: 'Platform',
      type: 'text',
      placeholder: 'Apple ID, Google Account, Facebook, Gmail, etc.',
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
      placeholder: 'e.g. See password manager',
      colSpan: 2,
      fullWidth: true,
    },

    // ===== Recovery & 2FA =====
    {
      sectionDivider: {
        label: 'Recovery & 2FA',
        collapsible: true,
      },
    },
    {
      name: 'recoveryEmail',
      label: 'Recovery Email',
      type: 'email',
      placeholder: 'Recovery email address',
      colSpan: 1,
    },
    {
      name: 'recoveryPhone',
      label: 'Recovery Phone',
      type: 'tel',
      placeholder: 'Recovery phone number',
      colSpan: 1,
    },
    {
      name: 'twoFactorAuth',
      label: 'Two-Factor Authentication',
      type: 'text',
      placeholder: 'e.g. Authy app, hardware key, SMS, recovery codes in password manager',
      colSpan: 2,
      fullWidth: true,
    },

    // ===== Inheritance / Legacy Access =====
    {
      sectionDivider: {
        label: 'Inheritance / Legacy Access',
        collapsible: true,
      },
    },
    {
      name: 'legacyContactInfo',
      label: 'Legacy / Inheritance Contact',
      type: 'textarea',
      placeholder: 'e.g. Apple Legacy Contact: Jane Doe (access key in home safe). Google Inactive Account Manager: notify Jane after 6 months. Facebook Memorialization Contact: Jane Doe.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
      helpText: 'Most major platforms (Apple, Google, Facebook, Instagram) let you designate someone to receive your data after death — document who is set up here',
    },

    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'What this account is for, what should happen to it (memorialize, delete, transfer), anything else useful',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}
