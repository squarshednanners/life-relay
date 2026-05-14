# Life Relay

A privacy-first, offline-capable web app for organizing your critical information, estate plans, and digital assets — so your loved ones aren't left guessing.

Live site: **[liferelay.app](https://liferelay.app)**

## Features

- **Privacy-First** — Runs entirely in your browser. No accounts, no servers, no tracking.
- **Local Storage** — Data lives in IndexedDB on your device, with a localStorage fallback.
- **Encrypted Exports** — AES-256-GCM (PBKDF2 / 100k iterations) password-protected JSON backups.
- **Multiple PDF Exports** — Full vault, one-page emergency sheet, printable wallet cards, attorney preparation summary, and a For My Family runbook.
- **Estate Planning Guide** — Guided checklist that produces an attorney-prep PDF.
- **For My Family Runbook** — Step-by-step guide your family follows after your death, from the first 48 hours through long-term wrap-up.
- **Document Attachments** — Attach PDFs, deeds, titles, photos, and other binaries directly to records across nine sections (250 MB total cap, 10 attachments per record).
- **CSV & Paste Import** — Bulk-import financial accounts, contacts, and similar tabular data from spreadsheets or clipboard.
- **Schema-Driven** — Forms and PDFs are both generated from a single set of schema definitions.
- **Installable PWA** — Works offline after first load; install on desktop or mobile.
- **36 Sections, 8 Groups** — People, Security, Insurance/Medical, Finances, Digital/Crypto, Property, Documents, Final Wishes.

## Privacy Model

Life Relay was designed so your sensitive information never touches a server:

- All data is stored locally in your browser (IndexedDB).
- No analytics, telemetry, or external requests for your vault data.
- JSON exports can be encrypted with a password you choose (AES-GCM 256, PBKDF2-SHA256 with 100,000 iterations).
- A `cloud` mode exists in the codebase as a stub for optional future sync, but is disabled by default.

If you find a security issue, please open a GitHub issue (or contact the maintainers privately for sensitive reports).

## Tech Stack

- **Vue 3** (Composition API) + **TypeScript**
- **Vite** + **vite-plugin-pwa**
- **Pinia** (state) + **Vue Router**
- **Tailwind CSS**
- **pdf-lib** (client-side PDF generation)
- **Dexie.js** (IndexedDB)
- **Web Crypto API** (AES-GCM-256 encryption)
- **Vitest** + **vue-tsc** for tests and type-checking

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install

```bash
npm install
```

### Develop

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Test

```bash
npm test
```

### Lint / format

```bash
npm run lint
npm run format
```

## Project Structure

```
/
├── src/
│   ├── components/      # Reusable Vue components (DynamicForm, FieldRenderer, AttachmentField, etc.)
│   ├── views/           # Page views/routes (one per section, plus Dashboard, Welcome, Runbook, WillPreparation, Import, Settings)
│   ├── router/          # Vue Router configuration
│   ├── store/           # Pinia store
│   ├── models/          # TypeScript interfaces (DeathboxData, FormSchema)
│   ├── schemas/         # Declarative form schemas (one per section) + registry
│   ├── migrations/      # Forward-only schema-version migrations for stored data
│   ├── services/        # LocalDataStore, AttachmentStore, CSV/paste import sources, CloudDataStore stub
│   ├── pdf/             # PDF generators (full vault, emergency sheet, wallet cards, attorney prep, family runbook)
│   ├── utils/           # Encryption, icons, helpers
│   ├── data/            # Static content (runbook steps, will-prep categories)
│   └── composables/     # Vue composables (toast, progress, unsaved-changes, theme, storage quota)
├── examples/            # Example vault JSON for demoing import
├── environment/         # Local vs cloud build-mode configs
├── public/              # Static assets, PWA manifest, staticwebapp.config.json
└── README_SCHEMA_FRAMEWORK.md  # Detailed docs for the schema framework
```

## Examples

`examples/sample-vault.json` is a fully fictional vault you can import via **Dashboard → Import Vault** to explore the app with realistic-looking data. All names, addresses, account numbers, and identifiers in that file are placeholders.

## Architecture Notes

Life Relay is **schema-driven**: every form section is described once in `src/schemas/*.schema.ts`, and the same schema definition powers the UI (via `DynamicForm`), the PDF output (via `schemaToPdf.ts`), and validation rules. To add or modify a field, edit the schema — both the form and the PDF update automatically.

See [`README_SCHEMA_FRAMEWORK.md`](./README_SCHEMA_FRAMEWORK.md) for the full schema framework reference, including field types, conditional visibility, validation, dependencies, and dynamic options.

## Contributing

Issues and pull requests are welcome. Please:

- Run `npm run lint` and `npm test` before submitting.
- Keep changes scoped — schema changes should update the schema file and any affected PDF/section tests.
- Don't include real personal data in fixtures or examples.

## License

**FSL-1.1-MIT** — Functional Source License, Version 1.1, MIT Future License.

Source-available with a non-compete clause; converts automatically to MIT two years after each release. See [`LICENSE`](./LICENSE) for full terms.
