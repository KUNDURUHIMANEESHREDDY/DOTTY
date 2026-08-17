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
import { spawn, ChildProcess } from 'node:child_process';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.platform === 'win32') {
  app.setAppUserModelId('com.dotty.app');
}

let dotWindow: BrowserWindow | null = null;
let enhanceWindow: BrowserWindow | null = null;
let editorWindow: BrowserWindow | null = null;
let trackerProcess: ChildProcess | null = null;
let isEnhanceOpen = false;
let lastCaretPos = { x: 400, y: 300 };

// 1. COMPACT 48x48 FLOATING KEYBOARD CARET DOT
function createDotWindow() {
  dotWindow = new BrowserWindow({
    width: 48,
    height: 48,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  dotWindow.setAlwaysOnTop(true, 'screen-saver');
  dotWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    dotWindow.loadURL(`${devServerUrl}#dot`);
  } else {
    dotWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'dot' });
  }

  dotWindow.on('closed', () => {
    dotWindow = null;
  });
}

// 2. ENHANCE FEATURES TAB WINDOW (380x540 Pre-created for 0ms instant display)
function createEnhanceWindow() {
  enhanceWindow = new BrowserWindow({
    width: 380,
    height: 540,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: true,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  enhanceWindow.setAlwaysOnTop(true, 'screen-saver');
  enhanceWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    enhanceWindow.loadURL(`${devServerUrl}#enhance`);
  } else {
    enhanceWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'enhance' });
  }

  enhanceWindow.on('closed', () => {
    enhanceWindow = null;
  });
}

// 3. STANDALONE FULL NOTEPAD SCRATCHPAD WINDOW
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

// 4. REAL-TIME NATIVE KEYBOARD CARET TRACKER
function startCaretTracker() {
  const isDev = !app.isPackaged;
  const trackerExecutable = isDev
    ? path.join(__dirname, '../resources/bin/caret-tracker.exe')
    : path.join(process.resourcesPath, 'bin', 'caret-tracker.exe');

  if (fs.existsSync(trackerExecutable)) {
    try {
      trackerProcess = spawn(trackerExecutable, [], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'ignore'],
      });

      trackerProcess.stdout?.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(',');
          if (parts.length >= 3) {
            const x = parseInt(parts[0], 10);
            const y = parseInt(parts[1], 10);
            const state = parts[2].trim();

            if (state === 'caret' && !isNaN(x) && !isNaN(y)) {
              lastCaretPos = { x, y };
              if (!isEnhanceOpen && dotWindow && !dotWindow.isDestroyed()) {
                const display = screen.getDisplayNearestPoint({ x, y });
                const maxX = display.bounds.x + display.bounds.width - 55;
                const maxY = display.bounds.y + display.bounds.height - 55;

                const targetX = Math.min(Math.max(x + 10, display.bounds.x + 5), maxX);
                const targetY = Math.min(Math.max(y + 2, display.bounds.y + 5), maxY);

                dotWindow.setPosition(targetX, targetY);
                if (!dotWindow.isVisible()) {
                  dotWindow.showInactive();
                }
              }
            } else if (state === 'none') {
              if (!isEnhanceOpen && dotWindow && !dotWindow.isDestroyed() && dotWindow.isVisible()) {
                dotWindow.hide();
              }
            }
          }
        }
      });

      trackerProcess.on('exit', () => {
        trackerProcess = null;
      });
    } catch (err) {
      console.warn('Could not launch caret tracker:', err);
    }
  }
}

// Open Enhance Tab INSTANTLY (0ms latency, synchronous show)
function openEnhanceTab() {
  if (!enhanceWindow || enhanceWindow.isDestroyed()) {
    createEnhanceWindow();
  }

  isEnhanceOpen = true;

  if (dotWindow && !dotWindow.isDestroyed()) {
    dotWindow.hide();
  }

  const selectedText = clipboard.readText() || '';

  const anchorPoint = (lastCaretPos && lastCaretPos.x > 0) ? lastCaretPos : screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(anchorPoint);

  const menuWidth = 380;
  const menuHeight = 540;
  let posX = anchorPoint.x + 15;
  let posY = anchorPoint.y - 30;

  if (posX + menuWidth > display.bounds.x + display.bounds.width) {
    posX = anchorPoint.x - menuWidth - 15;
  }
  if (posY + menuHeight > display.bounds.y + display.bounds.height) {
    posY = display.bounds.y + display.bounds.height - menuHeight - 10;
  }
  if (posY < display.bounds.y + 10) {
    posY = display.bounds.y + 10;
  }

  if (enhanceWindow && !enhanceWindow.isDestroyed()) {
    enhanceWindow.setPosition(posX, posY);
    enhanceWindow.setAlwaysOnTop(true, 'screen-saver');
    enhanceWindow.show();
    enhanceWindow.focus();
    enhanceWindow.moveTop();
    enhanceWindow.webContents.send('enhance-data', {
      text: selectedText,
    });
  }
}

// Close Enhance Tab
function closeEnhanceTab() {
  isEnhanceOpen = false;
  if (enhanceWindow && !enhanceWindow.isDestroyed()) {
    enhanceWindow.hide();
  }
}

// IPC Handlers
ipcMain.on('open-enhance-tab', () => {
  openEnhanceTab();
});

ipcMain.on('close-enhance-tab', () => {
  closeEnhanceTab();
});

ipcMain.on('open-editor-window', () => {
  closeEnhanceTab();
  createEditorWindow();
});

ipcMain.handle('paste-to-active-window', async (_event, text: string) => {
  clipboard.writeText(text);
  closeEnhanceTab();
  return true;
});

app.whenReady().then(() => {
  createDotWindow();
  createEnhanceWindow();
  startCaretTracker();

  // Global Hotkey (Alt+Space or Ctrl+Shift+Space)
  try {
    globalShortcut.register('Alt+Space', () => {
      openEnhanceTab();
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      openEnhanceTab();
    });
  } catch (err) {
    console.warn('Global shortcut registration failed:', err);
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (trackerProcess) {
    trackerProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
