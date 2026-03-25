import { describe, it, expect } from 'vitest'
import { hasSectionData, sectionGroups } from '../useSectionProgress'
import type { DeathboxData } from '@/models/DeathboxData'
import * as fs from 'fs'
import * as path from 'path'

const testDataPath = path.resolve(__dirname, '../../../test-data.json')
const testData: DeathboxData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

describe('hasSectionData', () => {
  it('returns false for null data', () => {
    expect(hasSectionData(null, '/people')).toBe(false)
    expect(hasSectionData(null, '/financial-accounts')).toBe(false)
  })

  it('returns false for empty arrays', () => {
    const data = { updatedAt: '', people: [] } as DeathboxData
    expect(hasSectionData(data, '/people')).toBe(false)
  })

  it('returns true for populated arrays', () => {
    const data = { updatedAt: '', people: [{ id: '1', name: 'Test' }] } as DeathboxData
    expect(hasSectionData(data, '/people')).toBe(true)
  })

  it('returns false for empty object sections', () => {
    const data = { updatedAt: '', healthInsurance: {} } as DeathboxData
    expect(hasSectionData(data, '/health-insurance')).toBe(false)
  })

  it('returns false for object with only empty strings', () => {
    const data = { updatedAt: '', healthInsurance: { provider: '', policyNumber: '' } } as DeathboxData
    expect(hasSectionData(data, '/health-insurance')).toBe(false)
  })

  it('returns true for object with one populated field', () => {
    const data = { updatedAt: '', healthInsurance: { provider: 'Aetna' } } as DeathboxData
    expect(hasSectionData(data, '/health-insurance')).toBe(true)
  })

  it('handles life insurance nested structure', () => {
    const empty = { updatedAt: '', lifeInsurance: { policies: [] } } as DeathboxData
    expect(hasSectionData(empty, '/life-insurance')).toBe(false)

    const filled = { updatedAt: '', lifeInsurance: { policies: [{ company: 'MetLife' }] } } as DeathboxData
    expect(hasSectionData(filled, '/life-insurance')).toBe(true)
  })

  it('returns false for empty/whitespace notes', () => {
    const data = { updatedAt: '', notes: '   ' } as DeathboxData
    expect(hasSectionData(data, '/notes')).toBe(false)
  })

  it('returns true for populated notes', () => {
    const data = { updatedAt: '', notes: 'Remember this' } as DeathboxData
    expect(hasSectionData(data, '/notes')).toBe(true)
  })

  it('returns false for unknown path', () => {
    expect(hasSectionData(testData, '/nonexistent')).toBe(false)
  })

  describe('test data has data for all expected sections', () => {
    // All paths from sectionGroups that should have data in test-data.json
    const allPaths = sectionGroups.flatMap(g => g.items.map(i => i.path))

    for (const sectionPath of allPaths) {
      it(`detects data for ${sectionPath}`, () => {
        expect(
          hasSectionData(testData, sectionPath),
          `hasSectionData returned false for ${sectionPath} but test data should have content`
        ).toBe(true)
      })
    }
  })
})
