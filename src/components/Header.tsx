import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Settings, 
  Download, 
  Copy, 
  RotateCcw, 
  RotateCw, 
  CheckCheck, 
  Sparkles, 
  Lightbulb, 
  FileDown,
  Check,
  ChevronDown
} from 'lucide-react';
import { DocumentTab } from '../types';

interface HeaderProps {
  tabs: DocumentTab[];
  activeTabId: string;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, title: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onQuickGrammar: () => void;
  onQuickEnhance: () => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onExport: (format: 'md' | 'txt') => void;
  onCopyAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tabs,
  activeTabId,
  canUndo,
  canRedo,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onRenameTab,
  onUndo,
  onRedo,
  onQuickGrammar,
  onQuickEnhance,
  onOpenSettings,
  onOpenTemplates,
  onExport,
  onCopyAll,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartRename = (tab: DocumentTab) => {
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleFinishRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameTab(id, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  return (
    <header className="h-14 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between gap-4 select-none z-40">
      {/* Brand & Tabs Section */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0 pr-2 border-r border-slate-800">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
              DOTTY
              <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                AI
              </span>
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-xl">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isEditing = editingTabId === tab.id;

            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                onDoubleClick={() => handleStartRename(tab)}
                className={`group px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 border-slate-700 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-900 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleFinishRename(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(tab.id);
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    className="w-20 bg-slate-900 px-1 py-0.5 rounded text-xs text-white border border-sky-500 outline-none"
                  />
                ) : (
                  <span className="truncate max-w-[120px]">{tab.title}</span>
                )}

                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={onAddTab}
            className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="New Scratchpad Tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Grammar */}
        <button
          onClick={onQuickGrammar}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-300 hover:text-emerald-400 transition-colors"
          title="Fix Grammar (Ctrl+Shift+G)"
        >
          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Grammar</span>
        </button>

        {/* Quick Enhance Prompt */}
        <button
          onClick={onQuickEnhance}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs font-medium text-slate-300 hover:text-sky-400 transition-colors"
          title="Enhance Prompt (Ctrl+Shift+P)"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Enhance</span>
        </button>

        {/* Templates */}
        <button
          onClick={onOpenTemplates}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          title="Prompt & Writing Templates"
        >
          <Lightbulb className="w-4 h-4 text-purple-400" />
        </button>

        {/* Export Menu */}
        <div className="relative">
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isExportMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1 z-50 text-xs text-slate-200 animate-pop-in"
              onClick={() => setIsExportMenuOpen(false)}
            >
              <button
                onClick={onCopyAll}
                className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-slate-800 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Copy Entire Document</span>
              </button>
              <button
                onClick={() => onExport('md')}
                className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-slate-800 flex items-center gap-2"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download as Markdown (.md)</span>
              </button>
              <button
                onClick={() => onExport('txt')}
                className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-slate-800 flex items-center gap-2"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Download as Plain Text (.txt)</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          title="Dotty Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
