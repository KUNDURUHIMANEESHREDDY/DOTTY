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
  // 1. Settings & Tabs Persistence
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

  // Active Tab resolution
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

  // Sync undo/redo history when switching tabs
  const prevTabIdRef = useRef<string>(activeTab.id);
  useEffect(() => {
    if (prevTabIdRef.current !== activeTab.id) {
      prevTabIdRef.current = activeTab.id;
      resetHistory(activeTab.content);
    }
  }, [activeTab.id, activeTab.content, resetHistory]);

  // Sync content back to tab in memory & localStorage
  const handleContentChange = (newContent: string) => {
    pushState(newContent);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, content: newContent, updatedAt: Date.now() } : t))
    );
  };

  // 3. Caret Position Engine
  const { caretPosition, updateCaretPosition } = useCaretPosition(editorRef);

  // 4. Modals & Popups State
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
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

  // 5. Action Execution Engine
  const executeAction = async (
    action: ActionType,
    options?: { tone?: ToneType; targetLanguage?: string; customPrompt?: string }
  ) => {
    setIsActionMenuOpen(false);

    // Get current selection or document
    const textarea = editorRef.current;
    let targetText = content;
    let isSelectedRange = false;
    let range: { start: number; end: number } | undefined;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) {
        const selected = content.substring(start, end);
        if (selected.trim().length > 0) {
          targetText = selected;
          isSelectedRange = true;
          range = { start, end };
        }
      }
    }

    if (!targetText.trim()) {
      addToast('warning', 'Editor is Empty', 'Please type some text first before running AI actions.');
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

  // 6. Diff Modal Acceptance
  const handleAcceptDiff = (enhancedText: string, applyToSelectionOnly: boolean) => {
    setIsDiffModalOpen(false);
    if (!currentDiff) return;

    let nextContent = content;

    if (applyToSelectionOnly && currentDiff.range) {
      const { start, end } = currentDiff.range;
      nextContent = content.substring(0, start) + enhancedText + content.substring(end);
    } else if (!applyToSelectionOnly && currentDiff.range) {
      // Applied to selection originally, but user chose full replacement
      nextContent = enhancedText;
    } else {
      nextContent = enhancedText;
    }

    pushState(nextContent, undefined, true);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, content: nextContent, updatedAt: Date.now() } : t))
    );

    addToast('success', 'Changes Applied', `Updated via ${currentDiff.action}. Press Ctrl+Z to undo anytime.`);
    setCurrentDiff(null);

    // Refocus editor
    requestAnimationFrame(() => {
      editorRef.current?.focus();
      updateCaretPosition();
    });
  };

  // 7. Dot Click Handler
  const handleDotClick = () => {
    setMenuPosition({ x: caretPosition.x, y: caretPosition.y });
    setIsActionMenuOpen((prev) => !prev);
  };

  // 8. Keyboard Shortcuts
  useKeyboardShortcuts({
    onTriggerMenu: () => {
      setMenuPosition({ x: caretPosition.x, y: caretPosition.y });
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
    onSave: () => {
      addToast('info', 'Document Saved', 'Your work is auto-saved locally.');
    },
    onEscape: () => {
      setIsActionMenuOpen(false);
      setIsDiffModalOpen(false);
      setIsSettingsOpen(false);
      setIsTemplatesOpen(false);
    },
  });

  // 9. Tab Operations
  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: DocumentTab = {
      id: newId,
      title: `Draft ${tabs.length + 1}`,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    resetHistory('');
    addToast('info', 'New Tab Created');
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
      resetHistory(remaining[0].content);
    }
  };

  const handleRenameTab = (id: string, title: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, title } : t)));
  };

  // 10. Exports & Copy
  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(content);
      addToast('success', 'Copied to Clipboard', 'Entire document copied to clipboard.');
    } catch {
      addToast('error', 'Copy Failed', 'Clipboard access denied.');
    }
  };

  const handleExportFile = (format: 'md' | 'txt') => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab.title.toLowerCase().replace(/\s+/g, '-') || 'dotty-draft'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', 'File Downloaded', `Exported as ${format.toUpperCase()}.`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Header */}
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
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        onRenameTab={handleRenameTab}
        onUndo={() => {
          const prev = undo();
          if (prev !== null) {
            setTabs((t) => t.map((tab) => (tab.id === activeTab.id ? { ...tab, content: prev } : tab)));
          }
        }}
        onRedo={() => {
          const next = redo();
          if (next !== null) {
            setTabs((t) => t.map((tab) => (tab.id === activeTab.id ? { ...tab, content: next } : tab)));
          }
        }}
        onQuickGrammar={() => executeAction('grammar')}
        onQuickEnhance={() => executeAction('enhance-prompt')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onExport={handleExportFile}
        onCopyAll={handleCopyAll}
      />

      {/* Workspace Editor Area */}
      <main className="relative flex-1 flex overflow-hidden">
        <Editor
          content={content}
          settings={settings}
          editorRef={editorRef}
          onChange={handleContentChange}
        />

        {/* Floating Caret Dot Indicator */}
        <CaretDot
          position={caretPosition}
          settings={settings.dot}
          isProcessing={isProcessing}
          status={dotStatus}
          onClick={handleDotClick}
        />

        {/* Action Menu Popup */}
        <ActionMenu
          isOpen={isActionMenuOpen}
          position={menuPosition}
          hasSelection={caretPosition.isSelection}
          selectedText={caretPosition.selectedText}
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

      {/* Footer Stats Bar */}
      <StatsBar
        content={content}
        activeGrammarProvider={settings.ai.activeGrammarProvider}
        activePromptProvider={settings.ai.activePromptProvider}
        isAutoSaved={true}
      />

      {/* Modals */}
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
          addToast('success', 'Preferences Saved', 'Updated AI and dot preferences.');
        }}
        onClose={() => setIsSettingsOpen(false)}
      />

      <QuickTemplatesModal
        isOpen={isTemplatesOpen}
        onSelectTemplate={(tpl) => {
          handleContentChange(tpl);
          addToast('info', 'Template Loaded', 'Loaded template into editor.');
        }}
        onClose={() => setIsTemplatesOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
export default App;
