/**
 * Authenticator Apps Form Schema
 */

import type { FormSectionSchema } from '@/models/FormSchema'

export const authenticatorAppsSchema: FormSectionSchema = {
  sectionKey: 'authenticatorApps',
  title: 'Authenticator Apps',
  description: 'Two-factor authentication app information including backup codes and recovery keys',
  isArray: true,
  arrayItemLabel: (index, item) => item.appName || `Authenticator App ${index + 1}`,
  pdfGroup: 'Security & Access',
  fields: [
    {
      name: 'appName',
      label: 'App Name',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select app', value: '' },
        { label: 'Google Authenticator', value: 'Google Authenticator' },
        { label: 'Authy', value: 'Authy' },
        { label: 'Microsoft Authenticator', value: 'Microsoft Authenticator' },
        { label: '1Password', value: '1Password' },
        { label: 'LastPass Authenticator', value: 'LastPass Authenticator' },
        { label: 'Duo Mobile', value: 'Duo Mobile' },
        { label: 'YubiKey', value: 'YubiKey' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'deviceName',
      label: 'Device Name',
      type: 'text',
      placeholder: 'e.g., iPhone 14, Work Laptop',
      colSpan: 1,
    },
    {
      name: 'accountEmail',
      label: 'Associated Account Email',
      type: 'email',
      placeholder: 'email@example.com',
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'backupCodes',
      label: 'Backup Codes Location',
      type: 'text',
      placeholder: 'Location of backup codes (password manager, safe, etc.)',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true,
    },
    {
      name: 'recoveryKey',
      label: 'Recovery Key',
      type: 'password',
      placeholder: 'Recovery key if applicable',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true,
    },
    {
      name: 'cloudBackup',
      label: 'Cloud Backup',
      type: 'checkbox',
      colSpan: 1,
    },
    {
      name: 'cloudBackupLocation',
      label: 'Cloud Backup Location',
      type: 'text',
      placeholder: 'Where cloud backup is stored',
      colSpan: 1,
      visible: {
        field: 'cloudBackup',
        operator: 'equals',
        value: true,
      },
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

