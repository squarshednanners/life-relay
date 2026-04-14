import { computed } from 'vue'
import { useLegacyStore } from '@/store'
import type { DeathboxData } from '@/models/DeathboxData'

export interface SectionInfo {
  name: string
  path: string
  description?: string
}

export interface GroupProgress {
  name: string
  items: SectionInfo[]
  completed: number
  total: number
  percentage: number
}

function hasObjectData(obj: any): boolean {
  if (!obj) return false
  return Object.values(obj).some(value => {
    if (value === null || value === undefined || value === '') return false
    if (typeof value === 'string' && value.trim() === '') return false
    if (Array.isArray(value) && value.length === 0) return false
    if (typeof value === 'object' && Object.keys(value).length === 0) return false
    return true
  })
}

export function hasSectionData(data: DeathboxData | null, path: string): boolean {
  if (!data) return false

  switch (path) {
    case '/people':
      return !!(data.people && data.people.length > 0)
    case '/beneficiaries':
      return !!(data.beneficiaries && data.beneficiaries.length > 0)
    case '/important-contacts':
      return !!(data.importantContacts && data.importantContacts.length > 0)
    case '/password-vaults':
      return !!(data.passwordVaults && data.passwordVaults.length > 0)
    case '/computer-servers':
      return !!(data.computerServers && data.computerServers.length > 0)
    case '/phones':
      return !!(data.phones && data.phones.length > 0)
    case '/authenticator-apps':
      return !!(data.authenticatorApps && data.authenticatorApps.length > 0)
    case '/health-insurance':
      return !!(data.healthInsurance && Array.isArray(data.healthInsurance) && data.healthInsurance.length > 0) || hasObjectData(data.healthInsurance)
    case '/life-insurance':
      return !!(data.lifeInsurance?.policies && data.lifeInsurance.policies.length > 0)
    case '/medical-info':
      return !!(data.medicalInfo && data.medicalInfo.length > 0)
    case '/employment-benefits':
      return !!(data.employmentBenefits && data.employmentBenefits.length > 0)
    case '/other-insurance':
      return !!((data as any).otherInsurance && (data as any).otherInsurance.length > 0)
    case '/financial-accounts':
      return !!(data.financialAccounts && data.financialAccounts.length > 0)
    case '/credit-cards':
      return !!(data.creditCards && data.creditCards.length > 0)
    case '/debts':
      return !!(data.debts && data.debts.length > 0)
    case '/income-sources':
      return !!(data.incomeSources && data.incomeSources.length > 0)
    case '/retirement-accounts':
      return !!(data.retirementAccounts && data.retirementAccounts.length > 0)
    case '/loyalty-programs':
      return !!((data as any).loyaltyPrograms && (data as any).loyaltyPrograms.length > 0)
    case '/tax-info':
      return hasObjectData((data as any).taxInfo)
    case '/digital-assets':
      return !!(data.digitalAssets && data.digitalAssets.length > 0)
    case '/crypto-assets':
      return !!(data.cryptoAssets && data.cryptoAssets.length > 0)
    case '/property':
      return !!(data.property && data.property.length > 0)
    case '/vehicles':
      return !!(data.vehicles && data.vehicles.length > 0)
    case '/business-ownership':
      return !!(data.businessOwnership && data.businessOwnership.length > 0)
    case '/utilities':
      return !!(data.utilities && data.utilities.length > 0)
    case '/legal-documents':
      return hasObjectData(data.legalDocuments)
    case '/trusts':
      return !!(data.trusts && data.trusts.length > 0)
    case '/physical-storage':
      return !!(data.physicalStorageLocations && data.physicalStorageLocations.length > 0)
    case '/asset-documents':
      return !!(data.assetDocuments && data.assetDocuments.length > 0)
    case '/vault-backup':
      return hasObjectData((data as any).vaultBackup)
    case '/pending-legal-matters':
      return !!((data as any).pendingLegalMatters && (data as any).pendingLegalMatters.length > 0)
    case '/letter-of-instruction':
      return hasObjectData(data.letterOfInstruction)
    case '/final-wishes':
      return !!(data.finalWishesAndServices && data.finalWishesAndServices.length > 0)
    case '/pet-care':
      return hasObjectData(data.petCare)
    case '/photos-and-media':
      return hasObjectData(data.photosAndMedia)
    case '/notes':
      return !!(data.notes && data.notes.trim().length > 0)
    default:
      return false
  }
}

export const sectionGroups: { name: string; items: SectionInfo[] }[] = [
  {
    name: 'People & Contacts',
    items: [
      { name: 'People & Personal Info', path: '/people', description: 'Manage people and their personal information' },
      { name: 'Beneficiaries', path: '/beneficiaries', description: 'Manage beneficiaries and percentages' },
      { name: 'Important Contacts', path: '/important-contacts', description: 'Attorneys, advisors, executors, and other key contacts' },
    ],
  },
  {
    name: 'Security & Access',
    items: [
      { name: 'Password Vaults', path: '/password-vaults', description: 'Password manager access information' },
      { name: 'Computers/Servers', path: '/computer-servers', description: 'Computer and server login information' },
      { name: 'Phones', path: '/phones', description: 'Phone access information' },
      { name: 'Authenticator Apps', path: '/authenticator-apps', description: 'Two-factor authentication apps and backup codes' },
    ],
  },
  {
    name: 'Insurance, Medical & Benefits',
    items: [
      { name: 'Health Insurance', path: '/health-insurance', description: 'Health insurance details' },
      { name: 'Life Insurance', path: '/life-insurance', description: 'Life insurance policies' },
      { name: 'Medical Info', path: '/medical-info', description: 'Medical information and directives' },
      { name: 'Employment Benefits', path: '/employment-benefits', description: 'Employee benefits and employer information' },
      { name: 'Other Insurance', path: '/other-insurance', description: 'Homeowner\'s, auto, umbrella, long-term care, disability, and other policies' },
    ],
  },
  {
    name: 'Finances',
    items: [
      { name: 'Financial Accounts', path: '/financial-accounts', description: 'Bank and financial accounts' },
      { name: 'Credit Cards', path: '/credit-cards', description: 'Credit card accounts' },
      { name: 'Debts & Loans', path: '/debts', description: 'Outstanding debts and loans' },
      { name: 'Income Sources', path: '/income-sources', description: 'Pensions, Social Security, and other income' },
      { name: 'Retirement & Investment', path: '/retirement-accounts', description: '401k, IRA, brokerages, and pensions' },
      { name: 'Loyalty & Rewards', path: '/loyalty-programs', description: 'Airline miles, hotel points, and rewards programs' },
      { name: 'Tax Information', path: '/tax-info', description: 'Filing status, EIN, and where tax returns are stored' },
    ],
  },
  {
    name: 'Digital & Crypto Assets',
    items: [
      { name: 'Digital Assets', path: '/digital-assets', description: 'Online accounts and digital assets' },
      { name: 'Crypto Assets', path: '/crypto-assets', description: 'Cryptocurrency and wallets' },
    ],
  },
  {
    name: 'Property & Household',
    items: [
      { name: 'Property & Real Estate', path: '/property', description: 'Real estate holdings' },
      { name: 'Vehicles', path: '/vehicles', description: 'Cars, boats, and vehicles with titles' },
      { name: 'Business Ownership', path: '/business-ownership', description: 'Business interests' },
      { name: 'Utilities & Subscriptions', path: '/utilities', description: 'Utilities, subscriptions, and recurring services' },
    ],
  },
  {
    name: 'Documents & Storage',
    items: [
      { name: 'Legal Documents', path: '/legal-documents', description: 'Wills, POA, advance directives, and their locations' },
      { name: 'Trusts', path: '/trusts', description: 'Trust information, beneficiaries, and trustees' },
      { name: 'Physical Storage', path: '/physical-storage', description: 'Safes, deposit boxes, and other secure storage locations' },
      { name: 'Asset Documents', path: '/asset-documents', description: 'Titles, deeds, certificates, and other asset documents' },
      { name: 'Life Relay Backup', path: '/vault-backup', description: 'Where the digital backup is stored and how to access it' },
      { name: 'Pending Legal Matters', path: '/pending-legal-matters', description: 'Active lawsuits, claims, and disputes' },
    ],
  },
  {
    name: 'Final Wishes',
    items: [
      { name: 'Letter of Instruction', path: '/letter-of-instruction', description: 'Non-legally binding letter with instructions' },
      { name: 'Final Wishes & Services', path: '/final-wishes', description: 'Funeral, burial, memorial, and obituary preferences' },
      { name: 'Pet Care', path: '/pet-care', description: 'Pet information and care instructions' },
      { name: 'Photos & Media', path: '/photos-and-media', description: 'Photo and media storage locations' },
      { name: 'Notes', path: '/notes', description: 'Additional notes' },
    ],
  },
]

export function useSectionProgress() {
  const store = useLegacyStore()

  const skippedSections = computed(() => store.data?.skippedSections ?? [])

  function isSectionSkipped(path: string): boolean {
    return skippedSections.value.includes(path)
  }

  function isSectionComplete(path: string): boolean {
    return hasSectionData(store.data, path) || isSectionSkipped(path)
  }

  async function toggleSkipSection(path: string) {
    const current = store.data?.skippedSections ?? []
    const updated = current.includes(path)
      ? current.filter(p => p !== path)
      : [...current, path]
    await store.updateData({ skippedSections: updated })
  }

  const groupProgress = computed<GroupProgress[]>(() => {
    return sectionGroups.map(group => {
      const completed = group.items.filter(item => isSectionComplete(item.path)).length
      const total = group.items.length
      return {
        ...group,
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    })
  })

  const overallProgress = computed(() => {
    const allSections = sectionGroups.flatMap(g => g.items)
    const completed = allSections.filter(item => isSectionComplete(item.path)).length
    const total = allSections.length
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  })

  const suggestedNextSection = computed(() => {
    for (const group of sectionGroups) {
      for (const item of group.items) {
        if (!isSectionComplete(item.path)) {
          return item
        }
      }
    }
    return null
  })

  return {
    isSectionSkipped,
    isSectionComplete,
    toggleSkipSection,
    groupProgress,
    overallProgress,
    suggestedNextSection,
    sectionGroups,
  }
}
