/**
 * @file audio.ts
 * @module StyxOS/Kernel/AudioDevice
 * @description Virtual audio character device driver (/dev/dsp) interfacing with Web Audio API.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { VNode, FileStat, DirEntry } from "./index";

export class AudioDeviceNode implements VNode {
  ino: number;
  audioCtx: any = null;

  constructor(ino: number = 8) {
    this.ino = ino;
  }

  stat(): FileStat {
    return {
      ino: this.ino,
      mode: 0o666,
      size: 0,
      isDir: false,
      mtime: Date.now(),
    };
  }

  read(): Uint8Array {
    return new Uint8Array(0);
  }

  write(_offset: number, data: Uint8Array): number {
    try {
      if (typeof window !== "undefined") {
        const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          if (!this.audioCtx) {
            this.audioCtx = new AudioCtxClass();
          }
          const osc = this.audioCtx.createOscillator();
          const freq = data[0] ? data[0] * 4 : 440;
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
          osc.connect(this.audioCtx.destination);
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.15);
        }
      }
    } catch {
      // AudioContext fallback for headless test environments
    }
    return data.length;
  }

  readdir(): DirEntry[] {
    return [];
  }

  createChild(): VNode {
    throw new Error("Audio devices do not support directory child creation");
  }

  lookup(): VNode | null {
    return null;
  }

  removeChild(): void {
    throw new Error("Audio devices do not support directory child removal");
  }
}
