/**
 * @file archive.ts
 * @module StyxOS/Kernel/Archive
 * @description File archiving and tarball stream packer/unpacker subsystem.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

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
      // 512-byte USTAR header block
      const header = new Uint8Array(512);
      const nameBytes = new TextEncoder().encode(e.filename);
      header.set(nameBytes.subarray(0, 100), 0);

      // File mode 0o644 (octal string)
      const modeBytes = new TextEncoder().encode("0000644\0");
      header.set(modeBytes, 100);

      // Size (octal string 11 chars)
      const sizeOctal = e.data.length.toString(8).padStart(11, "0") + "\0";
      header.set(new TextEncoder().encode(sizeOctal), 124);

      // USTAR magic
      header.set(new TextEncoder().encode("ustar\x00\x00\x00"), 257);

      tar.set(header, offset);
      offset += 512;

      // File payload
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
      // Check zero block (end of tar)
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
}
