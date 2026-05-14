import type {
  ImportSource,
  ImportSourceId,
  ImportedRecord,
} from './ImportSource'

/**
 * Free-form paste import adapter (Story 1.14a, AC2).
 *
 * Three-branch heuristic chain, in order:
 *
 *   1. **Tab-separated** — if every non-empty line has ≥2 tab-separated
 *      cells, treat as a table. Header sniff decides whether row 1 is
 *      headers or data (numeric / date-shaped cells → no header).
 *
 *   2. **Key/value blocks** — if any line matches `^key[:=]value$`, group
 *      consecutive matching lines into a record; blank lines separate
 *      records. Lines that don't match the key/value pattern are dropped
 *      (typically prose between blocks; the line-fallback branch handles
 *      pure-prose input).
 *
 *   3. **Line fallback** — each non-empty line becomes a one-field
 *      record with `note` = the line. The user manually assigns sections
 *      in the preview UI.
 *
 * Intentionally limited. This is "I have a Notes app dump" territory, not
 * a NLP problem. The auto-mapper downstream picks up wherever this leaves
 * off.
 */
export class PasteImportSource implements ImportSource {
  readonly id: ImportSourceId = 'paste'
  readonly label = 'Paste from clipboard'

  async parse(input: File | string): Promise<ImportedRecord[]> {
    const text = typeof input === 'string' ? input : await readFileText(input)
    // Strip leading UTF-8 BOM via escape (literal BOM here trips lint's
    // no-irregular-whitespace rule).
    const trimmed = text.replace(/^\uFEFF/, '').trim()
    if (trimmed.length === 0) return []

    const lines = trimmed.split(/\r?\n/)

    if (looksTabSeparated(lines)) {
      return parseTabSeparated(lines)
    }
    if (hasKeyValueLines(lines)) {
      return parseKeyValueBlocks(lines)
    }
    return parseLineFallback(lines)
  }
}

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsText(file)
  })
}

function looksTabSeparated(lines: string[]): boolean {
  const nonEmpty = lines.filter(l => l.trim().length > 0)
  if (nonEmpty.length === 0) return false
  // Every non-empty line must have ≥2 tab-separated columns. A single
  // trailing tab does not make a line tabular.
  return nonEmpty.every(l => l.split('\t').length >= 2)
}

function parseTabSeparated(lines: string[]): ImportedRecord[] {
  const nonEmpty = lines.filter(l => l.trim().length > 0)
  const rows = nonEmpty.map(l => l.split('\t').map(c => c.trim()))
  const firstRow = rows[0]
  const headerLooksLikeHeader = isHeaderRow(firstRow)
  const headers = headerLooksLikeHeader
    ? firstRow
    : firstRow.map((_, i) => `col${i + 1}`)
  const dataRows = headerLooksLikeHeader ? rows.slice(1) : rows
  return dataRows.map((cells, index) => {
    const unmapped: Record<string, string> = {}
    headers.forEach((h, i) => {
      const v = cells[i]
      if (v && v.length > 0) unmapped[h] = v
    })
    const firstValue = Object.values(unmapped).find(v => v && v.length > 0) ?? ''
    return makeRecord(`Row ${index + 1}: ${firstValue}`.trim(), unmapped)
  })
}

/**
 * Header sniff: ≥80% of cells are non-numeric, non-date-shaped strings
 * under 30 chars. Numeric / date-shaped row 1 → these are data values,
 * not headers.
 */
function isHeaderRow(row: string[]): boolean {
  if (row.length === 0) return false
  const headerish = row.filter(c => {
    if (!c) return false
    if (c.length >= 30) return false
    if (/^[\d.\-+,]+$/.test(c)) return false // numeric
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(c)) return false // ISO date
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(c)) return false // US date
    return true
  })
  return headerish.length / row.length >= 0.8
}

const KV_LINE = /^([\w][\w\s.-]*?)\s*[:=]\s*(.+)$/

function hasKeyValueLines(lines: string[]): boolean {
  return lines.some(l => KV_LINE.test(l.trim()))
}

function parseKeyValueBlocks(lines: string[]): ImportedRecord[] {
  const blocks: string[][] = []
  let current: string[] = []
  for (const line of lines) {
    if (line.trim().length === 0) {
      if (current.length > 0) {
        blocks.push(current)
        current = []
      }
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) blocks.push(current)

  return blocks
    .map((block, index) => blockToRecord(block, index))
    .filter((r): r is ImportedRecord => r !== null)
}

function blockToRecord(block: string[], index: number): ImportedRecord | null {
  const unmapped: Record<string, string> = {}
  for (const line of block) {
    const match = KV_LINE.exec(line.trim())
    if (match) {
      const key = match[1].trim().toLowerCase().replace(/\s+/g, '_')
      const value = match[2].trim()
      if (key.length > 0) unmapped[key] = value
    }
  }
  if (Object.keys(unmapped).length === 0) return null
  const firstValue = Object.values(unmapped)[0] ?? ''
  return makeRecord(`Block ${index + 1}: ${firstValue}`.trim(), unmapped)
}

function parseLineFallback(lines: string[]): ImportedRecord[] {
  const nonEmpty = lines.filter(l => l.trim().length > 0)
  return nonEmpty.map((line, index) =>
    makeRecord(`Line ${index + 1}`, { note: line.trim() }),
  )
}

function makeRecord(sourceLabel: string, unmapped: Record<string, string>): ImportedRecord {
  return {
    sourceLabel,
    proposedSection: null,
    proposedFields: {},
    unmappedFields: unmapped,
    validationIssues: [],
  }
}
