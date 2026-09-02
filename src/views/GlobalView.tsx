import { availabilityForEntry, requiresPokemonBank } from "../collection-features";
import { pokemonArtworkUrl } from "../catalog-planner";
import { assetUrl } from "../app-utils";
import { BankBadge, FavoriteButton, OriginMarkIcon, StyledSelect, originMarkIconUrl } from "../components/ui-controls";
import type { AppController } from "../hooks/use-app-controller";

type GlobalViewProps = { app: AppController };

export function GlobalView({ app }: GlobalViewProps) {
  const {
    owned,
    favorites,
    globalSortMode,
    setGlobalSortMode,
    globalGroupMode,
    setGlobalGroupMode,
    globalTooltip,
    setGlobalTooltip,
    locale,
    t,
    displayName,
    displayForm,
    entryIsOwned,
    visibleGlobalEntries,
    visibleGlobalOwned,
    globalEntryGroups,
    globalAllOwned,
    globalBulkLabel,
    showGlobalTooltip,
    locateEntryInBoxes,
    toggleFavorite,
    toggleEntries,
  } = app;
  return (
<>
              <div className="view-heading global-view-heading">
                <div><p className="eyebrow teal">{t("your_collection")}</p><h2>{t("global_view")}</h2><p>{t("global_view_desc")}</p></div>
                <div className="heading-metrics"><span><b>{visibleGlobalEntries.length.toLocaleString(locale)}</b> {t("results")}</span><span><b>{visibleGlobalOwned.toLocaleString(locale)}</b> {t("obtained")}</span></div>
              </div>

              <div className="global-toolbar">
                <div className="global-toolbar-selects">
                  <label><span>{t("sort_by")}</span><StyledSelect value={globalSortMode} options={[
                    { value: "home", label: t("sort_home"), icon: <span aria-hidden="true">⌂</span> },
                    { value: "pokedex", label: t("sort_pokedex"), icon: <span aria-hidden="true">#</span> },
                    { value: "generation", label: t("sort_generation"), icon: <span aria-hidden="true">Ⅰ</span> },
                    { value: "origin-mark", label: t("sort_origin_mark"), icon: <span aria-hidden="true">◇</span> },
                    { value: "missing-first", label: t("sort_missing_first"), icon: <span aria-hidden="true">○</span> },
                  ]} onChange={setGlobalSortMode} ariaLabel={t("sort_by")} className="global-control-select" /></label>
                  <label><span>{t("group_by")}</span><StyledSelect value={globalGroupMode} options={[
                    { value: "none", label: t("group_none"), icon: <span aria-hidden="true">—</span> },
                    { value: "origin-mark", label: t("group_origin_mark"), icon: <span aria-hidden="true">◇</span> },
                    { value: "generation", label: t("group_generation"), icon: <span aria-hidden="true">Ⅰ</span> },
                    { value: "collection", label: t("group_collection"), icon: <span aria-hidden="true">▦</span> },
                  ]} onChange={setGlobalGroupMode} ariaLabel={t("group_by")} className="global-control-select" /></label>
                </div>
                <button className={`global-bulk-action ${globalAllOwned ? "all-owned" : ""}`} disabled={!visibleGlobalEntries.length} onClick={() => toggleEntries(visibleGlobalEntries.map(({ entry }) => entry))}><span aria-hidden="true">✓</span><b>{globalBulkLabel}</b></button>
              </div>

              {visibleGlobalEntries.length ? <div className="global-result-groups">
                {globalEntryGroups.map((group) => <section className={`global-result-group ${globalGroupMode === "none" ? "ungrouped" : ""}`} key={group.key}>
                  {globalGroupMode !== "none" && <div className="global-group-heading"><h3>{group.label}<span aria-hidden="true">—</span><b>{group.entries.length.toLocaleString(locale)}</b></h3></div>}
                  <div className="global-gallery" aria-label={globalGroupMode === "none" ? t("global_view") : `${t("global_view")}: ${group.label}`}>
                {group.entries.map((located) => {
                  const { entry, box, slotIndex } = located;
                  const localizedName = displayName(entry);
                  const localizedForm = displayForm(entry);
                  const isOwned = entryIsOwned(entry);
                  const artworkUrl = pokemonArtworkUrl(entry);
                  const boxNumber = String(box.globalIndex + 1).padStart(3, "0");
                  const slotNumber = String(slotIndex + 1).padStart(2, "0");
                  const originMarkKey = entry.mark ?? entry.groupKey;
                  const favorite = favorites.has(entry.planId);
                  const needsBank = requiresPokemonBank(entry);
                  const status = isOwned ? t("status_obtained") : t("status_missing");
                  const collectionContext = entry.genericEntry ? t("generic_specimen") : `${entry.mark ? t("origin_marks") : t("special_collections")}: ${entry.groupLabel}`;
                  const accessibleLabel = `${localizedName}${localizedForm ? ` — ${localizedForm}` : ""}. ${entry.variant === "shiny" ? t("shiny") : t("normal")}. ${collectionContext}. ${t("availability_label")}: ${t(`availability_${availabilityForEntry(entry)}`)}. ${t("box")} ${boxNumber}, ${t("slot")} ${slotNumber}. ${status}. ${t("locate_in_box")}`;
                  return <div className="global-pokemon-shell" key={`${entry.planId}:${box.globalIndex}:${slotIndex}`}>
                    <button
                      className={`global-pokemon ${isOwned ? "owned" : "pending"}`}
                      aria-label={accessibleLabel}
                      onMouseEnter={(event) => showGlobalTooltip(event.currentTarget, located)}
                      onMouseLeave={() => setGlobalTooltip(null)}
                      onFocus={(event) => showGlobalTooltip(event.currentTarget, located)}
                      onBlur={() => setGlobalTooltip(null)}
                      onClick={() => locateEntryInBoxes(located)}
                    >
                      {artworkUrl ? <img src={artworkUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /> : <span className="global-art-placeholder" aria-hidden="true" />}
                      {originMarkIconUrl(originMarkKey) && <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="entry-origin-mark" />}
                      {needsBank && <BankBadge label={t("bank_required")} className="global-bank-badge" />}
                      <TraitBadges requirements={entry.requirements} t={t} />
                    </button>
                    <FavoriteButton active={favorite} label={t(favorite ? "remove_favorite" : "add_favorite")} onClick={() => toggleFavorite(entry.planId)} className="global-favorite" />
                  </div>;
                })}
                  </div>
                </section>)}
              </div> : <div className="global-empty"><span>⌕</span><h3>{t("no_results")}</h3><p>{t("no_results_desc")}</p></div>}

              {globalTooltip && (() => {
                const { entry, box, slotIndex } = globalTooltip.located;
                const localizedName = displayName(entry);
                const localizedForm = displayForm(entry);
                const isOwned = entryIsOwned(entry);
                const originMarkKey = entry.mark ?? entry.groupKey;
                const availability = availabilityForEntry(entry);
                return <div className={`global-tooltip ${globalTooltip.above ? "above" : ""}`} role="tooltip" style={{ left: globalTooltip.left, top: globalTooltip.top }}>
                  <strong>{localizedName}{localizedForm && <><span> — </span>{localizedForm}</>}</strong>
                  <b className={entry.variant}>{entry.variant === "shiny" && <img src={assetUrl("assets/shiny.png")} alt="" />}{entry.variant === "shiny" ? t("shiny") : t("normal")}</b>
                  <span><em>{entry.genericEntry ? t("generic_specimen") : entry.mark ? t("origin_marks") : t("special_collections")}</em>{entry.genericEntry ? <span>{t("no_origin_required")}</span> : originMarkIconUrl(originMarkKey) ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="tooltip-origin-mark" /> : <span>{entry.groupLabel}</span>}</span>
                  <span><em>{t("availability_label")}</em><span className={`tooltip-availability ${availability}`}>{t(`availability_${availability}`)}</span></span>
                  {requiresPokemonBank(entry) && <BankBadge label={t("bank_required")} className="tooltip-bank-badge" />}
                  <span><em>{t("box")} · {t("slot")}</em>{String(box.globalIndex + 1).padStart(3, "0")} · {String(slotIndex + 1).padStart(2, "0")}</span>
                  <span className={isOwned ? "owned" : "pending"}>{isOwned ? t("status_obtained") : t("status_missing")}</span>
                  <small>{t("locate_in_box")}</small>
                </div>;
              })()}
            </>
  );
}
import { TraitBadges } from "../components/specimen-trait-controls";
