import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '@/views/Welcome.vue'
import Dashboard from '@/views/Dashboard.vue'
import Settings from '@/views/Settings.vue'
import Notes from '@/views/Notes.vue'
// Schema-based views
import PeopleSchema from '@/views/PeopleSchema.vue'
import BeneficiariesSchema from '@/views/BeneficiariesSchema.vue'
import ImportantContactsSchema from '@/views/ImportantContactsSchema.vue'
import PasswordVaultsSchema from '@/views/PasswordVaultsSchema.vue'
import ComputerServersSchema from '@/views/ComputerServersSchema.vue'
import PhonesSchema from '@/views/PhonesSchema.vue'
import AuthenticatorAppsSchema from '@/views/AuthenticatorAppsSchema.vue'
import HealthInsuranceSchema from '@/views/HealthInsuranceSchema.vue'
import LifeInsuranceSchema from '@/views/LifeInsuranceSchema.vue'
import MedicalInfoSchema from '@/views/MedicalInfoSchema.vue'
import EmploymentBenefitsSchema from '@/views/EmploymentBenefitsSchema.vue'
import FinancialAccountsSchema from '@/views/FinancialAccountsSchema.vue'
import CreditCardsSchema from '@/views/CreditCardsSchema.vue'
import DebtsSchema from '@/views/DebtsSchema.vue'
import IncomeSourcesSchema from '@/views/IncomeSourcesSchema.vue'
import RetirementAccountsSchema from '@/views/RetirementAccountsSchema.vue'
import DigitalAssetsSchema from '@/views/DigitalAssetsSchema.vue'
import CryptoAssetsSchema from '@/views/CryptoAssetsSchema.vue'
import PropertySchema from '@/views/PropertySchema.vue'
import VehiclesSchema from '@/views/VehiclesSchema.vue'
import BusinessOwnershipSchema from '@/views/BusinessOwnershipSchema.vue'
import UtilitiesSchema from '@/views/UtilitiesSchema.vue'
import LegalDocumentsSchema from '@/views/LegalDocumentsSchema.vue'
import TrustsSchema from '@/views/TrustsSchema.vue'
import PhysicalStorageLocationsSchema from '@/views/PhysicalStorageLocationsSchema.vue'
import AssetDocumentsSchema from '@/views/AssetDocumentsSchema.vue'
import VaultBackupSchema from '@/views/VaultBackupSchema.vue'
import OtherInsuranceSchema from '@/views/OtherInsuranceSchema.vue'
import LoyaltyProgramsSchema from '@/views/LoyaltyProgramsSchema.vue'
import TaxInfoSchema from '@/views/TaxInfoSchema.vue'
import PendingLegalMattersSchema from '@/views/PendingLegalMattersSchema.vue'
import LetterOfInstructionSchema from '@/views/LetterOfInstructionSchema.vue'
import FinalWishesAndServicesSchema from '@/views/FinalWishesAndServicesSchema.vue'
import PetCareSchema from '@/views/PetCareSchema.vue'
import PhotosAndMediaSchema from '@/views/PhotosAndMediaSchema.vue'
import EstatePlanningGuide from '@/views/WillPreparation.vue'
import Runbook from '@/views/Runbook.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: Welcome,
      meta: { title: 'Life Relay — Privacy-First Estate Planning' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { title: 'Dashboard | Life Relay' },
    },

    // People & Contacts
    {
      path: '/people',
      name: 'people',
      component: PeopleSchema,
      meta: { title: 'People & Personal Info | Life Relay' },
    },
    {
      path: '/beneficiaries',
      name: 'beneficiaries',
      component: BeneficiariesSchema,
      meta: { title: 'Beneficiaries | Life Relay' },
    },
    {
      path: '/important-contacts',
      name: 'important-contacts',
      component: ImportantContactsSchema,
      meta: { title: 'Important Contacts | Life Relay' },
    },

    // Security & Access
    {
      path: '/password-vaults',
      name: 'password-vaults',
      component: PasswordVaultsSchema,
      meta: { title: 'Password Vaults | Life Relay' },
    },
    {
      path: '/computer-servers',
      name: 'computer-servers',
      component: ComputerServersSchema,
      meta: { title: 'Computers & Servers | Life Relay' },
    },
    {
      path: '/phones',
      name: 'phones',
      component: PhonesSchema,
      meta: { title: 'Phones | Life Relay' },
    },
    {
      path: '/authenticator-apps',
      name: 'authenticator-apps',
      component: AuthenticatorAppsSchema,
      meta: { title: 'Authenticator Apps | Life Relay' },
    },

    // Insurance, Medical & Benefits
    {
      path: '/health-insurance',
      name: 'health-insurance',
      component: HealthInsuranceSchema,
      meta: { title: 'Health Insurance | Life Relay' },
    },
    {
      path: '/life-insurance',
      name: 'life-insurance',
      component: LifeInsuranceSchema,
      meta: { title: 'Life Insurance | Life Relay' },
    },
    {
      path: '/medical-info',
      name: 'medical-info',
      component: MedicalInfoSchema,
      meta: { title: 'Medical Info | Life Relay' },
    },
    {
      path: '/employment-benefits',
      name: 'employment-benefits',
      component: EmploymentBenefitsSchema,
      meta: { title: 'Employment Benefits | Life Relay' },
    },
    {
      path: '/other-insurance',
      name: 'other-insurance',
      component: OtherInsuranceSchema,
      meta: { title: 'Other Insurance | Life Relay' },
    },

    // Finances
    {
      path: '/financial-accounts',
      name: 'financial-accounts',
      component: FinancialAccountsSchema,
      meta: { title: 'Financial Accounts | Life Relay' },
    },
    {
      path: '/credit-cards',
      name: 'credit-cards',
      component: CreditCardsSchema,
      meta: { title: 'Credit Cards | Life Relay' },
    },
    {
      path: '/debts',
      name: 'debts',
      component: DebtsSchema,
      meta: { title: 'Debts | Life Relay' },
    },
    {
      path: '/income-sources',
      name: 'income-sources',
      component: IncomeSourcesSchema,
      meta: { title: 'Income Sources | Life Relay' },
    },
    {
      path: '/retirement-accounts',
      name: 'retirement-accounts',
      component: RetirementAccountsSchema,
      meta: { title: 'Retirement & Investment Accounts | Life Relay' },
    },
    {
      path: '/loyalty-programs',
      name: 'loyalty-programs',
      component: LoyaltyProgramsSchema,
      meta: { title: 'Loyalty Programs | Life Relay' },
    },
    {
      path: '/tax-info',
      name: 'tax-info',
      component: TaxInfoSchema,
      meta: { title: 'Tax Info | Life Relay' },
    },

    // Digital & Crypto Assets
    {
      path: '/digital-assets',
      name: 'digital-assets',
      component: DigitalAssetsSchema,
      meta: { title: 'Digital Assets | Life Relay' },
    },
    {
      path: '/crypto-assets',
      name: 'crypto-assets',
      component: CryptoAssetsSchema,
      meta: { title: 'Crypto Assets | Life Relay' },
    },

    // Property & Household
    {
      path: '/property',
      name: 'property',
      component: PropertySchema,
      meta: { title: 'Property | Life Relay' },
    },
    {
      path: '/vehicles',
      name: 'vehicles',
      component: VehiclesSchema,
      meta: { title: 'Vehicles | Life Relay' },
    },
    {
      path: '/business-ownership',
      name: 'business-ownership',
      component: BusinessOwnershipSchema,
      meta: { title: 'Business Ownership | Life Relay' },
    },
    {
      path: '/utilities',
      name: 'utilities',
      component: UtilitiesSchema,
      meta: { title: 'Utilities & Subscriptions | Life Relay' },
    },

    // Documents & Storage
    {
      path: '/legal-documents',
      name: 'legal-documents',
      component: LegalDocumentsSchema,
      meta: { title: 'Legal Documents | Life Relay' },
    },
    {
      path: '/trusts',
      name: 'trusts',
      component: TrustsSchema,
      meta: { title: 'Trusts | Life Relay' },
    },
    {
      path: '/physical-storage',
      name: 'physical-storage',
      component: PhysicalStorageLocationsSchema,
      meta: { title: 'Physical Storage Locations | Life Relay' },
    },
    {
      path: '/asset-documents',
      name: 'asset-documents',
      component: AssetDocumentsSchema,
      meta: { title: 'Asset Documents | Life Relay' },
    },
    {
      path: '/vault-backup',
      name: 'vault-backup',
      component: VaultBackupSchema,
      meta: { title: 'Vault Backup | Life Relay' },
    },
    {
      path: '/pending-legal-matters',
      name: 'pending-legal-matters',
      component: PendingLegalMattersSchema,
      meta: { title: 'Pending Legal Matters | Life Relay' },
    },

    // Final Wishes
    {
      path: '/letter-of-instruction',
      name: 'letter-of-instruction',
      component: LetterOfInstructionSchema,
      meta: { title: 'Letter of Instruction | Life Relay' },
    },
    {
      path: '/final-wishes',
      name: 'final-wishes',
      component: FinalWishesAndServicesSchema,
      meta: { title: 'Final Wishes & Services | Life Relay' },
    },
    {
      path: '/pet-care',
      name: 'pet-care',
      component: PetCareSchema,
      meta: { title: 'Pet Care | Life Relay' },
    },
    {
      path: '/photos-and-media',
      name: 'photos-and-media',
      component: PhotosAndMediaSchema,
      meta: { title: 'Photos & Media | Life Relay' },
    },
    {
      path: '/notes',
      name: 'notes',
      component: Notes,
      meta: { title: 'Notes | Life Relay' },
    },
    {
      path: '/estate-planning',
      name: 'estate-planning',
      component: EstatePlanningGuide,
      meta: { title: 'Estate Planning Guide | Life Relay' },
    },
    {
      path: '/runbook',
      name: 'runbook',
      component: Runbook,
      meta: { title: 'For My Family | Life Relay' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: { title: 'Settings | Life Relay' },
    },
  ],
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title || 'Life Relay — Privacy-First Estate Planning'
})

export default router
