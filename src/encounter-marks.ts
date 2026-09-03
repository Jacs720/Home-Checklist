// Encounter marks describe the specimen, independently of its game-of-origin symbol.
export const ENCOUNTER_MARK_BADGES: Record<string, { icon: string; labelKey: string }> = {
  "Mightiest Mark": { icon: "mightiest-mark.png", labelKey: "mightiest_mark" },
  "Titan Mark": { icon: "titan-mark.png", labelKey: "titan_mark" },
};

export function encounterMarkLabel(mark: string, t: (key: string) => string) {
  const badge = ENCOUNTER_MARK_BADGES[mark];
  return badge ? t(badge.labelKey) : mark;
}
