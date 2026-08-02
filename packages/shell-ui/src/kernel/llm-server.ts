/**
 * @file llm-server.ts
 * @module StyxOS/Kernel/LlmAgentServerEngine
 * @description Local LLM REST/RPC Agent Server (/v1/chat/completions, ws://localhost:8080/rpc, tool-calling integration).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface LlmChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface LlmChatCompletionRequest {
  model: string;
  messages: LlmChatMessage[];
  tools?: any[];
  temperature?: number;
}

export class LlmAgentServerEngine {
  private kernel: UnixKernel;
  private running: boolean = false;
  private port: number = 8080;
  private requestsHandled: number = 0;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  startServer(port: number = 8080): string {
    this.port = port;
    this.running = true;
    return `Styx OS Local LLM REST/RPC Agent Server listening on:\n  REST Endpoint: http://localhost:${this.port}/v1/chat/completions\n  RPC WebSockets: ws://localhost:${this.port}/rpc\n`;
  }

  stopServer(): string {
    this.running = false;
    return "Styx OS Local LLM Agent Server stopped.\n";
  }

  async handleChatCompletion(req: LlmChatCompletionRequest): Promise<any> {
    if (!this.running) {
      this.startServer(this.port);
    }
    this.requestsHandled++;

    const lastMsg = req.messages[req.messages.length - 1]?.content || "";

    // Execute Sandbox tool if requested
    if (lastMsg.startsWith("run:")) {
      const cmd = lastMsg.replace(/^run:\s*/, "");
      const res = await this.kernel.sandboxEngine.executeCommand(cmd);
      return {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: req.model || "gemma-2b-styx",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: `Styx OS Kernel Execution Result:\n${res.stdout || res.stderr}`,
            },
            finish_reason: "stop",
          },
        ],
      };
    }

    return {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: req.model || "gemma-2b-styx",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: `Styx OS LLM Agent Server Response: Processed request '${lastMsg}' via Styx Kernel API.`,
          },
          finish_reason: "stop",
        },
      ],
    };
  }

  formatServerStatus(): string {
    const statusStr = this.running ? "ACTIVE (RUNNING)" : "INACTIVE (STOPPED)";
    const lines: string[] = [
      "=== Styx OS Local LLM REST/RPC Agent Server Status ===",
      `Status:           ${statusStr}`,
      `REST Endpoint:    http://localhost:${this.port}/v1/chat/completions`,
      `RPC Endpoint:     ws://localhost:${this.port}/rpc`,
      `Requests Processed: ${this.requestsHandled}`,
      `Tool Binding:     StyxSandboxEngine (sandbox.ts) Active`,
    ];
    return lines.join("\n") + "\n";
  }
}
