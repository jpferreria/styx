/**
 * @file env.ts
 * @module StyxOS/Kernel/Environment
 * @description POSIX environment variable manager handling /etc/environment, getenv, setenv, and export.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export class EnvironmentManager {
  private envMap: Map<string, string> = new Map();

  constructor() {
    this.envMap.set("PATH", "/bin:/usr/bin");
    this.envMap.set("USER", "user");
    this.envMap.set("SHELL", "/bin/sh");
    this.envMap.set("HOME", "/home/user");
    this.envMap.set("TERM", "xterm-256color");
    this.envMap.set("LANG", "en_US.UTF-8");
  }

  getenv(key: string): string | undefined {
    return this.envMap.get(key);
  }

  setenv(key: string, value: string): void {
    this.envMap.set(key, value);
  }

  unsetenv(key: string): void {
    this.envMap.delete(key);
  }

  getAll(): [string, string][] {
    return Array.from(this.envMap.entries());
  }

  generateEtcEnvironment(): string {
    const lines: string[] = [];
    for (const [key, val] of this.envMap.entries()) {
      lines.push(`${key}="${val}"`);
    }
    return lines.join("\n") + "\n";
  }

  formatEnvOutput(): string {
    const lines: string[] = [];
    for (const [key, val] of this.envMap.entries()) {
      lines.push(`${key}=${val}`);
    }
    return lines.join("\n") + "\n";
  }
}
