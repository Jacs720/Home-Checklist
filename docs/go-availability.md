# Pokémon GO availability

The GO collection retains its stable 1–1025 planning slots, HOME forms, gender variants and normal/Shiny plan IDs. A planning slot is not evidence that the specimen has been released in GO.

`public/data/go-availability.json` records release dates, separate Shiny release dates, historical encounter categories and the source URL/revision for all 1,025 species. The source is each species' **Availability** section in [Pokémon GO Wiki](https://pokemongo.fandom.com/wiki/List_of_Pokémon). The snapshot is checked as of 2026-10-28. Future announced releases remain unreleased until their release date.

Update from the shared project directory:

```sh
npm run go-availability:sync -- --as-of 2026-10-28
```

Without `--cache-dir`, the command fetches fresh source pages. To reproduce an existing download offline, provide `--cache-dir artifacts/go-availability-cache`. Validation must complete before the previous snapshot is replaced.

`scripts/go-availability-parser.mjs` reads the release templates and availability tables without treating image assets or game-master definitions as released content. `src/go-form-match.ts` maps each HOME form to the corresponding record, including shared groups and differently named base forms. Distinct regional or named forms do not inherit another form's release by default. Missing evidence is displayed as unconfirmed, never as available.

Form-specific rules preserve distinctions documented in the source: the unreleased Fancy/Poké Ball Vivillon patterns; ordinary flower Floette versus Eternal Flower; Floette's color-specific research/GO Pass routes; Furfrou trim changes; fusion and Crowned-form acquisition. Bloodmoon Ursaluna is separately classified as unreleased, corroborated by [its form listing](https://dexjourney.com/pokemon/901-ursaluna.html); it does not inherit ordinary Ursaluna's evolution release.

Methods describe recorded ways of obtaining the form, including past events, rather than a live raid/research calendar. Every details panel explains this and displays the snapshot date. Normal release and Shiny release are independent. Selecting a future Shiny planning slot does not make its Shiny available; unreleased variants have no advertised acquisition method.

GO details also distinguish unavailable or blocked HOME transfers. The transfer exceptions are based on the species/form pages and the [official transfer restrictions](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2787-sending-pokemon-to-pokemon-home/). A released GO form need not be transferable to HOME. Unreleased or blocked GO specimens are excluded from HOME acquisition recommendations while remaining visible in planning.

The source wiki uses CC BY-SA. Per-species links and revision IDs are retained in the snapshot, and the details panel links to the source page. Tests cover every generated GO form, future dates, independent Shiny states, encounter categories, all supported interface languages, planning identities and the Eternal Flower Floette details regression.
