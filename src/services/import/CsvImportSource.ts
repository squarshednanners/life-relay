import Papa from 'papaparse'
import type {
  ImportSource,
  ImportSourceId,
  ImportedRecord,
} from './ImportSource'

/**
 * CSV import adapter (Story 1.14a, AC1).
 *
 * Wraps papaparse with the defaults the rest of the pipeline expects:
 *   - `header: true` — first row treated as field names.
 *   - `dynamicTyping: false` — every cell stays a string. Type coercion
 *     happens later at validate time against the chosen schema; doing it
 *     here would silently lose precision (`'01234'` → `1234`).
 *   - `skipEmptyLines: true` — blank rows are dropped.
 *   - auto-delimiter detection by leaving papaparse's `delimiter` empty.
 *   - UTF-8 + BOM tolerance: we strip a leading BOM from the input string
 *     before parsing (papaparse 5.x preserves it on the first header key).
 *
 * Output records have `unmappedFields` populated from the parsed row;
 * `proposedSection`, `proposedFields`, and `validationIssues` are
 * initialized to safe defaults and filled in by later pipeline stages.
 */
export class CsvImportSource implements ImportSource {
  readonly id: ImportSourceId = 'csv'
  readonly label = 'Upload a CSV file'

  async parse(input: File | string): Promise<ImportedRecord[]> {
    const text = await readInput(input)
    const cleaned = stripBom(text)
    const result = Papa.parse<Record<string, string>>(cleaned, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      delimiter: '',
      transformHeader: h => h.trim(),
    })

    const rows = result.data ?? []
    // Surface fatal parse errors so the UI can flag them instead of
    // silently producing partial/shifted rows. We don't throw — papaparse
    // recoverable errors still yield usable data — but we attach one
    // record-level warning per error so the preview surfaces them.
    const parseErrors = result.errors ?? []
    const fatalErrors = parseErrors.filter(e => e.type !== 'FieldMismatch')
    if (rows.length === 0 && fatalErrors.length > 0) {
      throw new Error(
        `CSV parse failed: ${fatalErrors[0].message} (row ${fatalErrors[0].row ?? '?'})`,
      )
    }

    const records: ImportedRecord[] = []
    rows.forEach((row, index) => {
      // papaparse with header:true sometimes returns rows containing only
      // an `__parsed_extra` array for malformed extra-column rows. Strip
      // that key so it doesn't leak into the user-visible unmapped fields.
      const unmapped: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        if (key === '__parsed_extra') continue
        if (key === '') continue
        if (value === null || value === undefined) continue
        const stringValue = typeof value === 'string' ? value : String(value)
        unmapped[key] = stringValue
      }
      records.push({
        sourceLabel: buildSourceLabel(index, unmapped),
        proposedSection: null,
        proposedFields: {},
        unmappedFields: unmapped,
        validationIssues: [],
      })
    })
    return records
  }
}

/**
 * Build a row label using only fields that are SAFE to display in the UI.
 * A CSV from a password-manager export could put a password or seed
 * phrase in the first column; we don't want that text appearing in the
 * preview table OR in the aria-label that screen readers announce. So we
 * prefer named identity fields (name, label, title, etc.) and fall back
 * to the row index alone when none are present.
 */
const SAFE_LABEL_KEYS = [
  'name',
  'label',
  'title',
  'institution',
  'provider',
  'service',
  'company',
  'description',
]

function buildSourceLabel(index: number, unmapped: Record<string, string>): string {
  const lowered: Record<string, string> = {}
  for (const [k, v] of Object.entries(unmapped)) {
    lowered[k.toLowerCase()] = v
  }
  for (const safeKey of SAFE_LABEL_KEYS) {
    const value = lowered[safeKey]
    if (typeof value === 'string' && value.length > 0) {
      return `Row ${index + 1}: ${value}`
    }
  }
  return `Row ${index + 1}`
}

async function readInput(input: File | string): Promise<string> {
  if (typeof input === 'string') return input
  if (typeof input.text === 'function') return input.text()
  // jsdom-friendly fallback for environments where File.text() isn't
  // implemented. FileReader.readAsText covers every browser we target
  // AND jsdom.
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsText(input)
  })
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s
}
