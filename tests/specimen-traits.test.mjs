import assert from "node:assert/strict";
import test from "node:test";
import { applySpecimenTraits, createTraitAvailability, DEFAULT_TRAIT_OPTIONS, parseTraitOptions, parseTraitOverrides, traitEligible } from "../src/specimen-traits.ts";
import { copy } from "../src/translations.ts";

test("alpha requirements respect Legends origins, gifts and impossible species/forms", () => {
  const pikachu = { dex: 25, form: null, mark: "LA" };
  assert.equal(traitEligible(pikachu, "alpha"), true);
  assert.equal(traitEligible({ ...pikachu, mark: "LZA" }, "alpha"), true);
  assert.equal(traitEligible({ ...pikachu, mark: "SwSh" }, "alpha"), false);
  for (const dex of [150, 151, 483, 489, 491, 493, 720, 809, 892, 905, 1025])
    assert.equal(traitEligible({ ...pikachu, dex }, "alpha"), false, String(dex));
  for (const dex of [37, 38])
    assert.equal(traitEligible({ ...pikachu, dex, form: "Alolan" }, "alpha"), false);
  assert.equal(traitEligible({ ...pikachu, dex: 670, form: "Eternal Flower", mark: "LZA" }, "alpha"), false);
  assert.equal(traitEligible({ ...pikachu, collection: "event-dex" }, "alpha"), false);
});

test("Gigantamax supports every listed species and all compatible forms, not regional Meowth or cap Pikachu", () => {
  const entry = { dex: 6, form: null, mark: "SwSh", variant: "normal" };
  for (const dex of [3,6,9,12,25,52,68,94,99,131,133,143,569,812,815,818,823,826,834,839,841,842,844,849,851,858,861,869,879,884,892])
    assert.equal(traitEligible({ ...entry, dex }, "gmaxFactor"), true, String(dex));
  for (const form of ["Low Key", "Amped"]) assert.equal(traitEligible({ ...entry, dex: 849, form }, "gmaxFactor"), true);
  for (const form of ["Single Strike", "Rapid Strike"]) assert.equal(traitEligible({ ...entry, dex: 892, form }, "gmaxFactor"), true);
  assert.equal(traitEligible({ ...entry, dex: 869, form: "Rainbow Swirl, Ribbon Sweet" }, "gmaxFactor"), true);
  for (const form of ["Alolan", "Galarian"]) assert.equal(traitEligible({ ...entry, dex: 52, form }, "gmaxFactor"), false);
  assert.equal(traitEligible({ ...entry, dex: 25, form: "World Cap" }, "gmaxFactor"), false);
  assert.equal(traitEligible({ ...entry, dex: 25, trainerId: "201023" }, "gmaxFactor"), false);
  assert.equal(traitEligible({ ...entry, mark: "SV" }, "gmaxFactor"), false);
  assert.equal(traitEligible({ ...entry, dex: 26 }, "gmaxFactor"), false);
});

test("Gigantamax handles unevolved factor carriers and the special non-shiny HOME Melmetal", () => {
  for (const dex of [1,2,4,5,7,8]) {
    assert.equal(traitEligible({ dex, form: null, mark: "SwSh", variant: "normal" }, "gmaxFactor"), true);
    assert.equal(traitEligible({ dex, form: null, mark: "SwSh", variant: "shiny" }, "gmaxFactor"), false);
  }
  for (const dex of [857,868]) assert.equal(traitEligible({ dex, form: null, mark: "SwSh", variant: "shiny" }, "gmaxFactor"), true);
  const melmetal = { dex: 809, form: null, collection: "event-dex", trainerName: "HOME", requirements: { originGame: "HOME" } };
  assert.equal(traitEligible(melmetal, "gmaxFactor"), true);
  assert.equal(traitEligible({ ...melmetal, variant: "shiny" }, "gmaxFactor"), false);
  assert.equal(traitEligible({ dex: 809, form: null, collection: "go" }, "gmaxFactor"), false);
});

test("global preferences and individual exceptions keep stable identities and other requirements", () => {
  const source = { planId: "LA:pikachu:normal", dex: 25, form: null, mark: "LA", requirements: { gender: "female" } };
  const options = { alpha: true, gmaxFactor: true };
  const selected = applySpecimenTraits(source, options, {});
  assert.equal(selected.requirements.alpha, true);
  assert.equal(selected.requirements.gmaxFactor, undefined);
  assert.equal(selected.planId, source.planId);
  assert.equal(selected.requirements.gender, "female");
  assert.deepEqual(source.requirements, { gender: "female" });
  assert.equal(applySpecimenTraits(source, options, { [source.planId]: { alpha: false } }).requirements.alpha, false);
  assert.equal(applySpecimenTraits(source, DEFAULT_TRAIT_OPTIONS, { [source.planId]: { alpha: true } }).requirements.alpha, true);
  assert.equal(applySpecimenTraits(source, DEFAULT_TRAIT_OPTIONS, {}).requirements.alpha, false);
  const shiny = { ...source, variant: "shiny", planId: "LA:pikachu:shiny" };
  assert.equal(applySpecimenTraits(shiny, options, { [source.planId]: { alpha: false } }).requirements.alpha, true);
});

test("origin-independent specimens resolve trait support from the actual catalog", () => {
  const availability = createTraitAvailability([
    { dex: 25, form: null, mark: "LA", shinyEligible: true },
    { dex: 6, form: "Original", mark: "SwSh", shinyEligible: true },
    { dex: 37, form: "Alolan", mark: "LA", shinyEligible: true },
  ]);
  const generic = { planId: "generic:25", dex: 25, form: null, genericEntry: true };
  assert.equal(traitEligible(generic, "alpha", availability), true);
  assert.equal(traitEligible({ ...generic, dex: 6 }, "gmaxFactor", availability), true);
  assert.equal(traitEligible({ ...generic, dex: 37, form: "Alolan" }, "alpha", availability), false);
  assert.equal(traitEligible({ ...generic, requirements: { originGeneration: 1 } }, "alpha", availability), false);
  assert.equal(applySpecimenTraits(generic, { alpha: true, gmaxFactor: true }, {}, availability).requirements.alpha, true);
});

test("trait settings survive backup round trips and reject malformed values", () => {
  const settings = { traitOptions: { alpha: true, gmaxFactor: false }, traitOverrides: { "LA:pikachu:normal": { alpha: false }, "SwSh:charizard:shiny": { gmaxFactor: true } } };
  const restored = JSON.parse(JSON.stringify(settings));
  assert.deepEqual(parseTraitOptions(restored.traitOptions), settings.traitOptions);
  assert.deepEqual(parseTraitOverrides(restored.traitOverrides), settings.traitOverrides);
  assert.deepEqual(parseTraitOptions(undefined), DEFAULT_TRAIT_OPTIONS);
  assert.deepEqual(parseTraitOptions({ alpha: "true", gmaxFactor: 1 }), DEFAULT_TRAIT_OPTIONS);
  assert.deepEqual(parseTraitOverrides({ a: null, b: { alpha: "false", other: true }, c: { alpha: false, gmaxFactor: true }, d: [] }), { c: { alpha: false, gmaxFactor: true } });
});

test("both trait titles are explicitly localized in all ten languages", () => {
  const labels = {
    "ES-LA": ["Pokémon alfa", "Factor Gigamax"], "ES-ES": ["Pokémon alfa", "Factor Gigamax"],
    ENG: ["Alpha Pokémon", "Gigantamax Factor"], DEU: ["Elite-Pokémon", "Gigadynamax-Faktor"],
    FRA: ["Pokémon Baron", "Gène Gigamax"], ITA: ["Pokémon alfa", "Fattore Gigamax"],
    JPN: ["オヤブン", "キョダイマックスの素質"], KOR: ["우두머리 포켓몬", "거다이맥스인자"],
    CHS: ["头目宝可梦", "超极巨化因子"], CHT: ["頭目寶可夢", "超極巨化因子"],
  };
  for (const [language, [alpha, gmax]] of Object.entries(labels)) {
    assert.equal(copy(language, "alpha"), alpha);
    assert.equal(copy(language, "gmax_factor"), gmax);
  }
});

