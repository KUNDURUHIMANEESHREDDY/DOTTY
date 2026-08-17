import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCheck, 
  Sparkles, 
  Smile, 
  FileText, 
  Maximize2, 
  Globe, 
  Code2, 
  Send,
  ChevronRight,
  Zap,
  Sliders
} from 'lucide-react';
import { ActionType, ToneType, AIProvider } from '../types';

interface ActionMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  hasSelection: boolean;
  selectedText: string;
  totalText: string;
  activeGrammarProvider: AIProvider;
  activePromptProvider: AIProvider;
  onSelectAction: (action: ActionType, options?: { tone?: ToneType; targetLanguage?: string; customPrompt?: string }) => void;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen,
  position,
  hasSelection,
  selectedText,
  totalText,
  activeGrammarProvider,
  activePromptProvider,
  onSelectAction,
  onClose,
  onOpenSettings,
}) => {
  const [activeSubMenu, setActiveSubMenu] = useState<'none' | 'tone' | 'translate' | 'custom'>('none');
  const [customPromptInput, setCustomPromptInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Viewport clamping
  const menuWidth = 280;
  const menuHeight = 360;
  const clampedX = Math.min(Math.max(16, position.x + 16), window.innerWidth - menuWidth - 20);
  const clampedY = Math.min(Math.max(16, position.y - 40), window.innerHeight - menuHeight - 20);

  const wordCount = hasSelection 
    ? selectedText.trim().split(/\s+/).filter(Boolean).length 
    : totalText.trim().split(/\s+/).filter(Boolean).length;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPromptInput.trim()) return;
    onSelectAction('custom', { customPrompt: customPromptInput.trim() });
    setCustomPromptInput('');
    setActiveSubMenu('none');
  };

  return (
    <div
      ref={menuRef}
      data-dotty-interactive="true"
      style={{
        position: 'fixed',
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        zIndex: 9999,
      }}
      className="w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-pop-in text-slate-200"
    >
      {/* Header with scope information */}
      <div className="px-3.5 py-2.5 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">Dotty Menu</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
          <span>{hasSelection ? 'Selected' : 'All'}</span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-sky-300">{wordCount}w</span>
        </div>
      </div>

      {/* Main Menu Items */}
      {activeSubMenu === 'none' && (
        <div className="p-1.5 space-y-0.5 text-sm">
          {/* Fix Grammar */}
          <button
            onClick={() => onSelectAction('grammar')}
            className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left hover:bg-slate-800/80 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <CheckCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-xs leading-tight">Fix Grammar & Spelling</div>
                <div className="text-[10px] text-slate-400 leading-tight">Corrects typos & rules</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/40">
              Ctrl+⇧+G
            </span>
          </button>

          {/* Enhance Prompt */}
          <button
            onClick={() => onSelectAction('enhance-prompt')}
            className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left hover:bg-slate-800/80 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-xs leading-tight">Enhance Prompt</div>
                <div className="text-[10px] text-slate-400 leading-tight">Adds role, context, output format</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/40">
              Ctrl+⇧+P
            </span>
          </button>

          {/* Change Tone */}
          <button
            onClick={() => setActiveSubMenu('tone')}
            className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left hover:bg-slate-800/80 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Smile className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-xs leading-tight">Change Tone</div>
                <div className="text-[10px] text-slate-400 leading-tight">Professional, Casual, Concise...</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          </button>

          {/* Summarize */}
          <button
            onClick={() => onSelectAction('summarize')}
            className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-slate-800/80 hover:text-white transition-colors group"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium text-xs leading-tight">Summarize Key Points</div>
              <div className="text-[10px] text-slate-400 leading-tight">Bullet points & executive summary</div>
            </div>
          </button>

          {/* Expand */}
          <button
            onClick={() => onSelectAction('expand')}
            className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-slate-800/80 hover:text-white transition-colors group"
          >
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium text-xs leading-tight">Expand & Elaborate</div>
              <div className="text-[10px] text-slate-400 leading-tight">Adds examples & thoroughness</div>
            </div>
          </button>

          {/* Translate */}
          <button
            onClick={() => setActiveSubMenu('translate')}
            className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left hover:bg-slate-800/80 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-xs leading-tight">Translate</div>
                <div className="text-[10px] text-slate-400 leading-tight">Spanish, French, German...</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          </button>

          {/* Custom Instruction */}
          <button
            onClick={() => setActiveSubMenu('custom')}
            className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-slate-800/80 hover:text-white transition-colors group"
          >
            <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 transition-colors">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium text-xs leading-tight">Custom AI Command...</div>
              <div className="text-[10px] text-slate-400 leading-tight">Type any freeform instruction</div>
            </div>
          </button>
        </div>
      )}

      {/* Tone Sub-Menu */}
      {activeSubMenu === 'tone' && (
        <div className="p-1.5 space-y-1 text-sm">
          <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
            <span className="text-xs font-semibold text-slate-300">Choose Tone</span>
            <button
              onClick={() => setActiveSubMenu('none')}
              className="text-[11px] text-sky-400 hover:underline"
            >
              Back
            </button>
          </div>
          {([
            { tone: 'accessible', label: 'Plain English (Accessible)', desc: 'Clear, simple language' },
            { tone: 'professional', label: 'Professional', desc: 'Corporate & formal' },
            { tone: 'casual', label: 'Casual', desc: 'Friendly & conversational' },
            { tone: 'concise', label: 'Concise', desc: 'Short & direct' },
            { tone: 'academic', label: 'Academic', desc: 'Scholarly & objective' },
            { tone: 'persuasive', label: 'Persuasive', desc: 'Compelling & action-driven' },
          ] as { tone: ToneType; label: string; desc: string }[]).map(({ tone, label, desc }) => (
            <button
              key={tone}
              onClick={() => onSelectAction('tone', { tone })}
              className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-medium flex items-center justify-between"
            >
              <span>{label}</span>
              <span className="text-[10px] text-slate-500">{desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Translate Sub-Menu */}
      {activeSubMenu === 'translate' && (
        <div className="p-1.5 space-y-1 text-sm max-h-64 overflow-y-auto">
          <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
            <span className="text-xs font-semibold text-slate-300">Translate to</span>
            <button
              onClick={() => setActiveSubMenu('none')}
              className="text-[11px] text-sky-400 hover:underline"
            >
              Back
            </button>
          </div>
          {['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese', 'Hindi', 'Arabic'].map((lang) => (
            <button
              key={lang}
              onClick={() => onSelectAction('translate', { targetLanguage: lang })}
              className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-slate-800/80 hover:text-white transition-colors text-xs font-medium"
            >
              {lang}
            </button>
          ))}
        </div>
      )}

      {/* Custom AI Command Input */}
      {activeSubMenu === 'custom' && (
        <div className="p-2 space-y-2 text-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-semibold text-slate-300">Custom Instruction</span>
            <button
              onClick={() => setActiveSubMenu('none')}
              className="text-[11px] text-sky-400 hover:underline"
            >
              Back
            </button>
          </div>
          <form onSubmit={handleCustomSubmit} className="space-y-2">
            <textarea
              autoFocus
              value={customPromptInput}
              onChange={(e) => setCustomPromptInput(e.target.value)}
              placeholder="e.g. 'Rewrite as a friendly tweet' or 'Fix grammar and format in bullet points'"
              className="w-full h-20 bg-slate-950/80 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
            />
            <button
              type="submit"
              disabled={!customPromptInput.trim()}
              className="w-full py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-sky-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Execute Instruction</span>
            </button>
          </form>
        </div>
      )}

      {/* Footer info & Settings link */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="truncate max-w-[120px] capitalize">
            {activePromptProvider}
          </span>
        </div>
        <button
          onClick={onOpenSettings}
          className="hover:text-slate-200 flex items-center gap-1 transition-colors"
          title="Configure AI & Dot"
        >
          <Sliders className="w-3 h-3" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
