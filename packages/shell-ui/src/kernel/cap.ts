/**
 * @file cap.ts
 * @module StyxOS/Kernel/CapabilityEngine
 * @description POSIX Extended Security Capabilities & Linux Credentials Engine (capget, capset, getuid, setuid, getcap, setcap).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export const CAP_CHOWN            = 1;
export const CAP_NET_BIND_SERVICE = 1024;
export const CAP_SYS_ADMIN        = 2048;
export const CAP_SYS_PTRACE       = 4096;
export const CAP_DAC_OVERRIDE     = 8192;
export const CAP_KILL             = 16384;

export interface CapSet {
  effective: number;
  permitted: number;
  inheritable: number;
}

export class CapabilityEngine {
  private _kernel: UnixKernel;
  private processCaps: Map<number, CapSet> = new Map();
  private fileCaps: Map<string, string> = new Map();

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;
    // Set default init process capabilities
    this.processCaps.set(1, {
      effective: CAP_SYS_ADMIN | CAP_NET_BIND_SERVICE | CAP_KILL,
      permitted: CAP_SYS_ADMIN | CAP_NET_BIND_SERVICE | CAP_KILL,
      inheritable: 0,
    });
  }

  getKernel(): UnixKernel {
    return this._kernel;
  }

  capget(pid: number = 1): CapSet {
    const caps = this.processCaps.get(pid);
    if (caps) return { ...caps };
    return {
      effective: 0,
      permitted: 0,
      inheritable: 0,
    };
  }

  capset(pid: number, effective: number, permitted: number, inheritable: number): boolean {
    this.processCaps.set(pid, { effective, permitted, inheritable });
    return true;
  }

  getuid(): number {
    const user = this._kernel.userManager.getCurrentUser();
    return user.uid;
  }

  setuid(uid: number): boolean {
    if (uid === 0) {
      this._kernel.userManager.setCurrentUser("root");
    } else {
      this._kernel.userManager.setCurrentUser("user");
    }
    return true;
  }

  getgid(): number {
    const user = this._kernel.userManager.getCurrentUser();
    return user.gid;
  }

  setgid(_gid: number): boolean {
    return true;
  }

  getcap(path: string): string {
    const caps = this.fileCaps.get(path);
    if (caps) {
      return `${path} ${caps}\n`;
    }
    return `${path} = cap_sys_admin+ep\n`;
  }

  setcap(path: string, capStr: string): string {
    this.fileCaps.set(path, capStr);
    return `Updated capabilities for '${path}' to '${capStr}'\n`;
  }
}
