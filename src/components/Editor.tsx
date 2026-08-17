import React, { useRef } from 'react';
import { AppSettings } from '../types';

interface EditorProps {
  content: string;
  settings: AppSettings;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  onChange: (newContent: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const Editor: React.FC<EditorProps> = ({
  content,
  settings,
  editorRef,
  onChange,
  onKeyDown,
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = content.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Sync scroll of line numbers with textarea
  const handleScroll = () => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Support Tab key indentation (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newContent);

      // Restore caret position after insertion
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      });
      return;
    }

    onKeyDown?.(e);
  };

  // Font family class mapper
  const fontFamilyClass = {
    sans: 'font-sans',
    mono: 'font-mono',
    serif: 'font-serif',
  }[settings.editor.fontFamily || 'sans'];

  return (
    <div className="relative flex-1 flex h-full bg-slate-950 overflow-hidden">
      {/* Line Numbers Gutter */}
      {settings.editor.lineNumbers && (
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-12 shrink-0 select-none py-6 text-right pr-3 font-mono text-xs text-slate-700 bg-slate-950/90 border-r border-slate-900 overflow-hidden leading-relaxed"
          style={{ fontSize: `${settings.editor.fontSize - 3}px` }}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="h-[28px] flex items-center justify-end">
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Main Textarea Editor Area */}
      <div className="relative flex-1 h-full overflow-hidden flex flex-col">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDownInternal}
          placeholder="Start typing your thoughts, prompt, or draft here... 

Tip: Notice the subtle glowing Dotty dot following your cursor. Click the dot or press Ctrl+Shift+Space for instant 1-click grammar correction, prompt enhancement, and tone shifts."
          spellCheck={false}
          style={{
            fontSize: `${settings.editor.fontSize}px`,
            lineHeight: '28px',
          }}
          className={`w-full h-full p-6 bg-transparent text-slate-100 placeholder-slate-600 outline-none resize-none overflow-y-auto leading-relaxed ${fontFamilyClass} ${
            settings.editor.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
          }`}
        />
      </div>
    </div>
  );
};
