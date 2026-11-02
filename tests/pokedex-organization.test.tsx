import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_POKEDEX_ORGANIZATION, filterOriginPokedex, inGameDexReference, organizeOriginPokedex, parsePokedexOrganization, sortOriginPokedex } from "../src/pokedex-organization";
import { PokedexOrganizationControls } from "../src/components/PokedexOrganizationControls";
import { validateBackup, validateCollectionState } from "../src/backup-validation";
import { LANGUAGE_OPTIONS, copy } from "../src/translations";
import { POKEDEX_COPY_KEYS, pokedexCopy } from "../src/pokedex-translations";

test("game Dex references retain local numbering, including Meltan, Victini zero and DLC priority", () => {
  for (const [mark, species] of [["LGPE", 1], ["SwSh", 810], ["BDSP", 387], ["LA", 722], ["SV", 906], ["P", 650], ["USUM", 722], ["LZA", 152], ["GBA", 252]] as const) assert.equal(inGameDexReference(mark, species)?.number, 1, mark);
  assert.equal(inGameDexReference("LGPE", 808)?.number, 152);
  assert.equal(inGameDexReference("LGPE", 809)?.number, 153);
  assert.equal(inGameDexReference("Sin marca", 494)?.number, 0);
  assert.equal(inGameDexReference("SwSh", 1)?.id, "isle-of-armor");
  assert.equal(inGameDexReference("SV", 906)?.id, "paldea");
  assert.equal(inGameDexReference("SwSh", 151), undefined);
  assert.equal(inGameDexReference("BDSP", 490)?.number, 151);
  assert.deepEqual(inGameDexReference("BDSP", 491), { id: "national", number: 491, section: 1 });
  assert.equal(inGameDexReference("BDSP", 979), undefined);
});

test("the sorting function retains outside entries and only the independent filter removes them", () => {
  for (const [mark, dexes] of [["BDSP", [490, 491, 979]], ["LGPE", [808, 809, 979]]] as const) {
    const entries = dexes.map(dex => ({ dex, id: `${mark}:${dex}` }));
    const original = structuredClone(entries);
    for (const order of ["national", "ingame"] as const) {
      const sorted = sortOriginPokedex(entries, mark, order).flatMap(section => section.entries);
      assert.deepEqual(new Set(sorted.map(entry => entry.id)), new Set(entries.map(entry => entry.id)));
      const filtered = filterOriginPokedex(sorted, mark, true);
      assert.deepEqual(new Set(filtered.map(entry => entry.dex)), new Set(dexes.filter(dex => dex !== 979)));
      assert.strictEqual(filterOriginPokedex(sorted, mark, false), sorted);
      assert.deepEqual(organizeOriginPokedex(entries, mark, { order, onlyInGameDex: true }).flatMap(section => section.entries), filtered);
    }
    assert.deepEqual(entries, original);
  }
});

test("game National Pokédex coverage stops at that game's generation, including registerable Mythicals", () => {
  for (const [mark, limit] of [["GBA", 386], ["Sin marca", 649], ["P", 721], ["BDSP", 493]] as const) {
    for (let dex = 1; dex <= limit; dex++) assert.ok(inGameDexReference(mark, dex), `${mark} #${dex}`);
    assert.equal(inGameDexReference(mark, limit + 1), undefined);
    assert.equal(inGameDexReference(mark, 979), undefined);
  }
});

test("organizing by game preserves sibling form order, source arrays and national fallback", () => {
  const entries = [{ dex: 1, id: "bulba-normal" }, { dex: 1, id: "bulba-shiny" }, { dex: 151, id: "mew" }, { dex: 810, id: "grookey" }];
  const snapshot = structuredClone(entries);
  const game = organizeOriginPokedex(entries, "SwSh", { order: "ingame", onlyInGameDex: false });
  assert.deepEqual(game[0].entries.map(entry => entry.id), ["grookey", "bulba-normal", "bulba-shiny"]);
  assert.deepEqual(game[1].entries.map(entry => entry.id), ["mew"]);
  assert.equal(game[1].outside, true);
  assert.deepEqual(entries, snapshot);
  assert.strictEqual(organizeOriginPokedex(entries, "SwSh", DEFAULT_POKEDEX_ORGANIZATION)[0].entries, entries);
  assert.strictEqual(organizeOriginPokedex(entries, "go", { order: "ingame", onlyInGameDex: true })[0].entries, entries);
});

test("Pokédex preferences round-trip backups and old backups retain original defaults", () => {
  for (const pokedexOrder of ["national", "ingame"]) for (const onlyInGameDex of [false, true]) {
    const state = { owned: ["SwSh:bulbasaur:normal"], favorites: ["SwSh:bulbasaur:normal"], pokedexOrder, onlyInGameDex };
    const restored = validateBackup(JSON.parse(JSON.stringify({ type: "home-checklist-backup", progress: { owned: state.owned, favorites: state.favorites }, configuration: { pokedexOrder, onlyInGameDex } }))).state;
    assert.deepEqual(parsePokedexOrganization(restored), { order: pokedexOrder, onlyInGameDex });
    assert.deepEqual(restored.owned, state.owned);
    assert.deepEqual(restored.favorites, state.favorites);
  }
  assert.deepEqual(parsePokedexOrganization(validateCollectionState({ owned: [] })), DEFAULT_POKEDEX_ORGANIZATION);
  assert.throws(() => validateCollectionState({ owned: [], pokedexOrder: "invalid" }));
  assert.throws(() => validateCollectionState({ owned: [], onlyInGameDex: "true" }));
});

test("Pokédex controls expose only order and membership, retain independent selections and localize all languages", () => {
  for (const { code } of LANGUAGE_OPTIONS) {
    const t = (key: string) => copy(code, key);
    for (const key of POKEDEX_COPY_KEYS) assert.ok(pokedexCopy(code, key), `${code} ${key}`);
    for (const order of ["national", "ingame"] as const) for (const onlyInGameDex of [false, true]) {
      const html = renderToStaticMarkup(createElement(PokedexOrganizationControls, { order, onlyInGameDex, t, onOrderChange() {}, onOnlyInGameDexChange() {} }));
      assert.equal((html.match(/type="checkbox"/g) ?? []).length, 1);
      assert.equal((html.match(/aria-haspopup="listbox"/g) ?? []).length, 1);
      assert.ok(html.includes(t(`pokedex_order_${order}`)));
      assert.ok(html.includes(t("pokedex_only")));
      assert.equal(/checked=""/.test(html), onlyInGameDex);
    }
    const disabled = renderToStaticMarkup(createElement(PokedexOrganizationControls, { order: "ingame", onlyInGameDex: true, disabled: true, t, onOrderChange() {}, onOnlyInGameDexChange() {} }));
    assert.match(disabled, /<fieldset disabled=""/);
    assert.ok(disabled.includes(t("pokedex_requires_origin")));
  }
});
