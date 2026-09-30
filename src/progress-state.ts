import type { PlannedEntry, ProgressSnapshot } from "./app-types";

export function progressKey(entry: PlannedEntry, livingDex: boolean) {
  return livingDex ? `living:${entry.dex}` : entry.genericEntry ? entry.planId : null;
}
export function changeEntryProgress(snapshot: ProgressSnapshot, entry: PlannedEntry, obtained: boolean, livingDex: boolean) {
  const key = progressKey(entry, livingDex);
  if (key) {
    if (obtained) snapshot.progressExclusions.delete(key); else snapshot.progressExclusions.add(key);
  }
  if (livingDex) {
    if (obtained) snapshot.livingDexOwned.add(entry.dex); else snapshot.livingDexOwned.delete(entry.dex);
  } else {
    if (obtained) snapshot.owned.add(entry.planId); else snapshot.owned.delete(entry.planId);
  }
}
