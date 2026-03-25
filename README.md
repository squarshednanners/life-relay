# LegacyVault

A privacy-first, offline-capable web application for creating a secure legacy plan — a collection of critical information and instructions for family members.

## Features

- 🔒 **Privacy-First**: Runs entirely client-side, no backend required
- 💾 **Local Storage**: Data stored in IndexedDB, never leaves your device
- 📄 **PDF Export**: Generate comprehensive PDF documents
- 📥 **Import/Export**: JSON backup and restore functionality
- 🎨 **Modern UI**: Clean, intuitive interface built with Tailwind CSS
- ⚡ **Fast**: Built with Vite for lightning-fast development

## Tech Stack

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (State Management)
- Vue Router
- Tailwind CSS
- pdf-lib (PDF Generation)
- Dexie.js (IndexedDB)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
/frontend
  /src
    /components      # Reusable Vue components
    /views           # Page views/routes
    /router          # Vue Router configuration
    /store           # Pinia stores
    /models          # TypeScript interfaces and types
    /services        # Data services (Local, Cloud stubs)
    /pdf             # PDF generation utilities
    /utils           # Helper functions
    /assets          # Static assets
```

## License

MIT

