/**
 * Computer/Servers Form Schema
 */

import type { FormSectionSchema } from '@/models/FormSchema'

export const computerServersSchema: FormSectionSchema = {
  sectionKey: 'computerServers',
  title: 'Computer/Server',
  description: 'Login information for computers, servers, and local services like Umbrel, Start9, NAS devices, etc.',
  isArray: true,
  arrayItemLabel: (index, item) => {
    const name = item.name || `Computer/Server ${index + 1}`
    const type = item.type ? ` (${item.type})` : ''
    return name + type
  },
  pdfGroup: 'Security & Access',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'e.g., Home Desktop, Umbrel Server, Work Laptop',
      colSpan: 1,
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Select type', value: '' },
        { label: 'Desktop', value: 'Desktop' },
        { label: 'Laptop', value: 'Laptop' },
        { label: 'Tablet', value: 'Tablet' },
        { label: 'Server', value: 'Server' },
        { label: 'Umbrel', value: 'Umbrel' },
        { label: 'Start9', value: 'Start9' },
        { label: 'NAS', value: 'NAS' },
        { label: 'Custom', value: 'Custom' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'localUrl',
      label: 'Local URL / Hostname',
      type: 'text',
      placeholder: 'http://umbrel.local, http://192.168.1.100, or computer hostname',
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Login username',
      colSpan: 1,
    },
    {
      name: 'adminEmail',
      label: 'Admin Email',
      type: 'email',
      placeholder: 'admin@example.com (optional)',
      colSpan: 1,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Login password',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true,
    },
    {
      name: 'encryptionPassword',
      label: 'Encryption Password',
      type: 'password',
      placeholder: 'BitLocker, FileVault, LUKS, etc.',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true,
      helpText: 'Full disk encryption password',
    },
    {
      name: 'sshKeyLocation',
      label: 'SSH Key Location',
      type: 'text',
      placeholder: 'Location of SSH key if used',
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'sshKeyPassword',
      label: 'SSH Key Password',
      type: 'password',
      placeholder: 'Password for SSH key if encrypted',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true,
      visible: {
        field: 'sshKeyLocation',
        operator: 'isNotEmpty',
      },
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
      placeholder: 'Instructions for account recovery or access',
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
      rows: 2,
    },
  ],
}

