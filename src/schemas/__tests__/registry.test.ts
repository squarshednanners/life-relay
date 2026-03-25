import { describe, it, expect } from 'vitest'
import { getSchema, getSchemasByGroup } from '../index'
import type { FormSectionSchema } from '@/models/FormSchema'
import * as fs from 'fs'
import * as path from 'path'

// Load test data for cross-reference checks
const testDataPath = path.resolve(__dirname, '../../../test-data.json')
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

// Known PDF group names (from generator.ts GROUP_COLORS)
const VALID_GROUPS = [
  'People & Contacts',
  'Security & Access',
  'Insurance, Medical & Benefits',
  'Finances',
  'Digital & Crypto Assets',
  'Property & Household',
  'Documents & Storage',
  'Final Wishes',
]

describe('Schema Registry', () => {
  const schemasByGroup = getSchemasByGroup()
  const allSchemas: FormSectionSchema[] = Object.values(schemasByGroup).flat()

  it('has schemas in all 8 groups', () => {
    for (const group of VALID_GROUPS) {
      expect(schemasByGroup[group], `Missing group: ${group}`).toBeDefined()
      expect(schemasByGroup[group].length, `Empty group: ${group}`).toBeGreaterThan(0)
    }
  })

  it('every schema has required properties', () => {
    for (const schema of allSchemas) {
      expect(schema.sectionKey, `Schema missing sectionKey`).toBeTruthy()
      expect(schema.title, `Schema ${schema.sectionKey} missing title`).toBeTruthy()
      expect(schema.fields, `Schema ${schema.sectionKey} missing fields`).toBeDefined()
      expect(schema.fields.length, `Schema ${schema.sectionKey} has no fields`).toBeGreaterThan(0)
    }
  })

  it('every non-divider field has name and type', () => {
    for (const schema of allSchemas) {
      for (const field of schema.fields) {
        if (field.sectionDivider) continue
        expect(field.name, `Field in ${schema.sectionKey} missing name`).toBeTruthy()
        expect(field.type, `Field ${field.name} in ${schema.sectionKey} missing type`).toBeTruthy()
      }
    }
  })

  it('no duplicate field names within a schema', () => {
    for (const schema of allSchemas) {
      const names = schema.fields
        .filter(f => !f.sectionDivider && f.name)
        .map(f => f.name!)
      const unique = new Set(names)
      expect(names.length, `Duplicate fields in ${schema.sectionKey}: ${names.filter((n, i) => names.indexOf(n) !== i)}`).toBe(unique.size)
    }
  })

  it('all pdfGroup values are valid group names', () => {
    for (const schema of allSchemas) {
      if (schema.pdfGroup) {
        expect(
          VALID_GROUPS,
          `Schema ${schema.sectionKey} has invalid pdfGroup: ${schema.pdfGroup}`
        ).toContain(schema.pdfGroup)
      }
    }
  })

  it('getSchema returns correct schema for known keys', () => {
    expect(getSchema('people')?.title).toBe('People & Personal Information')
    expect(getSchema('financialAccounts')?.title).toBe('Financial Accounts')
    expect(getSchema('trusts')?.title).toBe('Trusts')
  })

  it('getSchema returns undefined for unknown key', () => {
    expect(getSchema('nonexistent')).toBeUndefined()
  })

  it('getSchemasByGroup returns correct grouping for People & Contacts', () => {
    const group = schemasByGroup['People & Contacts']
    const keys = group.map(s => s.sectionKey)
    expect(keys).toContain('people')
    expect(keys).toContain('beneficiaries')
    expect(keys).toContain('importantContacts')
  })

  describe('schema field names match test data keys', () => {
    // Map of sectionKey -> data path in test data
    const arraySchemas = allSchemas.filter(s => s.isArray)

    for (const schema of arraySchemas) {
      // Skip nested schemas like lifeInsurance.policies
      const dataKey = schema.sectionKey.includes('.')
        ? schema.sectionKey.split('.').reduce((obj: any, key: string) => obj?.[key], testData)
        : testData[schema.sectionKey]

      if (!dataKey || !Array.isArray(dataKey) || dataKey.length === 0) continue

      it(`${schema.sectionKey} fields exist in test data`, () => {
        const firstItem = dataKey[0]
        const fieldNames = schema.fields
          .filter(f => !f.sectionDivider && f.name && !f.name.includes('.') && !f.visible)
          .map(f => f.name!)

        for (const fieldName of fieldNames) {
          expect(
            firstItem,
            `Field "${fieldName}" from ${schema.sectionKey} schema not found in test data`
          ).toHaveProperty(fieldName)
        }
      })
    }
  })
})
