/** HOME uses separate image filenames for sea forms, not separate numeric art IDs. */
export function seaFormSpriteKey(entry: { dex?: number; form?: string | null }): string | null {
  if (entry.dex !== 422 && entry.dex !== 423) return null;
  const sea = entry.form === "East Sea" ? "east" : entry.form === "West Sea" ? "west" : null;
  return sea ? `${String(entry.dex).padStart(4, "0")}-${sea}` : null;
}

