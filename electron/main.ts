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
import { exec, spawn, ChildProcess } from 'node:child_process';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.platform === 'win32') {
  app.setAppUserModelId('com.dotty.app');
}

let dotWindow: BrowserWindow | null = null;
let menuWindow: BrowserWindow | null = null;
let editorWindow: BrowserWindow | null = null;
let trackerProcess: ChildProcess | null = null;
let lastCaretPos = { x: 400, y: 300 };

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

// 1. COMPACT 48x48 KEYBOARD CARET DOT WINDOW (Visible ONLY when user is typing / in a text box)
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
    focusable: false, // Don't steal focus from active text box!
    show: false,      // Initially hidden until user focuses an input/types
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

// 2. REAL-TIME NATIVE KEYBOARD CARET TRACKER (NO MOUSE FOLLOWING)
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
              if (dotWindow && !dotWindow.isDestroyed()) {
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
              // User is NOT typing / not in a text box -> Hide the dot!
              if (dotWindow && !dotWindow.isDestroyed() && dotWindow.isVisible()) {
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

// 3. FLOATING ACTION MENU WINDOW (Features tab)
function createMenuWindow() {
  menuWindow = new BrowserWindow({
    width: 360,
    height: 520,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  menuWindow.setAlwaysOnTop(true, 'screen-saver');

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    menuWindow.loadURL(`${devServerUrl}#menu`);
  } else {
    menuWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'menu' });
  }

  // Auto-hide when user clicks outside the menu
  menuWindow.on('blur', () => {
    if (menuWindow && !menuWindow.isDestroyed()) {
      menuWindow.hide();
    }
  });

  menuWindow.on('closed', () => {
    menuWindow = null;
  });
}

// 4. STANDALONE NOTEPAD SCRATCHPAD WINDOW
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

// Open Features Menu Window right next to the active typing caret / cursor
async function showMenuNearCaret() {
  if (!menuWindow || menuWindow.isDestroyed()) {
    createMenuWindow();
  }

  // Capture selection from current active window
  const previousClipboard = clipboard.readText();
  clipboard.writeText('');
  await simulateKeyPress('^c');
  await new Promise((r) => setTimeout(r, 100));
  const selectedText = clipboard.readText();
  if (!selectedText) {
    clipboard.writeText(previousClipboard);
  }

  const anchorPoint = lastCaretPos.x > 0 ? lastCaretPos : screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(anchorPoint);

  const menuWidth = 360;
  const menuHeight = 520;
  let posX = anchorPoint.x + 15;
  let posY = anchorPoint.y - 20;

  if (posX + menuWidth > display.bounds.x + display.bounds.width) {
    posX = anchorPoint.x - menuWidth - 15;
  }
  if (posY + menuHeight > display.bounds.y + display.bounds.height) {
    posY = display.bounds.y + display.bounds.height - menuHeight - 10;
  }
  if (posY < display.bounds.y + 10) {
    posY = display.bounds.y + 10;
  }

  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.setPosition(posX, posY);
    menuWindow.show();
    menuWindow.focus();
    menuWindow.webContents.send('menu-trigger', {
      selectedText: selectedText || '',
      x: posX,
      y: posY,
    });
  }
}

// IPC Handlers
ipcMain.on('open-menu-window', () => {
  showMenuNearCaret();
});

ipcMain.on('close-menu-window', () => {
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.hide();
  }
});

ipcMain.on('open-editor-window', () => {
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.hide();
  }
  createEditorWindow();
});

ipcMain.handle('paste-to-active-window', async (_event, text: string) => {
  clipboard.writeText(text);
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.hide();
  }
  await new Promise((r) => setTimeout(r, 60));
  await simulateKeyPress('^v');
  return true;
});

ipcMain.handle('capture-active-selection', async () => {
  const previousClipboard = clipboard.readText();
  clipboard.writeText('');
  await simulateKeyPress('^c');
  await new Promise((r) => setTimeout(r, 100));
  const selectedText = clipboard.readText();
  if (!selectedText) {
    clipboard.writeText(previousClipboard);
  }
  return selectedText || '';
});

app.whenReady().then(() => {
  createDotWindow();
  createMenuWindow();
  startCaretTracker();

  // Global Hotkey (Alt+Space or Ctrl+Shift+Space)
  try {
    globalShortcut.register('Alt+Space', () => {
      showMenuNearCaret();
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      showMenuNearCaret();
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
