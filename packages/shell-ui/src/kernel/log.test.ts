/**
 * @file log.test.ts
 * @module StyxOS/Kernel/LoggerTests
 * @description Vitest test suite for LoggerManager syslog, kernel dmesg ring buffer, and /bin/dmesg.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { LoggerManager } from "./log";

describe("Styx OS System Logging & Journal Subsystem Test Suite", () => {
  it("should read /var/log/syslog system log file from VFS", () => {
    const kernel = new UnixKernel();

    const fd = kernel.sys_open("/var/log/syslog", false);
    const syslogText = new TextDecoder().decode(kernel.sys_read(fd, 2048));
    kernel.sys_close(fd);

    expect(syslogText).toContain("kernel[INFO]");
    expect(syslogNodeText(kernel)).toContain("VNode hierarchy");
  });

  it("should append log entries to ring buffer and format dmesg output", () => {
    const logger = new LoggerManager();
    logger.log("WARN", "memory", "High heap usage threshold reached");

    const dmesgOutput = logger.formatDmesg();
    expect(dmesgOutput).toContain("[memory] High heap usage threshold reached");
  });

  it("should execute /bin/dmesg.wasm via sys_execve and stream ring buffer report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/dmesg.wasm",
      ["/bin/dmesg.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Ring Buffer Log");
  });
});

function syslogNodeText(kernel: UnixKernel): string {
  const fd = kernel.sys_open("/var/log/syslog", false);
  const text = new TextDecoder().decode(kernel.sys_read(fd, 4096));
  kernel.sys_close(fd);
  return text;
}
