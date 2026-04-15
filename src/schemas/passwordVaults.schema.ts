/**
 * Example: Password Vaults Form Schema with Manual Entry Support
 * 
 * This demonstrates how to define a form schema with manual entry flags
 * for sensitive fields like passwords and secret keys.
 */

import type { FormSectionSchema } from '@/models/FormSchema'

export const passwordVaultsSchema: FormSectionSchema = {
  sectionKey: 'passwordVaults',
  title: 'Password Vaults',
  description: 'Password manager access information including 1Password, Vaultwarden, Bitwarden, and others',
  isArray: true,
  arrayItemLabel: (index, item) => {
    const name = item.vaultName || `Vault ${index + 1}`
    const type = item.vaultType ? ` (${item.vaultType})` : ''
    return name + type
  },
  pdfGroup: 'Security & Access',
  fields: [
    {
      name: 'vaultName',
      label: 'Vault Name',
      type: 'text',
      placeholder: 'e.g., Personal Vault, Work Vault',
      colSpan: 1,
    },
    {
      name: 'vaultType',
      label: 'Vault Type',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select type', value: '' },
        { label: '1Password', value: '1Password' },
        { label: 'Vaultwarden', value: 'Vaultwarden' },
        { label: 'Bitwarden', value: 'Bitwarden' },
        { label: 'LastPass', value: 'LastPass' },
        { label: 'Dashlane', value: 'Dashlane' },
        { label: 'KeePass', value: 'KeePass' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'accessUrl',
      label: 'Access URL',
      type: 'text',
      placeholder: 'https://vault.example.com or https://vault.bitwarden.com',
      colSpan: 2,
      fullWidth: true,
      // Always visible - useful for any vault type with custom URL
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'email@example.com',
      colSpan: 1,
    },
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Username (if different from email)',
      colSpan: 1,
    },
    {
      name: 'secretKey',
      label: '1Password Secret Key',
      type: 'password',
      placeholder: 'A3-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true, // Enable manual entry checkbox
      visible: {
        field: 'vaultType',
        operator: 'equals',
        value: '1Password',
      },
      helpText: 'Optional: Your 1Password secret key',
    },
    {
      name: 'masterPassword',
      label: 'Master Password',
      type: 'password',
      placeholder: 'Master password',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true, // Enable manual entry checkbox
    },
    {
      name: 'recoveryEmail',
      label: 'Recovery Email',
      type: 'email',
      placeholder: 'Recovery email address',
      colSpan: 1,
    },
    {
      name: 'twoFactorAuth',
      label: 'Two-Factor Authentication',
      type: 'text',
      placeholder: '2FA method or recovery codes location',
      colSpan: 1,
    },
    {
      name: 'recoveryInstructions',
      label: 'Recovery Instructions',
      type: 'textarea',
      placeholder: 'Instructions for account recovery',
      colSpan: 2,
      fullWidth: true,
      rows: 3,
    },

    // ===== Heir / Emergency Access =====
    {
      sectionDivider: {
        label: 'Heir / Emergency Access',
        collapsible: true,
      },
    },
    {
      name: 'emergencyAccessSetup',
      label: 'Emergency / Legacy Contact Setup',
      type: 'textarea',
      placeholder: 'e.g. 1Password Emergency Kit shared with Jane Doe; Bitwarden Emergency Access set up for jane@example.com with 7-day wait period',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
      helpText: 'Most password managers support an emergency contact who can request access after a wait period — document who is set up here',
    },
    {
      name: 'vaultBackupLocation',
      label: 'Vault Backup Location',
      type: 'textarea',
      placeholder: 'e.g. Encrypted backup on USB drive in home safe; Vaultwarden DB backed up nightly to NAS at /backups/vault/',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
      helpText: 'Especially important for self-hosted vaults — if the server dies, where are the backups?',
    },
    {
      name: 'emergencyKitLocation',
      label: 'Emergency Kit / Recovery Code Location',
      type: 'text',
      placeholder: 'e.g. Printed Emergency Kit in home safe',
      colSpan: 2,
      fullWidth: true,
      helpText: '1Password Emergency Kit, Bitwarden recovery code, etc.',
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

