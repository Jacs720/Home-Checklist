import { useEffect, useRef, useState } from "react";
import type { PlannedBox } from "../app-types";
import { boxLayoutKey, type ManualBoxMerge } from "../manual-box-packing";

type Props = {
  boxes: PlannedBox[];
  merges: ManualBoxMerge[];
  activeIds: ReadonlySet<string>;
  automatic: boolean;
  onUseManual: () => void;
  onCombine: (target: string, donor: string) => boolean;
  onSeparate: (id: string) => void;
  onClose: () => void;
  t: (key: string) => string;
};

export function ManualBoxPacking({ boxes, merges, activeIds, automatic, onUseManual, onCombine, onSeparate, onClose, t }: Props) {
  const [targetKey, setTargetKey] = useState("");
  const [donorKey, setDonorKey] = useState("");
  const [notice, setNotice] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key !== "Tab") return;
      const controls = dialog.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled)');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    dialog.addEventListener("keydown", keyboard);
    return () => { dialog.removeEventListener("keydown", keyboard); if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, [onClose]);
  const partial = boxes.filter((box) => box.entries.length > 0 && box.entries.length < 30);
  const target = partial.find((box) => boxLayoutKey(box) === targetKey);
  const candidates = target ? partial.filter((box) => boxLayoutKey(box) !== targetKey && box.entries.length + target.entries.length <= 30) : [];
  const donor = candidates.find((box) => boxLayoutKey(box) === donorKey);
  const canCombine = !automatic && Boolean(target && donor);
  const hasPair = partial.some((box, index) => partial.some((other, j) => index !== j && box.entries.length + other.entries.length <= 30));
  const boxLabel = (box: PlannedBox) => `${String(box.globalIndex + 1).padStart(3, "0")} · ${box.label} · ${box.entries.length}/30`;
  return <div className="entry-modal-layer manual-packing-layer">
    <button className="entry-modal-scrim" aria-label={t("packing_close")} onClick={onClose} tabIndex={-1} />
    <section ref={dialogRef} className="manual-packing-dialog" role="dialog" aria-modal="true" aria-labelledby="manual-packing-title" tabIndex={-1}>
      <header><div><p className="eyebrow teal">{t("save_space")}</p><h2 id="manual-packing-title">{t("manual_packing")}</h2></div><button aria-label={t("packing_close")} onClick={onClose}>×</button></header>
      <p>{t("packing_intro")}</p>
      {automatic && <div className="packing-auto-notice"><p>{t("packing_auto_paused")}</p><button onClick={onUseManual}>{t("packing_use_manual")}</button></div>}
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!canCombine) return;
        const success = onCombine(targetKey, donorKey);
        setNotice(success ? "packing_success" : "packing_failure");
        if (success) { setTargetKey(""); setDonorKey(""); }
      }}>
        <div className="packing-selectors">
          <label><span>{t("packing_destination")}</span><select aria-label={t("packing_destination")} disabled={automatic || !partial.length} value={target ? targetKey : ""} onChange={(event) => { setTargetKey(event.target.value); setDonorKey(""); setNotice(""); }}>
            <option value="">{t("packing_choose")}</option>{partial.map((box) => <option key={boxLayoutKey(box)} value={boxLayoutKey(box)}>{boxLabel(box)}</option>)}
          </select></label>
          <label><span>{t("packing_source")}</span><select aria-label={t("packing_source")} disabled={automatic || !target || !candidates.length} value={donor ? donorKey : ""} onChange={(event) => { setDonorKey(event.target.value); setNotice(""); }}>
            <option value="">{t("packing_choose")}</option>{candidates.map((box) => <option key={boxLayoutKey(box)} value={boxLayoutKey(box)}>{boxLabel(box)}</option>)}
          </select></label>
        </div>
        {!hasPair ? <p>{t("packing_no_pairs")}</p> : target && !candidates.length ? <p>{t("packing_no_match")}</p> : null}
        <div className="packing-preview" aria-live="polite">{target && donor && <>
          <strong>{target.entries.length} + {donor.entries.length} = {target.entries.length + donor.entries.length} / 30</strong>
          <span className="packing-slots" aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <i key={i} className={i < target.entries.length ? "packing-target" : i < target.entries.length + donor.entries.length ? "packing-donor" : ""} />)}</span>
        </>}</div>
        <button className="primary-action" disabled={!canCombine} type="submit">{t("packing_combine")}</button>
        <p className="packing-status" role="status">{notice && t(notice)}</p>
      </form>
      <section className="packing-saved" aria-labelledby="packing-saved-title"><h3 id="packing-saved-title">{t("packing_saved")}</h3>
        {merges.length ? <ul>{merges.map((merge) => {
          const combined = boxes.find((box) => box.manualMergeId === merge.id);
          return <li key={merge.id}><div><strong>{combined?.label ?? merge.sources.map((source) => source.label).join(" + ")}</strong><span>{merge.sources.reduce((sum, source) => sum + source.planIds.length, 0)} / 30 · {t(automatic ? "packing_auto_paused" : activeIds.has(merge.id) ? "packing_active" : "packing_filter_paused")}</span></div><button onClick={() => { onSeparate(merge.id); setNotice(""); }} aria-label={`${t("packing_separate")}: ${combined?.label ?? merge.sources.map((source) => source.label).join(" + ")}`}>{t("packing_separate")}</button></li>;
        })}</ul> : <p>{t("packing_empty")}</p>}
      </section>
      <footer><button onClick={onClose}>{t("packing_close")}</button></footer>
    </section>
  </div>;
}
