import { 
  app, 
  BrowserWindow, 
  screen, 
  globalShortcut, 
  ipcMain, 
  clipboard 
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
let lastCursorPos = { x: 0, y: 0 };
let currentDotPos = { x: 200, y: 200 };
let isMenuOrModalOpen = false;
let isCurrentIgnoreState = true;

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
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  isCurrentIgnoreState = true;

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    overlayWindow.loadURL(devServerUrl);
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Active Screen Tracking & Dynamic Interactivity Loop
  const trackingInterval = setInterval(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      const mouse = screen.getCursorScreenPoint();

      // Broadcast mouse move if changed
      if (mouse.x !== lastCursorPos.x || mouse.y !== lastCursorPos.y) {
        lastCursorPos = mouse;
        overlayWindow.webContents.send('global-cursor-move', mouse);
      }

      // Check if mouse is hovering over the floating dot or if menu/modal is open
      if (isMenuOrModalOpen) {
        if (isCurrentIgnoreState) {
          overlayWindow.setIgnoreMouseEvents(false);
          isCurrentIgnoreState = false;
        }
      } else {
        const dx = mouse.x - currentDotPos.x;
        const dy = mouse.y - currentDotPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Within 40px radius of dot -> Make interactive for clicks/hover!
        if (distance <= 40) {
          if (isCurrentIgnoreState) {
            overlayWindow.setIgnoreMouseEvents(false);
            isCurrentIgnoreState = false;
          }
        } else {
          // Far from dot -> Pass clicks through to underlying applications
          if (!isCurrentIgnoreState) {
            overlayWindow.setIgnoreMouseEvents(true, { forward: true });
            isCurrentIgnoreState = true;
          }
        }
      }
    }
  }, 20); // 50 Hz responsive collision polling

  overlayWindow.on('closed', () => {
    clearInterval(trackingInterval);
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
    minWidth: 850,
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
ipcMain.on('update-dot-pos', (_event, pos: { x: number; y: number }) => {
  currentDotPos = pos;
});

ipcMain.on('set-menu-open', (_event, isOpen: boolean) => {
  isMenuOrModalOpen = isOpen;
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (isOpen) {
      overlayWindow.setIgnoreMouseEvents(false);
      isCurrentIgnoreState = false;
    } else {
      overlayWindow.setIgnoreMouseEvents(true, { forward: true });
      isCurrentIgnoreState = true;
    }
  }
});

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.setIgnoreMouseEvents(ignore, { forward: true });
    isCurrentIgnoreState = ignore;
  }
});

// Capture selected text from whatever app the user is actively in (Chrome, Word, VSCode, etc.)
ipcMain.handle('capture-active-selection', async () => {
  const previousClipboard = clipboard.readText();
  clipboard.writeText('');
  
  // Simulate Ctrl+C in active external window
  await simulateKeyPress('^c');
  await new Promise((r) => setTimeout(r, 120));
  
  const selectedText = clipboard.readText();
  
  if (!selectedText) {
    clipboard.writeText(previousClipboard);
  }
  
  return selectedText || '';
});

// Paste modified text back into the active external application
ipcMain.handle('paste-to-active-window', async (_event, text: string) => {
  clipboard.writeText(text);
  await new Promise((r) => setTimeout(r, 60));
  // Simulate Ctrl+V into active external app
  await simulateKeyPress('^v');
  return true;
});

ipcMain.on('open-editor-window', () => {
  createEditorWindow();
});

app.whenReady().then(() => {
  createOverlayWindow();

  // Global hotkeys
  try {
    globalShortcut.register('Alt+Space', () => {
      const point = screen.getCursorScreenPoint();
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        isMenuOrModalOpen = true;
        overlayWindow.setIgnoreMouseEvents(false);
        isCurrentIgnoreState = false;
        overlayWindow.webContents.send('trigger-menu-at-cursor', point);
      }
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      const point = screen.getCursorScreenPoint();
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        isMenuOrModalOpen = true;
        overlayWindow.setIgnoreMouseEvents(false);
        isCurrentIgnoreState = false;
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
