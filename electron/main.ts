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

let dotWindow: BrowserWindow | null = null;
let menuWindow: BrowserWindow | null = null;
let editorWindow: BrowserWindow | null = null;
let lastMousePos = { x: 0, y: 0 };
let isTracking = true;

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

// 1. COMPACT 52x52 FLOATING DOT WINDOW (Zero screen blocking!)
function createDotWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  dotWindow = new BrowserWindow({
    width: 52,
    height: 52,
    x: width - 80,
    y: height - 120,
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

  dotWindow.setAlwaysOnTop(true, 'screen-saver');
  dotWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    dotWindow.loadURL(`${devServerUrl}#dot`);
  } else {
    dotWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'dot' });
  }

  // Smoothly follow mouse cursor when typing or moving across desktop
  let followTimer: NodeJS.Timeout | null = null;
  followTimer = setInterval(() => {
    if (dotWindow && !dotWindow.isDestroyed() && isTracking) {
      const mouse = screen.getCursorScreenPoint();
      const dx = Math.abs(mouse.x - lastMousePos.x);
      const dy = Math.abs(mouse.y - lastMousePos.y);

      // If user moved mouse significantly, move the floating dot near the cursor
      if (dx > 30 || dy > 30) {
        lastMousePos = mouse;
        const display = screen.getDisplayNearestPoint(mouse);
        const maxX = display.bounds.x + display.bounds.width - 60;
        const maxY = display.bounds.y + display.bounds.height - 60;

        const targetX = Math.min(Math.max(mouse.x + 14, display.bounds.x + 10), maxX);
        const targetY = Math.min(Math.max(mouse.y + 14, display.bounds.y + 10), maxY);

        dotWindow.setPosition(targetX, targetY);
      }
    }
  }, 40); // 25 FPS lightweight cursor tracking

  dotWindow.on('closed', () => {
    if (followTimer) clearInterval(followTimer);
    dotWindow = null;
  });
}

// 2. FLOATING ACTION MENU WINDOW (Pops up next to the dot on click/hotkey)
function createMenuWindow() {
  menuWindow = new BrowserWindow({
    width: 340,
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

  // Auto-hide when clicking outside menu window
  menuWindow.on('blur', () => {
    if (menuWindow && !menuWindow.isDestroyed()) {
      menuWindow.hide();
      isTracking = true;
    }
  });

  menuWindow.on('closed', () => {
    menuWindow = null;
  });
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

// Show Menu window positioned safely next to dot / cursor
async function showMenuNearCursor() {
  if (!menuWindow || menuWindow.isDestroyed()) {
    createMenuWindow();
  }

  isTracking = false;
  const mouse = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(mouse);

  // Capture selection from current active window
  const previousClipboard = clipboard.readText();
  clipboard.writeText('');
  await simulateKeyPress('^c');
  await new Promise((r) => setTimeout(r, 100));
  const selectedText = clipboard.readText();
  if (!selectedText) {
    clipboard.writeText(previousClipboard);
  }

  // Position menu window
  const menuWidth = 340;
  const menuHeight = 520;
  let posX = mouse.x + 20;
  let posY = mouse.y - 40;

  // Viewport bounds clamping
  if (posX + menuWidth > display.bounds.x + display.bounds.width) {
    posX = mouse.x - menuWidth - 20;
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
  showMenuNearCursor();
});

ipcMain.on('close-menu-window', () => {
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.hide();
    isTracking = true;
  }
});

ipcMain.on('open-editor-window', () => {
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.hide();
  }
  createEditorWindow();
});

ipcMain.on('resize-menu-window', (_event, { width, height }: { width: number; height: number }) => {
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.setSize(Math.max(340, width), Math.max(300, height));
  }
});

// Paste modified text back into the active external application
ipcMain.handle('paste-to-active-window', async (_event, text: string) => {
  clipboard.writeText(text);
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.hide();
    isTracking = true;
  }
  await new Promise((r) => setTimeout(r, 60));
  await simulateKeyPress('^v');
  return true;
});

// Capture active selection
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

  // Global Shortcuts
  try {
    globalShortcut.register('Alt+Space', () => {
      showMenuNearCursor();
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      showMenuNearCursor();
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
