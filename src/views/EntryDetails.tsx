import { useEffect, useRef } from "react";
import { groupName, localizeCatalogText } from "../translations";
import { SPECIMEN_TRAITS, TRAIT_LABELS, traitEligible } from "../specimen-traits";
import { TraitBadges, TraitSwitch } from "../components/specimen-trait-controls";
import { encounterMarkLabel } from "../encounter-marks";
import { localizeHomeChallengeTitle } from "../home-challenges";
import { availabilityForEntry, methodKeyForEntry, reasonKeyForEntry, requiresPokemonBank, transferKeyForEntry } from "../collection-features";
import { pokemonArtworkUrl } from "../catalog-planner";
import { assetUrl } from "../app-utils";
import { BankBadge, FavoriteButton, OriginMarkIcon, originMarkIconUrl } from "../components/ui-controls";
import type { AppController } from "../hooks/use-app-controller";

type EntryDetailsProps = { app: AppController };

export function EntryDetails({ app }: EntryDetailsProps) {
  const {
    pokemonNames,
    language,
    favorites,
    detailEntry,
    setDetailEntry,
    locatedEntries,
    databaseChoiceByPlanId,
    traitAvailability,
    setEntryTrait,
    t,
    displayName,
    displayForm,
    displayNote,
    homeChallengesByDex,
    toggleFavorite,
  } = app;
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!detailEntry || !dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.focus();
    const keepFocusInDetails = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    dialog.addEventListener("keydown", keepFocusInDetails);
    return () => {
      dialog.removeEventListener("keydown", keepFocusInDetails);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [detailEntry]);
  if (!detailEntry || !pokemonNames) return null;
        const located = locatedEntries.find((located) => located.entry.planId === detailEntry.entry.planId);
        const { box, slotIndex } = located ?? detailEntry;
        const entry = located?.entry ?? databaseChoiceByPlanId?.get(detailEntry.entry.planId) ?? detailEntry.entry;
        const requirements = entry.requirements ?? {};
        const requiredGender = requirements.gender ? t(requirements.gender === "any" ? "any_gender" : requirements.gender) : null;
        const localizedName = displayName(entry);
        const localizedForm = displayForm(entry);
        const artworkUrl = pokemonArtworkUrl(entry);
        const originMarkKey = entry.mark ?? entry.groupKey;
        const originLabel = entry.mark ? groupName(language, entry.mark) : entry.groupLabel;
        const availability = availabilityForEntry(entry);
        const favorite = favorites.has(entry.planId);
        const matchingHomeChallenges = homeChallengesByDex.get(entry.dex) ?? [];
        return <div className="entry-modal-layer">
          <button className="entry-modal-scrim" aria-label={t("close_details")} onClick={() => setDetailEntry(null)} />
          <section ref={dialogRef} className="entry-dialog" role="dialog" aria-modal="true" aria-labelledby="entry-dialog-title" tabIndex={-1}>
            <header className="entry-dialog-header">
              <div className="entry-dialog-identity">
                {artworkUrl && <img className="entry-dialog-art" src={artworkUrl} alt="" />}
                <div><p className="eyebrow teal">#{String(entry.dex).padStart(4, "0")} · {t("entry_details")}</p><h2 id="entry-dialog-title">{localizedName}{localizedForm && <span> — {localizedForm}</span>}</h2></div>
              </div>
              <div className="entry-dialog-actions"><FavoriteButton active={favorite} label={t(favorite ? "remove_favorite" : "add_favorite")} onClick={() => toggleFavorite(entry.planId)} /><button className="entry-dialog-close" aria-label={t("close_details")} onClick={() => setDetailEntry(null)}>×</button></div>
            </header>
            <div className="entry-badges">
              <TraitBadges requirements={entry.requirements} t={t} />
              {entry.genericEntry ? <span className="entry-origin-chip">{t("generic_specimen")}</span> : originMarkIconUrl(originMarkKey) ? <span className="entry-origin-chip"><OriginMarkIcon mark={originMarkKey} label={originLabel} className="detail-origin-mark" />{originLabel}</span> : <span className="entry-origin-chip">{entry.groupLabel}</span>}
              <span className={`availability-badge ${availability}`}>{t(`availability_${availability}`)}</span>
              {requiresPokemonBank(entry) && <BankBadge label={t("bank_required")} />}
              <span className={`variant-chip ${entry.variant}`}>{entry.variant === "shiny" && <img src={assetUrl("assets/shiny.png")} alt="" />}{entry.variant === "shiny" ? t("shiny") : t("normal")}</span>
            </div>
            <div className="entry-trait-controls">
              {SPECIMEN_TRAITS.filter((trait) => traitEligible(entry, trait, traitAvailability)).map((trait) =>
                <TraitSwitch key={trait} id={`detail-${trait}`} trait={trait} label={t(TRAIT_LABELS[trait])} checked={entry.requirements?.[trait] === true} onChange={(checked) => setEntryTrait(entry.planId, trait, checked)} />
              )}
            </div>
            <dl className="entry-facts">
              <div><dt>{t("origin_required")}</dt><dd>{entry.genericEntry ? t("no_origin_required") : originLabel}</dd></div>
              <div><dt>{t("method")}</dt><dd>{t(methodKeyForEntry(entry))}{entry.game ? ` · ${localizeCatalogText(language, entry.game)}` : ""}</dd></div>
              <div><dt>{t("transfer")}</dt><dd>{t(transferKeyForEntry(entry))}</dd></div>
              <div><dt>{t("shiny_available")}</dt><dd>{entry.shinyEligible ? t("yes") : t("shiny_locked")}</dd></div>
              <div><dt>{t("own_ot_possible")}</dt><dd>{entry.ownOt ? t("yes") : t("no")}</dd></div>
              {requiredGender && <div><dt>{t("required_gender")}</dt><dd>{requiredGender}</dd></div>}
              {requirements.originGame && <div><dt>{t("origin_game")}</dt><dd>{entry.collection === "battle-bond" ? t("battle_bond_origin") : localizeCatalogText(language, requirements.originGame)}</dd></div>}
              {requirements.originGeneration && <div><dt>{t("origin_generation")}</dt><dd>{t("generation")} {requirements.originGeneration}</dd></div>}
              {requirements.originRegion && <div><dt>{t("origin_region")}</dt><dd>{groupName(language, requirements.originRegion)}</dd></div>}
              {requirements.pokemonLanguage && <div><dt>{t("pokemon_language")}</dt><dd>{requirements.pokemonLanguage}</dd></div>}
              {requirements.encounterMark && <div><dt>{t("encounter_mark")}</dt><dd>{encounterMarkLabel(requirements.encounterMark, t)}</dd></div>}
              {entry.level && <div><dt>{t("level")}</dt><dd>{entry.level}</dd></div>}
              {entry.trainerName && <div><dt>{t("original_trainer")}</dt><dd>{entry.trainerName}</dd></div>}
              {entry.trainerId && <div><dt>{t("trainer_id")}</dt><dd>{entry.trainerId}</dd></div>}
              {(requirements.ball || entry.ball) && <div><dt>{t("ball")}</dt><dd>{requirements.ball ?? entry.ball}</dd></div>}
              {(requirements.nature || entry.nature) && <div><dt>{t("nature")}</dt><dd>{requirements.nature ?? entry.nature}</dd></div>}
              {(requirements.ability || entry.ability) && <div><dt>{t("ability")}</dt><dd>{(requirements.ability ?? entry.ability) === "Battle Bond" ? t("battle_bond_ability") : requirements.ability ?? entry.ability}</dd></div>}
              {requirements.teraType && <div><dt>{t("tera_type")}</dt><dd>{requirements.teraType}</dd></div>}
              {(requirements.heldItem || entry.heldItem) && <div><dt>{t("held_item")}</dt><dd>{requirements.heldItem ?? entry.heldItem}</dd></div>}
              {(requirements.moves?.length || entry.moves?.length) && <div><dt>{t("moves")}</dt><dd>{(requirements.moves ?? entry.moves)?.join(" · ")}</dd></div>}
              {(requirements.ribbons?.length || entry.ribbons?.length) && <div><dt>{t("ribbons")}</dt><dd>{(requirements.ribbons ?? entry.ribbons)?.join(" · ")}</dd></div>}
              {(entry.startDate || entry.endDate) && <div><dt>{t("event_period")}</dt><dd>{[entry.startDate, entry.endDate].filter(Boolean).join(" — ")}</dd></div>}
              {box && <div><dt>{t("location")}</dt><dd>{t("box")} {String(box.globalIndex + 1).padStart(3, "0")} · {t("slot")} {String(slotIndex + 1).padStart(2, "0")}</dd></div>}
            </dl>
            {matchingHomeChallenges.length > 0 && <section className="entry-home-challenges">
              <h3>{t("home_challenges_met")}</h3>
              <p>{t("home_challenges_met_desc")}</p>
              <ul>{matchingHomeChallenges.map((challenge) => <li key={challenge.id}>{localizeHomeChallengeTitle(language, challenge, pokemonNames)}</li>)}</ul>
            </section>}
            <section className="entry-explanation"><h3>{t("why_exists")}</h3><p>{t(reasonKeyForEntry(entry))}</p></section>
            <section className="entry-catalog-note"><h3>{t("catalog_note")}</h3>{entry.displayDetail && <p><strong>{localizeCatalogText(language, entry.displayDetail)}</strong></p>}<p>{displayNote(entry)}</p>{entry.sourceLabel && (entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer">{localizeCatalogText(language, entry.sourceLabel)} ↗</a> : <small>{localizeCatalogText(language, entry.sourceLabel)}</small>)}</section>
          </section>
        </div>;
}
