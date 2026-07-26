/**
 * @file log.ts
 * @module StyxOS/Kernel/Logger
 * @description System logging, kernel ring buffer, and /var/log/syslog journal daemon.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  component: string;
  message: string;
}

export class LoggerManager {
  private ringBuffer: LogEntry[] = [];
  private maxEntries = 100;

  constructor() {
    this.log("INFO", "kernel", "Styx OS v0.1.0-alpha booting on WebAssembly runtime...");
    this.log("INFO", "vfs", "Mounting root filesystem (VNode hierarchy) [OK]");
    this.log("INFO", "opfs", "OPFS persistent storage sync enabled [OK]");
    this.log("INFO", "worker", "SharedArrayBuffer Atomics Futex worker pool initialized [OK]");
    this.log("INFO", "dev", "Character devices mounted: /dev/fb0, /dev/dsp, /dev/urandom [OK]");
    this.log("INFO", "auth", "Loaded /etc/passwd and /etc/shadow authentication nodes [OK]");
  }

  log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", component: string, message: string): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = { timestamp, level, component, message };
    this.ringBuffer.push(entry);

    if (this.ringBuffer.length > this.maxEntries) {
      this.ringBuffer.shift();
    }
  }

  getRingBuffer(): LogEntry[] {
    return [...this.ringBuffer];
  }

  formatDmesg(): string {
    const lines: string[] = [];
    let sec = 0.000000;
    for (const entry of this.ringBuffer) {
      sec += 0.042100;
      lines.push(`[${sec.toFixed(6).padStart(12)}] [${entry.component}] ${entry.message}`);
    }
    return lines.join("\n") + "\n";
  }

  generateSyslog(): string {
    const lines: string[] = [];
    for (const entry of this.ringBuffer) {
      lines.push(`${entry.timestamp} styx ${entry.component}[${entry.level}]: ${entry.message}`);
    }
    return lines.join("\n") + "\n";
  }

  generateAuthLog(): string {
    const lines: string[] = [
      `${new Date().toISOString()} styx su[101]: pam_unix(su:session): session opened for user root by user(uid=1000)`,
      `${new Date().toISOString()} styx sudo[102]: user : TTY=tty1 ; PWD=/home/user ; COMMAND=/bin/spkg`,
    ];
    return lines.join("\n") + "\n";
  }
}
