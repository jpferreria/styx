/**
 * @file mqueue.test.ts
 * @module StyxOS/Kernel/MessageQueueManagerTests
 * @description Vitest test suite for POSIX Message Queues (/dev/mqueue, mq_open, mq_send, mq_receive, ipcs -q) and /bin/mqueue.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Message Queue Subsystem Test Suite", () => {
  it("should create, send priority messages, receive in priority order, and unlink queue", () => {
    const kernel = new UnixKernel();
    const qName = "/styx_ipc_queue";

    kernel.mqueueManager.mqSend(qName, "Low priority message", 1);
    kernel.mqueueManager.mqSend(qName, "High priority message", 10);

    const firstMsg = kernel.mqueueManager.mqReceive(qName);
    expect(firstMsg).toBeDefined();
    expect(firstMsg?.priority).toBe(10);
    expect(new TextDecoder().decode(firstMsg!.payload)).toBe("High priority message");

    const secondMsg = kernel.mqueueManager.mqReceive(qName);
    expect(secondMsg).toBeDefined();
    expect(secondMsg?.priority).toBe(1);
    expect(new TextDecoder().decode(secondMsg!.payload)).toBe("Low priority message");

    expect(kernel.mqueueManager.mqUnlink(qName)).toBe(true);
  });

  it("should format ipcs -q message queues report", () => {
    const kernel = new UnixKernel();
    const report = kernel.mqueueManager.formatIpcsQueues();

    expect(report).toContain("Message Queues");
    expect(report).toContain("msqid");
    expect(report).toContain("messages");
  });

  it("should execute /bin/mqueue.wasm via sys_execve and stream report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/mqueue.wasm",
      ["/bin/mqueue.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Message Queue Inspector");
  });
});
