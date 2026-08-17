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
import { Sparkles } from 'lucide-react';

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
  // VIEW 1: FLOATING DESKTOP CARET DOT & ACTION MENU WIDGET
  // =========================================================================
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [capturedText, setCapturedText] = useState<string>('');
  const [currentDiff, setCurrentDiff] = useState<DiffResult | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Listen for captured text sent when ActionMenu opens
  useEffect(() => {
    if (window.electronAPI?.onMenuTrigger && !isDedicatedEditor) {
      const unsubscribe = window.electronAPI.onMenuTrigger((data: { selectedText: string }) => {
        setCapturedText(data.selectedText || '');
        setIsActionMenuOpen(true);
      });
      return unsubscribe;
    }
  }, [isDedicatedEditor]);

  // Execute AI action on captured text
  const handleExecuteWidgetAction = async (
    action: ActionType,
    options?: { tone?: ToneType; targetLanguage?: string; customPrompt?: string }
  ) => {
    setIsActionMenuOpen(false);

    const textToProcess = capturedText.trim();
    if (!textToProcess) {
      addToast('warning', 'No Text Highlighted', 'Highlight text in any application and click Dotty.');
      window.electronAPI?.closeActionMenu();
      return;
    }

    setIsProcessing(true);
    setDotStatus('processing');

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
      setIsDiffModalOpen(true);
      setDotStatus('success');
      setTimeout(() => setDotStatus('idle'), 2000);
    } catch (err: any) {
      setDotStatus('error');
      setTimeout(() => setDotStatus('idle'), 3000);
      addToast('error', 'Action Failed', err.message || 'Error processing AI action.');
      window.electronAPI?.closeActionMenu();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptWidgetDiff = async (enhancedText: string) => {
    setIsDiffModalOpen(false);
    setCurrentDiff(null);
    if (window.electronAPI) {
      await window.electronAPI.pasteToActiveWindow(enhancedText);
    }
  };

  if (!isDedicatedEditor) {
    return (
      <div className="w-screen h-screen bg-transparent select-none overflow-hidden relative font-sans">
        {/* Floating CaretDot (calmly visible next to cursor) */}
        {!isActionMenuOpen && !isDiffModalOpen && (
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer select-none p-1"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsActionMenuOpen(true);
              window.electronAPI?.openActionMenu();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsActionMenuOpen(true);
              window.electronAPI?.openActionMenu();
            }}
            title="Dotty AI Assistant (Click to open ActionMenu or Alt+Space)"
          >
            <div className="relative group flex items-center justify-center pointer-events-auto">
              {/* Outer Pulsing Glow */}
              <div
                className="absolute -inset-1 rounded-full opacity-70 animate-ping pointer-events-none"
                style={{ backgroundColor: settings.dot.color || '#38bdf8' }}
              />

              {/* Central Glowing Interactive Dot Bubble */}
              <div
                className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-2xl transition-all transform group-hover:scale-115 active:scale-95 cursor-pointer bg-slate-900 border-2"
                style={{
                  borderColor: settings.dot.color || '#38bdf8',
                  boxShadow: `0 0 16px 3px ${settings.dot.color || '#38bdf8'}cc`,
                }}
              >
                <Sparkles className="w-4 h-4 text-sky-300 animate-pulse pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Floating ActionMenu (Full Uncropped Card) */}
        {isActionMenuOpen && (
          <div className="w-full h-full p-1 flex flex-col">
            <ActionMenu
              isOpen={isActionMenuOpen}
              position={{ x: 0, y: 0 }}
              hasSelection={Boolean(capturedText)}
              selectedText={capturedText}
              totalText={capturedText}
              activeGrammarProvider={settings.ai.activeGrammarProvider}
              activePromptProvider={settings.ai.activePromptProvider}
              onSelectAction={handleExecuteWidgetAction}
              onClose={() => {
                setIsActionMenuOpen(false);
                window.electronAPI?.closeActionMenu();
              }}
              onOpenSettings={() => {
                setIsActionMenuOpen(false);
                setIsSettingsOpen(true);
              }}
            />
          </div>
        )}

        {/* Visual Side-by-Side Diff Modal */}
        <DiffModal
          isOpen={isDiffModalOpen}
          diffResult={currentDiff}
          hasSelection={Boolean(capturedText)}
          onAccept={(enhancedText) => handleAcceptWidgetDiff(enhancedText)}
          onReject={() => {
            setIsDiffModalOpen(false);
            setCurrentDiff(null);
            window.electronAPI?.closeActionMenu();
          }}
          onCopy={(text) => {
            navigator.clipboard.writeText(text);
            addToast('success', 'Copied to Clipboard');
          }}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          settings={settings}
          onSave={(newSettings) => {
            setSettings(newSettings);
            addToast('success', 'Settings Saved');
          }}
          onClose={() => {
            setIsSettingsOpen(false);
            window.electronAPI?.closeActionMenu();
          }}
        />

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

  const [isEditorActionMenuOpen, setIsEditorActionMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 200, y: 200 });
  const [editorDiff, setEditorDiff] = useState<DiffResult | null>(null);
  const [isEditorDiffModalOpen, setIsEditorDiffModalOpen] = useState(false);
  const [isEditorSettingsOpen, setIsEditorSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isEditorProcessing, setIsEditorProcessing] = useState(false);
  const [editorDotStatus, setEditorDotStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const executeEditorAction = async (
    action: ActionType,
    options?: { tone?: ToneType; targetLanguage?: string; customPrompt?: string }
  ) => {
    setIsEditorActionMenuOpen(false);

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
    setEditorDotStatus('processing');

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
      setIsEditorDiffModalOpen(true);
      setEditorDotStatus('success');
      setTimeout(() => setEditorDotStatus('idle'), 2000);
    } catch (err: any) {
      setEditorDotStatus('error');
      setTimeout(() => setEditorDotStatus('idle'), 3000);
      addToast('error', 'Action Failed', err.message || 'An error occurred during AI processing.');
    } finally {
      setIsEditorProcessing(false);
    }
  };

  const handleAcceptEditorDiff = async (enhancedText: string, applyToSelectionOnly: boolean) => {
    setIsEditorDiffModalOpen(false);
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
      setIsEditorActionMenuOpen(true);
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
      setIsEditorActionMenuOpen(false);
      setIsEditorDiffModalOpen(false);
      setIsEditorSettingsOpen(false);
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
        onOpenSettings={() => setIsEditorSettingsOpen(true)}
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
          status={editorDotStatus}
          onClick={() => {
            setMenuPosition({ x: localCaretPosition.x, y: localCaretPosition.y });
            setIsEditorActionMenuOpen(true);
          }}
        />

        <ActionMenu
          isOpen={isEditorActionMenuOpen}
          position={menuPosition}
          hasSelection={localCaretPosition.isSelection}
          selectedText={localCaretPosition.selectedText}
          totalText={content}
          activeGrammarProvider={settings.ai.activeGrammarProvider}
          activePromptProvider={settings.ai.activePromptProvider}
          onSelectAction={executeEditorAction}
          onClose={() => setIsEditorActionMenuOpen(false)}
          onOpenSettings={() => {
            setIsEditorActionMenuOpen(false);
            setIsEditorSettingsOpen(true);
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
        isOpen={isEditorDiffModalOpen}
        diffResult={editorDiff}
        hasSelection={Boolean(editorDiff?.range)}
        onAccept={handleAcceptEditorDiff}
        onReject={() => setIsEditorDiffModalOpen(false)}
        onCopy={(text) => {
          navigator.clipboard.writeText(text);
          addToast('success', 'Copied to Clipboard');
        }}
      />

      <SettingsModal
        isOpen={isEditorSettingsOpen}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          addToast('success', 'Preferences Saved');
        }}
        onClose={() => setIsEditorSettingsOpen(false)}
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
