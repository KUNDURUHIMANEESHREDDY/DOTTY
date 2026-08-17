import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Open the whole full application window on dot click
  openWholeWindow: () => {
    ipcRenderer.send('open-whole-window');
  },

  // Listen for text loaded into the whole window
  onLoadText: (callback: (data: { text: string }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('load-text', listener);
    return () => {
      ipcRenderer.removeListener('load-text', listener);
    };
  },

  // Paste text to active external window (Ctrl+V)
  pasteToActiveWindow: (text: string) => {
    return ipcRenderer.invoke('paste-to-active-window', text);
  },
});
