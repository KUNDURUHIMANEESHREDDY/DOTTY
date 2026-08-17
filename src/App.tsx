import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { ExternalLink, Edit3 } from 'lucide-react';

const INITIAL_DEMO_TEXT = `# Welcome to Dotty ✦

Dotty is your intelligent desktop typing assistant. As you type, notice the subtle glowing dot floating beside your cursor.

### 🧪 Try It Out:

1. **Test Grammar Correction:**
He dont knows what their doing and he didnt recieved the email untill yesterday.
*(Place your cursor in the sentence above and click the Dot or press Ctrl+Shift+G)*

2. **Test Prompt Enhancement:**
write a python script for scraping news headlines
*(Highlight this line and click the Dot or press Ctrl+Shift+P)*

3. **Explore Tone Shifts & Summaries:**
Click the floating dot anytime to change tone, summarize, or translate.`;

export function App() {
  // Check if running as dedicated Editor window or Global Screen Overlay
  const isDedicatedEditor = window.location.hash === '#editor';

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

  // 2. Editor & Undo/Redo Engine
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { content, pushState, undo, redo, canUndo, canRedo, resetHistory } = useUndoRedo(activeTab.content);

  // 3. Local Caret Position (Editor mode)
  const { caretPosition: localCaretPosition, updateCaretPosition } = useCaretPosition(editorRef);

  // 4. Global Screen Cursor Position (System-Wide Overlay mode)
  const [globalCursorPos, setGlobalCursorPos] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [isOverlayActive, setIsOverlayActive] = useState(!isDedicatedEditor);
  const [externalCapturedText, setExternalCapturedText] = useState<string>('');

  // Manage click-through for transparent overlay window
  const setInteractive = useCallback((interactive: boolean) => {
    if (window.electronAPI && !isDedicatedEditor) {
      window.electronAPI.setIgnoreMouseEvents(!interactive, { forward: true });
    }
  }, [isDedicatedEditor]);

  // Subscribe to global cursor move events from Electron
  useEffect(() => {
    if (window.electronAPI && !isDedicatedEditor) {
      const unsubscribe = window.electronAPI.onGlobalCursorMove((pt) => {
        setGlobalCursorPos(pt);
      });
      return unsubscribe;
    }
  }, [isDedicatedEditor]);

  // Modals & Popups State
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 100, y: 100 });
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [currentDiff, setCurrentDiff] = useState<DiffResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Processing & Toast status
  const [isProcessing, setIsProcessing] = useState(false);
  const [dotStatus, setDotStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
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

  // Sync interactive state when popups open/close
  useEffect(() => {
    if (!isDedicatedEditor) {
      const anyPopupOpen = isActionMenuOpen || isDiffModalOpen || isSettingsOpen || isTemplatesOpen;
      setInteractive(anyPopupOpen);
    }
  }, [isActionMenuOpen, isDiffModalOpen, isSettingsOpen, isTemplatesOpen, isDedicatedEditor, setInteractive]);

  // 5. Action Execution Engine (Handles both in-editor and external app text)
  const executeAction = async (
    action: ActionType,
    options?: { tone?: ToneType; targetLanguage?: string; customPrompt?: string }
  ) => {
    setIsActionMenuOpen(false);

    let targetText = content;
    let isExternal = false;
    let range: { start: number; end: number } | undefined;

    if (!isDedicatedEditor && externalCapturedText) {
      targetText = externalCapturedText;
      isExternal = true;
    } else if (isDedicatedEditor && editorRef.current) {
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
      addToast('warning', 'No Text Selected', 'Highlight text in any application and click Dotty to process.');
      return;
    }

    setIsProcessing(true);
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
      setCurrentDiff(result);
      setIsDiffModalOpen(true);
      setDotStatus('success');
      setTimeout(() => setDotStatus('idle'), 2000);
    } catch (err: any) {
      setDotStatus('error');
      setTimeout(() => setDotStatus('idle'), 3000);
      addToast('error', 'Action Failed', err.message || 'An error occurred during AI processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Diff Acceptance & Replacement
  const handleAcceptDiff = async (enhancedText: string, applyToSelectionOnly: boolean) => {
    setIsDiffModalOpen(false);
    if (!currentDiff) return;

    // If we captured text from an external application (e.g. Chrome, Word, VSCode)
    if (!isDedicatedEditor && window.electronAPI && externalCapturedText) {
      await window.electronAPI.pasteToActiveWindow(enhancedText);
      addToast('success', 'Pasted to Active Window', 'Replaced text in your application.');
      setExternalCapturedText('');
      setCurrentDiff(null);
      setInteractive(false);
      return;
    }

    // In-Editor replacement
    let nextContent = content;
    if (applyToSelectionOnly && currentDiff.range) {
      const { start, end } = currentDiff.range;
      nextContent = content.substring(0, start) + enhancedText + content.substring(end);
    } else {
      nextContent = enhancedText;
    }

    pushState(nextContent, undefined, true);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, content: nextContent, updatedAt: Date.now() } : t))
    );

    addToast('success', 'Changes Applied', `Updated via ${currentDiff.action}.`);
    setCurrentDiff(null);

    requestAnimationFrame(() => {
      editorRef.current?.focus();
      updateCaretPosition();
    });
  };

  // 7. Dot Click Handler (System-Wide vs Editor)
  const handleDotClick = async () => {
    if (!isDedicatedEditor && window.electronAPI) {
      // Capture highlighted text from whatever app the user is actively in
      const selected = await window.electronAPI.captureActiveSelection();
      setExternalCapturedText(selected);
      setMenuPosition({ x: globalCursorPos.x, y: globalCursorPos.y });
    } else {
      setMenuPosition({ x: localCaretPosition.x, y: localCaretPosition.y });
    }

    setInteractive(true);
    setIsActionMenuOpen((prev) => !prev);
  };

  // 8. Keyboard Shortcuts
  useKeyboardShortcuts({
    onTriggerMenu: async () => {
      if (!isDedicatedEditor && window.electronAPI) {
        const selected = await window.electronAPI.captureActiveSelection();
        setExternalCapturedText(selected);
        setMenuPosition({ x: globalCursorPos.x, y: globalCursorPos.y });
      } else {
        setMenuPosition({ x: localCaretPosition.x, y: localCaretPosition.y });
      }
      setInteractive(true);
      setIsActionMenuOpen((prev) => !prev);
    },
    onFixGrammar: () => executeAction('grammar'),
    onEnhancePrompt: () => executeAction('enhance-prompt'),
    onUndo: () => {
      const prev = undo();
      if (prev !== null) {
        setTabs((t) => t.map((tab) => (tab.id === activeTab.id ? { ...tab, content: prev } : tab)));
      }
    },
    onRedo: () => {
      const next = redo();
      if (next !== null) {
        setTabs((t) => t.map((tab) => (tab.id === activeTab.id ? { ...tab, content: next } : tab)));
      }
    },
    onEscape: () => {
      setIsActionMenuOpen(false);
      setIsDiffModalOpen(false);
      setIsSettingsOpen(false);
      setIsTemplatesOpen(false);
      setInteractive(false);
    },
  });

  // Effective Caret Position based on mode
  const activeDotPosition: CaretPosition = isDedicatedEditor
    ? localCaretPosition
    : {
        x: globalCursorPos.x,
        y: globalCursorPos.y,
        height: 24,
        visible: true,
        isSelection: Boolean(externalCapturedText),
        selectedText: externalCapturedText,
      };

  // =========================================================================
  // VIEW 1: SYSTEM-WIDE GLOBAL OVERLAY MODE (VISIBLE DIRECTLY ON DESKTOP SCREEN)
  // =========================================================================
  if (!isDedicatedEditor) {
    return (
      <div className="fixed inset-0 w-screen h-screen pointer-events-none overflow-hidden select-none bg-transparent">
        {/* Floating System-Wide Cursor Dot */}
        <div
          onMouseEnter={() => setInteractive(true)}
          onMouseLeave={() => {
            if (!isActionMenuOpen && !isDiffModalOpen && !isSettingsOpen) {
              setInteractive(false);
            }
          }}
          className="pointer-events-auto"
        >
          <CaretDot
            position={activeDotPosition}
            settings={settings.dot}
            isProcessing={isProcessing}
            status={dotStatus}
            onClick={handleDotClick}
          />
        </div>

        {/* Floating Action Menu near Cursor */}
        <div onMouseEnter={() => setInteractive(true)} className="pointer-events-auto">
          <ActionMenu
            isOpen={isActionMenuOpen}
            position={menuPosition}
            hasSelection={Boolean(externalCapturedText)}
            selectedText={externalCapturedText}
            totalText={externalCapturedText || 'Active Screen Text'}
            activeGrammarProvider={settings.ai.activeGrammarProvider}
            activePromptProvider={settings.ai.activePromptProvider}
            onSelectAction={executeAction}
            onClose={() => {
              setIsActionMenuOpen(false);
              setInteractive(false);
            }}
            onOpenSettings={() => {
              setIsActionMenuOpen(false);
              setIsSettingsOpen(true);
            }}
          />
        </div>

        {/* Global Floating Modals */}
        <div onMouseEnter={() => setInteractive(true)} className="pointer-events-auto">
          <DiffModal
            isOpen={isDiffModalOpen}
            diffResult={currentDiff}
            hasSelection={Boolean(externalCapturedText)}
            onAccept={handleAcceptDiff}
            onReject={() => {
              setIsDiffModalOpen(false);
              setInteractive(false);
            }}
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
            onClose={() => {
              setIsSettingsOpen(false);
              setInteractive(false);
            }}
          />

          <QuickTemplatesModal
            isOpen={isTemplatesOpen}
            onSelectTemplate={async (tpl) => {
              if (window.electronAPI) {
                await window.electronAPI.pasteToActiveWindow(tpl);
                addToast('success', 'Template Pasted into Active Window');
              }
              setIsTemplatesOpen(false);
              setInteractive(false);
            }}
            onClose={() => {
              setIsTemplatesOpen(false);
              setInteractive(false);
            }}
          />
        </div>

        {/* Optional floating quick-access badge in bottom-right corner to open Notepad */}
        <div
          onMouseEnter={() => setInteractive(true)}
          onMouseLeave={() => {
            if (!isActionMenuOpen && !isDiffModalOpen && !isSettingsOpen) {
              setInteractive(false);
            }
          }}
          className="fixed bottom-4 right-4 pointer-events-auto flex items-center gap-2"
        >
          <button
            onClick={() => window.electronAPI?.openEditorWindow()}
            className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-105"
            title="Open Dotty Standalone Notepad Scratchpad"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Open Notepad</span>
          </button>
        </div>

        {/* Toast Notifications */}
        <div onMouseEnter={() => setInteractive(true)} className="pointer-events-auto">
          <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DEDICATED STANDALONE NOTEPAD SCRATCHPAD (Full Window)
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
        onQuickGrammar={() => executeAction('grammar')}
        onQuickEnhance={() => executeAction('enhance-prompt')}
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
          status={dotStatus}
          onClick={handleDotClick}
        />

        <ActionMenu
          isOpen={isActionMenuOpen}
          position={menuPosition}
          hasSelection={localCaretPosition.isSelection}
          selectedText={localCaretPosition.selectedText}
          totalText={content}
          activeGrammarProvider={settings.ai.activeGrammarProvider}
          activePromptProvider={settings.ai.activePromptProvider}
          onSelectAction={executeAction}
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
        diffResult={currentDiff}
        hasSelection={Boolean(currentDiff?.range)}
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
