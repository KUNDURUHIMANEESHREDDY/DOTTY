import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  dot: {
    color: '#38bdf8', // Sky blue
    size: 10,
    glowIntensity: 'vibrant',
    pulseAnimation: true,
    autoHideDelay: 0, // always show when editor is focused
    offsetX: 12,
    offsetY: 2,
  },
  ai: {
    // 100% Local Offline Defaults (Zero external server calls, Zero network traffic)
    activeGrammarProvider: 'smart-fallback',
    activePromptProvider: 'smart-fallback',
    languageToolUrl: 'https://api.languagetool.org/v2/check',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3',
    geminiKey: '',
    geminiModel: 'gemini-1.5-flash',
    openaiKey: '',
    openaiModel: 'gpt-4o-mini',
    openaiBaseUrl: 'https://api.openai.com/v1',
    claudeKey: '',
    claudeModel: 'claude-3-5-sonnet-20241022',
    groqKey: '',
    groqModel: 'llama-3.3-70b-versatile',
  },
  customRules: [
    {
      id: 'rule-1',
      pattern: '\\butilize\\b',
      replacement: 'use',
      enabled: true,
    },
    {
      id: 'rule-2',
      pattern: '\\bleverage\\b',
      replacement: 'use',
      enabled: true,
    },
    {
      id: 'rule-3',
      pattern: '\\bin order to\\b',
      replacement: 'to',
      enabled: true,
    },
  ],
  editor: {
    fontFamily: 'sans',
    fontSize: 16,
    lineNumbers: true,
    wordWrap: true,
    autoSaveInterval: 2,
  },
  shortcuts: {
    triggerMenu: 'Ctrl+Shift+Space',
    fixGrammar: 'Ctrl+Alt+G',
    enhancePrompt: 'Ctrl+Alt+E',
  },
};
