/**
 * @file index.ts
 * @module StyxOS/ShellHost
 * @description Xterm.js terminal shell interface connecting user input/output to Styx OS Kernel syscalls.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { UnixKernel } from "../kernel";
import { PipelineEngine } from "./pipeline";
import { VimEditor } from "../kernel/vim";
import { NanoEditor } from "../kernel/nano";

export class ShellHost {
  private terminal: Terminal;
  private fitAddon: FitAddon;
  private kernel: UnixKernel;
  private pipelineEngine: PipelineEngine;
  private inputBuffer: string = "";
  private activeVim: VimEditor | null = null;
  private activeNano: NanoEditor | null = null;

  constructor(container: HTMLElement) {
    this.kernel = new UnixKernel();
    this.pipelineEngine = new PipelineEngine(this.kernel);
    this.terminal = new Terminal({
      cursorBlink: true,
      fontFamily: "'Fira Code', 'Courier New', monospace",
      fontSize: 14,
      theme: {
        background: "#0f172a",
        foreground: "#f8fafc",
        cursor: "#38bdf8",
        selectionBackground: "#334155",
        black: "#1e293b",
        red: "#f43f5e",
        green: "#10b981",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#ec4899",
        cyan: "#06b6d4",
        white: "#f8fafc",
      },
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.open(container);
    this.fitAddon.fit();

    window.addEventListener("resize", () => this.fitAddon.fit());

    this.init();
  }

  private async init() {
    await this.kernel.mountOpfsStorage();
    this.terminal.writeln("\x1b[1;36m=====================================================\x1b[0m");
    this.terminal.writeln("\x1b[1;32m       Styx Unix-Compatible Browser OS v0.1.0        \x1b[0m");
    this.terminal.writeln("\x1b[1;36m=====================================================\x1b[0m");
    this.terminal.writeln("Kernel initialized with VFS, OPFS storage, and WASI app execution.");
    this.terminal.writeln("Type \x1b[1;33mhelp\x1b[0m for commands, \x1b[1;33mexec /bin/hello.wasm\x1b[0m, or \x1b[1;33mposix-test\x1b[0m.\n");

    this.prompt();
    this.setupListeners();
  }

  public writeOutput(text: string): void {
    if (!text) return;
    const formatted = text.replace(/\r?\n/g, "\r\n");
    this.terminal.write(formatted);
  }

  private prompt() {
    const cwd = this.kernel.getCwd();
    const username = this.kernel.userManager.getCurrentUser().username;
    const color = username === "root" ? "\x1b[1;31m" : "\x1b[1;32m";
    this.terminal.write(`${color}${username}@styx\x1b[0m:\x1b[1;34m${cwd}\x1b[0m$ `);
  }

  private setupListeners() {
    this.terminal.onData((data) => {
      if (this.activeVim) {
        this.terminal.clear();
        const res = this.activeVim.handleKey(data);
        this.writeOutput(res.output);
        if (res.quit) {
          this.activeVim = null;
          this.terminal.clear();
          this.prompt();
        }
        return;
      }

      if (this.activeNano) {
        this.terminal.clear();
        const res = this.activeNano.handleKey(data);
        this.writeOutput(res.output);
        if (res.quit) {
          this.activeNano = null;
          this.terminal.clear();
          this.prompt();
        }
        return;
      }

      for (let i = 0; i < data.length; i++) {
        const char = data[i];
        const code = char.charCodeAt(0);

        if (char === "\u0003") { // Ctrl+C SIGINT
          this.terminal.writeln("^C");
          this.kernel.sys_kill(1, 2); // Signal.SIGINT = 2
          this.inputBuffer = "";
          this.prompt();
          return;
        }

        if (char === "\t") { // Tab auto-completion (Command & VFS Path)
          const isPathCompletion = this.inputBuffer.includes(" ");
          if (isPathCompletion) {
            const parts = this.inputBuffer.split(" ");
            const lastPart = parts[parts.length - 1];
            const { candidates, completion } = this.kernel.historyManager.autoCompletePath(lastPart, this.kernel);

            if (candidates.length === 1 && completion) {
              this.inputBuffer += completion;
              this.terminal.write(completion);
            } else if (candidates.length > 1) {
              this.terminal.writeln("");
              this.terminal.writeln(`  ${candidates.join("   ")}`);
              this.prompt();
              this.terminal.write(this.inputBuffer);
            }
          } else {
            const available = ["cat", "ls", "pwd", "mkdir", "rm", "cp", "mv", "whoami", "su", "sudo", "ps", "kill", "draw", "curl", "calc", "wc", "spkg", "nano", "edit", "top", "beep", "env", "export", "unset", "rand", "signal", "tar", "gzip", "ping", "cron", "crontab", "dmesg", "history", "lspci", "lsusb", "man", "vim", "vi"];
            const candidates = this.kernel.historyManager.autoComplete(this.inputBuffer, available);

            if (candidates.length === 1) {
              const completion = candidates[0].substring(this.inputBuffer.length);
              this.inputBuffer += completion;
              this.terminal.write(completion);
            } else if (candidates.length > 1) {
              this.terminal.writeln("");
              this.terminal.writeln(`  ${candidates.join("   ")}`);
              this.prompt();
              this.terminal.write(this.inputBuffer);
            }
          }
          return;
        }

        if (code === 13) {
          // Enter key
          this.terminal.writeln("");
          if (this.inputBuffer.trim()) {
            this.kernel.historyManager.add(this.inputBuffer);
          }
          this.executeCommand(this.inputBuffer.trim());
          this.inputBuffer = "";
          this.prompt();
        } else if (code === 127) {
          // Backspace
          if (this.inputBuffer.length > 0) {
            this.inputBuffer = this.inputBuffer.slice(0, -1);
            this.terminal.write("\b \b");
          }
        } else if (code >= 32) {
          // Printable chars
          this.inputBuffer += char;
          this.terminal.write(char);
        }
      }
    });
  }

  private executeCommand(cmdLine: string) {
    if (!cmdLine) return;

    if (cmdLine.includes("|") || cmdLine.includes(">") || cmdLine.includes("<")) {
      this.pipelineEngine.executePipeline(
        cmdLine,
        (stdout) => this.writeOutput(stdout),
        (stderr) => this.writeOutput(`\x1b[1;31m${stderr}\x1b[0m`)
      ).catch((err) => {
        this.terminal.writeln(`\x1b[1;31mPipeline Error: ${err.message}\x1b[0m`);
      });
      return;
    }

    const parts = cmdLine.split(" ").filter(Boolean);
    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      switch (cmd) {
        case "help":
          this.terminal.writeln("Available Unix OS commands:");
          this.terminal.writeln("  exec <path.wasm>  - Execute WebAssembly application binary");
          this.terminal.writeln("  ls [path]         - List directory contents");
          this.terminal.writeln("  cat <path>        - Display file content");
          this.terminal.writeln("  echo <text>       - Print text or redirect to file (e.g. echo hi > file)");
          this.terminal.writeln("  mkdir <path>      - Create directory");
          this.terminal.writeln("  cd <path>         - Change directory");
          this.terminal.writeln("  pwd               - Print working directory");
          this.terminal.writeln("  touch <path>      - Create empty file");
          this.terminal.writeln("  rm <path>         - Unlink/remove file");
          this.terminal.writeln("  stat <path>       - File stat information");
          this.terminal.writeln("  posix-test        - Run POSIX conformance & unit test suite");
          this.terminal.writeln("  clear             - Clear terminal screen");
          this.terminal.writeln("  mount-host        - Mount host directory (File System Access API)");
          break;

        case "exec":
          if (!args[0]) {
            this.terminal.writeln("Usage: exec <path.wasm>");
            return;
          }
          this.terminal.writeln(`Executing Wasm application binary '${args[0]}'...`);
          this.kernel.sys_execve(
            args[0],
            args,
            undefined,
            (stdout) => this.writeOutput(stdout),
            (stderr) => this.writeOutput(`\x1b[1;31m${stderr}\x1b[0m`)
          ).then((code) => {
            this.terminal.writeln(`\x1b[1;32mProcess finished with exit code ${code}\x1b[0m`);
          }).catch((err) => {
            this.terminal.writeln(`\x1b[1;31mExecve Error: ${err.message}\x1b[0m`);
          });
          break;

        case "calc":
          this.kernel.sys_execve(
            "/bin/calc.wasm",
            ["/bin/calc.wasm", ...args],
            undefined,
            (stdout) => this.writeOutput(stdout),
            (stderr) => this.writeOutput(`\x1b[1;31m${stderr}\x1b[0m`)
          );
          break;

        case "wc":
          this.kernel.sys_execve(
            "/bin/wc.wasm",
            ["/bin/wc.wasm", ...args],
            undefined,
            (stdout) => this.writeOutput(stdout),
            (stderr) => this.writeOutput(`\x1b[1;31m${stderr}\x1b[0m`)
          );
          break;

        case "curl":
          if (args[0]) {
            this.terminal.writeln(`Connecting to ${args[0]}...`);
            const sockFd = this.kernel.sys_socket();
            this.kernel.sys_connect(sockFd, args[0]).then(() => {
              const res = this.kernel.sys_recv(sockFd, 65536);
              this.kernel.sys_close(sockFd);
              this.terminal.writeln(new TextDecoder().decode(res));
            }).catch((err) => {
              this.terminal.writeln(`\x1b[1;31mSocket Error: ${err.message}\x1b[0m`);
            });
          } else {
            this.kernel.sys_execve(
              "/bin/curl.wasm",
              ["/bin/curl.wasm"],
              undefined,
              (stdout) => this.writeOutput(stdout),
              (stderr) => this.writeOutput(`\x1b[1;31m${stderr}\x1b[0m`)
            );
          }
          break;

        case "draw":
          this.kernel.sys_execve(
            "/bin/draw.wasm",
            ["/bin/draw.wasm"],
            undefined,
            (stdout) => this.writeOutput(stdout),
            (stderr) => this.writeOutput(`\x1b[1;31m${stderr}\x1b[0m`)
          );
          break;

        case "ps":
          this.kernel.sys_execve(
            "/bin/ps.wasm",
            ["/bin/ps.wasm"],
            undefined,
            (stdout) => this.writeOutput(stdout),
            (stderr) => this.writeOutput(`\x1b[1;31m${stderr}\x1b[0m`)
          );
          break;

        case "kill":
          if (args[0]) {
            const targetPid = parseInt(args[0], 10);
            try {
              this.kernel.sys_kill(targetPid);
              this.terminal.writeln(`Sent SIGKILL signal to PID ${targetPid}`);
            } catch (err: any) {
              this.terminal.writeln(`\x1b[1;31mKill Error: ${err.message}\x1b[0m`);
            }
          } else {
            this.terminal.writeln("Usage: kill <pid>");
          }
          break;

        case "whoami":
          this.terminal.writeln(this.kernel.userManager.getCurrentUser().username);
          break;

        case "su":
          const targetUser = args[0] || "root";
          try {
            this.kernel.userManager.setCurrentUser(targetUser);
            this.terminal.writeln(`Switched shell user context to '${targetUser}'`);
          } catch (err: any) {
            this.terminal.writeln(`\x1b[1;31mAuth Error: ${err.message}\x1b[0m`);
          }
          break;

        case "sudo":
          if (args.length === 0) {
            this.terminal.writeln("Usage: sudo <command>");
          } else {
            const prevUser = this.kernel.userManager.getCurrentUser().username;
            this.kernel.userManager.setCurrentUser("root");
            this.executeCommand(args.join(" "));
            this.kernel.userManager.setCurrentUser(prevUser);
          }
          break;

        case "sh":
          if (args[0]) {
            this.pipelineEngine.executePipeline(`sh ${args.join(" ")}`, (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          } else {
            this.terminal.writeln("Styx Shell Subshell v0.1.0");
          }
          break;

        case "spkg":
          this.pipelineEngine.executePipeline(`spkg ${args.join(" ")}`, (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "nano":
        case "edit":
          const targetNanoPath = args[0] || "/home/user/newfile.txt";
          const fullNanoPath = targetNanoPath.startsWith("/") ? targetNanoPath : `${this.kernel.getCwd()}/${targetNanoPath}`;
          this.activeNano = new NanoEditor(this.kernel, fullNanoPath);
          this.terminal.clear();
          this.writeOutput(this.activeNano.render());
          break;

        case "top":
          this.pipelineEngine.executePipeline("top", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "beep":
          this.pipelineEngine.executePipeline("beep", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "env":
          this.writeOutput(this.kernel.envManager.formatEnvOutput());
          break;

        case "export":
          if (args[0] && args[0].includes("=")) {
            const [key, ...valParts] = args[0].split("=");
            this.kernel.envManager.setenv(key, valParts.join("="));
          } else {
            this.writeOutput(this.kernel.envManager.formatEnvOutput());
          }
          break;

        case "unset":
          if (args[0]) {
            this.kernel.envManager.unsetenv(args[0]);
          } else {
            this.terminal.writeln("Usage: unset <VARIABLE>");
          }
          break;

        case "rand":
          this.pipelineEngine.executePipeline("rand", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "signal":
          this.pipelineEngine.executePipeline("signal", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "tar":
          this.pipelineEngine.executePipeline("tar", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "gzip":
          this.pipelineEngine.executePipeline("gzip", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "ping":
          const hostArg = args[0] || "localhost";
          this.pipelineEngine.executePipeline(`ping ${hostArg}`, (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "cron":
        case "crontab":
          this.pipelineEngine.executePipeline(args[0] ? `crontab ${args[0]}` : "cron", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "dmesg":
          this.pipelineEngine.executePipeline("dmesg", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "history":
          this.pipelineEngine.executePipeline("history", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "bench":
          this.pipelineEngine.executePipeline("bench", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "lspci":
          this.pipelineEngine.executePipeline("lspci", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "lsusb":
          this.pipelineEngine.executePipeline("lsusb", (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "man":
          const cmdArg = args[0] || "spkg";
          this.pipelineEngine.executePipeline(`man ${cmdArg}`, (out) => this.writeOutput(out), (err) => this.writeOutput(`\x1b[1;31m${err}\x1b[0m`));
          break;

        case "vim":
        case "vi":
          const targetFile = args[0] || "/home/user/newfile.txt";
          const fullPath = targetFile.startsWith("/") ? targetFile : `${this.kernel.getCwd()}/${targetFile}`;
          this.activeVim = new VimEditor(this.kernel, fullPath);
          this.terminal.clear();
          this.writeOutput(this.activeVim.render());
          break;

        case "clear":
          this.terminal.clear();
          break;

        case "pwd":
          this.terminal.writeln(this.kernel.getCwd());
          break;

        case "cd":
          const target = args[0] || "/home/user";
          this.kernel.setCwd(target);
          break;

        case "ls":
          const path = args[0] || ".";
          const entries = this.kernel.sys_readdir(path);
          for (const entry of entries) {
            const formatted = entry.isDir
              ? `\x1b[1;34m${entry.name}/\x1b[0m`
              : entry.name;
            this.terminal.writeln(`  ${formatted.padEnd(20)} ${entry.size} bytes`);
          }
          break;

        case "cat":
          if (!args[0]) {
            this.terminal.writeln("Usage: cat <filename>");
            return;
          }
          const fd = this.kernel.sys_open(args[0], false);
          const buf = this.kernel.sys_read(fd, 4096);
          this.kernel.sys_close(fd);
          this.writeOutput(new TextDecoder().decode(buf));
          this.terminal.writeln("");
          break;

        case "touch":
          if (!args[0]) {
            this.terminal.writeln("Usage: touch <filename>");
            return;
          }
          const touchFd = this.kernel.sys_open(args[0], true);
          this.kernel.sys_close(touchFd);
          break;

        case "mkdir":
          if (!args[0]) {
            this.terminal.writeln("Usage: mkdir <dirname>");
            return;
          }
          this.kernel.sys_mkdir(args[0]);
          break;

        case "echo":
          const text = args.join(" ");
          if (text.includes(">")) {
            const [content, file] = text.split(">").map((s) => s.trim());
            const echoFd = this.kernel.sys_open(file, true);
            this.kernel.sys_write(echoFd, new TextEncoder().encode(content + "\n"));
            this.kernel.sys_close(echoFd);
          } else {
            this.terminal.writeln(text);
          }
          break;

        case "rm":
          if (!args[0]) {
            this.terminal.writeln("Usage: rm <filename>");
            return;
          }
          this.kernel.sys_unlink(args[0]);
          break;

        case "stat":
          if (!args[0]) {
            this.terminal.writeln("Usage: stat <path>");
            return;
          }
          const st = this.kernel.sys_stat(args[0]);
          this.terminal.writeln(`Inode: ${st.ino}`);
          this.terminal.writeln(`Mode: 0o${st.mode.toString(8)}`);
          this.terminal.writeln(`Size: ${st.size} bytes`);
          this.terminal.writeln(`Type: ${st.isDir ? "Directory" : "Regular File"}`);
          break;

        case "posix-test":
          this.terminal.writeln("Executing POSIX compatibility test suite...\n");
          const report = this.kernel.runPosixTestSuite();
          this.terminal.writeln(report);
          break;

        case "mount-host":
          if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
            (window as any).showDirectoryPicker().then((handle: any) => {
              this.terminal.writeln(`\x1b[1;32mMounted host directory '${handle.name}' into VFS /host\x1b[0m`);
            }).catch((err: any) => {
              this.terminal.writeln(`\x1b[1;31mMount canceled or failed: ${err.message}\x1b[0m`);
            });
          } else {
            this.terminal.writeln("File System Access API is not supported by this browser.");
          }
          break;

        default:
          this.terminal.writeln(`\x1b[1;31msh: command not found: ${cmd}\x1b[0m`);
      }
    } catch (err: any) {
      this.terminal.writeln(`\x1b[1;31mError: ${err.message}\x1b[0m`);
    }
  }
}
