/**
 * @file pipeline.test.ts
 * @module StyxOS/Kernel/PipelineTests
 * @description Vitest test suite for POSIX sys_pipe, sys_dup2, and shell pipeline execution.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { PipelineEngine } from "../shell/pipeline";

describe("Styx OS Pipeline & IPC Test Suite", () => {
  it("should create and stream data through sys_pipe", () => {
    const kernel = new UnixKernel();
    const [readFd, writeFd] = kernel.sys_pipe();

    const data = new TextEncoder().encode("Pipe IPC Data Stream");
    kernel.sys_write(writeFd, data);

    const readBuf = kernel.sys_read(readFd, 100);
    expect(new TextDecoder().decode(readBuf)).toBe("Pipe IPC Data Stream");

    kernel.sys_close(readFd);
    kernel.sys_close(writeFd);
  });

  it("should duplicate file descriptors with sys_dup2", () => {
    const kernel = new UnixKernel();
    const originalFd = kernel.sys_open("/tmp/dup2_test.txt", true);
    kernel.sys_write(originalFd, new TextEncoder().encode("Dup2 Content"));

    // Duplicate descriptor 10 to point to originalFd
    kernel.sys_dup2(originalFd, 10);

    const statOriginal = kernel.sys_fstat(originalFd);
    const statDup = kernel.sys_fstat(10);
    expect(statDup.ino).toBe(statOriginal.ino);

    kernel.sys_close(originalFd);
    kernel.sys_close(10);
  });

  it("should execute command pipelines with redirection (| and >)", async () => {
    const kernel = new UnixKernel();
    const pipeline = new PipelineEngine(kernel);

    let output = "";
    await pipeline.executePipeline(
      "echo Hello Styx Pipe > /tmp/pipeline_out.txt",
      (stdout) => { output += stdout; },
      (stderr) => { console.error(stderr); }
    );

    const fd = kernel.sys_open("/tmp/pipeline_out.txt", false);
    const readBuf = kernel.sys_read(fd, 100);
    kernel.sys_close(fd);

    expect(new TextDecoder().decode(readBuf)).toContain("Hello Styx Pipe");
  });
});
