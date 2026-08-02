/**
 * @file index.ts
 * @module StyxOS/Kernel Core
 * @description Primary TypeScript kernel engine implementing VFS, OPFS storage, POSIX syscalls, and capability security.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { createHelloWasmBinary } from "./sampleWasm";
import { createCalcWasmBinary, createWcWasmBinary, createCurlWasmBinary, createDrawWasmBinary, createPsWasmBinary, createKillWasmBinary, createSuWasmBinary, createSudoWasmBinary, createWhoamiWasmBinary, createSpkgWasmBinary, createNanoWasmBinary, createTopWasmBinary, createBeepWasmBinary, createEnvWasmBinary, createRandWasmBinary, createSignalWasmBinary, createTarWasmBinary, createGzipWasmBinary, createPingWasmBinary, createCronWasmBinary, createDmesgWasmBinary, createHistoryWasmBinary, createBenchWasmBinary, createLspciWasmBinary, createLsusbWasmBinary, createManWasmBinary, createVimWasmBinary, createPtyWasmBinary, createIfconfigWasmBinary, createSpkgExportWasmBinary, createThemeWasmBinary, createShDebugWasmBinary, createSwaponWasmBinary, createSysbenchWasmBinary, createGetfattrWasmBinary, createSetfattrWasmBinary, createAliasWasmBinary, createTopGuiWasmBinary, createIpcsWasmBinary, createMqueueWasmBinary, createTermcolorWasmBinary, createPmapWasmBinary, createLscpuWasmBinary, createEpollWasmBinary, createMknodWasmBinary, createBrowserWasmBinary, createMkfifoWasmBinary, createLddWasmBinary, createEvtestWasmBinary, createSemWasmBinary, createFlockWasmBinary, createSttyWasmBinary, createMmapWasmBinary, createIpcrmWasmBinary, createTimeWasmBinary, createGetcapWasmBinary, createUlimitWasmBinary, createSysinfoWasmBinary, createPollWasmBinary, createSyscheckWasmBinary, createWasmInfoWasmBinary } from "./binaries";
import { WasmProcessRunner } from "./execve";
import { PipeNode } from "./pipe";
import { SocketNode, SocketDomain, SocketType } from "./socket";
import { FramebufferNode } from "./framebuffer";
import { ProcFSNode } from "./procfs";
import { UserManager } from "./user";
import { PackageManager } from "./pkg";
import { AudioDeviceNode } from "./audio";
import { EnvironmentManager } from "./env";
import { RandomDeviceNode } from "./random";
import { SignalManager, Signal, SignalHandler } from "./signal";
import { ArchiveManager } from "./archive";
import { NetworkManager } from "./net";
import { CronManager } from "./cron";
import { LoggerManager } from "./log";
import { HistoryManager } from "./history";
import { BenchmarkEngine } from "./bench";
import { SysFSManager } from "./sysfs";
import { ManualManager } from "./man";
import { PtyManager } from "./pty";
import { ThemeManager } from "../shell/theme";
import { SwapManager } from "./swap";
import { ProfilerEngine } from "./profile";
import { XAttrManager } from "./xattr";
import { AliasManager } from "../shell/alias";
import { SharedMemoryManager } from "./shm";
import { MessageQueueManager } from "./mqueue";
import { TermColorEngine } from "./termcolor";
import { PMapEngine } from "./pmap";
import { HardwareProbeEngine } from "./hwprobe";
import { EventNotificationEngine } from "./eventfd";
import { DeviceNodeEngine } from "./devnodes";
import { FIFOManager } from "./fifo";
import { SharedLibraryEngine } from "./shlib";
import { InputDeviceEngine } from "./input";
import { SemaphoreManager } from "./sem";
import { FileLockEngine } from "./flock";
import { TermiosEngine } from "./termios";
import { MMapEngine } from "./mmap";
import { IPCCleanupEngine } from "./ipc";
import { TimeEngine } from "./time";
import { CapabilityEngine } from "./cap";
import { ResourceLimitEngine } from "./rlimit";
import { SysInfoEngine } from "./sysinfo";
import { EventMultiplexEngine } from "./poll";
import { SystemDiagnosticEngine } from "./system";
import { StyxSandboxEngine } from "./sandbox";
import { Ext4BlockEngine } from "./ext4";
import { AccessControlListEngine } from "./acl";
import { CgroupV2Engine } from "./cgroup";
import { MutexSpinlockEngine } from "./mutex";
import { RecordLockEngine } from "./lockf";
import { LlmAgentServerEngine } from "./llm-server";

export enum Errno {
  EPERM = 1,
  ENOENT = 2,
  ESRCH = 3,
  EIO = 5,
  EBADF = 9,
  EACCES = 13,
  EEXIST = 17,
  ENOTDIR = 20,
  EISDIR = 21,
  EINVAL = 22,
}

export enum Capability {
  STORAGE_ACCESS = 1 << 0,
  PROCESS_EXEC   = 1 << 1,
  SYS_ADMIN      = 2 << 2,
  DAC_OVERRIDE   = 3 << 3,
}

export interface FileStat {
  ino: number;
  mode: number;
  size: number;
  isDir: boolean;
  mtime: number;
}

export interface DirEntry {
  name: string;
  isDir: boolean;
  size: number;
}

export interface VNode {
  stat(): FileStat;
  read(offset: number, count: number): Uint8Array;
  write(offset: number, data: Uint8Array): number;
  readdir(): DirEntry[];
  createChild(name: string, isDir: boolean, mode: number): VNode;
  lookup(name: string): VNode | null;
  removeChild(name: string): void;
}

export class MemNode implements VNode {
  ino: number;
  isDir: boolean;
  mode: number;
  size: number = 0;
  mtime: number = Date.now();
  data: Uint8Array = new Uint8Array(0);
  children: Map<string, VNode> = new Map();

  constructor(ino: number, isDir: boolean, mode: number) {
    this.ino = ino;
    this.isDir = isDir;
    this.mode = mode;
  }

  stat(): FileStat {
    return {
      ino: this.ino,
      mode: this.mode,
      size: this.isDir ? 4096 : this.data.length,
      isDir: this.isDir,
      mtime: this.mtime,
    };
  }

  read(offset: number, count: number): Uint8Array {
    if (offset >= this.data.length) return new Uint8Array(0);
    return this.data.slice(offset, offset + count);
  }

  write(offset: number, data: Uint8Array): number {
    if (offset + data.length > this.data.length) {
      const next = new Uint8Array(offset + data.length);
      next.set(this.data);
      this.data = next;
    }
    this.data.set(data, offset);
    this.size = this.data.length;
    this.mtime = Date.now();
    return data.length;
  }

  readdir(): DirEntry[] {
    const list: DirEntry[] = [];
    for (const [name, node] of this.children.entries()) {
      const s = node.stat();
      list.push({ name, isDir: s.isDir, size: s.size });
    }
    return list;
  }

  createChild(name: string, isDir: boolean, mode: number): VNode {
    if (this.children.has(name)) {
      throw new Error(`Errno ${Errno.EEXIST}: File exists`);
    }
    const child = new MemNode(Math.floor(Math.random() * 1000000) + 100, isDir, mode);
    this.children.set(name, child);
    return child;
  }

  lookup(name: string): VNode | null {
    return this.children.get(name) || null;
  }

  removeChild(name: string): void {
    if (!this.children.has(name)) {
      throw new Error(`Errno ${Errno.ENOENT}: No such file or directory`);
    }
    this.children.delete(name);
  }
}

export class UnixKernel {
  private root: MemNode;
  private cwd: string = "/home/user";
  private pid: number = 1;
  private capabilities: number = Capability.STORAGE_ACCESS | Capability.PROCESS_EXEC | Capability.SYS_ADMIN;
  private fds: Map<number, { node: VNode; offset: number }> = new Map();
  private nextFd: number = 3;
  private _opfsRoot: FileSystemDirectoryHandle | null = null;

  public userManager!: UserManager;
  public pkgManager!: PackageManager;
  public envManager!: EnvironmentManager;
  public signalManager!: SignalManager;
  public archiveManager!: ArchiveManager;
  public netManager!: NetworkManager;
  public cronManager!: CronManager;
  public loggerManager!: LoggerManager;
  public historyManager!: HistoryManager;
  public benchEngine!: BenchmarkEngine;
  public sysfsManager!: SysFSManager;
  public manualManager: ManualManager;
  public ptyManager: PtyManager;
  public themeManager: ThemeManager;
  public swapManager: SwapManager;
  public profilerEngine: ProfilerEngine;
  public xattrManager: XAttrManager;
  public aliasManager: AliasManager;
  public procFSNode: ProcFSNode;
  public shmManager: SharedMemoryManager;
  public mqueueManager: MessageQueueManager;
  public termColorEngine: TermColorEngine;
  public pmapEngine: PMapEngine;
  public hwProbeEngine: HardwareProbeEngine;
  public eventNotificationEngine: EventNotificationEngine;
  public deviceNodeEngine: DeviceNodeEngine;
  public fifoManager: FIFOManager;
  public sharedLibraryEngine: SharedLibraryEngine;
  public inputDeviceEngine: InputDeviceEngine;
  public semaphoreManager: SemaphoreManager;
  public fileLockEngine: FileLockEngine;
  public termiosEngine: TermiosEngine;
  public mmapEngine: MMapEngine;
  public ipcCleanupEngine: IPCCleanupEngine;
  public timeEngine: TimeEngine;
  public capabilityEngine: CapabilityEngine;
  public resourceLimitEngine: ResourceLimitEngine;
  public sysInfoEngine: SysInfoEngine;
  public eventMultiplexEngine: EventMultiplexEngine;
  public systemDiagnosticEngine: SystemDiagnosticEngine;
  public sandboxEngine: StyxSandboxEngine;
  public ext4BlockEngine: Ext4BlockEngine;
  public accessControlListEngine: AccessControlListEngine;
  public cgroupV2Engine: CgroupV2Engine;
  public mutexSpinlockEngine: MutexSpinlockEngine;
  public recordLockEngine: RecordLockEngine;
  public llmAgentServerEngine: LlmAgentServerEngine;

  constructor() {
    this.root = new MemNode(1, true, 0o755);
    this.procFSNode = new ProcFSNode(500, () => "PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ COMMAND\n1 root 20 0 10M 2M 1M S 0.5 0.1 0:01 init\n2 user 20 0 25M 4M 2M S 1.2 0.3 0:02 sh\n");
    this.userManager = new UserManager();
    this.pkgManager = new PackageManager(this);
    this.envManager = new EnvironmentManager();
    this.signalManager = new SignalManager();
    this.archiveManager = new ArchiveManager();
    this.netManager = new NetworkManager();
    this.cronManager = new CronManager();
    this.loggerManager = new LoggerManager();
    this.historyManager = new HistoryManager();
    this.benchEngine = new BenchmarkEngine(this);
    this.sysfsManager = new SysFSManager();
    this.manualManager = new ManualManager();
    this.ptyManager = new PtyManager(this);
    this.themeManager = new ThemeManager();
    this.swapManager = new SwapManager(this);
    this.profilerEngine = new ProfilerEngine(this);
    this.xattrManager = new XAttrManager(this);
    this.aliasManager = new AliasManager();
    this.shmManager = new SharedMemoryManager(this);
    this.mqueueManager = new MessageQueueManager(this);
    this.termColorEngine = new TermColorEngine();
    this.pmapEngine = new PMapEngine(this);
    this.hwProbeEngine = new HardwareProbeEngine(this);
    this.eventNotificationEngine = new EventNotificationEngine(this);
    this.deviceNodeEngine = new DeviceNodeEngine(this);
    this.fifoManager = new FIFOManager(this);
    this.sharedLibraryEngine = new SharedLibraryEngine(this);
    this.inputDeviceEngine = new InputDeviceEngine(this);
    this.semaphoreManager = new SemaphoreManager(this);
    this.termiosEngine = new TermiosEngine(this);
    this.ipcCleanupEngine = new IPCCleanupEngine(this);
    this.timeEngine = new TimeEngine(this);
    this.capabilityEngine = new CapabilityEngine(this);
    this.resourceLimitEngine = new ResourceLimitEngine(this);
    this.sysInfoEngine = new SysInfoEngine(this);
    this.eventMultiplexEngine = new EventMultiplexEngine(this);
    this.systemDiagnosticEngine = new SystemDiagnosticEngine(this);
    this.sandboxEngine = new StyxSandboxEngine(this);
    this.ext4BlockEngine = new Ext4BlockEngine(this);
    this.accessControlListEngine = new AccessControlListEngine(this);
    this.setupHierarchy();
    this.cgroupV2Engine = new CgroupV2Engine(this);
    this.mutexSpinlockEngine = new MutexSpinlockEngine(this);
    this.recordLockEngine = new RecordLockEngine(this);
    this.llmAgentServerEngine = new LlmAgentServerEngine(this);
    this.fileLockEngine = new FileLockEngine(this);
    this.mmapEngine = new MMapEngine(this);
  }

  private setupHierarchy() {
    // Mount /proc virtual filesystem
    this.root.createChild("proc", true, 0o755);

    const dev = this.root.createChild("dev", true, 0o755);
    dev.createChild("tty", false, 0o666);
    dev.createChild("null", false, 0o666);
    dev.createChild("zero", false, 0o666);
    dev.createChild("shm", true, 0o1777);
    dev.createChild("mqueue", true, 0o1777);

    // Pseudoterminal Master Device (/dev/ptmx) & Slave Devices (/dev/pts)
    dev.createChild("ptmx", false, 0o666);
    const ptsDevNode = dev.createChild("pts", true, 0o755);
    ptsDevNode.createChild("0", false, 0o620);
    ptsDevNode.createChild("1", false, 0o620);

    // Mount /usr/share/man/man1 hierarchy
    const usrNode = this.root.createChild("usr", true, 0o755);
    const shareNode = usrNode.createChild("share", true, 0o755);
    const manNode = shareNode.createChild("man", true, 0o755);
    const man1Node = manNode.createChild("man1", true, 0o755);

    const manFiles = this.manualManager.generateManPages();
    for (const file of manFiles) {
      const fileName = file.path.replace("/usr/share/man/man1/", "");
      const fNode = man1Node.createChild(fileName, false, 0o644);
      fNode.write(0, new TextEncoder().encode(file.content));
    }

    // Mount /sys SysFS hierarchy
    const sysNode = this.root.createChild("sys", true, 0o755);
    const busNode = sysNode.createChild("bus", true, 0o755);
    const pciBusNode = busNode.createChild("pci", true, 0o755);
    const pciDevsNode = pciBusNode.createChild("devices", true, 0o755);
    pciDevsNode.createChild("00:02.0", false, 0o444);

    const usbBusNode = busNode.createChild("usb", true, 0o755);
    const usbDevsNode = usbBusNode.createChild("devices", true, 0o755);
    usbDevsNode.createChild("1-1", false, 0o444);

    // Mount /etc system directory
    const etcNode = this.root.createChild("etc", true, 0o755);
    const passwdNode = etcNode.createChild("passwd", false, 0o644);
    passwdNode.write(0, new TextEncoder().encode(this.userManager.generateEtcPasswd()));

    const shadowNode = etcNode.createChild("shadow", false, 0o600);
    shadowNode.write(0, new TextEncoder().encode(this.userManager.generateEtcShadow()));

    const envFileNode = etcNode.createChild("environment", false, 0o644);
    envFileNode.write(0, new TextEncoder().encode(this.envManager.generateEtcEnvironment()));

    const hostsNode = etcNode.createChild("hosts", false, 0o644);
    hostsNode.write(0, new TextEncoder().encode(this.netManager.generateEtcHosts()));

    const crontabNode = etcNode.createChild("crontab", false, 0o644);
    crontabNode.write(0, new TextEncoder().encode(this.cronManager.generateEtcCrontab()));

    const spkgConfNode = etcNode.createChild("spkg.conf", false, 0o644);
    spkgConfNode.write(0, new TextEncoder().encode(this.pkgManager.generateEtcSpkgConf()));

    const resolvConfNode = etcNode.createChild("resolv.conf", false, 0o644);
    resolvConfNode.write(0, new TextEncoder().encode(this.netManager.generateResolvConf()));

    // Mount /var/log system logging hierarchy
    const varNode = this.root.createChild("var", true, 0o755);
    const logNode = varNode.createChild("log", true, 0o755);

    const syslogNode = logNode.createChild("syslog", false, 0o644);
    syslogNode.write(0, new TextEncoder().encode(this.loggerManager.generateSyslog()));

    const authlogNode = logNode.createChild("auth.log", false, 0o640);
    authlogNode.write(0, new TextEncoder().encode(this.loggerManager.generateAuthLog()));

    // Virtual Swap File /var/swap
    varNode.createChild("swap", false, 0o600);
    
    // Virtual Framebuffer Device /dev/fb0
    const fbNode = new FramebufferNode();
    (dev as MemNode).children.set("fb0", fbNode);

    // Virtual Audio Device /dev/dsp
    const audioNode = new AudioDeviceNode();
    (dev as MemNode).children.set("dsp", audioNode);

    // Cryptographic Random Devices /dev/urandom & /dev/random
    const randomNode = new RandomDeviceNode();
    (dev as MemNode).children.set("urandom", randomNode);
    (dev as MemNode).children.set("random", randomNode);

    // Stream aliases
    dev.createChild("stdin", false, 0o666);
    dev.createChild("stdout", false, 0o666);
    dev.createChild("stderr", false, 0o666);

    this.root.createChild("tmp", true, 0o777);
    const binNode = this.root.createChild("bin", true, 0o755);
    const home = this.root.createChild("home", true, 0o755);
    home.createChild("user", true, 0o755);

    // Mount /proc virtual filesystem
    const procNode = new ProcFSNode(2, () => "", true);
    (this.root as MemNode).children.set("proc", procNode);

    procNode.children.set("cpuinfo", new ProcFSNode(201, () => "processor\t: 0\nvendor_id\t: WasmEngine\ncpu family\t: 6\nmodel name\t: WebAssembly 32-bit (v8 / SIMD128)\n"));
    procNode.children.set("meminfo", new ProcFSNode(202, () => "MemTotal:\t 4194304 kB\nMemFree:\t 3145728 kB\nMemAvailable:\t 3670016 kB\nBuffers:\t  524288 kB\n"));
    procNode.children.set("uptime", new ProcFSNode(203, () => `${Math.floor(performance.now() / 1000)} ${Math.floor(performance.now() / 2000)}\n`));
    procNode.children.set("version", new ProcFSNode(204, () => "Linux version 6.1.0-styx-wasm (gcc 12.2.0) #1 SMP PREEMPT Styx OS v0.1.0\n"));

    const proc1Node = new ProcFSNode(205, () => "", true);
    procNode.children.set("1", proc1Node);
    proc1Node.children.set("status", new ProcFSNode(206, () => "Name:\tsh\nState:\tS (sleeping)\nTgid:\t1\nPid:\t1\nPPid:\t0\nUid:\t1000\t1000\t1000\t1000\nGid:\t1000\t1000\t1000\t1000\n"));

    // Mount built-in Wasm application binaries
    const helloAppNode = binNode.createChild("hello.wasm", false, 0o755);
    helloAppNode.write(0, createHelloWasmBinary());

    const calcAppNode = binNode.createChild("calc.wasm", false, 0o755);
    calcAppNode.write(0, createCalcWasmBinary());

    const wcAppNode = binNode.createChild("wc.wasm", false, 0o755);
    wcAppNode.write(0, createWcWasmBinary());

    const curlAppNode = binNode.createChild("curl.wasm", false, 0o755);
    curlAppNode.write(0, createCurlWasmBinary());

    const drawAppNode = binNode.createChild("draw.wasm", false, 0o755);
    drawAppNode.write(0, createDrawWasmBinary());

    const psAppNode = binNode.createChild("ps.wasm", false, 0o755);
    psAppNode.write(0, createPsWasmBinary());

    const killAppNode = binNode.createChild("kill.wasm", false, 0o755);
    killAppNode.write(0, createKillWasmBinary());

    const suAppNode = binNode.createChild("su.wasm", false, 0o755);
    suAppNode.write(0, createSuWasmBinary());

    const sudoAppNode = binNode.createChild("sudo.wasm", false, 0o755);
    sudoAppNode.write(0, createSudoWasmBinary());

    const whoamiAppNode = binNode.createChild("whoami.wasm", false, 0o755);
    whoamiAppNode.write(0, createWhoamiWasmBinary());

    const spkgAppNode = binNode.createChild("spkg.wasm", false, 0o755);
    spkgAppNode.write(0, createSpkgWasmBinary());

    const nanoAppNode = binNode.createChild("nano.wasm", false, 0o755);
    nanoAppNode.write(0, createNanoWasmBinary());

    const topAppNode = binNode.createChild("top.wasm", false, 0o755);
    topAppNode.write(0, createTopWasmBinary());

    const beepAppNode = binNode.createChild("beep.wasm", false, 0o755);
    beepAppNode.write(0, createBeepWasmBinary());

    const envAppNode = binNode.createChild("env.wasm", false, 0o755);
    envAppNode.write(0, createEnvWasmBinary());

    const randAppNode = binNode.createChild("rand.wasm", false, 0o755);
    randAppNode.write(0, createRandWasmBinary());

    const signalAppNode = binNode.createChild("signal.wasm", false, 0o755);
    signalAppNode.write(0, createSignalWasmBinary());

    const tarAppNode = binNode.createChild("tar.wasm", false, 0o755);
    tarAppNode.write(0, createTarWasmBinary());

    const gzipAppNode = binNode.createChild("gzip.wasm", false, 0o755);
    gzipAppNode.write(0, createGzipWasmBinary());

    const pingAppNode = binNode.createChild("ping.wasm", false, 0o755);
    pingAppNode.write(0, createPingWasmBinary());

    const cronAppNode = binNode.createChild("cron.wasm", false, 0o755);
    cronAppNode.write(0, createCronWasmBinary());

    const dmesgAppNode = binNode.createChild("dmesg.wasm", false, 0o755);
    dmesgAppNode.write(0, createDmesgWasmBinary());

    const historyAppNode = binNode.createChild("history.wasm", false, 0o755);
    historyAppNode.write(0, createHistoryWasmBinary());

    const benchAppNode = binNode.createChild("bench.wasm", false, 0o755);
    benchAppNode.write(0, createBenchWasmBinary());

    const lspciAppNode = binNode.createChild("lspci.wasm", false, 0o755);
    lspciAppNode.write(0, createLspciWasmBinary());

    const lsusbAppNode = binNode.createChild("lsusb.wasm", false, 0o755);
    lsusbAppNode.write(0, createLsusbWasmBinary());

    const manAppNode = binNode.createChild("man.wasm", false, 0o755);
    manAppNode.write(0, createManWasmBinary());

    const vimAppNode = binNode.createChild("vim.wasm", false, 0o755);
    vimAppNode.write(0, createVimWasmBinary());

    const ptyAppNode = binNode.createChild("pty.wasm", false, 0o755);
    ptyAppNode.write(0, createPtyWasmBinary());

    const ifconfigAppNode = binNode.createChild("ifconfig.wasm", false, 0o755);
    ifconfigAppNode.write(0, createIfconfigWasmBinary());

    const spkgExportAppNode = binNode.createChild("spkg-export.wasm", false, 0o755);
    spkgExportAppNode.write(0, createSpkgExportWasmBinary());

    const themeAppNode = binNode.createChild("theme.wasm", false, 0o755);
    themeAppNode.write(0, createThemeWasmBinary());

    const shDebugAppNode = binNode.createChild("sh-debug.wasm", false, 0o755);
    shDebugAppNode.write(0, createShDebugWasmBinary());

    const swaponAppNode = binNode.createChild("swapon.wasm", false, 0o755);
    swaponAppNode.write(0, createSwaponWasmBinary());

    const sysbenchAppNode = binNode.createChild("sysbench.wasm", false, 0o755);
    sysbenchAppNode.write(0, createSysbenchWasmBinary());

    const getfattrAppNode = binNode.createChild("getfattr.wasm", false, 0o755);
    getfattrAppNode.write(0, createGetfattrWasmBinary());

    const setfattrAppNode = binNode.createChild("setfattr.wasm", false, 0o755);
    setfattrAppNode.write(0, createSetfattrWasmBinary());

    const aliasAppNode = binNode.createChild("alias.wasm", false, 0o755);
    aliasAppNode.write(0, createAliasWasmBinary());

    const topGuiAppNode = binNode.createChild("top-gui.wasm", false, 0o755);
    topGuiAppNode.write(0, createTopGuiWasmBinary());

    const ipcsAppNode = binNode.createChild("ipcs.wasm", false, 0o755);
    ipcsAppNode.write(0, createIpcsWasmBinary());

    const mqueueAppNode = binNode.createChild("mqueue.wasm", false, 0o755);
    mqueueAppNode.write(0, createMqueueWasmBinary());

    const termcolorAppNode = binNode.createChild("termcolor.wasm", false, 0o755);
    termcolorAppNode.write(0, createTermcolorWasmBinary());

    const pmapAppNode = binNode.createChild("pmap.wasm", false, 0o755);
    pmapAppNode.write(0, createPmapWasmBinary());

    const lscpuAppNode = binNode.createChild("lscpu.wasm", false, 0o755);
    lscpuAppNode.write(0, createLscpuWasmBinary());

    const epollAppNode = binNode.createChild("epoll.wasm", false, 0o755);
    epollAppNode.write(0, createEpollWasmBinary());

    const mknodAppNode = binNode.createChild("mknod.wasm", false, 0o755);
    mknodAppNode.write(0, createMknodWasmBinary());

    const browserAppNode = binNode.createChild("browser.wasm", false, 0o755);
    browserAppNode.write(0, createBrowserWasmBinary());

    const mkfifoAppNode = binNode.createChild("mkfifo.wasm", false, 0o755);
    mkfifoAppNode.write(0, createMkfifoWasmBinary());

    const lddAppNode = binNode.createChild("ldd.wasm", false, 0o755);
    lddAppNode.write(0, createLddWasmBinary());

    const evtestAppNode = binNode.createChild("evtest.wasm", false, 0o755);
    evtestAppNode.write(0, createEvtestWasmBinary());

    const semAppNode = binNode.createChild("sem.wasm", false, 0o755);
    semAppNode.write(0, createSemWasmBinary());

    const flockAppNode = binNode.createChild("flock.wasm", false, 0o755);
    flockAppNode.write(0, createFlockWasmBinary());

    const sttyAppNode = binNode.createChild("stty.wasm", false, 0o755);
    sttyAppNode.write(0, createSttyWasmBinary());

    const mmapAppNode = binNode.createChild("mmap.wasm", false, 0o755);
    mmapAppNode.write(0, createMmapWasmBinary());

    const ipcrmAppNode = binNode.createChild("ipcrm.wasm", false, 0o755);
    ipcrmAppNode.write(0, createIpcrmWasmBinary());

    const timeAppNode = binNode.createChild("time.wasm", false, 0o755);
    timeAppNode.write(0, createTimeWasmBinary());

    const getcapAppNode = binNode.createChild("getcap.wasm", false, 0o755);
    getcapAppNode.write(0, createGetcapWasmBinary());

    const ulimitAppNode = binNode.createChild("ulimit.wasm", false, 0o755);
    ulimitAppNode.write(0, createUlimitWasmBinary());

    const sysinfoAppNode = binNode.createChild("sysinfo.wasm", false, 0o755);
    sysinfoAppNode.write(0, createSysinfoWasmBinary());

    const pollAppNode = binNode.createChild("poll.wasm", false, 0o755);
    pollAppNode.write(0, createPollWasmBinary());

    const syscheckAppNode = binNode.createChild("syscheck.wasm", false, 0o755);
    syscheckAppNode.write(0, createSyscheckWasmBinary());

    const wasmInfoAppNode = binNode.createChild("wasm-info.wasm", false, 0o755);
    wasmInfoAppNode.write(0, createWasmInfoWasmBinary());

    // Initial files
    const userHome = this.resolvePath("/home/user");
    const welcomeNode = userHome?.createChild("README.txt", false, 0o644);
    if (welcomeNode) {
      welcomeNode.write(0, new TextEncoder().encode("Welcome to Styx OS!\nA Unix-compatible Operating System in your browser.\nType 'help' for available commands.\n"));
    }

    const bashHistNode = userHome?.createChild(".bash_history", false, 0o600);
    if (bashHistNode) {
      bashHistNode.write(0, new TextEncoder().encode(this.historyManager.generateBashHistory()));
    }

    const demoScriptNode = userHome?.createChild("demo.sh", false, 0o755);
    if (demoScriptNode) {
      const demoScriptText = "#!/bin/sh\n# Styx OS Demo Shell Script\necho Executing Styx OS Script Demo...\necho Current User: $USER\ncalc\nwc\nwhoami\n";
      demoScriptNode.write(0, new TextEncoder().encode(demoScriptText));
    }
  }

  async mountOpfsStorage(): Promise<void> {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.getDirectory) {
      try {
        this._opfsRoot = await navigator.storage.getDirectory();
      } catch (err) {
        console.warn("OPFS not available, using in-memory VFS fallback:", err);
      }
    }
  }

  checkCap(required: Capability) {
    if ((this.capabilities & required) === 0) {
      throw new Error(`Errno ${Errno.EPERM}: Permission denied (Capability required: ${required})`);
    }
  }

  private normalizePath(path: string): string {
    if (!path.startsWith("/")) {
      path = this.cwd + "/" + path;
    }
    const parts = path.split("/").filter((p) => p && p !== ".");
    const stack: string[] = [];
    for (const p of parts) {
      if (p === "..") {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(p);
      }
    }
    return "/" + stack.join("/");
  }

  resolvePath(path: string): VNode | null {
    const fullPath = this.normalizePath(path);
    if (fullPath === "/") return this.root;

    const parts = fullPath.split("/").filter(Boolean);
    let curr: VNode = this.root;
    for (const part of parts) {
      const child = curr.lookup(part);
      if (!child) return null;
      curr = child;
    }
    return curr;
  }

  // Syscalls
  sys_open(path: string, create: boolean = false): number {
    this.checkCap(Capability.STORAGE_ACCESS);
    let node = this.resolvePath(path);
    if (!node) {
      if (!create) throw new Error(`Errno ${Errno.ENOENT}: No such file or directory`);
      const fullPath = this.normalizePath(path);
      const idx = fullPath.lastIndexOf("/");
      const parentPath = fullPath.slice(0, idx) || "/";
      const filename = fullPath.slice(idx + 1);
      const parent = this.resolvePath(parentPath);
      if (!parent) throw new Error(`Errno ${Errno.ENOENT}: Parent directory not found`);
      node = parent.createChild(filename, false, 0o644);
    }
    const fd = this.nextFd++;
    this.fds.set(fd, { node, offset: 0 });
    return fd;
  }

  sys_read(fd: number, count: number): Uint8Array {
    const descriptor = this.fds.get(fd);
    if (!descriptor) throw new Error(`Errno ${Errno.EBADF}: Bad file descriptor`);
    const chunk = descriptor.node.read(descriptor.offset, count);
    descriptor.offset += chunk.length;
    return chunk;
  }

  sys_write(fd: number, data: Uint8Array): number {
    const descriptor = this.fds.get(fd);
    if (!descriptor) throw new Error(`Errno ${Errno.EBADF}: Bad file descriptor`);
    const written = descriptor.node.write(descriptor.offset, data);
    descriptor.offset += written;
    return written;
  }

  sys_close(fd: number): void {
    if (!this.fds.has(fd)) throw new Error(`Errno ${Errno.EBADF}: Bad file descriptor`);
    this.fds.delete(fd);
  }

  sys_mkdir(path: string): void {
    this.checkCap(Capability.STORAGE_ACCESS);
    const fullPath = this.normalizePath(path);
    const idx = fullPath.lastIndexOf("/");
    const parentPath = fullPath.slice(0, idx) || "/";
    const dirName = fullPath.slice(idx + 1);
    const parent = this.resolvePath(parentPath);
    if (!parent) throw new Error(`Errno ${Errno.ENOENT}: Parent directory not found`);
    parent.createChild(dirName, true, 0o755);
  }

  sys_stat(path: string): FileStat {
    const node = this.resolvePath(path);
    if (!node) throw new Error(`Errno ${Errno.ENOENT}: No such file or directory`);
    return node.stat();
  }

  sys_fstat(fd: number): FileStat {
    const descriptor = this.fds.get(fd);
    if (!descriptor) throw new Error(`Errno ${Errno.EBADF}: Bad file descriptor`);
    return descriptor.node.stat();
  }

  sys_readdir(path: string): DirEntry[] {
    const node = this.resolvePath(path);
    if (!node) throw new Error(`Errno ${Errno.ENOENT}: No such file or directory`);
    if (!node.stat().isDir) throw new Error(`Errno ${Errno.ENOTDIR}: Not a directory`);
    return node.readdir();
  }

  sys_getuid(): number {
    return this.userManager.getCurrentUser().uid;
  }

  sys_getgid(): number {
    return this.userManager.getCurrentUser().gid;
  }

  sys_getenv(key: string): string | undefined {
    return this.envManager.getenv(key);
  }

  sys_setenv(key: string, val: string): void {
    this.envManager.setenv(key, val);
  }

  sys_unsetenv(key: string): void {
    this.envManager.unsetenv(key);
  }

  sys_setuid(uid: number): void {
    if (uid === 0) {
      this.userManager.setCurrentUser("root");
    } else {
      this.userManager.setCurrentUser("user");
    }
  }

  sys_setgid(_gid: number): void {
    // Set group ID handler
  }

  isOpfsActive(): boolean {
    return this._opfsRoot !== null;
  }

  sys_getpid(): number {
    return this.pid;
  }

  sys_kill(pid: number, sig: number = Signal.SIGKILL): void {
    if (pid === 1 && sig === Signal.SIGKILL) {
      throw new Error(`Errno ${Errno.EPERM}: Cannot kill init process (PID 1)`);
    }
    this.signalManager.sendSignal(pid, sig as Signal);
  }

  sys_signal(sig: Signal, handler: SignalHandler): void {
    this.signalManager.registerHandler(sig, handler);
  }

  sys_socket(domain: SocketDomain = SocketDomain.AF_INET, type: SocketType = SocketType.SOCK_STREAM): number {
    const socketNode = new SocketNode(Math.floor(Math.random() * 100000) + 10000, domain, type);
    const fd = this.nextFd++;
    this.fds.set(fd, { node: socketNode, offset: 0 });
    return fd;
  }

  async sys_connect(fd: number, url: string): Promise<void> {
    const descriptor = this.fds.get(fd);
    if (!descriptor || !(descriptor.node instanceof SocketNode)) {
      throw new Error(`Errno ${Errno.EBADF}: Descriptor is not a valid socket`);
    }
    await (descriptor.node as SocketNode).connect(url);
  }

  sys_send(fd: number, data: Uint8Array): number {
    return this.sys_write(fd, data);
  }

  sys_recv(fd: number, count: number): Uint8Array {
    return this.sys_read(fd, count);
  }

  sys_pipe(): [number, number] {
    const pipeNode = new PipeNode(Math.floor(Math.random() * 100000) + 5000);
    const readFd = this.nextFd++;
    const writeFd = this.nextFd++;
    this.fds.set(readFd, { node: pipeNode, offset: 0 });
    this.fds.set(writeFd, { node: pipeNode, offset: 0 });
    return [readFd, writeFd];
  }

  sys_dup2(oldFd: number, newFd: number): number {
    const descriptor = this.fds.get(oldFd);
    if (!descriptor) throw new Error(`Errno ${Errno.EBADF}: Bad file descriptor`);
    this.fds.set(newFd, { node: descriptor.node, offset: descriptor.offset });
    return newFd;
  }

  async sys_execve(
    path: string,
    argv?: string[],
    envp?: Record<string, string>,
    onStdout?: (data: string) => void,
    onStderr?: (data: string) => void
  ): Promise<number> {
    this.checkCap(Capability.PROCESS_EXEC);
    const runner = new WasmProcessRunner({
      kernel: this,
      path,
      argv,
      envp,
      onStdout,
      onStderr,
    });
    return await runner.run();
  }

  sys_unlink(path: string): void {
    this.checkCap(Capability.STORAGE_ACCESS);
    const fullPath = this.normalizePath(path);
    const idx = fullPath.lastIndexOf("/");
    const parentPath = fullPath.slice(0, idx) || "/";
    const filename = fullPath.slice(idx + 1);
    const parent = this.resolvePath(parentPath);
    if (!parent) throw new Error(`Errno ${Errno.ENOENT}: Parent directory not found`);
    parent.removeChild(filename);
  }

  getCwd(): string {
    return this.cwd;
  }

  setCwd(path: string): void {
    const node = this.resolvePath(path);
    if (!node) throw new Error(`Errno ${Errno.ENOENT}: Directory not found`);
    if (!node.stat().isDir) throw new Error(`Errno ${Errno.ENOTDIR}: Not a directory`);
    this.cwd = this.normalizePath(path);
  }

  runPosixTestSuite(): string {
    const results: string[] = ["=== POSIX Conformance Verification Suite ==="];
    let passed = 0;
    let total = 0;

    const assertTest = (name: string, fn: () => void) => {
      total++;
      try {
        fn();
        results.push(`[PASS] ${name}`);
        passed++;
      } catch (err: any) {
        results.push(`[FAIL] ${name}: ${err.message}`);
      }
    };

    assertTest("POSIX Syscall: mkdir & stat", () => {
      this.sys_mkdir("/tmp/posix_dir");
      const stat = this.sys_stat("/tmp/posix_dir");
      if (!stat.isDir) throw new Error("Expected directory");
    });

    assertTest("POSIX Syscall: open, write, read & close", () => {
      const fd = this.sys_open("/tmp/posix_file.txt", true);
      const text = "Unix Kernel POSIX Test 2026";
      this.sys_write(fd, new TextEncoder().encode(text));
      this.sys_close(fd);

      const fd2 = this.sys_open("/tmp/posix_file.txt", false);
      const readBuf = this.sys_read(fd2, 100);
      this.sys_close(fd2);

      const readText = new TextDecoder().decode(readBuf);
      if (readText !== text) throw new Error(`Mismatch: '${readText}' vs '${text}'`);
    });

    assertTest("POSIX Syscall: readdir & unlink", () => {
      const entriesBefore = this.sys_readdir("/tmp");
      this.sys_unlink("/tmp/posix_file.txt");
      const entriesAfter = this.sys_readdir("/tmp");
      if (entriesBefore.length <= entriesAfter.length) {
        throw new Error("Unlink failed to remove file entry");
      }
    });

    assertTest("Kernel Security: capability permission checks", () => {
      const savedCaps = this.capabilities;
      this.capabilities = 0; // Revoke all capabilities
      let denied = false;
      try {
        this.sys_mkdir("/tmp/unauthorized");
      } catch (e: any) {
        if (e.message.includes("Permission denied") || e.message.includes("EPERM") || e.message.includes("Errno 1")) denied = true;
      }
      this.capabilities = savedCaps;
      if (!denied) throw new Error("Security policy failed to block unauthorized syscall");
    });

    results.push(`\nSummary: ${passed}/${total} POSIX assertions passed successfully.`);
    return results.join("\n");
  }
}
