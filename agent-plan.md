# Styx OS Agent Integration Plan: Local LLM (Ollama / Gemma) Sandbox

This document outlines the architecture, setup guide, and step-by-step code implementation for using **Styx OS** as an isolated, secure WebAssembly/VFS execution sandbox for local LLMs (such as **Gemma**, **Llama 3**, and **Ollama**).

---

## 1. Architecture Overview

```mermaid
graph LR
    UserPrompt["User Prompt"] -->|1. Request| Gemma["Local Gemma Model (Ollama)"]
    Gemma -->|2. Tool Call: execute_bash(cmd)| StyxBridge["Styx Sandbox Bridge (sandbox.ts)"]
    StyxBridge -->|3. Safe Execution in WASM VFS| StyxKernel["Styx OS POSIX Kernel (60 Subsystems)"]
    StyxKernel -->|4. Execution Result (stdout, stderr, exitCode)| StyxBridge
    StyxBridge -->|5. Observation Context| Gemma
    Gemma -->|6. Final Answer| UserPrompt
```

### Key Security & Operational Guarantees
1. **Memory & VFS Isolation**: All bash commands (`rm -rf /`, `cat /etc/passwd`, custom Python/JS scripts) run in Styx OS WebAssembly VFS memory. The host operating system and disk are 100% protected.
2. **Deterministic Timeouts**: `StyxSandboxEngine.executeCommand(cmd, timeoutMs)` caps rogue infinite loops or stalled scripts.
3. **OpenAI / Ollama Compatibility**: Tool declarations conform to standard OpenAI JSON Function schema for zero-friction integration with Ollama, LangChain, LlamaIndex, or AutoGen.

---

## 2. Prerequisites & Local Setup

### Step 1: Install & Run Ollama with Gemma
Start Ollama with a Gemma model on your machine:
```bash
ollama run gemma2
```
Ollama serves an OpenAI-compatible REST endpoint at `http://localhost:11434/v1`.

### Step 2: Include `@styx/shell-ui` Kernel Package
Ensure Styx OS package is imported in your agent host process:
```bash
import { UnixKernel, StyxSandboxEngine } from "@styx/shell-ui";
```

---

## 3. Integration Code Examples

### Option A: TypeScript / Node.js Agent Dispatcher

```typescript
import { UnixKernel } from "@styx/shell-ui";
import OpenAI from "openai";

// 1. Initialize Styx OS Sandbox Kernel
const kernel = new UnixKernel();
const sandbox = kernel.sandboxEngine;

// 2. Initialize Ollama Client (OpenAI API Compatible)
const ollama = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama", // Required by SDK, ignored by local server
});

async function runGemmaSandboxAgent(userPrompt: string) {
  console.log(`[User Request]: ${userPrompt}\n`);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "user", content: userPrompt }
  ];

  // Request tool call decision from Gemma
  const response = await ollama.chat.completions.create({
    model: "gemma2",
    messages: messages,
    tools: [sandbox.getOllamaToolDefinition() as any],
    tool_choice: "auto",
  });

  const message = response.choices[0].message;

  // Process Tool Calls
  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.function.name === "execute_bash") {
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`🤖 Gemma Tool Request: "${args.command}"`);

        // Execute inside Styx OS WASM Sandbox
        const result = await sandbox.executeCommand(args.command);
        console.log(`📦 Styx OS Output:\n${result.stdout || result.stderr}`);

        // Provide Tool Result back to Gemma
        messages.push(message);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            durationMs: result.durationMs,
          }),
        });

        // Synthesize Final Response
        const finalResponse = await ollama.chat.completions.create({
          model: "gemma2",
          messages: messages,
        });

        console.log(`\n💬 Gemma Final Response:\n${finalResponse.choices[0].message.content}`);
      }
    }
  } else {
    console.log(`💬 Gemma Response:\n${message.content}`);
  }
}

// Run Example Task
runGemmaSandboxAgent("Check system uptime and create a summary file in /home/user/summary.txt using Styx OS.");
```

---

### Option B: Python Agent Dispatcher

```python
import json
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"

STYX_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "execute_bash",
        "description": "Executes a shell command or POSIX pipeline inside Styx OS WebAssembly sandbox.",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "POSIX bash command to run"}
            },
            "required": ["command"]
        }
    }
}

def ask_gemma_sandbox(prompt):
    payload = {
        "model": "gemma2",
        "messages": [{"role": "user", "content": prompt}],
        "tools": [STYX_TOOL_SCHEMA],
        "stream": False
    }
    
    response = requests.post(OLLAMA_URL, json=payload).json()
    message = response.get("message", {})
    
    if "tool_calls" in message:
        for tool in message["tool_calls"]:
            cmd = tool["function"]["arguments"]["command"]
            print(f"🤖 Gemma tool execution request: {cmd}")
            # Send `cmd` to Styx OS API: `sandboxEngine.executeCommand(cmd)`

ask_gemma_sandbox("Check memory usage with free -h and list root directory files using Styx OS.")
```

---

## 4. Styx OS Sandbox API Methods

| Method | Description |
| :--- | :--- |
| `executeCommand(cmd, timeoutMs)` | Executes a shell pipeline in Styx OS VFS and returns `{ exitCode, stdout, stderr, durationMs }`. |
| `getOllamaToolDefinition()` | Generates standard OpenAI/Ollama function declaration for `execute_bash`. |
| `writeFileContent(path, content)` | Injects text content directly into Styx VFS path (`/home/user/script.py`). |
| `getFileContent(path)` | Reads text content from Styx VFS path. |
| `resetState()` | Instantly restores Styx OS sandbox VFS to a fresh initial state. |
