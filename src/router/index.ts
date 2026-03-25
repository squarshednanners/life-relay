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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: Welcome,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
    },

    // People & Contacts
    {
      path: '/people',
      name: 'people',
      component: PeopleSchema,
    },
    {
      path: '/beneficiaries',
      name: 'beneficiaries',
      component: BeneficiariesSchema,
    },
    {
      path: '/important-contacts',
      name: 'important-contacts',
      component: ImportantContactsSchema,
    },

    // Security & Access
    {
      path: '/password-vaults',
      name: 'password-vaults',
      component: PasswordVaultsSchema,
    },
    {
      path: '/computer-servers',
      name: 'computer-servers',
      component: ComputerServersSchema,
    },
    {
      path: '/phones',
      name: 'phones',
      component: PhonesSchema,
    },
    {
      path: '/authenticator-apps',
      name: 'authenticator-apps',
      component: AuthenticatorAppsSchema,
    },

    // Insurance, Medical & Benefits
    {
      path: '/health-insurance',
      name: 'health-insurance',
      component: HealthInsuranceSchema,
    },
    {
      path: '/life-insurance',
      name: 'life-insurance',
      component: LifeInsuranceSchema,
    },
    {
      path: '/medical-info',
      name: 'medical-info',
      component: MedicalInfoSchema,
    },
    {
      path: '/employment-benefits',
      name: 'employment-benefits',
      component: EmploymentBenefitsSchema,
    },
    {
      path: '/other-insurance',
      name: 'other-insurance',
      component: OtherInsuranceSchema,
    },

    // Finances
    {
      path: '/financial-accounts',
      name: 'financial-accounts',
      component: FinancialAccountsSchema,
    },
    {
      path: '/credit-cards',
      name: 'credit-cards',
      component: CreditCardsSchema,
    },
    {
      path: '/debts',
      name: 'debts',
      component: DebtsSchema,
    },
    {
      path: '/income-sources',
      name: 'income-sources',
      component: IncomeSourcesSchema,
    },
    {
      path: '/retirement-accounts',
      name: 'retirement-accounts',
      component: RetirementAccountsSchema,
    },
    {
      path: '/loyalty-programs',
      name: 'loyalty-programs',
      component: LoyaltyProgramsSchema,
    },
    {
      path: '/tax-info',
      name: 'tax-info',
      component: TaxInfoSchema,
    },

    // Digital & Crypto Assets
    {
      path: '/digital-assets',
      name: 'digital-assets',
      component: DigitalAssetsSchema,
    },
    {
      path: '/crypto-assets',
      name: 'crypto-assets',
      component: CryptoAssetsSchema,
    },

    // Property & Household
    {
      path: '/property',
      name: 'property',
      component: PropertySchema,
    },
    {
      path: '/vehicles',
      name: 'vehicles',
      component: VehiclesSchema,
    },
    {
      path: '/business-ownership',
      name: 'business-ownership',
      component: BusinessOwnershipSchema,
    },
    {
      path: '/utilities',
      name: 'utilities',
      component: UtilitiesSchema,
    },

    // Documents & Storage
    {
      path: '/legal-documents',
      name: 'legal-documents',
      component: LegalDocumentsSchema,
    },
    {
      path: '/trusts',
      name: 'trusts',
      component: TrustsSchema,
    },
    {
      path: '/physical-storage',
      name: 'physical-storage',
      component: PhysicalStorageLocationsSchema,
    },
    {
      path: '/asset-documents',
      name: 'asset-documents',
      component: AssetDocumentsSchema,
    },
    {
      path: '/vault-backup',
      name: 'vault-backup',
      component: VaultBackupSchema,
    },
    {
      path: '/pending-legal-matters',
      name: 'pending-legal-matters',
      component: PendingLegalMattersSchema,
    },

    // Final Wishes
    {
      path: '/letter-of-instruction',
      name: 'letter-of-instruction',
      component: LetterOfInstructionSchema,
    },
    {
      path: '/final-wishes',
      name: 'final-wishes',
      component: FinalWishesAndServicesSchema,
    },
    {
      path: '/pet-care',
      name: 'pet-care',
      component: PetCareSchema,
    },
    {
      path: '/photos-and-media',
      name: 'photos-and-media',
      component: PhotosAndMediaSchema,
    },
    {
      path: '/notes',
      name: 'notes',
      component: Notes,
    },
    {
      path: '/estate-planning',
      name: 'estate-planning',
      component: EstatePlanningGuide,
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
    },
  ],
})

export default router
