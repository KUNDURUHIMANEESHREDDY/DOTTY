import React, { useState } from 'react';
import { CaretPosition, DotSettings } from '../types';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CaretDotProps {
  position: CaretPosition;
  settings: DotSettings;
  isProcessing: boolean;
  status: 'idle' | 'processing' | 'success' | 'error';
  onClick: (e: React.MouseEvent) => void;
}

export const CaretDot: React.FC<CaretDotProps> = ({
  position,
  settings,
  isProcessing,
  status,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!position.visible && !isProcessing) {
    return null;
  }

  // Calculate coordinates with user offsets
  const left = position.x + (settings.offsetX || 12);
  const top = position.y + (settings.offsetY || 2);

  // Determine glow style
  const glowStyles = {
    none: 'none',
    subtle: `0 0 8px 1px ${settings.color}55`,
    vibrant: `0 0 16px 3px ${settings.color}aa, 0 0 30px 6px ${settings.color}44`,
  }[settings.glowIntensity || 'vibrant'];

  return (
    <div
      data-dotty-interactive="true"
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        transform: `translate3d(0, 0, 0) scale(${isHovered ? 1.25 : 1})`,
        transition: 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease',
        zIndex: 9990,
      }}
      className="pointer-events-auto cursor-pointer select-none group"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Dotty AI Assistant (Ctrl+Shift+Space)"
    >
      {/* Outer pulsing wave animation */}
      {settings.pulseAnimation && status === 'idle' && !isProcessing && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{
            backgroundColor: settings.color,
            width: `${settings.size}px`,
            height: `${settings.size}px`,
          }}
        />
      )}

      {/* Main interactive dot element */}
      <div
        className="relative flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: `${Math.max(settings.size, 12)}px`,
          height: `${Math.max(settings.size, 12)}px`,
          backgroundColor: status === 'error' ? '#ef4444' : status === 'success' ? '#10b981' : settings.color,
          boxShadow: glowStyles,
        }}
      >
        {isProcessing ? (
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
        ) : status === 'error' ? (
          <AlertCircle className="w-2.5 h-2.5 text-white" />
        ) : isHovered ? (
          <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
        ) : (
          <span className="w-1.5 h-1.5 bg-white rounded-full opacity-90" />
        )}
      </div>

      {/* Hover tooltip badge */}
      {isHovered && !isProcessing && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2 py-1 rounded-md bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-[11px] font-medium text-slate-200 whitespace-nowrap shadow-xl flex items-center gap-1.5 animate-pop-in pointer-events-none"
        >
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span>Dotty</span>
          <kbd className="px-1 py-0.5 text-[9px] bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">
            Ctrl+⇧+Space
          </kbd>
        </div>
      )}
    </div>
  );
};
