# Styx OS - Unix-Compatible Browser Kernel (v0.20 "Rivendell")

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Test Suite](https://img.shields.io/badge/Vitest-198%20passed%20%28100%25%29-brightgreen.svg)]()
[![Code Coverage](https://img.shields.io/badge/Kernel%20Coverage-88.08%25-green.svg)]()

**Styx OS** is a POSIX-compatible web-native microkernel operating system and desktop runtime executing natively inside modern web browsers using **WebAssembly (WASI 0.1 & WASI 0.2 Component Model)**, **TypeScript**, **Origin Private File System (OPFS)** block storage, and an **OpenAI / Ollama Compatible Local LLM REST & WebSockets Agent Server**.

---

## 🖥️ Desktop & Terminal Interface

![Styx OS Desktop & Terminal Interface](docs/assets/styx-desktop-ui.png)

---

## 🏛️ Architecture Overview

```mermaid
graph TD
    subgraph ExternalClients ["External Clients & AI Agents"]
        OPENAI_SDK["Python OpenAI / LangChain / AutoGen SDK"]
        CURL_API["curl http://localhost:8080/v1/chat/completions"]
        WS_RPC["WebSockets JSON-RPC (ws://localhost:8080/rpc)"]
    end

    subgraph BrowserUI ["Browser UI & Desktop Layer"]
        XT["Xterm.js Terminal Shell (user@styx:~$)"]
        WM["Graphical Window Manager & Desktop (wm.ts)"]
        GUI_MON["Real-Time Process Monitor GUI (/bin/top-gui.wasm)"]
    end

    subgraph KernelRuntime ["TypeScript OS Kernel Runtime"]
        LLM_SERVER["Local LLM REST/RPC Agent Server (llm-server.ts)"]
        SANDBOX_E["Ollama / Gemma LLM Code Sandbox (sandbox.ts)"]
        WASI_LDR["WASI 0.2 Component Model & WIT Loader (execve.ts)"]
        EXT4_DRV["Virtual EXT4 Block Storage Driver & OPFS Engine (ext4.ts)"]
        SOCKET_PROXY["WebSockets / WebRTC TCP/UDP Proxy Protocol (socket.ts)"]
        POSIX_IPC["POSIX IPC Engine (signal.ts, shm.ts, sem.ts, mutex.ts, lockf.ts)"]
        SECURITY["POSIX Extended ACLs (acl.ts) & Cgroups v2 (cgroup.ts)"]
    end

    subgraph StorageLayer ["Virtual Storage & Devices"]
        MEMFS["In-Memory VFS (MemNode / /bin / /tmp)"]
        DEV_SDA["/dev/sda - 64MB OPFS Persistent Block Storage"]
        PROCFS["Virtual /proc & /sys Filesystem Drivers"]
    end

    OPENAI_SDK & CURL_API & WS_RPC <--> LLM_SERVER
    LLM_SERVER <--> SANDBOX_E
    XT & WM & GUI_MON <--> KernelRuntime
    KernelRuntime <--> WASI_LDR & EXT4_DRV & SOCKET_PROXY & POSIX_IPC & SECURITY
    KernelRuntime <--> MEMFS & DEV_SDA & PROCFS
```

---

## ✨ Key Technical Features in v0.20 "Rivendell"

### 🤖 Local LLM REST/RPC Agent Server (`llm-server.ts`)
- **OpenAI `/v1/chat/completions` API Compatibility:** Point Python OpenAI, LangChain, or AutoGen SDK directly to `http://localhost:8080/v1`.
- **JSON-RPC 2.0 WebSockets Endpoint:** `ws://localhost:8080/rpc` bidirectional real-time event streaming.
- **Kernel Function Call Loop:** Automatically dispatches LLM tool call execution (`run: <command>`) directly into the secure Styx OS kernel sandbox.

### 💾 Virtual EXT4 Block Storage Driver & OPFS Persistence (`ext4.ts`)
- **`/dev/sda` Block Storage:** 64MB virtual block storage device driver formatted with EXT4 superblock layout (`0xEF53`).
- **Browser OPFS Sync:** Synchronizes raw disk blocks with Chrome/Firefox **Origin Private File System (OPFS)** for long-term file persistence.
- **Disk Utilities:** `fdisk -l` GPT partition tool, `mkfs.ext4` formatter, `mount`, and `umount`.

### 📦 WASI 0.2 Component Model & WIT Loader (`execve.ts`)
- **WASI 0.2 Support:** Supports WebAssembly Component Model binaries (`\0asm\x0d`) alongside WASI 0.1 Core Modules (`\0asm\x01`).
- **WIT Parser:** Parses WebAssembly Interface Types (`wasi:cli/command@0.2.0`, `wasi:filesystem/types@0.2.0`).
- **Inspector Tool:** `wasm-info` inspection utility.

### 🛡️ POSIX IPC, Cgroups v2 & Security Subsystems
- **Real-Time Signals:** `sigaction`, `sigprocmask`, `sigpending`, `sigsuspend`, `SIGRTMIN`..`SIGRTMAX`.
- **Shared Memory & Semaphores:** `shm_open`, `shm_unlink`, `sem_open`, `sem_wait`, `sem_post`, `ipcs`.
- **Shared Mutices & Spinlocks:** `pthread_mutex_init`, `pthread_mutex_lock`, `pthread_spin_lock`, `mutex`.
- **Record Byte-Range Locking:** `fcntl(F_SETLK)`, `fcntl(F_GETLK)`, `lockf`, `lslocks`.
- **Cgroups v2 Controllers:** `/sys/fs/cgroup`, `memory.max`, `cpu.max`, `pids.max`, `cgcreate`, `cgexec`, `lscgroup`.
- **POSIX Extended ACLs:** `getfacl`, `setfacl -m` / `-x`, per-user and per-group permission matrix.

---

## 🛠️ Complete CLI Command Reference

| Command Category | Active Commands |
| :--- | :--- |
| **Kernel Core & VFS** | `ls`, `cat`, `pwd`, `mkdir`, `rm`, `cp`, `mv`, `stat`, `chmod`, `chown`, `touch`, `date`, `uptime`, `time` |
| **User & Security** | `whoami`, `su`, `sudo`, `getcap`, `setcap`, `ulimit`, `getfacl`, `setfacl` |
| **Process & IPC** | `ps`, `kill`, `top`, `top-gui`, `signal`, `sigaction`, `sigprocmask`, `ipcs`, `shm_open`, `sem_open`, `mutex`, `lockf`, `lslocks` |
| **Storage & Devices** | `fdisk`, `mkfs.ext4`, `mount`, `umount`, `mknod`, `mkfifo`, `swapon`, `swapoff`, `df`, `free`, `pmap`, `getfattr`, `setfattr` |
| **Networking** | `ifconfig`, `curl`, `nc`, `ping`, `socket` |
| **System & Hardware**| `sysinfo`, `uname`, `dmesg`, `lspci`, `lsusb`, `lscpu`, `hwprobe`, `syscheck`, `posix-status` |
| **Development & LLM**| `llm-server`, `sandbox`, `spkg`, `wasm-info`, `nano`, `vim`, `calc`, `wc`, `draw`, `bench`, `sysbench`, `man` |

---

## 🧪 Test Suite & Code Coverage

- **Vitest Test Suite:** **198 / 198 Tests Passed (100% Success Score)** across 66 test suites.
- **Kernel Code Coverage:** **88.08% Statement Coverage** across kernel core modules.

```bash
cd packages/shell-ui
npm test -- --coverage
```

---

## 🚀 Running Locally

1. Navigate to the shell UI workspace:
   ```bash
   cd packages/shell-ui
   ```
2. Run automated Vitest test suite:
   ```bash
   npm test
   ```
3. Build production bundle:
   ```bash
   npm run build
   ```
4. Launch local development server:
   ```bash
   npm run dev
   # Open http://localhost:5180/
   ```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 or later (GPL-3.0-or-later Copyleft)**. See `LICENSE` for details.
