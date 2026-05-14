import { describe, it, expect } from 'vitest';
import { collectFieldsByPdfView } from '../schemaPdfViews';
import type {
  FormSectionSchema,
  PdfViewName,
} from '@/models/FormSchema';
import type { DeathboxData } from '@/models/DeathboxData';

const VIEW: PdfViewName = 'emergencySheet';

function emptyData(): DeathboxData {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  } as unknown as DeathboxData;
}

describe('collectFieldsByPdfView', () => {
  it('returns an empty list when no schemas tag the view', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People',
        isArray: true,
        fields: [
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'phone', label: 'Phone', type: 'tel' },
        ],
      },
    ];
    const result = collectFieldsByPdfView(VIEW, emptyData(), sections);
    expect(result).toEqual([]);
  });

  it('includes only fields tagged with `include: true` for the given view', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People',
        isArray: true,
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            pdfViews: { emergencySheet: { include: true } },
          },
          {
            name: 'phone',
            label: 'Phone',
            type: 'tel',
            pdfViews: { emergencySheet: { include: true } },
          },
          {
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            // No pdfViews tag — must NOT appear
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      people: [{ id: 'p1', name: 'Alice', phone: '555-1234', notes: 'private' }],
    } as unknown as DeathboxData;

    const result = collectFieldsByPdfView(VIEW, data, sections);

    expect(result).toHaveLength(1);
    expect(result[0].sectionKey).toBe('people');
    expect(result[0].items).toHaveLength(1);
    const fieldNames = result[0].items[0].fields.map((f) => f.fieldName);
    expect(fieldNames).toEqual(['name', 'phone']);
    expect(fieldNames).not.toContain('notes');
  });

  it('skips array sections that have no items', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People',
        isArray: true,
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            pdfViews: { emergencySheet: { include: true } },
          },
        ],
      },
    ];
    const result = collectFieldsByPdfView(VIEW, emptyData(), sections);
    expect(result).toEqual([]);
  });

  it('honors section-level label override (pdfViews[view].sectionLabel)', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People & Personal Information',
        isArray: true,
        pdfViews: {
          emergencySheet: { sectionLabel: 'PERSONAL INFORMATION' },
        },
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            pdfViews: { emergencySheet: { include: true } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      people: [{ id: 'p1', name: 'Alice' }],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView(VIEW, data, sections);
    expect(result[0].sectionLabel).toBe('PERSONAL INFORMATION');
  });

  it('honors field-level label override (pdfViews[view].label)', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People',
        isArray: true,
        fields: [
          {
            name: 'dateOfBirth',
            label: 'Date of Birth',
            type: 'date',
            pdfViews: { emergencySheet: { include: true, label: 'DOB' } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      people: [{ id: 'p1', dateOfBirth: '1970-01-01' }],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView(VIEW, data, sections);
    expect(result[0].items[0].fields[0].label).toBe('DOB');
  });

  it('honors field-level priority for ordering within an item', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People',
        isArray: true,
        fields: [
          {
            name: 'address',
            label: 'Address',
            type: 'text',
            pdfViews: { emergencySheet: { include: true, priority: 30 } },
          },
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            pdfViews: { emergencySheet: { include: true, priority: 10 } },
          },
          {
            name: 'phone',
            label: 'Phone',
            type: 'tel',
            pdfViews: { emergencySheet: { include: true, priority: 20 } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      people: [
        { id: 'p1', name: 'Alice', phone: '555-1234', address: '123 Main' },
      ],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView(VIEW, data, sections);
    const fieldNames = result[0].items[0].fields.map((f) => f.fieldName);
    expect(fieldNames).toEqual(['name', 'phone', 'address']);
  });

  it('honors itemSortPriority for array section sort (executor-priority pattern)', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'importantContacts',
        title: 'Important Contacts',
        isArray: true,
        pdfViews: {
          emergencySheet: {
            itemSortKey: 'role',
            itemSortPriority: ['Executor', 'Attorney', 'Doctor'],
          },
        },
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            pdfViews: { emergencySheet: { include: true } },
          },
          {
            name: 'role',
            label: 'Role',
            type: 'text',
            pdfViews: { emergencySheet: { include: true } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      importantContacts: [
        { name: 'Alice', role: 'Friend' },
        { name: 'Bob', role: 'Doctor' },
        { name: 'Carol', role: 'Executor' },
        { name: 'Dan', role: 'Attorney' },
      ],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView(VIEW, data, sections);
    const orderedNames = result[0].items.map(
      (item) => (item.data.name as string) ?? '',
    );
    // Carol (Executor), Dan (Attorney), Bob (Doctor) come first; Alice (no priority) sorts after.
    expect(orderedNames).toEqual(['Carol', 'Dan', 'Bob', 'Alice']);
  });

  it('honors itemLimit (e.g., wallet card top-3 contacts)', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'importantContacts',
        title: 'Important Contacts',
        isArray: true,
        pdfViews: {
          walletCard: {
            itemSortKey: 'role',
            itemSortPriority: ['Executor', 'Attorney'],
            itemLimit: 2,
          },
        },
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            pdfViews: { walletCard: { include: true } },
          },
          {
            name: 'role',
            label: 'Role',
            type: 'text',
            pdfViews: { walletCard: { include: true } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      importantContacts: [
        { name: 'Alice', role: 'Friend' },
        { name: 'Bob', role: 'Doctor' },
        { name: 'Carol', role: 'Executor' },
        { name: 'Dan', role: 'Attorney' },
      ],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView('walletCard', data, sections);
    expect(result[0].items.map((item) => item.data.name)).toEqual([
      'Carol',
      'Dan',
    ]);
  });

  it('marks fields with manualEntry flag set as blank for handwriting', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People',
        isArray: true,
        fields: [
          {
            name: 'socialSecurityNumber',
            label: 'SSN',
            type: 'password',
            manualEntry: true,
            pdfViews: { emergencySheet: { include: true } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      people: [
        {
          id: 'p1',
          socialSecurityNumber: '123-45-6789',
          socialSecurityNumberManualEntry: true,
        },
      ],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView(VIEW, data, sections);
    const field = result[0].items[0].fields[0];
    expect(field.manualEntryBlank).toBe(true);
    expect(field.value).toBeUndefined();
  });

  it('skips fields with empty values when pdfSkipIfEmpty is set', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People',
        isArray: true,
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            pdfViews: { emergencySheet: { include: true } },
          },
          {
            name: 'phone',
            label: 'Phone',
            type: 'tel',
            pdfSkipIfEmpty: true,
            pdfViews: { emergencySheet: { include: true } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      people: [{ id: 'p1', name: 'Alice', phone: '' }],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView(VIEW, data, sections);
    const fieldNames = result[0].items[0].fields.map((f) => f.fieldName);
    expect(fieldNames).toEqual(['name']);
  });

  it('handles singleton sections (non-array) yielding one item', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'letterOfInstruction',
        title: 'Letter of Instruction',
        isArray: false,
        fields: [
          {
            name: 'introduction',
            label: 'Introduction',
            type: 'textarea',
            pdfViews: { runbookPdf: { include: true } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      letterOfInstruction: { introduction: 'To my family...' },
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView('runbookPdf', data, sections);
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].fields[0].value).toBe('To my family...');
  });

  it('respects field visibility conditions on array items', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'cryptoAssets',
        title: 'Crypto Assets',
        isArray: true,
        fields: [
          {
            name: 'walletType',
            label: 'Wallet Type',
            type: 'select',
            pdfViews: { emergencySheet: { include: true } },
          },
          {
            name: 'seedPhrase',
            label: 'Seed Phrase',
            type: 'password',
            visible: { field: 'walletType', operator: 'equals', value: 'hardware' },
            pdfViews: { emergencySheet: { include: true } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      cryptoAssets: [
        { id: 'c1', walletType: 'exchange', seedPhrase: 'should not appear' },
        { id: 'c2', walletType: 'hardware', seedPhrase: 'should appear' },
      ],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView(VIEW, data, sections);
    const item1Fields = result[0].items[0].fields.map((f) => f.fieldName);
    const item2Fields = result[0].items[1].fields.map((f) => f.fieldName);
    expect(item1Fields).not.toContain('seedPhrase');
    expect(item2Fields).toContain('seedPhrase');
  });

  it('respects section-level pdfViews.include = false to skip a section', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People',
        isArray: true,
        pdfViews: { emergencySheet: { include: false } },
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            pdfViews: { emergencySheet: { include: true } },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      people: [{ id: 'p1', name: 'Alice' }],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView(VIEW, data, sections);
    expect(result).toEqual([]);
  });

  it('uses field-level format function over schema pdfFormat', () => {
    const sections: FormSectionSchema[] = [
      {
        sectionKey: 'people',
        title: 'People',
        isArray: true,
        fields: [
          {
            name: 'dateOfBirth',
            label: 'DOB',
            type: 'date',
            pdfFormat: (v) => `[default: ${v}]`,
            pdfViews: {
              emergencySheet: {
                include: true,
                format: (v) => `[ES: ${v}]`,
              },
            },
          },
        ],
      },
    ];
    const data = {
      ...emptyData(),
      people: [{ id: 'p1', dateOfBirth: '1970-01-01' }],
    } as unknown as DeathboxData;
    const result = collectFieldsByPdfView(VIEW, data, sections);
    expect(result[0].items[0].fields[0].value).toBe('[ES: 1970-01-01]');
  });
});
