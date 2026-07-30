/**
 * @file acl.ts
 * @module StyxOS/Kernel/AccessControlListEngine
 * @description POSIX Extended Access Control Lists (POSIX ACLs - getfacl, setfacl, per-user/group permissions).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface AclEntry {
  tag: "user" | "group" | "mask" | "other";
  qualifier: string;
  perms: string; // e.g. "rwx", "rw-", "r--"
}

export class AccessControlListEngine {
  private kernel: UnixKernel;
  private fileAcls: Map<string, AclEntry[]> = new Map();

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  getfacl(path: string): string {
    const node = this.kernel.resolvePath(path);
    if (!node) return `getfacl: ${path}: No such file or directory\n`;

    const currentUser = this.kernel.userManager.getCurrentUser().username;
    const normPath = path.startsWith("/") ? path : `/${path}`;
    const lines: string[] = [
      `# file: ${normPath.slice(1) || "."}`,
      `# owner: ${currentUser}`,
      `# group: ${currentUser}`,
    ];

    const entries = this.fileAcls.get(normPath) || [
      { tag: "user", qualifier: "", perms: "rw-" },
      { tag: "group", qualifier: "", perms: "r--" },
      { tag: "other", qualifier: "", perms: "r--" },
    ];

    for (const entry of entries) {
      const qStr = entry.qualifier ? `:${entry.qualifier}` : "";
      lines.push(`${entry.tag}${qStr}:${entry.perms}`);
    }

    return lines.join("\n") + "\n";
  }

  setfacl(args: string[]): string {
    if (args.length < 2) return "Usage: setfacl [-m|-x] <acl_spec> <filename>\n";

    let action = "-m";
    let specIndex = 0;

    if (args[0] === "-m" || args[0] === "-x") {
      action = args[0];
      specIndex = 1;
    }

    const spec = args[specIndex];
    const path = args[specIndex + 1];

    if (!spec || !path) return "setfacl: missing operands\n";

    const node = this.kernel.resolvePath(path);
    if (!node) return `setfacl: ${path}: No such file or directory\n`;

    const normPath = path.startsWith("/") ? path : `/${path}`;
    let entries = this.fileAcls.get(normPath) || [
      { tag: "user", qualifier: "", perms: "rw-" },
      { tag: "group", qualifier: "", perms: "r--" },
      { tag: "other", qualifier: "", perms: "r--" },
    ];

    const parts = spec.split(":");
    const type = parts[0] === "u" ? "user" : parts[0] === "g" ? "group" : parts[0] === "m" ? "mask" : "other";
    const qual = parts[1] || "";
    const perms = parts[2] || "rw-";

    if (action === "-m") {
      const existing = entries.find((e) => e.tag === type && e.qualifier === qual);
      if (existing) {
        existing.perms = perms;
      } else {
        entries.push({ tag: type as any, qualifier: qual, perms });
      }
    } else if (action === "-x") {
      entries = entries.filter((e) => !(e.tag === type && e.qualifier === qual));
    }

    this.fileAcls.set(normPath, entries);
    return `setfacl: updated POSIX ACL for ${path}\n`;
  }

  checkAccess(path: string, user: string, _groups: string[] = []): boolean {
    const normPath = path.startsWith("/") ? path : `/${path}`;
    const entries = this.fileAcls.get(normPath);
    if (!entries) return true;

    const userRule = entries.find((e) => e.tag === "user" && e.qualifier === user);
    if (userRule) {
      return userRule.perms.includes("r") || userRule.perms.includes("w");
    }

    return true;
  }
}
