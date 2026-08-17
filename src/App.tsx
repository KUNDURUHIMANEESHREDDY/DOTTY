import React, { useState, useRef, useEffect } from 'react';
import { CaretPosition, DocumentTab, AppSettings, ActionType, ToneType, DiffResult, ToastMessage } from './types';
import { DEFAULT_SETTINGS } from './services/defaultSettings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useCaretPosition } from './hooks/useCaretPosition';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { processTextWithAI } from './services/aiService';

import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { CaretDot } from './components/CaretDot';
import { ActionMenu } from './components/ActionMenu';
import { DiffModal } from './components/DiffModal';
import { SettingsModal } from './components/SettingsModal';
import { QuickTemplatesModal } from './components/QuickTemplatesModal';
import { StatsBar } from './components/StatsBar';
import { ToastContainer } from './components/Toast';
import { Sparkles, Edit3, X, Check, Copy, ArrowRight, Zap } from 'lucide-react';

const INITIAL_DEMO_TEXT = `# Welcome to Dotty ✦

Dotty is your intelligent desktop typing assistant.

### 🧪 Try It Out:

1. **Test Grammar Correction:**
He dont knows what their doing and he didnt recieved the email untill yesterday.
*(Highlight this line and click the floating Dot or press Alt+Space)*

2. **Test Prompt Enhancement:**
write a python script for scraping news headlines
*(Highlight this line and click Enhance Prompt)*

3. **Explore Plain English & Tone Shifts:**
Click the floating dot anytime in any application (Chrome, Word, VS Code) to transform text!`;

export function App() {
  const [route, setRoute] = useState<string>(() => window.location.hash.replace('#', '') || 'editor');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.replace('#', '') || 'editor');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 1. Settings & Persistence
  const [settings, setSettings] = useLocalStorage<AppSettings>('dotty_settings_v1', DEFAULT_SETTINGS);
  const [tabs, setTabs] = useLocalStorage<DocumentTab[]>('dotty_tabs_v1', [
    {
      id: 'tab-default',
      title: 'Welcome Notes',
      content: INITIAL_DEMO_TEXT,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);
  const [activeTabId, setActiveTabId] = useLocalStorage<string>('dotty_active_tab_id', 'tab-default');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0] || {
    id: 'tab-default',
    title: 'Notes',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // 2. Editor & Undo/Redo Engine (for #editor mode)
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { content, pushState, undo, redo, canUndo, canRedo, resetHistory } = useUndoRedo(activeTab.content);
  const { caretPosition: localCaretPosition, updateCaretPosition } = useCaretPosition(editorRef);

  // 3. Floating Menu State (for #menu mode)
  const [capturedText, setCapturedText] = useState<string>('');
  const [currentDiff, setCurrentDiff] = useState<DiffResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Listen for Menu Trigger data from main process in #menu mode
  useEffect(() => {
    if (window.electronAPI?.onMenuTrigger && route === 'menu') {
      const unsubscribe = window.electronAPI.onMenuTrigger((data: { selectedText: string; x: number; y: number }) => {
        setCapturedText(data.selectedText || '');
        setCurrentDiff(null);
      });
      return unsubscribe;
    }
  }, [route]);

  // Execute AI action on captured text
  const handleExecuteActionOnCaptured = async (
    action: ActionType,
    options?: { tone?: ToneType; targetLanguage?: string; customPrompt?: string }
  ) => {
    const textToProcess = capturedText.trim() || content;
    if (!textToProcess) {
      addToast('warning', 'No Text Highlighted', 'Highlight text in any application and click Dotty.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processTextWithAI({
        action,
        text: textToProcess,
        tone: options?.tone,
        customPrompt: options?.customPrompt,
        targetLanguage: options?.targetLanguage,
        settings: settings.ai,
        customRules: settings.customRules,
      });

      setCurrentDiff(result);
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message || 'Error running action.');
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================================================================
  // ROUTE 1: #dot — COMPACT 52x52 FLOATING DESKTOP BUBBLE
  // =========================================================================
  if (route === 'dot') {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-transparent select-none cursor-pointer"
        onClick={() => {
          window.electronAPI?.openMenuWindow();
        }}
        title="Dotty AI Assistant (Alt+Space)"
      >
        <div className="relative group flex items-center justify-center">
          {/* Pulsing ring */}
          <div
            className="absolute -inset-1 rounded-full opacity-60 animate-ping"
            style={{ backgroundColor: settings.dot.color }}
          />

          {/* Main Bubble */}
          <div
            className="relative w-9 h-9 rounded-full flex items-center justify-center shadow-2xl transition-transform transform group-hover:scale-110"
            style={{
              backgroundColor: '#0f172a',
              border: `2px solid ${settings.dot.color}`,
              boxShadow: `0 0 16px 2px ${settings.dot.color}aa`,
            }}
          >
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ROUTE 2: #menu — FLOATING ACTION MENU & DIFF REVIEW
  // =========================================================================
  if (route === 'menu') {
    return (
      <div className="w-full h-full p-2 bg-transparent select-none">
        <div className="w-full h-full bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 backdrop-blur-xl">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Dotty AI</span>
              {capturedText && (
                <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                  {capturedText.split(/\s+/).filter(Boolean).length}w selected
                </span>
              )}
            </div>
            <button
              onClick={() => window.electronAPI?.closeMenuWindow()}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body: Action Menu or Diff Review */}
          <div className="flex-1 p-2 overflow-y-auto space-y-1.5">
            {currentDiff ? (
              /* Diff Review Card */
              <div className="space-y-3 p-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {currentDiff.action}
                  </span>
                </div>

                {/* Original vs Enhanced preview */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto text-emerald-300">
                  {currentDiff.enhancedText}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={async () => {
                      if (window.electronAPI) {
                        await window.electronAPI.pasteToActiveWindow(currentDiff.enhancedText);
                      }
                      setCurrentDiff(null);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/25 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Replace in App</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentDiff.enhancedText);
                      addToast('success', 'Copied');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentDiff(null)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              /* Main Action Buttons */
              <div className="space-y-1">
                <button
                  onClick={() => handleExecuteActionOnCaptured('grammar')}
                  disabled={isProcessing}
                  className="w-full px-3 py-2.5 rounded-xl text-left bg-slate-800/60 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Fix Grammar & Spelling</div>
                      <div className="text-[10px] text-slate-400">Sub-4ms local correction</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">Alt+G</span>
                </button>

                <button
                  onClick={() => handleExecuteActionOnCaptured('enhance-prompt')}
                  disabled={isProcessing}
                  className="w-full px-3 py-2.5 rounded-xl text-left bg-slate-800/60 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Enhance Prompt</div>
                      <div className="text-[10px] text-slate-400">Role, context, output structure</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">Alt+P</span>
                </button>

                <button
                  onClick={() => handleExecuteActionOnCaptured('tone', { tone: 'accessible' })}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 rounded-xl text-left bg-slate-800/40 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-medium">🌿 Plain English (Accessible)</div>
                    <div className="text-[10px] text-slate-400">Simplify complex jargon</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => handleExecuteActionOnCaptured('tone', { tone: 'professional' })}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 rounded-xl text-left bg-slate-800/40 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-medium">💼 Professional Tone</div>
                    <div className="text-[10px] text-slate-400">Corporate & executive phrasing</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => handleExecuteActionOnCaptured('summarize')}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 rounded-xl text-left bg-slate-800/40 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-medium">📋 Summarize Key Takeaways</div>
                    <div className="text-[10px] text-slate-400">Extract bullet points</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            )}
          </div>

          {/* Footer: Open Notepad link */}
          <div className="px-3.5 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => window.electronAPI?.openEditorWindow()}
              className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open Standalone Notepad</span>
            </button>
            <span className="text-[10px] text-slate-500">100% Offline</span>
          </div>
        </div>

        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // =========================================================================
  // ROUTE 3: #editor (or Default) — STANDALONE FULL SCRATCHPAD NOTEPAD
  // =========================================================================
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      <Header
        tabs={tabs}
        activeTabId={activeTab.id}
        canUndo={canUndo}
        canRedo={canRedo}
        onSelectTab={(id) => {
          setActiveTabId(id);
          const target = tabs.find((t) => t.id === id);
          if (target) resetHistory(target.content);
        }}
        onAddTab={() => {
          const newId = `tab-${Date.now()}`;
          setTabs([...tabs, { id: newId, title: `Draft ${tabs.length + 1}`, content: '', createdAt: Date.now(), updatedAt: Date.now() }]);
          setActiveTabId(newId);
          resetHistory('');
        }}
        onCloseTab={(id) => {
          if (tabs.length <= 1) return;
          const remaining = tabs.filter((t) => t.id !== id);
          setTabs(remaining);
          if (activeTabId === id) {
            setActiveTabId(remaining[0].id);
            resetHistory(remaining[0].content);
          }
        }}
        onRenameTab={(id, title) => setTabs(tabs.map((t) => (t.id === id ? { ...t, title } : t)))}
        onUndo={() => {
          const prev = undo();
          if (prev !== null) setTabs((t) => t.map((tab) => (tab.id === activeTab.id ? { ...tab, content: prev } : tab)));
        }}
        onRedo={() => {
          const next = redo();
          if (next !== null) setTabs((t) => t.map((tab) => (tab.id === activeTab.id ? { ...tab, content: next } : tab)));
        }}
        onQuickGrammar={() => handleExecuteActionOnCaptured('grammar')}
        onQuickEnhance={() => handleExecuteActionOnCaptured('enhance-prompt')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onExport={(format) => {
          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${activeTab.title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        onCopyAll={() => {
          navigator.clipboard.writeText(content);
          addToast('success', 'Copied to Clipboard');
        }}
      />

      <main className="relative flex-1 flex overflow-hidden">
        <Editor
          content={content}
          settings={settings}
          editorRef={editorRef}
          onChange={(newContent) => {
            pushState(newContent);
            setTabs((prev) => prev.map((t) => (t.id === activeTab.id ? { ...t, content: newContent, updatedAt: Date.now() } : t)));
          }}
        />

        <CaretDot
          position={localCaretPosition}
          settings={settings.dot}
          isProcessing={isProcessing}
          status="idle"
          onClick={() => {
            window.electronAPI?.openMenuWindow();
          }}
        />
      </main>

      <StatsBar
        content={content}
        activeGrammarProvider={settings.ai.activeGrammarProvider}
        activePromptProvider={settings.ai.activePromptProvider}
        isAutoSaved={true}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          addToast('success', 'Preferences Saved');
        }}
        onClose={() => setIsSettingsOpen(false)}
      />

      <QuickTemplatesModal
        isOpen={isTemplatesOpen}
        onSelectTemplate={(tpl) => {
          pushState(tpl);
          setTabs((prev) => prev.map((t) => (t.id === activeTab.id ? { ...t, content: tpl, updatedAt: Date.now() } : t)));
        }}
        onClose={() => setIsTemplatesOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
