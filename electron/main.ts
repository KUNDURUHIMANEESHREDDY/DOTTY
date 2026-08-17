import { app, BrowserWindow, shell, globalShortcut } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set app user model id for Windows notifications/taskbar
if (process.platform === 'win32') {
  app.setAppUserModelId('com.dotty.app');
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1150,
    height: 780,
    minWidth: 850,
    minHeight: 550,
    backgroundColor: '#020617',
    title: 'Dotty — AI Typing Assistant & Smart Editor',
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    // Production: load bundled index.html
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load file from dist path:', err);
      // Fallback
      const fallbackPath = path.join(app.getAppPath(), 'dist/index.html');
      mainWindow?.loadFile(fallbackPath);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register desktop global shortcut to focus Dotty
  try {
    globalShortcut.register('Alt+Space', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('Could not register Alt+Space global shortcut:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch((err) => {
  console.error('Error during app.whenReady:', err);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
