/**
 * @file llm-server.test.ts
 * @module StyxOS/Kernel/LlmAgentServerEngineTests
 * @description Vitest test suite for Local LLM REST/RPC Agent Server (/v1/chat/completions, ws://localhost:8080/rpc, tool calling dispatcher).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Local LLM REST/RPC Agent Server Test Suite", () => {
  it("should start, inspect, and stop LLM Agent Server", () => {
    const kernel = new UnixKernel();
    const startMsg = kernel.llmAgentServerEngine.startServer(8080);

    expect(startMsg).toContain("http://localhost:8080/v1/chat/completions");
    expect(startMsg).toContain("ws://localhost:8080/rpc");

    const status = kernel.llmAgentServerEngine.formatServerStatus();
    expect(status).toContain("ACTIVE (RUNNING)");

    const stopMsg = kernel.llmAgentServerEngine.stopServer();
    expect(stopMsg).toContain("stopped");
  });

  it("should handle /v1/chat/completions requests and execute sandbox kernel commands", async () => {
    const kernel = new UnixKernel();

    const response = await kernel.llmAgentServerEngine.handleChatCompletion({
      model: "gemma-2b-styx",
      messages: [{ role: "user", content: "run: whoami" }],
    });

    expect(response.object).toBe("chat.completion");
    expect(response.choices[0].message.content).toContain("user");
  });
});
