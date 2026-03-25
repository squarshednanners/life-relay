import type { DeathboxData } from '@/models/DeathboxData'

export interface QuickStartTemplate {
  id: string
  name: string
  description: string
  icon: string
  /** Sections to skip (paths) */
  skippedSections: string[]
  /** Partial data to pre-populate */
  data: Partial<DeathboxData>
}

const basePerson = (name: string = '') => ({
  id: `person-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  name,
})

export const quickStartTemplates: QuickStartTemplate[] = [
  {
    id: 'blank',
    name: 'Start from Scratch',
    description: 'Empty vault — fill in sections at your own pace.',
    icon: '📄',
    skippedSections: [],
    data: {},
  },
  {
    id: 'single-adult',
    name: 'Single Adult',
    description: 'Focused on individual finances, accounts, and personal directives. Skips spouse-related sections.',
    icon: '🧑',
    skippedSections: [
      '/employment-benefits',
    ],
    data: {
      people: [basePerson()],
    },
  },
  {
    id: 'married-couple',
    name: 'Married Couple',
    description: 'Two-person setup with shared finances, beneficiaries, and joint accounts in mind.',
    icon: '👫',
    skippedSections: [],
    data: {
      people: [basePerson(), basePerson()],
    },
  },
  {
    id: 'parent-with-dependents',
    name: 'Parent with Dependents',
    description: 'Includes guardianship considerations, life insurance, and pet care. Pre-creates entries for key sections.',
    icon: '👨‍👧‍👦',
    skippedSections: [],
    data: {
      people: [basePerson(), basePerson(), basePerson()],
    },
  },
  {
    id: 'crypto-holder',
    name: 'Crypto Holder',
    description: 'Focused on cryptocurrency wallets, exchanges, seed phrases, and digital access. Skips property and vehicle sections.',
    icon: '₿',
    skippedSections: [
      '/property',
      '/vehicles',
      '/employment-benefits',
      '/pet-care',
    ],
    data: {
      people: [basePerson()],
    },
  },
  {
    id: 'retiree',
    name: 'Retiree',
    description: 'Emphasizes income sources, medical info, insurance, retirement accounts, and final wishes.',
    icon: '🏖️',
    skippedSections: [
      '/employment-benefits',
      '/crypto-assets',
    ],
    data: {
      people: [basePerson()],
    },
  },
]
