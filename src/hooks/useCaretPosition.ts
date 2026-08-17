import { useState, useEffect, useCallback, RefObject } from 'react';
import { CaretPosition } from '../types';

/**
 * Calculates pixel coordinates of the caret in a HTMLTextAreaElement or ContentEditable element.
 */
export function useCaretPosition(editorRef: RefObject<HTMLTextAreaElement | HTMLElement | null>) {
  const [caretPosition, setCaretPosition] = useState<CaretPosition>({
    x: 0,
    y: 0,
    height: 24,
    visible: false,
    isSelection: false,
    selectedText: '',
  });

  // Mirror div cache for textarea measurement
  const mirrorDivRef = useCallback(() => {
    let div = document.getElementById('__dotty_textarea_mirror__') as HTMLDivElement;
    if (!div) {
      div = document.createElement('div');
      div.id = '__dotty_textarea_mirror__';
      div.style.position = 'absolute';
      div.style.top = '-99999px';
      div.style.left = '-99999px';
      div.style.visibility = 'hidden';
      div.style.pointerEvents = 'none';
      document.body.appendChild(div);
    }
    return div;
  }, []);

  const updateCaretPosition = useCallback(() => {
    const el = editorRef.current;
    if (!el) {
      setCaretPosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    // 1. Textarea Element Support
    if (el instanceof HTMLTextAreaElement) {
      const { selectionStart, selectionEnd, value } = el;
      const isSelection = selectionStart !== selectionEnd;
      const selectedText = isSelection ? value.substring(selectionStart, selectionEnd) : '';

      const mirror = mirrorDivRef();
      const style = window.getComputedStyle(el);

      // Copy computed styles to mirror
      const propertiesToCopy = [
        'boxSizing',
        'width',
        'height',
        'overflowX',
        'overflowY',
        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'fontStyle',
        'fontVariant',
        'fontWeight',
        'fontStretch',
        'fontSize',
        'fontSizeAdjust',
        'lineHeight',
        'fontFamily',
        'textAlign',
        'textTransform',
        'textIndent',
        'textDecoration',
        'letterSpacing',
        'wordSpacing',
        'tabSize',
      ];

      propertiesToCopy.forEach((prop) => {
        (mirror.style as any)[prop] = (style as any)[prop];
      });

      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.wordWrap = 'break-word';
      mirror.style.width = `${el.clientWidth}px`;

      // Text up to cursor
      const textBeforeCaret = value.substring(0, selectionEnd);
      mirror.textContent = textBeforeCaret;

      // Caret marker
      const marker = document.createElement('span');
      marker.textContent = '|';
      mirror.appendChild(marker);

      const elRect = el.getBoundingClientRect();
      const markerRect = marker.getBoundingClientRect();
      const mirrorRect = mirror.getBoundingClientRect();

      const relativeX = markerRect.left - mirrorRect.left;
      const relativeY = markerRect.top - mirrorRect.top;

      const caretX = elRect.left + relativeX - el.scrollLeft;
      const caretY = elRect.top + relativeY - el.scrollTop;
      const lineHeight = parseFloat(style.lineHeight) || 24;

      // Check if caret is inside visible textarea area
      const isInsideVisibleArea =
        caretX >= elRect.left - 10 &&
        caretX <= elRect.right + 20 &&
        caretY >= elRect.top - 10 &&
        caretY <= elRect.bottom + 10;

      setCaretPosition({
        x: Math.max(elRect.left + 10, Math.min(caretX, elRect.right - 20)),
        y: Math.max(elRect.top, Math.min(caretY, elRect.bottom - 20)),
        height: lineHeight,
        visible: isInsideVisibleArea,
        isSelection,
        selectedText,
        selectionRange: { start: selectionStart, end: selectionEnd },
      });
      return;
    }

    // 2. ContentEditable / Selection Support
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !el.contains(selection.anchorNode)) {
      setCaretPosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const range = selection.getRangeAt(0);
    const isSelection = !selection.isCollapsed;
    const selectedText = isSelection ? selection.toString() : '';

    let rects = range.getClientRects();
    let targetRect: DOMRect | null = rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();

    if (targetRect && (targetRect.width > 0 || targetRect.height > 0 || targetRect.top > 0)) {
      const elRect = el.getBoundingClientRect();
      setCaretPosition({
        x: Math.max(elRect.left + 10, Math.min(targetRect.right, elRect.right - 20)),
        y: Math.max(elRect.top, Math.min(targetRect.top, elRect.bottom - 20)),
        height: targetRect.height || 24,
        visible: true,
        isSelection,
        selectedText,
      });
    }
  }, [editorRef, mirrorDivRef]);

  useEffect(() => {
    let animationFrameId: number;

    const handleEvent = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateCaretPosition);
    };

    document.addEventListener('selectionchange', handleEvent);
    window.addEventListener('resize', handleEvent);

    const el = editorRef.current;
    if (el) {
      el.addEventListener('input', handleEvent);
      el.addEventListener('keyup', handleEvent);
      el.addEventListener('mouseup', handleEvent);
      el.addEventListener('scroll', handleEvent);
      el.addEventListener('focus', handleEvent);
      el.addEventListener('blur', () => {
        setTimeout(() => {
          if (!document.activeElement?.closest('[data-dotty-interactive]')) {
            setCaretPosition((prev) => ({ ...prev, visible: false }));
          }
        }, 300);
      });
    }

    // Initial positioning
    handleEvent();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('selectionchange', handleEvent);
      window.removeEventListener('resize', handleEvent);

      if (el) {
        el.removeEventListener('input', handleEvent);
        el.removeEventListener('keyup', handleEvent);
        el.removeEventListener('mouseup', handleEvent);
        el.removeEventListener('scroll', handleEvent);
        el.removeEventListener('focus', handleEvent);
      }
    };
  }, [editorRef, updateCaretPosition]);

  return { caretPosition, updateCaretPosition };
}
