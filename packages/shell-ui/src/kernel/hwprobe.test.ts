/**
 * @file hwprobe.test.ts
 * @module StyxOS/Kernel/HardwareProbeEngineTests
 * @description Vitest test suite for System Hardware Peripheral Probe (lscpu, lspci, lsusb) and /bin/lscpu.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS System Hardware Peripheral Probe Test Suite", () => {
  it("should probe CPU architecture details via lscpu", () => {
    const kernel = new UnixKernel();
    const report = kernel.hwProbeEngine.lscpu();

    expect(report).toContain("Architecture:");
    expect(report).toContain("CPU(s):");
    expect(report).toContain("Vendor ID:");
    expect(report).toContain("Flags:");
  });

  it("should probe PCI and USB peripheral devices via lspci and lsusb", () => {
    const kernel = new UnixKernel();
    const pciReport = kernel.hwProbeEngine.lspci();
    const usbReport = kernel.hwProbeEngine.lsusb();

    expect(pciReport).toContain("Host bridge");
    expect(pciReport).toContain("VGA compatible controller");
    expect(usbReport).toContain("Linux Foundation 2.0 root hub");
  });

  it("should execute /bin/lscpu.wasm via sys_execve and stream report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/lscpu.wasm",
      ["/bin/lscpu.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("CPU Architecture Inspector");
  });
});
