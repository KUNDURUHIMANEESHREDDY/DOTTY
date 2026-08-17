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
let mainWindow: BrowserWindow | null = null;
let trackerProcess: ChildProcess | null = null;
let lastCaretPos = { x: 400, y: 300 };

// 1. FLOATING KEYBOARD CARET DOT (48x48)
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
    show: false, // Initially hidden until typing is detected
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

// 2. WHOLE MAIN APPLICATION WINDOW (1100x750 Standard Desktop Window with Tabs & AI)
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 850,
    minHeight: 550,
    backgroundColor: '#020617',
    title: 'Dotty — AI Typing Assistant & Editor',
    frame: true, // Standard whole desktop window with title bar, minimize, maximize, close!
    show: false, // Pre-created and ready to show instantly on click
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 3. REAL-TIME NATIVE KEYBOARD CARET TRACKER
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

// Open Whole Main Window
function openWholeWindow() {
  const selectedText = clipboard.readText() || '';

  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop();

    if (selectedText && selectedText.trim().length > 0) {
      mainWindow.webContents.send('load-text', { text: selectedText });
    }
  }
}

// IPC Handlers
ipcMain.on('open-whole-window', () => {
  openWholeWindow();
});

ipcMain.handle('paste-to-active-window', async (_event, text: string) => {
  clipboard.writeText(text);
  return true;
});

app.whenReady().then(() => {
  createDotWindow();
  createMainWindow();
  startCaretTracker();

  // Global Hotkey (Alt+Space or Ctrl+Shift+Space)
  try {
    globalShortcut.register('Alt+Space', () => {
      openWholeWindow();
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      openWholeWindow();
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
