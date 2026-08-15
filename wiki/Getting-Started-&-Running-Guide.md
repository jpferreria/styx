# Getting Started & Running Guide

This guide details how to set up, build, test, and run **Styx OS** locally.

---

## Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## Setup & Installation

Clone the Styx OS repository and install workspace dependencies:

```bash
git clone https://github.com/jpferreria/styx.git
cd styx
npm install
```

---

## Running the Local Development Server

To launch Styx OS in your browser, you can use the convenience control scripts in the repository root:

```bash
./start.sh
# Server starts on dedicated port 5180: http://localhost:5180/
```

To check server status or stop it:
```bash
./status.sh
./stop.sh
```

Alternatively, launch directly via npm:
```bash
cd packages/shell-ui
npm run dev
```

Open your web browser and navigate to **`http://localhost:5180/`**.

---

## Running Automated Tests

Styx OS uses **Vitest** for unit and integration testing across all kernel modules, syscalls, and UI components.

To run the complete test suite:

```bash
cd packages/shell-ui
npm test
```

Expected output:
```text
 Test Files  67 passed (67)
      Tests  205 passed (205)
   Duration  1.89s
```

---

## Building for Production

To compile production bundles for deployment:

```bash
cd packages/shell-ui
npm run build
```

This compiles TypeScript (`tsc`) and generates optimized production assets in `dist/`.

---

## Interacting with Styx OS Desktop & Terminal

### 1. Terminal Shell Features
- **Tab Auto-Completion**: Type command prefixes and hit `Tab` (e.g., `st<Tab>` -> `stty`, `tm<Tab>` -> `tmux`, `dl<Tab>` -> `dlopen`).
- **Command Pipeline Execution**: Pipe outputs across stages (e.g. `cat /etc/passwd | wc`).
- **Script Execution & Debugging**: Execute shell scripts directly (`./demo.sh`) or trace line-by-line (`sh -x /home/user/demo.sh`).

### 2. Graphical Desktop Applications
- **Desktop Dock**: Click application icons at the bottom dock to open windows:
  - **Browser**: Launches the Web Browser window.
  - **Files / Finder**: Launches the VFS File Finder window.
  - **Top**: Launches the Real-Time Process Monitor GUI window.
- **VFS File Finder & Text Editor**: Double-click any `.txt`, `.sh`, or document file to open it in the Text Editor. Click `Save` to save modifications back to VFS.

---

## Browser Compatibility Note

- **Supported Browsers**: Chrome, Edge, Firefox, Safari, Brave.
- **Native Host Directory Mounting (`mount-host`)**: Requires Chromium-based browsers (Chrome, Edge, Brave) supporting W3C File System Access API (`showDirectoryPicker`). Safari/WebKit does not support native host folder mounting.
