import { message, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { load } from "@tauri-apps/plugin-store";
import type { TauriPlatformBridge } from "./tauri";
import { retryableResource } from "./retryable-resource";

const getStore = retryableResource(() => load("home-checklist.json", { autoSave: false }));

function exportExtension(filename: string) {
  const extension = filename.match(/\.([a-z0-9]+)$/i)?.[1];
  return extension ? [extension] : [];
}

export function createTauriBridge(): TauriPlatformBridge {
  return {
    storage: {
      async get(key) {
        return (await (await getStore()).get<string>(key)) ?? null;
      },
      async set(key, value) {
        const store = await getStore();
        await store.set(key, value);
        await store.save();
      },
    },
    async saveText(filename, text) {
      const destination = await save({
        defaultPath: filename,
        filters: [{ name: "Home Checklist", extensions: exportExtension(filename) }],
      });
      if (!destination) return false;
      await writeTextFile(destination, text);
      return true;
    },
    showAlert(alertMessage) {
      void message(alertMessage, { title: "Home Checklist", kind: "error" });
    },
  };
}
