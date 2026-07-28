/**
 * @file rlimit.ts
 * @module StyxOS/Kernel/ResourceLimitEngine
 * @description POSIX Process Resource Limits Subsystem (getrlimit, setrlimit, ulimit).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export const RLIMIT_CPU    = 0;
export const RLIMIT_FSIZE  = 1;
export const RLIMIT_DATA   = 2;
export const RLIMIT_STACK  = 3;
export const RLIMIT_CORE   = 4;
export const RLIMIT_NPROC  = 6;
export const RLIMIT_NOFILE = 7;
export const RLIMIT_AS     = 9;

export const RLIM_INFINITY = 0xffffffff;

export interface Rlimit {
  rlim_cur: number;
  rlim_max: number;
}

export class ResourceLimitEngine {
  private _kernel: UnixKernel;
  private limits: Map<number, Rlimit> = new Map();

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;

    // Initialize default system resource limits
    this.limits.set(RLIMIT_CPU,    { rlim_cur: RLIM_INFINITY, rlim_max: RLIM_INFINITY });
    this.limits.set(RLIMIT_FSIZE,  { rlim_cur: RLIM_INFINITY, rlim_max: RLIM_INFINITY });
    this.limits.set(RLIMIT_DATA,   { rlim_cur: RLIM_INFINITY, rlim_max: RLIM_INFINITY });
    this.limits.set(RLIMIT_STACK,  { rlim_cur: 8388608,       rlim_max: RLIM_INFINITY }); // 8MB
    this.limits.set(RLIMIT_CORE,   { rlim_cur: 0,             rlim_max: RLIM_INFINITY });
    this.limits.set(RLIMIT_NPROC,  { rlim_cur: 1024,          rlim_max: 4096 });
    this.limits.set(RLIMIT_NOFILE, { rlim_cur: 1024,          rlim_max: 4096 });
    this.limits.set(RLIMIT_AS,     { rlim_cur: RLIM_INFINITY, rlim_max: RLIM_INFINITY });
  }

  getKernel(): UnixKernel {
    return this._kernel;
  }

  getrlimit(resource: number): Rlimit {
    const lim = this.limits.get(resource);
    if (lim) return { ...lim };
    return { rlim_cur: RLIM_INFINITY, rlim_max: RLIM_INFINITY };
  }

  setrlimit(resource: number, soft: number, hard: number): boolean {
    if (soft > hard && hard !== RLIM_INFINITY) {
      throw new Error(`Errno 22 (EINVAL): Invalid argument (soft limit ${soft} exceeds hard limit ${hard})`);
    }
    this.limits.set(resource, { rlim_cur: soft, rlim_max: hard });
    return true;
  }

  ulimit(args: string[] = []): string {
    if (args.includes("-n") && args.length >= 2) {
      const val = parseInt(args[args.indexOf("-n") + 1], 10);
      this.setrlimit(RLIMIT_NOFILE, val, this.getrlimit(RLIMIT_NOFILE).rlim_max);
      return `Open file descriptors limit set to ${val}\n`;
    }

    if (args.includes("-s") && args.length >= 2) {
      const val = parseInt(args[args.indexOf("-s") + 1], 10);
      this.setrlimit(RLIMIT_STACK, val, this.getrlimit(RLIMIT_STACK).rlim_max);
      return `Stack size limit set to ${val} kbytes\n`;
    }

    // Default: ulimit -a output format
    const formatLimit = (val: number) => (val === RLIM_INFINITY ? "unlimited" : val.toString());

    const cpu  = this.getrlimit(RLIMIT_CPU);
    const fsize= this.getrlimit(RLIMIT_FSIZE);
    const data = this.getrlimit(RLIMIT_DATA);
    const stack= this.getrlimit(RLIMIT_STACK);
    const core = this.getrlimit(RLIMIT_CORE);
    const nproc= this.getrlimit(RLIMIT_NPROC);
    const nofile=this.getrlimit(RLIMIT_NOFILE);
    const as   = this.getrlimit(RLIMIT_AS);

    const lines: string[] = [
      "=== Styx OS Process Resource Limits (ulimit -a) ===",
      `real-time time (seconds, -t)        ${formatLimit(cpu.rlim_cur)}`,
      `file size (blocks, -f)             ${formatLimit(fsize.rlim_cur)}`,
      `data seg size (kbytes, -d)         ${formatLimit(data.rlim_cur)}`,
      `stack size (kbytes, -s)            ${formatLimit(stack.rlim_cur)}`,
      `core file size (blocks, -c)        ${formatLimit(core.rlim_cur)}`,
      `max user processes (-u)            ${formatLimit(nproc.rlim_cur)}`,
      `open files (-n)                    ${formatLimit(nofile.rlim_cur)}`,
      `virtual memory (kbytes, -v)        ${formatLimit(as.rlim_cur)}`,
    ];

    return lines.join("\n") + "\n";
  }
}
