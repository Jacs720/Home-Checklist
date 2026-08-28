import { groupName } from "../translations";
import { AVAILABILITY_STATUSES, COLLECTION_PRESETS } from "../collection-features";
import { COLLECTIONS, GROUP_COLORS, MARKS } from "../app-config";
import { assetUrl } from "../app-utils";
import { BankBadge, CompactCheckbox, GooeyCheckbox, OriginMarkChip, OriginMarkIcon, StyledSelect, originMarkIconUrl } from "../components/ui-controls";
import type { AppController } from "../hooks/use-app-controller";

type FilterPanelProps = { app: AppController };

export function FilterPanel({ app }: FilterPanelProps) {
  const {
    pokewalkerDexes,
    selectedMarks,
    selectedCollections,
    variants,
    acquisitions,
    includeNonShinySpecials,
    setIncludeNonShinySpecials,
    includeEventMythicals,
    setIncludeEventMythicals,
    genderMode,
    setGenderMode,
    formOptions,
    setFormOptions,
    originIndependentDex,
    collectionPreset,
    availabilityFilters,
    setAvailabilityFilters,
    language,
    capacity,
    setCapacity,
    owned,
    livingDexOwned,
    homeChallengesOnly,
    setHomeChallengesOnly,
    pokewalkerOnly,
    setPokewalkerOnly,
    filtersOpen,
    setFiltersOpen,
    collectionGoal,
    setCollectionGoal,
    collectionNotes,
    setCollectionNotes,
    lastExternalBackupAt,
    changesSinceBackup,
    austinImportBusy,
    importRef,
    austinImportRef,
    themeImportRef,
    locale,
    t,
    homeChallengeDexes,
    progress,
    resetProgress,
    markProfileCustom,
    selectOriginIndependentDex,
    toggleMark,
    toggleCollection,
    setVariant,
    setAcquisition,
    applyCollectionPreset,
    toggleAvailability,
    exportBackup,
    exportProgressCsv,
    importData,
    importAustinJohnData,
    exportThemeBackup,
    importThemeBackup,
    markCounts,
    originIndependentCount,
    collectionCounts,
    availabilityCounts,
    savedWhen,
    externalBackupWhen,
  } = app;
  return (
    <aside className={`filter-panel ${filtersOpen ? "open" : ""}`}>
          <div className="filter-title-row"><button className="close-drawer" aria-label={t("close_filters")} onClick={() => setFiltersOpen(false)}>×</button></div>

          <section className="profile-section">
            <p className="panel-label">{t("collection_profiles")}</p>
            <StyledSelect value={collectionPreset} options={COLLECTION_PRESETS.map((preset) => ({ value: preset, label: t(`profile_${preset}`) }))} onChange={applyCollectionPreset} ariaLabel={t("collection_profiles")} className="profile-selector" />
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("variants")}</p>
            <label className="switch-row" htmlFor="variant-shiny" aria-label={t("shiny_possible")}><span><b className="shiny-label"><img className="shiny-symbol small" src={assetUrl("assets/shiny.png")} alt="" />{t("shiny_possible")}</b></span><GooeyCheckbox id="variant-shiny" checked={variants.shiny} onChange={() => setVariant("shiny")} /></label>
            <label className="switch-row" htmlFor="variant-normal" aria-label={t("non_shiny")}><span><b>{t("non_shiny")}</b></span><GooeyCheckbox id="variant-normal" checked={variants.normal} onChange={() => setVariant("normal")} /></label>
            <label className="switch-row special-normal-row" htmlFor="special-non-shiny" aria-label={t("special_non_shiny")}><span><b>{t("special_non_shiny")}</b></span><GooeyCheckbox id="special-non-shiny" checked={includeNonShinySpecials} onChange={(event) => { markProfileCustom(); setIncludeNonShinySpecials(event.target.checked); }} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("form_differences")}</p>
            <label className="switch-row" htmlFor="alternate-forms" aria-label={t("alternate_forms")}><span><b>{t("alternate_forms")}</b></span><GooeyCheckbox id="alternate-forms" checked={formOptions.alternate} onChange={(event) => { markProfileCustom(); setFormOptions((current) => ({ ...current, alternate: event.target.checked })); }} /></label>
            <label className="switch-row" htmlFor="all-alcremie-forms" aria-label={t("all_alcremie_forms")}><span><b>{t("all_alcremie_forms")}</b></span><GooeyCheckbox id="all-alcremie-forms" checked={formOptions.alcremie} onChange={(event) => { markProfileCustom(); setFormOptions((current) => ({ ...current, alcremie: event.target.checked })); }} /></label>
            <label className="switch-row" htmlFor="all-minior-forms" aria-label={t("all_minior_forms")}><span><b>{t("all_minior_forms")}</b></span><GooeyCheckbox id="all-minior-forms" checked={formOptions.minior} onChange={(event) => { markProfileCustom(); setFormOptions((current) => ({ ...current, minior: event.target.checked })); }} /></label>
            <label className="switch-row" htmlFor="all-gender-differences" aria-label={t("all_gender_differences")}><span><b>{t("all_gender_differences")}</b></span><GooeyCheckbox id="all-gender-differences" checked={genderMode === "all"} onChange={(event) => { markProfileCustom(); setGenderMode(event.target.checked ? "all" : "notable"); }} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("acquisition")}</p>

            <label
              className="switch-row"
              htmlFor="acquisition-own"
              aria-label={t("own_ot")}
            >
              <span><b>{t("own_ot")}</b></span>
              <GooeyCheckbox
                id="acquisition-own"
                checked={acquisitions.own}
                onChange={() => setAcquisition("own")}
              />
            </label>

            <label
              className="switch-row"
              htmlFor="acquisition-trade"
              aria-label={t("in_game_trades")}
            >
              <span><b>{t("in_game_trades")}</b></span>
              <GooeyCheckbox
                id="acquisition-trade"
                checked={acquisitions.trade}
                onChange={() => setAcquisition("trade")}
              />
            </label>

            <label
              className="switch-row"
              htmlFor="acquisition-event"
              aria-label={t("events")}
            >
              <span><b>{t("events")}</b></span>
              <GooeyCheckbox
                id="acquisition-event"
                checked={acquisitions.event}
                onChange={() => setAcquisition("event")}
              />
            </label>

            <label
              className="switch-row"
              htmlFor="historical-event-mythicals"
              aria-label={t("historical_event_mythicals")}
            >
              <span><b>{t("historical_event_mythicals")}</b></span>

              <GooeyCheckbox
                id="historical-event-mythicals"
                checked={includeEventMythicals}
                onChange={(event) => {
                  markProfileCustom();

                  const checked = event.target.checked;
                  setIncludeEventMythicals(checked);

                  if (checked) {
                    setAvailabilityFilters((current) => ({
                      ...current,
                      historical: true,
                    }));
                  }
                }}
              />
            </label>

            <label
              className="switch-row"
              htmlFor="acquisition-external"
              aria-label={t("other_games_apps")}
            >
              <span><b>{t("other_games_apps")}</b></span>
              <GooeyCheckbox
                id="acquisition-external"
                checked={acquisitions.external}
                onChange={() => setAcquisition("external")}
              />
            </label>
          </section>

          <section className="filter-section availability-section">
            <p className="panel-label">{t("availability")}</p>
            {AVAILABILITY_STATUSES.map((status) => <label className={`availability-row ${status}`} key={status}>
              <CompactCheckbox checked={availabilityFilters[status]} onChange={() => toggleAvailability(status)} accent={status === "current" ? "#55e0c0" : status === "legacy" ? "#f3953d" : status === "historical" ? "#b18bea" : "#9eb4b1"} />
              {status === "legacy" ? <BankBadge label={t("bank_required")} className="filter-bank-badge" /> : <span>{t(`availability_${status}`)}</span>}
              <em>{availabilityCounts[status].toLocaleString(locale)}</em>
            </label>)}
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("origin_marks")}</p>
            <div className="origin-mark-chip-list" role="group" aria-label={t("origin_marks")}>
              <OriginMarkChip
                mark="living-dex"
                label={t("origin_mode_living_dex")}
                count={originIndependentCount.toLocaleString(locale)}
                selected={originIndependentDex}
                onClick={selectOriginIndependentDex}
                displayLabel
              />
              {MARKS.map((mark) => <OriginMarkChip
                key={mark}
                mark={mark}
                label={groupName(language, mark)}
                count={markCounts[mark]?.toLocaleString(locale) ?? "0"}
                selected={selectedMarks.includes(mark)}
                onClick={() => toggleMark(mark)}
              />)}
              <OriginMarkChip
                mark="go"
                label={groupName(language, "go")}
                count={collectionCounts.go?.toLocaleString(locale) ?? "0"}
                selected={selectedCollections.includes("go")}
                onClick={() => toggleCollection("go")}
              />
            </div>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("special_collections")}</p>
            {COLLECTIONS.filter((collection) => collection !== "go").map((collection) => {
              const label = groupName(language, collection);
              return <label className="mark-row" key={collection} aria-label={`${label}: ${collectionCounts[collection]?.toLocaleString(locale) ?? 0}`}>
                <CompactCheckbox checked={selectedCollections.includes(collection)} onChange={() => toggleCollection(collection)} accent={GROUP_COLORS[collection]} />
                <OriginMarkIcon mark={collection} label={label} className={originMarkIconUrl(collection) ? "filter-mark-icon" : ""} /><em>{collectionCounts[collection]?.toLocaleString(locale) ?? 0}</em>
              </label>;
            })}
            <label className="mark-row" aria-label={`${t("home_challenges_only")}: ${homeChallengeDexes.size.toLocaleString(locale)}`}><CompactCheckbox checked={homeChallengesOnly} onChange={() => setHomeChallengesOnly((current) => !current)} accent="#55e0c0" /><span>{t("home_challenges_only")}</span><em>{homeChallengeDexes.size.toLocaleString(locale)}</em></label>
            <label className="mark-row" aria-label={`${t("pokewalker_only")}: ${pokewalkerDexes.size.toLocaleString(locale)}`}><CompactCheckbox checked={pokewalkerOnly} onChange={() => setPokewalkerOnly((current) => !current)} accent="#55e0c0" /><span>{t("pokewalker_only")}</span><em>{pokewalkerDexes.size.toLocaleString(locale)}</em></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("capacity")}</p>
            <div className="capacity-toggle">
              <button className={capacity === 6000 ? "active" : ""} onClick={() => setCapacity(6000)}>{(6000).toLocaleString(locale)}<small>{t("current")}</small></button>
              <button className={capacity === 8000 ? "active" : ""} onClick={() => setCapacity(8000)}>{(8000).toLocaleString(locale)}<small>{t("future")}</small></button>
            </div>
          </section>

          <section className="filter-section collection-planning">
            <p className="panel-label">{t("personal_planning")}</p>
            <label><span>{t("collection_goal")}</span><input type="number" min="1" max="8000" inputMode="numeric" value={collectionGoal} placeholder={t("goal_placeholder")} onChange={(event) => setCollectionGoal(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} /></label>
            <label><span>{t("collection_notes")}</span><textarea value={collectionNotes} maxLength={2000} rows={3} placeholder={t("notes_placeholder")} onChange={(event) => setCollectionNotes(event.target.value)} /></label>
          </section>

          <div className="backup-actions">
            <span>{t("collection_and_backup")}</span>
            <button className="wide" onClick={() => importRef.current?.click()}>{t("import_collection")}</button><input ref={importRef} type="file" accept=".csv,.json,.homechecklist,text/csv,application/json,application/vnd.home-checklist+json" onChange={importData} hidden />
            <button className="wide austin-import-button" disabled={austinImportBusy} onClick={() => austinImportRef.current?.click()}>{austinImportBusy ? t("austin_reading") : t("austin_import_button")}</button><input ref={austinImportRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={importAustinJohnData} hidden />
            <div className={`backup-health ${lastExternalBackupAt ? "" : "needs-backup"}`}><strong>{t("last_external_backup")}: {externalBackupWhen}</strong><span>{t(changesSinceBackup === 1 ? "one_change_since_backup" : "changes_since_backup").replace("{count}", changesSinceBackup.toLocaleString(locale))}</span></div>
            <button onClick={() => exportBackup("json")}>{t("export_json")}</button><button onClick={exportProgressCsv}>{t("export_csv")}</button><button className="wide create-backup" onClick={() => exportBackup("project")}>{t("create_backup")}</button>
            <small className="auto-save-status"><i aria-hidden="true" />{t("last_saved")} {savedWhen}</small>
            <span>{t("theme_backup")}</span>
            <button onClick={exportThemeBackup}>{t("export_themes")}</button><button onClick={() => themeImportRef.current?.click()}>{t("import_themes")}</button><input ref={themeImportRef} type="file" accept="application/json" onChange={importThemeBackup} hidden />
            <button className="reset-progress" onClick={resetProgress} disabled={!livingDexOwned.size && !owned.size}>{t("reset_progress")}</button>
          </div>
    </aside>
  );
}
