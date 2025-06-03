import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import os from 'os';

const fs = require('fs').promises;

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

let mainWindow: BrowserWindow | undefined;

// Переменная для хранения пути к реестру
let registryPath = process.env.COOPTYPES_REGISTRY_PATH || '';

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1200,
    height: 800,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        __dirname,
        process.env.QUASAR_ELECTRON_PRELOAD || ''
      ),
    },
  });

  mainWindow.loadURL(process.env.APP_URL || '');

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

// Обработчик для установки пути к реестру
ipcMain.handle('set-registry-path', async (event, path: string) => {
  registryPath = path;
  return true;
});

// Обработчик для получения текущего пути к реестру
ipcMain.handle('get-registry-path', async () => {
  return registryPath;
});

// Обработчик для выбора директории
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// IPC обработчики для работы с cooptypes файлами
ipcMain.handle('list-cooptype-directories', async () => {
  try {
    if (!registryPath) {
      throw new Error('Registry path not set');
    }
    const items = await fs.readdir(registryPath, { withFileTypes: true });
    return items
      .filter((item: any) => item.isDirectory())
      .map((item: any) => item.name);
  } catch (error) {
    console.error('Error listing cooptype directories:', error);
    return [];
  }
});

ipcMain.handle('read-cooptype-file', async (event, templateId: string) => {
  try {
    if (!registryPath) {
      throw new Error('Registry path not set');
    }
    const filePath = path.join(registryPath, templateId, 'index.ts');
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading cooptype file:', error);
    throw error;
  }
});

ipcMain.handle(
  'write-cooptype-file',
  async (event, templateId: string, content: string) => {
    try {
      if (!registryPath) {
        throw new Error('Registry path not set');
      }
      const filePath = path.join(registryPath, templateId, 'index.ts');
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing cooptype file:', error);
      throw error;
    }
  }
);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    createWindow();
  }
});
