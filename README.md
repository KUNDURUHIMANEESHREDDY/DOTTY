<p align="center">
  <img src="public/dotty-icon.svg" width="96" height="96" alt="Dotty AI Logo" />
</p>

<h1 align="center">✦ DOTTY</h1>

<p align="center">
  <strong>An open-source, privacy-first desktop typing assistant & smart editor with a real-time cursor dot indicator.</strong>
</p>

<p align="center">
  <a href="https://github.com/KUNDURUHIMANEESHREDDY/DOTTY/releases"><img src="https://img.shields.io/github/v/release/KUNDURUHIMANEESHREDDY/DOTTY?color=blue" alt="Release" /></a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/Offline-100%25_Ready-brightgreen.svg" alt="Offline 100% Ready" />
  <img src="https://img.shields.io/badge/React-18-61dafb.svg" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg" alt="TypeScript 5.7" />
  <img src="https://img.shields.io/badge/Electron-34-47848F.svg" alt="Electron 34" />
</p>

---

## 🌟 Overview

**Dotty** monitors your typing in real time, renders a subtle, elegant glowing dot that follows your cursor/caret across lines, and opens an instant 1-click menu for grammar corrections, prompt enhancement, and tone shifts.

Unlike traditional grammar checkers that force intrusive sidebars or require expensive cloud subscriptions, Dotty is **open-source**, works **100% offline** (via Ollama & built-in heuristic rules), and includes a **visual Side-by-Side Diff Modal** so you inspect exactly what changes before replacing text.

---

## 🔒 Privacy Manifest & Zero-Telemetry Guarantee

> **🔒 100% Privacy Guarantee:** By default, Dotty processes all text locally. Your keystrokes, drafts, and notes never leave your machine. We collect **zero telemetry**, track **zero metrics**, and make **zero network requests** out of the box.

---

## ✨ Features

- 🎯 **Real-time Caret-Following Dot**: Floating indicator tracks cursor coordinates at 60 FPS using smooth viewport interpolation and mirror coordinate tracking.
- ⚡ **1-Click Grammar & Spell Check**: Instant corrections powered by LanguageTool (Free public API or local server) with zero sign-up required.
- 🪄 **Prompt Enhancement**: Converts raw, vague instructions into structured, world-class LLM prompts (specifying role, context, constraints, and output format).
- 🔍 **Visual Side-by-Side Diff Preview**: Review additions (green) and deletions (red) in split-column or unified inline view before applying.
- 🛡️ **Hybrid AI Architecture**:
  - **Zero-Config Default**: LanguageTool public API
  - **Local & 100% Private**: [Ollama](https://ollama.com/) (`llama3`, `mistral`, `gemma2`, `phi3`, etc.)
  - **Cloud (BYOK)**: Google Gemini, OpenAI (GPT-4o), Anthropic Claude, Groq
  - **Smart Offline Fallback**: Built-in regex rule engine when disconnected
- ↩️ **Full Undo/Redo Engine**: Non-destructive workflows with `Ctrl+Z` and `Ctrl+Y`.
- 🗂️ **Multi-Tab Scratchpad**: Create multiple documents, auto-saved persistently in local storage.
- ⌨️ **Power-User Keyboard Shortcuts**:
  - `Ctrl + Shift + Space`: Trigger Dotty Action Menu
  - `Ctrl + Shift + G`: Instant Grammar Fix
  - `Ctrl + Shift + P`: Instant Prompt Enhancement
  - `Ctrl + S`: Quick Save
  - `Ctrl + Z` / `Ctrl + Y`: Undo / Redo
- 📊 **Live Stats**: Word count, character count, line count, and estimated reading time.
- 🎨 **Deep Customization**: Choose dot color, glow intensity, size, pulse animations, offset, and editor typography.

---

## 🏗️ Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         DOTTY Electron Desktop App                     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Modern Editor UI                          │  │
│  │  • ContentEditable / Textarea Workspace                          │  │
│  │  • Real-time Caret Coordinate Mirror Engine                      │  │
│  │  • Multi-document tabs, Word & Token Counters                    │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │ Coordinates & Selection           │
│                                    ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   Floating Caret Dot & Menu                      │  │
│  │  • Smooth Spring-Physics Pulsing Dot Overlay                     │  │
│  │  • Quick Action Menu (Fix Grammar, Enhance Prompt, Tone, Diff)   │  │
│  │  • Interactive Diff Modal (Accept / Reject / Revert)             │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │ Request                           │
│                                    ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    AI & Grammar Orchestrator                     │  │
│  │  ┌─────────────────┐ ┌──────────────┐ ┌────────────────────────┐ │  │
│  │  │ LanguageTool API│ │  Local Ollama│ │ Cloud APIs (Gemini/OAI)│ │  │
│  │  └─────────────────┘ └──────────────┘ └────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Download & Run Standalone .EXE

Pre-built binaries are generated in the `dist-bin/` directory:

- **[Dotty-Portable-1.0.0.exe](file:///c:/Users/himaneeshreddyk/Downloads/DOTTY/dist-bin/Dotty-Portable-1.0.0.exe)**: Standalone single-file portable executable. Double-click and run immediately without installing.
- **[Dotty Setup 1.0.0.exe](file:///c:/Users/himaneeshreddyk/Downloads/DOTTY/dist-bin/Dotty%20Setup%201.0.0.exe)**: Full Windows installer with Start Menu and Desktop shortcuts.

---

## 🚀 Getting Started (Development & Building)

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm** or **pnpm**

### Quick Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/dotty.git
cd dotty

# 2. Install dependencies
npm install

# 3. Start development server (Web Mode)
npm run dev

# 4. Or launch as Native Desktop Application (Electron)
npm run dev:electron
```

---

## 🛠️ Configuration & AI Providers

Dotty is ready to go out of the box with zero configuration:
1. **LanguageTool**: Built-in default for grammar checking. You can also point to your own local LanguageTool Docker/JAR container (`http://localhost:8081/v2/check`) in **Settings → AI & Models**.
2. **Ollama**: Run `ollama run llama3` locally and click **Test Connection** in Dotty settings.
3. **Cloud Keys**: Input your own Gemini, OpenAI, Claude, or Groq API keys in the settings modal. Keys stay safely stored in your local browser storage.

---

## 📜 License

Dotty is licensed under the [MIT License](LICENSE).
Feel free to use, modify, distribute, and contribute!
