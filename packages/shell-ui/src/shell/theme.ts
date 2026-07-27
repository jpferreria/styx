/**
 * @file theme.ts
 * @module StyxOS/ShellHost/ThemeManager
 * @description Customizable desktop theme engine applying CSS custom properties for Dark, Cyberpunk, Retro, and Light modes.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface DesktopTheme {
  name: string;
  label: string;
  background: string;
  foreground: string;
  accent: string;
  panelBg: string;
  border: string;
}

export class ThemeManager {
  private themes: Map<string, DesktopTheme> = new Map();
  private activeThemeName: string = "dark";

  constructor() {
    this.themes.set("dark", {
      name: "dark",
      label: "Dark Glassmorphism (Default)",
      background: "#0f172a",
      foreground: "#f8fafc",
      accent: "#38bdf8",
      panelBg: "rgba(15, 23, 42, 0.85)",
      border: "rgba(255, 255, 255, 0.15)",
    });

    this.themes.set("cyberpunk", {
      name: "cyberpunk",
      label: "Cyberpunk Neon",
      background: "#05050a",
      foreground: "#00f3ff",
      accent: "#ff007f",
      panelBg: "rgba(5, 5, 10, 0.9)",
      border: "rgba(255, 0, 127, 0.4)",
    });

    this.themes.set("retro", {
      name: "retro",
      label: "Classic Retro UNIX",
      background: "#001100",
      foreground: "#00ff00",
      accent: "#ffb000",
      panelBg: "rgba(0, 17, 0, 0.92)",
      border: "rgba(0, 255, 0, 0.3)",
    });

    this.themes.set("light", {
      name: "light",
      label: "Light Glass",
      background: "#f8fafc",
      foreground: "#0f172a",
      accent: "#4f46e5",
      panelBg: "rgba(255, 255, 255, 0.85)",
      border: "rgba(15, 23, 42, 0.12)",
    });
  }

  getActiveThemeName(): string {
    return this.activeThemeName;
  }

  getTheme(name: string): DesktopTheme | undefined {
    return this.themes.get(name.toLowerCase());
  }

  setTheme(name: string): boolean {
    const theme = this.getTheme(name);
    if (!theme) return false;
    this.activeThemeName = theme.name;
    this.applyThemeToDom(theme.name);
    return true;
  }

  applyThemeToDom(name: string): void {
    const theme = this.getTheme(name);
    if (!theme || typeof document === "undefined") return;

    const root = document.documentElement;
    root.style.setProperty("--styx-bg", theme.background);
    root.style.setProperty("--styx-fg", theme.foreground);
    root.style.setProperty("--styx-accent", theme.accent);
    root.style.setProperty("--styx-panel-bg", theme.panelBg);
    root.style.setProperty("--styx-border", theme.border);
  }

  listThemes(): string {
    const lines: string[] = ["THEME        STATUS      DESCRIPTION"];
    for (const t of this.themes.values()) {
      const status = t.name === this.activeThemeName ? "[ACTIVE]" : "        ";
      lines.push(`${t.name.padEnd(12)} ${status}   ${t.label}`);
    }
    return lines.join("\n") + "\n";
  }
}
