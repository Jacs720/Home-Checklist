export type GoRelease = "released" | "unreleased" | "unknown";
export type GoMethod = "wild" | "raid" | "egg" | "research" | "go_pass" | "battle_league" | "snapshot" | "routes" | "max_battle" | "evolution" | "form_change" | "fusion";
export type GoFact = { release: GoRelease; shiny: GoRelease; releaseDate?: string; shinyDate?: string; methods: GoMethod[] };
export type GoSpeciesFact = GoFact & { name: string; sourceUrl: string; revisionId: number; revisionAt: string; forms: Array<GoFact & { label: string }> };

const clean = (text: string) => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const tokens = (text: string) => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/fall/g, "autumn").replace(/striped?/g, "stripe").replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(word => word && !["form", "forme", "mode", "style", "breed", "plumage", "pattern", "cloak", "size", "trim"].includes(word));

/** Match the HOME form to its own GO release record; never inherit another form's release. */
export function matchGoForm(dex: number, form: string | null | undefined, species: GoSpeciesFact): GoFact & { sourceForm: string; transfer: "allowed" | "blocked" | "unreleased" | "unknown" } {
  const normalizedForm = clean(form ?? "");
  const aliases: Record<string, string> = { "01": "10%", "05": "50%", "redstripe": "Red-Striped", "bluestripe": "Blue-Striped", "whitestripe": "White-Striped" };
  const defaultForms: Record<number, string> = { 487: "Altered", 492: "Land", 648: "Aria", 718: "50%", 720: "Confined", 888: "Hero of Many Battles", 889: "Hero of Many Battles" };
  const defaultForm = !form || ["normal", "original"].includes(normalizedForm) ? defaultForms[dex] : undefined;
  const formWords = tokens(defaultForm ?? aliases[normalizedForm] ?? form ?? "");
  const isBase = !form || ["original", "normal", "basic", "standard", "confined", "ordinary"].includes(normalizedForm);
  let fact: GoFact | undefined;
  let sourceForm = species.name;
  if (species.forms.length) {
    const matching = species.forms.filter(record => formWords.length && formWords.every(word => tokens(record.label).includes(word)));
    const exact = matching.sort((a, b) => tokens(a.label).length - tokens(b.label).length)[0];
    const primary = species.forms.find(record => clean(record.label) === clean(species.name));
    const sharedPrimary = (dex === 849 && ["amped", "lowkey"].includes(normalizedForm)) || (dex === 892 && ["singlestrike", "rapidstrike"].includes(normalizedForm));
    const fallback = isBase ? primary ?? species.forms.find(record => /^(?:normal|ordinary|confined)\b/i.test(record.label))
      : sharedPrimary ? primary : undefined;
    const selected = exact ?? fallback;
    if (selected) { fact = selected; sourceForm = selected.label; }
  } else { fact = species; }
  fact ??= { release: "unknown", shiny: "unknown", methods: [] };
  if (dex === 666 && ["fancy", "pokeball"].includes(normalizedForm)) fact = { release: "unreleased", shiny: "unreleased", methods: [] };
  // Bloodmoon is a separate core-series form, not the Ursaluna evolution released in GO.
  if (dex === 901 && normalizedForm === "bloodmoon") fact = { release: "unreleased", shiny: "unreleased", methods: [] };
  if (dex === 670 && fact.release === "released") {
    fact = { ...fact, methods: ["evolution", ...(normalizedForm === "whiteflower" ? ["research" as const] : []), ...(normalizedForm === "orangeflower" ? ["go_pass" as const] : [])] };
  }
  if (dex === 676 && form && fact.release === "released") {
    fact = { ...fact, methods: ["form_change"], ...(normalizedForm === "heart" ? { releaseDate: "2022-02-10", shinyDate: "2023-02-08" } : {}) };
  }
  if ((dex === 646 && ["black", "white"].includes(normalizedForm)) || (dex === 800 && ["duskmane", "dawnwings"].includes(normalizedForm))) {
    if (fact.release === "released") fact = { ...fact, methods: ["fusion"] };
  }
  if ([888, 889].includes(dex) && normalizedForm.startsWith("crowned") && fact.release === "released") fact = { ...fact, methods: ["form_change"] };
  const blocked = [327, 718, 720, 890].includes(dex)
    || (dex === 646 && ["black", "white"].includes(normalizedForm))
    || (dex === 800 && ["duskmane", "dawnwings"].includes(normalizedForm))
    || ([888, 889].includes(dex) && normalizedForm.startsWith("crowned"));
  return { ...fact, sourceForm, transfer: fact.release === "unreleased" ? "unreleased" : fact.release === "unknown" ? "unknown" : blocked ? "blocked" : "allowed" };
}
