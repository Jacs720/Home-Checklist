import type { HomeChecklistPlatform } from "./contracts";

export type TauriPlatformBridge = {
  storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
  };
  saveText(filename: string, text: string, mimeType: string): Promise<void>;
};

/**
 * Connects the shared React application to Tauri without importing Tauri in the
 * domain or UI layers. A future native entry point can provide this bridge with
 * `@tauri-apps/plugin-store`, `@tauri-apps/plugin-dialog` and
 * `@tauri-apps/plugin-fs` after the Rust shell is initialized.
 */
export function createTauriPlatform(
  target: "desktop" | "android",
  bridge: TauriPlatformBridge,
): HomeChecklistPlatform {
  return {
    target,
    storage: bridge.storage,
    files: { saveText: bridge.saveText },
    setDocumentLanguage(language) {
      document.documentElement.lang = language;
    },
    showAlert(message) {
      globalThis.alert(message);
    },
  };
}
