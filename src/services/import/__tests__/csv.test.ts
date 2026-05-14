/**
 * Tests for CsvImportSource (Story 1.14a, AC1 + AC11).
 *
 * The CSV adapter is the most-used import path. Tests pin the contract:
 * header sniff, delimiter auto-detection, BOM tolerance, quoted-cell with
 * commas, malformed-row recovery. Output records have `unmappedFields`
 * populated; auto-mapping happens downstream.
 */
import { describe, it, expect } from 'vitest'
import { CsvImportSource } from '../CsvImportSource'

const adapter = new CsvImportSource()

function fakeFile(content: string, name = 'test.csv'): File {
  return new File([content], name, { type: 'text/csv' })
}

describe('CsvImportSource — parse', () => {
  it('parses a simple comma-delimited CSV with header row', async () => {
    const csv = 'name,email,phone\nAnna,anna@example.com,555-1212\nMike,mike@example.com,555-3434\n'
    const records = await adapter.parse(fakeFile(csv))
    expect(records).toHaveLength(2)
    expect(records[0].unmappedFields).toEqual({
      name: 'Anna',
      email: 'anna@example.com',
      phone: '555-1212',
    })
    expect(records[0].sourceLabel).toMatch(/Row 1.*Anna/)
    expect(records[1].sourceLabel).toMatch(/Row 2.*Mike/)
  })

  it('tolerates a UTF-8 BOM at the start of the file', async () => {
    const csv = '﻿name,email\nAnna,anna@example.com\n'
    const records = await adapter.parse(fakeFile(csv))
    expect(records).toHaveLength(1)
    // The leading BOM must NOT appear on the first header key.
    expect(Object.keys(records[0].unmappedFields)).toContain('name')
    expect(records[0].unmappedFields.name).toBe('Anna')
  })

  it('auto-detects a semicolon delimiter (European-locale CSV)', async () => {
    const csv = 'name;email\nAnna;anna@example.com\n'
    const records = await adapter.parse(fakeFile(csv))
    expect(records).toHaveLength(1)
    expect(records[0].unmappedFields).toEqual({
      name: 'Anna',
      email: 'anna@example.com',
    })
  })

  it('handles quoted cells with embedded commas', async () => {
    const csv = 'name,note\nAnna,"loves jazz, walks, and coffee"\n'
    const records = await adapter.parse(fakeFile(csv))
    expect(records).toHaveLength(1)
    expect(records[0].unmappedFields.note).toBe('loves jazz, walks, and coffee')
  })

  it('skips empty lines', async () => {
    const csv = 'name,email\nAnna,anna@example.com\n\n\nMike,mike@example.com\n'
    const records = await adapter.parse(fakeFile(csv))
    expect(records).toHaveLength(2)
  })

  it('accepts a raw string input (paste-style) as well as a File', async () => {
    const csv = 'name,email\nAnna,anna@example.com\n'
    const records = await adapter.parse(csv)
    expect(records).toHaveLength(1)
    expect(records[0].unmappedFields.email).toBe('anna@example.com')
  })

  it('initializes pipeline-downstream fields to safe defaults', async () => {
    const csv = 'name\nAnna\n'
    const records = await adapter.parse(fakeFile(csv))
    expect(records[0].proposedSection).toBeNull()
    expect(records[0].proposedFields).toEqual({})
    expect(records[0].validationIssues).toEqual([])
  })

  it('recovers gracefully when a row has extra columns', async () => {
    const csv = 'name,email\nAnna,anna@example.com,unexpected-extra\n'
    const records = await adapter.parse(fakeFile(csv))
    expect(records).toHaveLength(1)
    // The mapped header columns are present; the extra column is ignored
    // or captured under a fallback key — either way, the row doesn't blow up.
    expect(records[0].unmappedFields.name).toBe('Anna')
    expect(records[0].unmappedFields.email).toBe('anna@example.com')
  })

  it('treats every cell value as a string (no auto-typing)', async () => {
    // Type coercion happens at validation time against the chosen schema,
    // not at parse time. Otherwise '01234' silently becomes 1234.
    const csv = 'name,zip\nAnna,01234\n'
    const records = await adapter.parse(fakeFile(csv))
    expect(records[0].unmappedFields.zip).toBe('01234')
  })

  it('exposes adapter metadata', () => {
    expect(adapter.id).toBe('csv')
    expect(adapter.label.length).toBeGreaterThan(0)
  })
})
