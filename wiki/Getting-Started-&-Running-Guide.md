# Getting Started & Running Guide

This guide details how to set up, build, test, and run **Styx OS** locally.

---

## ⚙️ Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Rust & Cargo** (optional, for rebuilding `packages/kernel` WebAssembly core): `rustc`, `cargo`, `wasm-pack`

---

## 🚀 Setup & Installation

Clone the Styx OS repository and install workspace dependencies:

```bash
git clone https://github.com/jpferreria/styx.git
cd styx
npm install
```

---

## 💻 Running the Local Development Server

To launch Styx OS in your browser:

```bash
cd packages/shell-ui
npm run dev
```

Open your web browser and navigate to **`http://localhost:5173/`** (or the URL printed in terminal output).

---

## 🧪 Running Automated Tests

Styx OS uses **Vitest** for unit and integration testing across all kernel modules, syscalls, and UI components.

To run the complete test suite:

```bash
cd packages/shell-ui
npm test
```

Expected output:
```text
 Test Files  54 passed (54)
      Tests  161 passed (161)
   Duration  4.59s
```

---

## 📦 Building for Production

To compile production bundles for deployment:

```bash
cd packages/shell-ui
npm run build
```

This compiles TypeScript (`tsc`) and generates optimized production assets in `dist/`.

---

## 🖥 Interacting with Styx OS Desktop & Terminal

### 1. Terminal Shell Features
- **Tab Auto-Completion**: Type command prefixes and hit `Tab` (e.g., `st<Tab>` -> `stty`, `ip<Tab>` -> `ipcmk`, `ipcrm`, `ipcclean`, `ipcs`).
- **Command Pipeline Execution**: Pipe outputs across stages (e.g. `cat /etc/passwd | wc`).
- **Script Execution**: Execute shell scripts directly (e.g. `./demo.sh`).

### 2. Graphical Desktop Applications
- **Desktop Dock**: Click application icons at the bottom dock to open windows:
  - 🌐 **Browser**: Launches the Graphical Web Browser window.
  - 📁 **Files**: Launches the File Explorer window.
  - 📊 **Top**: Launches the Real-Time Process Monitor GUI window.
- **File Explorer & Text Editor**: Double-click any `.txt`, `.sh`, or document file in File Explorer to open it in the Glassmorphism Text Editor. Click `💾 Save` to save modifications back to VFS.
