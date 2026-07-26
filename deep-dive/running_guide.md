# Styx OS Execution, Setup & Deployment Guide

This document provides step-by-step instructions on setting up, running, testing, building, and deploying **Styx OS**.

---

## 1. System Requirements & Prerequisites

Before running Styx OS, ensure your environment meets the following requirements:

- **Node.js:** `v18.0.0` or higher (Recommended: Node.js 20 LTS)
- **Package Manager:** `npm` v9+ or `pnpm` / `yarn`
- **Operating System:** macOS, Linux, or Windows (WSL2 recommended for Windows)
- **Browser Compatibility:** Modern Web Standards compliant browser supporting Web Workers, `SharedArrayBuffer`, WebAssembly, and OPFS (Chrome 100+, Firefox 105+, Safari 16.4+, Edge 100+).

---

## 2. Project Setup & Installation

Clone the repository and install all node module dependencies:

```bash
# Navigate to project directory
cd /Users/jerry/Documents/antigravity/splendid-faraday

# Navigate to Web UI package
cd packages/shell-ui

# Install dependencies
npm install
```

---

## 3. Running the Local Development Server

Launch the Vite local development server:

```bash
npm run dev
```

### Accessing the Web Application:
Open your web browser and navigate to:
```text
http://localhost:5173/
```
*(If port 5173 is occupied, Vite will automatically assign port 5174).*

---

## 4. Running Automated Tests

Run the complete Vitest unit and integration test suite (26 test files, 74 test cases):

```bash
# Run all tests once
npm test

# Run tests in watch mode during development
npx vitest
```

Expected output:
```text
 Test Files  26 passed (26)
      Tests  74 passed (74)
   Start at  21:40:37
   Duration  691ms
```

---

## 5. Building for Production

Compile TypeScript files and create an optimized, minified production distribution bundle:

```bash
npm run build
```

Production build artifacts will be generated in:
```text
packages/shell-ui/dist/
├── index.html
└── assets/
    ├── index-*.js   (Minified JS runtime & Web Workers)
    └── index-*.css  (Glassmorphism CSS desktop styles)
```

---

## 6. Previewing Production Build Locally

Preview the production distribution build locally using Vite:

```bash
npm run preview
```

Navigate to `http://localhost:4173/` in your browser.

---

## 7. Hosting & Deployment Options

### Option A: Static Web Hosting (Vercel / Netlify / GitHub Pages)
1. Build the production bundle (`npm run build`).
2. Deploy the contents of `packages/shell-ui/dist/` to any static web host.

### Option B: Standalone Desktop App (Tauri / Electron)
To package Styx OS as a native desktop executable (`.dmg`, `.exe`, `.AppImage`):

```bash
# Install Tauri CLI
npm install -D @tauri-apps/cli

# Initialize Tauri
npx tauri init --dist-dir "../packages/shell-ui/dist" --dev-path "http://localhost:5173"

# Build native desktop installers
npx tauri build
```

---

## 8. Troubleshooting Common Issues

### Issue: `SharedArrayBuffer is not defined`
- **Cause:** Missing HTTP Cross-Origin Isolation headers (`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`).
- **Fix:** Ensure Vite dev server or production host sends:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`

### Issue: `Port 5173 in use`
- **Fix:** Kill the process running on port 5173 or let Vite auto-select port `5174`.
