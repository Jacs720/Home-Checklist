import { useEffect, useMemo, useRef, useState } from "react";
import type { UiLanguage } from "./translations";
import { challengeCopy } from "./home-challenge-copy";
import { localizeHomeChallengeTitle } from "./home-challenges";
import type { ChallengeProgress, ChallengeStatus } from "./home-challenge-progress";
import type { HomeChallenge } from "./home-challenges";

type Props = {
  language: UiLanguage; locale: string; progress: ChallengeProgress[];
  pokemonNames: Record<string, Partial<Record<UiLanguage, string>>>;
  formLabel: (dex: number, form: string | null) => string | null;
  sourceUrl?: string;
};
const STATUS_ICON: Record<ChallengeStatus, string> = { complete: "✓", missing: "○", review: "?" };

function displayChallengeTitle(language: UiLanguage, challenge: HomeChallenge, pokemonNames: Props["pokemonNames"]) {
  const c = (key: Parameters<typeof challengeCopy>[1]) => challengeCopy(language, key);
  const source = challenge.title;
  let match = source.match(/^Deposit (\d+) Pokémon with an? (.+) Nature!/);
  if (match) return `${c("deposit")} Pokémon · ${c("nature")}: ${match[2]} ×${match[1]}`;
  match = source.match(/^Deposit Pokémon in an? (.+? Ball)( crafted in the Hisui region)?!/);
  if (match) return `${c("deposit")} Pokémon · ${c("ball")}: ${match[1]}${match[2] ? " · Hisui" : ""}`;
  match = source.match(/^Register (physical|special|status) moves!/);
  if (match) return `${c("register")} · ${c(match[1] as "physical" | "special" | "status")} ${c("moves").toLocaleLowerCase()}`;
  if (/^Register Abilities/.test(source)) return `${c("register")} · ${c("abilities")}`;
  if (/^Register alpha Pokémon/.test(source)) return `${c("register")} · ${c("alpha")}`;
  if (/Mightiest Mark/.test(source)) return `${c("deposit")} Pokémon · ${c("mightiest")}`;
  if (/Twinkling Star Ribbon/.test(source)) return `${c("register")} Pokémon · ${c("twinkling")}`;
  if (/all their effort levels maxed/.test(source)) return `${c("register")} Pokémon · ${c("effort")}`;
  if (source === "Deposit Shiny Pokémon!") return `${c("deposit")} · ${c("shiny")}`;
  return localizeHomeChallengeTitle(language, challenge, pokemonNames);
}
function categoryName(language: UiLanguage, challenge: HomeChallenge) {
  return challenge.category === "trade" ? challengeCopy(language, "trade") :
    challenge.category === "other" ? challengeCopy(language, "other") : challengeCopy(language, "pokemon");
}

export function HomeChallengeSummary({ language, locale, progress, pokemonNames, formLabel, sourceUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | ChallengeStatus>("all");
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const counts = useMemo(() => {
    const value = { complete: 0, missing: 0, review: 0, total: 0 };
    for (const row of progress) for (const level of row.levels) { value[level.status]++; value.total++; }
    return value;
  }, [progress]);
  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return progress.filter((row) => {
      if (filter !== "all" && !row.levels.some((level) => level.status === filter)) return false;
      if (!needle) return true;
      const names = row.challenge.dexes.map((dex) => pokemonNames[String(dex)]?.[language] ?? "").join(" ");
      return `${displayChallengeTitle(language, row.challenge, pokemonNames)} ${row.challenge.title} ${names}`.toLocaleLowerCase(locale).includes(needle);
    });
  }, [filter, language, locale, pokemonNames, progress, query]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  const c = (key: Parameters<typeof challengeCopy>[1]) => challengeCopy(language, key);
  const percentage = counts.total ? Math.round((counts.complete / counts.total) * 100) : 0;
  const filterOptions: Array<["all" | ChallengeStatus, string, number]> = [
    ["all", c("all"), counts.total], ["complete", c("complete"), counts.complete],
    ["missing", c("missing"), counts.missing], ["review", c("review"), counts.review],
  ];
  return <>
    <section className="summary-panel home-challenge-card" aria-labelledby="home-challenge-summary-title">
      <div className="summary-panel-heading">
        <span id="home-challenge-summary-title">Pokémon HOME Challenges</span>
        <b>{percentage}%</b>
      </div>
      <div className="home-challenge-overview">
        <div className="home-challenge-score"><strong>{counts.complete.toLocaleString(locale)}</strong><span>/ {counts.total.toLocaleString(locale)} {c("levels").toLocaleLowerCase(locale)}</span></div>
        <div className="progress-bar" aria-label={`${percentage}%`}><i style={{ width: `${percentage}%` }} /></div>
        <div className="home-challenge-statuses">
          <span className="complete">✓ {counts.complete.toLocaleString(locale)} {c("complete").toLocaleLowerCase(locale)}</span>
          <span className="missing">○ {counts.missing.toLocaleString(locale)} {c("missing").toLocaleLowerCase(locale)}</span>
          <span className="review">? {counts.review.toLocaleString(locale)} {c("review").toLocaleLowerCase(locale)}</span>
        </div>
        <p>{c("evidence")}</p>
        <button className="home-challenge-details-button" type="button" onClick={() => setOpen(true)}>{c("details")} <span aria-hidden="true">→</span></button>
      </div>
    </section>
    <dialog className="home-challenge-dialog" ref={dialogRef} onClose={() => setOpen(false)}>
      <div className="home-challenge-dialog-shell">
        <header>
          <div><p className="eyebrow teal">Pokémon HOME</p><h2>{c("challenges")}</h2><p>{c("countNote")}</p></div>
          <button className="home-challenge-close" type="button" onClick={() => setOpen(false)} aria-label={c("close")}>×</button>
        </header>
        <div className="home-challenge-toolbar">
          <label><span className="sr-only">{c("search")}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c("search")} type="search" /></label>
          <div className="home-challenge-filters" aria-label={c("challenges")}>{filterOptions.map(([value, label, count]) =>
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<b>{count.toLocaleString(locale)}</b></button>)}</div>
        </div>
        <div className="home-challenge-results-heading"><span>{rows.length.toLocaleString(locale)} {c("challenges").toLocaleLowerCase(locale)}</span><span>{c("complete")}: {counts.complete.toLocaleString(locale)} / {counts.total.toLocaleString(locale)}</span></div>
        <div className="home-challenge-list">{rows.length ? rows.map((row) => {
          const status = row.status;
          const lastTarget = row.levels.at(-1)?.target ?? 1;
          return <details className={`home-challenge-row ${status}`} key={row.challenge.id}>
            <summary>
              <span className="home-challenge-state" aria-hidden="true">{STATUS_ICON[status]}</span>
              <span className="home-challenge-title"><strong>{displayChallengeTitle(language, row.challenge, pokemonNames)}</strong><small>{categoryName(language, row.challenge)}</small></span>
              <span className="home-challenge-fraction">{row.reason && !row.count ? "—" : `${Math.min(row.count, lastTarget).toLocaleString(locale)} / ${lastTarget.toLocaleString(locale)}`}</span>
              <span className="home-challenge-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="home-challenge-row-detail">
              <div className="home-challenge-tier-list">{row.levels.map((level) =>
                <span key={level.target} className={level.status}>{STATUS_ICON[level.status]} {c("levels")} {level.target.toLocaleString(locale)}</span>)}</div>
              {row.reason ? <p className={`home-challenge-explanation ${row.reason}`}>{c(row.reason)}</p> : null}
              {row.requirements.length ? <div><h3>{c("requirements")}</h3><div className="home-challenge-requirements">{row.requirements.map((requirement) => {
                const name = pokemonNames[String(requirement.dex)]?.[language] ?? `#${String(requirement.dex).padStart(4, "0")}`;
                const form = requirement.form === undefined ? null : requirement.form ? formLabel(requirement.dex, requirement.form) ?? requirement.form : c("base");
                return <span className={requirement.status} key={`${requirement.dex}:${requirement.form ?? ""}`}>
                  <i aria-hidden="true">{STATUS_ICON[requirement.status]}</i><b>{name}</b>{form ? <small>{form}</small> : null}
                </span>;
              })}</div></div> : null}
              <p className="home-challenge-source"><b>{c("source")}:</b> {row.challenge.title}
                {row.challenge.requirementText ? <> · {row.challenge.requirementText}</> : null}
                {sourceUrl ? <> · <a href={sourceUrl} target="_blank" rel="noreferrer">Bulbapedia ↗</a></> : null}
              </p>
            </div>
          </details>;
        }) : <p className="home-challenge-empty">{c("empty")}</p>}</div>
      </div>
    </dialog>
  </>;
}
