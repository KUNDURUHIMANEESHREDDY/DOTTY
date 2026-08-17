import React, { useState } from 'react';
import { diffWords, diffLines, Change } from 'diff';
import confetti from 'canvas-confetti';
import { 
  Check, 
  X, 
  Copy, 
  Columns, 
  AlignLeft, 
  Sparkles, 
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';
import { DiffResult } from '../types';

interface DiffModalProps {
  isOpen: boolean;
  diffResult: DiffResult | null;
  hasSelection: boolean;
  onAccept: (enhancedText: string, applyToSelection: boolean) => void;
  onReject: () => void;
  onCopy: (text: string) => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  diffResult,
  hasSelection,
  onAccept,
  onReject,
  onCopy,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'inline'>('split');
  const [applyToSelection, setApplyToSelection] = useState<boolean>(hasSelection);

  if (!isOpen || !diffResult) return null;

  const original = diffResult.originalText;
  const enhanced = diffResult.enhancedText;

  // Compute word-level diffs
  const wordDiffs: Change[] = diffWords(original, enhanced);
  const lineDiffs: Change[] = diffLines(original, enhanced);

  const additions = wordDiffs.filter((d) => d.added).length;
  const deletions = wordDiffs.filter((d) => d.removed).length;

  const handleAccept = () => {
    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#38bdf8', '#818cf8', '#34d399', '#f472b6'],
      });
    } catch {
      // Ignore if canvas isn't available
    }

    onAccept(enhanced, applyToSelection);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-pop-in"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/70 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>{diffResult.action}</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 border border-slate-600/50 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {diffResult.provider}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Review differences before updating your document
              </p>
            </div>
          </div>

          {/* View toggle & Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-emerald-400 font-medium">+{additions} words</span>
              <span>•</span>
              <span className="text-rose-400 font-medium">-{deletions} words</span>
            </div>

            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === 'split' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                onClick={() => setViewMode('inline')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === 'inline' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Inline Diff</span>
              </button>
            </div>
          </div>
        </div>

        {/* Explanation Banner */}
        {diffResult.explanation && (
          <div className="px-6 py-2.5 bg-sky-950/40 border-b border-sky-900/40 flex items-center gap-2 text-xs text-sky-200">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{diffResult.explanation}</span>
          </div>
        )}

        {/* Diff Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[260px]">
              {/* Original column */}
              <div className="flex flex-col rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Original
                </div>
                <div className="flex-1 text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-y-auto leading-relaxed max-h-[360px] pr-2">
                  {wordDiffs.map((part, index) => {
                    if (part.added) return null;
                    if (part.removed) {
                      return (
                        <span key={index} className="bg-rose-500/25 text-rose-300 line-through rounded px-1 py-0.5">
                          {part.value}
                        </span>
                      );
                    }
                    return <span key={index}>{part.value}</span>;
                  })}
                </div>
              </div>

              {/* Enhanced column */}
              <div className="flex flex-col rounded-xl bg-slate-950/60 border border-sky-900/40 p-4">
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Enhanced / Corrected
                </div>
                <div className="flex-1 text-sm text-slate-100 font-mono whitespace-pre-wrap overflow-y-auto leading-relaxed max-h-[360px] pr-2">
                  {wordDiffs.map((part, index) => {
                    if (part.removed) return null;
                    if (part.added) {
                      return (
                        <span key={index} className="bg-emerald-500/25 text-emerald-300 font-semibold rounded px-1 py-0.5">
                          {part.value}
                        </span>
                      );
                    }
                    return <span key={index}>{part.value}</span>;
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Inline Diff View */
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 max-h-[400px] overflow-y-auto">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Combined Inline Diff
              </div>
              <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {wordDiffs.map((part, index) => {
                  if (part.added) {
                    return (
                      <span key={index} className="bg-emerald-500/25 text-emerald-300 font-semibold rounded px-1 py-0.5">
                        {part.value}
                      </span>
                    );
                  }
                  if (part.removed) {
                    return (
                      <span key={index} className="bg-rose-500/25 text-rose-300 line-through rounded px-1 py-0.5">
                        {part.value}
                      </span>
                    );
                  }
                  return <span key={index} className="text-slate-300">{part.value}</span>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
          {/* Target selection toggle */}
          {hasSelection ? (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToSelection}
                  onChange={(e) => setApplyToSelection(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-800"
                />
                <span>Apply to selected text only</span>
              </label>
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Applies to whole document
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onCopy(enhanced)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Copy enhanced text to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>

            <button
              onClick={onReject}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>

            <button
              onClick={handleAccept}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Accept & Replace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
