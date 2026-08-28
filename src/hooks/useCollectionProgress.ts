import { useCallback, useRef, useState } from "react";
import type { ProgressSnapshot } from "../app-types";

function changedSetEntries<T>(before: ReadonlySet<T>, after: ReadonlySet<T>) {
  let changes = 0;
  before.forEach((value) => { if (!after.has(value)) changes += 1; });
  after.forEach((value) => { if (!before.has(value)) changes += 1; });
  return changes;
}

export function useCollectionProgress() {
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [livingDexOwned, setLivingDexOwned] = useState<Set<number>>(new Set());
  const [undoDepth, setUndoDepth] = useState(0);
  const [changesSinceBackup, setChangesSinceBackup] = useState(0);
  const progressHistoryRef = useRef<ProgressSnapshot[]>([]);
  const livingDexProgressStoredRef = useRef(false);
  const livingDexMigrationCheckedRef = useRef(false);

  const rememberProgressChange = useCallback((nextOwned: Set<string>, nextLivingDexOwned: Set<number>) => {
    const changedEntries = changedSetEntries(owned, nextOwned) + changedSetEntries(livingDexOwned, nextLivingDexOwned);
    progressHistoryRef.current = [...progressHistoryRef.current.slice(-29), { owned: new Set(owned), livingDexOwned: new Set(livingDexOwned) }];
    setUndoDepth(progressHistoryRef.current.length);
    setOwned(nextOwned);
    setLivingDexOwned(nextLivingDexOwned);
    if (changedEntries) setChangesSinceBackup((current) => current + changedEntries);
  }, [livingDexOwned, owned]);

  const undoOwned = useCallback(() => {
    const previous = progressHistoryRef.current.pop();
    if (!previous) return;
    const changedEntries = changedSetEntries(owned, previous.owned) + changedSetEntries(livingDexOwned, previous.livingDexOwned);
    setOwned(previous.owned);
    setLivingDexOwned(previous.livingDexOwned);
    setUndoDepth(progressHistoryRef.current.length);
    if (changedEntries) setChangesSinceBackup((current) => current + changedEntries);
  }, [livingDexOwned, owned]);

  const clearProgressHistory = useCallback(() => {
    progressHistoryRef.current = [];
    setUndoDepth(0);
  }, []);

  return {
    owned,
    setOwned,
    livingDexOwned,
    setLivingDexOwned,
    undoDepth,
    setUndoDepth,
    changesSinceBackup,
    setChangesSinceBackup,
    progressHistoryRef,
    livingDexProgressStoredRef,
    livingDexMigrationCheckedRef,
    rememberProgressChange,
    undoOwned,
    clearProgressHistory,
  };
}
