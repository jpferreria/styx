#!/usr/bin/env bash
#
# start.sh - Start Styx OS Local Development Server
#
# Copyright (C) 2026 Styx OS Project Authors
# Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHELL_UI_DIR="$SCRIPT_DIR/packages/shell-ui"
PID_FILE="$SCRIPT_DIR/.dev-server.pid"
LOG_FILE="$SCRIPT_DIR/dev-server.log"

echo "🚀 Starting Styx OS v0.20 'Rivendell' Local Server..."

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  Styx OS is already running! (PID: $PID)"
        echo "🌐 Local URL: http://localhost:5173/"
        exit 0
    else
        rm -f "$PID_FILE"
    fi
fi

if [ ! -d "$SHELL_UI_DIR/node_modules" ]; then
    echo "📦 Installing workspace dependencies..."
    cd "$SHELL_UI_DIR" && npm install
fi

cd "$SHELL_UI_DIR"
nohup npm run dev > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"

sleep 2

if ps -p "$SERVER_PID" > /dev/null 2>&1; then
    echo "✅ Styx OS started successfully!"
    echo "   PID:       $SERVER_PID"
    echo "   Logs:      $LOG_FILE"
    echo "   Local URL: http://localhost:5173/"
else
    echo "❌ Failed to start Styx OS server. See $LOG_FILE for details."
    rm -f "$PID_FILE"
    exit 1
fi
