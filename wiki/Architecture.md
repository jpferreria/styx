# System Architecture & Design

Styx OS (`Styx`) employs a decoupled dual-layer architecture consisting of a **Rust WebAssembly Core Engine** (`packages/kernel`) and a **TypeScript Host Shell & Graphical Web Desktop UI** (`packages/shell-ui`).

---

## 🏗 High-Level Architecture Diagram

```mermaid
graph TD
    subgraph UserInterface ["Graphical Desktop & Terminal Shell Layer (packages/shell-ui)"]
        DESKTOP["Desktop Manager & Glassmorphism UI (wm.ts / dock.ts)"]
        BROWSER["Web Browser Application (browser.ts)"]
        FILE_EXP["File Explorer & Text Editor (wm.ts)"]
        PROC_MON["Real-Time Process Monitor GUI (topgui.ts)"]
        TERM_SHELL["Terminal Shell & xterm.js UI (index.ts / pipeline.ts)"]
    end

    subgraph HostRuntime ["TypeScript Host OS Runtime & Subsystems"]
        VFS_MGR["Virtual Filesystem Driver (procfs.ts / devnodes.ts / sysfs.ts)"]
        IPC_ENG["IPC Engines (shm.ts / mqueue.ts / sem.ts / fifo.ts / ipc.ts)"]
        PROC_ENG["Process Execution & WASI Runner (execve.ts / binaries.ts)"]
        MEM_ENG["Virtual Memory & Page Mapping Engine (mmap.ts / pmap.ts / swap.ts)"]
        TERM_ENG["Termios Line Discipline & PTY Engine (termios.ts / pty.ts)"]
        TIME_ENG["POSIX Time & High-Resolution Timer Engine (time.ts)"]
        LOCK_ENG["Advisory File Locking Subsystem (flock.ts)"]
    end

    subgraph RustWasmCore ["Rust Kernel Core Layer (packages/kernel)"]
        WASM_CORE["Styx WASM Core Module (wasm32-unknown-unknown)"]
        MEMORY_BUS["Memory Allocation & Capability Check Bus"]
    end

    UserInterface --> HostRuntime
    HostRuntime --> RustWasmCore
```

---

## 🧩 Architectural Components

### 1. Rust WebAssembly Core (`packages/kernel`)
- Built using **Rust** and compiled with `wasm-pack`.
- Implements core memory allocation, capability validation, and low-level kernel primitives.
- Targets `wasm32-unknown-unknown`.

### 2. TypeScript OS Runtime & Kernel Subsystems (`packages/shell-ui/src/kernel`)
- **Virtual Filesystem (VFS)**: Mounts root `/`, `/bin`, `/dev`, `/proc`, `/sys`, `/etc`, `/tmp`, `/home/user`. Supports In-Memory VFS and OPFS (Origin Private File System) persistence.
- **Process & Binary Execution**: WASI process runner (`execve.ts`) executing compiled WebAssembly binaries in `/bin` (`/bin/hello.wasm`, `/bin/calc.wasm`, `/bin/curl.wasm`, `/bin/top.wasm`, `/bin/stty.wasm`, `/bin/mmap.wasm`, etc.).
- **Inter-Process Communication (IPC)**:
  - System V & POSIX Shared Memory (`shm.ts`).
  - POSIX Message Queues (`mqueue.ts`).
  - POSIX Named Semaphores (`sem.ts`).
  - POSIX Named Pipes / FIFOs (`fifo.ts`).
  - Unified IPC Inspector & Cleanup (`ipc.ts`).
- **Memory & Page Management**:
  - POSIX Memory Mapping (`mmap.ts`).
  - Memory Map Inspector (`pmap.ts`).
  - Virtual Swap Space (`swap.ts`).
- **Terminal & TTY Discipline**:
  - Pseudoterminal Master/Slave Devices (`pty.ts`, `/dev/ptmx`, `/dev/pts/0`).
  - Termios Line Discipline (`termios.ts`, `stty`, `tcgetattr`, `tcsetattr`).
- **Time & Timers**:
  - `CLOCK_REALTIME` and `CLOCK_MONOTONIC` (`time.ts`).
  - High-precision sleep (`nanosleep`).
  - POSIX timers (`timer_create`).

### 3. Glassmorphism Window Manager & Applications (`packages/shell-ui/src/shell`)
- **Window Manager (`wm.ts`)**: Manages window positioning, Z-index stacking, dragging, minimizing, maximizing, and closing.
- **Web Browser Window (`browser.ts`)**: Built-in graphical web browser rendering web pages, handling HTTP/HTTPS URLs, address bar, refresh, and iframe isolation.
- **File Explorer & Text Editor**: Double-click text file handler opening glassmorphism text editor with `Save` sync to VFS.
- **Real-Time Process Monitor GUI**: Visual process inspector showing PID, memory, CPU usage, and state.
- **xterm.js Terminal Shell**: Glassmorphism terminal container with ANSI TrueColor rendering, Tab auto-completion, and history navigation.
