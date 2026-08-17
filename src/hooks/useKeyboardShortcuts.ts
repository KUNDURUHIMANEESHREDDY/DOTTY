import { useEffect } from 'react';

export interface ShortcutHandlers {
  onTriggerMenu?: () => void;
  onFixGrammar?: () => void;
  onEnhancePrompt?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      const key = e.key.toLowerCase();

      // Escape key to close popups
      if (key === 'escape') {
        handlers.onEscape?.();
        return;
      }

      // Ctrl+Shift+Space (Open Menu)
      if (isCtrlOrCmd && isShift && e.code === 'Space') {
        e.preventDefault();
        handlers.onTriggerMenu?.();
        return;
      }

      // Fix Grammar: Ctrl+Shift+G or Ctrl+Alt+G
      if (isCtrlOrCmd && (isShift || isAlt) && key === 'g') {
        e.preventDefault();
        handlers.onFixGrammar?.();
        return;
      }

      // Enhance Prompt: Ctrl+Shift+P or Ctrl+Alt+E
      if (isCtrlOrCmd && ((isShift && key === 'p') || (isAlt && key === 'e'))) {
        e.preventDefault();
        handlers.onEnhancePrompt?.();
        return;
      }

      // Quick Save: Ctrl+S
      if (isCtrlOrCmd && key === 's' && !isShift && !isAlt) {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }

      // Undo / Redo handled in editor or globally
      if (isCtrlOrCmd && key === 'z' && !isShift && !isAlt) {
        // Only trigger if not typing in an active input outside editor
        if (handlers.onUndo) {
          // Handled
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
