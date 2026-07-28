/**
 * @file man.ts
 * @module StyxOS/Kernel/ManualManager
 * @description POSIX Manual Page Subsystem serving man pages for all Styx OS system commands.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface ManualEntry {
  name: string;
  summary: string;
  synopsis: string;
  description: string;
  options?: string;
  examples?: string;
}

export class ManualManager {
  private pages: Map<string, ManualEntry> = new Map();

  constructor() {
    this.register({
      name: "spkg",
      summary: "Styx OS package manager & system export utility",
      synopsis: "spkg [update|list|install|remove|export] [package|path]",
      description: "spkg manages software packages from repository mirrors and exports VFS user directories to backup archives.",
      options: "  update           Update repository package manifests\n  list             List all packages and installation status\n  install <pkg>    Install target Wasm package\n  remove <pkg>     Remove installed package\n  export [path]    Export VFS directory to downloadable backup archive",
      examples: "  spkg update\n  spkg install grep\n  spkg export /home/user",
    });

    this.register({
      name: "top",
      summary: "display Styx OS system processes and performance statistics",
      synopsis: "top",
      description: "top displays live CPU usage, VFS memory allocation, Web Worker futex sync thread counts, and active process tasks.",
      examples: "  top",
    });

    this.register({
      name: "nano",
      summary: "interactive Styx OS text editor",
      synopsis: "nano [file]",
      description: "nano is an interactive terminal text editor allowing viewing and modifying files directly inside the VFS.",
      examples: "  nano /home/user/README.txt",
    });

    this.register({
      name: "ping",
      summary: "send ICMP ECHO_REQUEST to network hosts",
      synopsis: "ping [host]",
      description: "ping tests network connectivity and latency round-trip time against virtual or external socket targets.",
      examples: "  ping google.com\n  ping 127.0.0.1",
    });

    this.register({
      name: "cron",
      summary: "daemon to execute scheduled commands",
      synopsis: "cron | crontab -l",
      description: "cron runs background periodic scheduled tasks configured in /etc/crontab.",
      examples: "  crontab -l",
    });

    this.register({
      name: "dmesg",
      summary: "print or control the kernel ring buffer",
      synopsis: "dmesg",
      description: "dmesg displays the Styx OS kernel boot sequence logs, device driver initializations, and system diagnostic events.",
      examples: "  dmesg | grep VFS",
    });

    this.register({
      name: "history",
      summary: "GNU History Library command line history",
      synopsis: "history",
      description: "history displays the numbered list of previously executed terminal commands, synced with ~/.bash_history.",
      examples: "  history",
    });

    this.register({
      name: "bench",
      summary: "Styx OS system performance benchmark suite",
      synopsis: "bench",
      description: "bench executes VFS 10MB write throughput tests, memory allocation benchmarks, and syscall latency timing.",
      examples: "  bench",
    });

    this.register({
      name: "lspci",
      summary: "list all PCI devices",
      synopsis: "lspci",
      description: "lspci reads /sys/bus/pci/devices to probe virtual PCI graphics controllers and Web Audio DSP devices.",
      examples: "  lspci",
    });

    this.register({
      name: "lsusb",
      summary: "list USB devices",
      synopsis: "lsusb",
      description: "lsusb reads /sys/bus/usb/devices to probe virtual USB HID keyboard and mouse devices.",
      examples: "  lsusb",
    });

    this.register({
      name: "vim",
      summary: "Vi IMproved, a programmers text editor",
      synopsis: "vim [file]",
      description: "vim is a modal terminal text editor. It supports NORMAL mode (h/j/k/l movement, dd line delete), INSERT mode (typing text, ESC to return), and COMMAND mode (:w save, :q quit, :wq save & quit).",
      options: "  i       Switch to INSERT mode\n  :       Switch to COMMAND mode\n  h/j/k/l Cursor movement\n  dd      Delete current line\n  :w      Save file\n  :q      Quit editor\n  :wq     Save and quit",
      examples: "  vim /home/user/README.txt\n  vim /etc/environment",
    });

    this.register({
      name: "pty",
      summary: "pseudoterminal multiplexer session manager",
      synopsis: "pty [list|create]",
      description: "pty manages master /dev/ptmx and slave /dev/pts/* pseudoterminal multiplexer session devices.",
      examples: "  pty\n  pty list",
    });

    this.register({
      name: "ifconfig",
      summary: "configure network interface parameters",
      synopsis: "ifconfig [interface]",
      description: "ifconfig displays network interface statistics, IP addresses, netmasks, MAC addresses, and packet counts for lo and eth0.",
      examples: "  ifconfig\n  ifconfig eth0",
    });

    this.register({
      name: "theme",
      summary: "customizable desktop GUI theme engine",
      synopsis: "theme [dark|cyberpunk|retro|light]",
      description: "theme manages and switches desktop GUI visual presets (Dark Glassmorphism, Cyberpunk Neon, Classic Retro UNIX, Light Mode).",
      examples: "  theme\n  theme cyberpunk\n  theme retro\n  theme light",
    });

    this.register({
      name: "sh",
      summary: "command language interpreter",
      synopsis: "sh [-x] [script.sh] [args...]",
      description: "sh is the standard POSIX shell script interpreter evaluating commands, variable expansions, and control flow statements. With -x, outputs line-by-line debug traces (+ line [N]: command).",
      options: "  -x    Enable line-by-line debug trace execution mode",
      examples: "  sh /home/user/demo.sh\n  sh -x /home/user/demo.sh",
    });

    this.register({
      name: "swapon",
      summary: "enable/disable devices and files for paging and swapping",
      synopsis: "swapon [-a|-s] / swapoff",
      description: "swapon enables and queries Virtual Swap File (/var/swap) memory page swapping metrics.",
      options: "  -s    Display swap device summary statistics\n  -a    Enable all swap devices",
      examples: "  swapon\n  swapon -s\n  swapoff",
    });

    this.register({
      name: "sysbench",
      summary: "system performance profiler & benchmark tool",
      synopsis: "sysbench [cpu|disk|mem]",
      description: "sysbench evaluates CPU prime number calculation performance, VFS disk I/O throughput, and memory bandwidth allocation.",
      examples: "  sysbench\n  sysbench cpu\n  sysbench disk\n  sysbench mem",
    });

    this.register({
      name: "getfattr",
      summary: "get POSIX extended attributes of VFS filesystem objects",
      synopsis: "getfattr [-d] <path>",
      description: "getfattr displays extended attribute names and values associated with VFS file paths.",
      options: "  -d    Dump all extended attribute names and values",
      examples: "  getfattr -d /home/user/README.txt",
    });

    this.register({
      name: "setfattr",
      summary: "set POSIX extended attributes of VFS filesystem objects",
      synopsis: "setfattr -n <name> -v <val> <path>",
      description: "setfattr associates custom key-value extended attribute metadata with specified VFS file paths.",
      options: "  -n    Extended attribute name (e.g. user.comment)\n  -v    Extended attribute value",
      examples: "  setfattr -n user.comment -v 'Styx Backup' /home/user/README.txt",
    });

    this.register({
      name: "alias",
      summary: "define or display shell command line aliases",
      synopsis: "alias [name=command] / unalias <name>",
      description: "alias defines command line shortcuts for quick terminal execution. Running alias without arguments lists active aliases.",
      examples: "  alias\n  alias ll='ls -l'\n  unalias ll",
    });

    this.register({
      name: "top-gui",
      summary: "real-time desktop process monitor & performance chart GUI",
      synopsis: "top-gui",
      description: "top-gui launches an interactive desktop window displaying live process load, CPU/memory progress bars, and PID tables.",
      examples: "  top-gui",
    });

    this.register({
      name: "ipcs",
      summary: "IPC facility status inspector (shared memory /dev/shm & message queues /dev/mqueue)",
      synopsis: "ipcs [-m] [-q]",
      description: "ipcs displays information on active System V / POSIX shared memory segments and message queues.",
      options: "  -m    Display active shared memory segment statistics\n  -q    Display active POSIX message queue statistics",
      examples: "  ipcs\n  ipcs -m\n  ipcs -q",
    });

    this.register({
      name: "mqueue",
      summary: "POSIX inter-process message queue facility",
      synopsis: "mqueue",
      description: "mqueue inspects active message queues mounted inside /dev/mqueue.",
      examples: "  mqueue",
    });

    this.register({
      name: "termcolor",
      summary: "ANSI TrueColor (24-bit RGB) and 256-color palette renderer",
      synopsis: "termcolor / color",
      description: "termcolor displays a 256-color matrix and TrueColor RGB spectrum diagnostic test grid.",
      examples: "  termcolor\n  color",
    });

    this.register({
      name: "pmap",
      summary: "report memory map of a process",
      synopsis: "pmap [pid]",
      description: "pmap reports the virtual memory mapping structure of a process, including heap, stack, code, and shared memory segments.",
      examples: "  pmap\n  pmap 1\n  pmap 2",
    });

    this.register({
      name: "lscpu",
      summary: "display information about the CPU architecture",
      synopsis: "lscpu",
      description: "lscpu gathers CPU architecture information such as number of CPUs, cores, sockets, NUMA nodes, CPU family & model, CPU MHz, caches, and instruction set flags.",
      examples: "  lscpu\n  lspci\n  lsusb",
    });

    this.register({
      name: "epoll",
      summary: "I/O event notification facility",
      synopsis: "epoll",
      description: "epoll is a scalable I/O event notification mechanism. It monitors multiple file descriptors to see if I/O is possible on any of them (EPOLLIN, EPOLLOUT, EPOLLERR).",
      examples: "  epoll\n  eventfd",
    });

    this.register({
      name: "mknod",
      summary: "make block or character special files",
      synopsis: "mknod [path] [c|b] [major] [minor]",
      description: "mknod creates special character or block device nodes with specified major and minor numbers.",
      examples: "  mknod /dev/testc c 10 1\n  mknod /dev/testb b 8 0\n  lsdev",
    });

    this.register({
      name: "browser",
      summary: "launch Styx OS graphical web browser",
      synopsis: "browser [url]",
      description: "browser launches the graphical web browser window with URL address bar, navigation controls, bookmarks, and sandboxed iframe viewport.",
      examples: "  browser\n  browser https://example.com\n  web https://en.m.wikipedia.org/",
    });

    this.register({
      name: "mkfifo",
      summary: "make FIFO (named pipe) special files",
      synopsis: "mkfifo [path]",
      description: "mkfifo creates POSIX named pipe special files for inter-process communication.",
      examples: "  mkfifo /tmp/myfifo\n  lsfifo",
    });

    this.register({
      name: "ldd",
      summary: "print shared object dependencies",
      synopsis: "ldd [binary_path]",
      description: "ldd prints the shared objects required by each program or shared object specified on the command line.",
      examples: "  ldd /bin/hello.wasm\n  ldconfig",
    });

    this.register({
      name: "evtest",
      summary: "input device event monitor",
      synopsis: "evtest",
      description: "evtest monitors and displays real-time input event data from /dev/input/event0 (keyboard) and /dev/input/mice (mouse).",
      examples: "  evtest\n  lsinput",
    });

    this.register({
      name: "sem",
      summary: "POSIX semaphore inspector",
      synopsis: "sem",
      description: "sem inspects and displays POSIX named semaphores and inter-process locking state.",
      examples: "  sem\n  ipcs -s",
    });

    this.register({
      name: "flock",
      summary: "manage locks from shell scripts",
      synopsis: "flock [file] [command]",
      description: "flock manages advisory file locks for inter-process synchronization.",
      examples: "  flock /tmp/lockfile -c \"echo locked\"\n  lslocks",
    });

    this.register({
      name: "stty",
      summary: "change and print terminal line settings",
      synopsis: "stty [-a] [raw|sane|echo|-echo]",
      description: "stty displays or modifies POSIX termios terminal line discipline attributes.",
      examples: "  stty -a\n  stty raw\n  stty sane",
    });

    this.register({
      name: "mmap",
      summary: "map files or devices into memory",
      synopsis: "mmap [file_path]",
      description: "mmap maps files or anonymous memory pages into the virtual process address space.",
      examples: "  mmap /home/user/README.txt\n  lsmaps",
    });

    this.register({
      name: "ipcrm",
      summary: "remove System V and POSIX IPC resources",
      synopsis: "ipcrm [shm|msg|sem] <id|path>",
      description: "ipcrm removes shared memory segments, message queues, or semaphores from the kernel.",
      examples: "  ipcrm shm 1\n  ipcclean\n  ipcs -a",
    });

    this.register({
      name: "time",
      summary: "time a simple command or give resource usage",
      synopsis: "time [command]",
      description: "time runs specified command and reports high-resolution execution duration.",
      examples: "  time ls -la\n  date\n  uptime",
    });

    this.register({
      name: "getcap",
      summary: "examine file capabilities",
      synopsis: "getcap <filename>",
      description: "getcap displays the capabilities of specified executable files.",
      examples: "  getcap /bin/ping.wasm\n  setcap cap_net_bind_service=+ep /bin/ping.wasm",
    });

    this.register({
      name: "ulimit",
      summary: "modify shell process resource limits",
      synopsis: "ulimit [-a] [-n <num>] [-s <size>]",
      description: "ulimit provides control over resources available to shell processes.",
      examples: "  ulimit -a\n  ulimit -n 2048\n  ulimit -s 16384",
    });

    this.register({
      name: "sysinfo",
      summary: "returns system information and statistics",
      synopsis: "sysinfo | uname [-a|-s|-n|-r|-m] | free [-h]",
      description: "sysinfo displays kernel system information, RAM, swap, uptime, and load averages.",
      examples: "  sysinfo\n  uname -a\n  free -h",
    });

    this.register({
      name: "poll",
      summary: "wait for events on file descriptors",
      synopsis: "poll | lspoll",
      description: "poll and lspoll monitor multiple file descriptors, waiting until I/O events trigger.",
      examples: "  lspoll\n  poll",
    });
  }

  register(entry: ManualEntry): void {
    this.pages.set(entry.name, entry);
  }

  getManPage(cmd: string): string {
    const entry = this.pages.get(cmd);
    if (!entry) {
      return `No manual entry for command '${cmd}'. Type 'help' for available commands.\n`;
    }

    const lines: string[] = [
      `${entry.name.toUpperCase()}(1)                 Styx User Manual                 ${entry.name.toUpperCase()}(1)`,
      "",
      "NAME",
      `       ${entry.name} - ${entry.summary}`,
      "",
      "SYNOPSIS",
      `       ${entry.synopsis}`,
      "",
      "DESCRIPTION",
      `       ${entry.description}`,
    ];

    if (entry.options) {
      lines.push("", "OPTIONS", entry.options);
    }

    if (entry.examples) {
      lines.push("", "EXAMPLES", entry.examples);
    }

    lines.push("", `Styx OS v0.1.0-alpha                 2026-07-26                 ${entry.name.toUpperCase()}(1)`);
    return lines.join("\n") + "\n";
  }

  generateManPages(): { path: string; content: string }[] {
    const files: { path: string; content: string }[] = [];
    for (const [cmd] of this.pages.entries()) {
      files.push({
        path: `/usr/share/man/man1/${cmd}.1`,
        content: this.getManPage(cmd),
      });
    }
    return files;
  }
}
