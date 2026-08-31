type PackableEntry = {
  groupKey: string;
  groupLabel: string;
};

type PackableBox<T extends PackableEntry> = {
  globalIndex: number;
  groupKey: string;
  number: number;
  label: string;
  entries: T[];
};

export function packBoxesContinuously<T extends PackableEntry>(
  boxes: PackableBox<T>[],
  enabled: boolean,
  capacity = 30,
) {
  if (!enabled || boxes.length < 2) return boxes;

  const entries = boxes.flatMap((box) => box.entries);
  const groupBoxCounts = new Map<string, number>();
  const packed: PackableBox<T>[] = [];

  for (let offset = 0; offset < entries.length; offset += capacity) {
    const boxEntries = entries.slice(offset, offset + capacity);
    const groups: Array<{ key: string; label: string }> = [];

    for (const entry of boxEntries) {
      if (!groups.some((group) => group.key === entry.groupKey)) {
        groups.push({ key: entry.groupKey, label: entry.groupLabel });
      }
    }

    const numberedLabels = groups.map((group) => {
      const number = (groupBoxCounts.get(group.key) ?? 0) + 1;
      groupBoxCounts.set(group.key, number);
      return `${group.label} ${String(number).padStart(2, "0")}`;
    });
    const firstGroup = groups[0];
    const firstGroupNumber = groupBoxCounts.get(firstGroup.key) ?? 1;
    const label = numberedLabels.length <= 2
      ? numberedLabels.join(" + ")
      : `${numberedLabels.slice(0, 2).join(" + ")} +${numberedLabels.length - 2}`;

    packed.push({
      globalIndex: packed.length,
      groupKey: firstGroup.key,
      number: firstGroupNumber,
      label,
      entries: boxEntries,
    });
  }

  return packed;
}
