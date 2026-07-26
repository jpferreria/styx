/**
 * @file script.test.ts
 * @module StyxOS/ShellHost/ScriptInterpreterTests
 * @description Vitest test suite for POSIX shell script execution, variable substitution, and control flow.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { PipelineEngine } from "../shell/pipeline";
import { ScriptInterpreter } from "../shell/script";

describe("Styx OS Shell Script Interpreter Test Suite", () => {
  it("should expand environment variables and positional parameters", () => {
    const kernel = new UnixKernel();
    const pipeline = new PipelineEngine(kernel);
    const interpreter = new ScriptInterpreter(kernel, pipeline);

    const expanded = interpreter.expandVariables("echo Hello $1, user is $USER", ["Alice"]);
    expect(expanded).toBe("echo Hello Alice, user is user");
  });

  it("should execute shell script lines and control flow statements", async () => {
    const kernel = new UnixKernel();
    const pipeline = new PipelineEngine(kernel);
    const interpreter = new ScriptInterpreter(kernel, pipeline);

    let stdout = "";
    const script = "#!/bin/sh\n# Comment\necho Line 1\nif true; then\necho Line 2\nfi\n";

    await interpreter.executeScript(script, [], (text) => { stdout += text; });

    expect(stdout).toContain("Line 1");
    expect(stdout).toContain("Line 2");
  });

  it("should execute /home/user/demo.sh via sh command", async () => {
    const kernel = new UnixKernel();
    const pipeline = new PipelineEngine(kernel);

    let stdout = "";
    await pipeline.executePipeline("sh /home/user/demo.sh", (text) => { stdout += text; }, () => {});

    expect(stdout).toContain("Executing Styx OS Script Demo");
    expect(stdout).toContain("Current User: user");
  });
});
