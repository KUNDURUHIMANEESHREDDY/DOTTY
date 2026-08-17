import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  
  // Update dot coordinates in main process for distance collision detection
  updateDotPos: (pos: { x: number; y: number }) => {
    ipcRenderer.send('update-dot-pos', pos);
  },

  // Notify main process when menu / modal is open so it stays interactive
  setMenuOpen: (isOpen: boolean) => {
    ipcRenderer.send('set-menu-open', isOpen);
  },

  // Mouse events for transparent click-through overlay
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },

  // Global screen cursor tracking
  onGlobalCursorMove: (callback: (point: { x: number; y: number }) => void) => {
    const listener = (_event: any, point: { x: number; y: number }) => callback(point);
    ipcRenderer.on('global-cursor-move', listener);
    return () => {
      ipcRenderer.removeListener('global-cursor-move', listener);
    };
  },

  // Global hotkey menu trigger
  onTriggerMenu: (callback: (point: { x: number; y: number }) => void) => {
    const listener = (_event: any, point: { x: number; y: number }) => callback(point);
    ipcRenderer.on('trigger-menu-at-cursor', listener);
    return () => {
      ipcRenderer.removeListener('trigger-menu-at-cursor', listener);
    };
  },

  // Capture text from active external window (Ctrl+C simulation)
  captureActiveSelection: () => {
    return ipcRenderer.invoke('capture-active-selection');
  },

  // Paste replacement text into active external window (Ctrl+V simulation)
  pasteToActiveWindow: (text: string) => {
    return ipcRenderer.invoke('paste-to-active-window', text);
  },

  // Open standalone notepad / editor window
  openEditorWindow: () => {
    ipcRenderer.send('open-editor-window');
  },
  
  // Toggle overlay visibility
  toggleOverlay: () => {
    ipcRenderer.send('toggle-overlay');
  },
});
