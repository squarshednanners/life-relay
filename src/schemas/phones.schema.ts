/**
 * Phones Form Schema
 */

import type { FormSectionSchema } from '@/models/FormSchema'

export const phonesSchema: FormSectionSchema = {
  sectionKey: 'phones',
  title: 'Phones',
  description: 'Phone access information including PINs, passcodes, cloud accounts, and recovery information',
  isArray: true,
  arrayItemLabel: (index, item) => item.phoneName || `Phone ${index + 1}`,
  pdfGroup: 'Security & Access',
  fields: [
    {
      name: 'phoneName',
      label: 'Phone Name/Model',
      type: 'text',
      placeholder: 'e.g., iPhone 14 Pro, Samsung Galaxy S23',
      colSpan: 1,
    },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      type: 'tel',
      placeholder: '(555) 123-4567',
      colSpan: 1,
    },
    {
      name: 'carrier',
      label: 'Carrier',
      type: 'text',
      placeholder: 'e.g., Verizon, AT&T, T-Mobile',
      colSpan: 1,
    },
    {
      name: 'imei',
      label: 'IMEI',
      type: 'text',
      placeholder: 'IMEI number',
      colSpan: 1,
    },
    // Carrier Account Section
    {
      sectionDivider: {
        label: 'Carrier Account (for cancellation / changes)',
        collapsible: true,
        defaultExpanded: false,
      },
    },
    {
      name: 'carrierAccountNumber',
      label: 'Carrier Account Number',
      type: 'text',
      placeholder: 'Account number on carrier statement',
      colSpan: 1,
      helpText: 'Different from your phone number — needed when calling the carrier',
    },
    {
      name: 'carrierAccountPin',
      label: 'Carrier Account PIN / Security Code',
      type: 'password',
      placeholder: 'PIN to authorize changes with the carrier',
      colSpan: 1,
      manualEntry: true,
      helpText: 'Required by most carriers to cancel a line or transfer ownership',
    },
    // Unlock Information Section
    {
      name: '_unlockSection',
      label: '',
      type: 'text',
      sectionDivider: {
        label: 'Unlock Information',
        showBorder: true,
        collapsible: true,
      },
      colSpan: 2,
      fullWidth: true,
      pdfSkipIfEmpty: true,
    },
    {
      name: 'pin',
      label: 'PIN',
      type: 'password',
      placeholder: 'Phone PIN',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true,
    },
    {
      name: 'passcode',
      label: 'Passcode',
      type: 'password',
      placeholder: 'Phone passcode',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true,
    },
    {
      name: 'biometricUnlock',
      label: 'Biometric Unlock',
      type: 'text',
      placeholder: 'Fingerprint, Face ID, etc.',
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'simPin',
      label: 'SIM PIN',
      type: 'password',
      placeholder: 'SIM card PIN',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true,
    },
    // Device Backup & Linked Account
    {
      sectionDivider: {
        label: 'Backup & Linked Account',
        collapsible: true,
      },
    },
    {
      name: 'encryptionPassword',
      label: 'Device Encryption Password',
      type: 'password',
      placeholder: 'Full-disk encryption password (if separate from passcode)',
      colSpan: 2,
      fullWidth: true,
      manualEntry: true,
    },
    {
      name: 'backupLocation',
      label: 'Backup Location',
      type: 'text',
      placeholder: 'e.g. iCloud, Google One, local computer at /backups/iphone/',
      colSpan: 2,
      fullWidth: true,
    },
    {
      name: 'linkedCloudAccount',
      label: 'Linked Cloud Account',
      type: 'text',
      placeholder: 'e.g. john.doe@icloud.com — see Digital Assets for full details',
      colSpan: 2,
      fullWidth: true,
      helpText: 'The Apple ID / Google Account / Samsung Account this device is signed into. Document credentials, recovery options, and legacy contacts in the Digital Assets section.',
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

