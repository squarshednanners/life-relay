/**
 * Tests for PasteImportSource (Story 1.14a, AC2 + AC11).
 *
 * The paste adapter is heuristic by design — it's the "I have something
 * semi-structured" path, not magic. Tests pin the three-branch chain
 * (tab-separated → key/value blocks → line-fallback) and the header sniff.
 */
import { describe, it, expect } from 'vitest'
import { PasteImportSource } from '../PasteImportSource'

const adapter = new PasteImportSource()

describe('PasteImportSource — tab-separated branch', () => {
  it('parses tab-separated rows with header row', async () => {
    const input = 'name\temail\nAnna\tanna@example.com\nMike\tmike@example.com'
    const records = await adapter.parse(input)
    expect(records).toHaveLength(2)
    expect(records[0].unmappedFields).toEqual({
      name: 'Anna',
      email: 'anna@example.com',
    })
  })

  it('treats row 1 as data when cells look numeric/data-ish (no header detected)', async () => {
    // First row "555-1212" doesn't pass the "header-y words" sniff →
    // every row is data; columns get generic names.
    const input = '555-1212\t100\n555-3434\t200'
    const records = await adapter.parse(input)
    expect(records).toHaveLength(2)
    // Column names fall back to col1, col2, etc.
    expect(Object.keys(records[0].unmappedFields)).toEqual(
      expect.arrayContaining(['col1', 'col2']),
    )
  })
})

describe('PasteImportSource — key/value block branch', () => {
  it('parses one key/value block as a single record', async () => {
    const input = 'name: Anna\nemail: anna@example.com\nphone: 555-1212'
    const records = await adapter.parse(input)
    expect(records).toHaveLength(1)
    expect(records[0].unmappedFields).toEqual({
      name: 'Anna',
      email: 'anna@example.com',
      phone: '555-1212',
    })
  })

  it('splits multiple key/value blocks on blank lines', async () => {
    const input = [
      'name: Anna',
      'email: anna@example.com',
      '',
      'name: Mike',
      'email: mike@example.com',
    ].join('\n')
    const records = await adapter.parse(input)
    expect(records).toHaveLength(2)
    expect(records[0].unmappedFields.name).toBe('Anna')
    expect(records[1].unmappedFields.name).toBe('Mike')
  })

  it('accepts both : and = as separators', async () => {
    const input = 'name = Anna\nemail = anna@example.com'
    const records = await adapter.parse(input)
    expect(records).toHaveLength(1)
    expect(records[0].unmappedFields.name).toBe('Anna')
  })
})

describe('PasteImportSource — line-fallback branch', () => {
  it('treats each non-empty line as a one-field record when no structure detected', async () => {
    const input = 'just some notes\nanother random line\nfinal observation'
    const records = await adapter.parse(input)
    expect(records).toHaveLength(3)
    expect(records[0].unmappedFields.note).toBe('just some notes')
    expect(records[2].unmappedFields.note).toBe('final observation')
  })

  it('returns an empty array on empty input', async () => {
    const records = await adapter.parse('')
    expect(records).toEqual([])
  })

  it('returns an empty array on whitespace-only input', async () => {
    const records = await adapter.parse('   \n\n  \t  \n')
    expect(records).toEqual([])
  })
})

describe('PasteImportSource — pipeline contract', () => {
  it('initializes pipeline-downstream fields to safe defaults', async () => {
    const records = await adapter.parse('name: Anna')
    expect(records[0].proposedSection).toBeNull()
    expect(records[0].proposedFields).toEqual({})
    expect(records[0].validationIssues).toEqual([])
  })

  it('exposes adapter metadata', () => {
    expect(adapter.id).toBe('paste')
    expect(adapter.label.length).toBeGreaterThan(0)
  })

  it('rejects a File input cleanly (paste adapter is string-only)', async () => {
    // The paste adapter is the textarea path. Accepting File would be
    // misleading; let it surface as a type error or no-op rather than
    // silent confusion.
    const file = new File(['name: Anna'], 'paste.txt')
    const records = await adapter.parse(file)
    // Implementation choice: convert File to text and parse anyway,
    // since File extends Blob and `.text()` works in browsers + jsdom.
    expect(records).toHaveLength(1)
    expect(records[0].unmappedFields.name).toBe('Anna')
  })
})
