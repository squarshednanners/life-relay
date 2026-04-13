# Life Relay

A privacy-first, offline-capable web app for organizing your critical information, estate plans, and digital assets — so your loved ones aren't left guessing.

Live site: **[liferelay.app](https://liferelay.app)**

## Features

- **Privacy-First** — Runs entirely in your browser. No accounts, no servers, no tracking.
- **Local Storage** — Data lives in IndexedDB on your device, with a localStorage fallback.
- **Encrypted Exports** — AES-256-GCM (PBKDF2 / 100k iterations) password-protected JSON backups.
- **Multiple PDF Exports** — Full vault, one-page emergency sheet, and attorney preparation summary.
- **Estate Planning Guide** — Guided checklist that produces an attorney-prep PDF.
- **Schema-Driven** — Forms and PDFs are both generated from a single set of schema definitions.
- **Installable PWA** — Works offline after first load; install on desktop or mobile.
- **26 Sections, 8 Groups** — People, Security, Insurance/Medical, Finances, Digital/Crypto, Property, Documents, Final Wishes.

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
│   ├── components/      # Reusable Vue components (DynamicForm, FieldRenderer, etc.)
│   ├── views/           # Page views/routes (one per section, plus Dashboard, Welcome)
│   ├── router/          # Vue Router configuration
│   ├── store/           # Pinia store
│   ├── models/          # TypeScript interfaces (DeathboxData, FormSchema)
│   ├── schemas/         # Declarative form schemas (one per section) + registry
│   ├── services/        # Data stores (LocalDataStore, CloudDataStore stub)
│   ├── pdf/             # PDF generators (full vault, emergency sheet, attorney prep)
│   ├── utils/           # Encryption, icons, helpers
│   ├── data/            # Static content (templates, will-prep categories)
│   └── composables/     # Vue composables (toast, progress, unsaved-changes)
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

MIT
