/**
 * @file wm.ts
 * @module StyxOS/ShellHost/WindowManager
 * @description Desktop window manager handling draggable/resizable windows, Z-index stacking, taskbar tray clock, and notifications.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface WindowOptions {
  id: string;
  title: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export class WindowManager {
  private kernel?: any;
  private windows: Map<string, HTMLElement> = new Map();
  private minimized: Set<string> = new Set();
  private topZIndex: number = 100;
  private clockInterval?: ReturnType<typeof setInterval>;
  private glassmorphismEnabled: boolean = true;
  private currentWallpaper: string = "default-cyberpunk";

  constructor(kernel?: any) {
    this.kernel = kernel;
  }

  snapWindow(id: string, mode: "tile-left" | "tile-right" | "maximize" | "restore"): string {
    const win = this.windows.get(id) || Array.from(this.windows.values())[0];
    if (!win) {
      return `wm-config: no active window to snap (${mode})\n`;
    }
    if (mode === "tile-left") {
      win.style.left = "0px";
      win.style.top = "0px";
      win.style.width = "50vw";
      win.style.height = "100vh";
    } else if (mode === "tile-right") {
      win.style.left = "50vw";
      win.style.top = "0px";
      win.style.width = "50vw";
      win.style.height = "100vh";
    } else if (mode === "maximize") {
      win.style.left = "0px";
      win.style.top = "0px";
      win.style.width = "100vw";
      win.style.height = "100vh";
    } else if (mode === "restore") {
      win.style.left = "100px";
      win.style.top = "80px";
      win.style.width = "600px";
      win.style.height = "400px";
    }
    return `[snapped window layout: ${mode}]\n`;
  }

  setGlassmorphism(enabled: boolean): string {
    this.glassmorphismEnabled = enabled;
    if (typeof document !== "undefined" && document.body) {
      document.body.classList.toggle("glassmorphism-disabled", !enabled);
    }
    return `[glassmorphism theme: ${enabled ? "ENABLED" : "DISABLED"}]\n`;
  }

  setWallpaper(url: string): string {
    this.currentWallpaper = url;
    if (typeof document !== "undefined" && document.body) {
      document.body.style.backgroundImage = `url('${url}')`;
    }
    return `[desktop wallpaper updated: ${url}]\n`;
  }

  formatWmConfigStatus(): string {
    const activeCount = this.windows.size;
    const lines: string[] = [
      "=== Styx OS Window Manager Compositor & Theme Config ===",
      `Active Windows:        ${activeCount}`,
      `Glassmorphism Filter:  ${this.glassmorphismEnabled ? "ENABLED" : "DISABLED"}`,
      `Current Wallpaper:     ${this.currentWallpaper}`,
      `Top Stacking Z-Index:  ${this.topZIndex}`,
    ];
    return lines.join("\n") + "\n";
  }

  createWindow(options: WindowOptions, contentElement: HTMLElement): HTMLElement {
    const win = document.createElement("div");
    win.id = `win-${options.id}`;
    win.className = "styx-window";
    win.style.position = "absolute";
    win.style.width = `${options.width || 600}px`;
    win.style.height = `${options.height || 400}px`;
    win.style.left = `${options.x || 100}px`;
    win.style.top = `${options.y || 80}px`;
    win.style.zIndex = `${++this.topZIndex}`;

    const header = document.createElement("div");
    header.className = "window-header";
    header.innerHTML = `
      <div class="window-controls">
        <span class="control close" data-action="close"></span>
        <span class="control minimize" data-action="minimize"></span>
        <span class="control maximize" data-action="maximize"></span>
      </div>
      <div class="window-title">${options.title}</div>
    `;

    const body = document.createElement("div");
    body.className = "window-body";
    body.appendChild(contentElement);

    const resizer = document.createElement("div");
    resizer.className = "wm-resizer";
    resizer.style.position = "absolute";
    resizer.style.bottom = "0";
    resizer.style.right = "0";
    resizer.style.width = "14px";
    resizer.style.height = "14px";
    resizer.style.cursor = "se-resize";
    resizer.style.background = "rgba(255, 255, 255, 0.2)";
    resizer.style.borderTopLeftRadius = "4px";

    win.appendChild(header);
    win.appendChild(body);
    win.appendChild(resizer);

    this.makeDraggable(win, header);
    this.makeResizable(win, resizer);
    this.setupWindowListeners(win, options.id);

    document.getElementById("os-desktop")?.appendChild(win);
    this.windows.set(options.id, win);
    return win;
  }

  focusWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      if (this.minimized.has(id)) {
        this.restoreWindow(id);
      }
      win.style.zIndex = `${++this.topZIndex}`;
    }
  }

  minimizeWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.style.display = "none";
      this.minimized.add(id);
    }
  }

  restoreWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.style.display = "flex";
      this.minimized.delete(id);
      win.style.zIndex = `${++this.topZIndex}`;
    }
  }

  toggleWindow(id: string): void {
    if (this.minimized.has(id)) {
      this.restoreWindow(id);
    } else {
      this.minimizeWindow(id);
    }
  }

  closeWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.remove();
      this.windows.delete(id);
      this.minimized.delete(id);
    }
  }

  isMinimized(id: string): boolean {
    return this.minimized.has(id);
  }

  getFormattedTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  startClock(clockElement: HTMLElement): void {
    const update = () => {
      clockElement.textContent = this.getFormattedTime();
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  }

  stopClock(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  sendNotification(title: string, message: string, level: "info" | "success" | "warning" = "info"): HTMLElement {
    const notifContainer = document.getElementById("os-notification-center") || document.body;

    const notif = document.createElement("div");
    notif.className = `styx-notification notif-${level}`;
    notif.style.marginBottom = "8px";
    notif.style.padding = "10px 14px";
    notif.style.borderRadius = "8px";
    notif.style.background = "rgba(15, 23, 42, 0.85)";
    notif.style.backdropFilter = "blur(12px)";
    notif.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    notif.style.color = "#f8fafc";
    notif.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";

    notif.innerHTML = `
      <div style="font-weight: 600; font-size: 13px; color: #38bdf8; margin-bottom: 2px;">${title}</div>
      <div style="font-size: 12px; color: #94a3b8;">${message}</div>
    `;

    notifContainer.appendChild(notif);

    setTimeout(() => {
      notif.remove();
    }, 4000);

    return notif;
  }

  private makeDraggable(win: HTMLElement, handle: HTMLElement): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    handle.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = win.offsetLeft;
      initialTop = win.offsetTop;
      this.focusWindow(win.id.replace("win-", ""));
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.style.left = `${initialLeft + dx}px`;
      win.style.top = `${initialTop + dy}px`;
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  private makeResizable(win: HTMLElement, resizer: HTMLElement): void {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    resizer.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = win.offsetWidth;
      startHeight = win.offsetHeight;
      this.focusWindow(win.id.replace("win-", ""));
    });

    window.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.style.width = `${Math.max(220, startWidth + dx)}px`;
      win.style.height = `${Math.max(160, startHeight + dy)}px`;
    });

    window.addEventListener("mouseup", () => {
      isResizing = false;
    });
  }

  private setupWindowListeners(win: HTMLElement, id: string): void {
    win.addEventListener("mousedown", () => this.focusWindow(id));

    const controls = win.querySelectorAll(".control");
    controls.forEach((ctrl) => {
      ctrl.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = (ctrl as HTMLElement).dataset.action;
        if (action === "close") {
          this.closeWindow(id);
        } else if (action === "minimize") {
          this.minimizeWindow(id);
        }
      });
    });
  }

  createProcessMonitorWindow(_procfsReport?: string): HTMLElement {
    const container = document.createElement("div");
    container.className = "top-gui-container";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "16px";
    container.style.padding = "16px";
    container.style.fontFamily = "'Inter', system-ui, sans-serif";
    container.style.color = "var(--text-main)";

    // Performance Meters Header
    const meters = document.createElement("div");
    meters.className = "top-gui-meters";
    meters.style.display = "flex";
    meters.style.flexDirection = "column";
    meters.style.gap = "10px";
    meters.style.background = "var(--panel-bg)";
    meters.style.padding = "14px";
    meters.style.borderRadius = "8px";
    meters.style.border = "1px solid var(--border-color)";

    meters.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:600;">
          <span>CPU Utilization (Core 0 & 1)</span>
          <span style="color:var(--primary);">45.2%</span>
        </div>
        <div style="width:100%; height:10px; background:rgba(255,255,255,0.1); border-radius:5px; overflow:hidden;">
          <div style="width:45.2%; height:100%; background:linear-gradient(90deg, #38bdf8, #818cf8); transition:width 0.3s;"></div>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:600;">
          <span>Memory Usage (RAM)</span>
          <span style="color:#10b981;">38.5% (246.4 MB / 640 MB)</span>
        </div>
        <div style="width:100%; height:10px; background:rgba(255,255,255,0.1); border-radius:5px; overflow:hidden;">
          <div style="width:38.5%; height:100%; background:linear-gradient(90deg, #10b981, #34d399); transition:width 0.3s;"></div>
        </div>
      </div>
    `;

    // Process Table
    const tableContainer = document.createElement("div");
    tableContainer.style.flex = "1";
    tableContainer.style.overflowY = "auto";
    tableContainer.style.borderRadius = "6px";
    tableContainer.style.border = "1px solid var(--border-color)";

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "0.8rem";
    table.style.fontFamily = "'Fira Code', monospace";

    table.innerHTML = `
      <thead>
        <tr style="background:rgba(255,255,255,0.05); text-align:left; border-bottom:1px solid var(--border-color);">
          <th style="padding:8px;">PID</th>
          <th style="padding:8px;">USER</th>
          <th style="padding:8px;">PR</th>
          <th style="padding:8px;">NI</th>
          <th style="padding:8px;">VIRT</th>
          <th style="padding:8px;">RES</th>
          <th style="padding:8px;">S</th>
          <th style="padding:8px;">%CPU</th>
          <th style="padding:8px;">%MEM</th>
          <th style="padding:8px;">COMMAND</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:8px; color:var(--primary);">1</td>
          <td style="padding:8px;">root</td>
          <td style="padding:8px;">20</td>
          <td style="padding:8px;">0</td>
          <td style="padding:8px;">10M</td>
          <td style="padding:8px;">2M</td>
          <td style="padding:8px; color:#10b981;">S</td>
          <td style="padding:8px;">0.5</td>
          <td style="padding:8px;">0.1</td>
          <td style="padding:8px; font-weight:600;">init</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:8px; color:var(--primary);">2</td>
          <td style="padding:8px;">user</td>
          <td style="padding:8px;">20</td>
          <td style="padding:8px;">0</td>
          <td style="padding:8px;">25M</td>
          <td style="padding:8px;">4M</td>
          <td style="padding:8px; color:#10b981;">S</td>
          <td style="padding:8px;">1.2</td>
          <td style="padding:8px;">0.3</td>
          <td style="padding:8px; font-weight:600;">sh</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:8px; color:var(--primary);">3</td>
          <td style="padding:8px;">user</td>
          <td style="padding:8px;">20</td>
          <td style="padding:8px;">0</td>
          <td style="padding:8px;">42M</td>
          <td style="padding:8px;">12M</td>
          <td style="padding:8px; color:#38bdf8;">R</td>
          <td style="padding:8px; color:var(--primary); font-weight:700;">43.5</td>
          <td style="padding:8px;">1.8</td>
          <td style="padding:8px; font-weight:600;">top-gui</td>
        </tr>
      </tbody>
    `;

    tableContainer.appendChild(table);
    container.appendChild(meters);
    container.appendChild(tableContainer);

    return this.createWindow(
      {
        id: "top-gui-monitor",
        title: "Styx OS Real-Time Process Monitor & Performance Chart",
        width: 680,
        height: 440,
      },
      container
    );
  }

  createFileExplorerWindow(kernel: any): HTMLElement {
    const fileContainer = document.createElement("div");
    fileContainer.className = "file-explorer-container";
    fileContainer.style.color = "var(--text-main)";
    fileContainer.style.fontFamily = "'Fira Code', monospace";
    fileContainer.style.fontSize = "0.85rem";
    fileContainer.style.padding = "10px";

    const renderDir = (path: string) => {
      const entries = kernel.sys_readdir(path);
      fileContainer.innerHTML = "";

      const navBar = document.createElement("div");
      navBar.style.display = "flex";
      navBar.style.alignItems = "center";
      navBar.style.gap = "8px";
      navBar.style.marginBottom = "10px";
      navBar.style.paddingBottom = "6px";
      navBar.style.borderBottom = "1px solid var(--border-color)";

      if (path !== "/") {
        const backBtn = document.createElement("button");
        backBtn.style.padding = "4px 8px";
        backBtn.style.borderRadius = "4px";
        backBtn.style.border = "1px solid var(--border-color)";
        backBtn.style.background = "var(--panel-bg)";
        backBtn.style.color = "var(--primary)";
        backBtn.style.cursor = "pointer";
        backBtn.style.fontSize = "0.75rem";
        backBtn.textContent = "⬅️ Up";

        const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
        backBtn.addEventListener("click", () => renderDir(parentPath));
        navBar.appendChild(backBtn);
      }

      const pathLabel = document.createElement("span");
      pathLabel.style.fontWeight = "600";
      pathLabel.textContent = `Path: ${path}`;
      navBar.appendChild(pathLabel);
      fileContainer.appendChild(navBar);

      const ul = document.createElement("ul");
      ul.style.listStyle = "none";
      ul.style.padding = "0";
      ul.style.margin = "0";

      for (const entry of entries) {
        const li = document.createElement("li");
        li.style.padding = "4px 6px";
        li.style.cursor = "pointer";
        li.style.borderRadius = "4px";
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "8px";

        const isDir = entry.stat ? entry.stat.isDir : entry.name !== "." && !entry.name.includes(".");
        li.innerHTML = isDir ? `📁 <strong style="color:var(--primary);">${entry.name}</strong>` : `📄 ${entry.name}`;
        li.title = isDir ? `Click to open directory ${entry.name}` : `Double click to edit ${entry.name} in Text Editor`;

        if (isDir) {
          li.addEventListener("click", () => {
            const nextPath = path === "/" ? `/${entry.name}` : `${path}/${entry.name}`;
            renderDir(nextPath);
          });
        } else {
          li.addEventListener("dblclick", () => {
            const targetPath = path === "/" ? `/${entry.name}` : `${path}/${entry.name}`;
            this.createTextEditorWindow(targetPath, kernel);
          });
        }
        ul.appendChild(li);
      }
      fileContainer.appendChild(ul);
    };

    renderDir("/");
    return this.createWindow(
      { id: "files", title: "Styx OS VFS File Explorer", width: 440, height: 320 },
      fileContainer
    );
  }

  createTextEditorWindow(filePath: string, kernel: any): HTMLElement {
    const container = document.createElement("div");
    container.className = "text-editor-container";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.background = "var(--bg-main)";
    container.style.color = "var(--text-main)";
    container.style.fontFamily = "'Fira Code', monospace";

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.style.display = "flex";
    toolbar.style.alignItems = "center";
    toolbar.style.justifyContent = "space-between";
    toolbar.style.padding = "6px 10px";
    toolbar.style.background = "var(--panel-bg)";
    toolbar.style.borderBottom = "1px solid var(--border-color)";

    const fileLabel = document.createElement("span");
    fileLabel.style.fontWeight = "600";
    fileLabel.style.fontSize = "0.85rem";
    fileLabel.style.color = "var(--primary)";
    fileLabel.textContent = `📝 ${filePath}`;

    const rightControls = document.createElement("div");
    rightControls.style.display = "flex";
    rightControls.style.alignItems = "center";
    rightControls.style.gap = "10px";

    const statusLabel = document.createElement("span");
    statusLabel.style.fontSize = "0.75rem";
    statusLabel.style.color = "#94a3b8";
    statusLabel.textContent = "Saved";

    const saveBtn = document.createElement("button");
    saveBtn.style.padding = "4px 10px";
    saveBtn.style.borderRadius = "4px";
    saveBtn.style.border = "1px solid var(--border-color)";
    saveBtn.style.background = "var(--primary)";
    saveBtn.style.color = "#0f172a";
    saveBtn.style.fontWeight = "700";
    saveBtn.style.cursor = "pointer";
    saveBtn.style.fontSize = "0.75rem";
    saveBtn.textContent = "💾 Save";

    rightControls.appendChild(statusLabel);
    rightControls.appendChild(saveBtn);
    toolbar.appendChild(fileLabel);
    toolbar.appendChild(rightControls);

    // Editor Area
    const editor = document.createElement("textarea");
    editor.style.flex = "1";
    editor.style.width = "100%";
    editor.style.height = "100%";
    editor.style.background = "#0f172a";
    editor.style.color = "#f8fafc";
    editor.style.border = "none";
    editor.style.outline = "none";
    editor.style.padding = "10px";
    editor.style.fontSize = "0.85rem";
    editor.style.fontFamily = "'Fira Code', monospace";
    editor.style.resize = "none";

    // Read initial content
    let initialText = "";
    try {
      const node = kernel.resolvePath(filePath);
      if (node && typeof node.read === "function") {
        const data = node.read(0, 65536);
        initialText = new TextDecoder().decode(data);
      }
    } catch (_e) {
      initialText = "";
    }
    editor.value = initialText;

    editor.addEventListener("input", () => {
      statusLabel.textContent = "Modified *";
      statusLabel.style.color = "#f59e0b";
    });

    saveBtn.addEventListener("click", () => {
      try {
        const node = kernel.resolvePath(filePath);
        if (node && typeof node.write === "function") {
          node.write(0, new TextEncoder().encode(editor.value));
          statusLabel.textContent = "Saved";
          statusLabel.style.color = "#10b981";
          this.sendNotification("Text Editor", `Saved ${filePath} successfully`, "success");
        }
      } catch (err: any) {
        this.sendNotification("Text Editor Error", `Failed to save ${filePath}: ${err.message}`, "warning");
      }
    });

    container.appendChild(toolbar);
    container.appendChild(editor);

    const winId = `editor-${filePath.replace(/[^a-zA-Z0-9]/g, "_")}`;
    return this.createWindow(
      { id: winId, title: `Text Editor - ${filePath}`, width: 560, height: 380 },
      container
    );
  }

  createWebBrowserWindow(initialUrl: string = "https://example.com"): HTMLElement {
    const container = document.createElement("div");
    container.className = "browser-app-container";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.background = "var(--bg-main)";
    container.style.color = "var(--text-main)";

    // Navigation Bar
    const navBar = document.createElement("div");
    navBar.className = "browser-navbar";
    navBar.style.display = "flex";
    navBar.style.alignItems = "center";
    navBar.style.gap = "6px";
    navBar.style.padding = "8px";
    navBar.style.background = "var(--panel-bg)";
    navBar.style.borderBottom = "1px solid var(--border-color)";

    const btnBack = document.createElement("button");
    btnBack.innerHTML = "⬅️";
    btnBack.title = "Back";
    btnBack.style.padding = "4px 8px";
    btnBack.style.borderRadius = "4px";
    btnBack.style.border = "1px solid var(--border-color)";
    btnBack.style.background = "rgba(255,255,255,0.05)";
    btnBack.style.color = "var(--text-main)";
    btnBack.style.cursor = "pointer";

    const btnForward = document.createElement("button");
    btnForward.innerHTML = "➡️";
    btnForward.title = "Forward";
    btnForward.style.padding = "4px 8px";
    btnForward.style.borderRadius = "4px";
    btnForward.style.border = "1px solid var(--border-color)";
    btnForward.style.background = "rgba(255,255,255,0.05)";
    btnForward.style.color = "var(--text-main)";
    btnForward.style.cursor = "pointer";

    const btnReload = document.createElement("button");
    btnReload.innerHTML = "🔄";
    btnReload.title = "Reload Page";
    btnReload.style.padding = "4px 8px";
    btnReload.style.borderRadius = "4px";
    btnReload.style.border = "1px solid var(--border-color)";
    btnReload.style.background = "rgba(255,255,255,0.05)";
    btnReload.style.color = "var(--text-main)";
    btnReload.style.cursor = "pointer";

    const btnHome = document.createElement("button");
    btnHome.innerHTML = "🏠";
    btnHome.title = "Home";
    btnHome.style.padding = "4px 8px";
    btnHome.style.borderRadius = "4px";
    btnHome.style.border = "1px solid var(--border-color)";
    btnHome.style.background = "rgba(255,255,255,0.05)";
    btnHome.style.color = "var(--text-main)";
    btnHome.style.cursor = "pointer";

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.value = initialUrl;
    urlInput.placeholder = "Enter URL (e.g. https://example.com)...";
    urlInput.style.flex = "1";
    urlInput.style.padding = "6px 12px";
    urlInput.style.borderRadius = "6px";
    urlInput.style.border = "1px solid var(--border-color)";
    urlInput.style.background = "rgba(0,0,0,0.3)";
    urlInput.style.color = "var(--primary)";
    urlInput.style.fontFamily = "'Fira Code', monospace";
    urlInput.style.fontSize = "0.85rem";

    const btnGo = document.createElement("button");
    btnGo.textContent = "Go 🚀";
    btnGo.style.padding = "6px 12px";
    btnGo.style.borderRadius = "6px";
    btnGo.style.border = "1px solid var(--primary)";
    btnGo.style.background = "var(--primary)";
    btnGo.style.color = "#0f172a";
    btnGo.style.fontWeight = "600";
    btnGo.style.cursor = "pointer";
    btnGo.style.fontSize = "0.85rem";

    navBar.appendChild(btnBack);
    navBar.appendChild(btnForward);
    navBar.appendChild(btnReload);
    navBar.appendChild(btnHome);
    navBar.appendChild(urlInput);
    navBar.appendChild(btnGo);
    container.appendChild(navBar);

    // Bookmarks Bar
    const bookmarkBar = document.createElement("div");
    bookmarkBar.style.display = "flex";
    bookmarkBar.style.gap = "8px";
    bookmarkBar.style.padding = "4px 8px";
    bookmarkBar.style.background = "rgba(0,0,0,0.2)";
    bookmarkBar.style.borderBottom = "1px solid var(--border-color)";
    bookmarkBar.style.fontSize = "0.75rem";

    const bookmarks = [
      { name: "🌐 Example", url: "https://example.com" },
      { name: "🔍 DuckDuckGo", url: "https://html.duckduckgo.com/html/" },
      { name: "📚 Wikipedia", url: "https://en.m.wikipedia.org/" },
      { name: "⚡ Styx OS GitHub", url: "https://github.com/jpferreria/styx" },
    ];

    for (const b of bookmarks) {
      const bm = document.createElement("span");
      bm.style.cursor = "pointer";
      bm.style.padding = "2px 6px";
      bm.style.borderRadius = "3px";
      bm.style.background = "rgba(255,255,255,0.05)";
      bm.style.color = "var(--text-main)";
      bm.textContent = b.name;
      bm.addEventListener("click", () => navigateTo(b.url));
      bookmarkBar.appendChild(bm);
    }
    container.appendChild(bookmarkBar);

    // Iframe Viewport
    const iframe = document.createElement("iframe");
    iframe.style.flex = "1";
    iframe.style.width = "100%";
    iframe.style.border = "none";
    iframe.style.background = "#ffffff";
    iframe.sandbox.add("allow-scripts", "allow-same-origin", "allow-forms");

    const navigateTo = (rawUrl: string) => {
      let target = rawUrl.trim();
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = `https://${target}`;
      }
      urlInput.value = target;
      iframe.src = target;
    };

    btnGo.addEventListener("click", () => navigateTo(urlInput.value));
    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") navigateTo(urlInput.value);
    });
    btnReload.addEventListener("click", () => {
      iframe.src = urlInput.value;
    });
    btnHome.addEventListener("click", () => {
      navigateTo("https://example.com");
    });
    btnBack.addEventListener("click", () => {
      try { iframe.contentWindow?.history.back(); } catch (e) {}
    });
    btnForward.addEventListener("click", () => {
      try { iframe.contentWindow?.history.forward(); } catch (e) {}
    });

    navigateTo(initialUrl);
    container.appendChild(iframe);

    return this.createWindow(
      { id: "browser-app", title: "Styx OS Web Browser", width: 720, height: 480 },
      container
    );
  }

  openFileFinderWindow(targetPath: string = "/home/user", passedKernel?: any): HTMLElement {
    const k = passedKernel || this.kernel;
    const container = document.createElement("div");
    container.className = "file-finder-container";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.height = "100%";
    container.style.background = "var(--bg-card)";
    container.style.color = "var(--text-main)";
    container.style.fontFamily = "var(--font-mono)";

    const searchBar = document.createElement("div");
    searchBar.style.display = "flex";
    searchBar.style.gap = "8px";
    searchBar.style.padding = "8px";
    searchBar.style.background = "rgba(0,0,0,0.3)";
    searchBar.style.borderBottom = "1px solid var(--border-color)";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search files or regex in VFS...";
    input.style.flex = "1";
    input.style.padding = "6px 12px";
    input.style.borderRadius = "4px";
    input.style.border = "1px solid var(--border-color)";
    input.style.background = "var(--bg-main)";
    input.style.color = "var(--text-main)";

    const btnSearch = document.createElement("button");
    btnSearch.textContent = "🔍 Search";
    btnSearch.style.padding = "6px 14px";
    btnSearch.style.borderRadius = "4px";
    btnSearch.style.border = "none";
    btnSearch.style.background = "var(--primary)";
    btnSearch.style.color = "#0f172a";
    btnSearch.style.fontWeight = "600";
    btnSearch.style.cursor = "pointer";

    searchBar.appendChild(input);
    searchBar.appendChild(btnSearch);
    container.appendChild(searchBar);

    const fileList = document.createElement("div");
    fileList.style.flex = "1";
    fileList.style.overflowY = "auto";
    fileList.style.padding = "10px";

    const populateFiles = (query: string = "") => {
      fileList.innerHTML = "";
      try {
        if (k && k.sys_readdir) {
          const entries = k.sys_readdir(targetPath);
          for (const entry of entries) {
            if (!query || entry.name.toLowerCase().includes(query.toLowerCase())) {
              const item = document.createElement("div");
              item.style.padding = "6px 10px";
              item.style.marginBottom = "4px";
              item.style.borderRadius = "4px";
              item.style.background = "rgba(255,255,255,0.05)";
              item.style.cursor = "pointer";
              item.textContent = `${entry.isDir ? "📁" : "📄"} ${entry.name} (${entry.size} bytes)`;
              fileList.appendChild(item);
            }
          }
        }
      } catch (e) {}
    };

    btnSearch.addEventListener("click", () => populateFiles(input.value));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") populateFiles(input.value); });
    populateFiles();

    container.appendChild(fileList);

    return this.createWindow(
      { id: "files-app", title: `VFS File Finder - ${targetPath}`, width: 640, height: 420 },
      container
    );
  }
}
