import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Expand widget to show ActionMenu (340x480)
  openActionMenu: () => {
    ipcRenderer.send('open-action-menu');
  },

  // Collapse widget back to CaretDot (48x48)
  closeActionMenu: () => {
    ipcRenderer.send('close-action-menu');
  },

  // Listen for captured text when ActionMenu opens
  onMenuTrigger: (callback: (data: { selectedText: string }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('menu-trigger', listener);
    return () => {
      ipcRenderer.removeListener('menu-trigger', listener);
    };
  },

  // Paste enhanced text to active window
  pasteToActiveWindow: (text: string) => {
    return ipcRenderer.invoke('paste-to-active-window', text);
  },

  // Open standalone notepad
  openEditorWindow: () => {
    ipcRenderer.send('open-editor-window');
  },
});
