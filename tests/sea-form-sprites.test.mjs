import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { seaFormSpriteKey } from "../src/sprite-forms.ts";

test("Shellos and Gastrodon use distinct sea-form sprites in normal and shiny collections", async () => {
  for (const dex of [422, 423]) {
    assert.equal(seaFormSpriteKey({ dex, form: "West Sea" }), `0${dex}-west`);
    assert.equal(seaFormSpriteKey({ dex, form: "East Sea" }), `0${dex}-east`);
    for (const variant of ["normal", "shiny"]) {
      const west = await readFile(`public/assets/pokemon/${variant}/0${dex}-west.webp`);
      const east = await readFile(`public/assets/pokemon/${variant}/0${dex}-east.webp`);
      assert.equal(west.toString("ascii", 8, 12), "WEBP");
      assert.equal(east.toString("ascii", 8, 12), "WEBP");
      assert.notDeepEqual(west, east);
    }
    assert.notDeepEqual(
      await readFile(`public/assets/pokemon/normal/0${dex}-east.webp`),
      await readFile(`public/assets/pokemon/shiny/0${dex}-east.webp`),
    );
  }
  assert.equal(seaFormSpriteKey({ dex: 422, form: null }), null);
  assert.equal(seaFormSpriteKey({ dex: 25, form: "East Sea" }), null);
});

