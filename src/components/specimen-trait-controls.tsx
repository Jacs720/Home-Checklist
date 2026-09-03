import { SPECIMEN_TRAITS, TRAIT_ICONS, TRAIT_LABELS, type SpecimenTrait } from "../specimen-traits";

import { assetUrl } from "../app-utils";
import { ENCOUNTER_MARK_BADGES } from "../encounter-marks";
const traitIconUrl = (trait: SpecimenTrait) => assetUrl(`assets/${TRAIT_ICONS[trait]}`);

export function TraitSwitch({ id, trait, label, checked, onChange }: {
  id: string; trait: SpecimenTrait; label: string; checked: boolean; onChange: (checked: boolean) => void;
}) {
  return <label className={`switch-row specimen-trait-switch ${checked ? "active" : ""}`} htmlFor={id}>
    <span className="trait-label"><img className="trait-icon" src={traitIconUrl(trait)} alt="" /><b>{label}</b></span>
    <input id={id} type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>;
}

export function TraitBadges({ requirements, t }: {
  requirements?: { alpha?: boolean; gmaxFactor?: boolean; encounterMark?: string; ribbons?: string[] }; t: (key: string) => string;
}) {
  const active = SPECIMEN_TRAITS.filter((trait) => requirements?.[trait]);
  const encounterBadge = ENCOUNTER_MARK_BADGES[requirements?.encounterMark ?? ""];
  const partnerRibbon = requirements?.ribbons?.includes("Partner Ribbon");
  if (!active.length && !encounterBadge && !partnerRibbon) return null;
  return <span className="specimen-trait-badges">{active.map((trait) =>
    <img key={trait} className="trait-icon" src={traitIconUrl(trait)} alt={t(TRAIT_LABELS[trait])} title={t(TRAIT_LABELS[trait])} />
  )}{encounterBadge && <img className="trait-icon encounter-mark-icon" src={assetUrl(`assets/${encounterBadge.icon}`)} alt={t(encounterBadge.labelKey)} title={t(encounterBadge.labelKey)} />}{partnerRibbon && <img className="trait-icon partner-ribbon-icon" src={assetUrl("assets/partner-ribbon.png")} alt={t("partner_ribbon")} title={t("partner_ribbon")} />}</span>;
}
