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
