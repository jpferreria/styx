/**
 * @file cgroup.ts
 * @module StyxOS/Kernel/CgroupV2Engine
 * @description POSIX Cgroups v2 Resource Controller Engine (/sys/fs/cgroup, memory.max, cpu.max, cgcreate, cgexec, cgset, cgget, lscgroup).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface CgroupGroup {
  path: string;
  memoryMax: string;
  cpuMax: string;
  pidsMax: string;
  procs: number[];
}

export class CgroupV2Engine {
  private kernel: UnixKernel;
  private groups: Map<string, CgroupGroup> = new Map();

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
    this.initCgroupsFS();
  }

  private initCgroupsFS(): void {
    if (!this.kernel.resolvePath("/sys")) {
      this.kernel.sys_mkdir("/sys");
    }
    if (!this.kernel.resolvePath("/sys/fs")) {
      this.kernel.sys_mkdir("/sys/fs");
    }
    if (!this.kernel.resolvePath("/sys/fs/cgroup")) {
      this.kernel.sys_mkdir("/sys/fs/cgroup");
    }

    // Root cgroup
    this.groups.set("/sys/fs/cgroup", {
      path: "/sys/fs/cgroup",
      memoryMax: "max",
      cpuMax: "max 100000",
      pidsMax: "max",
      procs: [1, 2],
    });
  }

  cgcreate(cgroupPath: string): string {
    const norm = cgroupPath.startsWith("/sys/fs/cgroup")
      ? cgroupPath
      : `/sys/fs/cgroup/${cgroupPath.replace(/^\//, "")}`;

    if (!this.kernel.resolvePath(norm)) {
      this.kernel.sys_mkdir(norm);
    }
    this.groups.set(norm, {
      path: norm,
      memoryMax: "max",
      cpuMax: "max 100000",
      pidsMax: "max",
      procs: [],
    });

    return `cgcreate: cgroup v2 controller '${norm}' created.\n`;
  }

  cgexec(cgroupPath: string, pid: number = 2): string {
    const norm = cgroupPath.startsWith("/sys/fs/cgroup")
      ? cgroupPath
      : `/sys/fs/cgroup/${cgroupPath.replace(/^\//, "")}`;

    const cg = this.groups.get(norm);
    if (!cg) return `cgexec: ${cgroupPath}: cgroup does not exist\n`;

    if (!cg.procs.includes(pid)) {
      cg.procs.push(pid);
    }
    return `cgexec: attached PID ${pid} to cgroup ${norm}.\n`;
  }

  cgset(cgroupPath: string, key: string, value: string): string {
    const norm = cgroupPath.startsWith("/sys/fs/cgroup")
      ? cgroupPath
      : `/sys/fs/cgroup/${cgroupPath.replace(/^\//, "")}`;

    const cg = this.groups.get(norm);
    if (!cg) return `cgset: ${cgroupPath}: cgroup does not exist\n`;

    if (key === "memory.max") cg.memoryMax = value;
    else if (key === "cpu.max") cg.cpuMax = value;
    else if (key === "pids.max") cg.pidsMax = value;

    return `cgset: updated ${key} = ${value} on ${norm}.\n`;
  }

  cgget(cgroupPath: string): string {
    const norm = cgroupPath.startsWith("/sys/fs/cgroup")
      ? cgroupPath
      : `/sys/fs/cgroup/${cgroupPath.replace(/^\//, "")}`;

    const cg = this.groups.get(norm);
    if (!cg) return `cgget: ${cgroupPath}: cgroup does not exist\n`;

    const lines: string[] = [
      `=== Cgroups v2 Controller: ${cg.path} ===`,
      `memory.max: ${cg.memoryMax}`,
      `cpu.max: ${cg.cpuMax}`,
      `pids.max: ${cg.pidsMax}`,
      `cgroup.procs: ${cg.procs.join(" ") || "none"}`,
    ];
    return lines.join("\n") + "\n";
  }

  lscgroup(): string {
    const lines: string[] = ["cgroup v2 controllers on /sys/fs/cgroup:"];
    for (const [path, cg] of this.groups.entries()) {
      lines.push(`  ${path} [PIDs: ${cg.procs.length}, mem: ${cg.memoryMax}, cpu: ${cg.cpuMax}]`);
    }
    return lines.join("\n") + "\n";
  }
}
