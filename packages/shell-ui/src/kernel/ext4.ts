/**
 * @file ext4.ts
 * @module StyxOS/Kernel/Ext4BlockEngine
 * @description Virtual EXT4 Block Storage Driver & OPFS Persistence Engine (/dev/sda, fdisk, mkfs.ext4, mount, umount).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface Ext4Superblock {
  magic: number; // 0xEF53
  inodesCount: number;
  blocksCount: number;
  freeBlocksCount: number;
  freeInodesCount: number;
  blockSize: number;
  state: number; // 1 = Clean
  volumeName: string;
}

export interface Ext4Partition {
  device: string;
  startSector: number;
  endSector: number;
  sectors: number;
  sizeMb: number;
  type: string;
}

export class Ext4BlockEngine {
  private kernel: UnixKernel;
  private diskData: Uint8Array = new Uint8Array(64 * 1024 * 1024); // 64MB Virtual Disk
  private mountPoints: Map<string, string> = new Map(); // targetDir -> devicePath
  private formattedDevices: Map<string, Ext4Superblock> = new Map();

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
    this.initDevSda();
  }

  private initDevSda(): void {
    const devDir = this.kernel.resolvePath("/dev");
    if (devDir && devDir.stat().isDir) {
      if (!devDir.lookup("sda")) {
        devDir.createChild("sda", false, 0o660);
      }
    }
  }

  fdisk(args: string[]): string {
    if (args.includes("-l") || args.length === 0) {
      const lines: string[] = [
        "Disk /dev/sda: 64 MiB, 67108864 bytes, 131072 sectors",
        "Disk model: Styx OS OPFS Virtual Block Device",
        "Units: sectors of 1 * 512 = 512 bytes",
        "Sector size (logical/physical): 512 bytes / 512 bytes",
        "I/O size (minimum/optimal): 512 bytes / 512 bytes",
        "Disklabel type: gpt",
        "Disk identifier: 8E7F12A4-3C89-4B52-9A10-DF0987123456",
        "",
        "Device       Start    End Sectors Size Type",
        "/dev/sda1     2048 131038  128991  63M Linux filesystem",
      ];
      return lines.join("\n") + "\n";
    }
    return "fdisk: /dev/sda: GPT partition table formatted.\n";
  }

  mkfsExt4(devicePath: string = "/dev/sda", volumeName: string = "styx-data"): string {
    const superblock: Ext4Superblock = {
      magic: 0xEF53,
      inodesCount: 4096,
      blocksCount: 16384,
      freeBlocksCount: 16000,
      freeInodesCount: 4080,
      blockSize: 4096,
      state: 1,
      volumeName,
    };

    this.formattedDevices.set(devicePath, superblock);

    // Write EXT4 Magic 0xEF53 to byte offset 1024
    this.diskData[1024] = 0x53;
    this.diskData[1025] = 0xef;

    // Sync block storage with browser OPFS if available
    this.syncOpfs(volumeName);

    return `mke2fs 1.47.0 (05-Feb-2026)\nCreating filesystem with 16384 4k blocks and 4096 inodes\nFilesystem UUID: 4f1a2b3c-5d6e-7f8a-9b0c-1d2e3f4a5b6c\nSuperblock backups stored on blocks: 32768, 98304\n\nAllocating group tables: done\nWriting inode tables: done\nCreating journal (1024 blocks): done\nWriting superblocks and filesystem accounting information: done\nEXT4 Filesystem formatted on ${devicePath} (${volumeName}).\n`;
  }

  mount(devicePath: string, targetDir: string): boolean {
    const sb = this.formattedDevices.get(devicePath);
    if (!sb || sb.magic !== 0xEF53) {
      // Auto-format if unformatted
      this.mkfsExt4(devicePath);
    }

    const normTarget = targetDir.startsWith("/") ? targetDir : `/${targetDir}`;
    this.kernel.sys_mkdir(normTarget);
    this.mountPoints.set(normTarget, devicePath);
    return true;
  }

  umount(targetDir: string): boolean {
    const normTarget = targetDir.startsWith("/") ? targetDir : `/${targetDir}`;
    return this.mountPoints.delete(normTarget);
  }

  formatMountStatus(): string {
    const lines: string[] = [
      "sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)",
      "proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)",
      "devtmpfs on /dev type devtmpfs (rw,nosuid,size=32768k,nr_inodes=8192,mode=755)",
    ];

    for (const [target, dev] of this.mountPoints.entries()) {
      lines.push(`${dev} on ${target} type ext4 (rw,relatime,data=ordered)`);
    }

    return lines.join("\n") + "\n";
  }

  private syncOpfs(volumeName: string): void {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.getDirectory) {
      navigator.storage.getDirectory().then((root) => {
        root.getFileHandle(`styx_block_${volumeName}.img`, { create: true }).then((fileHandle) => {
          fileHandle.createWritable().then((writable) => {
            writable.write(this.diskData.slice(0, 1024 * 1024)); // Write initial 1MB block header
            writable.close();
          }).catch(() => {});
        }).catch(() => {});
      }).catch(() => {});
    }
  }
}
