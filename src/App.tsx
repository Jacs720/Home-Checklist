import { BOX_THEME_GAMES, CONCEPT_ART_GAMES, boxThemeStyle } from "./box-themes";
import { LANGUAGE_OPTIONS, groupName } from "./translations";
import { pokemonArtworkUrl } from "./catalog-planner";
import { assetUrl } from "./app-utils";
import { GooeyCheckbox, OriginMarkIcon, StyledSelect, originMarkIconUrl } from "./components/ui-controls";

import { useAppController } from "./hooks/use-app-controller";
import { BoxView } from "./views/BoxView";
import { EntryDetails } from "./views/EntryDetails";
import { FilterPanel } from "./views/FilterPanel";
import { GlobalView } from "./views/GlobalView";
import { SummaryView } from "./views/SummaryView";

export default function App() {
  const controller = useAppController();
  const {
    dataset,
    specialDataset,
    pokemonNames,
    loadError,
    language,
    setLanguage,
    languageOpen,
    setLanguageOpen,
    owned,
    favorites,
    pageIndex,
    selectedBoxIndex,
    setSelectedBoxIndex,
    viewMode,
    setViewMode,
    undoDepth,
    setCustomBoxEditorId,
    customBoxQuery,
    setCustomBoxQuery,
    locationAnnouncement,
    setGlobalTooltip,
    setGlobalReturnContext,
    query,
    setQuery,
    missingOnly,
    setMissingOnly,
    favoritesOnly,
    setFavoritesOnly,
    filtersOpen,
    setFiltersOpen,
    themeOpen,
    setThemeOpen,
    themeScope,
    setThemeScope,
    themeTab,
    conceptGame,
    themeDraft,
    customThemeDraft,
    customColors,
    importNotice,
    setImportNotice,
    austinPreview,
    setAustinPreview,
    austinNotice,
    setAustinNotice,
    themeImageRef,
    searchInputRef,
    languageOption,
    locale,
    t,
    displayThemeName,
    displayName,
    displayForm,
    boxes,
    plannedEntries,
    ownedCount,
    progress,
    selectedBox,
    activeBoxTheme,
    undoOwned,
    updateCustomBox,
    toggleCustomBoxEntry,
    jumpToBox,
    openThemeDialog,
    chooseThemeTab,
    chooseConceptGame,
    chooseWallpaper,
    importCustomThemeImage,
    updateCustomColor,
    applyBoxTheme,
    resetBoxTheme,
    applyAustinJohnImport,
    favoriteCount,
    themeGameOption,
    themeCanApply,
    customBoxEditor,
    customBoxSearchResults,
  } = controller;

  if (loadError) return <main className="state-screen"><img className="brand-ball" src={assetUrl("assets/strange-ball.png")} alt="" /><h1>{t("load_error")}</h1><p>{t("reload")}</p></main>;
  if (!dataset || !specialDataset || !pokemonNames) return <main className="state-screen"><img className="brand-ball loading" src={assetUrl("assets/strange-ball.png")} alt="" /><p>{t("loading")}</p></main>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="mobile-filter" onClick={() => setFiltersOpen(true)} aria-label={t("open_filters")}>☰</button>
        <div className="brand-lockup"><a className="brand-link" href="https://github.com/Jacs720/Home-Checklist" target="_blank" rel="noreferrer" aria-label={t("github_repo")}><img className="brand-ball" src={assetUrl("assets/strange-ball.png")} alt="" /></a><h1>Home checklist</h1></div>
        <div className="top-actions">
          <div className="progress-summary" aria-label={`${progress}%`}>
            <div><strong>{ownedCount.toLocaleString(locale)}</strong><span>{t("of")} {plannedEntries.length.toLocaleString(locale)}</span></div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div><b>{progress}%</b>
          </div>
          <div className="top-view-control">
            <button type="button" className={`summary-header-action ${viewMode === "summary" ? "active" : ""}`} aria-pressed={viewMode === "summary"} onClick={() => { setViewMode("summary"); setGlobalTooltip(null); }}><span aria-hidden="true">◫</span><b>{t("summary_view")}</b></button>
            {viewMode === "summary" && <button type="button" className="top-view-close" aria-label={t("close_view")} title={t("close_view")} onClick={() => { setViewMode("boxes"); setGlobalTooltip(null); }}>×</button>}
          </div>
          <div className="language-menu">
            <button className="language-trigger" type="button" aria-label={t("language")} aria-expanded={languageOpen} onClick={() => setLanguageOpen((value) => !value)}>
              <img src={assetUrl(`languages/${language}.png`)} alt="" /><span>{languageOption.label}</span><b>⌄</b>
            </button>
            {languageOpen && <div className="language-options" role="listbox" aria-label={t("language")}>
              {LANGUAGE_OPTIONS.map((option) => <button type="button" role="option" aria-selected={language === option.code} className={language === option.code ? "active" : ""} key={option.code} onClick={() => { setLanguage(option.code); setLanguageOpen(false); }}><img src={assetUrl(`languages/${option.code}.png`)} alt="" /><span>{option.label}</span></button>)}
            </div>}
          </div>
        </div>
      </header>
      <span className="sr-only" role="status" aria-live="polite">{locationAnnouncement}</span>

      {importNotice && <section className="import-notice" role="status" aria-live="polite">
        <span className="import-notice-icon" aria-hidden="true">✓</span>
        <div>
          <strong>{importNotice.source === "ocr" ? t("ocr_import_complete") : t("collection_import_complete")}</strong>
          <p>{t("identified")}: <b>{importNotice.rowsRead.toLocaleString(locale)}</b> · {t("matched")}: <b>{importNotice.matchedRows.toLocaleString(locale)}</b> · {t("new_entries")}: <b>{importNotice.newPlanIds.length.toLocaleString(locale)}</b>{importNotice.alreadyOwned ? ` · ${t("already_marked")}: ${importNotice.alreadyOwned.toLocaleString(locale)}` : ""}{importNotice.unmatched ? ` · ${t("unmatched")}: ${importNotice.unmatched.toLocaleString(locale)}` : ""}{importNotice.ambiguous ? ` · ${t("ambiguous")}: ${importNotice.ambiguous.toLocaleString(locale)}` : ""}</p>
        </div>
        <button aria-label={t("close_import_summary")} onClick={() => setImportNotice(null)}>×</button>
      </section>}

      {austinNotice && <section className="import-notice" role="status" aria-live="polite">
        <span className="import-notice-icon" aria-hidden="true">✓</span>
        <div>
          <strong>{t("austin_import_complete")}</strong>
          <p>{t("austin_owned_imported")}: <b>{austinNotice.imported.toLocaleString(locale)}</b> · {t("new_entries")}: <b>{austinNotice.newOwned.toLocaleString(locale)}</b> · {t(austinNotice.mode === "merge" ? "austin_merge" : "austin_replace")} · {t("austin_origin_unchanged")}</p>
        </div>
        <button aria-label={t("close_import_summary")} onClick={() => setAustinNotice(null)}>×</button>
      </section>}

      {austinPreview && <div className="theme-modal-layer austin-modal-layer">
        <button className="theme-modal-scrim" aria-label={t("austin_cancel")} onClick={() => setAustinPreview(null)} />
        <section className="austin-dialog" role="dialog" aria-modal="true" aria-labelledby="austin-dialog-title">
          <header className="austin-dialog-header">
            <div><p className="eyebrow teal">{t("austin_detected")}</p><h2 id="austin-dialog-title">Austin John Plays HOME Organizer</h2><p>{t("austin_preview_intro")}</p></div>
            <button className="theme-close" aria-label={t("austin_cancel")} onClick={() => setAustinPreview(null)}>×</button>
          </header>
          <div className="austin-dialog-body">
            <dl className="austin-source">
              <div><dt>{t("austin_source_sheet")}</dt><dd>{austinPreview.sheetName}</dd></div>
              {austinPreview.versionLabel && <div><dt>{t("austin_version")}</dt><dd>{austinPreview.versionLabel}</dd></div>}
              <div><dt>{t("austin_import_to")}</dt><dd>{t("normal_living_dex")}</dd></div>
            </dl>
            <div className="austin-stat-grid">
              <div><span>{t("austin_matched")}</span><b>{austinPreview.matched.toLocaleString(locale)}</b></div>
              <div><span>{t("austin_owned")}</span><b>{austinPreview.owned.toLocaleString(locale)}</b></div>
              <div><span>{t("austin_missing")}</span><b>{austinPreview.missing.toLocaleString(locale)}</b></div>
              <div className={austinPreview.unmatched ? "warning" : ""}><span>{t("unmatched")}</span><b>{austinPreview.unmatched.toLocaleString(locale)}</b></div>
            </div>
            <p className="austin-origin-note"><b>{t("austin_origin_unknown")}:</b> {t("austin_origin_note")}</p>
            {austinPreview.replaceRemovals > 0 && <p className="austin-replace-note">{t("austin_replace_removes").replace("{count}", austinPreview.replaceRemovals.toLocaleString(locale))}</p>}
          </div>
          <footer className="austin-dialog-actions">
            <button onClick={() => setAustinPreview(null)}>{t("austin_cancel")}</button>
            <button onClick={() => applyAustinJohnImport("merge")}>{t("austin_merge")}</button>
            <button className="austin-replace" onClick={() => applyAustinJohnImport("replace")}>{t("austin_replace")}</button>
          </footer>
        </section>
      </div>}

      {themeOpen && (
        <div className="theme-modal-layer">
          <button className="theme-modal-scrim" aria-label={t("close_theme")} onClick={() => setThemeOpen(false)} />
          <section className="theme-dialog" role="dialog" aria-modal="true" aria-labelledby="theme-dialog-title">
            <header className="theme-dialog-header">
              <div><p className="eyebrow teal">{t("box_appearance")}</p><h2 id="theme-dialog-title">{t("theme_title")}</h2><p>{t("theme_intro")}</p></div>
              <button className="theme-close" aria-label={t("close_theme")} onClick={() => setThemeOpen(false)}>×</button>
            </header>
            <div className="theme-scope-section">
              <span className="theme-section-label">{t("apply_to")}</span>
              <div className="theme-scope-options">
                <button className={themeScope === "all" ? "active" : ""} onClick={() => setThemeScope("all")}><b>{t("all_boxes")}</b><small>{t("all_boxes_desc")}</small></button>
                <button className={themeScope === "mark" ? "active" : ""} disabled={!selectedBox} onClick={() => setThemeScope("mark")}><b>{t("origin_mark_boxes")}</b><small>{selectedBox ? groupName(language, selectedBox.groupKey) : t("open_a_box")}</small></button>
                <button className={themeScope === "box" ? "active" : ""} disabled={!selectedBox} onClick={() => setThemeScope("box")}><b>{t("this_box")}</b><small>{selectedBox?.label ?? t("open_a_box")}</small></button>
              </div>
            </div>
            <div className="theme-picker-layout">
              <div className={`theme-live-preview ${themeDraft.kind === "default" ? "is-default" : "is-themed"}`} style={boxThemeStyle(themeDraft)}>
                <span>{t("preview")}</span><b>{displayThemeName(themeDraft)}</b><div>{Array.from({ length: 30 }, (_, index) => <i key={index} />)}</div>
              </div>
              <div className="theme-picker-content">
                <div className="theme-tabs" role="tablist" aria-label={t("theme_games")}>
                  {BOX_THEME_GAMES.map((game) => <button role="tab" aria-selected={themeTab === game.id} className={themeTab === game.id ? "active" : ""} key={game.id} onClick={() => chooseThemeTab(game.id)}>{game.shortLabel}</button>)}
                  <button role="tab" aria-selected={themeTab === "concept"} className={themeTab === "concept" ? "active" : ""} onClick={() => chooseThemeTab("concept")}>{t("concept_art")}</button>
                  <button role="tab" aria-selected={themeTab === "custom"} className={themeTab === "custom" ? "active" : ""} onClick={() => chooseThemeTab("custom")}>{t("custom")}</button>
                </div>
                {themeGameOption ? (
                  <div role="tabpanel" aria-label={themeGameOption.label}>
                    {themeTab === "concept" && <div className="concept-game-tabs" aria-label={t("concept_art_games")}>{CONCEPT_ART_GAMES.map((game) => <button className={conceptGame === game.id ? "active" : ""} key={game.id} onClick={() => chooseConceptGame(game.id)}>{game.shortLabel}</button>)}</div>}
                    <div className={`wallpaper-gallery ${themeTab === "concept" ? "concept-gallery" : ""}`}>
                      {themeGameOption.wallpapers.map((wallpaper, index) => {
                        const wallpaperLabel = themeGameOption.wallpaperLabels?.[index] ?? String(index + 1).padStart(2, "0");
                        const active = themeDraft.kind === "preset" && themeDraft.wallpaper === wallpaper;
                        return <button aria-label={`${themeGameOption.label} · ${wallpaperLabel}`} aria-pressed={active} className={`${themeTab === "concept" ? "concept-wallpaper " : ""}${active ? "active" : ""}`} key={wallpaper} onClick={() => chooseWallpaper(themeGameOption.id, wallpaper)} style={{ backgroundImage: `linear-gradient(rgba(4, 14, 13, .08), rgba(4, 14, 13, .08)), url("${wallpaper}")` }}><span>{wallpaperLabel}</span></button>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="custom-theme-panel" role="tabpanel">
                    <button className="custom-upload" onClick={() => themeImageRef.current?.click()}><span>＋</span><b>{customThemeDraft ? t("change_background") : t("upload_background")}</b><small>{t("theme_image_types")}</small></button>
                    <input ref={themeImageRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={importCustomThemeImage} hidden />
                    <div className="theme-color-grid">
                      <label><span>{t("app_color")}</span><div><input type="color" value={customColors.appColor} onChange={(event) => updateCustomColor("appColor", event.target.value)} /><code>{customColors.appColor}</code></div></label>
                      <label><span>{t("primary_highlight")}</span><div><input type="color" value={customColors.primary} onChange={(event) => updateCustomColor("primary", event.target.value)} /><code>{customColors.primary}</code></div></label>
                      <label><span>{t("secondary_highlight")}</span><div><input type="color" value={customColors.secondary} onChange={(event) => updateCustomColor("secondary", event.target.value)} /><code>{customColors.secondary}</code></div></label>
                    </div>
                    <p className="custom-theme-note">{t("custom_color_note")}</p>
                  </div>
                )}
              </div>
            </div>
            <footer className="theme-dialog-actions"><button className="reset-theme" onClick={resetBoxTheme}>{t("reset_original")}</button><button className="apply-theme" onClick={applyBoxTheme} disabled={!themeCanApply}>{themeCanApply ? t("apply_theme") : t("upload_to_continue")}</button></footer>
          </section>
        </div>
      )}

      <EntryDetails app={controller} />

      {customBoxEditor && (() => {
        const selectedIds = new Set(customBoxEditor.planIds);
        return <div className="entry-modal-layer custom-box-modal-layer">
          <button className="entry-modal-scrim" aria-label={t("close_editor")} onClick={() => setCustomBoxEditorId(null)} />
          <section className="custom-box-dialog" role="dialog" aria-modal="true" aria-labelledby="custom-box-dialog-title">
            <header className="custom-box-dialog-header">
              <div><p className="eyebrow teal">{t("custom_boxes")}</p><h2 id="custom-box-dialog-title">{t("edit_custom_box")}</h2></div>
              <button className="entry-dialog-close" aria-label={t("close_editor")} onClick={() => setCustomBoxEditorId(null)}>×</button>
            </header>
            <label className="custom-box-name"><span>{t("box_name")}</span><input value={customBoxEditor.name} maxLength={48} onChange={(event) => updateCustomBox(customBoxEditor.id, (box) => ({ ...box, name: event.target.value }))} /></label>
            <div className="custom-box-editor-toolbar">
              <label className="search-box"><span>⌕</span><input value={customBoxQuery} onChange={(event) => setCustomBoxQuery(event.target.value)} placeholder={t("search_database")} /></label>
              <strong>{t("selected_count")}: {customBoxEditor.planIds.length.toLocaleString(locale)} / 30</strong>
            </div>
            <div className="database-choice-grid" aria-label={t("choose_pokemon")}>{customBoxSearchResults.map((entry) => {
              const selected = selectedIds.has(entry.planId);
              const artworkUrl = pokemonArtworkUrl(entry);
              const originMarkKey = entry.mark ?? entry.groupKey;
              return <button type="button" className={selected ? "selected" : ""} aria-pressed={selected} key={entry.planId} onClick={() => toggleCustomBoxEntry(customBoxEditor.id, entry.planId)}>
                <span>{artworkUrl && <img src={artworkUrl} alt="" loading="lazy" />}{entry.variant === "shiny" && <img className="database-shiny" src={assetUrl("assets/shiny.png")} alt="" />}</span>
                <b>{displayName(entry)}</b><small>{displayForm(entry) ?? `#${String(entry.dex).padStart(4, "0")}`}</small>
                {originMarkIconUrl(originMarkKey) ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="database-origin-mark" /> : <em>{entry.groupLabel}</em>}
              </button>;
            })}</div>
            <footer className="custom-box-dialog-footer"><span>{customBoxSearchResults.length.toLocaleString(locale)} {t("database_results")}</span><button className="primary-action" onClick={() => setCustomBoxEditorId(null)}>{t("close_editor")}</button></footer>
          </section>
        </div>;
      })()}

      <div className="workspace">
        {filtersOpen && <button className="drawer-scrim" aria-label={t("close_filters")} onClick={() => setFiltersOpen(false)} />}
        <FilterPanel app={controller} />

        <section className="collection-view">
          <div className="utility-row">
            {viewMode !== "summary" && <div className="utility-navigation">
              <nav className={`view-switcher ${viewMode === "global" ? "global-active" : "boxes-active"}`} aria-label={t("choose_view")}>
                <button type="button" className={viewMode === "boxes" ? "active" : ""} aria-pressed={viewMode === "boxes"} onClick={() => { setViewMode("boxes"); setGlobalTooltip(null); setGlobalReturnContext(null); }}><span aria-hidden="true">▦</span>{t("boxes_view")}</button>
                <button type="button" className={viewMode === "global" ? "active" : ""} aria-pressed={viewMode === "global"} onClick={() => { setViewMode("global"); setGlobalTooltip(null); setGlobalReturnContext(null); }}><span aria-hidden="true">◉</span>{t("global_view")}</button>
              </nav>
              {viewMode === "boxes" && <nav className="breadcrumbs">
                <button className={!selectedBox ? "current" : ""} onClick={() => setSelectedBoxIndex(null)}>{t("page")} {pageIndex + 1}</button>
                {selectedBox && <><span>/</span><strong>{selectedBox.label}</strong></>}
              </nav>}
              {viewMode === "boxes" && <StyledSelect value={selectedBoxIndex ?? -1} options={[{ value: -1, label: t("jump_to_box"), icon: <span aria-hidden="true">▦</span> }, ...boxes.map((box) => ({ value: box.globalIndex, label: `${String(box.globalIndex + 1).padStart(3, "0")} · ${box.label}` }))]} onChange={(value) => { if (value >= 0) jumpToBox(value); }} ariaLabel={t("box_navigator")} className="box-navigator" />}
            </div>}
            <div className="search-tools">
              <button className="undo-action" onClick={undoOwned} disabled={!undoDepth} title={undoDepth ? t("undo_desc") : t("nothing_to_undo")}><span aria-hidden="true">↶</span>{t("undo")}</button>
              {viewMode === "boxes" && <button className="theme-trigger" onClick={openThemeDialog}><span>◈</span><b>{t("theme")}</b><small>{displayThemeName(activeBoxTheme)}</small></button>}
              {viewMode !== "summary" && <><label className="search-box"><span>⌕</span><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} /></label>
              <label className="missing-filter"><GooeyCheckbox id="missing-only" checked={missingOnly} onChange={(event) => setMissingOnly(event.target.checked)} /><span>{t("missing_only")}</span></label>
              <button className={`favorites-filter ${favoritesOnly ? "active" : ""}`} aria-label={`${t("favorites_only")}: ${favoriteCount.toLocaleString(locale)}`} title={`${t("favorites_only")}: ${favoriteCount.toLocaleString(locale)}`} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)}><img src={assetUrl("assets/favorite-star.png")} alt="" /></button></>}
            </div>
          </div>

          {viewMode === "summary" ? (
            <SummaryView app={controller} />
          ) : viewMode === "global" ? (
            <GlobalView app={controller} />
          ) : (
            <BoxView app={controller} />
          )}

          <section className="data-note">
            <div className="source-links"><a href="https://bulbapedia.bulbagarden.net/wiki/N%27s_Pok%C3%A9mon" target="_blank" rel="noreferrer">{t("n_source")}</a><a href="https://www.serebii.net/blackwhite/dreamworldpokemon.shtml" target="_blank" rel="noreferrer">{t("dream_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Dream_Radar#Pok%C3%A9mon_encounters" target="_blank" rel="noreferrer">{t("radar_source")}</a><a href="https://www.serebii.net/events/" target="_blank" rel="noreferrer">{t("event_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/Challenge_(HOME)" target="_blank" rel="noreferrer">{t("home_challenges_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_found_through_the_Pok%C3%A9walker" target="_blank" rel="noreferrer">{t("pokewalker_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/List_of_Shadow_Pok%C3%A9mon" target="_blank" rel="noreferrer">{t("shadow_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/In-game_trade" target="_blank" rel="noreferrer">{t("trade_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_gender_differences" target="_blank" rel="noreferrer">{t("gender_source")}</a><a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noreferrer">{t("art_source")}</a></div>
          </section>
        </section>
      </div>
    </main>
  );
}
