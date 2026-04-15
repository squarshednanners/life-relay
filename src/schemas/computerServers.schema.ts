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

    // ===== Physical Access =====
    {
      sectionDivider: {
        label: 'Physical Access',
        collapsible: true,
      },
    },
    {
      name: 'physicalLocation',
      label: 'Physical Location',
      type: 'text',
      placeholder: 'e.g. Home office desk, basement rack, closet shelf',
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'powerOnInstructions',
      label: 'How to Power On / Boot',
      type: 'textarea',
      placeholder: 'e.g. Press front power button. Server boots automatically — wait 2 minutes before accessing UI. UPS battery in cabinet below.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
      helpText: 'Especially important for headless servers, custom builds, or unusual hardware',
    },

    // ===== Backup & Remote Access =====
    {
      sectionDivider: {
        label: 'Backup & Remote Access',
        collapsible: true,
      },
    },
    {
      name: 'backupLocation',
      label: 'Backup Location',
      type: 'textarea',
      placeholder: 'e.g. Time Machine to NAS at 192.168.1.50, daily snapshot to Backblaze B2 (account in Digital Assets), critical files synced to iCloud',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
    {
      name: 'remoteAccess',
      label: 'Remote Access Setup',
      type: 'textarea',
      placeholder: 'e.g. Tailscale (login via Google account), TeamViewer ID 123-456-789, SSH on port 22 from local network only',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
      helpText: 'How an heir or trusted person could access this remotely if needed',
    },

    // ===== What To Do With It =====
    {
      sectionDivider: {
        label: 'What To Do With It',
        collapsible: true,
      },
    },
    {
      name: 'importantData',
      label: 'Important Data to Preserve',
      type: 'textarea',
      placeholder: 'e.g. Family photos in /Users/john/Pictures (back up before wiping). Tax records in /Documents/Taxes. Crypto wallet files in /home/john/.bitcoin (DO NOT DELETE — see Crypto Assets).',
      colSpan: 2,
      fullWidth: true,
      rows: 3,
    },
    {
      name: 'sensitiveData',
      label: 'Sensitive Data to Wipe',
      type: 'textarea',
      placeholder: 'e.g. Browser saved passwords, work files under NDA, medical records folder. Use full-disk wipe before disposing.',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
    {
      name: 'finalAction',
      label: 'Preferred Final Action',
      type: 'select',
      colSpan: 2,
      fullWidth: true,
      options: [
        { label: '', value: '' },
        { label: 'Keep — heir continues using it', value: 'keep' },
        { label: 'Sell after wiping', value: 'sell' },
        { label: 'Donate after wiping', value: 'donate' },
        { label: 'Wipe and recycle', value: 'recycle' },
        { label: 'Securely destroy (physical destruction of drives)', value: 'destroy' },
      ],
    },

    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Anything else useful',
      colSpan: 2,
      fullWidth: true,
      rows: 2,
    },
  ],
}

