import { GooeyCheckbox, StyledSelect } from "./ui-controls";
import type { PokedexOrder } from "../pokedex-organization";

type Props = { order: PokedexOrder; onlyInGameDex: boolean; disabled?: boolean; onOrderChange: (order: PokedexOrder) => void; onOnlyInGameDexChange: (only: boolean) => void; t: (key: string) => string };

export function PokedexOrganizationControls({ order, onlyInGameDex, disabled = false, onOrderChange, onOnlyInGameDexChange, t }: Props) {
  return <section className="filter-section pokedex-organization">
    <fieldset disabled={disabled}>
      <legend className="panel-label">{t("pokedex_organization")}</legend>
      <StyledSelect value={order} options={[{ value: "national", label: t("pokedex_order_national") }, { value: "ingame", label: t("pokedex_order_ingame") }]} onChange={onOrderChange} ariaLabel={t("pokedex_order")} />
      <label className="switch-row" htmlFor="only-in-game-dex"><span><b>{t("pokedex_only")}</b></span><GooeyCheckbox id="only-in-game-dex" checked={onlyInGameDex} onChange={(event) => onOnlyInGameDexChange(event.target.checked)} /></label>
    </fieldset>
    <p className="pokedex-organization-hint">{t(disabled ? "pokedex_requires_origin" : "pokedex_organization_hint")}</p>
  </section>;
}
