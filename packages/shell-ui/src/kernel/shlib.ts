/**
 * @file shlib.ts
 * @module StyxOS/Kernel/SharedLibraryEngine
 * @description Dynamic Linker & Shared Library Loader Subsystem (ld-styx.so, ldconfig, ldd).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface SharedLibraryInfo {
  name: string;
  path: string;
  soname: string;
  address: string;
}

export class SharedLibraryEngine {
  private kernel: UnixKernel;
  private libraries: Map<string, SharedLibraryInfo> = new Map();

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
    this.setupStandardLibraries();
  }

  private setupStandardLibraries(): void {
    const libDir = this.kernel.resolvePath("/lib");

    const stdLibs: SharedLibraryInfo[] = [
      { name: "libc.so.6", path: "/lib/libc.so.6", soname: "libc.so.6", address: "0x00007f9010000000" },
      { name: "libm.so.6", path: "/lib/libm.so.6", soname: "libm.so.6", address: "0x00007f9010200000" },
      { name: "libpthread.so.0", path: "/lib/libpthread.so.0", soname: "libpthread.so.0", address: "0x00007f9010400000" },
      { name: "libwasm.so", path: "/lib/libwasm.so", soname: "libwasm.so", address: "0x00007f9010600000" },
      { name: "ld-styx.so.1", path: "/lib/ld-styx.so.1", soname: "ld-styx.so.1", address: "0x00007f9010800000" },
    ];

    for (const lib of stdLibs) {
      this.libraries.set(lib.name, lib);
      if (libDir && !libDir.lookup(lib.name)) {
        const fileNode = libDir.createChild(lib.name, false, 0o755);
        fileNode.write(0, new TextEncoder().encode(`/* Styx OS Shared Object ${lib.name} */\n`));
      }
    }
  }

  ldconfig(): string {
    const etcDir = this.kernel.resolvePath("/etc");
    const cacheNode = etcDir?.lookup("ld.so.cache") || etcDir?.createChild("ld.so.cache", false, 0o644);

    const lines: string[] = [
      "=== Styx OS Dynamic Linker Cache Generator (ldconfig) ===",
      `${this.libraries.size} libs found in cache '/etc/ld.so.cache'`,
      "",
      "SONAME           PATH                  LOAD ADDRESS",
    ];

    for (const lib of this.libraries.values()) {
      lines.push(`${lib.soname.padEnd(16)} ${lib.path.padEnd(21)} ${lib.address}`);
    }

    const cacheText = lines.join("\n") + "\n";
    if (cacheNode) {
      cacheNode.write(0, new TextEncoder().encode(cacheText));
    }
    return cacheText;
  }

  ldd(binaryPath: string = "/bin/hello.wasm"): string {
    const target = binaryPath.startsWith("/") ? binaryPath : `/${binaryPath}`;
    const file = this.kernel.resolvePath(target);

    if (!file) {
      throw new Error(`Errno 2: Binary not found '${target}'`);
    }

    const lines: string[] = [
      `=== Shared Library Dependencies for ${target} ===`,
      `\tlinux-vdso.so.1 (0x00007ffd99990000)`,
      `\tlibc.so.6 => /lib/libc.so.6 (0x00007f9010000000)`,
      `\tlibm.so.6 => /lib/libm.so.6 (0x00007f9010200000)`,
      `\tlibpthread.so.0 => /lib/libpthread.so.0 (0x00007f9010400000)`,
      `\t/lib/ld-styx.so.1 (0x00007f9010800000)`,
    ];

    return lines.join("\n") + "\n";
  }
}
