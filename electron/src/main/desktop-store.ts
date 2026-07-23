import ElectronStore from "electron-store";

export type DesktopStoreSchema = {
  "window.bounds"?: {
    x?: number;
    y?: number;
    width: number;
    height: number;
    isMaximized: boolean;
    displayId?: number;
  };
  "appearance.theme"?: "light" | "dark" | "system";
  "printer.defaultId"?: string;
  "printer.paper"?: "a4" | "thermal58" | "thermal80";
  "downloads.path"?: string;
  "workspace.lastRoute"?: string;
  "general.autoLaunch"?: boolean;
  "updates.channel"?: "latest" | "beta" | "alpha";
  "security.idleTimeoutMin"?: number;
};

type KhataStore = ElectronStore<DesktopStoreSchema>;

let store: KhataStore | null = null;

export function getStore(): KhataStore {
  if (!store) {
    store = new ElectronStore<DesktopStoreSchema>({
      name: "khata-desktop",
      defaults: {
        "appearance.theme": "system",
        "printer.paper": "a4",
        "general.autoLaunch": false,
        "updates.channel": "latest",
        "security.idleTimeoutMin": 30,
      },
    });
  }
  return store;
}

export function storeGet(key: keyof DesktopStoreSchema) {
  return getStore().get(key);
}

export function storeSet(key: keyof DesktopStoreSchema, value: unknown) {
  getStore().set(key as string, value as never);
}

export function storeDelete(key: keyof DesktopStoreSchema) {
  getStore().delete(key);
}
