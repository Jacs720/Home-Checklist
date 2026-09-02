import type { PlannedEntry } from "../app-types";
import { assetUrl } from "../app-utils";
import { pokemonArtworkUrl } from "../catalog-planner";
import { OriginMarkIcon, originMarkIconUrl } from "./ui-controls";

type DatabaseChoiceCardProps = {
  entry: PlannedEntry;
  name: string;
  form: string | null;
  selected: boolean;
  detailsLabel: string;
  onToggle: () => void;
  onDetails: () => void;
};

export function DatabaseChoiceCard({ entry, name, form, selected, detailsLabel, onToggle, onDetails }: DatabaseChoiceCardProps) {
  const artworkUrl = pokemonArtworkUrl(entry);
  const originMarkKey = entry.mark ?? entry.groupKey;

  return <article className={`database-choice-card${selected ? " selected" : ""}`}>
    <button type="button" className="database-choice-select" aria-pressed={selected} onClick={onToggle}>
      <span className="database-choice-artwork">
        {artworkUrl && <img className="database-pokemon-art" src={artworkUrl} alt="" loading="lazy" />}
        {entry.variant === "shiny" && <img className="database-shiny" src={assetUrl("assets/shiny.png")} alt="" />}
      </span>
      <b>{name}</b><small>{form ?? `#${String(entry.dex).padStart(4, "0")}`}</small>
      {originMarkIconUrl(originMarkKey)
        ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="database-origin-mark" />
        : <em>{entry.groupLabel}</em>}
    </button>
    <button type="button" className="database-choice-info" aria-label={`${detailsLabel}: ${name}${form ? ` — ${form}` : ""}${entry.displayDetail ? ` · ${entry.displayDetail}` : ""}`} title={detailsLabel} onClick={onDetails}>i</button>
  </article>;
}
