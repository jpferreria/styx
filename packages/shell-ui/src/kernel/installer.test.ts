/**
 * @file installer.test.ts
 * @module StyxOS/Kernel/InstallerTests
 * @description Vitest test suite for Wasm binary header validation, VFS installation, and execution.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { BinaryInstaller } from "./installer";
import { createMessageWasmBinary } from "./binaries";

describe("Styx OS Wasm Binary Installer Test Suite", () => {
  it("should validate valid WASM magic bytes header", () => {
    const kernel = new UnixKernel();
    const installer = new BinaryInstaller(kernel);
    const validWasm = createMessageWasmBinary("Installed App Output");

    expect(installer.validateWasmHeader(validWasm)).toBe(true);
  });

  it("should reject non-WASM invalid binary data", () => {
    const kernel = new UnixKernel();
    const installer = new BinaryInstaller(kernel);
    const invalidBytes = new TextEncoder().encode("Not a Wasm Binary!");

    expect(installer.validateWasmHeader(invalidBytes)).toBe(false);
    expect(() => installer.installBinary("bad_app.wasm", invalidBytes)).toThrowError(/Invalid WebAssembly/);
  });

  it("should install custom Wasm binary into /bin and execute via sys_execve", async () => {
    const kernel = new UnixKernel();
    const installer = new BinaryInstaller(kernel);
    const customBinary = createMessageWasmBinary("Hello from Custom Installed Binary!\n");

    const installedPath = installer.installBinary("my_custom_app.wasm", customBinary);
    expect(installedPath).toBe("/bin/my_custom_app.wasm");

    let stdout = "";
    const exitCode = await kernel.sys_execve(
      installedPath,
      [installedPath],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Hello from Custom Installed Binary!");
  });
});
