import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildGalleryRows, visibleGalleryRows } from "../global-window";

export function VirtualGallery<T>({ groups, grouped, label, renderEntry }: { groups: { key: string; label: string; entries: T[] }[]; grouped: boolean; label: string; renderEntry: (entry: T) => ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 770, top: 0, height: 800 });
  const [focused, setFocused] = useState<number | null>(null);
  const pendingFocus = useRef<number | null>(null);
  const layout = useMemo(() => buildGalleryRows(groups, viewport.width, grouped), [groups, grouped, viewport.width]);
  const rows = visibleGalleryRows(layout.rows, viewport.top, viewport.height, focused);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = root.current?.getBoundingClientRect();
        if (bounds) setViewport({ width: bounds.width, top: -bounds.top, height: window.innerHeight });
      });
    };
    const observer = new ResizeObserver(update);
    if (root.current) observer.observe(root.current);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    root.current?.querySelector<HTMLButtonElement>(`[data-gallery-index="${pendingFocus.current}"] .global-pokemon`)?.focus({ preventScroll: true });
    pendingFocus.current = null;
  });
  return <div ref={root} className="virtual-global-gallery" role="list" aria-label={label} style={{ height: layout.height }} onFocusCapture={(event) => {
    const index = event.target.closest<HTMLElement>("[data-gallery-index]")?.dataset.galleryIndex;
    if (index !== undefined) setFocused(Number(index));
  }} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(null); }} onKeyDown={(event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>("[data-gallery-index]");
    if (!item) return;
    const index = Number(item.dataset.galleryIndex);
    const delta = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: layout.columns, ArrowUp: -layout.columns, PageDown: layout.columns * 6, PageUp: -layout.columns * 6 } as Record<string, number>)[event.key];
    let target = event.key === "Home" ? 0 : event.key === "End" ? layout.count - 1 : delta === undefined ? null : Math.max(0, Math.min(layout.count - 1, index + delta));
    // Tab continues to the next unmounted row instead of skipping the collection.
    if (event.key === "Tab") {
      const isMain = (event.target as HTMLElement).classList.contains("global-pokemon");
      const candidate = index + (event.shiftKey ? -1 : 1);
      if (((event.shiftKey && isMain) || (!event.shiftKey && !isMain)) && candidate >= 0 && candidate < layout.count && !root.current?.querySelector(`[data-gallery-index="${candidate}"]`)) target = candidate;
    }
    if (target === null) return;
    event.preventDefault();
    const row = layout.rows.find((row) => row.entries.length && target! >= row.start && target! < row.start + row.entries.length);
    if (!row || !root.current) return;
    const bounds = root.current.getBoundingClientRect();
    if (bounds.top + row.top < 100 || bounds.top + row.top + row.height > window.innerHeight) window.scrollTo({ top: window.scrollY + bounds.top + row.top - 100, behavior: "instant" });
    pendingFocus.current = target;
    setFocused(target);
    setViewport((current) => ({ ...current, top: window.scrollY - (window.scrollY + bounds.top) }));
  }}>
    {rows.map((row) => <div key={row.top} className={row.label ? "global-group-heading virtual-group-heading" : "global-gallery virtual-gallery-row"} style={{ position: "absolute", top: row.top, left: 0, right: 0, height: row.height, gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))` }}>
      {row.label ? <h3>{row.label}<span aria-hidden="true">—</span><b>{row.count}</b></h3> : row.entries.map((entry, index) => <div key={row.start + index} role="listitem" aria-posinset={row.start + index + 1} aria-setsize={layout.count} data-gallery-index={row.start + index}>{renderEntry(entry)}</div>)}
    </div>)}
  </div>;
}
