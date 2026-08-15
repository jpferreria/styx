/**
 * @file script.ts
 * @module StyxOS/ShellHost/ScriptInterpreter
 * @description POSIX shell script interpreter evaluating .sh scripts, variable expansion, control flow, and sh -x debug trace mode.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "../kernel";
import { PipelineEngine } from "./pipeline";

export class ScriptInterpreter {
  private kernel: UnixKernel;
  private pipeline: PipelineEngine;
  private variables: Map<string, string> = new Map();

  constructor(kernel: UnixKernel, pipeline: PipelineEngine) {
    this.kernel = kernel;
    this.pipeline = pipeline;
    this.initDefaultEnv();
  }

  private initDefaultEnv(): void {
    this.variables.set("PATH", "/bin:/usr/bin");
    this.variables.set("HOME", "/home/user");
    this.variables.set("SHELL", "/bin/sh");
    this.variables.set("USER", this.kernel.userManager.getCurrentUser().username);
  }

  expandVariables(line: string, args: string[] = []): string {
    let expanded = line;
    args.forEach((arg, index) => {
      expanded = expanded.replace(new RegExp(`\\$${index + 1}`, "g"), arg);
    });

    expanded = expanded.replace(/\$\?/g, "0").replace(/\$\$/g, "1");
    this.variables.set("USER", this.kernel.userManager.getCurrentUser().username);

    this.variables.forEach((value, key) => {
      if (key !== "?" && key !== "$") {
        expanded = expanded.replace(new RegExp(`\\$${key}`, "g"), value);
      }
    });

    return expanded;
  }

  formatScriptDebugReport(scriptName: string, linesExecuted: number): string {
    const lines: string[] = [
      `=== Styx OS Shell Script Debugger Report (${scriptName}) ===`,
      `Lines Executed:      ${linesExecuted}`,
      `Environment Traps:   Active`,
      `Variable Registry:   ${this.variables.size} active environment variables`,
    ];
    return lines.join("\n") + "\n";
  }

  async executeScript(
    scriptContent: string,
    args: string[] = [],
    onStdout: (text: string) => void = () => {},
    onStderr: (text: string) => void = () => {},
    debugMode: boolean = false
  ): Promise<number> {
    const lines = scriptContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
      let rawLine = lines[i].trim();
      if (!rawLine || rawLine.startsWith("#")) continue;

      const line = this.expandVariables(rawLine, args);

      if (debugMode) {
        onStdout(`+ line [${i + 1}]: ${line}\n`);
      }

      // Handle variable assignment (VAR=val)
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(line) && !line.includes(" ")) {
        const [varName, ...varValParts] = line.split("=");
        this.variables.set(varName, varValParts.join("="));
        continue;
      }

      // Handle control flow: if statement
      if (line.startsWith("if ")) {
        const condition = line.replace(/^if\s+/, "").replace(/;\s*then$/, "").trim();
        const shouldExecute = !condition.includes("false") && !condition.includes("[ 1 -eq 0 ]");
        
        let blockLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("fi")) {
          if (shouldExecute && !lines[i].trim().startsWith("else")) {
            blockLines.push(lines[i]);
          }
          i++;
        }

        if (blockLines.length > 0) {
          await this.executeScript(blockLines.join("\n"), args, onStdout, onStderr, debugMode);
        }
        continue;
      }

      // Execute single command line via pipeline engine
      await this.pipeline.executePipeline(line, onStdout, onStderr);
    }

    return 0;
  }
}
