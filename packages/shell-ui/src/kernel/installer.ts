/**
 * @file installer.ts
 * @module StyxOS/Kernel/Installer
 * @description Binary installer engine validating and mounting host Wasm binaries into Styx OS VFS.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export class BinaryInstaller {
  private kernel: UnixKernel;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  validateWasmHeader(bytes: Uint8Array): boolean {
    if (bytes.length < 8) return false;
    // Magic: 0x00 0x61 0x73 0x6d (\0asm)
    return (
      bytes[0] === 0x00 &&
      bytes[1] === 0x61 &&
      bytes[2] === 0x73 &&
      bytes[3] === 0x6d
    );
  }

  installBinary(filename: string, binaryBytes: Uint8Array, targetDir: string = "/bin"): string {
    if (!this.validateWasmHeader(binaryBytes)) {
      throw new Error("Invalid WebAssembly executable binary header (expected WASM magic bytes 0x0061736d)");
    }

    const safeBase = filename.split(/[/\\]/).pop() || "app.wasm";
    const cleanFilename = safeBase.endsWith(".wasm") ? safeBase : `${safeBase}.wasm`;
    const targetPath = `${targetDir.replace(/\/$/, "")}/${cleanFilename}`;

    const fd = this.kernel.sys_open(targetPath, true);
    this.kernel.sys_write(fd, binaryBytes);
    this.kernel.sys_close(fd);

    return targetPath;
  }
}
