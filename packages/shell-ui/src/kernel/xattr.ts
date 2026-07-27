/**
 * @file xattr.ts
 * @module StyxOS/Kernel/XAttrManager
 * @description POSIX Extended Attributes subsystem managing key-value VFS metadata (getfattr / setfattr).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export class XAttrManager {
  private kernel: UnixKernel;
  private attributes: Map<string, Map<string, string>> = new Map();

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  private normalizePath(path: string): string {
    if (path.startsWith("/")) return path;
    const cwd = this.kernel.getCwd();
    return cwd === "/" ? `/${path}` : `${cwd}/${path}`;
  }

  setXAttr(path: string, name: string, value: string): void {
    const normPath = this.normalizePath(path);
    let pathMap = this.attributes.get(normPath);
    if (!pathMap) {
      pathMap = new Map();
      this.attributes.set(normPath, pathMap);
    }
    pathMap.set(name, value);
  }

  getXAttr(path: string, name: string): string | null {
    const normPath = this.normalizePath(path);
    const pathMap = this.attributes.get(normPath);
    if (!pathMap) return null;
    return pathMap.get(name) || null;
  }

  listXAttr(path: string): string[] {
    const normPath = this.normalizePath(path);
    const pathMap = this.attributes.get(normPath);
    if (!pathMap) return [];
    return Array.from(pathMap.keys());
  }

  removeXAttr(path: string, name: string): boolean {
    const normPath = this.normalizePath(path);
    const pathMap = this.attributes.get(normPath);
    if (!pathMap) return false;
    return pathMap.delete(name);
  }

  formatGetFAttr(path: string): string {
    const normPath = this.normalizePath(path);
    const names = this.listXAttr(normPath);

    if (names.length === 0) {
      return `# file: ${normPath}\n`;
    }

    const lines: string[] = [`# file: ${normPath}`];
    for (const name of names) {
      const val = this.getXAttr(normPath, name);
      lines.push(`${name}="${val}"`);
    }
    return lines.join("\n") + "\n";
  }
}
