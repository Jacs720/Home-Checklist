import { boxThemeStyle, resolveBoxTheme } from "../box-themes";
import { GROUP_COLORS } from "../app-config";
import { availabilityForEntry, requiresPokemonBank } from "../collection-features";
import { groupName } from "../translations";
import { pokemonArtworkUrl } from "../catalog-planner";
import { assetUrl } from "../app-utils";
import { BankBadge, FavoriteButton, OriginMarkIcon, PokemonArtwork, originMarkIconUrl } from "../components/ui-controls";
import type { AppController } from "../hooks/use-app-controller";

type BoxViewProps = { app: AppController };

export function BoxView({ app }: BoxViewProps) {
  const {
    language,
    owned,
    favorites,
    pageIndex,
    setPageIndex,
    setSelectedBoxIndex,
    keyboardSlotIndex,
    setKeyboardSlotIndex,
    highlightedPlanId,
    globalReturnContext,
    setGlobalReturnContext,
    query,
    missingOnly,
    favoritesOnly,
    homeChallengesOnly,
    pokewalkerOnly,
    setDetailEntry,
    themeConfig,
    highlightedEntryRef,
    locale,
    t,
    displayName,
    displayForm,
    boxes,
    entryIsOwned,
    capacityBoxes,
    totalPages,
    selectedBox,
    activeBoxTheme,
    pageBoxes,
    matchesSearch,
    globalReturnLabel,
    returnToGlobalResults,
    toggleOwned,
    toggleFavorite,
    toggleEntries,
    availabilityFiltering,
    visiblePageEntries,
    pageAllOwned,
  } = app;
  return !selectedBox ? (
            <>
              <div className="view-heading page-heading">
                <div><p className="eyebrow teal">{t("page_view")}</p><h2>{t("page")} {pageIndex + 1}</h2><p>{t("page_desc")}</p></div>
                <div className="heading-metrics"><span><b>{boxes.length.toLocaleString(locale)}</b> {t("boxes_plan")}</span><span className={boxes.length > capacityBoxes ? "warning" : ""}><b>{capacityBoxes.toLocaleString(locale)}</b> {t("available")}</span></div>
              </div>

              <div className="page-grid" aria-label={`${t("page_view")} ${pageIndex + 1}`}>
                {pageBoxes.map((box, offset) => {
                  const globalIndex = pageIndex * 30 + offset;
                  const beyondCapacity = globalIndex >= capacityBoxes;
                  const matchCount = box?.entries.filter(matchesSearch).length ?? 0;
                  const boxOwned = box?.entries.filter(entryIsOwned).length ?? 0;
                  if (!box) return (
                    <div className={`box-tile empty ${beyondCapacity ? "locked" : ""}`} key={globalIndex}>
                      <span className="box-position">{String(offset + 1).padStart(2, "0")}</span><strong>{beyondCapacity ? t("no_capacity") : t("free")}</strong><small>{beyondCapacity ? t("outside_home") : t("box_available")}</small>
                    </div>
                  );
                  const previewLabel = box.entries.map((entry) => `${displayName(entry)}${displayForm(entry) ? ` ${displayForm(entry)}` : ""}`).join(", ");
                  const tileTheme = resolveBoxTheme(themeConfig, box.groupKey, box.number);
                  return (
                    <button aria-label={`${box.label}: ${previewLabel}`} className={`box-tile ${tileTheme.kind === "default" ? "" : "themed-box-tile"} ${beyondCapacity ? "overflow" : ""} ${(query || missingOnly || favoritesOnly || homeChallengesOnly || pokewalkerOnly || availabilityFiltering) && !matchCount ? "filtered-out" : ""}`} key={box.label} onClick={() => { setSelectedBoxIndex(globalIndex); setKeyboardSlotIndex(0); setGlobalReturnContext(null); }} style={boxThemeStyle(tileTheme)}>
                      <span className="box-position">{String(offset + 1).padStart(2, "0")}</span>
                      {originMarkIconUrl(box.groupKey) ? <OriginMarkIcon mark={box.groupKey} label={groupName(language, box.groupKey)} className="box-origin-mark" /> : <span className="mark-accent" style={{ background: GROUP_COLORS[box.groupKey] }} />}
                      <strong>{box.label}</strong><small>{boxOwned.toLocaleString(locale)} / {box.entries.length.toLocaleString(locale)} {t("obtained")}</small>
                      <span className="mini-grid">{Array.from({ length: 30 }, (_, index) => { const entry = box.entries[index]; return <i className={entry ? entryIsOwned(entry) ? "owned" : "pending" : "vacant"} key={index} />; })}</span>
                      <span className="box-preview" aria-hidden="true">{Array.from({ length: 30 }, (_, index) => { const entry = box.entries[index]; const url = entry ? pokemonArtworkUrl(entry) : null; return <span className={entry && entryIsOwned(entry) ? "owned" : ""} key={index}>{url && <img src={url} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</span>; })}</span>
                      {beyondCapacity && <em>{t("overflow")}</em>}
                    </button>
                  );
                })}
              </div>

              <footer className="view-footer">
                <button onClick={() => setPageIndex((value) => Math.max(0, value - 1))} disabled={pageIndex === 0}>{t("previous_page")}</button>
                <div className="page-dots">{Array.from({ length: totalPages }, (_, index) => <button aria-label={`${t("page")} ${index + 1}`} className={index === pageIndex ? "active" : ""} onClick={() => setPageIndex(index)} key={index}>{index + 1}</button>)}</div>
                <button onClick={() => setPageIndex((value) => Math.min(totalPages - 1, value + 1))} disabled={pageIndex === totalPages - 1}>{t("next_page")}</button>
                <button className="primary-action" onClick={() => toggleEntries(visiblePageEntries)}>{pageAllOwned ? t("unmark_page") : t("mark_page")}</button>
              </footer>
            </>
          ) : (
            <>
              {globalReturnContext && <button className="return-to-global" onClick={returnToGlobalResults}>{globalReturnLabel}</button>}
              <div className="view-heading box-detail-heading">
                <div><p className="eyebrow teal">{t("page").toUpperCase()} {Math.floor(selectedBox.globalIndex / 30) + 1} · {t("box")} {String((selectedBox.globalIndex % 30) + 1).padStart(2, "0")}</p><h2>{selectedBox.label}</h2><p>{t("box_instruction")}</p></div>
                <div className="detail-nav"><button onClick={() => setSelectedBoxIndex(Math.max(0, selectedBox.globalIndex - 1))} disabled={selectedBox.globalIndex === 0}>←</button><button onClick={() => setSelectedBoxIndex(null)}>{t("page_view_button")}</button><button onClick={() => setSelectedBoxIndex(Math.min(boxes.length - 1, selectedBox.globalIndex + 1))} disabled={selectedBox.globalIndex === boxes.length - 1}>→</button></div>
              </div>

              <div className={`box-theme-stage ${activeBoxTheme.kind === "default" ? "is-default" : "is-themed"}`} style={boxThemeStyle(activeBoxTheme)}>
                <div className="box-grid" aria-label={selectedBox.label}>
                {Array.from({ length: 30 }, (_, index) => {
                  const entry = selectedBox.entries[index];
                  if (!entry) return <div className="pokemon-slot vacant" key={index}><span className="slot-number">{String(index + 1).padStart(2, "0")}</span><span>{t("empty")}</span></div>;
                  const isOwned = entryIsOwned(entry);
                  const visible = matchesSearch(entry);
                  const localizedName = displayName(entry);
                  const localizedForm = displayForm(entry);
                  const requiredGender = entry.requirements?.gender;
                  const genderDetail = requiredGender ? t(requiredGender === "any" ? "any_gender" : requiredGender) : entry.gender ? t(entry.gender) : null;
                  const detail = [entry.displayDetail || localizedForm || `#${String(entry.dex).padStart(4, "0")}`, genderDetail].filter(Boolean).join(" · ");
                  const originMarkKey = entry.mark ?? entry.groupKey;
                  const favorite = favorites.has(entry.planId);
                  return (
                    <div ref={highlightedPlanId === entry.planId ? highlightedEntryRef : undefined} className={`pokemon-slot ${isOwned ? "owned" : "pending"} ${visible ? "" : "filtered-out"} ${highlightedPlanId === entry.planId ? "locating" : ""} ${keyboardSlotIndex === index ? "keyboard-selected" : ""}`} key={entry.planId}>
                      <button className="pokemon-slot-main" onClick={() => { setKeyboardSlotIndex(index); toggleOwned(entry); }} aria-pressed={isOwned}>
                        <span className="slot-number">{String(index + 1).padStart(2, "0")}</span>
                        <span className={`variant-badge ${entry.variant}`} aria-label={entry.variant === "shiny" ? t("shiny") : t("normal")} title={entry.variant === "shiny" ? t("shiny") : t("normal")}>{entry.variant === "shiny" ? <img className="shiny-symbol badge" src={assetUrl("assets/shiny.png")} alt="" /> : t("normal")}</span>
                        <PokemonArtwork entry={entry} owned={isOwned} displayName={localizedName} language={language} />
                        <TraitBadges requirements={entry.requirements} t={t} />
                        <strong>{localizedName}</strong><small>{detail} · {entry.ownOt ? t("your_ot") : t("foreign_ot")}</small>
                        {originMarkIconUrl(originMarkKey) && <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="slot-origin-mark" />}
                        {requiresPokemonBank(entry) && <BankBadge label={t("bank_required")} className="slot-bank-badge" />}
                        <span className="status-dot">{isOwned ? "✓" : ""}</span>
                      </button>
                      <FavoriteButton active={favorite} label={t(favorite ? "remove_favorite" : "add_favorite")} onClick={() => toggleFavorite(entry.planId)} className="slot-favorite" />
                      <button className="slot-info" aria-label={`${t("open_details")}: ${localizedName}`} title={t("open_details")} onClick={() => setDetailEntry({ entry, box: selectedBox, slotIndex: index })}>i</button>
                      <div className="slot-tooltip" role="tooltip">
                        <strong>{localizedName}{localizedForm && <><span> — </span>{localizedForm}</>}</strong>
                        <b className={entry.variant}>{entry.variant === "shiny" && <img src={assetUrl("assets/shiny.png")} alt="" />}{entry.variant === "shiny" ? t("shiny") : t("normal")}</b>
                        <span><em>{entry.genericEntry ? t("generic_specimen") : entry.mark ? t("origin_marks") : t("special_collections")}</em>{entry.genericEntry ? <span>{t("no_origin_required")}</span> : originMarkIconUrl(originMarkKey) ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="tooltip-origin-mark" /> : <span>{entry.groupLabel}</span>}</span>
                        <span><em>{t("availability_label")}</em><span className={`tooltip-availability ${availabilityForEntry(entry)}`}>{t(`availability_${availabilityForEntry(entry)}`)}</span></span>
                        {requiresPokemonBank(entry) && <BankBadge label={t("bank_required")} className="tooltip-bank-badge" />}
                        <span><em>{t("box")} · {t("slot")}</em>{String(selectedBox.globalIndex + 1).padStart(3, "0")} · {String(index + 1).padStart(2, "0")}</span>
                        <span className={isOwned ? "owned" : "pending"}>{isOwned ? t("status_obtained") : t("status_missing")}</span>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              <footer className="box-footer">
                <span><b>{selectedBox.entries.filter(entryIsOwned).length.toLocaleString(locale)}</b> {t("obtained")}</span><span><b>{selectedBox.entries.filter((entry) => !entryIsOwned(entry)).length.toLocaleString(locale)}</b> {t("pending")}</span>
                <button className="primary-action" onClick={() => toggleEntries(selectedBox.entries)}>{selectedBox.entries.every(entryIsOwned) ? t("unmark_box") : t("mark_box")}</button>
              </footer>
            </>
          );
}
import { TraitBadges } from "../components/specimen-trait-controls";
