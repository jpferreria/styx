/**
 * @file archive.ts
 * @module StyxOS/Kernel/Archive
 * @description File archiving, VFS directory backup exporter, and tarball stream packer/unpacker subsystem.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface ArchiveEntry {
  filename: string;
  size: number;
  data: Uint8Array;
}

export class ArchiveManager {
  createTar(entries: ArchiveEntry[]): Uint8Array {
    let totalLen = 0;
    entries.forEach((e) => {
      totalLen += 512 + Math.ceil(e.data.length / 512) * 512;
    });
    totalLen += 1024; // End of archive blocks

    const tar = new Uint8Array(totalLen);
    let offset = 0;

    entries.forEach((e) => {
      const header = new Uint8Array(512);
      const nameBytes = new TextEncoder().encode(e.filename);
      header.set(nameBytes.subarray(0, 100), 0);

      const modeBytes = new TextEncoder().encode("0000644\0");
      header.set(modeBytes, 100);

      const sizeOctal = e.data.length.toString(8).padStart(11, "0") + "\0";
      header.set(new TextEncoder().encode(sizeOctal), 124);

      header.set(new TextEncoder().encode("ustar\x00\x00\x00"), 257);

      tar.set(header, offset);
      offset += 512;

      tar.set(e.data, offset);
      offset += Math.ceil(e.data.length / 512) * 512;
    });

    return tar;
  }

  extractTar(tarData: Uint8Array): ArchiveEntry[] {
    const entries: ArchiveEntry[] = [];
    let offset = 0;

    while (offset + 512 <= tarData.length) {
      const header = tarData.subarray(offset, offset + 512);
      if (header[0] === 0) break;

      const filename = new TextDecoder().decode(header.subarray(0, 100)).replace(/\0.*$/, "");
      const sizeStr = new TextDecoder().decode(header.subarray(124, 135)).trim();
      const size = parseInt(sizeStr, 8) || 0;

      offset += 512;
      const data = tarData.slice(offset, offset + size);
      entries.push({ filename, size, data });

      offset += Math.ceil(size / 512) * 512;
    }

    return entries;
  }

  exportDirectory(targetPath: string, kernel: UnixKernel): Uint8Array {
    const entries: ArchiveEntry[] = [];

    const collect = (dirPath: string) => {
      const dirEntries = kernel.sys_readdir(dirPath);
      for (const entry of dirEntries) {
        const fullChildPath = dirPath === "/" ? `/${entry.name}` : `${dirPath}/${entry.name}`;
        if (entry.isDir) {
          collect(fullChildPath);
        } else {
          try {
            const fd = kernel.sys_open(fullChildPath, false);
            const data = kernel.sys_read(fd, 65536 * 16);
            kernel.sys_close(fd);
            const relativeName = fullChildPath.replace(/^\//, "");
            entries.push({ filename: relativeName, size: data.length, data });
          } catch {
            // Skip unreadable files
          }
        }
      }
    };

    collect(targetPath);
    return this.createTar(entries);
  }

  triggerBrowserDownload(data: Uint8Array, filename: string = "styx-vfs-backup.tar"): void {
    if (typeof document !== "undefined") {
      const blob = new Blob([data as any], { type: "application/x-tar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  downloadVfsArchive(targetPath: string = "/home/user", kernel: UnixKernel, filename: string = "styx-vfs-backup.tar"): string {
    const tarData = this.exportDirectory(targetPath, kernel);
    this.triggerBrowserDownload(tarData, filename);
    return `[exported VFS directory '${targetPath}' (${tarData.length} bytes) to host download '${filename}']\n`;
  }
}
