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
      summary: "Styx OS Package Manager",
      synopsis: "spkg [update | list | install <pkg> | remove <pkg>]",
      description: "spkg is the system package manager for Styx OS. It queries remote/local package indexes, reads /etc/spkg.conf, and manages WASI application binaries.",
      options: "  update      Synchronize repository index manifests\n  list        Display available and installed packages\n  install     Install a target package binary\n  remove      Uninstall a target package binary",
      examples: "  spkg update\n  spkg list\n  spkg install grep",
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
