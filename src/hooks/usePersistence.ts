import { useEffect, useState } from "react";
import { STORAGE_KEY, THEME_STORAGE_KEY } from "../app-config";
import { parseThemeConfig, type BoxThemeConfig } from "../box-themes";
import { getPlatform } from "../platform/runtime";
import { LANGUAGE_OPTIONS, copy, type UiLanguage } from "../translations";

type PersistenceOptions = {
  language: UiLanguage;
  collectionState: Record<string, unknown>;
  hydrateCollection: (value: Record<string, unknown>) => void;
  themeConfig: BoxThemeConfig;
  setThemeConfig: (themes: BoxThemeConfig) => void;
};

export function usePersistence({ language, collectionState, hydrateCollection, themeConfig, setThemeConfig }: PersistenceOptions) {
  const [hydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const platform = getPlatform();
    let cancelled = false;
    void (async () => {
      try {
        const saved = await platform.storage.get(STORAGE_KEY);
        if (saved && !cancelled) {
          const value = JSON.parse(saved) as Record<string, unknown>;
          hydrateCollection(value);
          if (typeof value.savedAt === "number") setLastSavedAt(value.savedAt);
        }
        const savedThemes = await platform.storage.get(THEME_STORAGE_KEY);
        if (savedThemes && !cancelled) {
          const parsedThemes = parseThemeConfig(JSON.parse(savedThemes));
          if (parsedThemes) setThemeConfig(parsedThemes);
        }
      } catch { /* A damaged local backup should never block the app. */ }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateCollection, setThemeConfig]);

  useEffect(() => {
    if (!hydrated) return;
    const savedAt = Date.now();
    void getPlatform().storage.set(STORAGE_KEY, JSON.stringify({ ...collectionState, savedAt }))
      .then(() => setLastSavedAt(savedAt))
      .catch(() => { /* Keep the in-memory session usable if storage is full. */ });
  }, [collectionState, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void getPlatform().storage.set(THEME_STORAGE_KEY, JSON.stringify(themeConfig))
      .catch(() => getPlatform().showAlert(copy(language, "theme_storage_error")));
  }, [themeConfig, hydrated, language]);

  useEffect(() => {
    getPlatform().setDocumentLanguage(LANGUAGE_OPTIONS.find((option) => option.code === language)?.locale ?? "es-MX");
  }, [language]);

  useEffect(() => {
    const timer = globalThis.setInterval(() => setClock(Date.now()), 30_000);
    return () => globalThis.clearInterval(timer);
  }, []);

  return { hydrated, lastSavedAt, clock };
}
