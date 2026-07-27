/**
 * @file swap.test.ts
 * @module StyxOS/Kernel/SwapManagerTests
 * @description Vitest test suite for SwapManager page memory swapping, /var/swap file node, swapon command, and /bin/swapon.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Virtual Swap Subsystem Test Suite", () => {
  it("should swap memory pages out and in from SwapManager", () => {
    const kernel = new UnixKernel();
    const data = new TextEncoder().encode("Page 0x1000 memory content");

    kernel.swapManager.swapOut("page_1000", data);

    const retrieved = kernel.swapManager.swapIn("page_1000");
    expect(retrieved).toBeDefined();
    expect(new TextDecoder().decode(retrieved!)).toBe("Page 0x1000 memory content");
  });

  it("should toggle swapon and swapoff state and format memory metrics", () => {
    const kernel = new UnixKernel();

    expect(kernel.swapManager.isSwapEnabled()).toBe(true);

    const report = kernel.swapManager.formatSwapon();
    expect(report).toContain("/var/swap");
    expect(report).toContain("256 MB");

    kernel.swapManager.swapoff();
    expect(kernel.swapManager.isSwapEnabled()).toBe(false);
  });

  it("should execute /bin/swapon.wasm via sys_execve and stream swap report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/swapon.wasm",
      ["/bin/swapon.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Virtual Swap Subsystem");
  });
});
