# POSIX Subsystems & Milestone Catalog

Styx OS implements a comprehensive set of **55 POSIX Subsystem Milestones**. Each subsystem includes unit and integration test suites, WASI binaries, command line interfaces, and manual pages.

---

## 📋 Complete Milestone Catalog (Milestones 1–55)

| Milestone | Subsystem / Feature Area | Key Modules / Utilities | Description |
|---|---|---|---|
| **M1–M10** | Core Kernel & Basic Shell | `kernel/index.ts`, `shell/index.ts` | Memory VFS, command parser, fundamental shell commands (`ls`, `cd`, `cat`, `pwd`, `mkdir`, `rm`). |
| **M11–M20** | User Auth, PKG & Process Management | `user.ts`, `pkg.ts`, `execve.ts` | Multi-user authentication (`su`, `sudo`, `/etc/passwd`), package manager (`spkg`), process execution (`ps`, `kill`). |
| **M21–M30** | Environment, Signals, Archives & Network | `env.ts`, `signal.ts`, `archive.ts`, `net.ts` | Environment variables (`env`, `export`), POSIX signals (`kill`, `raise`), tar/gzip archives, TCP socket emulation (`ping`, `curl`). |
| **M31–M35** | Cron, Syslog, History, Benchmarking | `cron.ts`, `log.ts`, `history.ts`, `bench.ts` | Cron tab scheduler (`crontab`), system logging (`syslog`, `dmesg`), shell command history, CPU/RAM benchmarks (`sysbench`). |
| **M36–M40** | SysFS, Man, PTY, Theme & Swap | `sysfs.ts`, `man.ts`, `pty.ts`, `swap.ts` | `/sys` tree, manual pages (`man`), PTY master/slave devices (`/dev/ptmx`), theme switching (`theme`), virtual swap file (`swapon`, `swapoff`). |
| **M41–M45** | Extended Attributes, Aliases, Shared Memory, Message Queues & TermColor | `xattr.ts`, `alias.ts`, `shm.ts`, `mqueue.ts`, `termcolor.ts` | Extended file attributes (`getfattr`, `setfattr`), shell aliases, System V shared memory (`shmget`, `shmat`), POSIX message queues (`mqueue`), ANSI TrueColor & 256-color rendering. |
| **M46** | Event Notification Subsystem | `eventfd.ts` | Asynchronous event notifications via `eventfd()`. |
| **M47** | Named Pipe / FIFO Subsystem | `fifo.ts`, `mkfifo` | POSIX named pipes (`mkfifo`, `lsfifo`) and circular byte-buffer IPC streams. |
| **M48** | Dynamic Linker & Shared Library Loader | `shlib.ts`, `ldd`, `ldconfig` | Shared object resolution (`libc.so.6`, `libm.so.6`, `ld-styx.so.1`), `/etc/ld.so.cache` generation, library inspection (`ldd`). |
| **M49** | Hardware USB/HID Input Subsystem | `input.ts`, `evtest`, `/dev/input/*` | Virtual character nodes (`/dev/input/event0`, `/dev/input/mice`), Linux `input_event` struct dispatching, event inspector (`evtest`, `lsinput`). |
| **M50** | POSIX Semaphore Subsystem | `sem.ts`, `sem_open`, `ipcs -s` | Named POSIX semaphores (`/dev/semaphore/*`), atomic locking (`sem_wait`, `sem_post`), status table formatting (`ipcs -s`). |
| **M51** | Advisory File Locking Subsystem | `flock.ts`, `flock`, `lslocks`, `/proc/locks` | POSIX advisory file locking (`LOCK_SH`, `LOCK_EX`, `LOCK_NB`, `LOCK_UN`), dynamic `/proc/locks` VFS table, lock inspector (`lslocks`). |
| **M52** | Termios Terminal Line Discipline | `termios.ts`, `stty`, `tcgetattr`, `tcsetattr` | Line discipline flags (`ICANON`, `ECHO`, `ISIG`, `OPOST`, `ONLCR`), raw/sane terminal mode toggling, line discipline reporter (`stty -a`). |
| **M53** | Inter-Process Memory Mapping | `mmap.ts`, `mmap`, `munmap`, `msync`, `/proc/self/maps` | Virtual memory page mapping (`MAP_SHARED`, `MAP_PRIVATE`, `MAP_ANONYMOUS`), page protection (`PROT_READ`, `PROT_WRITE`, `PROT_EXEC`), `/proc/self/maps` reporter, mapping inspector (`lsmaps`). |
| **M54** | System V & POSIX IPC Management | `ipc.ts`, `ipcmk`, `ipcrm`, `ipcclean`, `ipcs -a` | IPC resource creation (`ipcmk`), removal (`ipcrm`), garbage collection of orphaned handles (`ipcclean`), unified `ipcs -a` status reporter. |
| **M55** | Time Subsystem & High-Res Timers | `time.ts`, `clock_gettime`, `nanosleep`, `date`, `uptime`, `time` | Clock sources (`CLOCK_REALTIME`, `CLOCK_MONOTONIC`), high-precision sleep (`nanosleep`), POSIX timers (`timer_create`), ISO date (`date`), uptime & load average (`uptime`), command duration benchmarker (`time`). |

---

## 🎯 Additional Features Integrated

- **Graphical Web Browser GUI Window** (`browser.ts`): Built-in web client window rendering HTML/CSS, iframe sandboxing, tabbed navigation, address bar navigation, and URL loading.
- **File Explorer Double-Click Text Editor Integration** (`wm.ts`): Double-clicking text files in File Explorer opens a Glassmorphism text editor with automatic VFS write sync and status indicator (`Saved` / `Modified *`).
- **Direct Shell Script Execution (`pipeline.ts`)**: Direct execution of `.sh` script files (e.g. `./demo.sh`, `/home/user/demo.sh`).
