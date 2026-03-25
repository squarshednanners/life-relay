/**
 * Schema Registry
 *
 * Central registry of all form schemas for easy access in PDF generation
 */

import { peopleSchema } from './people.schema'
import { beneficiariesSchema } from './beneficiaries.schema'
import { importantContactsSchema } from './importantContacts.schema'
import { passwordVaultsSchema } from './passwordVaults.schema'
import { computerServersSchema } from './computerServers.schema'
import { phonesSchema } from './phones.schema'
import { authenticatorAppsSchema } from './authenticatorApps.schema'
import { lifeInsurancePolicySchema } from './lifeInsurance.schema'
import { healthInsuranceSchema } from './healthInsurance.schema'
import { medicalInfoSchema } from './medicalInfo.schema'
import { employmentBenefitsSchema } from './employmentBenefits.schema'
import { financialAccountsSchema } from './financialAccounts.schema'
import { retirementAccountsSchema } from './retirementAccounts.schema'
import { creditCardsSchema } from './creditCards.schema'
import { debtsSchema } from './debts.schema'
import { incomeSourcesSchema } from './incomeSources.schema'
import { digitalAssetsSchema } from './digitalAssets.schema'
import { cryptoAssetsSchema } from './cryptoAssets.schema'
import { propertySchema } from './property.schema'
import { vehiclesSchema } from './vehicles.schema'
import { businessOwnershipSchema } from './businessOwnership.schema'
import { utilitiesSchema } from './utilities.schema'
import { legalDocumentsSchema } from './legalDocuments.schema'
import { trustsSchema } from './trusts.schema'
import { physicalStorageLocationsSchema } from './physicalStorageLocations.schema'
import { assetDocumentsSchema } from './assetDocuments.schema'
import { vaultBackupSchema } from './vaultBackup.schema'
import { otherInsuranceSchema } from './otherInsurance.schema'
import { loyaltyProgramsSchema } from './loyaltyPrograms.schema'
import { taxInfoSchema } from './taxInfo.schema'
import { pendingLegalMattersSchema } from './pendingLegalMatters.schema'
import { letterOfInstructionSchema } from './letterOfInstruction.schema'
import { finalWishesAndServicesSchema } from './finalWishesAndServices.schema'
import { petCareSchema } from './petCare.schema'
import { photosAndMediaSchema } from './photosAndMedia.schema'

import type { FormSectionSchema } from '@/models/FormSchema'

/**
 * Registry mapping section keys to their schemas
 */
export const schemaRegistry: Record<string, FormSectionSchema> = {
  // People & Contacts
  people: peopleSchema,
  beneficiaries: beneficiariesSchema,
  importantContacts: importantContactsSchema,

  // Security & Access
  passwordVaults: passwordVaultsSchema,
  computerServers: computerServersSchema,
  phones: phonesSchema,
  authenticatorApps: authenticatorAppsSchema,

  // Insurance, Medical & Benefits
  healthInsurance: healthInsuranceSchema,
  'lifeInsurance.policies': lifeInsurancePolicySchema,
  medicalInfo: medicalInfoSchema,
  employmentBenefits: employmentBenefitsSchema,
  otherInsurance: otherInsuranceSchema,

  // Finances
  financialAccounts: financialAccountsSchema,
  creditCards: creditCardsSchema,
  debts: debtsSchema,
  incomeSources: incomeSourcesSchema,
  retirementAccounts: retirementAccountsSchema,
  loyaltyPrograms: loyaltyProgramsSchema,
  taxInfo: taxInfoSchema,

  // Digital & Crypto Assets
  digitalAssets: digitalAssetsSchema,
  cryptoAssets: cryptoAssetsSchema,

  // Property & Household
  property: propertySchema,
  vehicles: vehiclesSchema,
  businessOwnership: businessOwnershipSchema,
  utilities: utilitiesSchema,

  // Documents & Storage
  legalDocuments: legalDocumentsSchema,
  trusts: trustsSchema,
  physicalStorageLocations: physicalStorageLocationsSchema,
  assetDocuments: assetDocumentsSchema,
  vaultBackup: vaultBackupSchema,
  pendingLegalMatters: pendingLegalMattersSchema,

  // Final Wishes
  letterOfInstruction: letterOfInstructionSchema,
  finalWishesAndServices: finalWishesAndServicesSchema,
  petCare: petCareSchema,
  photosAndMedia: photosAndMediaSchema,
}

/**
 * Get schema for a section key
 */
export function getSchema(sectionKey: string): FormSectionSchema | undefined {
  return schemaRegistry[sectionKey]
}

/**
 * Get all schemas grouped by PDF group
 */
export function getSchemasByGroup(): Record<string, FormSectionSchema[]> {
  const grouped: Record<string, FormSectionSchema[]> = {}

  Object.values(schemaRegistry).forEach(schema => {
    if (schema.pdfGroup) {
      if (!grouped[schema.pdfGroup]) {
        grouped[schema.pdfGroup] = []
      }
      grouped[schema.pdfGroup].push(schema)
    }
  })

  return grouped
}
