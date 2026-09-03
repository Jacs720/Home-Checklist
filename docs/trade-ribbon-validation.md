# In-game trade and Partner Ribbon corrections

Checked on 2026-09-02. Unit of validation: an NPC trade or a specific event distribution, never a whole species. Runtime corrections live in `src/trade-ribbon-corrections.ts` so regenerating the source JSON cannot silently undo them. Existing entry IDs are preserved for saved progress and custom boxes.

The former `trades:0191:0522:normal` planning ID is migrated to `trades:0191:0522:shiny` when loading saved completion, favorites, custom boxes, backups, or CSVs. Both refer to the same Cyrano trade; other Blitzle entries are unchanged.

## Shiny availability

- Let's Go: all 10 catalog trades can be normal or shiny; all give Alolan forms. Correct the form/artwork and LGPE origin together with shiny eligibility.
- Sword/Shield: Regina's 10 Isle of Armor trades can be normal or shiny. Exeggutor and Marowak are Alolan; base-game NPC trades remain shiny-locked.
- XD: the five existing records (including two existing Hordel Elekid records) can be normal or shiny. Duplicate-source cleanup is outside this change; no IDs are merged.
- Scarlet/Violet: Cyrano's Blitzle is shiny-only, with OT ID 390518 and Partner Ribbon. The other 29 League Club trades remain normal-only. The three base-game trades do not get Partner Ribbon.
- These are NPC-owned specimens: neither variant can have the player's original trainer. The 24 existing Gen I shiny-eligible trade records are unchanged.

Evidence: [in-game trade tables](https://bulbapedia.bulbagarden.net/wiki/In-game_trade), [League Club trades](https://www.serebii.net/scarletviolet/leagueclubtrades.shtml), and PKHeX's [XD trade template](https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/Legality/Encounters/Templates/Gen3/XD/EncounterTrade3XD.cs) (`Shiny.Random`, no shiny suppression) and [XD encounter records](https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/Legality/Encounters/Data/Gen3/Encounters3XD.cs).

## Partner Ribbon

Normalize exact ribbon requirements from the existing distribution data and the explicit League Club flag. Render the supplied icon in the same badge area as Mightiest/Titan marks, not as an origin mark. Do not confuse Partner Ribbon with the earnable Partner Mark. Generic Living Dex representatives must not inherit distribution ribbons.

The current catalog has 30 League Club trades and 19 event distributions with Partner Ribbon after correction. Eighteen event records already listed it; Hyuma's Flutter Mane (OT ヒュウマ, ID 250621) was missing it. Other Flutter Mane events are checked separately.

Original card verification used [Project Pokémon's EventsGallery](https://github.com/projectpokemon/EventsGallery/tree/master/Released/Gen%209/SV/Wondercards) and [PKHeX's WC9 parser](https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/MysteryGifts/WC9.cs) / [ribbon indexes](https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/Ribbons/RibbonIndex.cs). WC9 records are 712 bytes; ribbon indexes occupy the 32 bytes starting at 0x248, with 0xFF meaning unused. Partner Ribbon is index 110.

- `0067 SV - ヒュウマ Flutter Mane.wc9`: indexes 33 and 110 (Battle Champion and Partner).
- `1534 SV - YOASOBI Pawmot.wc9`: index 26 only (Classic). OT ID 231118. **YOASOBI Pawmot does not carry Partner Ribbon.** This also agrees with [Serebii's Pawmot event records](https://www.serebii.net/events/dex/923.shtml).
- A cross-check of the current [PKHeX WC9 database](https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/Resources/legality/mgdb/wc9.pkl) found 19 cards with index 110, consistent with the corrected event records. This is a check of the available catalog, not a promise of automatic coverage of future distributions.

Localized ribbon names follow the [in-game language table](https://bulbapedia.bulbagarden.net/wiki/List_of_Ribbons_in_the_games/In_other_languages). The icon is the unmodified image supplied by the user.

## Regression checks

Tests cover the positive and negative cases above, normal versus shiny-only planning, unchanged IDs and inputs, idempotent corrections, localized accessible badges, database cards, and detailed availability text. No network access is needed to run these tests.
