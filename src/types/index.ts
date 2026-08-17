export type AIProvider = 'languagetool' | 'ollama' | 'gemini' | 'openai' | 'claude' | 'groq' | 'smart-fallback';

export type ToneType = 'professional' | 'casual' | 'concise' | 'academic' | 'persuasive' | 'accessible';

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void;
      onGlobalCursorMove: (callback: (point: { x: number; y: number }) => void) => () => void;
      captureActiveSelection: () => Promise<string>;
      pasteToActiveWindow: (text: string) => Promise<boolean>;
      openEditorWindow: () => void;
      toggleOverlay: () => void;
    };
  }
}

export type ActionType = 
  | 'grammar' 
  | 'enhance-prompt' 
  | 'tone' 
  | 'summarize' 
  | 'expand' 
  | 'translate'
  | 'format-markdown'
  | 'custom';

export interface CustomRule {
  id: string;
  pattern: string;
  replacement: string;
  enabled: boolean;
}

export interface DotSettings {
  color: string;
  size: number; // in pixels (e.g. 10)
  glowIntensity: 'none' | 'subtle' | 'vibrant';
  pulseAnimation: boolean;
  autoHideDelay: number; // 0 for always visible, or ms (e.g. 3000)
  offsetY: number;
  offsetX: number;
}

export interface AISettings {
  activeGrammarProvider: AIProvider;
  activePromptProvider: AIProvider;
  
  // LanguageTool
  languageToolUrl: string; // default: https://api.languagetool.org/v2/check
  
  // Ollama
  ollamaUrl: string; // default: http://localhost:11434
  ollamaModel: string; // default: llama3 or mistral
  
  // Gemini
  geminiKey: string;
  geminiModel: string; // default: gemini-1.5-flash or gemini-2.0-flash
  
  // OpenAI
  openaiKey: string;
  openaiModel: string; // default: gpt-4o-mini
  openaiBaseUrl: string; // default: https://api.openai.com/v1
  
  // Claude
  claudeKey: string;
  claudeModel: string; // default: claude-3-5-sonnet-20241022
  
  // Groq
  groqKey: string;
  groqModel: string; // default: llama-3.3-70b-versatile
}

export interface AppSettings {
  dot: DotSettings;
  ai: AISettings;
  customRules: CustomRule[];
  editor: {
    fontFamily: 'sans' | 'mono' | 'serif';
    fontSize: number;
    lineNumbers: boolean;
    wordWrap: boolean;
    autoSaveInterval: number; // seconds
  };
  shortcuts: {
    triggerMenu: string; // e.g. "Ctrl+Shift+Space"
    fixGrammar: string; // e.g. "Ctrl+Alt+G"
    enhancePrompt: string; // e.g. "Ctrl+Alt+E"
  };
}

export interface CaretPosition {
  x: number;
  y: number;
  height: number;
  visible: boolean;
  isSelection: boolean;
  selectedText: string;
  selectionRange?: { start: number; end: number };
}

export interface DiffResult {
  originalText: string;
  enhancedText: string;
  action: string;
  provider: AIProvider;
  explanation?: string;
  range?: { start: number; end: number };
}

export interface DocumentTab {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
}

export interface GrammarIssue {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: string[];
  ruleId: string;
  ruleCategory?: string;
}
