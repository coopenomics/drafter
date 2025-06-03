import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    registryPath: '',
    isFirstLaunch: true,
  }),

  actions: {
    setRegistryPath(path: string) {
      this.registryPath = path;
      this.isFirstLaunch = false;
    },

    resetFirstLaunch() {
      this.isFirstLaunch = false;
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'app-settings',
        storage: localStorage,
      },
    ],
  },
});
