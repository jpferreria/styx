/**
 * @file history.ts
 * @module StyxOS/Kernel/History
 * @description Shell command history engine, ~/.bash_history file sync, and Tab auto-completion.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

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
}
