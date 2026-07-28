/**
 * @file pipeline.ts
 * @module StyxOS/ShellHost/Pipeline
 * @description Shell command pipeline parser and redirection execution engine for Styx OS.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "../kernel";
import { ScriptInterpreter } from "./script";
import { SystemMonitor } from "./top";
import { BenchmarkEngine } from "../kernel/bench";

export interface CommandStage {
  cmd: string;
  args: string[];
  inputFile?: string;
  outputFile?: string;
  appendOutput?: boolean;
}

export class PipelineEngine {
  private kernel: UnixKernel;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  parsePipeline(cmdLine: string): CommandStage[] {
    const pipeSegments = cmdLine.split("|").map((s) => s.trim());
    const stages: CommandStage[] = [];

    for (const segment of pipeSegments) {
      let current = segment;
      let inputFile: string | undefined;
      let outputFile: string | undefined;
      let appendOutput = false;

      // Handle output redirection >> or >
      if (current.includes(">>")) {
        const [left, right] = current.split(">>").map((s) => s.trim());
        current = left;
        outputFile = right;
        appendOutput = true;
      } else if (current.includes(">")) {
        const [left, right] = current.split(">").map((s) => s.trim());
        current = left;
        outputFile = right;
        appendOutput = false;
      }

      // Handle input redirection <
      if (current.includes("<")) {
        const [left, right] = current.split("<").map((s) => s.trim());
        current = left;
        inputFile = right;
      }

      const parts = current.split(" ").filter(Boolean);
      if (parts.length > 0) {
        stages.push({
          cmd: parts[0],
          args: parts.slice(1),
          inputFile,
          outputFile,
          appendOutput,
        });
      }
    }

    return stages;
  }

  async executePipeline(
    cmdLine: string,
    onStdout: (text: string) => void,
    onStderr: (text: string) => void
  ): Promise<void> {
    const stages = this.parsePipeline(cmdLine);
    if (stages.length === 0) return;

    let previousPipeReadFd: number | null = null;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const isLast = i === stages.length - 1;

      // Create pipe for next stage if not last
      let nextPipeReadFd: number | null = null;
      let nextPipeWriteFd: number | null = null;

      if (!isLast) {
        [nextPipeReadFd, nextPipeWriteFd] = this.kernel.sys_pipe();
      }

      // Determine stdin input
      let inputData: Uint8Array | null = null;

      if (stage.inputFile) {
        const inFd = this.kernel.sys_open(stage.inputFile, false);
        inputData = this.kernel.sys_read(inFd, 65536);
        this.kernel.sys_close(inFd);
      } else if (previousPipeReadFd !== null) {
        inputData = this.kernel.sys_read(previousPipeReadFd, 65536);
        this.kernel.sys_close(previousPipeReadFd);
      }

      // Determine stdout target
      let outputCollector: (text: string) => void;

      if (stage.outputFile) {
        const outFd = this.kernel.sys_open(stage.outputFile, true);
        outputCollector = (text: string) => {
          this.kernel.sys_write(outFd, new TextEncoder().encode(text));
          this.kernel.sys_close(outFd);
        };
      } else if (nextPipeWriteFd !== null) {
        outputCollector = (text: string) => {
          this.kernel.sys_write(nextPipeWriteFd!, new TextEncoder().encode(text));
        };
      } else {
        outputCollector = onStdout;
      }

      // Execute stage command
      await this.executeStage(stage, inputData, outputCollector, onStderr);

      previousPipeReadFd = nextPipeReadFd;
    }
  }

  private async executeStage(
    stage: CommandStage,
    inputData: Uint8Array | null,
    onStdout: (text: string) => void,
    onStderr: (text: string) => void
  ): Promise<void> {
    const { cmd, args } = stage;

    switch (cmd) {
      case "sh":
        let debugMode = false;
        let scriptPathIndex = 0;
        if (args[0] === "-x") {
          debugMode = true;
          scriptPathIndex = 1;
        }

        if (args[scriptPathIndex]) {
          try {
            const fd = this.kernel.sys_open(args[scriptPathIndex], false);
            const scriptBytes = this.kernel.sys_read(fd, 65536);
            this.kernel.sys_close(fd);
            const scriptText = new TextDecoder().decode(scriptBytes);
            const interpreter = new ScriptInterpreter(this.kernel, this);
            await interpreter.executeScript(scriptText, args.slice(scriptPathIndex + 1), onStdout, onStderr, debugMode);
          } catch (err: any) {
            onStderr(`sh: ${err.message}\n`);
          }
        }
        break;

      case "exec":
        if (args[0]) {
          await this.kernel.sys_execve(args[0], args, undefined, onStdout, onStderr);
        }
        break;

      case "calc":
        await this.kernel.sys_execve("/bin/calc.wasm", ["/bin/calc.wasm", ...args], undefined, onStdout, onStderr);
        break;

      case "wc":
        await this.kernel.sys_execve("/bin/wc.wasm", ["/bin/wc.wasm", ...args], undefined, onStdout, onStderr);
        break;

      case "curl":
        if (args[0]) {
          const sockFd = this.kernel.sys_socket();
          await this.kernel.sys_connect(sockFd, args[0]);
          const responseBytes = this.kernel.sys_recv(sockFd, 65536);
          this.kernel.sys_close(sockFd);
          onStdout(new TextDecoder().decode(responseBytes));
        } else {
          await this.kernel.sys_execve("/bin/curl.wasm", ["/bin/curl.wasm"], undefined, onStdout, onStderr);
        }
        break;

      case "draw":
        await this.kernel.sys_execve("/bin/draw.wasm", ["/bin/draw.wasm"], undefined, onStdout, onStderr);
        break;

      case "ps":
        await this.kernel.sys_execve("/bin/ps.wasm", ["/bin/ps.wasm"], undefined, onStdout, onStderr);
        break;

      case "kill":
        await this.kernel.sys_execve("/bin/kill.wasm", ["/bin/kill.wasm"], undefined, onStdout, onStderr);
        break;

      case "whoami":
        onStdout(`${this.kernel.userManager.getCurrentUser().username}\n`);
        break;

      case "su":
        if (args[0]) {
          this.kernel.userManager.setCurrentUser(args[0]);
          onStdout(`Switched user context to '${args[0]}'\n`);
        }
        break;

      case "sudo":
        const prevUser = this.kernel.userManager.getCurrentUser().username;
        this.kernel.userManager.setCurrentUser("root");
        if (args.length > 0) {
          await this.executeStage({ cmd: args[0], args: args.slice(1) }, inputData, onStdout, onStderr);
        }
        this.kernel.userManager.setCurrentUser(prevUser);
        break;

      case "spkg":
        if (args[0] === "update") {
          const updateOut = await this.kernel.pkgManager.update();
          onStdout(updateOut);
        } else if (args[0] === "list") {
          onStdout(this.kernel.pkgManager.list());
        } else if (args[0] === "install" && args[1]) {
          const ok = this.kernel.pkgManager.install(args[1]);
          onStdout(ok ? `Successfully installed ${args[1]}\n` : `Package ${args[1]} not found\n`);
        } else if (args[0] === "remove" && args[1]) {
          const ok = this.kernel.pkgManager.remove(args[1]);
          onStdout(ok ? `Successfully removed ${args[1]}\n` : `Package ${args[1]} not installed\n`);
        } else if (args[0] === "export") {
          const target = args[1] || "/home/user";
          onStdout(this.kernel.pkgManager.export(target));
        } else {
          await this.kernel.sys_execve("/bin/spkg.wasm", ["/bin/spkg.wasm"], undefined, onStdout, onStderr);
        }
        break;

      case "nano":
        await this.kernel.sys_execve("/bin/nano.wasm", ["/bin/nano.wasm"], undefined, onStdout, onStderr);
        break;

      case "top":
        const monitor = new SystemMonitor(this.kernel);
        onStdout(monitor.generateReport());
        break;

      case "beep":
        const dspFd = this.kernel.sys_open("/dev/dsp", true);
        this.kernel.sys_write(dspFd, new Uint8Array([110, 220, 440, 880]));
        this.kernel.sys_close(dspFd);
        await this.kernel.sys_execve("/bin/beep.wasm", ["/bin/beep.wasm"], undefined, onStdout, onStderr);
        break;

      case "env":
        onStdout(this.kernel.envManager.formatEnvOutput());
        break;

      case "export":
        if (args[0] && args[0].includes("=")) {
          const [key, ...valParts] = args[0].split("=");
          this.kernel.envManager.setenv(key, valParts.join("="));
        } else {
          onStdout(this.kernel.envManager.formatEnvOutput());
        }
        break;

      case "unset":
        if (args[0]) {
          this.kernel.envManager.unsetenv(args[0]);
        }
        break;

      case "rand":
        await this.kernel.sys_execve("/bin/rand.wasm", ["/bin/rand.wasm"], undefined, onStdout, onStderr);
        break;

      case "signal":
        await this.kernel.sys_execve("/bin/signal.wasm", ["/bin/signal.wasm"], undefined, onStdout, onStderr);
        break;

      case "tar":
        await this.kernel.sys_execve("/bin/tar.wasm", ["/bin/tar.wasm"], undefined, onStdout, onStderr);
        break;

      case "gzip":
        await this.kernel.sys_execve("/bin/gzip.wasm", ["/bin/gzip.wasm"], undefined, onStdout, onStderr);
        break;

      case "ping":
        const targetHost = args[0] || "localhost";
        const pingReport = await this.kernel.netManager.ping(targetHost, 4);
        onStdout(pingReport);
        break;

      case "cron":
      case "crontab":
        if (args[0] === "-l") {
          onStdout(this.kernel.cronManager.formatJobList());
        } else {
          await this.kernel.sys_execve("/bin/cron.wasm", ["/bin/cron.wasm"], undefined, onStdout, onStderr);
        }
        break;

      case "dmesg":
        onStdout(this.kernel.loggerManager.formatDmesg());
        break;

      case "history":
        onStdout(this.kernel.historyManager.formatHistory());
        break;

      case "bench":
        const benchEngine = new BenchmarkEngine(this.kernel);
        const report = await benchEngine.runBenchmark();
        onStdout(report);
        break;

      case "lspci":
        onStdout(this.kernel.hwProbeEngine.lspci());
        break;

      case "lsusb":
        onStdout(this.kernel.hwProbeEngine.lsusb());
        break;

      case "man":
        const targetCmd = args[0] || "spkg";
        onStdout(this.kernel.manualManager.getManPage(targetCmd));
        break;

      case "vim":
        onStdout(`VIM Terminal Text Editor: Run 'vim <file>' in interactive shell terminal.\n`);
        break;

      case "pty":
        onStdout(this.kernel.ptyManager.listSessions());
        break;

      case "ifconfig":
        onStdout(this.kernel.netManager.formatIfconfig());
        break;

      case "theme":
        if (args[0]) {
          const ok = this.kernel.themeManager.setTheme(args[0]);
          onStdout(ok ? `Successfully applied desktop theme '${args[0]}'\n` : `Theme '${args[0]}' not found. Available: dark, cyberpunk, retro, light\n`);
        } else {
          onStdout(this.kernel.themeManager.listThemes());
        }
        break;

      case "swapon":
        this.kernel.swapManager.swapon();
        onStdout(this.kernel.swapManager.formatSwapon());
        break;

      case "swapoff":
        this.kernel.swapManager.swapoff();
        onStdout(`Disabled virtual swap file device (/var/swap).\n`);
        break;

      case "sysbench":
        onStdout(this.kernel.profilerEngine.formatReport(args[0] || "cpu"));
        break;

      case "getfattr":
        const targetPath = args.includes("-d") ? args.filter((a) => a !== "-d")[0] : args[0];
        if (targetPath) {
          onStdout(this.kernel.xattrManager.formatGetFAttr(targetPath));
        } else {
          onStderr("Usage: getfattr [-d] <path>\n");
        }
        break;

      case "setfattr":
        let attrName = "";
        let attrVal = "";
        let filePath = "";

        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-n" && args[i + 1]) {
            attrName = args[i + 1];
            i++;
          } else if (args[i] === "-v" && args[i + 1]) {
            attrVal = args[i + 1];
            i++;
          } else if (!args[i].startsWith("-")) {
            filePath = args[i];
          }
        }

        if (attrName && filePath) {
          this.kernel.xattrManager.setXAttr(filePath, attrName, attrVal);
          onStdout(`Set attribute '${attrName}' on '${filePath}'\n`);
        } else {
          onStderr("Usage: setfattr -n <name> -v <val> <path>\n");
        }
        break;

      case "alias":
        if (args[0]) {
          const aliasExpr = args.join(" ");
          if (aliasExpr.includes("=")) {
            const [name, ...valParts] = aliasExpr.split("=");
            const val = valParts.join("=").replace(/^['"]|['"]$/g, "");
            this.kernel.aliasManager.setAlias(name, val);
            onStdout(`Created alias ${name}='${val}'\n`);
          } else {
            const val = this.kernel.aliasManager.getAlias(args[0]);
            onStdout(val ? `alias ${args[0]}='${val}'\n` : `alias: ${args[0]}: not found\n`);
          }
        } else {
          onStdout(this.kernel.aliasManager.listAliases());
        }
        break;

      case "unalias":
        if (args[0]) {
          const ok = this.kernel.aliasManager.removeAlias(args[0]);
          onStdout(ok ? `Removed alias '${args[0]}'\n` : `unalias: ${args[0]}: not found\n`);
        } else {
          onStderr("Usage: unalias <name>\n");
        }
        break;

      case "top-gui": {
        const topReport = this.kernel.procFSNode ? new TextDecoder().decode(this.kernel.procFSNode.read(0, 4096)) : "Process Monitor Active\n";
        onStdout(topReport);
        break;
      }

      case "ipcs":
        if (args.includes("-q")) {
          onStdout(this.kernel.mqueueManager.formatIpcsQueues());
        } else if (args.includes("-s")) {
          onStdout(this.kernel.semaphoreManager.formatIpcsSemaphores());
        } else {
          onStdout(this.kernel.shmManager.formatIpcs() + "\n" + this.kernel.semaphoreManager.formatIpcsSemaphores());
        }
        break;

      case "sem":
        onStdout(this.kernel.semaphoreManager.formatIpcsSemaphores());
        break;

      case "mqueue":
        onStdout(this.kernel.mqueueManager.formatIpcsQueues());
        break;

      case "termcolor":
      case "color":
        onStdout(this.kernel.termColorEngine.formatColorGrid());
        break;

      case "pmap":
        const targetPid = args[0] ? parseInt(args[0], 10) : 1;
        onStdout(this.kernel.pmapEngine.formatPMap(isNaN(targetPid) ? 1 : targetPid));
        break;

      case "lscpu":
        onStdout(this.kernel.hwProbeEngine.lscpu());
        break;

      case "epoll":
      case "eventfd":
        onStdout(this.kernel.eventNotificationEngine.formatEpollStats());
        break;

      case "mknod":
        if (args.length >= 4) {
          const [path, typeStr, majStr, minStr] = args;
          const type = typeStr === "b" ? "b" : "c";
          const major = parseInt(majStr, 10) || 1;
          const minor = parseInt(minStr, 10) || 0;
          this.kernel.deviceNodeEngine.mknod(path, type, major, minor);
          onStdout(`Created device node '${path}' (${type} ${major}:${minor})\n`);
        } else {
          onStderr("Usage: mknod <path> <c|b> <major> <minor>\n");
        }
        break;

      case "lsdev":
        onStdout(this.kernel.deviceNodeEngine.listDevices());
        break;

      case "mkfifo":
        if (args[0]) {
          this.kernel.fifoManager.mkfifo(args[0]);
          onStdout(`Created FIFO named pipe '${args[0]}'\n`);
        } else {
          onStderr("Usage: mkfifo <path>\n");
        }
        break;

      case "lsfifo":
        onStdout(this.kernel.fifoManager.listFifos());
        break;

      case "ldd":
        const binTarget = args[0] || "/bin/hello.wasm";
        onStdout(this.kernel.sharedLibraryEngine.ldd(binTarget));
        break;

      case "ldconfig":
        onStdout(this.kernel.sharedLibraryEngine.ldconfig());
        break;

      case "evtest":
        onStdout(this.kernel.inputDeviceEngine.evtest());
        break;

      case "lsinput":
        onStdout(this.kernel.inputDeviceEngine.listInputs());
        break;

      case "flock":
        if (args[0]) {
          const lockPath = args[0];
          this.kernel.fileLockEngine.lock(1, lockPath, "WRITE", false);
          onStdout(`Acquired advisory file lock on '${lockPath}'\n`);
          if (args[1] === "-c" && args[2]) {
            await this.executePipeline(args[2], onStdout, onStderr);
            this.kernel.fileLockEngine.unlock(1, lockPath);
            onStdout(`Released file lock on '${lockPath}'\n`);
          }
        } else {
          onStderr("Usage: flock <file> [-c <command>]\n");
        }
        break;

      case "lslocks":
        onStdout(this.kernel.fileLockEngine.listLocks());
        break;

      case "stty":
        onStdout(this.kernel.termiosEngine.stty(args));
        break;

      case "cat":
        if (args[0]) {
          const fd = this.kernel.sys_open(args[0], false);
          const buf = this.kernel.sys_read(fd, 65536);
          this.kernel.sys_close(fd);
          onStdout(new TextDecoder().decode(buf));
        } else if (inputData) {
          onStdout(new TextDecoder().decode(inputData));
        }
        break;

      case "echo":
        const text = args.join(" ");
        onStdout(text + "\n");
        break;

      default:
        if (cmd.endsWith(".sh") || cmd.startsWith("./") || cmd.startsWith("/")) {
          try {
            const scriptPath = cmd.startsWith("./") ? `/home/user/${cmd.substring(2)}` : cmd;
            const fd = this.kernel.sys_open(scriptPath, false);
            const scriptBytes = this.kernel.sys_read(fd, 65536);
            this.kernel.sys_close(fd);
            const scriptText = new TextDecoder().decode(scriptBytes);
            const interpreter = new ScriptInterpreter(this.kernel, this);
            await interpreter.executeScript(scriptText, args, onStdout, onStderr);
            break;
          } catch (_e) {
            onStderr(`sh: ${cmd}: No such file or script\n`);
            break;
          }
        }
        onStderr(`sh: command not found: ${cmd}\n`);
    }
  }
}
