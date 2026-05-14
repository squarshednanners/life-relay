/**
 * FieldRenderer uniform-form-typography tests (Story 1.6 AC8 + UX iteration).
 *
 * Asserts every input/textarea/select renders at body-md (16px) Inter
 * regular, regardless of field type or schema `displayAs` override. The
 * mono distinction is preserved at the PDF render layer
 * (`schemaToPdf.ts` consults `resolveFieldDisplayAs`), not on the editing
 * surface.
 *
 * Labels follow the inversion: body-sm + medium weight + secondary color.
 * The value/label visual difference comes from size (16 vs 14) and color
 * (primary vs secondary), not font family.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FieldRenderer from '../FieldRenderer.vue'
import type { FormFieldSchema } from '@/models/FormSchema'

beforeEach(() => {
  setActivePinia(createPinia())
})

function mountField(field: FormFieldSchema, modelValue: any = '') {
  return mount(FieldRenderer, {
    props: { field, modelValue },
  })
}

describe('FieldRenderer uniform form typography', () => {
  it('label uses body-sm + medium weight + secondary color', () => {
    const field: FormFieldSchema = { name: 'fullName', label: 'Full name', type: 'text' }
    const wrapper = mountField(field)
    const labelHtml = wrapper.find('label').attributes('class') ?? ''
    expect(labelHtml).toContain('text-body-sm')
    expect(labelHtml).toContain('font-medium')
    expect(labelHtml).toContain('text-text-secondary')
  })

  it('text field renders at body-md Inter, no mono', () => {
    const field: FormFieldSchema = { name: 'fullName', label: 'Full name', type: 'text' }
    const wrapper = mountField(field)
    const inputClass = wrapper.find('input').attributes('class') ?? ''
    expect(inputClass).toContain('text-body-md')
    expect(inputClass).toContain('text-text-primary')
    expect(inputClass).not.toContain('font-mono')
  })

  it('tel field renders at body-md Inter, no mono', () => {
    const field: FormFieldSchema = { name: 'phone', label: 'Phone', type: 'tel' }
    const wrapper = mountField(field)
    const inputClass = wrapper.find('input').attributes('class') ?? ''
    expect(inputClass).toContain('text-body-md')
    expect(inputClass).not.toContain('font-mono')
  })

  it('password field renders at body-md Inter, no mono', () => {
    // The input STILL has type=password (the masking dots are uniform-width
    // regardless of font). Visual typography matches every other field on
    // the form so the editing experience stays consistent.
    const field: FormFieldSchema = { name: 'pwd', label: 'Password', type: 'password' }
    const wrapper = mountField(field)
    const inputClass = wrapper.find('input').attributes('class') ?? ''
    expect(inputClass).toContain('text-body-md')
    expect(inputClass).not.toContain('font-mono')
    expect(inputClass).not.toContain('text-mono-md')
  })

  it('schema displayAs="mono" override does NOT change screen typography', () => {
    // The override is consulted ONLY at PDF render time. On screen the
    // input uses the uniform prose typography. The schema hint stays
    // valuable for the printed runbook (where character-by-character
    // scanning of a wallet address actually helps the reader).
    const field: FormFieldSchema = {
      name: 'btcAddr',
      label: 'Bitcoin address',
      type: 'text',
      displayAs: 'mono',
    }
    const wrapper = mountField(field)
    const inputClass = wrapper.find('input').attributes('class') ?? ''
    expect(inputClass).toContain('text-body-md')
    expect(inputClass).not.toContain('font-mono')
    expect(inputClass).not.toContain('text-mono-md')
  })

  it('textarea renders at body-md Inter, no mono', () => {
    const field: FormFieldSchema = { name: 'notes', label: 'Notes', type: 'textarea' }
    const wrapper = mountField(field)
    const textareaClass = wrapper.find('textarea').attributes('class') ?? ''
    expect(textareaClass).toContain('text-body-md')
    expect(textareaClass).not.toContain('font-mono')
  })

  it('textarea with manualEntry: true also renders uniform body-md (manualEntry is a PDF flag, not a screen cue)', () => {
    // The `manualEntry` schema flag signals "leave space for handwriting
    // in the printed runbook". It has no editing-surface implication —
    // the companion checkbox below the input is the canonical user
    // signal. Don't introduce typography variance for this case.
    const field: FormFieldSchema = {
      name: 'seedPhrase',
      label: 'Seed phrase',
      type: 'textarea',
      manualEntry: true,
    }
    const wrapper = mountField(field)
    const textareaClass = wrapper.find('textarea').attributes('class') ?? ''
    expect(textareaClass).toContain('text-body-md')
    expect(textareaClass).not.toContain('font-mono')
    expect(textareaClass).not.toContain('text-mono-sm')
  })

  it('select element renders at body-md', () => {
    const field: FormFieldSchema = {
      name: 'state',
      label: 'State',
      type: 'select',
      options: [{ label: 'TX', value: 'TX' }, { label: 'CA', value: 'CA' }],
    }
    const wrapper = mountField(field)
    const selectClass = wrapper.find('select').attributes('class') ?? ''
    expect(selectClass).toContain('text-body-md')
  })

  it('select with optionsFrom against an empty store falls back to field.options', () => {
    // Story 1.6 code review caught that prior tests never exercised the
    // Pinia store path. `optionsFrom` walks `store.data.<source>`; when the
    // source is missing (or the store is empty as in fresh tests), the
    // resolver must fall back to `field.options` rather than crash.
    const field: FormFieldSchema = {
      name: 'beneficiary',
      label: 'Beneficiary',
      type: 'select',
      options: [{ label: 'Fallback', value: 'fallback' }],
      optionsFrom: { source: 'people', labelField: 'firstName', valueField: 'id' },
    }
    const wrapper = mountField(field)
    expect(wrapper.find('select').exists()).toBe(true)
    // The empty-store fallback should render the static `options` entry.
    expect(wrapper.findAll('option').length).toBeGreaterThan(0)
  })
})
