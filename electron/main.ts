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

let widgetWindow: BrowserWindow | null = null;
let editorWindow: BrowserWindow | null = null;
let trackerProcess: ChildProcess | null = null;
let isMenuOpen = false;
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

// 1. SINGLE EXPANDING WIDGET WINDOW (Dot 48x48 <---> Full Features Tab 360x520)
function createWidgetWindow() {
  widgetWindow = new BrowserWindow({
    width: 48,
    height: 48,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true, // Must be true so setBounds / setSize can dynamically expand to 360x520!
    hasShadow: false,
    focusable: true,
    show: false,     // Initially hidden until typing is detected
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  widgetWindow.setAlwaysOnTop(true, 'screen-saver');
  widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    widgetWindow.loadURL(devServerUrl);
  } else {
    widgetWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });
}

// 2. REAL-TIME NATIVE KEYBOARD CARET TRACKER
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
              // Follow active typing insertion point when in dot mode
              if (!isMenuOpen && widgetWindow && !widgetWindow.isDestroyed()) {
                const display = screen.getDisplayNearestPoint({ x, y });
                const maxX = display.bounds.x + display.bounds.width - 55;
                const maxY = display.bounds.y + display.bounds.height - 55;

                const targetX = Math.min(Math.max(x + 10, display.bounds.x + 5), maxX);
                const targetY = Math.min(Math.max(y + 2, display.bounds.y + 5), maxY);

                widgetWindow.setBounds({
                  x: targetX,
                  y: targetY,
                  width: 48,
                  height: 48,
                });

                if (!widgetWindow.isVisible()) {
                  widgetWindow.showInactive();
                }
              }
            } else if (state === 'none') {
              if (!isMenuOpen && widgetWindow && !widgetWindow.isDestroyed() && widgetWindow.isVisible()) {
                widgetWindow.hide();
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

// 3. STANDALONE NOTEPAD SCRATCHPAD WINDOW
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

// Expand Widget into Full Features Menu Tab (360x520)
async function expandToMenu() {
  if (!widgetWindow || widgetWindow.isDestroyed()) {
    createWidgetWindow();
  }

  isMenuOpen = true;

  // Capture selection from current active window
  let selectedText = '';
  try {
    const previousClipboard = clipboard.readText();
    clipboard.writeText('');
    await simulateKeyPress('^c');
    await new Promise((r) => setTimeout(r, 120));
    selectedText = clipboard.readText();
    if (!selectedText) {
      clipboard.writeText(previousClipboard);
    }
  } catch (err) {
    console.warn('Capture selection error:', err);
  }

  const anchorPoint = (lastCaretPos && lastCaretPos.x > 0) ? lastCaretPos : screen.getCursorScreenPoint();
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

  if (widgetWindow && !widgetWindow.isDestroyed()) {
    // Explicitly set full 360x520 bounds on Windows
    widgetWindow.setBounds({
      x: posX,
      y: posY,
      width: menuWidth,
      height: menuHeight,
    });
    widgetWindow.show();
    widgetWindow.focus();
    widgetWindow.webContents.send('menu-data', {
      selectedText: selectedText || '',
    });
  }
}

// Collapse Widget back to Dot (48x48)
function collapseToDot() {
  isMenuOpen = false;
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    const display = screen.getDisplayNearestPoint(lastCaretPos);
    const maxX = display.bounds.x + display.bounds.width - 55;
    const maxY = display.bounds.y + display.bounds.height - 55;

    const targetX = Math.min(Math.max(lastCaretPos.x + 10, display.bounds.x + 5), maxX);
    const targetY = Math.min(Math.max(lastCaretPos.y + 2, display.bounds.y + 5), maxY);

    widgetWindow.setBounds({
      x: targetX,
      y: targetY,
      width: 48,
      height: 48,
    });
  }
}

// IPC Handlers
ipcMain.on('expand-to-menu', () => {
  expandToMenu();
});

ipcMain.on('collapse-to-dot', () => {
  collapseToDot();
});

ipcMain.on('open-editor-window', () => {
  collapseToDot();
  createEditorWindow();
});

ipcMain.handle('paste-to-active-window', async (_event, text: string) => {
  clipboard.writeText(text);
  collapseToDot();
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
  createWidgetWindow();
  startCaretTracker();

  // Global Hotkey (Alt+Space or Ctrl+Shift+Space)
  try {
    globalShortcut.register('Alt+Space', () => {
      expandToMenu();
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      expandToMenu();
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
