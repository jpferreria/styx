# API & Syscall Reference

This document provides a reference for core kernel module engines and system call handlers in **Styx OS**.

---

## 🛠 Core Kernel Managers (`UnixKernel`)

| Property | Type / Class | Module File | Primary Responsibilities |
|---|---|---|---|
| `kernel.fileLockEngine` | `FileLockEngine` | `flock.ts` | `lock()`, `unlock()`, `/proc/locks`, `lslocks()` |
| `kernel.termiosEngine` | `TermiosEngine` | `termios.ts` | `tcgetattr()`, `tcsetattr()`, `setRawMode()`, `stty()` |
| `kernel.mmapEngine` | `MMapEngine` | `mmap.ts` | `mmap()`, `munmap()`, `msync()`, `mprotect()`, `/proc/self/maps`, `lsmaps()` |
| `kernel.ipcCleanupEngine` | `IPCCleanupEngine` | `ipc.ts` | `ipcmk()`, `ipcrm()`, `ipcclean()`, `formatIpcsAll()` |
| `kernel.timeEngine` | `TimeEngine` | `time.ts` | `clock_gettime()`, `nanosleep()`, `timer_create()`, `date`, `uptime`, `time` |
| `kernel.shmManager` | `SharedMemoryManager` | `shm.ts` | `shmOpen()`, `readShm()`, `writeShm()`, `shmUnlink()` |
| `kernel.mqueueManager` | `MessageQueueManager` | `mqueue.ts` | `mqOpen()`, `mqSend()`, `mqReceive()`, `mqUnlink()` |
| `kernel.semaphoreManager` | `SemaphoreManager` | `sem.ts` | `semOpen()`, `semWait()`, `semPost()`, `semUnlink()` |
| `kernel.fifoManager` | `FIFOManager` | `fifo.ts` | `mkfifo()`, `lsfifo()`, circular buffer IPC streams |
| `kernel.sharedLibraryEngine` | `SharedLibraryEngine` | `shlib.ts` | `ldd()`, `ldconfig()`, `/etc/ld.so.cache` generation |
| `kernel.inputDeviceEngine` | `InputDeviceEngine` | `input.ts` | `evtest()`, `/dev/input/event0`, `/dev/input/mice` |
| `kernel.ptyManager` | `PtyManager` | `pty.ts` | `createPair()`, `/dev/ptmx`, `/dev/pts/0` |
| `kernel.userManager` | `UserManager` | `user.ts` | User auth (`su`, `sudo`), `/etc/passwd`, capability checking |
| `kernel.pkgManager` | `PackageManager` | `pkg.ts` | Styx Package Manager (`spkg`) |

---

## ⚡ POSIX Syscall Signatures

```typescript
// File Locking (flock.ts)
lock(pid: number, path: string, mode?: "READ" | "WRITE", nonBlocking?: boolean): boolean;
unlock(pid: number, path: string): boolean;

// Termios Line Discipline (termios.ts)
tcgetattr(): Termios;
tcsetattr(settings: Partial<Termios>): void;
setRawMode(): void;
setSaneMode(): void;

// Memory Mapping (mmap.ts)
mmap(path: string, length?: number, prot?: number, flags?: number): MMapRegion;
munmap(startAddr: string): boolean;
msync(startAddr: string): boolean;
mprotect(startAddr: string, newProt: number): boolean;

// IPC Management (ipc.ts)
ipcmk(type: "shm" | "msg" | "sem", param?: number): string;
ipcrm(type: "shm" | "msg" | "sem", target: string): string;
ipcclean(): string;

// Time & Timers (time.ts)
clock_gettime(clockId?: number): Timespec;
clock_settime(clockId: number, sec: number, nsec?: number): void;
nanosleep(reqSec: number, reqNsec?: number): Promise<void>;
timer_create(clockId?: number): PosixTimer;
```
