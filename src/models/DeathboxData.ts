/**
 * DeathboxData - Main data structure
 *
 * This interface defines the known sections, but also allows for dynamic
 * properties via index signature. This means:
 * 1. Schema-driven forms can add fields without updating this interface
 * 2. The data structure is flexible and extensible
 * 3. Type safety is maintained for known sections
 */
export interface DeathboxData {
  schemaVersion?: number // Data schema version (current: 1)

  // People & Contacts
  people?: Person[]
  beneficiaries?: Beneficiary[]
  importantContacts?: Contact[]

  // Security & Access
  passwordVaults?: PasswordVault[]
  computerServers?: ComputerServer[]
  phones?: Phone[]
  authenticatorApps?: AuthenticatorApp[]

  // Insurance, Medical & Benefits
  lifeInsurance?: LifeInsurance
  healthInsurance?: HealthInsurance[]
  medicalInfo?: MedicalInfo[]
  employmentBenefits?: EmploymentBenefits[]

  // Finances
  financialAccounts?: FinancialAccount[] | Record<string, any>[]
  creditCards?: CreditCard[]
  debts?: Debt[]
  incomeSources?: IncomeSource[]
  retirementAccounts?: RetirementAccount[]

  // Digital & Crypto Assets
  digitalAssets?: DigitalAsset[]
  cryptoAssets?: CryptoAsset[]

  // Property & Household
  property?: Property[]
  vehicles?: Vehicle[]
  businessOwnership?: BusinessOwnership[]
  utilities?: Utility[]

  // Documents & Storage
  legalDocuments?: LegalDocuments
  trusts?: Trust[]
  physicalStorageLocations?: PhysicalStorageLocation[]
  assetDocuments?: AssetDocument[]

  // Final Wishes
  letterOfInstruction?: LetterOfInstruction
  finalWishesAndServices?: FinalWishesAndServices[]
  petCare?: PetCare
  photosAndMedia?: PhotosAndMedia
  notes?: string

  // Progress tracking
  skippedSections?: string[] // Section paths marked as "not applicable" / skipped
  lastReviewedAt?: string // ISO date of last vault review

  // UI state (persisted with the vault so it travels with backups)
  collapsedSections?: Record<string, boolean> // key: "schemaKey.dividerLabel" -> isCollapsed

  updatedAt: string
  // Index signature allows any additional properties defined by schemas
  [key: string]: any
}

export interface Person {
  id: string
  [key: string]: any
}

export interface Beneficiary {
  id: string
  type: 'primary' | 'secondary'
  [key: string]: any
}

export interface BeneficiaryAssignment {
  beneficiaryId?: string
  customName?: string
  percentage?: number
}

export interface TrustAssignment {
  trustId?: string
  customName?: string
  percentage?: number
  role?: 'owner' | 'beneficiary'
}

export interface LifeInsurance {
  policies?: LifeInsurancePolicy[]
}

export interface LifeInsurancePolicy {
  beneficiaries?: BeneficiaryAssignment[]
  [key: string]: any
}

export interface HealthInsurance {
  [key: string]: any
}

export interface MedicalInfo {
  personId: string
  [key: string]: any
}

export interface FinancialAccount {
  [key: string]: any
}

export interface Debt {
  [key: string]: any
}

export interface DigitalAsset {
  [key: string]: any
}

export interface CryptoKey {
  id: string
  keyType?: string
  provider?: string
  providerUrl?: string
  [key: string]: any
}

export interface CryptoAsset {
  storageType?: 'single-sig' | 'multi-sig' | 'exchange'
  singleKey?: CryptoKey[]
  multiSigConfig?: {
    requiredSignatures?: number
    totalKeys?: number
    keys?: CryptoKey[]
  }
  [key: string]: any
}

export interface EmploymentBenefits {
  personId: string
  [key: string]: any
}

export interface RetirementAccount {
  beneficiaries?: BeneficiaryAssignment[]
  [key: string]: any
}

export interface Property {
  [key: string]: any
}

export interface Vehicle {
  [key: string]: any
}

export interface BusinessOwnership {
  [key: string]: any
}

export interface Contact {
  [key: string]: any
}

export interface LegalDocuments {
  [key: string]: any
}

export interface PhysicalStorageLocation {
  id: string
  [key: string]: any
}

export interface FinalWishesAndServices {
  personId?: string
  [key: string]: any
}

export interface PasswordVault {
  [key: string]: any
}

export interface ComputerServer {
  [key: string]: any
}

export interface Phone {
  [key: string]: any
}

export interface AuthenticatorApp {
  [key: string]: any
}

export interface Trust {
  id: string
  beneficiaries?: BeneficiaryAssignment[]
  [key: string]: any
}

export interface CreditCard {
  [key: string]: any
}

export interface IncomeSource {
  [key: string]: any
}

export interface Utility {
  [key: string]: any
}

export interface AssetDocument {
  [key: string]: any
}

export interface PetCare {
  pets?: Pet[]
  [key: string]: any
}

export interface Pet {
  [key: string]: any
}

export interface LetterOfInstruction {
  [key: string]: any
}

export interface PhotosAndMedia {
  [key: string]: any
}
