/**
 * @file devnodes.test.ts
 * @module StyxOS/Kernel/DeviceNodeEngineTests
 * @description Vitest test suite for Universal Device Major/Minor Node Driver (/dev/null, /dev/zero, /dev/full, mknod) and /bin/mknod.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { NullDeviceNode, ZeroDeviceNode, FullDeviceNode } from "./devnodes";

describe("Styx OS Device Major/Minor Node Driver Test Suite", () => {
  it("should handle /dev/null, /dev/zero, and /dev/full operations", () => {
    const nullDev = new NullDeviceNode();
    const zeroDev = new ZeroDeviceNode();
    const fullDev = new FullDeviceNode();

    // Null Device: returns EOF on read, discards writes
    expect(nullDev.read(0, 100).length).toBe(0);
    expect(nullDev.write(0, new Uint8Array([1, 2, 3]))).toBe(3);

    // Zero Device: returns stream of zero-bytes on read
    const zeroBuf = zeroDev.read(0, 10);
    expect(zeroBuf.length).toBe(10);
    expect(zeroBuf.every((b) => b === 0)).toBe(true);

    // Full Device: throws ENOSPC on write
    expect(() => fullDev.write(0, new Uint8Array([1]))).toThrow("No space left on device");
  });

  it("should create custom character/block device nodes via mknod and list devices", () => {
    const kernel = new UnixKernel();
    kernel.deviceNodeEngine.mknod("/dev/ttyS0", "c", 4, 64);
    kernel.deviceNodeEngine.mknod("/dev/sda", "b", 8, 0);

    const list = kernel.deviceNodeEngine.listDevices();
    expect(list).toContain("/dev/null");
    expect(list).toContain("/dev/ttyS0");
    expect(list).toContain("/dev/sda");
  });

  it("should execute /bin/mknod.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/mknod.wasm",
      ["/bin/mknod.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Device Major/Minor Node Driver");
  });
});
