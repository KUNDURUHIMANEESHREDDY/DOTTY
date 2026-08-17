import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Expand widget window to 380x540
  expandWindow: () => {
    ipcRenderer.send('expand-window');
  },

  // Collapse widget window back to 48x48
  collapseWindow: () => {
    ipcRenderer.send('collapse-window');
  },

  // Read clipboard text
  getClipboardText: () => {
    return ipcRenderer.invoke('get-clipboard-text');
  },

  // Paste text to active window
  pasteToActiveWindow: (text: string) => {
    return ipcRenderer.invoke('paste-to-active-window', text);
  },

  // Open standalone notepad
  openEditorWindow: () => {
    ipcRenderer.send('open-editor-window');
  },
});
