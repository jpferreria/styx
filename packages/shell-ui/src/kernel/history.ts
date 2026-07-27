/**
 * @file history.ts
 * @module StyxOS/Kernel/History
 * @description Shell command history engine, ~/.bash_history file sync, and Tab auto-completion for commands and VFS file paths.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export class HistoryManager {
  private history: string[] = [];

  constructor() {
    this.add("ls -la");
    this.add("cat /etc/passwd");
    this.add("whoami");
  }

  add(command: string): void {
    const trimmed = command.trim();
    if (trimmed && this.history[this.history.length - 1] !== trimmed) {
      this.history.push(trimmed);
    }
  }

  getAll(): string[] {
    return [...this.history];
  }

  formatHistory(): string {
    const lines: string[] = [];
    this.history.forEach((cmd, idx) => {
      lines.push(`${(idx + 1).toString().padStart(5)}  ${cmd}`);
    });
    return lines.join("\n") + "\n";
  }

  generateBashHistory(): string {
    return this.history.join("\n") + "\n";
  }

  autoComplete(partial: string, availableCommands: string[]): string[] {
    if (!partial) return [];
    return availableCommands.filter((cmd) => cmd.startsWith(partial));
  }

  autoCompletePath(partialPath: string, kernel: UnixKernel): { candidates: string[]; completion: string } {
    if (!partialPath) return { candidates: [], completion: "" };

    const lastSlashIdx = partialPath.lastIndexOf("/");
    let parentDir = ".";
    let filePrefix = partialPath;

    if (lastSlashIdx !== -1) {
      parentDir = partialPath.substring(0, lastSlashIdx) || "/";
      filePrefix = partialPath.substring(lastSlashIdx + 1);
    }

    try {
      const entries = kernel.sys_readdir(parentDir);
      const matches = entries.filter((e: any) => e.name.startsWith(filePrefix));
      const candidates = matches.map((e: any) => (e.isDir ? `${e.name}/` : e.name));

      if (candidates.length === 1) {
        const fullMatch = candidates[0];
        const completion = fullMatch.substring(filePrefix.length);
        return { candidates, completion };
      }

      return { candidates, completion: "" };
    } catch {
      return { candidates: [], completion: "" };
    }
  }
}
