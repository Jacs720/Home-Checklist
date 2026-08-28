import { useEffect, useState } from "react";
import { STORAGE_KEY, THEME_STORAGE_KEY } from "../app-config";
import { parseThemeConfig, type BoxThemeConfig } from "../box-themes";
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
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const value = JSON.parse(saved) as Record<string, unknown>;
        hydrateCollection(value);
        if (typeof value.savedAt === "number") setLastSavedAt(value.savedAt);
      }
      const savedThemes = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemes) {
        const parsedThemes = parseThemeConfig(JSON.parse(savedThemes));
        if (parsedThemes) setThemeConfig(parsedThemes);
      }
    } catch { /* A damaged local backup should never block the app. */ }
    setHydrated(true);
  }, [hydrateCollection, setThemeConfig]);

  useEffect(() => {
    if (!hydrated) return;
    const savedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...collectionState, savedAt }));
      setLastSavedAt(savedAt);
    } catch { /* Keep the in-memory session usable if browser storage is full. */ }
  }, [collectionState, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeConfig)); }
    catch { window.alert(copy(language, "theme_storage_error")); }
  }, [themeConfig, hydrated, language]);

  useEffect(() => {
    document.documentElement.lang = LANGUAGE_OPTIONS.find((option) => option.code === language)?.locale ?? "es-MX";
  }, [language]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return { hydrated, lastSavedAt, clock };
}
