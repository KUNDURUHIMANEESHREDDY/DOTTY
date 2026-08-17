# Contributing to Dotty ✦

Thank you for your interest in contributing to **Dotty**! We welcome contributions of all kinds: bug fixes, new features, prompt templates, documentation improvements, and platform enhancements.

---

## 🛠️ Development Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/your-username/dotty.git
   cd dotty
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development mode**:
   ```bash
   # Web rapid development mode
   npm run dev

   # Electron native desktop mode
   npm run dev:electron
   ```

4. **Verify TypeScript build**:
   ```bash
   npm run build
   ```

---

## 🎯 Code Architecture Guidelines

- `src/hooks/`: Reusable hooks (Caret tracking, Keyboard shortcuts, Undo/Redo stack, Local storage).
- `src/services/`: AI connectors (LanguageTool, Ollama, Gemini, OpenAI, Claude, Groq) and prompt templates.
- `src/components/`: Modular React components styled with Tailwind CSS.
- `electron/`: Electron main and preload scripts.

---

## 💡 Submitting a Pull Request

1. Create a descriptive feature branch (`git checkout -b feature/awesome-feature`).
2. Commit your changes with clean commit messages.
3. Ensure TypeScript compiles without errors (`npm run build`).
4. Push to your branch and open a Pull Request against `main`.

Thank you for helping build an open-source, privacy-first typing assistant!
