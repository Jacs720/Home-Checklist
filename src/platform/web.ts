import type { HomeChecklistPlatform, ReleaseTarget } from "./contracts";

export function createWebPlatform(target: ReleaseTarget = "web"): HomeChecklistPlatform {
  return {
    target,
    storage: {
      async get(key) {
        return globalThis.localStorage.getItem(key);
      },
      async set(key, value) {
        globalThis.localStorage.setItem(key, value);
      },
    },
    files: {
      async saveText(filename, text, mimeType) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([text], { type: mimeType }));
        link.download = filename;
        link.click();
        globalThis.setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
      },
    },
    setDocumentLanguage(language) {
      document.documentElement.lang = language;
    },
    showAlert(message) {
      globalThis.alert(message);
    },
  };
}
