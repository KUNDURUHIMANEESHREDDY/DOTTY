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

Dotty is your intelligent desktop typing assistant and smart editor.

### 🧪 Try It Out:

1. **Test Grammar Correction:**
He dont knows what their doing and he didnt recieved the email untill yesterday.
*(Highlight this line and click Fix Grammar or press Alt+G)*

2. **Test Prompt Enhancement:**
write a python script for scraping news headlines
*(Highlight this line and click Enhance Prompt)*

3. **Explore Plain English & Tone Shifts:**
Use the AI Action Menu or header buttons to transform text!`;

export function App() {
  const isDedicatedEditor = window.location.hash === '#editor';
  const [settings, setSettings] = useLocalStorage<AppSettings>('dotty_settings_v1', DEFAULT_SETTINGS);

  // =========================================================================
  // VIEW 1: SINGLE EXPANDING DESKTOP WIDGET (Dot Mode <---> Enhance Tab Mode)
  // =========================================================================
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [currentDiff, setCurrentDiff] = useState<DiffResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleExpand = async () => {
    setIsExpanded(true);
    window.electronAPI?.expandWindow();
    try {
      const clipText = await window.electronAPI?.getClipboardText();
      if (clipText && clipText.trim().length > 0) {
        setCustomInput(clipText);
      }
    } catch {
      // Ignored
    }
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setCurrentDiff(null);
    window.electronAPI?.collapseWindow();
  };

  // Execute AI Action on input
  const handleExecuteAction = async (
    action: ActionType,
    options?: { tone?: ToneType; targetLanguage?: string; customPrompt?: string }
  ) => {
    const textToProcess = customInput.trim();
    if (!textToProcess) {
      addToast('warning', 'Enter or Copy Text', 'Type or paste text to enhance with AI.');
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
      addToast('error', 'Action Failed', err.message || 'Error executing action.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isDedicatedEditor) {
    if (!isExpanded) {
      // 48x48 Glowing Dot Mode
      return (
        <div
          className="w-full h-full flex items-center justify-center bg-transparent select-none cursor-pointer p-1"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleExpand();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleExpand();
          }}
          title="Dotty AI Assistant (Click to open Features Tab or Alt+Space)"
        >
          <div className="relative group flex items-center justify-center pointer-events-auto">
            {/* Subtle Outer Glow Ring */}
            <div
              className="absolute -inset-1 rounded-full opacity-70 animate-ping pointer-events-none"
              style={{ backgroundColor: settings.dot.color || '#38bdf8' }}
            />

            {/* Glowing Interactive Dot Bubble */}
            <div
              className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-2xl transition-all transform group-hover:scale-110 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: '#0f172a',
                border: `2px solid ${settings.dot.color || '#38bdf8'}`,
                boxShadow: `0 0 18px 3px ${settings.dot.color || '#38bdf8'}aa`,
              }}
            >
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse pointer-events-none" />
            </div>
          </div>
        </div>
      );
    }

    // 380x540 Expanded Enhance Features Tab Mode
    return (
      <div className="w-screen h-screen p-2 bg-transparent select-none flex flex-col font-sans">
        <div className="w-full h-full bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 backdrop-blur-2xl">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Dotty AI Features</span>
              {customInput.trim() && (
                <span className="text-[10px] bg-slate-950/80 text-sky-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                  {customInput.trim().split(/\s+/).filter(Boolean).length}w
                </span>
              )}
            </div>
            <button
              onClick={handleCollapse}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Close Tab (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body: Action Buttons or Diff Review */}
          <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
            {currentDiff ? (
              /* Diff Review Card */
              <div className="space-y-3 p-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {currentDiff.action}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentDiff.explanation || 'Enhanced locally'}
                  </span>
                </div>

                {/* Enhanced output preview */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto text-emerald-300 shadow-inner">
                  {currentDiff.enhancedText}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={async () => {
                      if (window.electronAPI) {
                        await window.electronAPI.pasteToActiveWindow(currentDiff.enhancedText);
                      }
                      handleCollapse();
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/25 transition-all active:scale-98"
                  >
                    <Check className="w-4 h-4" />
                    <span>Replace in App</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentDiff.enhancedText);
                      addToast('success', 'Copied to Clipboard');
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentDiff(null)}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              /* Features Action Buttons & Input */
              <div className="space-y-2">
                {/* Text input area */}
                <div>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Type or paste text to enhance..."
                    rows={3}
                    className="w-full px-2.5 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => handleExecuteAction('grammar')}
                    disabled={isProcessing}
                    className="w-full px-3 py-2.5 rounded-xl text-left bg-slate-800/80 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-all group border border-slate-700/50 hover:border-slate-600"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-100">Fix Grammar & Spelling</div>
                        <div className="text-[10px] text-slate-400">Sub-4ms local zero-cloud correction</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">Alt+G</span>
                  </button>

                  <button
                    onClick={() => handleExecuteAction('enhance-prompt')}
                    disabled={isProcessing}
                    className="w-full px-3 py-2.5 rounded-xl text-left bg-slate-800/80 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-all group border border-slate-700/50 hover:border-slate-600"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-100">Enhance Prompt</div>
                        <div className="text-[10px] text-slate-400">Role, context, constraints & specs</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">Alt+P</span>
                  </button>

                  <button
                    onClick={() => handleExecuteAction('tone', { tone: 'accessible' })}
                    disabled={isProcessing}
                    className="w-full px-3 py-2 rounded-xl text-left bg-slate-800/50 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-colors border border-transparent hover:border-slate-700/60"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-200">🌿 Plain English (Accessible)</div>
                      <div className="text-[10px] text-slate-400">Simplify bureaucratic jargon</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleExecuteAction('tone', { tone: 'professional' })}
                    disabled={isProcessing}
                    className="w-full px-3 py-2 rounded-xl text-left bg-slate-800/50 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-colors border border-transparent hover:border-slate-700/60"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-200">💼 Professional Tone</div>
                      <div className="text-[10px] text-slate-400">Polished executive phrasing</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleExecuteAction('summarize')}
                    disabled={isProcessing}
                    className="w-full px-3 py-2 rounded-xl text-left bg-slate-800/50 hover:bg-slate-800 text-slate-100 flex items-center justify-between transition-colors border border-transparent hover:border-slate-700/60"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-200">📋 Summarize Key Takeaways</div>
                      <div className="text-[10px] text-slate-400">Extract bullet points offline</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer: Open Notepad link */}
          <div className="px-3.5 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => {
                handleCollapse();
                window.electronAPI?.openEditorWindow();
              }}
              className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open Standalone Notepad</span>
            </button>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              100% Offline
            </span>
          </div>
        </div>

        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: #editor — STANDALONE FULL NOTEPAD SCRATCHPAD
  // =========================================================================
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

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { content, pushState, undo, redo, canUndo, canRedo, resetHistory } = useUndoRedo(activeTab.content);
  const { caretPosition: localCaretPosition, updateCaretPosition } = useCaretPosition(editorRef);

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 200, y: 200 });
  const [editorDiff, setEditorDiff] = useState<DiffResult | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isEditorProcessing, setIsEditorProcessing] = useState(false);
  const [dotStatus, setDotStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const executeEditorAction = async (
    action: ActionType,
    options?: { tone?: ToneType; targetLanguage?: string; customPrompt?: string }
  ) => {
    setIsActionMenuOpen(false);

    let targetText = content;
    let range: { start: number; end: number } | undefined;

    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      if (start !== end) {
        const selected = content.substring(start, end);
        if (selected.trim().length > 0) {
          targetText = selected;
          range = { start, end };
        }
      }
    }

    if (!targetText.trim()) {
      addToast('warning', 'No Text in Editor', 'Type or paste text to process.');
      return;
    }

    setIsEditorProcessing(true);
    setDotStatus('processing');

    try {
      const result = await processTextWithAI({
        action,
        text: targetText,
        tone: options?.tone,
        customPrompt: options?.customPrompt,
        targetLanguage: options?.targetLanguage,
        settings: settings.ai,
        customRules: settings.customRules,
      });

      result.range = range;
      setEditorDiff(result);
      setIsDiffModalOpen(true);
      setDotStatus('success');
      setTimeout(() => setDotStatus('idle'), 2000);
    } catch (err: any) {
      setDotStatus('error');
      setTimeout(() => setDotStatus('idle'), 3000);
      addToast('error', 'Action Failed', err.message || 'An error occurred during AI processing.');
    } finally {
      setIsEditorProcessing(false);
    }
  };

  const handleAcceptDiff = async (enhancedText: string, applyToSelectionOnly: boolean) => {
    setIsDiffModalOpen(false);
    if (!editorDiff) return;

    let nextContent = content;
    if (applyToSelectionOnly && editorDiff.range) {
      const { start, end } = editorDiff.range;
      nextContent = content.substring(0, start) + enhancedText + content.substring(end);
    } else {
      nextContent = enhancedText;
    }

    pushState(nextContent, undefined, true);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, content: nextContent, updatedAt: Date.now() } : t))
    );

    addToast('success', 'Changes Applied', `Updated via ${editorDiff.action}.`);
    setEditorDiff(null);

    requestAnimationFrame(() => {
      editorRef.current?.focus();
      updateCaretPosition();
    });
  };

  useKeyboardShortcuts({
    onTriggerMenu: () => {
      setMenuPosition({ x: localCaretPosition.x, y: localCaretPosition.y });
      setIsActionMenuOpen(true);
    },
    onFixGrammar: () => executeEditorAction('grammar'),
    onEnhancePrompt: () => executeEditorAction('enhance-prompt'),
    onUndo: () => {
      const prev = undo();
      if (prev !== null) setTabs((t) => t.map((tab) => (tab.id === activeTab.id ? { ...tab, content: prev } : tab)));
    },
    onRedo: () => {
      const next = redo();
      if (next !== null) setTabs((t) => t.map((tab) => (tab.id === activeTab.id ? { ...tab, content: next } : tab)));
    },
    onEscape: () => {
      setIsActionMenuOpen(false);
      setIsDiffModalOpen(false);
      setIsSettingsOpen(false);
      setIsTemplatesOpen(false);
    },
  });

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
        onQuickGrammar={() => executeEditorAction('grammar')}
        onQuickEnhance={() => executeEditorAction('enhance-prompt')}
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
          isProcessing={isEditorProcessing}
          status={dotStatus}
          onClick={() => {
            setMenuPosition({ x: localCaretPosition.x, y: localCaretPosition.y });
            setIsActionMenuOpen(true);
          }}
        />

        <ActionMenu
          isOpen={isActionMenuOpen}
          position={menuPosition}
          hasSelection={localCaretPosition.isSelection}
          selectedText={localCaretPosition.selectedText}
          totalText={content}
          activeGrammarProvider={settings.ai.activeGrammarProvider}
          activePromptProvider={settings.ai.activePromptProvider}
          onSelectAction={executeEditorAction}
          onClose={() => setIsActionMenuOpen(false)}
          onOpenSettings={() => {
            setIsActionMenuOpen(false);
            setIsSettingsOpen(true);
          }}
        />
      </main>

      <StatsBar
        content={content}
        activeGrammarProvider={settings.ai.activeGrammarProvider}
        activePromptProvider={settings.ai.activePromptProvider}
        isAutoSaved={true}
      />

      <DiffModal
        isOpen={isDiffModalOpen}
        diffResult={editorDiff}
        hasSelection={Boolean(editorDiff?.range)}
        onAccept={handleAcceptDiff}
        onReject={() => setIsDiffModalOpen(false)}
        onCopy={(text) => {
          navigator.clipboard.writeText(text);
          addToast('success', 'Copied to Clipboard');
        }}
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
