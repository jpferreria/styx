/**
 * @file sandbox.ts
 * @module StyxOS/Kernel/StyxSandboxEngine
 * @description Ollama / Gemma Local LLM Code Execution Sandbox Engine for Styx OS.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";
import { PipelineEngine } from "../shell/pipeline";

export interface SandboxExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export class StyxSandboxEngine {
  private _kernel: UnixKernel;
  private pipelineEngine: PipelineEngine;

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;
    this.pipelineEngine = new PipelineEngine(kernel);
  }

  getKernel(): UnixKernel {
    return this._kernel;
  }

  async executeCommand(command: string, timeoutMs: number = 30000): Promise<SandboxExecutionResult> {
    const startTime = performance.now();
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    try {
      const execPromise = this.pipelineEngine.executePipeline(
        command,
        (text) => { stdout += text; },
        (err) => { stderr += err; exitCode = 1; }
      );

      let timer: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Sandbox Execution Timed Out after ${timeoutMs}ms`)), timeoutMs);
      });

      await Promise.race([execPromise, timeoutPromise]).finally(() => {
        if (timer) clearTimeout(timer);
      });
    } catch (err: any) {
      stderr += `\n[Sandbox Error]: ${err.message || String(err)}`;
      exitCode = 124; // Standard POSIX timeout exit code
    }

    const durationMs = Math.round(performance.now() - startTime);

    return {
      exitCode,
      stdout,
      stderr,
      durationMs,
    };
  }

  getOllamaToolDefinition(): object {
    return {
      type: "function",
      function: {
        name: "execute_bash",
        description: "Executes a shell command or POSIX pipeline inside the isolated Styx OS WebAssembly sandbox environment.",
        parameters: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The POSIX shell command string to run inside Styx OS (e.g., 'ls -la', 'python script.py', 'cat /etc/passwd').",
            },
          },
          required: ["command"],
        },
      },
    };
  }

  getFileContent(path: string): string | null {
    const node = this._kernel.resolvePath(path);
    if (!node || node.stat().isDir) return null;
    const buf = node.read(0, node.stat().size || 65536);
    return new TextDecoder().decode(buf);
  }

  writeFileContent(path: string, content: string): boolean {
    const parts = path.split("/").filter(Boolean);
    const fileName = parts.pop();
    const dirPath = "/" + parts.join("/");

    const dirNode = this._kernel.resolvePath(dirPath);
    if (!dirNode || !dirNode.stat().isDir || !fileName) return false;

    let targetNode: any = (dirNode as any).children?.get(fileName);
    if (!targetNode) {
      targetNode = dirNode.createChild(fileName, false, 0o644);
    }
    if (!targetNode) return false;

    const data = new TextEncoder().encode(content);
    targetNode.write(0, data);
    return true;
  }

  resetState(): void {
    this._kernel = new UnixKernel();
    this.pipelineEngine = new PipelineEngine(this._kernel);
  }
}
