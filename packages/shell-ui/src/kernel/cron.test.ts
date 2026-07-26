/**
 * @file cron.test.ts
 * @module StyxOS/Kernel/CronSchedulerTests
 * @description Vitest test suite for CronManager task scheduler, /etc/crontab, and /bin/cron.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { CronManager } from "./cron";

describe("Styx OS Virtual Cron Scheduler Test Suite", () => {
  it("should read system tasks from /etc/crontab configuration file", () => {
    const kernel = new UnixKernel();

    const fd = kernel.sys_open("/etc/crontab", false);
    const crontabText = new TextDecoder().decode(kernel.sys_read(fd, 2048));
    kernel.sys_close(fd);

    expect(crontabText).toContain("system-wide crontab for Styx OS");
    expect(crontabText).toContain("Styx Cron Sync");
  });

  it("should add and remove scheduled cron jobs", () => {
    const cron = new CronManager();

    const job = cron.addJob("*/10 * * * *", "echo 'Backup'");
    expect(cron.getJobs().length).toBe(3);

    const removed = cron.removeJob(job.id);
    expect(removed).toBe(true);
    expect(cron.getJobs().length).toBe(2);
  });

  it("should execute /bin/cron.wasm via sys_execve and stream cron report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/cron.wasm",
      ["/bin/cron.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Cron Daemon");
  });
});
