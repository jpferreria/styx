/**
 * @file pkg.ts
 * @module StyxOS/Kernel/PackageManager
 * @description Package manager engine handling spkg update, install, remove, and /etc/spkg.conf.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface PackageMeta {
  name: string;
  version: string;
  description: string;
  installed: boolean;
}

export class PackageManager {
  private _kernel: UnixKernel;
  private packages: Map<string, PackageMeta> = new Map();
  private repoMirror: string = "https://pkg.styx-os.org/v1/main";

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;
    this.packages.set("grep", { name: "grep", version: "3.8-1", description: "POSIX regex pattern search", installed: false });
    this.packages.set("curl", { name: "curl", version: "7.88-2", description: "HTTP socket transfer utility", installed: true });
    this.packages.set("nano", { name: "nano", version: "7.2-1", description: "Interactive text editor", installed: true });
    this.packages.set("top", { name: "top", version: "4.0-1", description: "System performance monitor", installed: true });
  }

  generateEtcSpkgConf(): string {
    const pid = this._kernel ? this._kernel.sys_getpid() : 1;
    return `# /etc/spkg.conf: Styx OS Package Repository Configuration (PID ${pid})\nmirror=${this.repoMirror}\narchitecture=wasm32-wasi\n`;
  }

  async update(): Promise<string> {
    // Simulate repository mirror index update
    await new Promise((r) => setTimeout(r, 20));
    return `Hit:1 ${this.repoMirror} main Release\nReading package lists... Done\nUpdated 4 package index manifests.\n`;
  }

  list(): string {
    const lines: string[] = ["PACKAGE    VERSION   STATUS      DESCRIPTION"];
    for (const pkg of this.packages.values()) {
      const status = pkg.installed ? "installed" : "available";
      lines.push(`${pkg.name.padEnd(10)} ${pkg.version.padEnd(9)} ${status.padEnd(11)} ${pkg.description}`);
    }
    return lines.join("\n") + "\n";
  }

  install(pkgName: string): boolean {
    const pkg = this.packages.get(pkgName);
    if (!pkg) return false;
    pkg.installed = true;
    return true;
  }

  remove(pkgName: string): boolean {
    const pkg = this.packages.get(pkgName);
    if (!pkg || !pkg.installed) return false;
    pkg.installed = false;
    return true;
  }
}
