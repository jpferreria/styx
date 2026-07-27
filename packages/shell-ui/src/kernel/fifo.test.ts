/**
 * @file fifo.test.ts
 * @module StyxOS/Kernel/FIFOManagerTests
 * @description Vitest test suite for POSIX FIFO / Named Pipe Subsystem (mkfifo, lsfifo) and /bin/mkfifo.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX FIFO Named Pipe Subsystem Test Suite", () => {
  it("should create FIFO named pipe node and perform streaming read/write operations", () => {
    const kernel = new UnixKernel();
    const fifo = kernel.fifoManager.mkfifo("/tmp/myfifo");

    const inputData = new TextEncoder().encode("Hello Styx POSIX FIFO!");
    fifo.write(0, inputData);

    const readBuf = fifo.read(0, 100);
    const readText = new TextDecoder().decode(readBuf);

    expect(readText).toBe("Hello Styx POSIX FIFO!");
    expect(fifo.read(0, 100).length).toBe(0);
  });

  it("should list active registered FIFO named pipes via lsfifo", () => {
    const kernel = new UnixKernel();
    kernel.fifoManager.mkfifo("/tmp/fifo1");
    kernel.fifoManager.mkfifo("/tmp/fifo2");

    const list = kernel.fifoManager.listFifos();
    expect(list).toContain("/tmp/fifo1");
    expect(list).toContain("/tmp/fifo2");
  });

  it("should execute /bin/mkfifo.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/mkfifo.wasm",
      ["/bin/mkfifo.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("POSIX FIFO Named Pipe");
  });
});
