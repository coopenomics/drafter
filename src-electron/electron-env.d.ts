/* eslint-disable */

declare namespace NodeJS {
  interface ProcessEnv {
    QUASAR_ELECTRON_PRELOAD: string;
    APP_URL: string;
    DEBUGGING?: string;
    COOPTYPES_REGISTRY_PATH?: string;
  }
}

interface ElectronAPI {
  listCooptypeDirectories: () => Promise<string[]>;
  readCooptypeFile: (templateId: string) => Promise<string>;
  writeCooptypeFile: (templateId: string, content: string) => Promise<boolean>;

  // Новые методы для работы с путем к реестру
  setRegistryPath: (path: string) => Promise<boolean>;
  getRegistryPath: () => Promise<string>;
  selectDirectory: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
