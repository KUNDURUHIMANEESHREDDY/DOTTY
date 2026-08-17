import { 
  app, 
  BrowserWindow, 
  screen, 
  globalShortcut, 
  ipcMain, 
  clipboard,
  Tray,
  Menu
} from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.platform === 'win32') {
  app.setAppUserModelId('com.dotty.app');
}

let overlayWindow: BrowserWindow | null = null;
let editorWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let lastCursorPos = { x: 0, y: 0 };

// Helper to simulate Ctrl+C and Ctrl+V on Windows
function simulateKeyPress(keys: string): Promise<void> {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const vbsFile = path.join(app.getPath('temp'), '__dotty_sendkeys.vbs');
      const vbsContent = `Set w = CreateObject("WScript.Shell")\nw.SendKeys "${keys}"\n`;
      fs.writeFile(vbsFile, vbsContent, () => {
        exec(`cscript //nologo "${vbsFile}"`, () => {
          resolve();
        });
      });
    } else {
      resolve();
    }
  });
}

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  overlayWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: width,
    height: height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Start with click-through enabled
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    overlayWindow.loadURL(devServerUrl);
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Track global cursor movement and send to renderer
  const cursorInterval = setInterval(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      const point = screen.getCursorScreenPoint();
      if (point.x !== lastCursorPos.x || point.y !== lastCursorPos.y) {
        lastCursorPos = point;
        overlayWindow.webContents.send('global-cursor-move', point);
      }
    }
  }, 25); // ~40 FPS cursor tracking

  overlayWindow.on('closed', () => {
    clearInterval(cursorInterval);
    overlayWindow = null;
  });
}

function createEditorWindow() {
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.show();
    editorWindow.focus();
    return;
  }

  editorWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 550,
    backgroundColor: '#020617',
    title: 'Dotty Notepad — Standalone Scratchpad',
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    editorWindow.loadURL(`${devServerUrl}#editor`);
  } else {
    editorWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'editor' });
  }

  editorWindow.on('closed', () => {
    editorWindow = null;
  });
}

// IPC Handlers
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

// Capture selected text from whatever app the user is actively in (Chrome, Word, VSCode, etc.)
ipcMain.handle('capture-active-selection', async () => {
  const previousClipboard = clipboard.readText();
  // Clear clipboard temporarily
  clipboard.writeText('');
  
  // Simulate Ctrl+C in the active external window
  await simulateKeyPress('^c');
  await new Promise((r) => setTimeout(r, 100));
  
  const selectedText = clipboard.readText();
  
  // Restore clipboard if nothing was selected
  if (!selectedText) {
    clipboard.writeText(previousClipboard);
  }
  
  return selectedText || '';
});

// Paste modified text back into the active external application
ipcMain.handle('paste-to-active-window', async (_event, text: string) => {
  clipboard.writeText(text);
  await new Promise((r) => setTimeout(r, 50));
  // Simulate Ctrl+V into active external app
  await simulateKeyPress('^v');
  return true;
});

ipcMain.on('open-editor-window', () => {
  createEditorWindow();
});

ipcMain.on('toggle-overlay', () => {
  if (overlayWindow) {
    if (overlayWindow.isVisible()) {
      overlayWindow.hide();
    } else {
      overlayWindow.show();
    }
  }
});

app.whenReady().then(() => {
  createOverlayWindow();

  // Global hotkeys
  try {
    // Alt+Space or Ctrl+Shift+Space to trigger Dotty everywhere
    globalShortcut.register('Alt+Space', () => {
      const point = screen.getCursorScreenPoint();
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('trigger-menu-at-cursor', point);
      }
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      const point = screen.getCursorScreenPoint();
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('trigger-menu-at-cursor', point);
      }
    });
  } catch (err) {
    console.warn('Global shortcut registration failed:', err);
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
