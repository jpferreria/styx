/**
 * @file debug.test.ts
 * @module StyxOS/Kernel/DebuggerTests
 * @description Vitest test suite for POSIX shell script debugger (sh -x), debug trace output, and /bin/sh-debug.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { PipelineEngine } from "../shell/pipeline";
import { ScriptInterpreter } from "../shell/script";

describe("Styx OS Shell Script Debugger Test Suite", () => {
  it("should execute script in sh -x debug trace mode outputting line traces", async () => {
    const kernel = new UnixKernel();
    const pipeline = new PipelineEngine(kernel);
    const interpreter = new ScriptInterpreter(kernel, pipeline);

    let stdout = "";
    const script = "#!/bin/sh\necho Line A\necho Line B\n";

    await interpreter.executeScript(script, [], (text) => { stdout += text; }, () => {}, true);

    expect(stdout).toContain("+ line [2]: echo Line A");
    expect(stdout).toContain("Line A");
    expect(stdout).toContain("+ line [3]: echo Line B");
    expect(stdout).toContain("Line B");
  });

  it("should execute sh -x command via pipeline engine", async () => {
    const kernel = new UnixKernel();
    const pipeline = new PipelineEngine(kernel);

    let stdout = "";
    await pipeline.executePipeline("sh -x /home/user/demo.sh", (text) => { stdout += text; }, () => {});

    expect(stdout).toContain("+ line [");
    expect(stdout).toContain("Executing Styx OS Script Demo");
  });

  it("should execute /bin/sh-debug.wasm via sys_execve and stream debugger report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/sh-debug.wasm",
      ["/bin/sh-debug.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Script Debugger");
  });
});
