import { type ChangeEvent, type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { ORIGIN_MARK_COLORS, ORIGIN_MARK_ICONS } from "../app-config";
import type { PlannedEntry, SelectOption } from "../app-types";
import { assetUrl } from "../app-utils";
import { pokemonArtworkUrl } from "../catalog-planner";
import { copy, type UiLanguage } from "../translations";

export function CompactCheckbox({ checked, onChange, accent }: { checked: boolean; onChange: () => void; accent: string }) {
  return <span className="compact-checkbox" style={{ "--checkbox-accent": accent } as CSSProperties}><input type="checkbox" checked={checked} onChange={onChange} /></span>;
}

export function OriginMarkChip({ mark, label, count, selected, onClick }: { mark: string; label: string; count: string; selected: boolean; onClick: () => void }) {
  const colors = ORIGIN_MARK_COLORS[mark] ?? { from: "#66827e", to: "#8aa5a3" };
  return <button
    type="button"
    className={`origin-mark-chip ${selected ? "active" : ""}`}
    aria-label={`${label}: ${count}`}
    aria-pressed={selected}
    onClick={onClick}
    style={{ "--mark-from": colors.from, "--mark-to": colors.to } as CSSProperties}
  >
    <span className="origin-mark-chip-dot" aria-hidden="true" />
    <span className="origin-mark-chip-label">{label}</span>
    <em>{count}</em>
  </button>;
}

export function originMarkIconUrl(mark?: string) {
  const filename = mark ? ORIGIN_MARK_ICONS[mark] : undefined;
  return filename ? assetUrl(`assets/origin-marks/${filename}`) : null;
}

export function OriginMarkIcon({ mark, label, className = "" }: { mark: string; label: string; className?: string }) {
  const src = originMarkIconUrl(mark);
  if (!src) return <span className={className}>{label}</span>;
  return <span className={`origin-mark-icon ${className}`} title={label}><img src={src} alt="" /><span className="sr-only">{label}</span></span>;
}

export function FavoriteButton({ active, label, onClick, className = "" }: { active: boolean; label: string; onClick: () => void; className?: string }) {
  return <button type="button" className={`favorite-star ${active ? "active" : ""} ${className}`} aria-pressed={active} aria-label={label} title={label} onClick={onClick}>
    <img src={assetUrl("assets/favorite-star.png")} alt="" />
  </button>;
}

export function BankBadge({ label, className = "" }: { label: string; className?: string }) {
  return <span className={`bank-badge ${className}`} title={label}><img src={assetUrl("assets/bank.png")} alt="" /><span>{label}</span></span>;
}

export function StyledSelect<T extends string | number>({ value, options, onChange, ariaLabel, className = "", placeholder }: { value: T; options: SelectOption<T>[]; onChange: (value: T) => void; ariaLabel: string; className?: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); window.removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  return <div className={`styled-select ${open ? "open" : ""} ${className}`} ref={rootRef}>
    <button type="button" className="styled-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <span>{selected?.icon}{selected?.label ?? placeholder ?? ariaLabel}</span><b aria-hidden="true">⌄</b>
    </button>
    {open && <div className="styled-select-options" role="listbox" aria-label={ariaLabel}>{options.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? "active" : ""} key={String(option.value)} onClick={() => { onChange(option.value); setOpen(false); }}>{option.icon}<span>{option.label}</span></button>)}</div>}
  </div>;
}

export function GooeyCheckbox({ id, checked, onChange }: { id: string; checked: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  const filterId = `goo-${useId().replace(/:/g, "")}`;
  return (
    <span className="gooey-checkbox">
      <span className="gooey-control">
        <input id={id} type="checkbox" checked={checked} onChange={onChange} />
        <span className="gooey-splash" style={{ filter: `url(#${filterId})` }} />
        <svg className="gooey-check" width="15" height="14" viewBox="0 0 15 14" fill="none" aria-hidden="true"><path d="M2 8.36364L6.23077 12L13 2" /></svg>
      </span>
      <svg className="gooey-filter" aria-hidden="true"><defs><filter id={filterId}><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7" result="goo" /><feBlend in="SourceGraphic" in2="goo" /></filter></defs></svg>
    </span>
  );
}

export function PokemonArtwork({ entry, owned, displayName, language }: { entry: PlannedEntry; owned: boolean; displayName: string; language: UiLanguage }) {
  const [failed, setFailed] = useState(false);
  const url = pokemonArtworkUrl(entry);

  if (!url || failed) return <span className="art-placeholder" aria-label={copy(language, "official_art_pending")} />;
  return <img className="pokemon-art" src={url} alt={`${copy(language, "official_art")} ${displayName}`} onError={() => setFailed(true)} data-owned={owned} />;
}
