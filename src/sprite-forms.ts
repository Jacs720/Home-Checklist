/** HOME uses separate image filenames for sea forms, not separate numeric art IDs. */
export function seaFormSpriteKey(entry: { dex?: number; form?: string | null }): string | null {
  if (entry.dex !== 422 && entry.dex !== 423) return null;
  const sea = entry.form === "East Sea" ? "east" : entry.form === "West Sea" ? "west" : null;
  return sea ? `${String(entry.dex).padStart(4, "0")}-${sea}` : null;
}

/** HOME seasonal sprites use named files rather than separate numeric art IDs. */
export function seasonalFormSpriteKey(entry: { dex?: number; form?: string | null }): string | null {
  if (entry.dex !== 585 && entry.dex !== 586) return null;
  const seasons: Record<string, string> = { Spring: "spring", Summer: "summer", Fall: "autumn", Autumn: "autumn", Winter: "winter" };
  const season = entry.form ? seasons[entry.form] : undefined;
  return season ? `${String(entry.dex).padStart(4, "0")}-${season}` : null;
}

