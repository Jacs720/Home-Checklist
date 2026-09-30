import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEY, THEME_STORAGE_KEY } from "../app-config";
import { type BoxThemeConfig } from "../box-themes";
import { validateCollectionState, validateThemes } from "../backup-validation";
import { getPlatform } from "../platform/runtime";
import { LANGUAGE_OPTIONS, type UiLanguage } from "../translations";

type PersistenceOptions = {
  language: UiLanguage;
  collectionState: Record<string, unknown>;
  hydrateCollection: (value: Record<string, unknown>) => void;
  themeConfig: BoxThemeConfig;
  setThemeConfig: (themes: BoxThemeConfig) => void;
};

export function usePersistence({ language, collectionState, hydrateCollection, themeConfig, setThemeConfig }: PersistenceOptions) {
  const [hydrated, setHydrated] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [status, setStatus] = useState<"saving" | "saved" | "error" | "protected">("saving");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [retry, setRetry] = useState(0);
  const queue = useRef(Promise.resolve());
  const revision = useRef(0);
  const retrySave = useCallback(() => setRetry((value) => value + 1), []);

  useEffect(() => {
    if (hydrated && !blocked) return;
    let cancelled = false;
    void (async () => {
      try {
        const storage = getPlatform().storage;
        const [saved, savedThemes] = await Promise.all([storage.get(STORAGE_KEY), storage.get(THEME_STORAGE_KEY)]);
        const value = saved ? validateCollectionState(JSON.parse(saved)) : null;
        const themes = savedThemes ? validateThemes(JSON.parse(savedThemes)) : null;
        if (cancelled) return;
        if (value) { hydrateCollection(value); if (typeof value.savedAt === "number") setLastSavedAt(value.savedAt); }
        if (themes) setThemeConfig(themes);
        setBlocked(false);
        setHydrated(true);
      } catch {
        if (!cancelled) { setBlocked(true); setStatus("protected"); setHydrated(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [retry, hydrateCollection, setThemeConfig]);

  useEffect(() => {
    if (!hydrated || blocked) return;
    const savedAt = Date.now();
    const id = ++revision.current;
    const collection = JSON.stringify({ ...collectionState, savedAt });
    const themes = JSON.stringify(themeConfig);
    setStatus("saving");
    queue.current = queue.current.catch(() => {}).then(async () => {
      if (id !== revision.current) return;
      try {
        const storage = getPlatform().storage;
        await storage.set(STORAGE_KEY, collection);
        await storage.set(THEME_STORAGE_KEY, themes);
        if (id === revision.current) { setLastSavedAt(savedAt); setStatus("saved"); }
      } catch { if (id === revision.current) setStatus("error"); }
    });
  }, [collectionState, themeConfig, hydrated, blocked, retry]);

  const allowRecovery = async () => {
    if (!blocked) return;
    const storage = getPlatform().storage;
    const [collection, themes] = await Promise.all([storage.get(STORAGE_KEY), storage.get(THEME_STORAGE_KEY)]);
    await storage.set(`${STORAGE_KEY}-recovery-${Date.now()}`, JSON.stringify({ collection, themes }));
    setBlocked(false);
  };

  useEffect(() => { getPlatform().setDocumentLanguage(LANGUAGE_OPTIONS.find((option) => option.code === language)?.locale ?? "es-MX"); }, [language]);
  useEffect(() => { const timer = globalThis.setInterval(() => setClock(Date.now()), 30_000); return () => globalThis.clearInterval(timer); }, []);
  return { hydrated, lastSavedAt, clock, persistenceStatus: status, retrySave, allowRecovery };
}
