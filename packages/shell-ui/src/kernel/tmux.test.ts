/**
 * @file tmux.test.ts
 * @module StyxOS/Kernel/TmuxEngineTests
 * @description Vitest test suite for Virtual Terminal Session Multiplexer (tmux.ts).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Virtual Terminal Multiplexer (tmux.ts) Test Suite", () => {
  it("should create, list, and format tmux sessions", () => {
    const kernel = new UnixKernel();
    const session = kernel.tmuxEngine.createSession("dev");

    expect(session.name).toBe("dev");
    expect(session.attached).toBe(true);

    const list = kernel.tmuxEngine.listSessions();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("dev");

    const status = kernel.tmuxEngine.formatTmuxStatus();
    expect(status).toContain("dev");
    expect(status).toContain("(attached)");
  });

  it("should support detaching, reattaching, and killing tmux sessions", () => {
    const kernel = new UnixKernel();
    kernel.tmuxEngine.createSession("work");

    const detachRes = kernel.tmuxEngine.detachSession();
    expect(detachRes).toContain("detached");

    let status = kernel.tmuxEngine.formatTmuxStatus();
    expect(status).toContain("(detached)");

    const attachRes = kernel.tmuxEngine.attachSession("work");
    expect(attachRes).toContain("attached");

    const killRes = kernel.tmuxEngine.killSession("work");
    expect(killRes).toContain("killed session");

    status = kernel.tmuxEngine.formatTmuxStatus();
    expect(status).toContain("no tmux sessions running");
  });
});
