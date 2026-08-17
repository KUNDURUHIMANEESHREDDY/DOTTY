import { useState, useCallback, useRef } from 'react';

export interface HistoryState {
  content: string;
  selectionStart?: number;
  selectionEnd?: number;
  timestamp: number;
}

export function useUndoRedo(initialContent: string = '', maxHistory: number = 100) {
  const [history, setHistory] = useState<HistoryState[]>([
    { content: initialContent, timestamp: Date.now() },
  ]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Ref to debounce rapid typing into single history checkpoints
  const lastPushTimeRef = useRef<number>(Date.now());

  const currentContent = history[currentIndex]?.content ?? initialContent;

  const pushState = useCallback((newContent: string, selection?: { start: number; end: number }, forceCheckpoint = false) => {
    setHistory((prevHistory) => {
      const current = prevHistory[currentIndex];
      if (current && current.content === newContent) {
        return prevHistory;
      }

      const now = Date.now();
      const timeDiff = now - lastPushTimeRef.current;
      lastPushTimeRef.current = now;

      const newEntry: HistoryState = {
        content: newContent,
        selectionStart: selection?.start,
        selectionEnd: selection?.end,
        timestamp: now,
      };

      // Truncate future history if we're in the middle of the stack
      const sliced = prevHistory.slice(0, currentIndex + 1);

      // If user typed within 1 second and didn't force a checkpoint (e.g. diff apply),
      // update the current top entry instead of creating hundreds of single-character steps
      if (!forceCheckpoint && timeDiff < 1000 && sliced.length > 1) {
        const updated = [...sliced];
        updated[updated.length - 1] = newEntry;
        return updated;
      }

      // Add new entry and maintain max history limit
      const nextHistory = [...sliced, newEntry];
      if (nextHistory.length > maxHistory) {
        return nextHistory.slice(nextHistory.length - maxHistory);
      }
      return nextHistory;
    });

    setCurrentIndex((prev) => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  const undo = useCallback((): string | null => {
    if (currentIndex > 0) {
      const nextIndex = currentIndex - 1;
      setCurrentIndex(nextIndex);
      return history[nextIndex].content;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback((): string | null => {
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      return history[nextIndex].content;
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const resetHistory = useCallback((newContent: string) => {
    setHistory([{ content: newContent, timestamp: Date.now() }]);
    setCurrentIndex(0);
  }, []);

  return {
    content: currentContent,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
