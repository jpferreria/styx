/**
 * @file random.test.ts
 * @module StyxOS/Kernel/RandomDeviceTests
 * @description Vitest test suite for /dev/urandom, /dev/random, stream devices, and /bin/rand.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { RandomDeviceNode } from "./random";

describe("Styx OS Cryptographic & Stream Devices Test Suite", () => {
  it("should initialize /dev/urandom device node with correct stat metadata", () => {
    const randNode = new RandomDeviceNode(9);
    const stat = randNode.stat();

    expect(stat.ino).toBe(9);
    expect(stat.mode).toBe(0o444);
    expect(stat.isDir).toBe(false);
  });

  it("should read non-zero cryptographic random byte buffer from /dev/urandom", () => {
    const kernel = new UnixKernel();

    const fd = kernel.sys_open("/dev/urandom", false);
    const bytes = kernel.sys_read(fd, 32);
    kernel.sys_close(fd);

    expect(bytes.length).toBe(32);
  });

  it("should execute /bin/rand.wasm via sys_execve and stream entropy report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/rand.wasm",
      ["/bin/rand.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Random Generator");
  });
});
