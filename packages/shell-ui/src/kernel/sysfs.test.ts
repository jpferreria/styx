/**
 * @file sysfs.test.ts
 * @module StyxOS/Kernel/SysFSTests
 * @description Vitest test suite for SysFS device tree, lspci, lsusb, and /bin/lspci.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { SysFSManager } from "./sysfs";

describe("Styx OS SysFS Virtual Device Tree Test Suite", () => {
  it("should mount /sys hierarchy in VFS tree", () => {
    const kernel = new UnixKernel();

    const pciNode = kernel.resolvePath("/sys/bus/pci/devices/00:02.0");
    expect(pciNode).toBeDefined();

    const usbNode = kernel.resolvePath("/sys/bus/usb/devices/1-1");
    expect(usbNode).toBeDefined();
  });

  it("should list virtual PCI and USB hardware devices", () => {
    const sysfs = new SysFSManager();

    const pciList = sysfs.listPci();
    expect(pciList).toContain("VGA Controller");
    expect(pciList).toContain("Audio Controller");

    const usbList = sysfs.listUsb();
    expect(usbList).toContain("Logitech Unifying Receiver");
  });

  it("should execute /bin/lspci.wasm via sys_execve and stream PCI device list", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/lspci.wasm",
      ["/bin/lspci.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("VGA Controller");
  });
});
