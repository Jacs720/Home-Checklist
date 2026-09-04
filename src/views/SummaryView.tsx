import { groupName } from "../translations";
import { GAME_PLANS } from "../collection-features";
import { pokemonArtworkUrl } from "../catalog-planner";
import { OriginMarkIcon, StyledSelect, originMarkIconUrl } from "../components/ui-controls";
import type { AppController } from "../hooks/use-app-controller";
import { HomeChallengeSummary } from "../HomeChallengeSummary";

type SummaryViewProps = { app: AppController };

export function SummaryView({ app }: SummaryViewProps) {
  const {
    language,
    selectedGamePlan,
    setSelectedGamePlan,
    gameResultLimit,
    setGameResultLimit,
    customBoxes,
    setCustomBoxEditorId,
    setCustomBoxQuery,
    setRenameBoxIndex,
    gamePlannerRef,
    locale,
    t,
    displayName,
    displayForm,
    boxes,
    databaseChoiceByPlanId,
    plannedEntries,
    generationSummary,
    originSummary,
    availabilitySummary,
    gameRecommendations,
    gameMissingEntries,
    ownedCount,
    progress,
    locateEntryInBoxes,
    renamePlannedBox,
    createCustomBox,
    deleteCustomBox,
    boxBeingRenamed,
    homeChallengeProgress,
    pokemonNames,
  } = app;
  return (
<section className="summary-view" aria-labelledby="collection-summary-title">
              <header className="summary-hero">
                <div>
                  <p className="eyebrow teal">{t("your_collection")}</p>
                  <h2 id="collection-summary-title">{t("collection_summary")}</h2>
                </div>
                <div className="summary-ring" style={{ background: `conic-gradient(var(--teal) ${progress}%, rgba(85, 224, 192, .12) 0)` }}><span><strong>{progress}%</strong>{t("completion")}</span></div>
                <div className="summary-metrics">
                  <article><strong>{ownedCount.toLocaleString(locale)}</strong><span>{t("pokemon_registered")}</span></article>
                  <article><strong>{Math.max(0, plannedEntries.length - ownedCount).toLocaleString(locale)}</strong><span>{t("pokemon_missing")}</span></article>
                  <article><strong>{plannedEntries.length.toLocaleString(locale)}</strong><span>{t("summary_entries")}</span></article>
                </div>
              </header>

              <div className="summary-grid">
                <HomeChallengeSummary
                  language={language}
                  locale={locale}
                  progress={homeChallengeProgress}
                  pokemonNames={pokemonNames ?? {}}
                  formLabel={(dex, form) => app.displayForm({ dex, form } as Parameters<typeof app.displayForm>[0])}
                  sourceUrl="https://bulbapedia.bulbagarden.net/wiki/Challenge_(HOME)"
                />
                <section className="summary-panel">
                  <div className="summary-panel-heading"><span>{t("by_generation")}</span><b>{t("completion")}</b></div>
                  <div className="progress-list">{generationSummary.map((item) => <div className="progress-row" key={item.generation}>
                    <div><strong>{t("generation")} {item.generation}</strong><span>{item.registered.toLocaleString(locale)} / {item.total.toLocaleString(locale)}</span></div>
                    <div className="progress-bar" aria-label={`${item.progress}%`}><i style={{ width: `${item.progress}%` }} /></div><b>{item.progress}%</b>
                  </div>)}</div>
                </section>

                <section className="summary-panel">
                  <div className="summary-panel-heading"><span>{t("by_origin")}</span><b>{t("completion")}</b></div>
                  <div className="progress-list origin-progress-list">{originSummary.map((item) => {
                    const itemProgress = item.total ? Math.round((item.registered / item.total) * 100) : 0;
                    return <div className="progress-row" key={item.key}>
                      <div><strong>{originMarkIconUrl(item.key) ? <OriginMarkIcon mark={item.key} label={groupName(language, item.key)} className="summary-origin-icon" /> : item.key === "living-dex" ? t("normal_living_dex") : groupName(language, item.key)}</strong><span>{item.registered.toLocaleString(locale)} / {item.total.toLocaleString(locale)}</span></div>
                      <div className="progress-bar" aria-label={`${itemProgress}%`}><i style={{ width: `${itemProgress}%` }} /></div><b>{itemProgress}%</b>
                    </div>;
                  })}</div>
                </section>

                <section className="summary-panel availability-panel">
                  <div className="summary-panel-heading"><span>{t("availability_breakdown")}</span></div>
                  <div className="availability-summary">{availabilitySummary.map((item) => <article className={item.status} key={item.status}><span>{t(`availability_${item.status}`)}</span><strong>{item.registered.toLocaleString(locale)} / {item.total.toLocaleString(locale)}</strong></article>)}</div>
                </section>

                <section className="summary-panel game-recommendations">
                  <div className="summary-panel-heading"><span>{t("best_games_to_progress")}</span><b>{t("obtainable_missing_count")}</b></div>
                  {gameRecommendations.length ? <div className="game-recommendation-list">{gameRecommendations.map((game, index) => <button
                    className={game.id === selectedGamePlan ? "active" : ""}
                    key={game.id}
                    aria-label={`${t("open_game_planner")} ${t(`game_${game.id}`)}`}
                    onClick={() => {
                      setSelectedGamePlan(game.id);
                      setGameResultLimit(24);
                      window.requestAnimationFrame(() => gamePlannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                    }}
                  >
                    <span className="game-recommendation-rank">{index + 1}</span>
                    <strong>{t(`game_${game.id}`)}</strong>
                    <span><b>{game.count.toLocaleString(locale)}</b> {t("missing_obtainable")}</span>
                    <span aria-hidden="true">→</span>
                  </button>)}</div> : <p className="game-recommendation-empty">{t("no_game_recommendations")}</p>}
                </section>

                <section className="summary-panel game-planner" ref={gamePlannerRef} id="game-planner">
                  <div className="game-plan-header">
                    <div><p className="eyebrow teal">{t("game_planner")}</p><h3>{t("obtainable_missing")}</h3></div>
                    <div><span className="sr-only">{t("select_game")}</span><StyledSelect value={selectedGamePlan} options={GAME_PLANS.map((game) => ({ value: game.id, label: t(`game_${game.id}`) }))} onChange={(game) => { setSelectedGamePlan(game); setGameResultLimit(24); }} ariaLabel={t("select_game")} className="game-selector" /></div>
                  </div>
                  {gameMissingEntries.length ? <>
                    <div className="game-results">{gameMissingEntries.slice(0, gameResultLimit).map((located) => {
                      const { entry, box, slotIndex } = located;
                      const localizedName = displayName(entry);
                      const localizedForm = displayForm(entry);
                      const originMarkKey = entry.mark ?? entry.groupKey;
                      return <button className="game-result" key={`${selectedGamePlan}:${entry.planId}`} onClick={() => locateEntryInBoxes(located)}>
                        <span className="game-result-art">{pokemonArtworkUrl(entry) && <img src={pokemonArtworkUrl(entry) ?? ""} alt="" loading="lazy" />}</span>
                        <span className="game-result-meta"><strong>{localizedName}{localizedForm ? ` — ${localizedForm}` : ""}</strong><small>{entry.variant === "shiny" ? t("shiny") : t("normal")} · {t("box")} {String(box.globalIndex + 1).padStart(3, "0")} · {t("slot")} {String(slotIndex + 1).padStart(2, "0")}</small></span>
                        {originMarkIconUrl(originMarkKey) ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="game-result-origin" /> : <em>{entry.groupLabel}</em>}
                        <span aria-hidden="true">→</span>
                      </button>;
                    })}</div>
                    {gameMissingEntries.length > gameResultLimit && <button className="show-more" onClick={() => setGameResultLimit((value) => value + 24)}>{t("show_more")} · {(gameMissingEntries.length - gameResultLimit).toLocaleString(locale)} {t("remaining_results")}</button>}
                  </> : <div className="game-plan-empty"><span>✓</span><strong>{t("game_plan_complete")}</strong></div>}
                </section>

                <section className="summary-panel box-organizer">
                  <div className="summary-panel-heading"><span>{t("box_organizer")}</span></div>
                  <div className="box-rename-row">
                    <StyledSelect value={boxBeingRenamed?.globalIndex ?? -1} options={[{ value: -1, label: t("jump_to_box") }, ...boxes.map((box) => ({ value: box.globalIndex, label: `${String(box.globalIndex + 1).padStart(3, "0")} · ${box.label}` }))]} onChange={(value) => { if (value >= 0) setRenameBoxIndex(value); }} ariaLabel={t("rename_box")} className="rename-box-selector" />
                    <label><span>{t("box_name")}</span><input value={boxBeingRenamed?.label ?? ""} disabled={!boxBeingRenamed} maxLength={48} onChange={(event) => { if (boxBeingRenamed) renamePlannedBox(boxBeingRenamed, event.target.value); }} /></label>
                    <button disabled={!boxBeingRenamed} onClick={() => { if (boxBeingRenamed) renamePlannedBox(boxBeingRenamed, ""); }}>{t("restore_default_name")}</button>
                  </div>
                  <div className="custom-box-heading"><div><strong>{t("custom_boxes")}</strong><span>{t("choose_pokemon")}</span></div><button className="primary-action" onClick={createCustomBox}>＋ {t("new_custom_box")}</button></div>
                  {customBoxes.length ? <div className="custom-box-list">{customBoxes.map((box) => <article key={box.id}>
                    <div><strong>{box.name || t("custom_box")}</strong><span>{box.planIds.length.toLocaleString(locale)} / 30</span></div>
                    <span className="custom-box-preview">{Array.from({ length: 30 }, (_, index) => { const entry = databaseChoiceByPlanId.get(box.planIds[index]); const artworkUrl = entry ? pokemonArtworkUrl(entry) : null; return <i key={index}>{artworkUrl && <img src={artworkUrl} alt="" loading="lazy" />}</i>; })}</span>
                    <footer><button onClick={() => { setCustomBoxQuery(""); setCustomBoxEditorId(box.id); }}>{t("edit_custom_box")}</button><button className="danger" onClick={() => deleteCustomBox(box)}>{t("delete_custom_box")}</button></footer>
                  </article>)}</div> : <p className="custom-box-empty">{t("no_custom_boxes")}</p>}
                </section>

                <section className="summary-panel shortcut-guide">
                  <div className="summary-panel-heading"><span>{t("keyboard_shortcuts")}</span></div>
                  <div className="shortcut-grid"><span><kbd>← ↑ → ↓</kbd>{t("shortcut_arrows")}</span><span><kbd>Space</kbd>{t("shortcut_space")}</span><span><kbd>F</kbd>{t("shortcut_favorite")}</span><span><kbd>/</kbd>{t("shortcut_search")}</span><span><kbd>PgUp / PgDn</kbd>{t("shortcut_boxes")}</span><span><kbd>Ctrl / ⌘ + Z</kbd>{t("shortcut_undo")}</span></div>
                </section>
              </div>
            </section>
  );
}
