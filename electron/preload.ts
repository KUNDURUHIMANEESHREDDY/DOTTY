import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Open the floating Enhance Features tab on click
  openEnhanceTab: () => {
    ipcRenderer.send('open-enhance-tab');
  },

  // Close Enhance Features tab
  closeEnhanceTab: () => {
    ipcRenderer.send('close-enhance-tab');
  },

  // Listen for text loaded into the Enhance tab
  onEnhanceData: (callback: (data: { text: string }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('enhance-data', listener);
    return () => {
      ipcRenderer.removeListener('enhance-data', listener);
    };
  },

  // Paste enhanced text into active external window (Ctrl+V)
  pasteToActiveWindow: (text: string) => {
    return ipcRenderer.invoke('paste-to-active-window', text);
  },

  // Open full standalone notepad editor
  openEditorWindow: () => {
    ipcRenderer.send('open-editor-window');
  },
});
