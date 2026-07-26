# Styx OS - Unix-Compatible Browser Kernel

**Styx OS** is a Unix-compatible operating system kernel and runtime environment executing natively inside modern web browsers using **WebAssembly (WASM)**, **TypeScript**, and **Origin Private File System (OPFS)** storage.

```mermaid
graph TD
    subgraph BrowserUI ["Browser UI Layer"]
        XT["Xterm.js Terminal"]
        UI["Styx Kernel Controls & Status Bar"]
    end

    subgraph ShellHost ["TypeScript OS Runtime / Shell"]
        SH["Styx ShellHost Driver"]
        OPFS["OPFS Storage Manager"]
        FSA["File System Access API (Mount Host)"]
    end

    subgraph KernelCore ["Styx Kernel Core Engine"]
        SC["Syscall Dispatcher (open, read, write, stat, execve)"]
        VFS["Virtual File System (VFS)"]
        CAP["Capabilities & Security Model"]
        TTY["Virtual TTY / PTY Driver"]
        EXEC["WASI App Runner (sys_execve)"]
    end

    subgraph StorageNodes ["VFS Storage Nodes"]
        MEM["MemFS (In-RAM / /tmp / /bin)"]
        USER["OPFS Dedicated Storage (/home/user)"]
        DEV["Virtual Devices (/dev/null, /dev/tty)"]
        HOST["Mounted Host Directory (/host)"]
    end

    XT -->|User Commands (e.g. exec /bin/hello.wasm)| SH
    SH -->|Syscall API Calls| SC
    SC --> CAP
    SC --> EXEC
    EXEC -->|Instantiate WASI Module| MEM
    SC --> VFS
    SC --> TTY
    VFS --> MEM
    VFS --> USER
    VFS --> DEV
    VFS --> HOST
    USER <--> OPFS
    HOST <--> FSA
    TTY -->|Render Output Stream| XT
    UI -->|Control Actions| SH
```

## Features

- **POSIX-Compatible Syscall Layer:** Implements `open`, `read`, `write`, `close`, `stat`, `mkdir`, `readdir`, `unlink`, and `execve`.
- **WASI Application Execution (`sys_execve`):** Loads and executes `.wasm` binary applications directly inside the browser kernel.
- **Virtual File System (VFS):** Supports in-memory storage (`MemFS`), persistent user storage (`OPFS`), virtual devices (`/dev/null`, `/dev/tty`), and host directory mounting (`mount-host`).
- **Capabilities & Security:** Fine-grained capability checks (`CAP_STORAGE_ACCESS`, `CAP_PROCESS_EXEC`, `CAP_SYS_ADMIN`, `CAP_DAC_OVERRIDE`).
- **ANSI Terminal:** Xterm.js shell (`user@styx:~$`) supporting commands (`sh`, `exec`, `ls`, `cat`, `echo`, `touch`, `mkdir`, `rm`, `cd`, `pwd`, `stat`, `posix-test`, `mount-host`).
- **Automated Testing:** Vitest unit and integration testing suite verifying POSIX compliance and Wasm execution.

## Running Locally

1. Navigate to the shell UI workspace:
   ```bash
   cd packages/shell-ui
   ```
2. Run test suite:
   ```bash
   npm test
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
