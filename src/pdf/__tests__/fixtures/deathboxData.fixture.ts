/**
 * Canonical DeathboxData fixture for the bespoke-PDF golden-fixture tests.
 *
 * Used by emergencySheet, walletCardPdf, attorneyPrepPdf, and runbookPdf tests
 * to lock in schema-driven output. Sections + fields here mirror what the
 * `pdfViews` tags on the real schemas consume — adding a new field to a
 * schema with a `pdfViews` tag should produce a snapshot diff in the test
 * whose view it joined.
 */
import type { DeathboxData } from '@/models/DeathboxData'

/**
 * Returns a fresh copy of the fixture (deep-cloned) so tests can mutate freely
 * without polluting siblings.
 */
export function buildFixture(): DeathboxData {
  return JSON.parse(JSON.stringify(FIXTURE)) as DeathboxData
}

const FIXTURE: DeathboxData = {
  schemaVersion: 1,
  updatedAt: '2026-05-12T12:00:00.000Z',

  people: [
    {
      id: 'person-1',
      name: 'Eleanor Vance',
      dateOfBirth: '1958-04-12',
      ssn: '123-45-6789',
      ssnManualEntry: false,
      phone: '(555) 010-2030',
      email: 'eleanor@example.com',
      address: '142 Maple Lane, Springfield, IL 62701',
      notes: '',
    },
    {
      id: 'person-2',
      name: 'Thomas Vance',
      dateOfBirth: '1960-09-03',
      phone: '(555) 020-4050',
      email: 'thomas@example.com',
      address: '142 Maple Lane, Springfield, IL 62701',
      notes: '',
    },
  ],

  importantContacts: [
    {
      name: 'Margaret Hill',
      role: 'Executor',
      organization: 'Hill & Associates',
      phone: '(555) 110-2200',
      email: 'margaret@hillassoc.com',
      address: '500 Oak St, Springfield, IL',
      notes: '',
    },
    {
      name: 'David Chen',
      role: 'Attorney',
      organization: 'Chen Legal',
      phone: '(555) 220-3300',
      email: 'david@chenlegal.com',
      address: '700 Elm St, Springfield, IL',
      notes: 'Estate attorney for 12 years.',
    },
    {
      name: 'Dr. Anil Patel',
      role: 'Doctor',
      organization: 'Springfield Family Practice',
      phone: '(555) 330-4400',
      email: 'apatel@springfieldfp.com',
      notes: '',
    },
    {
      name: 'Susan Kim',
      role: 'Accountant / CPA',
      organization: 'Kim CPA',
      phone: '(555) 440-5500',
      email: 'susan@kimcpa.com',
      notes: '',
    },
  ],

  healthInsurance: [
    {
      provider: 'BlueCross BlueShield',
      planType: 'PPO',
      policyNumber: 'BCBS-998877',
      groupNumber: 'GRP-44210',
      contactPhone: '(800) 555-1212',
      coveredMembers: 'Eleanor, Thomas',
    },
  ],

  medicalInfo: [
    {
      personId: 'person-1',
      primaryPhysician: 'Dr. Anil Patel',
      physicianPhone: '(555) 330-4400',
      allergies: 'Penicillin, shellfish',
      medications: 'Lisinopril 10mg daily; Atorvastatin 20mg nightly',
      medicalConditions: 'Hypertension, mild osteoarthritis',
      advanceDirective: 'Top drawer of bedroom dresser',
      organDonor: true,
      notes: 'Blood Type: A+',
    },
  ],

  physicalStorageLocations: [
    {
      id: 'storage-1',
      name: 'Home Safe',
      location: 'Master bedroom closet, top shelf',
      accessInstructions: 'Combination in sealed envelope at attorney',
      contents: 'Original will, deed, passports',
    },
  ],

  cryptoAssets: [
    {
      assetName: 'Bitcoin cold storage',
      storageType: 'single-sig',
      exchange: '',
      walletAddress: '',
      singleKey: [
        {
          id: 'key-1',
          keyType: 'seed-phrase',
          provider: 'Self-custody',
        },
      ],
    },
  ],

  legalDocuments: {
    willLocation: 'Home Safe (see Physical Storage)',
    willDate: '2024-03-15',
    willAttorney: 'David Chen, Chen Legal',
    poaLocation: 'Home Safe',
    poaAgent: 'Thomas Vance',
    advanceDirectiveLocation: 'Top drawer of bedroom dresser',
    livingWillLocation: 'Top drawer of bedroom dresser',
  },

  beneficiaries: [
    {
      id: 'beneficiary-1',
      name: 'Thomas Vance',
      relationship: 'Spouse',
      type: 'primary',
      percentage: 100,
      phone: '(555) 020-4050',
      email: 'thomas@example.com',
      address: '142 Maple Lane, Springfield, IL 62701',
      notes: '',
    },
    {
      id: 'beneficiary-2',
      name: 'Hannah Vance',
      relationship: 'Daughter',
      type: 'secondary',
      percentage: 50,
      dateOfBirth: '2018-06-01',
      phone: '',
      email: '',
      address: '',
      notes: '',
    },
  ],

  trusts: [
    {
      id: 'trust-1',
      trustName: 'Vance Family Living Trust',
      trustType: 'Revocable',
      trustee: 'Eleanor Vance',
      successorTrustee: 'Thomas Vance',
      dateCreated: '2024-03-15',
    },
  ],

  lifeInsurance: {
    policies: [
      {
        provider: 'Northwestern Mutual',
        policyNumber: 'NWM-44521',
        amount: '$500,000',
        beneficiaries: [{ beneficiaryId: 'beneficiary-1', percentage: 100 }],
      },
    ],
  },

  financialAccounts: [
    {
      accountType: 'Checking',
      institution: 'First National Bank',
      accountNumberLast4: '4421',
      balance: '$12,400',
    },
  ],

  retirementAccounts: [
    {
      accountType: '401(k)',
      institution: 'Fidelity',
      accountNumberLast4: '8830',
      balance: '$420,000',
      beneficiaries: [{ beneficiaryId: 'beneficiary-1', percentage: 100 }],
    },
  ],

  debts: [
    {
      creditor: 'Wells Fargo Mortgage',
      type: 'Mortgage',
      balance: '$180,000',
      monthlyPayment: '$1,420',
    },
  ],

  businessOwnership: [
    {
      businessName: 'Vance Consulting LLC',
      ownershipPercentage: '100%',
      entityType: 'LLC',
      successorPlan: 'Dissolve and distribute assets per will',
    },
  ],

  property: [
    {
      address: '142 Maple Lane, Springfield, IL 62701',
      propertyType: 'Primary residence',
      titledTo: 'Eleanor Vance',
      estimatedValue: '$385,000',
    },
  ],

  vehicles: [
    {
      year: '2021',
      make: 'Toyota',
      model: 'Camry',
      titledTo: 'Eleanor Vance',
    },
  ],

  creditCards: [
    {
      issuer: 'Chase',
      cardNetwork: 'Visa',
      accountNumberLast4: '1234',
    },
  ],
}
