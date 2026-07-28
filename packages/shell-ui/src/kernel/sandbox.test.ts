/**
 * @file sandbox.test.ts
 * @module StyxOS/Kernel/StyxSandboxEngineTests
 * @description Vitest test suite for Ollama / Gemma LLM Code Execution Sandbox Engine.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Ollama / Gemma LLM Sandbox Integration Test Suite", () => {
  it("should execute bash pipelines and return structured sandbox result", async () => {
    const kernel = new UnixKernel();
    const res = await kernel.sandboxEngine.executeCommand("echo 'Hello Ollama' | cat");

    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("Hello Ollama");
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should generate OpenAI/Ollama compatible function tool definition", () => {
    const kernel = new UnixKernel();
    const toolDef = kernel.sandboxEngine.getOllamaToolDefinition() as any;

    expect(toolDef.type).toBe("function");
    expect(toolDef.function.name).toBe("execute_bash");
    expect(toolDef.function.parameters.properties.command).toBeDefined();
  });

  it("should write files into sandbox VFS, read file content, and reset sandbox state", () => {
    const kernel = new UnixKernel();

    const writeOk = kernel.sandboxEngine.writeFileContent("/home/user/llm_code.py", "print('Executed safely in Styx')");
    expect(writeOk).toBe(true);

    const content = kernel.sandboxEngine.getFileContent("/home/user/llm_code.py");
    expect(content).toBe("print('Executed safely in Styx')");

    kernel.sandboxEngine.resetState();
    const freshNode = kernel.sandboxEngine.getKernel().resolvePath("/home/user/llm_code.py");
    expect(freshNode).toBeNull();
  });
});
