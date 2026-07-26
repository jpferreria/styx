/**
 * @file cron.ts
 * @module StyxOS/Kernel/CronScheduler
 * @description Virtual cron task scheduler managing periodic job execution and /etc/crontab.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface CronJob {
  id: number;
  schedule: string;
  command: string;
  lastRun?: number;
}

export class CronManager {
  private jobs: CronJob[] = [];
  private nextId = 1;

  constructor() {
    this.addJob("*/5 * * * *", "echo 'Styx Cron Sync'");
    this.addJob("0 * * * *", "top");
  }

  addJob(schedule: string, command: string): CronJob {
    const job: CronJob = {
      id: this.nextId++,
      schedule,
      command,
    };
    this.jobs.push(job);
    return job;
  }

  removeJob(id: number): boolean {
    const initialLen = this.jobs.length;
    this.jobs = this.jobs.filter((j) => j.id !== id);
    return this.jobs.length < initialLen;
  }

  getJobs(): CronJob[] {
    return this.jobs;
  }

  generateEtcCrontab(): string {
    const lines: string[] = [
      "# /etc/crontab: system-wide crontab for Styx OS",
      "# m h dom mon dow user  command",
    ];
    for (const job of this.jobs) {
      lines.push(`${job.schedule.padEnd(16)} root  ${job.command}`);
    }
    return lines.join("\n") + "\n";
  }

  formatJobList(): string {
    const lines: string[] = ["ID   SCHEDULE        COMMAND"];
    for (const j of this.jobs) {
      lines.push(`${j.id.toString().padEnd(4)} ${j.schedule.padEnd(15)} ${j.command}`);
    }
    return lines.join("\n") + "\n";
  }
}
