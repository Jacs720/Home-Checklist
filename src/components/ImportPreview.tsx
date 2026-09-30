import { useEffect, useRef } from "react";
import type { AppController } from "../hooks/use-app-controller";

export function ImportPreview({ app }: { app: AppController }) {
  const { importPreview: preview, setImportPreview, importBusy, applyImport, t, locale } = app;
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => previous?.focus();
  }, []);
  if (!preview) return null;
  const state = preview.backup?.state;
  const count = state ? state.owned.length + state.livingDexOwned.length : preview.csv?.summary.matchedRows ?? 0;
  return <div className="theme-modal-layer austin-modal-layer">
    <button className="theme-modal-scrim" disabled={importBusy} aria-label={t("austin_cancel")} onClick={() => setImportPreview(null)} />
    <section ref={dialog} className="austin-dialog" role="dialog" aria-modal="true" aria-labelledby="import-preview-title" onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <header className="austin-dialog-header"><div><h2 id="import-preview-title">{t("import_preview")}</h2><p>{preview.filename}</p></div><button disabled={importBusy} aria-label={t("austin_cancel")} onClick={() => setImportPreview(null)}>×</button></header>
      <div className="austin-dialog-body">
        <p>{t("import_review")}</p>
        <div className="austin-stat-grid">
          <div><span>{t("identified")}</span><b>{count.toLocaleString(locale)}</b></div>
          <div><span>{t("import_exclusions")}</span><b>{(state?.progressExclusions.length ?? preview.csv?.progressExclusions.length ?? 0).toLocaleString(locale)}</b></div>
          {preview.csv && <><div><span>{t("unmatched")}</span><b>{preview.csv.summary.unmatched.toLocaleString(locale)}</b></div><div><span>{t("ambiguous")}</span><b>{preview.csv.summary.ambiguous.toLocaleString(locale)}</b></div></>}
          {state && <div><span>{t("favorites_only")}</span><b>{state.favorites.length.toLocaleString(locale)}</b></div>}
        </div>
        {preview.backup && <p>{t("import_config")}: {preview.backup.themes ? "✓" : "—"}</p>}
        <p className="austin-replace-note">{t("import_replace_warning")}</p>
      </div>
      <footer className="austin-dialog-actions"><button disabled={importBusy} onClick={() => setImportPreview(null)}>{t("austin_cancel")}</button><button disabled={importBusy || (!state && !count)} onClick={() => void applyImport("merge")}>{t("austin_merge")}</button><button className="austin-replace" disabled={importBusy || (!state && !count)} onClick={() => void applyImport("replace")}>{t("austin_replace")}</button></footer>
    </section>
  </div>;
}
