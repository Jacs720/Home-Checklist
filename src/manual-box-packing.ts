export type ManualBoxSource = { key: string; label: string; planIds: string[] };
export type ManualBoxMerge = { id: string; sources: ManualBoxSource[] };
type Box<T> = { globalIndex: number; groupKey: string; number: number; label: string; entries: T[]; manualMergeId?: string };
type Entry = { planId: string };

export function boxLayoutKey(box: Pick<Box<Entry>, "groupKey" | "number" | "manualMergeId">) {
  return box.manualMergeId ? `manual:${box.manualMergeId}` : `${box.groupKey}:${box.number}`;
}

/** Reject malformed backups rather than moving incomplete or ambiguous boxes. */
export function parseManualBoxMerges(value: unknown): ManualBoxMerge[] {
  if (!Array.isArray(value)) return [];
  const result: ManualBoxMerge[] = [];
  const ids = new Set<string>();
  for (const candidate of value.slice(0, 500)) {
    if (!candidate || typeof candidate !== "object" || typeof candidate.id !== "string" || !/^[\w-]{1,80}$/.test(candidate.id) || ids.has(candidate.id)) continue;
    if (!Array.isArray(candidate.sources) || candidate.sources.length < 2 || candidate.sources.length > 30) continue;
    const sources: ManualBoxSource[] = [];
    for (const source of candidate.sources) {
      if (!source || typeof source.key !== "string" || !source.key || source.key.length > 200 || typeof source.label !== "string") break;
      if (!Array.isArray(source.planIds) || !source.planIds.length || source.planIds.length > 29 || source.planIds.some((id: unknown) => typeof id !== "string" || !id || id.length > 300)) break;
      sources.push({ key: source.key, label: source.label.slice(0, 200), planIds: [...source.planIds] });
    }
    const planIds = sources.flatMap((source) => source.planIds);
    if (sources.length !== candidate.sources.length || planIds.length > 30 || new Set(planIds).size !== planIds.length || new Set(sources.map((source) => source.key)).size !== sources.length) continue;
    ids.add(candidate.id);
    result.push({ id: candidate.id, sources });
  }
  return result;
}

/** Source membership must still match: filters must never redirect an old merge. */
export function applyManualBoxMerges<T extends Entry>(boxes: Box<T>[], merges: ManualBoxMerge[]) {
  const byKey = new Map(boxes.map((box) => [boxLayoutKey(box), box]));
  const occupied = new Set<string>();
  const replacements = new Map<string, Box<T>>();
  const activeIds = new Set<string>();
  for (const merge of merges) {
    const sources = merge.sources.map((source) => byKey.get(source.key));
    if (sources.length < 2 || new Set(merge.sources.map((source) => source.key)).size !== sources.length) continue;
    if (merge.sources.some((source, index) => {
      const box = sources[index];
      return !box || occupied.has(source.key) || box.entries.length !== source.planIds.length || box.entries.some((entry, i) => entry.planId !== source.planIds[i]);
    })) continue;
    const resolved = sources as Box<T>[];
    const entries = resolved.flatMap((box) => box.entries);
    if (!entries.length || entries.length > 30 || new Set(entries.map((entry) => entry.planId)).size !== entries.length) continue;
    merge.sources.forEach((source) => occupied.add(source.key));
    replacements.set(merge.sources[0].key, {
      ...resolved[0], entries, manualMergeId: merge.id, label: resolved.map((box) => box.label).join(" + "),
    });
    activeIds.add(merge.id);
  }
  const packed = boxes.flatMap((box) => {
    const key = boxLayoutKey(box);
    const replacement = replacements.get(key);
    return replacement ? [replacement] : occupied.has(key) ? [] : [box];
  }).map((box, globalIndex) => box.globalIndex === globalIndex ? box : { ...box, globalIndex });
  return { boxes: packed, activeIds };
}

export function combineManualBoxes<T extends Entry>(boxes: Box<T>[], merges: ManualBoxMerge[], targetKey: string, donorKey: string, id: string): ManualBoxMerge[] | null {
  if (targetKey === donorKey || merges.some((merge) => merge.id === id)) return null;
  const current = applyManualBoxMerges(boxes, merges).boxes;
  const target = current.find((box) => boxLayoutKey(box) === targetKey);
  const donor = current.find((box) => boxLayoutKey(box) === donorKey);
  if (!target || !donor || !target.entries.length || !donor.entries.length || target.entries.length + donor.entries.length > 30) return null;
  const sourcesFor = (box: Box<T>): ManualBoxSource[] => box.manualMergeId
    ? merges.find((merge) => merge.id === box.manualMergeId)!.sources
    : [{ key: boxLayoutKey(box), label: box.label, planIds: box.entries.map((entry) => entry.planId) }];
  const next = { id, sources: [...sourcesFor(target), ...sourcesFor(donor)] };
  if (!parseManualBoxMerges([next]).length) return null;
  return [...merges.filter((merge) => merge.id !== target.manualMergeId && merge.id !== donor.manualMergeId), next];
}
