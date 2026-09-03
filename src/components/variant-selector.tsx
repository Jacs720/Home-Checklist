type Variant = "shiny" | "normal";

type VariantSelectorProps = {
  variants: Record<Variant, boolean>;
  onToggle: (variant: Variant) => void;
  t: (key: string) => string;
  shinyIconUrl: string;
};

export function VariantSelector({ variants, onToggle, t, shinyIconUrl }: VariantSelectorProps) {
  return (
    <div className={`variant-options${variants.shiny && variants.normal ? " joined" : ""}`} role="group" aria-label={t("variants")}>
      <button
        id="variant-shiny"
        type="button"
        className={`variant-option variant-option-shiny${variants.shiny ? " active" : ""}`}
        aria-label={t("variant_shiny")}
        title={t("variant_shiny")}
        aria-pressed={variants.shiny}
        onClick={() => onToggle("shiny")}
      >
        <img className="shiny-symbol" src={shinyIconUrl} alt="" />
      </button>
      <button
        id="variant-normal"
        type="button"
        className={`variant-option variant-option-normal${variants.normal ? " active" : ""}`}
        aria-label={t("non_shiny")}
        title={t("non_shiny")}
        aria-pressed={variants.normal}
        onClick={() => onToggle("normal")}
      >
        {t("non_shiny")}
      </button>
    </div>
  );
}
