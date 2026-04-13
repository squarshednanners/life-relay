# Form Schema Framework

## Overview

The Form Schema Framework provides a declarative way to define forms that can be used for both UI rendering and PDF generation, eliminating the need to update multiple files when adding or modifying fields.

## Benefits

1. **Single Source of Truth**: Define fields once in a schema file
2. **Type Safety**: Maintains TypeScript type checking
3. **Conditional Visibility**: Show/hide fields based on other field values
4. **PDF Integration**: Automatically generate PDF sections from schemas
5. **Gradual Migration**: Can be adopted incrementally alongside existing forms
6. **Validation**: Pattern, min/max enforcement with inline error messages
7. **Accessibility**: ARIA attributes for screen readers
8. **Dynamic Options**: Populate select/radio options from store data
9. **Field Dependencies**: Auto-populate fields based on other field values

## Architecture

### Core Components

1. **FormSchema Model** (`src/models/FormSchema.ts`)
   - Defines field types, visibility conditions, validation, dependencies, and layout
   - Provides helper functions: `evaluateVisibility()`, `getVisibleFields()`

2. **DynamicForm Component** (`src/components/DynamicForm.vue`)
   - Generic form renderer that works with any schema
   - Handles both single objects and arrays

3. **DynamicFormFields Component** (`src/components/DynamicFormFields.vue`)
   - Renders individual fields based on schema via `FieldRenderer`
   - Groups fields into expandable sections
   - Watches field dependencies and auto-populates dependent fields

4. **FieldRenderer Component** (`src/components/FieldRenderer.vue`)
   - Renders each field type (text, select, checkbox, etc.)
   - Enforces validation rules on blur
   - Resolves dynamic options from `optionsFrom`
   - Applies ARIA attributes (`aria-required`, `aria-invalid`, `aria-describedby`)

5. **Schema Files** (`src/schemas/*.schema.ts`)
   - Declarative form definitions
   - One schema file per section
   - Registry in `src/schemas/index.ts`

6. **PDF Generator Helper** (`src/pdf/schemaToPdf.ts`)
   - Converts schemas to PDF output
   - Reduces duplication in PDF generation

## Usage Example

### 1. Define a Schema

```typescript
// src/schemas/financialAccounts.schema.ts
import type { FormSectionSchema } from '@/models/FormSchema'

export const financialAccountsSchema: FormSectionSchema = {
  sectionKey: 'financialAccounts',
  title: 'Financial Accounts',
  description: 'Bank accounts, investment accounts, and other financial institutions',
  isArray: true,
  arrayItemLabel: (index) => `Account ${index + 1}`,
  pdfGroup: 'Finances',
  fields: [
    {
      name: 'institution',
      label: 'Institution',
      type: 'text',
      placeholder: 'Bank Name',
      colSpan: 1,
    },
    {
      name: 'accountCategory',
      label: 'Account Owner',
      type: 'select',
      colSpan: 1,
      options: [
        { label: 'Personal', value: 'personal' },
        { label: 'Business', value: 'business' },
      ],
    },
    {
      name: 'accountName',
      label: 'Account Name',
      type: 'text',
      colSpan: 1,
      // Only show if accountCategory is 'trust'
      visible: {
        field: 'accountCategory',
        operator: 'equals',
        value: 'trust',
      },
    },
  ],
}
```

### 2. Use in a View

```vue
<template>
  <DynamicForm
    :schema="financialAccountsSchema"
    :model-value="accounts"
    @update:model-value="accounts = $event"
    @remove="removeAccount"
  />
</template>

<script setup lang="ts">
import DynamicForm from '@/components/DynamicForm.vue'
import { financialAccountsSchema } from '@/schemas/financialAccounts.schema'
</script>
```

### 3. Use in PDF Generation

```typescript
import { addSchemaSectionToPDF } from '@/pdf/schemaToPdf'
import { financialAccountsSchema } from '@/schemas/financialAccounts.schema'

addSchemaSectionToPDF(
  financialAccountsSchema,
  data.financialAccounts,
  data,         // Full data context for lookups (beneficiaries, people, etc.)
  addTitle,
  addSectionHeader,
  addField,
  ensureSpace
)
```

## Field Types

- `text` - Standard text input
- `textarea` - Multi-line text input
- `number` - Numeric input
- `email` - Email input
- `tel` - Telephone input
- `date` - Date picker
- `select` - Dropdown select
- `checkbox` - Boolean checkbox
- `radio` - Radio button group
- `currency` - Currency formatted input
- `password` - Password input (masked, supports manual entry)
- `array` - Nested array of items (e.g., `multiSigConfig.keys[]`)
- `custom` - Custom component (e.g., BeneficiarySelector)

## Validation

Fields support declarative validation rules that are enforced on blur:

```typescript
{
  name: 'email',
  label: 'Email',
  type: 'email',
  validation: {
    pattern: '^[^@]+@[^@]+\\.[^@]+$',
    message: 'Please enter a valid email address',
  },
}
```

```typescript
{
  name: 'age',
  label: 'Age',
  type: 'number',
  validation: {
    min: 0,
    max: 150,
    message: 'Age must be between 0 and 150',
  },
}
```

For text fields, `min` and `max` apply to string length. For `number` and `currency` fields, they apply to the numeric value.

Validation errors appear inline below the field with `role="alert"` for screen reader accessibility. The input border turns red when touched and invalid.

## Field Dependencies

Fields can auto-populate based on other fields using `dependsOn`:

```typescript
{
  name: 'displayName',
  label: 'Display Name',
  type: 'text',
  dependsOn: {
    field: 'institution',
    transform: (value) => `${value} Account`,
  },
}
```

The dependent field auto-populates when the source field changes, but only if the dependent field is currently empty (won't overwrite user input).

## Dynamic Options

Select and radio fields can populate their options dynamically from store data:

```typescript
{
  name: 'assignedPerson',
  label: 'Assigned To',
  type: 'select',
  optionsFrom: {
    source: 'people',          // Path in store.data
    labelField: 'name',        // Field to use as label
    valueField: 'id',          // Field to use as value
    filter: (item) => !!item.name,  // Optional filter
  },
}
```

When `optionsFrom` is defined, it takes precedence over static `options`. If the source data is empty or unavailable, it falls back to the static `options` array.

## Manual Entry for Sensitive Fields

For sensitive fields like passwords, PINs, seed phrases, and keys, you can enable a "manual entry" option that allows users to leave blank spaces in the PDF for security purposes.

```typescript
{
  name: 'masterPassword',
  label: 'Master Password',
  type: 'password',
  manualEntry: true, // Enables checkbox: "Leave space in PDF for manual entry"
}
```

When `manualEntry` is enabled:
- A checkbox appears below the field: "Leave space in PDF for manual entry"
- The checkbox value is stored in `${fieldName}ManualEntry` (or custom name via `manualEntryFieldName`)
- In the PDF, if checked, shows: `___________________________ (write manually)`
- In the PDF, if not checked, shows the actual value

## Conditional Visibility

Fields can be shown/hidden based on other field values:

```typescript
{
  name: 'accountName',
  label: 'Account Name',
  type: 'text',
  visible: {
    field: 'accountCategory',
    operator: 'equals',
    value: 'trust',
  },
}
```

Supported operators:
- `equals` - Field equals value
- `notEquals` - Field does not equal value
- `contains` - Field contains value (string)
- `isEmpty` - Field is empty/null/undefined/empty array
- `isNotEmpty` - Field has a value

Multiple conditions (AND logic):
```typescript
visible: [
  { field: 'accountCategory', operator: 'equals', value: 'trust' },
  { field: 'hasAccountName', operator: 'equals', value: true },
]
```

Compound AND within a single condition:
```typescript
visible: {
  field: 'storageType',
  operator: 'equals',
  value: 'single-sig',
  and: [{ field: 'isCustodial', operator: 'equals', value: false }],
}
```

Supports nested field paths:
```typescript
visible: {
  field: 'multiSigConfig.requiredSignatures',
  operator: 'equals',
  value: 2,
}
```

## Help Text

Fields support inline help text displayed below the input:

```typescript
{
  name: 'secretKey',
  label: 'Secret Key',
  type: 'password',
  helpText: 'Found in your 1Password settings under "My Profile"',
}
```

Help text is linked to the input via `aria-describedby` for screen reader accessibility.

## Custom Components

For special UI requirements, use the `component` property to render a custom Vue component:

```typescript
{
  name: 'beneficiaries',
  label: 'Beneficiaries',
  type: 'custom',
  component: 'BeneficiarySelector',
  componentProps: { maxItems: 5 },
}
```

Registered custom components: `BeneficiarySelector`, `TrustSelector`, `PersonSelector`, `RecoveryInstructionsButton`.

## Expandable Sections

For optional sections that don't need a checkbox, you can use expandable/collapsible sections:

```typescript
{
  name: 'walletBackupFileName',
  label: 'Backup File Name',
  type: 'text',
  expandableSectionId: 'walletBackup',
  expandableSectionLabel: 'Wallet Backup File',
  expandableSectionDefaultExpanded: false, // Optional, defaults to false
}
```

All fields with the same `expandableSectionId` will be grouped together in a collapsible section. The section label is taken from the first field's `expandableSectionLabel` (or `label` if not specified).

Nested expandable sections are supported — the `ExpandableSection` component uses a slot-based design, so expandable sections can be nested by placing fields with different `expandableSectionId` values within a parent section.

## Layout

Fields render into a 2-column responsive grid by default. Two layout properties control how a field is sized:

```typescript
{
  name: 'institution',
  label: 'Institution',
  type: 'text',
  colSpan: 1,        // 1 = half-width (default), 2 = full-width within the grid
  fullWidth: true,   // Force the field to span the full row regardless of grid
}
```

Use `colSpan: 2` when you want a field to take both grid columns. Use `fullWidth: true` for fields like `textarea` or custom components that should always be full-width.

## Section Dividers

For purely visual grouping inside a single schema (no collapsing, no checkbox), use a `sectionDivider` field. It is a label-only entry that draws a heading and (optionally) a top border:

```typescript
{
  sectionDivider: {
    label: 'Recovery Information',
    showBorder: true, // default true
  },
}
```

Section divider entries do not need `name`, `label`, or `type` — they are render-only.

## Nested Array Fields

Some sections need an array nested *inside* a single item — for example, `multiSigConfig.keys[]` inside a crypto asset. Use the `array` field type with an `arraySchema`:

```typescript
{
  name: 'keys',
  label: 'Multisig Keys',
  type: 'array',
  arraySchema: keyItemSchema,    // a FormSectionSchema describing a single key
  arrayAllowAdd: true,           // default true — show "Add" button
  arrayAllowRemove: true,        // default true — show "Remove" button on each row
}
```

The `arraySchema` is itself a full `FormSectionSchema`, so nested arrays can have their own fields, validation, conditional visibility, and even further nested arrays.

## Custom Array Item Initialization

By default new array items are added as empty objects. To generate IDs or seed defaults, provide `initializeItem` on the section schema:

```typescript
export const trustsSchema: FormSectionSchema = {
  sectionKey: 'trusts',
  title: 'Trusts',
  isArray: true,
  initializeItem: () => ({
    id: `trust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    trustName: '',
  }),
  fields: [ /* ... */ ],
}
```

## Conditional Sections

Whole sections can be hidden/shown using the same `VisibilityCondition` syntax as fields, by setting `visible` on the section schema itself:

```typescript
export const businessOwnershipSchema: FormSectionSchema = {
  sectionKey: 'businessOwnership',
  title: 'Business Ownership',
  visible: { field: 'hasBusiness', operator: 'equals', value: true },
  fields: [ /* ... */ ],
}
```

When the condition is false, the section is omitted from both the form UI and PDF output.

## PDF-Specific Field Options

Fields can customize how they appear in PDF output without affecting the form UI:

```typescript
{
  name: 'balance',
  label: 'Balance',
  type: 'currency',
  pdfLabel: 'Account Balance',                       // Override label in PDF only
  pdfFormat: (value) => `$${Number(value).toFixed(2)}`, // Custom PDF formatter
  pdfSkipIfEmpty: true,                              // Omit field from PDF when empty
}
```

- `pdfLabel` — alternate label used only in the PDF (form keeps `label`).
- `pdfFormat` — function that returns the string to print in the PDF.
- `pdfSkipIfEmpty` — when true, an empty value is omitted from the PDF rather than rendered as blank.

## Accessibility

All form inputs include:
- `aria-required` when the field is marked `required`
- `aria-invalid` when validation fails (after the field has been touched)
- `aria-describedby` linking to help text and error messages
- `role="alert"` on inline error messages for screen reader announcement
- `aria-labelledby` on radio groups
- `role="radiogroup"` on radio containers

## Schema Registry

All schemas are registered in `src/schemas/index.ts` and can be looked up by key or group:

```typescript
import { getSchema, getSchemasByGroup } from '@/schemas'

const schema = getSchema('financialAccounts')  // Single schema by key
const grouped = getSchemasByGroup()             // All schemas grouped by pdfGroup
```

The registry organizes schemas into 8 groups matching the PDF layout:
- People & Contacts
- Security & Access
- Insurance, Medical & Benefits
- Finances
- Digital & Crypto Assets
- Property & Household
- Documents & Storage
- Final Wishes

## Migration Strategy

1. **Start with Simple Sections**: Begin with straightforward forms like Financial Accounts
2. **Test Thoroughly**: Ensure schema-based forms work identically to existing forms
3. **Migrate Incrementally**: Convert one section at a time
4. **Update PDF Generator**: Use `schemaToPdf.ts` helpers for new sections
5. **Keep Old Code**: Don't delete old views until migration is complete

## Testing

Tests are in `src/*/__tests__/` directories and run with `npx vitest run`:

- **FormSchema.test.ts** — Visibility evaluation, compound conditions, nested paths, `getVisibleFields`
- **registry.test.ts** — Schema integrity: all groups populated, required properties, no duplicate fields, valid pdfGroup values
- **useSectionProgress.test.ts** — `hasSectionData()` across section paths
- **encryption.test.ts** — AES-256 encryption round-trip, error cases, unique ciphertext
- **FormField.test.ts** — Component rendering
- **legacy.test.ts** — Store behavior

A fully fictional example vault is available at `examples/sample-vault.json` and can be imported via the Dashboard for manual testing.
