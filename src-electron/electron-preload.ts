/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.ts you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Файловые операции для шаблонов
  readTemplateFile: (fileName: string) =>
    ipcRenderer.invoke('read-template-file', fileName),
  writeTemplateFile: (fileName: string, content: string) =>
    ipcRenderer.invoke('write-template-file', fileName, content),
  listTemplateFiles: () => ipcRenderer.invoke('list-template-files'),

  // Операции с cooptypes
  listCooptypeDirectories: () =>
    ipcRenderer.invoke('list-cooptype-directories'),
  readCooptypeFile: (templateId: string) =>
    ipcRenderer.invoke('read-cooptype-file', templateId),
  writeCooptypeFile: (templateId: string, content: string) =>
    ipcRenderer.invoke('write-cooptype-file', templateId, content),

  // Операции с путем к реестру
  setRegistryPath: (path: string) =>
    ipcRenderer.invoke('set-registry-path', path),
  getRegistryPath: () => ipcRenderer.invoke('get-registry-path'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
});

export {};
