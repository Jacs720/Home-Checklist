export type GalleryRow<T> = { top: number; height: number; label?: string; count?: number; entries: T[]; start: number };
export function buildGalleryRows<T>(groups: { key: string; label: string; entries: T[] }[], width: number, grouped: boolean) {
  const columns = Math.max(1, Math.floor((width + 5) / 77));
  const rows: GalleryRow<T>[] = [];
  let top = 0, start = 0;
  for (const group of groups) {
    if (grouped) { rows.push({ top, height: 48, label: group.label, count: group.entries.length, entries: [], start }); top += 48; }
    for (let index = 0; index < group.entries.length; index += columns) {
      const entries = group.entries.slice(index, index + columns);
      rows.push({ top, height: 89, entries, start });
      top += 89; start += entries.length;
    }
    top += 22;
  }
  return { rows, height: top, columns, count: start };
}
export function visibleGalleryRows<T>(rows: GalleryRow<T>[], top: number, height: number, focusedIndex: number | null = null) {
  return rows.filter((row) => (row.top + row.height >= top - 350 && row.top <= top + height + 350) || (focusedIndex !== null && row.entries.length > 0 && focusedIndex >= row.start && focusedIndex < row.start + row.entries.length));
}
