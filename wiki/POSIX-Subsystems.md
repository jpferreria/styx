# POSIX Subsystems & Milestone Catalog

Styx OS implements a comprehensive set of **77 POSIX Subsystem Milestones**. Each subsystem includes unit and integration test suites, WASI binaries, command line interfaces, and manual pages.

---

## 📋 Complete Milestone Catalog (Milestones 1–77)

| Milestone | Subsystem / Feature Area | Key Modules / Utilities | Description |
|---|---|---|---|
| **M1–M10** | Core Kernel & Basic Shell | `kernel/index.ts`, `shell/index.ts` | Memory VFS, command parser, fundamental shell commands (`ls`, `cd`, `cat`, `pwd`, `mkdir`, `rm`). |
| **M11–M20** | User Auth, PKG & Process Management | `user.ts`, `pkg.ts`, `execve.ts` | Multi-user authentication (`su`, `sudo`, `/etc/passwd`), package manager (`spkg`), process execution (`ps`, `kill`). |
| **M21–M30** | Environment, Signals, Archives & Network | `env.ts`, `signal.ts`, `archive.ts`, `net.ts` | Environment variables (`env`, `export`), POSIX signals (`kill`, `raise`), tar/gzip archives, TCP socket emulation (`ping`, `curl`). |
| **M31–M35** | Cron, Syslog, History, Benchmarking | `cron.ts`, `log.ts`, `history.ts`, `bench.ts` | Cron tab scheduler (`crontab`), system logging (`syslog`, `dmesg`), shell command history, CPU/RAM benchmarks (`sysbench`). |
| **M36–M40** | SysFS, Man, PTY, Theme & Swap | `sysfs.ts`, `man.ts`, `pty.ts`, `swap.ts` | `/sys` tree, manual pages (`man`), PTY master/slave devices (`/dev/ptmx`), theme switching (`theme`), virtual swap file (`swapon`, `swapoff`). |
| **M41–M45** | Extended Attributes, Aliases, Shared Memory, Message Queues & TermColor | `xattr.ts`, `alias.ts`, `shm.ts`, `mqueue.ts`, `termcolor.ts` | Extended file attributes (`getfattr`, `setfattr`), shell aliases, System V shared memory (`shmget`, `shmat`), POSIX message queues (`mqueue`), ANSI TrueColor & 256-color rendering. |
| **M46–M50** | Events, FIFOs, Shared Objects, Input & Semaphores | `eventfd.ts`, `fifo.ts`, `shlib.ts`, `input.ts`, `sem.ts` | `eventfd()`, named pipes (`mkfifo`), shared object cache (`ldconfig`, `ldd`), USB/HID input events (`evtest`), POSIX semaphores (`sem_open`). |
| **M51–M55** | Lockf, Termios, Mmap, IPC Management & Time | `flock.ts`, `termios.ts`, `mmap.ts`, `ipc.ts`, `time.ts` | Advisory locks (`flock`), termios line discipline (`stty`), memory mapping (`mmap`), System V IPC (`ipcs -a`), high-res timers (`clock_gettime`). |
| **M56–M60** | Linux Capabilities, Resource Limits, Sysinfo & POSIX Status | `cap.ts`, `rlimit.ts`, `sysinfo.ts`, `system.ts` | Process capabilities (`getcap`, `setcap`), POSIX resource limits (`ulimit`), system hardware info (`sysinfo`), kernel diagnostic suite (`syscheck`). |
| **M61** | Ollama / Gemma LLM Code Sandbox | `sandbox.ts` | In-browser isolated execution sandbox for LLM code generation (`sandbox`). |
| **M62** | POSIX Real-Time Signals & Signal Masks | `signal.ts` | `sigaction`, `sigprocmask`, `sigpending`, `sigsuspend`, `SIGRTMIN`..`SIGRTMAX`. |
| **M63** | POSIX Shared Memory & Semaphores Bridge | `sem.ts`, `shm.ts` | `sem_open`, `shm_open`, `ipcs`. |
| **M64** | WebSockets Socket Proxy Protocol | `socket.ts` | WebSockets TCP/UDP socket proxy bridge (`curl`, `nc`, `ifconfig`, `ping`). |
| **M65** | WASI 0.2 Component Model & WIT Loader | `execve.ts` | WASI Preview 2 Component Model (`\0asm\x0d`) and WIT parser (`wasm-info`). |
| **M66** | EXT4 Virtual Block Driver & OPFS Persistence | `ext4.ts` | 64MB `/dev/sda` block device, EXT4 filesystem driver, OPFS browser sync (`fdisk`, `mkfs.ext4`, `mount`, `umount`). |
| **M67** | POSIX Extended Access Control Lists | `acl.ts` | Per-user and per-group ACL permission control (`getfacl`, `setfacl`). |
| **M68** | POSIX Cgroups v2 Resource Controllers | `cgroup.ts` | `/sys/fs/cgroup`, memory, CPU, and PID limits (`cgcreate`, `cgexec`, `cgset`, `lscgroup`). |
| **M69** | Multi-Process Shared Mutex & Spinlock | `mutex.ts` | Multi-process mutexes and spinlocks (`pthread_mutex_init`, `pthread_mutex_lock`, `mutex`). |
| **M70** | POSIX Record Byte-Range File Locks | `lockf.ts` | Record-level byte-range locking (`lockf`, `fcntl(F_SETLK)`, `lslocks`). |
| **M71** | Local LLM REST/RPC Agent Server | `llm-server.ts` | OpenAI `/v1/chat/completions` REST API & WebSockets JSON-RPC (`ws://localhost:8080/rpc`). |
| **M72** | Terminal Session Multiplexer | `tmux.ts` | Persistent terminal sessions, window tabs, attach/detach (`tmux`). |
| **M73** | Window Manager Compositor & Theme Config | `wm.ts` | Window layout grid snapping (`tile-left`, `tile-right`, `maximize`), glassmorphism filter toggles (`wm-config`). |
| **M74** | One-Click VFS Backup & Exporter | `archive.ts` | VFS directory exporter with browser host `.tar` downloading (`spkg export`). |
| **M75** | Virtual Dynamic Shared Object Loader | `shlib.ts` | Dynamic library linking and symbol resolution (`dlopen`, `dlsym`, `dlclose`, `/lib/*.so`). |
| **M76** | POSIX Shell Script Debugger | `script.ts` | Line-by-line script execution tracing and variable inspector (`sh -x`). |
| **M77** | Interactive Visual VFS Search & Grep | `wm.ts` | GUI VFS File Finder application window with search filtering and previews (`files` / `finder`). |

---

## 🎯 Additional Features Integrated

- **Local LLM Server & Autonomous Agent Execution**: OpenAI REST & WebSockets RPC agent loop executing tools directly into Styx OS.
- **Graphical Web Browser GUI Window** (`browser.ts`): Built-in web client window rendering HTML/CSS, iframe sandboxing, tabbed navigation, address bar navigation, and URL loading.
- **Visual VFS File Finder Window** (`wm.ts`): Interactive file search window with live regex string matching and directory file previews.
- **File Explorer Double-Click Text Editor Integration** (`wm.ts`): Double-clicking text files in File Explorer opens a Glassmorphism text editor with automatic VFS write sync and status indicator (`Saved` / `Modified *`).
- **Direct Shell Script Execution & Tracing (`pipeline.ts`)**: Direct execution of `.sh` script files (`./demo.sh`) and line-by-line debug tracing (`sh -x /home/user/demo.sh`).
