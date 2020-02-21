import { shell, BrowserWindow, app, ipcMain, dialog } from 'electron';
import { createWindow } from './windows';
import { settingsFileManager } from './settings';

export class IpcManager {
  constructor() {
    this.setupFileDrop();
    this.setupOpenWindow();
    this.setupMessageBoxHandler();
    this.setupWindowReady();
    this.setupGetPath();
    this.setupSettings();
  }

  public openFile(path: string) {
    this.getCurrentWindow().webContents.send('file-dropped', path);
  }

  private getCurrentWindow(): Electron.BrowserWindow {
    const window = BrowserWindow.getFocusedWindow();

    if (window) {
      return window;
    } else {

      const windows = BrowserWindow.getAllWindows();

      if (windows.length > 0) {
        return windows[0];
      } else {
        throw new Error('Could not find window!');
      }
    }
  }

  private setupFileDrop() {
    app.on('browser-window-created', (_e, window) => {
      const parent = window.getParentWindow();

      if (parent) {
        return;
      }

      window.webContents.on('will-navigate', (e, url) => {
        e.preventDefault();

        if (!url.startsWith('file:///')) {
          shell.openExternal(url);
        } else {
          this.openFile(decodeURIComponent(url.replace('file:///', '/')));
        }
      });
    });
  }

  private setupOpenWindow() {
    ipcMain.on('new-sleuth-window', () => {
      createWindow();
    });
  }

  private setupWindowReady() {
    ipcMain.on('window-ready', (event) => {
      try {
        const browserWindow = BrowserWindow.fromWebContents(event.sender);

        if (browserWindow) {
          browserWindow.show();
        }
      } catch (error) {
        console.warn(`Could not show window`, error);
      }
    });
  }

  private setupMessageBoxHandler() {
    ipcMain.handle('message-box', async (_event, options: Electron.MessageBoxOptions) => {
      return dialog.showMessageBox(options);
    });
  }

  private setupGetPath() {
    type name = 'home' | 'appData' | 'userData' | 'cache' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'logs' | 'pepperFlashSystemPlugin';

    ipcMain.handle('get-path', (_event, path: name) => {
      return app.getPath(path);
    });
  }

  private setupSettings() {
    ipcMain.handle('get-settings', (_event, key: string) => settingsFileManager.getItem(key));
    ipcMain.handle('set-settings', (_event, key: string, value: any) => settingsFileManager.setItem(key, value));
  }
}

export const ipcManager = new IpcManager();
