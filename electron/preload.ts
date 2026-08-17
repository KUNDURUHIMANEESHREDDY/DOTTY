import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Window routing & state
  onMenuTrigger: (callback: (data: { selectedText: string; x: number; y: number }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('menu-trigger', listener);
    return () => {
      ipcRenderer.removeListener('menu-trigger', listener);
    };
  },

  // Notify main process to show menu window next to dot
  openMenuWindow: () => {
    ipcRenderer.send('open-menu-window');
  },

  // Close menu window
  closeMenuWindow: () => {
    ipcRenderer.send('close-menu-window');
  },

  // Open standalone notepad editor window
  openEditorWindow: () => {
    ipcRenderer.send('open-editor-window');
  },

  // Capture highlighted text from external active window (Ctrl+C)
  captureActiveSelection: () => {
    return ipcRenderer.invoke('capture-active-selection');
  },

  // Paste enhanced text into active external window (Ctrl+V)
  pasteToActiveWindow: (text: string) => {
    return ipcRenderer.invoke('paste-to-active-window', text);
  },

  // Resize window dynamically
  resizeMenuWindow: (width: number, height: number) => {
    ipcRenderer.send('resize-menu-window', { width, height });
  },
});
