import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Expand widget from dot (48x48) to full features menu (360x520)
  expandToMenu: () => {
    ipcRenderer.send('expand-to-menu');
  },

  // Collapse widget from features menu back to dot (48x48)
  collapseToDot: () => {
    ipcRenderer.send('collapse-to-dot');
  },

  // Listen for menu data when expanded
  onMenuData: (callback: (data: { selectedText: string }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('menu-data', listener);
    return () => {
      ipcRenderer.removeListener('menu-data', listener);
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

  // Open standalone full notepad editor window
  openEditorWindow: () => {
    ipcRenderer.send('open-editor-window');
  },
});
