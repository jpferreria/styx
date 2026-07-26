/**
 * @file history.test.ts
 * @module StyxOS/Kernel/HistoryTests
 * @description Vitest test suite for HistoryManager command recording, ~/.bash_history, Tab completion, and /bin/history.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { HistoryManager } from "./history";

describe("Styx OS Shell History & Auto-Completion Test Suite", () => {
  it("should read ~/.bash_history file from VFS user home", () => {
    const kernel = new UnixKernel();

    const fd = kernel.sys_open("/home/user/.bash_history", false);
    const historyText = new TextDecoder().decode(kernel.sys_read(fd, 2048));
    kernel.sys_close(fd);

    expect(historyText).toContain("ls -la");
    expect(historyText).toContain("whoami");
  });

  it("should record commands and match auto-completion prefixes", () => {
    const hist = new HistoryManager();
    hist.add("ping 8.8.8.8");

    expect(hist.getAll()).toContain("ping 8.8.8.8");

    const matches = hist.autoComplete("hi", ["history", "help", "hello"]);
    expect(matches).toContain("history");
  });

  it("should execute /bin/history.wasm via sys_execve and stream history report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/history.wasm",
      ["/bin/history.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Command History");
  });
});
