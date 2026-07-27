/**
 * @file alias.ts
 * @module StyxOS/ShellHost/AliasManager
 * @description Dynamic shell command alias expansion subsystem (alias / unalias).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export class AliasManager {
  private aliases: Map<string, string> = new Map();

  constructor() {
    this.initDefaults();
  }

  private initDefaults(): void {
    this.aliases.set("ll", "ls -l");
    this.aliases.set("la", "ls -a");
    this.aliases.set("clr", "clear");
  }

  setAlias(name: string, command: string): void {
    this.aliases.set(name.trim(), command.trim());
  }

  getAlias(name: string): string | null {
    return this.aliases.get(name.trim()) || null;
  }

  removeAlias(name: string): boolean {
    return this.aliases.delete(name.trim());
  }

  expandAlias(cmdLine: string): string {
    const trimmed = cmdLine.trim();
    if (!trimmed) return cmdLine;

    const parts = trimmed.split(" ");
    const aliasVal = this.getAlias(parts[0]);

    if (aliasVal) {
      return [aliasVal, ...parts.slice(1)].join(" ");
    }
    return cmdLine;
  }

  listAliases(): string {
    if (this.aliases.size === 0) {
      return "No aliases defined.\n";
    }

    const lines: string[] = [];
    for (const [name, cmd] of this.aliases.entries()) {
      lines.push(`alias ${name}='${cmd}'`);
    }
    return lines.join("\n") + "\n";
  }
}
