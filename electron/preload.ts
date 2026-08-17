import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Open the full Dotty application window on click
  openDottyApp: () => {
    ipcRenderer.send('open-dotty-app');
  },

  // Open standalone editor
  openEditorWindow: () => {
    ipcRenderer.send('open-dotty-app');
  },

  // Listen for captured text loaded into the full application window
  onLoadCapturedText: (callback: (data: { selectedText: string }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('load-captured-text', listener);
    return () => {
      ipcRenderer.removeListener('load-captured-text', listener);
    };
  },

  // Capture text from active external window (Ctrl+C)
  captureActiveSelection: () => {
    return ipcRenderer.invoke('capture-active-selection');
  },

  // Paste enhanced text into active external window (Ctrl+V)
  pasteToActiveWindow: (text: string) => {
    return ipcRenderer.invoke('paste-to-active-window', text);
  },
});
