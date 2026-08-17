import React from 'react';
import { Sparkles, FileText, CheckCircle2, Clock } from 'lucide-react';
import { AIProvider } from '../types';

interface StatsBarProps {
  content: string;
  activeGrammarProvider: AIProvider;
  activePromptProvider: AIProvider;
  isAutoSaved: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  content,
  activeGrammarProvider,
  activePromptProvider,
  isAutoSaved,
}) => {
  const words = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = content.length;
  const lines = content ? content.split('\n').length : 1;
  const readingTimeMin = Math.ceil(words / 200);

  return (
    <footer className="h-9 px-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 select-none">
      {/* Left: Document Metrics */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>
            <strong className="font-mono text-slate-200">{words}</strong> words
          </span>
        </div>
        <span className="text-slate-700">|</span>
        <div>
          <strong className="font-mono text-slate-200">{chars}</strong> chars
        </div>
        <span className="text-slate-700">|</span>
        <div>
          <strong className="font-mono text-slate-200">{lines}</strong> lines
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{readingTimeMin} min read</span>
        </div>
      </div>

      {/* Right: Active Providers & Save Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span className="text-slate-500">AI:</span>
          <span className="font-medium text-slate-300 capitalize">{activePromptProvider}</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-[10px]">{isAutoSaved ? 'Saved locally' : 'Saving...'}</span>
        </div>
      </div>
    </footer>
  );
};
